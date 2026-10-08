// Exporta o vídeo final: MP4 1080×1920 (H.264 + AAC), pronto para Reels/TikTok.
// Captura quadro a quadro (a timeline é determinística) e junta com a trilha
// renderizada offline pelo próprio motor de áudio do componente.
//
// Requisitos: Node 18+, `npm i -D playwright` (+ `npx playwright install chromium`) e ffmpeg no PATH.
// Uso:  node scripts/build-html.mjs && node scripts/export-video.cjs [saida.mp4] [fps]
// Opcional: EAC_DEPS=/caminho/node_modules serve React/Babel localmente em vez das CDNs.
const { chromium } = require("playwright");
const { spawn } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const root = path.resolve(__dirname, "..");
const out = path.resolve(process.argv[2] || path.join(root, "dist/estoke-ao-cubo-reels.mp4"));
const fps = Number(process.argv[3] || 30);
const DURATION = 40;

const RENDER = 'ReactDOM.createRoot(document.getElementById("root")).render(<EstokeAoCuboPromo />);';
const CAPTURE = `function CaptureRoot() {
  const [t, setT] = useState(0);
  useEffect(() => { window.__cap = { set: (v) => ReactDOM.flushSync(() => setT(v)), wav: renderSoundtrackWav }; }, []);
  return <div style={{ position: "relative", width: W, height: H, overflow: "hidden" }}><Frame t={t} /></div>;
}
document.fonts.ready.then(() => { _mc.clear(); ReactDOM.createRoot(document.getElementById("root")).render(<CaptureRoot />); });`;

(async () => {
  const src = fs.readFileSync(path.join(root, "dist/estoke-ao-cubo.html"), "utf8");
  if (!src.includes(RENDER)) throw new Error("Rode antes: node scripts/build-html.mjs");
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "eac-"));
  const html = path.join(tmp, "capture.html");
  fs.writeFileSync(html, src.replace(RENDER, CAPTURE));

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

  console.log("Renderizando trilha…");
  const wav = path.join(tmp, "trilha.wav");
  fs.writeFileSync(wav, Buffer.from(await page.evaluate(() => window.__cap.wav()), "base64"));

  console.log(`Capturando ${DURATION * fps} quadros a ${fps}fps…`);
  const ff = spawn("ffmpeg", [
    "-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(fps), "-c:v", "mjpeg", "-i", "-", "-i", wav,
    "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-profile:v", "high", "-r", String(fps),
    "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", "-shortest", out,
  ], { stdio: ["pipe", "inherit", "inherit"] });
  const N = DURATION * fps;
  for (let i = 0; i < N; i++) {
    await page.evaluate((v) => window.__cap.set(v), i / fps);
    const buf = await page.screenshot({ type: "jpeg", quality: 93, clip: { x: 0, y: 0, width: 450, height: 800 } });
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
