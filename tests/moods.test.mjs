// node --experimental-strip-types --test tests/moods.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { FACE_IDLE, MOODS, moodAtPush, wedgePoint } from "../src/data/moods.ts";

const hooks = JSON.parse(readFileSync(new URL("../src/data/hooks.json", import.meta.url), "utf8"));

test("every face has a hook to play, so no pick is silent", () => {
  for (const m of MOODS) {
    assert.ok(hooks.some((h) => h.mood === m.id), `no track for ${m.id}`);
  }
  for (const h of hooks) assert.ok(MOODS.some((m) => m.id === h.mood), `${h.title}: unknown mood`);
});

test("a push picks the face it points at, and a nudge picks nothing", () => {
  assert.equal(moodAtPush(0, -80, 38), "hyped"); // straight up
  assert.equal(moodAtPush(0, 80, 38), "chill"); // straight down
  assert.equal(moodAtPush(10, 10, 38), null); // inside the dead zone
});

test("each face moves its own way", () => {
  const moves = MOODS.map((m) => JSON.stringify(FACE_IDLE[m.id]));
  assert.equal(new Set(moves).size, MOODS.length);
});

// The landing copies the app's moods. When the web repo is beside this one,
// hold the copy to the original. Read as text: the app's module imports
// siblings without extensions, which node can't load directly.
const WEB = new URL("../../web/src/data/mood.ts", import.meta.url);
const block = (src, name) => {
  const at = src.indexOf(`export const ${name}`);
  const end = src.indexOf("};", at);
  return src
    .slice(src.indexOf("= {", at), end)
    .replace(/\/\/.*$/gm, "")
    .replace(/\s+/g, "");
};
test("matches the app's moods", { skip: !existsSync(WEB) && "web repo not checked out beside this one" }, () => {
  const app = readFileSync(WEB, "utf8");
  const mine = readFileSync(new URL("../src/data/moods.ts", import.meta.url), "utf8");
  let from = 0;
  for (const m of MOODS) {
    for (const field of [`id: "${m.id}"`, `label: "${m.label}"`, `line: "${m.line}"`, `accent: "${m.accent}"`]) {
      const at = app.indexOf(field, from);
      assert.ok(at >= 0, `the app has no ${field} after the previous mood — copy the change across`);
      if (field.startsWith("id:")) from = at;
    }
  }
  assert.equal(block(mine, "FACE_IDLE"), block(app, "FACE_IDLE"), "face motions differ from the app's");
});

test("each wedge's face sits on the direction that picks it", () => {
  MOODS.forEach((m, i) => {
    const p = wedgePoint(i, 80);
    assert.equal(moodAtPush(p.x, p.y, 38), m.id);
  });
});
