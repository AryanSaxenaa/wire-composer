import { Pipeline, PipelineRunOptions, PipelineExecutorEvent } from "@/types";
import { topologicalSort, hasCycle } from "@/lib/topological-sort";
import { resolveInputsWithAmbiguity } from "@/lib/resolve-inputs";
import { runWireAction } from "@/lib/wire-client";
import { getActionById, registerAnakinActions } from "@/lib/action-registry";
import { loadAnakinActions } from "@/lib/anakin-catalog";
import { isBuiltinAction, runBuiltinAction, findClosestActionId } from "@/lib/builtin-actions";
import {
  getServerCredentialsForNode,
  hasUsableWireCredential,
} from "@/lib/server-credentials";
import { isUnsetInput } from "@/lib/input-utils";
import { validatePipelineBeforeRun } from "@/lib/pipeline-validation";

export type ExecutorEmit = (
  event: PipelineExecutorEvent,
  data: Record<string, unknown>
) => void;

function shouldSkipForGate(
  merged: Record<string, unknown>,
  config: Record<string, string>
): boolean {
  const gateField = config.gateField;
  if (!gateField) return false;
  const expected = config.gateValue ?? "true";
  const actual = merged[gateField];
  if (typeof actual === "boolean") return actual !== (expected === "true");
  return String(actual) !== String(expected);
}

function stripGateKeys(
  merged: Record<string, unknown>,
  config: Record<string, string>
): Record<string, unknown> {
  const out = { ...merged };
  delete out.gateField;
  delete out.gateValue;
  delete out.triggerData;
  if (config.gateField) delete out[config.gateField];
  return out;
}

