// Gera src/brandAssets.js: fontes da marca e logo do cubo embutidos em base64,
// para o vídeo não depender de nenhum host externo.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const b64 = (f) => readFileSync(resolve(root, "assets", f)).toString("base64");
const face = (family, file, weight, extra = "") =>
  `@font-face{font-family:'${family}';src:url(data:font/woff2;base64,${b64(file)}) format('woff2');font-weight:${weight};font-style:normal;font-display:block;${extra}}`;

const css = [
  // Títulos (substituto aberto da Monument Extended): Archivo variável no eixo wdth 125
  face("EAC Display", "archivo-latin-standard-normal.woff2", "100 900", "font-stretch:62% 125%;"),
  // Textos: Open Sauce Sans (fonte secundária do manual)
  ...[600, 700, 800].map((w) => face("Open Sauce Sans", `open-sauce-sans-latin-${w}-normal.woff2`, w)),
].join("\n");

const out = `// Arquivo gerado por scripts/build-assets.mjs — não editar à mão.
export const BRAND_FONT_CSS = ${JSON.stringify(css)};
export const CUBE_LOGO_SRC = "data:image/webp;base64,${b64("cube-logo.webp")}";
`;
writeFileSync(resolve(root, "src/brandAssets.js"), out);
console.log("src/brandAssets.js", Math.round(out.length / 1024) + "KB");
