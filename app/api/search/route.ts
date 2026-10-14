import { NextResponse } from "next/server";
import { runSearch } from "@/lib/search/provider";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") ?? "").trim();

  if (query.length < 2) {
    return NextResponse.json(
      { error: "Enter at least two characters." },
      { status: 400 },
    );
  }
  if (query.length > 300) {
    return NextResponse.json({ error: "Query is too long." }, { status: 400 });
  }

  const started = Date.now();
  try {
    const outcome = await runSearch(query);
    if (!outcome.configured) {
      return NextResponse.json(
        {
          error: "Search is not configured.",
          notConfigured: true,
          query,
        },
        { status: 503 },
      );
    }
    return NextResponse.json({
      query,
      results: outcome.results,
      provider: outcome.provider,
      tookMs: Date.now() - started,
    });
  } catch (error) {
    const message =
      error instanceof Error && error.name === "AbortError"
        ? "The search provider timed out."
        : error instanceof Error
          ? error.message
          : "Search failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}