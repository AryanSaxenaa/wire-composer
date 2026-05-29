import { NextRequest, NextResponse } from "next/server";
import { listPipelines, createPipeline } from "@/lib/pipeline-store";
import { Pipeline } from "@/types";
import { nanoid } from "nanoid";

export async function GET() {
  try {
    const pipelines = await listPipelines();
    return NextResponse.json({ pipelines });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to list";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: Pipeline = await req.json();
    const pipeline: Pipeline = {
      ...body,
      id: body.id || nanoid(),
      createdAt: body.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const created = await createPipeline(pipeline);
    return NextResponse.json({ pipeline: created }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
