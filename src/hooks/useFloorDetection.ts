"use client";

import { useEffect, useMemo } from "react";

import { shoelaceArea } from "@/lib/math/geometry";
import { useAppStore } from "@/store";
import { Floor, Vector3D, Wall } from "@/types/project.types";

const ROUND_PRECISION = 1000;
const EPSILON = 1e-6;

interface LoopPolygon {
  id: string;
  vertices: Vector3D[];
  area: number;
}

const pointKey = (point: Vector3D) => {
  const x = Math.round(point.x * ROUND_PRECISION) / ROUND_PRECISION;
  const z = Math.round(point.z * ROUND_PRECISION) / ROUND_PRECISION;
  return `${x}:${z}`;
};

const keyToPoint = (key: string): Vector3D => {
  const [x, z] = key.split(":").map(Number);
  return { x, y: 0, z };
};

const almostEqual = (a: number, b: number) => Math.abs(a - b) <= EPSILON;
const pointEquals = (a: Vector3D, b: Vector3D) => almostEqual(a.x, b.x) && almostEqual(a.z, b.z);

const polygonSignedArea = (vertices: Vector3D[]) => {
  let areaAccumulator = 0;

  for (let i = 0; i < vertices.length; i += 1) {
    const current = vertices[i];
    const next = vertices[(i + 1) % vertices.length];
    areaAccumulator += current.x * next.z - next.x * current.z;
  }

  return areaAccumulator / 2;
};

const ensureCounterClockwise = (vertices: Vector3D[]) => {
  const signedArea = polygonSignedArea(vertices);
  return signedArea < 0 ? [...vertices].reverse() : vertices;
};

const pointInPolygon = (point: Vector3D, polygon: Vector3D[]) => {
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const pi = polygon[i];
    const pj = polygon[j];

    const intersects =
      pi.z > point.z !== pj.z > point.z && point.x < ((pj.x - pi.x) * (point.z - pi.z)) / (pj.z - pi.z + EPSILON) + pi.x;

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
};

const orientation = (a: Vector3D, b: Vector3D, c: Vector3D) => {
  const value = (b.z - a.z) * (c.x - b.x) - (b.x - a.x) * (c.z - b.z);
  if (almostEqual(value, 0)) {
    return 0;
  }

  return value > 0 ? 1 : 2;
};

const onSegment = (a: Vector3D, b: Vector3D, c: Vector3D) => {
  return (
    Math.min(a.x, c.x) - EPSILON <= b.x &&
    b.x <= Math.max(a.x, c.x) + EPSILON &&
    Math.min(a.z, c.z) - EPSILON <= b.z &&
    b.z <= Math.max(a.z, c.z) + EPSILON
  );
};

const segmentsIntersect = (p1: Vector3D, q1: Vector3D, p2: Vector3D, q2: Vector3D) => {
  if (pointEquals(p1, p2) || pointEquals(p1, q2) || pointEquals(q1, p2) || pointEquals(q1, q2)) {
    return false;
  }

  const o1 = orientation(p1, q1, p2);
  const o2 = orientation(p1, q1, q2);
  const o3 = orientation(p2, q2, p1);
  const o4 = orientation(p2, q2, q1);

  if (o1 !== o2 && o3 !== o4) {
    return true;
  }

  if (o1 === 0 && onSegment(p1, p2, q1)) {
    return true;
  }
  if (o2 === 0 && onSegment(p1, q2, q1)) {
    return true;
  }
  if (o3 === 0 && onSegment(p2, p1, q2)) {
    return true;
  }
  if (o4 === 0 && onSegment(p2, q1, q2)) {
    return true;
  }

  return false;
};

const polygonsOverlap = (a: Vector3D[], b: Vector3D[]) => {
  for (let i = 0; i < a.length; i += 1) {
    const a1 = a[i];
    const a2 = a[(i + 1) % a.length];

    for (let j = 0; j < b.length; j += 1) {
      const b1 = b[j];
      const b2 = b[(j + 1) % b.length];

      if (segmentsIntersect(a1, a2, b1, b2)) {
        return true;
      }
    }
  }

  return false;
};

