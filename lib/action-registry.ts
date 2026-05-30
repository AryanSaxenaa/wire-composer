import { WireAction } from "@/types";

/** Local transform/trigger steps — not Anakin Wire catalog actions. */
export const BUILTIN_ACTIONS: WireAction[] = [
  {
    id: "wire.data.extract",
    platform: "wire",
    name: "Extract Field",
    description: "Pick a field from upstream JSON output",
    category: "transform",
    requiresAuth: false,
    inputFields: [
      { key: "field", label: "Field", type: "string", required: true, description: "Field key to extract", example: "price" },
      { key: "source", label: "Source", type: "object", required: false, description: "Upstream payload (auto-mapped)" },
    ],
    outputFields: [
      { key: "value", label: "Value", type: "string", required: true, description: "Extracted value" },
    ],
  },
  {
    id: "wire.condition.compare",
    platform: "wire",
    name: "Compare / Condition",
    description: "Compare a numeric or string value against a threshold",
    category: "transform",
    requiresAuth: false,
    inputFields: [
      { key: "value", label: "Value", type: "string", required: false, description: "Value to compare" },
      { key: "threshold", label: "Threshold", type: "number", required: true, description: "Threshold", example: "29.99" },
      { key: "operator", label: "Operator", type: "string", required: false, description: "lt, lte, gt, gte, eq", example: "lt" },
    ],
    outputFields: [
      { key: "passed", label: "Passed", type: "boolean", required: true, description: "Whether condition passed" },
    ],
  },
  {
    id: "wire.filter.reviews",
    platform: "wire",
    name: "Filter Reviews",
    description: "Filter review list by star rating",
    category: "transform",
    requiresAuth: false,
    inputFields: [
      { key: "reviews", label: "Reviews", type: "object", required: true, description: "Review array from upstream" },
      { key: "minStars", label: "Min stars", type: "number", required: false, description: "Minimum rating", example: "1" },
      { key: "maxStars", label: "Max stars", type: "number", required: false, description: "Maximum rating", example: "1" },
    ],
    outputFields: [
      { key: "reviews", label: "Filtered", type: "object", required: true, description: "Filtered reviews" },
      { key: "reviewId", label: "Review ID", type: "string", required: false, description: "First matching review ID" },
      { key: "reviewText", label: "Review text", type: "string", required: false, description: "First review body" },
    ],
  },
  {
    id: "wire.ai.transform",
    platform: "wire",
    name: "AI Transform",
    description: "Generate text with DeepSeek from upstream context",
    category: "transform",
    requiresAuth: false,
    inputFields: [
      { key: "prompt", label: "Prompt", type: "string", required: true, description: "Instruction for the model" },
      { key: "reviewText", label: "Context", type: "string", required: false, description: "Text to transform" },
    ],
    outputFields: [
      { key: "replyText", label: "Reply", type: "string", required: true, description: "Generated text" },
    ],
  },
  {
    id: "wire.trigger.webhook",
    platform: "wire",
    name: "Webhook Trigger",
    description: "Expose POST body as trigger.data for downstream nodes",
    category: "read",
    requiresAuth: false,
    inputFields: [
      { key: "triggerData", label: "Trigger data", type: "object", required: false, description: "Webhook JSON body" },
    ],
    outputFields: [
      { key: "trigger", label: "Trigger", type: "object", required: true, description: "Full trigger payload" },
    ],
  },
];

let anakinIndex = new Map<string, WireAction>();

export function registerAnakinActions(actions: WireAction[]): void {
  anakinIndex = new Map(actions.map((a) => [a.id, a]));
}

export function getAllRegisteredActions(): WireAction[] {
  const merged = new Map<string, WireAction>();
  for (const a of BUILTIN_ACTIONS) merged.set(a.id, a);
  for (const [id, a] of anakinIndex) merged.set(id, a);
  return Array.from(merged.values());
}

/** @deprecated Use getAllRegisteredActions(); kept for imports that expect a static list. */
export const ACTION_REGISTRY: WireAction[] = BUILTIN_ACTIONS;

export function getActionById(id: string): WireAction | undefined {
  return BUILTIN_ACTIONS.find((a) => a.id === id) ?? anakinIndex.get(id);
}

export function getActionsByPlatform(platform: string): WireAction[] {
  return getAllRegisteredActions().filter((a) => a.platform === platform);
}

export function getActionsByCategory(category: WireAction["category"]): WireAction[] {
  return getAllRegisteredActions().filter((a) => a.category === category);
}
