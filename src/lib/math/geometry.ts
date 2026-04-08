import { Vector3D, Wall } from "@/types/project.types";

export function distanceBetweenPoints(p1: Vector3D, p2: Vector3D): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const dz = p2.z - p1.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function getWallRotation(start: Vector3D, end: Vector3D): number {
  return Math.atan2(end.z - start.z, end.x - start.x);
}

export function getWallCenter(start: Vector3D, end: Vector3D): Vector3D {
  return {
    x: (start.x + end.x) / 2,
    y: (start.y + end.y) / 2,
    z: (start.z + end.z) / 2,
  };
}

export function lineIntersection(wall1: Wall, wall2: Wall): Vector3D | null {
  const x1 = wall1.startPoint.x;
  const z1 = wall1.startPoint.z;
  const x2 = wall1.endPoint.x;
  const z2 = wall1.endPoint.z;

  const x3 = wall2.startPoint.x;
  const z3 = wall2.startPoint.z;
  const x4 = wall2.endPoint.x;
  const z4 = wall2.endPoint.z;

  const denominator = (x1 - x2) * (z3 - z4) - (z1 - z2) * (x3 - x4);
  if (Math.abs(denominator) < 1e-9) {
    return null;
  }

  const t = ((x1 - x3) * (z3 - z4) - (z1 - z3) * (x3 - x4)) / denominator;
  const u = ((x1 - x3) * (z1 - z2) - (z1 - z3) * (x1 - x2)) / denominator;

  if (t < 0 || t > 1 || u < 0 || u > 1) {
    return null;
  }

  const x = x1 + t * (x2 - x1);
  const z = z1 + t * (z2 - z1);

  return {
    x,
    y: (wall1.startPoint.y + wall1.endPoint.y + wall2.startPoint.y + wall2.endPoint.y) / 4,
    z,
  };
}

export function shoelaceArea(vertices: Vector3D[]): number {
  if (vertices.length < 3) {
    return 0;
  }

  let areaAccumulator = 0;

  for (let i = 0; i < vertices.length; i += 1) {
    const current = vertices[i];
    const next = vertices[(i + 1) % vertices.length];
    areaAccumulator += current.x * next.z - next.x * current.z;
  }

  return Math.abs(areaAccumulator) / 2;
}

export function isClockwise(vertices: Vector3D[]): boolean {
  if (vertices.length < 3) {
    return false;
  }

  let signedArea = 0;

  for (let i = 0; i < vertices.length; i += 1) {
    const current = vertices[i];
    const next = vertices[(i + 1) % vertices.length];
    signedArea += current.x * next.z - next.x * current.z;
  }

  return signedArea < 0;
}
