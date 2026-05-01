import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

type CsvRow = Record<string, string>;

type TargetCluster = {
  keyword: string;
  cluster: string;
  preferredPath: string;
  assetType: "new_page" | "refresh" | "internal_links" | "ugc";
  why: string;
  nextAction: string;
  ugcAngle: string;
};

type Opportunity = {
  priority: "P0" | "P1" | "P2";
  opportunity: string;
  cluster: string;
  currentUrl: string;
  recommendedAsset: string;
  routeStatus: string;
  sourceSignal: string;
  nextAction: string;
  ugcAngle: string;
  score: number;
};

const ROOT = process.cwd();
const SITE = "https://getcardsnap.com";

const TARGETS: TargetCluster[] = [
  {
    keyword: "pokemon card grading calculator",
    cluster: "pokemon_grading_roi",
    preferredPath: "/pokemon-card-grading-calculator",
    assetType: "new_page",
    why: "Strong Pokemon collector intent, direct grading-fee anxiety, and a clean funnel into Analyze Card.",
    nextAction: "Create a focused Pokemon grading calculator page if GSC shows Pokemon grading impressions or if Pokemon pages begin indexing.",
    ugcAngle: "I almost graded this Pokemon card before checking the PSA 9 math.",
  },
  {
    keyword: "baseball card value checker",
    cluster: "sports_card_value_lookup",
    preferredPath: "/baseball-card-value-checker",
    assetType: "new_page",
    why: "Sport-specific value checker queries are easier to own than generic sports card value terms.",
    nextAction: "Create a baseball value checker page once /sports-card-value-checker has impressions or after the next card-page crawl push.",
    ugcAngle: "This baseball card looked valuable until I checked raw vs graded value.",
  },
  {
    keyword: "basketball card value checker",
    cluster: "sports_card_value_lookup",
    preferredPath: "/basketball-card-value-checker",
    assetType: "new_page",
    why: "Basketball has the strongest existing card inventory and natural PSA 9 vs PSA 10 examples.",
    nextAction: "Create a basketball value checker page using existing Luka, Wembanyama, Jordan, LeBron, and Ant examples.",
    ugcAngle: "PSA 10 comps made this basketball card look better than it was.",
  },
  {
    keyword: "football card value checker",
    cluster: "sports_card_value_lookup",
    preferredPath: "/football-card-value-checker",
    assetType: "new_page",
    why: "Football gives CardSnap another sport-specific entry point without changing product behavior.",
    nextAction: "Create a football value checker page after verifying enough football examples exist in card data.",
    ugcAngle: "I checked the fee before sending a football card that needed a 10.",
  },
  {
    keyword: "sports card grading calculator",
    cluster: "grading_roi_calculator",
    preferredPath: "/psa-grading-calculator",
    assetType: "refresh",
    why: "Calculator intent is closest to conversion and already maps to CardSnap's core math.",
    nextAction: "Refresh calculator copy and internal links before building a duplicate calculator route.",
    ugcAngle: "The grading fee ate the whole upside.",
  },
  {
    keyword: "sports card price tracker",
    cluster: "price_tracking",
    preferredPath: "/sports-card-value-checker",
    assetType: "refresh",
    why: "Price tracker language supports the intelligence-layer direction while staying honest about current estimated comps.",
    nextAction: "Add careful price-history/tracker copy only where it does not imply live alerts or account tracking.",
    ugcAngle: "Card prices moved before I even decided whether to grade.",
  },
  {
    keyword: "sports card collection tracker",
    cluster: "collection_tracking",
    preferredPath: "/watchlist",
    assetType: "refresh",
    why: "Collection tracker intent can capture email/waitlist demand without building a full portfolio product yet.",
    nextAction: "Position the watchlist as optional tracking for cards worth checking again.",
    ugcAngle: "I stopped guessing which cards were worth checking again.",
  },
  {
    keyword: "sports card price history",
    cluster: "price_history",
    preferredPath: "/sports-card-value-checker",
    assetType: "internal_links",
    why: "Price history terms are adjacent to value lookup and can feed analyzer usage.",
    nextAction: "Use internal links from card pages to value checker and calculator pages.",
    ugcAngle: "One old comp almost made me waste a grading fee.",
  },
  {
    keyword: "psa card value lookup",
    cluster: "psa_value_lookup",
    preferredPath: "/sports-card-value-checker",
    assetType: "refresh",
    why: "This is a high-intent umbrella phrase for raw, PSA 9, and PSA 10 comparisons.",
    nextAction: "Make sure the value checker page says PSA card value lookup and links to PSA 9 vs PSA 10.",
    ugcAngle: "I stopped looking at only the PSA 10 number.",
  },
  {
    keyword: "should i grade my card",
    cluster: "grading_decision",
    preferredPath: "/",
    assetType: "refresh",
    why: "This is the core CardSnap job-to-be-done and should remain the homepage's strongest phrase.",
    nextAction: "Watch GSC CTR; refresh homepage/FAQ only if impressions grow with weak CTR.",
    ugcAngle: "I was about to send this card in blind.",
  },
];

