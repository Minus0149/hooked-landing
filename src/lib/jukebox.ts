import HOOKS from "@/data/hooks.json";
import type { MoodId } from "@/data/moods";

export type Hook = {
  title: string;
  artist: string;
  artwork: string;
  previewUrl: string;
  accent: string;
  genre: string;
  /** hand-picked, two per face, so every face has something to play */
  mood: MoodId;
};

type State = {
  playing: boolean;
  index: number;
  track: Hook | null;
  /** the face last picked in a hold ring, if any */
  mood: MoodId | null;
};

/* module-level store so the R3F scene (non-React frame loop) and the DOM
   dock can share playback state without context plumbing */
const listeners = new Set<() => void>();
let state: State = { playing: false, index: -1, track: null, mood: null };
let audio: HTMLAudioElement | null = null;

function emit(next: Partial<State>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

let errorStreak = 0;

function ensureAudio() {
  if (!audio) {
    audio = new Audio();
    // the previews allow cross-origin reads (Access-Control-Allow-Origin: *),
    // which is what lets the stage's bars follow the actual sound
    audio.crossOrigin = "anonymous";
    audio.volume = 0.85;
    audio.addEventListener("playing", () => {
      errorStreak = 0;
    });
    audio.addEventListener("ended", () => next());
    audio.addEventListener("error", () => {
      // skip a dead preview, but never chain-skip through the whole catalog
      errorStreak += 1;
      if (errorStreak < (HOOKS as Hook[]).length) next();
      else emit({ playing: false });
    });
  }
  return audio;
}

/* ---- the sound's shape, for the equaliser wall on the stage ---- */
let ctx: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let bins: Uint8Array<ArrayBuffer> | null = null;

/** Route the player through an analyser. Called from a click, so audio may start. */
function listen() {
  if (typeof window === "undefined" || !audio) return;
  try {
    if (!ctx) {
      ctx = new AudioContext();
      const source = ctx.createMediaElementSource(audio);
      analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.78;
      source.connect(analyser);
      analyser.connect(ctx.destination);
      bins = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount));
    }
    if (ctx.state === "suspended") void ctx.resume();
  } catch {
    // no Web Audio: the music still plays, the bars just keep their idle wave
  }
}

/** The frequency bins right now, 0..255, or null when nothing is playing. */
export function spectrum(): Uint8Array | null {
  if (!state.playing || !analyser || !bins) return null;
  analyser.getByteFrequencyData(bins);
  return bins;
}

function playIndex(i: number) {
  const tracks = HOOKS as Hook[];
  const idx = ((i % tracks.length) + tracks.length) % tracks.length;
  const a = ensureAudio();
  listen();
  a.src = tracks[idx].previewUrl;
  a.play().catch(() => emit({ playing: false }));
  emit({ playing: true, index: idx, track: tracks[idx] });
}

export function toggle() {
  if (state.playing) {
    audio?.pause();
    emit({ playing: false });
  } else if (state.index >= 0) {
    ensureAudio().play().catch(() => undefined);
    listen();
    emit({ playing: true });
  } else {
    playIndex(Math.floor(Math.random() * (HOOKS as Hook[]).length));
  }
}

/**
 * Play a hook for a face picked in a hold ring. Alternates between that mood's
 * tracks, so picking the same face twice doesn't replay the same song.
 */
export function playMood(mood: MoodId) {
  const tracks = HOOKS as Hook[];
  const matching = tracks.map((t, i) => ({ t, i })).filter(({ t }) => t.mood === mood);
  if (matching.length === 0) return;
  const current = matching.findIndex(({ i }) => i === state.index);
  const pick = matching[(current + 1) % matching.length];
  emit({ mood });
  playIndex(pick.i);
}

export function next() {
  playIndex(state.index < 0 ? 0 : state.index + 1);
}

export function getState() {
  return state;
}

export function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
