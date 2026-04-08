import Link from "next/link";
import { Building2 } from "lucide-react";

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/70 bg-slate-950/55 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6">
        <Link href="/landing" className="inline-flex items-center gap-2 text-slate-100">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-400/50 bg-cyan-500/10 text-cyan-300">
            <Building2 className="h-4 w-4" />
          </span>
          <span className="text-sm font-semibold tracking-wide">ArquiFX</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
          <Link href="/pricing" className="hover:text-cyan-300 transition">Pricing</Link>
          <Link href="/terms" className="hover:text-cyan-300 transition">Terms</Link>
          <Link href="/dashboard" className="hover:text-cyan-300 transition">Dashboard</Link>
        </nav>

        <Link
          href="/register"
          className="inline-flex items-center rounded-lg border border-cyan-400/70 bg-cyan-500/20 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-500/30"
        >
          Get Started
        </Link>
      </div>
    </header>
  );
}
