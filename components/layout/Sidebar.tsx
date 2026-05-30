"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/ui/Logo";

const NAV = [
  { href: "/composer", label: "Composer" },
  { href: "/pipelines", label: "Pipelines" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="cmp-app-sidebar">
      <Link href="/" className="cmp-app-sidebar-brand">
        <Logo size={28} />
        <span>wire</span>
      </Link>
      <nav className="cmp-app-sidebar-nav">
        {NAV.map((item) => {
          const active =
            pathname === item.href || pathname?.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={active ? "cmp-app-sidebar-link cmp-app-sidebar-link--active" : "cmp-app-sidebar-link"}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
