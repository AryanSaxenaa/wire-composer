# Wire Composer

No-code visual pipeline builder that turns plain-English workflow descriptions into executable multi-step web automation chains. Think of it as Zapier — but the primitive isn't an official API, it's the entire authenticated live web.

## Features

- **Natural Language → Pipeline DAG** — Describe a workflow in plain English, get a structured visual pipeline with nodes, edges, and data mappings back. Powered by DeepSeek V4 Flash.
- **Visual Canvas** — Drag, inspect, and connect nodes on a React Flow canvas with live status indicators, animated edges, and execution pulse states.
- **Streaming Execution Engine** — Topological sort resolves execution order and data dependencies. SSE streams live progress back to the canvas in real-time.
- **22 Actions / 14 Platforms** — LinkedIn, Amazon, Twitter/X, Instagram, Glassdoor, Shopify, Jira, Notion, Slack, Google Maps, Reddit, Airbnb, GitHub, Trustpilot across read, write, search, and monitor categories.
- **Credential Security** — Credentials live only in a React context via refs — never in Zustand, never logged server-side. Passed as one-time POST body on run.
- **Full Persistence** — Save, load, update, and delete pipelines via Vercel KV. Browse saved pipelines at `/pipelines`, load one back into the composer at `/pipelines/[id]`.
- **Node Inspector** — Right panel shows action info, input forms with upstream data-mapping detection, credential fields with security warning, and live output preview.

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│  TopBar (pipeline name, Save, Schedule, Run)                     │
├────────────┬──────────────────────────────────────┬───────────────┤
│ NL Input   │  Pipeline Canvas                    │ Node          │
│ Panel      │  (React Flow DAG)                   │ Inspector     │
│ 320px      │  flex-1                              │ 360px (slide) │
├────────────┴──────────────────────────────────────┴───────────────┤
│  RunStatusBar (execution progress)                                │
└──────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. User types a natural language workflow description → "Parse Pipeline"
2. `POST /api/parse-pipeline` sends prompt + action catalogue to DeepSeek V4 Flash
3. Model returns structured JSON DAG (nodes, edges, data mappings with confidence scoring)
4. Zustand store receives the pipeline; React Flow renders it as a visual graph
5. User fills credentials/inputs via the Node Inspector
6. "Run" → `POST /api/run-pipeline` executes via topological sort, streaming SSE events
7. Live status flows back through SSE → Zustand store → React Flow canvas

### Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS 4 (custom dark theme) |
| Visual Canvas | React Flow 11 |
| State | Zustand 4 |
| AI Pipeline Parser | DeepSeek V4 Flash (OpenAI-compatible SDK) |
| Web Actions | Anakin Wire API |
| Persistence | Vercel KV (Redis) |
| Validation | Zod |
| IDs | nanoid 5 |

### Directory Structure

```
wire-composer/
├── app/
│   ├── layout.tsx              # Root layout, Inter + JetBrains Mono fonts
│   ├── page.tsx                # Landing page
│   ├── globals.css             # Design tokens, React Flow overrides, animations
│   ├── composer/page.tsx       # Main composer (fetches Wire actions on mount)
│   ├── pipelines/page.tsx      # Saved pipelines table
│   ├── pipelines/[id]/page.tsx # Load saved pipeline into composer
│   └── api/
│       ├── parse-pipeline/route.ts   # POST: NL → DAG via DeepSeek
│       ├── run-pipeline/route.ts     # POST: SSE stream execution
│       ├── pipelines/route.ts        # GET list, POST create
│       ├── pipelines/[id]/route.ts   # GET, PUT, DELETE single pipeline
│       ├── wire/actions/route.ts     # GET: action catalogue (10min cache)
│       └── wire/run-action/route.ts  # POST: single Wire action execution
├── components/
│   ├── composer/                # PipelineCanvas, PipelineNode, PipelineEdge,
│   │                            # NodeInspector, NlInputPanel, RunStatusBar,
│   │                            # SavePipelineDialog, ComposerLayout
│   ├── layout/                  # TopBar, Sidebar
│   └── ui/                      # Button, Badge, Input, Select, Textarea,
│                                # Spinner, CodeBlock, StatusDot, Tooltip,
│                                # ConfirmDialog, ToastContainer, Logo
├── lib/
│   ├── store.ts                 # Zustand store (pipeline, UI, parse, run state)
│   ├── deepseek.ts              # DeepSeek client + pipeline compiler prompt
│   ├── wire-client.ts           # Anakin Wire API wrapper
│   ├── pipeline-schema.ts       # Zod schemas for all data models
│   ├── action-registry.ts       # 22 Wire actions across 14 platforms
│   ├── topological-sort.ts      # Kahn's algorithm + input resolution
│   ├── pipeline-store.ts        # Vercel KV CRUD helpers
│   └── credentials-context.tsx  # React context for credential isolation
├── hooks/
│   ├── usePipelineParser.ts     # Parse hook wrapping store
│   ├── usePipelineRunner.ts     # SSE run hook with credential validation
│   └── useWireActions.ts        # Fetch + cache Wire actions
└── types/index.ts               # Shared TypeScript interfaces
```

## Getting Started

### Prerequisites

- Node.js 20+
- A [DeepSeek API key](https://platform.deepseek.com)
- An [Anakin Wire API key](https://anakin.io)
- A [Vercel KV](https://vercel.com/storage/kv) instance (for pipeline persistence)

### Environment Variables

Create a `.env.local` file in the project root:

```bash
DEEPSEEK_API_KEY=sk-...
ANAKIN_API_KEY=ak-...
KV_URL=redis://...
KV_REST_API_URL=https://...
KV_REST_API_TOKEN=...
KV_REST_API_READ_ONLY_TOKEN=...
```

### Install & Run

```bash
npm install
npm run dev        # Start dev server → http://localhost:3000
```

### Production

```bash
npm run build
npm run start
```

## Demo Pipelines

**Competitor Price Monitor**
Amazon product read → extract price → compare threshold → Slack message
4 nodes

**LinkedIn Prospect to CRM**
LinkedIn search → profile read → extract fields → Notion database insert
4 nodes

**Trustpilot Review Responder**
Trustpilot reviews read → filter 1-star → AI reply generation → post reply
4 nodes

## Design

Custom dark theme built from scratch — no component library. Color system uses near-black backgrounds (`#0a0a0f`), blue-purple accents (`#4f6ef7`), monospaced typography throughout (Inter + JetBrains Mono), and sharp functional grid layouts. Every UI component is hand-crafted for the Anakin.io developer aesthetic.
