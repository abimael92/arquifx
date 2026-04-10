import { v4 as uuidv4 } from "uuid";

import { Wall } from "@/types/project.types";

import { CreateWallParams } from "../types";

export function createWallEntity(params: CreateWallParams): Wall {
  return {
    id: uuidv4(),
    levelId: params.levelId,
    startPoint: params.startPoint,
    endPoint: params.endPoint,
    height: params.height,
    thickness: 0.2,
    materialType: "ladrillo",
    layer: "muros",
    isLoadBearing: false,
    hasInsulation: false,
  };
}
