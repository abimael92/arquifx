"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas, ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import { BufferAttribute, BufferGeometry } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

import { useFloorDetection } from "@/hooks/useFloorDetection";
import { useRoomDrawing } from "@/hooks/useRoomDrawing";
import { useWallDrawing } from "@/hooks/useWallDrawing";
import { useAppStore } from "@/store";
import { Wall as WallType } from "@/types/project.types";

import { Controls3D } from "./Controls3D";
import { Floor } from "./Floor";
import { Opening } from "./Opening";
import { Wall } from "./Wall";

function PreviewLine({ points }: { points: [number, number, number, number, number, number] }) {
  const geometry = useMemo(() => {
    const nextGeometry = new BufferGeometry();
    nextGeometry.setAttribute("position", new BufferAttribute(new Float32Array(points), 3));
    return nextGeometry;
  }, [points]);

  useEffect(() => {
    return () => geometry.dispose();
  }, [geometry]);

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color="#22d3ee" linewidth={2} />
    </lineSegments>
  );
}

function PreviewRectangle({
  points,
}: {
  points: [number, number, number, number, number, number, number, number, number, number, number, number];
}) {
  const geometry = useMemo(() => {
    const nextGeometry = new BufferGeometry();
    nextGeometry.setAttribute("position", new BufferAttribute(new Float32Array(points), 3));
    return nextGeometry;
  }, [points]);

  useEffect(() => {
    return () => geometry.dispose();
  }, [geometry]);

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color="#34d399" linewidth={2} />
    </lineSegments>
  );
}

