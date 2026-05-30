import { NextRequest, NextResponse } from "next/server";
import { listScheduledPipelines, recordScheduledRun } from "@/lib/pipeline-store";
import { isCronDue } from "@/lib/cron-utils";
import { executePipeline } from "@/lib/pipeline-executor";

export const runtime = "nodejs";
export const maxDuration = 300;

function authorizeCron(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV === "development";
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!authorizeCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pipelines = await listScheduledPipelines();
  const results: { id: string; name: string; status: string }[] = [];

  for (const pipeline of pipelines) {
    if (!pipeline.schedule || !isCronDue(pipeline.schedule, pipeline.lastScheduledRunAt)) {
      continue;
    }

    try {
      const { success } = await executePipeline(
        { pipeline },
        () => {}
      );
      await recordScheduledRun(pipeline.id, success ? "success" : "error");
      results.push({
        id: pipeline.id,
        name: pipeline.name,
        status: success ? "success" : "error",
      });
    } catch (err: unknown) {
      await recordScheduledRun(pipeline.id, "error");
      results.push({
        id: pipeline.id,
        name: pipeline.name,
        status: err instanceof Error ? err.message : "error",
      });
    }
  }

  return NextResponse.json({ ran: results.length, results });
}
