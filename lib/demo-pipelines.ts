import { Pipeline } from "@/types";
import { autoLayoutNodes } from "@/lib/auto-layout";

const now = () => new Date().toISOString();

/** Verified Anakin Wire `action_id` values (GET /v1/wire/catalog/{slug}). */
export const ANAKIN_DEMO_ACTIONS = {
  amazonProductDetails: "am_product_details",
  amazonProductReviews: "am_product_reviews",
  airbnbSearchListings: "ab_search_listings",
  airbnbListingDetails: "ab_listing_details",
  trustpilotCompanyReviews: "tp_company_reviews",
  githubSearchUsers: "gh_search_users",
  githubUserDetails: "gh_user_details",
  githubUserRepos: "gh_user_repos",
  redditSubredditPosts: "rt_subreddit_posts",
  redditPostDetails: "rt_post_details",
  productHuntTrending: "ph_trending",
  productHuntProductDetails: "ph_product_details",
} as const;

function layout(pipeline: Omit<Pipeline, "createdAt" | "updatedAt">): Pipeline {
  const nodes = autoLayoutNodes(pipeline.nodes, pipeline.edges);
  return {
    ...pipeline,
    nodes,
    createdAt: now(),
    updatedAt: now(),
    isDemo: true,
  };
}

/** Amazon: product price → compare → reviews when below threshold */
export const DEMO_PRICE_MONITOR = layout({
  id: "demo-competitor-price-monitor",
  name: "Amazon Price Monitor",
  description: "am_product_details → extract price → compare → am_product_reviews",
  naturalLanguagePrompt: "Track Amazon ASIN price and fetch reviews when below threshold",
  schedule: undefined,
  nodes: [
    {
      id: "d1-read",
      type: "wireAction",
      actionId: ANAKIN_DEMO_ACTIONS.amazonProductDetails,
      label: "Product Details",
      platform: "amazon",
      position: { x: 0, y: 0 },
      config: { asin: "B08N5WRWNW" },
      credentials: {},
      status: "idle",
    },
    {
      id: "d1-extract",
      type: "wireAction",
      actionId: "wire.data.extract",
      label: "Extract price",
      platform: "wire",
      position: { x: 0, y: 0 },
      config: { field: "price" },
      credentials: {},
      status: "idle",
    },
    {
      id: "d1-compare",
      type: "condition",
      actionId: "wire.condition.compare",
      label: "Below threshold?",
      platform: "wire",
      position: { x: 0, y: 0 },
      config: { threshold: "30", operator: "lt" },
      credentials: {},
      status: "idle",
    },
    {
      id: "d1-reviews",
      type: "wireAction",
      actionId: ANAKIN_DEMO_ACTIONS.amazonProductReviews,
      label: "Product Reviews",
      platform: "amazon",
      position: { x: 0, y: 0 },
      config: { asin: "B08N5WRWNW", gateField: "passed", gateValue: "true" },
      credentials: {},
      status: "idle",
    },
  ],
  edges: [
    {
      id: "d1-e1",
      source: "d1-read",
      target: "d1-extract",
      sourceHandle: "price",
      targetHandle: "source",
      dataMapping: [{ fromField: "price", toField: "source" }],
      animated: false,
    },
    {
      id: "d1-e2",
      source: "d1-extract",
      target: "d1-compare",
      sourceHandle: "value",
      targetHandle: "value",
      dataMapping: [{ fromField: "value", toField: "value" }],
      animated: false,
    },
    {
      id: "d1-e3",
      source: "d1-compare",
      target: "d1-reviews",
      sourceHandle: "passed",
      targetHandle: "passed",
      dataMapping: [{ fromField: "passed", toField: "passed" }],
      animated: false,
    },
  ],
});

