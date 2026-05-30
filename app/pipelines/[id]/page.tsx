"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ComposerLayout } from "@/components/composer/ComposerLayout";
import { useComposerStore } from "@/lib/store";
import { useWireActions } from "@/hooks/useWireActions";
import { Spinner } from "@/components/ui/Spinner";
import "../../composer.css";

export default function PipelineViewPage() {
  const params = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const setPipeline = useComposerStore((s) => s.setPipeline);

  useWireActions();

  useEffect(() => {
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

  if (loading) {
    return (
      <div className="composer-app h-screen flex items-center justify-center gap-3">
        <Spinner size="sm" />
        <span className="text-sm text-[#64748b]">Loading pipeline...</span>
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
