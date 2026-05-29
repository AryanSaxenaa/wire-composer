"use client";

import { useCallback } from "react";
import { useComposerStore } from "@/lib/store";
import { WireAction } from "@/types";

export function usePipelineParser() {
  const parseStatus = useComposerStore((s) => s.parseStatus);
  const parseError = useComposerStore((s) => s.parseError);
  const clarificationNeeded = useComposerStore((s) => s.clarificationNeeded);
  const clarificationQuestion = useComposerStore((s) => s.clarificationQuestion);
  const parseNLPrompt = useComposerStore((s) => s.parseNLPrompt);
  const availableActions = useComposerStore((s) => s.availableActions);

  const parse = useCallback(
    (prompt: string, actions?: WireAction[]) => {
      return parseNLPrompt(prompt, actions || availableActions);
    },
    [parseNLPrompt, availableActions]
  );

  return {
    parse,
    status: parseStatus,
    error: parseError,
    clarificationNeeded,
    clarificationQuestion,
  };
}
