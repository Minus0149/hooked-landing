// Screenshots the top of a page at desktop and phone width to check the logo in the nav.
// node scripts/logo/navcheck.cjs <url> <out-prefix>
const { chromium } = require("F:/projects/company/blank/node_modules/playwright");
(async () => {
  const [url, out] = process.argv.slice(2);
  const b = await chromium.launch({ channel: "msedge" });
  for (const [w, h, tag] of [[1280, 260, "desk"], [375, 200, "phone"]]) {
    const p = await (await b.newContext({ viewport: { width: w, height: 800 }, deviceScaleFactor: 2 })).newPage();
    await p.goto(url, { waitUntil: "networkidle" }).catch(() => {});
    await p.waitForTimeout(2500);
    await p.screenshot({ path: `${out}-${tag}.png`, clip: { x: 0, y: 0, width: w, height: h } });
    await p.close();
  }
  await b.close();
})();
