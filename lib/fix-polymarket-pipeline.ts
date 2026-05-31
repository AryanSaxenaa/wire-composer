import { Pipeline } from "@/types";
import { ANAKIN_WIRE_ACTION_IDS } from "@/lib/anakin-wire-action-ids";

/** Ensure Polymarket extract → downstream edges use canonical field names. */
export function fixPolymarketExtractPipeline(pipeline: Pipeline): Pipeline {
  const nodes = pipeline.nodes.map((n) => ({ ...n, config: { ...n.config } }));

  for (const node of nodes) {
    if (node.actionId !== "wire.data.extract") continue;
    const field = node.config.field ?? "";
    if (field === "token_id") node.config.field = "token_id";
    else if (field === "market_id") node.config.field = "market_id";
  }

  const edges = pipeline.edges.map((e) => ({
    ...e,
    dataMapping: e.dataMapping.map((m) => ({ ...m })),
  }));

  const extractMarket = nodes.find(
    (n) => n.actionId === "wire.data.extract" && n.config.field === "market_id"
  );
  const extractToken = nodes.find(
    (n) => n.actionId === "wire.data.extract" && n.config.field === "token_id"
  );
  const marketFull = nodes.find(
    (n) => n.actionId === ANAKIN_WIRE_ACTION_IDS.polymarketMarketFull
  );

  if (extractMarket && marketFull) {
    for (const edge of edges) {
      if (edge.target !== marketFull.id) continue;
      for (const m of edge.dataMapping) {
        if (m.toField === "market_id" && m.fromField !== "market_id") {
          if (edge.source === extractMarket.id) m.fromField = "market_id";
        }
      }
    }
  }

  const orderbook = nodes.find(
    (n) => n.actionId === ANAKIN_WIRE_ACTION_IDS.polymarketOrderbook
  );
  const priceHistory = nodes.find(
    (n) => n.actionId === ANAKIN_WIRE_ACTION_IDS.polymarketPriceHistory
  );

  for (const downstream of [orderbook, priceHistory]) {
    if (!extractToken || !downstream) continue;
    for (const edge of edges) {
      if (edge.target !== downstream.id) continue;
      for (const m of edge.dataMapping) {
        if (m.toField === "token_id" && edge.source === extractToken.id) {
          m.fromField = "token_id";
        }
      }
    }
  }

  return { ...pipeline, nodes, edges };
}
