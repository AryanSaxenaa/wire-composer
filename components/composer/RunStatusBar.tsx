"use client";

import { useComposerStore } from "@/lib/store";
import { StatusDot } from "@/components/ui/StatusDot";
import { Button } from "@/components/ui/Button";
import clsx from "clsx";

export function RunStatusBar() {
  const runStatus = useComposerStore((s) => s.runStatus);
  const pipeline = useComposerStore((s) => s.pipeline);
  const runContext = useComposerStore((s) => s.runContext);
  const resetRun = useComposerStore((s) => s.resetRun);

  if (runStatus === "idle" || !pipeline) return null;

  const statusColors: Record<string, string> = {
    running: "bg-accent-primary/10 border-accent-primary/20",
    complete: "bg-success/10 border-success/20",
    failed: "bg-error/10 border-error/20",
  };

  const nodeCounts = {
    idle: pipeline.nodes.filter((n) => n.status === "idle").length,
    running: pipeline.nodes.filter((n) => n.status === "running").length,
    success: pipeline.nodes.filter((n) => n.status === "success").length,
    error: pipeline.nodes.filter((n) => n.status === "error").length,
  };

  return (
    <div
      className={clsx(
        "fixed bottom-0 left-0 right-0 h-12 border-t px-4 flex items-center justify-between z-50",
        statusColors[runStatus] || "bg-bg-surface border-border-default"
      )}
    >
      <div className="flex items-center gap-3">
        <StatusDot status={runStatus} />
        <span className="text-sm font-mono text-text-primary">
          {runStatus === "running" && "Running pipeline..."}
          {runStatus === "complete" && "Pipeline complete"}
          {runStatus === "failed" && "Pipeline failed"}
        </span>
        <span className="text-xs text-text-muted font-mono">
          {nodeCounts.success}/{pipeline.nodes.length} nodes
        </span>
      </div>

      <div className="flex items-center gap-2">
        {runContext?.log && runContext.log.length > 0 && (
          <span className="text-[10px] text-text-muted font-mono">
            {runContext.log.length} log entries
          </span>
        )}
        <Button
          size="sm"
          variant={runStatus === "running" ? "danger" : "ghost"}
          onClick={resetRun}
        >
          {runStatus === "running" ? "Cancel" : "Clear"}
        </Button>
      </div>
    </div>
  );
}

