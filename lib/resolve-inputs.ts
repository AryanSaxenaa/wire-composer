import { PipelineNode, PipelineEdge, AmbiguousMappingState } from "@/types";
import { getActionById } from "@/lib/action-registry";

export type ResolveResult =
  | { ok: true; inputs: Record<string, unknown> }
  | { ok: false; ambiguous: AmbiguousMappingState };

export function resolveInputsWithAmbiguity(
  node: PipelineNode,
  edges: PipelineEdge[],
  nodeOutputs: Record<string, Record<string, unknown>>,
  allNodes: PipelineNode[],
  mappingOverrides?: Record<string, Record<string, string>>
): ResolveResult {
  const resolved: Record<string, unknown> = {};
  const incomingEdges = edges.filter((e) => e.target === node.id);
  const action = getActionById(node.actionId);

  for (const edge of incomingEdges) {
    const sourceOutput = nodeOutputs[edge.source];
    if (!sourceOutput) continue;

    const sourceNode = allNodes.find((n) => n.id === edge.source);

    if (edge.dataMapping.length > 0) {
      for (const mapping of edge.dataMapping) {
        const overrideKey = mappingOverrides?.[node.id]?.[mapping.toField];
        if (overrideKey && overrideKey in sourceOutput) {
          resolved[mapping.toField] = sourceOutput[overrideKey];
          continue;
        }
        if (mapping.fromField in sourceOutput) {
          resolved[mapping.toField] = sourceOutput[mapping.fromField];
        }
      }
      continue;
    }

    const targetFields =
      action?.inputFields.map((f) => f.key) ??
      Object.keys(resolved);

    for (const toField of targetFields) {
      const overrideKey = mappingOverrides?.[node.id]?.[toField];
      if (overrideKey && overrideKey in sourceOutput) {
        resolved[toField] = sourceOutput[overrideKey];
        continue;
      }

      const exact = sourceOutput[toField];
      if (exact !== undefined) {
        resolved[toField] = exact;
        continue;
      }

      const candidates = Object.keys(sourceOutput).filter(
        (k) =>
          k.toLowerCase().includes(toField.toLowerCase()) ||
          toField.toLowerCase().includes(k.toLowerCase())
      );

      if (candidates.length === 1) {
        resolved[toField] = sourceOutput[candidates[0]];
      } else if (candidates.length > 1) {
        return {
          ok: false,
          ambiguous: {
            nodeId: node.id,
            targetField: toField,
            options: candidates.map((fromField) => ({
              fromField,
              sourceNodeId: edge.source,
              sourceLabel: sourceNode?.label ?? edge.source,
            })),
          },
        };
      }
    }

    if (Object.keys(resolved).length === 0) {
      Object.assign(resolved, sourceOutput);
    }
  }

  return { ok: true, inputs: resolved };
}
