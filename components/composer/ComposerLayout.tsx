"use client";

import { NLInputPanel } from "@/components/composer/NLInputPanel";
import { PipelineCanvas } from "@/components/composer/PipelineCanvas";
import { NodeInspector } from "@/components/composer/NodeInspector";
import { TopBar } from "@/components/layout/TopBar";
import { RunStatusBar } from "@/components/composer/RunStatusBar";
import { CredentialsProvider } from "@/lib/credentials-context";
import { useComposerStore } from "@/lib/store";

export function ComposerLayout() {
  const inspectorOpen = useComposerStore((s) => s.inspectorOpen);
  const selectedNodeId = useComposerStore((s) => s.selectedNodeId);

  return (
    <CredentialsProvider>
      <div className="composer-app">
        <TopBar />
        <div className="cmp-body">
          <NLInputPanel />
          <div className="cmp-canvas-column">
            <PipelineCanvas />
            <RunStatusBar />
          </div>
          <div
            className={`cmp-inspector-wrap ${inspectorOpen ? "cmp-inspector-wrap--open" : ""}`}
            aria-hidden={!inspectorOpen}
          >
            {inspectorOpen && <NodeInspector key={selectedNodeId} />}
          </div>
        </div>
      </div>
    </CredentialsProvider>
  );
}
