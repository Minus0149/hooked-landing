"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { FACE_IDLE, MOODS, moodAtPush, wedgePath, wedgePoint, type MoodId } from "@/data/moods";
import { Face } from "./MoodFaces";

/**
 * The app's hold ring, on the landing page: a wheel of six wedges around the
 * pointer, push toward one and let go (or come back to the middle to cancel). Same geometry, same push rule and the same
 * face motions as the app, so what a visitor learns here is the real gesture.
 *
 * While the pointer is held, only the push aims (a face that happens to sit
 * under a held finger is not a choice). After release the ring stays up and
 * the faces can be tapped — the fallback for anyone who doesn't hold.
 */

const R_OUT = 116;
const R_IN = 46;
const FACE_R = 80;
const FACE_DY = -8;
const NAME_DY = 16;
const GAP = 1.1;
const POP = 6;
const CANVAS = (R_OUT + POP + 14) * 2;
const DEAD = 38;
const EDGE = 12;
const HINT_ROOM = 48;
export const HOLD_MS = 420;

export interface RingState {
  origin: { x: number; y: number };
  pointer: { x: number; y: number };
  dragging: boolean;
}

/** Open, track and close a hold ring; pointer tracking lives on the window. */
export function useHoldRing() {
  const [ring, setRing] = useState<RingState | null>(null);
  const open = useCallback((x: number, y: number, dragging = true) => {
    setRing({ origin: { x, y }, pointer: { x, y }, dragging });
  }, []);
  const close = useCallback(() => setRing(null), []);
  const holding = ring?.dragging === true;
  useEffect(() => {
    if (!holding) return;
    const move = (e: PointerEvent) =>
      setRing((r) => (r ? { ...r, pointer: { x: e.clientX, y: e.clientY } } : r));
    const up = () => setRing((r) => (r ? { ...r, dragging: false } : r));
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [holding]);
  return { ring, open, close };
}

const noSubscribe = () => () => {};

export function MoodRing({
  ring,
  onCommit,
  onCancel,
  hint,
}: {
  ring: RingState | null;
  onCommit: (mood: MoodId) => void;
  onCancel: () => void;
  hint: string;
}) {
  // Drawn straight into <body>. The page wrapper carries a CSS filter (the
  // blur behind the ring), and a filtered ancestor turns position: fixed into
  // "fixed to that ancestor" — the ring opened thousands of pixels above the
  // viewport anywhere below the first screen.
  // (after mount only, so the server's HTML and the first client render match)
  const mounted = useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false,
  );
  if (!mounted) return null;
  return createPortal(
    <AnimatePresence>
      {ring && <RingBody key="ring" ring={ring} onCommit={onCommit} onCancel={onCancel} hint={hint} />}
    </AnimatePresence>,
    document.body,
  );
}

