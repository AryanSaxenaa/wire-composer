import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { assignWebhook, getPipeline } from "@/lib/pipeline-store";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const pipeline = await getPipeline(id);
  if (!pipeline) {
    return NextResponse.json({ error: "Pipeline not found" }, { status: 404 });
  }

  const webhookId = pipeline.webhookId || nanoid(12);
  const updated = await assignWebhook(id, webhookId);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return NextResponse.json({
    pipeline: updated,
    webhookId,
    webhookUrl: `${baseUrl}/api/webhooks/${webhookId}`,
  });
}
