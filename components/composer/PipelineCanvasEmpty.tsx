"use client";

export function PipelineCanvasEmpty() {
  return (
    <div className="cmp-canvas-empty">
      <p className="cmp-canvas-empty-title">No pipeline yet</p>
      <p className="cmp-canvas-empty-desc">
        Describe a workflow on the left, pick an example, or load a demo pipeline. Nodes will appear here.
      </p>
    </div>
  );
}
