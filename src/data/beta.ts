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

export type BetaSubmission = {
  name: string;
  email: string;
  device: string;
  androidVersion: string;
  listensOn: string[];
  genres: string[];
  hours: string;
  lastSkipped: string;
  notes: string;
  consent: boolean;
};
