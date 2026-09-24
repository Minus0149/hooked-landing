"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FACE_IDLE, MOODS, moodAtPush, wheelAngle, type MoodId } from "@/data/moods";
import { Face } from "./MoodFaces";

/**
 * The app's hold ring, on the landing page: six faces around the pointer,
 * push toward one and let go. Same geometry, same push rule and the same
 * face motions as the app, so what a visitor learns here is the real gesture.
 *
 * While the pointer is held, only the push aims (a face that happens to sit
 * under a held finger is not a choice). After release the ring stays up and
 * the faces can be tapped — the fallback for anyone who doesn't hold.
 */

const RING = 92;
const BUBBLE = 54;
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
  return (
    <AnimatePresence>
      {ring && <RingBody key="ring" ring={ring} onCommit={onCommit} onCancel={onCancel} hint={hint} />}
    </AnimatePresence>
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

  // release commits what the push pointed at; a release in the dead zone
  // leaves the ring up to be tapped
  const wasDragging = useRef(ring.dragging);
  useEffect(() => {
    if (wasDragging.current && !ring.dragging && pushed) onCommit(pushed);
    wasDragging.current = ring.dragging;
  }, [ring.dragging, pushed, onCommit]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [onCancel]);

  const { cx, cy } = useMemo(() => {
    const reach = RING + BUBBLE / 2 + EDGE;
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
        <motion.span
          className="mr-track"
          style={{ width: RING * 2, height: RING * 2, marginLeft: -RING, marginTop: -RING }}
          initial={{ scale: 0.35, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.6, opacity: 0 }}
          transition={{ type: "spring", stiffness: 520, damping: 32 }}
        />
        {MOODS.map((m, i) => {
          const a = (wheelAngle(i) * Math.PI) / 180;
          const on = aimed === i;
          const idle = FACE_IDLE[m.id];
          return (
            <motion.button
              key={m.id}
              type="button"
              className={`mr-face${on ? " on" : ""}`}
              style={{
                width: BUBBLE,
                height: BUBBLE,
                marginLeft: -BUBBLE / 2,
                marginTop: -BUBBLE / 2,
                ["--face" as string]: m.accent,
              }}
              initial={{ x: 0, y: 0, scale: 0.3, opacity: 0 }}
              animate={{ x: Math.cos(a) * RING, y: Math.sin(a) * RING, scale: on ? 1.2 : 1, opacity: 1 }}
              exit={{ x: 0, y: 0, scale: 0.3, opacity: 0 }}
              transition={{ type: "spring", stiffness: 560, damping: 30, delay: i * 0.022 }}
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
                <Face mood={m.id} size={30} />
              </motion.span>
            </motion.button>
          );
        })}
        <motion.div
          className="mr-label"
          style={{ top: -(RING + BUBBLE / 2 + 16) }}
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
            <span>{ring.dragging ? "push toward a face" : "tap a face"}</span>
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
