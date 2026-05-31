# Wire Composer

No-code visual pipeline builder: describe a workflow in plain English, get an executable multi-step graph backed by the [Anakin Wire API](https://anakin.io). No user accounts — runs use your API keys (server-side for Wire; session-only for optional credentials).

## Features

- **NL → DAG** — `POST /api/parse-pipeline` (DeepSeek) builds nodes, edges, and field mappings; sidebar **Examples** load verified curated templates (Polymarket, GitHub, Product Hunt, Airbnb).
- **Visual composer** — React Flow canvas, minimap, node inspector, run status bar.
- **Built-in steps** — `wire.data.extract`, `wire.condition.compare`, `wire.filter.reviews`, `wire.ai.transform`, `wire.trigger.webhook`.
- **Streaming runs** — Topological execution + SSE (`lib/pipeline-executor.ts`); inspector overrides win over upstream mappings.
- **Persistence** — Save / load pipelines in Vercel KV.
- **Schedule & webhooks** — Cron + deployable webhook URLs.

## Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS 4 |
| Canvas | React Flow 11 |
| State | Zustand |
| Parser | DeepSeek (`lib/deepseek.ts`) |
| Wire | Anakin catalog (`lib/anakin-catalog.ts`) + fallbacks for example actions (`lib/anakin-fallback-actions.ts`) |
| Persistence | Vercel KV |

## Project layout

```
app/
  composer/          # Main builder
  pipelines/         # Library + saved pipeline view
  api/               # parse-pipeline, run-pipeline, pipelines, wire, cron, webhooks
components/composer/ # Canvas, NL panel, examples, inspector, run bar
lib/                 # executor, examples, merge/resolve inputs, Wire client
hooks/               # useWireActions, usePipelineParser, usePipelineRunner
scripts/             # Local smoke tests (node --env-file=.env.local scripts/…)
```

## Getting started

### Prerequisites

- Node.js 20+
- [DeepSeek API key](https://platform.deepseek.com)
- [Anakin API key](https://anakin.io)
- [Vercel KV](https://vercel.com/storage/kv) (optional locally; required for save/library)

### Environment

Create `.env.local`:

```bash
DEEPSEEK_API_KEY=sk-...
ANAKIN_API_KEY=ak-...

KV_URL=redis://...
KV_REST_API_URL=https://...
KV_REST_API_TOKEN=...
KV_REST_API_READ_ONLY_TOKEN=...

CRON_SECRET=...
ANAKIN_CREDENTIAL_ID=...   # optional Wire identity UUID

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Commands

```bash
npm install
npm run dev          # http://localhost:3000
npm run build
npm run start
npm run diagnose:anakin
```

### Local tests

```bash
node --env-file=.env.local scripts/test-sanitize-wire-params.mjs
node --env-file=.env.local scripts/test-example-templates.mjs
node --env-file=.env.local scripts/test-parse-pipeline-local.mjs
```

## Routes

| Route | Purpose |
|-------|---------|
| `/` | Landing |
| `/composer` | Build / run pipelines |
| `/pipelines` | Saved pipelines |
| `/pipelines/[id]?run=1` | Open and auto-run |

## API (summary)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/parse-pipeline` | NL → DAG (or curated example match) |
| POST | `/api/run-pipeline` | Execute pipeline (SSE) |
| GET/POST | `/api/pipelines` | List / create |
| GET/PUT/DELETE | `/api/pipelines/[id]` | CRUD |
| GET | `/api/wire/actions` | Action catalogue |
| POST | `/api/wire/run-action` | Single Wire action |

Deployment details: see `deployment-info.md` (gitignored locally if you keep secrets there).
