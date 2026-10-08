// Gera, a partir de src/:
//  - dist/EstokeAoCuboPromo.artifact.jsx: arquivo único (com fontes e logo embutidos) para colar num Claude Artifact
//  - dist/estoke-ao-cubo.html: preview standalone (React UMD + Babel standalone via CDN)
// Rode `node scripts/build-assets.mjs` antes se trocar algo em assets/.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (f) => readFileSync(resolve(root, f), "utf8");

const assets = read("src/brandAssets.js")
  .replace(/^\/\/.*$/m, "")
  .replace(/^export /gm, "")
  .trim();
const component = read("src/EstokeAoCuboPromo.jsx").replace(/^import .*?from\s+["']\.\/brandAssets["'];?\s*$/m, "");

// 1) Single-file JSX para Artifact
const single = component.replace(
  /(^import .*?from\s+["']react["'];?\s*$)/m,
  `$1\n\n/* ---------- Assets da marca embutidos (fontes Archivo + Open Sauce Sans, OFL; logo do cubo) ---------- */\n${assets}\n`,
);
mkdirSync(resolve(root, "dist"), { recursive: true });
writeFileSync(resolve(root, "dist/EstokeAoCuboPromo.artifact.jsx"), single);

// 2) HTML standalone
const browserSrc = single
  .replace(/^import .*?from\s+["']react["'];?\s*$/m, "const { useState, useEffect, useRef, useCallback } = React;")
  .replace("export default function EstokeAoCuboPromo", "function EstokeAoCuboPromo")
  .replace(/<\/script/gi, "<\\/script");

const html = `<title>Estoke ao Cubo Promo</title>
<style>
  :root { color-scheme: dark; }
  html, body, #root { height: 100%; }
  body { margin: 0; background: #00050F; color: #E9EBF2; overflow: hidden; }
</style>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js"></script>
<script src="https://unpkg.com/@babel/standalone@7.24.7/babel.min.js"></script>
<div id="root"></div>
<script type="text/babel" data-presets="react">
${browserSrc}
ReactDOM.createRoot(document.getElementById("root")).render(<EstokeAoCuboPromo />);
</script>
`;
writeFileSync(resolve(root, "dist/estoke-ao-cubo.html"), html);
console.log("dist/EstokeAoCuboPromo.artifact.jsx\ndist/estoke-ao-cubo.html");
