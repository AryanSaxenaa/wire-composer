import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import "./composer.css";

export default function NotFound() {
  return (
    <div className="composer-app">
      <main className="cmp-page-main cmp-page-center" style={{ flex: 1 }}>
        <Logo size={40} />
        <h1 className="text-xl font-semibold mt-4">Page not found</h1>
        <p className="text-sm text-[#64748b] mt-2 max-w-sm text-center">
          This route does not exist. Open the composer or your saved pipeline library.
        </p>
        <div className="flex gap-2 mt-6">
          <Link href="/composer" className="cmp-btn cmp-btn--primary">
            Open composer
          </Link>
          <Link href="/pipelines" className="cmp-btn">
            Library
          </Link>
          <Link href="/" className="cmp-btn">
            Home
          </Link>
        </div>
      </main>
    </div>
  );
}
