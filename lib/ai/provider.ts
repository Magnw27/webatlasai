import type { AssistantMessage, ExtractedSource } from "@/types";

export interface AiOutcome {
  available: boolean;
  message: AssistantMessage;
}

const SYSTEM = [
  "You are the WebAtlas research assistant.",
  "Only use the provided source context. Never invent sources, URLs, numbers, or claims.",
  "If the context does not answer the question, say so plainly.",
  "Separate facts taken from sources from your own inference, and label inference with 'Inference:'.",
  "Cite sources by their exact URL when stating a fact. You may cite a source by its bracketed number, such as [1], but never invent a citation.",
  "If no source context is supplied, clearly explain that you cannot verify factual claims from the user's research sources.",
].join(" ");

function buildContext(sources: ExtractedSource[]): string {
  if (sources.length === 0) return "(no sources supplied)";
  return sources
    .slice(0, 10)
    .map((s, i) => `[${i + 1}] ${s.title}\nURL: ${s.url}\n${s.text.slice(0, 4000)}`)
    .join("\n\n---\n\n");
}

export function aiConfigured(): boolean {
  return Boolean(process.env.AI_API_KEY?.trim());
}

export async function askAssistant(
  question: string,
  sources: ExtractedSource[],
  history: AssistantMessage[] = [],
): Promise<AiOutcome> {
  const apiKey = process.env.AI_API_KEY?.trim();
  if (!apiKey) {
    return {
      available: false,
      message: {
        id: `local-${Date.now()}`,
        role: "assistant",
        content:
          "AI belum dikonfigurasi di server. Isi AI_API_KEY, AI_BASE_URL, dan AI_MODEL pada environment deployment, lalu mulai ulang server. Hasil riset dan sumber yang sudah terkumpul tetap bisa digunakan.",
        citations: [],
        grounded: false,
      },
    };
  }

  const baseUrl = (process.env.AI_BASE_URL ?? "https://api.openai.com/v1").trim().replace(/\/+$/, "");
  const model = (process.env.AI_MODEL ?? "gpt-4o-mini").trim();
  if (!baseUrl || !model) {
    throw new Error("AI provider configuration is incomplete. Check AI_BASE_URL and AI_MODEL.");
  }

  const messages = [
    { role: "system", content: SYSTEM },
    { role: "system", content: `Source context:\n\n${buildContext(sources)}` },
    ...history
      .filter((m) =>
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim().length > 0,
      )
      .slice(-6)
      .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) })),
    { role: "user", content: question },
  ];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, messages, temperature: 0.2 }),
      signal: controller.signal,
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) throw new Error("AI provider rejected the API key. Check AI_API_KEY.");
      if (res.status === 429) throw new Error("AI provider rate limit reached. Wait a moment or try another model.");
      throw new Error(`AI provider responded with HTTP ${res.status}.`);
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string | Array<{ type?: string; text?: string }> } }[];
    };
    const rawContent = data.choices?.[0]?.message?.content;
    const content = (typeof rawContent === "string"
      ? rawContent
      : Array.isArray(rawContent)
        ? rawContent.map((part) => part.text ?? "").join("\n")
        : "").trim();

    if (!content) {
      throw new Error("AI provider returned an empty response. Check that the selected model supports chat completions.");
    }

    const citations = sources
      .filter((s, i) => content.includes(s.url) || content.includes(`[${i + 1}]`))
      .map((s) => s.url);

    return {
      available: true,
      message: {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content,
        citations: [...new Set(citations)],
        grounded: sources.length > 0,
      },
    };
  } finally {
    clearTimeout(timeout);
  }
}