function RingBody({
  ring,
  onCommit,
  onCancel,
  hint,
}: {
  ring: RingState;
  onCommit: (mood: MoodId) => void;
  onCancel: () => void;
  hint: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const pushed = moodAtPush(
    ring.pointer.x - ring.origin.x,
    ring.pointer.y - ring.origin.y,
    DEAD,
  );
  const aimed = ring.dragging
    ? pushed
      ? MOODS.findIndex((m) => m.id === pushed)
      : null
    : hover;

  // release commits what the push pointed at; back in the middle after
  // pushing out cancels; released without moving, it stays up to be tapped
  const [everAimed, setEverAimed] = useState(false);
  if (ring.dragging && pushed && !everAimed) setEverAimed(true);
  const wasDragging = useRef(ring.dragging);
  useEffect(() => {
    if (wasDragging.current && !ring.dragging) {
      if (pushed) onCommit(pushed);
      else if (everAimed) onCancel();
    }
    wasDragging.current = ring.dragging;
  }, [ring.dragging, pushed, everAimed, onCommit, onCancel]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [onCancel]);

  const { cx, cy } = useMemo(() => {
    const reach = R_OUT + POP + EDGE;
    const w = typeof window === "undefined" ? 1024 : window.innerWidth;
    const h = typeof window === "undefined" ? 768 : window.innerHeight;
    return {
      cx: Math.min(Math.max(ring.origin.x, reach), w - reach),
      cy: Math.min(Math.max(ring.origin.y, reach + 48), h - reach - HINT_ROOM),
    };
  }, [ring.origin.x, ring.origin.y]);

  const lead = aimed !== null && aimed >= 0 ? MOODS[aimed] : null;

  return (
    <>
      <motion.div
        className="mr-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.14 }}
        onPointerDown={() => {
          if (!ring.dragging) onCancel();
        }}
      />
      <div className="mr-ring" role="dialog" aria-label="Pick a mood" style={{ left: cx, top: cy }}>
        <motion.div
          className="mr-wheel"
          style={{ width: CANVAS, height: CANVAS, marginLeft: -CANVAS / 2, marginTop: -CANVAS / 2 }}
          initial={{ scale: 0.5, rotate: -24, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          exit={{ scale: 0.7, opacity: 0, transition: { duration: 0.12 } }}
          transition={{ type: "spring", stiffness: 460, damping: 30 }}
        >
          <svg width={CANVAS} height={CANVAS} viewBox={`${-CANVAS / 2} ${-CANVAS / 2} ${CANVAS} ${CANVAS}`} aria-hidden="true">
            <circle className="mr-rim" r={R_OUT + 3} />
            {MOODS.map((m, i) => {
              const on = aimed === i;
              const off = wedgePoint(i, on ? POP : 0);
              const name = wedgePoint(i, FACE_R);
              return (
                <g
                  key={m.id}
                  className={`mr-wedge${on ? " on" : ""}`}
                  style={{ ["--face" as string]: m.accent, transform: `translate(${off.x}px, ${off.y}px)` }}
                  onPointerEnter={() => {
                    if (!ring.dragging) setHover(i);
                  }}
                  onPointerLeave={() => {
                    if (!ring.dragging) setHover(null);
                  }}
                  onClick={() => onCommit(m.id)}
                >
                  <path d={wedgePath(i, R_IN, R_OUT, GAP)} />
                  <text className="mr-name" x={name.x} y={name.y + NAME_DY} textAnchor="middle" dominantBaseline="central">
                    {m.label}
                  </text>
                </g>
              );
            })}
            <circle className="mr-hole" r={R_IN - 6} />
            {aimed !== null && aimed >= 0 && (
              <path
                className="mr-pointer"
                style={{ ["--face" as string]: MOODS[aimed].accent }}
                d={wedgePath(aimed, R_IN - 7.5, R_IN - 4.5, 8)}
              />
            )}
            {ring.dragging && !pushed && everAimed && (
              <path className="mr-cancel" d="M -7 -7 L 7 7 M 7 -7 L -7 7" />
            )}
          </svg>
        </motion.div>
        {MOODS.map((m, i) => {
          const on = aimed === i;
          const idle = FACE_IDLE[m.id];
          const p = wedgePoint(i, FACE_R + (on ? POP : 0));
          return (
            <motion.button
              key={m.id}
              type="button"
              className={`mr-face${on ? " on" : ""}`}
              style={{ ["--face" as string]: m.accent }}
              initial={{ x: 0, y: 0, scale: 0.3, opacity: 0 }}
              animate={{ x: p.x, y: p.y + FACE_DY, scale: on ? 1.18 : 1, opacity: 1 }}
              exit={{ x: 0, y: 0, scale: 0.3, opacity: 0 }}
              transition={{ type: "spring", stiffness: 560, damping: 30, delay: 0.03 + i * 0.02 }}
              onPointerEnter={() => {
                if (!ring.dragging) setHover(i);
              }}
              onPointerLeave={() => {
                if (!ring.dragging) setHover(null);
              }}
              onClick={() => onCommit(m.id)}
              aria-label={`${m.label} — ${m.line}`}
            >
              <motion.span
                className="mr-face-anim"
                animate={idle.keyframes}
                transition={{
                  duration: on ? idle.duration * 0.55 : idle.duration,
                  delay: 0.25 + i * 0.13,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Face mood={m.id} size={30} animated delay={i * 0.13} />
              </motion.span>
            </motion.button>
          );
        })}
        <motion.div
          className="mr-label"
          style={{ bottom: R_OUT + 16 }}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, transition: { duration: 0.1 } }}
          aria-live="polite"
        >
          {lead ? (
            <>
              <b style={{ color: lead.accent }}>{lead.label}</b>
              <span>{lead.line}</span>
            </>
          ) : (
            <span>
              {ring.dragging ? (everAimed ? "let go here to cancel" : "push toward a face") : "tap a face"}
            </span>
          )}
        </motion.div>
      </div>
      <motion.div
        className="mr-hint"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.1 } }}
      >
        {hint}
      </motion.div>
    </>
  );
}
