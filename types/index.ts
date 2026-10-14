export interface SearchResult {
  id: string;
  title: string;
  url: string;
  domain: string;
  snippet: string;
  publishedDate?: string;
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
  provider: string;
  tookMs: number;
}

export interface ExtractedSource {
  id: string;
  url: string;
  domain: string;
  title: string;
  text: string;
  wordCount: number;
  retrievedAt: string;
  demo?: boolean;
}

export interface DataField {
  key: string;
  value: string;
  sourceUrl: string;
  sourceIndex: number;
}

export interface StructuredRow {
  id: string;
  label: string;
  fields: Record<string, string>;
  sources: string[];
}

export interface KeyFinding {
  id: string;
  text: string;
  sourceUrls: string[];
}

export type AssistantRole = "user" | "assistant";

export interface AssistantMessage {
  id: string;
  role: AssistantRole;
  content: string;
  citations: string[];
  grounded: boolean;
}