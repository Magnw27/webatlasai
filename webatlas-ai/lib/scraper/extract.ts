import * as cheerio from "cheerio";
import { createHash } from "crypto";
import type { ExtractedSource } from "@/types";

const MAX_BYTES = 1_500_000;
const MAX_CHARS = 20_000;

export class ExtractionError extends Error {}

function domainOf(url: string): string {
  return new URL(url).hostname.replace(/^www\./, "");
}

export function sourceId(url: string): string {
  return createHash("sha256").update(url).digest("hex").slice(0, 16);
}

function assertFetchable(url: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new ExtractionError("That is not a valid URL.");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new ExtractionError("Only http and https URLs are allowed.");
  }
  const host = parsed.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".local") || host === "0.0.0.0") {
    throw new ExtractionError("Local addresses are not allowed.");
  }
  // Block private IPv4 ranges to avoid SSRF into internal networks.
  const v4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (v4) {
    const [a, b] = [Number(v4[1]), Number(v4[2])];
    if (
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168)
    ) {
      throw new ExtractionError("Private addresses are not allowed.");
    }
  }
  return parsed;
}

export async function extractSource(url: string): Promise<ExtractedSource> {
  const parsed = assertFetchable(url);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(parsed.toString(), {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "WebAtlasAI/0.1 (+research; contact: local)",
        Accept: "text/html,application/xhtml+xml",
      },
    });

    if (!res.ok) {
      throw new ExtractionError(`Source responded ${res.status}.`);
    }

    const type = res.headers.get("content-type") ?? "";
    if (!type.includes("text/html")) {
      throw new ExtractionError("Source is not an HTML page.");
    }

    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength > MAX_BYTES) {
      throw new ExtractionError("Source is too large to process.");
    }

    const html = buf.toString("utf8");
    return normalize(parsed.toString(), html);
  } finally {
    clearTimeout(timeout);
  }
}

export function normalize(url: string, html: string): ExtractedSource {
  const $ = cheerio.load(html);
  $("script, style, noscript, iframe, svg, nav, footer, header, form").remove();

  const title =
    $('meta[property="og:title"]').attr("content")?.trim() ||
    $("title").first().text().trim() ||
    $("h1").first().text().trim() ||
    url;

  const metaParts: string[] = [];
  const desc =
    $('meta[name="description"]').attr("content")?.trim() ||
    $('meta[property="og:description"]').attr("content")?.trim();
  if (desc) metaParts.push(desc);

  const body = $("article").first().length
    ? $("article").first().text()
    : $("main").first().length
      ? $("main").first().text()
      : $("body").text();

  const text = [metaParts.join(" "), body]
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_CHARS);

  const wordCount = text ? text.split(/\s+/).length : 0;

  return {
    id: sourceId(url),
    url,
    domain: domainOf(url),
    title: title.slice(0, 300),
    text,
    wordCount,
    retrievedAt: new Date().toISOString(),
  };
}