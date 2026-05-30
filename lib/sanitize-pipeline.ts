import { Pipeline } from "@/types";

/** Strip runtime-only fields before persisting to KV */
export function sanitizePipelineForStorage(pipeline: Pipeline): Pipeline {
  return {
    ...pipeline,
    updatedAt: new Date().toISOString(),
    nodes: pipeline.nodes.map((n) => ({
      ...n,
      status: "idle",
      output: undefined,
      error: undefined,
      credentials: {},
    })),
    edges: pipeline.edges.map((e) => ({ ...e, animated: false })),
  };
}
