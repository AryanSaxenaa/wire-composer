import { NextRequest } from "next/server";
import { PipelineRunOptions } from "@/types";
import { executePipeline } from "@/lib/pipeline-executor";

function sseEvent(data: Record<string, unknown>) {
  const type = data.event as string;
  const payload = { ...data };
  delete payload.event;
  return `event: ${type}\ndata: ${JSON.stringify(payload)}\n\n`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const options: PipelineRunOptions = {
      pipeline: body.pipeline,
      credentials: body.credentials || {},
      triggerData: body.triggerData,
      startFromNodeId: body.startFromNodeId,
      initialNodeOutputs: body.nodeOutputs || body.initialNodeOutputs,
      mappingOverrides: body.mappingOverrides,
    };

    if (!options.pipeline?.nodes?.length) {
      return new Response(
        sseEvent({ event: "pipeline_failed", error: "Invalid pipeline" }),
        { status: 400, headers: { "Content-Type": "text/event-stream" } }
      );
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const emit = (event: string, data: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(sseEvent({ event, ...data })));
        };

        await executePipeline(options, emit);
        controller.close();
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(
      sseEvent({ event: "pipeline_failed", error: message }),
      {
        status: 500,
        headers: { "Content-Type": "text/event-stream" },
      }
    );
  }
}
