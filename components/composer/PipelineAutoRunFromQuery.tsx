"use client";

import { useEffect, useRef } from "react";
import { usePipelineRunner } from "@/hooks/usePipelineRunner";
import { useComposerStore } from "@/lib/store";

/** Runs pipeline when URL contains ?run=1 (e.g. from library page). Must render inside CredentialsProvider. */
export function PipelineAutoRunFromQuery() {
  const { run } = usePipelineRunner();
  const pipeline = useComposerStore((s) => s.pipeline);
  const done = useRef(false);

  useEffect(() => {
    done.current = false;
  }, [pipeline?.id]);

  useEffect(() => {
    if (done.current || !pipeline?.nodes.length) return;
    if (typeof window === "undefined") return;
    if (new URLSearchParams(window.location.search).get("run") !== "1") return;

    done.current = true;
    const t = window.setTimeout(() => {
      void run();
    }, 400);
    return () => window.clearTimeout(t);
  }, [pipeline?.id, pipeline?.nodes.length, run]);

  return null;
}
