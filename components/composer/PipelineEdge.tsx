"use client";

import { memo } from "react";
import { EdgeProps, getBezierPath } from "reactflow";

function PipelineEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  animated,
  style,
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <path
      id={id}
      d={edgePath}
      stroke={animated ? "#4f6ef7" : "rgba(79,110,247,0.4)"}
      strokeWidth={2}
      fill="none"
      className={animated ? "animate-pulse" : ""}
      style={style}
    />
  );
}

export const PipelineEdge = memo(PipelineEdgeComponent);
