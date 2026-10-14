"use client";

import { useState } from "react";
import type { SearchResult } from "@/types";

export function SearchForm({
  onResults,
  onError,
  onNotConfigured,
  loading,
  setLoading,
}: {
  onResults: (query: string, results: SearchResult[]) => void;
  onError: (message: string) => void;
  onNotConfigured: () => void;
  loading: boolean;
  setLoading: (value: boolean) => void;
}) {
  const [value, setValue] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const query = value.trim();
    if (query.length < 2 || loading) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = (await res.json()) as {
        results?: SearchResult[];
        error?: string;
        notConfigured?: boolean;
      };

      if (!res.ok) {
        if (data.notConfigured) {
          onNotConfigured();
          return;
        }
        throw new Error(data.error ?? "Search failed.");
      }

      onResults(query, data.results ?? []);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Search failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form role="search" onSubmit={submit} className="flex flex-col gap-2 sm:flex-row">
      <label className="sr-only" htmlFor="search-input">
        Search query
      </label>
      <input
        id="search-input"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search the web…"
        maxLength={300}
        className="min-w-0 flex-1 rounded-full border border-slate-300 px-5 py-3 text-base"
      />
      <button
        type="submit"
        disabled={loading || value.trim().length < 2}
        className="rounded-full bg-blue-600 px-6 py-3 text-sm font-medium text-white disabled:opacity-50"
      >
        {loading ? "Searching…" : "Search"}
      </button>
    </form>
  );
}