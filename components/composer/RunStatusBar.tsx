"use client";

import { useState, useEffect } from "react";
import { useComposerStore } from "@/lib/store";
import { usePipelineRunner } from "@/hooks/usePipelineRunner";

export function RunStatusBar() {
  const pipeline = useComposerStore((s) => s.pipeline);
  const parseStatus = useComposerStore((s) => s.parseStatus);
  const parseError = useComposerStore((s) => s.parseError);
  const runStatus = useComposerStore((s) => s.runStatus);
  const runContext = useComposerStore((s) => s.runContext);
  const runPaused = useComposerStore((s) => s.runPaused);
  const rateLimitSeconds = useComposerStore((s) => s.rateLimitSeconds);
  const setRateLimitSeconds = useComposerStore((s) => s.setRateLimitSeconds);
  const setSelectedNodeId = useComposerStore((s) => s.setSelectedNodeId);
  const setInspectorOpen = useComposerStore((s) => s.setInspectorOpen);
  const { resume, cancel, run, retryNode } = usePipelineRunner();
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!runPaused || rateLimitSeconds == null) return;
    if (rateLimitSeconds <= 0) {
      setRateLimitSeconds(null);
      void resume();
      return;
    }
    const timer = window.setTimeout(() => {
      setRateLimitSeconds(rateLimitSeconds - 1);
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [runPaused, rateLimitSeconds, resume, setRateLimitSeconds]);

  if (!pipeline || pipeline.nodes.length === 0) return null;

  const showAfterParse =
    parseStatus === "success" && (runStatus === "idle" || runStatus === "failed");
  const showRun =
    runStatus === "running" ||
    runStatus === "paused" ||
    runStatus === "complete" ||
    runStatus === "failed" ||
    runPaused;
  const showParseError = parseStatus === "error" && parseError;

  if (!showAfterParse && !showRun && !showParseError) return null;

  const currentLabel =
    runContext?.currentNodeId &&
    pipeline.nodes.find((n) => n.id === runContext.currentNodeId)?.label;

  const completed = pipeline.nodes.filter((n) => n.status === "success").length;
  const total = pipeline.nodes.length;
  const failedNode = pipeline.nodes.find((n) => n.status === "error");

  let message = "Pipeline parsed — ready to run";
  if (showParseError) message = parseError || "Parse failed";
  else if (runPaused && rateLimitSeconds != null)
    message = `Rate limited — resuming in ${rateLimitSeconds}s`;
  else if (runPaused) message = "Paused — resolve mapping or resume";
  else if (runStatus === "paused") message = "Paused — choose a field mapping";
  else if (runStatus === "running" && rateLimitSeconds != null)
    message = `Rate limited — retrying in ${rateLimitSeconds}s`;
  else if (runStatus === "running" && currentLabel) message = `Running: ${currentLabel}`;
  else if (runStatus === "running") message = "Running pipeline…";
  else if (runStatus === "complete") message = "Pipeline completed";
  else if (runStatus === "failed") message = "Pipeline failed";

  const statusKey = runPaused ? "paused" : runStatus;

  return (
    <div
      className={`cmp-run-status-bar ${expanded ? "cmp-run-status-bar--expanded" : ""}`}
      role="status"
    >
      <span className={`cmp-run-status-dot cmp-run-status-dot--${statusKey}`} />
      <div className="cmp-run-status-main">
        <span className="cmp-run-status-message">{message}</span>
        {runStatus === "running" && !runPaused && (
          <span className="cmp-run-status-progress">
            {completed}/{total} steps
          </span>
        )}
      </div>

      <button
        type="button"
        className="cmp-status-link"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
      >
        {expanded ? "Hide steps" : "View steps"}
      </button>

      {(runPaused || runStatus === "paused") && (
        <button type="button" className="cmp-btn cmp-btn--sm" onClick={() => resume()}>
          Resume
        </button>
      )}

      {runStatus === "failed" && failedNode && (
        <button
          type="button"
          className="cmp-btn cmp-btn--sm"
          onClick={() => {
            setSelectedNodeId(failedNode.id);
            setInspectorOpen(true);
            void retryNode(failedNode.id);
          }}
        >
          Retry failed step
        </button>
      )}

      {runStatus === "failed" && (
        <button type="button" className="cmp-btn cmp-btn--sm cmp-btn--primary" onClick={() => run()}>
          Run again
        </button>
      )}

      {runStatus === "running" && (
        <button type="button" className="cmp-btn cmp-btn--sm" onClick={cancel}>
          Cancel
        </button>
      )}

      {expanded && (
        <ul className="cmp-status-steps">
          {pipeline.nodes.map((node, i) => (
            <li key={node.id}>
              <button
                type="button"
                className="cmp-status-step-btn"
                onClick={() => {
                  setSelectedNodeId(node.id);
                  setInspectorOpen(true);
                }}
              >
                <span className="cmp-status-step-num">{i + 1}.</span> {node.label}
                {node.status === "success" && (
                  <span className="cmp-status-step-ok">OK</span>
                )}
                {node.status === "error" && (
                  <span className="cmp-status-step-err">Error</span>
                )}
                {node.status === "waiting_input" && (
                  <span className="cmp-status-step-warn">Input</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
