"use client";

import { Globe, Code2, Star, Home } from "lucide-react";

const ICON_MAP: Record<string, React.ReactNode> = {
  globe: <Globe size={16} />,
  code2: <Code2 size={16} />,
  star: <Star size={16} />,
  home: <Home size={16} />,
};

interface ExamplePipelinesProps {
  onSelect: (text: string) => void;
  disabled?: boolean;
}

const EXAMPLES: { text: string; icon: string; tone: string }[] = [
  { text: "List public GitHub repos for user teknium1", icon: "code2", tone: "gray" },
  { text: "Search GitHub developers → list their repos", icon: "code2", tone: "gray" },
  { text: "Product Hunt trending → load launch details", icon: "star", tone: "pink" },
  { text: "Search Airbnb listings → get listing details", icon: "home", tone: "green" },
  { text: "Get GitHub profile then list repositories", icon: "code2", tone: "gray" },
  { text: "Search GitHub users and load profile details", icon: "code2", tone: "gray" },
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
