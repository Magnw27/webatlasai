"use client";

import Link from "next/link";
import { Card, PageHeader } from "@/components/ui/Primitives";
import { useSession } from "@/components/session/SessionProvider";

export default function DashboardPage() {
  const { query, results, sources, hydrated } = useSession();

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Search, collect sources, and review everything in one place."
      />

      <Card className="mb-6">
        <h2 className="text-base font-medium">Start a search</h2>
        <p className="mt-1 text-sm text-slate-600">
          Go to Search to run a real query. WebAtlas never fabricates results.
        </p>
        <Link
          href="/search"
          className="mt-4 inline-block rounded-full bg-blue-600 px-5 py-2 text-sm font-medium text-white"
        >
          Open search
        </Link>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <div className="text-2xl font-semibold">{hydrated ? results.length : "—"}</div>
          <div className="text-sm text-slate-600">Results this session</div>
        </Card>
        <Card>
          <div className="text-2xl font-semibold">{hydrated ? sources.length : "—"}</div>
          <div className="text-sm text-slate-600">Extracted sources</div>
        </Card>
        <Card>
          <div className="text-sm text-slate-600">Current query</div>
          <div className="mt-1 truncate text-base font-medium">
            {query || "None yet"}
          </div>
        </Card>
      </div>

      <nav aria-label="Quick actions" className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { href: "/research", label: "Research" },
          { href: "/data", label: "Data" },
          { href: "/history", label: "History" },
          { href: "/settings", label: "Settings" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="surface px-4 py-3 text-sm font-medium hover:border-blue-300"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}