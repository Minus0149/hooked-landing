// IndexNow (1 Nov 2026): Bing and Yandex fetch /<key>.txt to trust the URL pings we send them.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("the IndexNow key file holds its own key", () => {
  const key = "550e45e82833ec3fb4c350f5f0b700d5";
  assert.equal(readFileSync(new URL(`../public/${key}.txt`, import.meta.url), "utf8"), key);
});
