import { transformWithDeepSeek } from "@/lib/deepseek-transform";
import { getActionById, getAllRegisteredActions } from "@/lib/action-registry";
import { isUnsetInput } from "@/lib/input-utils";
import { firstListingId } from "@/lib/listing-id";
import { firstPolymarketMarketId, firstPolymarketTokenId } from "@/lib/polymarket-id";
import { coerceWireParamValue } from "@/lib/wire-param-coerce";

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
      let value: unknown =
        source[field] ??
        nestedGet(source, field) ??
        (typeof source.value !== "undefined" ? source.value : undefined);

      if (isUnsetInput(value) && /listing/i.test(field)) {
        value = firstListingId(source);
      }
      if (isUnsetInput(value) && field === "market_id") {
        value = firstPolymarketMarketId(source);
      }
      if (isUnsetInput(value) && field === "token_id") {
        value = firstPolymarketTokenId(source);
      }
      if (isUnsetInput(value) && field === "title") {
        value = nestedGet(source, "listings.0.title") ?? nestedGet(source, "title");
      }

      const out: Record<string, unknown> = {};
      if (!isUnsetInput(value)) {
        const coerced = coerceWireParamValue(field, value);
        out.value = coerced;
        out.extracted = coerced;
        const canonical = canonicalExtractOutputKey(field);
        if (canonical) out[canonical] = coerced;
      }
      return out;
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

function canonicalExtractOutputKey(field: string): string | null {
  if (field === "market_id" || field === "token_id") return field;
  if (/listing_id/i.test(field) || field.endsWith(".id")) return "listing_id";
  const parts = field.split(".").filter((p) => !/^\d+$/.test(p));
  const last = parts[parts.length - 1];
  return last && last !== "listings" ? last : "value";
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
  const matches = ["linkedin", "amazon", "slack", "notion", "trustpilot", "github", "polymarket", "pm_"].filter((p) =>
    unknownId.includes(p) || platform === p
  );
  if (matches[0]) {
    return getAllRegisteredActions().find((a) => a.platform === matches[0])?.id;
  }
  return undefined;
}
