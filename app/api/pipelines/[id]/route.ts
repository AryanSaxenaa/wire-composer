import { NextRequest, NextResponse } from "next/server";
import { getPipeline, updatePipeline, deletePipeline } from "@/lib/pipeline-store";
import { sanitizePipelineForStorage } from "@/lib/sanitize-pipeline";
import { Pipeline } from "@/types";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const pipeline = await getPipeline(id);
  if (!pipeline) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ pipeline });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let body: Pipeline;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const pipeline = await updatePipeline(
    id,
    sanitizePipelineForStorage({
      ...body,
      id,
    })
  );
  if (!pipeline) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ pipeline });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const existing = await getPipeline(id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await deletePipeline(id);
  return NextResponse.json({ success: true });
}
