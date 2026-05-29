"use client";

interface ExamplePipelinesProps {
  onSelect: (text: string) => void;
}

const EXAMPLES = [
  "Monitor Glassdoor reviews → post to Slack",
  "Search LinkedIn for prospects → export to CSV",
  "Track competitor prices on Amazon → alert if changed",
  "Read new GitHub issues → create Linear tickets",
  "Scrape job postings → draft applications",
  "Monitor Trustpilot → reply via LinkedIn message",
];

export function ExamplePipelines({ onSelect }: ExamplePipelinesProps) {
  return (
    <div className="p-4 border-t border-border-default">
      <p className="text-[10px] text-text-muted font-mono uppercase tracking-wider mb-2">
        Examples
      </p>
      <div className="flex flex-wrap gap-1.5">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            onClick={() => onSelect(ex)}
            className="text-[10px] px-2 py-1.5 rounded bg-bg-subtle text-text-secondary hover:bg-bg-elevated hover:text-text-primary transition-colors text-left font-mono"
          >
            {ex}
          </button>
        ))}
      </div>
    </div>
  );
}
