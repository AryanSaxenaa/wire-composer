"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ComposerLayout } from "@/components/composer/ComposerLayout";
import { useComposerStore } from "@/lib/store";
import { ActionField, Pipeline } from "@/types";
import { Spinner } from "@/components/ui/Spinner";
import { ACTION_REGISTRY } from "@/lib/action-registry";

export default function PipelineViewPage() {
  const params = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const setPipeline = useComposerStore((s) => s.setPipeline);
  const setAvailableActions = useComposerStore((s) => s.setAvailableActions);

  useEffect(() => {
    setAvailableActions(ACTION_REGISTRY);

    fetch(`/api/pipelines/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.pipeline) {
          setPipeline(data.pipeline);
        }
      })
      .finally(() => setLoading(false));
  }, [params.id, setPipeline, setAvailableActions]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-bg-base gap-3">
        <Spinner size="sm" /> <span className="text-text-muted text-sm font-mono">Loading pipeline...</span>
      </div>
    );
  }

  return <ComposerLayout />;
}
