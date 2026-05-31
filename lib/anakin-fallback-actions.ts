import { ANAKIN_WIRE_ACTION_IDS } from "@/lib/anakin-wire-action-ids";
import { WireAction } from "@/types";

/**
 * Minimal Wire catalog entries for verified example/demo action IDs.
 * Used when the live catalog has not loaded yet (no API key, KV miss, slow fetch).
 * Live catalog entries from registerAnakinActions() always override these.
 */
export const ANAKIN_FALLBACK_ACTIONS: WireAction[] = [
  {
    id: ANAKIN_WIRE_ACTION_IDS.polymarketSearchMarkets,
    platform: "polymarket",
    name: "Search Markets",
    description: "Keyword search across Polymarket events and markets",
    category: "search",
    requiresAuth: false,
    authMode: "none",
    inputFields: [
      {
        key: "query",
        label: "Query",
        type: "string",
        required: true,
        description: "Keyword e.g. Trump, bitcoin, US presidential election",
        example: "US presidential election",
      },
      {
        key: "limit",
        label: "Limit",
        type: "number",
        required: false,
        description: "Max events (default 10, max 50)",
        example: "5",
      },
      {
        key: "closed",
        label: "Closed",
        type: "boolean",
        required: false,
        description: "Include closed events",
        example: "false",
      },
    ],
    outputFields: [
      { key: "data", label: "Data", type: "object", required: true, description: "Search results" },
    ],
  },
  {
    id: ANAKIN_WIRE_ACTION_IDS.polymarketMarketFull,
    platform: "polymarket",
    name: "Market Full",
    description: "Full market detail including outcome tokens",
    category: "read",
    requiresAuth: false,
    authMode: "none",
    inputFields: [
      {
        key: "market_id",
        label: "Market ID",
        type: "string",
        required: true,
        description: "Market ID or slug from search",
        example: "540817",
      },
    ],
    outputFields: [
      { key: "data", label: "Data", type: "object", required: true, description: "Market payload" },
    ],
  },
  {
    id: ANAKIN_WIRE_ACTION_IDS.polymarketOrderbook,
    platform: "polymarket",
    name: "Orderbook",
    description: "CLOB orderbook for an outcome token",
    category: "read",
    requiresAuth: false,
    authMode: "none",
    inputFields: [
      {
        key: "token_id",
        label: "Token ID",
        type: "string",
        required: true,
        description: "CLOB token ID from market full",
      },
    ],
    outputFields: [
      { key: "data", label: "Data", type: "object", required: true, description: "Orderbook" },
    ],
  },
  {
    id: ANAKIN_WIRE_ACTION_IDS.polymarketPriceHistory,
    platform: "polymarket",
    name: "Price History",
    description: "Historical prices for a token",
    category: "read",
    requiresAuth: false,
    authMode: "none",
    inputFields: [
      {
        key: "token_id",
        label: "Token ID",
        type: "string",
        required: true,
        description: "CLOB token ID",
      },
      {
        key: "interval",
        label: "Interval",
        type: "string",
        required: false,
        description: "1d, 1w, 1m, or max",
        example: "1d",
      },
      {
        key: "start_ts",
        label: "Start (unix)",
        type: "number",
        required: false,
        description: "Optional start timestamp",
      },
      {
        key: "end_ts",
        label: "End (unix)",
        type: "number",
        required: false,
        description: "Optional end timestamp",
      },
    ],
    outputFields: [
      { key: "data", label: "Data", type: "object", required: true, description: "Price series" },
    ],
  },
  {
    id: ANAKIN_WIRE_ACTION_IDS.airbnbSearchListings,
    platform: "airbnb",
    name: "Search Listings",
    description: "Search Airbnb listings",
    category: "search",
    requiresAuth: false,
    authMode: "none",
    inputFields: [
      { key: "query", label: "Query", type: "string", required: true, description: "Location query" },
      { key: "checkin", label: "Check-in", type: "string", required: true, description: "YYYY-MM-DD" },
      { key: "checkout", label: "Check-out", type: "string", required: true, description: "YYYY-MM-DD" },
      { key: "adults", label: "Adults", type: "number", required: false, description: "Guest count" },
    ],
    outputFields: [
      { key: "data", label: "Data", type: "object", required: true, description: "Listings" },
    ],
  },
  {
    id: ANAKIN_WIRE_ACTION_IDS.airbnbListingDetails,
    platform: "airbnb",
    name: "Listing Details",
    description: "Details for one listing",
    category: "read",
    requiresAuth: false,
    authMode: "none",
    inputFields: [
      { key: "listing_id", label: "Listing ID", type: "string", required: true, description: "Listing ID" },
    ],
    outputFields: [
      { key: "data", label: "Data", type: "object", required: true, description: "Listing" },
    ],
  },
  {
    id: ANAKIN_WIRE_ACTION_IDS.githubSearchUsers,
    platform: "github_public",
    name: "Search Users",
    description: "Search GitHub users",
    category: "search",
    requiresAuth: false,
    authMode: "none",
    inputFields: [
      { key: "q", label: "Query", type: "string", required: true, description: "Search query" },
    ],
    outputFields: [
      { key: "data", label: "Data", type: "object", required: true, description: "Users" },
    ],
  },
  {
    id: ANAKIN_WIRE_ACTION_IDS.githubUserDetails,
    platform: "github_public",
    name: "User Details",
    description: "GitHub user profile",
    category: "read",
    requiresAuth: false,
    authMode: "none",
    inputFields: [
      { key: "username", label: "Username", type: "string", required: true, description: "GitHub login" },
    ],
    outputFields: [
      { key: "data", label: "Data", type: "object", required: true, description: "Profile" },
    ],
  },
  {
    id: ANAKIN_WIRE_ACTION_IDS.githubUserRepos,
    platform: "github_public",
    name: "User Repos",
    description: "Public repositories for a user",
    category: "read",
    requiresAuth: false,
    authMode: "none",
    inputFields: [
      { key: "username", label: "Username", type: "string", required: true, description: "GitHub login" },
    ],
    outputFields: [
      { key: "data", label: "Data", type: "object", required: true, description: "Repositories" },
    ],
  },
  {
    id: ANAKIN_WIRE_ACTION_IDS.productHuntTrending,
    platform: "producthunt",
    name: "Trending",
    description: "Trending Product Hunt launches",
    category: "read",
    requiresAuth: false,
    authMode: "none",
    inputFields: [],
    outputFields: [
      { key: "data", label: "Data", type: "object", required: true, description: "Trending" },
    ],
  },
  {
    id: ANAKIN_WIRE_ACTION_IDS.productHuntProductDetails,
    platform: "producthunt",
    name: "Product Details",
    description: "Product Hunt launch details",
    category: "read",
    requiresAuth: false,
    authMode: "none",
    inputFields: [
      { key: "slug", label: "Slug", type: "string", required: true, description: "Product slug" },
    ],
    outputFields: [
      { key: "data", label: "Data", type: "object", required: true, description: "Product" },
    ],
  },
];

const FALLBACK_BY_ID = new Map(ANAKIN_FALLBACK_ACTIONS.map((a) => [a.id, a]));

export function getFallbackActionById(id: string): WireAction | undefined {
  return FALLBACK_BY_ID.get(id);
}

export function isKnownExampleWireActionId(actionId: string): boolean {
  return FALLBACK_BY_ID.has(actionId);
}

export function mergeWithFallbackActions(actions: WireAction[]): WireAction[] {
  const byId = new Map<string, WireAction>();
  for (const stub of ANAKIN_FALLBACK_ACTIONS) byId.set(stub.id, stub);
  for (const action of actions) byId.set(action.id, action);
  return Array.from(byId.values());
}