/** GitHub: search users → profile → extract → list repos (replaces LinkedIn → Notion CRM) */
export const DEMO_GITHUB_CRM = layout({
  id: "demo-github-developer-crm",
  name: "GitHub Developer CRM",
  description: "gh_search_users → gh_user_details → extract → gh_user_repos",
  naturalLanguagePrompt: "Search GitHub developers and enrich with profile and repositories",
  nodes: [
    {
      id: "d4-search",
      type: "wireAction",
      actionId: ANAKIN_DEMO_ACTIONS.githubSearchUsers,
      label: "Search Users",
      platform: "github_public",
      position: { x: 0, y: 0 },
      config: {
        query: "location:usa followers:>1000",
        per_page: "5",
      },
      credentials: {},
      status: "idle",
    },
    {
      id: "d4-profile",
      type: "wireAction",
      actionId: ANAKIN_DEMO_ACTIONS.githubUserDetails,
      label: "User Details",
      platform: "github_public",
      position: { x: 0, y: 0 },
      config: { username: "torvalds" },
      credentials: {},
      status: "idle",
    },
    {
      id: "d4-extract",
      type: "wireAction",
      actionId: "wire.data.extract",
      label: "Extract name",
      platform: "wire",
      position: { x: 0, y: 0 },
      config: { field: "name" },
      credentials: {},
      status: "idle",
    },
    {
      id: "d4-repos",
      type: "wireAction",
      actionId: ANAKIN_DEMO_ACTIONS.githubUserRepos,
      label: "User Repos",
      platform: "github_public",
      position: { x: 0, y: 0 },
      config: { username: "torvalds" },
      credentials: {},
      status: "idle",
    },
  ],
  edges: [
    {
      id: "d4-e1",
      source: "d4-search",
      target: "d4-profile",
      sourceHandle: "login",
      targetHandle: "username",
      dataMapping: [{ fromField: "login", toField: "username" }],
      animated: false,
    },
    {
      id: "d4-e2",
      source: "d4-profile",
      target: "d4-extract",
      sourceHandle: "name",
      targetHandle: "source",
      dataMapping: [{ fromField: "name", toField: "source" }],
      animated: false,
    },
    {
      id: "d4-e3",
      source: "d4-profile",
      target: "d4-repos",
      sourceHandle: "login",
      targetHandle: "username",
      dataMapping: [{ fromField: "login", toField: "username" }],
      animated: false,
    },
  ],
});

/** Reddit: subreddit feed → post details (replaces Slack-style alerts) */
export const DEMO_REDDIT_MONITOR = layout({
  id: "demo-reddit-thread-monitor",
  name: "Reddit Thread Monitor",
  description: "rt_subreddit_posts → rt_post_details → extract title",
  naturalLanguagePrompt: "Monitor a subreddit and pull full post details",
  nodes: [
    {
      id: "d5-feed",
      type: "wireAction",
      actionId: ANAKIN_DEMO_ACTIONS.redditSubredditPosts,
      label: "Subreddit Posts",
      platform: "reddit",
      position: { x: 0, y: 0 },
      config: {
        subreddit: "programming",
        sort: "hot",
        limit: "5",
      },
      credentials: {},
      status: "idle",
    },
    {
      id: "d5-post",
      type: "wireAction",
      actionId: ANAKIN_DEMO_ACTIONS.redditPostDetails,
      label: "Post Details",
      platform: "reddit",
      position: { x: 0, y: 0 },
      config: {
        post_id: "",
        subreddit: "programming",
      },
      credentials: {},
      status: "idle",
    },
    {
      id: "d5-extract",
      type: "wireAction",
      actionId: "wire.data.extract",
      label: "Extract title",
      platform: "wire",
      position: { x: 0, y: 0 },
      config: { field: "title" },
      credentials: {},
      status: "idle",
    },
  ],
  edges: [
    {
      id: "d5-e1",
      source: "d5-feed",
      target: "d5-post",
      sourceHandle: "id",
      targetHandle: "post_id",
      dataMapping: [{ fromField: "id", toField: "post_id" }],
      animated: false,
    },
    {
      id: "d5-e2",
      source: "d5-post",
      target: "d5-extract",
      sourceHandle: "title",
      targetHandle: "source",
      dataMapping: [{ fromField: "title", toField: "source" }],
      animated: false,
    },
  ],
});

/** Product Hunt: trending → product details (replaces Notion database append) */
export const DEMO_PRODUCT_HUNT = layout({
  id: "demo-producthunt-launch-radar",
  name: "Product Hunt Launch Radar",
  description: "ph_trending → ph_product_details → extract product name",
  naturalLanguagePrompt: "Get Product Hunt trending launches and load product details",
  nodes: [
    {
      id: "d6-trending",
      type: "wireAction",
      actionId: ANAKIN_DEMO_ACTIONS.productHuntTrending,
      label: "Trending Products",
      platform: "producthunt",
      position: { x: 0, y: 0 },
      config: {},
      credentials: {},
      status: "idle",
    },
    {
      id: "d6-product",
      type: "wireAction",
      actionId: ANAKIN_DEMO_ACTIONS.productHuntProductDetails,
      label: "Product Details",
      platform: "producthunt",
      position: { x: 0, y: 0 },
      config: {
        slug: "notion",
      },
      credentials: {},
      status: "idle",
    },
    {
      id: "d6-extract",
      type: "wireAction",
      actionId: "wire.data.extract",
      label: "Extract name",
      platform: "wire",
      position: { x: 0, y: 0 },
      config: { field: "name" },
      credentials: {},
      status: "idle",
    },
  ],
  edges: [
    {
      id: "d6-e1",
      source: "d6-trending",
      target: "d6-product",
      sourceHandle: "slug",
      targetHandle: "slug",
      dataMapping: [{ fromField: "slug", toField: "slug" }],
      animated: false,
    },
    {
      id: "d6-e2",
      source: "d6-product",
      target: "d6-extract",
      sourceHandle: "name",
      targetHandle: "source",
      dataMapping: [{ fromField: "name", toField: "source" }],
      animated: false,
    },
  ],
});

