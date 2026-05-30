# Wire Composer

No-code visual pipeline builder that turns plain-English workflow descriptions into executable multi-step web automation chains. Think of it as Zapier — but the primitive isn't an official API, it's the entire authenticated live web.

## Features

- **Natural Language → Pipeline DAG** — Describe a workflow in plain English, get a structured visual pipeline with nodes, edges, and data mappings. Powered by DeepSeek.
- **Visual Canvas** — React Flow canvas with step cards, status indicators, minimap, and an on-canvas status panel during runs.
- **Streaming Execution** — Topological sort resolves order and dependencies; SSE streams live progress to the canvas.
- **Action catalogue** — LinkedIn, Amazon, Twitter/X, Instagram, Glassdoor, Shopify, Jira, Notion, Slack, Google Maps, Reddit, Airbnb, GitHub, Trustpilot and more (see `lib/action-registry.ts`).
- **Credential security** — Credentials stay in a React context in the browser; sent only when you run a pipeline.
- **Persistence** — Save, load, update, and delete pipelines via Vercel KV at `/pipelines` and `/pipelines/[id]`.

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│  TopBar (name, Saved badge, Library, Save, Run / Cancel)         │
├────────────┬──────────────────────────────────────┬───────────────┤
│ NL Input   │  Pipeline Canvas                    │ Node          │
│ + examples │  (React Flow, minimap, status card) │ Inspector     │
│ 320px      │  flex-1                              │ 360px (slide) │
└────────────┴──────────────────────────────────────┴───────────────┘
```

### Data flow

1. User describes a workflow → **Parse pipeline**
2. `POST /api/parse-pipeline` → DeepSeek returns a JSON DAG
3. Zustand store + React Flow render the graph (vertical auto-layout)
4. User configures inputs and credentials in the Node Inspector
5. **Run** → `POST /api/run-pipeline` (SSE) updates node status on the canvas

### Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js (App Router) |
| Language | TypeScript |
| Styling | Scoped light theme (`app/composer.css`, `app/landing.css`) + Tailwind |
| Canvas | React Flow 11 |
| State | Zustand |
| Parser | DeepSeek (OpenAI-compatible) |
| Actions | Anakin Wire API |
| Persistence | Vercel KV |

### Directory structure

```
app/
  page.tsx                 # Landing
  composer/page.tsx        # Composer shell
  pipelines/               # List + /[id] editor
  api/                     # parse, run, pipelines, wire
components/
  landing/                 # Landing page
  composer/                # Canvas, nodes, NL panel, inspector, status card
  layout/                  # TopBar, AppHeader
  ui/                      # Button, Input, ToastContainer, …
lib/                       # store, schemas, wire client, KV, credentials
hooks/                     # useWireActions, usePipelineRunner
```

## Getting started

### Prerequisites

- Node.js 20+
- [DeepSeek API key](https://platform.deepseek.com)
- [Anakin Wire API key](https://anakin.io)
- [Vercel KV](https://vercel.com/storage/kv) for saved pipelines

### Environment

```bash
DEEPSEEK_API_KEY=sk-...
ANAKIN_API_KEY=ak-...
KV_URL=redis://...
KV_REST_API_URL=https://...
KV_REST_API_TOKEN=...
KV_REST_API_READ_ONLY_TOKEN=...
```

### Run

```bash
npm install
npm run dev    # http://localhost:3000
npm run build
```

## Routes

| Route | Purpose |
|-------|---------|
| `/` | Marketing landing |
| `/composer` | New pipeline |
| `/pipelines` | Saved pipelines |
| `/pipelines/[id]` | Edit saved pipeline |
