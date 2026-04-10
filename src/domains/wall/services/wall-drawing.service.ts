import { snapToGrid } from "@/core/math";
import { Vector3D } from "@/types/project.types";

import { createWallEntity } from "../entities/wall.entity";
import { WallPreviewMetrics } from "../types";

const WALL_COST_PER_METER = 120;

export function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function toDegrees(rad: number): number {
  return (rad * 180) / Math.PI;
}

export function snapPointOnPlane(point: Vector3D, snapSize: number): Vector3D {
  return {
    x: snapToGrid(point.x, snapSize),
    y: point.y,
    z: snapToGrid(point.z, snapSize),
  };
}

export function snapAngleFromStart(startPoint: Vector3D, targetPoint: Vector3D, angleSnapDeg: number): Vector3D {
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
}

export function wallLength(startPoint: Vector3D, endPoint: Vector3D): number {
  const dx = endPoint.x - startPoint.x;
  const dz = endPoint.z - startPoint.z;
  return Math.sqrt(dx * dx + dz * dz);
}

export function buildWallPreviewMetrics(startPoint: Vector3D, endPoint: Vector3D): WallPreviewMetrics | null {
  const lengthM = wallLength(startPoint, endPoint);
  if (lengthM < 1e-6) {
    return null;
  }

  const dx = endPoint.x - startPoint.x;
  const dz = endPoint.z - startPoint.z;
  const angleDeg = ((toDegrees(Math.atan2(dz, dx)) % 360) + 360) % 360;

  return {
    lengthM,
    angleDeg,
    cost: lengthM * WALL_COST_PER_METER,
  };
}

export function createWallFromPoints(startPoint: Vector3D, endPoint: Vector3D, levelId: string | undefined, height: number) {
  return createWallEntity({
    startPoint,
    endPoint,
    levelId,
    height,
  });
}
