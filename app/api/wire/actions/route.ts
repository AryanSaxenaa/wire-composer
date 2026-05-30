import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { ACTION_REGISTRY } from "@/lib/action-registry";
import { getWireActions } from "@/lib/wire-client";
import { WireAction } from "@/types";

const CACHE_KEY = "wire:actions:catalog";
const CACHE_TTL_SEC = 10 * 60;

let memoryCache: WireAction[] | null = null;
let memoryCacheTs = 0;

async function getCachedActions(): Promise<WireAction[] | null> {
  try {
    const cached = await kv.get<WireAction[]>(CACHE_KEY);
    if (cached?.length) return cached;
  } catch {
    // KV not configured — fall through
  }
  return null;
}

async function setCachedActions(actions: WireAction[]): Promise<void> {
  try {
    await kv.set(CACHE_KEY, actions, { ex: CACHE_TTL_SEC });
  } catch {
    memoryCache = actions;
    memoryCacheTs = Date.now();
  }
}

export async function GET() {
  const now = Date.now();
  if (memoryCache && now - memoryCacheTs < CACHE_TTL_SEC * 1000) {
    return NextResponse.json({ actions: memoryCache });
  }

  const kvCached = await getCachedActions();
  if (kvCached) {
    memoryCache = kvCached;
    memoryCacheTs = now;
    return NextResponse.json({ actions: kvCached });
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
        return { ...local, ...(remote as object) } as WireAction;
      }
      return local;
    });

    await setCachedActions(merged);
    memoryCache = merged;
    memoryCacheTs = now;
    return NextResponse.json({ actions: merged });
  } catch {
    const fallback = ACTION_REGISTRY;
    await setCachedActions(fallback);
    return NextResponse.json({ actions: fallback });
  }
}
