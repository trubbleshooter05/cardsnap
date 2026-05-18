import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import dotenv from "dotenv";

dotenv.config({ path: path.join(process.env.HOME!, ".hermes", ".env") });

type CsvRow = Record<string, string>;
type SearchUgcTone = "almost_overpaid" | "psa9_destroyer" | "mistake_avoided";

type DailyArgs = {
  date: string;
  skipRender: boolean;
  verbose: boolean;
};

type DailyAsset = {
  title: string;
  tone: SearchUgcTone;
  composition: string;
  output: string;
  audio: string;
  tiktokCaption: string;
  youtubeTitle: string;
  youtubeDescription: string;
  pinnedComment: string;
  voiceText: string;
  hook?: string;
  tensionPoint?: string;
  reveal?: string;
  cta?: string;
};

const ROOT = process.cwd();
const REMOTION_ENTRY = "remotion/index.ts";
const PUBLIC_DIR = path.join(ROOT, "public");

type CopyVariant = Pick<DailyAsset, "tiktokCaption" | "youtubeTitle" | "youtubeDescription" | "pinnedComment" | "voiceText"> & {
  hook: string;
  tensionPoint: string;
  reveal: string;
  cta: string;
};

const COPY_VARIANTS: Record<SearchUgcTone, CopyVariant[]> = {
  almost_overpaid: [
    {
      hook: "I almost paid $400 too much for this card.",
      tensionPoint: "PSA 10 comps looked insane. Ready to buy.",
      reveal: "Then CardSnap showed the PSA 9 reality.",
      cta: "Saved $400. Wish I found this sooner.",
      voiceText: "I almost paid $400 too much for this card. Checked PSA 10 comps. Looked insane. Thumb on buy. Then I ran CardSnap. PSA 9 destroys profit. Grading fees wipe it out. Just saved myself four hundred.",
      tiktokCaption: "Almost overpaid $400.\nOnly checked PSA 10 comps.\nCardSnap showed the real numbers.\n#sportscards #cardcollector #cardsnap",
      youtubeTitle: "I almost overpaid $400—until PSA 9 comps showed up",
      youtubeDescription: "High PSA 10 comp, low buy price. Seemed perfect. CardSnap showed PSA 9 destroyed the margin.",
      pinnedComment: "Close calls are the expensive ones.",
    },
    {
      hook: "This card looked like a $600 flip.",
      tensionPoint: "PSA 10 comp right there. Owner asking low. Perfect.",
      reveal: "CardSnap showed PSA 9 was 30% less.",
      cta: "Would've cost me thousands in mistakes.",
      voiceText: "This card looked like a $600 flip. PSA 10 comp sitting there. Owner asking low. Then I ran CardSnap. PSA 9 was way less. Fees erased the edge. Instant skip. And I felt smart for checking.",
      tiktokCaption: "Looked like the perfect flip.\nPSA 9 changed my mind.\n#sportscards #cardcollector #cardsnap #tradingcards",
      youtubeTitle: "Looked like a perfect flip—PSA 9 ruined it",
      youtubeDescription: "High PSA 10 comp, low buy price seemed perfect. PSA 9 comps at 30% less changed the math completely.",
      pinnedComment: "The 9 is the real test.",
    },
    {
      hook: "Nobody told me PSA 9 destroys profit.",
      tensionPoint: "Been grading for years. Thought I knew the math.",
      reveal: "CardSnap showed I was submitting losing cards.",
      cta: "Collectors need to check this first.",
      voiceText: "Nobody told me PSA 9 destroys profit. Been grading for years. Thought I had it figured. CardSnap ran the numbers. I was submitting cards that barely beat raw at a 9. That's how you bleed money. Changed everything.",
      tiktokCaption: "Collecting for years and didn't realize I was making expensive mistakes.\nCardSnap showed me in seconds.\n#sportscards #psagrading #cardcollector #cardsnap",
      youtubeTitle: "I've been collecting wrong for years",
      youtubeDescription: "Realized PSA 9 scenarios were neutral or losing on half my submissions. Grading fees are real.",
      pinnedComment: "The 9 is where profit goes to die.",
    },
    {
      hook: "I bid $350 on this card. Dodged a bullet.",
      tensionPoint: "Seller had just one PSA 10 comp. Price looked justified.",
      reveal: "CardSnap showed the market was different.",
      cta: "Range matters. Single comps lie.",
      voiceText: "I bid three fifty on this card. Seller showed one PSA 10 comp. Looked solid. Then I ran CardSnap. Raw was ninety. A nine was a hundred eighty. The ten was an outlier. I deleted my bid. Saved three hundred fifty.",
      tiktokCaption: "One comp. Looked perfect.\nCardSnap showed the real range.\nNot even close.\n#sportscards #cardcollector #cardsnap",
      youtubeTitle: "One PSA 10 comp made me almost overpay",
      youtubeDescription: "Seller anchored on a single high comp. CardSnap showed raw and 9 tiers were much lower.",
      pinnedComment: "One outlier is not a market.",
    },
    {
      hook: "The asking price was too good to be true.",
      tensionPoint: "Listed at two hundred. Raw comparable at two twenty.",
      reveal: "CardSnap showed PSA 9 reality: hundred sixty.",
      cta: "Now I know why it seemed cheap.",
      voiceText: "The asking price was too good to be true. Two hundred bucks. I saw raw at two twenty. Looked like a steal waiting to happen. CardSnap showed the nine was a hundred sixty. Grading would kill any profit. I walked. Probably saved myself five hundred in fees and time.",
      tiktokCaption: "Too good to be true usually is.\nCardSnap does the math before you buy.\n#sportscards #cardcollector #cardsnap #grading",
      youtubeTitle: "A bargain price that wasn't actually a bargain",
      youtubeDescription: "Looked like a deal. PSA 9 comps revealed it would barely cover grading costs.",
      pinnedComment: "The 9 finds the truth.",
    },
  ],
  psa9_destroyer: [
    {
      hook: "PSA 9 just destroyed this card's value.",
      tensionPoint: "Looked like an easy submit. Clean. Sharp corners.",
      reveal: "CardSnap showed PSA 9 at $180. Fees kill it.",
      cta: "That's why I check CardSnap first.",
      voiceText: "PSA 9 just destroyed this card's value. Looked like an easy submit. Perfect centering. Clean surface. CardSnap showed the real math. At a 9, the margin disappears. Fees eat everything. Instant skip.",
      tiktokCaption: "This looked perfect until PSA 9 comps showed the truth.\nCardSnap does the math instantly.\n#sportscards #psagrading #cardcollector #cardsnap",
      youtubeTitle: "Looked perfect—until PSA 9 comps ruined it",
      youtubeDescription: "High PSA 10 comp looked amazing. PSA 9 at that price point meant losing money on fees.",
      pinnedComment: "The 9 is the filter.",
    },
    {
      hook: "That's how grading fees disappear.",
      tensionPoint: "Submitted five cards thinking 9 is profitable.",
      reveal: "Got a 9. Barely broke even. Lost on half.",
      cta: "CardSnap would've saved me hundreds.",
      voiceText: "That's how grading fees disappear. You submit five cards. Bet on a 9. One comes back a 9. Fees eat the margin. Suddenly you're neutral. CardSnap forces you to test the 9 scenario first. Before you pay the fee.",
      tiktokCaption: "This is how collectors lose money without realizing it.\nGrading fees plus PSA 9 equals no profit.\n#sportscards #cardgrading #cardcollector #cardsnap",
      youtubeTitle: "How grading fees quietly destroy your profit",
      youtubeDescription: "You think PSA 9 is acceptable. Then fees hit. They eat the margin. CardSnap makes you check before paying.",
      pinnedComment: "Math beats hope.",
    },
    {
      hook: "A PSA 9 destroys the entire flip.",
      tensionPoint: "Bought for eighty raw. 10 comp was four fifty.",
      reveal: "CardSnap showed 9 comps at one twenty.",
      cta: "Fees cost more than the profit margin.",
      voiceText: "A PSA 9 destroys the entire flip. Bought this raw for eighty bucks. The ten comp was four fifty. Looked beautiful. Then I ran CardSnap. Nine was a hundred twenty. Fees were thirty five. I'm paying fifteen to sell it for eighty five. Nope. Back in the raw pile.",
      tiktokCaption: "This was supposed to be my payday.\nPSA 9 comps said otherwise.\n#sportscards #cardcollector #cardsnap #psagrading",
      youtubeTitle: "This flip died the moment I checked PSA 9",
      youtubeDescription: "High PSA 10 comp looked incredible. PSA 9 revealed the grading math doesn't work at that entry price.",
      pinnedComment: "Grading math is brutal.",
    },
    {
      hook: "Grading this is literally losing money.",
      tensionPoint: "Card is solid. Blank slate for a 9. Maybe a 10.",
      reveal: "PSA 9 comps at ninety. Fees are thirty five.",
      cta: "CardSnap showed me before I spent the money.",
      voiceText: "Grading this is literally losing money. Card looks solid. Perfect candidate for a nine. Maybe even a ten if I get lucky. Then I ran CardSnap. Nine comp was ninety bucks. Fees cost thirty five. I'm netting fifty five on a card I bought for seventy. Why would I do that. Stay raw.",
      tiktokCaption: "Some cards shouldn't be graded.\nCardSnap shows you which ones.\n#sportscards #cardcollector #cardsnap #psagrading",
      youtubeTitle: "Some cards are better off staying raw",
      youtubeDescription: "Good card, but PSA 9 comps don't justify the grading cost. CardSnap reveals the math before you submit.",
      pinnedComment: "Not every card deserves grading.",
    },
  ],
  mistake_avoided: [
    {
      hook: "I was literally seconds away from buying this.",
      tensionPoint: "Seller asking $280. Card looked solid. Thumb ready.",
      reveal: "CardSnap showed PSA 9 at $200.",
      cta: "Just saved $60 on one card.",
      voiceText: "I was literally seconds away from buying this. Seller asking $280. Card looked solid. Thumb over buy now. Checked CardSnap. PSA 9 was $200. Raw should be $220 max. Just saved myself sixty bucks.",
      tiktokCaption: "Seconds away from overpaying by $60.\nCardSnap caught it just in time.\n#sportscards #cardcollector #cardsnap #tradingcards",
      youtubeTitle: "Almost overpaid—CardSnap saved me $60",
      youtubeDescription: "About to buy at $280. CardSnap showed realistic PSA 9 comps at $200. Seller was way overpriced.",
      pinnedComment: "Close calls are the expensive ones.",
    },
    {
      hook: "Sports card collectors keep making this mistake.",
      tensionPoint: "See one high comp. Anchor on it. Overpay.",
      reveal: "CardSnap shows three tiers. Completely different.",
      cta: "Run it before you buy. Seriously.",
      voiceText: "Sports card collectors keep making this mistake. See one PSA 10 comp. Anchor on it. Overpay immediately. CardSnap forces you to see raw, 9, and 10. Three different numbers. Suddenly the buy looks stupid.",
      tiktokCaption: "The one comp you saw was the highest.\nCardSnap shows the realistic range.\n#sportscards #cardcollector #cardsnap #collectibles",
      youtubeTitle: "Why high comps destroy collector profit",
      youtubeDescription: "You see the peak comp, ignore the realistic ones, buy too high. CardSnap shows the range instantly.",
      pinnedComment: "Range beats single comps.",
    },
    {
      hook: "The seller showed me ONE comp for a reason.",
      tensionPoint: "That comp made it look like a deal. Nine hundred buck card.",
      reveal: "CardSnap showed three other 10s at six hundred.",
      cta: "He knew exactly which comp to show me.",
      voiceText: "The seller showed me one comp for a reason. That one comp was a perfect match. Nine hundred bucks. Looked incredible. Then I ran CardSnap. Showed three other tens at six hundred. He picked the outlier and hoped I'd bite. I didn't.",
      tiktokCaption: "Sellers are smart about which comp to show you.\nCardSnap shows them all.\n#sportscards #cardcollector #cardsnap #tradingcards",
      youtubeTitle: "The seller showed me the highest comp for a reason",
      youtubeDescription: "One PSA 10 outlier at $900. CardSnap revealed three other 10s at $600. He anchored on the peak.",
      pinnedComment: "They always show you the highest one.",
    },
    {
      hook: "I trusted the listing photos. Big mistake.",
      tensionPoint: "Looked perfect under studio lighting. Great centering.",
      reveal: "CardSnap showed I'd get a 7 raw. Not even a 9.",
      cta: "Props under lights aren't the real card.",
      voiceText: "I trusted the listing photos. Big mistake. Perfect under lights. Great centering. Looked like a buy right now button situation. Then I ran CardSnap. Saw what similar raw cards actually sell for. Seventy dollars. Not the three hundred asking. Photos are a trap.",
      tiktokCaption: "Studio photos lie.\nCardSnap shows the real value.\n#sportscards #cardcollector #cardsnap #collectibles",
      youtubeTitle: "Studio photos made this card look worth three times the price",
      youtubeDescription: "Beautiful listing photos. CardSnap showed the actual raw value was a fraction of the asking price.",
      pinnedComment: "Photos make everything look better.",
    },
  ],
};


