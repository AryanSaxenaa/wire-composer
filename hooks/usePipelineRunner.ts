"use client";

import { useCallback, useState } from "react";
import { useComposerStore } from "@/lib/store";
import { getActionById } from "@/lib/action-registry";
import { isBuiltinAction } from "@/lib/builtin-actions";
import { useCredentials } from "@/lib/credentials-context";
import { AmbiguousMappingState } from "@/types";

interface RunResult {
  success: boolean;
  cancelled: boolean;
}

interface RunOptions {
  startFromNodeId?: string;
  initialNodeOutputs?: Record<string, Record<string, unknown>>;
}

export function usePipelineRunner() {
  const pipeline = useComposerStore((s) => s.pipeline);
  const runStatus = useComposerStore((s) => s.runStatus);
  const mappingOverrides = useComposerStore((s) => s.mappingOverrides);
  const pausedNodeOutputs = useComposerStore((s) => s.pausedNodeOutputs);
  const pausedFromNodeId = useComposerStore((s) => s.pausedFromNodeId);
  const setRunStatus = useComposerStore((s) => s.setRunStatus);
  const updateNode = useComposerStore((s) => s.updateNode);
  const setSelectedNodeId = useComposerStore((s) => s.setSelectedNodeId);
  const setInspectorOpen = useComposerStore((s) => s.setInspectorOpen);
  const setPipeline = useComposerStore((s) => s.setPipeline);
  const resetRun = useComposerStore((s) => s.resetRun);
  const addToast = useComposerStore((s) => s.addToast);
  const setRunPaused = useComposerStore((s) => s.setRunPaused);
  const setAmbiguousMapping = useComposerStore((s) => s.setAmbiguousMapping);
  const setRateLimitSeconds = useComposerStore((s) => s.setRateLimitSeconds);
  const { getAllCredentials } = useCredentials();
  const [missingCredentials, setMissingCredentials] = useState<string[]>([]);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const validateCredentials = useCallback((): string[] => {
    if (!pipeline) return [];
    const allCreds = getAllCredentials();
    const missing: string[] = [];
    pipeline.nodes.forEach((n) => {
      const action = getActionById(n.actionId);
      if (action?.requiresAuth && !isBuiltinAction(n.actionId) && !allCreds[n.id]) {
        missing.push(n.id);
      }
    });
    return missing;
  }, [pipeline, getAllCredentials]);

  const processEvent = useCallback(
    (currentEvent: string, eventData: Record<string, unknown>) => {
      switch (currentEvent) {
        case "node_start": {
          const nodeId = eventData.nodeId as string;
          updateNode(nodeId, { status: "running", error: undefined });
          const ctx = useComposerStore.getState().runContext;
          if (ctx) {
            useComposerStore.getState().setRunContext({ ...ctx, currentNodeId: nodeId });
          }
          const p = useComposerStore.getState().pipeline;
          p?.edges
            .filter((e) => e.target === nodeId || e.source === nodeId)
            .forEach((e) => useComposerStore.getState().updateEdge(e.id, { animated: true }));
          break;
        }
        case "node_complete": {
          const nodeId = eventData.nodeId as string;
          updateNode(nodeId, {
            status: "success",
            output: eventData.output as Record<string, unknown>,
          });
          const p = useComposerStore.getState().pipeline;
          p?.edges
            .filter((e) => e.source === nodeId || e.target === nodeId)
            .forEach((e) => useComposerStore.getState().updateEdge(e.id, { animated: false }));
          break;
        }
        case "node_skipped": {
          updateNode(eventData.nodeId as string, {
            status: "success",
            output: eventData.output as Record<string, unknown>,
          });
          break;
        }
        case "node_error": {
          const nodeId = eventData.nodeId as string;
          const errMsg = eventData.error as string;
          updateNode(nodeId, { status: "error", error: errMsg });

          if (eventData.isUnknownAction) {
            updateNode(nodeId, {
              status: "error",
              error: `Unknown action. Try: ${eventData.closestActionId ?? "see action registry"}`,
            });
          }

          if (eventData.is401) {
            setSelectedNodeId(nodeId);
            setInspectorOpen(true);
            addToast("error", "Credentials invalid or expired — update in inspector");
          }
          if (eventData.isTimeout) {
            addToast("error", "Step timed out — use Retry on the node");
          }
          break;
        }
        case "rate_limit_wait":
          setRateLimitSeconds(eventData.secondsRemaining as number);
          break;
        case "waiting_for_input": {
          const amb = eventData.ambiguous as AmbiguousMappingState | undefined;
          if (amb) setAmbiguousMapping(amb);
          updateNode(eventData.nodeId as string, {
            status: "waiting_input",
            error: eventData.question as string,
          });
          setSelectedNodeId(eventData.nodeId as string);
          setInspectorOpen(true);
          break;
        }
        case "pipeline_paused":
          setRunPaused(
            true,
            eventData.nodeOutputs as Record<string, Record<string, unknown>>,
            (eventData.nodeId as string) ?? null
          );
          setRunStatus("running");
          addToast("info", "Pipeline paused — choose a field mapping");
          break;
        case "pipeline_complete": {
          setRunStatus("complete");
          setRunPaused(false, null, null);
          setRateLimitSeconds(null);
          const live = useComposerStore.getState().pipeline;
          if (live) {
            setPipeline(
              {
                ...live,
                lastRunAt: new Date().toISOString(),
                lastRunStatus: "success",
              },
              { keepRunState: true }
            );
          }
          addToast("success", "Pipeline completed");
          break;
        }
        case "pipeline_failed": {
          setRunStatus("failed");
          setRateLimitSeconds(null);
          const live = useComposerStore.getState().pipeline;
          if (live) {
            setPipeline(
              {
                ...live,
                lastRunAt: new Date().toISOString(),
                lastRunStatus: "error",
              },
              { keepRunState: true }
            );
          }
          if (eventData.resumable && eventData.nodeOutputs) {
            useComposerStore.getState().setRunPaused(
              true,
              eventData.nodeOutputs as Record<string, Record<string, unknown>>,
              eventData.failedNodeId as string
            );
            addToast("error", "Connection lost — Resume when ready");
          } else {
            setRunPaused(false, null, null);
            addToast("error", `Pipeline failed at "${eventData.failedNodeId}"`);
          }
          break;
        }
      }
    },
    [
      updateNode,
      setSelectedNodeId,
      setInspectorOpen,
      addToast,
      setRunStatus,
      setPipeline,
      setRunPaused,
      setAmbiguousMapping,
      setRateLimitSeconds,
    ]
  );

  const streamRun = useCallback(
    async (options?: RunOptions): Promise<RunResult> => {
      if (!pipeline) return { success: false, cancelled: false };

      const credentials: Record<string, Record<string, string>> = {};
      const allCreds = getAllCredentials();
      Object.keys(allCreds).forEach((id) => {
        if (allCreds[id]) credentials[id] = allCreds[id];
      });

      const runId = crypto.randomUUID();
      useComposerStore.getState().setRunContext({
        pipelineId: pipeline.id,
        runId,
        startedAt: new Date().toISOString(),
        nodeOutputs: options?.initialNodeOutputs ?? {},
        currentNodeId: null,
        status: "running",
        log: [],
      });

      const controller = new AbortController();
      setAbortController(controller);

      try {
        const res = await fetch("/api/run-pipeline", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pipeline,
            credentials,
            mappingOverrides: useComposerStore.getState().mappingOverrides,
            startFromNodeId: options?.startFromNodeId,
            initialNodeOutputs: options?.initialNodeOutputs,
          }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          setRunStatus("failed");
          addToast("error", "Pipeline failed to start");
          return { success: false, cancelled: false };
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let currentEvent: string | null = null;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("event: ")) {
              currentEvent = line.slice(7).trim();
            } else if (line.startsWith("data: ") && currentEvent) {
              try {
                const eventData = JSON.parse(line.slice(6));
                processEvent(currentEvent, eventData);
              } catch {
                /* skip */
              }
              currentEvent = null;
            }
          }
        }

      setAbortController(null);
      setRateLimitSeconds(null);
      const finalStatus = useComposerStore.getState().runStatus;
      return {
        success: finalStatus === "complete",
        cancelled: false,
      };
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") {
          resetRun();
          setAbortController(null);
          return { success: false, cancelled: true };
        }
        setRunStatus("failed");
        const partial: Record<string, Record<string, unknown>> = {};
        pipeline?.nodes.forEach((n) => {
          if (n.output) partial[n.id] = n.output;
        });
        const firstPending = pipeline?.nodes.find(
          (n) => n.status === "running" || n.status === "error"
        );
        setRunPaused(true, partial, firstPending?.id ?? null);
        addToast("error", "Connection lost — Resume when ready");
        setAbortController(null);
        return { success: false, cancelled: false };
      }
    },
    [
      pipeline,
      getAllCredentials,
      processEvent,
      setRunStatus,
      addToast,
      resetRun,
      pausedNodeOutputs,
      pausedFromNodeId,
    ]
  );

  const run = useCallback(
    async (options?: RunOptions): Promise<RunResult> => {
      if (!pipeline) return { success: false, cancelled: false };

      const missing = validateCredentials();
      if (missing.length > 0) {
        setMissingCredentials(missing);
        missing.forEach((id) => {
          updateNode(id, { status: "error", error: "Credentials required" });
        });
        if (missing[0]) setSelectedNodeId(missing[0]);
        addToast("error", "Missing credentials — open node inspector");
        return { success: false, cancelled: false };
      }
      setMissingCredentials([]);
      setRunStatus("running");
      setRunPaused(false, null, null);

      return streamRun(options);
    },
    [
      pipeline,
      validateCredentials,
      streamRun,
      setRunStatus,
      updateNode,
      setSelectedNodeId,
      addToast,
      setRunPaused,
    ]
  );

  const resume = useCallback(async () => {
    const outputs = useComposerStore.getState().pausedNodeOutputs;
    const fromId = useComposerStore.getState().pausedFromNodeId;
    if (!outputs || !fromId) {
      return run();
    }
    setRunPaused(false, null, null);
    setRunStatus("running");
    return streamRun({ startFromNodeId: fromId, initialNodeOutputs: outputs });
  }, [run, streamRun, setRunPaused, setRunStatus]);

  const retryNode = useCallback(
    async (nodeId: string) => {
      const outputs: Record<string, Record<string, unknown>> = {};
      pipeline?.nodes.forEach((n) => {
        if (n.output && n.id !== nodeId) outputs[n.id] = n.output;
      });
      updateNode(nodeId, { status: "idle", error: undefined, output: undefined });
      setRunStatus("running");
      return streamRun({ startFromNodeId: nodeId, initialNodeOutputs: outputs });
    },
    [pipeline, streamRun, updateNode, setRunStatus]
  );

  const cancel = useCallback(() => {
    abortController?.abort();
  }, [abortController]);

  return {
    run,
    resume,
    retryNode,
    cancel,
    status: runStatus,
    missingCredentials,
  };
}
