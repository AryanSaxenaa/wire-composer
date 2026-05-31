"use client";

import { useEffect } from "react";
import { useComposerStore } from "@/lib/store";
import { mergeWithFallbackActions } from "@/lib/anakin-fallback-actions";
import { BUILTIN_ACTIONS, registerAnakinActions } from "@/lib/action-registry";

export function useWireActions() {
  const setAvailableActions = useComposerStore((s) => s.setAvailableActions);

  useEffect(() => {
    registerAnakinActions([]);
    const fallbackCatalog = mergeWithFallbackActions([]);
    setAvailableActions([...BUILTIN_ACTIONS, ...fallbackCatalog]);

    fetch("/api/wire/actions")
      .then((r) => r.json())
      .then((data) => {
        if (data.actions?.length) {
          registerAnakinActions(
            data.actions.filter((a: { id: string }) => !a.id.startsWith("wire."))
          );
          setAvailableActions(data.actions);
        }
      })
      .catch(() => {
        /* fallbacks already registered */
      });
  }, [setAvailableActions]);
}
