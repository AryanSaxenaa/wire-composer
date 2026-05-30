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
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 20,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          ...style,
          stroke: animated ? "#2563eb" : "#93c5fd",
          strokeWidth: 2,
        }}
      />
      <circle
        cx={labelX}
        cy={labelY}
        r={5}
        fill="#ffffff"
        stroke="#93c5fd"
        strokeWidth={2}
      />
    </>
  );
}

export const PipelineEdge = memo(PipelineEdgeComponent);
