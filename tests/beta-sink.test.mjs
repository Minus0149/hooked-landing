// node --experimental-strip-types --test tests/beta-sink.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { BETA_SINK_URL, betaSink } from "../src/config/backend.ts";

// Signups used to follow a host variable that still pointed at a dead backend.

test("signups go to the app's cloud backend by default", () => {
  assert.match(BETA_SINK_URL, /^https:\/\/[a-z0-9-]+\.convex\.site\/beta$/);
  assert.equal(betaSink({}), BETA_SINK_URL);
});

test("a stale BETA_WEBHOOK_URL on the host no longer wins", () => {
  assert.equal(betaSink({ BETA_WEBHOOK_URL: "https://cnx.hookedcue.com/beta" }), BETA_SINK_URL);
});

test("BETA_SINK_URL can send them elsewhere, but only over https", () => {
  assert.equal(betaSink({ BETA_SINK_URL: "https://hooks.example.com/x" }), "https://hooks.example.com/x");
  assert.equal(betaSink({ BETA_SINK_URL: "http://insecure.example.com" }), BETA_SINK_URL);
});
