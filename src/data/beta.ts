// shared by the form and the api route so client and server validate
// against exactly the same lists — no drift, no "valid here / rejected there"

export const LISTENS_ON = [
  "spotify",
  "apple music",
  "youtube music",
  "jiosaavn",
  "soundcloud",
  "something else",
] as const;

export const GENRES = [
  "afrobeats",
  "psych pop",
  "bollywood",
  "house",
  "soul",
  "reggaeton",
  "indie folk",
  "k-pop",
  "hip hop",
  "classic rock",
  "punjabi",
  "electronic",
] as const;

export const ANDROID_VERSIONS = [
  "android 16",
  "android 15",
  "android 14",
  "android 13",
  "android 12 or older",
  "not sure",
] as const;

export const HOURS = [
  "under an hour",
  "1 to 3 hours",
  "3 to 5 hours",
  "basically always",
] as const;

export const LIMITS = {
  name: 60,
  email: 200,
  device: 80,
  lastSkipped: 120,
  notes: 500,
  genres: 8,
  listensOn: 6,
} as const;

// deliberately loose: the goal is to reject obvious junk, not to police
// the RFC. anything weirder gets caught when the invite email bounces.
export const EMAIL_RE = /^[^\s@,;:<>()[\]\\]+@[^\s@.,;:<>()[\]\\]+(\.[^\s@.,;:<>()[\]\\]+)+$/;

/* ------------------------------------------------------------------------
   The signup is two steps, validated here for both the form and the route.

   1. signup  — the Google account email (a name is optional). Submitting it is
                a complete signup: that address is all Play closed testing needs.
   2. details — optional, after they're already on the list: phone, android
                version, how they listen. Nobody has to fill it to get in.
   ------------------------------------------------------------------------ */

export type Stage = "signup" | "details";
export type Errors = Record<string, string>;

export type Signup = { name: string; email: string; consent: true };
export type Details = {
  email: string;
  device: string;
  androidVersion: string;
  listensOn: string[];
  genres: string[];
  hours: string;
  lastSkipped: string;
  notes: string;
};

export const clean = (v: unknown, max: number) =>
  typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "";

export function pickMany(v: unknown, allowed: readonly string[], max: number): string[] {
  if (!Array.isArray(v)) return [];
  const seen = new Set<string>();
  for (const item of v) {
    if (typeof item !== "string") continue;
    const val = item.trim().toLowerCase();
    if (allowed.includes(val)) seen.add(val);
    if (seen.size >= max) break;
  }
  return [...seen];
}

export function pickOne(v: unknown, allowed: readonly string[]): string {
  const val = typeof v === "string" ? v.trim().toLowerCase() : "";
  return allowed.includes(val) ? val : "";
}

/**
 * What to call someone who left the name blank. The backend's queue needs a
 * name, and the local part of their address is the honest stand-in:
 * "sam.k.2004@gmail.com" reads as "sam k 2004" in the admin list.
 */
export function nameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "";
  const words = local.replace(/[^\p{L}\p{N}]+/gu, " ").trim().slice(0, LIMITS.name);
  return words.length >= 2 ? words : "beta tester";
}

/** Step one: an address that looks real. The name is optional. */
export function validateSignup(body: Record<string, unknown>): { data: Signup; errors: Errors } {
  const errors: Errors = {};
  const email = clean(body.email, LIMITS.email).toLowerCase();
  if (!email) errors.email = "an email, please — that's how the invite arrives";
  else if (!EMAIL_RE.test(email)) errors.email = "that address doesn't look right";
  const typed = clean(body.name, LIMITS.name);
  if (typed.length === 1) errors.name = "a little more than one letter?";
  const name = typed.length >= 2 ? typed : nameFromEmail(email);
  return { data: { name, email, consent: true }, errors };
}

/** Step two: everything optional, but it has to be about someone on the list. */
export function validateDetails(body: Record<string, unknown>): { data: Details; errors: Errors } {
  const errors: Errors = {};
  const email = clean(body.email, LIMITS.email).toLowerCase();
  if (!EMAIL_RE.test(email)) errors.email = "that address doesn't look right";
  const data: Details = {
    email,
    device: clean(body.device, LIMITS.device),
    androidVersion: pickOne(body.androidVersion, ANDROID_VERSIONS),
    listensOn: pickMany(body.listensOn, LISTENS_ON, LIMITS.listensOn),
    genres: pickMany(body.genres, GENRES, LIMITS.genres),
    hours: pickOne(body.hours, HOURS),
    lastSkipped: clean(body.lastSkipped, LIMITS.lastSkipped),
    notes: clean(body.notes, LIMITS.notes),
  };
  if (!hasDetails(data)) errors.details = "nothing to send yet — pick something, or skip it";
  return { data, errors };
}

/** True when step two carries at least one answer worth sending. */
export function hasDetails(d: Omit<Details, "email">): boolean {
  return Boolean(
    d.device || d.androidVersion || d.hours || d.lastSkipped || d.notes ||
      d.listensOn.length || d.genres.length,
  );
}

/** A multi-pick chip: tap to add, tap again to remove, never past `max`. */
export function toggleChip(list: readonly string[], value: string, max: number): string[] {
  if (list.includes(value)) return list.filter((v) => v !== value);
  return list.length < max ? [...list, value] : [...list];
}
