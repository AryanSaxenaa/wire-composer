"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Pipeline } from "@/types";
import { AppHeader } from "@/components/layout/AppHeader";
import { Sidebar } from "@/components/layout/Sidebar";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Spinner } from "@/components/ui/Spinner";
import "../composer.css";

function StatusPill({ status }: { status?: string }) {
  if (!status) return <span className="cmp-pill-muted">—</span>;
  const styles: Record<string, string> = {
    success: "cmp-pill cmp-pill--success",
    error: "cmp-pill cmp-pill--error",
    partial: "cmp-pill cmp-pill--warn",
  };
  return <span className={styles[status] || "cmp-pill cmp-pill--muted"}>{status}</span>;
}

export default function PipelinesPage() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/pipelines")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        setPipelines(data.pipelines || []);
      })
      .catch(() => {
        setError("Could not load pipelines. Check your KV configuration.");
        setPipelines([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/pipelines/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string }).error || "Delete failed");
        return;
      }
      setPipelines((p) => p.filter((x) => x.id !== id));
    } catch {
      setError("Delete failed — check your connection");
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="composer-app" style={{ flexDirection: "row" }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
      <AppHeader
        title="Saved pipelines"
        action={
          <Link href="/composer" className="cmp-btn cmp-btn--primary">
            New pipeline
          </Link>
        }
      />

      <main className="cmp-page-main">
        {loading ? (
          <div className="cmp-page-center">
            <Spinner size="sm" />
            <span className="text-sm text-[#64748b]">Loading pipelines...</span>
          </div>
        ) : error ? (
          <div className="cmp-page-center">
            <p className="cmp-alert cmp-alert--error">{error}</p>
            <div className="flex gap-2">
              <button
                type="button"
                className="cmp-btn"
                onClick={() => {
                  setError(null);
                  setLoading(true);
                  fetch("/api/pipelines")
                    .then((r) => r.json())
                    .then((data) => {
                      if (data.error) setError(data.error);
                      setPipelines(data.pipelines || []);
                    })
                    .catch(() => setError("Could not load pipelines. Check your KV configuration."))
                    .finally(() => setLoading(false));
                }}
              >
                Retry
              </button>
              <Link href="/composer" className="cmp-btn cmp-btn--primary">
                Open composer
              </Link>
            </div>
          </div>
        ) : pipelines.length === 0 ? (
          <div className="cmp-page-center">
            <div className="cmp-empty-illus" aria-hidden>
              <svg width="120" height="80" viewBox="0 0 120 80" fill="none">
                <rect x="4" y="28" width="32" height="24" rx="6" fill="#eff6ff" stroke="#93c5fd" />
                <rect x="44" y="28" width="32" height="24" rx="6" fill="#f0fdf4" stroke="#86efac" />
                <rect x="84" y="28" width="32" height="24" rx="6" fill="#faf5ff" stroke="#c4b5fd" />
                <path d="M36 40h8M76 40h8" stroke="#cbd5e1" strokeWidth="2" />
              </svg>
            </div>
            <p className="text-sm font-medium text-[#334155] mt-4">Build your first pipeline</p>
            <p className="text-xs text-[#94a3b8] max-w-sm text-center">
              Parse in the composer, Save to the library, then Schedule or Deploy Webhook for
              server-side runs.
            </p>
            <Link href="/composer" className="cmp-btn cmp-btn--primary mt-2">
              Open composer
            </Link>
          </div>
        ) : (
          <div className="cmp-table-wrap">
            <div className="cmp-table-head">
              <span>Name</span>
              <span>Nodes</span>
              <span>Schedule</span>
              <span>Last run</span>
              <span>Status</span>
              <span>Actions</span>
            </div>
            {pipelines.map((p) => (
              <div key={p.id} className="cmp-table-row">
                <Link href={`/pipelines/${p.id}`} className="cmp-table-name">
                  {p.name}
                </Link>
                <span className="cmp-table-muted">{p.nodes.length}</span>
                <span className="cmp-table-muted font-mono text-[11px]" title={p.schedule || undefined}>
                  {p.schedule?.trim() ? p.schedule : "—"}
                </span>
                <span className="cmp-table-muted">
                  {p.lastRunAt ? new Date(p.lastRunAt).toLocaleString() : "—"}
                </span>
                <StatusPill status={p.lastRunStatus} />
                <div className="cmp-table-actions">
                  <Link
                    href={`/pipelines/${p.id}?run=1`}
                    className="cmp-btn cmp-btn--sm cmp-btn--primary"
                  >
                    Run
                  </Link>
                  <Link href={`/pipelines/${p.id}`} className="cmp-btn cmp-btn--sm">
                    Edit
                  </Link>
                  <button
                    type="button"
                    className="cmp-btn cmp-btn--sm cmp-btn--danger-text"
                    onClick={() => setDeleteId(p.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <ConfirmDialog
        open={deleteId !== null}
        title="Delete pipeline"
        message="This permanently deletes the pipeline from storage."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => deleteId && handleDelete(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
      </div>
    </div>
  );
}