function detectClosedLoops(walls: Wall[]): Vector3D[][] {
  const adjacency = new Map<string, Set<string>>();

  walls.forEach((wall) => {
    const startKey = pointKey(wall.startPoint);
    const endKey = pointKey(wall.endPoint);

    if (startKey === endKey) {
      return;
    }

    if (!adjacency.has(startKey)) {
      adjacency.set(startKey, new Set());
    }
    if (!adjacency.has(endKey)) {
      adjacency.set(endKey, new Set());
    }

    adjacency.get(startKey)?.add(endKey);
    adjacency.get(endKey)?.add(startKey);
  });

  const visitedNode = new Set<string>();
  const loops: Vector3D[][] = [];

  for (const node of adjacency.keys()) {
    if (visitedNode.has(node)) {
      continue;
    }

    const stack = [node];
    const component: string[] = [];

    while (stack.length > 0) {
      const current = stack.pop() as string;
      if (visitedNode.has(current)) {
        continue;
      }

      visitedNode.add(current);
      component.push(current);

      const neighbors = adjacency.get(current);
      if (!neighbors) {
        continue;
      }

      neighbors.forEach((neighbor) => {
        if (!visitedNode.has(neighbor)) {
          stack.push(neighbor);
        }
      });
    }

    if (component.length < 3) {
      continue;
    }

    const allDegreeTwo = component.every((key) => (adjacency.get(key)?.size ?? 0) === 2);
    if (!allDegreeTwo) {
      continue;
    }

    const start = component[0];
    let current = start;
    let previous: string | null = null;
    const loop: string[] = [];
    const guardLimit = component.length + 2;

    for (let i = 0; i < guardLimit; i += 1) {
      loop.push(current);
      const neighbors = [...(adjacency.get(current) ?? new Set())];
      const next = neighbors.find((neighbor) => neighbor !== previous);

      if (!next) {
        break;
      }

      previous = current;
      current = next;

      if (current === start) {
        break;
      }
    }

    if (current !== start || loop.length < 3) {
      continue;
    }

    loops.push(loop.map(keyToPoint));
  }

  return loops;
}

function buildFloorsWithHoles(loops: Vector3D[][]): Floor[] {
  const polygons: LoopPolygon[] = loops
    .map((loop, index) => {
      const vertices = ensureCounterClockwise(loop);
      return {
        id: `loop-${index + 1}`,
        vertices,
        area: shoelaceArea(vertices),
      };
    })
    .filter((polygon) => polygon.area > 0.0001);

  const invalidPolygonIds = new Set<string>();

  for (let i = 0; i < polygons.length; i += 1) {
    for (let j = i + 1; j < polygons.length; j += 1) {
      const a = polygons[i];
      const b = polygons[j];
      const aInsideB = pointInPolygon(a.vertices[0], b.vertices);
      const bInsideA = pointInPolygon(b.vertices[0], a.vertices);

      if (!aInsideB && !bInsideA && polygonsOverlap(a.vertices, b.vertices)) {
        invalidPolygonIds.add(a.id);
        invalidPolygonIds.add(b.id);
      }
    }
  }

  const validPolygons = polygons.filter((polygon) => !invalidPolygonIds.has(polygon.id));
  const parentById = new Map<string, string | null>();

  validPolygons.forEach((polygon) => {
    const containers = validPolygons
      .filter((candidate) => candidate.id !== polygon.id)
      .filter((candidate) => pointInPolygon(polygon.vertices[0], candidate.vertices));

    if (containers.length === 0) {
      parentById.set(polygon.id, null);
      return;
    }

    containers.sort((a, b) => a.area - b.area);
    parentById.set(polygon.id, containers[0].id);
  });

  const depthById = new Map<string, number>();

  const getDepth = (id: string): number => {
    if (depthById.has(id)) {
      return depthById.get(id) as number;
    }

    const parent = parentById.get(id);
    if (!parent) {
      depthById.set(id, 0);
      return 0;
    }

    const depth = getDepth(parent) + 1;
    depthById.set(id, depth);
    return depth;
  };

  validPolygons.forEach((polygon) => {
    getDepth(polygon.id);
  });

  return validPolygons
    .filter((polygon) => (depthById.get(polygon.id) ?? 0) % 2 === 0)
    .map((outerPolygon, index) => {
      const holePolygons = validPolygons.filter((candidate) => {
        const parent = parentById.get(candidate.id);
        return parent === outerPolygon.id && (depthById.get(candidate.id) ?? 0) % 2 === 1;
      });

      const holes = holePolygons.map((hole) => [...hole.vertices].reverse());
      const holesArea = holePolygons.reduce((acc, hole) => acc + hole.area, 0);
      const areaM2 = Math.max(outerPolygon.area - holesArea, 0);

      return {
        id: `auto-floor-${index + 1}`,
        level: 0,
        vertices: outerPolygon.vertices,
        holes,
        areaM2,
      } satisfies Floor;
    })
    .filter((floor) => floor.areaM2 > 0.0001);
}

export function useFloorDetection() {
  const walls = useAppStore((state) => state.walls);
  const setFloors = useAppStore((state) => state.setFloors);

  const detectedFloors = useMemo<Floor[]>(() => {
    const loops = detectClosedLoops(walls);
    return buildFloorsWithHoles(loops);
  }, [walls]);

  useEffect(() => {
    setFloors(detectedFloors);
  }, [detectedFloors, setFloors]);
}
