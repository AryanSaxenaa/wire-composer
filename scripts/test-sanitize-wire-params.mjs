/**
 * Run: node scripts/test-sanitize-wire-params.mjs
 */

function stripSurroundingQuotes(value) {
  if (typeof value !== "string") return value;
  let s = value.trim();
  for (let i = 0; i < 3; i++) {
    if (
      (s.startsWith('"') && s.endsWith('"') && s.length >= 2) ||
      (s.startsWith("'") && s.endsWith("'") && s.length >= 2)
    ) {
      s = s.slice(1, -1).trim();
    } else break;
  }
  return s;
}

function normalizeDateParam(value) {
  const raw = stripSurroundingQuotes(value);
  const s = String(raw).trim();
  const match = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (!match) return s;
  const [, y, m, d] = match;
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

const checkin = normalizeDateParam('"2026-06-01"');
if (checkin !== "2026-06-01") {
  console.error("FAIL date", checkin);
  process.exit(1);
}

const query = stripSurroundingQuotes('"beach house"');
if (query !== "beach house") {
  console.error("FAIL query", query);
  process.exit(1);
}

console.log("OK sanitize wire params");
