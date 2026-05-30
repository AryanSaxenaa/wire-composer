"use client";

import { useState } from "react";

type LandingHeroDecorProps = {
  src: string;
  className: string;
};

export function LandingHeroDecor({ src, className }: LandingHeroDecorProps) {
  const [visible, setVisible] = useState(true);

  return (
    <div className={className} aria-hidden data-asset={src}>
      {visible ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          className="lp-hero-deco-img"
          onError={() => setVisible(false)}
        />
      ) : null}
    </div>
  );
}
