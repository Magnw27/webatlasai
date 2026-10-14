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
  "Cite sources by their URL when you state a fact.",
].join(" ");

function buildContext(sources: ExtractedSource[]): string {
  if (sources.length === 0) return "(no sources supplied)";
  return sources
    .map(
      (s, i) =>
        `[${i + 1}] ${s.title}\nURL: ${s.url}\n${s.text.slice(0, 4000)}`,
    )
    .join("\n\n---\n\n");
}

export function aiConfigured(): boolean {
  return Boolean(process.env.AI_API_KEY);
}

export async function askAssistant(
  question: string,
  sources: ExtractedSource[],
  history: AssistantMessage[] = [],
): Promise<AiOutcome> {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) {
    return {
      available: false,
      message: {
        id: `local-${Date.now()}`,
        role: "assistant",
        content:
          "The AI assistant is not configured. Set AI_API_KEY to enable grounded answers over your sources. Research results above remain fully usable without it.",
        citations: [],
        grounded: false,
      },
    };
  }

  const baseUrl = (process.env.AI_BASE_URL ?? "https://api.openai.com/v1").replace(/\/$/, "");
  const model = process.env.AI_MODEL ?? "gpt-4o-mini";

  const messages = [
    { role: "system", content: SYSTEM },
    { role: "system", content: `Source context:\n\n${buildContext(sources)}` },
    ...history.slice(-6).map((m) => ({ role: m.role, content: m.content })),
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
      throw new Error(`AI provider responded ${res.status}`);
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      throw new Error("AI provider returned an empty response");
    }

    const citations = sources
      .filter((s) => content.includes(s.url))
      .map((s) => s.url);

    return {
      available: true,
      message: {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content,
        citations,
        grounded: sources.length > 0,
      },
    };
  } finally {
    clearTimeout(timeout);
  }
}