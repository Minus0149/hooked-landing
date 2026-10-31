// node --experimental-strip-types --test tests/beta-ip.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// The landing posts each signup to the backend from its own server, so the
// backend saw this server's IP for every visitor: one per-IP allowance (30 an
// hour) for the whole site, which one script could use up and lock everyone
// else out. The visitor's IP now travels with the signup.

const route = readFileSync(new URL("../src/app/api/beta/route.ts", import.meta.url), "utf8");

test("the visitor's IP, the one the local limit uses, is sent to the backend", () => {
  assert.match(route, /const ip = clientKey\(request\.headers\);/);
  assert.match(route, /checkRateLimit\(ip\)/);
  assert.match(route, /body: JSON\.stringify\(\{ \.\.\.record, ip \}\)/);
  assert.match(route, /await store\(record, ip\)/);
});

test("the IP isn't written into the local signup file", () => {
  const local = route.slice(route.indexOf("await fs.mkdir"), route.indexOf("return { approved: false }"));
  assert.match(local, /JSON\.stringify\(record\)/);
  assert.doesNotMatch(local, /\bip\b/);
});
