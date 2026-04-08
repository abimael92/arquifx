"use client";

import { TransformControls } from "@react-three/drei";
import { RefObject, useEffect, useMemo, useRef, useState } from "react";
import { Mesh, Vector3 } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

import { Wall } from "@/types/project.types";

interface Controls3DProps {
  wall: Wall;
  orbitControlsRef: RefObject<OrbitControlsImpl>;
  onTransformWall: (wallId: string, startPoint: Wall["startPoint"], endPoint: Wall["endPoint"]) => void;
}

export function Controls3D({ wall, orbitControlsRef, onTransformWall }: Controls3DProps) {
  const pivotRef = useRef<Mesh>(null);
  const [mode, setMode] = useState<"translate" | "rotate">("translate");

  const wallLength = useMemo(() => {
    const dx = wall.endPoint.x - wall.startPoint.x;
    const dy = wall.endPoint.y - wall.startPoint.y;
    const dz = wall.endPoint.z - wall.startPoint.z;
    return Math.max(Math.sqrt(dx * dx + dy * dy + dz * dz), 0.01);
  }, [wall]);

  useEffect(() => {
    if (!pivotRef.current) {
      return;
    }

    const midX = (wall.startPoint.x + wall.endPoint.x) / 2;
    const midZ = (wall.startPoint.z + wall.endPoint.z) / 2;
    const baseY = (wall.startPoint.y + wall.endPoint.y) / 2;
    const rotationY = Math.atan2(wall.endPoint.z - wall.startPoint.z, wall.endPoint.x - wall.startPoint.x);

    pivotRef.current.position.set(midX, baseY + wall.height / 2, midZ);
    pivotRef.current.rotation.set(0, rotationY, 0);
  }, [wall]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "r") {
        setMode("rotate");
      }

      if (event.key.toLowerCase() === "g") {
        setMode("translate");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <TransformControls
      mode={mode}
      onMouseDown={() => {
        if (orbitControlsRef.current) {
          orbitControlsRef.current.enabled = false;
        }
      }}
      onMouseUp={() => {
        if (!pivotRef.current) {
          return;
        }

        if (orbitControlsRef.current) {
          orbitControlsRef.current.enabled = true;
        }

        const center = new Vector3().copy(pivotRef.current.position);
        const theta = pivotRef.current.rotation.y;
        const half = wallLength / 2;

        const dirX = Math.cos(theta);
        const dirZ = Math.sin(theta);
        const baseY = center.y - wall.height / 2;

        const startPoint = {
          x: center.x - dirX * half,
          y: baseY,
          z: center.z - dirZ * half,
        };

        const endPoint = {
          x: center.x + dirX * half,
          y: baseY,
          z: center.z + dirZ * half,
        };

        onTransformWall(wall.id, startPoint, endPoint);
      }}
    >
      <mesh ref={pivotRef} visible={false}>
        <boxGeometry args={[wallLength, wall.height, wall.thickness]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </TransformControls>
  );
}
