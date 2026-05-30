import Link from "next/link";
import { LandingFeatureIllustration } from "./LandingFeatureIllustration";
import { LandingFloatingCubes } from "./LandingFloatingCubes";
import { LandingHero } from "./LandingHero";
import { LandingLogo } from "./LandingLogo";

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "/composer", label: "Composer" },
  { href: "/pipelines", label: "Library" },
] as const;

const STEPS = [
  {
    num: "01",
    title: "Parse",
    desc: "Describe your workflow in plain English. Our AI understands intent and maps it to executable steps.",
    iconClass: "lp-step-icon--blue",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M5 9a3 3 0 013-3h8a3 3 0 013 3v4a3 3 0 01-3 3h-4l-3 2.5V16H8a3 3 0 01-3-3V9z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <circle cx="9.5" cy="11" r="0.75" fill="currentColor" />
        <circle cx="12" cy="11" r="0.75" fill="currentColor" />
        <circle cx="14.5" cy="11" r="0.75" fill="currentColor" />
      </svg>
    ),
  },
  {
    num: "02",
    title: "Run",
    desc: "Wire builds and executes your pipeline in real-time. Watch each step complete with live status.",
    iconClass: "lp-step-icon--blue",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M13 3L5 14h6l-1 7 8-11h-6l1-7z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    num: "03",
    title: "Schedule",
    desc: "Deploy on a cron, trigger via webhook, or save to your library. Automations that run when you need them.",
    iconClass: "lp-step-icon--blue",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="4" y="5" width="16" height="15" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M4 9h16M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
] as const;

const FEATURES = [
  {
    title: "Visual Pipeline Builder",
    desc: "See your automation as a connected graph. Edit nodes, inspect outputs, and refine flows visually.",
    iconClass: "lp-feature-icon--blue",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="5" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.3" />
        <circle cx="15" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.3" />
        <circle cx="15" cy="15" r="2.5" stroke="currentColor" strokeWidth="1.3" />
        <path d="M7.5 9l4-2.5M7.5 11l4 2.5" stroke="currentColor" strokeWidth="1.3" />
      </svg>
    ),
  },
  {
    title: "Real-time Execution",
    desc: "Run pipelines step-by-step with live feedback. Retry failures, inspect data, and debug fast.",
    iconClass: "lp-feature-icon--sky",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M11 3L6 11h4l-1 6 5-8h-4l1-6z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "Secure & Scalable",
    desc: "Credentials stay in your browser. Built for reliability with clear error handling at every step.",
    iconClass: "lp-feature-icon--green",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path
          d="M10 2.5L4.5 5v4.5c0 3.2 2.2 6.2 5.5 7.5 3.3-1.3 5.5-4.3 5.5-7.5V5L10 2.5z"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
        <path d="M7.5 10l1.8 1.8 3.7-3.6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Integrations Ready",
    desc: "Connect browsers, APIs, databases, and messaging tools. Extensible action registry for new services.",
    iconClass: "lp-feature-icon--purple",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="3" y="3" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
        <rect x="11" y="3" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
        <rect x="3" y="11" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
        <rect x="11" y="11" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      </svg>
    ),
  },
] as const;

const USE_CASES = [
  {
    title: "Data Enrichment",
    desc: "Scrape, transform, and sync data across tools automatically.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <ellipse cx="11" cy="6" rx="6" ry="2.5" stroke="currentColor" strokeWidth="1.4" />
        <path d="M5 6v8c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5V6" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    ),
  },
  {
    title: "Lead Generation",
    desc: "Monitor sites, extract contacts, and push leads to your CRM.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.4" />
        <path d="M5 19c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Content Automation",
    desc: "Generate, publish, and distribute content on a schedule.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M5 4h12v14H5V4z" stroke="currentColor" strokeWidth="1.4" />
        <path d="M8 8h6M8 11h6M8 14h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Ops & Monitoring",
    desc: "Watch dashboards, alert on changes, and keep systems healthy.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="3" y="4" width="16" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
        <path d="M3 8h16" stroke="currentColor" strokeWidth="1.4" />
        <path d="M7 17h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
] as const;

const FOOTER_COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "#features", label: "Features" },
      { href: "/composer", label: "Composer" },
      { href: "/pipelines", label: "Pipelines" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "https://github.com/your-username/wire-composer", label: "GitHub" },
      { href: "#how-it-works", label: "How it works" },
    ],
  },
] as const;

