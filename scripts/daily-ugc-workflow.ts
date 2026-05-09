import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

type CsvRow = Record<string, string>;
type SearchUgcTone = "printLines" | "gradeEstimate" | "hockey";

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
};

const ROOT = process.cwd();
const REMOTION_ENTRY = "remotion/index.ts";
const PUBLIC_DIR = path.join(ROOT, "public");

type CopyVariant = Pick<DailyAsset, "tiktokCaption" | "youtubeTitle" | "youtubeDescription" | "pinnedComment" | "voiceText">;

const COPY_VARIANTS: Record<SearchUgcTone, CopyVariant[]> = {
  printLines: [
    {
      tiktokCaption:
        "Stop grading cards off PSA 10 screenshots.\nPSA 9 decides the risk. Run CardSnap before you submit.\n#psagrading #sportscards #tradingcards #cardcollector #cardsnap",
      youtubeTitle: "Stop grading cards off PSA 10 screenshots",
      youtubeDescription:
        "PSA 9 decides the risk. Run CardSnap before you submit. Run the downside before you pay the fee.",
      pinnedComment: "That is how grading fees disappear.",
      voiceText:
        "Stop grading cards off PSA 10 screenshots. That is how grading fees disappear. The real decision is not: can it hit a 10? It is: does this still work at PSA 9? Raw value is the floor. PSA 10 is not the whole story. CardSnap compares raw, PSA 9, PSA 10, and fees. One view. One grade-or-skip verdict. If the math only works at a perfect 10, that is not a grading plan. Skipping a bad submission is still a win. You kept the grading fee in your pocket. Run the downside before you pay the fee. CardSnap. Grade smarter.",
    },
    {
      tiktokCaption:
        "Raw value is the foundation. PSA 9 is the real question.\nCheck the downside math before grading.\n#psagrading #sportscards #tradingcards #cardcollector #cardsnap",
      youtubeTitle: "Raw value is the foundation, PSA 9 is the real question",
      youtubeDescription:
        "Check the downside math before grading. CardSnap breaks down raw vs PSA 9 vs PSA 10 instantly.",
      pinnedComment: "Raw looked solid at a 9.",
      voiceText:
        "Raw value is the foundation. PSA 9 is the real question. Because if PSA 9 does not beat raw, the fee makes no sense. CardSnap is built on this math. Three tiers. Three outcomes. Raw. The floor. PSA 9. The bet. PSA 10. The hope. Most cards live in the middle. And fees are real. That is why the grade-or-skip call comes first. Before the submission. Before the label. Before the cost. Check the downside math before you send it in. CardSnap. One grade, one verdict.",
    },
    {
      tiktokCaption:
        "Pretty card. Expensive grading. Worth the risk?\nRun the numbers on raw, PSA 9, and PSA 10 first.\n#psagrading #sportscards #tradingcards #cardcollector #cardsnap",
      youtubeTitle: "Pretty card, expensive grading—worth the risk",
      youtubeDescription:
        "Run the ROI on raw, PSA 9, and PSA 10 before submitting. CardSnap does the math for you.",
      pinnedComment: "Visual appeal is not math.",
      voiceText:
        "Pretty card. Expensive grading. Worth the risk? That is the whole question. A beautiful card in hand might be worth less than a 9 in a slab. Or it might not. CardSnap shows you the three scenarios instantly. Raw. Slabbed at 9. Slabbed at 10. Then the fees. Then the real outcome. No guessing from one comp listing. No prayers for a 10. Just the math. Some pretty cards skip grading completely because the math works better raw. That is a win. You avoided the cost. You kept the gain. Run the scenario before you submit. CardSnap. The ROI tool.",
    },
    {
      tiktokCaption:
        "Perfect 10 submissions are cost-center bets.\nRun the PSA 9 outcome first.\n#psagrading #sportscards #tradingcards #cardcollector #cardsnap",
      youtubeTitle: "Perfect 10 submissions are cost-center bets—test PSA 9 first",
      youtubeDescription:
        "Before betting on a 10, see what a 9 nets. CardSnap shows raw vs 9 vs 10 ROI instantly.",
      pinnedComment: "PSA 9 is the realistic play.",
      voiceText:
        "Perfect 10 submissions are cost-center bets. Expensive. Risky. Unlikely. So before you commit to that bet, run the PSA 9 scenario. What if it comes back a 9? Do you still break even? Does the card stay valuable? CardSnap builds that check into the workflow. Raw value. PSA 9 expectation. PSA 10 dream. Then fees. Then decision. Most cards make sense to grade at a 9. Some do not. And finding out costs nothing. Run the realistic scenario before the hopeful one. That is grade-or-skip thinking. CardSnap. The smart grading tool.",
    },
    {
      tiktokCaption:
        "Screenshots of PSA 10s are not a grading strategy.\nTest the real downside math.\n#psagrading #sportscards #tradingcards #cardcollector #cardsnap",
      youtubeTitle: "Screenshots of PSA 10s aren't a strategy",
      youtubeDescription:
        "Test actual downside math before grading. CardSnap: raw vs 9 vs 10, all fees included.",
      pinnedComment: "Comps do not predict outcomes.",
      voiceText:
        "Screenshots of PSA 10s are not a grading strategy. They are hope. Real strategy is: what if this card comes back a 9? Or even an 8? That downside matters. That is where fees eat your profit. CardSnap does not let you skip that part. Every submission starts with the worst-case math. Raw value stays. PSA 9 becomes the real benchmark. PSA 10 is upside only if the math still works. No prayers. No comps-based guessing. Just the numbers. Grade the cards that work at a 9. Skip the rest. That is how you avoid grading-fee creep. CardSnap. Real ROI math.",
    },
  ],
  gradeEstimate: [
    {
      tiktokCaption:
        "I thought this card was a lock until I added fees.\nRaw, PSA 9, PSA 10, and net outcome. CardSnap.\n#psagrading #sportscards #tradingcards #cardcollector #cardsnap",
      youtubeTitle: "I thought this card was a lock until I added fees",
      youtubeDescription: "Raw, PSA 9, PSA 10, and net outcome. CardSnap. Run the fee-check before you submit.",
      pinnedComment: "Raw looked fine. PSA 10 looked amazing.",
      voiceText:
        "I thought this card was a lock until I added fees. Raw looked fine. PSA 10 looked amazing. Then grading and shipping showed up. The upside got thin fast. PSA 9 plus fees changed the whole play. A good-looking submit became risky. CardSnap breaks out raw, PSA 9, PSA 10, and net. No guessing from one comp. Sometimes the smartest grading move is not grading. This is why the fee-check comes first. Before the label. Before the invoice. Run the fee-check before you submit. CardSnap. Raw vs graded, fast.",
    },
    {
      tiktokCaption:
        "This card looked bulletproof until fees hit.\nCardSnap: raw, PSA 9, PSA 10, and net cash.\n#psagrading #sportscards #tradingcards #cardcollector #cardsnap",
      youtubeTitle: "Bulletproof card—until fees hit",
      youtubeDescription:
        "Grading fees are real costs. See raw vs PSA 9 vs PSA 10 net profit instantly with CardSnap.",
      pinnedComment: "Fees are not optional.",
      voiceText:
        "This card looked bulletproof until fees hit. Strong raw value. PSA 10 comp was huge. But grading is not free. Shipping is not free. And sometimes PSA 9 is the result, not 10. So the upside shrinks fast. CardSnap forces you to do this math before you submit. Not after. Raw value is the safety net. PSA 9 is the realistic win. PSA 10 is the bonus. And fees come out of all three. Only PSA 9 scenarios that still beat raw are worth the submission. That is grade-or-skip logic. CardSnap. Fee-first thinking.",
    },
    {
      tiktokCaption:
        "Huge comp, tiny net after fees? That is why the estimate matters.\nRaw vs PSA 9 vs PSA 10 net.\n#psagrading #sportscards #tradingcards #cardcollector #cardsnap",
      youtubeTitle: "Huge comp, tiny net after fees",
      youtubeDescription:
        "Comps are gross values. Grading fees and shipping eat most of the edge. CardSnap shows net profit.",
      pinnedComment: "Net matters, not comps.",
      voiceText:
        "Huge comp, tiny net after fees. That is the problem with shopping for comp comparables and forgetting the costs. A card that looks worth $500 as a PSA 10 might net $50 after grading and shipping and fees. Is it worth submitting for a $50 upside? Not usually. CardSnap shows this in seconds. Raw value. PSA 9 net outcome. PSA 10 net outcome. All three after all costs. You see the edge instantly. And you decide before you pay. Not after. That is how you avoid expensive mistakes. CardSnap. Net-first ROI.",
    },
    {
      tiktokCaption:
        "The PSA 10 comp was amazing. Then I did the math.\nCardSnap: see the net first.\n#psagrading #sportscards #tradingcards #cardcollector #cardsnap",
      youtubeTitle: "The PSA 10 comp was amazing—then I did the math",
      youtubeDescription:
        "High comps mean nothing without profit math. CardSnap shows raw, PSA 9, PSA 10 net outcomes instantly.",
      pinnedComment: "Math beats hope.",
      voiceText:
        "The PSA 10 comp was amazing. Then I did the math. Subtract grading. Subtract shipping. Subtract time. The edge was gone. CardSnap is built to catch this before you submit. Three tiers. Three real outcomes. Raw value. PSA 9 with fees. PSA 10 with fees. If none of those beat where you are now, you skip. If PSA 9 barely breaks even, you think twice. Only if PSA 9 still wins big do you actually grade. That is how the best graders think. CardSnap makes it automatic. Run the math before the submission. CardSnap. No surprises.",
    },
    {
      tiktokCaption:
        "One comp told the story. Three tiers told the truth.\nCardSnap: raw, 9, 10, and net.\n#psagrading #sportscards #tradingcards #cardcollector #cardsnap",
      youtubeTitle: "One comp told the story—three tiers told the truth",
      youtubeDescription:
        "Single comps are incomplete. CardSnap shows raw, PSA 9, PSA 10, and real net profit per tier.",
      pinnedComment: "Range thinking beats single comps.",
      voiceText:
        "One comp told the story. Three tiers told the truth. The single PSA 10 listing looked amazing. But PSA 9 comps were 30% lower. And raw value was solid anyway. Suddenly the grading call was different. Maybe skip grading. Maybe just sell raw. CardSnap runs all three scenarios and shows the net outcome for each. Because one comp is not a decision. It is hope. Three tiers show reality. Raw is safe. Nine is likely. Ten is optimistic. See all three. Then decide. CardSnap. Real grading tool.",
    },
  ],
  hockey: [
    {
      tiktokCaption:
        "This baseball card looked expensive until I checked raw value.\nCompare raw, PSA 9, and PSA 10 before grading.\n#psagrading #sportscards #tradingcards #cardcollector #cardsnap",
      youtubeTitle: "This baseball card looked expensive until I checked raw value",
      youtubeDescription:
        "Compare raw, PSA 9, and PSA 10 before grading. Before you send a baseball card in, run raw vs PSA 9 vs PSA 10.",
      pinnedComment: "The PSA 10 comp is the headline. PSA 9 is the decision.",
      voiceText:
        "This baseball card looked expensive until I checked raw value. The PSA 10 comp looked huge. But PSA 9 told a different story. If PSA 9 barely beats raw, the fee can wipe out the edge. CardSnap turns comps into value tiers. Raw. PSA 9. PSA 10. That is the grade-or-skip verdict. Not the best-case fantasy. Before you send a baseball card in, run raw vs PSA 9 vs PSA 10.",
    },
    {
      tiktokCaption:
        "Vintage baseball card raw value was more than PSA 9 net.\nCardSnap: sometimes raw wins.\n#psagrading #sportscards #tradingcards #cardcollector #cardsnap",
      youtubeTitle: "Vintage baseball card—sometimes raw wins over slabbed",
      youtubeDescription:
        "Check if raw value beats PSA 9 net profit. For many vintage cards, it does. CardSnap shows the call.",
      pinnedComment: "Raw is not always the backup plan.",
      voiceText:
        "Vintage baseball card raw value was more than PSA 9 net. That means do not grade. The card is worth more staying raw than it is slabbed at a nine with fees factored in. This is a win. CardSnap catches this instantly. Most collectors assume slabbed is always better. It is not. Raw value plus no shipping cost plus no fee sometimes beats PSA 9 profit by a lot. And it definitely beats PSA 10 hopes that never land. For vintage cards especially, run the raw math first. If raw wins, you are done. CardSnap. Raw ROI clarity.",
    },
    {
      tiktokCaption:
        "Beautiful baseball rookie. Insane PSA 10 comp. Then I checked the PSA 9 scenario.\nCardSnap.\n#psagrading #sportscards #tradingcards #cardcollector #cardsnap",
      youtubeTitle: "Beautiful rookie—insane comp, realistic 9 scenario",
      youtubeDescription:
        "One comp is not a grading decision. CardSnap shows raw, PSA 9, and PSA 10 outcomes with fees included.",
      pinnedComment: "Comps are not certainties.",
      voiceText:
        "Beautiful baseball rookie. Insane PSA 10 comp. Then I checked the PSA 9 scenario. The card might grade a 9, not a 10. PSA 9 value was half the comp. After fees, it barely beat raw. So why grade at all? CardSnap makes this comparison instant. One comp is hope. Three tiers are reality. Raw is the floor. PSA 9 is the likely outcome if you actually submit. PSA 10 is the dream. Only grade if PSA 9 justifies the cost and risk. Most beautiful rookies fail that test. CardSnap. Realistic grading.",
    },
    {
      tiktokCaption:
        "This 1990s baseball card raw value was stronger than I thought.\nCardSnap: see all three tiers before you submit.\n#psagrading #sportscards #tradingcards #cardcollector #cardsnap",
      youtubeTitle: "1990s baseball card—raw value stronger than I thought",
      youtubeDescription:
        "1990s cards often grade soft. Check if raw beats PSA 9 net before you submit. CardSnap does this instantly.",
      pinnedComment: "1990s cards surprise you.",
      voiceText:
        "This 1990s baseball card raw value was stronger than I thought. Card looked like a good grading candidate. Centering was solid. Corners were okay. But raw comps for that set were actually high. And PSA 9 for 1990s cards can be unpredictable. So PSA 9 net ended up not beating the raw ask price. Meaning no grading edge. Meaning skip it. CardSnap shows this in one view. Raw value. PSA 9 math. PSA 10 hope. For cards from the 1990s, this check is critical. The market is weird. Raw sometimes wins. Grade only when nine justifies the cost. CardSnap. 1990s card clarity.",
    },
    {
      tiktokCaption:
        "Strong PSA 9 comp. Stronger raw value. So no grading needed.\nCardSnap: all three tiers, instant answer.\n#psagrading #sportscards #tradingcards #cardcollector #cardsnap",
      youtubeTitle: "Strong PSA 9 comp—stronger raw value, so no grading",
      youtubeDescription:
        "Sometimes raw value beats PSA 9 profit. CardSnap shows when to grade and when to skip instantly.",
      pinnedComment: "Skip can be the right call.",
      voiceText:
        "Strong PSA 9 comp. Stronger raw value. So no grading needed. That is the decision CardSnap forces you to make upfront. Many cards do not pencil out. The grading cost is real. The shipping is real. The time is real. And the grade is not guaranteed. So if your raw value is already strong, staying raw is the math that wins. CardSnap shows all three scenarios. When raw wins, you see it first. You do not have to find out after paying and waiting. Grade only when PSA 9 or better still beats raw profit-wise. CardSnap. Smart skip logic.",
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
  const printLinesCopy = getCopyForDate("printLines", date);
  const gradeEstimateCopy = getCopyForDate("gradeEstimate", date);
  const hockeyCopy = getCopyForDate("hockey", date);

  return [
    {
      title: "Should I grade my card?",
      composition: "CardSnapSearchUGCPrintLines",
      tone: "printLines",
      output: `out/cardsnap-ugc-should-i-grade-${date}.mp4`,
      audio: `audio/daily/${date}/cardsnap-search-ugc-printLines.mp3`,
      ...printLinesCopy,
    },
    {
      title: "Grading fee ate the upside",
      composition: "CardSnapSearchUGCGradeEstimate",
      tone: "gradeEstimate",
      output: `out/cardsnap-ugc-fee-trap-${date}.mp4`,
      audio: `audio/daily/${date}/cardsnap-search-ugc-gradeEstimate.mp3`,
      ...gradeEstimateCopy,
    },
    {
      title: "Baseball raw vs graded",
      composition: "CardSnapSearchUGCHockey",
      tone: "hockey",
      output: `out/cardsnap-ugc-baseball-value-${date}.mp4`,
      audio: `audio/daily/${date}/cardsnap-search-ugc-hockey.mp3`,
      ...hockeyCopy,
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
