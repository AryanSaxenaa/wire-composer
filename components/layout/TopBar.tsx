"use client";

import { useState, useCallback } from "react";
import { useComposerStore } from "@/lib/store";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

export function TopBar() {
  const pipeline = useComposerStore((s) => s.pipeline);
  const parseStatus = useComposerStore((s) => s.parseStatus);
  const runStatus = useComposerStore((s) => s.runStatus);
  const [name, setName] = useState(pipeline?.name || "");

  const handleRun = useCallback(async () => {
    if (!pipeline) return;
    useComposerStore.getState().setRunStatus("running");

    // Collect credentials from nodes
    const credentials: Record<string, Record<string, string>> = {};
    pipeline.nodes.forEach((n) => {
      if (Object.keys(n.credentials).length > 0) {
        credentials[n.id] = n.credentials;
      }
    });

    try {
      const res = await fetch("/api/run-pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pipeline, credentials }),
      });

      if (!res.ok || !res.body) {
        useComposerStore.getState().setRunStatus("failed");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let running = true;

      while (running) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const eventData = JSON.parse(line.slice(6));
              const store = useComposerStore.getState();

              switch (eventData.event) {
                case "node_start":
                  store.updateNode(eventData.data.nodeId as string, {
                    status: "running",
                  });
                  break;
                case "node_complete":
                  store.updateNode(eventData.data.nodeId as string, {
                    status: "success",
                    output: eventData.data.output as Record<string, unknown>,
                  });
                  break;
                case "node_error":
                  store.updateNode(eventData.data.nodeId as string, {
                    status: "error",
                    error: eventData.data.error as string,
                  });
                  break;
                case "pipeline_complete":
                  store.setRunStatus("complete");
                  break;
                case "pipeline_failed":
                  store.setRunStatus("failed");
                  break;
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      }
    } catch {
      useComposerStore.getState().setRunStatus("failed");
    }
  }, [pipeline]);

  const handleSave = useCallback(async () => {
    if (!pipeline) return;
    const updated = { ...pipeline, name: name || pipeline.name };
    await fetch("/api/pipelines", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
  }, [pipeline, name]);

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
