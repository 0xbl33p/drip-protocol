"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const PARTICLE_COUNT = 150;
const BOUNDS = { x: 30, y: 12, z: 15 };

function createGlowTexture(): THREE.Texture {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  const gradient = ctx.createRadialGradient(
    size / 2, size / 2, 0,
    size / 2, size / 2, size / 2
  );
  gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
  gradient.addColorStop(0.2, "rgba(255, 255, 255, 0.5)");
  gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.1)");
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export function OceanParticles() {
  const meshRef = useRef<THREE.Points>(null);
  const glowTexture = useMemo(() => createGlowTexture(), []);

  const [positions, speeds, phases] = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const sp = new Float32Array(PARTICLE_COUNT);
    const ph = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * BOUNDS.x * 2;
      pos[i * 3 + 1] = (Math.random() - 0.5) * BOUNDS.y * 2;
      pos[i * 3 + 2] = (Math.random() - 0.5) * BOUNDS.z * 2;
      sp[i] = Math.random() * 0.04 + 0.01;
      ph[i] = Math.random() * Math.PI * 2;
    }

    return [pos, sp, ph];
  }, []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const posAttr = meshRef.current.geometry.getAttribute(
      "position"
    ) as THREE.BufferAttribute;
    const t = clock.getElapsedTime();

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      posAttr.array[i3] += Math.sin(t * 0.15 + phases[i]) * 0.001;
      posAttr.array[i3 + 1] += speeds[i] * 0.008;
      posAttr.array[i3 + 2] += Math.cos(t * 0.1 + phases[i]) * 0.0008;

      if (posAttr.array[i3 + 1] > BOUNDS.y) {
        posAttr.array[i3 + 1] = -BOUNDS.y;
        posAttr.array[i3] = (Math.random() - 0.5) * BOUNDS.x * 2;
      }
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={meshRef} position={[0, 2, 0]}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={PARTICLE_COUNT}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.15}
        sizeAttenuation
        transparent
        opacity={0.5}
        color="#00D9FF"
        map={glowTexture}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
