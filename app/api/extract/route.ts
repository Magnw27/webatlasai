import { NextResponse } from "next/server";
import { extractSource, ExtractionError } from "@/lib/scraper/extract";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const url = (body as { url?: unknown }).url;
  if (typeof url !== "string" || url.trim().length === 0) {
    return NextResponse.json({ error: "A url is required." }, { status: 400 });
  }

  try {
    const source = await extractSource(url.trim());
    if (source.wordCount < 20) {
      return NextResponse.json(
        { error: "Extracted very little usable text from that page." },
        { status: 422 },
      );
    }
    return NextResponse.json({ source });
  } catch (error) {
    const status = error instanceof ExtractionError ? 400 : 502;
    const message =
      error instanceof Error && error.name === "AbortError"
        ? "The source timed out."
        : error instanceof Error
          ? error.message
          : "Extraction failed.";
    return NextResponse.json({ error: message }, { status });
  }
}