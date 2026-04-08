"use client";

import { OrbitControls, OrthographicCamera, PerspectiveCamera } from "@react-three/drei";
import { Canvas, ThreeEvent, useFrame } from "@react-three/fiber";
import { RefObject, useEffect, useMemo, useRef, useState } from "react";
import { BufferAttribute, BufferGeometry, MOUSE, Mesh, OrthographicCamera as OrthographicCameraImpl, PerspectiveCamera as PerspectiveCameraImpl, Vector3 } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

import { useFloorDetection } from "@/hooks/useFloorDetection";
import { useRoomDrawing } from "@/hooks/useRoomDrawing";
import { useWallDrawing } from "@/hooks/useWallDrawing";
import { useAppStore } from "@/store";
import { CameraState, ViewMode, Wall as WallType } from "@/types/project.types";

import { Controls3D } from "./Controls3D";
import { Floor } from "./Floor";
import { Opening } from "./Opening";
import { Wall } from "./Wall";

function PreviewLine({ points }: { points: [number, number, number, number, number, number] }) {
  const geometry = useMemo(() => {
    const nextGeometry = new BufferGeometry();
    nextGeometry.setAttribute("position", new BufferAttribute(new Float32Array(points), 3));
    return nextGeometry;
  }, [points]);

  useEffect(() => {
    return () => geometry.dispose();
  }, [geometry]);

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color="#22d3ee" linewidth={2} />
    </lineSegments>
  );
}

function SceneFrameController({
  orbitControlsRef,
  perspectiveCameraRef,
  orthoCameraRef,
  viewMode,
  cameraControlMode,
  cameraTransition,
  keysPressedRef,
  clearCameraTransition,
  setCameraPosition,
  setCameraStateForMode,
}: {
  orbitControlsRef: RefObject<OrbitControlsImpl | null>;
  perspectiveCameraRef: RefObject<PerspectiveCameraImpl | null>;
  orthoCameraRef: RefObject<OrthographicCameraImpl | null>;
  viewMode: ViewMode;
  cameraControlMode: "orbit" | "free";
  cameraTransition: { active: boolean; mode: ViewMode; target: CameraState } | null;
  keysPressedRef: RefObject<Set<string>>;
  clearCameraTransition: () => void;
  setCameraPosition: (position: { x: number; y: number; z: number }) => void;
  setCameraStateForMode: (mode: ViewMode, cameraState: Partial<CameraState>) => void;
}) {
  useFrame((_, delta) => {
    const controls = orbitControlsRef.current;
    const activeCamera = viewMode === "blueprint" ? orthoCameraRef.current : perspectiveCameraRef.current;

    if (!controls || !activeCamera) {
      return;
    }

    if (cameraTransition && cameraTransition.active && cameraTransition.mode === viewMode) {
      const factor = Math.min(1, delta * 6);
      const target = cameraTransition.target;

      activeCamera.position.lerp(new Vector3(target.position.x, target.position.y, target.position.z), factor);
      controls.target.lerp(new Vector3(target.target.x, target.target.y, target.target.z), factor);
      activeCamera.zoom += (target.zoom - activeCamera.zoom) * factor;
      activeCamera.updateProjectionMatrix();

      const reached =
        activeCamera.position.distanceTo(new Vector3(target.position.x, target.position.y, target.position.z)) < 0.04 &&
        controls.target.distanceTo(new Vector3(target.target.x, target.target.y, target.target.z)) < 0.04 &&
        Math.abs(activeCamera.zoom - target.zoom) < 0.02;

      if (reached) {
        clearCameraTransition();
      }
    }

    if (cameraControlMode === "free" && viewMode !== "blueprint") {
      const speed = keysPressedRef.current?.has("shift") ? 10 : 4;
      const forward = new Vector3().subVectors(controls.target, activeCamera.position).setY(0).normalize();
      const right = new Vector3().crossVectors(forward, new Vector3(0, 1, 0)).normalize();
      const moveStep = speed * delta;

      if (keysPressedRef.current?.has("w")) {
        activeCamera.position.addScaledVector(forward, moveStep);
        controls.target.addScaledVector(forward, moveStep);
      }
      if (keysPressedRef.current?.has("s")) {
        activeCamera.position.addScaledVector(forward, -moveStep);
        controls.target.addScaledVector(forward, -moveStep);
      }
      if (keysPressedRef.current?.has("a")) {
        activeCamera.position.addScaledVector(right, -moveStep);
        controls.target.addScaledVector(right, -moveStep);
      }
      if (keysPressedRef.current?.has("d")) {
        activeCamera.position.addScaledVector(right, moveStep);
        controls.target.addScaledVector(right, moveStep);
      }
      if (keysPressedRef.current?.has("q") || keysPressedRef.current?.has("e")) {
        const dir = keysPressedRef.current?.has("q") ? -1 : 1;
        const rel = new Vector3().subVectors(activeCamera.position, controls.target);
        rel.applyAxisAngle(new Vector3(0, 1, 0), dir * delta * 1.4);
        activeCamera.position.copy(new Vector3().addVectors(controls.target, rel));
      }
    }

    if (activeCamera.position.y < 0.45) {
      activeCamera.position.y = 0.45;
    }
    if (controls.target.y < 0) {
      controls.target.y = 0;
    }

    controls.update();
    setCameraPosition({
      x: activeCamera.position.x,
      y: activeCamera.position.y,
      z: activeCamera.position.z,
    });
    setCameraStateForMode(viewMode, {
      position: {
        x: activeCamera.position.x,
        y: activeCamera.position.y,
        z: activeCamera.position.z,
      },
      target: {
        x: controls.target.x,
        y: controls.target.y,
        z: controls.target.z,
      },
      zoom: activeCamera.zoom,
      rotation: {
        x: activeCamera.rotation.x,
        y: activeCamera.rotation.y,
        z: activeCamera.rotation.z,
      },
    });
  });

  return null;
}

