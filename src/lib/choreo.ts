/**
 * The choreography: where everything on the stage is at playhead t.
 *
 * Pure numbers, no three.js — the stage copies these onto meshes every frame,
 * and tests/choreo.test.mjs checks the story reads right (the record is on the
 * deck at the start, flies out of frame on "up", ends inside the sleeve on
 * "down", and is back on the deck for the finale).
 *
 * Scene indices match SCENES in film.ts:
 *   0 needle   the deck, needle drops           5 never    the record greys and is thrown out
 *   1 problem  deck sinks, record hangs back     6 mood     small record, the wheel around it
 *   2 skip     record flies up, next rises       7 archive  sleeves file into a crate
 *   3 save     sleeve rises, record slides in    8 faq      the deck returns, record lands
 *   4 more     four like it fan out to the right 9 join     playing
 */
import type { Sfx } from "./sfx";

// (the same helpers as film.ts, kept local so node's test runner can load
// this file on its own)
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

export type Pose = {
  x: number;
  y: number;
  z: number;
  /** tilt: 0 = lying flat on the deck, 1 = standing up facing the camera */
  up: number;
  /** roll in the picture plane, radians */
  roll: number;
  scale: number;
  opacity: number;
  /** 0 = its colour, 1 = drained to grey ("never") */
  grey: number;
  /** which label the record wears — a new song gets a new colour */
  label: number;
};

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const mix = (a: Pose, b: Pose, k: number): Pose => ({
  x: lerp(a.x, b.x, k),
  y: lerp(a.y, b.y, k),
  z: lerp(a.z, b.z, k),
  up: lerp(a.up, b.up, k),
  roll: lerp(a.roll, b.roll, k),
  scale: lerp(a.scale, b.scale, k),
  opacity: lerp(a.opacity, b.opacity, k),
  grey: lerp(a.grey, b.grey, k),
  label: k < 0.5 ? a.label : b.label,
});

/** the record lying on the platter */
const ON_DECK: Pose = { x: 0, y: -0.39, z: 0, up: 0, roll: 0, scale: 1, opacity: 1, grey: 0, label: 0 };
/** standing, facing the reader, centre stage */
const CENTRE = (label: number, x = 0): Pose => ({
  x, y: 0.15, z: 0.6, up: 1, roll: 0, scale: 0.78, opacity: 1, grey: 0, label,
});
/** waiting out of frame below, to rise in as the next song */
const BELOW = (label: number, x = 0): Pose => ({ ...CENTRE(label, x), y: -7.5 });

export function recordPose(t: number): Pose {
  // 0 → 1: on the deck, then lifted as the deck sinks
  if (t < 0.7) return ON_DECK;
  if (t < 1.3) {
    // the song lifts off the platter and hangs back, small, over the problem
    return mix(ON_DECK, HANG, ease(seg(t, 0.7, 1.3)));
  }
  if (t < 1.8) return HANG;
  if (t < 2.15) {
    return mix(HANG, CENTRE(0), ease(seg(t, 1.8, 2.15)));
  }
  // 2 skip: up, and it's gone — then the next song rises
  if (t < 2.45) return CENTRE(0);
  if (t < 2.74) {
    const k = seg(t, 2.45, 2.74);
    return { ...CENTRE(0), y: lerp(0.15, 8, k * k), roll: -1.4 * k, scale: lerp(0.78, 0.6, k) };
  }
  if (t < 2.98) return mix(BELOW(1), CENTRE(1), ease(seg(t, 2.74, 2.98)));
  // 3 save: the sleeve comes up to meet it, it slides in, both drop away
  if (t < 3.42) return { ...CENTRE(1), y: 0.9 };
  if (t < 3.72) return mix({ ...CENTRE(1), y: 0.9 }, { ...CENTRE(1), y: SLEEVE_Y }, ease(seg(t, 3.42, 3.72)));
  if (t < 3.98) return { ...CENTRE(1), y: SLEEVE_Y + lerp(0, -9, ease(seg(t, 3.78, 3.98))) };
  // 4 more: a new one rises, four like it fan out beside it
  if (t < 4.14) return mix(BELOW(2, MORE_X), CENTRE(2, MORE_X), ease(seg(t, 3.98, 4.14)));
  if (t < 4.86) return CENTRE(2, MORE_X);
  if (t < 5.0) return mix(CENTRE(2, MORE_X), { ...CENTRE(2, MORE_X), opacity: 0, y: -1.5 }, seg(t, 4.86, 5.0));
  // 5 never: a new one rises, drains to grey, is thrown out left
  if (t < 5.14) return mix(BELOW(3), CENTRE(3), ease(seg(t, 5.0, 5.14)));
  if (t < 5.38) return CENTRE(3);
  if (t < 5.6) return { ...CENTRE(3), grey: seg(t, 5.38, 5.6) };
  if (t < 5.86) {
    const k = seg(t, 5.6, 5.86);
    return { ...CENTRE(3), grey: 1, x: lerp(0, -9, k * k), roll: 1.1 * k, opacity: 1 - k * 0.6 };
  }
  // 6 mood: small, dead centre, so the wheel can ring it
  if (t < 6.12) return mix(BELOW(4), MOOD_POSE, ease(seg(t, 5.9, 6.12)));
  if (t < 6.9) return MOOD_POSE;
  // 7 archive: it joins the crate — the last sleeve in the row
  if (t < 7.1) return mix(MOOD_POSE, { ...CENTRE(4), y: 2.6, scale: 0.42 }, ease(seg(t, 6.9, 7.1)));
  if (t < 7.62) return { ...CENTRE(4), y: 2.6, scale: 0.42 };
  if (t < 7.9) {
    return mix({ ...CENTRE(4), y: 2.6, scale: 0.42 }, { ...CRATE_SLOT, scale: 0.42, label: 4 }, ease(seg(t, 7.62, 7.9)));
  }
  if (t < 8.2) return { ...CRATE_SLOT, scale: 0.42, label: 4, opacity: lerp(1, 0, seg(t, 7.9, 8.2)) };
  // 8 → 9: back on the deck it all started on
  if (t < 8.35) return { ...ON_DECK, y: 4, opacity: 0, label: 0 };
  if (t < 8.75) return mix({ ...ON_DECK, y: 4, up: 0.4, opacity: 0 }, ON_DECK, ease(seg(t, 8.35, 8.75)));
  return ON_DECK;
}