export async function executePipeline(
  options: PipelineRunOptions,
  emit: ExecutorEmit
): Promise<{ success: boolean; nodeOutputs: Record<string, Record<string, unknown>> }> {
  const {
    pipeline,
    credentials = {},
    triggerData,
    startFromNodeId,
    initialNodeOutputs = {},
    mappingOverrides,
  } = options;

  const startTime = Date.now();
  const runId = crypto.randomUUID();

  const anakinActions = await loadAnakinActions();
  registerAnakinActions(anakinActions);

  const preflightError = validatePipelineBeforeRun(pipeline, startFromNodeId);
  if (preflightError) {
    emit("pipeline_failed", { runId, error: preflightError });
    return { success: false, nodeOutputs: initialNodeOutputs };
  }

  if (hasCycle(pipeline.nodes, pipeline.edges)) {
    emit("pipeline_failed", {
      runId,
      error: "Pipeline has a cycle — remove circular connections before running",
    });
    return { success: false, nodeOutputs: initialNodeOutputs };
  }

  const sorted = topologicalSort(pipeline.nodes, pipeline.edges);
  const nodeOutputs: Record<string, Record<string, unknown>> = { ...initialNodeOutputs };

  let started = !startFromNodeId;
  let ranAnyStep = false;

  for (const node of sorted) {
    if (!started) {
      if (node.id === startFromNodeId) started = true;
      else continue;
    }

    if (node.type === "trigger" || node.actionId === "wire.trigger.webhook") {
      const triggerOut = triggerData ?? {};
      nodeOutputs[node.id] = triggerOut;
      emit("node_complete", { nodeId: node.id, output: triggerOut, skipped: false });
      continue;
    }

    const action = getActionById(node.actionId);

    if (!action && !isBuiltinAction(node.actionId)) {
      const closest = findClosestActionId(node.actionId);
      emit("node_error", {
        nodeId: node.id,
        error: `Unknown action "${node.actionId}"`,
        closestActionId: closest,
        isUnknownAction: true,
      });
      emit("pipeline_failed", {
        runId,
        failedNodeId: node.id,
        error: `Unknown action: ${node.actionId}`,
      });
      return { success: false, nodeOutputs };
    }

    const resolved = resolveInputsWithAmbiguity(
      node,
      pipeline.edges,
      nodeOutputs,
      pipeline.nodes,
      mappingOverrides
    );

    if (!resolved.ok) {
      emit("waiting_for_input", {
        nodeId: resolved.ambiguous.nodeId,
        question: `Which upstream field should map to "${resolved.ambiguous.targetField}"?`,
        options: resolved.ambiguous.options,
        ambiguous: resolved.ambiguous,
      });
      emit("pipeline_paused", {
        runId,
        reason: "ambiguous_mapping",
        nodeId: resolved.ambiguous.nodeId,
      });
      return { success: false, nodeOutputs };
    }

    const mergedInputs: Record<string, unknown> = {
      ...node.config,
      ...resolved.inputs,
      ...(triggerData ? { triggerData } : {}),
    };

    if (isBuiltinAction(node.actionId)) {
      const required = action?.inputFields.filter((f) => f.required) ?? [];
      const missing = required.filter((f) => isUnsetInput(mergedInputs[f.key]));
      if (missing.length > 0 && node.actionId !== "wire.condition.compare") {
        emit("node_error", {
          nodeId: node.id,
          error: `Missing required inputs: ${missing.map((f) => f.key).join(", ")}`,
        });
        emit("pipeline_failed", { runId, failedNodeId: node.id, error: "Missing inputs" });
        return { success: false, nodeOutputs };
      }
    } else if (action) {
      const missing = action.inputFields
        .filter((f) => f.required)
        .filter((f) => isUnsetInput(mergedInputs[f.key]));
      if (missing.length > 0) {
        emit("node_error", {
          nodeId: node.id,
          error: `Missing required inputs: ${missing.map((f) => f.key).join(", ")}`,
        });
        emit("pipeline_failed", { runId, failedNodeId: node.id, error: "Missing inputs" });
        return { success: false, nodeOutputs };
      }
    }

    if (shouldSkipForGate(mergedInputs, node.config)) {
      const skipped = { skipped: true, reason: "gate_not_passed" };
      nodeOutputs[node.id] = skipped;
      emit("node_skipped", { nodeId: node.id, output: skipped });
      continue;
    }

    emit("node_start", { nodeId: node.id, actionId: node.actionId });
    const nodeStartTime = Date.now();
    ranAnyStep = true;

    const nodeCreds =
      credentials[node.id] ??
      getServerCredentialsForNode(node.id, node.platform, node.credentials);

    let attemptCount = 0;
    const maxAttempts = 2;
    let lastError: unknown = null;

    while (attemptCount < maxAttempts) {
      attemptCount++;
      try {
        const wireInputs = stripGateKeys(mergedInputs, node.config);
        let output: Record<string, unknown>;

        if (isBuiltinAction(node.actionId)) {
          output = await runBuiltinAction(node.actionId, wireInputs);
        } else {
          if (action?.authMode === "required" && !hasUsableWireCredential(nodeCreds)) {
            throw new Error(
              "Unauthorized: This action requires an Anakin identity credential_id. Add it in the node inspector or set WIRE_CRED_*_CREDENTIAL_ID in the server environment."
            );
          }
          const result = await runWireAction(node.actionId, wireInputs, nodeCreds);
          output = result.output;
        }

        nodeOutputs[node.id] = output;
        emit("node_complete", {
          nodeId: node.id,
          output,
          durationMs: Date.now() - nodeStartTime,
        });
        lastError = null;
        break;
      } catch (err: unknown) {
        lastError = err;
        const message = err instanceof Error ? err.message : "Unknown error";
        const is401 = message.includes("401") || message.includes("Unauthorized");
        const is429 = message.includes("429") || message.includes("Rate limit");
        const is402 = message.includes("Insufficient credits");
        const isTimeout = message.includes("timed out") || message.includes("Timeout");

        if (is429 && attemptCount < maxAttempts) {
          emit("rate_limit_wait", { nodeId: node.id, secondsRemaining: 30 });
          emit("pipeline_paused", {
            runId,
            reason: "rate_limit",
            nodeId: node.id,
            retryAfterSeconds: 30,
            resumable: true,
          });
          return { success: false, nodeOutputs };
        }

        emit("node_error", {
          nodeId: node.id,
          error: message,
          is401,
          is402,
          is429,
          isTimeout,
          retryable: is401 || isTimeout,
        });
        emit("pipeline_failed", {
          runId,
          failedNodeId: node.id,
          error: message,
          resumable: is401 && !isTimeout,
        });
        break;
      }
    }

    if (lastError) return { success: false, nodeOutputs };
  }

  if (startFromNodeId && !started) {
    emit("pipeline_failed", {
      runId,
      error: `Cannot resume: step "${startFromNodeId}" was not found in pipeline`,
    });
    return { success: false, nodeOutputs };
  }

  if (!ranAnyStep && !startFromNodeId) {
    emit("pipeline_failed", {
      runId,
      error: "Pipeline did not run any steps",
    });
    return { success: false, nodeOutputs };
  }

  emit("pipeline_complete", { runId, duration: Date.now() - startTime });
  return { success: true, nodeOutputs };
}
