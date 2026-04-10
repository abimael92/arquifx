"use client";

import { useMemo } from "react";
import { Outlines } from "@react-three/drei";
import { Path, Shape, Vector2 } from "three";

import { Floor as FloorType } from "@/types/project.types";

interface FloorProps {
  floor: FloorType;
  isSelected: boolean;
  onSelect: (floorId: string) => void;
}

export function Floor({ floor, isSelected, onSelect }: FloorProps) {
  const shape = useMemo(() => {
    const vertices = floor.vertices.map((vertex) => new Vector2(vertex.x, vertex.z));
    if (vertices.length < 3) {
      return null;
    }

    const nextShape = new Shape(vertices);
    nextShape.autoClose = true;

    if (floor.holes?.length) {
      floor.holes.forEach((holeVertices) => {
        if (holeVertices.length < 3) {
          return;
        }

        const holePath = new Path(holeVertices.map((vertex) => new Vector2(vertex.x, vertex.z)));
        holePath.autoClose = true;
        nextShape.holes.push(holePath);
      });
    }

    return nextShape;
  }, [floor.holes, floor.vertices]);

  if (!shape) {
    return null;
  }

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.01, 0]}
      receiveShadow
      onClick={(event) => {
        event.stopPropagation();
        onSelect(floor.id);
      }}
    >
      <shapeGeometry args={[shape]} />
      <meshStandardMaterial
        color="#22d3ee"
        transparent
        opacity={isSelected ? 0.3 : 0.2}
        emissive={isSelected ? "#0891b2" : "#000000"}
        emissiveIntensity={isSelected ? 0.25 : 0}
        side={2}
      />
      {isSelected ? <Outlines color="#22d3ee" thickness={2} transparent opacity={0.9} /> : null}
    </mesh>
  );
}
