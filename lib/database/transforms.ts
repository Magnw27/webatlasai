import type { ExtractedSource, StructuredRow } from "@/types";

export interface Stat {
  label: string;
  value: string;
  sourceUrl: string;
}

function firstNumber(text: string): RegExpMatchArray | null {
  return text.match(/(\d+(?:[.,]\d+)?)\s*(%|percent|mm|cm|m|k|million|billion)?/i);
}

// Extract a small, honest set of numeric stats from supplied text. Every stat
// keeps the source URL it came from. Absence of numbers yields no rows.
export function extractStats(source: ExtractedSource): Stat[] {
  const stats: Stat[] = [];
  const sentences = source.text.split(/(?<=[.!?])\s+/);

  for (const sentence of sentences) {
    const match = firstNumber(sentence);
    if (!match) continue;
    const value = `${match[1]}${match[2] ? ` ${match[2]}` : ""}`.trim();
    const label = sentence.replace(/\s+/g, " ").slice(0, 120);
    stats.push({ label, value, sourceUrl: source.url });
    if (stats.length >= 8) break;
  }

  return stats;
}

export function toStructuredRows(sources: ExtractedSource[]): StructuredRow[] {
  const rows: StructuredRow[] = [];
  sources.forEach((source, index) => {
    extractStats(source).forEach((stat, statIndex) => {
      rows.push({
        id: `${source.id}-${statIndex}`,
        label: stat.label,
        fields: {
          statement: stat.label,
          value: stat.value,
          source: source.domain,
        },
        sources: [stat.sourceUrl],
      });
      void index;
    });
  });
  return rows;
}