function parseArgs(): { date: string } {
  const dateArg = process.argv.find((arg) => arg.startsWith("--date="));
  const date = dateArg?.split("=")[1] ?? new Date().toISOString().slice(0, 10);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error(`Invalid --date value "${date}". Expected YYYY-MM-DD.`);
  }

  return { date };
}

function csvEscape(value: string | number): string {
  const text = String(value);
  if (!/[",\n]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
}

function parseCsv(text: string): CsvRow[] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      field += '"';
      i += 1;
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
      if (char === "\r" && next === "\n") i += 1;
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
    Object.fromEntries(headers.map((header, index) => [header.trim(), (record[index] ?? "").trim()]))
  );
}

function readCsvIfExists(filePath: string): CsvRow[] {
  if (!existsSync(filePath)) return [];
  return parseCsv(readFileSync(filePath, "utf8"));
}

function walkFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];

  const entries = readdirSync(dir);
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) return walkFiles(fullPath);
    return fullPath;
  });
}

function routeFromPage(filePath: string): string {
  const relative = path.relative(path.join(ROOT, "app"), filePath).replace(/\\/g, "/");
  const route = relative.replace(/\/page\.tsx$/, "").replace(/^page\.tsx$/, "");
  return route ? `/${route}` : "/";
}

function getExistingRoutes(): Set<string> {
  const pages = walkFiles(path.join(ROOT, "app")).filter((file) => file.endsWith("page.tsx"));
  return new Set(pages.map(routeFromPage));
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function toNumber(value: string | undefined): number {
  if (!value) return 0;
  const parsed = Number(value.replace("%", ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function getGscRows(): CsvRow[] {
  const growthDir = path.join(ROOT, "data", "growth");
  const rows = [
    ...readCsvIfExists(path.join(growthDir, "gsc-keyword-watch-template.csv")),
    ...readdirSync(growthDir)
      .filter((file) => file.includes("gsc") && file.endsWith(".csv") && file !== "gsc-keyword-watch-template.csv")
      .flatMap((file) => readCsvIfExists(path.join(growthDir, file))),
  ];

  return rows.filter((row) => row.query || row.Query || row.keyword || row.Keyword);
}

function sourceSignalFor(keyword: string, rows: CsvRow[]): { signal: string; scoreBoost: number } {
  const key = normalize(keyword);
  const matches = rows.filter((row) => {
    const query = normalize(row.query ?? row.Query ?? row.keyword ?? row.Keyword ?? "");
    return query.includes(key) || key.includes(query);
  });

  if (matches.length === 0) {
    return { signal: "Seed keyword from CardSnap target wedge; no matching GSC row yet.", scoreBoost: 0 };
  }

  const impressions = matches.reduce((sum, row) => sum + toNumber(row.impressions ?? row.Impressions), 0);
  const clicks = matches.reduce((sum, row) => sum + toNumber(row.clicks ?? row.Clicks), 0);
  const bestPosition = Math.min(
    ...matches.map((row) => toNumber(row.position ?? row.Position)).filter((value) => value > 0),
    Number.POSITIVE_INFINITY
  );
  const positionText = Number.isFinite(bestPosition) ? `best position ${bestPosition.toFixed(1)}` : "position not available";

  return {
    signal: `Matched ${matches.length} GSC/watch row(s): ${impressions} impressions, ${clicks} clicks, ${positionText}.`,
    scoreBoost: impressions > 0 ? 20 : 8,
  };
}

function pageTextForRoute(route: string): string {
  if (route === "/") {
    const homePage = path.join(ROOT, "app", "page.tsx");
    const homeClient = path.join(ROOT, "components", "HomePageClient.tsx");
    return [homePage, homeClient]
      .filter((file) => existsSync(file))
      .map((file) => readFileSync(file, "utf8"))
      .join("\n");
  }

  const pagePath = path.join(ROOT, "app", route.slice(1), "page.tsx");
  return existsSync(pagePath) ? readFileSync(pagePath, "utf8") : "";
}

function mentionsKeyword(route: string, keyword: string): boolean {
  return normalize(pageTextForRoute(route)).includes(normalize(keyword));
}

function buildOpportunities(routes: Set<string>, gscRows: CsvRow[]): Opportunity[] {
  return TARGETS.map((target) => {
    const exactRouteExists = routes.has(target.preferredPath);
    const dynamicRouteExists = Array.from(routes).some((route) => {
      const pattern = route.replace(/\[slug\]/g, "[^/]+");
      return new RegExp(`^${pattern}$`).test(target.preferredPath);
    });
    const routeExists = exactRouteExists || dynamicRouteExists;
    const keywordPresent = routeExists && mentionsKeyword(target.preferredPath, target.keyword);
    const { signal, scoreBoost } = sourceSignalFor(target.keyword, gscRows);
    const missingRouteBoost = routeExists ? 0 : 18;
    const missingCopyBoost = routeExists && !keywordPresent ? 12 : 0;
    const conversionBoost = ["grading_decision", "grading_roi_calculator", "pokemon_grading_roi"].includes(target.cluster)
      ? 18
      : 10;
    const score = 50 + scoreBoost + missingRouteBoost + missingCopyBoost + conversionBoost;

    let priority: Opportunity["priority"] = "P2";
    if (score >= 82) priority = "P0";
    else if (score >= 70) priority = "P1";

    const routeStatus = routeExists
      ? keywordPresent
        ? "Existing route covers exact keyword"
        : "Existing route, copy gap"
      : "Missing exact-fit route";

    const recommendedAsset =
      target.assetType === "new_page"
        ? `Create ${target.preferredPath}`
        : target.assetType === "refresh"
          ? `Refresh ${target.preferredPath}`
          : target.assetType === "internal_links"
            ? `Add internal links into ${target.preferredPath}`
            : "Create UGC script";

    return {
      priority,
      opportunity: target.keyword,
      cluster: target.cluster,
      currentUrl: routeExists ? `${SITE}${target.preferredPath}` : "",
      recommendedAsset,
      routeStatus,
      sourceSignal: signal,
      nextAction: target.nextAction,
      ugcAngle: target.ugcAngle,
      score,
    };
  }).sort((a, b) => b.score - a.score || a.opportunity.localeCompare(b.opportunity));
}

function toCsv(opportunities: Opportunity[]): string {
  const headers = [
    "priority",
    "opportunity",
    "cluster",
    "current_url",
    "recommended_asset",
    "route_status",
    "source_signal",
    "next_action",
    "ugc_angle",
    "score",
  ];

  const lines = opportunities.map((opp) =>
    [
      opp.priority,
      opp.opportunity,
      opp.cluster,
      opp.currentUrl,
      opp.recommendedAsset,
      opp.routeStatus,
      opp.sourceSignal,
      opp.nextAction,
      opp.ugcAngle,
      opp.score,
    ].map(csvEscape).join(",")
  );

  return `${headers.join(",")}\n${lines.join("\n")}\n`;
}

function buildMarkdown(date: string, routes: Set<string>, rows: CsvRow[], opportunities: Opportunity[]): string {
  const top = opportunities.slice(0, 5);
  const missing = opportunities.filter((opp) => opp.routeStatus === "Missing exact-fit route");
  const copyGaps = opportunities.filter((opp) => opp.routeStatus === "Existing route, copy gap");

  return `# CardSnap Growth Intel Board — ${date}

Generated by \`npm run growth:intel\`.

## Inputs Used

- Local CardSnap route inventory from \`app/**/page.tsx\`.
- GSC/watch rows from \`data/growth/gsc-keyword-watch-template.csv\` and any \`data/growth/*gsc*.csv\` exports.
- Current high-intent CardSnap wedges: value lookup, grading ROI, price tracker, collection tracker, price history, and sport-specific price checkers.
- No Ahrefs subscription or paid keyword API required.

## Snapshot

- Existing app routes found: ${routes.size}.
- GSC/watch rows read: ${rows.length}.
- Exact-fit missing route ideas: ${missing.length}.
- Existing routes with likely copy gaps: ${copyGaps.length}.

## Top Opportunities

${top.map((opp, index) => `${index + 1}. **${opp.opportunity}** (${opp.priority}, score ${opp.score})
   - Asset: ${opp.recommendedAsset}
   - Status: ${opp.routeStatus}
   - Why: ${opp.sourceSignal}
   - Next: ${opp.nextAction}
   - UGC angle: ${opp.ugcAngle}`).join("\n\n")}

## Recommended Build Queue

### Ship Next

${top.slice(0, 3).map((opp) => `- ${opp.recommendedAsset}: ${opp.opportunity}`).join("\n")}

### Watch In GSC

${opportunities.slice(0, 8).map((opp) => `- ${opp.opportunity} -> ${opp.currentUrl || `${SITE}${opp.recommendedAsset.replace("Create ", "")}`}`).join("\n")}

## How To Use This

1. Export fresh GSC query/page data as CSV when available.
2. Drop it into \`data/growth/\` with \`gsc\` in the filename.
3. Run \`npm run growth:intel\`.
4. Build only the top one or two opportunities that match real impressions, ranking movement, or a clear conversion gap.

## Guardrails

- Keep CardSnap focused on value lookup, grading ROI, and price-tracking intent.
- Do not imply live price alerts unless live tracking exists.
- Do not say “scan” unless the feature actually uses photo upload.
- Prefer exact-fit SEO/tool pages that push users into Analyze Card.
`;
}

function main(): void {
  const { date } = parseArgs();
  const routes = getExistingRoutes();
  const rows = getGscRows();
  const opportunities = buildOpportunities(routes, rows);

  const docsDir = path.join(ROOT, "docs", "growth");
  const dataDir = path.join(ROOT, "data", "growth");
  mkdirSync(docsDir, { recursive: true });
  mkdirSync(dataDir, { recursive: true });

  const mdPath = path.join(docsDir, `cardsnap-growth-intel-${date}.md`);
  const csvPath = path.join(dataDir, `cardsnap-growth-intel-${date}.csv`);

  writeFileSync(mdPath, buildMarkdown(date, routes, rows, opportunities));
  writeFileSync(csvPath, toCsv(opportunities));

  console.log(`Wrote ${path.relative(ROOT, mdPath)}`);
  console.log(`Wrote ${path.relative(ROOT, csvPath)}`);
  console.log(`Top opportunity: ${opportunities[0]?.opportunity ?? "none"}`);
}

main();
