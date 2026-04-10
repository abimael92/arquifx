"use client";

import { useMemo } from "react";
import { ThreeEvent } from "@react-three/fiber";

import { computeOpeningTransform } from "@/domains/door/services/opening-placement.service";
import { Opening as OpeningType, Wall } from "@/types/project.types";

interface OpeningProps {
  opening: OpeningType;
  wall: Wall;
  isSelected: boolean;
  isHighlighted?: boolean;
  onSelect: (openingId: string) => void;
  onOpeningPointerDown?: (opening: OpeningType, event: ThreeEvent<PointerEvent>) => void;
  onOpeningPointerUp?: (opening: OpeningType, event: ThreeEvent<PointerEvent>) => void;
  onOpeningPointerMove?: (opening: OpeningType, event: ThreeEvent<PointerEvent>) => void;
  onOpeningPointerEnter?: (opening: OpeningType) => void;
  onOpeningPointerLeave?: (opening: OpeningType) => void;
}

export function Opening({
  opening,
  wall,
  isSelected,
  isHighlighted = false,
  onSelect,
  onOpeningPointerDown,
  onOpeningPointerUp,
  onOpeningPointerMove,
  onOpeningPointerEnter,
  onOpeningPointerLeave,
}: OpeningProps) {
  const { position, rotationY } = useMemo(() => computeOpeningTransform(opening, wall), [opening, wall]);

  const baseColor = opening.type === "puerta" ? "#8b5a2b" : "#2563eb";
  const color = isHighlighted ? "#ef4444" : baseColor;
  const emissiveColor = isHighlighted ? "#7f1d1d" : isSelected ? "#0891b2" : "#000000";
  const emissiveIntensity = isHighlighted ? 0.45 : isSelected ? 0.28 : 0;

  return (
    <mesh
      position={position}
      rotation={[0, rotationY, 0]}
      onPointerDown={(event) => {
        event.stopPropagation();
        onOpeningPointerDown?.(opening, event);
      }}
      onPointerUp={(event) => {
        onOpeningPointerUp?.(opening, event);
      }}
      onPointerMove={(event) => {
        onOpeningPointerMove?.(opening, event);
      }}
      onPointerEnter={() => {
        onOpeningPointerEnter?.(opening);
      }}
      onPointerLeave={() => {
        onOpeningPointerLeave?.(opening);
      }}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(opening.id);
      }}
    >
      <boxGeometry args={[opening.width, opening.height, Math.max(0.06, wall.thickness * 0.72)]} />
      <meshStandardMaterial
        color={color}
        emissive={emissiveColor}
        emissiveIntensity={emissiveIntensity}
        transparent
        opacity={opening.type === "ventana" ? 0.45 : 0.85}
      />
    </mesh>
  );
}
