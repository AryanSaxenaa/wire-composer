"use client";

import Link from "next/link";
import clsx from "clsx";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  return (
    <aside
      className={clsx(
        "w-14 bg-bg-surface border-r border-border-default flex flex-col items-center py-4 gap-4 flex-shrink-0",
        className
      )}
    >
      <Link
        href="/composer"
        className="text-xs font-bold text-accent-primary font-mono tracking-tight hover:text-accent-hover transition-colors"
      >
        wire
      </Link>
      <Link
        href="/pipelines"
        className="text-[10px] text-text-muted hover:text-text-primary font-mono transition-colors"
      >
        Saved
      </Link>
    </aside>
  );
}
