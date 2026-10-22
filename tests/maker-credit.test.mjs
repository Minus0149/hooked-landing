// Every footer on hookedcue.com credits the maker with a link back to his hub,
// so the site and his profiles point at each other (rel="me").
import { test } from "node:test";
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const read = (f) => readFileSync(f, "utf8");

test("the credit links to unawareminus.com with rel=me", () => {
  const src = read("src/components/MakerCredit.tsx");
  assert.match(src, /MAKER_URL = "https:\/\/unawareminus\.com"/);
  assert.match(src, /by Minus · <a href=\{MAKER_URL\} rel="me">unawareminus\.com<\/a>/);
});

test("every file with a <footer> renders the credit inside it", () => {
  const files = execSync("git ls-files src", { encoding: "utf8" })
    .split("\n")
    .filter((f) => /\.tsx$/.test(f) && /<footer[\s>]/.test(read(f)));
  assert.ok(files.length >= 4, `found the footers: ${files.join(", ")}`);
  for (const f of files) {
    const footer = /<footer[\s\S]*?<\/footer>/.exec(read(f))?.[0] ?? "";
    assert.match(footer, /<MakerCredit \/>/, `${f} footer has the credit`);
  }
});
