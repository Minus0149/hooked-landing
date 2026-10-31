// node --experimental-strip-types --test tests/landing-abuse.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { readCapped } from "../src/lib/betaAnswer.ts";
import { __resetRateLimit, checkRenderLimit, isRenderPath } from "../src/lib/rate-limit.ts";

// Third security pass, landing side.

test("a huge signup body is refused without buffering it", async () => {
  const declared = new Request("http://x/api/beta", { method: "POST", body: "{}", headers: { "content-length": "900000000" } });
  assert.equal(await readCapped(declared, 8192), null);

  // no length header: reading stops at the cap
  let pulled = 0;
  const endless = new ReadableStream({
    pull(c) {
      pulled++;
      c.enqueue(new Uint8Array(4096));
    },
  });
  const streamed = new Request("http://x/api/beta", { method: "POST", body: endless, duplex: "half" });
  assert.equal(await readCapped(streamed, 8192), null);
  assert.ok(pulled < 10, `read ${pulled} chunks`);

  const ok = new Request("http://x/api/beta", { method: "POST", body: JSON.stringify({ email: "अ@b.co" }) });
  assert.equal(await readCapped(ok, 8192), JSON.stringify({ email: "अ@b.co" }));

  const route = readFileSync(new URL("../src/app/api/beta/route.ts", import.meta.url), "utf8");
  assert.match(route, /await readCapped\(request, MAX_BODY_BYTES\)/);
  assert.doesNotMatch(route, /request\.text\(\)/);
});

test("share pages and images are limited per visitor", () => {
  for (const p of ["/s/123", "/s/own%3Aabc", "/s/123/story", "/s/123/opengraph-image", "/s/123/opengraph-image-abc12", "/r/story", "/indie-hook/story"]) {
    assert.ok(isRenderPath(p), p);
  }
  for (const p of ["/", "/beta", "/hi", "/indie-hook", "/privacy", "/sitemap.xml"]) assert.ok(!isRenderPath(p), p);

  __resetRateLimit();
  const t0 = 5_000_000;
  let ok = 0;
  for (let i = 0; i < 300; i++) if (checkRenderLimit("203.0.113.5", t0 + i).ok) ok++;
  assert.equal(ok, 240);
  assert.equal(checkRenderLimit("203.0.113.6", t0).ok, true); // someone else is unaffected
  assert.equal(checkRenderLimit("203.0.113.5", t0 + 10 * 60_000).ok, true); // next window
  __resetRateLimit();
});

test("the proxy applies it to every request, prefetch or not", () => {
  const proxy = readFileSync(new URL("../src/proxy.ts", import.meta.url), "utf8");
  assert.match(proxy, /if \(isRenderPath\(request\.nextUrl\.pathname\)\)/);
  assert.match(proxy, /checkRenderLimit\(clientKey\(request\.headers\)\)/);
  assert.doesNotMatch(proxy, /next-router-prefetch/);
});
