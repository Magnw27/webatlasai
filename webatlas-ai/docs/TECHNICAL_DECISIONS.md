# WebAtlas AI — Technical Decisions

## Stack

- **Next.js 14 (App Router) + TypeScript** as specified in the project brief.
- **Tailwind CSS** for a restrained, consistent visual system.
- **Cheerio** for server-side HTML parsing during source extraction.
- **Node's built-in test runner** (`node --test`) for unit tests.

## Why Node's built-in test runner instead of Vitest/Jest

Vitest and Jest both pull in `esbuild`, whose native binary crashed with
`SIGBUS` in this environment. Next.js does not require esbuild, so the app runs
fine, but the test tooling did not. Node 22+ can run TypeScript test files
directly via type stripping, so the unit tests use `node --test` with no native
binary dependency. This keeps the dependency tree small and the tests reliable.

Trade-off: no component (DOM) tests. The tested surface is the pure logic that
carries the honesty guarantees — HTML normalisation, URL safety guards, and
stat/structured-data extraction. Component behaviour is verified by the
production build plus manual checks.

## Honesty and safety choices

- **No fabricated search results.** `/api/search` returns `503` with
  `notConfigured: true` when no provider key exists. The UI renders a clear
  notice; it never substitutes demo data for live results.
- **Demo data is labelled.** Everything in `lib/demoData.ts` is marked
  "DEMO" in its text and rendered behind a visible **Demo data** badge.
- **AI is grounded and optional.** The assistant only receives the sources the
  client sends, is instructed never to invent sources, and must label its own
  inference. Without `AI_API_KEY` it returns a clear "not configured" message
  and the rest of the app keeps working.
- **SSRF guards in extraction.** `lib/scraper/extract.ts` allows only `http`/
  `https`, blocks `localhost`, `.local`, and private IPv4 ranges, caps response
  size, and applies a 15s timeout.
- **No secrets in the client.** Provider keys are read only inside route
  handlers via `process.env`; `/api/status` exposes only booleans.

## State

Session state (query, results, extracted sources, assistant messages) lives in
React context and is mirrored to `sessionStorage`. There is no server-side
persistence, which matches the "free-first" constraint and avoids collecting
unnecessary personal data.

## Known limitations

- No live search or AI until keys are provided.
- Single-page session history only (no long-term history store).
- Extraction targets text-heavy HTML; PDFs and JS-rendered pages are out of
  scope for v0.1.
