"use client";

import Link from "next/link";
import { useState } from "react";
import { DEMO_FINDINGS, DEMO_SOURCES } from "@/lib/demoData";
import { extractStats } from "@/lib/database/transforms";
import { Card, DemoBadge, EmptyState, PageHeader } from "@/components/ui/Primitives";
import { useSession } from "@/components/session/SessionProvider";

export default function ResearchPage() {
  const { sources, hydrated } = useSession();
  const [showDemo, setShowDemo] = useState(false);

  const findings = sources.flatMap((source) =>
    extractStats(source).map((stat) => ({
      id: `${source.id}-${stat.value}`,
      text: `${stat.value} — ${stat.label}`,
      sourceUrl: source.url,
    })),
  );

  const activeSources = showDemo ? [...sources, ...DEMO_SOURCES] : sources;

  return (
    <div>
      <PageHeader
        title="Research"
        subtitle="Summary and key findings, each tied to the source it came from."
      />

      {!hydrated ? (
        <Card>Loading…</Card>
      ) : activeSources.length === 0 ? (
        <EmptyState
          title="No sources yet"
          description="Run a search and extract a couple of sources, then return here for a grounded summary."
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
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-base font-medium">
                Summary ({activeSources.length} source{activeSources.length === 1 ? "" : "s"})
              </h2>
              {showDemo && <DemoBadge />}
            </div>
            <ul className="space-y-2 text-sm text-slate-700">
              {activeSources.map((s) => (
                <li key={s.url + s.title}>
                  <span className="font-medium">{s.title}</span>{" "}
                  <span className="text-slate-500">({s.wordCount} words)</span>
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

          <Card className="mb-6">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-base font-medium">
                Key findings ({findings.length + (showDemo ? DEMO_FINDINGS.length : 0)})
              </h2>
              {showDemo && <DemoBadge />}
            </div>
            {findings.length === 0 && !showDemo ? (
              <p className="text-sm text-slate-600">
                No numeric claims were found in the extracted text, so none are shown. WebAtlas does
                not invent findings.
              </p>
            ) : (
              <ul className="space-y-3 text-sm">
                {findings.map((f) => (
                  <li key={f.id}>
                    <p className="text-slate-800">{f.text}</p>
                    <a
                      href={f.sourceUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="break-url text-xs text-blue-700 underline"
                    >
                      {f.sourceUrl}
                    </a>
                  </li>
                ))}
                {showDemo &&
                  DEMO_FINDINGS.map((f) => (
                    <li key={f.id}>
                      <p className="text-slate-800">{f.text}</p>
                      <a
                        href={f.sourceUrls[0]}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="break-url text-xs text-amber-700 underline"
                      >
                        {f.sourceUrls[0]}
                      </a>
                    </li>
                  ))}
              </ul>
            )}
          </Card>

          <button
            type="button"
            onClick={() => setShowDemo((v) => !v)}
            className="rounded-full border border-slate-300 px-4 py-2 text-sm"
          >
            {showDemo ? "Hide demo data" : "Show demo data"}
          </button>
        </>
      )}
    </div>
  );
}