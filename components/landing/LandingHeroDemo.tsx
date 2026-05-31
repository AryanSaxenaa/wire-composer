"use client";

import { useEffect, useState } from "react";

const PHASES = [
  { label: "Parse", prompt: "Get GitHub repos for teknium1…" },
  { label: "Run", prompt: "Executing wire.github.user.repos…" },
  { label: "Schedule", prompt: "Daily at 09:00 UTC · saved to library" },
] as const;

const NODES = ["Trigger", "GitHub repos", "Extract logins", "Done"];

export function LandingHeroDemo() {
  const [phase, setPhase] = useState(0);
  const [visibleNodes, setVisibleNodes] = useState(0);

  useEffect(() => {
    const phaseTimer = window.setInterval(() => {
      setPhase((p) => (p + 1) % PHASES.length);
      setVisibleNodes(0);
    }, 4200);
    return () => window.clearInterval(phaseTimer);
  }, []);

  useEffect(() => {
    if (visibleNodes >= NODES.length) return;
    const t = window.setTimeout(() => setVisibleNodes((n) => n + 1), 520);
    return () => window.clearTimeout(t);
  }, [phase, visibleNodes]);

  const current = PHASES[phase];

  return (
    <div className="lp-hero-demo" aria-label="Example automation flow">
      <div className="lp-hero-demo-prompt">
        <span className="lp-hero-demo-phase">{current.label}</span>
        <p className="lp-hero-demo-text" key={current.prompt}>
          {current.prompt}
        </p>
      </div>
      <div className="lp-hero-demo-graph">
        {NODES.map((name, i) => (
          <div key={name} className="lp-hero-demo-node-wrap">
            {i > 0 && (
              <span
                className={`lp-hero-demo-edge ${i <= visibleNodes ? "lp-hero-demo-edge--on" : ""}`}
                aria-hidden
              />
            )}
            <div
              className={`lp-hero-demo-node ${i < visibleNodes ? "lp-hero-demo-node--on" : ""} ${
                i === visibleNodes - 1 && visibleNodes < NODES.length ? "lp-hero-demo-node--pulse" : ""
              }`}
            >
              {name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
