"use client";

import { useState } from "react";
import { LandingFloatingCubes } from "./LandingFloatingCubes";

type LandingHeroDecorProps = {
  src: string;
  className: string;
};

export function LandingHeroDecor({ src, className }: LandingHeroDecorProps) {
  const [useFallback, setUseFallback] = useState(false);

  return (
    <div className={className} aria-hidden>
      {useFallback ? (
        <LandingFloatingCubes className="lp-hero-deco-fallback" count={4} />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          className="lp-hero-deco-img"
          onError={() => setUseFallback(true)}
        />
      )}
    </div>
  );
}
