// node --experimental-strip-types --test tests/csp.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildCsp, makeNonce } from "../src/lib/csp.ts";

// Scripts used to run under 'unsafe-inline', so any inline script that got
// into a page would run. Each request now carries a fresh nonce instead.

const scriptSrc = (csp) => csp.split("; ").find((d) => d.startsWith("script-src "));

test("production scripts need the nonce; nothing inline runs without it", () => {
  const csp = buildCsp("abc123==", false);
  const s = scriptSrc(csp);
  assert.match(s, /'nonce-abc123=='/);
  assert.doesNotMatch(s, /'unsafe-inline'|'unsafe-eval'/);
  assert.match(s, /https:\/\/static\.cloudflareinsights\.com/); // the edge-injected beacon
  assert.doesNotMatch(s, /'strict-dynamic'/); // it would switch the host allow-list off
  for (const d of ["object-src 'none'", "base-uri 'self'", "frame-ancestors 'none'", "form-action 'self'"]) assert.ok(csp.includes(d), d);
});

test("development keeps eval and the HMR socket, nothing else", () => {
  const csp = buildCsp("n", true);
  assert.match(scriptSrc(csp), /'unsafe-eval'/);
  assert.doesNotMatch(scriptSrc(csp), /'unsafe-inline'/);
  assert.match(csp, /connect-src 'self' ws: wss:/);
});

test("nonces are fresh, unguessable base64", () => {
  const seen = new Set(Array.from({ length: 200 }, makeNonce));
  assert.equal(seen.size, 200);
  for (const n of seen) assert.match(n, /^[A-Za-z0-9+/]{22}==$/);
});

test("the proxy sets the policy on the request (for Next) and the response, and pages render per request", () => {
  const proxy = readFileSync(new URL("../src/proxy.ts", import.meta.url), "utf8");
  assert.match(proxy, /requestHeaders\.set\("Content-Security-Policy", csp\)/);
  assert.match(proxy, /response\.headers\.set\("Content-Security-Policy", csp\)/);
  const layout = readFileSync(new URL("../src/app/layout.tsx", import.meta.url), "utf8");
  assert.match(layout, /await connection\(\);/);
  // one policy only: a second, static one in next.config would be confusing
  const config = readFileSync(new URL("../next.config.ts", import.meta.url), "utf8");
  assert.doesNotMatch(config, /key: "Content-Security-Policy"/);
  assert.doesNotMatch(config, /unsafe-inline/);
});
