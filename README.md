# Estoke ao Cubo — Motions

Motions em React para a Estoke ao Cubo, com timeline determinística, som sintetizado e exportação para MP4.

| Motion | Duração | Formatos | Fonte | Vídeos |
|---|---|---|---|---|
| Promo (venda de sites e lojas) | 40s | 9:16 | `src/EstokeAoCuboPromo.jsx` | `dist/estoke-ao-cubo-reels.mp4` |
| Carrossel Padrão Portfólio | 9s, loop perfeito | 9:16 e 4:5 | `src/PortfolioCarousel.jsx` | `dist/portfolio-carrossel-9x16.mp4`, `dist/portfolio-carrossel-4x5.mp4` |
| Apresentação de site: Misú | 20s, loop perfeito | 9:16 e 4:5 | `src/DeviceShowcase.jsx` + `src/sites/misu.js` | `dist/misu-apresentacao-9x16.mp4`, `dist/misu-apresentacao-4x5.mp4` |
| Apresentação de site: LCS | 16,7s, loop perfeito | 9:16 e 4:5 | `src/DeviceShowcase.jsx` + `src/sites/lcs.js` | `dist/lcs-apresentacao-9x16.mp4`, `dist/lcs-apresentacao-4x5.mp4` |
| Apresentação de site: Noka | 20s, loop perfeito | 9:16 e 4:5 | `src/DeviceShowcase.jsx` + `src/sites/noka.js` | `dist/noka-apresentacao-9x16.mp4`, `dist/noka-apresentacao-4x5.mp4` |

`src/motionKit.js` reúne o que o carrossel usa: molas e easings, tokens e fontes da marca, grão e feixes de luz, síntese de áudio, render offline da trilha e o player com troca de formato. (O promo ainda tem suas próprias cópias dessas peças.)

## Apresentações de site (DeviceShowcase)

Um único motion (`src/DeviceShowcase.jsx`) e um arquivo por site em `src/sites/`, com os trechos da gravação, as cores e o estilo da trilha. No build, `./sites/current` é trocado pelo arquivo de cada site, gerando `dist/<site>-apresentacao.html` (preview, precisa de `dist/media/` ao lado).

Para um novo site: grave a tela, escolha um trecho por plano (3,333s cada), gere `dist/media/<site>-site.webm/.mp4` com ffmpeg (ver comentário nos arquivos de `src/sites/`), crie `src/sites/<site>.js` copiando um existente e adicione uma linha em `ENTRIES` de `scripts/build-html.mjs`.

### Noka Arquitetura e Engenharia

- Gravação: `Noka Arquitetura e Engenharia _ Arquiteto em Petrópolis e Itaipava - Opera 2026-10-07 22-39-57 (1).mp4`. 6 planos: 4,2s (logo NOKA → hero) · 15,2s ("Tudo o que sua obra precisa") · 21,0s ("Projetos que saíram do papel") · 26,0s ("Cinco etapas") · 31,3s ("Histórias que contamos com orgulho" / Casa Secretário) · 43,0s (Instagram → "Vamos conversar" → NOKA do rodapé).
- Tema grafite com contorno das esferas no terracota do site (`#BF624E`).
- Trilha "elegante" (Dadd9 · Gmaj7 · Bm7 · Em9): sem bateria, sub longo e sino a cada dois tempos, combinando com a serifa e o clima de arquitetura.

### LCS Transporte e Turismo

- Gravação: `LCS Transporte Turismo _ Transporte Executivo e Fretamento Premium - Opera 2026-10-07 22-26-41.mp4`. 5 planos: 8,6s (logo) · 11,7s (hero) · 15,03s (frota de vans) · 18,36s (carros → "Por que escolher a LCS?") · 21,69s ("Como reservar" → chamada final → rodapé). Começa no logo, então o loop fecha.
- Tema verde: contorno das esferas no verde-sálvia do site (`#84A892`), esferas e fundo em verde-escuro.
- Trilha "premium" (Gmaj7 · Em7 · Cmaj7 · D): bumbo suave a cada dois tempos, arpejo de sino e whoosh em cada corte.

### Misú Culinária Oriental

Baseado na referência `c24dcfc9f7c5d0463893f71a972aab76.mp4`: tablet flutuando em 3D sobre fundo escuro com esferas brilhantes desfocadas, o site passando seção a seção e o aparelho girando entre os planos.

