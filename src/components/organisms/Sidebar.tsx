"use client";

import {
  Cuboid,
  DoorOpen,
  Eraser,
  MousePointer2,
  Ruler,
  Square,
  SquareStack,
} from "lucide-react";

import { ToolButton } from "@/components/molecules/ToolButton";
import es from "@/locales/es.json";
import { SelectedTool } from "@/store";

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

export function Sidebar({ selectedTool, onSelectTool }: SidebarProps) {
  return (
    <aside className="w-80 shrink-0 border-r border-slate-800 bg-[linear-gradient(180deg,#0d1528_0%,#0a1322_45%,#09101d_100%)] p-5">
      <div className="mb-4 rounded-xl border border-slate-700/80 bg-slate-900/50 p-3">
        <p className="text-xs uppercase tracking-wide text-cyan-200/80">Modo construir</p>
        <h2 className="mt-1 text-sm font-semibold text-slate-100">{es.sidebar.title}</h2>
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