export function LandingPage() {
  return (
    <div className="lp">
      <section className="lp-hero">
        <div className="lp-hero-pattern" aria-hidden />
        <div className="lp-hero-glow" aria-hidden />
        <div className="lp-hero-fade" aria-hidden />

        <header className="lp-header">
          <div className="lp-container lp-header-row">
            <Link href="/" className="lp-brand">
              <LandingLogo />
              <span>Wire Composer</span>
            </Link>

            <nav className="lp-nav" aria-label="Main">
              {NAV_LINKS.map((item) => (
                <Link key={item.href} href={item.href} className="lp-nav-item">
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="lp-header-actions">
              <Link href="/composer" className="lp-btn lp-btn--sm">
                Get Started →
              </Link>
            </div>
          </div>
        </header>

        <LandingHero />
      </section>

      <section id="how-it-works" className="lp-steps-section lp-grid-section" aria-labelledby="lp-steps-title">
        <div className="lp-container lp-section-center">
          <p className="lp-section-label">HOW IT WORKS</p>
          <h2 id="lp-steps-title" className="lp-section-title">
            From idea to automation
            <br />
            <span>in 3 simple steps</span>
          </h2>
          <div className="lp-steps-row">
            {STEPS.map((step, i) => (
              <div key={step.num} className="lp-steps-flow">
                <article className="lp-step-card">
                  <div className={`lp-step-icon ${step.iconClass}`}>{step.icon}</div>
                  <p className="lp-step-num">{step.num}</p>
                  <h3 className="lp-step-title">{step.title}</h3>
                  <p className="lp-step-desc">{step.desc}</p>
                </article>
                {i < STEPS.length - 1 && (
                  <span className="lp-step-arrow" aria-hidden>
                    →
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="lp-features" aria-labelledby="lp-features-title">
        <div className="lp-container lp-features-grid">
          <div className="lp-features-copy">
            <p className="lp-section-label">POWERFUL BY DESIGN</p>
            <h2 id="lp-features-title" className="lp-section-title lp-section-title--left">
              <span className="lp-section-title-line">Everything you need to build</span>
              <br />
              <span>Reliable Automations</span>
            </h2>
            <ul className="lp-feature-list">
              {FEATURES.map((f) => (
                <li key={f.title} className="lp-feature-item">
                  <span className={`lp-feature-icon ${f.iconClass}`}>{f.icon}</span>
                  <div>
                    <h3 className="lp-feature-item-title">{f.title}</h3>
                    <p className="lp-feature-item-desc">{f.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <LandingFeatureIllustration />
        </div>
      </section>

      <section className="lp-use-cases lp-grid-section lp-grid-section--fade-bottom-none" aria-labelledby="lp-use-cases-title">
        <div className="lp-container lp-section-center">
          <p className="lp-section-label">BUILT FOR EVERYONE</p>
          <h2 id="lp-use-cases-title" className="lp-section-title">
            Use cases <span>that scale</span>
          </h2>
          <div className="lp-use-cases-grid">
            {USE_CASES.map((uc) => (
              <article key={uc.title} className="lp-use-case-card">
                <span className="lp-use-case-icon">{uc.icon}</span>
                <h3 className="lp-use-case-title">{uc.title}</h3>
                <p className="lp-use-case-desc">{uc.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-cta-banner lp-grid-section lp-grid-section--fade-top-none" aria-labelledby="lp-cta-title">
        <div className="lp-container">
          <div className="lp-cta-inner">
            <div className="lp-cta-text">
              <h2 id="lp-cta-title" className="lp-cta-title">
                Ready to build your first automation?
              </h2>
              <p className="lp-cta-desc">
                Join builders shipping workflows in minutes, not days.
              </p>
            </div>
            <div className="lp-cta-action">
              <Link href="/composer" className="lp-btn lp-btn--lg">
                Start Building →
              </Link>
            </div>
            <img src="/landing/H2.png" alt="" className="lp-cta-cubes" />
          </div>
        </div>
      </section>

      <footer className="lp-footer lp-grid-section">
        <div className="lp-container">
          <div className="lp-footer-top">
            <div className="lp-footer-brand">
              <Link href="/" className="lp-brand">
                <LandingLogo />
                <span>Wire Composer</span>
              </Link>
              <p className="lp-footer-tagline">
                Build web automations in plain English.
              </p>
              <div className="lp-footer-social">
                <a href="#" aria-label="Twitter">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
                    <path d="M14.2 4.5h-1.4l-3.1 3.5L7.2 4.5H3.5l4.8 5.5-5.1 5.5h1.4l3.4-3.9 2.5 3.9h3.7l-5-5.7 5.4-5.3z" />
                  </svg>
                </a>
                <a href="#" aria-label="GitHub">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M9 1.5C4.86 1.5 1.5 4.86 1.5 9c0 3.74 2.42 6.9 5.78 8.02.42.08.58-.18.58-.4v-1.4c-2.35.52-2.84-1.13-2.84-1.13-.38-.97-.94-1.23-.94-1.23-.77-.53.06-.52.06-.52.85.06 1.3.88 1.3.88.76 1.3 2 .92 2.48.7.08-.55.3-.92.54-1.13-1.88-.21-3.85-.94-3.85-4.18 0-.92.33-1.68.88-2.27-.09-.22-.38-1.12.08-2.33 0 0 .72-.23 2.36.87a8.2 8.2 0 012.16-.29c.73 0 1.47.1 2.16.29 1.64-1.1 2.36-.87 2.36-.87.46 1.21.17 2.11.08 2.33.55.59.88 1.35.88 2.27 0 3.25-1.98 3.97-3.86 4.17.3.26.58.78.58 1.57v2.33c0 .22.16.49.58.4A6.51 6.51 0 0016.5 9c0-4.14-3.36-7.5-7.5-7.5z"
                    />
                  </svg>
                </a>
                <a href="#" aria-label="LinkedIn">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
                    <path d="M4.5 2.25A1.5 1.5 0 103 3.75 1.5 1.5 0 004.5 2.25zM3 6.75h3v9.75H3V6.75zm4.5 0h2.88v1.34h.04c.4-.76 1.38-1.56 2.84-1.56 3.04 0 3.6 2 3.6 4.6v5.37H10.5v-4.76c0-1.14-.02-2.6-1.58-2.6-1.58 0-1.82 1.24-1.82 2.52v4.84H7.5V6.75z" />
                  </svg>
                </a>
              </div>
            </div>
            {FOOTER_COLUMNS.map((col) => (
              <div key={col.title} className="lp-footer-col">
                <p className="lp-footer-col-title">{col.title}</p>
                <ul>
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link href={link.href}>{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="lp-footer-copy">© {new Date().getFullYear()} Wire Composer. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
