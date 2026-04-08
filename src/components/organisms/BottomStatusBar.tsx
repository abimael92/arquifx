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
    <footer className="border-t border-slate-800/90 bg-[linear-gradient(180deg,#090f1b_0%,#070d18_100%)] px-4 py-3 text-xs text-slate-200">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-slate-700/90 bg-slate-900/75 px-3 py-1.5">
          {es.statusBar.coordinates}: X {formatNumber(coordinates.x)} · Y {formatNumber(coordinates.y)} · Z {formatNumber(coordinates.z)}
        </span>

        <span className="rounded-full border border-cyan-500/35 bg-cyan-500/10 px-3 py-1.5 text-cyan-100">
          {es.statusBar.totalArea}: {formatNumber(totalAreaM2)} {es.units.squareMeters}
        </span>

        <span className="rounded-full border border-slate-700/90 bg-slate-900/75 px-3 py-1.5">
          {es.app.activeTool}: {es.tools[activeTool]}
        </span>

        <span
          className={`rounded-full border px-3 py-1.5 ${
            isProjectSaved
              ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-100"
              : "border-amber-500/40 bg-amber-500/15 text-amber-100"
          }`}
        >
          {es.statusBar.projectStatus}: {isProjectSaved ? es.statusBar.saved : es.statusBar.notSaved}
        </span>
      </div>
    </footer>
  );
}
