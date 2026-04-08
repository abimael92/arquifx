"use client";

import { useMemo } from "react";
import { Outlines } from "@react-three/drei";
import { ThreeEvent } from "@react-three/fiber";

import { Wall as WallType } from "@/types/project.types";

interface WallProps {
  wall: WallType;
  isSelected: boolean;
  isHighlighted?: boolean;
  onSelect: (wallId: string) => void;
  onWallPointerMove?: (wall: WallType, event: ThreeEvent<PointerEvent>) => void;
  onWallClick?: (wall: WallType, event: ThreeEvent<MouseEvent>) => void;
  onWallPointerEnter?: (wall: WallType) => void;
  onWallPointerLeave?: (wall: WallType) => void;
}

export function Wall({
  wall,
  isSelected,
  isHighlighted = false,
  onSelect,
  onWallPointerMove,
  onWallClick,
  onWallPointerEnter,
  onWallPointerLeave,
}: WallProps) {
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
      onPointerEnter={() => {
        onWallPointerEnter?.(wall);
      }}
      onPointerLeave={() => {
        onWallPointerLeave?.(wall);
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
      <meshStandardMaterial color={isHighlighted ? "#ef4444" : isSelected ? "#facc15" : "#9ca3af"} />
      {isHighlighted ? <Outlines color="#ef4444" thickness={3} transparent /> : null}
      {!isHighlighted && isSelected ? <Outlines color="#facc15" thickness={3} transparent /> : null}
    </mesh>
  );
}
