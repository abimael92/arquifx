import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";

import {
  BuildMode,
  BuildSubtool,
  CameraControlMode,
  CameraState,
  DragState,
  EditorProjectSettings,
  Floor,
  Level,
  LotConstraint,
  ObjectType,
  Opening,
  Project,
  ProjectSettings,
  Room,
  ViewMode,
  Vector3D,
  Wall,
} from "@/types/project.types";

export type SelectedTool =
  | "Muros"
  | "Puertas"
  | "Ventanas"
  | "Suelos"
  | "Medir"
  | "Seleccionar"
  | "Eliminar";

type WallUpdates = Partial<Omit<Wall, "id">>;
type OpeningUpdates = Partial<Omit<Opening, "id" | "wallId">>;

interface WallsSlice {
  walls: Wall[];
  selectedWallId: string | null;
  addWall: (wall: Wall) => void;
  updateWall: (id: string, updates: WallUpdates) => void;
  deleteWall: (id: string) => void;
  selectWall: (id: string | null) => void;
}

interface OpeningsSlice {
  selectedOpeningId: string | null;
  addOpening: (
    wallId: string,
    type: "puerta" | "ventana",
    positionFromStart: number,
    width: number,
    height: number,
  ) => void;
  updateOpening: (id: string, updates: OpeningUpdates) => void;
  deleteOpening: (id: string) => void;
  selectOpening: (id: string | null) => void;
}

interface FloorsSelectionSlice {
  selectedFloorId: string | null;
  selectFloor: (id: string | null) => void;
}

interface UiSlice {
  selectedTool: SelectedTool;
  isDrawingMode: boolean;
  showGrid: boolean;
  showMeasurements: boolean;
  gridSpacing: number;
  cameraPosition: Vector3D;
  viewMode: ViewMode;
  cameraControlMode: CameraControlMode;
  cameraStates: Record<ViewMode, CameraState>;
  cameraTransition: {
    active: boolean;
    mode: ViewMode;
    target: CameraState;
  } | null;
  openingRailConstrainedThresholdM: number;
  realisticShadows: boolean;
  sunAzimuth: number;
  terrainViolation: boolean;
  setSelectedTool: (tool: SelectedTool) => void;
  setIsDrawingMode: (enabled: boolean) => void;
  setShowGrid: (visible: boolean) => void;
  setShowMeasurements: (visible: boolean) => void;
  setGridSpacing: (spacing: number) => void;
  setCameraPosition: (position: Vector3D) => void;
  setViewMode: (mode: ViewMode) => void;
  setCameraControlMode: (mode: CameraControlMode) => void;
  setCameraStateForMode: (mode: ViewMode, updates: Partial<CameraState>) => void;
  transitionCameraTo: (mode: ViewMode, target: Partial<CameraState>) => void;
  clearCameraTransition: () => void;
  setOpeningRailConstrainedThresholdM: (value: number) => void;
  setRealisticShadows: (enabled: boolean) => void;
  setSunAzimuth: (azimuth: number) => void;
  setTerrainViolation: (active: boolean) => void;
}

interface BuildFlowSlice {
  mode: BuildMode;
  activeMode: BuildMode;
  activeBuildSubtool: BuildSubtool;
  activeObjectType: ObjectType;
  dragState: DragState;
  setMode: (mode: BuildMode) => void;
  setActiveMode: (mode: BuildMode) => void;
  setActiveBuildSubtool: (subtool: BuildSubtool) => void;
  setActiveObjectType: (objectType: ObjectType) => void;
  setDragState: (updates: Partial<DragState>) => void;
  resetDragState: () => void;
}

interface LevelsSlice {
  levels: Level[];
  activeLevelId: string;
  addLevel: (name?: string) => void;
  setActiveLevel: (levelId: string) => void;
  toggleLevelVisibility: (levelId: string) => void;
}

interface RoomsSlice {
  rooms: Room[];
  createRoomFromRectangle: (startPoint: Vector3D, endPoint: Vector3D) => void;
  deleteRoom: (roomId: string) => void;
}

interface LotSlice {
  lot: LotConstraint;
  setLot: (updates: Partial<LotConstraint>) => void;
}

