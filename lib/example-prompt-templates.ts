import { nanoid } from "nanoid";
import { ANAKIN_WIRE_ACTION_IDS } from "@/lib/anakin-wire-action-ids";
import { CURATED_EXAMPLE_PROMPTS } from "@/lib/example-prompt-cards";
import { PipelineEdge, PipelineNode } from "@/types";

export { CURATED_EXAMPLE_PROMPTS, CURATED_EXAMPLE_CARDS } from "@/lib/example-prompt-cards";
export type { CuratedExampleCard, CuratedExamplePrompt } from "@/lib/example-prompt-cards";

type StepSpec = {
  key: string;
  actionId: string;
  label: string;
  platform: string;
  config: Record<string, string>;
};

type TemplateSpec = {
  name: string;
  description: string;
  steps: StepSpec[];
  edges: {
    from: string;
    to: string;
    sourceHandle: string;
    targetHandle: string;
    dataMapping: PipelineEdge["dataMapping"];
  }[];
};

function buildFromTemplate(spec: TemplateSpec): {
  name: string;
  description: string;
  nodes: PipelineNode[];
  edges: PipelineEdge[];
} {
  const ids = new Map(spec.steps.map((s) => [s.key, nanoid()]));

  const nodes: PipelineNode[] = spec.steps.map((s) => ({
    id: ids.get(s.key)!,
    type: "wireAction",
    actionId: s.actionId,
    label: s.label,
    platform: s.platform,
    position: { x: 0, y: 0 },
    config: { ...s.config },
    credentials: {},
    status: "idle",
  }));

  const edges: PipelineEdge[] = spec.edges.map((e) => ({
    id: nanoid(),
    source: ids.get(e.from)!,
    target: ids.get(e.to)!,
    sourceHandle: e.sourceHandle,
    targetHandle: e.targetHandle,
    dataMapping: e.dataMapping,
    animated: false,
  }));

  return { name: spec.name, description: spec.description, nodes, edges };
}

