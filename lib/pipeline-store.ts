import { Pipeline } from "@/types";
import { kv } from "@vercel/kv";

const KV_PREFIX = "pipeline";
const WEBHOOK_PREFIX = "webhook";

function getUserKey(): string {
  return "default";
}

export async function listPipelines(): Promise<Pipeline[]> {
  const keys = await kv.keys(`${KV_PREFIX}:${getUserKey()}:*`);
  if (keys.length === 0) return [];
  const items = await Promise.all(keys.map((k) => kv.get<Pipeline>(k)));
  return items.filter((i): i is Pipeline => i !== null);
}

export async function listScheduledPipelines(): Promise<Pipeline[]> {
  const all = await listPipelines();
  return all.filter((p) => p.schedule && p.schedule.trim().length > 0);
}

export async function getPipeline(id: string): Promise<Pipeline | null> {
  try {
    return await kv.get<Pipeline>(`${KV_PREFIX}:${getUserKey()}:${id}`);
  } catch {
    return null;
  }
}

export async function getPipelineByWebhookId(webhookId: string): Promise<Pipeline | null> {
  try {
    const pipelineId = await kv.get<string>(`${WEBHOOK_PREFIX}:${webhookId}`);
    if (!pipelineId) return null;
    return getPipeline(pipelineId);
  } catch {
    return null;
  }
}

export async function createPipeline(pipeline: Pipeline): Promise<Pipeline> {
  await kv.set(
    `${KV_PREFIX}:${getUserKey()}:${pipeline.id}`,
    JSON.parse(JSON.stringify(pipeline))
  );
  if (pipeline.webhookId) {
    await kv.set(`${WEBHOOK_PREFIX}:${pipeline.webhookId}`, pipeline.id);
  }
  return pipeline;
}

export async function updatePipeline(id: string, pipeline: Pipeline): Promise<Pipeline | null> {
  const existing = await getPipeline(id);
  if (!existing) return null;
  if (existing.webhookId && existing.webhookId !== pipeline.webhookId) {
    await kv.del(`${WEBHOOK_PREFIX}:${existing.webhookId}`);
  }
  await kv.set(
    `${KV_PREFIX}:${getUserKey()}:${id}`,
    JSON.parse(JSON.stringify(pipeline))
  );
  if (pipeline.webhookId) {
    await kv.set(`${WEBHOOK_PREFIX}:${pipeline.webhookId}`, pipeline.id);
  }
  return pipeline;
}

export async function deletePipeline(id: string): Promise<void> {
  const existing = await getPipeline(id);
  if (existing?.webhookId) {
    await kv.del(`${WEBHOOK_PREFIX}:${existing.webhookId}`);
  }
  await kv.del(`${KV_PREFIX}:${getUserKey()}:${id}`);
}

export async function assignWebhook(
  pipelineId: string,
  webhookId: string
): Promise<Pipeline | null> {
  const pipeline = await getPipeline(pipelineId);
  if (!pipeline) return null;
  const updated = { ...pipeline, webhookId, updatedAt: new Date().toISOString() };
  return updatePipeline(pipelineId, updated);
}

export async function recordScheduledRun(
  pipelineId: string,
  status: "success" | "error" | "partial"
): Promise<void> {
  const pipeline = await getPipeline(pipelineId);
  if (!pipeline) return;
  const now = new Date().toISOString();
  await updatePipeline(pipelineId, {
    ...pipeline,
    lastScheduledRunAt: now,
    lastRunAt: now,
    lastRunStatus: status,
  });
}

/** Webhook/manual server runs — do not touch lastScheduledRunAt (cron dedupe). */
export async function recordPipelineRun(
  pipelineId: string,
  status: "success" | "error" | "partial"
): Promise<void> {
  const pipeline = await getPipeline(pipelineId);
  if (!pipeline) return;
  await updatePipeline(pipelineId, {
    ...pipeline,
    lastRunAt: new Date().toISOString(),
    lastRunStatus: status,
  });
}
