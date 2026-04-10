"use client";

import { useEffect, useMemo } from "react";

import { detectFloorsFromWalls } from "@/domains/scene/services/floor-detection.service";
import { useAppStore } from "@/store";

export function useFloorDetection() {
  const walls = useAppStore((state) => state.walls);
  const setFloors = useAppStore((state) => state.setFloors);

  const detectedFloors = useMemo(() => detectFloorsFromWalls(walls), [walls]);

  useEffect(() => {
    setFloors(detectedFloors);
  }, [detectedFloors, setFloors]);
}
