// node --experimental-strip-types --test tests/choreo.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { recordPose, deckY, sleeveY, fan, archive, deckView, phoneShown, CUES } from "../src/lib/choreo.ts";
import { playhead, SCENES, sceneIndex } from "../src/lib/film.ts";
import { cuesCrossed } from "../src/lib/sfx.ts";

const onScreen = (p) => Math.abs(p.x) < 4 && Math.abs(p.y) < 3.5 && p.opacity > 0.5;

test("the story starts and ends with the record on the deck", () => {
  for (const t of [0, 0.3, 9.5]) {
    const p = recordPose(t);
    assert.equal(p.up, 0, `flat at ${t}`);
    assert.ok(Math.abs(p.y + 0.39) < 1e-9, `on the platter at ${t}`);
  }
  assert.equal(deckY(0), -0.6);
  assert.equal(deckY(9.5), -0.6);
  assert.ok(deckY(4) < -5, "the deck is out of the way during the gestures");
});

test("every gesture scene has a record standing centre stage while it's explained", () => {
  for (const [scene, at] of [["skip", 0.2], ["save", 0.2], ["more", 0.4], ["never", 0.25], ["mood", 0.5]]) {
    const t = sceneIndex(scene) + at;
    const p = recordPose(t);
    assert.ok(onScreen(p), `${scene}: on screen at ${t}`);
    assert.equal(p.up, 1, `${scene}: standing`);
  }
});

test("up: the record leaves through the top", () => {
  const p = recordPose(2.73);
  assert.ok(p.y > 6, "out of frame, above");
  assert.ok(onScreen(recordPose(2.99)), "and the next song has risen");
  assert.notEqual(recordPose(2.99).label, recordPose(2.2).label, "wearing a different label");
});

test("down: the record ends up inside the sleeve", () => {
  const t = 3.74;
  assert.ok(Math.abs(recordPose(t).y - sleeveY(t)) < 0.05, "same height as the sleeve");
  assert.ok(sleeveY(2.5) < -8 && sleeveY(4.5) < -8, "the sleeve only appears for its scene");
});

test("right: four like it fan out beside the record, then clear", () => {
  const xs = [0, 1, 2, 3].map((k) => fan(4.75, k));
  for (let k = 1; k < 4; k++) assert.ok(xs[k].x > xs[k - 1].x, "each further right");
  assert.ok(xs.every((c) => c.opacity > 0.4), "visible");
  assert.ok([0, 1, 2, 3].every((k) => fan(5.2, k).opacity === 0), "gone by the next scene");
});

test("left: the record drains to grey and is thrown out", () => {
  assert.equal(recordPose(5.2).grey, 0);
  assert.equal(recordPose(5.65).grey, 1);
  assert.ok(recordPose(5.85).x < -6, "out of frame, left");
});

test("the archive fills while its scene is up and not otherwise", () => {
  assert.equal(archive(6.5).opacity, 0);
  assert.ok(archive(7.5).opacity > 0.9);
  assert.ok(archive(7.7).filed >= 8.9);
  assert.equal(archive(8.5).opacity, 0);
});

test("camera looks down at the deck only when the deck is there", () => {
  assert.equal(deckView(0.2), 1);
  assert.equal(deckView(4), 0);
  assert.equal(deckView(9.2), 1);
  assert.equal(phoneShown(1.5), 0);
  assert.equal(phoneShown(4.5), 1);
});

test("the playhead follows the scene blocks", () => {
  const blocks = SCENES.map((_, i) => ({ top: i * 1000 - 3000, height: 1000 }));
  // anchor at y=500 is halfway into the block whose top is 0 → index 3
  assert.equal(playhead(blocks, 500), 3.5);
  assert.equal(playhead(blocks, -99999), 0);
  assert.ok(playhead(blocks, 1e9) < SCENES.length);
});

test("each sound plays once, going forward, as the story reaches it", () => {
  assert.deepEqual(cuesCrossed(CUES, 2.4, 2.5), ["skip"]);
  assert.deepEqual(cuesCrossed(CUES, 2.5, 2.4), [], "never in reverse");
  assert.deepEqual(cuesCrossed(CUES, 2.5, 2.6), [], "never twice");
  assert.equal(cuesCrossed(CUES, 0, 10).length, CUES.length);
});
