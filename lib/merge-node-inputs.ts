import { PipelineEdge, PipelineNode } from "@/types";
import { getActionById } from "@/lib/action-registry";
import { isUnsetInput } from "@/lib/input-utils";
import { resolveUpstreamField } from "@/lib/resolve-inputs";
import { coerceWireParamValue } from "@/lib/wire-param-coerce";

/**
 * Inspector/config values win over upstream mappings when set.
 * Upstream mapping fills only unset config fields (first search result, etc.).
 */
export function mergeNodeInputs(
  config: Record<string, string>,
  resolved: Record<string, unknown>
): Record<string, unknown> {
  const merged: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(resolved)) {
    if (!isUnsetInput(value)) merged[key] = coerceWireParamValue(key, value);
  }
  for (const [key, value] of Object.entries(config)) {
    if (!isUnsetInput(value)) merged[key] = coerceWireParamValue(key, value);
  }
  return merged;
}

/** Merge mapped + config inputs, then fill required fields from upstream chain. */
export function enrichNodeInputs(
  node: PipelineNode,
  edges: PipelineEdge[],
  nodeOutputs: Record<string, Record<string, unknown>>,
  resolved: Record<string, unknown>
): Record<string, unknown> {
  const merged = mergeNodeInputs(node.config, resolved);
  const action = getActionById(node.actionId);
  if (!action) return merged;

  for (const field of action.inputFields) {
    const key = field.key;
    if (!isUnsetInput(merged[key])) continue;
    const upstream = resolveUpstreamField(node.id, key, edges, nodeOutputs);
    if (!isUnsetInput(upstream)) merged[key] = upstream;
  }

  return merged;
}
