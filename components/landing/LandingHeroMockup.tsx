const STEPS = [
  { n: 1, text: "Visit competitor's pricing page", tone: "globe" },
  { n: 2, text: "Extract pricing details", tone: "doc" },
  { n: 3, text: "Compare with my store", tone: "scale" },
  { n: 4, text: "Send Slack notification", tone: "slack" },
] as const;

function StepIcon({ tone }: { tone: (typeof STEPS)[number]["tone"] }) {
  if (tone === "globe") {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <circle cx="7" cy="7" r="5.5" stroke="white" strokeWidth="1.1" />
        <path d="M1.5 7h11M7 1.5c1.5 1.5 1.5 9 0 11M7 1.5c-1.5 1.5-1.5 9 0 11" stroke="white" strokeWidth="1.1" />
      </svg>
    );
  }
  if (tone === "doc") {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M3.5 1.5h4.5l2.5 2.5v8.5H3.5V1.5z" stroke="white" strokeWidth="1.1" />
        <path d="M8 1.5v2.5h2.5M5.5 7h3M5.5 9h2" stroke="white" strokeWidth="1.1" />
      </svg>
    );
  }
  if (tone === "scale") {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M7 2.5v9M4 5.5h6M4.8 9h4.4" stroke="white" strokeWidth="1.1" strokeLinecap="round" />
        <path d="M3 11.5h8" stroke="white" strokeWidth="1.1" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path
        fill="white"
        d="M5.8 2.2v2.2H4a1 1 0 100 2h1.8v2.2a1 1 0 102 0V6.4h2.2a1 1 0 100-2H7.8V2.2a1 1 0 10-2 0zm4.2 4.4v2.2a1 1 0 102 0V8.8h2.2a1 1 0 100-2H10V4.4a1 1 0 10-2 0v2.2H6.8a1 1 0 100 2H10z"
      />
    </svg>
  );
}

export function LandingHeroMockup() {
  return (
    <div className="lp-mockup-area">
      <div className="lp-mockup-deco" aria-hidden>
        <div className="lp-mockup-ring lp-mockup-ring--1" />
        <div className="lp-mockup-ring lp-mockup-ring--2" />
        <div className="lp-mockup-dots" />
        <svg className="lp-mockup-sparkle" width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 2l1.5 5.2L18.5 9l-5.2 1.3L12 15.5l-1.5-5.2L5.5 9l5.2-1.3L12 2z" fill="#3B82F6" />
          <path d="M19 15l.8 2.7L22.5 18l-2.7.7L19 21.5l-.8-2.7L15.5 18l2.7-.7.8-2.7z" fill="#93C5FD" />
        </svg>
      </div>

      <div className="lp-mockup-window">
        <div className="lp-mockup-chrome">
          <span className="lp-dot lp-dot--r" />
          <span className="lp-dot lp-dot--y" />
          <span className="lp-dot lp-dot--g" />
        </div>

        <div className="lp-mockup-bar">
          <p className="lp-mockup-crumb">
            <span className="lp-mockup-crumb-brand">wire</span>
            <span className="lp-mockup-crumb-sep"> / </span>
            Monitor competitor pricing...
          </p>
          <div className="lp-mockup-bar-actions">
            <span className="lp-mockup-pill">Save</span>
            <span className="lp-mockup-pill">Schedule</span>
            <span className="lp-mockup-pill lp-mockup-pill--run">Run</span>
          </div>
        </div>

        <div className="lp-mockup-split">
          <div className="lp-mockup-input-col">
            <p className="lp-mockup-kicker">DESCRIBE YOUR WORKFLOW</p>
            <div className="lp-mockup-textarea">
              Every morning, check my competitor&apos;s pricing page, compare it to
              my Shopify store, and post a Slack message if anything changed.
            </div>
            <button type="button" className="lp-mockup-parse" tabIndex={-1}>
              Parse Pipeline
            </button>
          </div>

          <div className="lp-mockup-flow-col">
            <ol className="lp-mockup-flow">
              {STEPS.map((s) => (
                <li key={s.n} className="lp-mockup-flow-item">
                  <span className={`lp-mockup-flow-icon lp-mockup-flow-icon--${s.tone}`}>
                    <StepIcon tone={s.tone} />
                  </span>
                  <span className="lp-mockup-flow-label">
                    <span className="lp-mockup-flow-num">{s.n}</span> {s.text}
                  </span>
                </li>
              ))}
            </ol>
            <svg className="lp-mockup-bot" viewBox="0 0 40 40" fill="none" aria-hidden>
              <circle cx="20" cy="20" r="18" fill="#1E40AF" />
              <circle cx="14.5" cy="18" r="3" fill="white" />
              <circle cx="25.5" cy="18" r="3" fill="white" />
              <path d="M14 26c2 2.5 10 2.5 12 0" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
