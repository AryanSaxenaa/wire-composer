"use client";

import { useEffect } from "react";
import { ComposerLayout } from "@/components/composer/ComposerLayout";
import { useComposerStore } from "@/lib/store";

export default function ComposerPage() {
  const setAvailableActions = useComposerStore((s) => s.setAvailableActions);

  useEffect(() => {
    fetch("/api/wire/actions")
      .then((r) => r.json())
      .then((data) => {
        if (data.actions) setAvailableActions(data.actions);
      })
      .catch(() => {});
  }, [setAvailableActions]);

  return <ComposerLayout />;
}
