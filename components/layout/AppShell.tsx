"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AssistantPanel } from "@/components/ai/AssistantPanel";
import { useSession } from "@/components/session/SessionProvider";

const NAV = [
  { href: "/", label: "Dashboard", hint: "Overview" },
  { href: "/search", label: "Search", hint: "Discover" },
  { href: "/research", label: "Research", hint: "Evidence" },
  { href: "/data", label: "Data", hint: "Structure" },
  { href: "/history", label: "History", hint: "Recent work" },
  { href: "/settings", label: "Settings", hint: "Providers" },
];

function BrandMark() {
  return (
    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-500 text-sm font-black tracking-tight text-white shadow-lg shadow-blue-600/20">
      WA
    </span>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { sources, assistant } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);

  return (
    <div className="min-h-screen md:flex">
      <header className="sticky top-0 z-30 border-b border-white/70 bg-white/75 shadow-sm backdrop-blur-xl md:hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="flex min-w-0 items-center gap-3" onClick={() => setMenuOpen(false)}>
            <BrandMark />
            <span className="truncate font-semibold tracking-tight">WebAtlas <span className="text-blue-600">AI</span></span>
          </Link>
          <button
            type="button"
            className="min-h-10 rounded-xl border border-slate-200/90 bg-white/75 px-3 text-sm font-medium text-slate-700 transition hover:bg-white"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            onClick={() => setMenuOpen((value) => !value)}
          >
            {menuOpen ? "Close" : "Menu"}
          </button>
        </div>
        {menuOpen && (
          <nav id="mobile-nav" aria-label="Primary" className="border-t border-slate-200/70 bg-white/70 px-3 py-3">
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
                      active
                        ? "border-blue-200 bg-blue-50/90 text-blue-800"
                        : "border-slate-200/70 bg-white/65 text-slate-700 hover:bg-white"
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
            <span className="text-base font-semibold tracking-tight">WebAtlas <span className="text-blue-600">AI</span></span>
          </Link>

          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Workspace</p>
          <nav aria-label="Primary" className="space-y-1">
            {NAV.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`group flex items-center justify-between rounded-xl border px-3 py-3 text-sm transition ${
                    active
                      ? "border-blue-200/80 bg-blue-50/90 font-semibold text-blue-800 shadow-sm"
                      : "border-transparent text-slate-600 hover:border-white/80 hover:bg-white/65 hover:text-slate-900"
                  }`}
                >
                  <span>{item.label}</span>
                  <span className={`h-1.5 w-1.5 rounded-full transition ${
                    active ? "bg-blue-600" : "bg-transparent group-hover:bg-slate-300"
                  }`} />
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto rounded-2xl border border-blue-100/90 bg-gradient-to-br from-white/80 to-blue-50/70 p-4">
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
            <button
              type="button"
              className="ml-auto inline-flex min-h-11 items-center gap-2 rounded-2xl border border-white/90 bg-white/75 px-4 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur transition hover:border-blue-200 hover:bg-white hover:text-blue-700"
              onClick={() => setAssistantOpen(true)}
              aria-haspopup="dialog"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-violet-500 text-[10px] font-bold text-white">AI</span>
              AI Assistant
              {assistant.length > 0 && <span aria-label="Chat has messages" className="h-2 w-2 rounded-full bg-blue-500" />}
            </button>
          </div>
          <main className="min-w-0">{children}</main>
        </div>
      </div>

      <AssistantPanel
        open={assistantOpen}
        onClose={() => setAssistantOpen(false)}
        sources={sources}
      />
    </div>
  );
}