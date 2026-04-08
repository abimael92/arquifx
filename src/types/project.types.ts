export type MaterialType = "ladrillo" | "hormigon" | "madera";

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface Wall {
  id: string;
  startPoint: Vector3D;
  endPoint: Vector3D;
  height: number;
  thickness: number;
  materialType: MaterialType;
  layer: string;
  isLoadBearing: boolean;
}

export interface Opening {
  id: string;
  wallId: string;
  type: "puerta" | "ventana" | "hueco";
  positionFromStart: number;
  width: number;
  height: number;
  sillHeight: number;
  materialType: MaterialType;
}

export interface Floor {
  id: string;
  level: number;
  vertices: Vector3D[];
  holes?: Vector3D[][];
  areaM2: number;
}

export interface ProjectSettings {
  gridSnap: number;
  angleSnap: number;
  showGrid: boolean;
  defaultWallHeight: number;
}

export interface ProjectStatistics {
  totalWalls: number;
  totalFloors: number;
  totalOpenings: number;
  totalAreaM2: number;
}

export interface Project {
  id: string;
  name: string;
  walls: Wall[];
  floors: Floor[];
  openings: Opening[];
  settings: ProjectSettings;
  statistics: ProjectStatistics;
}
