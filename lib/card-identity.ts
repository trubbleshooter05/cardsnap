import type { CardAnalysis, ScanResultPayload } from "@/lib/types";
import { computeGradingRoi } from "@/lib/roi";

export type KnownCardAnchor = {
  id: string;
  setNumber: string;
  displayName: string;
  /** Minimum plausible raw NM mid in USD — below this suggests wrong tier. */
  minRawUsd: number;
  wrongTierLabel?: string;
};

export type ParsedCardIdentity = {
  searchText: string;
  setNumber: string | null;
  anchor: KnownCardAnchor | null;
  ebayQuery: string;
};

export type CardMatchValidation = {
  ok: boolean;
  warnings: string[];
  anchor: KnownCardAnchor | null;
};

const MOONBREON: KnownCardAnchor = {
  id: "moonbreon-215",
  setNumber: "215",
  displayName: "Umbreon VMAX Alternate Art (Evolving Skies #215 / Moonbreon)",
  minRawUsd: 1500,
  wrongTierLabel: "Umbreon V Alt #189 (~$400–700 raw)",
};

const UMBREON_V_ALT: KnownCardAnchor = {
  id: "umbreon-v-189",
  setNumber: "189",
  displayName: "Umbreon V Alternate Art (Evolving Skies #189)",
  minRawUsd: 250,
};

