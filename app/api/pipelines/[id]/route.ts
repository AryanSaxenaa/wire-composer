import { NextRequest, NextResponse } from "next/server";
import { getPipeline, updatePipeline, deletePipeline } from "@/lib/pipeline-store";
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
  const body: Pipeline = await req.json();
  const pipeline = await updatePipeline(id, {
    ...body,
    id,
    updatedAt: new Date().toISOString(),
  });
  return NextResponse.json({ pipeline });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await deletePipeline(id);
  return NextResponse.json({ success: true });
}
