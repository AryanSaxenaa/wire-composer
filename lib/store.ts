import { create } from "zustand";
import {
  Pipeline,
  PipelineNode,
  PipelineEdge,
  RunContext,
  WireAction,
  AmbiguousMappingState,
} from "@/types";

type ToastType = "success" | "error" | "info";

interface ToastData {
  id: string;
  type: ToastType;
  message: string;
}

interface ComposerStore {
  pipeline: Pipeline | null;
  pipelinePersisted: boolean;
  setPipeline: (
    p: Pipeline,
    options?: { fromStorage?: boolean; keepRunState?: boolean }
  ) => void;
  clearPipeline: () => void;
  markPipelineDirty: () => void;
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

  runStatus: "idle" | "running" | "paused" | "complete" | "failed";
  runContext: RunContext | null;
  runPaused: boolean;
  pausedNodeOutputs: Record<string, Record<string, unknown>> | null;
  pausedFromNodeId: string | null;
  ambiguousMapping: AmbiguousMappingState | null;
  mappingOverrides: Record<string, Record<string, string>>;
  rateLimitSeconds: number | null;
  setRunStatus: (s: ComposerStore["runStatus"]) => void;
  setRunContext: (ctx: RunContext | null) => void;
  setRunPaused: (paused: boolean, outputs?: Record<string, Record<string, unknown>> | null, fromNodeId?: string | null) => void;
  setAmbiguousMapping: (state: AmbiguousMappingState | null) => void;
  resolveAmbiguousMapping: (fromField: string) => void;
  setRateLimitSeconds: (n: number | null) => void;

  availableActions: WireAction[];
  setAvailableActions: (a: WireAction[]) => void;

  toasts: ToastData[];
  addToast: (type: ToastType, message: string) => void;
  removeToast: (id: string) => void;

  parseNLPrompt: (prompt: string, actions: WireAction[]) => Promise<void>;
  runPipeline: () => Promise<void>;
  resetRun: () => void;

  confirmDialog: {
    title: string;
    message: string;
    confirmLabel?: string;
    variant?: "danger" | "primary";
    onConfirm: () => void;
    onCancel?: () => void;
  } | null;
  openConfirm: (opts: {
    title: string;
    message: string;
    confirmLabel?: string;
    variant?: "danger" | "primary";
    onConfirm: () => void;
    onCancel?: () => void;
  }) => void;
  closeConfirm: () => void;
}

