"use client";

import { OrbitControls, OrthographicCamera, PerspectiveCamera, useAnimations, useFBX, useGLTF } from "@react-three/drei";
import { Canvas, ThreeEvent, useFrame, useLoader } from "@react-three/fiber";
import { RefObject, Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import { Box3, BufferAttribute, BufferGeometry, Group, MOUSE, Mesh, MeshStandardMaterial, OrthographicCamera as OrthographicCameraImpl, PerspectiveCamera as PerspectiveCameraImpl, Vector3 } from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

import { useFloorDetection } from "@/features/editor/hooks/useFloorDetection";
import { useRoomDrawing } from "@/features/editor/hooks/useRoomDrawing";
import { useWallDrawing } from "@/features/editor/hooks/useWallDrawing";
import { useAppStore } from "@/store";
import { CameraState, Opening as OpeningType, ViewMode, Wall as WallType } from "@/types/project.types";

import { Controls3D } from "./Controls3D";
import { Floor } from "./Floor";
import { Opening } from "./Opening";
import { Terrain } from "./Terrain";
import { Wall } from "./Wall";

const RealisticLighting = lazy(() =>
  import("./RealisticLighting").then((module) => ({ default: module.RealisticLighting })),
);

type AvatarMotionState = "idle" | "walk" | "run";

function resolveAvatarClipName(names: string[], motionState: AvatarMotionState) {
  const lowerNames = names.map((name) => name.toLowerCase());
  const findBy = (tests: string[]) => names[lowerNames.findIndex((name) => tests.some((test) => name.includes(test)))];

  if (motionState === "run") {
    return findBy(["run", "jog", "sprint"]);
  }

  if (motionState === "walk") {
    return findBy(["walk", "locomotion", "move"]);
  }

  return findBy(["idle", "rest", "breath"]);
}

function PlayModeExternalAvatar({ motionState }: { motionState: AvatarMotionState }) {
  const groupRef = useRef<Group>(null);
  const { scene, animations } = useGLTF("/models/male_avatar.glb");
  const { actions, names } = useAnimations(animations, groupRef);

  useEffect(() => {
    const activeClipName =
      resolveAvatarClipName(names, motionState) || resolveAvatarClipName(names, "walk") || resolveAvatarClipName(names, "idle") || names[0];
    if (!activeClipName) {
      return;
    }

    const activeAction = actions[activeClipName];
    if (!activeAction) {
      return;
    }

    activeAction.reset().fadeIn(0.2).play();
    return () => {
      activeAction.fadeOut(0.2);
    };
  }, [actions, names, motionState]);

  return (
    <group ref={groupRef}>
      <primitive object={scene} position={[0, 0, 0]} scale={0.95} castShadow receiveShadow />
    </group>
  );
}

function PlayModeExternalWalkingAvatar({ motionState }: { motionState: AvatarMotionState }) {
  const groupRef = useRef<Group>(null);
  const { scene, animations } = useGLTF("/models/walking.glb");
  const { actions, names } = useAnimations(animations, groupRef);

  useEffect(() => {
    const activeClipName =
      resolveAvatarClipName(names, motionState) || resolveAvatarClipName(names, "walk") || resolveAvatarClipName(names, "idle") || names[0];
    if (!activeClipName) {
      return;
    }

    const activeAction = actions[activeClipName];
    if (!activeAction) {
      return;
    }

    activeAction.reset().fadeIn(0.2).play();
    return () => {
      activeAction.fadeOut(0.2);
    };
  }, [actions, names, motionState]);

  return (
    <group ref={groupRef}>
      <primitive object={scene} position={[0, 0, 0]} scale={0.95} castShadow receiveShadow />
    </group>
  );
}

function PlayModeExternalWalkingFbxAvatar({ motionState }: { motionState: AvatarMotionState }) {
  const groupRef = useRef<Group>(null);
  const object = useFBX("/models/Walking.fbx");
  const { actions, names } = useAnimations(object.animations ?? [], groupRef);

  useEffect(() => {
    object.traverse((node) => {
      const mesh = node as Mesh;
      if (!mesh.isMesh) {
        return;
      }

      mesh.castShadow = true;
      mesh.receiveShadow = true;
    });
  }, [object]);

  useEffect(() => {
    const activeClipName =
      resolveAvatarClipName(names, motionState) || resolveAvatarClipName(names, "walk") || resolveAvatarClipName(names, "idle") || names[0];
    if (!activeClipName) {
      return;
    }

    const activeAction = actions[activeClipName];
    if (!activeAction) {
      return;
    }

    activeAction.reset().fadeIn(0.2).play();
    return () => {
      activeAction.fadeOut(0.2);
    };
  }, [actions, names, motionState]);

  return (
    <group ref={groupRef}>
      <primitive object={object} position={[0, 0, 0]} scale={0.014} />
    </group>
  );
}

function PlayModeExternalAvatarObj() {
  const object = useLoader(OBJLoader, "/models/base-body-mesh.obj");

  useEffect(() => {
    object.traverse((node) => {
      const mesh = node as Mesh;
      if (!mesh.isMesh) {
        return;
      }

      mesh.castShadow = true;
      mesh.receiveShadow = true;
      if (!Array.isArray(mesh.material)) {
        mesh.material = new MeshStandardMaterial({ color: "#cbd5e1", roughness: 0.65, metalness: 0.06 });
      }
    });
  }, [object]);

  return <primitive object={object} position={[0, -0.9, 0]} scale={0.22} />;
}

function PlayModeExternalRealisticAvatarObj() {
  const object = useLoader(OBJLoader, "/Realistic_White_Male/Realistic_White_Male_Low_Poly.obj");

  const placement = useMemo(() => {
    const box = new Box3().setFromObject(object);
    const size = new Vector3();
    box.getSize(size);

    const targetHeight = 1.78;
    const scale = size.y > 0 ? targetHeight / size.y : 0.02;
    const centeredX = -((box.min.x + box.max.x) * 0.5) * scale;
    const centeredZ = -((box.min.z + box.max.z) * 0.5) * scale;
    const groundedY = -box.min.y * scale;

    return { scale, centeredX, centeredZ, groundedY };
  }, [object]);

  useEffect(() => {
    object.traverse((node) => {
      const mesh = node as Mesh;
      if (!mesh.isMesh) {
        return;
      }

      mesh.castShadow = true;
      mesh.receiveShadow = true;
      if (!Array.isArray(mesh.material)) {
        mesh.material = new MeshStandardMaterial({ color: "#e5e7eb", roughness: 0.58, metalness: 0.03 });
      }
    });
  }, [object]);

  return (
    <primitive
      object={object}
      position={[placement.centeredX, placement.groundedY, placement.centeredZ]}
      rotation={[0, 0, 0]}
      scale={placement.scale}
    />
  );
}

function PlayModeController({
  active,
  lot,
  walls,
  openings,
  keysPressedRef,
  perspectiveCameraRef,
  orbitControlsRef,
  setCameraPosition,
  setCameraStateForMode,
}: {
  active: boolean;
  lot: { width: number; length: number };
  walls: WallType[];
  openings: OpeningType[];
  keysPressedRef: RefObject<Set<string>>;
  perspectiveCameraRef: RefObject<PerspectiveCameraImpl | null>;
  orbitControlsRef: RefObject<OrbitControlsImpl | null>;
  setCameraPosition: (position: { x: number; y: number; z: number }) => void;
  setCameraStateForMode: (mode: ViewMode, cameraState: Partial<CameraState>) => void;
}) {
  if (!active) {
    return null;
  }

  const avatarPositionRef = useRef(new Vector3(0, 0, 4));
  const avatarYawRef = useRef(0);
  const avatarGroupRef = useRef<Group>(null);
  const leftArmRef = useRef<Mesh>(null);
  const rightArmRef = useRef<Mesh>(null);
  const leftLegRef = useRef<Mesh>(null);
  const rightLegRef = useRef<Mesh>(null);
  const walkPhaseRef = useRef(0);
  const [externalAvatarType, setExternalAvatarType] = useState<"walking" | "walking-fbx" | "realistic-obj" | "obj" | "glb" | null>(null);
  const [motionState, setMotionState] = useState<AvatarMotionState>("idle");
  const motionStateRef = useRef<AvatarMotionState>("idle");
  const collisionRadius = 0.28;
  const PLAY_CAMERA_DISTANCE = 4;
  const PLAY_CAMERA_HEIGHT = 2;
  const PLAY_CAMERA_LOOK_AHEAD = 1.2;
  const PLAY_CAMERA_MIN_BACK_DOT = -0.2;
  const AVATAR_MODEL_YAW_OFFSET = 0;

  const wallCollisionData = useMemo(() => {
    return walls
      .map((wall) => {
        const dx = wall.endPoint.x - wall.startPoint.x;
        const dz = wall.endPoint.z - wall.startPoint.z;
        const length = Math.sqrt(dx * dx + dz * dz);
        if (length <= 0.0001) {
          return null;
        }

        const dirX = dx / length;
        const dirZ = dz / length;
        const normalX = -dirZ;
        const normalZ = dirX;
        const doorIntervals = openings
          .filter((opening) => opening.wallId === wall.id && opening.type === "puerta")
          .map((opening) => {
            const halfWidth = opening.width / 2;
            const start = Math.max(0, opening.positionFromStart - halfWidth);
            const end = Math.min(length, opening.positionFromStart + halfWidth);
            return { start, end };
          });

        return {
          startX: wall.startPoint.x,
          startZ: wall.startPoint.z,
          length,
          dirX,
          dirZ,
          normalX,
          normalZ,
          halfThickness: wall.thickness / 2,
          doorIntervals,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [openings, walls]);

  const collidesWithWalls = (pointX: number, pointZ: number) => {
    for (const wall of wallCollisionData) {
      const relX = pointX - wall.startX;
      const relZ = pointZ - wall.startZ;
      const along = relX * wall.dirX + relZ * wall.dirZ;
      const lateral = relX * wall.normalX + relZ * wall.normalZ;

      if (along < -collisionRadius || along > wall.length + collisionRadius) {
        continue;
      }

      const touchesWallThickness = Math.abs(lateral) <= wall.halfThickness + collisionRadius;
      if (!touchesWallThickness) {
        continue;
      }

      const insideDoorSpan = wall.doorIntervals.some(
        (interval) => along >= interval.start - collisionRadius && along <= interval.end + collisionRadius,
      );
      if (insideDoorSpan) {
        continue;
      }

      return true;
    }

    return false;
  };

  useEffect(() => {
    let cancelled = false;

    const checkAvatarModel = async () => {
      try {
        const walkingResponse = await fetch("/models/walking.glb", { method: "HEAD" });
        if (walkingResponse.ok) {
          if (!cancelled) {
            setExternalAvatarType("walking");
          }
          return;
        }

        const walkingFbxResponse = await fetch("/models/Walking.fbx", { method: "HEAD" });
        if (walkingFbxResponse.ok) {
          if (!cancelled) {
            setExternalAvatarType("walking-fbx");
          }
          return;
        }

        const realisticObjResponse = await fetch("/Realistic_White_Male/Realistic_White_Male_Low_Poly.obj", { method: "HEAD" });
        if (realisticObjResponse.ok) {
          if (!cancelled) {
            setExternalAvatarType("realistic-obj");
          }
          return;
        }

        const objResponse = await fetch("/models/base-body-mesh.obj", { method: "HEAD" });
        if (objResponse.ok) {
          if (!cancelled) {
            setExternalAvatarType("obj");
          }
          return;
        }

        const glbResponse = await fetch("/models/male_avatar.glb", { method: "HEAD" });
        if (!cancelled) {
          setExternalAvatarType(glbResponse.ok ? "glb" : null);
        }
      } catch {
        if (!cancelled) {
          setExternalAvatarType(null);
        }
      }
    };

    void checkAvatarModel();

    return () => {
      cancelled = true;
    };
  }, []);

  useFrame((_, delta) => {
    if (!active) {
      return;
    }

    const camera = perspectiveCameraRef.current;
    const controls = orbitControlsRef.current;
    if (!camera || !controls) {
      return;
    }

    const speed = keysPressedRef.current?.has("shift") ? 4.6 : 2.8;
    const yawSpeed = 1.6;

    if (keysPressedRef.current?.has("arrowleft") || keysPressedRef.current?.has("q")) {
      avatarYawRef.current += yawSpeed * delta;
    }
    if (keysPressedRef.current?.has("arrowright") || keysPressedRef.current?.has("e")) {
      avatarYawRef.current -= yawSpeed * delta;
    }

    const forward = new Vector3(Math.sin(avatarYawRef.current), 0, Math.cos(avatarYawRef.current));
    const right = new Vector3(forward.z, 0, -forward.x);
    const move = new Vector3();

    if (keysPressedRef.current?.has("w") || keysPressedRef.current?.has("arrowup")) {
      move.add(forward);
    }
    if (keysPressedRef.current?.has("s") || keysPressedRef.current?.has("arrowdown")) {
      move.addScaledVector(forward, -1);
    }
    if (keysPressedRef.current?.has("a")) {
      move.addScaledVector(right, -1);
    }
    if (keysPressedRef.current?.has("d")) {
      move.add(right);
    }

    const isMoving = move.lengthSq() > 0;
    const nextMotionState: AvatarMotionState = isMoving ? (keysPressedRef.current?.has("shift") ? "run" : "walk") : "idle";
    if (motionStateRef.current !== nextMotionState) {
      motionStateRef.current = nextMotionState;
      setMotionState(nextMotionState);
    }

    if (isMoving) {
      move.normalize().multiplyScalar(speed * delta);
      const currentX = avatarPositionRef.current.x;
      const currentZ = avatarPositionRef.current.z;
      const candidateX = currentX + move.x;
      const candidateZ = currentZ + move.z;

      if (!collidesWithWalls(candidateX, candidateZ)) {
        avatarPositionRef.current.x = candidateX;
        avatarPositionRef.current.z = candidateZ;
      } else if (!collidesWithWalls(candidateX, currentZ)) {
        avatarPositionRef.current.x = candidateX;
      } else if (!collidesWithWalls(currentX, candidateZ)) {
        avatarPositionRef.current.z = candidateZ;
      }
    }

    const halfW = lot.width / 2 - 0.35;
    const halfL = lot.length / 2 - 0.35;
    avatarPositionRef.current.x = Math.min(halfW, Math.max(-halfW, avatarPositionRef.current.x));
    avatarPositionRef.current.z = Math.min(halfL, Math.max(-halfL, avatarPositionRef.current.z));

    walkPhaseRef.current += (isMoving ? 6 : 2) * delta;
    const stride = isMoving ? Math.sin(walkPhaseRef.current) * 0.6 : 0;
    const armSwing = isMoving ? Math.sin(walkPhaseRef.current) * 0.45 : 0;
    const cameraForward = new Vector3(Math.sin(avatarYawRef.current), 0, Math.cos(avatarYawRef.current));
    const visualYaw = avatarYawRef.current + AVATAR_MODEL_YAW_OFFSET;

    if (avatarGroupRef.current) {
      avatarGroupRef.current.position.set(
        avatarPositionRef.current.x,
        isMoving ? Math.abs(Math.sin(walkPhaseRef.current * 2)) * 0.04 : 0,
        avatarPositionRef.current.z,
      );
      avatarGroupRef.current.rotation.y = visualYaw;
    }

    if (leftLegRef.current) {
      leftLegRef.current.rotation.x = stride;
    }
    if (rightLegRef.current) {
      rightLegRef.current.rotation.x = -stride;
    }
    if (leftArmRef.current) {
      leftArmRef.current.rotation.x = -armSwing;
    }
    if (rightArmRef.current) {
      rightArmRef.current.rotation.x = armSwing;
    }

    const cameraOffset = new Vector3(
      -cameraForward.x * PLAY_CAMERA_DISTANCE,
      PLAY_CAMERA_HEIGHT,
      -cameraForward.z * PLAY_CAMERA_DISTANCE,
    );
    camera.position.set(
      avatarPositionRef.current.x + cameraOffset.x,
      avatarPositionRef.current.y + cameraOffset.y,
      avatarPositionRef.current.z + cameraOffset.z,
    );

    const avatarToCamera = new Vector3(
      camera.position.x - avatarPositionRef.current.x,
      0,
      camera.position.z - avatarPositionRef.current.z,
    );
    if (avatarToCamera.lengthSq() > 0.0001) {
      avatarToCamera.normalize();
      if (avatarToCamera.dot(cameraForward) > PLAY_CAMERA_MIN_BACK_DOT) {
        camera.position.set(
          avatarPositionRef.current.x - cameraForward.x * PLAY_CAMERA_DISTANCE,
          avatarPositionRef.current.y + PLAY_CAMERA_HEIGHT,
          avatarPositionRef.current.z - cameraForward.z * PLAY_CAMERA_DISTANCE,
        );
      }
    }

    controls.target.set(
      avatarPositionRef.current.x + cameraForward.x * PLAY_CAMERA_LOOK_AHEAD,
      1.35,
      avatarPositionRef.current.z + cameraForward.z * PLAY_CAMERA_LOOK_AHEAD,
    );
    controls.update();

    setCameraPosition({ x: camera.position.x, y: camera.position.y, z: camera.position.z });
    setCameraStateForMode("play", {
      position: { x: camera.position.x, y: camera.position.y, z: camera.position.z },
      target: { x: controls.target.x, y: controls.target.y, z: controls.target.z },
      zoom: camera.zoom,
    });
  });

  return (
    <group ref={avatarGroupRef}>
      {externalAvatarType === "walking" ? (
        <Suspense fallback={null}>
          <PlayModeExternalWalkingAvatar motionState={motionState} />
        </Suspense>
      ) : externalAvatarType === "walking-fbx" ? (
        <Suspense fallback={null}>
          <PlayModeExternalWalkingFbxAvatar motionState={motionState} />
        </Suspense>
      ) : externalAvatarType === "realistic-obj" ? (
        <Suspense fallback={null}>
          <PlayModeExternalRealisticAvatarObj />
        </Suspense>
      ) : externalAvatarType === "obj" ? (
        <Suspense fallback={null}>
          <PlayModeExternalAvatarObj />
        </Suspense>
      ) : externalAvatarType === "glb" ? (
        <Suspense fallback={null}>
          <PlayModeExternalAvatar motionState={motionState} />
        </Suspense>
      ) : (
        <>
          <mesh position={[0, 1, 0]} castShadow>
            <boxGeometry args={[0.56, 1.1, 0.34]} />
            <meshStandardMaterial color="#2563eb" roughness={0.4} metalness={0.1} />
          </mesh>

          <mesh position={[0, 1.9, 0]} castShadow>
            <sphereGeometry args={[0.22, 20, 20]} />
            <meshStandardMaterial color="#f1c7a3" roughness={0.65} metalness={0.02} />
          </mesh>

          <mesh ref={leftArmRef} position={[-0.35, 1.2, 0]} castShadow>
            <boxGeometry args={[0.16, 0.68, 0.16]} />
            <meshStandardMaterial color="#0f172a" roughness={0.5} metalness={0.1} />
          </mesh>
          <mesh ref={rightArmRef} position={[0.35, 1.2, 0]} castShadow>
            <boxGeometry args={[0.16, 0.68, 0.16]} />
            <meshStandardMaterial color="#0f172a" roughness={0.5} metalness={0.1} />
          </mesh>

          <mesh ref={leftLegRef} position={[-0.14, 0.38, 0]} castShadow>
            <boxGeometry args={[0.2, 0.72, 0.2]} />
            <meshStandardMaterial color="#1e293b" roughness={0.5} metalness={0.1} />
          </mesh>
          <mesh ref={rightLegRef} position={[0.14, 0.38, 0]} castShadow>
            <boxGeometry args={[0.2, 0.72, 0.2]} />
            <meshStandardMaterial color="#1e293b" roughness={0.5} metalness={0.1} />
          </mesh>
        </>
      )}
    </group>
  );
}

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
  onQualitySample,
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
  onQualitySample: (fps: number) => void;
}) {
  const frameAccumulatorRef = useRef(0);
  const elapsedAccumulatorRef = useRef(0);

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

    if (cameraControlMode === "free" && viewMode !== "blueprint" && viewMode !== "play") {
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

    frameAccumulatorRef.current += 1;
    elapsedAccumulatorRef.current += delta;
    if (elapsedAccumulatorRef.current >= 1) {
      onQualitySample(frameAccumulatorRef.current / elapsedAccumulatorRef.current);
      frameAccumulatorRef.current = 0;
      elapsedAccumulatorRef.current = 0;
    }

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
  const lot = useAppStore((state) => state.lot);
  const mode = useAppStore((state) => state.mode);
  const terrainViolation = useAppStore((state) => state.terrainViolation);
  const realisticShadows = useAppStore((state) => state.realisticShadows);
  const sunAzimuth = useAppStore((state) => state.sunAzimuth);
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
  const [invalidActionMessage, setInvalidActionMessage] = useState<string | null>(null);
  const erasedInDragRef = useRef<Set<string>>(new Set());
  const keysPressedRef = useRef<Set<string>>(new Set());
  const invalidActionTimeoutRef = useRef<number | null>(null);

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
  const isPlayMode = viewMode === "play";
  const isBuildMode = mode === "build";
  const isViewMode = mode === "view" || isPlayMode;
  const isObjectMode = activeMode === "object" || isOpeningTool;
  const isDemolishMode = activeMode === "demolish" || selectedTool === "Eliminar";
  const [isLowPerformanceMode, setIsLowPerformanceMode] = useState(false);
  const effectiveRealisticShadows = realisticShadows && !isLowPerformanceMode;

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

  const openingsByWallId = useMemo(() => {
    const map = new Map<string, OpeningType[]>();
    visibleOpenings.forEach((opening) => {
      const current = map.get(opening.wallId);
      if (current) {
        current.push(opening);
        return;
      }

      map.set(opening.wallId, [opening]);
    });
    return map;
  }, [visibleOpenings]);

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

  const notifyInvalidAction = (message: string) => {
    setInvalidActionMessage(message);
    if (invalidActionTimeoutRef.current) {
      window.clearTimeout(invalidActionTimeoutRef.current);
    }

    invalidActionTimeoutRef.current = window.setTimeout(() => {
      setInvalidActionMessage(null);
    }, 1400);
  };

  const getViewModeHint = (intent: "general" | "build" | "object" | "demolish" = "general") => {
    if (intent === "build") {
      return "Modo View activo: cambia a Build > Muros/Cuartos para editar";
    }

    if (intent === "object") {
      return "Modo View activo: cambia a Object > Puertas/Ventanas";
    }

    if (intent === "demolish") {
      return "Modo View activo: cambia a Demolish para eliminar";
    }

    if (selectedTool === "Muros" || selectedTool === "Suelos") {
      return "Modo View activo: cambia a Build para continuar";
    }

    if (selectedTool === "Puertas" || selectedTool === "Ventanas") {
      return "Modo View activo: cambia a Object para continuar";
    }

    if (selectedTool === "Eliminar") {
      return "Modo View activo: cambia a Demolish para continuar";
    }

    return "Modo View activo: selecciona Build/Object/Demolish para editar";
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
    if (isViewMode) {
      notifyInvalidAction(getViewModeHint(isOpeningTool ? "object" : "build"));
      return;
    }

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
    return () => {
      if (invalidActionTimeoutRef.current) {
        window.clearTimeout(invalidActionTimeoutRef.current);
      }
    };
  }, []);

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

  const terrainSpan = useMemo(() => Math.max(4, Math.max(lot.width, lot.length)), [lot.length, lot.width]);
  const majorGridDivisions = useMemo(
    () => Math.max(4, Math.round(terrainSpan / gridSpacing)),
    [gridSpacing, terrainSpan],
  );

  return (
    <div
      className={`relative h-full w-full ${
        isDemolishMode ? "cursor-crosshair" : isViewMode ? "cursor-grab" : "cursor-default"
      }`}
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
          onQualitySample={(fps) => {
            if (fps < 30) {
              setIsLowPerformanceMode(true);
              return;
            }

            if (fps > 45) {
              setIsLowPerformanceMode(false);
            }
          }}
        />

        <PlayModeController
          active={isPlayMode}
          lot={{ width: lot.width, length: lot.length }}
          walls={visibleWalls}
          openings={visibleOpenings}
          keysPressedRef={keysPressedRef}
          perspectiveCameraRef={perspectiveCameraRef}
          orbitControlsRef={orbitControlsRef}
          setCameraPosition={setCameraPosition}
          setCameraStateForMode={setCameraStateForMode}
        />

        <Terrain width={lot.width} length={lot.length} violationActive={terrainViolation} />

        {viewMode === "realistic" || viewMode === "play" ? (
          <Suspense fallback={null}>
            <RealisticLighting shadowsEnabled={effectiveRealisticShadows} sunAzimuth={sunAzimuth} />
          </Suspense>
        ) : (
          <>
            <ambientLight intensity={viewMode === "blueprint" ? 0.2 : 0.45} />
            {viewMode !== "blueprint" ? <directionalLight castShadow intensity={1.1} position={[8, 14, 10]} /> : null}
          </>
        )}

        {showGrid ? (
          <>
            <gridHelper args={[terrainSpan, majorGridDivisions, "#475569", "#1e293b"]} position={[0, 0, 0]} />
            <gridHelper args={[terrainSpan, majorGridDivisions * 4, "#334155", "#0f172a"]} position={[0, 0.001, 0]} />
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

            if (isViewMode) {
              notifyInvalidAction(getViewModeHint());
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

            if (isViewMode) {
              notifyInvalidAction(getViewModeHint());
              return;
            }

            onWallPointerMove(event);
            onRoomPointerMove(event);
          }}
          onPointerUp={(event) => {
            if (isViewMode) {
              notifyInvalidAction(getViewModeHint());
              return;
            }

            onWallPointerUp(event);
            onRoomPointerUp(event);
          }}
        >
          <planeGeometry args={[Math.max(500, lot.width + 8), Math.max(500, lot.length + 8)]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>

        {viewMode !== "blueprint"
          ? visibleWalls.map((wall) => (
          <Wall
            key={wall.id}
            wall={wall}
            openings={openingsByWallId.get(wall.id) ?? []}
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
                if (isViewMode) {
                  notifyInvalidAction(getViewModeHint("object"));
                  return;
                }

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

        {isBuildMode && previewLinePoints ? <PreviewLine points={previewLinePoints} /> : null}
        {isBuildMode && previewRectanglePoints ? <PreviewRectangle points={previewRectanglePoints} /> : null}
        {isBuildMode && previewRectanglePointsB ? <PreviewRectangle points={previewRectanglePointsB} /> : null}

        {selectedWall && isBuildMode ? (
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
          enabled={cameraControlMode === "orbit" && !isPlayMode}
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

      {terrainViolation ? (
        <div className="pointer-events-none absolute right-5 top-36 rounded-lg border border-rose-500/50 bg-rose-950/70 px-3 py-2 text-xs text-rose-100">
          Fuera del terreno: ajuste automático aplicado
        </div>
      ) : null}

      {viewMode === "realistic" && isLowPerformanceMode ? (
        <div className="pointer-events-none absolute right-5 top-48 rounded-lg border border-amber-500/50 bg-amber-950/70 px-3 py-2 text-xs text-amber-100">
          Rendimiento bajo: sombras reducidas automáticamente
        </div>
      ) : null}

      {isPlayMode ? (
        <div className="pointer-events-none absolute left-1/2 top-24 -translate-x-1/2 rounded-lg border border-cyan-500/50 bg-slate-950/80 px-3 py-2 text-xs text-cyan-100">
          Play mode: W/A/S/D mover · Q/E rotar · Shift correr
        </div>
      ) : null}

      {invalidActionMessage ? (
        <div className="pointer-events-none absolute left-1/2 top-5 -translate-x-1/2 rounded-lg border border-indigo-400/50 bg-indigo-950/75 px-3 py-2 text-xs text-indigo-100">
          {invalidActionMessage}
        </div>
      ) : null}
    </div>
  );
}
