"use client";

import { useComposerStore } from "@/lib/store";
import clsx from "clsx";

export function ToastContainer() {
  const toasts = useComposerStore((s) => s.toasts);
  const removeToast = useComposerStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-14 right-4 z-[90] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => {
        const colors: Record<string, string> = {
          success: "border-success/40 bg-success/10",
          error: "border-error/40 bg-error/10",
          info: "border-accent-primary/40 bg-accent-primary/10",
        };
        return (
          <div
            key={t.id}
            className={clsx(
              "pointer-events-auto border rounded-md px-3 py-2 flex items-center gap-2 text-xs font-mono text-text-primary shadow-lg animate-slide-in",
              colors[t.type] || colors.info
            )}
          >
            <span>
              {t.type === "success" && "✓"}
              {t.type === "error" && "✕"}
              {t.type === "info" && "ℹ"}
            </span>
            <span className="flex-1">{t.message}</span>
            <button
              onClick={() => removeToast(t.id)}
              className="text-text-muted hover:text-text-primary ml-2"
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}
