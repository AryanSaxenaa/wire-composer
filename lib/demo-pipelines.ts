import { Pipeline } from "@/types";
import { autoLayoutNodes } from "@/lib/auto-layout";

const now = () => new Date().toISOString();

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

/** Demo 1: Amazon read → extract price → compare → Slack (gated) */
export const DEMO_PRICE_MONITOR = layout({
  id: "demo-competitor-price-monitor",
  name: "Competitor Price Monitor",
  description: "Read Amazon price, compare to threshold, notify Slack when lower",
  naturalLanguagePrompt: "Track competitor Amazon price and Slack me if below threshold",
  schedule: undefined,
  nodes: [
    {
      id: "d1-read",
      type: "wireAction",
      actionId: "amazon.product.read",
      label: "Read Amazon product",
      platform: "amazon",
      position: { x: 0, y: 0 },
      config: {
        productUrl: "https://www.amazon.com/dp/B08N5WRWNW",
      },
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
      config: {
        threshold: "30",
        operator: "lt",
      },
      credentials: {},
      status: "idle",
    },
    {
      id: "d1-slack",
      type: "wireAction",
      actionId: "slack.message.send",
      label: "Notify Slack",
      platform: "slack",
      position: { x: 0, y: 0 },
      config: {
        channel: "#general",
        gateField: "passed",
        gateValue: "true",
        text: "Competitor price dropped below threshold.",
      },
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
      target: "d1-slack",
      sourceHandle: "passed",
      targetHandle: "passed",
      dataMapping: [{ fromField: "passed", toField: "passed" }],
      animated: false,
    },
  ],
});

/** Demo 2: LinkedIn search → profile → extract → Notion */
export const DEMO_LINKEDIN_CRM = layout({
  id: "demo-linkedin-notion-crm",
  name: "LinkedIn Prospect to CRM",
  description: "Search LinkedIn, read profile, append row to Notion",
  naturalLanguagePrompt: "Search LinkedIn prospects and add to Notion database",
  nodes: [
    {
      id: "d2-search",
      type: "wireAction",
      actionId: "linkedin.search.people",
      label: "Search LinkedIn",
      platform: "linkedin",
      position: { x: 0, y: 0 },
      config: {
        keywords: "founder SaaS",
        limit: "1",
      },
      credentials: {},
      status: "idle",
    },
    {
      id: "d2-profile",
      type: "wireAction",
      actionId: "linkedin.profile.read",
      label: "Read profile",
      platform: "linkedin",
      position: { x: 0, y: 0 },
      config: {
        profileUrl: "https://www.linkedin.com/in/example",
      },
      credentials: {},
      status: "idle",
    },
    {
      id: "d2-extract",
      type: "wireAction",
      actionId: "wire.data.extract",
      label: "Extract contact",
      platform: "wire",
      position: { x: 0, y: 0 },
      config: { field: "name" },
      credentials: {},
      status: "idle",
    },
    {
      id: "d2-notion",
      type: "wireAction",
      actionId: "notion.database.append",
      label: "Add to Notion",
      platform: "notion",
      position: { x: 0, y: 0 },
      config: {
        databaseUrl: "https://www.notion.so/workspace/database-id",
        properties: '{"Name":{"title":[{"text":{"content":"Prospect"}}]}}',
      },
      credentials: {},
      status: "idle",
    },
  ],
  edges: [
    {
      id: "d2-e1",
      source: "d2-search",
      target: "d2-profile",
      sourceHandle: "results",
      targetHandle: "profileUrl",
      dataMapping: [],
      animated: false,
    },
    {
      id: "d2-e2",
      source: "d2-profile",
      target: "d2-extract",
      sourceHandle: "name",
      targetHandle: "source",
      dataMapping: [{ fromField: "name", toField: "source" }],
      animated: false,
    },
    {
      id: "d2-e3",
      source: "d2-extract",
      target: "d2-notion",
      sourceHandle: "value",
      targetHandle: "properties",
      dataMapping: [{ fromField: "value", toField: "properties" }],
      animated: false,
    },
  ],
});

/** Demo 3: Trustpilot → filter → AI reply → post reply */
export const DEMO_TRUSTPILOT = layout({
  id: "demo-trustpilot-responder",
  name: "Trustpilot Review Responder",
  description: "Read reviews, filter 1-star, draft reply with AI, post response",
  naturalLanguagePrompt: "Respond to 1-star Trustpilot reviews with AI-generated replies",
  nodes: [
    {
      id: "d3-read",
      type: "wireAction",
      actionId: "trustpilot.reviews.read",
      label: "Read Trustpilot reviews",
      platform: "trustpilot",
      position: { x: 0, y: 0 },
      config: {
        companyUrl: "https://www.trustpilot.com/review/example.com",
        limit: "10",
      },
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
      label: "Generate reply (DeepSeek)",
      platform: "wire",
      position: { x: 0, y: 0 },
      config: {
        prompt:
          "Write a brief, empathetic public reply to this 1-star review. Acknowledge the issue and offer to help offline.",
      },
      credentials: {},
      status: "idle",
    },
    {
      id: "d3-reply",
      type: "wireAction",
      actionId: "trustpilot.review.reply",
      label: "Post Trustpilot reply",
      platform: "trustpilot",
      position: { x: 0, y: 0 },
      config: {},
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
    {
      id: "d3-e3",
      source: "d3-ai",
      target: "d3-reply",
      sourceHandle: "replyText",
      targetHandle: "replyText",
      dataMapping: [{ fromField: "replyText", toField: "replyText" }],
      animated: false,
    },
    {
      id: "d3-e4",
      source: "d3-filter",
      target: "d3-reply",
      sourceHandle: "reviewId",
      targetHandle: "reviewId",
      dataMapping: [{ fromField: "reviewId", toField: "reviewId" }],
      animated: false,
    },
  ],
});

export const DEMO_PIPELINES = [DEMO_PRICE_MONITOR, DEMO_LINKEDIN_CRM, DEMO_TRUSTPILOT] as const;

export type DemoPipelineId = (typeof DEMO_PIPELINES)[number]["id"];

export function getDemoPipeline(id: string): Pipeline | undefined {
  return DEMO_PIPELINES.find((p) => p.id === id);
}
