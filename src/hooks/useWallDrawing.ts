"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { ThreeEvent } from "@react-three/fiber";
import { Plane, Vector3 } from "three";

import { snapToGrid } from "@/lib/math/snapping";
import { useAppStore } from "@/store";
import { Vector3D } from "@/types/project.types";

const WALL_COST_PER_METER = 120;
const SNAP_SIZE = 0.1;
const PRECISE_SNAP_SIZE = 0.01;
const ANGLE_SNAP_DEG = 45;
const PRECISE_ANGLE_SNAP_DEG = 15;
const MIN_WALL_LENGTH = 0.1;

const snapValue = (value: number, snapSize: number) => snapToGrid(value, snapSize);

const toRadians = (deg: number) => (deg * Math.PI) / 180;
const toDegrees = (rad: number) => (rad * 180) / Math.PI;

const toSnappedPoint = (point: Vector3, y: number, snapSize: number): Vector3D => ({
  x: snapValue(point.x, snapSize),
  y,
  z: snapValue(point.z, snapSize),
});

const snapAngleFromStart = (startPoint: Vector3D, targetPoint: Vector3D, angleSnapDeg: number): Vector3D => {
  const dx = targetPoint.x - startPoint.x;
  const dz = targetPoint.z - startPoint.z;
  const length = Math.sqrt(dx * dx + dz * dz);

  if (length < 1e-6) {
    return targetPoint;
  }

  const rawAngle = Math.atan2(dz, dx);
  const snapStep = toRadians(angleSnapDeg);
  const snappedAngle = Math.round(rawAngle / snapStep) * snapStep;

  return {
    x: startPoint.x + Math.cos(snappedAngle) * length,
    y: startPoint.y,
    z: startPoint.z + Math.sin(snappedAngle) * length,
  };
};

interface WallPreviewMetrics {
  lengthM: number;
  angleDeg: number;
  cost: number;
}

export function useWallDrawing() {
  const selectedTool = useAppStore((state) => state.selectedTool);
  const addWall = useAppStore((state) => state.addWall);
  const activeLevelId = useAppStore((state) => state.activeLevelId);
  const levels = useAppStore((state) => state.levels);
  const selectedWallId = useAppStore((state) => state.selectedWallId);
  const selectedOpeningId = useAppStore((state) => state.selectedOpeningId);
  const selectedFloorId = useAppStore((state) => state.selectedFloorId);
  const selectWall = useAppStore((state) => state.selectWall);
  const selectOpening = useAppStore((state) => state.selectOpening);
  const selectFloor = useAppStore((state) => state.selectFloor);

  const [startPoint, setStartPoint] = useState<Vector3D | null>(null);
  const [currentPoint, setCurrentPoint] = useState<Vector3D | null>(null);

  const activeLevel = useMemo(
    () => levels.find((level) => level.id === activeLevelId) ?? levels[0],
    [activeLevelId, levels],
  );
  const baseY = activeLevel?.elevation ?? 0;

  const groundPlane = useMemo(() => new Plane(new Vector3(0, 1, 0), -baseY), [baseY]);

  const isWallTool = selectedTool === "Muros";

  const projectRayToGround = useCallback(
    (event: ThreeEvent<PointerEvent>, start: Vector3D | null = null) => {
      const intersection = new Vector3();
      const hasHit = event.ray.intersectPlane(groundPlane, intersection);
      if (!hasHit) {
        return null;
      }

      const isPrecision = event.nativeEvent.ctrlKey;
      const snapSize = isPrecision ? PRECISE_SNAP_SIZE : SNAP_SIZE;
      const angleSnap = isPrecision ? PRECISE_ANGLE_SNAP_DEG : ANGLE_SNAP_DEG;

      const snapped = toSnappedPoint(intersection, baseY, snapSize);
      if (!start) {
        return snapped;
      }

      const angleSnapped = snapAngleFromStart(start, snapped, angleSnap);
      return {
        x: snapValue(angleSnapped.x, snapSize),
        y: baseY,
        z: snapValue(angleSnapped.z, snapSize),
      };
    },
    [baseY, groundPlane],
  );

  const onCanvasPointerMove = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      if (!startPoint || !isWallTool) {
        return;
      }

      const snapped = projectRayToGround(event, startPoint);
      if (!snapped) {
        return;
      }

      setCurrentPoint(snapped);
    },
    [isWallTool, projectRayToGround, startPoint],
  );

  const onCanvasPointerDown = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      if (!isWallTool) {
        return;
      }

      const snapped = projectRayToGround(event);
      if (!snapped) {
        return;
      }

      setStartPoint(snapped);
      setCurrentPoint(snapped);
    },
    [isWallTool, projectRayToGround],
  );

  const cancelDrawing = useCallback(() => {
    setStartPoint(null);
    setCurrentPoint(null);
  }, []);

  const onCanvasPointerUp = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      if (!isWallTool || !startPoint) {
        return;
      }

      const snapped = projectRayToGround(event, startPoint);
      if (!snapped) {
        cancelDrawing();
        return;
      }

      const dx = snapped.x - startPoint.x;
      const dz = snapped.z - startPoint.z;
      const length = Math.sqrt(dx * dx + dz * dz);

      if (length >= MIN_WALL_LENGTH) {
        addWall({
          id: uuidv4(),
          levelId: activeLevel?.id,
          startPoint,
          endPoint: snapped,
          height: activeLevel?.height ?? 2.8,
          thickness: 0.2,
          materialType: "ladrillo",
          layer: "muros",
          isLoadBearing: false,
        });
      }

      cancelDrawing();
    },
    [activeLevel?.height, activeLevel?.id, addWall, cancelDrawing, isWallTool, projectRayToGround, startPoint],
  );

  useEffect(() => {
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        cancelDrawing();
      }
    };

    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [cancelDrawing]);

  useEffect(() => {
    if (!isWallTool) {
      cancelDrawing();
    }
  }, [cancelDrawing, isWallTool]);

  const previewPoints = useMemo(() => {
    if (!startPoint || !currentPoint) {
      return null;
    }

    return [
      new Vector3(startPoint.x, 0.02, startPoint.z),
      new Vector3(currentPoint.x, 0.02, currentPoint.z),
    ];
  }, [currentPoint, startPoint]);

  const onScenePointerMissed = useCallback(() => {
    if (!isWallTool && (selectedWallId || selectedOpeningId || selectedFloorId)) {
      selectWall(null);
      selectOpening(null);
      selectFloor(null);
    }
  }, [isWallTool, selectFloor, selectOpening, selectWall, selectedFloorId, selectedOpeningId, selectedWallId]);

  const previewMetrics = useMemo<WallPreviewMetrics | null>(() => {
    if (!startPoint || !currentPoint) {
      return null;
    }

    const dx = currentPoint.x - startPoint.x;
    const dz = currentPoint.z - startPoint.z;
    const lengthM = Math.sqrt(dx * dx + dz * dz);
    if (lengthM < 1e-6) {
      return null;
    }

    const angleDeg = ((toDegrees(Math.atan2(dz, dx)) % 360) + 360) % 360;
    return {
      lengthM,
      angleDeg,
      cost: lengthM * WALL_COST_PER_METER,
    };
  }, [currentPoint, startPoint]);

  return {
    previewPoints,
    previewMetrics,
    isDrawing: Boolean(startPoint),
    onCanvasPointerDown,
    onCanvasPointerMove,
    onCanvasPointerUp,
    cancelDrawing,
    onScenePointerMissed,
  };
}
