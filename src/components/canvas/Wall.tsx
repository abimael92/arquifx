"use client";

import { useMemo } from "react";
import { ThreeEvent } from "@react-three/fiber";
import { ExtrudeGeometry, Path, Shape, Vector2 } from "three";

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
  const { length, position, rotationY } = useMemo(() => {
    const dx = wall.endPoint.x - wall.startPoint.x;
    const dz = wall.endPoint.z - wall.startPoint.z;
    const lengthValue = Math.sqrt(dx * dx + dz * dz);

    return {
      length: Math.max(lengthValue, 0.01),
      position: [
        (wall.startPoint.x + wall.endPoint.x) / 2,
        (wall.startPoint.y + wall.endPoint.y) / 2,
        (wall.startPoint.z + wall.endPoint.z) / 2,
      ] as [number, number, number],
      rotationY: Math.atan2(dz, dx),
    };
  }, [wall]);

  const wallGeometry = useMemo(() => {
    const shape = new Shape([
      new Vector2(-length / 2, 0),
      new Vector2(length / 2, 0),
      new Vector2(length / 2, wall.height),
      new Vector2(-length / 2, wall.height),
    ]);

    const edgePadding = 0.02;
    const minHoleSize = 0.05;

    openings.forEach((opening) => {
      const centerX = -length / 2 + opening.positionFromStart;
      const halfWidth = opening.width / 2;
      const rawMinX = centerX - halfWidth;
      const rawMaxX = centerX + halfWidth;
      const rawMinY = opening.sillHeight;
      const rawMaxY = opening.sillHeight + opening.height;

      const minX = Math.max(-length / 2 + edgePadding, rawMinX);
      const maxX = Math.min(length / 2 - edgePadding, rawMaxX);
      const minY = Math.max(edgePadding, rawMinY);
      const maxY = Math.min(wall.height - edgePadding, rawMaxY);

      if (maxX - minX < minHoleSize || maxY - minY < minHoleSize) {
        return;
      }

      const hole = new Path([
        new Vector2(minX, minY),
        new Vector2(maxX, minY),
        new Vector2(maxX, maxY),
        new Vector2(minX, maxY),
      ]);
      hole.autoClose = true;
      shape.holes.push(hole);
    });

    const geometry = new ExtrudeGeometry(shape, {
      depth: wall.thickness,
      bevelEnabled: false,
      curveSegments: 2,
      steps: 1,
    });
    geometry.translate(0, 0, -wall.thickness / 2);
    geometry.computeVertexNormals();
    return geometry;
  }, [length, openings, wall.height, wall.thickness]);

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
