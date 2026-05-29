# Wire Composer — Build Specification

> A no-code visual pipeline builder that lets anyone describe a multi-step web automation workflow in plain English and get a live, deployed, executable Wire action chain back. Think Zapier — but the primitive isn't an official API, it's the entire authenticated live web.

---

## 0. Quick Reference

| Item | Value |
|------|-------|
| Stack | Next.js 14 (App Router) · TypeScript · Tailwind CSS · Zustand · React Flow |
| Backend | Next.js API Routes (Node.js runtime) |
| LLM | DeepSeek V4 Flash (`deepseek-v4-flash`) via OpenAI-compatible SDK |
| Web Actions | Anakin Wire API (`https://api.anakin.io/v1`) |
| Auth | Clerk (free tier) OR NextAuth.js with GitHub provider |
| Storage | Vercel KV (Redis) for pipeline persistence |
| Deployment | Vercel |
| Boilerplate | **None.** Scaffold fresh with `create-next-app`. No existing template matches exactly. |

---

## 1. What This Product Does

Wire Composer is a three-panel application:

1. **Left panel — Natural language input.** User describes a workflow in plain English, e.g.: *"Every morning, check my competitor's pricing page, compare it to my Shopify store, and post a Slack message if anything changed."*

2. **Center panel — Visual pipeline canvas.** As the user types (or after they submit), an AI-assembled directed acyclic graph (DAG) renders in real time — each node is a Wire action, edges show data flow between them, and each node displays which fields it reads from the previous node.

3. **Right panel — Node inspector + credentials.** Clicking any node opens a detail panel showing: which Wire action it maps to, what inputs it expects, what outputs it produces, and fields for the user to paste their credentials for that site.

The user hits **Run** — the pipeline executes step by step using the Anakin Wire API, with live status updates streaming into the canvas nodes. On completion, the user can save the pipeline and schedule it (cron string) or deploy it as a webhook endpoint.

---

## 2. Visual Design System

