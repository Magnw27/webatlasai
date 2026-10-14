import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { extractStats, toStructuredRows } from "../lib/database/transforms.ts";
import type { ExtractedSource } from "../types/index.ts";

function source(text: string): ExtractedSource {
  return {
    id: "s1",
    url: "https://example.com/a",
    domain: "example.com",
    title: "T",
    text,
    wordCount: text.split(/\s+/).length,
    retrievedAt: new Date().toISOString(),
  };
}

describe("extractStats", () => {
  it("captures numeric claims with the source url", () => {
    const stats = extractStats(source("Costs fell by 40% in 2025. Growth was 3 mm per year."));
    assert.ok(stats.length >= 2);
    assert.equal(stats[0]!.sourceUrl, "https://example.com/a");
    assert.ok(stats.some((s) => s.value.includes("40")));
  });

  it("returns nothing when there are no numbers", () => {
    assert.deepEqual(extractStats(source("There are no figures in this sentence.")), []);
  });
});

describe("toStructuredRows", () => {
  it("builds rows that keep source links", () => {
    const rows = toStructuredRows([source("Revenue grew 12% last year.")]);
    assert.equal(rows.length, 1);
    assert.equal(rows[0]!.sources[0], "https://example.com/a");
    assert.ok(rows[0]!.fields.value!.includes("12"));
  });

  it("produces no rows without numbers", () => {
    assert.deepEqual(toStructuredRows([source("No numbers here.")]), []);
  });
});