import Link from "next/link";
import type { City } from "@/lib/types";

export function SiteHeader({ city, current }: { city: City; current: "home" | "checks" }) {
  const link = (active: boolean) =>
    `whitespace-nowrap rounded-full px-3 py-1 ${active ? "bg-gold font-semibold text-[#1f1a12]" : "opacity-80 hover:opacity-100"}`;
  return (
    <header className="bg-forest text-forest-ink">
      <nav className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 text-xs sm:text-sm">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <span className="h-3 w-3 rounded-sm bg-gold" aria-hidden="true" />
          {city.name} climate tracker
        </Link>
        <div className="flex gap-1">
          <Link href="/" className={link(current === "home")}>Today</Link>
          <Link href="/how-its-checked" className={link(current === "checks")}>How it&apos;s checked</Link>
        </div>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="kente-stripe" aria-hidden="true" />
      <div className="mx-auto max-w-5xl px-4 py-6 text-xs text-muted">
        Built in Terra Studio. Every action links to its source. Programmes change, so check the source before you act on it.
      </div>
    </footer>
  );
}
