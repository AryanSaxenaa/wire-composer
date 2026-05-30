"use client";

import Link from "next/link";
import { useState, useCallback, useEffect } from "react";
import { useComposerStore } from "@/lib/store";
import { usePipelineRunner } from "@/hooks/usePipelineRunner";
import { LandingLogo } from "@/components/landing/LandingLogo";
import { Spinner } from "@/components/ui/Spinner";

export function TopBar() {
  const pipeline = useComposerStore((s) => s.pipeline);
  const pipelinePersisted = useComposerStore((s) => s.pipelinePersisted);
  const parseStatus = useComposerStore((s) => s.parseStatus);
  const [name, setName] = useState(pipeline?.name || "");
  const { run, cancel, status: runStatus } = usePipelineRunner();

  useEffect(() => {
    if (pipeline?.name) setName(pipeline.name);
  }, [pipeline?.name]);

  const handleSave = useCallback(async () => {
    if (!pipeline) return;
    const updated = { ...pipeline, name: name || pipeline.name };

    try {
      const res = await fetch("/api/pipelines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      const data = await res.json();
      if (data.pipeline) {
        useComposerStore.getState().setPipeline(data.pipeline, { fromStorage: true });
        useComposerStore.getState().addToast("success", "Pipeline saved");
      } else {
        useComposerStore.getState().addToast("error", data.error || "Save failed");
      }
    } catch {
      useComposerStore.getState().addToast("error", "Save failed — check KV configuration");
    }
  }, [pipeline, name]);

  const handleNameBlur = () => {
    if (!pipeline) return;
    const trimmed = name.trim() || "Untitled pipeline";
    if (trimmed !== pipeline.name) {
      useComposerStore.setState({
        pipeline: { ...pipeline, name: trimmed },
        pipelinePersisted: false,
      });
    }
  };

  const showSaved = pipeline && pipelinePersisted;

  return (
    <header className="cmp-topbar">
      <div className="cmp-topbar-left">
        <Link href="/" className="cmp-topbar-brand">
          <LandingLogo />
          <span>wire</span>
        </Link>
        <div className="cmp-topbar-divider" />
        <div className="cmp-topbar-crumb">
          <Link href="/pipelines" className="cmp-topbar-crumb-brand hover:underline">
            Pipelines
          </Link>
          <span>/</span>
          <input
            value={name || pipeline?.name || ""}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleNameBlur}
            placeholder="Untitled pipeline"
            className="cmp-topbar-name"
            disabled={!pipeline}
          />
          {showSaved && (
            <span className="cmp-saved-badge">
              <span className="cmp-saved-dot">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M1.5 5.5l2 2.5 5-5" stroke="#10b981" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              Saved
            </span>
          )}
        </div>
      </div>

      <div className="cmp-topbar-actions">
        {parseStatus === "loading" && (
          <span className="flex items-center gap-1.5 text-xs text-[#64748b]">
            <Spinner size="sm" /> Parsing...
          </span>
        )}
        <Link href="/pipelines" className="cmp-btn">
          Library
        </Link>
        <button type="button" className="cmp-btn" onClick={handleSave} disabled={!pipeline}>
          Save
        </button>
        {runStatus === "running" ? (
          <button type="button" className="cmp-btn" onClick={cancel}>
            Cancel
          </button>
        ) : null}
        <button
          type="button"
          className="cmp-btn cmp-btn--primary"
          onClick={() => run()}
          disabled={!pipeline || runStatus === "running"}
        >
          {runStatus === "running" ? (
            <>
              <Spinner size="sm" />
              Running
            </>
          ) : (
            <>
              <svg width="10" height="12" viewBox="0 0 10 12" fill="none" aria-hidden>
                <path d="M1 1v10l8-5.5L1 1z" fill="currentColor" />
              </svg>
              Run
            </>
          )}
        </button>
      </div>
    </header>
  );
}
