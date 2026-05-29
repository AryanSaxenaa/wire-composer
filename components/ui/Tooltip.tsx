"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import clsx from "clsx";

interface TooltipProps {
  content: string;
  children: ReactNode;
  className?: string;
}

export function Tooltip({ content, children, className }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const show = () => setVisible(true);
    const hide = () => setVisible(false);
    el.addEventListener("mouseenter", show);
    el.addEventListener("mouseleave", hide);
    el.addEventListener("focus", show);
    el.addEventListener("blur", hide);
    return () => {
      el.removeEventListener("mouseenter", show);
      el.removeEventListener("mouseleave", hide);
      el.removeEventListener("focus", show);
      el.removeEventListener("blur", hide);
    };
  }, []);

  return (
    <div ref={ref} className={clsx("relative inline-block", className)}>
      {children}
      {visible && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 rounded bg-bg-elevated border border-border-strong text-[10px] text-text-secondary font-mono whitespace-nowrap z-50 pointer-events-none">
          {content}
        </div>
      )}
    </div>
  );
}
