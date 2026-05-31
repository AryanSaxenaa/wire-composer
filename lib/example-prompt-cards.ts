/** Client-safe sidebar example metadata (no server-only template imports). */

export const CURATED_EXAMPLE_PROMPTS = [
  "Polymarket: search election markets → full market → orderbook → price history",
  "List public GitHub repos for user teknium1",
  "Search GitHub developers → list their repos",
  "Product Hunt trending → load launch details",
  "Search Airbnb listings → get listing details",
  "Get GitHub profile then list repositories",
  "Search GitHub users and load profile details",
] as const;

export type CuratedExamplePrompt = (typeof CURATED_EXAMPLE_PROMPTS)[number];

export type CuratedExampleCard = {
  text: CuratedExamplePrompt;
  stepCount: number;
  icon: "code2" | "star" | "home" | "globe" | "chart";
  tone: string;
};

export const CURATED_EXAMPLE_CARDS: CuratedExampleCard[] = [
  {
    text: "Polymarket: search election markets → full market → orderbook → price history",
    stepCount: 6,
    icon: "chart",
    tone: "purple",
  },
  {
    text: "List public GitHub repos for user teknium1",
    stepCount: 1,
    icon: "code2",
    tone: "gray",
  },
  {
    text: "Search GitHub developers → list their repos",
    stepCount: 2,
    icon: "code2",
    tone: "gray",
  },
  {
    text: "Product Hunt trending → load launch details",
    stepCount: 2,
    icon: "star",
    tone: "pink",
  },
  {
    text: "Search Airbnb listings → get listing details",
    stepCount: 2,
    icon: "home",
    tone: "green",
  },
  {
    text: "Get GitHub profile then list repositories",
    stepCount: 2,
    icon: "code2",
    tone: "gray",
  },
  {
    text: "Search GitHub users and load profile details",
    stepCount: 2,
    icon: "code2",
    tone: "gray",
  },
];
