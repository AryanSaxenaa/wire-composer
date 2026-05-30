"use client";

interface ExamplePipelinesProps {
  onSelect: (text: string) => void;
}

const EXAMPLES: { text: string; icon: string; tone: string }[] = [
  { text: "Monitor Glassdoor reviews → post to Slack", icon: "🌐", tone: "blue" },
  { text: "Search LinkedIn for prospects → export to CSV", icon: "in", tone: "purple" },
  { text: "Track competitor prices on Amazon → alert if changed", icon: "a", tone: "orange" },
  { text: "Read new GitHub issues → create Jira tickets", icon: "⌘", tone: "gray" },
  { text: "Scrape job postings → draft applications", icon: "📋", tone: "green" },
  { text: "Monitor Trustpilot → reply via LinkedIn message", icon: "★", tone: "pink" },
];

export function ExamplePipelines({ onSelect }: ExamplePipelinesProps) {
  return (
    <div className="cmp-examples">
      <p className="cmp-kicker">EXAMPLES</p>
      <p className="text-[11px] text-[#94a3b8] mb-3 leading-snug">
        Click an example to fill the prompt and parse immediately.
      </p>
      <div className="cmp-examples-list">
        {EXAMPLES.map((ex) => (
          <button
            key={ex.text}
            type="button"
            onClick={() => onSelect(ex.text)}
            className="cmp-example-card"
          >
            <span className={`cmp-example-icon cmp-example-icon--${ex.tone}`}>
              {ex.icon === "in" ? (
                <span style={{ fontSize: 11, fontWeight: 800, color: "#0a66c2" }}>in</span>
              ) : (
                ex.icon
              )}
            </span>
            <span className="cmp-example-text">{ex.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
