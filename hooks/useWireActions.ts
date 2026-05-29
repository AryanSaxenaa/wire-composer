"use client";

import { useEffect, useState } from "react";
import { WireAction } from "@/types";

export function useWireActions() {
  const [actions, setActions] = useState<WireAction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/wire/actions")
      .then((r) => r.json())
      .then((data) => {
        if (data.actions) setActions(data.actions);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { actions, loading };
}
