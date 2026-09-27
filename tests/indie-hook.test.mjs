// node --experimental-strip-types --test tests/indie-hook.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { bigArt, weekLabel } from "../src/lib/indieHook.ts";

// The indie hook of the week is shared on Instagram from this page: it must
// exist, be linked, and use artwork big enough for a story.

test("the share page and its story image exist and are linked from the footer", () => {
  assert.ok(existsSync(new URL("../src/app/(legal)/indie-hook/page.tsx", import.meta.url)));
  assert.ok(existsSync(new URL("../src/app/(legal)/indie-hook/story/route.tsx", import.meta.url)));
  const layout = readFileSync(new URL("../src/app/(legal)/layout.tsx", import.meta.url), "utf8");
  assert.ok(layout.includes('href="/indie-hook"'));
});

test("artwork is fetched at story size", () => {
  assert.equal(
    bigArt("https://is1-ssl.mzstatic.com/image/thumb/x/100x100bb.jpg", 1000),
    "https://is1-ssl.mzstatic.com/image/thumb/x/1000x1000bb.jpg",
  );
  assert.equal(bigArt("https://example.com/cover.png"), "https://example.com/cover.png");
});

test("weeks read as dates people recognise", () => {
  assert.equal(weekLabel("2026-09-28"), "28 September 2026");
});

test("the page says the pick is unpaid", () => {
  const page = readFileSync(new URL("../src/app/(legal)/indie-hook/page.tsx", import.meta.url), "utf8");
  assert.ok(page.includes("not paid for"));
  assert.ok(!/promoted/i.test(page));
});

test("the story image only uses layouts the image renderer accepts", () => {
  // next/og (Satori) refuses a <div> with more than one child unless it is a
  // flex box, and "week of {date}" is two children: every div here is flex.
  const route = readFileSync(new URL("../src/app/(legal)/indie-hook/story/route.tsx", import.meta.url), "utf8");
  const divs = route.match(/<div\s+style=\{\{[^}]*\}\}/g) ?? [];
  assert.ok(divs.length >= 5);
  for (const d of divs) assert.match(d, /display: "flex"/, d);
});
