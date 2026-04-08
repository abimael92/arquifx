import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";

import {
  Floor,
  Opening,
  Project,
  ProjectSettings,
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
  setSelectedTool: (tool: SelectedTool) => void;
  setIsDrawingMode: (enabled: boolean) => void;
  setShowGrid: (visible: boolean) => void;
  setCameraPosition: (position: Vector3D) => void;
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

type StoreState = WallsSlice & OpeningsSlice & FloorsSelectionSlice & UiSlice & ProjectSlice & UndoRedoSlice;

const defaultSettings: ProjectSettings = {
  gridSnap: 0.1,
  angleSnap: 15,
  showGrid: true,
  defaultWallHeight: 2.8,
};

const defaultCameraPosition: Vector3D = { x: 8, y: 6, z: 8 };

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
  settings: ProjectSettings,
): Project => ({
  id,
  name,
  walls,
  floors,
  openings,
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
        isDrawingMode: tool === "Muros",
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

    setFloors: (floors) => {
      applyWithHistory((state) => {
        const currentProject = state.currentProject
          ? buildProject(
              state.currentProject.id,
              state.currentProject.name,
              state.walls,
              floors,
              state.openings,
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
      const projectSettings = state.currentProject?.settings ?? { ...defaultSettings, showGrid: state.showGrid };

      const project = buildProject(
        projectId,
        projectName,
        state.walls,
        state.floors,
        state.openings,
        projectSettings,
      );

      set({ currentProject: project });
      return project;
    },

    loadProject: (project) => {
      applyWithHistory(() => ({
        currentProject: project,
        walls: project.walls,
        floors: project.floors,
        openings: project.openings,
        showGrid: project.settings.showGrid,
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
          { ...defaultSettings, showGrid: state.showGrid },
        );

        return {
          currentProject: project,
          walls: [],
          floors: [],
          openings: [],
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
