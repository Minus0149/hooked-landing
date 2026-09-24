"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "motion/react";
import { getState as jbState, subscribe as jbSubscribe, toggle as jbToggle, next as jbNext } from "@/lib/jukebox";

/* ---------- preloader: the needle drops, the page begins ---------- */
export function Preloader() {
  const [done, setDone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setDone(true), 1500);
    return () => clearTimeout(t);
  }, []);
  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          className="preloader"
          exit={{ y: "-100%", transition: { duration: 0.7, ease: [0.76, 0, 0.24, 1] } }}
        >
          <div className="preloader-word">
            {"hooked.".split("").map((ch, i) => (
              <motion.span
                key={i}
                initial={{ y: 60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.12 + i * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                style={ch === "." ? { color: "var(--pink)" } : undefined}
              >
                {ch}
              </motion.span>
            ))}
          </div>
          <motion.div
            className="preloader-bar"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---------- custom cursor: a dot and a lazy ring ---------- */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (matchMedia("(pointer: coarse)").matches) return;
    document.body.classList.add("has-cursor");
    let x = 0, y = 0, rx = 0, ry = 0, hover = false, raf = 0;
    const move = (e: PointerEvent) => {
      x = e.clientX; y = e.clientY;
      hover =
        !!(e.target as HTMLElement).closest("a, button") ||
        document.body.hasAttribute("data-disc-hover");
    };
    const loop = () => {
      rx += (x - rx) * 0.16; ry += (y - ry) * 0.16;
      if (dot.current) dot.current.style.transform = `translate(${x}px, ${y}px)`;
      if (ring.current)
        ring.current.style.transform = `translate(${rx}px, ${ry}px) scale(${hover ? 2.1 : 1})`;
      raf = requestAnimationFrame(loop);
    };
    addEventListener("pointermove", move);
    raf = requestAnimationFrame(loop);
    return () => {
      removeEventListener("pointermove", move);
      cancelAnimationFrame(raf);
      document.body.classList.remove("has-cursor");
    };
  }, []);
  return (
    <>
      <div ref={dot} className="cursor-dot" />
      <div ref={ring} className="cursor-ring" />
    </>
  );
}

/* ---------- jukebox dock: play real hooks right on the landing ---------- */
/**
 * The dock rides the hero, where the record it plays from is. Further down it
 * only shows while a hook is playing (it's the pause button then), and it
 * always steps aside for the footer — it used to sit on headings and on the
 * legal links at the bottom of the page.
 */
function useSeen(selector: string, margin = "0px") {
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = document.querySelector(selector);
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setSeen(e.isIntersecting), { rootMargin: margin });
    io.observe(el);
    return () => io.disconnect();
  }, [selector, margin]);
  return seen;
}

export function JukeboxDock() {
  const state = useSyncExternalStore(jbSubscribe, jbState, jbState);
  const inHero = useSeen("#top", "0px 0px -35% 0px");
  // the next section's first lines arriving at the bottom of the screen —
  // right where the dock sits — sends it away unless something is playing
  const contentBelow = useSeen("#why", "0px 0px -16% 0px");
  const atFoot = useSeen("footer");
  const show = ((inHero && !contentBelow) || state.playing) && !atFoot;
  return (
    <motion.div
      className="dock"
      initial={{ opacity: 0, y: 30 }}
      animate={show ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ delay: show && !state.track ? 2.2 : 0, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      style={{ pointerEvents: show ? "auto" : "none" }}
      aria-hidden={show ? undefined : true}
    >
      <button className="dock-play" onClick={jbToggle} aria-label={state.playing ? "pause" : "play a hook"}>
        {state.playing ? "❚❚" : "▶"}
      </button>
      <AnimatePresence mode="wait">
        <motion.div
          key={state.track ? state.track.title : "idle"}
          className="dock-meta"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
        >
          {state.track ? (
            <>
              <b>{state.track.title}</b>
              <span>{state.track.artist}</span>
            </>
          ) : (
            <>
              <b>hear a hook</b>
              <span>tap the record · hold it for a mood</span>
            </>
          )}
        </motion.div>
      </AnimatePresence>
      {state.playing && (
        <span className="dock-eq" aria-hidden>
          <i /><i /><i />
        </span>
      )}
      <button className="dock-next" onClick={jbNext} aria-label="next hook">↻</button>
    </motion.div>
  );
}

/* ---------- magnetic wrapper: buttons lean toward a NEARBY cursor ---------- */
export function Magnetic({ children, strength = 0.32 }: { children: React.ReactNode; strength?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  useEffect(() => {
    // touch "pointermoves" are scroll gestures — the pull would stick (no leave event)
    if (matchMedia("(pointer: coarse)").matches) return;
    const move = (e: PointerEvent) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (r.width === 0) return;
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const dx = e.clientX - cx, dy = e.clientY - cy;
      const reach = Math.max(r.width, r.height) * 1.1;
      const d = Math.hypot(dx, dy);
      if (d < reach) {
        const pull = 1 - d / reach;
        setPos({ x: dx * strength * (0.4 + 0.6 * pull), y: dy * strength * (0.4 + 0.6 * pull) });
      } else {
        setPos((p) => (p.x || p.y ? { x: 0, y: 0 } : p));
      }
    };
    addEventListener("pointermove", move);
    return () => removeEventListener("pointermove", move);
  }, [strength]);
  return (
    <motion.div
      ref={ref}
      className="magnetic"
      animate={{ x: pos.x, y: pos.y }}
      transition={{ type: "spring", stiffness: 240, damping: 18, mass: 0.5 }}
    >
      {children}
    </motion.div>
  );
}

/* ---------- nav: clear over the hero, a solid bar once content scrolls under ---------- */
export function NavShell({ children }: { children: React.ReactNode }) {
  const [solid, setSolid] = useState(false);
  useEffect(() => {
    const on = () => setSolid(window.scrollY > 24);
    on();
    addEventListener("scroll", on, { passive: true });
    return () => removeEventListener("scroll", on);
  }, []);
  return <nav className={solid ? "solid" : undefined}>{children}</nav>;
}
