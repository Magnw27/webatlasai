"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { clearSession, loadSession, saveSession } from "@/lib/store";
import type { AssistantMessage, ExtractedSource, SearchResult } from "@/types";

interface SessionState {
  query: string;
  results: SearchResult[];
  sources: ExtractedSource[];
  assistant: AssistantMessage[];
}

interface SessionApi extends SessionState {
  hydrated: boolean;
  setQuery: (query: string) => void;
  setResults: (results: SearchResult[]) => void;
  addSource: (source: ExtractedSource) => void;
  addMessage: (message: AssistantMessage) => void;
  clearAssistant: () => void;
  reset: () => void;
}

const SessionContext = createContext<SessionApi | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SessionState>({
    query: "",
    results: [],
    sources: [],
    assistant: [],
  });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(loadSession());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveSession(state);
  }, [state, hydrated]);

  const setQuery = useCallback((query: string) => {
    setState((s) => ({ ...s, query }));
  }, []);

  const setResults = useCallback((results: SearchResult[]) => {
    setState((s) => ({ ...s, results }));
  }, []);

  const addSource = useCallback((source: ExtractedSource) => {
    setState((s) =>
      s.sources.some((x) => x.url === source.url)
        ? s
        : { ...s, sources: [...s.sources, source] },
    );
  }, []);

  const addMessage = useCallback((message: AssistantMessage) => {
    setState((s) => ({ ...s, assistant: [...s.assistant, message] }));
  }, []);

  const clearAssistant = useCallback(() => {
    setState((s) => ({ ...s, assistant: [] }));
  }, []);

  const reset = useCallback(() => {
    clearSession();
    setState({ query: "", results: [], sources: [], assistant: [] });
  }, []);

  const value = useMemo<SessionApi>(
    () => ({ ...state, hydrated, setQuery, setResults, addSource, addMessage, clearAssistant, reset }),
    [state, hydrated, setQuery, setResults, addSource, addMessage, clearAssistant, reset],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionApi {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}