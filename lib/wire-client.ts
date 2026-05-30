const ANAKIN_BASE = "https://api.anakin.io/v1";
const WIRE_BASE = `${ANAKIN_BASE}/wire`;
const WIRE_TIMEOUT_MS = 30_000;
const POLL_INTERVAL_MS = 2_500;

type WireTaskBody = {
  action_id: string;
  params: Record<string, unknown>;
  credential_id?: string;
};

type AnakinErrorDetail = {
  code?: string;
  message?: string;
  connect_url?: string;
};

function getApiKey(): string {
  const key = process.env.ANAKIN_API_KEY;
  if (!key) throw new Error("ANAKIN_API_KEY is not configured");
  return key;
}

function anakinHeaders(): HeadersInit {
  return {
    "X-API-Key": getApiKey(),
    "Content-Type": "application/json",
  };
}

function resolveCredentialId(credentials: Record<string, string>): string | undefined {
  const fromCreds =
    credentials.credential_id?.trim() ||
    credentials.credentialId?.trim() ||
    credentials.credential?.trim();
  if (fromCreds) return fromCreds;

  const platform = credentials.platform?.trim();
  if (platform) {
    const prefix = `WIRE_CRED_${platform.toUpperCase().replace(/-/g, "_")}`;
    const envId = process.env[`${prefix}_CREDENTIAL_ID`]?.trim();
    if (envId) return envId;
  }

  return process.env.ANAKIN_CREDENTIAL_ID?.trim() || undefined;
}

const CREDENTIAL_PARAM_KEYS = new Set([
  "credential_id",
  "credentialId",
  "credential",
  "username",
  "password",
  "sessionCookie",
  "gateField",
  "gateValue",
  "triggerData",
]);

function buildTaskParams(inputs: Record<string, unknown>): Record<string, unknown> {
  const params: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(inputs)) {
    if (!CREDENTIAL_PARAM_KEYS.has(key)) params[key] = value;
  }
  return params;
}

function normalizeStatus(data: Record<string, unknown>): string {
  return String(data.status ?? "").toLowerCase();
}

function isPendingStatus(status: string): boolean {
  return ["pending", "processing", "queued", "running", "in_progress"].includes(status);
}

function extractErrorMessage(body: Record<string, unknown>, httpStatus: number): string {
  const err = body.error;
  if (typeof err === "string" && err) return err;
  if (typeof err === "object" && err !== null) {
    const detail = err as AnakinErrorDetail;
    const code = detail.code ? `[${detail.code}] ` : "";
    const connect =
      detail.connect_url && !detail.message?.includes(detail.connect_url)
        ? ` Connect: https://anakin.io${detail.connect_url}`
        : "";
    return `${code}${detail.message || "Request failed"}${connect}`;
  }
  if (typeof body.message === "string" && body.message) return body.message;
  return `Wire action failed: ${httpStatus}`;
}

function throwForHttpError(httpStatus: number, body: Record<string, unknown>): never {
  const message = extractErrorMessage(body, httpStatus);
  const code =
    typeof body.error === "object" && body.error !== null
      ? (body.error as AnakinErrorDetail).code
      : undefined;

  if (httpStatus === 401 || code === "AUTH_REQUIRED" || code === "AUTH_EXPIRED") {
    throw new Error(`Unauthorized: ${message}`);
  }
  if (httpStatus === 402 || code === "INSUFFICIENT_CREDITS") {
    throw new Error(`Insufficient credits: ${message}`);
  }
  if (httpStatus === 429 || code === "rate_limit_exceeded") {
    throw new Error("Rate limit exceeded. Retry in 30s.");
  }
  throw new Error(message);
}

function completedOutput(data: Record<string, unknown>): Record<string, unknown> {
  if (data.data && typeof data.data === "object" && !Array.isArray(data.data)) {
    return data.data as Record<string, unknown>;
  }
  if (data.output && typeof data.output === "object" && !Array.isArray(data.output)) {
    return data.output as Record<string, unknown>;
  }
  return data;
}

