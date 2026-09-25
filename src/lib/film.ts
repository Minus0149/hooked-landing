/**
 * Where the reader is in the story.
 *
 * The page is one film: a column of scenes on one side, a pinned stage on the
 * other. The stage (a three.js frame loop) and its HTML overlays read this
 * every frame instead of going through React, so scrolling never re-renders
 * the page — it just moves the playhead.
 *
 *   t = scene index + progress through that scene (0..1)
 *
 * so t = 2.5 is halfway through scene 2. Scenes are listed once, here, and
 * both the copy column and the stage key off the same ids.
 */
export const SCENES = [
  { id: "needle", label: "needle drop" },
  { id: "problem", label: "the problem" },
  { id: "skip", label: "up" },
  { id: "save", label: "down" },
  { id: "more", label: "right" },
  { id: "never", label: "left" },
  { id: "mood", label: "hold" },
  { id: "archive", label: "your archive" },
  { id: "faq", label: "questions" },
  { id: "join", label: "the beta" },
] as const;

export type SceneId = (typeof SCENES)[number]["id"];
export const sceneIndex = (id: SceneId) => SCENES.findIndex((s) => s.id === id);

type Film = {
  /** the continuous playhead, see above */
  t: number;
  /** a mood being previewed on stage (the wheel scene), as an accent hex */
  preview: string | null;
};

export const film: Film = { t: 0, preview: null };

const listeners = new Set<(t: number) => void>();
export function onFilm(fn: (t: number) => void) {
  listeners.add(fn);
  fn(film.t);
  return () => {
    listeners.delete(fn);
  };
}
export function setFilm(t: number) {
  if (Math.abs(t - film.t) < 1e-4) return;
  film.t = t;
  listeners.forEach((fn) => fn(t));
}

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
/** progress of t through [a, b], clamped */
export const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
/** ease-in-out, for poses that should settle rather than stop */
export const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

/**
 * The playhead from where each scene block sits on screen.
 *
 * A scene is "on" while the anchor line (the middle of the viewport, or the
 * middle of the copy half on a phone) is inside its block; progress is how far
 * the line has travelled through it. Pure, so it's tested without a browser.
 */
export function playhead(blocks: { top: number; height: number }[], anchor: number): number {
  if (blocks.length === 0) return 0;
  if (anchor < blocks[0].top) return 0;
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if (anchor < b.top + b.height) return i + clamp01((anchor - b.top) / Math.max(1, b.height));
  }
  return blocks.length - 1 + 1 - 1e-6;
}
