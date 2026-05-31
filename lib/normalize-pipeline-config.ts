import { stripSurroundingQuotes } from "@/lib/sanitize-wire-params";

/** Node config is stored as string key-value pairs; LLM JSON often uses numbers. */
export function normalizeNodeConfig(
  config: Record<string, unknown> | undefined | null
): Record<string, string> {
  const out: Record<string, string> = {};
  if (!config || typeof config !== "object") return out;

  for (const [key, value] of Object.entries(config)) {
    if (value == null) continue;
    if (typeof value === "object") {
      out[key] = JSON.stringify(value);
    } else {
      out[key] = String(stripSurroundingQuotes(String(value)));
    }
  }
  return out;
}
