"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// the WebGL scene is client-only — no SSR, loaded after the page is interactive
const Scene = dynamic(() => import("./Scene"), { ssr: false });

// The preloader holds the screen for 1500ms and then slides away over 700ms.
// Mounting the scene at the moment it starts leaving means three.js downloads,
// evaluates and spins up WebGL underneath the curtain instead of fighting the
// preloader's own animation for the main thread — that contention was the whole
// reason the loading screen stuttered. Keep in sync with Preloader in Chrome.tsx.
const PRELOADER_MS = 1500;

export default function SceneLoader() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), PRELOADER_MS);
    return () => clearTimeout(t);
  }, []);

  if (!ready) return null;
  return <Scene />;
}
