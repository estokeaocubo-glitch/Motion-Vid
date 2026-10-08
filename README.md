# Estoke ao Cubo — Promo 9:16

Vídeo promocional vertical (Reels/TikTok, 40s) em React, para a venda de sites e lojas virtuais da Estoke ao Cubo.

- `dist/EstokeAoCuboPromo.artifact.jsx`: arquivo único, com fontes e logo embutidos. Cole direto num Claude Artifact (React).
- `dist/estoke-ao-cubo-reels.mp4`: o vídeo final, 1080×1920, 30fps, H.264 + AAC, pronto para postar.
- `dist/estoke-ao-cubo.html`: preview standalone (React UMD + Babel via CDN).
- `src/EstokeAoCuboPromo.jsx` + `src/brandAssets.js`: código-fonte. Depois de editar, rode `node scripts/build-assets.mjs` (se mudou algo em `assets/`) e `node scripts/build-html.mjs`.

## Identidade aplicada (v2, a partir de `design` e `deesign.pdf`)

- Cores: preto-azulado `#000A1E`, azul-marinho `#002450` (logotipo), azul vibrante `#008ACC`, ciano `#2FD4FF`, azul claro `#4FB3E8`. Vermelho só em sinais de erro/perda na cena da dor.
- Símbolo: o cubo isométrico de vidro do manual (`assets/cube-logo.webp`, extraído do PDF).
- Tipografia: títulos em caixa alta larga. A Monument Extended é comercial, então o vídeo usa a Archivo no eixo de largura 125% como substituta aberta. Textos em Open Sauce Sans. As duas fontes são OFL e vão embutidas. Para usar a Monument licenciada, troque `assets/archivo-latin-standard-normal.woff2` pelo arquivo dela e rode os scripts.
- Fundos: feixes de luz azul em diagonal sobre preto (como as capas do manual), versão clara com feixes suaves, e textura de grão animada sobre todo o frame.
- Texto da cena 5 inclui o propósito da marca: "sem ferramentas caras e sem dor de cabeça técnica".

## Som

Trilha e efeitos são sintetizados com Web Audio, sem nenhum arquivo de áudio. Cada som é um evento com tempo fixo na timeline, então imagem e som continuam sincronizados ao pausar, pular ou repetir.

- Trilha a 120 BPM que acompanha o roteiro: intro leve com arpejo, "dor" em tom menor com sub-grave pulsando, drop na revelação (11s), breakdown com riser antes de "A melhor parte?" e novo drop em 28s.
- Efeitos: pops nas palavras, cliques do cursor, notificações de chat, alerta, glitch no 404, asas do dinheiro, riser + impacto no flash, chimes no logo e no pedido confirmado, ding de "Nova venda", whooshes nas transições, ticks na transição de pixels.
- O navegador só libera áudio depois de um clique: use o botão "Ativar som" (ou a tecla M). Na primeira ativação o vídeo recomeça do início.

## Transições

Revelação por máscara nos títulos, motion blur direcional (câmera dos cards, mockups subindo, celular entrando), tremor de câmera nos impactos, anel de luz na revelação circular, streak anamórfico no flash, zoom-through para dentro do site, transição de pixels/cubos (eco do cubo pixelado do manual) e wipe diagonal com faixas azuis para o CTA.

## Exportar o MP4

```bash
npm i -D playwright && npx playwright install chromium   # uma vez; precisa de ffmpeg no PATH
node scripts/build-html.mjs
node scripts/export-video.cjs dist/estoke-ao-cubo-reels.mp4 30
```

O script captura os 1200 quadros seguindo a timeline e junta com a trilha renderizada offline.

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

O frame é desenhado em 450×800 unidades lógicas e escalado para caber na tela. Pelo console: `window.__eac.seek(12.5)`, `window.__eac.pause()`, `window.__eac.play()` e `window.__eac.renderSoundtrack()` (WAV da trilha em base64).

Atalhos: `Espaço` reproduz/pausa, `M` liga/desliga o som, `R` reinicia, `←`/`→` voltam/avançam 1s.

Os números dos mockups (faturamento, +327%, conversão) são ilustrativos e vêm marcados assim no card de conversão.
