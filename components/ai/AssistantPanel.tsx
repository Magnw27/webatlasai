"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "@/components/session/SessionProvider";
import type { AssistantMessage, ExtractedSource } from "@/types";

const SUGGESTIONS = [
  "Summarize these sources",
  "Compare the sources",
  "What is missing?",
  "List the key numbers with sources",
];

export function AssistantPanel({
  open,
  onClose,
  sources,
}: {
  open: boolean;
  onClose: () => void;
  sources: ExtractedSource[];
}) {
  const { assistant, addMessage, reset } = useSession();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    endRef.current?.scrollIntoView({ block: "end" });
  }, [assistant, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    panelRef.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  async function send(question: string) {
    const trimmed = question.trim();
    if (!trimmed || loading) return;
    setError(null);
    setInput("");
    addMessage({
      id: `u-${Date.now()}`,
      role: "user",
      content: trimmed,
      citations: [],
      grounded: false,
    });
    setLoading(true);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: trimmed,
          context: sources.map((s) => ({ url: s.url, title: s.title, text: s.text })),
          history: assistant.slice(-6),
        }),
      });
      const data = (await res.json()) as { message?: AssistantMessage; error?: string };
      if (!res.ok || !data.message) {
        throw new Error(data.error ?? "The assistant could not respond.");
      }
      addMessage(data.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The assistant could not respond.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-end bg-slate-900/20 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="AI Assistant"
        tabIndex={-1}
        className="surface flex h-[85vh] w-full flex-col overflow-hidden sm:h-[600px] sm:max-w-md"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div>
            <div className="font-semibold">AI Assistant</div>
            <div className="text-xs text-slate-500">
              {sources.length > 0
                ? `Grounded in ${sources.length} source${sources.length === 1 ? "" : "s"}`
                : "No sources in context yet"}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
          >
            Close
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {assistant.length === 0 && (
            <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              Ask about the sources you have extracted. The assistant only uses that context and
              labels its own inference.
            </div>
          )}
          {assistant.map((m) => (
            <div key={m.id} className={m.role === "user" ? "text-right" : "text-left"}>
              <div
                className={`inline-block max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                  m.role === "user" ? "bg-blue-600 text-white" : "border border-slate-200 bg-white"
                }`}
              >
                {m.content}
              </div>
              {m.citations.length > 0 && (
                <div className="mt-1 space-y-0.5">
                  {m.citations.map((c) => (
                    <a
                      key={c}
                      href={c}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="break-url block text-xs text-blue-700 underline"
                    >
                      {c}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
          {loading && <div className="text-sm text-slate-500">Thinking…</div>}
          {error && (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className="border-t border-slate-200 px-4 py-3">
          {assistant.length === 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs hover:bg-slate-50"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
            className="flex gap-2"
          >
            <label className="sr-only" htmlFor="assistant-input">
              Ask the assistant
            </label>
            <input
              id="assistant-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your sources…"
              className="min-w-0 flex-1 rounded-full border border-slate-300 px-4 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="rounded-full bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              Send
            </button>
          </form>
          <div className="mt-2 flex justify-between text-xs text-slate-500">
            <span>Closed by default. Never blocks research.</span>
            {assistant.length > 0 && (
              <button type="button" onClick={reset} className="underline">
                Clear session
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}