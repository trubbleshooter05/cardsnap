import Parser from "rss-parser";
import fs from "fs";

const parser = new Parser();

const subs = [
  "psagrading",
  "PokeGrading",
  "pokemoncardvalue",
  "sportscards",
  "baseballcards",
  "basketballcards",
  "footballcards",
  "Topps",
];

const keywords = [
  "should i grade",
  "worth grading",
  "grade this",
  "psa 10",
  "psa 9",
  "sell raw",
  "grade or sell",
  "send to psa",
  "submit to psa",
  "is this a 10",
];

const bad = ["psa return", "mail day", "showoff", "just got back", "for sale", "trade"];

const out = "reddit-leads.csv";
const seen = new Set();

if (fs.existsSync(out)) {
  const lines = fs.readFileSync(out, "utf8").split("\n").slice(1);
  for (const line of lines) {
    const parts = line.split(",");
    if (parts[6]) seen.add(parts[6].replaceAll('"', ""));
  }
}

const rows = [];

function csv(v) {
  return `"${String(v ?? "").replaceAll('"', '""')}"`;
}

for (const sub of subs) {
  const feed = await parser.parseURL(`https://www.reddit.com/r/${sub}/new/.rss`);

  for (const item of feed.items) {
    const title = item.title || "";
    const content = item.contentSnippet || item.content || "";
    const url = item.link || "";
    const text = `${title} ${content}`.toLowerCase();

    if (seen.has(url)) continue;
    if (!keywords.some(k => text.includes(k))) continue;
    if (bad.some(b => text.includes(b))) continue;

    const ageHours = item.isoDate
      ? Math.round(((Date.now() - new Date(item.isoDate).getTime()) / 36e5) * 10) / 10
      : "";

    if (ageHours !== "" && ageHours > 48) continue;

    const hasImage =
      text.includes("i.redd.it") ||
      text.includes("preview.redd.it") ||
      text.includes("reddit.com/gallery") ||
      text.includes(".jpg") ||
      text.includes(".png") ||
      text.includes(".webp");

    let score = 0;
    if (hasImage) score += 3;
    if (text.includes("worth grading")) score += 3;
    if (text.includes("should i grade")) score += 3;
    if (text.includes("psa")) score += 1;
    if (ageHours !== "" && ageHours <= 12) score += 2;

    rows.push({
      foundAt: new Date().toLocaleString(),
      score,
      subreddit: sub,
      title,
      ageHours,
      hasImage,
      url,
      reply:
        "Hard to call without seeing the back corners and surface in good light. What usually decides it for me is whether a PSA 9 still clears fees or if you really need a 10 for the math to work. If you drop the card name and how the centering looks I can walk through raw vs 9 vs 10 after fees.",
    });
  }
}

rows.sort((a, b) => b.score - a.score);

const header = "found_at,score,subreddit,title,age_hours,has_image,url,reply\n";

if (!fs.existsSync(out)) fs.writeFileSync(out, header);

for (const r of rows) {
  fs.appendFileSync(
    out,
    [
      csv(r.foundAt),
      csv(r.score),
      csv(r.subreddit),
      csv(r.title),
      csv(r.ageHours),
      csv(r.hasImage),
      csv(r.url),
      csv(r.reply),
    ].join(",") + "\n"
  );
}

console.log(`Found ${rows.length} new leads`);
for (const r of rows.slice(0, 15)) {
  console.log(`${r.score} | r/${r.subreddit} | ${r.title} | ${r.url}`);
}
