"use client";

import type { AssistantMessage, ExtractedSource, SearchResult } from "@/types";

export interface SessionSnapshot {
  query: string;
  results: SearchResult[];
  sources: ExtractedSource[];
  assistant: AssistantMessage[];
}

const KEY = "webatlas:session:v1";

const empty: SessionSnapshot = { query: "", results: [], sources: [], assistant: [] };

export function loadSession(): SessionSnapshot {
  if (typeof window === "undefined") return empty;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as Partial<SessionSnapshot>;
    return {
      query: parsed.query ?? "",
      results: parsed.results ?? [],
      sources: parsed.sources ?? [],
      assistant: parsed.assistant ?? [],
    };
  } catch {
    return empty;
  }
}

export function saveSession(snapshot: SessionSnapshot): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(snapshot));
  } catch {
    // Session storage may be unavailable (private mode); degrade quietly.
  }
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}