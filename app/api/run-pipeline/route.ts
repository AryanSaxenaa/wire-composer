import { NextRequest } from "next/server";
import { Pipeline, RunContext } from "@/types";
import { topologicalSort, resolveInputs } from "@/lib/topological-sort";
import { runWireAction } from "@/lib/wire-client";

function sseEvent(data: Record<string, unknown>) {
  const type = data.event as string;
  const payload = { ...data };
  delete payload.event;
  return `event: ${type}\ndata: ${JSON.stringify(payload)}\n\n`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const pipeline: Pipeline = body.pipeline;
    const credentials: Record<string, Record<string, string>> = body.credentials || {};

    if (!pipeline || !pipeline.nodes || !pipeline.edges) {
      return new Response(
        sseEvent({ event: "pipeline_failed", error: "Invalid pipeline" }),
        { status: 400, headers: { "Content-Type": "text/event-stream" } }
      );
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const emit = (data: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(sseEvent(data)));
        };

        const startTime = Date.now();
        const runId = crypto.randomUUID();

        const sorted = topologicalSort(pipeline.nodes, pipeline.edges);
        const nodeOutputs: Record<string, Record<string, unknown>> = {};

        for (const node of sorted) {
          emit({
            event: "node_start",
            data: { nodeId: node.id, actionId: node.actionId },
          });

          const resolvedInputs = resolveInputs(node, pipeline.edges, nodeOutputs);
          const mergedInputs = { ...node.config, ...resolvedInputs };
          const nodeCreds = credentials[node.id] || node.credentials || {};

          try {
            const result = await runWireAction(
              node.actionId,
              mergedInputs,
              nodeCreds
            );

            nodeOutputs[node.id] = result.output;
            emit({
              event: "node_complete",
              data: {
                nodeId: node.id,
                output: result.output,
                durationMs: result.durationMs,
              },
            });
          } catch (err: unknown) {
            const message =
              err instanceof Error ? err.message : "Unknown error";
            emit({
              event: "node_error",
              data: { nodeId: node.id, error: message },
            });
            emit({
              event: "pipeline_failed",
              data: {
                runId,
                failedNodeId: node.id,
                error: message,
              },
            });
            controller.close();
            return;
          }
        }

        emit({
          event: "pipeline_complete",
          data: {
            runId,
            duration: Date.now() - startTime,
          },
        });
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
