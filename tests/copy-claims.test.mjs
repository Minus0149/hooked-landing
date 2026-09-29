// The site must not promise what the app doesn't do (fact-check of the reel
// scripts, 2026-09-29): the web app is not signup-free — it gives a few free
// swipes, then an invite-only wall — and a hook is not "the best 30 seconds"
// (it runs from the measured hook to the end of the preview, ~21 s median).
import { test } from "node:test";
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";

const files = execSync("git ls-files src public", { encoding: "utf8" })
  .split("\n")
  .filter((f) => /\.(tsx?|txt|json|webmanifest|md)$/.test(f));
const read = (f) => readFileSync(f, "utf8");

test("nothing says the web app needs no signup", () => {
  const bad = /no sign-?up|कोई signup नहीं|without (an )?account to (try|swipe|listen)/i;
  const hits = files.filter((f) => read(f).split("\n").some((l) => bad.test(l) && !/^\s*(\/\/|\*)/.test(l)));
  assert.deepEqual(hits, []);
});

test("nothing promises the hook lasts 30 seconds", () => {
  const bad = /(best|strongest|catchiest) (30|thirty)[ -]?s(ec(ond)?s?)?\b|30-second (song )?previews? (beginning|that starts?) at/i;
  const hits = files.filter((f) => bad.test(read(f)));
  assert.deepEqual(hits, []);
});

test("the free swipes the site quotes are the ones the web app gives", () => {
  const app = "../web/src/App.tsx";
  if (!existsSync(app)) return; // landing checked out on its own
  const n = Number(/const FREE_SWIPES = (\d+);/.exec(read(app))?.[1]);
  const words = { 3: "three", 4: "four", 5: "five", 6: "six", 10: "ten" };
  for (const f of ["src/app/beta/page.tsx", "src/components/Film.tsx"]) {
    assert.match(read(f), new RegExp(`${words[n] ?? n} free swipes`), f);
  }
  for (const f of ["src/app/hi/page.tsx", "public/llms.txt", "public/llms-full.txt"]) {
    assert.match(read(f), new RegExp(`${n} (free swipes|स्वाइप free)`), f);
  }
});
