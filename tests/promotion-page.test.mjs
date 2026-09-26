// node --experimental-strip-types --test tests/promotion-page.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { PROMOTION_PACKAGES, perListener } from "../src/data/promotion.ts";

// Razorpay reviews these pages before it activates payments, and artists
// read the prices here before they pay; both have to be present and sane.

test("bigger packages cost more in total and less per listener", () => {
  for (let i = 1; i < PROMOTION_PACKAGES.length; i++) {
    const a = PROMOTION_PACKAGES[i - 1];
    const b = PROMOTION_PACKAGES[i];
    assert.ok(b.listeners > a.listeners, `${b.id} should reach more people than ${a.id}`);
    assert.ok(b.priceInr > a.priceInr, `${b.id} should cost more than ${a.id}`);
    assert.ok(perListener(b.priceInr, b.listeners) < perListener(a.priceInr, a.listeners), `${b.id} per listener`);
  }
});

test("no package is priced like fake streams or above a paid view elsewhere", () => {
  for (const p of PROMOTION_PACKAGES) {
    const each = perListener(p.priceInr, p.listeners);
    assert.ok(each >= 0.3 && each <= 1.5, `${p.id}: ₹${each} per listener`);
  }
});

test("the pages payments depend on exist and are linked from the legal footer", () => {
  for (const page of ["artists", "refunds", "contact", "terms", "privacy"]) {
    assert.ok(existsSync(new URL(`../src/app/(legal)/${page}/page.tsx`, import.meta.url)), `${page} missing`);
  }
  const layout = readFileSync(new URL("../src/app/(legal)/layout.tsx", import.meta.url), "utf8");
  for (const href of ["/refunds", "/contact", "/artists", "/terms", "/privacy"]) {
    assert.ok(layout.includes(`href="${href}"`), `footer lacks ${href}`);
  }
});
