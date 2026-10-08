# Estoke ao Cubo — Promo 9:16

Vídeo promocional vertical (Reels/TikTok, 40s) em React, para a venda de sites e lojas virtuais da Estoke ao Cubo.

- `dist/EstokeAoCuboPromo.artifact.jsx`: arquivo único, com fontes e logo embutidos. Cole direto num Claude Artifact (React).
- `dist/estoke-ao-cubo.html`: preview standalone (React UMD + Babel via CDN).
- `src/EstokeAoCuboPromo.jsx` + `src/brandAssets.js`: código-fonte. Depois de editar, rode `node scripts/build-assets.mjs` (se mudou algo em `assets/`) e `node scripts/build-html.mjs`.

## Identidade aplicada (v2, a partir de `design` e `deesign.pdf`)

- Cores: preto-azulado `#000A1E`, azul-marinho `#002450` (logotipo), azul vibrante `#008ACC`, ciano `#2FD4FF`, azul claro `#4FB3E8`. Vermelho só em sinais de erro/perda na cena da dor.
- Símbolo: o cubo isométrico de vidro do manual (`assets/cube-logo.webp`, extraído do PDF).
- Tipografia: títulos em caixa alta larga. A Monument Extended é comercial, então o vídeo usa a Archivo no eixo de largura 125% como substituta aberta. Textos em Open Sauce Sans. As duas fontes são OFL e vão embutidas. Para usar a Monument licenciada, troque `assets/archivo-latin-standard-normal.woff2` pelo arquivo dela e rode os scripts.
- Fundos: feixes de luz azul em diagonal sobre preto (como as capas do manual), versão clara com feixes suaves, e textura de grão animada sobre todo o frame.
- Texto da cena 5 inclui o propósito da marca: "sem ferramentas caras e sem dor de cabeça técnica".

## Roteiro

| Tempo | Cena | Fundo |
|---|---|---|
| 0–4s | Gancho: "Você tem uma [Loja / Marca / Empresa]?" com caixa de seleção desenhada pelo cursor | Claro |
| 4–11s | A dor: direct, links quebrados, 404, planilha, carrinho abandonado, dinheiro voando, vendas −38% | Escuro (revelação circular a partir do clique) |
| 11–16s | Revelação: flash, logo, mockup de e-commerce, "Sites pensados para vender." | Claro |
| 16–26s | Câmera viajando por 4 cards: Design Premium, Checkout Rápido, 100% Responsivo (light→dark), Alta Conversão | Claro |
| 26–33s | "A melhor parte?", explosão de ícones, cubo da marca, "sem dor de cabeça técnica" grifado | Escuro com feixe azul |
| 33–40s | CTA: logo, site + celular, "Coloque sua marca no ar hoje", botão pulsante clicado | Claro |

## Como funciona

Um relógio mestre `t` (segundos) é avançado por `requestAnimationFrame`. Cada elemento calcula seu estado a partir de `t` com uma mola analítica (oscilador amortecido, mesma física do framer-motion) e curvas de easing. Por isso a animação é determinística e navegável como um vídeo: dá para pausar, arrastar a timeline e gravar a tela com frames idênticos a cada execução.

O frame é desenhado em 450×800 unidades lógicas e escalado para caber na tela. Para gravar em 1080×1920, abra o preview numa janela alta e use um gravador de tela, ou controle pelo console: `window.__eac.seek(12.5)`, `window.__eac.pause()`, `window.__eac.play()`.

Atalhos: `Espaço` reproduz/pausa, `R` reinicia, `←`/`→` voltam/avançam 1s.

Os números dos mockups (faturamento, +327%, conversão) são ilustrativos e vêm marcados assim no card de conversão.
