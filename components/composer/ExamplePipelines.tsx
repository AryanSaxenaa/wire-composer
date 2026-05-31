"use client";

import { Globe, Code2, Star, Home, TrendingUp } from "lucide-react";
import { CURATED_EXAMPLE_CARDS } from "@/lib/example-prompt-cards";

const ICON_MAP: Record<string, React.ReactNode> = {
  globe: <Globe size={16} />,
  code2: <Code2 size={16} />,
  star: <Star size={16} />,
  home: <Home size={16} />,
  chart: <TrendingUp size={16} />,
};

interface ExamplePipelinesProps {
  onSelect: (text: string) => void;
  disabled?: boolean;
}

export function ExamplePipelines({ onSelect, disabled }: ExamplePipelinesProps) {
  return (
    <div className="cmp-examples">
      <p className="cmp-kicker">EXAMPLES</p>
      <p className="text-[11px] text-[#94a3b8] mb-3 leading-snug">
        Verified Anakin Wire workflows (Polymarket, GitHub, Product Hunt, Airbnb). Click to fill the prompt
        and parse, then set inputs in the inspector and Run.
      </p>
      <div className="cmp-examples-list">
        {(CURATED_EXAMPLE_CARDS ?? []).map((ex) => (
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
            <span className="cmp-example-text">
              {ex.text}
              <span className="block text-[10px] text-[#94a3b8] mt-0.5">
                {ex.stepCount} step{ex.stepCount === 1 ? "" : "s"} · verified
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
