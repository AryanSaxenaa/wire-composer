"use client";

import { useComposerStore } from "@/lib/store";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export function ComposerConfirmHost() {
  const dialog = useComposerStore((s) => s.confirmDialog);
  const closeConfirm = useComposerStore((s) => s.closeConfirm);

  if (!dialog) return null;

  return (
    <ConfirmDialog
      open
      title={dialog.title}
      message={dialog.message}
      confirmLabel={dialog.confirmLabel}
      variant={dialog.variant}
      onConfirm={() => {
        dialog.onConfirm();
        useComposerStore.setState({ confirmDialog: null });
      }}
      onCancel={closeConfirm}
    />
  );
}
