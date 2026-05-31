import { Pipeline, PipelineNode } from "@/types";
import { getActionById } from "@/lib/action-registry";
import { isUnsetInput } from "@/lib/input-utils";

const PLATFORM_DEFAULTS: Record<string, Record<string, string>> = {
  pm_search_markets: {
    query: "US presidential election",
    limit: "5",
    closed: "false",
  },
  pm_get_price_history: {
    interval: "1d",
  },
  ab_search_listings: {
    query: "Pacific Heights, San Francisco",
    checkin: "2026-07-01",
    checkout: "2026-07-05",
    adults: "2",
    currency: "INR",
    locale: "en-IN",
  },
};

function isWebhookTrigger(node: PipelineNode): boolean {
  return node.type === "trigger" || node.actionId === "wire.trigger.webhook";
}

/**
 * When NL parse wires a webhook → action with empty target config, fill manual-run
 * fallbacks on the target node so Run works without a POST body.
 */
export function ensurePipelineRunDefaults<T extends Pick<Pipeline, "nodes" | "edges">>(
  pipeline: T
): T {
  const nodes = pipeline.nodes.map((n) => ({
    ...n,
    config: { ...n.config },
  }));

  for (const edge of pipeline.edges) {
    const source = nodes.find((n) => n.id === edge.source);
    const targetIdx = nodes.findIndex((n) => n.id === edge.target);
    if (!source || targetIdx < 0 || !isWebhookTrigger(source)) continue;

    const target = nodes[targetIdx];
    const action = getActionById(target.actionId);
    const actionDefaults = PLATFORM_DEFAULTS[target.actionId] ?? {};

    for (const m of edge.dataMapping) {
      if (!isUnsetInput(target.config[m.toField])) continue;

      const fromExample = action?.inputFields.find((f) => f.key === m.toField)?.example;
      const fallback =
        actionDefaults[m.toField] ??
        (fromExample != null ? String(fromExample) : undefined);

      if (!isUnsetInput(fallback)) {
        target.config[m.toField] = fallback;
      }
    }
  }

  return { ...pipeline, nodes };
}
