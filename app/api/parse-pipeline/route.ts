import { NextRequest, NextResponse } from "next/server";
import { parsePipelineFromNL } from "@/lib/deepseek";
import { ACTION_REGISTRY } from "@/lib/action-registry";
import { PipelineNode, PipelineEdge, WireAction } from "@/types";
import { nanoid } from "nanoid";

function autoLayout(nodes: PipelineNode[], edges: PipelineEdge[]): PipelineNode[] {
  const depths = new Map<string, number>();
  const children = new Map<string, string[]>();

  nodes.forEach((n) => depths.set(n.id, -1));
  nodes.forEach((n) => children.set(n.id, []));

  edges.forEach((e) => {
    const c = children.get(e.source);
    if (c) c.push(e.target);
  });

  // BFS for depth
  const roots = nodes.filter(
    (n) => !edges.some((e) => e.target === n.id)
  );
  roots.forEach((r) => depths.set(r.id, 0));

  const queue = [...roots];
  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentDepth = depths.get(current.id)!;
    const kidList = children.get(current.id) || [];
    kidList.forEach((kidId) => {
      const kidDepth = depths.get(kidId);
      if (kidDepth === undefined || kidDepth === -1 || kidDepth < currentDepth + 1) {
        depths.set(kidId, currentDepth + 1);
        const kidNode = nodes.find((n) => n.id === kidId);
        if (kidNode) queue.push(kidNode);
      }
    });
  }

  // Assign default depth 0 for unvisited
  nodes.forEach((n) => {
    if ((depths.get(n.id) ?? -1) === -1) depths.set(n.id, 0);
  });

  // Group by depth
  const byDepth = new Map<number, PipelineNode[]>();
  nodes.forEach((n) => {
    const d = depths.get(n.id) ?? 0;
    if (!byDepth.has(d)) byDepth.set(d, []);
    byDepth.get(d)!.push(n);
  });

  const SPACING_X = 280;
  const SPACING_Y = 160;
  const BASE_X = 100;
  const BASE_Y = 200;

  const result: PipelineNode[] = [];
  const sortedDepths = [...byDepth.keys()].sort((a, b) => a - b);

  sortedDepths.forEach((depth) => {
    const layer = byDepth.get(depth)!;
    layer.forEach((node, i) => {
      result.push({
        ...node,
        position: {
          x: BASE_X + depth * SPACING_X,
          y: BASE_Y + i * SPACING_Y,
        },
      });
    });
  });

  return result;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prompt: string = body.prompt;
    const availableActions: WireAction[] =
      body.availableActions && body.availableActions.length > 0
        ? body.availableActions
        : ACTION_REGISTRY;

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

    const positioned = autoLayout(nodes, edges);

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
