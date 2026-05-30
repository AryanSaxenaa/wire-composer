"use client";

import { DEMO_PIPELINES } from "@/lib/demo-pipelines";
import { useComposerStore } from "@/lib/store";

const DEMO_LABELS: Record<string, string> = {
  "demo-competitor-price-monitor": "Competitor Price Monitor",
  "demo-linkedin-notion-crm": "LinkedIn → Notion CRM",
  "demo-trustpilot-responder": "Trustpilot AI Responder",
};

export function DemoPipelines() {
  const setPipeline = useComposerStore((s) => s.setPipeline);
  const addToast = useComposerStore((s) => s.addToast);

  return (
    <div className="cmp-examples">
      <p className="cmp-kicker">DEMO PIPELINES</p>
      <p className="text-[11px] text-[#8888aa] mb-3 leading-snug">
        Pre-built workflows using real Wire actions and built-in transform steps. Configure URLs and credentials, then Run.
      </p>
      <div className="cmp-examples-list">
        {DEMO_PIPELINES.map((demo) => (
          <button
            key={demo.id}
            type="button"
            className="cmp-example-card cmp-example-card--demo"
            onClick={() => {
              setPipeline({
                ...demo,
                nodes: demo.nodes.map((n) => ({
                  ...n,
                  status: "idle" as const,
                  output: undefined,
                  error: undefined,
                })),
                edges: demo.edges.map((e) => ({ ...e, animated: false })),
              });
              addToast("success", `Loaded “${DEMO_LABELS[demo.id] || demo.name}”`);
            }}
          >
            <span className="cmp-example-icon cmp-example-icon--blue">▶</span>
            <span className="cmp-example-text">
              <strong>{DEMO_LABELS[demo.id] || demo.name}</strong>
              <span className="block text-[10px] text-[#555577] mt-0.5">
                {demo.nodes.length} steps · real execution
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
