export type MaterialType = "ladrillo" | "hormigon" | "madera";
export type BuildMode = "view" | "build" | "object" | "demolish";
export type BuildSubtool = "lot" | "wall" | "room";
export type ObjectType = "puerta" | "ventana";
export type ViewMode = "blueprint" | "3d" | "top" | "realistic";
export type CameraControlMode = "orbit" | "free";

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface CameraState {
  position: Vector3D;
  target: Vector3D;
  zoom: number;
  rotation: Vector3D;
}

export interface Wall {
  id: string;
  levelId?: string;
  roomIds?: string[];
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
  levelId?: string;
  type: "puerta" | "ventana" | "hueco";
  positionFromStart: number;
  width: number;
  height: number;
  sillHeight: number;
  materialType: MaterialType;
}

export interface Floor {
  id: string;
  levelId?: string;
  roomId?: string;
  level: number;
  vertices: Vector3D[];
  holes?: Vector3D[][];
  areaM2: number;
}

export interface LotConstraint {
  id: string;
  width: number;
  length: number;
  maxHeight: number;
  maxLevels: number;
  origin: Vector3D;
}

export interface Level {
  id: string;
  index: number;
  name: string;
  elevation: number;
  height: number;
  visible: boolean;
  locked: boolean;
}

export interface Room {
  id: string;
  levelId: string;
  name?: string;
  boundary: Vector3D[];
  areaM2: number;
  wallIds: string[];
  floorId?: string;
  isValid: boolean;
}

export interface DragMetrics {
  lengthM?: number;
  widthM?: number;
  areaM2?: number;
  angleDeg?: number;
  cost?: number;
}

export interface DragState {
  active: boolean;
  pointerId: number | null;
  mode: BuildMode;
  subtool?: BuildSubtool;
  startWorld: Vector3D | null;
  currentWorld: Vector3D | null;
  snappedWorld: Vector3D | null;
  previewEntityIds: string[];
  metrics: DragMetrics;
}

export interface ProjectSettings {
  gridSnap: number;
  angleSnap: number;
  showGrid: boolean;
  defaultWallHeight: number;
  openingRailConstrainedThresholdM: number;
}

export interface EditorProjectSettings {
  name: string;
  terrainWidth: number;
  terrainLength: number;
  maxHeight?: number;
  maxFloors?: number;
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
  rooms?: Room[];
  levels?: Level[];
  lot?: LotConstraint;
  settings: ProjectSettings;
  statistics: ProjectStatistics;
}
