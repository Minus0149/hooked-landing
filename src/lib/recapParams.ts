/**
 * The "week in hooks" story image is drawn from query parameters the app puts
 * in the link (web/src/lib/growth.ts recapStoryUrl). They come from anyone's
 * browser, so everything is clamped and allow-listed here: numbers are bounded,
 * moods must be real moods, and text is trimmed and length-limited. No
 * account, id or email ever travels in the link.
 */

export const RECAP_MOODS = ["hyped", "party", "sunny", "chill", "tender", "sleepy"] as const;
export type RecapMood = (typeof RECAP_MOODS)[number];

export type RecapImageParams = {
  name: string | null;
  cards: number;
  saves: number;
  newArtists: number;
  saveRatePct: number;
  moods: RecapMood[];
  topArtist: string | null;
  weekOf: string | null;
};

const int = (v: string | null, max: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(Math.max(Math.round(n), 0), max) : 0;
};

const text = (v: string | null, max: number) => {
  if (!v) return null;
  // printable characters only, no angle brackets; collapse whitespace
  const clean = v.replace(/[\u0000-\u001f<>]/g, "").replace(/\s+/g, " ").trim().slice(0, max);
  return clean || null;
};

export function parseRecapParams(q: URLSearchParams): RecapImageParams {
  const moods = (q.get("m") ?? "")
    .split(",")
    .map((m) => m.trim().toLowerCase())
    .filter((m): m is RecapMood => (RECAP_MOODS as readonly string[]).includes(m));
  const week = q.get("w");
  return {
    name: text(q.get("n"), 20),
    cards: int(q.get("c"), 99_999),
    saves: int(q.get("s"), 99_999),
    newArtists: int(q.get("a"), 9_999),
    saveRatePct: int(q.get("r"), 100),
    moods: [...new Set(moods)].slice(0, 3),
    topArtist: text(q.get("t"), 40),
    weekOf: week && /^\d{4}-\d{2}-\d{2}$/.test(week) ? week : null,
  };
}

/** Bars for the drawn waveform: deterministic per seed, so a song always looks the same. */
export function waveBars(seed: string, count: number): number[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    const r = ((h ^ (h >>> 16)) >>> 0) / 4294967296;
    out.push(0.25 + r * 0.75);
  }
  return out;
}
