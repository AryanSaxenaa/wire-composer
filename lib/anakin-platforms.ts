/**
 * Wire catalog slugs available via Anakin API (GET /v1/wire/catalog).
 * Fetched from the authenticated account — not hardcoded action IDs.
 */
export const ANAKIN_CATALOG_HIGHLIGHTS = [
  { slug: "amazon", name: "Amazon", actions: 12 },
  { slug: "github_public", name: "GitHub", actions: 13 },
  { slug: "reddit", name: "Reddit", actions: 7 },
  { slug: "producthunt", name: "Product Hunt", actions: 3 },
  { slug: "airbnb", name: "Airbnb", actions: 5 },
  { slug: "trustpilot", name: "Trustpilot", actions: 5 },
  { slug: "ebay", name: "eBay", actions: 7 },
  { slug: "coingecko", name: "CoinGecko", actions: 14 },
  { slug: "shopify", name: "Shopify Stores", actions: 7 },
  { slug: "hackernews", name: "Hacker News", actions: 4 },
  { slug: "google_news", name: "Google News", actions: 8 },
  { slug: "indeed", name: "Indeed", actions: 4 },
  { slug: "yahoo_finance", name: "Yahoo Finance", actions: 16 },
  { slug: "youtube", name: "YouTube", actions: 6 },
  { slug: "spotify", name: "Spotify", actions: 8 },
  { slug: "walmart", name: "Walmart", actions: 8 },
  { slug: "kalshi", name: "Kalshi", actions: 35 },
  { slug: "polymarket", name: "Polymarket", actions: 16 },
] as const;
