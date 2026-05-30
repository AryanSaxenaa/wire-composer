"use client";

import { memo } from "react";
import { BaseEdge, EdgeProps, getSmoothStepPath } from "reactflow";

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
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 12,
  });

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      style={{
        ...style,
        stroke: animated ? "#2563eb" : "rgba(37, 99, 235, 0.3)",
        strokeWidth: animated ? 2 : 1.5,
      }}
    />
  );
}

export const PipelineEdge = memo(PipelineEdgeComponent);
