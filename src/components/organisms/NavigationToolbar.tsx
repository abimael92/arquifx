"use client";

import {
  ArrowBigDown,
  ArrowBigLeft,
  ArrowBigRight,
  ArrowBigUp,
  RotateCcw,
  RotateCw,
  Target,
  Sun,
  SunMoon,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useEffect } from "react";

import { useAppStore } from "@/store";

const PAN_STEP = 1.2;
const ROTATE_STEP = Math.PI / 12;
const ZOOM_STEP = 0.9;

export function NavigationToolbar() {
  const viewMode = useAppStore((state) => state.viewMode);
  const cameraStates = useAppStore((state) => state.cameraStates);
  const transitionCameraTo = useAppStore((state) => state.transitionCameraTo);
  const showMeasurements = useAppStore((state) => state.showMeasurements);
  const setShowMeasurements = useAppStore((state) => state.setShowMeasurements);
  const showGrid = useAppStore((state) => state.showGrid);
  const setShowGrid = useAppStore((state) => state.setShowGrid);
  const realisticShadows = useAppStore((state) => state.realisticShadows);
  const setRealisticShadows = useAppStore((state) => state.setRealisticShadows);
  const sunAzimuth = useAppStore((state) => state.sunAzimuth);
  const setSunAzimuth = useAppStore((state) => state.setSunAzimuth);

  const applyPan = (dx: number, dz: number) => {
    const current = cameraStates[viewMode];
    transitionCameraTo(viewMode, {
      position: {
        x: current.position.x + dx,
        y: current.position.y,
        z: current.position.z + dz,
      },
      target: {
        x: current.target.x + dx,
        y: current.target.y,
        z: current.target.z + dz,
      },
    });
  };

  const applyRotate = (dir: 1 | -1) => {
    const current = cameraStates[viewMode];
    const relX = current.position.x - current.target.x;
    const relZ = current.position.z - current.target.z;
    const radius = Math.sqrt(relX * relX + relZ * relZ);
    const baseAngle = Math.atan2(relZ, relX);
    const nextAngle = baseAngle + dir * ROTATE_STEP;

    transitionCameraTo(viewMode, {
      position: {
        x: current.target.x + Math.cos(nextAngle) * radius,
        y: current.position.y,
        z: current.target.z + Math.sin(nextAngle) * radius,
      },
    });
  };

  const applyZoom = (factor: number) => {
    const current = cameraStates[viewMode];
    transitionCameraTo(viewMode, {
      zoom: Math.max(0.4, Math.min(60, current.zoom * factor)),
    });
  };

  const resetCamera = () => {
    const defaults =
      viewMode === "3d"
        ? {
            position: { x: 8, y: 6, z: 8 },
            target: { x: 0, y: 0, z: 0 },
            zoom: 1,
          }
        : viewMode === "top"
          ? {
              position: { x: 0, y: 14, z: 0.1 },
              target: { x: 0, y: 0, z: 0 },
              zoom: 1,
            }
          : viewMode === "realistic"
            ? {
                position: { x: 10, y: 7, z: 10 },
                target: { x: 0, y: 0, z: 0 },
                zoom: 1,
              }
          : {
              position: { x: 0, y: 20, z: 0.1 },
              target: { x: 0, y: 0, z: 0 },
              zoom: 36,
            };

    transitionCameraTo(viewMode, defaults);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLElement) {
        const tag = event.target.tagName.toLowerCase();
        if (tag === "input" || tag === "textarea") {
          return;
        }
      }

      switch (event.key.toLowerCase()) {
        case "=":
        case "+":
          applyZoom(1 / ZOOM_STEP);
          break;
        case "-":
          applyZoom(ZOOM_STEP);
          break;
        case "arrowleft":
          applyPan(-PAN_STEP, 0);
          break;
        case "arrowright":
          applyPan(PAN_STEP, 0);
          break;
        case "arrowup":
          applyPan(0, -PAN_STEP);
          break;
        case "arrowdown":
          applyPan(0, PAN_STEP);
          break;
        case "q":
          applyRotate(-1);
          break;
        case "e":
          applyRotate(1);
          break;
        case "0":
          resetCamera();
          break;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [cameraStates, viewMode]);

  return (
    <div className="absolute left-5 top-20 z-20 grid grid-cols-5 gap-1 rounded-xl border border-slate-700/80 bg-slate-900/70 p-2 backdrop-blur">
      <button type="button" onClick={() => applyZoom(1 / ZOOM_STEP)} className="toolbar-btn" title="Zoom in (+)">
        <ZoomIn className="h-4 w-4" />
      </button>
      <button type="button" onClick={() => applyZoom(ZOOM_STEP)} className="toolbar-btn" title="Zoom out (-)">
        <ZoomOut className="h-4 w-4" />
      </button>
      <button type="button" onClick={() => applyRotate(-1)} className="toolbar-btn" title="Rotate CCW (Q)">
        <RotateCcw className="h-4 w-4" />
      </button>
      <button type="button" onClick={() => applyRotate(1)} className="toolbar-btn" title="Rotate CW (E)">
        <RotateCw className="h-4 w-4" />
      </button>
      <button type="button" onClick={resetCamera} className="toolbar-btn" title="Reset camera (0)">
        <Target className="h-4 w-4" />
      </button>

      <button type="button" onClick={() => applyPan(-PAN_STEP, 0)} className="toolbar-btn" title="Pan left">
        <ArrowBigLeft className="h-4 w-4" />
      </button>
      <button type="button" onClick={() => applyPan(PAN_STEP, 0)} className="toolbar-btn" title="Pan right">
        <ArrowBigRight className="h-4 w-4" />
      </button>
      <button type="button" onClick={() => applyPan(0, -PAN_STEP)} className="toolbar-btn" title="Pan up">
        <ArrowBigUp className="h-4 w-4" />
      </button>
      <button type="button" onClick={() => applyPan(0, PAN_STEP)} className="toolbar-btn" title="Pan down">
        <ArrowBigDown className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => setShowGrid(!showGrid)}
        className={`toolbar-btn ${showGrid ? "border-cyan-500/50 text-cyan-100" : ""}`}
        title="Toggle grid"
      >
        Grid
      </button>

      <button
        type="button"
        onClick={() => setShowMeasurements(!showMeasurements)}
        className={`toolbar-btn col-span-5 ${showMeasurements ? "border-cyan-500/50 text-cyan-100" : ""}`}
        title="Toggle measurements"
      >
        Measurements
      </button>

      {viewMode === "realistic" ? (
        <>
          <button
            type="button"
            onClick={() => setRealisticShadows(!realisticShadows)}
            className={`toolbar-btn col-span-2 ${realisticShadows ? "border-amber-400/60 text-amber-100" : ""}`}
            title="Toggle realistic shadows"
          >
            <SunMoon className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => setSunAzimuth(sunAzimuth - Math.PI / 18)}
            className="toolbar-btn"
            title="Rotate sun left"
          >
            <Sun className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => setSunAzimuth(sunAzimuth + Math.PI / 18)}
            className="toolbar-btn col-span-2"
            title="Rotate sun right"
          >
            Sun +
          </button>
        </>
      ) : null}

      <style jsx>{`
        .toolbar-btn {
          border: 1px solid rgba(71, 85, 105, 0.9);
          background: rgba(2, 6, 23, 0.7);
          color: rgb(226, 232, 240);
          border-radius: 0.5rem;
          height: 2rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          transition: border-color 120ms ease;
        }

        .toolbar-btn:hover {
          border-color: rgba(148, 163, 184, 0.9);
        }
      `}</style>
    </div>
  );
}
