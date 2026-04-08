import { Project, Wall } from "@/types/project.types";

import { distanceBetweenPoints } from "./geometry";

const MATERIAL_COST_PER_M2 = {
  ladrillo: 45,
  hormigon: 60,
  madera: 80,
} as const;

const DOOR_FLAT_COST = 150;
const WINDOW_FLAT_COST = 300;

export function calculateTotalFloorArea(floors: Project["floors"]): number {
  return floors.reduce((accumulator, floor) => accumulator + floor.areaM2, 0);
}

export function calculateWallArea(wall: Wall): number {
  const wallLength = distanceBetweenPoints(wall.startPoint, wall.endPoint);
  return wallLength * wall.height;
}

export function calculateProjectCost(project: Project): number {
  const wallCost = project.walls.reduce((accumulator, wall) => {
    const wallArea = calculateWallArea(wall);
    const materialCost = MATERIAL_COST_PER_M2[wall.materialType];
    return accumulator + wallArea * materialCost;
  }, 0);

  const openingsCost = project.openings.reduce((accumulator, opening) => {
    if (opening.type === "puerta") {
      return accumulator + DOOR_FLAT_COST;
    }

    if (opening.type === "ventana") {
      return accumulator + WINDOW_FLAT_COST;
    }

    return accumulator;
  }, 0);

  return wallCost + openingsCost;
}
