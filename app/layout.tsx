import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";
import { SessionProvider } from "@/components/session/SessionProvider";

export const metadata: Metadata = {
  title: {
    default: "WebAtlas AI — Search the web, understand the evidence",
    template: "%s | WebAtlas AI",
  },
  description: "Search the live web, collect reliable sources, and use AI to turn research into evidence you can verify.",
  applicationName: "WebAtlas AI",
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <SessionProvider>
          <AppShell>{children}</AppShell>
        </SessionProvider>
      </body>
    </html>
  );
}
