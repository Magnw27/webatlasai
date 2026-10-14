"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DEMO_ROWS } from "@/lib/demoData";
import { toStructuredRows } from "@/lib/database/transforms";
import { Card, DemoBadge, EmptyState, PageHeader } from "@/components/ui/Primitives";
import { useSession } from "@/components/session/SessionProvider";
import type { StructuredRow } from "@/types";

type SortKey = "statement" | "value" | "source";

export default function DataPage() {
  const { sources, hydrated } = useSession();
  const [showDemo, setShowDemo] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("statement");
  const [ascending, setAscending] = useState(true);
  const [filter, setFilter] = useState("");

  const rows = useMemo(() => {
    const base = toStructuredRows(sources);
    return showDemo ? [...base, ...DEMO_ROWS] : base;
  }, [sources, showDemo]);

  const visible = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    const filtered = needle
      ? rows.filter((row) =>
          Object.values(row.fields).some((v) => v.toLowerCase().includes(needle)),
        )
      : rows;
    return [...filtered].sort((a, b) => {
      const av = a.fields[sortKey] ?? "";
      const bv = b.fields[sortKey] ?? "";
      return ascending ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }, [rows, filter, sortKey, ascending]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) setAscending((v) => !v);
    else {
      setSortKey(key);
      setAscending(true);
    }
  }

  return (
    <div>
      <PageHeader
        title="Data"
        subtitle="Structured rows extracted from your sources. Every row keeps its source link."
      />

      {!hydrated ? (
        <Card>Loading…</Card>
      ) : rows.length === 0 ? (
        <EmptyState
          title="No structured data yet"
          description="Structured rows are built from extracted sources that contain numbers or clear fields."
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
        <Card>
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <label className="sr-only" htmlFor="data-filter">
              Filter rows
            </label>
            <input
              id="data-filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter…"
              className="rounded-full border border-slate-300 px-4 py-2 text-sm"
            />
            {showDemo && <DemoBadge />}
            <button
              type="button"
              onClick={() => setShowDemo((v) => !v)}
              className="rounded-full border border-slate-300 px-3 py-1.5 text-xs"
            >
              {showDemo ? "Hide demo rows" : "Show demo rows"}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] border-collapse text-sm">
              <caption className="sr-only">Structured data with source references</caption>
              <thead>
                <tr className="border-b border-slate-200 text-left">
                  {(
                    [
                      ["statement", "Statement"],
                      ["value", "Value"],
                      ["source", "Source"],
                    ] as [SortKey, string][]
                  ).map(([key, label]) => (
                    <th key={key} scope="col" className="py-2 pr-4">
                      <button
                        type="button"
                        onClick={() => toggleSort(key)}
                        className="font-medium"
                        aria-label={`Sort by ${label}`}
                      >
                        {label} {sortKey === key ? (ascending ? "↑" : "↓") : ""}
                      </button>
                    </th>
                  ))}
                  <th scope="col" className="py-2">
                    Link
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map((row: StructuredRow) => (
                  <tr key={row.id} className="border-b border-slate-100">
                    <td className="py-2 pr-4">{row.fields.statement}</td>
                    <td className="py-2 pr-4">{row.fields.value}</td>
                    <td className="py-2 pr-4">{row.fields.source}</td>
                    <td className="py-2">
                      {row.sources.map((url) => (
                        <a
                          key={url}
                          href={url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="break-url text-xs text-blue-700 underline"
                        >
                          {url}
                        </a>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {visible.length === 0 && (
            <p className="py-4 text-sm text-slate-600">No rows match the filter.</p>
          )}
        </Card>
      )}
    </div>
  );
}