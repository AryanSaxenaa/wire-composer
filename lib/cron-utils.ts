import { parseExpression } from "cron-parser";

export function isCronDue(cronExpression: string, lastRunAt?: string): boolean {
  try {
    const interval = parseExpression(cronExpression, { utc: true });
    const prev = interval.prev().toDate();
    if (!lastRunAt) return true;
    const last = new Date(lastRunAt).getTime();
    return prev.getTime() > last;
  } catch {
    return false;
  }
}
