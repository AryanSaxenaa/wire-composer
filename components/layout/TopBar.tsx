"use client";

import Link from "next/link";
import { useState, useCallback, useEffect } from "react";
import { useComposerStore } from "@/lib/store";
import { usePipelineRunner } from "@/hooks/usePipelineRunner";
import { Logo } from "@/components/ui/Logo";
import { Spinner } from "@/components/ui/Spinner";
import { preparePipelineForStorage } from "@/lib/sanitize-pipeline";
import { useCredentials } from "@/lib/credentials-context";

export function TopBar() {
  const pipeline = useComposerStore((s) => s.pipeline);
  const pipelinePersisted = useComposerStore((s) => s.pipelinePersisted);
  const clearPipeline = useComposerStore((s) => s.clearPipeline);
  const parseStatus = useComposerStore((s) => s.parseStatus);
  const runStatus = useComposerStore((s) => s.runStatus);
  const [name, setName] = useState(pipeline?.name || "");
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleCron, setScheduleCron] = useState(pipeline?.schedule || "0 9 * * *");
  const [schedulePreset, setSchedulePreset] = useState("daily");
  const [webhookModalUrl, setWebhookModalUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const openConfirm = useComposerStore((s) => s.openConfirm);
  const parseError = useComposerStore((s) => s.parseError);
  const { run, cancel } = usePipelineRunner();
  const { getAllCredentials } = useCredentials();

  useEffect(() => {
    if (pipeline?.name) setName(pipeline.name);
    if (pipeline?.schedule) setScheduleCron(pipeline.schedule);
  }, [pipeline?.name, pipeline?.schedule, pipeline?.webhookId]);

  const handleSave = useCallback(async () => {
    if (!pipeline || saving) return;
    const updated = preparePipelineForStorage(
      {
        ...pipeline,
        name: name.trim() || pipeline.name,
      },
      getAllCredentials()
    );

    const isUpdate = pipelinePersisted && pipeline.id;

    setSaving(true);
    try {
      const res = await fetch(
        isUpdate ? `/api/pipelines/${pipeline.id}` : "/api/pipelines",
        {
          method: isUpdate ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updated),
        }
      );
      const data = await res.json();
      if (data.pipeline) {
        useComposerStore.getState().setPipeline(data.pipeline, { fromStorage: true });
        useComposerStore.getState().addToast("success", "Pipeline saved");
      } else {
        useComposerStore.getState().addToast("error", data.error || "Save failed");
      }
    } catch {
      useComposerStore.getState().addToast("error", "Save failed — check KV configuration");
    } finally {
      setSaving(false);
    }
  }, [pipeline, name, pipelinePersisted, saving, getAllCredentials]);

  const handleSaveSchedule = useCallback(async () => {
    if (!pipeline) return;
    const updated = { ...pipeline, schedule: scheduleCron };
    useComposerStore.setState({ pipeline: updated, pipelinePersisted: false });

    if (pipelinePersisted) {
      try {
        await fetch(`/api/pipelines/${pipeline.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(preparePipelineForStorage(updated, getAllCredentials())),
        });
        useComposerStore.getState().addToast("success", "Schedule saved");
      } catch {
        useComposerStore.getState().addToast("error", "Schedule saved locally — save pipeline to persist");
      }
    } else {
      useComposerStore.getState().addToast("success", "Schedule set — save pipeline to enable cron");
    }
    setScheduleOpen(false);
  }, [pipeline, scheduleCron, pipelinePersisted, getAllCredentials]);

  const handleDeployWebhook = useCallback(async () => {
    if (!pipeline) return;
    if (!pipelinePersisted) {
      useComposerStore.getState().addToast("error", "Save pipeline before deploying webhook");
      return;
    }
    try {
      const res = await fetch(`/api/pipelines/${pipeline.id}/webhook`, { method: "POST" });
      const data = await res.json();
      if (data.webhookUrl) {
        setWebhookModalUrl(data.webhookUrl);
        if (data.pipeline) {
          useComposerStore.getState().setPipeline(data.pipeline, { fromStorage: true });
        }
        useComposerStore.getState().addToast("success", "Webhook URL ready");
      } else {
        useComposerStore.getState().addToast("error", data.error || "Webhook deploy failed");
      }
    } catch {
      useComposerStore.getState().addToast("error", "Webhook deploy failed");
    }
  }, [pipeline, pipelinePersisted]);

  const applyPreset = (preset: string) => {
    setSchedulePreset(preset);
    const presets: Record<string, string> = {
      "5min": "*/5 * * * *",
      hourly: "0 * * * *",
      daily: "0 9 * * *",
      weekly: "0 9 * * 1",
    };
    setScheduleCron(presets[preset] || scheduleCron);
  };

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
  const showUnsaved = pipeline && !pipelinePersisted;

  const copyWebhookUrl = useCallback(() => {
    if (!webhookModalUrl) return;
    void navigator.clipboard.writeText(webhookModalUrl);
    useComposerStore.getState().addToast("success", "Webhook URL copied");
  }, [webhookModalUrl]);

  return (
    <header className="cmp-topbar">
      <div className="cmp-topbar-left">
        <Link href="/" className="cmp-topbar-brand">
          <Logo size={28} />
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
          {showUnsaved && (
            <span className="cmp-unsaved-badge">Unsaved changes</span>
          )}
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
          <span className="flex items-center gap-1.5 text-xs text-[#475569]">
            <Spinner size="sm" /> Parsing...
          </span>
        )}
        {parseError && (
          <span className="text-xs text-[#dc2626] max-w-[200px] truncate" title={parseError}>
            Parse failed
          </span>
        )}
        <Link href="/pipelines" className="cmp-btn">
          Library
        </Link>
        <button
          type="button"
          className="cmp-btn"
          onClick={() => {
            if (!pipeline) {
              clearPipeline();
              return;
            }
            openConfirm({
              title: "New pipeline",
              message: "Discard the current canvas? Unsaved changes will be lost.",
              confirmLabel: "Discard",
              variant: "danger",
              onConfirm: () => clearPipeline(),
            });
          }}
        >
          New
        </button>
        <button
          type="button"
          className="cmp-btn"
          onClick={handleSave}
          disabled={!pipeline || saving}
        >
          {saving ? (
            <>
              <Spinner size="sm" /> Saving…
            </>
          ) : (
            "Save"
          )}
        </button>
        <button
          type="button"
          className="cmp-btn"
          onClick={() => setScheduleOpen(true)}
          disabled={!pipeline}
        >
          Schedule
        </button>
        <button type="button" className="cmp-btn" onClick={handleDeployWebhook} disabled={!pipeline}>
          Deploy Webhook
        </button>
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

      {scheduleOpen && pipeline && (
        <div className="cmp-modal-backdrop" onClick={() => setScheduleOpen(false)}>
          <div
            className="cmp-modal"
            role="dialog"
            aria-labelledby="schedule-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="schedule-title">Schedule pipeline</h3>
            <div className="flex flex-wrap gap-2 my-3">
              {(["5min", "hourly", "daily", "weekly"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`cmp-btn ${schedulePreset === p ? "cmp-btn--primary" : ""}`}
                  onClick={() => applyPreset(p)}
                >
                  {p === "5min" ? "Every 5 min" : p}
                </button>
              ))}
            </div>
            <input
              className="cmp-field-input w-full font-mono text-sm"
              value={scheduleCron}
              onChange={(e) => setScheduleCron(e.target.value)}
            />
            <p className="text-[10px] text-[#94a3b8] mt-2">
              Vercel cron checks every 5 minutes via <code className="font-mono">/api/cron/run-scheduled</code>
            </p>
            <div className="flex gap-2 mt-4 justify-end">
              <button type="button" className="cmp-btn" onClick={() => setScheduleOpen(false)}>
                Cancel
              </button>
              <button type="button" className="cmp-btn cmp-btn--primary" onClick={handleSaveSchedule}>
                Save schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {webhookModalUrl && (
        <div className="cmp-modal-backdrop" onClick={() => setWebhookModalUrl(null)}>
          <div
            className="cmp-modal"
            role="dialog"
            aria-labelledby="webhook-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="webhook-title">Webhook URL</h3>
            <p className="text-xs text-[#475569] mt-2 mb-2">POST JSON to run this pipeline.</p>
            <input className="cmp-field-input w-full font-mono text-xs" readOnly value={webhookModalUrl} />
            <div className="flex gap-2 mt-3 justify-end">
              <button type="button" className="cmp-btn" onClick={copyWebhookUrl}>
                Copy URL
              </button>
              <button type="button" className="cmp-btn" onClick={() => setWebhookModalUrl(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
