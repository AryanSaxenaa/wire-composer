const ANAKIN_BASE = "https://api.anakin.io/v1";

export async function runWireAction(
  actionId: string,
  inputs: Record<string, unknown>,
  credentials: Record<string, string>
): Promise<{ success: boolean; output: Record<string, unknown>; rawResponse: unknown; durationMs: number }> {
  const start = Date.now();

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
  });

  const raw = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(raw.message || `Wire action failed: ${response.status}`);
  }

  return {
    success: true,
    output: raw.output ?? raw,
    rawResponse: raw,
    durationMs: Date.now() - start,
  };
}

export async function getWireActions(): Promise<unknown[]> {
  const response = await fetch(`${ANAKIN_BASE}/holocron/actions`, {
    headers: { "X-API-Key": process.env.ANAKIN_API_KEY! },
  });

  if (!response.ok) return [];

  const data = await response.json();
  return data.actions ?? data ?? [];
}
