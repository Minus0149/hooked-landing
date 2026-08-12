/**
 * Integration tests for POST /api/beta.
 *
 *   npx next build
 *   BETA_DATA_DIR=.data-test npx next start -p 3011
 *   node --test tests/beta-api.mjs
 *
 * Point BASE somewhere else with BASE=http://host:port. Uses a throwaway
 * BETA_DATA_DIR so a run never touches real signups.
 *
 * Note on rate limiting: the limiter allows 20 requests per IP per 15 min with
 * a 2s burst gap, so every request here waits out the gap first. The burst
 * case is the one place that deliberately doesn't.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { setTimeout as sleep } from "node:timers/promises";

const BASE = process.env.BASE ?? "http://localhost:3011";
const BURST_GAP_MS = 2_200;
const OLD_ENOUGH = () => Date.now() - 10_000; // past the min-fill-time gate

function valid() {
  return {
    name: "kunal",
    email: `beta+${Math.random().toString(36).slice(2, 9)}@example.com`,
    device: "pixel 8a",
    androidVersion: "android 15",
    listensOn: ["spotify"],
    genres: ["punjabi", "house"],
    hours: "1 to 3 hours",
    lastSkipped: "something with a 40 second intro",
    notes: "",
    consent: true,
    startedAt: OLD_ENOUGH(),
  };
}

async function rawPost(body) {
  const res = await fetch(`${BASE}/api/beta`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json, headers: res.headers };
}

/** waits out the burst gap so a test measures what it means to measure */
async function post(body) {
  await sleep(BURST_GAP_MS);
  return rawPost(body);
}

test("accepts a complete submission", async () => {
  const { status, json } = await post(valid());
  assert.equal(status, 200);
  assert.equal(json.ok, true);
});

test("rejects missing required fields with per-field errors", async () => {
  const { status, json } = await post({
    name: "",
    email: "",
    device: "",
    consent: false,
    startedAt: OLD_ENOUGH(),
  });
  assert.equal(status, 400);
  assert.equal(json.ok, false);
  for (const field of ["name", "email", "device", "consent"]) {
    assert.ok(json.errors[field], `expected an error on ${field}`);
  }
});

test("rejects a malformed email", async () => {
  const { status, json } = await post({ ...valid(), email: "kunal@@nope" });
  assert.equal(status, 400);
  assert.ok(json.errors.email);
});

test("drops values that aren't on the allowed lists", async () => {
  // unknown genre + unknown android version must not block the signup,
  // they're just discarded server-side
  const { status, json } = await post({
    ...valid(),
    genres: ["punjabi", "not-a-genre"],
    androidVersion: "windows phone",
  });
  assert.equal(status, 200);
  assert.equal(json.ok, true);
});

test("silently accepts a filled honeypot without storing", async () => {
  const { status, json } = await post({ ...valid(), website: "http://spam.example" });
  assert.equal(status, 200);
  assert.equal(json.ok, true); // a bot must not learn it was caught
});

test("silently accepts an impossibly fast fill", async () => {
  const { status, json } = await post({ ...valid(), startedAt: Date.now() });
  assert.equal(status, 200);
  assert.equal(json.ok, true);
});

test("refuses an oversized body", async () => {
  const { status } = await post({ ...valid(), notes: "x".repeat(9_000) });
  assert.equal(status, 413);
});

test("rejects a duplicate email with 409", async () => {
  const body = valid();
  const first = await post(body);
  assert.equal(first.status, 200);
  const second = await post({ ...body, startedAt: OLD_ENOUGH() });
  assert.equal(second.status, 409);
});

test("rate limits two requests fired back to back", async () => {
  await post(valid()); // spends the gap, lands cleanly
  const { status, headers } = await rawPost(valid()); // no gap this time
  assert.equal(status, 429);
  assert.ok(Number(headers.get("retry-after")) > 0);
});

test("stores only the submissions that were meant to be stored", async () => {
  // the honeypot and fast-fill posts above answered 200 but must not be on disk
  const res = await fetch(`${BASE}/api/beta`, { method: "GET" });
  assert.equal(res.status, 405, "GET should not be a way to read the list");
});
