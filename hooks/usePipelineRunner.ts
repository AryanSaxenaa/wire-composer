"use client";

import { useCallback, useState } from "react";
import { useComposerStore } from "@/lib/store";
import { getActionById } from "@/lib/action-registry";
import { useCredentials } from "@/lib/credentials-context";

interface RunResult {
  success: boolean;
  cancelled: boolean;
}

export function usePipelineRunner() {
  const pipeline = useComposerStore((s) => s.pipeline);
  const runStatus = useComposerStore((s) => s.runStatus);
  const setRunStatus = useComposerStore((s) => s.setRunStatus);
  const updateNode = useComposerStore((s) => s.updateNode);
  const setSelectedNodeId = useComposerStore((s) => s.setSelectedNodeId);
  const setPipeline = useComposerStore((s) => s.setPipeline);
  const resetRun = useComposerStore((s) => s.resetRun);
  const addToast = useComposerStore((s) => s.addToast);
  const { getAllCredentials } = useCredentials();
  const [missingCredentials, setMissingCredentials] = useState<string[]>([]);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const validateCredentials = useCallback((): string[] => {
    if (!pipeline) return [];
    const allCreds = getAllCredentials();
    const missing: string[] = [];
    pipeline.nodes.forEach((n) => {
      const action = getActionById(n.actionId);
      if (action?.requiresAuth && !allCreds[n.id]) {
        missing.push(n.id);
      }
    });
    return missing;
  }, [pipeline, getAllCredentials]);

  const run = useCallback(async (): Promise<RunResult> => {
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

    const controller = new AbortController();
    setAbortController(controller);

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
      nodeOutputs: {},
      currentNodeId: null,
      status: "running",
      log: [],
    });

    try {
      const res = await fetch("/api/run-pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pipeline, credentials }),
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

              switch (currentEvent) {
                case "node_start": {
                  updateNode(eventData.nodeId as string, { status: "running" });
                  // §6.3: Animate edges flowing into the running node
                  const p = useComposerStore.getState().pipeline;
                  if (p) {
                    p.edges
                      .filter((e) => e.target === eventData.nodeId)
                      .forEach((e) => useComposerStore.getState().updateEdge(e.id, { animated: true }));
                  }
                  break;
                }
                case "node_complete": {
                  updateNode(eventData.nodeId as string, {
                    status: "success",
                    output: eventData.output as Record<string, unknown>,
                  });
                  // §6.3: Stop edge animations when node completes
                  const p = useComposerStore.getState().pipeline;
                  if (p) {
                    p.edges
                      .filter((e) => e.target === eventData.nodeId)
                      .forEach((e) => useComposerStore.getState().updateEdge(e.id, { animated: false }));
                  }
                  break;
                }
                case "node_error": {
                  const nodeId = eventData.nodeId as string;
                  const errMsg = eventData.error as string;
                  updateNode(nodeId, { status: "error", error: errMsg });
                  if (errMsg.includes("401") || errMsg.includes("Unauthorized")) {
                    setSelectedNodeId(nodeId);
                    addToast("error", "Credentials invalid — check node inspector");
                  }
                  if (errMsg.includes("429") || errMsg.includes("Rate")) {
                    addToast("error", `Rate limited — retry in 30s`);
                  }
                  break;
                }
                case "waiting_for_input":
                  updateNode(eventData.nodeId as string, {
                    status: "waiting_input",
                    error: eventData.question as string,
                  });
                  addToast("info", `Pipeline needs input on node "${eventData.nodeId}"`);
                  break;
                case "pipeline_complete": {
                  setRunStatus("complete");
                  const livePipeline = useComposerStore.getState().pipeline;
                  if (livePipeline) {
                    setPipeline({
                      ...livePipeline,
                      lastRunAt: new Date().toISOString(),
                      lastRunStatus: "success",
                    });
                  }
                  addToast("success", "Pipeline completed");
                  break;
                }
                case "pipeline_failed":
                  setRunStatus("failed");
                  const livePipeline2 = useComposerStore.getState().pipeline;
                  if (livePipeline2) {
                    setPipeline({
                      ...livePipeline2,
                      lastRunAt: new Date().toISOString(),
                      lastRunStatus: "error",
                    });
                  }
                  addToast("error", `Pipeline failed at "${eventData.failedNodeId}"`);
                  break;
              }
            } catch {
              // Skip parse errors
            }
            currentEvent = null;
          }
        }
      }

      setAbortController(null);
      return { success: true, cancelled: false };
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") {
        resetRun();
        setAbortController(null);
        return { success: false, cancelled: true };
      }
      setRunStatus("failed");
      addToast("error", "Connection lost — check your network");
      setAbortController(null);
      return { success: false, cancelled: false };
    }
  }, [pipeline, getAllCredentials, validateCredentials, setRunStatus, updateNode, setSelectedNodeId, setPipeline, addToast, resetRun]);

  const cancel = useCallback(() => {
    if (abortController) {
      abortController.abort();
    }
  }, [abortController]);

  return { run, cancel, status: runStatus, missingCredentials };
}
