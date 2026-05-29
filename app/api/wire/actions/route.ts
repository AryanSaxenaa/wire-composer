import { NextResponse } from "next/server";
import { ACTION_REGISTRY } from "@/lib/action-registry";
import { getWireActions } from "@/lib/wire-client";

let cachedActions: unknown[] | null = null;
let cacheTs = 0;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export async function GET() {
  const now = Date.now();
  if (cachedActions && now - cacheTs < CACHE_TTL) {
    return NextResponse.json({ actions: cachedActions });
  }

  try {
    const remoteActions = await getWireActions();

    const merged = ACTION_REGISTRY.map((local) => {
      const remote = Array.isArray(remoteActions)
        ? remoteActions.find(
            (r: unknown) =>
              typeof r === "object" && r !== null && (r as Record<string, unknown>).id === local.id
          )
        : null;
      if (remote && typeof remote === "object" && remote !== null) {
        return { ...local, ...(remote as object) };
      }
      return local;
    });

    cachedActions = merged;
    cacheTs = now;
    return NextResponse.json({ actions: merged });
  } catch {
    // If remote fetch fails, fall back to registry
    cachedActions = ACTION_REGISTRY;
    cacheTs = now;
    return NextResponse.json({ actions: ACTION_REGISTRY });
  }
}
