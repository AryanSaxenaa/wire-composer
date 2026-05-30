import { transformWithDeepSeek } from "@/lib/deepseek-transform";
import { ACTION_REGISTRY, getActionById } from "@/lib/action-registry";

export function isBuiltinAction(actionId: string): boolean {
  return actionId.startsWith("wire.");
}

export async function runBuiltinAction(
  actionId: string,
  inputs: Record<string, unknown>
): Promise<Record<string, unknown>> {
  switch (actionId) {
    case "wire.data.extract": {
      const source = (inputs.source ?? inputs) as Record<string, unknown>;
      const field = String(inputs.field ?? "price");
      const value =
        source[field] ??
        nestedGet(source, field) ??
        (typeof source.value !== "undefined" ? source.value : undefined);
      return { [field]: value, value, extracted: value };
    }

    case "wire.condition.compare": {
      const raw = inputs.value ?? inputs.price ?? Object.values(inputs)[0];
      const num = Number(raw);
      const threshold = Number(inputs.threshold ?? 0);
      const op = String(inputs.operator ?? "lt");
      let passed = false;
      if (!Number.isNaN(num)) {
        if (op === "lt") passed = num < threshold;
        else if (op === "lte") passed = num <= threshold;
        else if (op === "gt") passed = num > threshold;
        else if (op === "gte") passed = num >= threshold;
        else if (op === "eq") passed = num === threshold;
      } else {
        passed = String(raw) === String(inputs.compareTo ?? threshold);
      }
      return { passed, value: raw, threshold, operator: op };
    }

    case "wire.filter.reviews": {
      let reviews = inputs.reviews;
      if (reviews && typeof reviews === "object" && !Array.isArray(reviews)) {
        const nested = reviews as Record<string, unknown>;
        reviews = nested.reviews ?? nested.items ?? [];
      }
      const list = Array.isArray(reviews) ? reviews : [];
      const minStars = Number(inputs.minStars ?? 1);
      const maxStars = Number(inputs.maxStars ?? 1);
      const filtered = list.filter((r) => {
        const rating = Number((r as Record<string, unknown>).rating ?? (r as Record<string, unknown>).stars);
        return rating >= minStars && rating <= maxStars;
      });
      const first = filtered[0] as Record<string, unknown> | undefined;
      return {
        reviews: filtered,
        count: filtered.length,
        reviewId: first?.id ?? first?.reviewId ?? "",
        reviewText: first?.text ?? first?.title ?? "",
        rating: first?.rating ?? first?.stars,
      };
    }

    case "wire.ai.transform": {
      const prompt = String(inputs.prompt ?? "Write a short professional reply.");
      const context = JSON.stringify(inputs.reviewText ?? inputs.text ?? inputs, null, 2);
      const replyText = await transformWithDeepSeek(prompt, context);
      return { replyText, text: replyText };
    }

    case "wire.trigger.webhook": {
      const data = (inputs.triggerData ?? inputs.data ?? {}) as Record<string, unknown>;
      return { ...data, trigger: data };
    }

    default:
      throw new Error(`Unknown built-in action: ${actionId}`);
  }
}

function nestedGet(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split(".");
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return cur;
}

export function findClosestActionId(unknownId: string): string | undefined {
  const all = unknownId.split(".");
  const platform = all[0];
  const matches = ["linkedin", "amazon", "slack", "notion", "trustpilot", "github"].filter((p) =>
    unknownId.includes(p) || platform === p
  );
  if (matches[0]) {
    return ACTION_REGISTRY.find((a) => a.platform === matches[0])?.id;
  }
  return undefined;
}

export function getActionOrBuiltin(id: string) {
  return getActionById(id);
}
