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
      <meshStandardMaterial color={isSelected ? "#facc15" : "#22d3ee"} transparent opacity={0.25} side={2} />
      {isSelected ? <Outlines color="#facc15" thickness={3} transparent /> : null}
    </mesh>
  );
}
