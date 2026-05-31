/**
 * Unit tests for Airbnb listing_id extract + merge (no Anakin call).
 * Run: node scripts/test-airbnb-extract-flow.mjs
 */

function isUnsetInput(value) {
  return value == null || value === "";
}

function firstListingId(payload) {
  const listings = payload.listings;
  if (!Array.isArray(listings) || listings.length === 0) return undefined;
  const row = listings[0];
  if (!row || typeof row !== "object") return undefined;
  for (const key of ["listing_id", "listingId", "id", "room_id"]) {
    const val = row[key];
    if (!isUnsetInput(val)) return String(val);
  }
}

function nestedGet(obj, path) {
  const parts = path.split(".");
  let cur = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = cur[p];
  }
  return cur;
}

function runExtract(inputs) {
  const source = inputs.source ?? inputs;
  const field = String(inputs.field ?? "listing_id");
  let value = source[field] ?? nestedGet(source, field);
  if (isUnsetInput(value) && /listing/i.test(field)) {
    value = firstListingId(source);
  }
  const out = {};
  if (!isUnsetInput(value)) {
    out.value = value;
    out.extracted = value;
    out.listing_id = value;
  }
  return out;
}

function mergeNodeInputs(config, resolved) {
  const merged = {};
  for (const [key, value] of Object.entries(resolved)) {
    if (!isUnsetInput(value)) merged[key] = value;
  }
  for (const [key, value] of Object.entries(config)) {
    if (!isUnsetInput(value)) merged[key] = value;
  }
  return merged;
}

const searchOut = {
  listings: [{ id: "1642626106293023340", title: "Cozy stay" }],
  count: 1,
};

const extractOut = runExtract({ source: searchOut, field: "listings.0.listing_id" });
if (extractOut.listing_id !== "1642626106293023340") {
  console.error("FAIL extract", extractOut);
  process.exit(1);
}

const merged = mergeNodeInputs(
  { listing_id: "1642626106293023340", adults: "2" },
  { listing_id: "", adults: "2" }
);
if (merged.listing_id !== "1642626106293023340") {
  console.error("FAIL merge empty overwrites config", merged);
  process.exit(1);
}

const mergedUser = mergeNodeInputs(
  { username: "AryanSaxenaa" },
  { username: "torvalds" }
);
if (mergedUser.username !== "AryanSaxenaa") {
  console.error("FAIL inspector username should beat upstream mapping", mergedUser);
  process.exit(1);
}

const merged2 = mergeNodeInputs(
  { listing_id: "fallback-id" },
  { listing_id: undefined }
);
if (merged2.listing_id !== "fallback-id") {
  console.error("FAIL merge undefined", merged2);
  process.exit(1);
}

console.log("OK airbnb extract + merge");
