import type { GeneratedBlogPost } from "@/lib/generated-blog";
import { cardPages, type CardPage } from "@/lib/cards";
import {
  estimateAllInGradingCost,
  netVsRawMid,
  tier1Path,
  TIER1_SEO_PAGES,
} from "@/lib/tier1-seo";

const FILLER_PREFIXES = [
  "the ultimate guide to ",
  "ultimate guide to ",
  "complete guide to ",
  "a complete guide to ",
];

export type ShouldIGradeCardRecord = {
  slug: string;
  cardName: string;
  year: number;
  set: string;
  cardNumber: string;
  sport: CardPage["sport"];
  rawValueLow: number;
  rawValueHigh: number;
  psa9Value: number;
  psa10Value: number;
  gradingFeeEstimate: number;
  expectedRoiPsa9: number;
  expectedRoiPsa10: number;
  verdict: "Grade" | "Skip";
  explanation: string;
  path: string;
};

function normalizeText(value: string): string {
  let text = value.toLowerCase().trim();
  text = text.replace(/\b(19|20)\d{2}\b/g, "");
  text = text.replace(
    /\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/g,
    ""
  );
  text = text.replace(/[^a-z0-9\s]/g, " ");
  text = text.replace(/\s+/g, " ").trim();
  for (const prefix of FILLER_PREFIXES) {
    if (text.startsWith(prefix)) {
      text = text.slice(prefix.length).trim();
    }
  }
  return text;
}

export function slugBase(slug: string): string {
  return slug.replace(/-\d{4}-\d{2}-\d{2}$/, "");
}

export function normalizeBlogTitle(title: string): string {
  return normalizeText(title);
}

export function topicKeyFromPost(post: GeneratedBlogPost): string {
  if (post.topicKey) {
    return normalizeText(post.topicKey).replace(/\s+/g, "-");
  }
  const fromTitle = normalizeBlogTitle(post.title);
  if (fromTitle) {
    return fromTitle.replace(/\s+/g, "-");
  }
  return slugBase(post.slug);
}

function hasRealMarketData(card: CardPage): boolean {
  return (
    card.rawValueLow > 0 &&
    card.rawValueHigh > 0 &&
    card.psa9Value > 0 &&
    card.psa10Value > 0 &&
    card.rawValueHigh >= card.rawValueLow
  );
}

export function getShouldIGradeCardRecords(): ShouldIGradeCardRecord[] {
  const slugs = new Set(
    TIER1_SEO_PAGES.filter((e) => e.template === "should_grade").map(
      (e) => e.cardSlug
    )
  );

  return cardPages
    .filter((c) => slugs.has(c.slug) && hasRealMarketData(c))
    .map((card) => {
      const { total } = estimateAllInGradingCost(card);
      const worth = card.gradingVerdict === "worth_grading";
      return {
        slug: card.slug,
        cardName: card.title,
        year: card.year,
        set: card.setName,
        cardNumber: card.cardNumber,
        sport: card.sport,
        rawValueLow: card.rawValueLow,
        rawValueHigh: card.rawValueHigh,
        psa9Value: card.psa9Value,
        psa10Value: card.psa10Value,
        gradingFeeEstimate: total,
        expectedRoiPsa9: netVsRawMid(card, card.psa9Value),
        expectedRoiPsa10: netVsRawMid(card, card.psa10Value),
        verdict: worth ? ("Grade" as const) : ("Skip" as const),
        explanation: worth
          ? `PSA 9 net vs raw mid is often positive after ~$${total} all-in fees when condition supports gem potential.`
          : `After ~$${total} in fees, typical raw copies often fail to clear enough upside at PSA 9 unless condition is exceptional.`,
        path: tier1Path("should_grade", card.slug),
      };
    });
}

