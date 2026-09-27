// node --experimental-strip-types --test tests/beta-hi.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { ANDROID_VERSIONS, GENRES, HOURS, LISTENS_ON, validateDetails, validateSignup } from "../src/data/beta.ts";
import { BETA_COPY, CHIP_LABELS_HI, SERVER_ERRORS_HI, betaText, chipLabel, serverError } from "../src/data/betaCopy.ts";

// The Hindi /hi page runs the same form. Every English line needs a Hindi one,
// with the same placeholders, and the values sent to the API never change.

const vars = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

test("every English line has a non-empty Hindi line with the same placeholders", () => {
  for (const [key, en] of Object.entries(BETA_COPY.en)) {
    const hi = BETA_COPY.hi[key];
    assert.ok(hi && hi.trim(), `missing Hindi for ${key}`);
    assert.deepEqual(vars(hi), vars(en), `placeholders differ for ${key}`);
  }
  assert.deepEqual(Object.keys(BETA_COPY.hi).sort(), Object.keys(BETA_COPY.en).sort());
});

test("placeholders are filled", () => {
  assert.equal(betaText("hi", "genresCount", { n: 2, max: 8 }), "8 में से 2");
  assert.equal(betaText("en", "genresCount", { n: 2, max: 8 }), "2 of 8");
});

test("chip labels only relabel real option values; English shows the value", () => {
  const all = new Set([...ANDROID_VERSIONS, ...GENRES, ...HOURS, ...LISTENS_ON]);
  for (const v of Object.keys(CHIP_LABELS_HI)) assert.ok(all.has(v), `${v} is not an option`);
  for (const v of all) assert.equal(chipLabel("en", v), v);
  assert.equal(chipLabel("hi", "not sure"), "पता नहीं");
  assert.equal(chipLabel("hi", "punjabi"), "punjabi");
});

test("every validation message the route can send has a Hindi version", () => {
  const messages = new Set();
  for (const body of [{}, { email: "nope" }, { email: "a@b.co", name: "x" }]) {
    for (const m of Object.values(validateSignup(body).errors)) messages.add(m);
  }
  for (const m of Object.values(validateDetails({ email: "bad" }).errors)) messages.add(m);
  for (const m of messages) {
    assert.ok(SERVER_ERRORS_HI[m], `no Hindi for "${m}"`);
    assert.equal(serverError("en", m), m);
  }
});
