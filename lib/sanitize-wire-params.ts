/** Remove extra JSON/typing quotes (e.g. "\"2026-06-01\"" → 2026-06-01). */
export function stripSurroundingQuotes(value: unknown): unknown {
  if (typeof value !== "string") return value;
  let s = value.trim();
  for (let i = 0; i < 3; i++) {
    if (
      (s.startsWith('"') && s.endsWith('"') && s.length >= 2) ||
      (s.startsWith("'") && s.endsWith("'") && s.length >= 2)
    ) {
      s = s.slice(1, -1).trim();
    } else {
      break;
    }
  }
  return s;
}

const DATE_KEYS = new Set(["checkin", "checkout"]);

/** Normalize to YYYY-MM-DD for Anakin date params. */
export function normalizeDateParam(value: unknown): string | undefined {
  const raw = stripSurroundingQuotes(value);
  if (raw == null || raw === "") return undefined;
  const s = String(raw).trim();
  const match = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (!match) return s;
  const [, y, m, d] = match;
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

const INTEGER_KEYS = new Set([
  "adults",
  "children",
  "infants",
  "pets",
  "minStars",
  "maxStars",
  "limit",
  "start_ts",
  "end_ts",
  "fidelity",
]);

const BOOLEAN_KEYS = new Set(["closed"]);

export function sanitizeWireActionParams(
  actionId: string,
  params: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = {};

  for (const [key, raw] of Object.entries(params)) {
    if (raw == null || raw === "") continue;

    if (DATE_KEYS.has(key)) {
      const date = normalizeDateParam(raw);
      if (date) out[key] = date;
      continue;
    }

    if (BOOLEAN_KEYS.has(key)) {
      const rawStr = String(stripSurroundingQuotes(raw)).trim().toLowerCase();
      if (rawStr === "true" || rawStr === "1" || rawStr === "yes") out[key] = true;
      else if (rawStr === "false" || rawStr === "0" || rawStr === "no") out[key] = false;
      continue;
    }

    if (
      (actionId === "ab_search_listings" || actionId === "pm_search_markets") &&
      (INTEGER_KEYS.has(key) || key === "cursor")
    ) {
      if (key === "cursor") {
        const s = String(stripSurroundingQuotes(raw)).trim();
        if (s) out[key] = /^\d+$/.test(s) ? Number(s) : s;
        continue;
      }
      const n = Number(stripSurroundingQuotes(raw));
      if (!Number.isNaN(n)) out[key] = n;
      continue;
    }

    const stripped = stripSurroundingQuotes(raw);
    if (typeof stripped === "string") {
      const t = stripped.trim();
      if (t) out[key] = t;
    } else {
      out[key] = stripped;
    }
  }

  return out;
}
