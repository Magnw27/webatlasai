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

type ApiReply = {
  message?: AssistantMessage;
  error?: string;
  available?: boolean;
};

function parseApiReply(raw: string, status: number): ApiReply {
  const text = raw.trim();
  if (!text) {
    throw new Error(`Server returned an empty response (HTTP ${status}). Please try again.`);
  }

  try {
    return JSON.parse(text) as ApiReply;
  } catch {
    // Be defensive about reverse proxies that append a second JSON value.
    let depth = 0;
    let start = -1;
    let inString = false;
    let escaped = false;

    for (let i = 0; i < text.length; i += 1) {
      const char = text[i];
      if (inString) {
        if (escaped) escaped = false;
        else if (char === "\\\\") escaped = true;
        else if (char === '"') inString = false;
        continue;
      }
      if (char === '"') {
        inString = true;
        continue;
      }
      if (char === "{") {
        if (depth === 0) start = i;
        depth += 1;
      } else if (char === "}") {
        depth -= 1;
        if (depth === 0 && start >= 0) {
          try {
            return JSON.parse(text.slice(start, i + 1)) as ApiReply;
          } catch {
            start = -1;
          }
        }
      }
    }

    throw new Error(
      `Server returned an invalid response (HTTP ${status}). Check the AI endpoint or deployment logs and try again.`,
    );
  }
}

export function AssistantPanel({
  open,
  onClose,
  sources,
}: {
  open: boolean;
  onClose: () => void;
  sources: ExtractedSource[];
}) {
  const { assistant, addMessage, clearAssistant } = useSession();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const sendingRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [assistant, open, loading, error]);

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
    if (!trimmed || sendingRef.current) return;

    sendingRef.current = true;
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
      const raw = await res.text();
      const data = parseApiReply(raw, res.status);
      if (!res.ok || !data.message) {
        throw new Error(data.error ?? `The assistant could not respond (HTTP ${res.status}).`);
      }
      addMessage(data.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The assistant could not respond.");
    } finally {
      sendingRef.current = false;
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-slate-950/25 p-0 backdrop-blur-[2px] sm:items-center sm:justify-end sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="AI Assistant"
        tabIndex={-1}
        className="surface flex h-[88dvh] max-h-[760px] w-full flex-col overflow-hidden rounded-b-none sm:h-[min(700px,calc(100dvh-2rem))] sm:max-w-lg sm:rounded-2xl"
      >
        <header className="flex shrink-0 items-center justify-between border-b border-slate-200/70 bg-white/45 px-4 py-4 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-500 text-sm font-bold text-white shadow-md shadow-blue-500/20">
              AI
            </div>
            <div className="min-w-0">
              <h2 className="font-semibold tracking-tight">WebAtlas Assistant</h2>
              <p className="text-xs text-slate-500">
                {sources.length > 0
                  ? `Grounded in ${sources.length} source${sources.length === 1 ? "" : "s"}`
                  : "No research sources attached"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close AI assistant"
            className="ml-3 rounded-xl border border-slate-200/80 bg-white/70 px-3 py-2 text-sm text-slate-600 transition hover:bg-white"
          >
            Close
          </button>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-5 sm:px-5" aria-live="polite">
          {assistant.length === 0 && (
            <div className="rounded-2xl border border-white/80 bg-white/60 p-4 shadow-sm">
              <p className="text-sm font-medium text-slate-800">Research with evidence, not guesses.</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Ask about your extracted sources. The assistant should flag uncertainty instead of inventing facts.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => void send(suggestion)}
                    disabled={loading}
                    className="rounded-full border border-blue-200/80 bg-blue-50/70 px-3 py-2 text-left text-xs font-medium text-blue-800 transition hover:border-blue-300 hover:bg-blue-100 disabled:opacity-50"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {assistant.map((message) => (
            <article key={message.id} className={message.role === "user" ? "flex justify-end" : "flex justify-start"}>
              <div className="max-w-[88%]">
                <div
                  className={`whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-sm leading-6 ${
                    message.role === "user"
                      ? "rounded-br-md bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/15"
                      : "rounded-bl-md border border-white/80 bg-white/80 text-slate-800 shadow-sm"
                  }`}
                >
                  {message.content}
                </div>
                {message.citations.length > 0 && (
                  <div className="mt-2 space-y-1 px-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Sources</p>
                    {message.citations.map((citation) => (
                      <a
                        key={citation}
                        href={citation}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="break-url block text-xs text-blue-700 underline decoration-blue-300 underline-offset-2"
                      >
                        {citation}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </article>
          ))}

          {loading && (
            <div role="status" className="flex items-center gap-3 text-sm text-slate-500">
              <span className="flex gap-1 rounded-full border border-white/80 bg-white/70 px-3 py-3">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" />
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500 [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500 [animation-delay:300ms]" />
              </span>
              Checking your sources…
            </div>
          )}
          {error && (
            <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50/90 p-3 text-sm leading-5 text-amber-900">
              {error}
            </div>
          )}
          <div ref={endRef} />
        </div>

        <footer className="shrink-0 border-t border-slate-200/70 bg-white/45 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:px-5 sm:pb-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
            className="flex items-end gap-2 rounded-2xl border border-slate-200/90 bg-white/85 p-2 shadow-sm transition focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-100/70"
          >
            <label className="sr-only" htmlFor="assistant-input">Ask the assistant</label>
            <textarea
              id="assistant-input"
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send(input);
                }
              }}
              placeholder="Ask about your research…"
              className="max-h-28 min-h-10 min-w-0 flex-1 resize-y bg-transparent px-2 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="shrink-0 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-45"
            >
              Send
            </button>
          </form>
          <div className="mt-3 flex items-center justify-between gap-3 px-1 text-xs text-slate-500">
            <span className="min-w-0">Answers should be grounded in your sources.</span>
            {assistant.length > 0 && (
              <button type="button" onClick={clearAssistant} className="shrink-0 underline decoration-slate-300 underline-offset-2 hover:text-slate-800">
                Clear chat
              </button>
            )}
          </div>
        </footer>
      </section>
    </div>
  );
}
