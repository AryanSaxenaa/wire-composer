/**
 * E2E: run verified demo pipelines against /api/run-pipeline (SSE).
 * Usage: node scripts/e2e-deployed-demos.mjs [baseUrl]
 */

const BASE =
  process.argv[2]?.replace(/\/$/, "") ||
  "https://wire-composer-service-qa4wgkhwga-uc.a.run.app";

const PIPELINE_TIMEOUT_MS = 5 * 60 * 1000;

/** Mirrors lib/demo-pipelines.ts DEMO_PIPELINES (GitHub, Product Hunt, Airbnb only). */
const DEMOS = [
  {
    label: "GitHub: list user repos",
    pipeline: {
      id: "e2e-gh-repos",
      name: "GH Repos",
      nodes: [
        {
          id: "d0-repos",
          type: "wireAction",
          actionId: "gh_user_repos",
          label: "User Repos",
          platform: "github_public",
          position: { x: 0, y: 0 },
          config: { username: "teknium1" },
          credentials: {},
          status: "idle",
        },
      ],
      edges: [],
    },
  },
  {
    label: "GitHub: profile → repos",
    pipeline: {
      id: "e2e-gh-profile",
      name: "GH Profile",
      nodes: [
        {
          id: "d7-profile",
          type: "wireAction",
          actionId: "gh_user_details",
          label: "User Details",
          platform: "github_public",
          position: { x: 0, y: 0 },
          config: { username: "torvalds" },
          credentials: {},
          status: "idle",
        },
        {
          id: "d7-repos",
          type: "wireAction",
          actionId: "gh_user_repos",
          label: "User Repos",
          platform: "github_public",
          position: { x: 0, y: 0 },
          config: { username: "torvalds" },
          credentials: {},
          status: "idle",
        },
      ],
      edges: [
        {
          id: "d7-e1",
          source: "d7-profile",
          target: "d7-repos",
          sourceHandle: "login",
          targetHandle: "username",
          dataMapping: [{ fromField: "login", toField: "username" }],
          animated: false,
        },
      ],
    },
  },
  {
    label: "GitHub: search → profile",
    pipeline: {
      id: "e2e-gh-search",
      name: "GH Search",
      nodes: [
        {
          id: "d8-search",
          type: "wireAction",
          actionId: "gh_search_users",
          label: "Search Users",
          platform: "github_public",
          position: { x: 0, y: 0 },
          config: { query: "followers:>50000", per_page: "3" },
          credentials: {},
          status: "idle",
        },
        {
          id: "d8-profile",
          type: "wireAction",
          actionId: "gh_user_details",
          label: "User Details",
          platform: "github_public",
          position: { x: 0, y: 0 },
          config: { username: "torvalds" },
          credentials: {},
          status: "idle",
        },
      ],
      edges: [
        {
          id: "d8-e1",
          source: "d8-search",
          target: "d8-profile",
          sourceHandle: "login",
          targetHandle: "username",
          dataMapping: [{ fromField: "login", toField: "username" }],
          animated: false,
        },
      ],
    },
  },
  {
    label: "GitHub: search developers → list repos",
    pipeline: {
      id: "e2e-github-crm",
      name: "GitHub CRM",
      nodes: [
        {
          id: "d4-search",
          type: "wireAction",
          actionId: "gh_search_users",
          label: "Search Users",
          platform: "github_public",
          position: { x: 0, y: 0 },
          config: { query: "location:usa followers:>1000", per_page: "3" },
          credentials: {},
          status: "idle",
        },
        {
          id: "d4-profile",
          type: "wireAction",
          actionId: "gh_user_details",
          label: "User Details",
          platform: "github_public",
          position: { x: 0, y: 0 },
          config: { username: "torvalds" },
          credentials: {},
          status: "idle",
        },
        {
          id: "d4-extract",
          type: "wireAction",
          actionId: "wire.data.extract",
          label: "Extract name",
          platform: "wire",
          position: { x: 0, y: 0 },
          config: { field: "name" },
          credentials: {},
          status: "idle",
        },
        {
          id: "d4-repos",
          type: "wireAction",
          actionId: "gh_user_repos",
          label: "User Repos",
          platform: "github_public",
          position: { x: 0, y: 0 },
          config: { username: "torvalds" },
          credentials: {},
          status: "idle",
        },
      ],
      edges: [
        {
          id: "d4-e1",
          source: "d4-search",
          target: "d4-profile",
          sourceHandle: "login",
          targetHandle: "username",
          dataMapping: [{ fromField: "login", toField: "username" }],
          animated: false,
        },
        {
          id: "d4-e2",
          source: "d4-profile",
          target: "d4-extract",
          sourceHandle: "name",
          targetHandle: "source",
          dataMapping: [{ fromField: "name", toField: "source" }],
          animated: false,
        },
        {
          id: "d4-e3",
          source: "d4-profile",
          target: "d4-repos",
          sourceHandle: "login",
          targetHandle: "username",
          dataMapping: [{ fromField: "login", toField: "username" }],
          animated: false,
        },
      ],
    },
  },
  {
    label: "Product Hunt: trending → launch details",
    pipeline: {
      id: "e2e-ph",
      name: "PH E2E",
      nodes: [
        {
          id: "d6-trending",
          type: "wireAction",
          actionId: "ph_trending",
          label: "Trending",
          platform: "producthunt",
          position: { x: 0, y: 0 },
          config: {},
          credentials: {},
          status: "idle",
        },
        {
          id: "d6-product",
          type: "wireAction",
          actionId: "ph_product_details",
          label: "Product Details",
          platform: "producthunt",
          position: { x: 0, y: 0 },
          config: { slug: "notion" },
          credentials: {},
          status: "idle",
        },
        {
          id: "d6-extract",
          type: "wireAction",
          actionId: "wire.data.extract",
          label: "Extract name",
          platform: "wire",
          position: { x: 0, y: 0 },
          config: { field: "name" },
          credentials: {},
          status: "idle",
        },
      ],
      edges: [
        {
          id: "d6-e1",
          source: "d6-trending",
          target: "d6-product",
          sourceHandle: "slug",
          targetHandle: "slug",
          dataMapping: [{ fromField: "slug", toField: "slug" }],
          animated: false,
        },
        {
          id: "d6-e2",
          source: "d6-product",
          target: "d6-extract",
          sourceHandle: "name",
          targetHandle: "source",
          dataMapping: [{ fromField: "name", toField: "source" }],
          animated: false,
        },
      ],
    },
  },
  {
    label: "Airbnb: search listings → listing details",
    pipeline: {
      id: "e2e-airbnb",
      name: "Airbnb E2E",
      nodes: [
        {
          id: "d2-search",
          type: "wireAction",
          actionId: "ab_search_listings",
          label: "Search Listings",
          platform: "airbnb",
          position: { x: 0, y: 0 },
          config: { query: "Pacific Heights, San Francisco", adults: "2" },
          credentials: {},
          status: "idle",
        },
        {
          id: "d2-details",
          type: "wireAction",
          actionId: "ab_listing_details",
          label: "Listing Details",
          platform: "airbnb",
          position: { x: 0, y: 0 },
          config: { listing_id: "" },
          credentials: {},
          status: "idle",
        },
        {
          id: "d2-extract",
          type: "wireAction",
          actionId: "wire.data.extract",
          label: "Extract title",
          platform: "wire",
          position: { x: 0, y: 0 },
          config: { field: "title" },
          credentials: {},
          status: "idle",
        },
      ],
      edges: [
        {
          id: "d2-e1",
          source: "d2-search",
          target: "d2-details",
          sourceHandle: "listing_id",
          targetHandle: "listing_id",
          dataMapping: [{ fromField: "listing_id", toField: "listing_id" }],
          animated: false,
        },
        {
          id: "d2-e2",
          source: "d2-details",
          target: "d2-extract",
          sourceHandle: "title",
          targetHandle: "source",
          dataMapping: [{ fromField: "title", toField: "source" }],
          animated: false,
        },
      ],
    },
  },
];

