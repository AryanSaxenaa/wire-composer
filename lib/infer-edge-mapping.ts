import { PipelineEdge, PipelineNode } from "@/types";
import { getActionById } from "@/lib/action-registry";

/** Infer same-name field mappings for manually drawn canvas edges. */
export function inferDataMappingForEdge(
  _sourceNode: PipelineNode,
  targetNode: PipelineNode
): PipelineEdge["dataMapping"] {
  const targetAction = getActionById(targetNode.actionId);
  if (!targetAction) return [];

  const mappings: PipelineEdge["dataMapping"] = [];
  for (const field of targetAction.inputFields) {
    if (targetNode.config?.[field.key]) continue;
    mappings.push({ fromField: field.key, toField: field.key });
  }

  return mappings;
}
