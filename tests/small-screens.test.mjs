import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(`../src/${p}`, import.meta.url), "utf8");

// 3 Nov 2026: on 320-390px phones the headline lines crossed, the nav button
// wrapped to two lines, the second hero button ran off the screen, and the
// page lagged (3D stage at up to 1.75x on a 3x phone, plus Lenis running on touch).
test("small phones: headings get room, nav fits, hero buttons stack under 380px", () => {
  const css = read("app/globals.css");
  assert.match(css, /@media \(max-width: 900px\) \{\s*h1, h2, \.hero-copy h1, \.scene-copy h2 \{ line-height: 1\.14; \}/);
  assert.match(css, /\.nav-cta \{ white-space: nowrap; \}/);
  const narrow = css.slice(css.indexOf("@media (max-width: 380px)"));
  assert.match(narrow, /\.hero-cta \{ flex-wrap: wrap; \}/);
  assert.match(narrow, /\.hero-cta > \* \{ flex: 1 1 100%; \}/);
});

test("phones get the lighter 3D render and native scrolling", () => {
  const stage = read("components/Stage.tsx");
  assert.match(stage, /dpr=\{phone \? \[1, 1\.25\] : \[1, 1\.75\]\}/);
  assert.match(stage, /antialias: !phone/);
  const smooth = read("components/SmoothScroll.tsx");
  const coarse = smooth.indexOf('matchMedia("(pointer: coarse)").matches) {');
  assert.ok(coarse > 0 && coarse < smooth.indexOf("new Lenis("), "touch screens return before Lenis starts");
});
