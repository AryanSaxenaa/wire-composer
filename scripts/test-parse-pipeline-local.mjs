/**
 * Local integration: POST /api/parse-pipeline (dev server must be running).
 * Run: npm run dev
 * Then: node --env-file=.env.local scripts/test-parse-pipeline-local.mjs
 */
const base = process.env.TEST_BASE_URL || "http://localhost:3000";
const prompt = "Search Airbnb listings → get listing details";

const res = await fetch(`${base}/api/parse-pipeline`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ prompt }),
});

const text = await res.text();
let data;
try {
  data = JSON.parse(text);
} catch {
  console.error("Non-JSON response", res.status, text.slice(0, 500));
  process.exit(1);
}

if (!res.ok) {
  console.error("FAIL parse", res.status, data);
  process.exit(1);
}

const nodes = data.pipeline?.nodes ?? [];
const bad = nodes.filter((n) =>
  Object.values(n.config ?? {}).some((v) => typeof v !== "string")
);
if (bad.length) {
  console.error("FAIL config types not all strings", bad.map((n) => n.config));
  process.exit(1);
}

console.log("OK parse-pipeline", res.status, "nodes:", nodes.length, "name:", data.pipeline?.name);
for (const n of nodes) {
  if (n.actionId?.includes("ab_")) {
    console.log(" ", n.label, n.config);
  }
}
