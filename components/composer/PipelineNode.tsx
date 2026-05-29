"use client";

import { memo, useCallback, useState } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { StatusDot } from "@/components/ui/StatusDot";
import { useComposerStore } from "@/lib/store";
import { getActionById } from "@/lib/action-registry";
import { useCredentials } from "@/lib/credentials-context";

function PipelineNodeComponent({ id, data, selected }: NodeProps) {
  const setSelectedNodeId = useComposerStore((s) => s.setSelectedNodeId);
  const updateNode = useComposerStore((s) => s.updateNode);
  const pipeline = useComposerStore((s) => s.pipeline);
  const addToast = useComposerStore((s) => s.addToast);
  const { getAllCredentials } = useCredentials();
  const action = getActionById(data.actionId);
  const status = data.status || "idle";
  const [retrying, setRetrying] = useState(false);

  const handleClick = useCallback(() => {
    setSelectedNodeId(id);
  }, [id, setSelectedNodeId]);

  const handleRetry = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!pipeline || !action) return;
    setRetrying(true);

    const node = pipeline.nodes.find((n) => n.id === id);
    if (!node) { setRetrying(false); return; }

    // Resolve inputs from upstream nodes' outputs
    const resolvedInputs: Record<string, unknown> = {};
    const incomingEdges = pipeline.edges.filter((e) => e.target === id);
    incomingEdges.forEach((edge) => {
      const sourceNode = pipeline.nodes.find((n) => n.id === edge.source);
      if (sourceNode?.output) {
        edge.dataMapping.forEach((mapping) => {
          if (mapping.fromField in sourceNode.output!) {
            resolvedInputs[mapping.toField] = sourceNode.output![mapping.fromField];
          }
        });
      }
    });

    const mergedInputs = { ...node.config, ...resolvedInputs };
    const creds = getAllCredentials()[id] || {};

    try {
      updateNode(id, { status: "running", error: undefined });
      const res = await fetch("/api/wire/run-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionId: node.actionId, inputs: mergedInputs, credentials: creds }),
      });
      const result = await res.json();
      if (result.success) {
        updateNode(id, { status: "success", output: result.output, error: undefined });
        addToast("success", `Node "${node.label}" completed`);
      } else {
        updateNode(id, { status: "error", error: result.error || "Retry failed" });
        addToast("error", `Retry failed: ${result.error || "Unknown error"}`);
      }
    } catch {
      updateNode(id, { status: "error", error: "Retry failed — network error" });
      addToast("error", "Retry failed — network error");
    } finally {
      setRetrying(false);
    }
  }, [id, pipeline, action, updateNode, getAllCredentials, addToast]);

  const inputFields = action?.inputFields || [];
  const outputKeys = data.output ? Object.keys(data.output) : [];

  return (
    <div
      className={`pipeline-node ${selected ? "selected" : ""}`}
      data-status={status}
      onClick={handleClick}
    >
      <div className="node-header">
        <span className="text-xs font-semibold text-text-secondary bg-bg-subtle px-1 py-0.5 rounded font-mono uppercase tracking-wider flex-shrink-0">
          {data.platform}
        </span>
        <span className="node-action-name font-mono text-xs text-text-primary truncate flex-1">
          {data.label}
        </span>
        <StatusDot status={status} />
      </div>

      <Handle type="target" position={Position.Left} />

      <div className="node-body">
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
        <div className="node-output flex items-center justify-between gap-2">
          <span className="text-error font-mono text-[10px] truncate flex-1">{data.error}</span>
          <button
            onClick={handleRetry}
            disabled={retrying}
            className="text-[9px] px-1.5 py-0.5 rounded bg-accent-primary/10 text-accent-primary font-mono hover:bg-accent-primary/20 transition-colors disabled:opacity-50 flex-shrink-0"
          >
            {retrying ? "..." : "Retry"}
          </button>
        </div>
      )}

      {status === "waiting_input" && (
        <div className="node-output">
          <span className="text-warning font-mono text-[10px]">Needs input</span>
        </div>
      )}

      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export const PipelineNode = memo(PipelineNodeComponent);
