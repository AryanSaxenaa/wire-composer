import { NextRequest, NextResponse } from "next/server";
import { parsePipelineFromNL } from "@/lib/deepseek";
import { BUILTIN_ACTIONS, registerAnakinActions } from "@/lib/action-registry";
import { loadAnakinActions } from "@/lib/anakin-catalog";
import { WireAction } from "@/types";
import { nanoid } from "nanoid";
import { autoLayoutNodes } from "@/lib/auto-layout";
import { normalizeNodeConfig } from "@/lib/normalize-pipeline-config";
import {
  promptImpliesKnownPlatform,
  resolveExamplePipeline,
} from "@/lib/example-prompt-templates";
import { postprocessParsedPipeline } from "@/lib/postprocess-parsed-pipeline";

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

    const curated = resolveExamplePipeline(prompt);
    if (curated) {
      const processed = postprocessParsedPipeline({
        id: "",
        name: curated.name,
        description: curated.description,
        naturalLanguagePrompt: prompt,
        nodes: curated.nodes,
        edges: curated.edges,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      return NextResponse.json({
        pipeline: {
          name: processed.name,
          description: processed.description,
          nodes: autoLayoutNodes(processed.nodes, processed.edges),
          edges: processed.edges,
        },
        reasoning:
          "Built from a verified example workflow template (reliable actions, mappings, and run defaults).",
        confidence: 1,
        clarificationNeeded: false,
        clarificationQuestion: "",
      });
    }

    let result = await parsePipelineFromNL(prompt, availableActions);

    if (result.clarificationNeeded && promptImpliesKnownPlatform(prompt)) {
      result = await parsePipelineFromNL(
        `${prompt}\n\nThe platform and steps are already explicit. Set clarificationNeeded to false and output the pipeline.`,
        availableActions
      );
      if (result.clarificationNeeded) {
        const fallback = resolveExamplePipeline(prompt);
        if (fallback) {
          result = {
            ...result,
            clarificationNeeded: false,
            clarificationQuestion: "",
            pipeline: {
              name: fallback.name,
              description: fallback.description,
              nodes: fallback.nodes,
              edges: fallback.edges,
            },
          };
        }
      }
    }

    const nodes = result.pipeline.nodes.map((n) => ({
      ...n,
      id: n.id || nanoid(),
      status: "idle" as const,
      credentials: {},
      config: normalizeNodeConfig(n.config as Record<string, unknown>),
    }));

    const edges = result.pipeline.edges.map((e) => ({
      ...e,
      id: e.id || nanoid(),
      animated: false,
    }));

    const positioned = autoLayoutNodes(nodes, edges);
    const processed = postprocessParsedPipeline({
      id: "",
      name: result.pipeline.name,
      description: result.pipeline.description,
      naturalLanguagePrompt: prompt,
      nodes: positioned,
      edges,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      pipeline: {
        name: processed.name,
        description: processed.description,
        nodes: autoLayoutNodes(processed.nodes, processed.edges),
        edges: processed.edges,
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
