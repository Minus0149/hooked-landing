// Screenshots an HTML file in headless Edge: node shot.cjs <html> <out.png> [width] [height|full] [scale]
const path = require("path");
const { chromium } = require("F:/projects/company/blank/node_modules/playwright");
(async () => {
  const [html, out, w = "1800", h = "full", s = "1"] = process.argv.slice(2);
  const b = await chromium.launch({ channel: "msedge" });
  const p = await (await b.newContext({ viewport: { width: +w, height: h === "full" ? 800 : +h }, deviceScaleFactor: +s })).newPage();
  await p.goto("file:///" + path.resolve(html).replace(/\\/g, "/"));
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(200);
  await p.screenshot({ path: out, fullPage: h === "full", omitBackground: false });
  await b.close();
  console.log("wrote", out);
})();