const TEMPLATES: Record<string, TemplateSpec> = {
  "polymarket: search election markets -> full market -> orderbook -> price history": {
    name: "Polymarket Market Depth",
    description:
      "pm_search_markets → extract market_id → pm_get_market_full → extract token_id → pm_get_orderbook + pm_get_price_history",
    steps: [
      {
        key: "search",
        actionId: ANAKIN_WIRE_ACTION_IDS.polymarketSearchMarkets,
        label: "Search Markets",
        platform: "polymarket",
        config: {
          query: "US presidential election",
          limit: "5",
          closed: "false",
        },
      },
      {
        key: "extract-market",
        actionId: "wire.data.extract",
        label: "Extract Market ID",
        platform: "wire",
        config: { field: "market_id" },
      },
      {
        key: "market-full",
        actionId: ANAKIN_WIRE_ACTION_IDS.polymarketMarketFull,
        label: "Market Full",
        platform: "polymarket",
        config: {},
      },
      {
        key: "extract-token",
        actionId: "wire.data.extract",
        label: "Extract Token ID",
        platform: "wire",
        config: { field: "token_id" },
      },
      {
        key: "orderbook",
        actionId: ANAKIN_WIRE_ACTION_IDS.polymarketOrderbook,
        label: "Orderbook",
        platform: "polymarket",
        config: {},
      },
      {
        key: "price-history",
        actionId: ANAKIN_WIRE_ACTION_IDS.polymarketPriceHistory,
        label: "Price History",
        platform: "polymarket",
        config: { interval: "1d" },
      },
    ],
    edges: [
      {
        from: "search",
        to: "extract-market",
        sourceHandle: "default",
        targetHandle: "source",
        dataMapping: [],
      },
      {
        from: "extract-market",
        to: "market-full",
        sourceHandle: "market_id",
        targetHandle: "market_id",
        dataMapping: [{ fromField: "market_id", toField: "market_id" }],
      },
      {
        from: "market-full",
        to: "extract-token",
        sourceHandle: "default",
        targetHandle: "source",
        dataMapping: [],
      },
      {
        from: "extract-token",
        to: "orderbook",
        sourceHandle: "token_id",
        targetHandle: "token_id",
        dataMapping: [{ fromField: "token_id", toField: "token_id" }],
      },
      {
        from: "extract-token",
        to: "price-history",
        sourceHandle: "token_id",
        targetHandle: "token_id",
        dataMapping: [{ fromField: "token_id", toField: "token_id" }],
      },
    ],
  },
  "list public github repos for user teknium1": {
    name: "GitHub Repos for teknium1",
    description: "gh_user_repos for teknium1",
    steps: [
      {
        key: "repos",
        actionId: ANAKIN_WIRE_ACTION_IDS.githubUserRepos,
        label: "User Repos",
        platform: "github_public",
        config: { username: "teknium1" },
      },
    ],
    edges: [],
  },
  "search github developers -> list their repos": {
    name: "GitHub Search to Repos",
    description: "gh_search_users → gh_user_repos (first user login)",
    steps: [
      {
        key: "search",
        actionId: ANAKIN_WIRE_ACTION_IDS.githubSearchUsers,
        label: "Search Users",
        platform: "github_public",
        config: { query: "followers:>1000", per_page: "5" },
      },
      {
        key: "repos",
        actionId: ANAKIN_WIRE_ACTION_IDS.githubUserRepos,
        label: "User Repos",
        platform: "github_public",
        config: {},
      },
    ],
    edges: [
      {
        from: "search",
        to: "repos",
        sourceHandle: "login",
        targetHandle: "username",
        dataMapping: [{ fromField: "login", toField: "username" }],
      },
    ],
  },
  "product hunt trending -> load launch details": {
    name: "Product Hunt Trending Details",
    description: "ph_trending → ph_product_details",
    steps: [
      {
        key: "trending",
        actionId: ANAKIN_WIRE_ACTION_IDS.productHuntTrending,
        label: "Trending Products",
        platform: "producthunt",
        config: {},
      },
      {
        key: "product",
        actionId: ANAKIN_WIRE_ACTION_IDS.productHuntProductDetails,
        label: "Product Details",
        platform: "producthunt",
        config: {},
      },
    ],
    edges: [
      {
        from: "trending",
        to: "product",
        sourceHandle: "slug",
        targetHandle: "slug",
        dataMapping: [{ fromField: "slug", toField: "slug" }],
      },
    ],
  },
  "search airbnb listings -> get listing details": {
    name: "Airbnb Search to Details",
    description: "ab_search_listings → ab_listing_details (first result)",
    steps: [
      {
        key: "search",
        actionId: ANAKIN_WIRE_ACTION_IDS.airbnbSearchListings,
        label: "Search Listings",
        platform: "airbnb",
        config: {
          query: "Udaipur",
          checkin: "2026-07-01",
          checkout: "2026-07-05",
          adults: "2",
          currency: "INR",
          locale: "en-IN",
        },
      },
      {
        key: "details",
        actionId: ANAKIN_WIRE_ACTION_IDS.airbnbListingDetails,
        label: "Listing Details",
        platform: "airbnb",
        config: {},
      },
    ],
    edges: [
      {
        from: "search",
        to: "details",
        sourceHandle: "listing_id",
        targetHandle: "listing_id",
        dataMapping: [{ fromField: "listing_id", toField: "listing_id" }],
      },
    ],
  },
  "get github profile then list repositories": {
    name: "GitHub Profile to Repos",
    description: "gh_user_details → gh_user_repos",
    steps: [
      {
        key: "profile",
        actionId: ANAKIN_WIRE_ACTION_IDS.githubUserDetails,
        label: "User Details",
        platform: "github_public",
        config: { username: "octocat" },
      },
      {
        key: "repos",
        actionId: ANAKIN_WIRE_ACTION_IDS.githubUserRepos,
        label: "User Repos",
        platform: "github_public",
        config: {},
      },
    ],
    edges: [
      {
        from: "profile",
        to: "repos",
        sourceHandle: "login",
        targetHandle: "username",
        dataMapping: [{ fromField: "login", toField: "username" }],
      },
    ],
  },
  "search github users and load profile details": {
    name: "GitHub Search to Profile",
    description: "gh_search_users → gh_user_details",
    steps: [
      {
        key: "search",
        actionId: ANAKIN_WIRE_ACTION_IDS.githubSearchUsers,
        label: "Search Users",
        platform: "github_public",
        config: { query: "followers:>50000", per_page: "5" },
      },
      {
        key: "profile",
        actionId: ANAKIN_WIRE_ACTION_IDS.githubUserDetails,
        label: "User Details",
        platform: "github_public",
        config: {},
      },
    ],
    edges: [
      {
        from: "search",
        to: "profile",
        sourceHandle: "login",
        targetHandle: "username",
        dataMapping: [{ fromField: "login", toField: "username" }],
      },
    ],
  },
};