function BlueprintWallLines({ walls }: { walls: WallType[] }) {
  const points = useMemo(() => {
    const result: number[] = [];
    for (const wall of walls) {
      result.push(
        wall.startPoint.x,
        wall.startPoint.y + 0.02,
        wall.startPoint.z,
        wall.endPoint.x,
        wall.endPoint.y + 0.02,
        wall.endPoint.z,
      );
    }
    return result;
  }, [walls]);

  const geometry = useMemo(() => {
    const nextGeometry = new BufferGeometry();
    nextGeometry.setAttribute("position", new BufferAttribute(new Float32Array(points), 3));
    return nextGeometry;
  }, [points]);

  useEffect(() => {
    return () => geometry.dispose();
  }, [geometry]);

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color="#7dd3fc" linewidth={2} />
    </lineSegments>
  );
}

function OpeningRail({
  points,
  start,
  end,
  marker,
  isConstrained,
}: {
  points: [number, number, number, number, number, number];
  start: [number, number, number];
  end: [number, number, number];
  marker: [number, number, number];
  isConstrained: boolean;
}) {
  const markerRef = useRef<Mesh>(null);
  const geometry = useMemo(() => {
    const nextGeometry = new BufferGeometry();
    nextGeometry.setAttribute("position", new BufferAttribute(new Float32Array(points), 3));
    return nextGeometry;
  }, [points]);

  useFrame((state) => {
    if (!markerRef.current) {
      return;
    }

    const pulse = 1 + Math.sin(state.clock.elapsedTime * 6.5) * 0.15;
    markerRef.current.scale.setScalar(pulse);
  });

  useEffect(() => {
    return () => geometry.dispose();
  }, [geometry]);

  return (
    <group>
      <lineSegments geometry={geometry}>
        <lineBasicMaterial color={isConstrained ? "#fb7185" : "#f59e0b"} linewidth={2} />
      </lineSegments>

      <mesh position={start}>
        <sphereGeometry args={[0.05, 10, 10]} />
        <meshStandardMaterial
          color={isConstrained ? "#fb7185" : "#f59e0b"}
          emissive={isConstrained ? "#881337" : "#78350f"}
          emissiveIntensity={0.4}
        />
      </mesh>

      <mesh position={end}>
        <sphereGeometry args={[0.05, 10, 10]} />
        <meshStandardMaterial
          color={isConstrained ? "#fb7185" : "#f59e0b"}
          emissive={isConstrained ? "#881337" : "#78350f"}
          emissiveIntensity={0.4}
        />
      </mesh>

      <mesh ref={markerRef} position={marker}>
        <sphereGeometry args={[0.045, 10, 10]} />
        <meshStandardMaterial
          color={isConstrained ? "#fb7185" : "#22d3ee"}
          emissive={isConstrained ? "#881337" : "#0e7490"}
          emissiveIntensity={0.55}
        />
      </mesh>
    </group>
  );
}

