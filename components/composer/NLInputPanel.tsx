"use client";

import { useCallback, useState } from "react";
import { usePipelineParser } from "@/hooks/usePipelineParser";
import { Spinner } from "@/components/ui/Spinner";
import { ExamplePipelines } from "@/components/composer/ExamplePipelines";
import { useComposerStore } from "@/lib/store";

const PLACEHOLDER_PROMPTS = [
  "List public GitHub repositories for user teknium1.",
  "Search GitHub for developers with 1000+ followers, then list their repos.",
  "Search Airbnb in San Francisco and get details for the first listing.",
];

export function NLInputPanel() {
  const [prompt, setPrompt] = useState(PLACEHOLDER_PROMPTS[0]);
  const [followUp, setFollowUp] = useState("");
  const { parse, status, error, clarification } = usePipelineParser();
  const pipeline = useComposerStore((s) => s.pipeline);
  const parseReasoning = useComposerStore((s) => s.parseReasoning);
  const openConfirm = useComposerStore((s) => s.openConfirm);

  const handleParse = useCallback(() => {
    const text = followUp.trim() || prompt.trim();
    if (!text) return;
    parse(text);
    if (followUp.trim()) setFollowUp("");
  }, [prompt, followUp, parse]);

  const handleExample = useCallback(
    (example: string) => {
      const replacedExisting = !!(pipeline && pipeline.nodes.length > 0);
      const runParse = () => {
        setPrompt(example);
        parse(example);

        if (typeof pendo !== "undefined") {
          pendo.track("example_pipeline_selected", {
            exampleText: example.substring(0, 200),
            replacedExisting,
          });
        }
      };
      if (replacedExisting) {
        openConfirm({
          title: "Replace pipeline?",
          message: "Parsing this example will replace your current canvas.",
          confirmLabel: "Replace",
          variant: "danger",
          onConfirm: runParse,
        });
        return;
      }
      runParse();
    },
    [parse, pipeline, openConfirm]
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

          {status === "success" && parseReasoning && (
            <details className="cmp-parse-reasoning mt-3">
              <summary className="text-sm font-medium cursor-pointer">
                Why this pipeline?
              </summary>
              <p className="mt-2 text-sm text-[var(--cmp-muted)]">{parseReasoning}</p>
            </details>
          )}

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

        <ExamplePipelines onSelect={handleExample} disabled={status === "loading"} />
      </div>
    </aside>
  );
}
