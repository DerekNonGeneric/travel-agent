# TravelMate AI

An intelligent travel assistant chatbot built with Node.js, TypeScript, Next.js, and the Vercel AI SDK.

TravelMate helps users find flights, plan itineraries, estimate budgets, and explore destinations. It recognizes 12 travel intents (plus `unknown` and `off_topic`), extracts trip details, remembers context across the conversation, and replies in English or Spanish.

## NLP techniques

| Technique | Where | What you can see |
|---|---|---|
| Intent recognition | `classifyIntent.ts` | Intent chip on every reply, "How I understood you" panel |
| Named entity recognition | `classifyIntent.ts` | Extracted origin, destination, dates, budget, travelers |
| Contextual reference resolution | `classifyIntent.ts`, `tripContext.ts` | "Your trip" card fills in across turns (e.g. "make it 2 people") |

## Project layout

| Path | Purpose |
|---|---|
| `systemPrompt.ts` | TravelMate system prompt and greeting |
| `intents.ts` | The 14 intent labels |
| `classifyIntent.ts` | Intent + entity + language classifier (structured output with zod) |
| `responses.ts` | Fixed replies for help, unknown, and off-topic (English and Spanish) |
| `tripContext.ts` | Merges trip details across turns |
| `index.ts` | Terminal version of the chatbot (`pnpm cli`) |
| `app/`, `components/`, `lib/` | Web app for user testing |
| `app/admin` | Results dashboard for Phase 4 (testing and evaluation) |

## Run locally

```bash
pnpm install
cp .env.example .env   # then fill in the values
pnpm dev               # web app at http://localhost:3000
pnpm cli               # terminal version
```

Environment variables:

| Variable | Required | Description |
|---|---|---|
| `OPENAI_API_KEY` | Yes | OpenAI API key |
| `ACCESS_CODE` | Yes | Code testers enter on the welcome screen |
| `ADMIN_CODE` | Yes | Code for the `/admin` results dashboard |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | For deployment | Upstash Redis, so test results are saved. Without them, results are kept in memory and lost on restart. |
| `OPENAI_MODEL` | No | Override the model (default `gpt-5.1`) |

## Deploy to Vercel

1. Import this GitHub repository at [vercel.com/new](https://vercel.com/new). Vercel detects Next.js automatically.
2. In the project's **Storage** tab, add an **Upstash for Redis** database and connect it to the project. This sets `KV_REST_API_URL` and `KV_REST_API_TOKEN`.
3. In **Settings → Environment Variables**, add `OPENAI_API_KEY`, `ACCESS_CODE`, and `ADMIN_CODE`.
4. Redeploy. Share the site URL and the access code with testers.
5. Set a monthly spending limit on the OpenAI account.

## User testing (Phase 4)

Testers open the link, enter their first name and the access code, and chat. They can rate each reply (👍/👎) and fill in a one-minute survey.

Open `/admin` and enter the admin code to see:

- intent accuracy (mark each detected intent ✓ or ✗)
- helpful-reply rate, average rating, and whether testers felt the bot remembered context
- messages by intent and a summary table for the report
- full transcripts, with CSV and JSON export
