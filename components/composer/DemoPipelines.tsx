"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { DEMO_PIPELINES } from "@/lib/demo-pipelines";
import { useComposerStore } from "@/lib/store";
import { Pipeline } from "@/types";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

const DEMO_LABELS: Record<string, string> = {
  "demo-competitor-price-monitor": "Amazon Price Monitor",
  "demo-github-developer-crm": "GitHub Developer CRM",
  "demo-reddit-thread-monitor": "Reddit Thread Monitor",
  "demo-producthunt-launch-radar": "Product Hunt Launch Radar",
  "demo-airbnb-listing-scan": "Airbnb Listing Scan",
  "demo-trustpilot-responder": "Trustpilot AI Responder",
};

export function DemoPipelines() {
  const pipeline = useComposerStore((s) => s.pipeline);
  const setPipeline = useComposerStore((s) => s.setPipeline);
  const addToast = useComposerStore((s) => s.addToast);
  const parseStatus = useComposerStore((s) => s.parseStatus);
  const [pendingDemo, setPendingDemo] = useState<Pipeline | null>(null);

  const loadDemo = (demo: (typeof DEMO_PIPELINES)[number]) => {
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
  };

  const requestLoad = (demo: (typeof DEMO_PIPELINES)[number]) => {
    if (pipeline && pipeline.nodes.length > 0) {
      setPendingDemo(demo);
      return;
    }
    loadDemo(demo);
  };

  return (
    <div className="cmp-examples">
      <p className="cmp-kicker">DEMO PIPELINES</p>
      <p className="text-[11px] text-[#475569] mb-3 leading-snug">
        Pre-built workflows using Anakin Wire actions (GitHub, Reddit, Product Hunt, Amazon, and more). Map upstream fields where noted, then Run.
      </p>
      <div className="cmp-examples-list">
        {DEMO_PIPELINES.map((demo) => (
          <button
            key={demo.id}
            type="button"
            className="cmp-example-card cmp-example-card--demo"
            disabled={parseStatus === "loading"}
            onClick={() => requestLoad(demo)}
          >
            <span className="cmp-example-icon cmp-example-icon--blue"><Play size={14} /></span>
            <span className="cmp-example-text">
              <strong>{DEMO_LABELS[demo.id] || demo.name}</strong>
              <span className="block text-[10px] text-[#94a3b8] mt-0.5">
                {demo.nodes.length} steps · real execution
              </span>
            </span>
          </button>
        ))}
      </div>

      <ConfirmDialog
        open={pendingDemo !== null}
        title="Replace pipeline?"
        message="Loading a demo will replace your current canvas. Unsaved changes will be lost."
        confirmLabel="Load demo"
        onConfirm={() => {
          if (pendingDemo) loadDemo(pendingDemo);
          setPendingDemo(null);
        }}
        onCancel={() => setPendingDemo(null)}
      />
    </div>
  );
}
