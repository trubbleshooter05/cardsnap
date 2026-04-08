/**
 * SEO Engine — Shared TypeScript Types
 * All generators, reviewers, and distro modules import from here.
 */

// ─── Opportunity ──────────────────────────────────────────────────────────────

export type SiteId = "snapbrand" | "cardsnap" | "movieslike" | "fursbliss";

export type SearchIntent =
  | "informational"
  | "navigational"
  | "transactional"
  | "commercial_investigation";

export type PageType =
  | "tool_lander"       // /logo-generator/[type] — converts directly
  | "comparison"        // X vs Y, alternatives to X
  | "guide"             // how to, what is, best
  | "glossary"          // definition, terminology
  | "hub"               // topic hub linking to cluster pages
  | "programmatic"      // auto-generated from data (movies-like, cards)
  | "calculator"        // psa-grading-calculator style
  | "grade_or_skip";    // CardSnap niche guide

export type PublishStatus =
  | "idea"
  | "in_review"
  | "approved"
  | "published"
  | "rejected";

export type DistributionStatus =
  | "not_started"
  | "social_drafted"
  | "social_posted"
  | "backlink_queued"
  | "backlink_live";

export interface Opportunity {
  id: string;                        // e.g. "snapbrand-yoga-studio-logo"
  site: SiteId;
  category: string;                  // e.g. "logo-generator", "grade-or-skip", "breed"
  keyword: string;                   // primary target keyword
  secondary_keywords: string[];
  search_intent: SearchIntent;
  page_type: PageType;
  url_path: string;                  // e.g. "/logo-generator/yoga-studio"
  priority_score: number;            // 1–10, 10 = highest
  estimated_monthly_searches: number | null;
  source: OpportunitySource;
  publish_status: PublishStatus;
  distribution_status: DistributionStatus;
  created_at: string;                // ISO 8601
  notes: string;
  safe_to_automate: boolean;         // false = requires human review before publish
}

export type OpportunitySource =
  | "gsc_gap"             // keyword appears in GSC but no page
  | "concept_list"        // from curated concepts JSON
  | "competitor_audit"    // manually identified from competitor
  | "backlog_import"      // from existing backlog files
  | "keyword_research"    // from tool-based research
  | "forum_signal";       // from Reddit/forum public read

// ─── Concept ─────────────────────────────────────────────────────────────────

export interface SnapBrandConcept {
  slug: string;               // e.g. "yoga-studio"
  label: string;              // e.g. "Yoga Studio"
  keyword: string;            // e.g. "yoga studio logo generator"
  monthly_searches_est: number | null;
  related_slugs: string[];
  priority: number;           // 1–5
  status: "pending" | "generated" | "approved" | "live";
}

export interface CardSnapConcept {
  type: "grade_or_skip" | "card_entry";
  slug: string;               // e.g. "football" or "patrick-mahomes-2017-national-treasures-value"
  sport?: string;
  keyword: string;
  priority: number;
  status: "pending" | "generated" | "approved" | "live";
}

export interface FursBlissConcept {
  type: "breed" | "symptom" | "supplement" | "glossary" | "blog";
  slug: string;
  title: string;
  keyword: string;
  cluster: string;            // e.g. "longevity", "nutrition", "breeds", "symptoms"
  requires_medical_review: boolean;
  priority: number;
  status: "pending" | "generated" | "approved" | "live";
}

// ─── Generated Page Objects ───────────────────────────────────────────────────

/** Output of SnapBrand generator — maps directly into BUSINESS_TYPE_CONFIG */
export interface GeneratedSnapBrandEntry {
  slug: string;
  label: string;
  keyword: string;
  seoTitle: string;
  seoDescription: string;
  description: string;
  benefits: Array<{ icon: string; title: string; desc: string }>;
  faqItems: Array<{ q: string; a: string }>;
  relatedTypes: Array<{ slug: string; label: string }>;
  ctaFormSubmit?: string;
  ctaBottom?: string;
  ctaSectionBlurb?: string;
  schema_jsonld: Record<string, unknown>;  // SoftwareApplication + FAQPage schema
  _meta: {
    generated_at: string;
    source: string;
    review_status: "pending" | "approved" | "rejected";
  };
}

/** Output of CardSnap generator for new grade-or-skip categories */
export interface GeneratedNicheContent {
  slug: string;
  sport: string;
  category: string;
  seoTitle: string;
  seoDescription: string;
  h1: string;
  subtitle: string;
  gradingLogic: string[];
  keyCharacteristics: Array<{ title: string; desc: string }>;
  roiExamples: CardROIExample[];
  whenToGrade: string[];
  skipGrading: string[];
  marketInsight: string;
  schema_jsonld: Record<string, unknown>;
  _meta: {
    generated_at: string;
    source: string;
    review_status: "pending" | "approved" | "rejected";
  };
}

export interface CardROIExample {
  cardName: string;
  rawValue: number;
  psa9Value: number;
  psa10Value: number;
  gradingCost: number;
  psa9Roi: number;
  psa10Roi: number;
  verdict: "strong" | "moderate" | "skip";
  reason: string;
}

/** Output of FursBliss generator for glossary/cluster pages */
export interface GeneratedFursBlissPage {
  slug: string;
  type: "breed" | "symptom" | "supplement" | "glossary" | "blog";
  cluster: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  canonical: string;
  h1: string;
  summary: string;
  sections: Array<{
    heading: string;
    content: string;
  }>;
  internal_links: Array<{ text: string; url: string }>;
  schema_jsonld: Record<string, unknown>;
  disclaimer?: string;             // required for medical content
  _meta: {
    generated_at: string;
    source: string;
    review_status: "pending" | "approved" | "rejected";
    requires_vet_review: boolean;
  };
}

// ─── Distribution ─────────────────────────────────────────────────────────────

export interface SocialDraft {
  site: SiteId;
  page_url: string;
  platform: "tiktok" | "instagram_reels" | "youtube_shorts";
  hook: string;                     // first 3 seconds
  script: string[];                 // shot-by-shot or line-by-line
  caption: string;
  hashtags: string[];
  cta: string;
  generated_at: string;
  status: "draft" | "approved" | "posted";
}

export interface BacklinkTarget {
  site: SiteId;
  target_url: string;              // our page to link to
  submission_url: string;          // where to submit
  platform: string;                // e.g. "Product Hunt"
  category: string;
  priority: "high" | "medium" | "low";
  status: "not_started" | "submitted" | "live" | "rejected";
  submitted_at?: string;
  live_link?: string;
  domain_rating?: number;
  notes: string;
}

export interface RedditDraft {
  status: "draft_only";
  subreddit: string;
  title: string;
  body: string;
  site: SiteId;
  url: string;
  notes: string;
  _blocked_reason: "No Reddit API approval. Manual post only.";
}

// ─── Validation ───────────────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface SafetyCheckResult {
  safe: boolean;
  flags: string[];
  requires_disclaimer: boolean;
  disclaimer_text?: string;
}
