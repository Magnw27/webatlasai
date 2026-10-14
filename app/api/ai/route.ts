import { NextResponse } from "next/server";
import { askAssistant } from "@/lib/ai/provider";
import type { AssistantMessage, ExtractedSource } from "@/types";

export const runtime = "nodejs";

function isHttpUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function parseSources(raw: unknown): ExtractedSource[] {
  if (!Array.isArray(raw)) return [];
  const out: ExtractedSource[] = [];
  raw.slice(0, 10).forEach((item, i) => {
    if (!item || typeof item !== "object") return;
    const obj = item as Record<string, unknown>;
    const url = obj.url;
    if (!isHttpUrl(url)) return;
    const text = typeof obj.text === "string" ? obj.text : "";
    out.push({
      id: `ctx-${i}`,
      url,
      domain: new URL(url).hostname.replace(/^www\./, ""),
      title: typeof obj.title === "string" && obj.title.trim() ? obj.title.slice(0, 300) : url,
      text: text.slice(0, 4000),
      wordCount: text ? text.split(/\s+/).length : 0,
      retrievedAt: new Date().toISOString(),
    });
  });
  return out;
}

function parseHistory(raw: unknown): AssistantMessage[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .slice(-6)
    .filter((item): item is AssistantMessage => {
      if (!item || typeof item !== "object") return false;
      const value = item as Record<string, unknown>;
      return (
        (value.role === "user" || value.role === "assistant") &&
        typeof value.content === "string" &&
        value.content.trim().length > 0
      );
    })
    .map((item, index) => ({
      id: `history-${index}`,
      role: item.role,
      content: item.content.slice(0, 4000),
      citations: [],
      grounded: false,
    }));
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "A JSON object is required." }, { status: 400 });
  }

  const { question, context, history } = body as {
    question?: unknown;
    context?: unknown;
    history?: unknown;
  };

  if (typeof question !== "string" || question.trim().length === 0) {
    return NextResponse.json({ error: "A question is required." }, { status: 400 });
  }
  if (question.length > 2000) {
    return NextResponse.json({ error: "Question is too long." }, { status: 400 });
  }

  const sources = parseSources(context);
  const prior = parseHistory(history);

  try {
    const outcome = await askAssistant(question.trim(), sources, prior);
    return NextResponse.json(
      { message: outcome.message, available: outcome.available },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const message =
      error instanceof Error && error.name === "AbortError"
        ? "AI provider timed out after 30 seconds. Try again or choose a faster model."
        : error instanceof Error
          ? error.message
          : "AI request failed.";
    return NextResponse.json({ error: message }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}