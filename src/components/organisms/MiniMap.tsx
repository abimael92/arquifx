"use client";

import { useMemo } from "react";

import { useAppStore } from "@/store";

const SIZE = 180;

export function MiniMap() {
  const walls = useAppStore((state) => state.walls);
  const viewMode = useAppStore((state) => state.viewMode);
  const cameraStates = useAppStore((state) => state.cameraStates);
  const transitionCameraTo = useAppStore((state) => state.transitionCameraTo);

  const bounds = useMemo(() => {
    if (!walls.length) {
      return { minX: -10, maxX: 10, minZ: -10, maxZ: 10 };
    }

    const xs = walls.flatMap((wall) => [wall.startPoint.x, wall.endPoint.x]);
    const zs = walls.flatMap((wall) => [wall.startPoint.z, wall.endPoint.z]);
    const minX = Math.min(...xs) - 1;
    const maxX = Math.max(...xs) + 1;
    const minZ = Math.min(...zs) - 1;
    const maxZ = Math.max(...zs) + 1;
    return { minX, maxX, minZ, maxZ };
  }, [walls]);

  const width = Math.max(bounds.maxX - bounds.minX, 1);
  const length = Math.max(bounds.maxZ - bounds.minZ, 1);

  const toMapX = (x: number) => ((x - bounds.minX) / width) * SIZE;
  const toMapY = (z: number) => ((z - bounds.minZ) / length) * SIZE;

  const current = cameraStates[viewMode];

  return (
    <div className="absolute bottom-6 right-6 z-20 rounded-xl border border-slate-700/80 bg-slate-950/75 p-2 backdrop-blur">
      <p className="mb-1 text-[10px] uppercase tracking-wide text-slate-300">Mini map</p>
      <svg
        width={SIZE}
        height={SIZE}
        className="rounded-md border border-slate-700 bg-slate-900/80"
        onClick={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          const localX = event.clientX - rect.left;
          const localY = event.clientY - rect.top;
          const worldX = bounds.minX + (localX / SIZE) * width;
          const worldZ = bounds.minZ + (localY / SIZE) * length;
          const deltaX = current.position.x - current.target.x;
          const deltaY = current.position.y - current.target.y;
          const deltaZ = current.position.z - current.target.z;

          transitionCameraTo(viewMode, {
            target: { x: worldX, y: 0, z: worldZ },
            position: {
              x: worldX + deltaX,
              y: Math.max(0.45, deltaY),
              z: worldZ + deltaZ,
            },
          });
        }}
      >
        {walls.map((wall) => (
          <line
            key={wall.id}
            x1={toMapX(wall.startPoint.x)}
            y1={toMapY(wall.startPoint.z)}
            x2={toMapX(wall.endPoint.x)}
            y2={toMapY(wall.endPoint.z)}
            stroke="#38bdf8"
            strokeWidth={2}
          />
        ))}

        <circle cx={toMapX(current.target.x)} cy={toMapY(current.target.z)} r={4} fill="#22c55e" />
      </svg>
    </div>
  );
}
