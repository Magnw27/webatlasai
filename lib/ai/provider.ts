import type { AssistantMessage, ExtractedSource } from "@/types";

export interface AiOutcome {
  available: boolean;
  message: AssistantMessage;
}

type ProviderPayload = {
  choices?: {
    message?: {
      content?: string | Array<{ type?: string; text?: string }>;
    };
    delta?: {
      content?: string | Array<{ type?: string; text?: string }>;
    };
  }[];
  error?: { message?: string } | string;
};

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

/**
 * Some OpenAI-compatible gateways append another JSON object, emit JSONL,
 * or wrap the response in SSE data lines. Response.json() rejects these with
 * "Unexpected non-whitespace character after JSON". Extract complete JSON
 * values and select the first OpenAI-compatible chat-completion payload.
 */
function parseProviderPayload(raw: string): ProviderPayload {
  const text = raw.trim();
  if (!text) throw new Error("AI provider returned an empty HTTP response.");

  const candidates: ProviderPayload[] = [];
  const tryParse = (value: string) => {
    const candidate = value.trim();
    if (!candidate || candidate === "[DONE]") return;
    try {
      const parsed: unknown = JSON.parse(candidate);
      if (parsed && typeof parsed === "object") candidates.push(parsed as ProviderPayload);
    } catch {
      // Try the next JSON value or SSE data line.
    }
  };

  // Standard JSON response.
  tryParse(text);

  // Server-sent events / JSONL, including gateways that stream despite
  // not setting the correct content-type.
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed.startsWith("data:")) tryParse(trimmed.slice(5));
    else if (trimmed.startsWith("{") || trimmed.startsWith("[")) tryParse(trimmed);
  }

  // Find adjacent JSON objects in a single response body.
  let start = -1;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') {
      inString = true;
      continue;
    }
    if (char === "{" || char === "[") {
      if (depth === 0) start = i;
      depth += 1;
    } else if (char === "}" || char === "]") {
      depth -= 1;
      if (depth === 0 && start >= 0) {
        tryParse(text.slice(start, i + 1));
        start = -1;
      }
    }
  }

  const payload = candidates.find((candidate) => Array.isArray(candidate.choices));
  if (payload) return payload;

  const providerError = candidates.find((candidate) => candidate.error);
  if (providerError?.error) {
    const detail = typeof providerError.error === "string"
      ? providerError.error
      : providerError.error.message;
    throw new Error(detail || "AI provider returned an error.");
  }

  throw new Error(
    "AI provider returned an unreadable response. Check AI_BASE_URL and ensure the endpoint returns OpenAI-compatible /chat/completions JSON.",
  );
}

function getText(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part === "object" && "text" in part) {
          const text = (part as { text?: unknown }).text;
          return typeof text === "string" ? text : "";
        }
        return "";
      })
      .filter(Boolean)
      .join("\n");
  }
  return "";
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
        Accept: "application/json, text/event-stream",
      },
      body: JSON.stringify({ model, messages, temperature: 0.2, stream: false }),
      signal: controller.signal,
    });

    const raw = await res.text();
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        throw new Error("AI provider rejected the API key. Check AI_API_KEY.");
      }
      if (res.status === 429) {
        throw new Error("AI provider rate limit reached. Wait a moment or try another model.");
      }
      let detail = "";
      try {
        const errorPayload = JSON.parse(raw) as ProviderPayload;
        detail = typeof errorPayload.error === "string"
          ? errorPayload.error
          : errorPayload.error?.message ?? "";
      } catch {
        detail = raw.slice(0, 240).replace(/\s+/g, " ");
      }
      throw new Error(`AI provider responded with HTTP ${res.status}.${detail ? ` ${detail}` : ""}`);
    }

    const data = parseProviderPayload(raw);
    const firstChoice = data.choices?.[0];
    const content = getText(firstChoice?.message?.content ?? firstChoice?.delta?.content).trim();

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