function PreviewRectangle({
  points,
}: {
  points: [number, number, number, number, number, number, number, number, number, number, number, number];
}) {
  const geometry = useMemo(() => {
    const nextGeometry = new BufferGeometry();
    nextGeometry.setAttribute("position", new BufferAttribute(new Float32Array(points), 3));
    return nextGeometry;
  }, [points]);

  useEffect(() => {
    return () => geometry.dispose();
  }, [geometry]);

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color="#34d399" linewidth={2} />
    </lineSegments>
  );
}

export function Scene() {
  const walls = useAppStore((state) => state.walls);
  const floors = useAppStore((state) => state.floors);
  const openings = useAppStore((state) => state.openings);
  const selectedWallId = useAppStore((state) => state.selectedWallId);
  const selectedOpeningId = useAppStore((state) => state.selectedOpeningId);
  const selectedFloorId = useAppStore((state) => state.selectedFloorId);
  const selectedTool = useAppStore((state) => state.selectedTool);
  const activeMode = useAppStore((state) => state.activeMode);
  const viewMode = useAppStore((state) => state.viewMode);
  const cameraControlMode = useAppStore((state) => state.cameraControlMode);
  const cameraStates = useAppStore((state) => state.cameraStates);
  const cameraTransition = useAppStore((state) => state.cameraTransition);
  const setCameraStateForMode = useAppStore((state) => state.setCameraStateForMode);
  const clearCameraTransition = useAppStore((state) => state.clearCameraTransition);
  const transitionCameraTo = useAppStore((state) => state.transitionCameraTo);
  const showMeasurements = useAppStore((state) => state.showMeasurements);
  const gridSpacing = useAppStore((state) => state.gridSpacing);
  const levels = useAppStore((state) => state.levels);
  const selectWall = useAppStore((state) => state.selectWall);
  const selectOpening = useAppStore((state) => state.selectOpening);
  const selectFloor = useAppStore((state) => state.selectFloor);
  const addOpening = useAppStore((state) => state.addOpening);
  const deleteWall = useAppStore((state) => state.deleteWall);
  const deleteOpening = useAppStore((state) => state.deleteOpening);
  const updateOpening = useAppStore((state) => state.updateOpening);
  const showGrid = useAppStore((state) => state.showGrid);
  const updateWall = useAppStore((state) => state.updateWall);
  const setCameraPosition = useAppStore((state) => state.setCameraPosition);
  const openingRailConstrainedThresholdM = useAppStore((state) => state.openingRailConstrainedThresholdM);
  const [openingPreview, setOpeningPreview] = useState<{
    wallId: string;
    type: "puerta" | "ventana";
    positionFromStart: number;
    width: number;
    height: number;
    sillHeight: number;
    center: [number, number, number];
    rotationY: number;
    thickness: number;
  } | null>(null);
  const [openingDragState, setOpeningDragState] = useState<{
    openingId: string;
    wallId: string;
    width: number;
    height: number;
    sillHeight: number;
    type: "puerta" | "ventana" | "hueco";
  } | null>(null);
  const [hoveredDemolish, setHoveredDemolish] = useState<{ type: "wall" | "opening"; id: string } | null>(null);
  const [isDemolishDragging, setIsDemolishDragging] = useState(false);
  const erasedInDragRef = useRef<Set<string>>(new Set());
  const keysPressedRef = useRef<Set<string>>(new Set());

  const orbitControlsRef = useRef<OrbitControlsImpl>(null);
  const perspectiveCameraRef = useRef<PerspectiveCameraImpl>(null);
  const orthoCameraRef = useRef<OrthographicCameraImpl>(null);

  useFloorDetection();

  const {
    previewPoints,
    previewMetrics: wallPreviewMetrics,
    onCanvasPointerDown: onWallPointerDown,
    onCanvasPointerMove: onWallPointerMove,
    onCanvasPointerUp: onWallPointerUp,
    onScenePointerMissed,
  } = useWallDrawing();
  const {
    previewRectangle,
    previewMetrics: roomPreviewMetrics,
    onCanvasPointerDown: onRoomPointerDown,
    onCanvasPointerMove: onRoomPointerMove,
    onCanvasPointerUp: onRoomPointerUp,
  } = useRoomDrawing();
  const isOpeningTool = selectedTool === "Puertas" || selectedTool === "Ventanas";
  const isObjectMode = activeMode === "object" || isOpeningTool;
  const isDemolishMode = activeMode === "demolish" || selectedTool === "Eliminar";

  const visibleLevelIds = useMemo(
    () => new Set(levels.filter((level) => level.visible).map((level) => level.id)),
    [levels],
  );

  const visibleWalls = useMemo(
    () =>
      walls.filter((wall) => {
        if (!wall.levelId) {
          return true;
        }

        return visibleLevelIds.has(wall.levelId);
      }),
    [visibleLevelIds, walls],
  );

  const visibleFloors = useMemo(
    () =>
      floors.filter((floor) => {
        if (!floor.levelId) {
          return true;
        }

        return visibleLevelIds.has(floor.levelId);
      }),
    [floors, visibleLevelIds],
  );

  const visibleOpenings = useMemo(
    () => openings.filter((opening) => visibleWalls.some((wall) => wall.id === opening.wallId)),
    [openings, visibleWalls],
  );

  const getWallMetrics = (wall: WallType) => {
    const dx = wall.endPoint.x - wall.startPoint.x;
    const dz = wall.endPoint.z - wall.startPoint.z;
    const length = Math.max(Math.sqrt(dx * dx + dz * dz), 0.0001);
    const dirX = dx / length;
    const dirZ = dz / length;

    return {
      length,
      dirX,
      dirZ,
      rotationY: Math.atan2(dz, dx),
    };
  };

  const selectedWall = useMemo(
    () => visibleWalls.find((wall) => wall.id === selectedWallId) ?? null,
    [selectedWallId, visibleWalls],
  );

  const previewLinePoints = useMemo<[number, number, number, number, number, number] | null>(() => {
    if (!previewPoints) {
      return null;
    }

    return [
      previewPoints[0].x,
      previewPoints[0].y,
      previewPoints[0].z,
      previewPoints[1].x,
      previewPoints[1].y,
      previewPoints[1].z,
    ];
  }, [previewPoints]);

  const previewRectanglePoints = useMemo<
    [number, number, number, number, number, number, number, number, number, number, number, number] | null
  >(() => {
    if (!previewRectangle) {
      return null;
    }

    const y = previewRectangle[0].y + 0.03;
    return [
      previewRectangle[0].x,
      y,
      previewRectangle[0].z,
      previewRectangle[1].x,
      y,
      previewRectangle[1].z,
      previewRectangle[1].x,
      y,
      previewRectangle[1].z,
      previewRectangle[2].x,
      y,
      previewRectangle[2].z,
    ];
  }, [previewRectangle]);

  const previewRectanglePointsB = useMemo<
    [number, number, number, number, number, number, number, number, number, number, number, number] | null
  >(() => {
    if (!previewRectangle) {
      return null;
    }

    const y = previewRectangle[0].y + 0.03;
    return [
      previewRectangle[2].x,
      y,
      previewRectangle[2].z,
      previewRectangle[3].x,
      y,
      previewRectangle[3].z,
      previewRectangle[3].x,
      y,
      previewRectangle[3].z,
      previewRectangle[0].x,
      y,
      previewRectangle[0].z,
    ];
  }, [previewRectangle]);

  const activeMetricsLabel = useMemo(() => {
    if (selectedTool === "Muros" && wallPreviewMetrics) {
      return `L ${wallPreviewMetrics.lengthM.toFixed(2)}m · θ ${wallPreviewMetrics.angleDeg.toFixed(0)}° · €${wallPreviewMetrics.cost.toFixed(0)}`;
    }

    if (selectedTool === "Suelos" && roomPreviewMetrics) {
      return `W ${roomPreviewMetrics.widthM.toFixed(2)}m · L ${roomPreviewMetrics.lengthM.toFixed(2)}m · A ${roomPreviewMetrics.areaM2.toFixed(2)}m²`;
    }

    return null;
  }, [roomPreviewMetrics, selectedTool, wallPreviewMetrics]);

  const openingRail = useMemo<{
    points: [number, number, number, number, number, number];
    start: [number, number, number];
    end: [number, number, number];
    marker: [number, number, number];
    isConstrained: boolean;
  } | null>(() => {
    if (!openingPreview) {
      return null;
    }

    const wall = visibleWalls.find((item) => item.id === openingPreview.wallId);
    if (!wall) {
      return null;
    }

    const railY = wall.startPoint.y + Math.max(openingPreview.sillHeight + openingPreview.height * 0.5, 0.1);
    const start: [number, number, number] = [wall.startPoint.x, railY, wall.startPoint.z];
    const end: [number, number, number] = [wall.endPoint.x, railY, wall.endPoint.z];
    const marker: [number, number, number] = [openingPreview.center[0], railY, openingPreview.center[2]];
    const wallLength = Math.sqrt(
      (wall.endPoint.x - wall.startPoint.x) * (wall.endPoint.x - wall.startPoint.x) +
        (wall.endPoint.z - wall.startPoint.z) * (wall.endPoint.z - wall.startPoint.z),
    );
    const remainingSpan = wallLength - openingPreview.width;
    const isConstrained = remainingSpan <= openingRailConstrainedThresholdM;

    return {
      points: [start[0], start[1], start[2], end[0], end[1], end[2]],
      start,
      end,
      marker,
      isConstrained,
    };
  }, [openingPreview, openingRailConstrainedThresholdM, visibleWalls]);

  const openingDefaults = useMemo(() => {
    if (selectedTool === "Puertas") {
      return {
        type: "puerta" as const,
        width: 0.9,
        height: 2.1,
        sillHeight: 0,
      };
    }

    if (selectedTool === "Ventanas") {
      return {
        type: "ventana" as const,
        width: 1.2,
        height: 1.2,
        sillHeight: 0.9,
      };
    }

    return null;
  }, [selectedTool]);

  const eraseEntity = (type: "wall" | "opening", id: string) => {
    if (type === "wall") {
      deleteWall(id);
      return;
    }

    deleteOpening(id);
  };

  const eraseEntityOncePerDrag = (type: "wall" | "opening", id: string) => {
    const key = `${type}:${id}`;
    if (erasedInDragRef.current.has(key)) {
      return;
    }

    erasedInDragRef.current.add(key);
    eraseEntity(type, id);
  };

  const projectOpeningOnWall = (wall: WallType, worldPoint: { x: number; z: number }, openingWidth: number) => {
    const { length, dirX, dirZ, rotationY } = getWallMetrics(wall);
    const relX = worldPoint.x - wall.startPoint.x;
    const relZ = worldPoint.z - wall.startPoint.z;
    const projectedDistance = relX * dirX + relZ * dirZ;
    const clampedDistance = Math.max(
      openingWidth / 2,
      Math.min(projectedDistance, Math.max(openingWidth / 2, length - openingWidth / 2)),
    );

    const centerX = wall.startPoint.x + dirX * clampedDistance;
    const centerZ = wall.startPoint.z + dirZ * clampedDistance;

    return {
      positionFromStart: clampedDistance,
      centerX,
      centerZ,
      rotationY,
    };
  };

  const handleWallPointerMove = (wall: WallType, event: ThreeEvent<PointerEvent>) => {
    if (isDemolishMode) {
      setHoveredDemolish({ type: "wall", id: wall.id });
      if (isDemolishDragging && (event.buttons & 1) === 1) {
        eraseEntityOncePerDrag("wall", wall.id);
      }
      return;
    }

    if (!isOpeningTool || !openingDefaults) {
      return;
    }

    const projection = projectOpeningOnWall(wall, event.point, openingDefaults.width);
    const centerY = wall.startPoint.y + openingDefaults.sillHeight + openingDefaults.height / 2;

    setOpeningPreview({
      wallId: wall.id,
      type: openingDefaults.type,
      positionFromStart: projection.positionFromStart,
      width: openingDefaults.width,
      height: openingDefaults.height,
      sillHeight: openingDefaults.sillHeight,
      center: [projection.centerX, centerY, projection.centerZ],
      rotationY: projection.rotationY,
      thickness: wall.thickness,
    });
  };

  const handleWallClick = (wall: WallType) => {
    if (isDemolishMode) {
      eraseEntity("wall", wall.id);
      return;
    }

    if (isOpeningTool && openingDefaults) {
      const preview = openingPreview?.wallId === wall.id ? openingPreview : null;
      if (!preview) {
        return;
      }

      addOpening(wall.id, preview.type, preview.positionFromStart, preview.width, preview.height);
      setOpeningPreview(null);
      return;
    }

    selectWall(wall.id);
  };

  useEffect(() => {
    if (!isOpeningTool) {
      setOpeningPreview(null);
    }
  }, [isOpeningTool]);

  useEffect(() => {
    if (!openingDragState) {
      return;
    }

    const handlePointerUp = () => {
      if (!openingPreview || openingPreview.wallId !== openingDragState.wallId) {
        setOpeningDragState(null);
        return;
      }

      updateOpening(openingDragState.openingId, {
        positionFromStart: openingPreview.positionFromStart,
      });

      setOpeningDragState(null);
      if (!isOpeningTool) {
        setOpeningPreview(null);
      }
    };

    window.addEventListener("pointerup", handlePointerUp);
    return () => window.removeEventListener("pointerup", handlePointerUp);
  }, [isOpeningTool, openingDragState, openingPreview, updateOpening]);

  useEffect(() => {
    if (!isDemolishMode) {
      setHoveredDemolish(null);
      setIsDemolishDragging(false);
      erasedInDragRef.current.clear();
      return;
    }

    const handlePointerUp = () => {
      setIsDemolishDragging(false);
      erasedInDragRef.current.clear();
    };

    window.addEventListener("pointerup", handlePointerUp);
    return () => window.removeEventListener("pointerup", handlePointerUp);
  }, [isDemolishMode]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      keysPressedRef.current.add(event.key.toLowerCase());
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      keysPressedRef.current.delete(event.key.toLowerCase());
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  useEffect(() => {
    const controls = orbitControlsRef.current;
    const activeCamera = viewMode === "blueprint" ? orthoCameraRef.current : perspectiveCameraRef.current;
    const state = cameraStates[viewMode];
    if (!controls || !activeCamera || !state) {
      return;
    }

    activeCamera.position.set(state.position.x, state.position.y, state.position.z);
    controls.target.set(state.target.x, state.target.y, state.target.z);
    activeCamera.zoom = state.zoom;
    activeCamera.updateProjectionMatrix();
    controls.update();
  }, [cameraStates, viewMode]);

  useEffect(() => {
    const focus = () => {
      const selectedOpening = visibleOpenings.find((item) => item.id === selectedOpeningId);
      if (selectedOpening) {
        const parentWall = visibleWalls.find((item) => item.id === selectedOpening.wallId);
        if (parentWall) {
          const projection = projectOpeningOnWall(parentWall, { x: parentWall.startPoint.x, z: parentWall.startPoint.z }, selectedOpening.width);
          transitionCameraTo(viewMode, {
            target: { x: projection.centerX, y: parentWall.startPoint.y + selectedOpening.height * 0.5, z: projection.centerZ },
          });
        }
        return;
      }

      const wall = visibleWalls.find((item) => item.id === selectedWallId);
      if (wall) {
        transitionCameraTo(viewMode, {
          target: {
            x: (wall.startPoint.x + wall.endPoint.x) / 2,
            y: (wall.startPoint.y + wall.endPoint.y) / 2,
            z: (wall.startPoint.z + wall.endPoint.z) / 2,
          },
        });
      }
    };

    focus();
  }, [selectedOpeningId, selectedWallId]);

  const majorGridDivisions = useMemo(() => Math.max(4, Math.round(120 / gridSpacing)), [gridSpacing]);

  return (
    <div
      className="relative h-full w-full"
      onContextMenu={(event) => {
        event.preventDefault();
      }}
    >
      <Canvas
        shadows
        camera={{ position: [8, 6, 8], fov: 50 }}
        onPointerMissed={() => {
          onScenePointerMissed();
          setOpeningPreview(null);
          if (isDemolishMode) {
            setHoveredDemolish(null);
          }
        }}
      >
        <color attach="background" args={["#0b1220"]} />

        <PerspectiveCamera ref={perspectiveCameraRef} makeDefault={viewMode !== "blueprint"} fov={50} />
        <OrthographicCamera ref={orthoCameraRef} makeDefault={viewMode === "blueprint"} near={0.1} far={2000} zoom={36} />

        <SceneFrameController
          orbitControlsRef={orbitControlsRef}
          perspectiveCameraRef={perspectiveCameraRef}
          orthoCameraRef={orthoCameraRef}
          viewMode={viewMode}
          cameraControlMode={cameraControlMode}
          cameraTransition={cameraTransition}
          keysPressedRef={keysPressedRef}
          clearCameraTransition={clearCameraTransition}
          setCameraPosition={setCameraPosition}
          setCameraStateForMode={setCameraStateForMode}
        />

        <ambientLight intensity={viewMode === "blueprint" ? 0.2 : 0.45} />
        {viewMode !== "blueprint" ? <directionalLight castShadow intensity={1.1} position={[8, 14, 10]} /> : null}

        {showGrid ? (
          <>
            <gridHelper args={[120, majorGridDivisions, "#475569", "#1e293b"]} position={[0, 0, 0]} />
            <gridHelper args={[120, 480, "#334155", "#0f172a"]} position={[0, 0.001, 0]} />
          </>
        ) : null}

        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0, 0]}
          visible={false}
          onPointerDown={(event) => {
            if (event.button !== 0) {
              return;
            }

            if (isDemolishMode) {
              setIsDemolishDragging(true);
              erasedInDragRef.current.clear();
            }
            onWallPointerDown(event);
            onRoomPointerDown(event);
          }}
          onPointerMove={(event) => {
            if (openingDragState) {
              const wall = visibleWalls.find((item) => item.id === openingDragState.wallId);
              if (wall) {
                const projection = projectOpeningOnWall(wall, event.point, openingDragState.width);
                const centerY = wall.startPoint.y + openingDragState.sillHeight + openingDragState.height / 2;
                setOpeningPreview({
                  wallId: wall.id,
                  type: openingDragState.type === "hueco" ? "ventana" : openingDragState.type,
                  positionFromStart: projection.positionFromStart,
                  width: openingDragState.width,
                  height: openingDragState.height,
                  sillHeight: openingDragState.sillHeight,
                  center: [projection.centerX, centerY, projection.centerZ],
                  rotationY: projection.rotationY,
                  thickness: wall.thickness,
                });
              }
            }

            onWallPointerMove(event);
            onRoomPointerMove(event);
          }}
          onPointerUp={(event) => {
            onWallPointerUp(event);
            onRoomPointerUp(event);
          }}
        >
          <planeGeometry args={[500, 500]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>

        {viewMode !== "blueprint"
          ? visibleWalls.map((wall) => (
          <Wall
            key={wall.id}
            wall={wall}
            isSelected={wall.id === selectedWallId}
            onSelect={(wallId) => selectWall(wallId)}
            onWallPointerMove={handleWallPointerMove}
            onWallClick={(wallItem) => handleWallClick(wallItem)}
            onWallPointerEnter={(wallItem) => {
              if (isDemolishMode) {
                setHoveredDemolish({ type: "wall", id: wallItem.id });
              }
            }}
            onWallPointerLeave={(wallItem) => {
              if (isDemolishMode && hoveredDemolish?.type === "wall" && hoveredDemolish.id === wallItem.id) {
                setHoveredDemolish(null);
              }
            }}
            isHighlighted={isDemolishMode && hoveredDemolish?.type === "wall" && hoveredDemolish.id === wall.id}
          />
            ))
          : null}

        {viewMode === "blueprint" ? <BlueprintWallLines walls={visibleWalls} /> : null}

        {viewMode !== "blueprint"
          ? visibleFloors.map((floor) => (
          <Floor
            key={floor.id}
            floor={floor}
            isSelected={floor.id === selectedFloorId}
            onSelect={(floorId) => selectFloor(floorId)}
          />
            ))
          : null}

        {viewMode !== "blueprint"
          ? visibleOpenings.map((opening) => {
          const wall = visibleWalls.find((item) => item.id === opening.wallId);
          if (!wall) {
            return null;
          }

          return (
            <Opening
              key={opening.id}
              opening={opening}
              wall={wall}
              isSelected={opening.id === selectedOpeningId}
              onSelect={(openingId) => {
                if (isDemolishMode) {
                  eraseEntity("opening", openingId);
                  return;
                }

                selectOpening(openingId);
              }}
              onOpeningPointerDown={(openingItem, event) => {
                if (!isObjectMode || isDemolishMode) {
                  return;
                }

                const wallForOpening = visibleWalls.find((item) => item.id === openingItem.wallId);
                if (!wallForOpening) {
                  return;
                }

                setOpeningDragState({
                  openingId: openingItem.id,
                  wallId: openingItem.wallId,
                  width: openingItem.width,
                  height: openingItem.height,
                  sillHeight: openingItem.sillHeight,
                  type: openingItem.type,
                });

                const projection = projectOpeningOnWall(wallForOpening, event.point, openingItem.width);
                const centerY = wallForOpening.startPoint.y + openingItem.sillHeight + openingItem.height / 2;
                setOpeningPreview({
                  wallId: wallForOpening.id,
                  type: openingItem.type === "hueco" ? "ventana" : openingItem.type,
                  positionFromStart: projection.positionFromStart,
                  width: openingItem.width,
                  height: openingItem.height,
                  sillHeight: openingItem.sillHeight,
                  center: [projection.centerX, centerY, projection.centerZ],
                  rotationY: projection.rotationY,
                  thickness: wallForOpening.thickness,
                });
              }}
              onOpeningPointerMove={(openingItem, event) => {
                if (!isDemolishMode) {
                  return;
                }

                setHoveredDemolish({ type: "opening", id: openingItem.id });
                if (isDemolishDragging && (event.buttons & 1) === 1) {
                  eraseEntityOncePerDrag("opening", openingItem.id);
                }
              }}
              onOpeningPointerEnter={(openingItem) => {
                if (isDemolishMode) {
                  setHoveredDemolish({ type: "opening", id: openingItem.id });
                }
              }}
              onOpeningPointerLeave={(openingItem) => {
                if (isDemolishMode && hoveredDemolish?.type === "opening" && hoveredDemolish.id === openingItem.id) {
                  setHoveredDemolish(null);
                }
              }}
              isHighlighted={
                isDemolishMode && hoveredDemolish?.type === "opening" && hoveredDemolish.id === opening.id
              }
            />
          );
            })
          : null}

        {openingPreview && viewMode !== "blueprint" ? (
          <mesh position={openingPreview.center} rotation={[0, openingPreview.rotationY, 0]}>
            <boxGeometry args={[openingPreview.width, openingPreview.height, openingPreview.thickness * 1.08]} />
            <meshStandardMaterial
              color={openingPreview.type === "puerta" ? "#8b5a2b" : "#2563eb"}
              transparent
              opacity={0.28}
            />
          </mesh>
        ) : null}

        {openingRail && (isOpeningTool || Boolean(openingDragState)) && viewMode !== "blueprint" ? (
          <OpeningRail
            points={openingRail.points}
            start={openingRail.start}
            end={openingRail.end}
            marker={openingRail.marker}
            isConstrained={openingRail.isConstrained}
          />
        ) : null}

        {previewLinePoints ? <PreviewLine points={previewLinePoints} /> : null}
        {previewRectanglePoints ? <PreviewRectangle points={previewRectanglePoints} /> : null}
        {previewRectanglePointsB ? <PreviewRectangle points={previewRectanglePointsB} /> : null}

        {selectedWall ? (
          <Controls3D
            wall={selectedWall}
            orbitControlsRef={orbitControlsRef}
            onTransformWall={(wallId, startPoint, endPoint) => {
              updateWall(wallId, { startPoint, endPoint });
            }}
          />
        ) : null}

        <OrbitControls
          ref={orbitControlsRef}
          makeDefault
          enabled={cameraControlMode === "orbit"}
          enableZoom
          enablePan
          enableDamping
          dampingFactor={0.08}
          minDistance={2}
          maxDistance={120}
          minPolarAngle={0.08}
          maxPolarAngle={Math.PI / 2 - 0.08}
          mouseButtons={{ LEFT: undefined, MIDDLE: MOUSE.PAN, RIGHT: MOUSE.ROTATE }}
          onChange={() => {
            const controls = orbitControlsRef.current;
            const camera = viewMode === "blueprint" ? orthoCameraRef.current : perspectiveCameraRef.current;
            const position = camera?.position;
            if (!position || !controls || !camera) {
              return;
            }

            if (position.y < 0.45) {
              position.y = 0.45;
            }

            if (controls.target.y < 0) {
              controls.target.y = 0;
            }

            setCameraPosition({
              x: position.x,
              y: position.y,
              z: position.z,
            });

            setCameraStateForMode(viewMode, {
              position: {
                x: position.x,
                y: position.y,
                z: position.z,
              },
              target: {
                x: controls.target.x,
                y: controls.target.y,
                z: controls.target.z,
              },
              zoom: camera.zoom,
            });
          }}
        />
      </Canvas>

      {activeMetricsLabel && showMeasurements ? (
        <div className="pointer-events-none absolute bottom-5 left-5 rounded-lg border border-cyan-500/30 bg-slate-950/80 px-3 py-2 text-xs text-cyan-100">
          {activeMetricsLabel}
        </div>
      ) : null}

      {showMeasurements && openingRail?.isConstrained && (isOpeningTool || Boolean(openingDragState)) ? (
        <div className="pointer-events-none absolute bottom-16 left-5 rounded-lg border border-rose-400/40 bg-rose-950/75 px-3 py-2 text-xs text-rose-100">
          Abertura al límite del muro
        </div>
      ) : null}
    </div>
  );
}
