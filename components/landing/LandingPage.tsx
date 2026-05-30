import Link from "next/link";
import { LandingHeroMockup } from "./LandingHeroMockup";
import { LandingLogo } from "./LandingLogo";

const STEPS = [
  {
    num: "1. Describe",
    desc: "Explain what you want to automate in plain English.",
    iconClass: "lp-step-icon--purple",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M4 7a2 2 0 012-2h10a2 2 0 012 2v5a2 2 0 01-2 2h-5l-4 3v-3H6a2 2 0 01-2-2V7z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <circle cx="8.5" cy="9.5" r="0.9" fill="currentColor" />
        <circle cx="11" cy="9.5" r="0.9" fill="currentColor" />
        <circle cx="13.5" cy="9.5" r="0.9" fill="currentColor" />
      </svg>
    ),
  },
  {
    num: "2. Run",
    desc: "Wire builds and executes your workflow in real-time.",
    iconClass: "lp-step-icon--green",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="8.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M9.5 8.5v5l4-2.5-4-2.5z" fill="currentColor" />
      </svg>
    ),
  },
  {
    num: "3. Save",
    desc: "Save pipelines to your workspace and open them anytime from the library.",
    iconClass: "lp-step-icon--orange",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M5 19V7l6-4 6 4v12H5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M9 19v-6h4v6" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
] as const;

export function LandingPage() {
  return (
    <div className="lp">
      <header className="lp-header">
        <div className="lp-container lp-header-row">
          <Link href="/" className="lp-brand">
            <LandingLogo />
            <span>wire</span>
          </Link>

          <nav className="lp-nav" aria-label="Main">
            <Link href="/composer" className="lp-nav-item">Composer</Link>
            <Link href="/pipelines" className="lp-nav-item">Pipelines</Link>
          </nav>

          <div className="lp-header-actions">
            <Link href="/composer" className="lp-btn lp-btn--sm">
              Open Composer
            </Link>
          </div>
        </div>
      </header>

      <section className="lp-hero">
        <div className="lp-hero-bg" aria-hidden />
        <div className="lp-container lp-hero-grid">
          <div className="lp-hero-text">
            <p className="lp-pill-badge">
              <span aria-hidden>✨</span> From idea to automation. In plain English.
            </p>

            <h1 className="lp-hero-h1">
              Build web automations
              <br />
              <span>in plain English.</span>
            </h1>

            <p className="lp-hero-lead">
              Wire Composer turns natural language into executable multi-step web
              automation workflows — no code required.
            </p>

            <div className="lp-hero-ctas">
              <Link href="/composer" className="lp-btn lp-btn--lg">
                Start Building for Free →
              </Link>
              <Link href="/pipelines" className="lp-btn lp-btn--outline">
                View saved pipelines
              </Link>
            </div>

            <ul className="lp-trust">
              <li>
                <span className="lp-trust-dot lp-trust-dot--purple">
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <path d="M2 7l2.5 2.5 6-6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                No coding required
              </li>
              <li>
                <span className="lp-trust-dot lp-trust-dot--green">
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <path d="M7 1.5L3 7.5h3L6 11.5 10 7.5H7l.5-6z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
                  </svg>
                </span>
                Real-time execution
              </li>
              <li>
                <span className="lp-trust-dot lp-trust-dot--orange">
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <path d="M6.5 1.5L2.5 4v3.5c0 2.5 1.6 4.5 4 5.5 2.4-1 4-3 4-5.5V4L6.5 1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
                  </svg>
                </span>
                Credentials stay in your browser
              </li>
            </ul>
          </div>

          <LandingHeroMockup />
        </div>
      </section>

      <section className="lp-steps-section" aria-labelledby="lp-steps-title">
        <div className="lp-container">
          <h2 id="lp-steps-title" className="lp-steps-heading">
            From idea to automation in 3 simple steps
          </h2>
          <div className="lp-steps-row">
            <div className="lp-steps-line" aria-hidden />
            {STEPS.map((step) => (
              <article key={step.num} className="lp-step-card">
                <div className={`lp-step-icon ${step.iconClass}`}>{step.icon}</div>
                <p className="lp-step-copy">
                  <strong>{step.num}</strong>
                  <span className="lp-step-sep"> — </span>
                  {step.desc}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
