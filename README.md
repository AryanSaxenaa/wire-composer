# Wire Composer

No-code visual pipeline builder: describe a workflow in plain English, get an executable multi-step graph backed by the [Anakin Wire API](https://anakin.io). No user accounts — everything runs in the browser and on your API keys.

## Features

- **NL → DAG** — `POST /api/parse-pipeline` (DeepSeek V4 Flash) builds nodes, edges, and field mappings.
- **Visual composer** — Dark-themed React Flow canvas, minimap, node inspector, bottom run status bar with expandable steps.
- **Built-in steps** — `wire.data.extract`, `wire.condition.compare`, `wire.filter.reviews`, `wire.ai.transform` for logic without extra Wire actions.
- **Demo pipelines** — Three pre-built workflows in `lib/demo-pipelines.ts` (real execution, not mocked).
- **Streaming runs** — Topological sort + SSE via `lib/pipeline-executor.ts`; cycle detection, gates, retries, ambiguous-field picker.
- **Persistence** — Save / load / update / delete pipelines in Vercel KV (`PUT` for updates, `POST` for new).
- **Schedule & webhooks** — Cron via `vercel.json` + `/api/cron/run-scheduled`; deploy webhooks from the top bar.
- **Credentials** — Session-only in `lib/credentials-context.tsx`; never written to KV (see `lib/sanitize-pipeline.ts`).

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│ TopBar: New · Library · Save · Schedule · Deploy Webhook · Run/Cancel   │
├──────────────┬──────────────────────────────────────────┬───────────────┤
│ NL + examples│ Pipeline canvas + RunStatusBar (bottom)  │ Node inspector│
│ + demo loads │ React Flow · empty state · context menu  │ 360px slide-in│
│ 320px        │ flex-1                                   │               │
└──────────────┴──────────────────────────────────────────┴───────────────┘
```

### Data flow

1. Describe workflow or load a demo → **Parse** or load from KV.
2. Auto-layout left-to-right (`lib/auto-layout.ts`) after parse.
3. Configure inputs / credentials in the inspector.
4. **Run** → `POST /api/run-pipeline` (SSE) → shared `executePipeline()`.
5. **Save** → sanitized JSON to KV; **Schedule** / **Webhook** for automation.

### Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS 4 (`app/globals.css`, `app/composer.css`, `app/landing.css`) |
| Canvas | React Flow 11 |
| State | Zustand (`lib/store.ts`) |
| Parser / AI transform | DeepSeek via OpenAI SDK (`lib/deepseek.ts`, `lib/deepseek-transform.ts`) |
| Wire actions | Anakin API (`lib/wire-client.ts`) |
| Persistence | Vercel KV (`lib/pipeline-store.ts`) |
| Cron | `cron-parser` + Vercel Cron |

## Project layout

```
app/
  page.tsx                      # Landing
  composer/page.tsx             # Composer
  pipelines/page.tsx            # Library (Sidebar + table)
  pipelines/[id]/               # Load saved pipeline (?run=1 auto-starts)
  api/parse-pipeline|run-pipeline|pipelines|wire|cron|webhooks/
components/composer/            # Canvas, nodes, NL panel, inspector, demos, RunStatusBar
components/layout/              # TopBar, Sidebar, AppHeader
components/landing/             # Marketing page
lib/                            # executor, registry, builtins, demos, store, KV, schemas
hooks/                          # useWireActions, usePipelineParser, usePipelineRunner
public/platform-icons/          # Per-platform SVGs
vercel.json                     # Cron: */5 → /api/cron/run-scheduled
wire-composer-build-spec.md     # Full product & API specification
```

## Getting started

### Prerequisites

- Node.js 20+
- [DeepSeek API key](https://platform.deepseek.com) (parse + `wire.ai.transform` demos)
- [Anakin API key](https://anakin.io) (Wire steps)
- [Vercel KV](https://vercel.com/storage/kv) (optional locally; required for save/library)

### Environment

Create `.env.local`:

```bash
DEEPSEEK_API_KEY=sk-...
ANAKIN_API_KEY=ak-...

# Vercel KV (from Vercel dashboard when KV is linked)
KV_URL=redis://...
KV_REST_API_URL=https://...
KV_REST_API_TOKEN=...
KV_REST_API_READ_ONLY_TOKEN=...

# Production cron (Vercel sends Authorization: Bearer <CRON_SECRET>)
CRON_SECRET=...

# Optional: server-side creds for cron/webhook runs (not stored in KV)
WIRE_CRED_SLACK_TOKEN=...
WIRE_CRED_LINKEDIN_PASSWORD=...
# Pattern: WIRE_CRED_{PLATFORM}_USER|PASSWORD|TOKEN|SESSION

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Commands

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
npm run start
```

## Routes

| Route | Purpose |
|-------|---------|
| `/` | Landing |
| `/composer` | New / edit in-memory pipeline |
| `/pipelines` | Saved pipelines list |
| `/pipelines/[id]` | Open saved pipeline |
| `/pipelines/[id]?run=1` | Open and auto-run once loaded |

## API (summary)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/parse-pipeline` | NL → DAG |
| POST | `/api/run-pipeline` | Execute pipeline (SSE) |
| GET/POST | `/api/pipelines` | List / create |
| GET/PUT/DELETE | `/api/pipelines/[id]` | CRUD |
| POST | `/api/pipelines/[id]/webhook` | Assign webhook URL |
| POST | `/api/webhooks/[webhookId]` | Trigger pipeline |
| GET | `/api/cron/run-scheduled` | Run due schedules (Bearer `CRON_SECRET`) |
| GET | `/api/wire/actions` | Action catalogue |
| POST | `/api/wire/run-action` | Single Wire action |

See `wire-composer-build-spec.md` for request/response shapes and design tokens.

## Documentation

- **`wire-composer-build-spec.md`** — Source of truth for models, API contracts, UI spec, demos, and implementation notes.
- **`README.md`** (this file) — Quick orientation and setup.
