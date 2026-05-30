"use client";

import { useCallback, useState } from "react";
import { useComposerStore } from "@/lib/store";
import { Spinner } from "@/components/ui/Spinner";
import { ExamplePipelines } from "@/components/composer/ExamplePipelines";

const DEFAULT_PROMPT =
  "Every morning, check my competitor's pricing page, compare it to my Shopify store, and post a Slack message if anything changed.";

export function NLInputPanel() {
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const parseNLPrompt = useComposerStore((s) => s.parseNLPrompt);
  const parseStatus = useComposerStore((s) => s.parseStatus);
  const parseError = useComposerStore((s) => s.parseError);
  const clarificationNeeded = useComposerStore((s) => s.clarificationNeeded);
  const clarificationQuestion = useComposerStore((s) => s.clarificationQuestion);
  const availableActions = useComposerStore((s) => s.availableActions);

  const handleParse = useCallback(() => {
    if (!prompt.trim()) return;
    parseNLPrompt(prompt.trim(), availableActions);
  }, [prompt, parseNLPrompt, availableActions]);

  const handleExample = useCallback(
    (example: string) => {
      setPrompt(example);
      parseNLPrompt(example, availableActions);
    },
    [parseNLPrompt, availableActions]
  );

  return (
    <aside className="cmp-sidebar">
      <div className="cmp-sidebar-scroll">
        <div className="cmp-sidebar-section">
          <p className="cmp-kicker">
            <span aria-hidden>✨</span> DESCRIBE YOUR WORKFLOW
          </p>

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={DEFAULT_PROMPT}
            className="cmp-textarea"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleParse();
            }}
          />

          <button
            type="button"
            onClick={handleParse}
            disabled={!prompt.trim() || parseStatus === "loading"}
            className="cmp-parse-btn"
          >
            {parseStatus === "loading" ? (
              <>
                <Spinner size="sm" />
                Thinking...
              </>
            ) : (
              <>
                <span aria-hidden>✨</span> Parse Pipeline
              </>
            )}
          </button>

          {parseError && <div className="cmp-alert cmp-alert--error">{parseError}</div>}

          {clarificationNeeded && clarificationQuestion && (
            <div className="cmp-alert cmp-alert--warn">
              <strong>Clarification needed</strong>
              <br />
              {clarificationQuestion}
            </div>
          )}
        </div>

        <ExamplePipelines onSelect={handleExample} />
      </div>
    </aside>
  );
}
