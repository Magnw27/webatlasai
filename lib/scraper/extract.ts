import * as cheerio from "cheerio";
import { lookup } from "node:dns/promises";
import { createHash } from "node:crypto";
import { isIP } from "node:net";
import type { ExtractedSource } from "@/types";

const MAX_BYTES = 1_500_000;
const MAX_CHARS = 20_000;
const MAX_REDIRECTS = 5;

export class ExtractionError extends Error {}

function domainOf(url: string): string {
  return new URL(url).hostname.replace(/^www\./, "");
}

export function sourceId(url: string): string {
  return createHash("sha256").update(url).digest("hex").slice(0, 16);
}

function isPublicAddress(address: string): boolean {
  const version = isIP(address);
  if (version === 4) {
    const octets = address.split(".").map(Number);
    const [a, b, c] = octets;
    if (octets.length !== 4 || octets.some((part) => part < 0 || part > 255)) return false;
    if (
      a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 192 && b === 0 && c === 0) ||
      (a === 192 && b === 0 && c === 2) ||
      (a === 198 && (b === 18 || b === 19)) ||
      (a === 198 && b === 51 && c === 100) ||
      (a === 203 && b === 0 && c === 113)
    ) return false;
    return true;
  }

  if (version === 6) {
    const first = Number.parseInt(address.split(":")[0] || "0", 16);
    return first >= 0x2000 && first <= 0x3fff && !address.toLowerCase().startsWith("2001:db8:");
  }
  return false;
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
  if (parsed.username || parsed.password) {
    throw new ExtractionError("URLs containing embedded credentials are not allowed.");
  }
  const host = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (!host || host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) {
    throw new ExtractionError("Local addresses are not allowed.");
  }
  if (isIP(host) && !isPublicAddress(host)) {
    throw new ExtractionError("Private or non-public addresses are not allowed.");
  }
  return parsed;
}

async function assertPublicHost(url: URL): Promise<void> {
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (isIP(host)) {
    if (!isPublicAddress(host)) throw new ExtractionError("Private or non-public addresses are not allowed.");
    return;
  }
  let addresses: Array<{ address: string; family: number }>;
  try {
    addresses = await lookup(host, { all: true, verbatim: true });
  } catch {
    throw new ExtractionError("Could not resolve the source hostname.");
  }
  if (addresses.length === 0 || addresses.some((entry) => !isPublicAddress(entry.address))) {
    throw new ExtractionError("The source hostname resolves to a private or non-public address.");
  }
}

async function readLimitedBody(response: Response): Promise<Buffer> {
  if (!response.body) throw new ExtractionError("Source returned an empty response.");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BYTES) {
        await reader.cancel();
        throw new ExtractionError("Source is too large to process.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)), total);
}

export async function extractSource(url: string): Promise<ExtractedSource> {
  let target = assertFetchable(url);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    let res: Response | null = null;
    for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
      await assertPublicHost(target);
      res = await fetch(target.toString(), {
        redirect: "manual",
        signal: controller.signal,
        headers: {
          "User-Agent": "WebAtlasAI/1.0 (+research)",
          Accept: "text/html,application/xhtml+xml",
        },
      });
      if (![301, 302, 303, 307, 308].includes(res.status)) break;
      const location = res.headers.get("location");
      await res.body?.cancel();
      if (!location) throw new ExtractionError("Source returned an invalid redirect.");
      if (redirectCount === MAX_REDIRECTS) throw new ExtractionError("Source redirected too many times.");
      target = assertFetchable(new URL(location, target).toString());
      res = null;
    }
    if (!res) throw new ExtractionError("Could not retrieve the source.");
    if (!res.ok) throw new ExtractionError(`Source responded ${res.status}.`);
    const type = (res.headers.get("content-type") ?? "").toLowerCase();
    if (!type.includes("text/html") && !type.includes("application/xhtml+xml")) {
      await res.body?.cancel();
      throw new ExtractionError("Source is not an HTML page.");
    }
    const buf = await readLimitedBody(res);
    return normalize(target.toString(), buf.toString("utf8"));
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
  const text = [metaParts.join(" "), body].join(" ").replace(/\s+/g, " ").trim().slice(0, MAX_CHARS);
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
