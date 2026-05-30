"use client";

import { useEffect } from "react";
import { useComposerStore } from "@/lib/store";
import { ACTION_REGISTRY } from "@/lib/action-registry";

export function useWireActions() {
  const setAvailableActions = useComposerStore((s) => s.setAvailableActions);

  useEffect(() => {
    fetch("/api/wire/actions")
      .then((r) => r.json())
      .then((data) => {
        if (data.actions?.length) setAvailableActions(data.actions);
        else setAvailableActions(ACTION_REGISTRY);
      })
      .catch(() => setAvailableActions(ACTION_REGISTRY));
  }, [setAvailableActions]);
}
