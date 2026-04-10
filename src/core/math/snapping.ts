import { Vector3D } from "@/types/project.types";

export function snapToGrid(value: number, gridSize = 0.05): number {
  if (gridSize <= 0) {
    return value;
  }

  return Math.round(value / gridSize) * gridSize;
}

export function snapPointToGrid(point: Vector3D, gridSize = 0.05): Vector3D {
  return {
    x: snapToGrid(point.x, gridSize),
    y: point.y,
    z: snapToGrid(point.z, gridSize),
  };
}