/** GitHub login from phrases like "user teknium1" or "for @octocat". */
export function extractGitHubUsernameFromPrompt(prompt: string): string | null {
  const patterns = [
    /\buser\s+@?([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?)\b/i,
    /\bfor\s+@?([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?)\b/i,
    /\b@([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?)\b/,
  ];
  for (const re of patterns) {
    const m = prompt.match(re);
    if (m?.[1]) return m[1];
  }
  return null;
}

export function normalizeExamplePrompt(prompt: string): string {
  return prompt
    .toLowerCase()
    .replace(/\u2192/g, "->")
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

/** Curated pipeline for sidebar examples and close paraphrases. */
export function resolveExamplePipeline(
  prompt: string
): { name: string; description: string; nodes: PipelineNode[]; edges: PipelineEdge[] } | null {
  const key = normalizeExamplePrompt(prompt);
  const exact = TEMPLATES[key];
  if (exact) {
    const built = buildFromTemplate(exact);
    const login = extractGitHubUsernameFromPrompt(prompt);
    if (login) {
      for (const node of built.nodes) {
        if (
          node.actionId === ANAKIN_WIRE_ACTION_IDS.githubUserRepos ||
          node.actionId === ANAKIN_WIRE_ACTION_IDS.githubUserDetails
        ) {
          if (
            node.config.username === "teknium1" ||
            node.config.username === "octocat" ||
            node.config.username === "torvalds" ||
            !node.config.username
          ) {
            node.config = { ...node.config, username: login };
          }
        }
      }
    }
    return built;
  }

  if (/polymarket|prediction\s*market/.test(key)) {
    return buildFromTemplate(
      TEMPLATES["polymarket: search election markets -> full market -> orderbook -> price history"]
    );
  }
  if (/airbnb/.test(key) && /listing/.test(key) && /detail|details/.test(key)) {
    return buildFromTemplate(TEMPLATES["search airbnb listings -> get listing details"]);
  }
  if (/github/.test(key) && /repo/.test(key) && /teknium/.test(key)) {
    return buildFromTemplate(TEMPLATES["list public github repos for user teknium1"]);
  }
  if (/github/.test(key) && /search/.test(key) && /repo/.test(key)) {
    return buildFromTemplate(TEMPLATES["search github developers -> list their repos"]);
  }
  if (/github/.test(key) && /search/.test(key) && /profile/.test(key)) {
    return buildFromTemplate(TEMPLATES["search github users and load profile details"]);
  }
  if (/github/.test(key) && /profile/.test(key) && /repo/.test(key)) {
    return buildFromTemplate(TEMPLATES["get github profile then list repositories"]);
  }
  if (/product\s*hunt/.test(key) && /trend/.test(key)) {
    return buildFromTemplate(TEMPLATES["product hunt trending -> load launch details"]);
  }

  return null;
}

export function promptImpliesKnownPlatform(prompt: string): boolean {
  const k = normalizeExamplePrompt(prompt);
  return /airbnb|github|product\s*hunt|producthunt|polymarket|prediction\s*market/.test(k);
}
