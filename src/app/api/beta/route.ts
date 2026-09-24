import { promises as fs } from "node:fs";
import path from "node:path";
import type { NextRequest } from "next/server";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import { betaSink } from "@/config/backend";
import { validateDetails, validateSignup, type Stage } from "@/data/beta";

// fs + a long-lived rate-limit map both need the node runtime
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 8 * 1024;
// a bot fills a form in milliseconds. step one is one field, step two a few
// taps — both floors sit well under what a person needs
const MIN_FILL_MS: Record<Stage, number> = { signup: 1_500, details: 1_200 };
const DATA_DIR = process.env.BETA_DATA_DIR ?? path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "beta-signups.jsonl");

async function alreadySignedUp(email: string) {
  if (!process.env.BETA_LOCAL_FILE) return false; // the backend owns dedupe
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
  // BETA_LOCAL_FILE=1 keeps signups in a local JSONL instead (dev, or a VPS
  // with no backend); otherwise they go to the app's backend.
  if (!process.env.BETA_LOCAL_FILE) {
    const webhook = betaSink(process.env);
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
  const stage: Stage = body.stage === "details" ? "details" : "signup";
  const honeypot = typeof body.website === "string" ? body.website.trim() : "";
  const startedAt = typeof body.startedAt === "number" ? body.startedAt : 0;
  const elapsed = startedAt > 0 ? Date.now() - startedAt : Infinity;
  if (honeypot || (elapsed >= 0 && elapsed < MIN_FILL_MS[stage])) {
    return json({ ok: true }, 200);
  }

  const userAgent = (request.headers.get("user-agent") ?? "").slice(0, 200);
  let record: Record<string, unknown>;
  if (stage === "details") {
    // Step two, for someone already on the list: the same email with the
    // extra answers. The backend fills in whichever of those fields are still
    // empty on a pending request and never overwrites or touches a decision.
    const { data, errors } = validateDetails(body);
    if (Object.keys(errors).length) {
      return json({ ok: false, errors, message: errors.details ?? "a couple of things need fixing." }, 400);
    }
    const { data: who } = validateSignup({ email: data.email, name: body.name });
    record = { stage, name: who.name, ...data, submittedAt: new Date().toISOString(), userAgent };
  } else {
    const { data, errors } = validateSignup(body);
    if (Object.keys(errors).length) {
      return json({ ok: false, errors, message: "a couple of things need fixing." }, 400);
    }
    // a repeat is not an error: they are on the list either way
    if (await alreadySignedUp(data.email)) return json({ ok: true, duplicate: true }, 200);
    record = { stage, ...data, submittedAt: new Date().toISOString(), userAgent };
  }

  try {
    await store(record);
  } catch (err) {
    console.error("[beta] could not store signup:", err);
    return json(
      { ok: false, message: "our end broke, not yours. try again in a minute." },
      500,
    );
  }

  return json({ ok: true }, 200);
}
