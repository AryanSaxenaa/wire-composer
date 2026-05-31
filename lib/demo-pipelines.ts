import { Pipeline } from "@/types";
import { autoLayoutNodes } from "@/lib/auto-layout";
import { ANAKIN_WIRE_ACTION_IDS } from "@/lib/anakin-wire-action-ids";

const now = () => new Date().toISOString();

/** @deprecated Use ANAKIN_WIRE_ACTION_IDS */
export const ANAKIN_DEMO_ACTIONS = ANAKIN_WIRE_ACTION_IDS;

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

/** GitHub: list repos for one user (single step — fastest demo). */
export const DEMO_GITHUB_USER_REPOS = layout({
  id: "demo-github-user-repos",
  name: "GitHub User Repos",
  description: "gh_user_repos — list public repositories for a username",
  naturalLanguagePrompt: "List public GitHub repositories for user octocat",
  nodes: [
    {
      id: "d0-repos",
      type: "wireAction",
      actionId: ANAKIN_DEMO_ACTIONS.githubUserRepos,
      label: "User Repos",
      platform: "github_public",
      position: { x: 0, y: 0 },
      config: { username: "octocat" },
      credentials: {},
      status: "idle",
    },
  ],
  edges: [],
});

/** GitHub: profile → repos */
export const DEMO_GITHUB_PROFILE_REPOS = layout({
  id: "demo-github-profile-repos",
  name: "GitHub Profile → Repos",
  description: "gh_user_details → gh_user_repos",
  naturalLanguagePrompt: "Get a GitHub user profile and list their public repositories",
  nodes: [
    {
      id: "d7-profile",
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
      id: "d7-repos",
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
      id: "d7-e1",
      source: "d7-profile",
      target: "d7-repos",
      sourceHandle: "login",
      targetHandle: "username",
      dataMapping: [{ fromField: "login", toField: "username" }],
      animated: false,
    },
  ],
});

/** GitHub: search → profile → extract → repos */
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
        per_page: "3",
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

/** GitHub: search → first user profile */
export const DEMO_GITHUB_SEARCH_PROFILE = layout({
  id: "demo-github-search-profile",
  name: "GitHub Search → Profile",
  description: "gh_search_users → gh_user_details",
  naturalLanguagePrompt: "Search GitHub for developers and load the first user's profile",
  nodes: [
    {
      id: "d8-search",
      type: "wireAction",
      actionId: ANAKIN_DEMO_ACTIONS.githubSearchUsers,
      label: "Search Users",
      platform: "github_public",
      position: { x: 0, y: 0 },
      config: { query: "followers:>50000", per_page: "3" },
      credentials: {},
      status: "idle",
    },
    {
      id: "d8-profile",
      type: "wireAction",
      actionId: ANAKIN_DEMO_ACTIONS.githubUserDetails,
      label: "User Details",
      platform: "github_public",
      position: { x: 0, y: 0 },
      config: { username: "torvalds" },
      credentials: {},
      status: "idle",
    },
  ],
  edges: [
    {
      id: "d8-e1",
      source: "d8-search",
      target: "d8-profile",
      sourceHandle: "login",
      targetHandle: "username",
      dataMapping: [{ fromField: "login", toField: "username" }],
      animated: false,
    },
  ],
});

/** Product Hunt: trending → product details */
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
      config: { slug: "notion" },
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

/** Curated demos — all verified E2E on production (GitHub public, Product Hunt, Airbnb). */
export const DEMO_PIPELINES = [
  DEMO_GITHUB_USER_REPOS,
  DEMO_GITHUB_PROFILE_REPOS,
  DEMO_GITHUB_SEARCH_PROFILE,
  DEMO_GITHUB_CRM,
  DEMO_PRODUCT_HUNT,
  DEMO_AIRBNB_LISTINGS,
] as const;

export type DemoPipelineId = (typeof DEMO_PIPELINES)[number]["id"];

export function getDemoPipeline(id: string): Pipeline | undefined {
  return DEMO_PIPELINES.find((p) => p.id === id);
}