function dailyVariantIndex(date: string, poolSize: number): number {
  let h = 0;
  for (let i = 0; i < date.length; i += 1) h = (h * 31 + date.charCodeAt(i)) | 0;
  return Math.abs(h) % poolSize;
}

function getCopyForDate(tone: SearchUgcTone, date: string): CopyVariant {
  const variants = COPY_VARIANTS[tone];
  const index = dailyVariantIndex(date, variants.length);
  return variants[index]!;
}

function renderTargetsForDate(date: string): DailyAsset[] {
  const almostOverpaidCopy = getCopyForDate("almost_overpaid", date);
  const psa9DestroyerCopy = getCopyForDate("psa9_destroyer", date);
  const mistakeAvoidedCopy = getCopyForDate("mistake_avoided", date);

  return [
    {
      title: almostOverpaidCopy.voiceText.split('.')[0],
      composition: "CardSnapSearchUGCPrintLines",
      tone: "almost_overpaid",
      output: `out/cardsnap-ugc-almost-overpaid-${date}.mp4`,
      audio: `audio/daily/${date}/cardsnap-search-ugc-almost-overpaid.mp3`,
      ...almostOverpaidCopy,
    },
    {
      title: psa9DestroyerCopy.voiceText.split('.')[0],
      composition: "CardSnapSearchUGCGradeEstimate",
      tone: "psa9_destroyer",
      output: `out/cardsnap-ugc-psa9-destroyer-${date}.mp4`,
      audio: `audio/daily/${date}/cardsnap-search-ugc-psa9-destroyer.mp3`,
      ...psa9DestroyerCopy,
    },
    {
      title: mistakeAvoidedCopy.voiceText.split('.')[0],
      composition: "CardSnapSearchUGCHockey",
      tone: "mistake_avoided",
      output: `out/cardsnap-ugc-mistake-avoided-${date}.mp4`,
      audio: `audio/daily/${date}/cardsnap-search-ugc-mistake-avoided.mp3`,
      ...mistakeAvoidedCopy,
    },
  ];
}