/** Airbnb: search → listing details */
export const DEMO_AIRBNB_LISTINGS = layout({
  id: "demo-airbnb-listing-scan",
  name: "Airbnb Listing Scan",
  description: "ab_search_listings → ab_listing_details → extract title",
  naturalLanguagePrompt: "Search Airbnb in a location and get listing details",
  nodes: [
    {
      id: "d2-search",
      type: "wireAction",
      actionId: ANAKIN_DEMO_ACTIONS.airbnbSearchListings,
      label: "Search Listings",
      platform: "airbnb",
      position: { x: 0, y: 0 },
      config: {
        query: "Pacific Heights, San Francisco",
        adults: "2",
      },
      credentials: {},
      status: "idle",
    },
    {
      id: "d2-details",
      type: "wireAction",
      actionId: ANAKIN_DEMO_ACTIONS.airbnbListingDetails,
      label: "Listing Details",
      platform: "airbnb",
      position: { x: 0, y: 0 },
      config: { listing_id: "" },
      credentials: {},
      status: "idle",
    },
    {
      id: "d2-extract",
      type: "wireAction",
      actionId: "wire.data.extract",
      label: "Extract title",
      platform: "wire",
      position: { x: 0, y: 0 },
      config: { field: "title" },
      credentials: {},
      status: "idle",
    },
  ],
  edges: [
    {
      id: "d2-e1",
      source: "d2-search",
      target: "d2-details",
      sourceHandle: "listing_id",
      targetHandle: "listing_id",
      dataMapping: [{ fromField: "listing_id", toField: "listing_id" }],
      animated: false,
    },
    {
      id: "d2-e2",
      source: "d2-details",
      target: "d2-extract",
      sourceHandle: "title",
      targetHandle: "source",
      dataMapping: [{ fromField: "title", toField: "source" }],
      animated: false,
    },
  ],
});

/** Trustpilot: reviews → filter 1-star → AI draft */
export const DEMO_TRUSTPILOT = layout({
  id: "demo-trustpilot-responder",
  name: "Trustpilot Review Responder",
  description: "tp_company_reviews → filter 1-star → AI draft reply",
  naturalLanguagePrompt: "Draft replies to 1-star Trustpilot reviews with AI",
  nodes: [
    {
      id: "d3-read",
      type: "wireAction",
      actionId: ANAKIN_DEMO_ACTIONS.trustpilotCompanyReviews,
      label: "Company Reviews",
      platform: "trustpilot",
      position: { x: 0, y: 0 },
      config: { domain: "amazon.com", page: "1" },
      credentials: {},
      status: "idle",
    },
    {
      id: "d3-filter",
      type: "condition",
      actionId: "wire.filter.reviews",
      label: "Filter 1-star",
      platform: "wire",
      position: { x: 0, y: 0 },
      config: { minStars: "1", maxStars: "1" },
      credentials: {},
      status: "idle",
    },
    {
      id: "d3-ai",
      type: "wireAction",
      actionId: "wire.ai.transform",
      label: "Draft reply (DeepSeek)",
      platform: "wire",
      position: { x: 0, y: 0 },
      config: {
        prompt:
          "Write a brief, empathetic public reply to this 1-star review. Acknowledge the issue and offer to help offline.",
      },
      credentials: {},
      status: "idle",
    },
  ],
  edges: [
    {
      id: "d3-e1",
      source: "d3-read",
      target: "d3-filter",
      sourceHandle: "reviews",
      targetHandle: "reviews",
      dataMapping: [{ fromField: "reviews", toField: "reviews" }],
      animated: false,
    },
    {
      id: "d3-e2",
      source: "d3-filter",
      target: "d3-ai",
      sourceHandle: "reviewText",
      targetHandle: "reviewText",
      dataMapping: [{ fromField: "reviewText", toField: "reviewText" }],
      animated: false,
    },
  ],
});

export const DEMO_PIPELINES = [
  DEMO_PRICE_MONITOR,
  DEMO_GITHUB_CRM,
  DEMO_REDDIT_MONITOR,
  DEMO_PRODUCT_HUNT,
  DEMO_AIRBNB_LISTINGS,
  DEMO_TRUSTPILOT,
] as const;

export type DemoPipelineId = (typeof DEMO_PIPELINES)[number]["id"];

export function getDemoPipeline(id: string): Pipeline | undefined {
  return DEMO_PIPELINES.find((p) => p.id === id);
}
