"use client";
import dynamic from "next/dynamic";

// the WebGL scene is client-only — no SSR, loaded after the page is interactive
const Scene = dynamic(() => import("./Scene"), { ssr: false });

export default function SceneLoader() {
  return <Scene />;
}
