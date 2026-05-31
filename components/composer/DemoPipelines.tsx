"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { DEMO_PIPELINES } from "@/lib/demo-pipelines";
import { autoLayoutNodes } from "@/lib/auto-layout";
import { useComposerStore } from "@/lib/store";
import { Pipeline } from "@/types";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

const DEMO_LABELS: Record<string, string> = {
  "demo-github-user-repos": "List GitHub Repos",
  "demo-github-profile-repos": "GitHub Profile → Repos",
  "demo-github-search-profile": "GitHub Search → Profile",
  "demo-github-developer-crm": "GitHub Developer CRM",
  "demo-producthunt-launch-radar": "Product Hunt Launch Radar",
  "demo-airbnb-listing-scan": "Airbnb Listing Scan",
};

export function DemoPipelines() {
  const pipeline = useComposerStore((s) => s.pipeline);
  const setPipeline = useComposerStore((s) => s.setPipeline);
  const addToast = useComposerStore((s) => s.addToast);
  const parseStatus = useComposerStore((s) => s.parseStatus);
  const [pendingDemo, setPendingDemo] = useState<Pipeline | null>(null);

  const loadDemo = (demo: (typeof DEMO_PIPELINES)[number]) => {
    const edges = demo.edges.map((e) => ({ ...e, animated: false }));
    const nodes = autoLayoutNodes(
      demo.nodes.map((n) => ({
        ...n,
        status: "idle" as const,
        output: undefined,
        error: undefined,
      })),
      edges
    );
    setPipeline({
      ...demo,
      nodes,
      edges,
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
        Real Anakin Wire workflows (GitHub, Product Hunt, Airbnb). Load a demo, set any required
        inputs in the inspector, then Run. Auth-none steps work without credentials; others need
        an Anakin identity in the inspector.
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
                {demo.nodes.length} step{demo.nodes.length === 1 ? "" : "s"} · verified
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
