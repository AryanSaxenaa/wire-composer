import { PipelineNode, PipelineEdge } from "@/types";

export function topologicalSort(
  nodes: PipelineNode[],
  edges: PipelineEdge[]
): PipelineNode[] {
  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();

  nodes.forEach((n) => {
    inDegree.set(n.id, 0);
    adj.set(n.id, []);
  });

  edges.forEach((e) => {
    adj.get(e.source)?.push(e.target);
    inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
  });

  const queue: PipelineNode[] = [];
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  inDegree.forEach((deg, id) => {
    if (deg === 0) {
      const node = nodeMap.get(id);
      if (node) queue.push(node);
    }
  });

  const sorted: PipelineNode[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    sorted.push(current);

    adj.get(current.id)?.forEach((neighbor) => {
      const newDeg = (inDegree.get(neighbor) || 1) - 1;
      inDegree.set(neighbor, newDeg);
      if (newDeg === 0) {
        const node = nodeMap.get(neighbor);
        if (node) queue.push(node);
      }
    });
  }

  return sorted;
}

export function resolveInputs(
  node: PipelineNode,
  edges: PipelineEdge[],
  nodeOutputs: Record<string, Record<string, unknown>>
): Record<string, unknown> {
  const resolved: Record<string, unknown> = {};

  const incomingEdges = edges.filter((e) => e.target === node.id);

  incomingEdges.forEach((edge) => {
    const sourceOutput = nodeOutputs[edge.source];
    if (!sourceOutput) return;

    edge.dataMapping.forEach((mapping) => {
      if (mapping.fromField in sourceOutput) {
        resolved[mapping.toField] = sourceOutput[mapping.fromField];
      }
    });

    // If no explicit data mappings, try auto-mapping by matching field names
    if (edge.dataMapping.length === 0) {
      const sourceFields = Object.keys(sourceOutput);
      sourceFields.forEach((field) => {
        resolved[field] = sourceOutput[field];
      });
    }
  });

  return resolved;
}
