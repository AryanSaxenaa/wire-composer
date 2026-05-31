/**
 * Smoke-test Save + Schedule cron auth + Webhook on a deployed instance.
 *
 *   node scripts/verify-server-automation.mjs
 *   BASE_URL=https://your-app.run.app CRON_SECRET=... node scripts/verify-server-automation.mjs
 *
 * Requires KV env vars only on the server; this script only calls HTTP APIs.
 */

const BASE_URL = (process.env.BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "").replace(
  /\/$/,
  ""
);
const CRON_SECRET = process.env.CRON_SECRET || "";

if (!BASE_URL) {
  console.error("Set BASE_URL or NEXT_PUBLIC_APP_URL");
  process.exit(1);
}

async function json(method, path, body, headers = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const minimalPipeline = {
  name: `automation-smoke-${Date.now()}`,
  nodes: [
    {
      id: "n1",
      type: "action",
      platform: "wire",
      actionId: "wire.data.extract",
      label: "Extract",
      position: { x: 0, y: 0 },
      config: { path: "hello" },
      credentials: {},
    },
  ],
  edges: [],
  schedule: "0 9 * * *",
};

console.log("BASE_URL", BASE_URL);

const created = await json("POST", "/api/pipelines", minimalPipeline);
assert(created.ok, `create pipeline: ${created.status} ${JSON.stringify(created.data)}`);
const id = created.data.pipeline?.id;
assert(id, "pipeline id missing");
console.log("created", id);

const got = await json("GET", `/api/pipelines/${id}`);
assert(got.ok && got.data.pipeline?.schedule === "0 9 * * *", "schedule not persisted");

const webhook = await json("POST", `/api/pipelines/${id}/webhook`);
assert(webhook.ok && webhook.data.webhookUrl, `webhook deploy: ${webhook.status}`);
const webhookUrl = webhook.data.webhookUrl;
console.log("webhook", webhookUrl);

const hookGet = await fetch(webhookUrl);
const hookGetData = await hookGet.json();
assert(hookGet.ok, "webhook GET hint failed");

const hookPost = await fetch(webhookUrl, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ ping: true }),
});
const hookPostData = await hookPost.json();
assert(
  hookPost.ok && typeof hookPostData.success === "boolean",
  `webhook POST: ${hookPost.status} ${JSON.stringify(hookPostData)}`
);
console.log("webhook run success=", hookPostData.success);

if (CRON_SECRET) {
  const cronRes = await fetch(`${BASE_URL}/api/cron/run-scheduled`, {
    headers: { Authorization: `Bearer ${CRON_SECRET}` },
  });
  const cronData = await cronRes.json();
  assert(cronRes.ok, `cron: ${cronRes.status} ${JSON.stringify(cronData)}`);
  console.log("cron tick", cronData);
} else {
  console.warn("CRON_SECRET not set — skipping /api/cron/run-scheduled");
}

await json("DELETE", `/api/pipelines/${id}`);
console.log("cleanup ok");
console.log("All server automation checks passed.");
