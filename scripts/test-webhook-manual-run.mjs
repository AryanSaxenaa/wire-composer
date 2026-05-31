/**
 * Verifies manual Run supplies Airbnb search inputs when webhook trigger has no POST body.
 * Run: node scripts/test-webhook-manual-run.mjs
 */

function isUnsetInput(value) {
  return value == null || value === "";
}

function normalizeWebhookBody(body) {
  const flat = { ...body };
  const data = body.data;
  if (data && typeof data === "object" && !Array.isArray(data)) {
    Object.assign(flat, data);
  }
  delete flat.data;
  delete flat.trigger;
  return flat;
}

function buildWebhookTriggerOutput(triggerNode, pipeline, triggerData) {
  if (triggerData && Object.keys(triggerData).length > 0) {
    return normalizeWebhookBody(triggerData);
  }
  const inferred = {};
  for (const edge of pipeline.edges.filter((e) => e.source === triggerNode.id)) {
    const target = pipeline.nodes.find((n) => n.id === edge.target);
    if (!target) continue;
    for (const m of edge.dataMapping) {
      const val = target.config?.[m.toField];
      if (!isUnsetInput(val)) inferred[m.fromField] = val;
    }
  }
  const airbnbDefaults = pipeline.nodes.some((n) => n.actionId === "ab_search_listings")
    ? {
        query: "Pacific Heights, San Francisco",
        checkin: "2026-07-01",
        checkout: "2026-07-05",
        adults: "2",
      }
    : {};
  return { ...airbnbDefaults, ...inferred, ...(triggerNode.config ?? {}) };
}

const pipeline = {
  nodes: [
    {
      id: "t1",
      type: "trigger",
      actionId: "wire.trigger.webhook",
      config: {},
    },
    {
      id: "s1",
      type: "wireAction",
      actionId: "ab_search_listings",
      config: { currency: "INR", locale: "en-IN" },
    },
  ],
  edges: [
    {
      source: "t1",
      target: "s1",
      dataMapping: [
        { fromField: "query", toField: "query" },
        { fromField: "checkin", toField: "checkin" },
        { fromField: "checkout", toField: "checkout" },
        { fromField: "adults", toField: "adults" },
      ],
    },
  ],
};

const out = buildWebhookTriggerOutput(pipeline.nodes[0], pipeline, null);
if (!out.query) {
  console.error("FAIL: expected query in manual webhook output", out);
  process.exit(1);
}
console.log("OK manual webhook output includes query:", out.query);
