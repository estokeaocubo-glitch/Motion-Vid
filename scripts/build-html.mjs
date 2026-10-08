// Para cada motion, gera a partir de src/:
//  - dist/<Nome>.artifact.jsx: arquivo único (módulos locais, fontes e logos embutidos) para colar num Claude Artifact
//  - dist/<slug>.html: preview standalone (React UMD + Babel standalone via CDN)
// Rode `node scripts/build-assets.mjs` antes se trocar algo em assets/.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ENTRIES = [
  { src: "src/EstokeAoCuboPromo.jsx", name: "EstokeAoCuboPromo", slug: "estoke-ao-cubo", title: "Estoke ao Cubo Promo" },
  { src: "src/PortfolioCarousel.jsx", name: "PortfolioCarousel", slug: "portfolio-carrossel", title: "Carrossel Portfólio" },
  { src: "src/MonitorReel.jsx", name: "MonitorReel", slug: "reel-monitor", title: "Reel Portfólio" },
  { src: "src/EditorialReel.jsx", name: "EditorialReel", slug: "reel-editorial", title: "Reel Editorial" },
  { src: "src/FolderReveal.jsx", name: "FolderReveal", slug: "pasta-clientes", title: "Pasta de Clientes" },
  // Apresentações de site: o mesmo DeviceShowcase com "./sites/current" apontando para cada site
  { src: "src/DeviceShowcase.jsx", name: "DeviceShowcase", slug: "misu-apresentacao", title: "Misú Apresentação", alias: { "./sites/current": "src/sites/misu.js" } },
  { src: "src/DeviceShowcase.jsx", name: "DeviceShowcase", slug: "lcs-apresentacao", title: "LCS Apresentação", alias: { "./sites/current": "src/sites/lcs.js" } },
  { src: "src/DeviceShowcase.jsx", name: "DeviceShowcase", slug: "noka-apresentacao", title: "Noka Apresentação", alias: { "./sites/current": "src/sites/noka.js" } },
  { src: "src/DeviceShowcase.jsx", name: "DeviceShowcase", slug: "dizzy-apresentacao", title: "Dizzy Apresentação", alias: { "./sites/current": "src/sites/dizzy.js" } },
];
const IMPORT_RE = /^import\s+([\s\S]+?)\s+from\s+["'](.+?)["'];?[ \t]*$/gm;

// Junta o arquivo e seus imports locais (recursivo, sem duplicar) num único script
function bundle(entry) {
  const hooks = new Set();
  const seen = new Set();
  const chunks = [];
  const visit = (file, isEntry) => {
    if (seen.has(file)) return;
    seen.add(file);
    let code = readFileSync(file, "utf8");
    const deps = [];
    code = code.replace(IMPORT_RE, (_, what, from) => {
      if (from === "react") {
        const m = what.match(/\{([^}]*)\}/);
        if (m) m[1].split(",").map((s) => s.trim()).filter(Boolean).forEach((h) => hooks.add(h));
        return "";
      }
      if (entry.alias && entry.alias[from]) {
        deps.push(resolve(root, entry.alias[from]));
        return "";
      }
      if (from.startsWith(".")) {
        const base = resolve(dirname(file), from);
        const dep = [base, `${base}.js`, `${base}.jsx`].find((p) => existsSync(p) && !p.endsWith("/"));
        if (!dep) throw new Error(`Import não encontrado: ${from} em ${file}`);
        deps.push(dep);
        return "";
      }
      throw new Error(`Import externo não suportado no artifact: ${from}`);
    });
    deps.forEach((d) => visit(d, false));
    if (!isEntry) code = code.replace(/^export\s+(?=(const|function|let|class|async)\b)/gm, "");
    chunks.push(`/* ---- ${file.replace(root + "/", "")} ---- */\n${code.trim()}\n`);
  };
  visit(resolve(root, entry.src), true);
  return { hooks: [...hooks], body: chunks.join("\n") };
}

mkdirSync(resolve(root, "dist"), { recursive: true });
for (const e of ENTRIES) {
  if (e.needs && !existsSync(resolve(root, e.needs))) {
    console.log(`(pulando ${e.name}: falta ${e.needs})`);
    continue;
  }
  const { hooks, body } = bundle(e);
  const reactLine = `import React${hooks.length ? `, { ${hooks.join(", ")} }` : ""} from "react";`;
  const jsxName = e.alias ? `${e.name}.${e.slug}` : e.name;
  writeFileSync(resolve(root, `dist/${jsxName}.artifact.jsx`), `${reactLine}\n\n${body}`);

  const browserSrc = body
    .replace(`export default function ${e.name}`, `function ${e.name}`)
    .replace(/<\/script/gi, "<\\/script");
  const html = `<title>${e.title}</title>
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
const { ${hooks.join(", ")} } = React;
${browserSrc}
ReactDOM.createRoot(document.getElementById("root")).render(<${e.name} />);
</script>
`;
  writeFileSync(resolve(root, `dist/${e.slug}.html`), html);
  console.log(`dist/${jsxName}.artifact.jsx  dist/${e.slug}.html`);
}