function parseArgs(): DailyArgs {
  const dateArg = process.argv.find((arg) => arg.startsWith("--date="));
  const date = dateArg?.split("=")[1] ?? new Date().toISOString().slice(0, 10);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error(`Invalid --date value "${date}". Expected YYYY-MM-DD.`);
  }

  return {
    date,
    skipRender: process.argv.includes("--skip-render"),
    verbose: process.argv.includes("--verbose"),
  };
}

function parseCsv(text: string): CsvRow[] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      field += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(field);
      if (row.some((cell) => cell.trim() !== "")) rows.push(row);
      row = [];
      field = "";
      continue;
    }

    field += char;
  }

  row.push(field);
  if (row.some((cell) => cell.trim() !== "")) rows.push(row);

  const [headers, ...records] = rows;
  if (!headers) return [];

  return records.map((record) =>
    Object.fromEntries(headers.map((header, index) => [header.trim(), (record[index] ?? "").trim()])),
  );
}

function run(command: string, args: string[], verbose: boolean) {
  const output = execFileSync(command, args, {
    cwd: ROOT,
    stdio: verbose ? "inherit" : "pipe",
    encoding: "utf8",
    env: process.env,
  });

  if (verbose && output) process.stdout.write(output);
}

function getTopOpportunities(date: string): CsvRow[] {
  const csvPath = path.join(ROOT, "data", "growth", `cardsnap-growth-intel-${date}.csv`);
  if (!existsSync(csvPath)) return [];

  return parseCsv(readFileSync(csvPath, "utf8")).slice(0, 5);
}