- Conteúdo da tela: trechos da gravação de tela do site (`Misú Culinária Oriental … Opera 2026-10-07 22-06-05 (1).mp4`), cortados em 6 planos de 3,333s e concatenados em `dist/media/misu-site.webm` / `.mp4` (960×540). Trechos da gravação: 8,2s (abertura com o logo) · 15,3s (Fartura de verdade) · 24,6s (Gira o prato) · 31,6s (O mais pedido da casa) · 37,6s (Uma noite oriental) · 45,3s (Reserve sua mesa → rodapé). Começa e termina no logo MISÚ, então o loop fecha.
- Os cortes caem no meio do giro do aparelho, escondidos pelo motion blur e por uma esfera de primeiro plano que cruza a tela.
- Esferas com contorno de luz no vermelho da Misú (`#B80C1D`); legenda "Projeto / Misú Culinária Oriental / Rodízio japonês em Petrópolis" no primeiro plano.
- Trilha em escala japonesa (Mi, Fá, Lá, Si, Dó): taiko em 3-3-2, koto em arpejo e whoosh em cada corte. Cada plano dura 8 tempos.
- O vídeo da tela acompanha a timeline: no player corrige a deriva e pausa junto; na exportação busca o quadro exato de cada instante.
- Os `.artifact.jsx` das apresentações referenciam `media/`, então não funcionam sozinhos num Artifact React; use o HTML com a pasta `media/`.
- Também há o modo imagem: `node scripts/capture-site.cjs <url> <site> "Nome"` captura um print de página inteira que rola dentro do tablet. Sites com animação de entrada ao rolar podem sair com seções em branco; nesse caso use a gravação de tela.

## Carrossel Padrão Portfólio

Releitura do projeto OpenShot `01_Carrossel_Padrao_Portfolio.zip`, mantendo a estrutura original: cubo de cristal fixo no centro, 9 clientes em órbita 3D e 1 segundo de destaque por cliente, na ordem dos marcadores do projeto (Ruppel, Arteiro, Dizzy, Kaiirós, K Dust, LCS, Vicente, Yuri Miguez, OP Studio's).

- Movimento "passo e pausa": giro de 40° com overshoot (0,6s) e pausa para ler o logo (0,4s). Nove passos fecham 360°, então o último quadro emenda no primeiro.
- Profundidade: escala, brilho e desfoque (profundidade de campo) pela posição na órbita; reflexo no chão para os logos da frente; anel ciano girando e brilho varrendo o logo que chega à frente.
- Cubo central com raios de luz e brilho que pulsa a cada chegada.
- Nome do cliente com revelação por máscara, segmento, contador 01/09 e a frase "Sua marca pode ser a próxima."
- Trilha em loop de 9s a 120 BPM (um cliente a cada dois tempos), whoosh a cada giro e uma nota de sino por chegada. O WAV é renderizado em dois ciclos e usa o segundo, para o áudio também emendar sem corte.
- Para trocar clientes: edite `CLIENTS` em `src/PortfolioCarousel.jsx`, coloque o logo (círculo, PNG/WebP) em `assets/clients/`, adicione o id na lista de `scripts/build-assets.mjs` e ajuste `DURATION` para o número de clientes.

---

# Promo 9:16

Vídeo promocional vertical (Reels/TikTok, 40s) para a venda de sites e lojas virtuais.

- `dist/EstokeAoCuboPromo.artifact.jsx`: arquivo único, com fontes e logo embutidos. Cole direto num Claude Artifact (React).
- `dist/estoke-ao-cubo-reels.mp4`: o vídeo final, 1080×1920, 30fps, H.264 + AAC, pronto para postar.
- `dist/estoke-ao-cubo.html`: preview standalone (React UMD + Babel via CDN).
- Depois de editar qualquer motion, rode `node scripts/build-assets.mjs` (se mudou algo em `assets/`) e `node scripts/build-html.mjs`. Os dois motions saem como `dist/<Nome>.artifact.jsx` (arquivo único para Claude Artifact) e `dist/<nome>.html`.

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
node scripts/export-video.cjs dist/estoke-ao-cubo.html dist/estoke-ao-cubo-reels.mp4 30
node scripts/export-video.cjs dist/portfolio-carrossel.html dist/portfolio-carrossel-9x16.mp4 60 9x16
node scripts/export-video.cjs dist/portfolio-carrossel.html dist/portfolio-carrossel-4x5.mp4 60 4x5
node scripts/export-video.cjs dist/misu-apresentacao.html dist/misu-apresentacao-9x16.mp4 30 9x16
node scripts/export-video.cjs dist/misu-apresentacao.html dist/misu-apresentacao-4x5.mp4 30 4x5
node scripts/export-video.cjs dist/lcs-apresentacao.html dist/lcs-apresentacao-9x16.mp4 30 9x16
node scripts/export-video.cjs dist/lcs-apresentacao.html dist/lcs-apresentacao-4x5.mp4 30 4x5
node scripts/export-video.cjs dist/noka-apresentacao.html dist/noka-apresentacao-9x16.mp4 30 9x16
node scripts/export-video.cjs dist/noka-apresentacao.html dist/noka-apresentacao-4x5.mp4 30 4x5
```

O script captura cada quadro seguindo a timeline (1080 de largura) e junta com a trilha renderizada offline.

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
