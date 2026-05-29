import { Pipeline } from "@/types";
import { kv } from "@vercel/kv";

const KV_PREFIX = "pipeline";

function getUserKey(): string {
  return "default";
}

export async function listPipelines(): Promise<Pipeline[]> {
  try {
    const keys = await kv.keys(`${KV_PREFIX}:${getUserKey()}:*`);
    if (keys.length === 0) return [];
    const items = await Promise.all(keys.map((k) => kv.get<Pipeline>(k)));
    return items.filter((i): i is Pipeline => i !== null);
  } catch {
    return [];
  }
}

export async function getPipeline(id: string): Promise<Pipeline | null> {
  try {
    return await kv.get<Pipeline>(`${KV_PREFIX}:${getUserKey()}:${id}`);
  } catch {
    return null;
  }
}

export async function createPipeline(pipeline: Pipeline): Promise<Pipeline> {
  try {
    await kv.set(
      `${KV_PREFIX}:${getUserKey()}:${pipeline.id}`,
      JSON.parse(JSON.stringify(pipeline))
    );
  } catch {
    // In-memory fallback handled via file
  }
  return pipeline;
}

export async function updatePipeline(id: string, pipeline: Pipeline): Promise<Pipeline> {
  try {
    await kv.set(
      `${KV_PREFIX}:${getUserKey()}:${id}`,
      JSON.parse(JSON.stringify(pipeline))
    );
  } catch {
    // Fallback
  }
  return pipeline;
}

export async function deletePipeline(id: string): Promise<void> {
  try {
    await kv.del(`${KV_PREFIX}:${getUserKey()}:${id}`);
  } catch {
    // Fallback
  }
}
