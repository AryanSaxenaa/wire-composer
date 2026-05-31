import { Pipeline, PipelineNode } from "@/types";
import { isUnsetInput } from "@/lib/input-utils";

/** Flatten common webhook body shapes (`{ data: {...} }`, `{ trigger: { data } }`). */
export function normalizeWebhookBody(
  body: Record<string, unknown>
): Record<string, unknown> {
  const flat = { ...body };

  const data = body.data;
  if (data && typeof data === "object" && !Array.isArray(data)) {
    Object.assign(flat, data as Record<string, unknown>);
  }

  const trigger = body.trigger;
  if (trigger && typeof trigger === "object" && !Array.isArray(trigger)) {
    const t = trigger as Record<string, unknown>;
    const nested = t.data;
    if (nested && typeof nested === "object" && !Array.isArray(nested)) {
      Object.assign(flat, nested as Record<string, unknown>);
    }
    for (const [k, v] of Object.entries(t)) {
      if (k !== "data" && flat[k] === undefined) flat[k] = v;
    }
  }

  delete flat.data;
  delete flat.trigger;
  return flat;
}

function inferManualPayloadFromDownstream(
  triggerNodeId: string,
  pipeline: Pick<Pipeline, "nodes" | "edges">
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const edge of pipeline.edges.filter((e) => e.source === triggerNodeId)) {
    const target = pipeline.nodes.find((n) => n.id === edge.target);
    if (!target) continue;
    for (const m of edge.dataMapping) {
      const val = target.config?.[m.toField];
      if (!isUnsetInput(val)) out[m.fromField] = val;
    }
  }
  return out;
}

const AIRBNB_SEARCH_DEFAULTS: Record<string, unknown> = {
  query: "Pacific Heights, San Francisco",
  checkin: "2026-07-01",
  checkout: "2026-07-05",
  adults: "2",
};

function pipelineUsesAirbnbSearch(nodes: PipelineNode[]): boolean {
  return nodes.some((n) => n.actionId === "ab_search_listings");
}

/**
 * Output for a webhook trigger node during execution.
 * Real webhook POST bodies win; manual Run uses downstream config + sensible defaults.
 */
export function buildWebhookTriggerOutput(
  triggerNode: PipelineNode,
  pipeline: Pick<Pipeline, "nodes" | "edges">,
  triggerData?: Record<string, unknown> | null
): Record<string, unknown> {
  if (triggerData && Object.keys(triggerData).length > 0) {
    return normalizeWebhookBody(triggerData);
  }

  const fromConfig = triggerNode.config ?? {};
  const inferred = inferManualPayloadFromDownstream(triggerNode.id, pipeline);
  const airbnbDefaults = pipelineUsesAirbnbSearch(pipeline.nodes)
    ? AIRBNB_SEARCH_DEFAULTS
    : {};

  const merged: Record<string, unknown> = {
    ...airbnbDefaults,
    ...inferred,
  };

  for (const [k, v] of Object.entries(fromConfig)) {
    if (k === "triggerData" && typeof v === "string") {
      try {
        const parsed = JSON.parse(v) as Record<string, unknown>;
        Object.assign(merged, normalizeWebhookBody(parsed));
      } catch {
        /* ignore invalid JSON */
      }
      continue;
    }
    if (!isUnsetInput(v)) merged[k] = v;
  }

  return merged;
}