### Design Language
Closely mirror Anakin.io's own UI as seen on their product pages. The Anakin aesthetic is:
- **Dark primary theme**: Near-black backgrounds (`#0a0a0f`, `#0d0d14`), not pure black
- **Subtle blue-purple accent**: `#4f6ef7` (primary action color — matches Anakin's "Open dashboard" button)
- **Monospaced code elements** throughout — even labels and tags use mono fonts, communicating developer-nativeness
- **Sharp, functional grid**: No rounded-corner excess; 4–6px radius maximum on cards
- **Minimal but not sparse**: Dense information layout, like a developer tool, not a marketing page
- **Green for success/live states**: `#22c55e` or `#4ade80`
- **Amber for warnings/pending**: `#f59e0b`
- **Red for errors**: `#ef4444`

### Typography
```
Primary:    Inter (--font-sans)        — UI labels, body text, inputs
Monospace:  JetBrains Mono (--font-mono) — code snippets, node IDs, field names, API keys
Display:    Inter (700 weight)          — headings; no separate display font needed
```

### Color Tokens
```css
--bg-base:        #0a0a0f;   /* page background */
--bg-surface:     #0d0d14;   /* card / panel backgrounds */
--bg-elevated:    #13131f;   /* modal / drawer backgrounds */
--bg-subtle:      #1a1a2e;   /* hover states, subtle fills */

--border-default: rgba(255,255,255,0.08);
--border-strong:  rgba(255,255,255,0.15);
--border-accent:  rgba(79,110,247,0.4);

--text-primary:   #f0f0ff;
--text-secondary: #8888aa;
--text-muted:     #555577;

--accent-primary: #4f6ef7;   /* buttons, links, selected states */
--accent-hover:   #3d5de0;
--accent-glow:    rgba(79,110,247,0.2);

--success:        #22c55e;
--warning:        #f59e0b;
--error:          #ef4444;
--pending:        #a78bfa;

--node-bg:        #111122;
--node-border:    rgba(79,110,247,0.25);
--node-selected:  rgba(79,110,247,0.5);
--edge-color:     rgba(79,110,247,0.4);
--edge-animated:  #4f6ef7;
```

### Node Visual Design
Each pipeline node is a card with:
- Dark background (`--node-bg`)
- Thin accent border
- Top row: **platform logo icon** (16px) + **action name** in mono font
- Middle row: input/output field badges in muted mono text
- Bottom row: execution status indicator (idle / running / done / error) as a colored dot + text
- When selected: glow shadow using `--accent-glow`
- When running: pulsing left-border animation in `--accent-primary`
- When complete: left-border turns `--success`
- When errored: left-border turns `--error`, node shakes slightly

---

## 3. Repository Structure

```
wire-composer/
├── app/
│   ├── layout.tsx                  # Root layout, font loading, providers
│   ├── page.tsx                    # Landing / redirect to /composer
│   ├── composer/
│   │   └── page.tsx                # Main 3-panel composer UI
│   ├── pipelines/
│   │   ├── page.tsx                # Saved pipelines list
│   │   └── [id]/
│   │       └── page.tsx            # Single pipeline view / edit
│   └── api/
│       ├── parse-pipeline/
│       │   └── route.ts            # POST: NL → pipeline DAG via DeepSeek V4 Flash
│       ├── run-pipeline/
│       │   └── route.ts            # POST: execute a pipeline step-by-step
│       ├── wire/
│       │   ├── actions/
│       │   │   └── route.ts        # GET: list available Wire actions from Anakin
│       │   └── run-action/
│       │       └── route.ts        # POST: execute single Wire action
│       └── pipelines/
│           ├── route.ts            # GET list, POST create
│           └── [id]/
│               └── route.ts        # GET, PUT, DELETE single pipeline
├── components/
│   ├── composer/
│   │   ├── ComposerLayout.tsx      # 3-panel shell
│   │   ├── NLInputPanel.tsx        # Left panel: text input + examples
│   │   ├── PipelineCanvas.tsx      # Center: React Flow canvas
│   │   ├── NodeInspector.tsx       # Right panel: node detail + credentials
│   │   ├── PipelineNode.tsx        # Custom React Flow node component
│   │   ├── PipelineEdge.tsx        # Custom animated edge component
│   │   ├── RunStatusBar.tsx        # Bottom status bar during execution
│   │   └── ExamplePipelines.tsx    # Clickable example workflow prompts
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Badge.tsx
│   │   ├── Tooltip.tsx
│   │   ├── Spinner.tsx
│   │   ├── CodeBlock.tsx           # Syntax-highlighted output viewer
│   │   └── Logo.tsx
│   └── layout/
│       ├── Sidebar.tsx
│       └── TopBar.tsx
├── lib/
│   ├── deepseek.ts                 # DeepSeek client + pipeline parse prompt
│   ├── wire-client.ts              # Anakin Wire API wrapper
│   ├── pipeline-schema.ts          # Zod schemas for Pipeline, Node, Edge
│   ├── action-registry.ts          # Local catalogue of known Wire actions
│   └── store.ts                    # Zustand global state
├── hooks/
│   ├── usePipelineParser.ts        # Calls /api/parse-pipeline, updates store
│   ├── usePipelineRunner.ts        # Executes pipeline, streams status updates
│   └── useWireActions.ts           # Fetches and caches Wire action catalogue
├── types/
│   └── index.ts                    # All shared TypeScript types
├── public/
│   └── platform-icons/             # SVG icons for supported platforms
├── .env.local                      # (gitignored) API keys
├── tailwind.config.ts
├── next.config.ts
└── package.json
```

---

## 4. Data Models

All types live in `types/index.ts`. Use Zod for runtime validation in API routes.

### 4.1 WireAction (single action in the catalogue)

```typescript
interface WireAction {
  id: string;             // e.g. "linkedin.profile.read"
  platform: string;       // e.g. "linkedin"
  name: string;           // e.g. "Read Profile"
  description: string;
  category: "read" | "write" | "search" | "monitor";
  requiresAuth: boolean;
  inputFields: ActionField[];
  outputFields: ActionField[];
}

interface ActionField {
  key: string;
  label: string;
  type: "string" | "url" | "number" | "boolean" | "object";
  required: boolean;
  description: string;
  example?: string;
}
```

### 4.2 PipelineNode

```typescript
interface PipelineNode {
  id: string;                       // nanoid()
  type: "wireAction" | "trigger" | "condition" | "output";
  actionId: string;                 // maps to WireAction.id
  label: string;                    // human name shown on canvas
  platform: string;
  position: { x: number; y: number };
  config: Record<string, string>;   // user-filled input values
  credentials: Record<string, string>; // encrypted at rest, never logged
  status: "idle" | "pending" | "running" | "success" | "error" | "waiting_input";
  output?: Record<string, unknown>; // result from last run
  error?: string;
}
```

### 4.3 PipelineEdge

```typescript
interface PipelineEdge {
  id: string;
  source: string;                   // PipelineNode.id
  target: string;
  sourceHandle: string;             // output field key of source node
  targetHandle: string;             // input field key of target node
  dataMapping: DataMapping[];       // explicit field→field mappings
  animated: boolean;
}

interface DataMapping {
  fromField: string;                // output key from source node
  toField: string;                  // input key in target node
  transform?: string;               // optional jq-style transform expression
}
```

### 4.4 Pipeline

```typescript
interface Pipeline {
  id: string;
  name: string;
  description: string;
  naturalLanguagePrompt: string;    // original user input
  nodes: PipelineNode[];
  edges: PipelineEdge[];
  createdAt: string;
  updatedAt: string;
  lastRunAt?: string;
  lastRunStatus?: "success" | "error" | "partial";
  schedule?: string;                // cron string, optional
  webhookId?: string;               // if deployed as webhook
}
```

### 4.5 RunContext (ephemeral, in memory during execution)

```typescript
interface RunContext {
  pipelineId: string;
  runId: string;
  startedAt: string;
  nodeOutputs: Record<string, Record<string, unknown>>; // nodeId → output data
  currentNodeId: string | null;
  status: "running" | "paused" | "complete" | "failed";
  log: RunLogEntry[];
}

interface RunLogEntry {
  ts: string;
  nodeId: string;
  level: "info" | "warn" | "error";
  message: string;
}
```

---

## 5. API Routes (Backend)

### 5.1 `POST /api/parse-pipeline`

**Purpose:** Convert a natural language workflow description into a structured pipeline DAG.

**Request body:**
```json
{
  "prompt": "string",
  "availableActions": "WireAction[]"  // current catalogue snapshot
}
```

**Response:**
```json
{
  "pipeline": {
    "name": "string",
    "description": "string",
    "nodes": "PipelineNode[]",
    "edges": "PipelineEdge[]"
  },
  "reasoning": "string",            // DeepSeek's explanation of how it mapped the prompt
  "confidence": "number",           // 0–1 score
  "clarificationNeeded": "boolean", // true if the prompt was too ambiguous
  "clarificationQuestion": "string" // what the AI needs to know
}
```

**DeepSeek system prompt (used inside `lib/deepseek.ts`):**

```
You are a pipeline compiler. You receive a plain-English workflow description and a list of available Wire actions. Your job is to:
1. Identify the sequence of Wire actions required to implement the described workflow
2. Determine the data flow between actions (which output field of step N feeds into which input field of step N+1)
3. Return a structured JSON pipeline object matching the Pipeline schema exactly

Rules:
- Only use actions from the provided availableActions list. Never invent actions.
- Every edge must have explicit dataMapping entries connecting source output fields to target input fields.
- If the prompt is ambiguous about a critical detail (e.g. "my account" — which platform?), set clarificationNeeded: true and write a specific clarificationQuestion.
- Do not set clarificationNeeded: true for minor details — make a reasonable assumption and note it in reasoning.
- Node positions: lay out nodes in a left-to-right flow. Trigger node at x:100,y:200. Space subsequent nodes 280px apart on x axis.
- Set all node statuses to "idle".
- Leave credentials as empty objects — the user will fill those in.
- The name field should be a short, memorable title derived from the prompt (max 6 words).

Return ONLY valid JSON. No markdown fences, no preamble, no trailing commentary.
```

**Implementation notes — `lib/deepseek.ts`:**

DeepSeek's API is fully OpenAI-compatible. Use the `openai` npm package pointed at DeepSeek's base URL — no DeepSeek-specific SDK needed:

```typescript
// lib/deepseek.ts
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY!,
  baseURL: "https://api.deepseek.com",
});

export async function parsePipelineFromNL(
  prompt: string,
  availableActions: WireAction[]
): Promise<PipelineParseResult> {
  const response = await client.chat.completions.create({
    model: "deepseek-v4-flash",
    response_format: { type: "json_object" },   // enforces valid JSON output
    max_tokens: 4096,                            // prevent truncated JSON
    messages: [
      {
        role: "system",
        content: PIPELINE_COMPILER_SYSTEM_PROMPT, // the prompt above
      },
      {
        role: "user",
        content: JSON.stringify({
          userPrompt: prompt,
          availableActions,                      // full catalogue passed here
        }),
      },
    ],
  });

  const raw = response.choices[0].message.content;
  if (!raw) throw new Error("DeepSeek returned empty content");

  // Strip any accidental markdown fences before parsing
  const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(clean);
  } catch {
    // Retry once with the parse error appended
    return parsePipelineFromNL(
      `${prompt}\n\nPrevious response was invalid JSON. Fix and return only valid JSON.`,
      availableActions
    );
  }

  // Validate against Zod schema
  return PipelineParseResultSchema.parse(parsed);
}
```

**Key DeepSeek-specific requirements:**
- `response_format: { type: "json_object" }` — must be set, and the word "json" must appear somewhere in the system or user prompt for it to activate (it does — the system prompt says "Return ONLY valid JSON")
- `max_tokens: 4096` — required; without this, large pipeline responses get truncated mid-JSON
- Use `deepseek-v4-flash` (not the deprecated `deepseek-chat`) — V4 Flash is the fast, cost-efficient model; `deepseek-v4-pro` is available as a fallback for complex pipelines but is slower
- Base URL is `https://api.deepseek.com` — the `/v1` suffix is optional but accepted; both work
- Response time target: < 3 seconds for typical 4–6 node pipelines

**Thinking mode:** Do NOT enable thinking mode (`"thinking": {"type": "enabled"}`) for the pipeline parser. Thinking mode adds latency and the structured JSON output is deterministic enough without it. Reserve thinking mode if you add a "Explain this pipeline" feature later.

---

### 5.2 `POST /api/run-pipeline`

**Purpose:** Execute all nodes in a pipeline sequentially, resolving data dependencies between steps.

**Request body:**
```json
{
  "pipeline": "Pipeline",
  "credentials": {
    "[nodeId]": { "username": "...", "password": "..." }
  }
}
```

**Response:** Server-Sent Events stream (SSE). Each event is one of:

```
event: node_start
data: { "nodeId": "...", "actionId": "..." }

event: node_complete
data: { "nodeId": "...", "output": { ... } }

event: node_error
data: { "nodeId": "...", "error": "..." }

event: waiting_for_input
data: { "nodeId": "...", "question": "...", "options": [...] }

event: pipeline_complete
data: { "runId": "...", "duration": 12340 }

event: pipeline_failed
data: { "runId": "...", "failedNodeId": "...", "error": "..." }
```

**Execution logic (in route.ts):**

```typescript
// Pseudocode — implement exactly:
async function executePipeline(pipeline, credentials, emit) {
  const ctx: RunContext = initRunContext(pipeline.id);
  const ordered = topologicalSort(pipeline.nodes, pipeline.edges);

  for (const node of ordered) {
    emit("node_start", { nodeId: node.id, actionId: node.actionId });
    
    // Resolve inputs: collect outputs from predecessor nodes
    const resolvedInputs = resolveInputsFromContext(node, pipeline.edges, ctx.nodeOutputs);
    const mergedConfig = { ...node.config, ...resolvedInputs };
    
    try {
      const result = await callWireAction(node.actionId, mergedConfig, credentials[node.id]);
      ctx.nodeOutputs[node.id] = result;
      emit("node_complete", { nodeId: node.id, output: result });
    } catch (err) {
      emit("node_error", { nodeId: node.id, error: err.message });
      emit("pipeline_failed", { runId: ctx.runId, failedNodeId: node.id, error: err.message });
      return; // stop on first error
    }
  }
  
  emit("pipeline_complete", { runId: ctx.runId, duration: Date.now() - startTime });
}
```

**Critical: topological sort.** Parse the DAG edges and sort nodes so each node executes only after all its predecessors have completed. Use Kahn's algorithm. This is a hard requirement — pipelines are meaningless without it.

---

### 5.3 `POST /api/wire/run-action`

**Purpose:** Execute a single Wire action via the Anakin API. This is the atomic unit called by the pipeline runner.

**Request body:**
```json
{
  "actionId": "string",      // e.g. "linkedin.profile.read"
  "inputs": { ... },         // action-specific input fields
  "credentials": {
    "username": "string",
    "password": "string"
  }
}
```

**Response:**
```json
{
  "success": true,
  "output": { ... },         // action-specific output fields
  "rawResponse": { ... },    // full Anakin API response for debugging
  "durationMs": 1240
}
```

**Anakin Wire API integration:**

The Anakin Wire API base URL is `https://api.anakin.io/v1`. Authentication via `X-API-Key` header. The Wire endpoint structure inferred from docs is:

```typescript
// lib/wire-client.ts
const ANAKIN_BASE = "https://api.anakin.io/v1";

export async function runWireAction(actionId: string, inputs: object, credentials: object) {
  const response = await fetch(`${ANAKIN_BASE}/holocron/run`, {
    method: "POST",
    headers: {
      "X-API-Key": process.env.ANAKIN_API_KEY!,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      action: actionId,
      inputs,
      credentials
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || `Wire action failed: ${response.status}`);
  }

  return response.json();
}
```

> ⚠️ **Note for the IDE:** The exact Wire action endpoint path (`/holocron/run` or similar) must be confirmed against live Anakin docs at `anakin.io/docs/api-reference/holocron`. The above is the pattern inferred from docs — check and adjust if the actual path differs.

---

### 5.4 `GET /api/wire/actions`

**Purpose:** Return the full Wire action catalogue so the frontend can display it and the LLM can reference it when parsing pipelines.

**Implementation strategy:**
- Fetch from `https://api.anakin.io/v1/holocron/actions` (or equivalent)
- Cache result in Vercel KV with a 10-minute TTL
- Augment each action with local metadata from `lib/action-registry.ts` (platform icons, category labels, example inputs/outputs)
- If Anakin API returns the full catalogue dynamically, that's the source of truth
- If not, build the local action registry from known documented Wire actions

**Local action registry fallback** (`lib/action-registry.ts`):

Build this registry file to cover the platforms visible in Anakin's own UI screenshots: Amazon, LinkedIn, Instagram, Twitter/X, Glassdoor, Shopify, Jira, Notion, Slack, Google Maps, Reddit, Airbnb, and any others discoverable from the Wire catalogue page. Each entry in the registry:

```typescript
export const ACTION_REGISTRY: WireAction[] = [
  {
    id: "linkedin.profile.read",
    platform: "linkedin",
    name: "Read Profile",
    description: "Extract public and authenticated profile data for a LinkedIn user",
    category: "read",
    requiresAuth: true,
    inputFields: [
      { key: "profileUrl", label: "Profile URL", type: "url", required: true, description: "Full LinkedIn profile URL", example: "https://linkedin.com/in/username" }
    ],
    outputFields: [
      { key: "name", label: "Full Name", type: "string", required: true, description: "" },
      { key: "headline", label: "Headline", type: "string", required: false, description: "" },
      { key: "currentRole", label: "Current Role", type: "object", required: false, description: "" },
      { key: "experience", label: "Experience", type: "object", required: false, description: "" }
    ]
  },
  // ... repeat for all known Wire actions
];
```

> Build this registry as exhaustively as possible from what's visible in the Anakin Wire catalogue. The more complete it is, the better the LLM pipeline parser performs.

---

### 5.5 `GET/POST/PUT/DELETE /api/pipelines` and `/api/pipelines/[id]`

Standard CRUD. Store pipelines in Vercel KV as JSON.

Key pattern: `pipeline:{userId}:{pipelineId}`

```typescript
// GET /api/pipelines — list all pipelines for authenticated user
// POST /api/pipelines — create new pipeline, returns pipeline with generated ID
// GET /api/pipelines/[id] — get single pipeline
// PUT /api/pipelines/[id] — update pipeline (after editing nodes/edges)
// DELETE /api/pipelines/[id] — delete pipeline
```

---

## 6. Frontend Components

### 6.1 `ComposerLayout.tsx`

Three-panel layout using CSS Grid:

```
[NLInputPanel 320px fixed] | [PipelineCanvas flex-1] | [NodeInspector 360px, slides in]
```

- NodeInspector panel is hidden by default and slides in from the right when a node is clicked
- On mobile (< 768px): stack vertically, canvas takes full screen, panels are drawers
- Top bar contains: Logo, Pipeline name (editable inline), Save button, Run button, Schedule button

### 6.2 `NLInputPanel.tsx`

Structure:
- Header: "Describe your workflow"
- Large textarea (min 120px, auto-expands): placeholder text cycling through example prompts
- "Parse Pipeline" button (primary, blue) — disabled while loading
- Loading state: animated "Thinking..." with streaming dots
- Below the button: `ExamplePipelines.tsx` — 4–6 clickable example workflow chips:
  - "Monitor Glassdoor reviews → post to Slack"
  - "Search LinkedIn for prospects → export to CSV"
  - "Track competitor prices on Amazon → alert if changed"
  - "Read new GitHub issues → create Linear tickets"
  - "Scrape job postings → draft applications"
  - "Monitor Trustpilot → reply via LinkedIn message"
- If AI returns `clarificationNeeded: true`: render a yellow-bordered clarification prompt box with the question text and a follow-up input field

### 6.3 `PipelineCanvas.tsx`

Built on **React Flow** (`reactflow` npm package). This is the core visual component.

**Setup:**
```tsx
import ReactFlow, {
  Background, Controls, MiniMap,
  useNodesState, useEdgesState,
  addEdge, ConnectionMode
} from 'reactflow';
import 'reactflow/dist/style.css';
```

**Required React Flow configuration:**
- `nodeTypes={{ wireAction: PipelineNode }}` — register custom node
- `edgeTypes={{ dataFlow: PipelineEdge }}` — register custom animated edge
- `connectionMode={ConnectionMode.Loose}`
- `fitView` on initial load and after pipeline parse
- `Background variant="dots"` with dark color matching theme
- `Controls` component: styled to match dark theme
- `MiniMap` component: small overview in bottom-right

**Canvas behaviors:**
- When pipeline is parsed from NL input: animate nodes appearing one by one (150ms stagger, slide-up with opacity)
- When a node is running: that node's border pulses with a CSS animation; all other nodes dim to 40% opacity
- When a run completes: all nodes show their status and outputs simultaneously; run a "success flash" animation across the canvas
- Nodes are drag-repositionable. Positions saved to pipeline state on drag end.
- Edges can be manually drawn by dragging from output handles to input handles
- Right-click on node: context menu with "Edit", "Remove", "Duplicate"

### 6.4 `PipelineNode.tsx`

Custom React Flow node. All styling inline or via Tailwind:

```tsx
// Visual structure:
<div className="pipeline-node" data-status={node.data.status}>
  
  {/* Header */}
  <div className="node-header">
    <img src={`/platform-icons/${node.data.platform}.svg`} className="w-4 h-4" />
    <span className="node-action-name font-mono text-xs">{node.data.label}</span>
    <StatusDot status={node.data.status} />
  </div>

  {/* Input handle */}
  <Handle type="target" position={Position.Left} />
  
  {/* Body */}
  <div className="node-body">
    {node.data.inputFields.slice(0, 2).map(f => (
      <div key={f.key} className="field-preview">
        <span className="field-key font-mono text-xs text-muted">{f.key}:</span>
        <span className="field-value text-xs truncate">
          {node.data.config[f.key] ? node.data.config[f.key] : <span className="text-muted italic">not set</span>}
        </span>
      </div>
    ))}
  </div>

  {/* Output preview (when status is success) */}
  {node.data.status === "success" && node.data.output && (
    <div className="node-output">
      <span className="text-success font-mono text-xs">✓ {Object.keys(node.data.output).length} fields</span>
    </div>
  )}

  {/* Output handle */}
  <Handle type="source" position={Position.Right} />

</div>
```

Node CSS (in globals.css or as Tailwind utilities):
```css
.pipeline-node {
  background: var(--node-bg);
  border: 1px solid var(--node-border);
  border-radius: 6px;
  min-width: 220px;
  max-width: 260px;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.pipeline-node:hover,
.pipeline-node.selected {
  border-color: var(--node-selected);
  box-shadow: 0 0 0 2px var(--accent-glow);
}
.pipeline-node[data-status="running"] {
  border-left: 2px solid var(--accent-primary);
  animation: node-pulse 1.5s ease-in-out infinite;
}
.pipeline-node[data-status="success"] {
  border-left: 2px solid var(--success);
}
.pipeline-node[data-status="error"] {
  border-left: 2px solid var(--error);
}
@keyframes node-pulse {
  0%, 100% { box-shadow: 0 0 0 0 var(--accent-glow); }
  50% { box-shadow: 0 0 0 6px transparent; }
}
```

### 6.5 `NodeInspector.tsx`

Right panel that opens when user clicks a node. Sections:

**Section 1: Action Info**
- Platform icon + action name (large)
- Description
- Category badge (read / write / search / monitor)
- Auth required indicator

**Section 2: Inputs**
For each input field on the selected action:
- Label + mono key name
- Input field (text, URL, etc.)
- Green "Data mapped from [upstream node]" badge if this input is fed by a predecessor node
- If not mapped: placeholder showing the field's example value

**Section 3: Credentials**
Only shown for nodes where `requiresAuth: true`:
- Warning banner: "Credentials are used only for this run and never stored on our servers."
- Username/email input (type="text")
- Password input (type="password", with show/hide toggle)
- Session cookie input (optional, for pre-authenticated sessions): collapsed behind a "Use saved session" toggle

**Section 4: Output Preview**
Only shown after a successful node run:
- JSON tree viewer showing the node's output
- Each field is a collapsible row
- Copy button on each value
- "Pass to..." button that opens an edge drawer for connecting this output to a downstream node

---

## 7. State Management (Zustand)

`lib/store.ts` — single store for the whole application:

```typescript
import { create } from 'zustand';

interface ComposerStore {
  // Pipeline state
  pipeline: Pipeline | null;
  setPipeline: (p: Pipeline) => void;
  updateNode: (nodeId: string, updates: Partial<PipelineNode>) => void;
  updateEdge: (edgeId: string, updates: Partial<PipelineEdge>) => void;
  
  // UI state
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
  inspectorOpen: boolean;
  setInspectorOpen: (open: boolean) => void;
  
  // Parse state
  parseStatus: "idle" | "loading" | "success" | "error";
  parseError: string | null;
  
  // Run state
  runStatus: "idle" | "running" | "complete" | "failed";
  runContext: RunContext | null;
  
  // Actions
  parseNLPrompt: (prompt: string) => Promise<void>;
  runPipeline: () => Promise<void>;
  resetRun: () => void;
}
```

---

## 8. Key Hooks

### 8.1 `usePipelineParser.ts`

```typescript
// When called with a prompt string:
// 1. Fetches available Wire actions from store or /api/wire/actions
// 2. POSTs to /api/parse-pipeline with prompt + actions
// 3. Updates store.pipeline with the returned DAG
// 4. Sets node positions (auto-layout left-to-right)
// 5. If clarificationNeeded, sets a clarification state for the UI to show
// Returns: { parse, status, clarification }
```

### 8.2 `usePipelineRunner.ts`

```typescript
// When called:
// 1. Validates that all required credential fields are filled across all nodes
// 2. If not, returns { missingCredentials: [...] } so UI can highlight them
// 3. Calls /api/run-pipeline with EventSource (SSE)
// 4. On each SSE event, updates the corresponding node's status in the store
// 5. On node_complete, updates node's output field in the store
// 6. On waiting_for_input, surfaces a modal asking the user the clarification question
// 7. On pipeline_complete or pipeline_failed, sets run status in store
```

---

## 9. Environment Variables

```bash
# .env.local (never commit this file)

# Anakin API
ANAKIN_API_KEY=ak-...

# DeepSeek API
DEEPSEEK_API_KEY=sk-...

# Vercel KV (auto-populated by Vercel when KV store is connected)
KV_URL=...
KV_REST_API_URL=...
KV_REST_API_TOKEN=...
KV_REST_API_READ_ONLY_TOKEN=...

# Auth (if using Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 10. Package Dependencies

```json
{
  "dependencies": {
    "next": "14.2.x",
    "react": "18.x",
    "react-dom": "18.x",
    "typescript": "5.x",
    "tailwindcss": "3.x",
    "reactflow": "^11.11.x",
    "zustand": "^4.5.x",
    "zod": "^3.23.x",
    "openai": "^4.x",
    "@vercel/kv": "^2.x",
    "nanoid": "^5.x",
    "clsx": "^2.x",
    "tailwind-merge": "^2.x"
  },
  "devDependencies": {
    "@types/node": "20.x",
    "@types/react": "18.x",
    "@types/react-dom": "18.x",
    "eslint": "8.x",
    "eslint-config-next": "14.x"
  }
}
```

> **No UI component library.** Build all UI primitives from scratch styled with Tailwind. The Anakin design system is too specific to map onto shadcn or Radix without fighting the styles. The components listed in `components/ui/` are simple and fast to build manually.

---

## 11. Pages & Routes

### `/` (Landing / Home)

If user is not authenticated: show a minimal landing page.
- Full-width dark hero: "Build web automations in plain English."
- Subheading: "Describe what you want. Get a live pipeline."
- Large animated example (looping: type prompt → pipeline assembles → runs → outputs)
- Single CTA button: "Start building →"
- Below fold: three feature cards (Parse · Run · Schedule)

If user is authenticated: redirect immediately to `/composer`.

### `/composer`

Main application. Three-panel layout as described. This is where 95% of time is spent.

### `/pipelines`

Saved pipelines list. Table layout:
- Columns: Name | Last run status | Last run time | Node count | Actions (Run / Edit / Delete)
- Empty state: centered illustration + "Build your first pipeline" button
- Each row is clickable → navigates to `/pipelines/[id]`

### `/pipelines/[id]`

Load a saved pipeline into the composer. Identical to `/composer` but pre-populated with the saved pipeline state.

---

## 12. Execution Error Handling

The pipeline runner must handle these failure cases gracefully:

| Error type | UI behavior |
|---|---|
| Wire action returns 401 | Highlight the node in red, open NodeInspector to credentials section, show "Credentials invalid or expired" message |
| Wire action returns 429 | Show "Rate limited — waiting 30s before retry" with countdown; auto-retry once |
| Wire action times out (>30s) | Node shows "Timed out" error; offer manual retry button on that node |
| No Wire action found for a pipeline step | Yellow "Unknown action" warning node rendered in canvas; AI suggests the closest available alternative |
| Network error during run | Pause execution, show "Connection lost — resume when ready" with a Resume button |
| Ambiguous data mapping (upstream output has multiple matching fields) | Pause at that edge, surface a "Which field?" selector in the node inspector |

---

## 13. Scheduling & Webhooks (ship if time allows)

### Schedule a pipeline

After a successful pipeline run, a "Schedule" button appears in the top bar.
- Opens a modal with a cron expression builder (simple UI: Every X minutes/hours/days)
- On save: stores the cron string on the Pipeline object
- Background job implementation: Vercel Cron Jobs (defined in `vercel.json`)

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/run-scheduled",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

The cron endpoint queries all pipelines with `schedule` set and runs any that are due.

### Webhook trigger

A "Deploy as Webhook" button generates a unique webhook URL: `/api/webhooks/[webhookId]`
- Calling this URL with POST triggers the pipeline
- Request body fields are available as a special `trigger.data` object that can be mapped to node inputs
- Use case: Slack slash command → wire composer pipeline → Slack reply

---

## 14. Boilerplate Decision

**Do not use any boilerplate.** Scaffold with:

```bash
npx create-next-app@latest wire-composer \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir=false \
  --import-alias="@/*"
```

The closest existing OSS skeleton would be `BuilderIO/visual-editing` or any React Flow demo — but both diverge enough from the required architecture that adapting them would take longer than building fresh. The React Flow integration is straightforward from their official docs. Start from the `create-next-app` output and build upward.

---

## 15. Build Order (Recommended for 48h)

Work in this exact order to always have a demoable state:

**Hour 0–3: Foundation**
- Scaffold Next.js app, configure Tailwind with color tokens from §2
- Set up environment variables
- Build `lib/wire-client.ts` — get a real Wire action running from a script
- Build the action registry (`lib/action-registry.ts`) with 10–15 real Wire actions

**Hour 3–6: LLM Pipeline Parser**
- Build `lib/deepseek.ts` with the system prompt from §5.1
- Build `/api/parse-pipeline` route
- Test parsing 5 different natural language prompts → validate DAG output
- Build `/api/wire/actions` route

**Hour 6–10: Canvas Core**
- Install React Flow, configure custom node and edge types
- Build `PipelineNode.tsx` and `PipelineEdge.tsx`
- Build `PipelineCanvas.tsx` with nodes rendering from store state
- Wire the parser to the canvas: type a prompt → pipeline appears

**Hour 10–14: Execution Engine**
- Build topological sort utility
- Build `/api/run-pipeline` SSE route
- Build `usePipelineRunner.ts` hook
- Test end-to-end: prompt → parse → run → outputs in node

**Hour 14–18: Node Inspector + Credentials**
- Build `NodeInspector.tsx` with all three sections
- Connect credentials to the run context
- Handle auth error states

**Hour 18–22: Polish + Error Handling**
- Implement all error states from §12
- Add node animations (running pulse, success flash)
- Build landing page
- Build saved pipelines list

**Hour 22–26: Save + Deploy**
- Set up Vercel KV, implement pipeline CRUD
- Deploy to Vercel
- Test full flow on deployment

**Hour 26–30: Buffer / Scheduling**
- If everything works: implement scheduling
- Fix any bugs found in deployed environment

**Remaining time: Demo prep**
- Build 3 showcase pipelines that run flawlessly
- Record demo video

---

## 16. Demo Pipeline Scripts (Must Work on Demo Day)

These three pipelines must be pre-built, pre-credentialed in a demo account, and ready to run live:

### Demo Pipeline 1: "Competitor Price Monitor"
```
[Amazon product page read] → [Extract price field] → [Compare to threshold] → [Post Slack message if lower]
```
4 nodes. Runs in ~8 seconds. Shows: read action + data passing + conditional + write action.

### Demo Pipeline 2: "LinkedIn Prospect to CRM"
```
[LinkedIn search by keyword] → [Read each profile] → [Extract contact fields] → [POST to Notion database]
```
4 nodes. Shows authenticated read + iteration + write to a different platform.

### Demo Pipeline 3: "Trustpilot Review Responder"
```
[Trustpilot reviews read] → [Filter 1-star reviews] → [Generate reply with DeepSeek] → [Post reply via Trustpilot write]
```
4 nodes. Shows: read → AI generation → write. The AI step is implemented as a custom "AI Transform" node type that calls DeepSeek V4 Flash mid-pipeline.

---

## 17. Critical Implementation Notes for the AI IDE

1. **React Flow node state sync**: React Flow manages its own node positions internally. Use `useNodesState` and `useEdgesState` from React Flow for the canvas, and sync changes back to Zustand store `onNodesChange` and `onEdgesChange`. Do not try to drive React Flow from Zustand directly — it creates circular update loops.

2. **SSE in Next.js App Router**: Use `new ReadableStream` with a `TransformStream` for the SSE endpoint. Do not use the legacy `res.write()` approach from Pages Router. Set response headers `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`.

3. **Credentials never in client state**: Credentials should only live in component state (React `useState`) within `NodeInspector.tsx`. Never put credentials in Zustand store (which can be inspected via devtools) or in any persisted state. Pass them to the run API as a one-time POST body. The backend should never log them.

4. **Wire API error handling**: The Anakin Wire API may return job-style async responses for some actions (queue → poll). Wrap all Wire calls in a polling loop that checks status every 2 seconds for up to 30 seconds before declaring a timeout.

5. **DeepSeek JSON mode**: Set `response_format: { type: "json_object" }` on every pipeline parse call AND ensure the word "json" appears in the system prompt (it does — see §5.1). Always parse the response through the Zod schema before trusting it. If DeepSeek returns empty content (a known occasional issue per their docs), retry once — do not surface the error to the user on first attempt. `deepseek-v4-flash` is fast enough for interactive use; fall back to `deepseek-v4-pro` only if Flash produces invalid JSON after 2 retries on a genuinely complex prompt.

6. **React Flow edge animations**: Animated edges (showing data flowing during execution) use React Flow's `animated: true` prop on the edge object. Toggle this to `true` when the source node is running and `false` when complete. This is a 1-line state update — lean on it for demo visual impact.

7. **Auto-layout**: After the LLM parses a pipeline, compute node positions automatically using a simple left-to-right layout algorithm based on topological depth. Nodes at depth 0 get x=100, depth 1 get x=380, depth 2 get x=660, etc. All nodes at the same depth get evenly-spaced y positions. Apply a `fitView()` call after setting positions.

---

*End of build specification.*