async function pollWireJob(
  jobId: string,
  startTime: number
): Promise<Record<string, unknown>> {
  while (Date.now() - startTime < WIRE_TIMEOUT_MS) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));

    const response = await fetch(`${WIRE_BASE}/jobs/${jobId}`, {
      headers: { "X-API-Key": getApiKey() },
    });

    if (!response.ok) {
      if (response.status === 429) {
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
        continue;
      }
      const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
      throwForHttpError(response.status, body);
    }

    const data = (await response.json()) as Record<string, unknown>;
    const status = normalizeStatus(data);

    if (status === "completed") return data;
    if (status === "failed") {
      throw new Error(extractErrorMessage(data, response.status));
    }
    if (status && !isPendingStatus(status)) {
      throw new Error(`Wire job ended with unexpected status: ${status}`);
    }
  }

  throw new Error("Wire action timed out after 30s");
}

export async function runWireAction(
  actionId: string,
  inputs: Record<string, unknown>,
  credentials: Record<string, string>
): Promise<{
  success: boolean;
  output: Record<string, unknown>;
  rawResponse: unknown;
  durationMs: number;
}> {
  const start = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), WIRE_TIMEOUT_MS);

  try {
    const taskBody: WireTaskBody = {
      action_id: actionId,
      params: buildTaskParams(inputs),
    };

    const credentialId = resolveCredentialId(credentials);
    if (credentialId) taskBody.credential_id = credentialId;

    const response = await fetch(`${WIRE_BASE}/task`, {
      method: "POST",
      headers: anakinHeaders(),
      body: JSON.stringify(taskBody),
      signal: controller.signal,
    });

    let raw = (await response.json().catch(() => ({}))) as Record<string, unknown>;

    if (!response.ok) {
      throwForHttpError(response.status, raw);
    }

    const submitStatus = normalizeStatus(raw);
    if (submitStatus === "error") {
      throwForHttpError(response.status, raw);
    }

    if (submitStatus === "completed") {
      return {
        success: true,
        output: completedOutput(raw),
        rawResponse: raw,
        durationMs: Date.now() - start,
      };
    }

    if (submitStatus === "failed") {
      throw new Error(extractErrorMessage(raw, response.status));
    }

    const jobId = String(raw.job_id ?? raw.jobId ?? "");
    if (isPendingStatus(submitStatus) || (!submitStatus && !raw.data)) {
      if (!jobId) {
        throw new Error("Wire task submitted without job_id — cannot poll for results");
      }
      raw = await pollWireJob(jobId, start);
      const finalStatus = normalizeStatus(raw);
      if (finalStatus === "failed") {
        throw new Error(extractErrorMessage(raw, 200));
      }
      if (finalStatus !== "completed") {
        throw new Error(`Wire job ended with status: ${finalStatus || "unknown"}`);
      }
    }

    return {
      success: true,
      output: completedOutput(raw),
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

type WireSearchResult = {
  action_id: string;
  catalog_slug?: string;
  catalog_name?: string;
  name?: string;
  description?: string;
  auth_mode?: string;
  auth_required?: boolean;
  params?: {
    properties?: Record<string, { type?: string; description?: string }>;
    required?: string[];
  };
};

function schemaFieldType(jsonType?: string): "string" | "url" | "number" | "boolean" | "object" {
  switch (jsonType) {
    case "integer":
    case "number":
      return "number";
    case "boolean":
      return "boolean";
    case "object":
    case "array":
      return "object";
    default:
      return "string";
  }
}

function mapSearchResultToWireAction(result: WireSearchResult) {
  const properties = result.params?.properties ?? {};
  const required = new Set(result.params?.required ?? []);

  return {
    id: result.action_id,
    platform: result.catalog_slug ?? "wire",
    name: result.name ?? result.action_id,
    description: result.description ?? "",
    category: "read" as const,
    requiresAuth:
      result.auth_mode === "required" || result.auth_mode === "optional" || !!result.auth_required,
    inputFields: Object.entries(properties).map(([key, schema]) => ({
      key,
      label: key,
      type: schemaFieldType(schema.type),
      required: required.has(key),
      description: schema.description ?? "",
    })),
    outputFields: [{ key: "data", label: "Data", type: "object" as const, required: true, description: "Action result" }],
  };
}

/** @deprecated Prefer loadAnakinActions() for the full catalog. */
export async function getWireActions(): Promise<unknown[]> {
  const { loadAnakinActions } = await import("@/lib/anakin-catalog");
  return loadAnakinActions();
}
