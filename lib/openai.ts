import OpenAI from "openai";
import type { CardAnalysis } from "@/lib/types";

function num(v: unknown, fallback = 0): number {
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  if (typeof v === "string") {
    const n = parseFloat(v.replace(/[^0-9.-]/g, ""));
    return Number.isNaN(n) ? fallback : n;
  }
  return fallback;
}

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : v != null ? String(v) : fallback;
}

export async function analyzeCardWithOpenAI(
  cardName: string,
  condition: string
): Promise<CardAnalysis> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const client = new OpenAI({ apiKey });

  const prompt = `You are a sports card pricing expert. The user describes a trading card.
Card search text: "${cardName}"
Stated condition: "${condition}"

Using your knowledge of recent eBay market comps and hobby pricing for this card (or the closest match), return a JSON object with EXACTLY these keys and numeric values in USD where applicable:
{
  "confirmedName": string,
  "year": string or number,
  "player": string,
  "set": string,
  "sport": string,
  "rawValueLow": number,
  "rawValueMid": number,
  "rawValueHigh": number,
  "gradedPSA9Value": number,
  "gradedPSA10Value": number,
  "worthGrading": boolean,
  "verdictReason": string (one short sentence explaining the grading verdict)
}

Estimate raw value range for the stated condition. If the exact card is unknown, infer the best match and say so in verdictReason.
Return ONLY valid JSON. No markdown, no code fences.`;

  const res = await client.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: "You output only valid JSON objects." },
      { role: "user", content: prompt },
    ],
  });

  const raw = res.choices[0]?.message?.content;
  if (!raw) throw new Error("OpenAI returned empty content");

  const parsed = JSON.parse(raw) as Record<string, unknown>;

  const yearVal = parsed.year;
  const year =
    typeof yearVal === "number" || typeof yearVal === "string"
      ? yearVal
      : "";

  return {
    confirmedName: str(parsed.confirmedName, cardName),
    year,
    player: str(parsed.player),
    set: str(parsed.set),
    sport: str(parsed.sport),
    rawValueLow: num(parsed.rawValueLow),
    rawValueMid: num(parsed.rawValueMid),
    rawValueHigh: num(parsed.rawValueHigh),
    gradedPSA9Value: num(parsed.gradedPSA9Value),
    gradedPSA10Value: num(parsed.gradedPSA10Value),
    worthGrading: Boolean(parsed.worthGrading),
    verdictReason: str(parsed.verdictReason, "Based on estimated market values."),
  };
}
