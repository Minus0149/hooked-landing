/**
 * The film's sound effects — off until the reader turns sound on.
 *
 * Browsers won't play audio before a gesture, and a landing page that makes
 * noise uninvited gets closed. So everything is silent until the sound toggle
 * is pressed; from then on each gesture in the story is heard as it happens
 * (a whoosh as the record flies up, the drop into the sleeve…).
 */
export type Sfx = "skip" | "save" | "more" | "never" | "bloom" | "tick";

const FILES: Record<Sfx, string> = {
  skip: "/media/sfx/swipe-up.mp3",
  save: "/media/sfx/save-drop.mp3",
  more: "/media/sfx/tick.mp3",
  never: "/media/sfx/swipe-up.mp3",
  bloom: "/media/sfx/bloom.mp3",
  tick: "/media/sfx/tick.mp3",
};
const VOLUME: Record<Sfx, number> = { skip: 0.5, save: 0.6, more: 0.55, never: 0.4, bloom: 0.55, tick: 0.45 };

let enabled = false;
const listeners = new Set<() => void>();
const pool = new Map<string, HTMLAudioElement>();

export const soundOn = () => enabled;
export function onSound(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
export function setSound(on: boolean) {
  enabled = on;
  if (on) {
    // warm the pool inside the gesture, so later plays aren't blocked
    for (const src of new Set(Object.values(FILES))) {
      if (!pool.has(src)) {
        const a = new Audio(src);
        a.preload = "auto";
        pool.set(src, a);
      }
    }
  }
  listeners.forEach((fn) => fn());
}

export function play(name: Sfx) {
  if (!enabled || typeof window === "undefined") return;
  const src = FILES[name];
  const base = pool.get(src) ?? new Audio(src);
  const a = base.paused ? base : (base.cloneNode(true) as HTMLAudioElement);
  a.volume = VOLUME[name];
  a.currentTime = 0;
  void a.play().catch(() => {});
}

/**
 * Which effects a move of the playhead from `from` to `to` should fire: each
 * cue sounds once, going forward, as the story reaches it. Scrolling back up
 * past a cue is silent — nobody wants the whoosh in reverse.
 */
export function cuesCrossed(cues: { at: number; sfx: Sfx }[], from: number, to: number): Sfx[] {
  if (to <= from) return [];
  return cues.filter((c) => from < c.at && c.at <= to).map((c) => c.sfx);
}
