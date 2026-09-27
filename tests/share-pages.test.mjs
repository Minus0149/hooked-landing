import { test } from "node:test";
import assert from "node:assert/strict";
import { parseRecapParams, waveBars } from "../src/lib/recapParams.ts";
import { inviteCode } from "../src/lib/inviteCode.ts";

// The recap story image is drawn from whatever query string arrives, so the
// parser is the only thing between a crafted link and a picture with our name
// on it: bounded numbers, real moods only, short plain text.
test("recap image params are clamped and allow-listed", () => {
  const p = parseRecapParams(
    new URLSearchParams(
      "n=<b>Minus</b>&c=214&s=-4&a=abc&r=250&m=party,CHILL,evil,party,sunny,sleepy&t=AP%20Dhillon&w=2026-09-27",
    ),
  );
  assert.equal(p.name, "bMinus/b");
  assert.equal(p.cards, 214);
  assert.equal(p.saves, 0);
  assert.equal(p.newArtists, 0);
  assert.equal(p.saveRatePct, 100);
  assert.deepEqual(p.moods, ["party", "chill", "sunny"]);
  assert.equal(p.topArtist, "AP Dhillon");
  assert.equal(p.weekOf, "2026-09-27");
});

test("recap params survive an empty or hostile link", () => {
  const p = parseRecapParams(new URLSearchParams("w=../../etc&n=%00%0a&t=" + "x".repeat(500)));
  assert.equal(p.weekOf, null);
  assert.equal(p.name, null);
  assert.equal(p.topArtist?.length, 40);
  assert.deepEqual(p.moods, []);
  assert.equal(p.cards, 0);
});

test("a song's drawn waveform is stable and in range", () => {
  const a = waveBars("1440857781", 48);
  assert.deepEqual(a, waveBars("1440857781", 48));
  assert.notDeepEqual(a, waveBars("1440857782", 48));
  for (const v of a) assert.ok(v >= 0.25 && v <= 1);
});

test("the beta form only forwards real invite codes", () => {
  assert.equal(inviteCode(" abcdefg "), "ABCDEFG");
  assert.equal(inviteCode("ABCDEF0"), null); // 0 isn't in the alphabet
  assert.equal(inviteCode("ABC"), null);
  assert.equal(inviteCode(42), null);
});
