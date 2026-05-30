import { Suspense } from "react";
import { PipelineViewClient } from "./PipelineViewClient";
import "../../composer.css";

function LoadingFallback() {
  return (
    <div className="composer-app h-screen flex items-center justify-center text-sm text-[#475569]">
      Loading pipeline...
    </div>
  );
}

export default function PipelineViewPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PipelineViewClient />
    </Suspense>
  );
}
