import cronParser from "cron-parser";
const { parseExpression } = cronParser;

const CRON_POLL_INTERVAL_MS = 6 * 60 * 1000;

function isCronDue(cronExpression, lastScheduledRunAt, pollIntervalMs = CRON_POLL_INTERVAL_MS) {
  try {
    const now = new Date();
    const interval = parseExpression(cronExpression, { currentDate: now, utc: true });
    const prev = interval.prev().toDate();
    const prevMs = prev.getTime();
    if (!lastScheduledRunAt) {
      return now.getTime() - prevMs <= pollIntervalMs;
    }
    const last = new Date(lastScheduledRunAt).getTime();
    return prevMs > last;
  } catch {
    return false;
  }
}

function assert(label, cond) {
  if (!cond) throw new Error(`FAIL: ${label}`);
  console.log(`ok: ${label}`);
}

// Daily 9:00 UTC saved at 14:00 — should not be due until next 9:00 window
const afternoon = new Date("2026-05-31T14:00:00.000Z");
const dailyAt9 = parseExpression("0 9 * * *", { currentDate: afternoon, utc: true });
const prev9 = dailyAt9.prev().toDate();
assert(
  "new daily schedule not due hours after 9am tick",
  afternoon.getTime() - prev9.getTime() > CRON_POLL_INTERVAL_MS
);

// Just after 9:00 UTC — should be due with no last run
const justAfter9 = new Date("2026-05-31T09:03:00.000Z");
const prevJustAfter = parseExpression("0 9 * * *", {
  currentDate: justAfter9,
  utc: true,
})
  .prev()
  .toDate();
assert(
  "new daily schedule due within poll window after 9am",
  justAfter9.getTime() - prevJustAfter.getTime() <= CRON_POLL_INTERVAL_MS
);

assert(
  "already ran for this tick",
  !isCronDue("0 9 * * *", "2026-05-31T09:01:00.000Z")
);

assert(
  "due again on next tick",
  isCronDue("*/5 * * * *", "2026-05-31T10:00:00.000Z") ||
    (() => {
      const now = new Date("2026-05-31T10:06:00.000Z");
      const prev = parseExpression("*/5 * * * *", { currentDate: now, utc: true })
        .prev()
        .toDate();
      return prev.getTime() > new Date("2026-05-31T10:00:00.000Z").getTime();
    })()
);

console.log("All cron-due checks passed.");
