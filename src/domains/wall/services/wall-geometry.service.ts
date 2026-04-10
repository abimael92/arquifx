import { ExtrudeGeometry, Path, Shape, Vector2 } from "three";

import { Wall } from "@/types/project.types";

import { OpeningHoleRect, WallOpeningsInput, WallTransform } from "../types";

const EDGE_PADDING = 0.02;
const MIN_HOLE_SIZE = 0.05;

export function computeWallTransform(wall: Wall): WallTransform {
  const dx = wall.endPoint.x - wall.startPoint.x;
  const dz = wall.endPoint.z - wall.startPoint.z;
  const lengthValue = Math.sqrt(dx * dx + dz * dz);

  return {
    length: Math.max(lengthValue, 0.01),
    position: [
      (wall.startPoint.x + wall.endPoint.x) / 2,
      (wall.startPoint.y + wall.endPoint.y) / 2,
      (wall.startPoint.z + wall.endPoint.z) / 2,
    ],
    rotationY: Math.atan2(dz, dx),
  };
}

function toHoleRect(openingInput: WallOpeningsInput, openingIndex: number): OpeningHoleRect | null {
  const opening = openingInput.openings[openingIndex];
  const centerX = -openingInput.wallLength / 2 + opening.positionFromStart;
  const halfWidth = opening.width / 2;
  const rawMinX = centerX - halfWidth;
  const rawMaxX = centerX + halfWidth;
  const rawMinY = opening.sillHeight;
  const rawMaxY = opening.sillHeight + opening.height;

  const minX = Math.max(-openingInput.wallLength / 2 + EDGE_PADDING, rawMinX);
  const maxX = Math.min(openingInput.wallLength / 2 - EDGE_PADDING, rawMaxX);
  const minY = Math.max(EDGE_PADDING, rawMinY);
  const maxY = Math.min(openingInput.wallHeight - EDGE_PADDING, rawMaxY);

  if (maxX - minX < MIN_HOLE_SIZE || maxY - minY < MIN_HOLE_SIZE) {
    return null;
  }

  return { minX, maxX, minY, maxY };
}

export function buildWallGeometry(wall: Wall, wallLength: number, openingsInput: WallOpeningsInput): ExtrudeGeometry {
  const shape = new Shape([
    new Vector2(-wallLength / 2, 0),
    new Vector2(wallLength / 2, 0),
    new Vector2(wallLength / 2, wall.height),
    new Vector2(-wallLength / 2, wall.height),
  ]);

  for (let i = 0; i < openingsInput.openings.length; i += 1) {
    const holeRect = toHoleRect(openingsInput, i);
    if (!holeRect) {
      continue;
    }

    const hole = new Path([
      new Vector2(holeRect.minX, holeRect.minY),
      new Vector2(holeRect.maxX, holeRect.minY),
      new Vector2(holeRect.maxX, holeRect.maxY),
      new Vector2(holeRect.minX, holeRect.maxY),
    ]);
    hole.autoClose = true;
    shape.holes.push(hole);
  }

  const geometry = new ExtrudeGeometry(shape, {
    depth: wall.thickness,
    bevelEnabled: false,
    curveSegments: 2,
    steps: 1,
  });
  geometry.translate(0, 0, -wall.thickness / 2);
  geometry.computeVertexNormals();
  return geometry;
}
