export interface ActionField {
  key: string;
  label: string;
  type: "string" | "url" | "number" | "boolean" | "object";
  required: boolean;
  description: string;
  example?: string;
}

export type WireAuthMode = "none" | "optional" | "required";

export interface WireAction {
  id: string;
  platform: string;
  name: string;
  description: string;
  category: "read" | "write" | "search" | "monitor" | "transform";
  /** @deprecated Prefer authMode — true only when credential_id is mandatory */
  requiresAuth: boolean;
  authMode: WireAuthMode;
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
  lastScheduledRunAt?: string;
  isDemo?: boolean;
}

export interface AmbiguousMappingState {
  nodeId: string;
  targetField: string;
  options: { fromField: string; sourceNodeId: string; sourceLabel: string }[];
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

export type PipelineExecutorEvent =
  | "node_start"
  | "node_complete"
  | "node_error"
  | "node_skipped"
  | "waiting_for_input"
  | "rate_limit_wait"
  | "pipeline_paused"
  | "pipeline_complete"
  | "pipeline_failed";

export interface SSEEvent {
  event: PipelineExecutorEvent;
  data: Record<string, unknown>;
}

export interface PipelineRunOptions {
  pipeline: Pipeline;
  credentials?: Record<string, Record<string, string>>;
  triggerData?: Record<string, unknown>;
  startFromNodeId?: string;
  initialNodeOutputs?: Record<string, Record<string, unknown>>;
  mappingOverrides?: Record<string, Record<string, string>>;
}
