"use client";

import { useState } from "react";
import { SearchForm } from "@/components/search/SearchForm";
import { ResultCard } from "@/components/search/ResultCard";
import { Card, EmptyState, ErrorNotice, Loading, PageHeader } from "@/components/ui/Primitives";
import { useSession } from "@/components/session/SessionProvider";

export default function SearchPage() {
  const { query, results, setQuery, setResults, hydrated } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notConfigured, setNotConfigured] = useState(false);
  const [searched, setSearched] = useState(false);

  return (
    <div>
      <PageHeader
        title="Search"
        subtitle="Real web results from a configured provider. No fabricated results."
      />

      <Card className="mb-6">
        <SearchForm
          loading={loading}
          setLoading={setLoading}
          onResults={(q, r) => {
            setQuery(q);
            setResults(r);
            setError(null);
            setNotConfigured(false);
            setSearched(true);
          }}
          onError={(message) => {
            setError(message);
            setNotConfigured(false);
            setSearched(true);
          }}
          onNotConfigured={() => {
            setNotConfigured(true);
            setError(null);
            setSearched(true);
          }}
        />
      </Card>

      {loading && <Loading label="Searching the web…" />}
      {error && !loading && <ErrorNotice message={error} />}

      {notConfigured && !loading && (
        <ErrorNotice
          message="Search is not configured on the server. Add TAVILY_API_KEY to .env.local, then restart. The rest of the workspace works without it."
        />
      )}

      {!loading && !error && !notConfigured && searched && results.length === 0 && (
        <EmptyState
          title="No results"
          description={`Nothing came back for “${query}”. Try broader or different keywords.`}
        />
      )}

      {!loading && !error && !searched && hydrated && (
        <EmptyState
          title="Ready to search"
          description="Enter a query above. Results appear here with an option to extract each source for research."
        />
      )}

      {!loading && results.length > 0 && (
        <section aria-label="Search results" className="space-y-3">
          <h2 className="text-sm text-slate-600">
            {results.length} result{results.length === 1 ? "" : "s"} for “{query}”
          </h2>
          {results.map((result) => (
            <ResultCard key={result.id} result={result} />
          ))}
        </section>
      )}
    </div>
  );
}