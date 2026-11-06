// Every share image a page points to must exist in public/ and be 1200x630 (what the og:image tags declare).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const files = ["src/app/layout.tsx", "src/app/beta/page.tsx", "src/app/hi/page.tsx"];
const size = (f) => { const b = fs.readFileSync(f); return [b.readUInt32BE(16), b.readUInt32BE(20)]; }; // PNG IHDR

test("og images referenced by pages exist and are 1200x630", () => {
  const refs = new Set(files.flatMap((f) => [...fs.readFileSync(f, "utf8").matchAll(/["'](\/og-[\w-]+\.png)["']/g)].map((m) => m[1])));
  assert.ok(refs.size > 0, "no og image referenced");
  for (const r of refs) {
    const f = path.join("public", r);
    assert.ok(fs.existsSync(f), `${r} missing from public/`);
    assert.deepEqual(size(f), [1200, 630], `${r} is not 1200x630`);
  }
});
