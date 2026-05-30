"use client";

import { useCallback, useState } from "react";
import { usePipelineParser } from "@/hooks/usePipelineParser";
import { Spinner } from "@/components/ui/Spinner";
import { ExamplePipelines } from "@/components/composer/ExamplePipelines";
import { DemoPipelines } from "@/components/composer/DemoPipelines";

const PLACEHOLDER_PROMPTS = [
  "Every morning, check my competitor's pricing page, compare it to my Shopify store, and post a Slack message if anything changed.",
  "Monitor Glassdoor reviews and post summaries to Slack",
  "Search LinkedIn for prospects and export to CSV",
];

export function NLInputPanel() {
  const [prompt, setPrompt] = useState(PLACEHOLDER_PROMPTS[0]);
  const [followUp, setFollowUp] = useState("");
  const { parse, status, error, clarification } = usePipelineParser();

  const handleParse = useCallback(() => {
    const text = followUp.trim() || prompt.trim();
    if (!text) return;
    parse(text);
    if (followUp.trim()) setFollowUp("");
  }, [prompt, followUp, parse]);

  const handleExample = useCallback(
    (example: string) => {
      setPrompt(example);
      parse(example);
    },
    [parse]
  );

  return (
    <aside className="cmp-sidebar">
      <div className="cmp-sidebar-scroll">
        <div className="cmp-sidebar-section">
          <h2 className="cmp-panel-title">Describe your workflow</h2>

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={PLACEHOLDER_PROMPTS[0]}
            className="cmp-textarea"
            style={{ minHeight: 120 }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleParse();
            }}
          />

          <button
            type="button"
            onClick={handleParse}
            disabled={!prompt.trim() || status === "loading"}
            className="cmp-parse-btn"
          >
            {status === "loading" ? (
              <>
                <Spinner size="sm" />
                Thinking...
              </>
            ) : (
              "Parse Pipeline"
            )}
          </button>

          {error && <div className="cmp-alert cmp-alert--error">{error}</div>}

          {clarification.needed && clarification.question && (
            <div className="cmp-alert cmp-alert--warn">
              <strong>Clarification needed</strong>
              <p className="mt-2 text-sm">{clarification.question}</p>
              <input
                type="text"
                className="cmp-field-input mt-3 w-full"
                placeholder="Your answer…"
                value={followUp}
                onChange={(e) => setFollowUp(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleParse()}
              />
              <button type="button" className="cmp-btn mt-2 w-full" onClick={handleParse}>
                Submit clarification
              </button>
            </div>
          )}
        </div>

        <ExamplePipelines onSelect={handleExample} />
        <DemoPipelines />
      </div>
    </aside>
  );
}
