"use client";

import {
  BoxSelect,
  Cuboid,
  DoorOpen,
  Eraser,
  Eye,
  EyeOff,
  Hammer,
  Layers3,
  MousePointer2,
  Plus,
  Ruler,
  Square,
  SquareStack,
} from "lucide-react";

import { ToolButton } from "@/components/molecules/ToolButton";
import es from "@/locales/es.json";
import { SelectedTool, useAppStore } from "@/store";
import { BuildMode } from "@/types/project.types";

interface SidebarProps {
  selectedTool: SelectedTool;
  onSelectTool: (tool: SelectedTool) => void;
}

const toolConfig: { tool: SelectedTool; icon: JSX.Element; hint: string }[] = [
  { tool: "Seleccionar", icon: <MousePointer2 className="h-4 w-4" />, hint: "Mover y editar" },
  { tool: "Muros", icon: <Cuboid className="h-4 w-4" />, hint: "Click y arrastra" },
  { tool: "Suelos", icon: <SquareStack className="h-4 w-4" />, hint: "Cerrar recintos" },
  { tool: "Puertas", icon: <DoorOpen className="h-4 w-4" />, hint: "Colocar en muro" },
  { tool: "Ventanas", icon: <Square className="h-4 w-4" />, hint: "Snap automático" },
  { tool: "Medir", icon: <Ruler className="h-4 w-4" />, hint: "Distancia en vivo" },
  { tool: "Eliminar", icon: <Eraser className="h-4 w-4" />, hint: "Borrar selección" },
];

const modeConfig: { mode: BuildMode; label: string; icon: JSX.Element }[] = [
  { mode: "build", label: "Construir", icon: <Hammer className="h-4 w-4" /> },
  { mode: "object", label: "Objetos", icon: <DoorOpen className="h-4 w-4" /> },
  { mode: "select", label: "Seleccionar", icon: <BoxSelect className="h-4 w-4" /> },
  { mode: "demolish", label: "Demoler", icon: <Eraser className="h-4 w-4" /> },
];

export function Sidebar({ selectedTool, onSelectTool }: SidebarProps) {
  const activeMode = useAppStore((state) => state.activeMode);
  const activeBuildSubtool = useAppStore((state) => state.activeBuildSubtool);
  const activeObjectType = useAppStore((state) => state.activeObjectType);
  const setActiveMode = useAppStore((state) => state.setActiveMode);
  const levels = useAppStore((state) => state.levels);
  const activeLevelId = useAppStore((state) => state.activeLevelId);
  const setActiveLevel = useAppStore((state) => state.setActiveLevel);
  const toggleLevelVisibility = useAppStore((state) => state.toggleLevelVisibility);
  const addLevel = useAppStore((state) => state.addLevel);

  const handleSelectMode = (mode: BuildMode) => {
    setActiveMode(mode);

    if (mode === "build") {
      onSelectTool(activeBuildSubtool === "room" ? "Suelos" : "Muros");
      return;
    }

    if (mode === "object") {
      onSelectTool(activeObjectType === "ventana" ? "Ventanas" : "Puertas");
      return;
    }

    if (mode === "demolish") {
      onSelectTool("Eliminar");
      return;
    }

    onSelectTool("Seleccionar");
  };

  return (
    <aside className="w-80 shrink-0 border-r border-slate-800 bg-[linear-gradient(180deg,#0d1528_0%,#0a1322_45%,#09101d_100%)] p-5">
      <div className="mb-4 rounded-xl border border-slate-700/80 bg-slate-900/50 p-3">
        <p className="text-xs uppercase tracking-wide text-cyan-200/80">Modo construir</p>
        <h2 className="mt-1 text-sm font-semibold text-slate-100">{es.sidebar.title}</h2>
      </div>

      <div className="mb-4 rounded-xl border border-slate-700/80 bg-slate-900/50 p-3">
        <p className="mb-2 text-[11px] uppercase tracking-wide text-slate-300">Modo de juego</p>
        <div className="grid grid-cols-2 gap-2">
          {modeConfig.map(({ mode, label, icon }) => {
            const isActive = activeMode === mode;
            return (
              <button
                key={mode}
                type="button"
                onClick={() => handleSelectMode(mode)}
                className={`flex items-center gap-2 rounded-lg border px-2 py-2 text-xs transition ${
                  isActive
                    ? "border-cyan-400/70 bg-cyan-500/15 text-cyan-100"
                    : "border-slate-700 bg-slate-950/40 text-slate-300 hover:border-slate-500"
                }`}
              >
                {icon}
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-4 rounded-xl border border-slate-700/80 bg-slate-900/50 p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[11px] uppercase tracking-wide text-slate-300">Niveles</p>
          <button
            type="button"
            onClick={() => addLevel()}
            className="inline-flex items-center gap-1 rounded-md border border-slate-600 px-2 py-1 text-[11px] text-slate-200 hover:border-cyan-400/70 hover:text-cyan-100"
          >
            <Plus className="h-3.5 w-3.5" />
            Añadir
          </button>
        </div>

        <div className="space-y-1.5">
          {levels.map((level) => {
            const isActive = level.id === activeLevelId;
            return (
              <div
                key={level.id}
                className={`flex items-center justify-between rounded-lg border px-2 py-1.5 text-xs ${
                  isActive
                    ? "border-cyan-400/70 bg-cyan-500/10 text-cyan-100"
                    : "border-slate-700 bg-slate-950/40 text-slate-300"
                }`}
              >
                <button type="button" className="flex items-center gap-2" onClick={() => setActiveLevel(level.id)}>
                  <Layers3 className="h-3.5 w-3.5" />
                  <span>{level.name}</span>
                </button>

                <button
                  type="button"
                  onClick={() => toggleLevelVisibility(level.id)}
                  className="rounded p-1 text-slate-300 hover:bg-slate-700/40 hover:text-slate-100"
                  aria-label={level.visible ? `Ocultar ${level.name}` : `Mostrar ${level.name}`}
                >
                  {level.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-2">
        {toolConfig.map(({ tool, icon, hint }) => (
          <ToolButton
            key={tool}
            icon={icon}
            label={es.tools[tool]}
            hint={hint}
            active={selectedTool === tool}
            onClick={() => onSelectTool(tool)}
          />
        ))}
      </div>
    </aside>
  );
}
