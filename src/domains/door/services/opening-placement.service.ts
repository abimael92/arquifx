import { Opening, Wall } from "@/types/project.types";

export interface OpeningTransform {
  position: [number, number, number];
  rotationY: number;
}

export function computeOpeningTransform(opening: Opening, wall: Wall): OpeningTransform {
  const dx = wall.endPoint.x - wall.startPoint.x;
  const dz = wall.endPoint.z - wall.startPoint.z;
  const wallLength = Math.max(Math.sqrt(dx * dx + dz * dz), 0.001);
  const dirX = dx / wallLength;
  const dirZ = dz / wallLength;

  const centerX = wall.startPoint.x + dirX * opening.positionFromStart;
  const centerZ = wall.startPoint.z + dirZ * opening.positionFromStart;
  const centerY = wall.startPoint.y + opening.sillHeight + opening.height / 2;

  return {
    position: [centerX, centerY, centerZ],
    rotationY: Math.atan2(dz, dx),
  };
}
