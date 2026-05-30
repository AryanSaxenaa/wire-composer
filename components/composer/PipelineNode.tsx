"use client";

import { memo, useCallback } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { useComposerStore } from "@/lib/store";
import { getActionById } from "@/lib/action-registry";

function platformTone(platform: string): string {
  const p = platform.toLowerCase();
  if (p.includes("slack")) return "pink";
  if (p.includes("linkedin")) return "purple";
  if (p.includes("amazon") || p.includes("shopify")) return "orange";
  if (p.includes("github") || p.includes("jira") || p.includes("linear")) return "gray";
  if (p.includes("glassdoor") || p.includes("trust")) return "green";
  return "blue";
}

function PlatformGlyph({ platform }: { platform: string }) {
  const p = platform.toLowerCase();
  if (p.includes("slack")) {
    return (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path fill="currentColor" d="M7.2 2.2v3H5a1 1 0 100 2h2.2v3a1 1 0 102 0V7.2h3a1 1 0 100-2H9.2V2.2a1 1 0 10-2 0zm3.6 4.4v3a1 1 0 102 0v-3h3a1 1 0 100-2h-3V4.4a1 1 0 10-2 0v3H6.8a1 1 0 100 2h4z" />
      </svg>
    );
  }
  if (p.includes("amazon") || p.includes("shopify")) {
    return (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M3 13h12M6 5.5h6M8 3v2.5M10 3v2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M2.5 9h13M9 2.5c1.8 1.8 1.8 10.2 0 13M9 2.5c-1.8 1.8-1.8 10.2 0 13" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

function PipelineNodeComponent({ id, data, selected }: NodeProps) {
  const setSelectedNodeId = useComposerStore((s) => s.setSelectedNodeId);
  const setInspectorOpen = useComposerStore((s) => s.setInspectorOpen);
  const action = getActionById(data.actionId);
  const status = data.status || "idle";
  const stepIndex = (data.stepIndex as number) || 1;
  const description = (data.description as string) || action?.description || "";
  const tone = platformTone(data.platform || "");

  const openInspector = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      setSelectedNodeId(id);
      setInspectorOpen(true);
    },
    [id, setSelectedNodeId, setInspectorOpen]
  );

  const showSuccess = status === "success";
  const showRunning = status === "running";
  const showError = status === "error";

  return (
    <div
      className={`cmp-node ${selected ? "selected" : ""}`}
      data-status={status}
      onClick={openInspector}
    >
      <Handle type="target" position={Position.Top} />

      <div className="cmp-node-inner">
        <div className={`cmp-node-icon cmp-node-icon--${tone}`}>
          <PlatformGlyph platform={data.platform || ""} />
        </div>

        <div className="cmp-node-content">
          <p className="cmp-node-title">
            <span className="cmp-node-title-num">{stepIndex}.</span> {data.label}
          </p>
          <p className="cmp-node-desc">{description}</p>
        </div>

        <div className="cmp-node-side">
          {showSuccess && (
            <span className="cmp-node-success">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6.5l2 2 4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Success
            </span>
          )}
          {showRunning && (
            <span className="cmp-node-success" style={{ color: "#2563eb" }}>
              Running
            </span>
          )}
          {showError && (
            <span className="cmp-node-success" style={{ color: "#dc2626" }}>
              Error
            </span>
          )}
          <button
            type="button"
            className="cmp-node-menu"
            onClick={openInspector}
            aria-label="Node options"
          >
            ⋮
          </button>
        </div>
      </div>

      {showError && data.error && (
        <p className="cmp-node-error">{data.error}</p>
      )}

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

export const PipelineNode = memo(PipelineNodeComponent);
