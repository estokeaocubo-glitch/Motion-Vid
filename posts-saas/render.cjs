// Gera um PNG 1080×1350 por post de posts-saas/posts.html em posts-saas/out/<id>.png
// Uso: NODE_PATH=/opt/node22/lib/node_modules node posts-saas/render.cjs
const path = require("path");
const fs = require("fs");
const { chromium } = require("playwright");

(async () => {
  const dir = __dirname;
  const out = path.join(dir, "out");
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 1500 }, deviceScaleFactor: 1 });
  await page.goto("file://" + path.join(dir, "posts.html"));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  for (const id of await page.$$eval(".post", (els) => els.map((e) => e.id))) {
    await page.locator(`[id="${id}"]`).screenshot({ path: path.join(out, `${id}.png`) });
    console.log(`out/${id}.png`);
  }
  await browser.close();
})();
