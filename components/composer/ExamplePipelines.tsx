"use client";

import { Globe, ClipboardList, Code2, Star } from "lucide-react";

const ICON_MAP: Record<string, React.ReactNode> = {
  globe: <Globe size={16} />,
  clipboard: <ClipboardList size={16} />,
  code2: <Code2 size={16} />,
  star: <Star size={16} />,
  in: <span style={{ fontSize: 11, fontWeight: 800, color: "#0a66c2" }}>in</span>,
  a: <span style={{ fontSize: 13, fontWeight: 700 }}>a</span>,
};

interface ExamplePipelinesProps {
  onSelect: (text: string) => void;
  disabled?: boolean;
}

const EXAMPLES: { text: string; icon: string; tone: string }[] = [
  { text: "Search GitHub developers → list their repos", icon: "code2", tone: "gray" },
  { text: "Monitor r/programming hot posts → extract titles", icon: "globe", tone: "blue" },
  { text: "Product Hunt trending → load launch details", icon: "star", tone: "pink" },
  { text: "Track Amazon ASIN price → fetch reviews if low", icon: "a", tone: "orange" },
  { text: "Search Airbnb listings → get listing details", icon: "globe", tone: "green" },
  { text: "Trustpilot 1-star reviews → draft AI replies", icon: "clipboard", tone: "purple" },
];

export function ExamplePipelines({ onSelect, disabled }: ExamplePipelinesProps) {
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
            disabled={disabled}
            className="cmp-example-card"
          >
            <span className={`cmp-example-icon cmp-example-icon--${ex.tone}`}>
              {ICON_MAP[ex.icon] ?? ex.icon}
            </span>
            <span className="cmp-example-text">{ex.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