function assertDistinctAssets(assets: DailyAsset[]) {
  const videoOutputs = new Set(assets.map((asset) => asset.output));
  const audioOutputs = new Set(assets.map((asset) => asset.audio));
  const scripts = new Set(assets.map((asset) => asset.voiceText));

  if (videoOutputs.size !== assets.length) throw new Error("Daily UGC video outputs must be unique.");
  if (audioOutputs.size !== assets.length) throw new Error("Daily UGC voiceover outputs must be unique.");
  if (scripts.size !== assets.length) throw new Error("Daily UGC voice scripts must be unique.");
}

function buildApprovalDoc(date: string, opportunities: CsvRow[], assets: DailyAsset[]): string {
  const outputLines = assets
    .map((target, index) => `${index + 1}. **${target.title}**\n   - Video: \`${target.output}\``)
    .join("\n");

  const signalLines = opportunities.length
    ? opportunities
        .map(
          (row, index) =>
            `${index + 1}. **${row.opportunity}** (${row.priority}, score ${row.score})\n   - UGC angle: ${row.ugc_angle}\n   - Signal: ${row.source_signal}`,
        )
        .join("\n")
    : "No growth intel rows were found for today. The batch used the standing CardSnap search-based UGC set.";

  return `# CardSnap Daily UGC Approval Pack - ${date}

Generated by \`npm run ugc:daily\`.

## Videos Ready For Review

${outputLines}

## Keyword/Search Signals Used

${signalLines}

## Posting Copy

Use the TikTok, Instagram, and YouTube Shorts copy from \`docs/growth/ugc-daily-pack-${date}.md\`.

## Approval Checklist

- Confirm the hook is clear in the first 2 seconds.
- Confirm the video does not claim camera scanning or live comps.
- Confirm each CTA points to CardSnap as a grading ROI/value checker.
- Approve, request edits, or post to TikTok/Instagram.
`;
}

