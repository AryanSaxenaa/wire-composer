import { WireAction, ActionField } from "@/types";

const ANAKIN_BASE = "https://api.anakin.io/v1/wire";
const CACHE_TTL_MS = 10 * 60 * 1000;

type CatalogParam = {
  name: string;
  type?: string;
  required?: boolean;
  description?: string;
  default?: unknown;
};

type CatalogAction = {
  action_id: string;
  name?: string;
  description?: string;
  type?: string;
  status?: string;
  auth_mode?: string;
  auth_required?: boolean;
  parameters?: CatalogParam[] | {
    properties?: Record<string, { type?: string; description?: string }>;
    required?: string[];
  };
};

type CatalogEntry = {
  slug: string;
  name?: string;
  category?: string;
};

let memoryCache: WireAction[] | null = null;
let memoryCacheTs = 0;
let loadPromise: Promise<WireAction[]> | null = null;

function getApiKey(): string | undefined {
  return process.env.ANAKIN_API_KEY?.trim() || undefined;
}

function schemaFieldType(jsonType?: string): ActionField["type"] {
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

function inferCategory(actionType?: string): WireAction["category"] {
  const t = (actionType ?? "").toLowerCase();
  if (t.includes("write") || t.includes("send") || t.includes("post")) return "write";
  if (t.includes("search")) return "search";
  if (t.includes("monitor")) return "monitor";
  if (t.includes("transform")) return "transform";
  return "read";
}

function normalizeParameters(
  parameters: CatalogAction["parameters"]
): { fields: ActionField[]; required: Set<string> } {
  if (!parameters) return { fields: [], required: new Set() };

  if (Array.isArray(parameters)) {
    const fields = parameters.map((p) => ({
      key: p.name,
      label: p.name,
      type: schemaFieldType(p.type),
      required: !!p.required,
      description: p.description ?? "",
      example: p.default != null ? String(p.default) : undefined,
    }));
    return {
      fields,
      required: new Set(parameters.filter((p) => p.required).map((p) => p.name)),
    };
  }

  const properties = parameters.properties ?? {};
  const required = new Set(parameters.required ?? []);
  const fields = Object.entries(properties).map(([key, schema]) => ({
    key,
    label: key,
    type: schemaFieldType(schema.type),
    required: required.has(key),
    description: schema.description ?? "",
  }));
  return { fields, required };
}

export function mapAnakinActionToWireAction(
  action: CatalogAction,
  catalog: CatalogEntry
): WireAction {
  const { fields } = normalizeParameters(action.parameters);
  const authMode: WireAction["authMode"] =
    action.auth_mode === "required" || action.auth_mode === "optional" || action.auth_mode === "none"
      ? action.auth_mode
      : action.auth_required
        ? "required"
        : "none";
  const requiresAuth = authMode === "required";

  return {
    id: action.action_id,
    platform: catalog.slug,
    name: action.name ?? action.action_id,
    description: action.description ?? "",
    category: inferCategory(action.type),
    requiresAuth,
    authMode,
    inputFields: fields,
    outputFields: [
      {
        key: "data",
        label: "Data",
        type: "object",
        required: true,
        description: "Structured result from Anakin Wire",
      },
    ],
  };
}

async function fetchCatalogSlugs(apiKey: string): Promise<CatalogEntry[]> {
  const response = await fetch(`${ANAKIN_BASE}/catalog`, {
    headers: { "X-API-Key": apiKey },
  });
  if (!response.ok) return [];
  const data = (await response.json()) as { catalog?: CatalogEntry[] };
  return Array.isArray(data.catalog) ? data.catalog : [];
}

async function fetchCatalogActions(
  apiKey: string,
  slug: string
): Promise<WireAction[]> {
  const response = await fetch(`${ANAKIN_BASE}/catalog/${slug}`, {
    headers: { "X-API-Key": apiKey },
  });
  if (!response.ok) return [];

  const data = (await response.json()) as {
    catalog?: CatalogEntry;
    actions?: CatalogAction[];
  };
  const catalog = data.catalog ?? { slug };
  if (!Array.isArray(data.actions)) return [];

  return data.actions
    .filter((a) => a.action_id && a.status !== "pending_review")
    .map((a) => mapAnakinActionToWireAction(a, catalog));
}

async function fetchAllAnakinActions(apiKey: string): Promise<WireAction[]> {
  const catalogs = await fetchCatalogSlugs(apiKey);
  const batchSize = 12;
  const actions: WireAction[] = [];

  for (let i = 0; i < catalogs.length; i += batchSize) {
    const batch = catalogs.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map((c) => fetchCatalogActions(apiKey, c.slug))
    );
    for (const list of results) actions.push(...list);
  }

  const byId = new Map<string, WireAction>();
  for (const action of actions) byId.set(action.id, action);
  return Array.from(byId.values()).sort((a, b) =>
    a.platform.localeCompare(b.platform) || a.name.localeCompare(b.name)
  );
}

export async function loadAnakinActions(force = false): Promise<WireAction[]> {
  const apiKey = getApiKey();
  if (!apiKey) return [];

  const now = Date.now();
  if (!force && memoryCache && now - memoryCacheTs < CACHE_TTL_MS) {
    return memoryCache;
  }

  if (!force && loadPromise) return loadPromise;

  loadPromise = fetchAllAnakinActions(apiKey)
    .then((actions) => {
      memoryCache = actions;
      memoryCacheTs = Date.now();
      return actions;
    })
    .finally(() => {
      loadPromise = null;
    });

  return loadPromise;
}

export function getCachedAnakinActions(): WireAction[] {
  return memoryCache ?? [];
}
