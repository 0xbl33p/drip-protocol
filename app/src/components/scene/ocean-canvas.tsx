"use client";

import dynamic from "next/dynamic";

const Scene = dynamic(() => import("./scene-inner").then((m) => m.SceneInner), {
  ssr: false,
});

export function OceanCanvas() {
  return (
    <div
      className="fixed inset-0 -z-10 pointer-events-none"
      aria-hidden="true"
    >
      <Scene />
    </div>
  );
}
