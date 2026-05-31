import { isUnsetInput } from "@/lib/input-utils";

/** Pull the first listing identifier from Anakin `ab_search_listings` payloads. */
export function firstListingId(payload: Record<string, unknown>): string | undefined {
  const listings = payload.listings;
  if (!Array.isArray(listings) || listings.length === 0) return undefined;

  const first = listings[0];
  if (!first || typeof first !== "object" || Array.isArray(first)) return undefined;

  const row = first as Record<string, unknown>;
  for (const key of ["listing_id", "listingId", "id", "room_id", "roomId"]) {
    const val = row[key];
    if (!isUnsetInput(val)) return String(val);
  }
  return undefined;
}
