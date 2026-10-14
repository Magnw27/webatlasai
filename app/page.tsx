"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ResultCard } from "@/components/search/ResultCard";
import { ErrorNotice, Loading } from "@/components/ui/Primitives";
import { useSession } from "@/components/session/SessionProvider";
import type { SearchResult } from "@/types";

const SUGGESTIONS = [
  "Berita teknologi terbaru",
  "Apa itu machine learning?",
  "Energi surya vs energi angin",
];

const TOPICS = [
  {
    title: "Teknologi & AI",
    description: "Temukan tren, tools, dan cara kerja teknologi baru.",
    query: "Tren AI dan teknologi terbaru",
    image: "/illustrations/technology.svg",
    tag: "TECHNOLOGY",
    tone: "bg-blue-50",
  },
  {
    title: "Sains & pengetahuan",
    description: "Ubah rasa penasaran jadi pemahaman yang lebih dalam.",
    query: "Penemuan sains terbaru yang menarik",
    image: "/illustrations/science.svg",
    tag: "SCIENCE",
    tone: "bg-emerald-50",
  },
  {
    title: "Dunia & ide",
    description: "Jelajahi tempat, budaya, dan ide dari berbagai sudut.",
    query: "Fakta menarik tentang dunia",
    image: "/illustrations/world.svg",
    tag: "DISCOVER",
    tone: "bg-orange-50",
  },
];

