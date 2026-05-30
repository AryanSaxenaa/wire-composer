"use client";

import { useState } from "react";
import { useComposerStore } from "@/lib/store";

export function ComposerStatusCard() {
  const pipeline = useComposerStore((s) => s.pipeline);
  const parseStatus = useComposerStore((s) => s.parseStatus);
  const runStatus = useComposerStore((s) => s.runStatus);
  const setSelectedNodeId = useComposerStore((s) => s.setSelectedNodeId);
  const setInspectorOpen = useComposerStore((s) => s.setInspectorOpen);
  const [expanded, setExpanded] = useState(false);

  if (!pipeline || pipeline.nodes.length === 0) return null;

  const stepCount = pipeline.nodes.length;

  let title = "";
  let visible = false;

  if (parseStatus === "success" && runStatus === "idle") {
    title = "Pipeline parsed successfully";
    visible = true;
  } else if (runStatus === "running") {
    title = "Running pipeline...";
    visible = true;
  } else if (runStatus === "complete") {
    title = "Pipeline completed successfully";
    visible = true;
  } else if (runStatus === "failed") {
    title = "Pipeline failed";
    visible = true;
  }

  if (!visible) return null;

  const isSuccess =
    runStatus === "complete" || (parseStatus === "success" && runStatus === "idle");

  return (
    <div className={`cmp-status-card ${expanded ? "cmp-status-card--expanded" : ""}`}>
      <div className="cmp-status-icon" style={!isSuccess ? { background: "#eff6ff", color: "#2563eb" } : undefined}>
        {isSuccess ? (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M4 9.5l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="animate-spin">
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeOpacity="0.25" />
            <path d="M14 8a6 6 0 00-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )}
      </div>
      <div className="cmp-status-text">
        <strong>{title}</strong>
        <span>{stepCount} steps</span>
      </div>
      <button
        type="button"
        className="cmp-status-link"
        onClick={() => setExpanded((e) => !e)}
      >
        {expanded ? "Hide steps" : "View steps"}
      </button>

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
                  <span className="cmp-status-step-ok">Success</span>
                )}
                {node.status === "error" && (
                  <span className="cmp-status-step-err">Error</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
