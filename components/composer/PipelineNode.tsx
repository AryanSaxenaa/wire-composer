"use client";

import { memo, useCallback } from "react";
import Image from "next/image";
import { Handle, Position, NodeProps } from "reactflow";
import { useComposerStore } from "@/lib/store";
import { getActionById } from "@/lib/action-registry";
import { StatusDot } from "@/components/ui/StatusDot";

function platformIconSrc(platform: string): string {
  let key = platform.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (key === "googlemaps") key = "google";
  if (key.startsWith("github")) key = "github";
  const known = [
    "amazon",
    "shopify",
    "github",
    "glassdoor",
    "trustpilot",
    "reddit",
    "airbnb",
    "linkedin",
    "slack",
    "notion",
  ];
  if (known.includes(key)) return `/platform-icons/${key}.svg`;
  return "/platform-icons/default.svg";
}

function PipelineNodeComponent({ id, data, selected }: NodeProps) {
  const setSelectedNodeId = useComposerStore((s) => s.setSelectedNodeId);
  const setInspectorOpen = useComposerStore((s) => s.setInspectorOpen);
  const action = getActionById(data.actionId as string);
  const status = (data.status as string) || "idle";
  const inputFields = action?.inputFields ?? [];

  const openInspector = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      setSelectedNodeId(id);
      setInspectorOpen(true);
    },
    [id, setSelectedNodeId, setInspectorOpen]
  );

  const config = (data.config as Record<string, string>) || {};
  const output = data.output as Record<string, unknown> | undefined;
  const isSkipped = status === "success" && output?.skipped === true;
  const showSuccess = status === "success" && !isSkipped;
  const displayStatus = isSkipped ? "idle" : status;

  return (
    <div
      className={`pipeline-node ${selected ? "selected" : ""} ${!action ? "pipeline-node--unknown" : ""}`}
      data-status={displayStatus}
      onClick={openInspector}
    >
      <Handle type="target" position={Position.Left} />

      <div className="node-header">
        <Image
          src={platformIconSrc((data.platform as string) || "default")}
          alt=""
          width={16}
          height={16}
          className="w-4 h-4 shrink-0"
          unoptimized
        />
        <span className="node-action-name font-mono text-xs flex-1 truncate">
          {data.label as string}
        </span>
        <StatusDot status={status as Parameters<typeof StatusDot>[0]["status"]} />
      </div>

      <div className="node-body">
        {inputFields.slice(0, 2).map((f) => (
          <div key={f.key} className="field-preview text-xs">
            <span className="field-key font-mono">{f.key}:</span>{" "}
            <span className="field-value truncate inline-block max-w-[140px] align-bottom">
              {config[f.key] ? (
                config[f.key]
              ) : (
                <span className="italic text-[#94a3b8]">not set</span>
              )}
            </span>
          </div>
        ))}
      </div>

      {isSkipped && (
        <div className="node-output">
          <span className="text-[#475569] font-mono text-xs">Skipped (gate)</span>
        </div>
      )}

      {showSuccess && output && (
        <div className="node-output">
          <span className="text-[#22c55e] font-mono text-xs">
            ✓ {Object.keys(output).length} fields
          </span>
        </div>
      )}

      {status === "error" && data.error && (
        <p className="px-3 pb-2 text-[11px] text-[#ef4444] font-mono">{String(data.error)}</p>
      )}

      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export const PipelineNode = memo(PipelineNodeComponent);
