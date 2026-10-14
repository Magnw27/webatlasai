"use client";

import Link from "next/link";
import { Card, EmptyState, PageHeader } from "@/components/ui/Primitives";
import { useSession } from "@/components/session/SessionProvider";

export default function HistoryPage() {
  const { query, results, sources, reset, hydrated } = useSession();

  const hasWork = Boolean(query) || results.length > 0 || sources.length > 0;

  return (
    <div>
      <PageHeader
        title="History"
        subtitle="Your current research session. It is kept in this browser only."
      />

      {!hydrated ? (
        <Card>Loading…</Card>
      ) : !hasWork ? (
        <EmptyState
          title="Nothing yet"
          description="Searches and extracted sources from this session appear here."
          action={
            <Link
              href="/search"
              className="rounded-full bg-blue-600 px-5 py-2 text-sm font-medium text-white"
            >
              Go to Search
            </Link>
          }
        />
      ) : (
        <>
          <Card className="mb-6">
            <h2 className="text-base font-medium">Last query</h2>
            <p className="mt-1 text-sm text-slate-700">{query || "—"}</p>
            <p className="mt-2 text-xs text-slate-500">
              {results.length} result{results.length === 1 ? "" : "s"} • {sources.length} source
              {sources.length === 1 ? "" : "s"} extracted
            </p>
          </Card>

          {sources.length > 0 && (
            <Card className="mb-6">
              <h2 className="mb-2 text-base font-medium">Extracted sources</h2>
              <ul className="space-y-2 text-sm">
                {sources.map((s) => (
                  <li key={s.url}>
                    <span className="font-medium">{s.title}</span>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="break-url ml-1 text-blue-700 underline"
                    >
                      {s.url}
                    </a>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <button
            type="button"
            onClick={reset}
            className="rounded-full border border-red-300 px-4 py-2 text-sm text-red-700"
          >
            Clear session history
          </button>
        </>
      )}
    </div>
  );
}