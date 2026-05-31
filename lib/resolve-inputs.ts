import { PipelineNode, PipelineEdge, AmbiguousMappingState } from "@/types";
import { getActionById } from "@/lib/action-registry";
import { isUnsetInput } from "@/lib/input-utils";
import { firstListingId } from "@/lib/listing-id";
import { firstPolymarketMarketId, firstPolymarketTokenId } from "@/lib/polymarket-id";
import { coerceWireParamValue } from "@/lib/wire-param-coerce";

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
  "events",
  "markets",
  "tokens",
] as const;

export function resolveFieldFromOutput(
  sourceOutput: Record<string, unknown>,
  fromField: string
): unknown {
  if (fromField in sourceOutput) {
    const direct = sourceOutput[fromField];
    if (!isUnsetInput(direct)) return coerceWireParamValue(fromField, direct);
  }

  if (fromField === "listing_id") {
    for (const alias of ["listing_id", "value", "extracted"]) {
      const v = sourceOutput[alias];
      if (!isUnsetInput(v)) return coerceWireParamValue(fromField, v);
    }
  }

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
      if (fromField in row) return coerceWireParamValue(fromField, row[fromField]);
      if (fromField === "listing_id") {
        const id = row.listing_id ?? row.listingId ?? row.id ?? row.room_id;
        if (!isUnsetInput(id)) return id;
      }
    }
  }

  if (fromField === "listing_id") {
    const top = firstListingId(sourceOutput);
    if (top) return top;
  }

  if (fromField === "market_id") {
    const id = firstPolymarketMarketId(sourceOutput);
    if (id) return coerceWireParamValue(fromField, id);
  }

  if (fromField === "token_id") {
    for (const alias of ["token_id", "value", "extracted"]) {
      const v = sourceOutput[alias];
      if (!isUnsetInput(v)) return coerceWireParamValue(fromField, v);
    }
    const id = firstPolymarketTokenId(sourceOutput);
    if (id) return id;
  }

  return undefined;
}

/** Walk upstream edges (BFS) until a field is found — covers extract + market-full chains. */
export function resolveUpstreamField(
  nodeId: string,
  field: string,
  edges: PipelineEdge[],
  nodeOutputs: Record<string, Record<string, unknown>>,
  maxHops = 6
): unknown {
  const visited = new Set<string>();
  let frontier = [nodeId];

  for (let hop = 0; hop < maxHops && frontier.length > 0; hop++) {
    const next: string[] = [];
    for (const targetId of frontier) {
      for (const edge of edges.filter((e) => e.target === targetId)) {
        if (visited.has(edge.source)) continue;
        visited.add(edge.source);
        const out = nodeOutputs[edge.source];
        if (!out || out.skipped === true) {
          next.push(edge.source);
          continue;
        }
        const val = resolveFieldFromOutput(out, field);
        if (!isUnsetInput(val)) return val;
        next.push(edge.source);
      }
    }
    frontier = next;
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

    if (
      edge.dataMapping.length === 0 &&
      node.actionId === "wire.data.extract" &&
      sourceOutput
    ) {
      resolved.source = sourceOutput;
      continue;
    }

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
        if (!isUnsetInput(mapped)) {
          resolved[mapping.toField] = mapped;
        } else {
          const fallback = node.config?.[mapping.toField];
          if (!isUnsetInput(fallback)) {
            resolved[mapping.toField] = fallback;
          }
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
