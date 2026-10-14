"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AssistantPanel } from "@/components/ai/AssistantPanel";
import { useSession } from "@/components/session/SessionProvider";

const NAV = [
  { href: "/", label: "Home", hint: "Search" },
  { href: "/search", label: "Advanced search", hint: "Discover" },
  { href: "/research", label: "Research", hint: "Evidence" },
  { href: "/data", label: "Data", hint: "Structure" },
  { href: "/history", label: "History", hint: "Recent work" },
  { href: "/settings", label: "Settings", hint: "Providers" },
];

function BrandMark() {
  return (
    <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 text-xs font-black tracking-tight text-white shadow-sm">
      WA
    </span>
  );
}

function AssistantButton({ onClick, count = 0 }: { onClick: () => void; count?: number }) {
  return (
    <button
      type="button"
      className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50/70 hover:text-blue-700 sm:px-4"
      onClick={onClick}
      aria-haspopup="dialog"
    >
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-[10px] font-bold text-blue-700">AI</span>
      <span>Ask AI</span>
      {count > 0 && <span aria-label={`${count} chat messages`} className="h-2 w-2 rounded-full bg-blue-500" />}
    </button>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { sources, assistant } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const isHome = pathname === "/";

  useEffect(() => {
    const openAssistant = () => setAssistantOpen(true);
    window.addEventListener("webatlas:open-assistant", openAssistant);
    return () => window.removeEventListener("webatlas:open-assistant", openAssistant);
  }, []);

  if (isHome) {
    return (
      <div className="min-h-screen">
        <header className="home-topbar sticky top-0 z-30 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl">
          <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <Link href="/" className="flex shrink-0 items-center gap-2.5 rounded-lg" aria-label="WebAtlas AI home">
              <BrandMark />
              <span className="text-base font-semibold tracking-tight text-slate-900">WebAtlas <span className="text-blue-600">AI</span></span>
            </Link>
            <nav aria-label="Main navigation" className="hidden items-center gap-5 text-sm text-slate-600 sm:flex">
              <Link href="/research" className="transition hover:text-blue-700">Research</Link>
              <Link href="/history" className="transition hover:text-blue-700">History</Link>
              <Link href="/settings" className="transition hover:text-blue-700">Settings</Link>
            </nav>
            <div className="flex items-center gap-2">
              <span className="hidden text-xs text-slate-500 sm:inline">{sources.length} saved source{sources.length === 1 ? "" : "s"}</span>
              <AssistantButton onClick={() => setAssistantOpen(true)} count={assistant.length} />
            </div>
          </div>
          <nav aria-label="Mobile navigation" className="flex gap-2 overflow-x-auto px-4 pb-2 sm:hidden">
            <Link href="/search" className="shrink-0 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700">Advanced search</Link>
            <Link href="/research" className="shrink-0 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700">Research</Link>
            <Link href="/history" className="shrink-0 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700">History</Link>
            <Link href="/settings" className="shrink-0 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700">Settings</Link>
          </nav>
        </header>
        <main className="min-w-0 px-4 sm:px-6 lg:px-8">{children}</main>
        <AssistantPanel open={assistantOpen} onClose={() => setAssistantOpen(false)} sources={sources} />
      </div>
    );
  }

  return (
    <div className="min-h-screen md:flex">
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/90 shadow-sm backdrop-blur-xl md:hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="flex min-w-0 items-center gap-2.5" onClick={() => setMenuOpen(false)}>
            <BrandMark />
            <span className="truncate font-semibold tracking-tight text-slate-900">WebAtlas <span className="text-blue-600">AI</span></span>
          </Link>
          <button
            type="button"
            className="min-h-10 rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            onClick={() => setMenuOpen((value) => !value)}
          >
            {menuOpen ? "Close" : "Menu"}
          </button>
        </div>
        {menuOpen && (
          <nav id="mobile-nav" aria-label="Primary" className="border-t border-slate-200/70 bg-white px-3 py-3">
            <div className="grid grid-cols-2 gap-2">
              {NAV.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={`rounded-xl border px-3 py-3 transition ${
                      active ? "border-blue-200 bg-blue-50 text-blue-800" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className="block text-sm font-semibold">{item.label}</span>
                    <span className="mt-0.5 block text-xs opacity-70">{item.hint}</span>
                  </Link>
                );
              })}
            </div>
          </nav>
        )}
      </header>

      <aside className="hidden w-64 shrink-0 p-4 md:block">
        <div className="surface sticky top-4 flex min-h-[calc(100vh-2rem)] flex-col p-4">
          <Link href="/" className="mb-8 flex items-center gap-3 px-1">
            <BrandMark />
            <span className="text-base font-semibold tracking-tight text-slate-900">WebAtlas <span className="text-blue-600">AI</span></span>
          </Link>
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Workspace</p>
          <nav aria-label="Primary" className="space-y-1">
            {NAV.slice(1).map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`group flex items-center justify-between rounded-xl border px-3 py-3 text-sm transition ${
                    active ? "border-blue-200 bg-blue-50 font-semibold text-blue-800" : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-white"
                  }`}
                >
                  <span>{item.label}</span>
                  <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-blue-600" : "bg-transparent group-hover:bg-slate-300"}`} />
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-semibold text-slate-800">Research, clearly.</div>
            <p className="mt-1 text-xs leading-5 text-slate-500">Keep findings connected to the sources behind them.</p>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
              <span>Sources collected</span>
              <span className="font-semibold text-blue-700">{sources.length}</span>
            </div>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <div className="mx-auto max-w-6xl px-4 pb-8 pt-5 sm:px-6 sm:pt-7 lg:px-8">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="hidden min-w-0 sm:block">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Research workspace</p>
              <p className="mt-1 truncate text-sm text-slate-600">Find it. Understand it. Verify it.</p>
            </div>
            <AssistantButton onClick={() => setAssistantOpen(true)} count={assistant.length} />
          </div>
          <main className="min-w-0">{children}</main>
        </div>
      </div>

      <AssistantPanel open={assistantOpen} onClose={() => setAssistantOpen(false)} sources={sources} />
    </div>
  );
}
