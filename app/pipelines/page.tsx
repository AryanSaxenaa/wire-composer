"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Pipeline } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

function StatusBadge({ status }: { status?: string }) {
  if (!status) return <Badge>—</Badge>;
  const map: Record<string, "success" | "error" | "warning"> = {
    success: "success",
    error: "error",
    partial: "warning",
  };
  return <Badge variant={map[status] || "default"}>{status}</Badge>;
}

export default function PipelinesPage() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/pipelines")
      .then((r) => r.json())
      .then((data) => setPipelines(data.pipelines || []))
      .catch(() => setPipelines([]))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    await fetch(`/api/pipelines/${id}`, { method: "DELETE" });
    setPipelines((p) => p.filter((x) => x.id !== id));
  };

  return (
    <div className="min-h-screen bg-bg-base">
      <header className="border-b border-border-default px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-sm font-bold text-accent-primary font-mono">
            wire
          </Link>
          <span className="text-text-muted text-sm">/</span>
          <h1 className="text-sm font-semibold text-text-primary font-mono">Pipelines</h1>
        </div>
        <Link href="/composer">
          <Button size="sm">New Pipeline</Button>
        </Link>
      </header>

      <div className="max-w-4xl mx-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3">
            <Spinner size="sm" /> <span className="text-text-muted text-sm font-mono">Loading...</span>
          </div>
        ) : pipelines.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <p className="text-text-muted text-sm font-mono">No pipelines yet</p>
            <Link href="/composer">
              <Button>Build your first pipeline</Button>
            </Link>
          </div>
        ) : (
          <div className="border border-border-default rounded-md overflow-hidden">
            <div className="grid grid-cols-[1fr_100px_140px_100px_120px] gap-4 px-4 py-3 bg-bg-surface border-b border-border-default text-[10px] text-text-muted font-mono uppercase tracking-wider">
              <span>Name</span>
              <span>Nodes</span>
              <span>Last Run</span>
              <span>Status</span>
              <span>Actions</span>
            </div>
            {pipelines.map((p) => (
              <div
                key={p.id}
                className="grid grid-cols-[1fr_100px_140px_100px_120px] gap-4 px-4 py-3 border-b border-border-default last:border-b-0 hover:bg-bg-subtle transition-colors items-center"
              >
                <Link
                  href={`/pipelines/${p.id}`}
                  className="text-sm text-text-primary font-medium hover:text-accent-primary transition-colors truncate"
                >
                  {p.name}
                </Link>
                <span className="text-xs text-text-muted font-mono">{p.nodes.length}</span>
                <span className="text-xs text-text-muted font-mono">
                  {p.lastRunAt
                    ? new Date(p.lastRunAt).toLocaleDateString()
                    : "—"}
                </span>
                <StatusBadge status={p.lastRunStatus} />
                <div className="flex items-center gap-1">
                  <Link href={`/pipelines/${p.id}`}>
                    <Button size="sm" variant="ghost" className="text-[10px]">Edit</Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-[10px] hover:text-error"
                    onClick={() => handleDelete(p.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
