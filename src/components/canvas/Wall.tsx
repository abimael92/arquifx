"use client";

import { useMemo } from "react";
import { ThreeEvent } from "@react-three/fiber";

import { buildWallGeometry, computeWallTransform } from "@/domains/wall/services/wall-geometry.service";
import { Opening as OpeningType, Wall as WallType } from "@/types/project.types";

interface WallProps {
  wall: WallType;
  openings?: OpeningType[];
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
  openings = [],
  isSelected,
  isHighlighted = false,
  onSelect,
  onWallPointerMove,
  onWallClick,
  onWallPointerEnter,
  onWallPointerLeave,
}: WallProps) {
  const { length, position, rotationY } = useMemo(() => computeWallTransform(wall), [wall]);

  const wallGeometry = useMemo(
    () => buildWallGeometry(wall, length, { openings, wallLength: length, wallHeight: wall.height }),
    [length, openings, wall],
  );

  const wallColor = isHighlighted ? "#ef4444" : "#9ca3af";
  const emissiveColor = isHighlighted ? "#7f1d1d" : isSelected ? "#0891b2" : "#000000";
  const emissiveIntensity = isHighlighted ? 0.5 : isSelected ? 0.22 : 0;

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
      <primitive object={wallGeometry} attach="geometry" />
      <meshStandardMaterial color={wallColor} emissive={emissiveColor} emissiveIntensity={emissiveIntensity} />
    </mesh>
  );
}
