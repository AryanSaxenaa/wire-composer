"use client";

import { useCallback } from "react";
import { useComposerStore } from "@/lib/store";
import { WireAction } from "@/types";

export function usePipelineParser() {
  const parseStatus = useComposerStore((s) => s.parseStatus);
  const parseError = useComposerStore((s) => s.parseError);
  const clarificationNeeded = useComposerStore((s) => s.clarificationNeeded);
  const clarificationQuestion = useComposerStore((s) => s.clarificationQuestion);
  const availableActions = useComposerStore((s) => s.availableActions);
  const parseNLPrompt = useComposerStore((s) => s.parseNLPrompt);

  const parse = useCallback(
    async (prompt: string, actions?: WireAction[]) => {
      const catalogue =
        actions && actions.length > 0 ? actions : availableActions;
      await parseNLPrompt(prompt, catalogue);
    },
    [parseNLPrompt, availableActions]
  );

  return {
    parse,
    status: parseStatus,
    error: parseError,
    clarification: {
      needed: clarificationNeeded,
      question: clarificationQuestion,
    },
  };
}
