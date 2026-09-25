"use client";
import { useEffect, useRef, useState } from "react";
import { MOODS, wedgePath, wedgePoint } from "@/data/moods";
import { film, onFilm, seg, sceneIndex } from "@/lib/film";
import { phoneShown } from "@/lib/choreo";
import { Face } from "./MoodFaces";

/**
 * The flat layers of the stage, drawn over the 3D canvas inside the same
 * pinned box: the song timeline (the problem), the mood wheel (hold) and the
 * app itself (the gestures). Each reads the playhead from film.ts and renders
 * only while its scene is near.
 */

/** the playhead, re-rendered only while `from..to` is on screen */
function usePlayhead(from: number, to: number) {
  const [t, setT] = useState(film.t);
  useEffect(
    () =>
      onFilm((next) => {
        // outside the window, one last update to park it, then quiet
        if (next < from - 0.2 || next > to + 0.2) {
          setT((cur) => (cur < from - 0.2 || cur > to + 0.2 ? cur : next));
          return;
        }
        setT(Math.round(next * 400) / 400);
      }),
    [from, to],
  );
  return t;
}

/* ---------------------------------------------------------------- the song */

// one song, sixty seconds, 90 bars: a long quiet intro, a build, the chorus at 0:40
const BARS = 90;
const SONG_S = 60;
const CHORUS_S = 40;
const heights = Array.from({ length: BARS }, (_, i) => {
  const s = (i / BARS) * SONG_S;
  const wobble = 0.5 + 0.5 * Math.sin(i * 1.7) * Math.cos(i * 0.43);
  if (s < 32) return 0.16 + 0.14 * wobble;
  if (s < CHORUS_S) return 0.3 + ((s - 32) / 8) * 0.35 + 0.08 * wobble;
  return 0.72 + 0.26 * wobble;
});
const MARKS = [
  { s: 5, big: "24%", text: ["already swiped away"] },
  { s: 30, big: "35%", text: ["gone before thirty seconds"] },
  { s: CHORUS_S, big: "0:40", text: ["the chorus —", "the part that sells it"], chorus: true },
];

