// Renders the share image: node scripts/og/render.cjs <out.png> [url text]
// Draws og.html at 2x in headless Edge, then scales to 1200x630 (ffmpeg, lanczos) so text stays crisp.
const path = require("path");
const { execFileSync } = require("child_process");
const { chromium } = require("F:/projects/company/blank/node_modules/playwright");
(async () => {
  const [out, url = "hookedcue.com"] = process.argv.slice(2);
  const b = await chromium.launch({ channel: "msedge" });
  const p = await (await b.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 2 })).newPage();
  await p.goto("file:///" + path.join(__dirname, "og.html").replace(/\\/g, "/") + "?url=" + encodeURIComponent(url));
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(300);
  const big = out.replace(/\.png$/, "@2x.png");
  await p.screenshot({ path: big });
  await b.close();
  execFileSync("ffmpeg", ["-nostdin", "-y", "-loglevel", "error", "-i", big, "-vf", "scale=1200:630:flags=lanczos", out]);
  require("fs").unlinkSync(big);
  console.log("wrote", out);
})();