function parseSse(text) {
  const events = [];
  let eventName = null;
  for (const line of text.split("\n")) {
    if (line.startsWith("event: ")) eventName = line.slice(7).trim();
    else if (line.startsWith("data: ") && eventName) {
      try {
        events.push({ event: eventName, data: JSON.parse(line.slice(6)) });
      } catch {
        events.push({ event: eventName, data: { raw: line.slice(6) } });
      }
      eventName = null;
    }
  }
  return events;
}

async function runDemo(demo) {
  const start = Date.now();
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), PIPELINE_TIMEOUT_MS);

  const nodeResults = {};
  let status = "unknown";
  let error = null;

  try {
    const res = await fetch(`${BASE}/api/run-pipeline`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pipeline: demo.pipeline, credentials: {} }),
      signal: ac.signal,
    });

    const text = await res.text();
    const events = parseSse(text);

    for (const ev of events) {
      if (ev.event === "node_start") {
        nodeResults[ev.data.nodeId] = { state: "running", actionId: ev.data.actionId };
      }
      if (ev.event === "node_complete") {
        nodeResults[ev.data.nodeId] = {
          state: "ok",
          durationMs: ev.data.durationMs,
          skipped: !!ev.data.skipped,
        };
      }
      if (ev.event === "node_skipped") {
        nodeResults[ev.data.nodeId] = { state: "skipped" };
      }
      if (ev.event === "node_error") {
        nodeResults[ev.data.nodeId] = { state: "error", error: ev.data.error };
      }
      if (ev.event === "pipeline_complete") status = "success";
      if (ev.event === "pipeline_failed") {
        status = "failed";
        error = ev.data.error;
      }
      if (ev.event === "pipeline_paused") {
        status = "paused";
        error = ev.data.reason;
      }
    }

    if (status === "unknown") {
      status = res.ok ? "incomplete" : "http_error";
      if (!res.ok) error = text.slice(0, 200);
    }
  } catch (e) {
    status = e.name === "AbortError" ? "timeout" : "error";
    error = e.message;
  } finally {
    clearTimeout(timer);
  }

  return {
    label: demo.label,
    status,
    error,
    durationSec: Math.round((Date.now() - start) / 1000),
    nodes: nodeResults,
  };
}

console.log(`E2E against ${BASE}\n`);

const results = [];
for (let i = 0; i < DEMOS.length; i++) {
  const demo = DEMOS[i];
  console.log(`[${i + 1}/${DEMOS.length}] ${demo.label} ...`);
  const r = await runDemo(demo);
  results.push(r);
  const icon = r.status === "success" ? "PASS" : "FAIL";
  console.log(`  => ${icon} (${r.durationSec}s)${r.error ? ` — ${String(r.error).slice(0, 100)}` : ""}`);
  console.log("");
}

console.log("=== SUMMARY ===");
for (const r of results) {
  console.log(`${r.status === "success" ? "✓" : "✗"} ${r.label} [${r.status}] ${r.durationSec}s`);
}

const failed = results.filter((r) => r.status !== "success");
process.exit(failed.length ? 1 : 0);
