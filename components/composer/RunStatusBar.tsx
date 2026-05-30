"use client";

import { useState } from "react";
import { useComposerStore } from "@/lib/store";
import { usePipelineRunner } from "@/hooks/usePipelineRunner";

/**
 * Bottom run status (spec §6 RunStatusBar) plus expandable step list from the
 * former ComposerStatusCard — better UX than either alone.
 */
export function RunStatusBar() {
  const pipeline = useComposerStore((s) => s.pipeline);
  const parseStatus = useComposerStore((s) => s.parseStatus);
  const runStatus = useComposerStore((s) => s.runStatus);
  const runContext = useComposerStore((s) => s.runContext);
  const runPaused = useComposerStore((s) => s.runPaused);
  const rateLimitSeconds = useComposerStore((s) => s.rateLimitSeconds);
  const setSelectedNodeId = useComposerStore((s) => s.setSelectedNodeId);
  const setInspectorOpen = useComposerStore((s) => s.setInspectorOpen);
  const { resume, cancel } = usePipelineRunner();
  const [expanded, setExpanded] = useState(false);

  if (!pipeline || pipeline.nodes.length === 0) return null;

  const showAfterParse = parseStatus === "success" && runStatus === "idle";
  const showRun =
    runStatus === "running" ||
    runStatus === "complete" ||
    runStatus === "failed" ||
    runPaused;

  if (!showAfterParse && !showRun) return null;

  const currentLabel =
    runContext?.currentNodeId &&
    pipeline.nodes.find((n) => n.id === runContext.currentNodeId)?.label;

  const completed = pipeline.nodes.filter((n) => n.status === "success").length;
  const total = pipeline.nodes.length;

  let message = "Pipeline parsed — ready to run";
  if (runPaused) message = "Paused — resolve mapping or resume";
  else if (runStatus === "running" && rateLimitSeconds != null)
    message = `Rate limited — retrying in ${rateLimitSeconds}s`;
  else if (runStatus === "running" && currentLabel) message = `Running: ${currentLabel}`;
  else if (runStatus === "running") message = "Running pipeline…";
  else if (runStatus === "complete") message = "Pipeline completed";
  else if (runStatus === "failed") message = "Pipeline failed";

  return (
    <div
      className={`cmp-run-status-bar ${expanded ? "cmp-run-status-bar--expanded" : ""}`}
      role="status"
    >
      <span className={`cmp-run-status-dot cmp-run-status-dot--${runPaused ? "paused" : runStatus}`} />
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
      >
        {expanded ? "Hide steps" : "View steps"}
      </button>

      {runPaused && (
        <button type="button" className="cmp-btn cmp-btn--sm" onClick={() => resume()}>
          Resume
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
