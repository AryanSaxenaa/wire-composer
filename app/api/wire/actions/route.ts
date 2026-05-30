import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { BUILTIN_ACTIONS, registerAnakinActions } from "@/lib/action-registry";
import { loadAnakinActions } from "@/lib/anakin-catalog";
import { WireAction } from "@/types";

const CACHE_KEY = "wire:actions:catalog:v2";
const CACHE_TTL_SEC = 10 * 60;

let memoryCache: WireAction[] | null = null;
let memoryCacheTs = 0;

function mergeCatalog(anakinActions: WireAction[]): WireAction[] {
  registerAnakinActions(anakinActions);
  return [...BUILTIN_ACTIONS, ...anakinActions];
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
    registerAnakinActions([]);
    return NextResponse.json({ actions: BUILTIN_ACTIONS });
  }
}
