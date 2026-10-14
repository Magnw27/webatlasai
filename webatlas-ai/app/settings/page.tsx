"use client";

import { useEffect, useState } from "react";
import { Card, PageHeader } from "@/components/ui/Primitives";

interface Status {
  searchConfigured: boolean;
  aiConfigured: boolean;
}

export default function SettingsPage() {
  const [status, setStatus] = useState<Status | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/status")
      .then((res) => res.json() as Promise<Status>)
      .then(setStatus)
      .catch(() => setError("Could not read server status."));
  }, []);

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Only settings that matter. Secrets live in server environment variables."
      />

      <Card className="mb-4">
        <h2 className="text-base font-medium">Provider status</h2>
        {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
        {!status && !error && <p className="mt-2 text-sm text-slate-600">Checking…</p>}
        {status && (
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <dt>Web search provider</dt>
              <dd className={status.searchConfigured ? "text-green-700" : "text-amber-700"}>
                {status.searchConfigured ? "Configured" : "Not configured"}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt>AI assistant</dt>
              <dd className={status.aiConfigured ? "text-green-700" : "text-amber-700"}>
                {status.aiConfigured ? "Configured" : "Not configured"}
              </dd>
            </div>
          </dl>
        )}
      </Card>

      <Card>
        <h2 className="text-base font-medium">How to configure</h2>
        <p className="mt-1 text-sm text-slate-600">
          Copy <code>.env.example</code> to <code>.env.local</code>, fill in keys, and restart the
          server. Keys are read only on the server and never sent to the browser.
        </p>
        <ul className="mt-3 space-y-1 text-sm text-slate-700">
          <li>
            <code>TAVILY_API_KEY</code> — enables live web search.
          </li>
          <li>
            <code>AI_API_KEY</code>, <code>AI_BASE_URL</code>, <code>AI_MODEL</code> — enable the AI
            assistant.
          </li>
        </ul>
      </Card>
    </div>
  );
}