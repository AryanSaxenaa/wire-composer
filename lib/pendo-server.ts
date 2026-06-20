const PENDO_DATA_HOST = "https://data.pendo.io";
const PENDO_INTEGRATION_KEY = "7825c15b-1fa2-4a62-bfa8-42239bd36b16";

export async function pendoTrackServer(
  event: string,
  properties: Record<string, unknown> = {},
  options?: { visitorId?: string; accountId?: string }
): Promise<void> {
  try {
    await fetch(`${PENDO_DATA_HOST}/data/track`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-pendo-integration-key": PENDO_INTEGRATION_KEY,
      },
      body: JSON.stringify({
        type: "track",
        event,
        visitorId: options?.visitorId ?? "system",
        accountId: options?.accountId ?? "system",
        timestamp: Date.now(),
        properties,
      }),
    });
  } catch {
    // Don't let tracking failures break application flow
  }
}
