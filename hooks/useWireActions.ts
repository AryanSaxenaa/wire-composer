"use client";

import { useEffect } from "react";
import { useComposerStore } from "@/lib/store";
import { BUILTIN_ACTIONS, registerAnakinActions } from "@/lib/action-registry";

export function useWireActions() {
  const setAvailableActions = useComposerStore((s) => s.setAvailableActions);

  useEffect(() => {
    fetch("/api/wire/actions")
      .then((r) => r.json())
      .then((data) => {
        if (data.actions?.length) {
          registerAnakinActions(
            data.actions.filter((a: { id: string }) => !a.id.startsWith("wire."))
          );
          setAvailableActions(data.actions);
        } else setAvailableActions(BUILTIN_ACTIONS);
      })
      .catch(() => setAvailableActions(BUILTIN_ACTIONS));
  }, [setAvailableActions]);
}
