"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useComposerStore } from "@/lib/store";
import { getActionById } from "@/lib/action-registry";
import { useCredentials } from "@/lib/credentials-context";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

export function TopBar() {
  const pipeline = useComposerStore((s) => s.pipeline);
  const parseStatus = useComposerStore((s) => s.parseStatus);
  const runStatus = useComposerStore((s) => s.runStatus);
  const addToast = useComposerStore((s) => s.addToast);
  const updateNode = useComposerStore((s) => s.updateNode);
  const setSelectedNodeId = useComposerStore((s) => s.setSelectedNodeId);
  const [name, setName] = useState(pipeline?.name || "");
  const { getAllCredentials } = useCredentials();
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (pipeline?.name) setName(pipeline.name);
  }, [pipeline?.name]);

  const handleRun = useCallback(async () => {
    if (!pipeline) return;

    const credentials = getAllCredentials();

    // Validate credentials for auth-required nodes
    for (const node of pipeline.nodes) {
      const action = getActionById(node.actionId);
      if (action?.requiresAuth && !credentials[node.id]) {
        addToast("error", `Missing credentials for "${node.label}". Open the node inspector.`);
        updateNode(node.id, { status: "error", error: "Credentials required" });
        setSelectedNodeId(node.id);
        return;
      }
    }

    useComposerStore.getState().setRunStatus("running");
    const controller = new AbortController();
    abortRef.current = controller;

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
        useComposerStore.getState().setRunStatus("failed");
        addToast("error", "Pipeline failed to start");
        return;
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
              const store = useComposerStore.getState();

              switch (currentEvent) {
                case "node_start":
                  store.updateNode(eventData.nodeId as string, { status: "running" });
                  // §6.3: Animate edges flowing into the running node
                  if (store.pipeline) {
                    store.pipeline.edges
                      .filter((e) => e.target === eventData.nodeId)
                      .forEach((e) => store.updateEdge(e.id, { animated: true }));
                  }
                  break;
                case "node_complete":
                  store.updateNode(eventData.nodeId as string, {
                    status: "success",
                    output: eventData.output as Record<string, unknown>,
                  });
                  // §6.3: Stop edge animations when node completes
                  if (store.pipeline) {
                    store.pipeline.edges
                      .filter((e) => e.target === eventData.nodeId)
                      .forEach((e) => store.updateEdge(e.id, { animated: false }));
                  }
                  break;
                case "node_error": {
                  const nodeId = eventData.nodeId as string;
                  const errMsg = eventData.error as string;
                  store.updateNode(nodeId, {
                    status: "error",
                    error: errMsg,
                  });

                  // §12: Error handling — 401 → open inspector to credentials
                  if (errMsg.includes("401") || errMsg.includes("Unauthorized")) {
                    store.setSelectedNodeId(nodeId);
                    store.updateNode(nodeId, {
                      error: "Credentials invalid or expired",
                    });
                    addToast("error", `Credentials invalid — check node "${nodeId}"`);
                  }
                  // §12: 429 → flag as rate limited
                  if (errMsg.includes("429") || errMsg.includes("Rate limit")) {
                    store.updateNode(nodeId, {
                      error: "Rate limited — retrying in 30s",
                    });
                    addToast("error", `Rate limited on "${nodeId}". Will retry once.`);
                  }
                  break;
                }
                case "waiting_for_input":
                  store.updateNode(eventData.nodeId as string, {
                    status: "waiting_input",
                    error: eventData.question as string,
                  });
                  addToast("info", `Pipeline needs input on "${eventData.nodeId}"`);
                  break;
                case "pipeline_complete": {
                  const p = store.pipeline;
                  if (p) {
                    store.setPipeline({
                      ...p,
                      lastRunAt: new Date().toISOString(),
                      lastRunStatus: "success",
                    });
                  }
                  store.setRunStatus("complete");
                  addToast("success", "Pipeline completed successfully");
                  break;
                }
                case "pipeline_failed":
                  store.setRunStatus("failed");
                  const p2 = store.pipeline;
                  if (p2) {
                    store.setPipeline({
                      ...p2,
                      lastRunAt: new Date().toISOString(),
                      lastRunStatus: "error",
                    });
                  }
                  addToast("error", `Pipeline failed at node "${eventData.failedNodeId}"`);
                  break;
              }
            } catch {
              // Ignore parse errors
            }
            currentEvent = null;
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") {
        useComposerStore.getState().resetRun();
      } else {
        useComposerStore.getState().setRunStatus("failed");
        addToast("error", "Connection lost — check your network");
      }
    } finally {
      abortRef.current = null;
    }
  }, [pipeline, getAllCredentials, addToast, updateNode, setSelectedNodeId]);

  const handleSave = useCallback(async () => {
    if (!pipeline) return;
    const updated = { ...pipeline, name: name || pipeline.name };

    try {
      const res = await fetch("/api/pipelines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      const data = await res.json();
      if (data.pipeline) {
        useComposerStore.getState().setPipeline(data.pipeline);
        addToast("success", "Pipeline saved");
      } else {
        addToast("error", data.error || "Save failed");
      }
    } catch {
      addToast("error", "Save failed — network error");
    }
  }, [pipeline, name, addToast]);

  return (
    <header className="h-12 bg-bg-surface border-b border-border-default flex items-center justify-between px-4 flex-shrink-0">
      <div className="flex items-center gap-3">
        <span className="text-sm font-bold text-accent-primary font-mono tracking-tight">
          wire
        </span>
        <span className="text-text-muted text-sm">/</span>
        <input
          value={name || pipeline?.name || ""}
          onChange={(e) => setName(e.target.value)}
          placeholder="Pipeline name..."
          className="text-sm text-text-primary bg-transparent border-none outline-none font-mono placeholder:text-text-muted min-w-[140px]"
        />
      </div>

      <div className="flex items-center gap-2">
        {parseStatus === "loading" && (
          <span className="flex items-center gap-1.5 text-xs text-text-muted font-mono">
            <Spinner size="sm" /> Parsing...
          </span>
        )}
        <Button
          size="sm"
          variant="secondary"
          onClick={handleSave}
          disabled={!pipeline}
        >
          Save
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={!pipeline || runStatus !== "complete"}
        >
          Schedule
        </Button>
        <Button
          size="sm"
          onClick={handleRun}
          disabled={!pipeline || runStatus === "running"}
        >
          {runStatus === "running" ? (
            <>
              <Spinner size="sm" className="mr-1.5" />
              Running
            </>
          ) : (
            "Run"
          )}
        </Button>
      </div>
    </header>
  );
}
