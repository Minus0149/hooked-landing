"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion, useScroll, useSpring, useMotionValueEvent } from "motion/react";
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

/* ---------- progress rail with chapter dots (each dot navigates) ---------- */
const CHAPTERS: [string, string][] = [
  ["intro", "#"], ["the problem", "#why"], ["the gestures", "#gestures"],
  ["the ritual", "#ritual"], ["the app", "#transform"], ["get it", "#cta"],
];
export function ProgressRail() {
  const { scrollYProgress } = useScroll();
  const scaleY = useSpring(scrollYProgress, { stiffness: 90, damping: 24 });
  const [active, setActive] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (v) =>
    setActive(Math.min(CHAPTERS.length - 1, Math.floor(v * CHAPTERS.length))),
  );
  return (
    <div className="rail">
      <div className="rail-track">
        <motion.div className="rail-fill" style={{ scaleY }} />
      </div>
      <div className="rail-dots">
        {CHAPTERS.map(([label, href], i) => (
          <a key={label} href={href} aria-label={label} className={`rail-dot ${i <= active ? "on" : ""}`}>
            <i>{label}</i>
          </a>
        ))}
      </div>
    </div>
  );
}

/* ---------- jukebox dock: play real hooks right on the landing ---------- */
export function JukeboxDock() {
  const state = useSyncExternalStore(jbSubscribe, jbState, jbState);
  return (
    <motion.div
      className="dock"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 2.2, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
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
              <span>tap the record · real 30s previews</span>
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

/* ---------- tilt wrapper: cards pivot in 3D under the cursor ---------- */
export function Tilt({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [rot, setRot] = useState({ rx: 0, ry: 0 });
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    // a touch-drag over the card is a scroll, and the tilt would stick mid-pivot
    setEnabled(!matchMedia("(pointer: coarse)").matches);
  }, []);
  return (
    <motion.div
      ref={ref}
      className="tilt"
      style={{ transformPerspective: 700 }}
      animate={{ rotateX: rot.rx, rotateY: rot.ry, scale: rot.rx || rot.ry ? 1.04 : 1 }}
      transition={{ type: "spring", stiffness: 220, damping: 20, mass: 0.6 }}
      onPointerMove={(e) => {
        if (!enabled) return;
        const r = ref.current!.getBoundingClientRect();
        setRot({
          rx: -((e.clientY - r.top) / r.height - 0.5) * 14,
          ry: ((e.clientX - r.left) / r.width - 0.5) * 14,
        });
      }}
      onPointerLeave={() => setRot({ rx: 0, ry: 0 })}
    >
      {children}
    </motion.div>
  );
}

/* ---------- giant outlined chapter word behind the 3D ---------- */
const WORDS: [string, number][] = [
  ["DISCOVER", 0.0], ["LEFTOVERS", 0.08], ["SKIP", 0.18], ["SAVE", 0.26],
  ["MORE", 0.33], ["NEVER", 0.40], ["RITUAL", 0.48], ["HOOKED", 0.66], ["YOURS", 0.85],
];
export function BigWord() {
  const { scrollYProgress } = useScroll();
  const [word, setWord] = useState("DISCOVER");
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    let w = WORDS[0][0];
    for (const [label, at] of WORDS) if (v >= at) w = label;
    setWord(w);
  });
  return (
    <div className="bigword" aria-hidden>
      <AnimatePresence mode="popLayout">
        <motion.span
          key={word}
          initial={{ opacity: 0, y: 90, rotate: -2 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          exit={{ opacity: 0, y: -90 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          {word}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