export const SLEEVE_Y = -1.05;
/** over the problem the song hangs back, small and dim, behind the timeline */
const HANG: Pose = { x: 0, y: 1.6, z: -4, up: 1, roll: 0, scale: 0.45, opacity: 0.16, grey: 0, label: 0 };
const MORE_X = -1.6;
const MOOD_POSE: Pose = { ...CENTRE(4), scale: 0.44 };
const CRATE_SLOT: Pose = { x: 1.55, y: -0.55, z: 0.25, up: 1, roll: 0, scale: 0.42, opacity: 1, grey: 0, label: 4 };

/** the turntable: its height (0 = in place, negative = sunk out of frame) */
export function deckY(t: number): number {
  if (t < 0.55) return -0.6;
  if (t < 1.4) return lerp(-0.6, -9, ease(seg(t, 0.55, 1.4)));
  if (t < 8.0) return -9;
  if (t < 8.5) return lerp(-9, -0.6, ease(seg(t, 8.0, 8.5)));
  return -0.6;
}

/** how far the needle has dropped, 0..1 */
export function needle(t: number, age: number): number {
  const intro = seg(age, 0.6, 1.8);
  if (t < 1) return intro * (1 - seg(t, 0.55, 0.8));
  return seg(t, 8.6, 8.95);
}

/** the sleeve that swallows the record on "down" */
export function sleeveY(t: number): number {
  if (t < 3.05) return -9;
  if (t < 3.38) return lerp(-9, SLEEVE_Y, ease(seg(t, 3.05, 3.38)));
  if (t < 3.78) return SLEEVE_Y;
  if (t < 3.98) return lerp(SLEEVE_Y, SLEEVE_Y - 9, ease(seg(t, 3.78, 3.98)));
  return -20;
}

/** the "more like this" fan: clone k (0..3) — x offset from the record and opacity */
export function fan(t: number, k: number): { x: number; opacity: number } {
  const out = ease(seg(t, 4.3 + k * 0.05, 4.62 + k * 0.05));
  const gone = seg(t, 4.86, 5.0);
  return { x: MORE_X + out * (1.05 * (k + 1)), opacity: out * (1 - gone) * (1 - k * 0.14) };
}

/** the crate of kept records: how many sleeves have filed in, and the crate's own fade */
export function archive(t: number): { filed: number; opacity: number; y: number } {
  const inn = ease(seg(t, 6.95, 7.15));
  const out = ease(seg(t, 7.95, 8.2));
  return {
    filed: seg(t, 7.1, 7.6) * ARCHIVE_SLEEVES,
    opacity: inn * (1 - out),
    y: lerp(-6, -0.9, inn) + lerp(0, -6, out),
  };
}
export const ARCHIVE_SLEEVES = 9;

/**
 * Camera blend: 1 = looking down at the deck (hero, finale), 0 = straight on
 * at a standing record (the gesture scenes).
 */
export function deckView(t: number): number {
  if (t < 0.7) return 1;
  if (t < 1.4) return 1 - ease(seg(t, 0.7, 1.4));
  if (t < 8.0) return 0;
  if (t < 8.5) return ease(seg(t, 8.0, 8.5));
  return 1;
}

/** the app clip beside the record: shown through the four gesture scenes */
export function phoneShown(t: number): number {
  // off again before the wheel: that scene is centred on the record
  return seg(t, 2.0, 2.2) * (1 - seg(t, 5.8, 5.95));
}

/** the sound of each gesture, where it happens */
export const CUES: { at: number; sfx: Sfx }[] = [
  { at: 2.48, sfx: "skip" },
  { at: 3.64, sfx: "save" },
  { at: 4.34, sfx: "more" },
  { at: 5.62, sfx: "never" },
  { at: 6.1, sfx: "bloom" },
  { at: 7.84, sfx: "tick" },
];
