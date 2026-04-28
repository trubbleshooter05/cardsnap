export type VideoScriptStep = {
  time: string;
  voiceover: string;
  screen: string;
};

export type AcquisitionAsset = {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  cardName: string;
  hook: string;
  description: string;
  steps: VideoScriptStep[];
  shotList: string[];
  tags: string[];
  relatedCardSlug?: string;
};

export const ACQUISITION_ASSETS: AcquisitionAsset[] = [
  {
    slug: "ken-griffey-jr-rookie-card-value-short",
    title: "Ken Griffey Jr Rookie Card Value Short",
    metaTitle: "Ken Griffey Jr Rookie Card Value Short Script | CardSnap",
    metaDescription:
      "A ready-to-film short video script for checking a 1989 Upper Deck Ken Griffey Jr rookie card with CardSnap.",
    cardName: "1989 Upper Deck Ken Griffey Jr RC #1",
    hook: "Ken Griffey Jr rookie card?",
    description:
      "Use this short as a repeatable acquisition asset: show the card, enter the details, pick condition, and end on the grade-or-sell decision.",
    steps: [
      {
        time: "0-3s",
        voiceover: "Ken Griffey Jr rookie card?",
        screen: "Ken Griffey Jr rookie card?",
      },
      {
        time: "3-8s",
        voiceover: "What's it really worth?",
        screen: "What's it really worth?",
      },
      {
        time: "8-15s",
        voiceover: "Open CardSnap and type the card name.",
        screen: "Search: 1989 Upper Deck Ken Griffey Jr RC #1",
      },
      {
        time: "15-25s",
        voiceover: "Pick condition, then compare raw value against PSA upside.",
        screen: "Condition: Excellent -> Scan",
      },
      {
        time: "25-35s",
        voiceover: "CardSnap gives you a grade-or-sell verdict in seconds.",
        screen: "Verdict: Grade, sell raw, or watch",
      },
    ],
    shotList: [
      "Close-up of the Griffey rookie card",
      "Phone screen recording of the CardSnap search",
      "Condition selection",
      "Result screen with value range and verdict",
      "End card pointing to getcardsnap.com",
    ],
    tags: ["#KenGriffeyJr", "#RookieCard", "#SportsCards", "#CardCollector", "#CardSnap"],
  },
];

export function getAcquisitionAsset(slug: string): AcquisitionAsset | undefined {
  return ACQUISITION_ASSETS.find((asset) => asset.slug === slug);
}

export function getAllAcquisitionAssetSlugs(): string[] {
  return ACQUISITION_ASSETS.map((asset) => asset.slug);
}