function buildCopyPack(date: string, assets: DailyAsset[]): string {
  const manifestRows = assets
    .map(
      (asset, index) =>
        `| ${index + 1} | ${asset.tone} | \`${asset.composition}\` | \`${asset.output}\` | \`${asset.audio}\` |`,
    )
    .join("\n");

  const captionBlocks = assets
    .map(
      (asset, index) => `### Video ${index + 1} - ${asset.title}

**TikTok caption:**
${asset.tiktokCaption}

**YouTube Shorts title:**
${asset.youtubeTitle}

**YouTube Shorts description:**
${asset.youtubeDescription}

**Pinned comment:**
${asset.pinnedComment}`,
    )
    .join("\n\n");

  const scriptBlocks = assets
    .map((asset, index) => `### Video ${index + 1} - ${asset.title}\n\n${asset.voiceText}`)
    .join("\n\n");

  return `# CardSnap Daily UGC Copy Pack - ${date}

Generated by \`npm run ugc:daily\`.

## Artifact Manifest

| # | Tone | Composition | Video | Voiceover |
|---|---|---|---|---|
${manifestRows}

## Ready-To-Post Captions

${captionBlocks}

## Voiceover Scripts

${scriptBlocks}
`;
}

function getObsidianAdsDir(): string | null {
  const home = process.env.HOME;
  if (!home) return null;
  return path.join(home, "ObsidianVault", "cardsnap", "ads");
}

