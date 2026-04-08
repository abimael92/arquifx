"use client";

import { useState } from "react";

import { PropertyInput } from "@/components/molecules/PropertyInput";
import es from "@/locales/es.json";
import { MaterialType, Opening, Wall } from "@/types/project.types";

interface PropertyInspectorProps {
  selectedWall?: Wall | null;
  selectedOpening?: Opening | null;
  onWallChange?: (updates: Partial<Omit<Wall, "id">>) => void;
  onOpeningChange?: (updates: Partial<Omit<Opening, "id" | "wallId">>) => void;
}

export function PropertyInspector({
  selectedWall,
  selectedOpening,
  onWallChange,
  onOpeningChange,
}: PropertyInspectorProps) {
  const [hasInsulation, setHasInsulation] = useState(false);

  if (selectedWall) {
    return (
      <section className="rounded-lg border border-panelBorde bg-slate-900/20 p-4 text-sm">
        <h3 className="mb-4 font-semibold text-slate-100">{es.inspector.wall.title}</h3>
        <div className="space-y-3">
          <PropertyInput
            label={es.inspector.wall.height}
            value={selectedWall.height}
            onChange={(value) => onWallChange?.({ height: Number(value) || 0 })}
          />
          <PropertyInput
            label={es.inspector.wall.thickness}
            value={selectedWall.thickness}
            onChange={(value) => onWallChange?.({ thickness: Number(value) || 0 })}
          />

          <label className="block text-sm">
            <span className="mb-1 block text-slate-300">{es.inspector.wall.material}</span>
            <select
              value={selectedWall.materialType}
              onChange={(event) => onWallChange?.({ materialType: event.target.value as MaterialType })}
              className="w-full rounded-md border border-panelBorde bg-slate-900/40 px-3 py-2 text-slate-100"
            >
              <option value="ladrillo">{es.inspector.materialOptions.ladrillo}</option>
              <option value="hormigon">{es.inspector.materialOptions.hormigon}</option>
              <option value="madera">{es.inspector.materialOptions.madera}</option>
            </select>
          </label>

          <label className="flex items-center gap-2 text-slate-300">
            <input
              type="checkbox"
              checked={hasInsulation}
              onChange={(event) => setHasInsulation(event.target.checked)}
              className="h-4 w-4 rounded border-panelBorde"
            />
            {es.inspector.wall.insulation}
          </label>
        </div>
      </section>
    );
  }

  if (selectedOpening) {
    return (
      <section className="rounded-lg border border-panelBorde bg-slate-900/20 p-4 text-sm">
        <h3 className="mb-4 font-semibold text-slate-100">{es.inspector.opening.title}</h3>
        <div className="space-y-3">
          <PropertyInput
            label={es.inspector.opening.width}
            value={selectedOpening.width}
            onChange={(value) => onOpeningChange?.({ width: Number(value) || 0 })}
          />
          <PropertyInput
            label={es.inspector.opening.height}
            value={selectedOpening.height}
            onChange={(value) => onOpeningChange?.({ height: Number(value) || 0 })}
          />

          <label className="block text-sm">
            <span className="mb-1 block text-slate-300">{es.inspector.opening.material}</span>
            <select
              value={selectedOpening.materialType}
              onChange={(event) => onOpeningChange?.({ materialType: event.target.value as MaterialType })}
              className="w-full rounded-md border border-panelBorde bg-slate-900/40 px-3 py-2 text-slate-100"
            >
              <option value="ladrillo">{es.inspector.materialOptions.ladrillo}</option>
              <option value="hormigon">{es.inspector.materialOptions.hormigon}</option>
              <option value="madera">{es.inspector.materialOptions.madera}</option>
            </select>
          </label>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-panelBorde bg-slate-900/20 p-4 text-sm text-slate-400">
      {es.inspector.noSelection}
    </section>
  );
}
