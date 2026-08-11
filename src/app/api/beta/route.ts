import { promises as fs } from "node:fs";
import path from "node:path";
import type { NextRequest } from "next/server";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import {
  ANDROID_VERSIONS,
  EMAIL_RE,
  GENRES,
  HOURS,
  LIMITS,
  LISTENS_ON,
} from "@/data/beta";

// fs + a long-lived rate-limit map both need the node runtime
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 8 * 1024;
const MIN_FILL_MS = 2_500;
const DATA_DIR = process.env.BETA_DATA_DIR ?? path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "beta-signups.jsonl");

type Errors = Record<string, string>;

const clean = (v: unknown, max: number) =>
  typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "";

function pickMany(v: unknown, allowed: readonly string[], max: number) {
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

function pickOne(v: unknown, allowed: readonly string[]) {
  const val = typeof v === "string" ? v.trim().toLowerCase() : "";
  return allowed.includes(val) ? val : "";
}

function validate(body: Record<string, unknown>) {
  const errors: Errors = {};

  const name = clean(body.name, LIMITS.name);
  if (name.length < 2) errors.name = "we need something to call you";

  const email = clean(body.email, LIMITS.email).toLowerCase();
  if (!email) errors.email = "an email, please — that's how the invite arrives";
  else if (!EMAIL_RE.test(email)) errors.email = "that address doesn't look right";

  const device = clean(body.device, LIMITS.device);
  if (device.length < 2) errors.device = "which phone will you be testing on?";

  const consent = body.consent === true;
  if (!consent) errors.consent = "tick the box and you're in";

  const data = {
    name,
    email,
    device,
    androidVersion: pickOne(body.androidVersion, ANDROID_VERSIONS),
    listensOn: pickMany(body.listensOn, LISTENS_ON, LIMITS.listensOn),
    genres: pickMany(body.genres, GENRES, LIMITS.genres),
    hours: pickOne(body.hours, HOURS),
    lastSkipped: clean(body.lastSkipped, LIMITS.lastSkipped),
    notes: clean(body.notes, LIMITS.notes),
    consent,
  };

  return { data, errors };
}

async function alreadySignedUp(email: string) {
  if (process.env.BETA_WEBHOOK_URL) return false; // the sink owns dedupe
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    return raw
      .split("\n")
      .filter(Boolean)
      .some((line) => {
        try {
          return (JSON.parse(line) as { email?: string }).email === email;
        } catch {
          return false;
        }
      });
  } catch {
    return false; // no file yet
  }
}

async function store(record: Record<string, unknown>) {
  const webhook = process.env.BETA_WEBHOOK_URL;
  if (webhook) {
    const secret = process.env.BETA_WEBHOOK_SECRET;
    const res = await fetch(webhook, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        // the convex ingest route rejects anything without this
        ...(secret ? { "x-beta-secret": secret } : {}),
      },
      body: JSON.stringify(record),
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) throw new Error(`webhook responded ${res.status}`);
    return;
  }
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.appendFile(DATA_FILE, JSON.stringify(record) + "\n", "utf8");
}

const json = (body: unknown, status: number, headers?: HeadersInit) =>
  Response.json(body, { status, headers });

export async function POST(request: NextRequest) {
  const limit = checkRateLimit(clientKey(request.headers));
  if (!limit.ok) {
    return json(
      {
        ok: false,
        message:
          limit.reason === "burst"
            ? "easy — give it a few seconds."
            : "that's a lot of signups from one place. try again later.",
      },
      429,
      { "retry-after": String(limit.retryAfter) },
    );
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return json({ ok: false, message: "that's far too much text." }, 413);
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return json({ ok: false, message: "couldn't read that." }, 400);
  }

  // bot traps. both answer 200 so a script can't tell it was caught and
  // start probing for the shape that gets through.
  const honeypot = typeof body.website === "string" ? body.website.trim() : "";
  const startedAt = typeof body.startedAt === "number" ? body.startedAt : 0;
  const elapsed = startedAt > 0 ? Date.now() - startedAt : Infinity;
  if (honeypot || (elapsed >= 0 && elapsed < MIN_FILL_MS)) {
    return json({ ok: true }, 200);
  }

  const { data, errors } = validate(body);
  if (Object.keys(errors).length) {
    return json({ ok: false, errors, message: "a couple of things need fixing." }, 400);
  }

  if (await alreadySignedUp(data.email)) {
    return json(
      { ok: false, message: "you're already on the list. sit tight." },
      409,
    );
  }

  try {
    await store({
      ...data,
      submittedAt: new Date().toISOString(),
      userAgent: (request.headers.get("user-agent") ?? "").slice(0, 200),
    });
  } catch (err) {
    console.error("[beta] could not store signup:", err);
    return json(
      { ok: false, message: "our end broke, not yours. try again in a minute." },
      500,
    );
  }

  return json({ ok: true }, 200);
}
