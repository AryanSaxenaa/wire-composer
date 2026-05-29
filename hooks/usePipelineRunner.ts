"use client";

import { useCallback, useState } from "react";
import { useComposerStore } from "@/lib/store";

export function usePipelineRunner() {
  const pipeline = useComposerStore((s) => s.pipeline);
  const runStatus = useComposerStore((s) => s.runStatus);
  const setRunStatus = useComposerStore((s) => s.setRunStatus);
  const updateNode = useComposerStore((s) => s.updateNode);
  const [missingCredentials, setMissingCredentials] = useState<string[]>([]);

  const validateCredentials = useCallback((): string[] => {
    if (!pipeline) return [];
    const missing: string[] = [];
    pipeline.nodes.forEach((n) => {
      if (!n.credentials || Object.keys(n.credentials).length === 0) {
        const hasAuth = true; // In a real app, check action registry
        if (hasAuth && !missing.includes(n.id)) {
          missing.push(n.id);
        }
      }
    });
    return missing;
  }, [pipeline]);

  const run = useCallback(async (): Promise<boolean> => {
    if (!pipeline) return false;

    const missing = validateCredentials();
    if (missing.length > 0) {
      setMissingCredentials(missing);
      return false;
    }
    setMissingCredentials([]);

    setRunStatus("running");

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
        setRunStatus("failed");
        return false;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("event: ")) {
            const eventType = line.slice(7).trim();
            const dataLine = buffer.startsWith("data: ") ? buffer.slice(6) : "";
            try {
              const data = JSON.parse(dataLine);
              switch (eventType) {
                case "node_start":
                  updateNode(data.nodeId, { status: "running" });
                  break;
                case "node_complete":
                  updateNode(data.nodeId, {
                    status: "success",
                    output: data.output,
                  });
                  break;
                case "node_error":
                  updateNode(data.nodeId, {
                    status: "error",
                    error: data.error,
                  });
                  break;
                case "pipeline_complete":
                  setRunStatus("complete");
                  break;
                case "pipeline_failed":
                  setRunStatus("failed");
                  break;
              }
            } catch {
              // Skip parse errors
            }
          }
        }
      }
    } catch {
      setRunStatus("failed");
    }
    return true;
  }, [pipeline, validateCredentials, setRunStatus, updateNode]);

  return { run, status: runStatus, missingCredentials };
}
