"use client";

import { Environment } from "@react-three/drei";

interface RealisticLightingProps {
  shadowsEnabled: boolean;
  sunAzimuth: number;
}

export function RealisticLighting({ shadowsEnabled, sunAzimuth }: RealisticLightingProps) {
  return (
    <>
      <ambientLight intensity={0.38} color="#fff6e8" />
      <directionalLight
        castShadow={shadowsEnabled}
        intensity={1.35}
        color="#fff3d1"
        position={[Math.cos(sunAzimuth) * 14, 18, Math.sin(sunAzimuth) * 14]}
        shadow-mapSize-width={shadowsEnabled ? 2048 : 512}
        shadow-mapSize-height={shadowsEnabled ? 2048 : 512}
        shadow-camera-near={1}
        shadow-camera-far={80}
      />
      <Environment preset="city" />
    </>
  );
}
