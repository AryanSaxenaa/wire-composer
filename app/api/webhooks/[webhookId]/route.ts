import { NextRequest, NextResponse } from "next/server";
import { getPipelineByWebhookId, recordScheduledRun } from "@/lib/pipeline-store";
import { executePipeline } from "@/lib/pipeline-executor";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ webhookId: string }> }
) {
  const { webhookId } = await params;
  const pipeline = await getPipelineByWebhookId(webhookId);

  if (!pipeline) {
    return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
  }

  let triggerData: Record<string, unknown> = {};
  try {
    triggerData = await req.json();
  } catch {
    triggerData = {};
  }

  const logs: { event: string; data: Record<string, unknown> }[] = [];
  const { success, nodeOutputs } = await executePipeline(
    { pipeline, triggerData },
    (event, data) => {
      logs.push({ event, data });
    }
  );

  await recordScheduledRun(pipeline.id, success ? "success" : "error");

  return NextResponse.json({
    success,
    pipelineId: pipeline.id,
    runId: logs.find((l) => l.event === "pipeline_complete")?.data?.runId,
    nodeOutputs,
    logs,
  });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ webhookId: string }> }
) {
  const { webhookId } = await params;
  const pipeline = await getPipelineByWebhookId(webhookId);
  if (!pipeline) {
    return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
  }
  return NextResponse.json({
    pipelineId: pipeline.id,
    name: pipeline.name,
    hint: "POST JSON body to run this pipeline. Fields are available as trigger.data.",
  });
}
