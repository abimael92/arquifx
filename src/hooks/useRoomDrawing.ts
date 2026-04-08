"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { snapToGrid } from "@/lib/math/snapping";
import { useAppStore } from "@/store";
import { Vector3D } from "@/types/project.types";

import { ThreeEvent } from "@react-three/fiber";
import { Plane, Vector3 } from "three";

const SNAP_SIZE = 0.1;
const PRECISE_SNAP_SIZE = 0.01;
const MIN_ROOM_SIDE = 0.2;

interface RoomPreviewMetrics {
  widthM: number;
  lengthM: number;
  areaM2: number;
}

const toSnappedPoint = (point: Vector3, y: number, snapSize: number): Vector3D => ({
  x: snapToGrid(point.x, snapSize),
  y,
  z: snapToGrid(point.z, snapSize),
});

export function useRoomDrawing() {
  const selectedTool = useAppStore((state) => state.selectedTool);
  const activeLevelId = useAppStore((state) => state.activeLevelId);
  const levels = useAppStore((state) => state.levels);
  const createRoomFromRectangle = useAppStore((state) => state.createRoomFromRectangle);

  const [startPoint, setStartPoint] = useState<Vector3D | null>(null);
  const [currentPoint, setCurrentPoint] = useState<Vector3D | null>(null);

  const activeLevel = useMemo(
    () => levels.find((level) => level.id === activeLevelId) ?? levels[0],
    [activeLevelId, levels],
  );
  const baseY = activeLevel?.elevation ?? 0;
  const isRoomTool = selectedTool === "Suelos";

  const groundPlane = useMemo(() => new Plane(new Vector3(0, 1, 0), -baseY), [baseY]);

  const projectRayToGround = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      const intersection = new Vector3();
      const hasHit = event.ray.intersectPlane(groundPlane, intersection);
      if (!hasHit) {
        return null;
      }

      const snapSize = event.nativeEvent.ctrlKey ? PRECISE_SNAP_SIZE : SNAP_SIZE;
      return toSnappedPoint(intersection, baseY, snapSize);
    },
    [baseY, groundPlane],
  );

  const cancelDrawing = useCallback(() => {
    setStartPoint(null);
    setCurrentPoint(null);
  }, []);

  const onCanvasPointerDown = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      if (!isRoomTool) {
        return;
      }

      const point = projectRayToGround(event);
      if (!point) {
        return;
      }

      setStartPoint(point);
      setCurrentPoint(point);
    },
    [isRoomTool, projectRayToGround],
  );

  const onCanvasPointerMove = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      if (!isRoomTool || !startPoint) {
        return;
      }

      const point = projectRayToGround(event);
      if (!point) {
        return;
      }

      setCurrentPoint(point);
    },
    [isRoomTool, projectRayToGround, startPoint],
  );

  const onCanvasPointerUp = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      if (!isRoomTool || !startPoint) {
        return;
      }

      const point = projectRayToGround(event);
      if (!point) {
        cancelDrawing();
        return;
      }

      const width = Math.abs(point.x - startPoint.x);
      const length = Math.abs(point.z - startPoint.z);

      if (width >= MIN_ROOM_SIDE && length >= MIN_ROOM_SIDE) {
        createRoomFromRectangle(startPoint, point);
      }

      cancelDrawing();
    },
    [cancelDrawing, createRoomFromRectangle, isRoomTool, projectRayToGround, startPoint],
  );

  useEffect(() => {
    if (!isRoomTool) {
      cancelDrawing();
    }
  }, [cancelDrawing, isRoomTool]);

  const previewRectangle = useMemo<Vector3D[] | null>(() => {
    if (!startPoint || !currentPoint) {
      return null;
    }

    const minX = Math.min(startPoint.x, currentPoint.x);
    const maxX = Math.max(startPoint.x, currentPoint.x);
    const minZ = Math.min(startPoint.z, currentPoint.z);
    const maxZ = Math.max(startPoint.z, currentPoint.z);

    return [
      { x: minX, y: baseY, z: minZ },
      { x: maxX, y: baseY, z: minZ },
      { x: maxX, y: baseY, z: maxZ },
      { x: minX, y: baseY, z: maxZ },
    ];
  }, [baseY, currentPoint, startPoint]);

  const previewMetrics = useMemo<RoomPreviewMetrics | null>(() => {
    if (!previewRectangle) {
      return null;
    }

    const widthM = Math.abs(previewRectangle[1].x - previewRectangle[0].x);
    const lengthM = Math.abs(previewRectangle[3].z - previewRectangle[0].z);
    return {
      widthM,
      lengthM,
      areaM2: widthM * lengthM,
    };
  }, [previewRectangle]);

  return {
    isDrawing: Boolean(startPoint),
    previewRectangle,
    previewMetrics,
    onCanvasPointerDown,
    onCanvasPointerMove,
    onCanvasPointerUp,
    cancelDrawing,
  };
}
