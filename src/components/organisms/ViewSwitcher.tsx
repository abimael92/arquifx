"use client";

import { Eye, Gamepad2, Layers, Map, Sun } from "lucide-react";

import { useAppStore } from "@/store";
import { ViewMode } from "@/types/project.types";

const viewConfig: { mode: ViewMode; label: string; icon: JSX.Element }[] = [
  { mode: "blueprint", label: "Blueprint", icon: <Map className="h-4 w-4" /> },
  { mode: "3d", label: "3D", icon: <Eye className="h-4 w-4" /> },
  { mode: "top", label: "Top", icon: <Layers className="h-4 w-4" /> },
  { mode: "realistic", label: "Realistic", icon: <Sun className="h-4 w-4" /> },
  { mode: "play", label: "Play", icon: <Gamepad2 className="h-4 w-4" /> },
];

export function ViewSwitcher() {
  const viewMode = useAppStore((state) => state.viewMode);
  const setViewMode = useAppStore((state) => state.setViewMode);
  const cameraControlMode = useAppStore((state) => state.cameraControlMode);
  const setCameraControlMode = useAppStore((state) => state.setCameraControlMode);

  return (
    <div className="absolute left-5 top-5 z-20 flex items-center gap-3 rounded-xl border border-slate-700/80 bg-slate-900/70 p-2 backdrop-blur">
      <div className="flex items-center gap-1">
        {viewConfig.map(({ mode, label, icon }) => {
          const active = viewMode === mode;
          return (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs transition ${
                active
                  ? "border-cyan-400/70 bg-cyan-500/15 text-cyan-100"
                  : "border-slate-700 bg-slate-950/60 text-slate-300 hover:border-slate-500"
              }`}
            >
              {icon}
              {label}
            </button>
          );
        })}
      </div>

      <div className="h-5 w-px bg-slate-700/90" />

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setCameraControlMode("orbit")}
          className={`rounded-md border px-2 py-1 text-xs transition ${
            cameraControlMode === "orbit"
              ? "border-indigo-400/70 bg-indigo-500/15 text-indigo-100"
              : "border-slate-700 bg-slate-950/60 text-slate-300 hover:border-slate-500"
          }`}
        >
          Orbit
        </button>
        <button
          type="button"
          onClick={() => setCameraControlMode("free")}
          className={`rounded-md border px-2 py-1 text-xs transition ${
            cameraControlMode === "free"
              ? "border-indigo-400/70 bg-indigo-500/15 text-indigo-100"
              : "border-slate-700 bg-slate-950/60 text-slate-300 hover:border-slate-500"
          }`}
        >
          Free
        </button>
      </div>
    </div>
  );
}
