"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";

export function SceneCanvas() {
  return (
    <div className="h-full w-full">
      <Canvas camera={{ position: [8, 6, 8], fov: 50 }}>
        <color attach="background" args={["#0b1220"]} />
        <ambientLight intensity={0.6} />
        <directionalLight intensity={1} position={[8, 10, 6]} />
        <gridHelper args={[80, 80, "#334155", "#1e293b"]} position={[0, 0, 0]} />
        <OrbitControls makeDefault enableDamping dampingFactor={0.08} />
      </Canvas>
    </div>
  );
}
