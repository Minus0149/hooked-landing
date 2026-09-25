"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { moodById, type MoodId } from "@/data/moods";
import { getState, playMood, subscribe } from "@/lib/jukebox";
import { Face } from "./MoodFaces";
import { HOLD_MS, MoodRing, useHoldRing } from "./MoodRing";


const useJukebox = () => useSyncExternalStore(subscribe, getState, getState);

/**
 * The hold scene's try-it card: hold it and push, or just tap it and tap a
 * face. (The record on the stage answers a hold the same way.) Every pick
 * plays a real hook from that mood.
 */
export function MoodTry() {
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
    <div className="mood-try-wrap">
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
                <Face mood={mood.id} size={22} animated /> {mood.label.toLowerCase()} · hold again
              </>
            ) : (
              <>press &amp; hold me</>
            )}
          </span>
        </button>
        <div className="mood-try-side">
          <p className="mood-try-title">try it here</p>
          <p className="mood-now" aria-live="polite">
            {jb.track && mood ? (
              <>
                now playing <b>{jb.track.title}</b> — {jb.track.artist}
              </>
            ) : (
              "hold the card and push toward a face — or tap it, then tap one. a real hook in that mood plays."
            )}
          </p>
        </div>
      </div>

      <ul className="mood-notes">
        <li>
          <b>your pick is a vote.</b> it tells everyone else what the song feels like, so the
          moods get sharper the more people hold.
        </li>
        <li>
          <b>hold the + instead</b> and you get a playlist for that mood that fills itself as
          you keep songs.
        </li>
        <li>
          <b>it reads the clock, too.</b> quiet things late, loud things through the afternoon —
          a suggestion you can switch off.
        </li>
      </ul>
      <MoodRing ring={ring} onCommit={commit} onCancel={close} hint="pick a face — a hook in that mood plays" />
    </div>
  );
}

/**
 * Answers a hold on the 3D record in the hero. The scene
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
