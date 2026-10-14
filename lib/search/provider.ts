import type { SearchResult } from "@/types";

export interface RawSearchOutcome {
  configured: boolean;
  provider: string;
  results: SearchResult[];
}

function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function isHttpUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

// Tavily-compatible search. Returns configured=false when no key is present so
// callers can render an honest "search not configured" state instead of fake results.
export async function runSearch(query: string, limit = 10): Promise<RawSearchOutcome> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    return { configured: false, provider: "none", results: [] };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        max_results: Math.min(Math.max(limit, 1), 20),
        search_depth: "basic",
        include_answer: false,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`Search provider responded ${res.status}`);
    }

    const data: unknown = await res.json();
    const raw = (data as { results?: unknown[] }).results ?? [];
    const results: SearchResult[] = [];

    raw.forEach((item, index) => {
      const r = item as Record<string, unknown>;
      const url = r.url;
      if (!isHttpUrl(url)) return;
      results.push({
        id: `r-${index}-${domainOf(url)}`,
        title: typeof r.title === "string" && r.title.trim() ? r.title : url,
        url,
        domain: domainOf(url),
        snippet: typeof r.content === "string" ? r.content : "",
      });
    });

    return { configured: true, provider: "tavily", results };
  } finally {
    clearTimeout(timeout);
  }
}