/** Extract a collector set number from free text (#215, 215/203, etc.). */
export function parseSetNumber(cardName: string): string | null {
  const hashMatch = cardName.match(/#\s*(\d{1,4})\b/);
  if (hashMatch) return hashMatch[1];

  const slashMatch = cardName.match(/\b(\d{1,4})\s*\/\s*\d{1,4}\b/);
  if (slashMatch) return slashMatch[1];

  return null;
}

function textLower(cardName: string): string {
  return cardName.toLowerCase();
}

/** Resolve high-risk Pokémon alts where similar names collide (215 vs 189). */
export function resolveKnownAnchor(cardName: string): KnownCardAnchor | null {
  const lower = textLower(cardName);
  const setNum = parseSetNumber(cardName);

  if (!lower.includes("umbreon") && !lower.includes("moonbreon")) {
    return null;
  }

  if (setNum === "189" || (lower.includes(" v alt") && !lower.includes("vmax"))) {
    if (setNum === "215" || lower.includes("vmax") || lower.includes("moonbreon")) {
      // Explicit #215 / VMAX / Moonbreon wins over vague "V alt" wording.
    } else {
      return UMBREON_V_ALT;
    }
  }

  if (
    setNum === "215" ||
    lower.includes("moonbreon") ||
    (lower.includes("vmax") && lower.includes("umbreon"))
  ) {
    return MOONBREON;
  }

  return null;
}

export function parseCardIdentity(cardName: string): ParsedCardIdentity {
  const trimmed = cardName.trim();
  const setNumber = parseSetNumber(trimmed);
  const anchor = resolveKnownAnchor(trimmed);
  return {
    searchText: trimmed,
    setNumber,
    anchor,
    ebayQuery: buildEbaySearchQuery(trimmed, anchor, setNumber),
  };
}

export function buildEbaySearchQuery(
  cardName: string,
  anchor: KnownCardAnchor | null = resolveKnownAnchor(cardName),
  setNumber: string | null = parseSetNumber(cardName)
): string {
  if (anchor?.id === "moonbreon-215") {
    return "Pokemon Umbreon VMAX Alternate Art Evolving Skies 215";
  }
  if (anchor?.id === "umbreon-v-189") {
    return "Pokemon Umbreon V Alternate Art Evolving Skies 189";
  }

  const raw = cardName.trim();
  const yearMatch = raw.match(/\b(19|20)\d{2}\b/);
  const year = yearMatch?.[0] ?? null;
  const num = setNumber ?? parseSetNumber(raw);

  const gradingNoise =
    /\b(psa|bgs|sgc|cgc|hga|tags)\s*[\d.]+\b|\b(psa|bgs|sgc|cgc)\b|\b(raw|ungraded|gem\s*mint|near\s*mint|nm-m?|mint)\b/gi;
  let core = raw.replace(gradingNoise, " ").replace(/\s+/g, " ").trim();

  const parallelPatterns = [
    /\bsilver\s+prizm\b/i,
    /\bgold\s+prizm\b/i,
    /\b(blue|green|red|purple|black|white|orange|pink|teal)\s+(prizm|wave|mosaic|refractor|velocity|holo)\b/i,
    /\bprizm\b/i,
    /\brefractor\b/i,
    /\b(alternate|alt)\s+art\b/i,
    /\bvmax\b|\bvstar\b|\bex\b/i,
    /\b\d+\s*\/\s*\d+\b/,
  ];
  const parallelParts: string[] = [];
  for (const pattern of parallelPatterns) {
    const hit = core.match(pattern);
    if (hit && !parallelParts.includes(hit[0])) {
      parallelParts.push(hit[0].replace(/\s+/g, " ").trim());
    }
  }

  if (year) {
    core = core.replace(new RegExp(`\\b${year}\\b`), "").trim();
  }
  if (num) {
    core = core
      .replace(new RegExp(`#\\s*${num}\\b`, "i"), "")
      .replace(new RegExp(`\\b${num}\\s*\\/\\s*\\d+\\b`), "")
      .trim();
  }

  const parts: string[] = [];
  if (year) parts.push(year);
  if (core) parts.push(core);
  for (const p of parallelParts) {
    if (!parts.join(" ").toLowerCase().includes(p.toLowerCase())) {
      parts.push(p);
    }
  }
  if (num && !parts.some((p) => p.includes(num))) {
    parts.push(`#${num}`);
  }

  const query = parts.join(" ").replace(/\s+/g, " ").trim();
  if (query.length > 0) return query.slice(0, 120);
  if (num) return `${raw} ${num}`.replace(/\s+/g, " ").trim();
  return raw;
}

function rawMid(
  analysis: Pick<CardAnalysis, "rawValueLow" | "rawValueMid" | "rawValueHigh">
): number {
  if (analysis.rawValueMid > 0) return analysis.rawValueMid;
  return (analysis.rawValueLow + analysis.rawValueHigh) / 2;
}

function confirmedNameLooksWrong(
  confirmedName: string,
  anchor: KnownCardAnchor
): boolean {
  const name = confirmedName.toLowerCase();
  if (anchor.id === "moonbreon-215") {
    const looks189 =
      /#\s*189\b|\b189\/\d+\b/.test(name) ||
      (/\bv alt\b|\bv alternate\b/.test(name) && !/\bvmax\b|moonbreon|#\s*215\b|\b215\/\d+\b/.test(name));
    return looks189;
  }
  if (anchor.id === "umbreon-v-189") {
    return /\bvmax\b|moonbreon|#\s*215\b|\b215\/\d+\b/.test(name);
  }
  return false;
}

export function validateCardPricing(
  cardName: string,
  analysis: Pick<
    CardAnalysis,
    "confirmedName" | "rawValueLow" | "rawValueMid" | "rawValueHigh"
  >,
  ebayAvg: number | null
): CardMatchValidation {
  const anchor = resolveKnownAnchor(cardName);
  if (!anchor) {
    return { ok: true, warnings: [], anchor: null };
  }

  const warnings: string[] = [];
  const mid = rawMid(analysis);

  if (confirmedNameLooksWrong(analysis.confirmedName, anchor)) {
    warnings.push(
      `Model labeled "${analysis.confirmedName}" but you searched for ${anchor.displayName}.`
    );
  }

  if (mid > 0 && mid < anchor.minRawUsd) {
    const hint = anchor.wrongTierLabel
      ? ` Values look closer to ${anchor.wrongTierLabel}.`
      : "";
    warnings.push(
      `Raw about $${Math.round(mid)} is below the plausible floor for ${anchor.displayName} (~$${anchor.minRawUsd}+).${hint}`
    );
  }

  if (ebayAvg != null && ebayAvg > 0 && ebayAvg < anchor.minRawUsd) {
    warnings.push(
      `eBay active listings average about $${Math.round(ebayAvg)}, below the ${anchor.displayName} floor — search may be mixing similar cards.`
    );
  }

  return { ok: warnings.length === 0, warnings, anchor };
}

/** Attach warnings and force skip when pricing likely matches the wrong tier. */
export function applyCardMatchWarnings(
  merged: ScanResultPayload,
  validation: CardMatchValidation
): ScanResultPayload {
  if (validation.warnings.length === 0) {
    return merged;
  }

  const roi = merged.roi ?? computeGradingRoi(merged, undefined, merged);
  const cardWarnings = validation.warnings.map((w) => `Card match: ${w}`);
  const loseMoneyReasons = [...cardWarnings, ...roi.loseMoneyReasons].slice(0, 5);

  return {
    ...merged,
    worthGrading: false,
    verdictReason: `${merged.verdictReason} Card match warning: ${validation.warnings.join(" ")}`,
    roi: {
      ...roi,
      headlineVerdict: "skip",
      loseMoneyReasons,
    },
  };
}

export function openAiCardContext(identity: ParsedCardIdentity): string {
  if (!identity.anchor) return "";
  return `
CRITICAL CARD ID (do not substitute a different card):
- Target: ${identity.anchor.displayName}
- Set number: #${identity.anchor.setNumber}
- Do NOT use pricing for other Umbreon Evolving Skies alts (especially #189 vs #215).
- Plausible raw NM is typically at least ~$${identity.anchor.minRawUsd} for this exact card.
- If you cannot price THIS exact card, set rawValueMid/graded values to 0 and explain in verdictReason.`;
}
