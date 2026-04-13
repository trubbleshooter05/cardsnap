export type ExampleRow = {
  label: string;
  value: string;
  valueTone?: "amber" | "zinc" | "emerald";
};

export type SeoGuideBlock =
  | { kind: "paragraph"; text: string }
  | { kind: "paragraphs"; items: string[] }
  | { kind: "subhead"; text: string }
  | { kind: "bullet"; items: string[] }
  | { kind: "callout"; text: string }
  | { kind: "exampleRows"; rows: ExampleRow[] }
  | { kind: "toolLink"; lead?: string; after?: string };

export type SeoGuideSection = {
  title: string;
  blocks: SeoGuideBlock[];
};

export type SeoGuideDefinition = {
  slug: string;
  title: string;
  description: string;
  h1: string;
  articleDescription: string;
  intro: string[];
  sections: SeoGuideSection[];
  cta: {
    title: string;
    blocks: SeoGuideBlock[];
    buttonText: string;
  };
  finalSection: {
    title: string;
    paragraphs: string[];
  };
};
