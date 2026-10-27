// Gera os PNGs do pacote: feed 1080×1350 (out/<id>.png) e stories 1080×1920 (out/<id>.png e,
// com as zonas de sticker e as áreas seguras marcadas, out/guia/<id>.png).
// Uso: python3 posts-pacote/build.py && NODE_PATH=/opt/node22/lib/node_modules node posts-pacote/render.cjs
const path = require("path");
const fs = require("fs");
const { chromium } = require("playwright");

(async () => {
  const dir = __dirname;
  const out = path.join(dir, "out");
  fs.mkdirSync(path.join(out, "guia"), { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 2000 }, deviceScaleFactor: 1 });
  await page.goto("file://" + path.join(dir, "posts.html"));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
  const shoot = async (sel, folder) => {
    for (const id of await page.$$eval(sel, (els) => els.map((e) => e.id))) {
      await page.locator(`[id="${id}"]`).screenshot({ path: path.join(folder, `${id}.png`) });
      console.log(path.relative(dir, path.join(folder, `${id}.png`)));
    }
  };
  await shoot(".post, .story", out);
  await page.evaluate(() => document.body.classList.add("guide"));
  await shoot(".story", path.join(out, "guia"));
  await browser.close();
})();
