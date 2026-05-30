const RUN_STEPS = [
  "Navigate to pricing page",
  "Extract product data",
  "Compare with store",
  "Send notification",
] as const;

export function LandingFeatureIllustration() {
  return (
    <div className="lp-feature-visual">
      <div className="lp-feature-platform" aria-hidden />
      <div className="lp-feature-window">
        <div className="lp-feature-window-head">
          <span className="lp-feature-dot lp-feature-dot--r" />
          <span className="lp-feature-dot lp-feature-dot--y" />
          <span className="lp-feature-dot lp-feature-dot--g" />
          <span className="lp-feature-window-title">My Automation Pipeline</span>
        </div>
        <div className="lp-feature-window-body">
          <div className="lp-feature-graph">
            <svg viewBox="0 0 280 200" fill="none" aria-hidden>
              <path d="M60 100 H120" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 3" />
              <path d="M160 100 H220" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 3" />
              <path d="M140 60 V80" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 3" />
              <path d="M140 120 V140" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 3" />

              {[
                { cx: 40, cy: 100, label: "Web", fill: "#dbeafe", stroke: "#2563eb" },
                { cx: 140, cy: 40, label: "AI", fill: "#ede9fe", stroke: "#7c3aed" },
                { cx: 140, cy: 100, label: "DB", fill: "#d1fae5", stroke: "#059669" },
                { cx: 140, cy: 160, label: "API", fill: "#ffedd5", stroke: "#ea580c" },
                { cx: 240, cy: 100, label: "Out", fill: "#dbeafe", stroke: "#2563eb" },
              ].map((n) => (
                <g key={n.label}>
                  <circle cx={n.cx} cy={n.cy} r="22" fill={n.fill} stroke={n.stroke} strokeWidth="1.5" />
                  <text
                    x={n.cx}
                    y={n.cy + 4}
                    textAnchor="middle"
                    fill={n.stroke}
                    fontSize="10"
                    fontWeight="600"
                  >
                    {n.label}
                  </text>
                </g>
              ))}
            </svg>
          </div>
          <aside className="lp-feature-sidebar">
            <p className="lp-feature-sidebar-title">Run Details</p>
            <ul className="lp-feature-run-list">
              {RUN_STEPS.map((step) => (
                <li key={step}>
                  <span className="lp-feature-check" aria-hidden>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path
                        d="M2 6l2.5 2.5 5.5-5.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  {step}
                </li>
              ))}
            </ul>
            <p className="lp-feature-status">
              <span className="lp-feature-status-dot" />
              Completed in 4.2s
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}
