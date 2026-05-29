"use client";

import { useCallback, useState } from "react";
import { useComposerStore } from "@/lib/store";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

const EXAMPLES = [
  "Monitor Glassdoor reviews → post to Slack",
  "Search LinkedIn for prospects → export to Notion",
  "Track competitor prices on Amazon → alert if changed",
  "Read new GitHub issues → create Linear tickets",
  "Scrape job postings → draft applications",
  "Monitor Trustpilot → reply via LinkedIn message",
];

export function NLInputPanel() {
  const [prompt, setPrompt] = useState("");
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

  const handleExample = useCallback((example: string) => {
    setPrompt(example);
  }, []);

  return (
    <div className="flex flex-col h-full bg-bg-surface border-r border-border-default">
      <div className="p-4 border-b border-border-default">
        <h2 className="text-sm font-semibold text-text-primary font-mono tracking-wide uppercase">
          Describe your workflow
        </h2>
      </div>

      <div className="flex-1 flex flex-col p-4 gap-4 overflow-auto">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Every morning, check my competitor's pricing page, compare it to my Shopify store, and post a Slack message if anything changed..."
          className="flex-1 min-h-[120px] max-h-[240px] w-full p-3 rounded-md bg-bg-base border border-border-default text-text-primary text-sm placeholder:text-text-muted resize-none focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-glow font-mono text-xs leading-relaxed"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              handleParse();
            }
          }}
        />

        <Button
          onClick={handleParse}
          disabled={!prompt.trim() || parseStatus === "loading"}
          size="md"
          className="w-full"
        >
          {parseStatus === "loading" ? (
            <>
              <Spinner size="sm" className="mr-2" />
              Thinking...
            </>
          ) : (
            "Parse Pipeline"
          )}
        </Button>

        {parseError && (
          <div className="p-3 rounded-md bg-error/10 border border-error/20">
            <p className="text-xs text-error font-mono">{parseError}</p>
          </div>
        )}

        {clarificationNeeded && clarificationQuestion && (
          <div className="p-3 rounded-md bg-warning/10 border border-warning/30">
            <p className="text-xs text-warning font-medium mb-2">
              Clarification needed
            </p>
            <p className="text-xs text-text-secondary">{clarificationQuestion}</p>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-border-default">
        <p className="text-[10px] text-text-muted font-mono uppercase tracking-wider mb-2">
          Examples
        </p>
        <div className="flex flex-wrap gap-1.5">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => handleExample(ex)}
              className="text-[10px] px-2 py-1.5 rounded bg-bg-subtle text-text-secondary hover:bg-bg-elevated hover:text-text-primary transition-colors text-left font-mono"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
