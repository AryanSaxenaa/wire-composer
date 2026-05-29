import { create } from "zustand";
import { Pipeline, PipelineNode, PipelineEdge, RunContext, WireAction } from "@/types";

interface ComposerStore {
  pipeline: Pipeline | null;
  setPipeline: (p: Pipeline) => void;
  updateNode: (nodeId: string, updates: Partial<PipelineNode>) => void;
  updateEdge: (edgeId: string, updates: Partial<PipelineEdge>) => void;
  addNode: (node: PipelineNode) => void;
  removeNode: (nodeId: string) => void;
  addEdge: (edge: PipelineEdge) => void;
  removeEdge: (edgeId: string) => void;

  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
  inspectorOpen: boolean;
  setInspectorOpen: (open: boolean) => void;

  parseStatus: "idle" | "loading" | "success" | "error";
  parseError: string | null;
  clarificationNeeded: boolean;
  clarificationQuestion: string | null;
  parseReasoning: string | null;
  setParseStatus: (status: ComposerStore["parseStatus"]) => void;
  setParseError: (error: string | null) => void;
  setClarification: (needed: boolean, question: string | null) => void;
  setParseReasoning: (r: string | null) => void;

  runStatus: "idle" | "running" | "complete" | "failed";
  runContext: RunContext | null;
  setRunStatus: (s: ComposerStore["runStatus"]) => void;
  setRunContext: (ctx: RunContext | null) => void;

  availableActions: WireAction[];
  setAvailableActions: (a: WireAction[]) => void;

  parseNLPrompt: (prompt: string, actions: WireAction[]) => Promise<void>;
  resetRun: () => void;
}

export const useComposerStore = create<ComposerStore>((set, get) => ({
  pipeline: null,
  setPipeline: (p) =>
    set({
      pipeline: p,
      parseStatus: "success",
      parseError: null,
      clarificationNeeded: false,
      clarificationQuestion: null,
    }),
  updateNode: (nodeId, updates) => {
    const p = get().pipeline;
    if (!p) return;
    set({
      pipeline: {
        ...p,
        nodes: p.nodes.map((n) => (n.id === nodeId ? { ...n, ...updates } : n)),
      },
    });
  },
  updateEdge: (edgeId, updates) => {
    const p = get().pipeline;
    if (!p) return;
    set({
      pipeline: {
        ...p,
        edges: p.edges.map((e) => (e.id === edgeId ? { ...e, ...updates } : e)),
      },
    });
  },
  addNode: (node) => {
    const p = get().pipeline;
    if (!p) return;
    set({ pipeline: { ...p, nodes: [...p.nodes, node] } });
  },
  removeNode: (nodeId) => {
    const p = get().pipeline;
    if (!p) return;
    set({
      pipeline: {
        ...p,
        nodes: p.nodes.filter((n) => n.id !== nodeId),
        edges: p.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
      },
    });
  },
  addEdge: (edge) => {
    const p = get().pipeline;
    if (!p) return;
    set({ pipeline: { ...p, edges: [...p.edges, edge] } });
  },
  removeEdge: (edgeId) => {
    const p = get().pipeline;
    if (!p) return;
    set({ pipeline: { ...p, edges: p.edges.filter((e) => e.id !== edgeId) } });
  },

  selectedNodeId: null,
  setSelectedNodeId: (id) => set({ selectedNodeId: id, inspectorOpen: id !== null }),
  inspectorOpen: false,
  setInspectorOpen: (open) => set({ inspectorOpen: open }),

  parseStatus: "idle",
  parseError: null,
  clarificationNeeded: false,
  clarificationQuestion: null,
  parseReasoning: null,
  setParseStatus: (status) => set({ parseStatus: status }),
  setParseError: (error) => set({ parseError: error, parseStatus: error ? "error" : "idle" }),
  setClarification: (needed, question) =>
    set({ clarificationNeeded: needed, clarificationQuestion: question }),
  setParseReasoning: (r) => set({ parseReasoning: r }),

  runStatus: "idle",
  runContext: null,
  setRunStatus: (s) => set({ runStatus: s }),
  setRunContext: (ctx) => set({ runContext: ctx }),

  availableActions: [],
  setAvailableActions: (a) => set({ availableActions: a }),

  parseNLPrompt: async (prompt, actions) => {
    set({ parseStatus: "loading", parseError: null });
    try {
      const res = await fetch("/api/parse-pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, availableActions: actions }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Parse failed");

      if (data.clarificationNeeded) {
        set({
          parseStatus: "success",
          clarificationNeeded: true,
          clarificationQuestion: data.clarificationQuestion,
          parseReasoning: data.reasoning,
        });
        return;
      }

      const pipeline: Pipeline = {
        id: data.pipeline.id || crypto.randomUUID(),
        name: data.pipeline.name,
        description: data.pipeline.description,
        naturalLanguagePrompt: prompt,
        nodes: data.pipeline.nodes,
        edges: data.pipeline.edges,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      set({
        pipeline,
        parseStatus: "success",
        clarificationNeeded: false,
        clarificationQuestion: null,
        parseReasoning: data.reasoning,
      });
    } catch (err: unknown) {
      set({
        parseStatus: "error",
        parseError: err instanceof Error ? err.message : "Parse failed",
      });
    }
  },

  resetRun: () =>
    set({
      runStatus: "idle",
      runContext: null,
    }),
}));
