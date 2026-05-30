import { NextRequest, NextResponse } from "next/server";
import { parsePipelineFromNL } from "@/lib/deepseek";
import { BUILTIN_ACTIONS, registerAnakinActions } from "@/lib/action-registry";
import { loadAnakinActions } from "@/lib/anakin-catalog";
import { WireAction } from "@/types";
import { nanoid } from "nanoid";
import { autoLayoutNodes } from "@/lib/auto-layout";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prompt: string = body.prompt;
    let availableActions: WireAction[] =
      body.availableActions && body.availableActions.length > 0
        ? body.availableActions
        : [];

    if (availableActions.length === 0) {
      const anakinActions = await loadAnakinActions();
      registerAnakinActions(anakinActions);
      availableActions = [...BUILTIN_ACTIONS, ...anakinActions];
    }

    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const result = await parsePipelineFromNL(prompt, availableActions);

    const nodes = result.pipeline.nodes.map((n) => ({
      ...n,
      id: n.id || nanoid(),
      status: "idle" as const,
      credentials: {},
      config: n.config || {},
    }));

    const edges = result.pipeline.edges.map((e) => ({
      ...e,
      id: e.id || nanoid(),
      animated: false,
    }));

    const positioned = autoLayoutNodes(nodes, edges);

    return NextResponse.json({
      pipeline: {
        name: result.pipeline.name,
        description: result.pipeline.description,
        nodes: positioned,
        edges,
      },
      reasoning: result.reasoning,
      confidence: result.confidence,
      clarificationNeeded: result.clarificationNeeded,
      clarificationQuestion: result.clarificationQuestion,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Parse failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
