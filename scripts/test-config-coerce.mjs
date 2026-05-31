/**
 * Ensures pipeline parse accepts numeric config values (coerced to strings).
 * Run: node scripts/test-config-coerce.mjs
 */
import { readFileSync } from "fs";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

// Load compiled schema via Next's ts path is awkward; inline the same zod shape.
const { z } = require(join(root, "node_modules", "zod"));

function normalizeNodeConfig(config) {
  const out = {};
  if (!config || typeof config !== "object") return out;
  for (const [key, value] of Object.entries(config)) {
    if (value == null) continue;
    if (typeof value === "object") out[key] = JSON.stringify(value);
    else out[key] = String(value);
  }
  return out;
}

const PipelineNodeSchema = z.object({
  id: z.string(),
  type: z.enum(["wireAction", "trigger", "condition", "output"]),
  actionId: z.string(),
  label: z.string(),
  platform: z.string(),
  position: z.object({ x: z.number(), y: z.number() }),
  config: z.preprocess(
    (raw) => normalizeNodeConfig(raw ?? {}),
    z.record(z.string(), z.string())
  ),
  credentials: z.record(z.string(), z.string()),
  status: z.enum(["idle", "pending", "running", "success", "error", "waiting_input"]),
});

const sample = {
  id: "n1",
  type: "wireAction",
  actionId: "ab_search_listings",
  label: "Search",
  platform: "airbnb",
  position: { x: 0, y: 0 },
  config: { adults: 2, query: "Goa", children: 0 },
  credentials: {},
  status: "idle",
};

const parsed = PipelineNodeSchema.parse(sample);
if (parsed.config.adults !== "2" || parsed.config.children !== "0") {
  console.error("FAIL coerce", parsed.config);
  process.exit(1);
}
console.log("OK config coerce:", parsed.config);
