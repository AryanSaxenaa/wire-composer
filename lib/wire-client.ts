const ANAKIN_BASE = "https://api.anakin.io/v1";
const WIRE_TIMEOUT_MS = 30_000;
const POLL_INTERVAL_MS = 2_000;

type WireRunBody = {
  action: string;
  inputs: Record<string, unknown>;
  credentials: Record<string, string>;
};

function isPendingStatus(data: Record<string, unknown>): boolean {
  const status = String(data.status ?? data.state ?? "").toLowerCase();
  return ["pending", "queued", "running", "in_progress", "processing"].includes(status);
}

async function pollWireJob(
  jobId: string,
  startTime: number
): Promise<Record<string, unknown>> {
  while (Date.now() - startTime < WIRE_TIMEOUT_MS) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));

    const response = await fetch(`${ANAKIN_BASE}/holocron/run/${jobId}`, {
      headers: { "X-API-Key": process.env.ANAKIN_API_KEY! },
    });

    if (!response.ok) continue;

    const data = (await response.json()) as Record<string, unknown>;
    if (!isPendingStatus(data)) return data;
  }

  throw new Error("Wire action timed out after 30s");
}

export async function runWireAction(
  actionId: string,
  inputs: Record<string, unknown>,
  credentials: Record<string, string>
): Promise<{ success: boolean; output: Record<string, unknown>; rawResponse: unknown; durationMs: number }> {
  const start = Date.now();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), WIRE_TIMEOUT_MS);

  try {
    const response = await fetch(`${ANAKIN_BASE}/holocron/run`, {
      method: "POST",
      headers: {
        "X-API-Key": process.env.ANAKIN_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: actionId,
        inputs,
        credentials,
      } satisfies WireRunBody),
      signal: controller.signal,
    });

    let raw = (await response.json().catch(() => ({}))) as Record<string, unknown>;

    if (!response.ok) {
      const status = response.status;
      if (status === 401) throw new Error("Unauthorized: Credentials invalid or expired");
      if (status === 429) throw new Error("Rate limit exceeded. Retry in 30s.");
      throw new Error(String(raw.message || `Wire action failed: ${status}`));
    }

    if (isPendingStatus(raw)) {
      const jobId = String(raw.jobId ?? raw.id ?? "");
      if (jobId) {
        raw = await pollWireJob(jobId, start);
      }
    }

    return {
      success: true,
      output: (raw.output as Record<string, unknown>) ?? raw,
      rawResponse: raw,
      durationMs: Date.now() - start,
    };
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error("Wire action timed out after 30s");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function getWireActions(): Promise<unknown[]> {
  const response = await fetch(`${ANAKIN_BASE}/holocron/actions`, {
    headers: { "X-API-Key": process.env.ANAKIN_API_KEY! },
  });

  if (!response.ok) return [];

  const data = await response.json();
  return (data as { actions?: unknown[] }).actions ?? data ?? [];
}
