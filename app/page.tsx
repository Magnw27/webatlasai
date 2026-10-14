"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ResultCard } from "@/components/search/ResultCard";
import { ErrorNotice, Loading } from "@/components/ui/Primitives";
import { useSession } from "@/components/session/SessionProvider";
import type { SearchResult } from "@/types";

const SUGGESTIONS = [
  "Berita teknologi terbaru",
  "Apa itu machine learning?",
  "Energi surya vs energi angin",
];

export default function HomePage() {
  const { query, results, setQuery, setResults, sources, hydrated } = useSession();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notConfigured, setNotConfigured] = useState(false);
  const [searched, setSearched] = useState(false);
  const [elapsed, setElapsed] = useState<number | null>(null);

  useEffect(() => {
    if (!hydrated || !query) return;
    setInput(query);
    setSearched(results.length > 0);
  }, [hydrated, query, results.length]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const term = input.trim();
    if (term.length < 2 || loading) return;

    setLoading(true);
    setError(null);
    setNotConfigured(false);
    setSearched(true);
    setElapsed(null);

    try {
      const started = Date.now();
      const response = await fetch(`/api/search?q=${encodeURIComponent(term)}`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      const data = (await response.json()) as {
        query?: string;
        results?: SearchResult[];
        error?: string;
        notConfigured?: boolean;
        tookMs?: number;
      };

      if (!response.ok) {
        if (data.notConfigured) {
          setNotConfigured(true);
          setResults([]);
          setQuery(term);
          return;
        }
        throw new Error(data.error ?? `Search failed (HTTP ${response.status}).`);
      }

      setQuery(data.query ?? term);
      setResults(Array.isArray(data.results) ? data.results : []);
      setElapsed(typeof data.tookMs === "number" ? data.tookMs : Date.now() - started);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Search failed. Please try again.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function askAi() {
    window.dispatchEvent(new Event("webatlas:open-assistant"));
  }

  return (
    <div className="home-page mx-auto max-w-5xl">
      <section className={`home-hero text-center ${searched ? "home-hero-compact" : ""}`}>
        <div className="mx-auto mb-5 flex w-fit items-center gap-2 rounded-full border border-blue-100 bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Web search <span className="text-slate-300">·</span> AI research
        </div>
        <h1 className="home-title text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
          Explore the web<span className="text-blue-600">.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
          Find useful answers, compare sources, and turn what you discover into research you can verify.
        </p>

        <form role="search" onSubmit={submit} className="home-search mx-auto mt-8 flex max-w-3xl items-center gap-2 rounded-full border border-slate-200 bg-white p-2 shadow-[0_8px_30px_rgba(15,23,42,0.07)] transition focus-within:border-blue-300 focus-within:shadow-[0_10px_34px_rgba(59,130,246,0.12)]">
          <label className="sr-only" htmlFor="home-search-input">Search the web</label>
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="ml-3 h-5 w-5 shrink-0 text-slate-400" stroke="currentColor" strokeWidth="1.8">
            <circle cx="10.8" cy="10.8" r="6.8" />
            <path d="m16 16 4.2 4.2" strokeLinecap="round" />
          </svg>
          <input
            id="home-search-input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Search anything on the web…"
            maxLength={300}
            autoComplete="off"
            className="min-h-11 min-w-0 flex-1 border-0 bg-transparent px-1 text-base text-slate-800 outline-none placeholder:text-slate-400 focus:ring-0"
          />
          {input && (
            <button type="button" onClick={() => setInput("")} className="hidden rounded-full px-2 py-1 text-sm text-slate-500 hover:bg-slate-100 sm:inline-flex" aria-label="Clear search">
              Clear
            </button>
          )}
          <button
            type="submit"
            disabled={loading || input.trim().length < 2}
            className="min-h-11 shrink-0 rounded-full bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:px-6"
          >
            {loading ? "Searching…" : "Search"}
          </button>
        </form>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => setInput(suggestion)}
              className="rounded-full border border-slate-200 bg-white/75 px-3.5 py-2 text-xs text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 sm:text-sm"
            >
              {suggestion}
            </button>
          ))}
        </div>

        {!searched && (
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <button type="button" onClick={askAi} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-blue-200 hover:text-blue-700">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">AI</span>
              Ask AI about your sources
            </button>
            <Link href="/research" className="inline-flex min-h-10 items-center rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-white hover:text-slate-900">
              Open research workspace <span aria-hidden="true" className="ml-1">→</span>
            </Link>
          </div>
        )}
      </section>

      {(loading || error || notConfigured || (searched && !loading)) && (
        <section aria-label="Search results" className="mx-auto mt-10 max-w-4xl">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-800">
                {loading ? "Searching the web" : notConfigured ? "Search needs setup" : error ? "Search unavailable" : `Results for “${query}”`}
              </h2>
              {!loading && !error && !notConfigured && (
                <p className="mt-1 text-xs text-slate-500">
                  {results.length} result{results.length === 1 ? "" : "s"}
                  {elapsed !== null ? ` · ${(elapsed / 1000).toFixed(1)}s` : ""}
                </p>
              )}
            </div>
            {sources.length > 0 && (
              <button type="button" onClick={askAi} className="rounded-full border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 sm:text-sm">
                Ask AI · {sources.length} source{sources.length === 1 ? "" : "s"}
              </button>
            )}
          </div>

          {loading && <Loading label="Finding real web results…" />}
          {error && <ErrorNotice message={error} />}
          {notConfigured && (
            <ErrorNotice message="Live search is not configured yet. Add TAVILY_API_KEY to your Vercel project environment variables, then redeploy. WebAtlas will not invent search results." />
          )}
          {!loading && !error && !notConfigured && results.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 px-5 py-10 text-center">
              <h3 className="font-medium text-slate-800">No results found</h3>
              <p className="mt-1 text-sm text-slate-500">Try broader keywords or phrase your question differently.</p>
            </div>
          )}
          {!loading && !error && !notConfigured && results.length > 0 && (
            <div className="space-y-3">
              {results.map((result) => <ResultCard key={result.id} result={result} />)}
            </div>
          )}
        </section>
      )}

      <footer className="mx-auto mt-16 flex max-w-4xl flex-col items-center justify-between gap-3 border-t border-slate-200/70 py-5 text-xs text-slate-500 sm:flex-row">
        <p>Search first. Evidence first. AI when useful.</p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link href="/search" className="hover:text-blue-700">Advanced search</Link>
          <Link href="/history" className="hover:text-blue-700">History</Link>
          <Link href="/settings" className="hover:text-blue-700">Provider settings</Link>
        </div>
      </footer>
    </div>
  );
}
