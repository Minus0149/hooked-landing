// node --experimental-strip-types --test tests/beta-ip.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { clientKey, forwardedIp, SHARED_KEY, checkRateLimit, __resetRateLimit } from "../src/lib/rate-limit.ts";

// The landing posts each signup to the backend from its own server, so the
// backend saw this server's IP for every visitor: one per-IP allowance (30 an
// hour) for the whole site, which one script could use up and lock everyone
// else out. The visitor's IP now travels with the signup.

const route = readFileSync(new URL("../src/app/api/beta/route.ts", import.meta.url), "utf8");

test("the visitor's IP, the one the local limit uses, is sent to the backend", () => {
  assert.match(route, /const ip = clientKey\(request\.headers\);/);
  assert.match(route, /checkRateLimit\(ip\)/);
  assert.match(route, /body: JSON\.stringify\(ip \? \{ \.\.\.record, ip \} : record\)/);
  assert.match(route, /await store\(record, forwardedIp\(ip\)\)/);
});

test("the IP isn't written into the local signup file", () => {
  const local = route.slice(route.indexOf("await fs.mkdir"), route.indexOf("return { approved: false }"));
  assert.match(local, /JSON\.stringify\(record\)/);
  assert.doesNotMatch(local, /\bip\b/);
});

// x-forwarded-for and x-real-ip are whatever the client wrote when a request
// skips Cloudflare, so keying on them handed a script a fresh allowance per
// request. Only cf-connecting-ip counts; without it everyone shares a bucket.
const h = (o) => new Headers(o);

test("the limit is kept under Cloudflare's address", () => {
  assert.equal(clientKey(h({ "cf-connecting-ip": " 203.0.113.9 " })), "203.0.113.9");
  assert.equal(clientKey(h({ "cf-connecting-ip": "2001:db8::1" })), "2001:db8::1");
});

test("spoofable headers never pick the bucket", () => {
  assert.equal(clientKey(h({ "x-forwarded-for": "1.2.3.4" })), SHARED_KEY);
  assert.equal(clientKey(h({ "x-real-ip": "5.6.7.8" })), SHARED_KEY);
  assert.equal(clientKey(h({})), SHARED_KEY);
  assert.equal(clientKey(h({ "cf-connecting-ip": "not an ip; drop" })), SHARED_KEY);
});

test("rotating x-forwarded-for doesn't buy more signups", () => {
  __resetRateLimit();
  let ok = 0;
  for (let i = 0; i < 40; i++) {
    const key = clientKey(h({ "x-forwarded-for": `10.0.0.${i}` }));
    if (checkRateLimit(key, 1_000_000 + i * 3_000).ok) ok++;
  }
  assert.equal(ok, 20); // one window's allowance, not forty
  __resetRateLimit();
});

test("only a Cloudflare address is forwarded to the backend", () => {
  assert.equal(forwardedIp("203.0.113.9"), "203.0.113.9");
  assert.equal(forwardedIp(SHARED_KEY), undefined);
  const src = readFileSync(new URL("../src/lib/rate-limit.ts", import.meta.url), "utf8");
  assert.doesNotMatch(src, /headers\.get\("x-(forwarded-for|real-ip)"\)/);
});
