"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ThreeEvent } from "@react-three/fiber";
import { Plane, Vector3 } from "three";

import { clampPointToTerrain } from "@/domains/terrain/services/terrain-bounds.service";
import { createWallUseCase } from "@/domains/wall/use-cases/createWall.use-case";
import {
  buildWallPreviewMetrics,
  snapAngleFromStart,
  snapPointOnPlane,
  wallLength,
} from "@/domains/wall/services/wall-drawing.service";
import { useAppStore } from "@/store";
import { Vector3D } from "@/types/project.types";

const SNAP_SIZE = 0.1;
const PRECISE_SNAP_SIZE = 0.01;
const ANGLE_SNAP_DEG = 45;
const PRECISE_ANGLE_SNAP_DEG = 15;
const MIN_WALL_LENGTH = 0.1;
const MIN_DRAG_COMMIT_LENGTH = 0.2;

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
  const lot = useAppStore((state) => state.lot);
  const setTerrainViolation = useAppStore((state) => state.setTerrainViolation);

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

      const snapped = snapPointOnPlane({ x: intersection.x, y: baseY, z: intersection.z }, snapSize);
      const bounded = clampPointToTerrain(snapped, { width: lot.width, length: lot.length });
      if (!start) {
        setTerrainViolation(bounded.wasClamped);
        return bounded.point;
      }

      const angleSnapped = snapAngleFromStart(start, bounded.point, angleSnap);
      const finalBounded = clampPointToTerrain(
        snapPointOnPlane({ x: angleSnapped.x, y: baseY, z: angleSnapped.z }, snapSize),
        { width: lot.width, length: lot.length },
      );
      setTerrainViolation(bounded.wasClamped || finalBounded.wasClamped);
      return finalBounded.point;
    },
    [baseY, groundPlane, lot.length, lot.width, setTerrainViolation],
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
    setTerrainViolation(false);
  }, [setTerrainViolation]);

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

      const length = wallLength(startPoint, snapped);

      if (length < MIN_DRAG_COMMIT_LENGTH) {
        cancelDrawing();
        return;
      }

      if (length >= MIN_WALL_LENGTH) {
        addWall(createWallUseCase({
          startPoint,
          endPoint: snapped,
          levelId: activeLevel?.id,
          height: activeLevel?.height ?? 2.8,
        }));
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

  const previewMetrics = useMemo(() => {
    if (!startPoint || !currentPoint) {
      return null;
    }

    return buildWallPreviewMetrics(startPoint, currentPoint);
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
