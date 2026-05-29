"use client";

import { NLInputPanel } from "@/components/composer/NLInputPanel";
import { PipelineCanvas } from "@/components/composer/PipelineCanvas";
import { NodeInspector } from "@/components/composer/NodeInspector";
import { RunStatusBar } from "@/components/composer/RunStatusBar";
import { TopBar } from "@/components/layout/TopBar";
import { useComposerStore } from "@/lib/store";

export function ComposerLayout() {
  const inspectorOpen = useComposerStore((s) => s.inspectorOpen);

  return (
    <div className="h-screen flex flex-col bg-bg-base">
      <TopBar />
      <div className="flex-1 flex overflow-hidden">
        <div className="w-[320px] flex-shrink-0 overflow-hidden">
          <NLInputPanel />
        </div>
        <div className="flex-1 relative">
          <PipelineCanvas />
        </div>
        {inspectorOpen && <NodeInspector />}
      </div>
      <RunStatusBar />
    </div>
  );
}
