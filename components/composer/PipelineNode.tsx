"use client";

import { memo, useCallback } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { StatusDot } from "@/components/ui/StatusDot";
import { useComposerStore } from "@/lib/store";
import { getActionById } from "@/lib/action-registry";

function PipelineNodeComponent({ id, data, selected }: NodeProps) {
  const setSelectedNodeId = useComposerStore((s) => s.setSelectedNodeId);
  const action = getActionById(data.actionId);
  const status = data.status || "idle";

  const handleClick = useCallback(() => {
    setSelectedNodeId(id);
  }, [id, setSelectedNodeId]);

  const inputFields = action?.inputFields || [];
  const outputKeys = data.output ? Object.keys(data.output) : [];

  return (
    <div
      className={`pipeline-node ${selected ? "selected" : ""}`}
      data-status={status}
      onClick={handleClick}
    >
      <div className="node-header">
        <span className="text-xs font-semibold text-text-secondary bg-bg-subtle px-1.5 py-0.5 rounded font-mono uppercase tracking-wider">
          {data.platform}
        </span>
        <StatusDot status={status} />
      </div>

      <Handle type="target" position={Position.Left} />

      <div className="node-body">
        <span className="text-sm font-semibold text-text-primary block truncate">
          {data.label}
        </span>
        {inputFields.slice(0, 2).map((f) => (
          <div key={f.key} className="mt-1.5 flex items-center gap-1.5 text-[11px]">
            <span className="field-key font-mono flex-shrink-0">{f.key}:</span>
            <span className="field-value truncate">
              {data.config?.[f.key] ? (
                data.config[f.key]
              ) : (
                <span className="text-text-muted italic">not set</span>
              )}
            </span>
          </div>
        ))}
      </div>

      {status === "success" && outputKeys.length > 0 && (
        <div className="node-output">
          <span className="text-success font-mono text-[10px] font-medium">
            ✓ {outputKeys.length} fields
          </span>
        </div>
      )}

      {status === "error" && data.error && (
        <div className="node-output">
          <span className="text-error font-mono text-[10px]">{data.error}</span>
        </div>
      )}

      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export const PipelineNode = memo(PipelineNodeComponent);
