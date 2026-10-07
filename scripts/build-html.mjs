// Gera dist/estoke-ao-cubo.html a partir de src/EstokeAoCuboPromo.jsx
// (React UMD + Babel standalone + Tailwind play CDN) para preview sem build.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const src = readFileSync(resolve(root, "src/EstokeAoCuboPromo.jsx"), "utf8")
  .replace(/^import .*?from\s+["']react["'];?\s*$/m, "const { useState, useEffect, useRef, useCallback } = React;")
  .replace("export default function EstokeAoCuboPromo", "function EstokeAoCuboPromo")
  .replace(/<\/script/gi, "<\\/script");

const html = `<title>Estoke ao Cubo Promo</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap">
<style>
  :root { color-scheme: dark; }
  html, body, #root { height: 100%; }
  body { margin: 0; background: #0A0B10; color: #E9EBF2; overflow: hidden; }
</style>
<script src="https://cdn.tailwindcss.com/3.4.17"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js"></script>
<script src="https://unpkg.com/@babel/standalone@7.24.7/babel.min.js"></script>
<div id="root"></div>
<script type="text/babel" data-presets="react">
${src}
ReactDOM.createRoot(document.getElementById("root")).render(<EstokeAoCuboPromo />);
</script>
`;

mkdirSync(resolve(root, "dist"), { recursive: true });
writeFileSync(resolve(root, "dist/estoke-ao-cubo.html"), html);
console.log("dist/estoke-ao-cubo.html");
