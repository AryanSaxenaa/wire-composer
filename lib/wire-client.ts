const ANAKIN_BASE = "https://api.anakin.io/v1";
const WIRE_TIMEOUT_MS = 30_000;

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
      }),
      signal: controller.signal,
    });

    const raw = await response.json().catch(() => ({}));

    if (!response.ok) {
      const status = response.status;
      if (status === 401) throw new Error("Unauthorized: Credentials invalid or expired");
      if (status === 429) throw new Error("Rate limit exceeded. Retry in 30s.");
      throw new Error(raw.message || `Wire action failed: ${status}`);
    }

    return {
      success: true,
      output: raw.output ?? raw,
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
  return data.actions ?? data ?? [];
}
