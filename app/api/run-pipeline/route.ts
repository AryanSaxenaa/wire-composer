import { NextRequest } from "next/server";
import { Pipeline } from "@/types";
import { topologicalSort, resolveInputs } from "@/lib/topological-sort";
import { runWireAction } from "@/lib/wire-client";
import { getActionById } from "@/lib/action-registry";

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
          const action = getActionById(node.actionId);

          // §12: Unknown action → warn and skip (don't fail silently)
          if (!action) {
            emit({
              event: "node_error",
              nodeId: node.id,
              error: `Unknown action "${node.actionId}". Closest: check action registry.`,
            });
            emit({
              event: "pipeline_failed",
              runId,
              failedNodeId: node.id,
              error: `Unknown action: ${node.actionId}`,
            });
            controller.close();
            return;
          }

          // §12: Handle missing config for required fields
          const requiredFields = action.inputFields.filter((f) => f.required);
          const hasRequiredInputs = requiredFields.every((f) => node.config?.[f.key]);

          if (!hasRequiredInputs) {
            const missingFields = requiredFields
              .filter((f) => !node.config?.[f.key])
              .map((f) => f.key);

            emit({
              event: "node_error",
              nodeId: node.id,
              error: `Missing required inputs: ${missingFields.join(", ")}`,
            });
            emit({
              event: "pipeline_failed",
              runId,
              failedNodeId: node.id,
              error: `Missing inputs: ${missingFields.join(", ")}`,
            });
            controller.close();
            return;
          }

          emit({
            event: "node_start",
            nodeId: node.id,
            actionId: node.actionId,
          });

          const resolvedInputs = resolveInputs(node, pipeline.edges, nodeOutputs);
          const mergedInputs = { ...node.config, ...resolvedInputs };
          const nodeCreds = credentials[node.id] || {};

          let attemptCount = 0;
          const maxAttempts = 2;
          let lastError: unknown = null;

          while (attemptCount < maxAttempts) {
            attemptCount++;
            try {
              const result = await runWireAction(
                node.actionId,
                mergedInputs,
                nodeCreds
              );

              nodeOutputs[node.id] = result.output;
              emit({
                event: "node_complete",
                nodeId: node.id,
                output: result.output,
                durationMs: result.durationMs,
              });
              lastError = null;
              break;
            } catch (err: unknown) {
              lastError = err;
              const message = err instanceof Error ? err.message : "Unknown error";

              const isRateLimited =
                message.includes("429") || message.includes("Rate limit");

              if (isRateLimited && attemptCount < maxAttempts) {
                // §12: Auto-retry after 30s
                emit({
                  event: "node_error",
                  nodeId: node.id,
                  error: `Rate limited — retrying in 30s (attempt ${attemptCount})`,
                });
                await new Promise((resolve) => setTimeout(resolve, 30_000));
                emit({
                  event: "node_start",
                  nodeId: node.id,
                  actionId: node.actionId,
                });
                continue;
              }

              emit({
                event: "node_error",
                nodeId: node.id,
                error: message,
              });
              emit({
                event: "pipeline_failed",
                runId,
                failedNodeId: node.id,
                error: message,
              });
              break;
            }
          }

          if (lastError) {
            controller.close();
            return;
          }
        }

        emit({
          event: "pipeline_complete",
          runId,
          duration: Date.now() - startTime,
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