export default function HomePage() {
  const { query, results, setQuery, setResults, sources, hydrated } = useSession();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notConfigured, setNotConfigured] = useState(false);
  const [searched, setSearched] = useState(false);
  const [restored, setRestored] = useState(false);
  const [elapsed, setElapsed] = useState<number | null>(null);

  useEffect(() => {
    if (!hydrated || restored) return;
    if (query) {
      setInput(query);
      setSearched(true);
    }
    setRestored(true);
  }, [hydrated, restored, query]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const term = input.trim();
    if (term.length < 2 || loading) return;

    setLoading(true);
    setError(null);
    setNotConfigured(false);
    setSearched(true);
    setElapsed(null);

    try {
      const started = Date.now();
      const response = await fetch(`/api/search?q=${encodeURIComponent(term)}`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      const data = (await response.json()) as {
        query?: string;
        results?: SearchResult[];
        error?: string;
        notConfigured?: boolean;
        tookMs?: number;
      };

      if (!response.ok) {
        if (data.notConfigured) {
          setNotConfigured(true);
          setResults([]);
          setQuery(term);
          return;
        }
        throw new Error(data.error ?? `Search failed (HTTP ${response.status}).`);
      }

      setQuery(data.query ?? term);
      setResults(Array.isArray(data.results) ? data.results : []);
      setElapsed(typeof data.tookMs === "number" ? data.tookMs : Date.now() - started);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Search failed. Please try again.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function askAi() {
    window.dispatchEvent(new Event("webatlas:open-assistant"));
  }

  function exploreTopic(topic: (typeof TOPICS)[number]) {
    setInput(topic.query);
    window.scrollTo({ top: 0, behavior: "smooth" });
    document.getElementById("home-search-input")?.focus({ preventScroll: true });
  }

  return (
    <div className="home-page mx-auto max-w-6xl">
      <section className={`home-hero text-center ${searched ? "home-hero-compact" : ""}`}>
        <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-600 shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          Search the web <span className="text-slate-300">·</span> Think with AI
        </div>

        <div className="mx-auto flex items-center justify-center gap-3">
          <Image src="/brand/webatlas-mark.svg" alt="" width={48} height={48} priority className="h-11 w-11 sm:h-12 sm:w-12" />
          <h1 className="home-title text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
            WebAtlas <span className="text-blue-600">AI</span>
          </h1>
        </div>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
          One search away from a new idea. Explore the web, discover useful sources, and get help making sense of it all.
        </p>

        <form role="search" onSubmit={submit} className="home-search mx-auto mt-8 flex max-w-3xl items-center gap-2 rounded-full border border-slate-200 bg-white p-2 shadow-[0_8px_32px_rgba(60,64,67,0.12)] transition focus-within:border-blue-300 focus-within:shadow-[0_10px_36px_rgba(26,115,232,0.15)]">
          <label className="sr-only" htmlFor="home-search-input">Search the web</label>
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="ml-3 h-5 w-5 shrink-0 text-slate-500" stroke="currentColor" strokeWidth="1.8">
            <circle cx="10.8" cy="10.8" r="6.8" />
            <path d="m16 16 4.2 4.2" strokeLinecap="round" />
          </svg>
          <input
            id="home-search-input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Cari apa saja di internet..."
            maxLength={300}
            autoComplete="off"
            className="min-h-11 min-w-0 flex-1 border-0 bg-transparent px-1 text-base text-slate-800 outline-none placeholder:text-slate-400 focus:ring-0"
          />
          {input && (
            <button type="button" onClick={() => setInput("")} className="hidden rounded-full px-2 py-1 text-sm text-slate-500 hover:bg-slate-100 sm:inline-flex" aria-label="Hapus pencarian">
              Hapus
            </button>
          )}
          <button
            type="submit"
            disabled={loading || input.trim().length < 2}
            className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:px-6"
          >
            {loading ? (
              <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Mencari</>
            ) : (
              <><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.2 4.2" strokeLinecap="round" /></svg> Cari</>
            )}
          </button>
        </form>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <span className="mr-1 text-xs text-slate-500">Coba:</span>
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => setInput(suggestion)}
              className="rounded-full border border-slate-200 bg-white/80 px-3.5 py-2 text-xs text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 sm:text-sm"
            >
              {suggestion}
            </button>
          ))}
        </div>

        {!searched && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button type="button" onClick={askAi} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-blue-200 hover:text-blue-700">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">AI</span>
              Tanya AI
            </button>
            <Link href="/research" className="inline-flex min-h-10 items-center rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-white hover:text-slate-900">
              Buka ruang riset <span aria-hidden="true" className="ml-1">→</span>
            </Link>
          </div>
        )}
      </section>

      {!searched && (
        <section className="mx-auto mt-16 max-w-5xl pb-4 sm:mt-20" aria-labelledby="discover-heading">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Jelajahi</p>
              <h2 id="discover-heading" className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">Mulai dari rasa penasaran</h2>
              <p className="mt-1 text-sm text-slate-500">Pilih topik, lalu lanjutkan pencarianmu.</p>
            </div>
            <span className="hidden items-center gap-1.5 text-xs text-slate-400 sm:inline-flex">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8"><path d="M12 3v18M3 12h18" strokeLinecap="round" /></svg>
              Ide pencarian
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5">
            {TOPICS.map((topic) => (
              <button
                key={topic.title}
                type="button"
                onClick={() => exploreTopic(topic)}
                className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white text-left shadow-[0_3px_14px_rgba(60,64,67,0.05)] transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_12px_30px_rgba(60,64,67,0.11)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600"
              >
                <div className={`relative aspect-[16/9] overflow-hidden ${topic.tone}`}>
                  <Image src={topic.image} alt={`Ilustrasi ${topic.title}`} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 320px" className="object-cover transition duration-500 group-hover:scale-[1.04]" />
                  <span className="absolute left-3 top-3 rounded-full border border-white/70 bg-white/85 px-2.5 py-1 text-[10px] font-bold tracking-[0.14em] text-slate-600 backdrop-blur-sm">{topic.tag}</span>
                </div>
                <div className="p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-semibold text-slate-900">{topic.title}</h3>
                    <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-500 transition group-hover:bg-blue-600 group-hover:text-white">↗</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{topic.description}</p>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {(loading || error || notConfigured || (searched && !loading)) && (
        <section aria-label="Search results" className="mx-auto mt-10 max-w-4xl">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-800">
                {loading ? "Sedang mencari di web" : notConfigured ? "Pencarian perlu disiapkan" : error ? "Pencarian gagal" : `Hasil untuk “${query}”`}
              </h2>
              {!loading && !error && !notConfigured && (
                <p className="mt-1 text-xs text-slate-500">
                  {results.length} hasil{elapsed !== null ? ` · ${(elapsed / 1000).toFixed(1)} detik` : ""}
                </p>
              )}
            </div>
            {sources.length > 0 && (
              <button type="button" onClick={askAi} className="rounded-full border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 sm:text-sm">
                Tanya AI · {sources.length} sumber
              </button>
            )}
          </div>

          {loading && <Loading label="Mencari hasil web yang nyata..." />}
          {error && <ErrorNotice message={error} />}
          {notConfigured && (
            <ErrorNotice message="Pencarian langsung belum dikonfigurasi. Tambahkan TAVILY_API_KEY di environment variables proyek Vercel, lalu deploy ulang. WebAtlas tidak akan mengarang hasil pencarian." />
          )}
          {!loading && !error && !notConfigured && results.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 px-5 py-10 text-center">
              <h3 className="font-medium text-slate-800">Belum ada hasil</h3>
              <p className="mt-1 text-sm text-slate-500">Coba kata kunci yang lebih umum atau ubah pertanyaanmu.</p>
            </div>
          )}
          {!loading && !error && !notConfigured && results.length > 0 && (
            <div className="space-y-3">
              {results.map((result) => <ResultCard key={result.id} result={result} />)}
            </div>
          )}
        </section>
      )}

      <footer className="mx-auto mt-16 flex max-w-5xl flex-col items-center justify-between gap-3 border-t border-slate-200/70 py-5 text-xs text-slate-500 sm:flex-row">
        <div className="flex items-center gap-2">
          <Image src="/brand/webatlas-mark.svg" alt="" width={24} height={24} className="h-6 w-6" />
          <span>WebAtlas AI <span className="text-slate-300">·</span> Cari. Pahami. Temukan.</span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link href="/search" className="hover:text-blue-700">Pencarian lanjutan</Link>
          <Link href="/history" className="hover:text-blue-700">Riwayat</Link>
          <Link href="/settings" className="hover:text-blue-700">Pengaturan AI</Link>
        </div>
      </footer>
    </div>
  );
}
