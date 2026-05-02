import { GENERATED_NICHE_CONTENT } from "./generated-niche-content";
// Niche-specific content for grade-or-skip pages
export interface NicheContent {
  sport: string;
  category: string;
  seoTitle: string;
  seoDescription: string;
  h1: string;
  subtitle: string;
  gradingLogic: string[];
  keyCharacteristics: {
    title: string;
    desc: string;
  }[];
  roiExamples: {
    cardName: string;
    rawValue: number;
    psa9Value: number;
    psa10Value: number;
    gradingCost: number;
    psa9Roi: number;
    psa10Roi: number;
    verdict: string;
    reason: string;
  }[];
  whenToGrade: string[];
  skipGrading: string[];
  marketInsight: string;
}

export const nicheContentMap: Record<string, NicheContent> = {
  baseball: {
    sport: "Baseball",
    category: "baseball",
    seoTitle: "Baseball Card Grading ROI Guide — When to Grade | CardSnap",
    seoDescription:
      "Should you grade that baseball card? See ROI by era: vintage cards, rookie cards, and key collectibles. Grade or skip logic.",
    h1: "Should You Grade Your Baseball Card?",
    subtitle:
      "Vintage cards, rookie cards, and key collectibles—know when grading pays off and when to skip.",
    gradingLogic: [
      "Vintage (pre-1980): Grade almost always. Condition is critical—a PSA 7 can be worth 5× the raw value.",
      "Rookie cards (1980–2010): Grade if NM+ condition. PSA 9+ commands strong ROI.",
      "Modern (2010+): Only grade gem-mint cards targeting specific thresholds.",
      "Key cards (HOF debuts, milestones, errors): Always worth grading—demand justifies the cost.",
      "Commons: Skip. PSA 10 commons rarely exceed $50 after fees.",
    ],
    keyCharacteristics: [
      {
        title: "Centering",
        desc: "Crucial for baseball. Off-center cards drop 1–2 grades instantly.",
      },
      {
        title: "Corner wear",
        desc: "Most common issue. Sharp corners = PSA 8+. Rounded = PSA 6–7.",
      },
      {
        title: "Surface quality",
        desc: "Print spots, stains, creases = automatic downgrade. Look closely before submitting.",
      },
      {
        title: "Back condition",
        desc: "Often overlooked. Graders check it—poor back = lower grade.",
      },
    ],
    roiExamples: [
      {
        cardName: "1952 Topps Mickey Mantle",
        rawValue: 2000,
        psa9Value: 8500,
        psa10Value: 25000,
        gradingCost: 200,
        psa9Roi: 6300,
        psa10Roi: 22800,
        verdict: "strong",
        reason: "Iconic vintage. PSA grading essential for value and authenticity.",
      },
      {
        cardName: "1989 Ken Griffey Jr. Rookie",
        rawValue: 400,
        psa9Value: 2500,
        psa10Value: 6000,
        gradingCost: 50,
        psa9Roi: 2050,
        psa10Roi: 5550,
        verdict: "strong",
        reason: "High-demand rookie. Strong ROI even at PSA 9. Grade if NM condition.",
      },
      {
        cardName: "2020 Luis Robert Rookie",
        rawValue: 30,
        psa9Value: 150,
        psa10Value: 300,
        gradingCost: 15,
        psa9Roi: 105,
        psa10Roi: 255,
        verdict: "moderate",
        reason: "Modern rookie. Only grade if gem mint or you have capital locked in.",
      },
      {
        cardName: "2021 Common Modern Card",
        rawValue: 2,
        psa9Value: 8,
        psa10Value: 15,
        gradingCost: 15,
        psa9Roi: -9,
        psa10Roi: -2,
        verdict: "skip",
        reason: "Grading cost exceeds potential gain. Keep raw or bulk sell.",
      },
    ],
    whenToGrade: [
      "Vintage cards from the 1950s–1970s (condition-sensitive market)",
      "Hall of Famer rookies and key cards",
      "Cards in PSA 8+ condition with no visible flaws",
      "Cards worth $200+ raw (justifies grading cost)",
      "Error cards or limited print variations (rarity premium)",
    ],
    skipGrading: [
      "Modern commons or bulk lots",
      "Cards with visible wear, creases, or stains",
      "Damaged back or off-center cards (will grade low)",
      "Raw value under $50 (break-even is difficult)",
      "Cards where PSA 7–8 is the likely outcome (diminishing ROI)",
    ],
    marketInsight:
      "The baseball card market is heavily weighted toward vintage and iconic rookies. Graded PSA 8+ vintage cards are investment-grade and rarely sell below comp prices. Modern baseball rookies have exploded in demand—grade the best ones. Commons, however, have zero grading premium.",
  },

  basketball: {
    sport: "Basketball",
    category: "basketball",
    seoTitle: "Basketball Card Grading ROI Guide — When to Grade | CardSnap",
    seoDescription:
      "Should you grade that basketball card? See ROI for MJ, LeBron, Luka rookies and modern hits. Grade or skip decision guide.",
    h1: "Should You Grade Your Basketball Card?",
    subtitle:
      "Superstar rookies, vintage legends, and modern hits—know when grading is worth it.",
    gradingLogic: [
      "Vintage (pre-1990): Grade almost always. PSA 8+ commands serious premiums.",
      "Superstar rookies (MJ, LeBron, Luka): Grade if NM+. Market demand justifies costs.",
      "Role player rookies: Skip unless PSA 9 is likely and player is trending.",
      "Modern singles (2015+): Only grade high-end rookies or signed cards.",
      "Parallels & inserts: Grade if rare or high-demand. Commons stay raw.",
    ],
    keyCharacteristics: [
      {
        title: "Image clarity",
        desc: "Photo quality varies by year. Blurry or off-focus images affect grade.",
      },
      {
        title: "Print defects",
        desc: "Rough edges, ink spots, misalignments are common in basketball cards.",
      },
      {
        title: "Gloss & surface",
        desc: "High-gloss modern cards show wear easily. Matte vintage cards hide flaws better.",
      },
      {
        title: "Autographs (if present)",
        desc: "Signature placement and pen type matter. Bad sig = lower grade despite condition.",
      },
    ],
    roiExamples: [
      {
        cardName: "1986 Fleer Michael Jordan Rookie",
        rawValue: 1500,
        psa9Value: 7000,
        psa10Value: 20000,
        gradingCost: 100,
        psa9Roi: 5400,
        psa10Roi: 18400,
        verdict: "strong",
        reason: "The GOAT rookie. PSA grading is non-negotiable for investment-grade copies.",
      },
      {
        cardName: "2003 LeBron James Rookie (Topps)",
        rawValue: 600,
        psa9Value: 3500,
        psa10Value: 8000,
        gradingCost: 75,
        psa9Roi: 2825,
        psa10Roi: 7325,
        verdict: "strong",
        reason: "Iconic modern rookie. Strong demand ensures PSA 9+ holds value.",
      },
      {
        cardName: "2018 Luka Doncic Rookie Prizm",
        rawValue: 200,
        psa9Value: 800,
        psa10Value: 2000,
        gradingCost: 50,
        psa9Roi: 550,
        psa10Roi: 1750,
        verdict: "moderate",
        reason: "Popular but market saturation is real. Grade only if gem condition and you believe in Luka.",
      },
      {
        cardName: "2022 Role Player Rookie",
        rawValue: 5,
        psa9Value: 20,
        psa10Value: 35,
        gradingCost: 15,
        psa9Roi: 0,
        psa10Roi: 5,
        verdict: "skip",
        reason: "Grading cost kills margins. Only grade if player becomes a star (risky bet).",
      },
    ],
    whenToGrade: [
      "Superstar rookies (MJ, LeBron, Kobe, KD, Luka) in NM condition",
      "Vintage (pre-1990) cards in any playable condition",
      "Limited edition parallels or low-numbered inserts",
      "Autographed cards with clear, desirable signatures",
      "Cards worth $300+ raw (justify grading cost)",
    ],
    skipGrading: [
      "Role player or bench rookie cards",
      "Modern bulk pack hits from unknown players",
      "Cards with visible crease, stain, or corner wear",
      "Off-center or misprint cards (will grade low)",
      "Raw value under $100 (break-even margin too small)",
    ],
    marketInsight:
      "Basketball is the hottest sports card market. Superstar rookies and vintage legends command graded premiums. However, saturation is real—thousands of modern rookies are graded annually, crushing individual player value. Grade the icons, skip the rest.",
  },

  pokemon: {
    sport: "Pokémon",
    category: "pokemon",
    seoTitle: "Pokémon Card Grading ROI Guide — When to Grade | CardSnap",
    seoDescription:
      "Should you grade that Pokémon card? See ROI for Base Set holos, Charizards, and modern VMAX. Holo grading strategy.",
    h1: "Should You Grade Your Pokémon Card?",
    subtitle:
      "Base Set holos, Charizards, and modern VMAX cards—understand when grading pays off.",
    gradingLogic: [
      "Base Set & 1st Edition (1999): Grade almost always. Holos jump 3–10× in value.",
      "Shadowless (pre-release): Always grade. Ultra-premium market.",
      "Vintage holos (2000–2010): Grade if NM+. Strong ROI.",
      "Modern ex, V, VMAX (2015+): Only grade mint or ultra-rare pulls.",
      "Non-holos: Skip. PSA 10 non-holos rarely exceed $15.",
    ],
    keyCharacteristics: [
      {
        title: "Holo pattern",
        desc: "Crucial for vintage. Damaged holo = instant downgrade. Look for scratches, wear, or delamination.",
      },
      {
        title: "Centering",
        desc: "Pokémon cards are notoriously off-center. Perfect centering is rare and valuable.",
      },
      {
        title: "Text clarity",
        desc: "Print quality varies by year. Fuzzy text or ink bleeding = lower grade.",
      },
      {
        title: "Edge quality",
        desc: "Worn edges are common. Sharp edges = PSA 8+. Rounded = PSA 5–6.",
      },
    ],
    roiExamples: [
      {
        cardName: "1999 Base Set Charizard Holo 1st Edition",
        rawValue: 800,
        psa9Value: 4500,
        psa10Value: 12000,
        gradingCost: 100,
        psa9Roi: 3600,
        psa10Roi: 11100,
        verdict: "strong",
        reason: "The most iconic Pokémon card ever. Grading is essential for authenticity and value.",
      },
      {
        cardName: "1999 Base Set Blastoise Holo Unlimited",
        rawValue: 150,
        psa9Value: 650,
        psa10Value: 1500,
        gradingCost: 50,
        psa9Roi: 450,
        psa10Roi: 1300,
        verdict: "strong",
        reason: "Iconic holo from coveted Base Set. Strong ROI even for non-1st editions.",
      },
      {
        cardName: "2020 Pikachu VMAX Secret Rare",
        rawValue: 80,
        psa9Value: 250,
        psa10Value: 500,
        gradingCost: 30,
        psa9Roi: 140,
        psa10Roi: 390,
        verdict: "moderate",
        reason: "Modern ultra-rare pull. Grade if mint. Modern market is volatile—be careful.",
      },
      {
        cardName: "2021 Common V Card",
        rawValue: 2,
        psa9Value: 8,
        psa10Value: 15,
        gradingCost: 15,
        psa9Roi: -9,
        psa10Roi: -2,
        verdict: "skip",
        reason: "Non-holo modern card. Grading cost far exceeds potential value.",
      },
    ],
    whenToGrade: [
      "Base Set holos, especially 1st Edition or Shadowless",
      "Iconic cards (Charizard, Blastoise, Venusaur) in any condition",
      "Vintage holos (1999–2005) with minimal wear",
      "Ultra-rare modern pulls (Secret Rares, alternative art) if mint",
      "Cards worth $200+ raw",
    ],
    skipGrading: [
      "Non-holo cards (no premium even at PSA 10)",
      "Damaged holos or holo bleed/delamination",
      "Common or uncommon cards from any era",
      "Modern modern bulk or commons",
      "Cards with creases, stains, or obvious play wear",
    ],
    marketInsight:
      "Pokémon is booming but volatile. Base Set holos are investment-grade—grade them without hesitation. Modern ultra-rares can spike fast, but saturation kills most pulls. The holo pattern is key: damaged holo = waste of grading cost. Stick to iconic cards and vintage sets.",
  },
  "would-these-print-lines-ruin-the-chances-of-a-psa-10": {
    sport: "Print Lines",
    category: "condition",
    seoTitle: "Would Print Lines Ruin a PSA 10? | CardSnap",
    seoDescription:
      "Print lines can ruin the chances of a PSA 10. Check how surface lines affect grading ROI before you pay PSA fees.",
    h1: "Would Print Lines Ruin the Chances of a PSA 10?",
    subtitle:
      "Surface flaws are one of the fastest ways a promising card turns from a PSA 10 chase into a PSA 9 or lower result.",
    gradingLogic: [
      "Visible print lines usually hurt PSA 10 odds because graders inspect surface quality closely.",
      "Chrome, Prizm, Select, Optic, and modern Pokemon holos show print lines more clearly under light.",
      "If the card only makes money at PSA 10, obvious print lines can turn the submission into a bad grading bet.",
      "Compare raw value against PSA 9 first, then treat PSA 10 as upside.",
    ],
    keyCharacteristics: [
      {
        title: "Surface lines",
        desc: "Tilt the card under direct light. Horizontal or vertical factory lines can cap the grade.",
      },
      {
        title: "Holo scratches",
        desc: "Pokemon and chrome cards often hide scratches until angled under light.",
      },
      {
        title: "PSA 9 downside",
        desc: "A card with surface issues should still make sense if it lands at PSA 9.",
      },
      {
        title: "Raw value floor",
        desc: "If raw comps are strong, selling raw can be cleaner than chasing a risky 10.",
      },
    ],
    roiExamples: [
      {
        cardName: "Modern Prizm Rookie With Print Lines",
        rawValue: 80,
        psa9Value: 110,
        psa10Value: 350,
        gradingCost: 25,
        psa9Roi: 5,
        psa10Roi: 245,
        verdict: "skip",
        reason: "The math only gets exciting at PSA 10, and print lines make that outcome less likely.",
      },
      {
        cardName: "Vintage Holo With Light Surface Wear",
        rawValue: 180,
        psa9Value: 420,
        psa10Value: 1200,
        gradingCost: 35,
        psa9Roi: 205,
        psa10Roi: 985,
        verdict: "moderate",
        reason: "There is still room at PSA 9, but surface condition should be checked carefully.",
      },
    ],
    whenToGrade: [
      "The print line is faint and only visible under harsh angle lighting",
      "PSA 9 still beats raw value plus fees",
      "The card is scarce, vintage, numbered, or highly demanded",
      "You are grading for authentication as much as gem upside",
    ],
    skipGrading: [
      "The print line is obvious in normal light",
      "The card only profits at PSA 10",
      "There are multiple surface flaws, scratches, or roller marks",
      "Raw value is already near the PSA 9 market price",
    ],
    marketInsight:
      "Collectors often focus on corners and centering, but surface quality is where many PSA 10 hopes die. Print lines do not automatically make a card worthless, but they can destroy the gem-mint premium that makes grading worth the fee.",
  },
  "grade-estimate": {
    sport: "Grade Estimate",
    category: "condition",
    seoTitle: "Grade Estimate for Sports Cards | CardSnap",
    seoDescription:
      "Need a card grade estimate? Check raw value, PSA 9, PSA 10, fees, and ROI before deciding whether to grade.",
    h1: "Grade Estimate: Should You Submit the Card?",
    subtitle:
      "A quick grade estimate is useful, but the real question is whether the card still makes money if it misses PSA 10.",
    gradingLogic: [
      "Start with the likely grade range, not the best-case grade.",
      "Use PSA 9 as the downside case for modern cards.",
      "Subtract grading fees and shipping before calling a card profitable.",
      "Only chase PSA 10 when raw value and PSA 9 value give you enough margin.",
    ],
    keyCharacteristics: [
      {
        title: "Centering",
        desc: "Poor centering can keep a clean card from gemming.",
      },
      {
        title: "Corners",
        desc: "White tips or soft corners are often visible before submission.",
      },
      {
        title: "Surface",
        desc: "Scratches, dimples, and print lines can turn a 10 candidate into a 9.",
      },
      {
        title: "Edges",
        desc: "Chipping and rough edges matter, especially on dark borders.",
      },
    ],
    roiExamples: [
      {
        cardName: "Modern Rookie Estimate: PSA 9 or PSA 10",
        rawValue: 45,
        psa9Value: 55,
        psa10Value: 160,
        gradingCost: 25,
        psa9Roi: -15,
        psa10Roi: 90,
        verdict: "skip",
        reason: "If PSA 9 loses money, submitting only makes sense when you are very confident it gems.",
      },
      {
        cardName: "Vintage Star Estimate: PSA 7 to PSA 8",
        rawValue: 120,
        psa9Value: 280,
        psa10Value: 600,
        gradingCost: 35,
        psa9Roi: 125,
        psa10Roi: 445,
        verdict: "strong",
        reason: "The card has enough graded premium that even a realistic grade can justify the fee.",
      },
    ],
    whenToGrade: [
      "The likely grade still beats raw value plus grading fees",
      "The card is a star rookie, vintage card, numbered parallel, or key Pokemon holo",
      "You need authentication to help the card sell",
      "Recent comps show real demand for PSA 9, not only PSA 10",
    ],
    skipGrading: [
      "The card only works financially at PSA 10",
      "Surface flaws are visible without magnification",
      "Raw value is too low to absorb grading fees",
      "The player/card has weak demand in graded condition",
    ],
    marketInsight:
      "Grade estimates help, but ROI matters more. A card can look clean and still be a bad submission if the PSA 9 market is too close to raw value after fees.",
  },
  ...GENERATED_NICHE_CONTENT
};

export function getNicheContent(category: string): NicheContent {
  return nicheContentMap[category];
}

export function getCategoryPath(category: string): string {
  return `/grade-or-skip/${category}`;
}

export function getAllCategories(): string[] {
  return Object.keys(nicheContentMap);
}
