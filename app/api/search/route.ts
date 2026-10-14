import { NextResponse } from "next/server";
import { runSearch } from "@/lib/search/provider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") ?? "").trim();

  if (query.length < 2) {
    return json({ error: "Enter at least two characters." }, 400);
  }
  if (query.length > 300) {
    return json({ error: "Query is too long." }, 400);
  }

  const started = Date.now();
  try {
    const outcome = await runSearch(query);
    if (!outcome.configured) {
      return json({
        error: "Search is not configured.",
        notConfigured: true,
        query,
      }, 503);
    }
    return json({
      query,
      results: outcome.results,
      provider: outcome.provider,
      tookMs: Date.now() - started,
    });
  } catch (error) {
    const message =
      error instanceof Error && error.name === "AbortError"
        ? "The search provider timed out. Try again in a moment."
        : error instanceof Error
          ? error.message
          : "Search failed. Please try again.";
    return json({ error: message }, 502);
  }
}
