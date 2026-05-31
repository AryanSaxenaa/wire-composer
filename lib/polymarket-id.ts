import { isUnsetInput } from "@/lib/input-utils";

function unwrapPayload(payload: Record<string, unknown>): Record<string, unknown> {
  const inner = payload.data;
  if (inner && typeof inner === "object" && !Array.isArray(inner)) {
    return inner as Record<string, unknown>;
  }
  return payload;
}

/** First market id from pm_search_markets / pm_get_markets style payloads. */
export function firstPolymarketMarketId(
  payload: Record<string, unknown>
): string | undefined {
  const data = unwrapPayload(payload);

  const events = data.events;
  if (Array.isArray(events)) {
    for (const event of events) {
      if (!event || typeof event !== "object") continue;
      const markets = (event as Record<string, unknown>).markets;
      if (Array.isArray(markets) && markets[0] && typeof markets[0] === "object") {
        const id = (markets[0] as Record<string, unknown>).id;
        if (!isUnsetInput(id)) return String(id);
      }
    }
  }

  const markets = data.markets;
  if (Array.isArray(markets) && markets[0] && typeof markets[0] === "object") {
    const id = (markets[0] as Record<string, unknown>).id;
    if (!isUnsetInput(id)) return String(id);
  }

  if (!isUnsetInput(data.id) && (data.question || data.condition_id)) {
    return String(data.id);
  }

  return undefined;
}

/** First CLOB token id from pm_get_market_full style payloads. */
export function firstPolymarketTokenId(
  payload: Record<string, unknown>
): string | undefined {
  const data = unwrapPayload(payload);

  const tokens = data.tokens;
  if (Array.isArray(tokens) && tokens[0] && typeof tokens[0] === "object") {
    const tokenId = (tokens[0] as Record<string, unknown>).token_id;
    if (!isUnsetInput(tokenId)) return String(tokenId);
  }

  const clob = data.clob_token_ids;
  if (Array.isArray(clob) && !isUnsetInput(clob[0])) return String(clob[0]);

  return undefined;
}
