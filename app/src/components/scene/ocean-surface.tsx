"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;
  varying float vElevation;
  varying vec3 vWorldPos;

  void main() {
    vUv = uv;
    vec3 pos = position;

    // Layer multiple sine waves for organic ocean feel
    float wave1 = sin(pos.x * 0.3 + uTime * 0.4) * 0.8;
    float wave2 = sin(pos.y * 0.5 + uTime * 0.3) * 0.5;
    float wave3 = sin(pos.x * 0.8 + pos.y * 0.6 + uTime * 0.6) * 0.3;
    float wave4 = sin(pos.x * 1.5 + pos.y * 1.2 + uTime * 0.8) * 0.12;
    float wave5 = sin(pos.x * 2.5 - uTime * 0.5) * sin(pos.y * 2.0 + uTime * 0.3) * 0.08;

    float elevation = wave1 + wave2 + wave3 + wave4 + wave5;
    pos.z = elevation;

    vElevation = elevation;
    vWorldPos = pos;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;
  varying float vElevation;
  varying vec3 vWorldPos;

  void main() {
    // Deep ocean base colors
    vec3 deepColor = vec3(0.012, 0.035, 0.065);   // #030911 — abyss
    vec3 midColor = vec3(0.02, 0.06, 0.12);        // #051020 — deep
    vec3 surfaceColor = vec3(0.0, 0.22, 0.38);     // #003861 — wave peaks
    vec3 highlightColor = vec3(0.0, 0.55, 0.75);   // #008CBF — bright crests
    vec3 cyanGlow = vec3(0.0, 0.85, 1.0);          // #00D9FF — bioluminescent

    // Elevation-based color mixing
    float normalizedElev = (vElevation + 1.8) / 3.6; // normalize to ~0-1
    vec3 baseColor = mix(deepColor, midColor, smoothstep(0.0, 0.4, normalizedElev));
    baseColor = mix(baseColor, surfaceColor, smoothstep(0.4, 0.7, normalizedElev));
    baseColor = mix(baseColor, highlightColor, smoothstep(0.75, 0.95, normalizedElev));

    // Caustic pattern on wave troughs
    float caustic1 = sin(vWorldPos.x * 3.0 + uTime * 0.8) * sin(vWorldPos.y * 2.5 - uTime * 0.6);
    float caustic2 = sin(vWorldPos.x * 5.0 - uTime * 0.5) * sin(vWorldPos.y * 4.0 + uTime * 0.7);
    float caustic = (caustic1 + caustic2) * 0.5 + 0.5;
    caustic = pow(caustic, 3.0) * 0.08;
    baseColor += cyanGlow * caustic * (1.0 - normalizedElev);

    // Subtle rim/crest glow
    float crestGlow = smoothstep(0.85, 1.0, normalizedElev) * 0.15;
    baseColor += cyanGlow * crestGlow;

    // Edge fade to black
    float edgeFade = 1.0 - smoothstep(0.3, 0.5, length(vUv - 0.5));
    baseColor *= edgeFade * 0.7 + 0.3;

    // Depth fog
    float fogFactor = smoothstep(0.0, 0.6, 1.0 - normalizedElev);
    baseColor = mix(baseColor, deepColor, fogFactor * 0.3);

    gl_FragColor = vec4(baseColor, 0.85);
  }
`;

export function OceanSurface() {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
    }),
    []
  );

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
    }
  });

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2.3, 0, 0]}
      position={[0, -6, -5]}
    >
      <planeGeometry args={[80, 60, 200, 150]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={VERTEX_SHADER}
        fragmentShader={FRAGMENT_SHADER}
        uniforms={uniforms}
        transparent
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}
