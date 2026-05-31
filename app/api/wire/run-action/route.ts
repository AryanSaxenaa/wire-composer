import { NextRequest, NextResponse } from "next/server";
import { registerAnakinActions } from "@/lib/action-registry";
import { loadAnakinActions } from "@/lib/anakin-catalog";
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

    const anakinActions = await loadAnakinActions();
    registerAnakinActions(anakinActions);

    const result = await runWireAction(actionId, inputs || {}, credentials || {});
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Action failed";
    const status =
      message.includes("401") || message.includes("Unauthorized")
        ? 401
        : message.includes("Forbidden") || message.includes("403")
          ? 403
          : message.includes("429")
            ? 429
            : message.includes("Insufficient credits")
              ? 402
              : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
