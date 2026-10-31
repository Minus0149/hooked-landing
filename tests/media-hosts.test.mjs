// node --experimental-strip-types --test tests/media-hosts.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { safeMediaUrl } from "../src/lib/mediaHosts.ts";

// Creators type their own artwork and preview links, and the share images
// fetch the artwork from this server. Any https address used to pass, so a
// creator could point this server (and every listener) at a host of their
// choosing. Only the catalogue's own hosts pass now.

const CONVEX = ["https://shocking-goldfinch-745.convex.cloud"];
const ok = (u) => assert.equal(safeMediaUrl(u, CONVEX), new URL(u).toString(), u);
const no = (u) => assert.equal(safeMediaUrl(u, CONVEX), null, String(u));

test("the catalogue's hosts pass", () => {
  ok("https://is1-ssl.mzstatic.com/image/thumb/Music/v4/ab/600x600bb.jpg");
  ok("https://is5-ssl.mzstatic.com/x.jpg");
  ok("https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview/x.m4a");
  ok("https://e-cdns-images.dzcdn.net/images/cover/x/500x500.jpg");
  ok("https://cdns-preview-1.dzcdn.net/stream/x.mp3");
  ok("https://cdn.hookedcue.com/art/x.jpg");
  ok("https://shocking-goldfinch-745.convex.cloud/api/storage/abc-123");
});

test("anything else is refused before a fetch", () => {
  no("https://evil.example.com/a.jpg");
  no("https://169.254.169.254/latest/meta-data/");
  no("https://localhost/x.jpg");
  no("http://is1-ssl.mzstatic.com/x.jpg"); // not https
  no("https://mzstatic.com.evil.example/x.jpg");
  no("https://evilmzstatic.com/x.jpg");
  no("https://user:pass@is1-ssl.mzstatic.com/x.jpg");
  no("https://is1-ssl.mzstatic.com:8443/x.jpg");
  no("https://other-deploy-123.convex.cloud/api/storage/abc"); // someone else's deployment
  no("https://shocking-goldfinch-745.convex.cloud/api/query"); // not a stored file
  no("javascript:alert(1)");
  no("data:image/png;base64,AAAA");
  no("");
  no(undefined);
  no("https://is1-ssl.mzstatic.com/" + "x".repeat(2000));
});

test("the shared song and the indie pick only carry safe media", () => {
  const shared = readFileSync(new URL("../src/lib/sharedTrack.ts", import.meta.url), "utf8");
  assert.match(shared, /return track \? withSafeMedia\(track\) : null;/);
  for (const field of ["artwork", "previewUrl", "audioUrl"]) assert.ok(shared.includes(`safeMediaUrl(track.${field}, origins)`), field);
  const indie = readFileSync(new URL("../src/lib/indieHook.ts", import.meta.url), "utf8");
  assert.match(indie, /artwork: safeMediaUrl\(p\.artwork, \[CONVEX_URL\]\) \?\? ""/);
});

test("renderers draw a tile instead of an empty image", () => {
  const og = readFileSync(new URL("../src/lib/ogKit.tsx", import.meta.url), "utf8");
  assert.equal((og.match(/<Cover url=\{track\.artwork && /g) ?? []).length, 2);
  assert.doesNotMatch(og, /<img src=\{artworkAt/);
  const story = readFileSync(new URL("../src/app/(legal)/indie-hook/story/route.tsx", import.meta.url), "utf8");
  assert.match(story, /now\.artwork \? \(/);
  const player = readFileSync(new URL("../src/app/s/[id]/SharePlayer.tsx", import.meta.url), "utf8");
  assert.match(player, /track\.artwork \? \(/);
  assert.match(player, /\{src && <audio/);
});
