"use client";

import { ReactNode } from "react";

interface ToolButtonProps {
  icon: ReactNode;
  label: string;
  hint?: string;
  active?: boolean;
  onClick: () => void;
}

export function ToolButton({ icon, label, hint, active = false, onClick }: ToolButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group w-full rounded-xl border px-3 py-3 text-left transition-all duration-150 ${
        active
          ? "border-cyan-400/70 bg-cyan-500/15 shadow-[0_0_0_1px_rgba(34,211,238,0.35)]"
          : "border-slate-700/70 bg-slate-900/55 hover:border-slate-500/80 hover:bg-slate-800/70"
      }`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border text-slate-100 ${
            active
              ? "border-cyan-300/60 bg-cyan-400/20"
              : "border-slate-600/80 bg-slate-800/70 group-hover:border-slate-500"
          }`}
        >
          {icon}
        </span>
        <div className="min-w-0">
          <p className={`truncate text-sm font-semibold ${active ? "text-cyan-100" : "text-slate-100"}`}>{label}</p>
          {hint ? <p className="truncate text-xs text-slate-400">{hint}</p> : null}
        </div>
      </div>
    </button>
  );
}
