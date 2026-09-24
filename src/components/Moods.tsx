"use client";

import { motion } from "motion/react";
import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { moodById, type MoodId } from "@/data/moods";
import { getState, playMood, subscribe } from "@/lib/jukebox";
import { Face } from "./MoodFaces";
import { HOLD_MS, MoodRing, useHoldRing } from "./MoodRing";

const rise = {
  initial: { opacity: 0, y: 46 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-12% 0px" },
  transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] as const },
};

const useJukebox = () => useSyncExternalStore(subscribe, getState, getState);

/**
 * Chapter 03 — the moods. Three ways in, on purpose:
 *   - the real app, looping: a hold ring recorded from the actual UI;
 *   - a card to try it on: hold it and push, or just tap it and tap a face;
 *   - the record on the right (and in the hero) answers a hold the same way.
 * Every pick plays a real hook from that mood.
 */
export function Moods() {
  const jb = useJukebox();
  const { ring, open, close } = useHoldRing();
  const hold = useRef<{ timer?: number; fired: boolean }>({ fired: false });
  const mood = moodById(jb.mood);

  const commit = useCallback(
    (m: MoodId) => {
      close();
      playMood(m);
    },
    [close],
  );

  const startHold = (e: React.PointerEvent<HTMLButtonElement>) => {
    hold.current.fired = false;
    const { clientX, clientY } = e;
    window.clearTimeout(hold.current.timer);
    hold.current.timer = window.setTimeout(() => {
      hold.current.fired = true;
      open(clientX, clientY, true);
    }, HOLD_MS);
  };
  const cancelHold = () => window.clearTimeout(hold.current.timer);

  return (
    <section className="chapter" id="moods">
      <div className="copy mood-copy">
        <Tag />
        <motion.h2 {...rise}>
          hold a song. <span style={{ color: "var(--pink)" }}>pick a mood.</span>
        </motion.h2>
        <motion.p {...rise}>
          press and hold any card and six faces ring your thumb. push toward one and
          let go — the deck leans that way for the rest of the session, and the vote
          tells everyone else what the song feels like. hold the + instead and you
          get a playlist for that mood that fills itself as you keep songs.
        </motion.p>

        <motion.div className="mood-demo" {...rise}>
          <div className="mood-phone" aria-label="The hold ring in the hooked app">
            <video
              src="/media/mood-ring.mp4"
              poster="/media/mood-ring-poster.jpg"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
            >
              <source src="/media/mood-ring.webm" type="video/webm" />
              <source src="/media/mood-ring.mp4" type="video/mp4" />
            </video>
          </div>

          <div className="mood-try">
            <button
              type="button"
              className="mood-card"
              style={{ ["--face" as string]: mood?.accent ?? "var(--pink)" }}
              onPointerDown={startHold}
              onPointerUp={cancelHold}
              onPointerLeave={cancelHold}
              onPointerCancel={cancelHold}
              onContextMenu={(e) => e.preventDefault()}
              onClick={(e) => {
                // a hold already opened the ring; a tap opens it for tapping
                if (hold.current.fired) {
                  hold.current.fired = false;
                  return;
                }
                const r = e.currentTarget.getBoundingClientRect();
                open(r.left + r.width / 2, r.top + r.height / 2, false);
              }}
              aria-label="Try the mood ring: hold, or tap, then pick a face"
            >
              {jb.track?.artwork ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={jb.track.artwork} alt="" draggable={false} />
              ) : (
                <span className="mood-card-blank" />
              )}
              <span className="mood-card-cta">
                {mood ? (
                  <>
                    <Face mood={mood.id} size={20} /> {mood.label.toLowerCase()} · hold again
                  </>
                ) : (
                  <>press &amp; hold me</>
                )}
              </span>
            </button>
            <p className="mood-now" aria-live="polite">
              {jb.track && mood ? (
                <>
                  <b>{jb.track.title}</b> — {jb.track.artist}
                </>
              ) : (
                "or just tap it, then tap a face"
              )}
            </p>
            <p className="mood-alt">…or hold the record →</p>
          </div>
        </motion.div>
      </div>
      <MoodRing ring={ring} onCommit={commit} onCancel={close} hint="pick a face — a hook in that mood plays" />
    </section>
  );
}

function Tag() {
  return (
    <motion.div className="sec-tag" {...rise}>
      <span>03</span> — the moods
    </motion.div>
  );
}

/**
 * Answers a hold on the 3D record, wherever it is on the page. The scene
 * dispatches `hooked:hold-record` from inside the canvas; this owns the ring.
 */
export function RecordHoldHost() {
  const { ring, open, close } = useHoldRing();
  useEffect(() => {
    const onHold = (e: Event) => {
      const { x, y } = (e as CustomEvent<{ x: number; y: number }>).detail;
      open(x, y, true);
    };
    window.addEventListener("hooked:hold-record", onHold);
    return () => window.removeEventListener("hooked:hold-record", onHold);
  }, [open]);
  return (
    <MoodRing
      ring={ring}
      onCommit={(m) => {
        close();
        playMood(m);
      }}
      onCancel={close}
      hint="pick a face — a hook in that mood plays"
    />
  );
}
