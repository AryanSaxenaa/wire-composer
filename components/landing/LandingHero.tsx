import Link from "next/link";
import { LandingHeroDecor } from "./LandingHeroDecor";

/** Place assets in /public/landing/ — see comment in LandingHeroDecor usage */
const HERO_ASSETS = {
  left: "/landing/S22.png",
  right: "/landing/H2.png",
} as const;

export function LandingHero() {
  return (
    <div className="lp-container lp-hero-inner">
        <LandingHeroDecor src={HERO_ASSETS.left} className="lp-hero-deco lp-hero-deco--left" />
        <LandingHeroDecor src={HERO_ASSETS.right} className="lp-hero-deco lp-hero-deco--right" />

        <div className="lp-hero-content lp-fade-up">
          <p className="lp-pill-badge">
            <span aria-hidden>🚀</span> Ship automations. Not scripts.
          </p>

          <h1 className="lp-hero-h1">
            <span className="lp-hero-h1-line">Build web automations</span><br />
            <span className="lp-hero-h1-line">in <span>plain English</span></span>
          </h1>

          <p className="lp-hero-lead">
            Describe what you want. Get a live pipeline. Wire Composer turns natural
            language into executable multi-step web automation workflows — no code
            required.
          </p>

          <div className="lp-hero-ctas">
            <Link href="/composer" className="lp-btn lp-btn--lg">
              Start Building →
            </Link>
            <Link href="#features" className="lp-btn lp-btn--outline lp-btn--lg">
              Explore Features
            </Link>
          </div>
        </div>
      </div>
  );
}
