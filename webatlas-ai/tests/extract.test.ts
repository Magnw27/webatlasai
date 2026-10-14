import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { normalize, sourceId, ExtractionError, extractSource } from "../lib/scraper/extract.ts";

const html = `<!doctype html><html><head><title>Test Page</title>
  <meta name="description" content="A short description." />
  <script>window.evil = "<p>not text</p>"</script>
  </head><body><nav>menu</nav><article><h1>Heading</h1>
  <p>Costs fell by 40% in 2025 across the benchmark suite.</p>
  </article><footer>footer</footer></body></html>`;

describe("normalize", () => {
  it("extracts title, description and article text", () => {
    const source = normalize("https://example.com/a", html);
    assert.equal(source.title, "Test Page");
    assert.ok(source.text.includes("Costs fell by 40%"));
    assert.ok(source.text.includes("A short description."));
  });

  it("strips scripts, nav and footer", () => {
    const source = normalize("https://example.com/a", html);
    assert.ok(!source.text.includes("window.evil"));
    assert.ok(!source.text.includes("menu"));
    assert.ok(!source.text.includes("footer"));
  });

  it("derives a stable id and domain", () => {
    const a = normalize("https://www.example.com/a", html);
    const b = normalize("https://www.example.com/a", html);
    assert.equal(a.id, b.id);
    assert.equal(a.domain, "example.com");
    assert.equal(sourceId("https://www.example.com/a"), a.id);
  });
});

describe("extractSource guards", () => {
  it("rejects invalid and non-http urls", async () => {
    await assert.rejects(() => extractSource("not a url"), ExtractionError);
    await assert.rejects(() => extractSource("ftp://example.com"), ExtractionError);
  });

  it("blocks private and local addresses", async () => {
    await assert.rejects(() => extractSource("http://localhost/x"), ExtractionError);
    await assert.rejects(() => extractSource("http://127.0.0.1/x"), ExtractionError);
    await assert.rejects(() => extractSource("http://192.168.0.1/x"), ExtractionError);
    await assert.rejects(() => extractSource("http://10.1.2.3/x"), ExtractionError);
  });
});