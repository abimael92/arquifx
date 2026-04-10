"use client";

import { Cuboid, DoorOpen, Eraser, Eye, Hammer, SquareStack } from "lucide-react";

import { useAppStore } from "@/store";
import { BuildMode } from "@/types/project.types";

const modeConfig: { mode: BuildMode; label: string; icon: JSX.Element; description: string }[] = [
  { mode: "view", label: "View", icon: <Eye className="h-5 w-5" />, description: "Navega sin editar" },
  { mode: "build", label: "Build", icon: <Hammer className="h-5 w-5" />, description: "Muros, cuartos y suelos" },
  { mode: "object", label: "Object", icon: <DoorOpen className="h-5 w-5" />, description: "Puertas y ventanas" },
  { mode: "demolish", label: "Demolish", icon: <Eraser className="h-5 w-5" />, description: "Borrar con click o arrastre" },
];

export function ModeSidebar() {
  const mode = useAppStore((state) => state.mode);
  const viewMode = useAppStore((state) => state.viewMode);
  const setMode = useAppStore((state) => state.setMode);
  const setSelectedTool = useAppStore((state) => state.setSelectedTool);
  const openingRailConstrainedThresholdM = useAppStore((state) => state.openingRailConstrainedThresholdM);
  const setOpeningRailConstrainedThresholdM = useAppStore((state) => state.setOpeningRailConstrainedThresholdM);
  const isPlayMode = viewMode === "play";

  if (isPlayMode) {
    return null;
  }

  const handleModeChange = (next: BuildMode) => {
    setMode(next);

    if (next === "build") {
      setSelectedTool("Muros");
      return;
    }

    if (next === "object") {
      setSelectedTool("Puertas");
      return;
    }

    if (next === "demolish") {
      setSelectedTool("Eliminar");
      return;
    }

    setSelectedTool("Seleccionar");
  };

  return (
    <aside className="w-80 shrink-0 border-r border-slate-800 bg-[linear-gradient(180deg,#0d1528_0%,#0a1322_45%,#09101d_100%)] p-5">
      <div className="mb-4 rounded-xl border border-slate-700/80 bg-slate-900/50 p-3">
        <p className="text-xs uppercase tracking-wide text-cyan-200/80">Builder flow</p>
        <h2 className="mt-1 text-sm font-semibold text-slate-100">Modo de juego</h2>
      </div>

      <div className="space-y-2">
        {modeConfig.map((item) => {
          const isActive = mode === item.mode;
          return (
            <button
              key={item.mode}
              type="button"
              onClick={() => handleModeChange(item.mode)}
              title={item.description}
              className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                isActive
                  ? "border-cyan-400/70 bg-cyan-500/20 text-cyan-100"
                  : "border-slate-700 bg-slate-900/45 text-slate-300 hover:border-slate-500"
              }`}
            >
              <span className="flex items-center gap-2 text-sm font-semibold">
                {item.icon}
                {item.label}
              </span>
              <span className="mt-1 block text-xs text-slate-400">{item.description}</span>
            </button>
          );
        })}
      </div>

      {mode === "build" ? (
        <div className="mt-5 rounded-xl border border-slate-700/80 bg-slate-900/50 p-3">
          <p className="mb-2 text-[11px] uppercase tracking-wide text-slate-300">Build tools</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              title="Muros"
              onClick={() => setSelectedTool("Muros")}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950/40 px-2 py-2 text-xs text-slate-200"
            >
              <Cuboid className="h-4 w-4" /> Muros
            </button>
            <button
              type="button"
              title="Suelos"
              onClick={() => setSelectedTool("Suelos")}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950/40 px-2 py-2 text-xs text-slate-200"
            >
              <SquareStack className="h-4 w-4" /> Cuartos
            </button>
          </div>
        </div>
      ) : null}

      {mode === "object" ? (
        <>
          <div className="mt-5 rounded-xl border border-slate-700/80 bg-slate-900/50 p-3">
            <p className="mb-2 text-[11px] uppercase tracking-wide text-slate-300">Object tools</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                title="Puertas"
                onClick={() => setSelectedTool("Puertas")}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950/40 px-2 py-2 text-xs text-slate-200"
              >
                <DoorOpen className="h-4 w-4" /> Puertas
              </button>
              <button
                type="button"
                title="Ventanas"
                onClick={() => setSelectedTool("Ventanas")}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950/40 px-2 py-2 text-xs text-slate-200"
              >
                <DoorOpen className="h-4 w-4" /> Ventanas
              </button>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-slate-700/80 bg-slate-900/50 p-3">
            <p className="mb-2 text-[11px] uppercase tracking-wide text-slate-300">Asistencia de abertura</p>
            <label className="mb-2 block text-xs text-slate-300">Umbral de límite del muro (m)</label>
            <input
              type="range"
              min={0}
              max={0.5}
              step={0.01}
              value={openingRailConstrainedThresholdM}
              onChange={(event) => setOpeningRailConstrainedThresholdM(Number(event.target.value))}
              className="w-full accent-cyan-400"
            />
          </div>
        </>
      ) : null}
    </aside>
  );
}
