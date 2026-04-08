import es from "@/locales/es.json";
import { SelectedTool } from "@/store";
import { Vector3D } from "@/types/project.types";

interface BottomStatusBarProps {
  coordinates: Vector3D;
  activeTool: SelectedTool;
  isProjectSaved: boolean;
  totalAreaM2: number;
}

const formatNumber = (value: number) =>
  value.toLocaleString("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export function BottomStatusBar({ coordinates, activeTool, isProjectSaved, totalAreaM2 }: BottomStatusBarProps) {
  return (
    <footer className="flex items-center justify-between border-t border-panelBorde bg-panel px-4 py-2 text-xs text-slate-300">
      <span>
        {es.statusBar.coordinates}: X {formatNumber(coordinates.x)} · Y {formatNumber(coordinates.y)} · Z {formatNumber(coordinates.z)}
      </span>
      <span>
        {es.statusBar.totalArea}: {formatNumber(totalAreaM2)} {es.units.squareMeters}
      </span>
      <span>
        {es.app.activeTool}: {es.tools[activeTool]}
      </span>
      <span>
        {es.statusBar.projectStatus}: {isProjectSaved ? es.statusBar.saved : es.statusBar.notSaved}
      </span>
    </footer>
  );
}
