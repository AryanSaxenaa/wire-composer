import { NextRequest, NextResponse } from "next/server";
import { runWireAction } from "@/lib/wire-client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { actionId, inputs, credentials } = body;

    if (!actionId) {
      return NextResponse.json(
        { error: "actionId is required" },
        { status: 400 }
      );
    }

    const result = await runWireAction(actionId, inputs || {}, credentials || {});
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Action failed";
    const status =
      message.includes("401") || message.includes("Unauthorized")
        ? 401
        : message.includes("429")
          ? 429
          : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
