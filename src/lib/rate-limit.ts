/**
 * Sliding-window rate limiter, in process memory.
 *
 * Honest about what this is: state lives in one server instance, so a
 * serverless deploy that scales to N instances effectively multiplies the
 * allowance by N, and a cold start resets it. For a beta signup form that is
 * fine — it stops the drive-by scripts, and the honeypot plus the duplicate
 * check in the route cover the rest. If this ever needs to be exact, swap
 * `hits` for a KV store; the call signature won't change.
 */

// Sized for the request, not the signup: a person who trips validation, fixes
// a typo and submits again is normal and must not be punished for it. Storage
// abuse is held back by the duplicate-email check and the global cap instead.
const WINDOW_MS = 15 * 60_000;
const MAX_PER_WINDOW = 20;
const BURST_MS = 2_000;
const MAX_KEYS = 5_000;
const SWEEP_EVERY_MS = 60_000;

// a floor under the whole route, so a botnet spread across many IPs can't
// fill the disk one "valid" signup at a time
const GLOBAL_WINDOW_MS = 60 * 60_000;
const GLOBAL_MAX = 300;

const hits = new Map<string, number[]>();
const globalHits: number[] = [];
let lastSweep = 0;

function sweep(now: number) {
  if (now - lastSweep < SWEEP_EVERY_MS) return;
  lastSweep = now;
  for (const [key, times] of hits) {
    const live = times.filter((t) => now - t < WINDOW_MS);
    if (live.length) hits.set(key, live);
    else hits.delete(key);
  }
}

function evictIfNeeded() {
  // Map iterates in insertion order, so the front is the least recently added
  while (hits.size > MAX_KEYS) {
    const oldest = hits.keys().next();
    if (oldest.done) break;
    hits.delete(oldest.value);
  }
}

export type RateVerdict =
  | { ok: true }
  | { ok: false; retryAfter: number; reason: "burst" | "window" | "global" };

export function checkRateLimit(key: string, now = Date.now()): RateVerdict {
  sweep(now);

  while (globalHits.length && now - globalHits[0] >= GLOBAL_WINDOW_MS) globalHits.shift();
  if (globalHits.length >= GLOBAL_MAX) {
    const retryAfter = Math.ceil((GLOBAL_WINDOW_MS - (now - globalHits[0])) / 1000);
    return { ok: false, retryAfter: Math.max(retryAfter, 1), reason: "global" };
  }

  const times = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);

  if (times.length && now - times[times.length - 1] < BURST_MS) {
    const retryAfter = Math.ceil((BURST_MS - (now - times[times.length - 1])) / 1000);
    hits.set(key, times);
    return { ok: false, retryAfter: Math.max(retryAfter, 1), reason: "burst" };
  }

  if (times.length >= MAX_PER_WINDOW) {
    const retryAfter = Math.ceil((WINDOW_MS - (now - times[0])) / 1000);
    hits.set(key, times);
    return { ok: false, retryAfter: Math.max(retryAfter, 1), reason: "window" };
  }

  times.push(now);
  hits.set(key, times);
  globalHits.push(now);
  evictIfNeeded();
  return { ok: true };
}

/** Cloudflare sits in front of this domain, so cf-connecting-ip is the trustworthy one. */
export function clientKey(headers: Headers): string {
  const cf = headers.get("cf-connecting-ip");
  if (cf) return cf.trim();
  const real = headers.get("x-real-ip");
  if (real) return real.trim();
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return "unknown";
}

/** test seam — not used by the route */
export function __resetRateLimit() {
  hits.clear();
  globalHits.length = 0;
  lastSweep = 0;
}
