import fs from "fs";
import * as cheerio from "cheerio";

const queries = [
  'site:reddit.com/r/psagrading "worth grading"',
  'site:reddit.com/r/psagrading "should I grade"',
  'site:reddit.com/r/PokeGrading "worth grading"',
  'site:reddit.com/r/PokeGrading "should I grade"',
  'site:reddit.com/r/baseballcards "grade or sell"',
  'site:reddit.com/r/sportscards "sell raw"',
];

const out = "reddit-leads.csv";
const seen = new Set();

if (fs.existsSync(out)) {
  for (const line of fs.readFileSync(out, "utf8").split("\n").slice(1)) {
    const url = line.match(/https?:\/\/[^"]+/)?.[0];
    if (url) seen.add(url);
  }
}

function csv(v) {
  return `"${String(v ?? "").replaceAll('"', '""')}"`;
}

if (!fs.existsSync(out)) {
  fs.writeFileSync(out, "found_at,query,title,url,reply\n");
}

let added = 0;

for (const q of queries) {
  const url = "https://www.google.com/search?q=" + encodeURIComponent(q);

  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
    },
  });

  const html = await res.text();
  const $ = cheerio.load(html);

  $("a").each((_, a) => {
    const href = $(a).attr("href") || "";
    const text = $(a).text().trim();

    const match = href.match(/\/url\?q=(https:\/\/www\.reddit\.com\/r\/[^&]+)/);
    if (!match) return;

    const redditUrl = decodeURIComponent(match[1]).split("?")[0];

    if (seen.has(redditUrl)) return;
    if (!text) return;

    seen.add(redditUrl);
    added++;

    const reply =
      "Hard to call without seeing the back corners and surface in good light. What usually decides it for me is whether a PSA 9 still clears fees or if you really need a 10 for the math to work. If you drop the card name and how the centering looks I can walk through raw vs 9 vs 10 after fees.";

    fs.appendFileSync(
      out,
      [
        csv(new Date().toLocaleString()),
        csv(q),
        csv(text),
        csv(redditUrl),
        csv(reply),
      ].join(",") + "\n"
    );
  });

  await new Promise(r => setTimeout(r, 2500));
}

console.log(`Added ${added} leads`);
