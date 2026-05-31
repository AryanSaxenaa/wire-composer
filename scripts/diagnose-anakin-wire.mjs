/**
 * Anakin-only Wire diagnostic (no third-party APIs).
 * Usage: node --env-file=.env.local scripts/diagnose-anakin-wire.mjs [action_id]
 */

const API = "https://api.anakin.io/v1/wire";
const key = process.env.ANAKIN_API_KEY;
const actionId = process.argv[2] || "gh_user_repos";
const params =
  actionId === "gh_user_repos"
    ? { username: "octocat" }
    : actionId === "ph_trending"
      ? {}
      : {};

if (!key) {
  console.error("ANAKIN_API_KEY missing");
  process.exit(1);
}

const headers = { "X-API-Key": key, "Content-Type": "application/json" };

console.log("Action:", actionId, "params:", params);

const sub = await fetch(`${API}/task`, {
  method: "POST",
  headers,
  body: JSON.stringify({ action_id: actionId, params }),
});
const submit = await sub.json();
console.log("POST /task", sub.status, submit);

if (submit.status === "error" || submit.error) {
  console.error("Submit error:", JSON.stringify(submit, null, 2));
  process.exit(2);
}

const jobId = submit.job_id;
if (!jobId) {
  console.error("No job_id");
  process.exit(2);
}

const t0 = Date.now();
const maxMs = 300_000;

while (Date.now() - t0 < maxMs) {
  const pr = await fetch(`${API}/jobs/${jobId}`, { headers: { "X-API-Key": key } });
  const body = await pr.json();
  const status = (body.status || "").toLowerCase();
  console.log(
    `${Math.round((Date.now() - t0) / 1000)}s`,
    status,
    body.retry_after_ms != null ? `retry_after_ms=${body.retry_after_ms}` : "",
    body.error ? JSON.stringify(body.error) : ""
  );

  if (status === "completed") {
    console.log("SUCCESS data keys:", Object.keys(body.data || {}));
    process.exit(0);
  }
  if (status === "failed") {
    console.error("FAILED", JSON.stringify(body, null, 2));
    process.exit(1);
  }

  const wait =
    typeof body.retry_after_ms === "number" && body.retry_after_ms > 0
      ? body.retry_after_ms
      : 3000;
  await new Promise((r) => setTimeout(r, wait));
}

console.error("Timed out after 5m still processing — likely Anakin queue/worker issue, not client params.");
process.exit(1);
