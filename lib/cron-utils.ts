import { parseExpression } from "cron-parser";

/** Scheduler polls every 5 minutes; add slack so a tick is not missed between checks. */
export const CRON_POLL_INTERVAL_MS = 6 * 60 * 1000;

/**
 * True when the pipeline's cron expression has a tick since lastScheduledRunAt
 * that we have not executed yet. Uses UTC to match server cron jobs.
 */
export function isCronDue(
  cronExpression: string,
  lastScheduledRunAt?: string,
  pollIntervalMs: number = CRON_POLL_INTERVAL_MS
): boolean {
  try {
    const now = new Date();
    const interval = parseExpression(cronExpression, { currentDate: now, utc: true });
    const prev = interval.prev().toDate();
    const prevMs = prev.getTime();

    if (!lastScheduledRunAt) {
      // New schedule: do not run on every 5-min poll until the next real cron tick.
      return now.getTime() - prevMs <= pollIntervalMs;
    }

    const last = new Date(lastScheduledRunAt).getTime();
    return prevMs > last;
  } catch {
    return false;
  }
}