interface ProjectSlice {
  floors: Floor[];
  openings: Opening[];
  currentProject: Project | null;
  projectInitialized: boolean;
  projectSettings: EditorProjectSettings;
  setFloors: (floors: Floor[]) => void;
  initializeProjectSetup: (settings: EditorProjectSettings) => void;
  saveProject: () => Project;
  loadProject: (project: Project) => void;
  newProject: (name?: string) => void;
}

interface UndoSnapshot {
  walls: Wall[];
  floors: Floor[];
  openings: Opening[];
  selectedWallId: string | null;
  selectedOpeningId: string | null;
  selectedFloorId: string | null;
  selectedTool: SelectedTool;
  isDrawingMode: boolean;
  showGrid: boolean;
  showMeasurements: boolean;
  gridSpacing: number;
  cameraPosition: Vector3D;
  viewMode: ViewMode;
  cameraControlMode: CameraControlMode;
  cameraStates: Record<ViewMode, CameraState>;
  cameraTransition: {
    active: boolean;
    mode: ViewMode;
    target: CameraState;
  } | null;
  openingRailConstrainedThresholdM: number;
  realisticShadows: boolean;
  sunAzimuth: number;
  terrainViolation: boolean;
  projectInitialized: boolean;
  projectSettings: EditorProjectSettings;
  mode: BuildMode;
  activeMode: BuildMode;
  activeBuildSubtool: BuildSubtool;
  activeObjectType: ObjectType;
  activeLevelId: string;
  levels: Level[];
  rooms: Room[];
  lot: LotConstraint;
  currentProject: Project | null;
}

