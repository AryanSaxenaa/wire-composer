import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { mergeWithFallbackActions } from "@/lib/anakin-fallback-actions";
import { BUILTIN_ACTIONS, registerAnakinActions } from "@/lib/action-registry";
import { loadAnakinActions } from "@/lib/anakin-catalog";
import { WireAction } from "@/types";

const CACHE_KEY = "wire:actions:catalog:v3";
const CACHE_TTL_SEC = 10 * 60;

let memoryCache: WireAction[] | null = null;
let memoryCacheTs = 0;

function mergeCatalog(anakinActions: WireAction[]): WireAction[] {
  const merged = mergeWithFallbackActions(anakinActions);
  registerAnakinActions(merged);
  const byId = new Map<string, WireAction>();
  for (const a of BUILTIN_ACTIONS) byId.set(a.id, a);
  for (const a of merged) byId.set(a.id, a);
  return Array.from(byId.values());
}

async function getCachedActions(): Promise<WireAction[] | null> {
  try {
    const cached = await kv.get<WireAction[]>(CACHE_KEY);
    if (cached?.length) return cached;
  } catch {
    // KV not configured
  }
  return null;
}

async function setCachedActions(anakinActions: WireAction[]): Promise<void> {
  try {
    await kv.set(CACHE_KEY, anakinActions, { ex: CACHE_TTL_SEC });
  } catch {
    memoryCache = anakinActions;
    memoryCacheTs = Date.now();
  }
}

export async function GET() {
  const now = Date.now();
  if (memoryCache && now - memoryCacheTs < CACHE_TTL_SEC * 1000) {
    return NextResponse.json({ actions: mergeCatalog(memoryCache) });
  }

  const kvCached = await getCachedActions();
  if (kvCached) {
    memoryCache = kvCached;
    memoryCacheTs = now;
    return NextResponse.json({ actions: mergeCatalog(kvCached) });
  }

  try {
    const anakinActions = await loadAnakinActions();
    await setCachedActions(anakinActions);
    memoryCache = anakinActions;
    memoryCacheTs = now;
    return NextResponse.json({ actions: mergeCatalog(anakinActions) });
  } catch {
    const fallbacks = mergeWithFallbackActions([]);
    registerAnakinActions(fallbacks);
    return NextResponse.json({ actions: mergeCatalog([]) });
  }
}
