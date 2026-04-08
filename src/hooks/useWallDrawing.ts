"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { ThreeEvent } from "@react-three/fiber";
import { Plane, Vector3 } from "three";

import { useAppStore } from "@/store";
import { Vector3D } from "@/types/project.types";

const SNAP_SIZE = 0.05;

const snapValue = (value: number) => Math.round(value / SNAP_SIZE) * SNAP_SIZE;

const toSnappedPoint = (point: Vector3): Vector3D => ({
  x: snapValue(point.x),
  y: 0,
  z: snapValue(point.z),
});

export function useWallDrawing() {
  const isDrawingMode = useAppStore((state) => state.isDrawingMode);
  const addWall = useAppStore((state) => state.addWall);
  const selectedWallId = useAppStore((state) => state.selectedWallId);
  const selectedOpeningId = useAppStore((state) => state.selectedOpeningId);
  const selectedFloorId = useAppStore((state) => state.selectedFloorId);
  const selectWall = useAppStore((state) => state.selectWall);
  const selectOpening = useAppStore((state) => state.selectOpening);
  const selectFloor = useAppStore((state) => state.selectFloor);

  const [startPoint, setStartPoint] = useState<Vector3D | null>(null);
  const [currentPoint, setCurrentPoint] = useState<Vector3D | null>(null);

  const groundPlane = useMemo(() => new Plane(new Vector3(0, 1, 0), 0), []);

  const projectRayToGround = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      const intersection = new Vector3();
      const hasHit = event.ray.intersectPlane(groundPlane, intersection);
      if (!hasHit) {
        return null;
      }

      return toSnappedPoint(intersection);
    },
    [groundPlane],
  );

  const onCanvasPointerMove = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      if (!startPoint || !isDrawingMode) {
        return;
      }

      const snapped = projectRayToGround(event);
      if (!snapped) {
        return;
      }

      setCurrentPoint(snapped);
    },
    [isDrawingMode, projectRayToGround, startPoint],
  );

  const onCanvasPointerDown = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      if (!isDrawingMode) {
        return;
      }

      const snapped = projectRayToGround(event);
      if (!snapped) {
        return;
      }

      if (!startPoint) {
        setStartPoint(snapped);
        setCurrentPoint(snapped);
        return;
      }

      const isSamePoint = startPoint.x === snapped.x && startPoint.z === snapped.z;
      if (isSamePoint) {
        return;
      }

      addWall({
        id: uuidv4(),
        startPoint,
        endPoint: snapped,
        height: 2.8,
        thickness: 0.2,
        materialType: "ladrillo",
        layer: "muros",
        isLoadBearing: false,
      });

      setStartPoint(null);
      setCurrentPoint(null);
    },
    [addWall, isDrawingMode, projectRayToGround, startPoint],
  );

  const cancelDrawing = useCallback(() => {
    setStartPoint(null);
    setCurrentPoint(null);
  }, []);

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
    if (!isDrawingMode) {
      cancelDrawing();
    }
  }, [cancelDrawing, isDrawingMode]);

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
    if (!isDrawingMode && (selectedWallId || selectedOpeningId || selectedFloorId)) {
      selectWall(null);
      selectOpening(null);
      selectFloor(null);
    }
  }, [isDrawingMode, selectFloor, selectOpening, selectWall, selectedFloorId, selectedOpeningId, selectedWallId]);

  return {
    previewPoints,
    isDrawing: Boolean(startPoint),
    onCanvasPointerDown,
    onCanvasPointerMove,
    cancelDrawing,
    onScenePointerMissed,
  };
}
