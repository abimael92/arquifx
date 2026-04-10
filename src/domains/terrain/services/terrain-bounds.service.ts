import { Vector3D } from "@/types/project.types";

export interface TerrainBounds {
  width: number;
  length: number;
}

export interface ClampResult {
  point: Vector3D;
  wasClamped: boolean;
}

export function clampPointToTerrain(point: Vector3D, bounds: TerrainBounds): ClampResult {
  const halfWidth = bounds.width / 2;
  const halfLength = bounds.length / 2;
  const clampedX = Math.min(halfWidth, Math.max(-halfWidth, point.x));
  const clampedZ = Math.min(halfLength, Math.max(-halfLength, point.z));

  return {
    point: { ...point, x: clampedX, z: clampedZ },
    wasClamped: clampedX !== point.x || clampedZ !== point.z,
  };
}
