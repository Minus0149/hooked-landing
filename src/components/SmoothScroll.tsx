"use client";
import { useEffect } from "react";
import Lenis from "lenis";

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.09 });
    let raf = 0;
    const loop = (t: number) => {
      lenis.raf(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    // anchor links glide instead of jumping (native #hash bypasses Lenis);
    // "#" and "#top" glide back to the very top
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest?.('a[href^="#"]') as HTMLAnchorElement | null;
      if (!a) return;
      const id = a.getAttribute("href")!;
      // on touch, the finger-lift emits a micro touchmove that cancels an
      // unlocked glide instantly — it read as "needs two taps"
      const touch = matchMedia("(pointer: coarse)").matches;
      const opts = {
        duration: touch ? 1.4 : 1.9,
        lock: touch,
        easing: (t: number) => 1 - Math.pow(1 - t, 4),
      };
      if (id === "#" || id === "#top") {
        e.preventDefault();
        lenis.scrollTo(0, opts);
        return;
      }
      const el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      lenis.scrollTo(el as HTMLElement, opts);
    };
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("click", onClick);
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, []);
  return <>{children}</>;
}
