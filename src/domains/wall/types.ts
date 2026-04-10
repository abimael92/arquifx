import { Opening, Vector3D } from "@/types/project.types";

export interface WallTransform {
  length: number;
  rotationY: number;
  position: [number, number, number];
}

export interface OpeningHoleRect {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface WallPreviewMetrics {
  lengthM: number;
  angleDeg: number;
  cost: number;
}

export interface CreateWallParams {
  startPoint: Vector3D;
  endPoint: Vector3D;
  levelId?: string;
  height: number;
}

export interface WallOpeningsInput {
  openings: Opening[];
  wallLength: number;
  wallHeight: number;
}
