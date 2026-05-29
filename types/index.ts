export interface ActionField {
  key: string;
  label: string;
  type: "string" | "url" | "number" | "boolean" | "object";
  required: boolean;
  description: string;
  example?: string;
}

export interface WireAction {
  id: string;
  platform: string;
  name: string;
  description: string;
  category: "read" | "write" | "search" | "monitor";
  requiresAuth: boolean;
  inputFields: ActionField[];
  outputFields: ActionField[];
}

export interface DataMapping {
  fromField: string;
  toField: string;
  transform?: string;
}

export type PipelineNodeType = "wireAction" | "trigger" | "condition" | "output";

export type NodeStatus =
  | "idle"
  | "pending"
  | "running"
  | "success"
  | "error"
  | "waiting_input";

export interface PipelineNode {
  id: string;
  type: PipelineNodeType;
  actionId: string;
  label: string;
  platform: string;
  position: { x: number; y: number };
  config: Record<string, string>;
  credentials: Record<string, string>;
  status: NodeStatus;
  output?: Record<string, unknown>;
  error?: string;
}

export interface PipelineEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle: string;
  targetHandle: string;
  dataMapping: DataMapping[];
  animated: boolean;
}

export interface Pipeline {
  id: string;
  name: string;
  description: string;
  naturalLanguagePrompt: string;
  nodes: PipelineNode[];
  edges: PipelineEdge[];
  createdAt: string;
  updatedAt: string;
  lastRunAt?: string;
  lastRunStatus?: "success" | "error" | "partial";
  schedule?: string;
  webhookId?: string;
}

export interface PipelineParseResult {
  pipeline: {
    name: string;
    description: string;
    nodes: PipelineNode[];
    edges: PipelineEdge[];
  };
  reasoning: string;
  confidence: number;
  clarificationNeeded: boolean;
  clarificationQuestion?: string;
}

export interface RunLogEntry {
  ts: string;
  nodeId: string;
  level: "info" | "warn" | "error";
  message: string;
}

export interface RunContext {
  pipelineId: string;
  runId: string;
  startedAt: string;
  nodeOutputs: Record<string, Record<string, unknown>>;
  currentNodeId: string | null;
  status: "running" | "paused" | "complete" | "failed";
  log: RunLogEntry[];
}

export interface SSEEvent {
  event:
    | "node_start"
    | "node_complete"
    | "node_error"
    | "waiting_for_input"
    | "pipeline_complete"
    | "pipeline_failed";
  data: Record<string, unknown>;
}
