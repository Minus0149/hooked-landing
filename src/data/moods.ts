/**
 * The app's six moods, for the landing page's hold ring.
 *
 * Copied from web/src/data/mood.ts (ids, labels, lines, accents, ring angles,
 * the push rule and each face's idle motion) — the landing is its own repo and
 * bundle. tests/moods-match.test.mjs checks them against the app whenever the
 * web repo is checked out beside this one, so the two can't drift.
 */
export type MoodId = "hyped" | "party" | "sunny" | "chill" | "tender" | "sleepy";

export interface Mood {
  id: MoodId;
  label: string;
  line: string;
  accent: string;
}

export const MOODS: Mood[] = [
  { id: "hyped", label: "Hyped", line: "shoulders back, volume up", accent: "#ff7a29" },
  { id: "party", label: "Party", line: "loud room, no thinking", accent: "#ff4d8d" },
  { id: "sunny", label: "Sunny", line: "good mood, keep it there", accent: "#ffd23f" },
  { id: "chill", label: "Chill", line: "easy, warm, in the background", accent: "#4fd1c5" },
  { id: "tender", label: "Tender", line: "the sad ones, on purpose", accent: "#8b7cff" },
  { id: "sleepy", label: "Sleepy", line: "lights off, volume down", accent: "#5b8def" },
];

export const moodById = (id: MoodId | null | undefined) => MOODS.find((m) => m.id === id) ?? null;

export const WHEEL_START_DEG = -90;
export const WHEEL_STEP_DEG = 360 / 6;

/** Where face `i` sits, in degrees, 0 = three o'clock, clockwise positive. */
export function wheelAngle(i: number): number {
  return WHEEL_START_DEG + i * WHEEL_STEP_DEG;
}

/** Which face a push from the press point is aiming at; null inside the dead zone. */
export function moodAtPush(dx: number, dy: number, deadZone: number): MoodId | null {
  if (Math.sqrt(dx * dx + dy * dy) < deadZone) return null;
  const deg = (Math.atan2(dy, dx) * 180) / Math.PI;
  const shifted = (deg - WHEEL_START_DEG + WHEEL_STEP_DEG / 2 + 720) % 360;
  const i = Math.floor(shifted / WHEEL_STEP_DEG) % MOODS.length;
  return MOODS[i].id;
}

/** Each face's idle loop in the ring — the same table the app plays. */
export const FACE_IDLE: Record<
  MoodId,
  { keyframes: Partial<Record<"x" | "y" | "rotate" | "scale", number[]>>; duration: number }
> = {
  hyped: { keyframes: { y: [0, -5, 0], scale: [1, 1.1, 1] }, duration: 0.7 },
  party: { keyframes: { rotate: [-12, 12, -12] }, duration: 0.9 },
  sunny: { keyframes: { rotate: [0, 9, 0, -9, 0], scale: [1, 1.07, 1, 1.07, 1] }, duration: 2.4 },
  chill: { keyframes: { x: [-2, 2, -2], rotate: [-4, 4, -4] }, duration: 3 },
  tender: { keyframes: { scale: [1, 0.9, 1], y: [0, 1.5, 0] }, duration: 2.6 },
  sleepy: { keyframes: { rotate: [0, -16, -16, 0], y: [0, 2, 2, 0] }, duration: 3.6 },
};
