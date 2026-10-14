"use client";

import { useState } from "react";
import { useSession } from "@/components/session/SessionProvider";
import type { SearchResult } from "@/types";

export function ResultCard({ result }: { result: SearchResult }) {
  const { addSource } = useSession();
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function extract() {
    setStatus("loading");
    setMessage(null);
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: result.url }),
      });
      const data = (await res.json()) as {
        source?: import("@/types").ExtractedSource;
        error?: string;
      };
      if (!res.ok || !data.source) {
        throw new Error(data.error ?? "Extraction failed.");
      }
      addSource(data.source);
      setStatus("done");
      setMessage(`Added ${data.source.wordCount} words to context.`);
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Extraction failed.");
    }
  }

  return (
    <article className="surface p-4">
      <h3 className="text-base font-medium">
        <a href={result.url} target="_blank" rel="noreferrer noopener" className="hover:underline">
          {result.title}
        </a>
      </h3>
      <p className="break-url mt-1 text-xs text-slate-500">{result.url}</p>
      {result.snippet && <p className="mt-2 text-sm text-slate-700">{result.snippet}</p>}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
          {result.domain}
        </span>
        <button
          type="button"
          onClick={extract}
          disabled={status === "loading" || status === "done"}
          className="rounded-full border border-slate-300 px-3 py-1 text-xs disabled:opacity-50"
        >
          {status === "loading"
            ? "Extracting…"
            : status === "done"
              ? "Added"
              : "Extract & add to research"}
        </button>
      </div>
      {message && (
        <p
          role={status === "error" ? "alert" : "status"}
          className={`mt-2 text-xs ${status === "error" ? "text-red-700" : "text-slate-600"}`}
        >
          {message}
        </p>
      )}
    </article>
  );
}