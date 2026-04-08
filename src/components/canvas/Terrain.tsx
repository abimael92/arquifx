"use client";

import { useMemo, useRef } from "react";
import { Edges } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { BoxGeometry } from "three";
import type { LineBasicMaterial, MeshBasicMaterial } from "three";

interface TerrainProps {
  width: number;
  length: number;
  violationActive: boolean;
}

export function Terrain({ width, length, violationActive }: TerrainProps) {
  const overlayMaterialRef = useRef<MeshBasicMaterial>(null);
  const borderMaterialRef = useRef<LineBasicMaterial>(null);
  const textureTint = useMemo(() => (violationActive ? "#3f1d2e" : "#243b2f"), [violationActive]);

  useFrame((state) => {
    if (!overlayMaterialRef.current || !borderMaterialRef.current) {
      return;
    }

    if (!violationActive) {
      overlayMaterialRef.current.opacity = 0.08;
      borderMaterialRef.current.opacity = 1;
      return;
    }

    const pulse = 0.5 + Math.sin(state.clock.elapsedTime * 8) * 0.5;
    overlayMaterialRef.current.opacity = 0.12 + pulse * 0.18;
    borderMaterialRef.current.opacity = 0.7 + pulse * 0.3;
  });

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.004, 0]} receiveShadow>
        <planeGeometry args={[width, length]} />
        <meshStandardMaterial color={textureTint} roughness={0.95} metalness={0.05} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
        <planeGeometry args={[width, length]} />
        <meshBasicMaterial
          ref={overlayMaterialRef}
          color={violationActive ? "#ef4444" : "#67e8f9"}
          transparent
          opacity={violationActive ? 0.18 : 0.08}
        />
      </mesh>

      <lineSegments>
        <edgesGeometry args={[new BoxGeometry(width, 0.01, length)]} />
        <lineBasicMaterial ref={borderMaterialRef} color={violationActive ? "#ef4444" : "#22d3ee"} linewidth={2} transparent />
      </lineSegments>

      <mesh position={[0, 0.03, 0]}>
        <boxGeometry args={[width, 0.05, length]} />
        <meshBasicMaterial transparent opacity={0} />
        <Edges scale={1} color={violationActive ? "#f87171" : "#67e8f9"} />
      </mesh>
    </group>
  );
}