async function synthesizeVoiceovers(assets: DailyAsset[], verbose: boolean) {
  process.stderr.write("[step] voiceovers (OpenAI)\n");
  const key = process.env.OPENAI_API_KEY;
  if (!key?.trim()) throw new Error("OPENAI_API_KEY is not set; cannot synthesize daily UGC voiceovers.");

  for (const asset of assets) {
    const outPath = path.join(PUBLIC_DIR, asset.audio);
    mkdirSync(path.dirname(outPath), { recursive: true });
    if (verbose) process.stderr.write(`[voice] ${asset.tone}: ${asset.voiceText.slice(0, 80)}...\n`);

    const res = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "tts-1-hd",
        voice: "nova",
        input: asset.voiceText,
        response_format: "mp3",
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenAI TTS HTTP ${res.status}: ${errText.slice(0, 280)}`);
    }

    writeFileSync(outPath, Buffer.from(await res.arrayBuffer()));
    if (verbose) process.stderr.write(`[voice] openai -> ${outPath}\n`);
  }
}

async function main() {
  const args = parseArgs();
  const assets = renderTargetsForDate(args.date);
  assertDistinctAssets(assets);

  mkdirSync(path.join(ROOT, "out"), { recursive: true });
  mkdirSync(path.join(ROOT, "docs", "growth"), { recursive: true });

  run("npx", ["tsx", "scripts/growth-intel.ts", `--date=${args.date}`], args.verbose);

  await synthesizeVoiceovers(assets, args.verbose);

  if (!args.skipRender) {
    for (const target of assets) {
      const props = JSON.stringify({ tone: target.tone, audioSrc: target.audio });
      run(
        "npx",
        [
          "remotion",
          "render",
          REMOTION_ENTRY,
          target.composition,
          target.output,
          "--overwrite",
          "--props",
          props,
          "--gl=swiftshader",
          "--chromium-flags=--no-sandbox",
        ],
        args.verbose,
      );
    }
  }

  const opportunities = getTopOpportunities(args.date);
  const approvalDoc = buildApprovalDoc(args.date, opportunities, assets);
  const copyPack = buildCopyPack(args.date, assets);
  const approvalPath = path.join(ROOT, "docs", "growth", `daily-ugc-approval-${args.date}.md`);
  const copyPackPath = path.join(ROOT, "docs", "growth", `ugc-daily-pack-${args.date}.md`);
  writeFileSync(approvalPath, approvalDoc);
  writeFileSync(copyPackPath, copyPack);

  const obsidianAdsDir = getObsidianAdsDir();
  const obsidianApprovalPath = obsidianAdsDir
    ? path.join(obsidianAdsDir, `daily-ugc-approval-${args.date}.md`)
    : null;

  if (obsidianAdsDir && obsidianApprovalPath) {
    mkdirSync(obsidianAdsDir, { recursive: true });
    writeFileSync(obsidianApprovalPath, approvalDoc);
    writeFileSync(path.join(obsidianAdsDir, `ugc-daily-pack-${args.date}.md`), copyPack);
  }

  const topOpportunity = opportunities[0]?.opportunity ?? "standing CardSnap grading ROI batch";
  console.log(
    [
      `CardSnap UGC approval pack ready: 3 TikTok/Instagram videos for ${args.date}.`,
      `Top signal: ${topOpportunity}.`,
      `Full report: ${obsidianApprovalPath ?? approvalPath}`,
      `Posting copy: ${copyPackPath}`,
      `Voice MP3s: ${assets.map((asset) => path.join(PUBLIC_DIR, asset.audio)).join("\n")}`,
      `Videos:\n${assets.map((asset) => path.join(ROOT, asset.output)).join("\n")}`,
    ].join("\n"),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
