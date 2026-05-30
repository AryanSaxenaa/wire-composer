import Link from "next/link";
import { LandingLogo } from "@/components/landing/LandingLogo";

interface AppHeaderProps {
  title: string;
  action?: React.ReactNode;
}

export function AppHeader({ title, action }: AppHeaderProps) {
  return (
    <header className="cmp-topbar">
      <div className="cmp-topbar-left">
        <Link href="/" className="cmp-topbar-brand">
          <LandingLogo />
          <span>wire</span>
        </Link>
        <div className="cmp-topbar-divider" />
        <nav className="cmp-topbar-crumb" aria-label="Breadcrumb">
          <Link href="/composer" className="cmp-topbar-crumb-brand hover:underline">
            Composer
          </Link>
          <span>/</span>
          <span>{title}</span>
        </nav>
      </div>
      {action && <div className="cmp-topbar-actions">{action}</div>}
    </header>
  );
}
