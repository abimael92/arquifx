"use client";

import { useMemo } from "react";
import { Outlines } from "@react-three/drei";

import { Opening as OpeningType, Wall } from "@/types/project.types";

interface OpeningProps {
  opening: OpeningType;
  wall: Wall;
  isSelected: boolean;
  onSelect: (openingId: string) => void;
}

export function Opening({ opening, wall, isSelected, onSelect }: OpeningProps) {
  const { position, rotationY } = useMemo(() => {
    const dx = wall.endPoint.x - wall.startPoint.x;
    const dz = wall.endPoint.z - wall.startPoint.z;
    const wallLength = Math.max(Math.sqrt(dx * dx + dz * dz), 0.001);
    const dirX = dx / wallLength;
    const dirZ = dz / wallLength;

    const centerX = wall.startPoint.x + dirX * opening.positionFromStart;
    const centerZ = wall.startPoint.z + dirZ * opening.positionFromStart;
    const centerY = wall.startPoint.y + opening.sillHeight + opening.height / 2;

    return {
      position: [centerX, centerY, centerZ] as [number, number, number],
      rotationY: Math.atan2(dz, dx),
    };
  }, [opening, wall]);

  const baseColor = opening.type === "puerta" ? "#8b5a2b" : "#2563eb";
  const color = isSelected ? "#facc15" : baseColor;

  return (
    <mesh
      position={position}
      rotation={[0, rotationY, 0]}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(opening.id);
      }}
    >
      <boxGeometry args={[opening.width, opening.height, wall.thickness * 1.05]} />
      <meshStandardMaterial color={color} transparent opacity={0.45} />
      {isSelected ? <Outlines color="#facc15" thickness={3} transparent /> : null}
    </mesh>
  );
}
