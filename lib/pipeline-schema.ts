import { z } from "zod";
import { normalizeNodeConfig } from "@/lib/normalize-pipeline-config";

export const ActionFieldSchema = z.object({
  key: z.string(),
  label: z.string(),
  type: z.enum(["string", "url", "number", "boolean", "object"]),
  required: z.boolean(),
  description: z.string(),
  example: z.string().optional(),
});

export const WireActionSchema = z.object({
  id: z.string(),
  platform: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.enum(["read", "write", "search", "monitor", "transform"]),
  requiresAuth: z.boolean(),
  authMode: z.enum(["none", "optional", "required"]).optional(),
  inputFields: z.array(ActionFieldSchema),
  outputFields: z.array(ActionFieldSchema),
});

export const DataMappingSchema = z.object({
  fromField: z.string(),
  toField: z.string(),
  transform: z.string().optional(),
});

export const PipelineNodeSchema = z.object({
  id: z.string(),
  type: z.enum(["wireAction", "trigger", "condition", "output"]),
  actionId: z.string(),
  label: z.string(),
  platform: z.string(),
  position: z.object({ x: z.number(), y: z.number() }),
  config: z.preprocess(
    (raw) => normalizeNodeConfig((raw ?? {}) as Record<string, unknown>),
    z.record(z.string(), z.string())
  ),
  credentials: z.record(z.string(), z.string()),
  status: z.enum(["idle", "pending", "running", "success", "error", "waiting_input"]),
  output: z.record(z.string(), z.unknown()).optional(),
  error: z.string().optional(),
});

export const PipelineEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  sourceHandle: z.string(),
  targetHandle: z.string(),
  dataMapping: z.array(DataMappingSchema),
  animated: z.boolean(),
});

export const PipelineParseResultSchema = z.object({
  pipeline: z.object({
    name: z.string(),
    description: z.string(),
    nodes: z.array(PipelineNodeSchema),
    edges: z.array(PipelineEdgeSchema),
  }),
  reasoning: z.string(),
  confidence: z.number(),
  clarificationNeeded: z.boolean(),
  clarificationQuestion: z.string().optional(),
});

export const PipelineSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  naturalLanguagePrompt: z.string(),
  nodes: z.array(PipelineNodeSchema),
  edges: z.array(PipelineEdgeSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
  lastRunAt: z.string().optional(),
  lastRunStatus: z.enum(["success", "error", "partial"]).optional(),
  schedule: z.string().optional(),
  webhookId: z.string().optional(),
});