export function findRelatedShouldIGradeCards(
  post: GeneratedBlogPost,
  limit = 2
): ShouldIGradeCardRecord[] {
  const hay = normalizeBlogTitle(
    `${post.title} ${post.keywords.join(" ")} ${post.description}`
  );
  const sportHints: Record<string, string[]> = {
    baseball: ["baseball", "rookie", "topps", "bowman"],
    basketball: ["basketball", "prizm", "nba", "rookie"],
    football: ["football", "panini", "nfl"],
    pokemon: ["pokemon", "charizard", "tcg"],
  };

  return getShouldIGradeCardRecords()
    .map((card) => {
      let score = 0;
      if (hay.includes("rookie") && card.cardName.toLowerCase().includes("rookie"))
        score += 2;
      if (hay.includes("grade") || hay.includes("grading")) score += 1;
      for (const [sport, hints] of Object.entries(sportHints)) {
        if (card.sport === sport && hints.some((h) => hay.includes(h))) score += 2;
      }
      return { card, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.card);
}

export function dedupePostsForIndex(
  posts: GeneratedBlogPost[]
): GeneratedBlogPost[] {
  const best = new Map<string, GeneratedBlogPost>();
  const order: string[] = [];

  for (const post of posts) {
    const key = topicKeyFromPost(post);
    if (!best.has(key)) order.push(key);
    const prev = best.get(key);
    if (
      !prev ||
      new Date(post.publishedAt).getTime() >
        new Date(prev.publishedAt).getTime()
    ) {
      best.set(key, post);
    }
  }

  return order
    .map((k) => best.get(k)!)
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
}

export function formatBlogPublishDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

function relatedBlogPosts(
  post: GeneratedBlogPost,
  allPosts: GeneratedBlogPost[],
  limit = 3
): GeneratedBlogPost[] {
  const curKey = topicKeyFromPost(post);
  const curWords = new Set(curKey.split("-").filter(Boolean));

  return allPosts
    .filter((p) => p.slug !== post.slug)
    .map((p) => {
      const words = new Set(topicKeyFromPost(p).split("-").filter(Boolean));
      let overlap = 0;
      for (const w of Array.from(curWords)) {
        if (words.has(w)) overlap += 1;
      }
      return { p, overlap };
    })
    .sort(
      (a, b) =>
        b.overlap - a.overlap ||
        new Date(b.p.publishedAt).getTime() -
          new Date(a.p.publishedAt).getTime()
    )
    .slice(0, limit)
    .map((x) => x.p);
}

export function buildEnhancedInternalLinks(
  post: GeneratedBlogPost,
  allPosts: GeneratedBlogPost[]
): { text: string; url: string }[] {
  const seen = new Set<string>();
  const links: { text: string; url: string }[] = [];

  const push = (text: string, url: string) => {
    if (seen.has(url)) return;
    seen.add(url);
    links.push({ text, url });
  };

  push("PSA grading calculator", "/psa-grading-calculator");
  push("Scan your card free", "/");

  for (const link of post.internalLinks ?? []) {
    push(link.text, link.url);
  }

  for (const rel of relatedBlogPosts(post, allPosts, 3)) {
    push(rel.title, `/blog/${rel.slug}`);
  }

  for (const card of findRelatedShouldIGradeCards(post, 2)) {
    push(`Should I grade ${card.cardName}?`, card.path);
  }

  return links.slice(0, 8);
}

export function findDuplicateBlogIssues(posts: GeneratedBlogPost[]): {
  duplicateTitles: { title: string; slugs: string[] }[];
  duplicateSlugs: string[];
  duplicateTopicKeys: { topicKey: string; slugs: string[] }[];
} {
  const byTitle = new Map<string, string[]>();
  const byTopic = new Map<string, string[]>();
  const slugCounts = new Map<string, number>();

  for (const post of posts) {
    const nt = normalizeBlogTitle(post.title);
    byTitle.set(nt, [...(byTitle.get(nt) ?? []), post.slug]);
    const tk = topicKeyFromPost(post);
    byTopic.set(tk, [...(byTopic.get(tk) ?? []), post.slug]);
    slugCounts.set(post.slug, (slugCounts.get(post.slug) ?? 0) + 1);
  }

  return {
    duplicateTitles: Array.from(byTitle.entries())
      .filter(([, slugs]) => slugs.length > 1)
      .map(([title, slugs]) => ({ title, slugs })),
    duplicateSlugs: Array.from(slugCounts.entries())
      .filter(([, n]) => n > 1)
      .map(([slug]) => slug),
    duplicateTopicKeys: Array.from(byTopic.entries())
      .filter(([, slugs]) => {
        const bases = new Set(slugs.map(slugBase));
        return slugs.length > 1 && bases.size === 1;
      })
      .map(([topicKey, slugs]) => ({ topicKey, slugs })),
  };
}
