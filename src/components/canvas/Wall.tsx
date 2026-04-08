"use client";

import { useMemo } from "react";
import { Outlines } from "@react-three/drei";
import { ThreeEvent } from "@react-three/fiber";

import { Wall as WallType } from "@/types/project.types";

interface WallProps {
  wall: WallType;
  isSelected: boolean;
  onSelect: (wallId: string) => void;
  onWallPointerMove?: (wall: WallType, event: ThreeEvent<PointerEvent>) => void;
  onWallClick?: (wall: WallType, event: ThreeEvent<MouseEvent>) => void;
}

export function Wall({ wall, isSelected, onSelect, onWallPointerMove, onWallClick }: WallProps) {
  const { length, position, rotationY } = useMemo(() => {
    const dx = wall.endPoint.x - wall.startPoint.x;
    const dy = wall.endPoint.y - wall.startPoint.y;
    const dz = wall.endPoint.z - wall.startPoint.z;
    const lengthValue = Math.sqrt(dx * dx + dy * dy + dz * dz);

    return {
      length: Math.max(lengthValue, 0.01),
      position: [
        (wall.startPoint.x + wall.endPoint.x) / 2,
        (wall.startPoint.y + wall.endPoint.y) / 2 + wall.height / 2,
        (wall.startPoint.z + wall.endPoint.z) / 2,
      ] as [number, number, number],
      rotationY: Math.atan2(dz, dx),
    };
  }, [wall]);

  return (
    <mesh
      position={position}
      rotation={[0, rotationY, 0]}
      castShadow
      receiveShadow
      onPointerMove={(event) => {
        onWallPointerMove?.(wall, event);
      }}
      onClick={(event) => {
        event.stopPropagation();
        if (onWallClick) {
          onWallClick(wall, event);
          return;
        }

        onSelect(wall.id);
      }}
    >
      <boxGeometry args={[length, wall.height, wall.thickness]} />
      <meshStandardMaterial color={isSelected ? "#facc15" : "#9ca3af"} />
      {isSelected ? <Outlines color="#facc15" thickness={3} transparent /> : null}
    </mesh>
  );
}