export function SongTimeline() {
  const i = sceneIndex("problem");
  const t = usePlayhead(i, i + 1);
  const p = seg(t, i, i + 1);
  const show = seg(t, i - 0.3, i + 0.05) * (1 - seg(t, i + 0.92, i + 1.08));
  if (show <= 0) return null;
  // the playhead crawls through the intro over most of the scene
  const at = Math.min(SONG_S, (seg(p, 0.05, 0.72) * (CHORUS_S + 6)));
  // then the jump: the intro dims and "hooked. starts here" lands on the chorus
  const jump = seg(p, 0.76, 0.9);
  const W = 600;
  const x = (s: number) => 20 + (s / SONG_S) * (W - 40);
  return (
    <div className="song-timeline" style={{ opacity: show }} aria-hidden="true">
      <svg viewBox={`0 0 ${W} 360`} preserveAspectRatio="xMidYMid meet">
        {heights.map((h, k) => {
          const s = (k / BARS) * SONG_S;
          const heard = s <= at;
          const chorus = s >= CHORUS_S;
          const dimmed = !chorus && jump > 0;
          return (
            <rect
              key={k}
              x={x(s) + 0.6}
              y={200 - h * 120}
              width={(W - 40) / BARS - 1.6}
              height={h * 240}
              rx={1.4}
              className={`bar${chorus ? " chorus" : ""}${heard ? " heard" : ""}`}
              style={dimmed ? { opacity: 1 - jump * 0.72 } : undefined}
            />
          );
        })}
        {/* the playhead */}
        <line x1={x(at)} x2={x(at)} y1={50} y2={350} className="head" style={{ opacity: 1 - jump }} />
        {MARKS.map((m, k) => {
          const shown = seg(at, m.s, m.s + 1.2);
          if (shown <= 0) return null;
          const up = k % 2 === 0;
          return (
            <g key={m.s} style={{ opacity: shown * (m.chorus ? 1 : 1 - jump) }}>
              <line x1={x(m.s)} x2={x(m.s)} y1={up ? 40 : 330} y2={200} className="mark" />
              <text x={x(m.s) + 8} y={up ? 44 : 322} className={`big${m.chorus ? " pink" : ""}`}>
                {m.big}
              </text>
              {m.text.map((line, j) => (
                <text key={j} x={x(m.s) + 8} y={(up ? 64 : 342) + j * 17} className="small">
                  {line}
                </text>
              ))}
            </g>
          );
        })}
        {/* the jump: straight to the chorus */}
        {jump > 0 && (
          <g style={{ opacity: jump }}>
            <path
              d={`M ${x(0)} 336 Q ${x(20)} ${336 - 60 * jump} ${x(0) + (x(CHORUS_S) - x(0)) * jump} 330`}
              className="leap"
            />
            <text x={x(CHORUS_S) - 10} y={352} className="start" textAnchor="end">
              hooked. starts here
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}

/* ---------------------------------------------------------------- the wheel */

export function StageWheel() {
  const i = sceneIndex("mood");
  const t = usePlayhead(i, i + 1);
  const p = seg(t, i, i + 1);
  const show = seg(t, i - 0.05, i + 0.15) * (1 - seg(t, i + 0.85, i + 0.98));
  // each face in turn, the way a thumb would sweep round
  const lit = show > 0 ? Math.min(MOODS.length - 1, Math.floor(seg(p, 0.18, 0.86) * MOODS.length)) : -1;
  const litMood = lit >= 0 ? MOODS[lit] : null;
  useEffect(() => {
    film.preview = show > 0.2 && litMood ? litMood.accent : null;
  }, [show, litMood]);
  if (show <= 0) return null;
  const open = seg(p, 0.02, 0.16);
  const R_IN = 138;
  const R_OUT = 262;
  const thumb = litMood ? wedgePoint(lit, 64 * seg(p, 0.14, 0.2)) : { x: 0, y: 0 };
  return (
    <div className="stage-wheel" style={{ opacity: show }} aria-hidden="true">
      <svg viewBox="-300 -300 600 600" style={{ transform: `scale(${0.6 + 0.4 * open}) rotate(${(1 - open) * -24}deg)` }}>
        <circle r={R_OUT + 4} className="rim" />
        {MOODS.map((m, k) => {
          const on = k === lit;
          const pop = on ? wedgePoint(k, 10) : { x: 0, y: 0 };
          const c = wedgePoint(k, (R_IN + R_OUT) / 2);
          return (
            <g key={m.id} transform={`translate(${pop.x} ${pop.y})`} style={{ ["--face" as string]: m.accent }}>
              <path d={wedgePath(k, R_IN, R_OUT, 1)} className={`wedge${on ? " on" : ""}`} />
              <foreignObject x={c.x - 22} y={c.y - 30} width={44} height={44} className={`face${on ? " on" : ""}`}>
                <Face mood={m.id} size={40} />
              </foreignObject>
              <text x={c.x} y={c.y + 34} className={`name${on ? " on" : ""}`}>
                {m.label}
              </text>
            </g>
          );
        })}
        {/* the thumb, pushing toward the face it picks */}
        <circle cx={thumb.x} cy={thumb.y} r={22} className="thumb" />
      </svg>
      {litMood && (
        <p className="stage-wheel-label" style={{ color: litMood.accent }}>
          {litMood.label}
          <small>{litMood.line}</small>
        </p>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- the app */

const CLIPS = [
  { scene: "skip", name: "gesture-skip", label: "swipe up to skip, in the app" },
  { scene: "save", name: "gesture-save", label: "swipe down to save, in the app" },
  { scene: "more", name: "gesture-more", label: "swipe right for more like this, in the app" },
  { scene: "never", name: "gesture-never", label: "swipe left for never, in the app" },
] as const;

/** The real app beside the record, showing the same gesture. Wide stages only. */
export function StagePhone() {
  const t = usePlayhead(1.8, 6.1);
  const shown = phoneShown(t);
  const current = Math.floor(t);
  const refs = useRef<(HTMLVideoElement | null)[]>([]);
  useEffect(() => {
    CLIPS.forEach((c, k) => {
      const v = refs.current[k];
      if (!v) return;
      const on = shown > 0 && sceneIndex(c.scene) === current;
      if (on && v.paused) {
        v.currentTime = 0;
        void v.play().catch(() => {});
      } else if (!on && !v.paused) v.pause();
    });
  }, [current, shown]);
  return (
    <div className="stage-phone" style={{ opacity: shown, visibility: shown > 0 ? "visible" : "hidden" }}>
      {CLIPS.map((c, k) => (
        <video
          key={c.name}
          ref={(el) => {
            refs.current[k] = el;
          }}
          muted
          loop
          playsInline
          preload="metadata"
          poster={`/media/${c.name}.jpg`}
          aria-label={c.label}
          style={{ opacity: sceneIndex(c.scene) === current ? 1 : 0 }}
        >
          <source src={`/media/${c.name}.webm`} type="video/webm" />
          <source src={`/media/${c.name}.mp4`} type="video/mp4" />
        </video>
      ))}
      <span className="stage-phone-cap">in the app</span>
    </div>
  );
}

/** The hero's phone: the deck, looping, beside the turntable. */
export function HeroPhone() {
  const t = usePlayhead(0, 1);
  const shown = 1 - seg(t, 0.45, 0.75);
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (shown > 0 && v.paused) void v.play().catch(() => {});
    if (shown <= 0 && !v.paused) v.pause();
  }, [shown]);
  return (
    <div className="hero-phone" style={{ opacity: shown, visibility: shown > 0 ? "visible" : "hidden" }}>
      <video ref={ref} muted loop playsInline autoPlay preload="metadata" poster="/media/hero-deck.jpg" aria-label="the hooked. deck: swiping through songs">
        <source src="/media/hero-deck.webm" type="video/webm" />
        <source src="/media/hero-deck.mp4" type="video/mp4" />
      </video>
    </div>
  );
}