export const useComposerStore = create<ComposerStore>((set, get) => ({
  pipeline: null,
  pipelinePersisted: false,
  setPipeline: (p, options) => {
    if (!options?.keepRunState) {
      get().resetRun();
      set({
        pipeline: p,
        pipelinePersisted: options?.fromStorage ?? false,
        parseStatus: "success",
        parseError: null,
        clarificationNeeded: false,
        clarificationQuestion: null,
        mappingOverrides: {},
        ambiguousMapping: null,
        runPaused: false,
        pausedNodeOutputs: null,
        pausedFromNodeId: null,
      });
    } else {
      set({
        pipeline: p,
        pipelinePersisted: options?.fromStorage ?? get().pipelinePersisted,
      });
    }
  },
  clearPipeline: () => {
    get().resetRun();
    set({
      pipeline: null,
      pipelinePersisted: false,
      selectedNodeId: null,
      inspectorOpen: false,
      parseStatus: "idle",
      parseError: null,
      clarificationNeeded: false,
      clarificationQuestion: null,
      parseReasoning: null,
      mappingOverrides: {},
      ambiguousMapping: null,
    });
  },
  markPipelineDirty: () => set({ pipelinePersisted: false }),
  updateNode: (nodeId, updates) => {
    const p = get().pipeline;
    if (!p) return;
    const statusOnly = Object.keys(updates).every((k) =>
      ["status", "output", "error"].includes(k)
    );
    set({
      pipeline: {
        ...p,
        nodes: p.nodes.map((n) => (n.id === nodeId ? { ...n, ...updates } : n)),
      },
      ...(statusOnly ? {} : { pipelinePersisted: false }),
    });
  },
  updateEdge: (edgeId, updates) => {
    const p = get().pipeline;
    if (!p) return;
    const animOnly =
      Object.keys(updates).length === 1 && "animated" in updates;
    set({
      pipeline: {
        ...p,
        edges: p.edges.map((e) => (e.id === edgeId ? { ...e, ...updates } : e)),
      },
      ...(animOnly ? {} : { pipelinePersisted: false }),
    });
  },
  addNode: (node) => {
    const p = get().pipeline;
    if (!p) return;
    set({ pipeline: { ...p, nodes: [...p.nodes, node] }, pipelinePersisted: false });
  },
  removeNode: (nodeId) => {
    const p = get().pipeline;
    if (!p) return;
    const selected = get().selectedNodeId;
    set({
      pipeline: {
        ...p,
        nodes: p.nodes.filter((n) => n.id !== nodeId),
        edges: p.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
      },
      pipelinePersisted: false,
      ...(selected === nodeId
        ? { selectedNodeId: null, inspectorOpen: false }
        : {}),
    });
  },
  addEdge: (edge) => {
    const p = get().pipeline;
    if (!p) return;
    set({ pipeline: { ...p, edges: [...p.edges, edge] }, pipelinePersisted: false });
  },
  removeEdge: (edgeId) => {
    const p = get().pipeline;
    if (!p) return;
    set({ pipeline: { ...p, edges: p.edges.filter((e) => e.id !== edgeId) }, pipelinePersisted: false });
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
  runPaused: false,
  pausedNodeOutputs: null,
  pausedFromNodeId: null,
  ambiguousMapping: null,
  mappingOverrides: {},
  rateLimitSeconds: null,
  setRunStatus: (s) => set({ runStatus: s }),
  setRunContext: (ctx) => set({ runContext: ctx }),
  setRunPaused: (paused, outputs = null, fromNodeId = null) =>
    set({
      runPaused: paused,
      pausedNodeOutputs: outputs,
      pausedFromNodeId: fromNodeId,
      runStatus: paused
        ? "paused"
        : get().runStatus === "paused"
          ? "running"
          : get().runStatus,
    }),
  setAmbiguousMapping: (state) => set({ ambiguousMapping: state }),
  resolveAmbiguousMapping: (fromField) => {
    const amb = get().ambiguousMapping;
    if (!amb) return;
    const overrides = { ...get().mappingOverrides };
    if (!overrides[amb.nodeId]) overrides[amb.nodeId] = {};
    overrides[amb.nodeId][amb.targetField] = fromField;
    set({
      mappingOverrides: overrides,
      ambiguousMapping: null,
      runPaused: false,
    });
  },
  setRateLimitSeconds: (n) => set({ rateLimitSeconds: n }),

  availableActions: [],
  setAvailableActions: (a) => set({ availableActions: a }),

  toasts: [],
  addToast: (type, message) => {
    const id = crypto.randomUUID();
    set((s) => ({ toasts: [...s.toasts, { id, type, message }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 3500);
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  parseNLPrompt: async (prompt, actions) => {
    get().resetRun();
    set({
      parseStatus: "loading",
      parseError: null,
      mappingOverrides: {},
      ambiguousMapping: null,
    });
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
        pipelinePersisted: false,
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

  runPipeline: async () => {
    /* Implemented via usePipelineRunner().run() in client components */
  },

  confirmDialog: null,
  openConfirm: (opts) => set({ confirmDialog: opts }),
  closeConfirm: () => {
    const dialog = get().confirmDialog;
    dialog?.onCancel?.();
    set({ confirmDialog: null });
  },

  resetRun: () => {
    const p = get().pipeline;
    if (p) {
      set({
        pipeline: {
          ...p,
          nodes: p.nodes.map((n) => ({
            ...n,
            status: "idle" as const,
            output: undefined,
            error: undefined,
          })),
          edges: p.edges.map((e) => ({ ...e, animated: false })),
        },
        runStatus: "idle",
        runContext: null,
        runPaused: false,
        pausedNodeOutputs: null,
        pausedFromNodeId: null,
        ambiguousMapping: null,
        rateLimitSeconds: null,
      });
    } else {
      set({
        runStatus: "idle",
        runContext: null,
        runPaused: false,
        pausedNodeOutputs: null,
        pausedFromNodeId: null,
        ambiguousMapping: null,
        rateLimitSeconds: null,
      });
    }
  },
}));
