import { PipelineNode, PipelineEdge, AmbiguousMappingState } from "@/types";
import { getActionById } from "@/lib/action-registry";

/** Wire actions often return list payloads (e.g. `users`, `listings`) instead of flat fields. */
const NESTED_LIST_KEYS = [
  "listings",
  "users",
  "items",
  "posts",
  "children",
  "products",
  "repos",
  "reviews",
] as const;

function resolveFieldFromOutput(
  sourceOutput: Record<string, unknown>,
  fromField: string
): unknown {
  if (fromField in sourceOutput) return sourceOutput[fromField];

  const nested = sourceOutput.data;
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    const fromNested = resolveFieldFromOutput(nested as Record<string, unknown>, fromField);
    if (fromNested !== undefined) return fromNested;
  }

  for (const listKey of NESTED_LIST_KEYS) {
    const list = sourceOutput[listKey];
    if (!Array.isArray(list) || list.length === 0) continue;
    const first = list[0];
    if (first && typeof first === "object" && !Array.isArray(first)) {
      const row = first as Record<string, unknown>;
      if (fromField in row) return row[fromField];
    }
  }

  return undefined;
}

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
    if (!sourceOutput || sourceOutput.skipped === true) continue;

    const sourceNode = allNodes.find((n) => n.id === edge.source);

    if (edge.dataMapping.length > 0) {
      for (const mapping of edge.dataMapping) {
        const overrideKey = mappingOverrides?.[node.id]?.[mapping.toField];
        if (overrideKey) {
          const overrideValue = resolveFieldFromOutput(sourceOutput, overrideKey);
          if (overrideValue !== undefined) {
            resolved[mapping.toField] = overrideValue;
          }
          continue;
        }
        const mapped = resolveFieldFromOutput(sourceOutput, mapping.fromField);
        if (mapped !== undefined) {
          resolved[mapping.toField] = mapped;
        }
      }
      continue;
    }

    const targetFields =
      action?.inputFields.map((f) => f.key) ??
      Object.keys(resolved);

    for (const toField of targetFields) {
      const overrideKey = mappingOverrides?.[node.id]?.[toField];
      if (overrideKey) {
        const overrideValue = resolveFieldFromOutput(sourceOutput, overrideKey);
        if (overrideValue !== undefined) {
          resolved[toField] = overrideValue;
        }
        continue;
      }

      const exact = resolveFieldFromOutput(sourceOutput, toField);
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
