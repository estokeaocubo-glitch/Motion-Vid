// Exporta um motion como MP4 (H.264 + AAC) com 1080 de largura, pronto para Reels/TikTok/feed.
// Captura quadro a quadro (a timeline é determinística) e junta com a trilha
// renderizada offline pelo próprio motor de áudio do componente.
//
// Requisitos: Node 18+, `npm i -D playwright` (+ `npx playwright install chromium`) e ffmpeg no PATH.
// Uso:  node scripts/build-html.mjs && node scripts/export-video.cjs <dist/arquivo.html> <saida.mp4> [fps] [formato]
//  ex.: node scripts/export-video.cjs dist/estoke-ao-cubo.html dist/estoke-ao-cubo-reels.mp4 30
//       node scripts/export-video.cjs dist/portfolio-carrossel.html dist/portfolio-carrossel-4x5.mp4 60 4x5
// Opcional: EAC_DEPS=/caminho/node_modules serve React/Babel localmente em vez das CDNs.
const { chromium } = require("playwright");
const { spawn } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const root = path.resolve(__dirname, "..");
const input = path.resolve(process.argv[2] || path.join(root, "dist/estoke-ao-cubo.html"));
const out = path.resolve(process.argv[3] || path.join(root, "dist/estoke-ao-cubo-reels.mp4"));
const fps = Number(process.argv[4] || 30);
const format = process.argv[5] || "9x16";

const RENDER_RE = /ReactDOM\.createRoot\(document\.getElementById\("root"\)\)\.render\(<\w+ \/>\);/;
// Cada motion define MOTION = { Frame, duration, formats, renderWav }
const CAPTURE = `function CaptureRoot() {
  const [t, setT] = React.useState(0);
  const F = MOTION.formats[${JSON.stringify(format)}];
  React.useEffect(() => { window.__cap = { set: (v) => ReactDOM.flushSync(() => setT(v)), wav: MOTION.renderWav, duration: MOTION.duration, w: F.w, h: F.h }; }, []);
  return <div style={{ position: "relative", width: F.w, height: F.h, overflow: "hidden" }}><MOTION.Frame t={t} format={${JSON.stringify(format)}} /></div>;
}
document.fonts.ready.then(() => {
  if (typeof measureCache !== "undefined") measureCache.clear();
  if (typeof _mc !== "undefined") _mc.clear();
  ReactDOM.createRoot(document.getElementById("root")).render(<CaptureRoot />);
});`;

(async () => {
  const src = fs.readFileSync(input, "utf8");
  if (!RENDER_RE.test(src)) throw new Error("HTML inesperado. Rode antes: node scripts/build-html.mjs");
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "eac-"));
  const html = path.join(tmp, "capture.html");
  fs.writeFileSync(html, src.replace(RENDER_RE, CAPTURE));

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 450, height: 800 }, deviceScaleFactor: 2.4 });
  const deps = process.env.EAC_DEPS;
  if (deps) {
    const map = {
      "react.production.min.js": "react/umd/react.production.min.js",
      "react-dom.production.min.js": "react-dom/umd/react-dom.production.min.js",
      "babel.min.js": "@babel/standalone/babel.min.js",
    };
    await page.route(/^https:/, (r) => {
      const k = Object.keys(map).find((f) => r.request().url().endsWith(f));
      return k ? r.fulfill({ path: path.join(deps, map[k]), contentType: "application/javascript" }) : r.abort();
    });
  }
  await page.goto("file://" + html);
  await page.waitForFunction(() => window.__cap, null, { timeout: 60000 });
  await page.waitForTimeout(500);
  const { duration, w, h } = await page.evaluate(() => ({ duration: window.__cap.duration, w: window.__cap.w, h: window.__cap.h }));

  console.log("Renderizando trilha…");
  const wav = path.join(tmp, "trilha.wav");
  fs.writeFileSync(wav, Buffer.from(await page.evaluate(() => window.__cap.wav()), "base64"));

  console.log(`Capturando ${Math.round(duration * fps)} quadros a ${fps}fps (${Math.round(w * 2.4)}×${Math.round(h * 2.4)})…`);
  const ff = spawn("ffmpeg", [
    "-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(fps), "-c:v", "mjpeg", "-i", "-", "-i", wav,
    "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-profile:v", "high", "-r", String(fps),
    "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", "-shortest", out,
  ], { stdio: ["pipe", "inherit", "inherit"] });
  const N = Math.round(duration * fps);
  for (let i = 0; i < N; i++) {
    await page.evaluate((v) => window.__cap.set(v), i / fps);
    const buf = await page.screenshot({ type: "jpeg", quality: 93, clip: { x: 0, y: 0, width: w, height: h } });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
    if (i % (fps * 5) === 0) console.log(`  ${Math.round((i / N) * 100)}%`);
  }
  ff.stdin.end();
  const code = await new Promise((r) => ff.on("close", r));
  await browser.close();
  fs.rmSync(tmp, { recursive: true, force: true });
  if (code !== 0) throw new Error(`ffmpeg saiu com código ${code}`);
  console.log(out);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
