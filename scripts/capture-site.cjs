// Captura um site para o motion de apresentação (DeviceShowcase):
// screenshot de página inteira em desktop + posição (px) de cada seção, e gera
// src/sites/<id>.js com a imagem em WebP base64 e os offsets de rolagem.
//
// Uso: node scripts/capture-site.cjs <url> <id> ["Nome do projeto"] [largura=1440] [altura-da-tela=1000]
//  ex.: node scripts/capture-site.cjs https://lcsturismo.com showcase "LCS Transporte e Turismo"
// O motion DeviceShowcase lê src/sites/showcase.js.
// Requisitos: playwright (chromium) e ffmpeg no PATH (para converter em WebP).
const { chromium } = require("playwright");
const { execFileSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const [, , url, id, projectName, wArg, hArg] = process.argv;
if (!url || !id) {
  console.error("Uso: node scripts/capture-site.cjs <url> <id> [largura] [altura]");
  process.exit(1);
}
const width = Number(wArg || 1440);
const height = Number(hArg || 1000);
const root = path.resolve(__dirname, "..");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await page.goto(url, { waitUntil: "networkidle", timeout: 90000 });
  // Rola até o fim para disparar lazy-load e animações de entrada, depois volta ao topo
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.8;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 250));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(1500);
  // Fixos (header/chat flutuante) virariam repetição na imagem: deixa header no topo e esconde widgets
  await page.addStyleTag({ content: "[style*='position: fixed'], .fixed { position: absolute !important; }" });

  const info = await page.evaluate(() => {
    const H = document.documentElement.scrollHeight;
    const cands = [...document.querySelectorAll("header, section, footer, main > div, [id]")]
      .map((el) => ({ el, r: el.getBoundingClientRect() }))
      .filter(({ r }) => r.height > window.innerHeight * 0.35 && r.width > window.innerWidth * 0.6)
      .map(({ el, r }) => ({ top: Math.round(r.top + window.scrollY), h: Math.round(r.height), tag: el.tagName.toLowerCase(), id: el.id || "", text: (el.innerText || "").trim().split("\n")[0].slice(0, 60) }))
      .sort((a, b) => a.top - b.top);
    const out = [];
    cands.forEach((c) => {
      if (!out.length || c.top - out[out.length - 1].top > window.innerHeight * 0.4) out.push(c);
    });
    return { H, title: document.title, sections: out };
  });

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "site-"));
  const png = path.join(tmp, "full.png");
  await page.screenshot({ path: png, fullPage: true });
  await browser.close();

  // WebP com largura 1080 (nitidez suficiente para a tela do tablet no vídeo)
  const webp = path.join(tmp, "full.webp");
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", png, "-vf", "scale=1080:-2", "-q:v", "82", webp]);
  const scale = 1080 / width;
  const sections = info.sections.map((s) => ({ ...s, top: Math.round(s.top * scale), h: Math.round(s.h * scale) }));
  fs.mkdirSync(path.join(root, "assets/sites"), { recursive: true });
  fs.copyFileSync(webp, path.join(root, `assets/sites/${id}-full.webp`));
  fs.mkdirSync(path.join(root, "src/sites"), { recursive: true });
  const outFile = path.join(root, `src/sites/${id}.js`);
  fs.writeFileSync(outFile, `// Gerado por scripts/capture-site.cjs a partir de ${url} — capturado em ${new Date().toISOString().slice(0, 10)}
export const SITE = {
  url: ${JSON.stringify(url)},
  projectName: ${JSON.stringify(projectName || "")},
  // Índices de SITE.sections usados nos 4 planos do vídeo (o último plano volta ao topo)
  story: [0, 1, 2, 3],
  title: ${JSON.stringify(info.title)},
  width: 1080,
  height: ${Math.round(info.H * scale)},
  viewport: ${Math.round(height * scale)},
  // Seções detectadas (topo em px na imagem de 1080 de largura). Revise e escolha as do roteiro.
  sections: ${JSON.stringify(sections, null, 2)},
  src: "data:image/webp;base64,${fs.readFileSync(webp).toString("base64")}",
};
`);
  console.log(outFile, `${Math.round(fs.statSync(webp).size / 1024)}KB`, `${sections.length} seções`);
  sections.forEach((s) => console.log(`  ${s.top}px  <${s.tag}${s.id ? "#" + s.id : ""}>  ${s.text}`));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