interface UndoRedoSlice {
  historyPast: UndoSnapshot[];
  historyFuture: UndoSnapshot[];
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

type StoreState =
  & WallsSlice
  & OpeningsSlice
  & FloorsSelectionSlice
  & UiSlice
  & BuildFlowSlice
  & LevelsSlice
  & RoomsSlice
  & LotSlice
  & ProjectSlice
  & UndoRedoSlice;

const defaultSettings: ProjectSettings = {
  gridSnap: 0.1,
  angleSnap: 15,
  showGrid: true,
  defaultWallHeight: 2.8,
  openingRailConstrainedThresholdM: 0.12,
};

const defaultCameraPosition: Vector3D = { x: 8, y: 6, z: 8 };
const defaultCameraStates: Record<ViewMode, CameraState> = {
  "3d": {
    position: { x: 8, y: 6, z: 8 },
    target: { x: 0, y: 0, z: 0 },
    zoom: 1,
    rotation: { x: 0, y: 0, z: 0 },
  },
  top: {
    position: { x: 0, y: 14, z: 0.1 },
    target: { x: 0, y: 0, z: 0 },
    zoom: 1,
    rotation: { x: -Math.PI / 2, y: 0, z: 0 },
  },
  blueprint: {
    position: { x: 0, y: 20, z: 0.1 },
    target: { x: 0, y: 0, z: 0 },
    zoom: 36,
    rotation: { x: -Math.PI / 2, y: 0, z: 0 },
  },
  realistic: {
    position: { x: 10, y: 7, z: 10 },
    target: { x: 0, y: 0, z: 0 },
    zoom: 1,
    rotation: { x: 0, y: 0, z: 0 },
  },
};
const defaultLevelId = "level-0";
const defaultLevels: Level[] = [
  {
    id: defaultLevelId,
    index: 0,
    name: "Nivel 1",
    elevation: 0,
    height: 2.8,
    visible: true,
    locked: false,
  },
];

const defaultLot: LotConstraint = {
  id: "lot-1",
  width: 20,
  length: 20,
  maxHeight: 9,
  maxLevels: 3,
  origin: { x: 0, y: 0, z: 0 },
};

const defaultEditorProjectSettings: EditorProjectSettings = {
  name: "",
  terrainWidth: defaultLot.width,
  terrainLength: defaultLot.length,
  maxHeight: defaultLot.maxHeight,
  maxFloors: defaultLot.maxLevels,
};

const defaultDragState: DragState = {
  active: false,
  pointerId: null,
  mode: "build",
  subtool: "wall",
  startWorld: null,
  currentWorld: null,
  snappedWorld: null,
  previewEntityIds: [],
  metrics: {},
};

const calculateStatistics = (walls: Wall[], floors: Floor[], openings: Opening[]) => {
  const totalAreaM2 = floors.reduce((acc, floor) => acc + floor.areaM2, 0);

  return {
    totalWalls: walls.length,
    totalFloors: floors.length,
    totalOpenings: openings.length,
    totalAreaM2,
  };
};

const buildProject = (
  id: string,
  name: string,
  walls: Wall[],
  floors: Floor[],
  openings: Opening[],
  rooms: Room[],
  levels: Level[],
  lot: LotConstraint,
  settings: ProjectSettings,
): Project => ({
  id,
  name,
  walls,
  floors,
  openings,
  rooms,
  levels,
  lot,
  settings,
  statistics: calculateStatistics(walls, floors, openings),
});

const clampPointToLot = (point: Vector3D, lot: LotConstraint): Vector3D => {
  const halfWidth = lot.width / 2;
  const halfLength = lot.length / 2;

  return {
    ...point,
    x: Math.min(halfWidth, Math.max(-halfWidth, point.x)),
    z: Math.min(halfLength, Math.max(-halfLength, point.z)),
  };
};

const clampWallToLot = (wall: Wall, lot: LotConstraint): Wall => ({
  ...wall,
  hasInsulation: wall.hasInsulation ?? false,
  startPoint: clampPointToLot(wall.startPoint, lot),
  endPoint: clampPointToLot(wall.endPoint, lot),
});

const makeSnapshot = (state: StoreState): UndoSnapshot => ({
  walls: state.walls,
  floors: state.floors,
  openings: state.openings,
  selectedWallId: state.selectedWallId,
  selectedOpeningId: state.selectedOpeningId,
  selectedFloorId: state.selectedFloorId,
  selectedTool: state.selectedTool,
  isDrawingMode: state.isDrawingMode,
  showGrid: state.showGrid,
  showMeasurements: state.showMeasurements,
  gridSpacing: state.gridSpacing,
  cameraPosition: state.cameraPosition,
  viewMode: state.viewMode,
  cameraControlMode: state.cameraControlMode,
  cameraStates: state.cameraStates,
  cameraTransition: state.cameraTransition,
  openingRailConstrainedThresholdM: state.openingRailConstrainedThresholdM,
  realisticShadows: state.realisticShadows,
  sunAzimuth: state.sunAzimuth,
  terrainViolation: state.terrainViolation,
  projectInitialized: state.projectInitialized,
  projectSettings: state.projectSettings,
  mode: state.mode,
  activeMode: state.activeMode,
  activeBuildSubtool: state.activeBuildSubtool,
  activeObjectType: state.activeObjectType,
  activeLevelId: state.activeLevelId,
  levels: state.levels,
  rooms: state.rooms,
  lot: state.lot,
  currentProject: state.currentProject,
});

const isSameSnapshot = (a: UndoSnapshot, b: UndoSnapshot) => JSON.stringify(a) === JSON.stringify(b);

export const useAppStore = create<StoreState>((set, get) => {
  const applyWithHistory = (updater: (state: StoreState) => Partial<StoreState>) => {
    const previous = makeSnapshot(get());

    set((state) => updater(state));

    const next = makeSnapshot(get());
    if (isSameSnapshot(previous, next)) {
      return;
    }

    set((state) => ({
      historyPast: [...state.historyPast, previous],
      historyFuture: [],
    }));
  };

  return {
    walls: [],
    floors: [],
    openings: [],
    selectedWallId: null,
    selectedOpeningId: null,
    selectedFloorId: null,
    selectedTool: "Seleccionar",
    isDrawingMode: false,
    showGrid: true,
    showMeasurements: true,
    gridSpacing: 1,
    cameraPosition: defaultCameraPosition,
    viewMode: "3d",
    cameraControlMode: "orbit",
    cameraStates: defaultCameraStates,
    cameraTransition: null,
    openingRailConstrainedThresholdM: defaultSettings.openingRailConstrainedThresholdM,
    realisticShadows: true,
    sunAzimuth: Math.PI / 4,
    terrainViolation: false,
    mode: "view",
    activeMode: "view",
    activeBuildSubtool: "wall",
    activeObjectType: "puerta",
    dragState: defaultDragState,
    levels: defaultLevels,
    activeLevelId: defaultLevelId,
    rooms: [],
    lot: defaultLot,
    currentProject: null,
    projectInitialized: false,
    projectSettings: defaultEditorProjectSettings,
    historyPast: [],
    historyFuture: [],

    addWall: (wall) => {
      applyWithHistory((state) => {
        const boundedWall = clampWallToLot(wall, state.lot);
        const walls = [...state.walls, boundedWall];
        const currentProject = state.currentProject
          ? buildProject(
              state.currentProject.id,
              state.currentProject.name,
              walls,
              state.floors,
              state.openings,
              state.rooms,
              state.levels,
              state.lot,
              state.currentProject.settings,
            )
          : null;

        return { walls, currentProject };
      });
    },

    updateWall: (id, updates) => {
      applyWithHistory((state) => {
        const walls = state.walls.map((wall) => {
          if (wall.id !== id) {
            return wall;
          }

          return clampWallToLot({ ...wall, ...updates }, state.lot);
        });
        const currentProject = state.currentProject
          ? buildProject(
              state.currentProject.id,
              state.currentProject.name,
              walls,
              state.floors,
              state.openings,
              state.rooms,
              state.levels,
              state.lot,
              state.currentProject.settings,
            )
          : null;

        return { walls, currentProject };
      });
    },

    deleteWall: (id) => {
      applyWithHistory((state) => {
        const walls = state.walls.filter((wall) => wall.id !== id);
        const openings = state.openings.filter((opening) => opening.wallId !== id);
        const selectedWallId = state.selectedWallId === id ? null : state.selectedWallId;
        const selectedOpeningId =
          state.selectedOpeningId && openings.some((opening) => opening.id === state.selectedOpeningId)
            ? state.selectedOpeningId
            : null;
        const currentProject = state.currentProject
          ? buildProject(
              state.currentProject.id,
              state.currentProject.name,
              walls,
              state.floors,
              openings,
              state.rooms,
              state.levels,
              state.lot,
              state.currentProject.settings,
            )
          : null;

        return { walls, openings, selectedWallId, selectedOpeningId, currentProject };
      });
    },

    selectWall: (id) => {
      set({ selectedWallId: id, selectedOpeningId: null, selectedFloorId: null });
    },

    addOpening: (wallId, type, positionFromStart, width, height) => {
      applyWithHistory((state) => {
        const wall = state.walls.find((item) => item.id === wallId);
        if (!wall) {
          return {};
        }

        const dx = wall.endPoint.x - wall.startPoint.x;
        const dy = wall.endPoint.y - wall.startPoint.y;
        const dz = wall.endPoint.z - wall.startPoint.z;
        const wallLength = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const clampedPosition = Math.max(width / 2, Math.min(positionFromStart, Math.max(width / 2, wallLength - width / 2)));

        const opening: Opening = {
          id: uuidv4(),
          wallId,
          type,
          positionFromStart: clampedPosition,
          width,
          height,
          sillHeight: type === "puerta" ? 0 : 0.9,
          materialType: type === "puerta" ? "madera" : "hormigon",
        };

        const openings = [...state.openings, opening];
        const currentProject = state.currentProject
          ? buildProject(
              state.currentProject.id,
              state.currentProject.name,
              state.walls,
              state.floors,
              openings,
              state.rooms,
              state.levels,
              state.lot,
              state.currentProject.settings,
            )
          : null;

        return {
          openings,
          selectedOpeningId: opening.id,
          selectedWallId: wallId,
          selectedFloorId: null,
          currentProject,
        };
      });
    },

    updateOpening: (id, updates) => {
      applyWithHistory((state) => {
        const openings = state.openings.map((opening) => (opening.id === id ? { ...opening, ...updates } : opening));
        const currentProject = state.currentProject
          ? buildProject(
              state.currentProject.id,
              state.currentProject.name,
              state.walls,
              state.floors,
              openings,
              state.rooms,
              state.levels,
              state.lot,
              state.currentProject.settings,
            )
          : null;

        return { openings, currentProject };
      });
    },

    deleteOpening: (id) => {
      applyWithHistory((state) => {
        const openings = state.openings.filter((opening) => opening.id !== id);
        const selectedOpeningId = state.selectedOpeningId === id ? null : state.selectedOpeningId;
        const currentProject = state.currentProject
          ? buildProject(
              state.currentProject.id,
              state.currentProject.name,
              state.walls,
              state.floors,
              openings,
              state.rooms,
              state.levels,
              state.lot,
              state.currentProject.settings,
            )
          : null;

        return { openings, selectedOpeningId, currentProject };
      });
    },

    selectOpening: (id) => {
      set({ selectedOpeningId: id, selectedWallId: null, selectedFloorId: null });
    },

    selectFloor: (id) => {
      set({ selectedFloorId: id, selectedWallId: null, selectedOpeningId: null });
    },

    setSelectedTool: (tool) => {
      set({
        selectedTool: tool,
        isDrawingMode: tool === "Muros" || tool === "Suelos",
        activeMode:
          tool === "Muros" || tool === "Suelos"
            ? "build"
            : tool === "Puertas" || tool === "Ventanas"
              ? "object"
              : tool === "Eliminar"
                ? "demolish"
                : "view",
        mode:
          tool === "Muros" || tool === "Suelos"
            ? "build"
            : tool === "Puertas" || tool === "Ventanas"
              ? "object"
              : tool === "Eliminar"
                ? "demolish"
                : "view",
        activeBuildSubtool: tool === "Suelos" ? "room" : tool === "Muros" ? "wall" : get().activeBuildSubtool,
        activeObjectType: tool === "Ventanas" ? "ventana" : tool === "Puertas" ? "puerta" : get().activeObjectType,
      });
    },

    setIsDrawingMode: (enabled) => {
      set({ isDrawingMode: enabled });
    },

    setShowGrid: (visible) => {
      set({ showGrid: visible });
    },

    setShowMeasurements: (visible) => {
      set({ showMeasurements: visible });
    },

    setGridSpacing: (spacing) => {
      set({ gridSpacing: Math.max(0.1, Math.min(5, spacing)) });
    },

    setCameraPosition: (position) => {
      set({ cameraPosition: position });
    },

    setViewMode: (mode) => {
      set({ viewMode: mode });
    },

    setCameraControlMode: (mode) => {
      set({ cameraControlMode: mode });
    },

    setCameraStateForMode: (mode, updates) => {
      set((state) => ({
        cameraStates: {
          ...state.cameraStates,
          [mode]: {
            ...state.cameraStates[mode],
            ...updates,
            position: updates.position ?? state.cameraStates[mode].position,
            target: updates.target ?? state.cameraStates[mode].target,
            rotation: updates.rotation ?? state.cameraStates[mode].rotation,
            zoom: updates.zoom ?? state.cameraStates[mode].zoom,
          },
        },
      }));
    },

    transitionCameraTo: (mode, target) => {
      set((state) => ({
        cameraTransition: {
          active: true,
          mode,
          target: {
            ...state.cameraStates[mode],
            ...target,
            position: target.position ?? state.cameraStates[mode].position,
            target: target.target ?? state.cameraStates[mode].target,
            rotation: target.rotation ?? state.cameraStates[mode].rotation,
            zoom: target.zoom ?? state.cameraStates[mode].zoom,
          },
        },
      }));
    },

    clearCameraTransition: () => {
      set({ cameraTransition: null });
    },

    setOpeningRailConstrainedThresholdM: (value) => {
      applyWithHistory((state) => {
        const normalized = Math.min(0.5, Math.max(0, value));
        const currentProject = state.currentProject
          ? {
              ...state.currentProject,
              settings: {
                ...defaultSettings,
                ...state.currentProject.settings,
                openingRailConstrainedThresholdM: normalized,
              },
            }
          : null;

        return {
          openingRailConstrainedThresholdM: normalized,
          currentProject,
        };
      });
    },

    setRealisticShadows: (enabled) => {
      set({ realisticShadows: enabled });
    },

    setSunAzimuth: (azimuth) => {
      set({ sunAzimuth: azimuth });
    },

    setTerrainViolation: (active) => {
      set({ terrainViolation: active });
    },

    setMode: (mode) => {
      set({ mode, activeMode: mode });
    },

    setActiveMode: (mode) => {
      set({ activeMode: mode, mode });
    },

    setActiveBuildSubtool: (subtool) => {
      set({ activeBuildSubtool: subtool });
    },

    setActiveObjectType: (objectType) => {
      set({ activeObjectType: objectType });
    },

    setDragState: (updates) => {
      set((state) => ({
        dragState: { ...state.dragState, ...updates },
      }));
    },

    resetDragState: () => {
      set({ dragState: defaultDragState });
    },

    addLevel: (name) => {
      applyWithHistory((state) => {
        const nextIndex = state.levels.length;
        const elevation = state.levels.reduce((acc, level) => Math.max(acc, level.elevation + level.height), 0);
        const level: Level = {
          id: uuidv4(),
          index: nextIndex,
          name: name ?? `Nivel ${nextIndex + 1}`,
          elevation,
          height: state.currentProject?.settings.defaultWallHeight ?? defaultSettings.defaultWallHeight,
          visible: true,
          locked: false,
        };

        const levels = [...state.levels, level];
        const currentProject = state.currentProject
          ? buildProject(
              state.currentProject.id,
              state.currentProject.name,
              state.walls,
              state.floors,
              state.openings,
              state.rooms,
              levels,
              state.lot,
              state.currentProject.settings,
            )
          : null;

        return { levels, activeLevelId: level.id, currentProject };
      });
    },

    setActiveLevel: (levelId) => {
      set({ activeLevelId: levelId });
    },

    toggleLevelVisibility: (levelId) => {
      applyWithHistory((state) => {
        const levels = state.levels.map((level) =>
          level.id === levelId ? { ...level, visible: !level.visible } : level,
        );
        const currentProject = state.currentProject
          ? buildProject(
              state.currentProject.id,
              state.currentProject.name,
              state.walls,
              state.floors,
              state.openings,
              state.rooms,
              levels,
              state.lot,
              state.currentProject.settings,
            )
          : null;

        return { levels, currentProject };
      });
    },

    createRoomFromRectangle: (startPoint, endPoint) => {
      applyWithHistory((state) => {
        const boundedStart = clampPointToLot(startPoint, state.lot);
        const boundedEnd = clampPointToLot(endPoint, state.lot);
        const minX = Math.min(boundedStart.x, boundedEnd.x);
        const maxX = Math.max(boundedStart.x, boundedEnd.x);
        const minZ = Math.min(boundedStart.z, boundedEnd.z);
        const maxZ = Math.max(boundedStart.z, boundedEnd.z);
        const width = maxX - minX;
        const length = maxZ - minZ;

        if (width < 0.2 || length < 0.2) {
          return {};
        }

        const activeLevel = state.levels.find((level) => level.id === state.activeLevelId) ?? state.levels[0];
        const baseY = activeLevel?.elevation ?? 0;
        const roomId = uuidv4();
        const wallHeight = state.currentProject?.settings.defaultWallHeight ?? defaultSettings.defaultWallHeight;

        const p1: Vector3D = { x: minX, y: baseY, z: minZ };
        const p2: Vector3D = { x: maxX, y: baseY, z: minZ };
        const p3: Vector3D = { x: maxX, y: baseY, z: maxZ };
        const p4: Vector3D = { x: minX, y: baseY, z: maxZ };

        const makeWall = (start: Vector3D, end: Vector3D): Wall => ({
          id: uuidv4(),
          levelId: activeLevel?.id,
          roomIds: [roomId],
          startPoint: start,
          endPoint: end,
          height: wallHeight,
          thickness: 0.2,
          materialType: "ladrillo",
          layer: "muros",
          isLoadBearing: false,
          hasInsulation: false,
        });

        const roomWalls = [
          makeWall(p1, p2),
          makeWall(p2, p3),
          makeWall(p3, p4),
          makeWall(p4, p1),
        ];

        const room: Room = {
          id: roomId,
          levelId: activeLevel?.id ?? defaultLevelId,
          boundary: [p1, p2, p3, p4],
          areaM2: width * length,
          wallIds: roomWalls.map((wall) => wall.id),
          isValid: true,
        };

        const walls = [...state.walls, ...roomWalls];
        const rooms = [...state.rooms, room];

        const currentProject = state.currentProject
          ? buildProject(
              state.currentProject.id,
              state.currentProject.name,
              walls,
              state.floors,
              state.openings,
              rooms,
              state.levels,
              state.lot,
              state.currentProject.settings,
            )
          : null;

        return { walls, rooms, currentProject };
      });
    },

    deleteRoom: (roomId) => {
      applyWithHistory((state) => {
        const room = state.rooms.find((item) => item.id === roomId);
        if (!room) {
          return {};
        }

        const roomWallIds = new Set(room.wallIds);
        const walls = state.walls.filter((wall) => !roomWallIds.has(wall.id));
        const openings = state.openings.filter((opening) => !roomWallIds.has(opening.wallId));
        const rooms = state.rooms.filter((item) => item.id !== roomId);

        const currentProject = state.currentProject
          ? buildProject(
              state.currentProject.id,
              state.currentProject.name,
              walls,
              state.floors,
              openings,
              rooms,
              state.levels,
              state.lot,
              state.currentProject.settings,
            )
          : null;

        return { walls, openings, rooms, currentProject };
      });
    },

    setLot: (updates) => {
      applyWithHistory((state) => {
        const lot = { ...state.lot, ...updates };
        const projectSettings = {
          ...state.projectSettings,
          terrainWidth: lot.width,
          terrainLength: lot.length,
          maxHeight: lot.maxHeight,
          maxFloors: lot.maxLevels,
        };
        const currentProject = state.currentProject
          ? buildProject(
              state.currentProject.id,
              state.currentProject.name,
              state.walls,
              state.floors,
              state.openings,
              state.rooms,
              state.levels,
              lot,
              state.currentProject.settings,
            )
          : null;

        return { lot, currentProject, projectSettings };
      });
    },

    initializeProjectSetup: (settings) => {
      applyWithHistory(() => {
        const lot: LotConstraint = {
          id: "lot-1",
          width: Math.max(4, settings.terrainWidth),
          length: Math.max(4, settings.terrainLength),
          maxHeight: Math.max(3, settings.maxHeight ?? defaultLot.maxHeight),
          maxLevels: Math.max(1, settings.maxFloors ?? defaultLot.maxLevels),
          origin: { x: 0, y: 0, z: 0 },
        };

        const projectSettings: EditorProjectSettings = {
          name: settings.name.trim() || "Nuevo proyecto",
          terrainWidth: lot.width,
          terrainLength: lot.length,
          maxHeight: lot.maxHeight,
          maxFloors: lot.maxLevels,
        };

        const project = buildProject(
          uuidv4(),
          projectSettings.name,
          [],
          [],
          [],
          [],
          defaultLevels,
          lot,
          { ...defaultSettings, showGrid: true },
        );

        return {
          currentProject: project,
          walls: [],
          floors: [],
          openings: [],
          rooms: [],
          levels: defaultLevels,
          activeLevelId: defaultLevelId,
          lot,
          projectInitialized: true,
          projectSettings,
          selectedTool: "Seleccionar",
          mode: "view",
          activeMode: "view",
          viewMode: "3d",
          cameraControlMode: "orbit",
          cameraStates: defaultCameraStates,
          cameraTransition: null,
          terrainViolation: false,
          sunAzimuth: Math.PI / 4,
        };
      });
    },

    setFloors: (floors) => {
      applyWithHistory((state) => {
        const currentProject = state.currentProject
          ? buildProject(
              state.currentProject.id,
              state.currentProject.name,
              state.walls,
              floors,
              state.openings,
              state.rooms,
              state.levels,
              state.lot,
              state.currentProject.settings,
            )
          : null;

        return { floors, currentProject };
      });
    },

    saveProject: () => {
      const state = get();

      const projectId = state.currentProject?.id ?? uuidv4();
      const projectName = state.currentProject?.name ?? "Proyecto sin nombre";
      const projectSettings = {
        ...defaultSettings,
        ...state.currentProject?.settings,
        showGrid: state.showGrid,
        openingRailConstrainedThresholdM: state.openingRailConstrainedThresholdM,
      };

      const project = buildProject(
        projectId,
        projectName,
        state.walls,
        state.floors,
        state.openings,
        state.rooms,
        state.levels,
        state.lot,
        projectSettings,
      );

      set({ currentProject: project });
      return project;
    },

    loadProject: (project) => {
      const resolvedSettings = {
        ...defaultSettings,
        ...project.settings,
      };

      const normalizedWalls = project.walls.map((wall) => ({
        ...wall,
        hasInsulation: wall.hasInsulation ?? false,
      }));

      applyWithHistory(() => ({
        currentProject: {
          ...project,
          walls: normalizedWalls,
          settings: resolvedSettings,
        },
        walls: normalizedWalls,
        floors: project.floors,
        openings: project.openings,
        rooms: project.rooms ?? [],
        levels: project.levels?.length ? project.levels : defaultLevels,
        lot: project.lot ?? defaultLot,
        activeLevelId: project.levels?.[0]?.id ?? defaultLevelId,
        showGrid: resolvedSettings.showGrid,
        showMeasurements: true,
        gridSpacing: 1,
        viewMode: "3d",
        cameraControlMode: "orbit",
        cameraStates: defaultCameraStates,
        cameraTransition: null,
        openingRailConstrainedThresholdM: resolvedSettings.openingRailConstrainedThresholdM,
        realisticShadows: true,
        sunAzimuth: Math.PI / 4,
        terrainViolation: false,
        projectInitialized: true,
        projectSettings: {
          name: project.name,
          terrainWidth: project.lot?.width ?? defaultLot.width,
          terrainLength: project.lot?.length ?? defaultLot.length,
          maxHeight: project.lot?.maxHeight ?? defaultLot.maxHeight,
          maxFloors: project.lot?.maxLevels ?? defaultLot.maxLevels,
        },
        mode: "view",
        activeMode: "view",
        selectedWallId: null,
        selectedOpeningId: null,
        selectedFloorId: null,
      }));
    },

    newProject: (name) => {
      applyWithHistory((state) => {
        const project = buildProject(
          uuidv4(),
          name ?? "Nuevo proyecto",
          [],
          [],
          [],
          [],
          defaultLevels,
          defaultLot,
          { ...defaultSettings, showGrid: state.showGrid },
        );

        return {
          currentProject: project,
          walls: [],
          floors: [],
          openings: [],
          rooms: [],
          levels: defaultLevels,
          activeLevelId: defaultLevelId,
          lot: defaultLot,
          showMeasurements: true,
          gridSpacing: 1,
          viewMode: "3d",
          cameraControlMode: "orbit",
          cameraStates: defaultCameraStates,
          cameraTransition: null,
          openingRailConstrainedThresholdM: defaultSettings.openingRailConstrainedThresholdM,
          realisticShadows: true,
          sunAzimuth: Math.PI / 4,
          terrainViolation: false,
          projectInitialized: true,
          projectSettings: {
            ...defaultEditorProjectSettings,
            name: project.name,
          },
          mode: "view",
          activeMode: "view",
          selectedWallId: null,
          selectedOpeningId: null,
          selectedFloorId: null,
        };
      });
    },

    undo: () => {
      const state = get();
      const previous = state.historyPast[state.historyPast.length - 1];

      if (!previous) {
        return;
      }

      const current = makeSnapshot(state);
      set({
        ...previous,
        historyPast: state.historyPast.slice(0, -1),
        historyFuture: [current, ...state.historyFuture],
      });
    },

    redo: () => {
      const state = get();
      const [next, ...remainingFuture] = state.historyFuture;

      if (!next) {
        return;
      }

      const current = makeSnapshot(state);
      set({
        ...next,
        historyPast: [...state.historyPast, current],
        historyFuture: remainingFuture,
      });
    },

    canUndo: () => get().historyPast.length > 0,
    canRedo: () => get().historyFuture.length > 0,
  };
});
