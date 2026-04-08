import Link from "next/link";

import { MarketingHeader } from "@/components/layout/MarketingHeader";

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_20%_0%,#0f2038_0%,#090f1b_45%,#050810_100%)] text-slate-100">
      <MarketingHeader />

      <section className="mx-auto flex w-full max-w-4xl flex-col items-center px-6 py-20">
        <h1 className="text-4xl font-semibold">Early Access Pricing</h1>
        <p className="mt-3 text-slate-300">Simple, transparent, and ready for beta teams.</p>

        <article className="mt-10 w-full max-w-lg rounded-2xl border border-cyan-500/35 bg-slate-900/70 p-8 shadow-2xl">
          <p className="text-xs uppercase tracking-[0.16em] text-cyan-200">Beta Plan</p>
          <p className="mt-4 text-5xl font-bold text-cyan-100">$0<span className="text-xl text-slate-300">/mo</span></p>
          <p className="mt-2 text-sm text-slate-300">Free during private beta. Keep all core editor features and cloud sync.</p>

          <ul className="mt-6 space-y-2 text-sm text-slate-200">
            <li>• Unlimited design sessions</li>
            <li>• Real-time cost estimation</li>
            <li>• Project dashboard and cloud storage</li>
          </ul>

          <Link
            href="/register"
            className="mt-7 inline-flex w-full items-center justify-center rounded-lg border border-cyan-400/70 bg-cyan-500/20 px-4 py-2.5 font-medium text-cyan-100 transition hover:bg-cyan-500/30"
          >
            Join Early Access
          </Link>
        </article>
      </section>
    </main>
  );
}
