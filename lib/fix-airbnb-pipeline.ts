import { Pipeline } from "@/types";

/** NL parse often uses `listings.0.listing_id` — normalize to reliable extract + mapping. */
export function fixAirbnbExtractPipeline(pipeline: Pick<Pipeline, "nodes" | "edges">): Pipeline {
  const nodes = pipeline.nodes.map((n) => ({ ...n, config: { ...n.config } }));
  const edges = pipeline.edges.map((e) => ({
    ...e,
    dataMapping: e.dataMapping.map((m) => ({ ...m })),
  }));

  for (const node of nodes) {
    if (node.actionId !== "wire.data.extract") continue;
    const field = node.config.field ?? "";
    if (field.includes("listings") || field.includes("listing_id")) {
      node.config.field = "listing_id";
    }
  }

  for (const edge of edges) {
    const source = nodes.find((n) => n.id === edge.source);
    const target = nodes.find((n) => n.id === edge.target);
    if (source?.actionId !== "wire.data.extract") continue;
    if (target?.actionId !== "ab_listing_details") continue;

    for (const m of edge.dataMapping) {
      if (m.toField === "listing_id") {
        m.fromField = "listing_id";
      }
    }
  }

  return { ...pipeline, nodes, edges };
}
