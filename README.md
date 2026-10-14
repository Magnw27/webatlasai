# WebAtlas AI

A web search and research workspace. **Find it. Understand it. Verify it.**

Core principle: **Search first. Evidence first. AI when useful.**
Flow: Search → Sources → Research → Structured Data → Optional AI.

## What it does

- **Search** — real web results from a configured provider (Tavily). If no key is
  set, it says so plainly instead of inventing results.
- **Source extraction** — fetch an allowed public page, clean and normalise the
  text, keep the source URL and retrieval time, and deduplicate repeats.
- **Research** — a summary view and key findings, each carrying the source URL it
  came from. No numeric claim is shown unless it appears in the extracted text.
- **Data** — structured rows with sorting, filtering, and a source link per row.
- **History** — the current session, stored in the browser only.
- **Settings** — shows which providers are configured.
- **AI Assistant** — closed by default. Grounded only in sources you supply, and
  it labels its own inference. The app stays fully usable when AI is unavailable.

## Requirements

- Node.js 18+
- A Tavily API key for live search (optional)
- An OpenAI-compatible API key for the AI assistant (optional)

## Setup

```bash
npm install
cp .env.example .env.local   # then fill in keys (all optional)
```

Environment variables (server-side only, never exposed to the browser):

| Variable      | Purpose                                   |
| ------------- | ----------------------------------------- |
| `TAVILY_API_KEY` | Enables live web search.               |
| `AI_API_KEY`     | Enables the AI assistant.              |
| `AI_BASE_URL`    | OpenAI-compatible endpoint base URL.   |
| `AI_MODEL`       | Model name for the assistant.          |

## Run

```bash
# Development (port 3000)
npm run dev

# Production
npm run build
npm start
```

Open <http://localhost:3000>.

## Quality checks

```bash
npm run lint       # ESLint
npm run typecheck  # TypeScript, strict
npm run test       # Vitest
npm run build      # Production build
```

## Experience and safety

- Search-first homepage with a minimal, responsive layout and quick access to AI research.
- Search results must come from the configured provider; missing configuration and failures are shown honestly.
- Extracted pages are treated as untrusted evidence. Redirects and resolved addresses are checked to reduce SSRF risk, and response bodies are size-limited.
- Mobile is a first-class target: no horizontal overflow, long URLs wrap, tables scroll only inside a bounded region, and the assistant opens as a panel.
- Accessibility: semantic HTML, labelled controls, visible focus, reduced-motion support, and clear loading/error states.

## Honesty rules

- Search results are never fabricated. A failed provider shows an error.
- Demo data is always labelled **Demo data**.
- AI output is separated from source facts; the assistant admits uncertainty and
  never claims to have browsed anything it did not receive.

## Project layout

```
app/            routes and API handlers (search, extract, ai, status)
components/     layout, session, search, ai, ui
lib/            search provider, scraper, ai provider, transforms, store
types/          shared types
tests/          vitest unit tests
```