export function Scene() {
  const walls = useAppStore((state) => state.walls);
  const floors = useAppStore((state) => state.floors);
  const openings = useAppStore((state) => state.openings);
  const selectedWallId = useAppStore((state) => state.selectedWallId);
  const selectedOpeningId = useAppStore((state) => state.selectedOpeningId);
  const selectedFloorId = useAppStore((state) => state.selectedFloorId);
  const selectedTool = useAppStore((state) => state.selectedTool);
  const levels = useAppStore((state) => state.levels);
  const selectWall = useAppStore((state) => state.selectWall);
  const selectOpening = useAppStore((state) => state.selectOpening);
  const selectFloor = useAppStore((state) => state.selectFloor);
  const addOpening = useAppStore((state) => state.addOpening);
  const showGrid = useAppStore((state) => state.showGrid);
  const updateWall = useAppStore((state) => state.updateWall);
  const setCameraPosition = useAppStore((state) => state.setCameraPosition);
  const [openingPreview, setOpeningPreview] = useState<{
    wallId: string;
    type: "puerta" | "ventana";
    positionFromStart: number;
    width: number;
    height: number;
    sillHeight: number;
    center: [number, number, number];
    rotationY: number;
    thickness: number;
  } | null>(null);

  const orbitControlsRef = useRef<OrbitControlsImpl>(null);

  useFloorDetection();

  const {
    previewPoints,
    previewMetrics: wallPreviewMetrics,
    onCanvasPointerDown: onWallPointerDown,
    onCanvasPointerMove: onWallPointerMove,
    onCanvasPointerUp: onWallPointerUp,
    onScenePointerMissed,
  } = useWallDrawing();
  const {
    previewRectangle,
    previewMetrics: roomPreviewMetrics,
    onCanvasPointerDown: onRoomPointerDown,
    onCanvasPointerMove: onRoomPointerMove,
    onCanvasPointerUp: onRoomPointerUp,
  } = useRoomDrawing();
  const isOpeningTool = selectedTool === "Puertas" || selectedTool === "Ventanas";

  const visibleLevelIds = useMemo(
    () => new Set(levels.filter((level) => level.visible).map((level) => level.id)),
    [levels],
  );

  const visibleWalls = useMemo(
    () =>
      walls.filter((wall) => {
        if (!wall.levelId) {
          return true;
        }

        return visibleLevelIds.has(wall.levelId);
      }),
    [visibleLevelIds, walls],
  );

  const visibleFloors = useMemo(
    () =>
      floors.filter((floor) => {
        if (!floor.levelId) {
          return true;
        }

        return visibleLevelIds.has(floor.levelId);
      }),
    [floors, visibleLevelIds],
  );

  const visibleOpenings = useMemo(
    () => openings.filter((opening) => visibleWalls.some((wall) => wall.id === opening.wallId)),
    [openings, visibleWalls],
  );

  const getWallMetrics = (wall: WallType) => {
    const dx = wall.endPoint.x - wall.startPoint.x;
    const dz = wall.endPoint.z - wall.startPoint.z;
    const length = Math.max(Math.sqrt(dx * dx + dz * dz), 0.0001);
    const dirX = dx / length;
    const dirZ = dz / length;

    return {
      length,
      dirX,
      dirZ,
      rotationY: Math.atan2(dz, dx),
    };
  };

  const selectedWall = useMemo(
    () => visibleWalls.find((wall) => wall.id === selectedWallId) ?? null,
    [selectedWallId, visibleWalls],
  );

  const previewLinePoints = useMemo<[number, number, number, number, number, number] | null>(() => {
    if (!previewPoints) {
      return null;
    }

    return [
      previewPoints[0].x,
      previewPoints[0].y,
      previewPoints[0].z,
      previewPoints[1].x,
      previewPoints[1].y,
      previewPoints[1].z,
    ];
  }, [previewPoints]);

  const previewRectanglePoints = useMemo<
    [number, number, number, number, number, number, number, number, number, number, number, number] | null
  >(() => {
    if (!previewRectangle) {
      return null;
    }

    const y = previewRectangle[0].y + 0.03;
    return [
      previewRectangle[0].x,
      y,
      previewRectangle[0].z,
      previewRectangle[1].x,
      y,
      previewRectangle[1].z,
      previewRectangle[1].x,
      y,
      previewRectangle[1].z,
      previewRectangle[2].x,
      y,
      previewRectangle[2].z,
    ];
  }, [previewRectangle]);

  const previewRectanglePointsB = useMemo<
    [number, number, number, number, number, number, number, number, number, number, number, number] | null
  >(() => {
    if (!previewRectangle) {
      return null;
    }

    const y = previewRectangle[0].y + 0.03;
    return [
      previewRectangle[2].x,
      y,
      previewRectangle[2].z,
      previewRectangle[3].x,
      y,
      previewRectangle[3].z,
      previewRectangle[3].x,
      y,
      previewRectangle[3].z,
      previewRectangle[0].x,
      y,
      previewRectangle[0].z,
    ];
  }, [previewRectangle]);

  const activeMetricsLabel = useMemo(() => {
    if (selectedTool === "Muros" && wallPreviewMetrics) {
      return `L ${wallPreviewMetrics.lengthM.toFixed(2)}m · θ ${wallPreviewMetrics.angleDeg.toFixed(0)}° · €${wallPreviewMetrics.cost.toFixed(0)}`;
    }

    if (selectedTool === "Suelos" && roomPreviewMetrics) {
      return `W ${roomPreviewMetrics.widthM.toFixed(2)}m · L ${roomPreviewMetrics.lengthM.toFixed(2)}m · A ${roomPreviewMetrics.areaM2.toFixed(2)}m²`;
    }

    return null;
  }, [roomPreviewMetrics, selectedTool, wallPreviewMetrics]);

  const openingDefaults = useMemo(() => {
    if (selectedTool === "Puertas") {
      return {
        type: "puerta" as const,
        width: 0.9,
        height: 2.1,
        sillHeight: 0,
      };
    }

    if (selectedTool === "Ventanas") {
      return {
        type: "ventana" as const,
        width: 1.2,
        height: 1.2,
        sillHeight: 0.9,
      };
    }

    return null;
  }, [selectedTool]);

  const handleWallPointerMove = (wall: WallType, event: ThreeEvent<PointerEvent>) => {
    if (!isOpeningTool || !openingDefaults) {
      return;
    }

    const { length, dirX, dirZ, rotationY } = getWallMetrics(wall);
    const relX = event.point.x - wall.startPoint.x;
    const relZ = event.point.z - wall.startPoint.z;
    const projectedDistance = relX * dirX + relZ * dirZ;
    const clampedDistance = Math.max(
      openingDefaults.width / 2,
      Math.min(projectedDistance, Math.max(openingDefaults.width / 2, length - openingDefaults.width / 2)),
    );

    const centerX = wall.startPoint.x + dirX * clampedDistance;
    const centerZ = wall.startPoint.z + dirZ * clampedDistance;
    const centerY = wall.startPoint.y + openingDefaults.sillHeight + openingDefaults.height / 2;

    setOpeningPreview({
      wallId: wall.id,
      type: openingDefaults.type,
      positionFromStart: clampedDistance,
      width: openingDefaults.width,
      height: openingDefaults.height,
      sillHeight: openingDefaults.sillHeight,
      center: [centerX, centerY, centerZ],
      rotationY,
      thickness: wall.thickness,
    });
  };

  const handleWallClick = (wall: WallType) => {
    if (isOpeningTool && openingDefaults) {
      const preview = openingPreview?.wallId === wall.id ? openingPreview : null;
      if (!preview) {
        return;
      }

      addOpening(wall.id, preview.type, preview.positionFromStart, preview.width, preview.height);
      setOpeningPreview(null);
      return;
    }

    selectWall(wall.id);
  };

  useEffect(() => {
    if (!isOpeningTool) {
      setOpeningPreview(null);
    }
  }, [isOpeningTool]);

  return (
    <div className="relative h-full w-full">
      <Canvas
        shadows
        camera={{ position: [8, 6, 8], fov: 50 }}
        onPointerMissed={() => {
          onScenePointerMissed();
          setOpeningPreview(null);
        }}
      >
        <color attach="background" args={["#0b1220"]} />

        <ambientLight intensity={0.45} />
        <directionalLight castShadow intensity={1.1} position={[8, 14, 10]} />

        {showGrid ? (
          <>
            <gridHelper args={[120, 120, "#475569", "#1e293b"]} position={[0, 0, 0]} />
            <gridHelper args={[120, 480, "#334155", "#0f172a"]} position={[0, 0.001, 0]} />
          </>
        ) : null}

        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0, 0]}
          visible={false}
          onPointerDown={(event) => {
            onWallPointerDown(event);
            onRoomPointerDown(event);
          }}
          onPointerMove={(event) => {
            onWallPointerMove(event);
            onRoomPointerMove(event);
          }}
          onPointerUp={(event) => {
            onWallPointerUp(event);
            onRoomPointerUp(event);
          }}
        >
          <planeGeometry args={[500, 500]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>

        {visibleWalls.map((wall) => (
          <Wall
            key={wall.id}
            wall={wall}
            isSelected={wall.id === selectedWallId}
            onSelect={(wallId) => selectWall(wallId)}
            onWallPointerMove={handleWallPointerMove}
            onWallClick={(wallItem) => handleWallClick(wallItem)}
          />
        ))}

        {visibleFloors.map((floor) => (
          <Floor
            key={floor.id}
            floor={floor}
            isSelected={floor.id === selectedFloorId}
            onSelect={(floorId) => selectFloor(floorId)}
          />
        ))}

        {visibleOpenings.map((opening) => {
          const wall = visibleWalls.find((item) => item.id === opening.wallId);
          if (!wall) {
            return null;
          }

          return (
            <Opening
              key={opening.id}
              opening={opening}
              wall={wall}
              isSelected={opening.id === selectedOpeningId}
              onSelect={(openingId) => selectOpening(openingId)}
            />
          );
        })}

        {openingPreview ? (
          <mesh position={openingPreview.center} rotation={[0, openingPreview.rotationY, 0]}>
            <boxGeometry args={[openingPreview.width, openingPreview.height, openingPreview.thickness * 1.08]} />
            <meshStandardMaterial
              color={openingPreview.type === "puerta" ? "#8b5a2b" : "#2563eb"}
              transparent
              opacity={0.28}
            />
          </mesh>
        ) : null}

        {previewLinePoints ? <PreviewLine points={previewLinePoints} /> : null}
        {previewRectanglePoints ? <PreviewRectangle points={previewRectanglePoints} /> : null}
        {previewRectanglePointsB ? <PreviewRectangle points={previewRectanglePointsB} /> : null}

        {selectedWall ? (
          <Controls3D
            wall={selectedWall}
            orbitControlsRef={orbitControlsRef}
            onTransformWall={(wallId, startPoint, endPoint) => {
              updateWall(wallId, { startPoint, endPoint });
            }}
          />
        ) : null}

        <OrbitControls
          ref={orbitControlsRef}
          makeDefault
          enableDamping
          dampingFactor={0.08}
          onChange={() => {
            const position = orbitControlsRef.current?.object.position;
            if (!position) {
              return;
            }

            setCameraPosition({
              x: position.x,
              y: position.y,
              z: position.z,
            });
          }}
        />
      </Canvas>

      {activeMetricsLabel ? (
        <div className="pointer-events-none absolute bottom-5 left-5 rounded-lg border border-cyan-500/30 bg-slate-950/80 px-3 py-2 text-xs text-cyan-100">
          {activeMetricsLabel}
        </div>
      ) : null}
    </div>
  );
}
