"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AssistantPanel } from "@/components/ai/AssistantPanel";
import { useSession } from "@/components/session/SessionProvider";

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/search", label: "Search" },
  { href: "/research", label: "Research" },
  { href: "/data", label: "Data" },
  { href: "/history", label: "History" },
  { href: "/settings", label: "Settings" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { sources, assistant } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);

  return (
    <div className="min-h-screen md:flex">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="font-semibold">WebAtlas AI</span>
          <button
            type="button"
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? "Close" : "Menu"}
          </button>
        </div>
        {menuOpen && (
          <nav id="mobile-nav" aria-label="Primary" className="border-t border-slate-200 px-2 py-2">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={`block rounded-lg px-3 py-2 text-sm ${
                  pathname === item.href ? "bg-blue-50 text-blue-700" : "text-slate-700"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}
      </header>

      <aside className="hidden w-60 shrink-0 border-r border-slate-200 bg-white/60 p-4 md:block">
        <div className="mb-6 px-2">
          <div className="text-lg font-semibold">WebAtlas AI</div>
          <div className="text-xs text-slate-500">Find it. Understand it. Verify it.</div>
        </div>
        <nav aria-label="Primary" className="space-y-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname === item.href ? "page" : undefined}
              className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                pathname === item.href
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
          <div className="mb-4 flex justify-end">
            <button
              type="button"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm"
              onClick={() => setAssistantOpen(true)}
              aria-haspopup="dialog"
            >
              AI Assistant
              {assistant.length > 0 ? " •" : ""}
            </button>
          </div>
          {children}
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