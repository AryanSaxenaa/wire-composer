"use client";

import { NLInputPanel } from "@/components/composer/NLInputPanel";
import { PipelineCanvas } from "@/components/composer/PipelineCanvas";
import { NodeInspector } from "@/components/composer/NodeInspector";
import { TopBar } from "@/components/layout/TopBar";
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
          <PipelineCanvas />
          {inspectorOpen && <NodeInspector key={selectedNodeId} />}
        </div>
      </div>
    </CredentialsProvider>
  );
}
