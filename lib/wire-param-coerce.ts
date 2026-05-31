/** Polymarket CLOB IDs exceed JS safe integer — always keep as decimal strings. */
const STRING_ID_KEYS = new Set(["token_id", "market_id", "listing_id", "condition_id"]);

export function coerceWireParamValue(key: string, value: unknown): unknown {
  if (value == null) return value;
  const useString =
    STRING_ID_KEYS.has(key) || key.endsWith("_id") || key.endsWith("Id");
  if (!useString) return value;
  if (typeof value === "number" && !Number.isFinite(value)) return undefined;
  return String(value).trim();
}
