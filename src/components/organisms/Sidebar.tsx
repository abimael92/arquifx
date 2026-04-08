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

const toolConfig: { tool: SelectedTool; icon: JSX.Element }[] = [
  { tool: "Muros", icon: <Cuboid className="h-4 w-4" /> },
  { tool: "Puertas", icon: <DoorOpen className="h-4 w-4" /> },
  { tool: "Ventanas", icon: <Square className="h-4 w-4" /> },
  { tool: "Suelos", icon: <SquareStack className="h-4 w-4" /> },
  { tool: "Medir", icon: <Ruler className="h-4 w-4" /> },
  { tool: "Seleccionar", icon: <MousePointer2 className="h-4 w-4" /> },
  { tool: "Eliminar", icon: <Eraser className="h-4 w-4" /> },
];

export function Sidebar({ selectedTool, onSelectTool }: SidebarProps) {
  return (
    <aside className="w-72 shrink-0 border-r border-panelBorde bg-panel/70 p-5">
      <h2 className="mb-4 text-sm font-semibold text-slate-300">{es.sidebar.title}</h2>
      <div className="grid gap-2">
        {toolConfig.map(({ tool, icon }) => (
          <ToolButton
            key={tool}
            icon={icon}
            label={es.tools[tool]}
            active={selectedTool === tool}
            onClick={() => onSelectTool(tool)}
          />
        ))}
      </div>
    </aside>
  );
}
