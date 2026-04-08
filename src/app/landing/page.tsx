import Link from "next/link";
import { CloudCog, Cpu, DollarSign, Layers3, Sparkles } from "lucide-react";

import { MarketingHeader } from "@/components/layout/MarketingHeader";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_15%_0%,#102544_0%,#090f1b_48%,#050810_100%)] text-slate-100">
      <MarketingHeader />

      <section className="mx-auto w-full max-w-7xl px-6 pb-20 pt-14">
        <div className="mb-10 max-w-3xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-cyan-500/35 bg-cyan-500/10 px-4 py-1 text-xs uppercase tracking-[0.16em] text-cyan-200">
            <Sparkles className="h-3.5 w-3.5" />
            Production Beta
          </p>
          <h1 className="mt-5 text-4xl font-semibold leading-tight md:text-6xl">
            Architectural simulation for teams that build fast.
          </h1>
          <p className="mt-4 max-w-2xl text-slate-300 md:text-lg">
            ArquiFX combines real-time 3D design, automated costing and cloud persistence in one high-performance workspace.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/register"
              className="rounded-lg border border-cyan-400/70 bg-cyan-500/20 px-5 py-2.5 text-sm font-medium text-cyan-100 transition hover:bg-cyan-500/30"
            >
              Start Building
            </Link>
            <Link
              href="/pricing"
              className="rounded-lg border border-slate-700 bg-slate-900/65 px-5 py-2.5 text-sm font-medium text-slate-200 transition hover:border-slate-500"
            >
              View Pricing
            </Link>
          </div>
        </div>

        <div className="grid auto-rows-[minmax(170px,1fr)] grid-cols-1 gap-4 md:grid-cols-6">
          <article className="md:col-span-4 md:row-span-2 rounded-2xl border border-slate-700/80 bg-[linear-gradient(145deg,#111f39_0%,#0a1425_70%)] p-6">
            <div className="flex items-center gap-2 text-cyan-200">
              <Cpu className="h-4 w-4" />
              <p className="text-xs uppercase tracking-[0.12em]">WebGL 3D Canvas</p>
            </div>
            <h2 className="mt-3 text-2xl font-semibold">High-fidelity builder with multi-view camera controls</h2>
            <p className="mt-2 max-w-xl text-sm text-slate-300">
              Design in Blueprint, 3D, Top and Realistic view with terrain-aware constraints and smooth camera transitions.
            </p>
            <div className="mt-5 rounded-xl border border-slate-700 bg-slate-950/65 p-3 text-xs text-slate-400">
              Canvas Preview · Live geometry · Snap guides · Precision tools
            </div>
          </article>

          <article className="md:col-span-2 rounded-2xl border border-slate-700/80 bg-[linear-gradient(165deg,#2b1720_0%,#15101c_70%)] p-6">
            <div className="flex items-center gap-2 text-rose-200">
              <DollarSign className="h-4 w-4" />
              <p className="text-xs uppercase tracking-[0.12em]">Live Cost Estimation</p>
            </div>
            <h3 className="mt-3 text-lg font-semibold">Instant budget impact</h3>
            <p className="mt-2 text-sm text-slate-300">Track area, perimeter and estimated cost while drawing walls and rooms.</p>
          </article>

          <article className="md:col-span-2 rounded-2xl border border-slate-700/80 bg-[linear-gradient(165deg,#112133_0%,#0c1725_70%)] p-6">
            <div className="flex items-center gap-2 text-emerald-200">
              <CloudCog className="h-4 w-4" />
              <p className="text-xs uppercase tracking-[0.12em]">Cloud Auto-save</p>
            </div>
            <h3 className="mt-3 text-lg font-semibold">State persistence by default</h3>
            <p className="mt-2 text-sm text-slate-300">Supabase-backed projects with auto-save and secure user-level isolation.</p>
          </article>

          <article className="md:col-span-2 rounded-2xl border border-slate-700/80 bg-slate-900/60 p-6">
            <div className="flex items-center gap-2 text-indigo-200">
              <Layers3 className="h-4 w-4" />
              <p className="text-xs uppercase tracking-[0.12em]">Workflow</p>
            </div>
            <h3 className="mt-3 text-lg font-semibold">Landing → Auth → Dashboard → Editor</h3>
            <p className="mt-2 text-sm text-slate-300">A production-friendly flow designed for professional teams.</p>
          </article>
        </div>
      </section>
    </main>
  );
}
