"use client";

import { useComposerStore } from "@/lib/store";

export function ToastContainer() {
  const toasts = useComposerStore((s) => s.toasts);
  const removeToast = useComposerStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="cmp-toast-host">
      {toasts.map((t) => (
        <div key={t.id} className={`cmp-toast cmp-toast--${t.type}`}>
          <span aria-hidden>
            {t.type === "success" && "✓"}
            {t.type === "error" && "✕"}
            {t.type === "info" && "ℹ"}
          </span>
          <span className="flex-1">{t.message}</span>
          <button
            type="button"
            onClick={() => removeToast(t.id)}
            className="text-[#94a3b8] hover:text-[#0f172a] ml-1"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
