"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ComposerLayout } from "@/components/composer/ComposerLayout";
import { useComposerStore } from "@/lib/store";
import { useWireActions } from "@/hooks/useWireActions";
import { usePipelineRunner } from "@/hooks/usePipelineRunner";
import { Spinner } from "@/components/ui/Spinner";

export function PipelineViewClient() {
  const params = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const setPipeline = useComposerStore((s) => s.setPipeline);
  const { run } = usePipelineRunner();
  const autoRunDone = useRef(false);

  useWireActions();

  useEffect(() => {
    setLoading(true);
    setError(null);
    autoRunDone.current = false;
    fetch(`/api/pipelines/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.pipeline) {
          setPipeline(data.pipeline, { fromStorage: true });
        } else {
          setError(data.error || "Pipeline not found");
        }
      })
      .catch(() => setError("Failed to load pipeline"))
      .finally(() => setLoading(false));
  }, [params.id, setPipeline]);

  useEffect(() => {
    if (loading || error || autoRunDone.current) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("run") !== "1") return;
    autoRunDone.current = true;
    const t = setTimeout(() => run(), 400);
    return () => clearTimeout(t);
  }, [loading, error, run]);

  if (loading) {
    return (
      <div className="composer-app h-screen flex items-center justify-center gap-3">
        <Spinner size="sm" />
        <span className="text-sm text-[#475569]">Loading pipeline...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="composer-app h-screen flex flex-col items-center justify-center gap-4 p-6">
        <p className="cmp-alert cmp-alert--error">{error}</p>
        <Link href="/pipelines" className="cmp-btn">
          Back to pipelines
        </Link>
      </div>
    );
  }

  return <ComposerLayout />;
}
