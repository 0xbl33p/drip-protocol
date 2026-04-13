"use client";

import { Canvas } from "@react-three/fiber";
import { AdaptiveDpr, PerformanceMonitor } from "@react-three/drei";
import { OceanSurface } from "./ocean-surface";
import { OceanParticles } from "./ocean-particles";
import { useState } from "react";

export function SceneInner() {
  const [dpr, setDpr] = useState(1.5);

  return (
    <Canvas
      dpr={dpr}
      camera={{ position: [0, 8, 18], fov: 55, near: 0.1, far: 100 }}
      style={{ background: "#050a14" }}
      gl={{ alpha: false, antialias: true, powerPreference: "high-performance" }}
    >
      <PerformanceMonitor
        onDecline={() => setDpr(1)}
        onIncline={() => setDpr(1.5)}
      />
      <AdaptiveDpr pixelated />

      {/* Subtle ambient + directional for depth cues */}
      <ambientLight intensity={0.15} color="#0a2a4a" />
      <directionalLight
        position={[5, 10, 5]}
        intensity={0.1}
        color="#00D9FF"
      />

      {/* Fog for depth */}
      <fog attach="fog" args={["#050a14", 15, 50]} />

      {/* Ocean water surface */}
      <OceanSurface />

      {/* Bioluminescent particles floating above the water */}
      <OceanParticles />
    </Canvas>
  );
}
