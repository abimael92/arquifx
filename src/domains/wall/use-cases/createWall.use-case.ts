import { Vector3D } from "@/types/project.types";

import { createWallFromPoints } from "../services/wall-drawing.service";

export function createWallUseCase(params: {
  startPoint: Vector3D;
  endPoint: Vector3D;
  levelId?: string;
  height: number;
}) {
  return createWallFromPoints(params.startPoint, params.endPoint, params.levelId, params.height);
}
