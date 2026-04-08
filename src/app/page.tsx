"use client";

import { useEffect, useState } from "react";

import { Scene } from "@/components/canvas/Scene";
import { Button } from "@/components/atoms/Button";
import { MeasurementCard } from "@/components/molecules/MeasurementCard";
import { BottomStatusBar } from "@/components/organisms/BottomStatusBar";
import { PropertyInspector } from "@/components/organisms/PropertyInspector";
import { ProjectStatsCard } from "@/components/organisms/ProjectStatsCard";
import { Sidebar } from "@/components/organisms/Sidebar";
import { useProjectAutoSave } from "@/hooks/useProjectAutoSave";
import { calculateProjectCost, calculateTotalFloorArea } from "@/lib/math";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import es from "@/locales/es.json";
import { useAppStore } from "@/store";
import { Project } from "@/types/project.types";

export default function Home() {
  const { user, loading } = useRequireAuth();

  const selectedTool = useAppStore((state) => state.selectedTool);
  const setSelectedTool = useAppStore((state) => state.setSelectedTool);
  const walls = useAppStore((state) => state.walls);
  const floors = useAppStore((state) => state.floors);
  const openings = useAppStore((state) => state.openings);
  const selectedWallId = useAppStore((state) => state.selectedWallId);
  const selectedOpeningId = useAppStore((state) => state.selectedOpeningId);
  const updateWall = useAppStore((state) => state.updateWall);
  const updateOpening = useAppStore((state) => state.updateOpening);
  const saveProject = useAppStore((state) => state.saveProject);
  const cameraPosition = useAppStore((state) => state.cameraPosition);
  const currentProject = useAppStore((state) => state.currentProject);

  const [showSavedToast, setShowSavedToast] = useState(false);

  const selectedWall = walls.find((wall) => wall.id === selectedWallId) ?? null;
  const selectedOpening = openings.find((opening) => opening.id === selectedOpeningId) ?? null;
  const totalArea = calculateTotalFloorArea(floors);
  const totalPerimeter = walls.reduce((acc, wall) => {
    const dx = wall.endPoint.x - wall.startPoint.x;
    const dz = wall.endPoint.z - wall.startPoint.z;
    return acc + Math.sqrt(dx * dx + dz * dz);
  }, 0);

  const projectForCost: Project = {
    id: currentProject?.id ?? "temporal",
    name: currentProject?.name ?? "Proyecto sin nombre",
    walls,
    floors,
    openings,
    settings:
      currentProject?.settings ?? {
        gridSnap: 0.1,
        angleSnap: 15,
        showGrid: true,
        defaultWallHeight: 2.8,
      },
    statistics: {
      totalWalls: walls.length,
      totalFloors: floors.length,
      totalOpenings: openings.length,
      totalAreaM2: totalArea,
    },
  };

  const estimatedCost = calculateProjectCost(projectForCost);
  const doorsCount = openings.filter((opening) => opening.type === "puerta").length;
  const windowsCount = openings.filter((opening) => opening.type === "ventana").length;

  const handleExportProject = () => {
    const project = saveProject();
    const json = JSON.stringify(project, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const safeName = project.name.replace(/\s+/g, "-").toLowerCase();

    anchor.href = url;
    anchor.download = `${safeName || "proyecto"}-${project.id}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  useProjectAutoSave({
    intervalMs: 30000,
    onSaved: () => {
      setShowSavedToast(true);
    },
  });

  useEffect(() => {
    if (!showSavedToast) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setShowSavedToast(false);
    }, 1800);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [showSavedToast]);

  if (loading) {
    return (
      <main className="flex h-screen w-full items-center justify-center bg-fondo text-slate-200">
        {es.auth.loading}
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="flex h-screen w-full flex-col bg-[radial-gradient(circle_at_20%_0%,#12233f_0%,#0b1220_35%,#070d18_100%)] text-slate-100">
      <div className="flex min-h-0 flex-1">
        <Sidebar selectedTool={selectedTool} onSelectTool={setSelectedTool} />

        <section className="relative flex-1 border-r border-slate-800/90">
          <div className="pointer-events-none absolute left-5 top-5 z-10 rounded-2xl border border-slate-600/60 bg-slate-900/70 px-4 py-3 text-xs text-slate-200 shadow-xl backdrop-blur-sm">
            <p className="text-[11px] uppercase tracking-[0.14em] text-cyan-200/80">{es.app.sceneView}</p>
            <p className="mt-1 text-sm font-semibold text-slate-100">
              {es.app.activeTool}: <span className="text-cyan-200">{es.tools[selectedTool]}</span>
            </p>
          </div>
          <Scene />
        </section>

        <aside className="w-80 shrink-0 border-l border-slate-800/90 bg-[linear-gradient(180deg,#111d33_0%,#0c1525_35%,#09101d_100%)] p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-slate-300">{es.inspector.title}</h2>
            <Button variant="secondary" onClick={handleExportProject}>
              {es.buttons.export}
            </Button>
          </div>

          <div className="space-y-4">
            <PropertyInspector
              selectedWall={selectedWall}
              selectedOpening={selectedOpening}
              onWallChange={(updates) => {
                if (!selectedWall) {
                  return;
                }
                updateWall(selectedWall.id, updates);
              }}
              onOpeningChange={(updates) => {
                if (!selectedOpening) {
                  return;
                }

                updateOpening(selectedOpening.id, updates);
              }}
            />

            <MeasurementCard areaM2={totalArea} perimeterM={totalPerimeter} estimatedCostEur={estimatedCost} />

            <ProjectStatsCard
              areaConstruida={totalArea}
              perimetroTotal={totalPerimeter}
              cantidadMuros={walls.length}
              cantidadPuertas={doorsCount}
              cantidadVentanas={windowsCount}
              costoEstimado={estimatedCost}
            />
          </div>

        </aside>
      </div>

      <BottomStatusBar
        coordinates={cameraPosition}
        activeTool={selectedTool}
        isProjectSaved={Boolean(currentProject)}
        totalAreaM2={totalArea}
      />

      {showSavedToast ? (
        <div className="pointer-events-none fixed bottom-4 right-4 rounded-md border border-emerald-500/50 bg-emerald-500/20 px-4 py-2 text-sm text-emerald-100 shadow-lg">
          {es.toast.saved}
        </div>
      ) : null}
    </main>
  );
}
