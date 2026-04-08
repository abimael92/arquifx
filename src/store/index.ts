import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";

import {
  BuildMode,
  BuildSubtool,
  DragState,
  Floor,
  Level,
  LotConstraint,
  ObjectType,
  Opening,
  Project,
  ProjectSettings,
  Room,
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
  cameraPosition: Vector3D;
  openingRailConstrainedThresholdM: number;
  setSelectedTool: (tool: SelectedTool) => void;
  setIsDrawingMode: (enabled: boolean) => void;
  setShowGrid: (visible: boolean) => void;
  setCameraPosition: (position: Vector3D) => void;
  setOpeningRailConstrainedThresholdM: (value: number) => void;
}

interface BuildFlowSlice {
  activeMode: BuildMode;
  activeBuildSubtool: BuildSubtool;
  activeObjectType: ObjectType;
  dragState: DragState;
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
  setFloors: (floors: Floor[]) => void;
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
  cameraPosition: Vector3D;
  openingRailConstrainedThresholdM: number;
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
  cameraPosition: state.cameraPosition,
  openingRailConstrainedThresholdM: state.openingRailConstrainedThresholdM,
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
    cameraPosition: defaultCameraPosition,
    openingRailConstrainedThresholdM: defaultSettings.openingRailConstrainedThresholdM,
    activeMode: "select",
    activeBuildSubtool: "wall",
    activeObjectType: "puerta",
    dragState: defaultDragState,
    levels: defaultLevels,
    activeLevelId: defaultLevelId,
    rooms: [],
    lot: defaultLot,
    currentProject: null,
    historyPast: [],
    historyFuture: [],

    addWall: (wall) => {
      applyWithHistory((state) => {
        const walls = [...state.walls, wall];
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
        const walls = state.walls.map((wall) => (wall.id === id ? { ...wall, ...updates } : wall));
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
                : "select",
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

    setCameraPosition: (position) => {
      set({ cameraPosition: position });
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

    setActiveMode: (mode) => {
      set({ activeMode: mode });
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
        const minX = Math.min(startPoint.x, endPoint.x);
        const maxX = Math.max(startPoint.x, endPoint.x);
        const minZ = Math.min(startPoint.z, endPoint.z);
        const maxZ = Math.max(startPoint.z, endPoint.z);
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

        return { lot, currentProject };
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

      applyWithHistory(() => ({
        currentProject: {
          ...project,
          settings: resolvedSettings,
        },
        walls: project.walls,
        floors: project.floors,
        openings: project.openings,
        rooms: project.rooms ?? [],
        levels: project.levels?.length ? project.levels : defaultLevels,
        lot: project.lot ?? defaultLot,
        activeLevelId: project.levels?.[0]?.id ?? defaultLevelId,
        showGrid: resolvedSettings.showGrid,
        openingRailConstrainedThresholdM: resolvedSettings.openingRailConstrainedThresholdM,
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
          openingRailConstrainedThresholdM: defaultSettings.openingRailConstrainedThresholdM,
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
