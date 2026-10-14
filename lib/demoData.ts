import type {
  AssistantMessage,
  ExtractedSource,
  KeyFinding,
  SearchResult,
  StructuredRow,
} from "@/types";

// All data in this file is DEMO DATA. It is clearly labelled in the UI and is
// never presented as live search results.

export const DEMO_SOURCES: ExtractedSource[] = [
  {
    id: "demo-src-1",
    url: "https://example.org/demo/transformer-efficiency",
    domain: "example.org",
    title: "Transformer Efficiency Benchmarks (Demo)",
    text: "DEMO DATA. Reported training cost reductions of roughly 40% across three public benchmarks. The study measures throughput and memory footprint, not real-world revenue impact.",
    wordCount: 26,
    retrievedAt: "2026-01-15T10:00:00.000Z",
    demo: true,
  },
  {
    id: "demo-src-2",
    url: "https://example.org/demo/coastal-risk",
    domain: "example.org",
    title: "Coastal Flood Risk Snapshot (Demo)",
    text: "DEMO DATA. Illustrative figures describing sea-level rise of 3.3 mm per year and a 45% increase in reported flood events over a decade. Sources underlying these demo numbers are intentionally omitted.",
    wordCount: 29,
    retrievedAt: "2026-01-14T14:30:00.000Z",
    demo: true,
  },
];

export const DEMO_RESULTS: SearchResult[] = DEMO_SOURCES.map((s) => ({
  id: s.id,
  title: s.title,
  url: s.url,
  domain: s.domain,
  snippet: s.text,
}));

export const DEMO_ROWS: StructuredRow[] = [
  {
    id: "demo-row-1",
    label: "Training cost (demo)",
    fields: { metric: "Training cost", value: "-40%", period: "2024-2026" },
    sources: [DEMO_SOURCES[0]!.url],
  },
  {
    id: "demo-row-2",
    label: "Sea-level rise (demo)",
    fields: { metric: "Sea-level rise", value: "3.3 mm/yr", period: "decadal" },
    sources: [DEMO_SOURCES[1]!.url],
  },
];

export const DEMO_FINDINGS: KeyFinding[] = [
  {
    id: "demo-find-1",
    text: "DEMO: efficiency gains are reported on benchmarks, not deployment.",
    sourceUrls: [DEMO_SOURCES[0]!.url],
  },
  {
    id: "demo-find-2",
    text: "DEMO: coastal figures are illustrative and not independently verified here.",
    sourceUrls: [DEMO_SOURCES[1]!.url],
  },
];

export const DEMO_MESSAGES: AssistantMessage[] = [
  {
    id: "demo-msg-1",
    role: "assistant",
    content:
      "DEMO. This assistant only works with sources you supply in this session and clearly marks demo data. Configure AI_API_KEY for live responses.",
    citations: [],
    grounded: false,
  },
];