import { nanoid } from "nanoid";
import { Pipeline } from "@/types";
import { ensurePipelineRunDefaults } from "@/lib/ensure-pipeline-run-defaults";
import { fixAirbnbExtractPipeline } from "@/lib/fix-airbnb-pipeline";
import { fixPolymarketExtractPipeline } from "@/lib/fix-polymarket-pipeline";
import { normalizeNodeConfig } from "@/lib/normalize-pipeline-config";

const DEMO_PLACEHOLDER_VALUES = new Set([
  "torvalds",
  "octocat",
  "teknium1",
  "notion",
]);

/** Drop demo usernames/slugs on targets that receive the same field from an upstream edge. */
function clearMappedTargetPlaceholders(pipeline: Pipeline): Pipeline {
  const nodes = pipeline.nodes.map((n) => ({
    ...n,
    config: { ...n.config },
  }));

  for (const edge of pipeline.edges) {
    if (edge.dataMapping.length === 0) continue;
    const target = nodes.find((n) => n.id === edge.target);
    if (!target) continue;

    for (const m of edge.dataMapping) {
      const current = target.config[m.toField];
      if (current && DEMO_PLACEHOLDER_VALUES.has(current)) {
        const next = { ...target.config };
        delete next[m.toField];
        target.config = next;
      }
    }
  }

  return { ...pipeline, nodes };
}

function repairAirbnbListingFlow(pipeline: Pipeline): Pipeline {
  const nodes = pipeline.nodes.map((n) => ({
    ...n,
    config: normalizeNodeConfig(n.config as Record<string, unknown>),
  }));
  const edges = pipeline.edges.map((e) => ({
    ...e,
    dataMapping: e.dataMapping.map((m) => ({ ...m })),
  }));

  const search = nodes.find((n) => n.actionId === "ab_search_listings");
  const details = nodes.find((n) => n.actionId === "ab_listing_details");
  if (!search || !details) {
    return { ...pipeline, nodes, edges };
  }

  const hasDirect = edges.some(
    (e) => e.source === search.id && e.target === details.id
  );

  if (!hasDirect) {
    edges.push({
      id: nanoid(),
      source: search.id,
      target: details.id,
      sourceHandle: "listing_id",
      targetHandle: "listing_id",
      dataMapping: [{ fromField: "listing_id", toField: "listing_id" }],
      animated: false,
    });
  }

  for (const edge of edges) {
    if (edge.target !== details.id) continue;
    for (const m of edge.dataMapping) {
      if (m.toField === "listing_id" && m.fromField !== "listing_id") {
        const source = nodes.find((n) => n.id === edge.source);
        if (
          source?.actionId === "wire.data.extract" ||
          source?.actionId === "ab_search_listings"
        ) {
          m.fromField = "listing_id";
        }
      }
    }
  }

  if (!details.config.listing_id) {
    delete details.config.listing_id;
  }

  return { ...pipeline, nodes, edges };
}

export function postprocessParsedPipeline(pipeline: Pipeline): Pipeline {
  let p: Pipeline = {
    ...pipeline,
    nodes: pipeline.nodes.map((n) => ({
      ...n,
      config: normalizeNodeConfig(n.config as Record<string, unknown>),
    })),
  };

  p = clearMappedTargetPlaceholders(p);
  p = repairAirbnbListingFlow(p);
  p = fixAirbnbExtractPipeline(p);
  p = fixPolymarketExtractPipeline(p);
  p = ensurePipelineRunDefaults(p);

  return p;
}
