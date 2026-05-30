import { Pipeline, PipelineNode, PipelineEdge } from "@/types";
import { isBuiltinAction } from "@/lib/builtin-actions";

export function validateEdgeEndpoints(
  nodes: PipelineNode[],
  edges: PipelineEdge[]
): string | null {
  const ids = new Set(nodes.map((n) => n.id));
  for (const edge of edges) {
    if (!ids.has(edge.source)) {
      return `Edge "${edge.id}" references missing source node`;
    }
    if (!ids.has(edge.target)) {
      return `Edge "${edge.id}" references missing target node`;
    }
  }
  return null;
}

export function countExecutableNodes(nodes: PipelineNode[]): number {
  return nodes.filter(
    (n) =>
      n.type !== "trigger" &&
      n.actionId !== "wire.trigger.webhook" &&
      (isBuiltinAction(n.actionId) || n.actionId.length > 0)
  ).length;
}

export function validatePipelineBeforeRun(
  pipeline: Pipeline,
  startFromNodeId?: string
): string | null {
  const edgeError = validateEdgeEndpoints(pipeline.nodes, pipeline.edges);
  if (edgeError) return edgeError;

  if (countExecutableNodes(pipeline.nodes) === 0) {
    return "Pipeline has no runnable steps — add at least one Wire action";
  }

  if (startFromNodeId && !pipeline.nodes.some((n) => n.id === startFromNodeId)) {
    return `Cannot resume: unknown step "${startFromNodeId}"`;
  }

  return null;
}
