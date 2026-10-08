# Estoke ao Cubo — Motions

Motions em React para a Estoke ao Cubo, com timeline determinística, som sintetizado e exportação para MP4.

| Motion | Duração | Formatos | Fonte | Vídeos |
|---|---|---|---|---|
| Promo (venda de sites e lojas) | 40s | 9:16 | `src/EstokeAoCuboPromo.jsx` | `dist/estoke-ao-cubo-reels.mp4` |
| Carrossel Padrão Portfólio | 9s, loop perfeito | 9:16 e 4:5 | `src/PortfolioCarousel.jsx` | `dist/portfolio-carrossel-9x16.mp4`, `dist/portfolio-carrossel-4x5.mp4` |
| Reel de portfólio no monitor | 8s, loop | 9:16 e 4:5 | `src/MonitorReel.jsx` | `dist/reel-portfolio-9x16.mp4`, `dist/reel-portfolio-4x5.mp4` |
| Reel editorial "Sites que transformam visitas em vendas." | 14s, loop | 3:4 e 9:16 | `src/EditorialReel.jsx` | `dist/reel-editorial-3x4.mp4`, `dist/reel-editorial-9x16.mp4` |
| SaaS Gestão de Estoque | 52s + corte de 21s | 9:16 e 4:5 | `src/InventorySaaS.jsx` + `src/saas/` | `dist/saas-estoque-9x16.mp4`, `dist/saas-estoque-4x5.mp4`, `dist/saas-estoque-curto-9x16.mp4`, `dist/saas-estoque-curto-4x5.mp4` |
| Pasta "Nossos clientes" | 5,2s, loop | 9:16 e 4:5 | `src/FolderReveal.jsx` | `dist/pasta-clientes-9x16.mp4`, `dist/pasta-clientes-4x5.mp4` |
| Apresentação de site: Misú | 20s, loop perfeito | 9:16 e 4:5 | `src/DeviceShowcase.jsx` + `src/sites/misu.js` | `dist/misu-apresentacao-9x16.mp4`, `dist/misu-apresentacao-4x5.mp4` |
| Apresentação de site: LCS | 16,7s, loop perfeito | 9:16 e 4:5 | `src/DeviceShowcase.jsx` + `src/sites/lcs.js` | `dist/lcs-apresentacao-9x16.mp4`, `dist/lcs-apresentacao-4x5.mp4` |
| Apresentação de site: Noka | 20s, loop perfeito | 9:16 e 4:5 | `src/DeviceShowcase.jsx` + `src/sites/noka.js` | `dist/noka-apresentacao-9x16.mp4`, `dist/noka-apresentacao-4x5.mp4` |
| Apresentação de site: Dizzy | 16,7s, loop perfeito | 9:16 e 4:5 | `src/DeviceShowcase.jsx` + `src/sites/dizzy.js` | `dist/dizzy-apresentacao-9x16.mp4`, `dist/dizzy-apresentacao-4x5.mp4` |

`src/motionKit.js` reúne o que o carrossel usa: molas e easings, tokens e fontes da marca, grão e feixes de luz, síntese de áudio, render offline da trilha e o player com troca de formato. (O promo ainda tem suas próprias cópias dessas peças.)

## SaaS Gestão de Estoque (InventorySaaS)

Motion de produto (prompt mestre "Vídeo Motion Graphics SaaS - Sistema de Gestão de Estoque"), estética Apple/Linear com a identidade da Estoke ao Cubo: ícones 3D soft-matte desenhados em SVG (extrusão + luz especular), UI em glassmorphism, fundos alternando navy/preto e claro, feixes de luz azul e ciano, grão, títulos em Monument e textos em Open Sauce.

Duas versões do mesmo código (`src/saas/variant.js` escolhe):
- **Completa (52s)**: `dist/saas-estoque.html`.
- **Corte curto (21s)** para Reels/anúncios: `dist/saas-estoque-curto.html`, montado com trechos da timeline completa listados em `src/saas/cut.js` (gancho, cubo, dashboard, automação, logo + CTA), todos em tempo de batida; a trilha é a da versão completa recortada nos mesmos pontos.

Ritmo: as cenas são desenhadas numa timeline de 39,5s ("história") e reproduzidas com uma curva de velocidade (`PACE`): trechos de leitura a 0,6–0,75× e transições a 1×, para todo texto ficar pelo menos ~1,5s parado na tela. A música é gerada direto no tempo final (120 BPM constantes); os efeitos seguem a curva.

Roteiro (tempos da história; no vídeo final cada trecho fica ~1,3× mais longo):
- **0–2s Gancho**: alerta e contador "−R$ 18.240 em vendas perdidas por falta de estoque" + "Cada ruptura é uma venda perdida."
- **2–7s Do caos ao cubo**: planilhas, caixas, códigos de barras e notas flutuam inclinando em 3D e são sugados em espiral para dentro do cubo de vidro da logo, que pulsa e abre como portal. Texto: "Transforme o estoque bagunçado em um sistema fluido."
- **7–14s Módulos**: o cubo vira um prisma 3D com a logo no topo; cada face é um módulo (Compras, Armazém, Vendas, Logística), com paradas elásticas, brilho de vidro na face ativa e rastro de movimento no giro. Texto: "Compras, Armazém, Vendas e Logística. Tudo em um só lugar."
- **14–22s Dashboard**: zoom na face vira a tela do monitor; o painel "Nível de Estoque e Giro em Tempo Real" se descola com gráfico e contador; flutuam "✦ Controle", "✦ Previsão", "✦ Escala"; no 9:16, notificações sobem embaixo do monitor.
- **22–30s Automação**: linha liga os processos, mão 3D liga "Reposição Automática" e arrasta o pedido; estoque baixo → NF-e emitida → equipe atualizada. Texto: "Zere as rupturas. Automatize pedidos e acompanhe cada item em tempo real." Sai em persianas no ritmo.
- **30–34s Segurança**: cadeado fecha com ondas e se divide em barras de crescimento.
- **34–39,5s Logo + CTA**: digitação de "Estoke ao Cubo" e "Transforme complexidade em controle.", botão "Agende uma demonstração" tocado pela mão 3D.
- Som: 120 BPM em Dó (I–V–vi–IV); assinatura sonora do cubo ("plim" de vidro) sempre que ele aparece; cada ação tem efeito próprio.
- Exportado em 60fps, trilha normalizada em -14 LUFS.

## Pasta "Nossos clientes" (FolderReveal)

Baseado na referência `2bd63997cba454b2744b6f348a45040d (1).mp4` (commit "Use as logos do carrosel pra gerar o seguinte video"): pasta azul estilo macOS em fundo preto, cursor pousa e clica, um cone de luz colorida sai da pasta, os itens voam e flutuam no feixe, depois caem de volta e o feixe se fecha. Os itens são os 9 logos de clientes do carrossel.

- Tempo fiel à referência (clique em 0,95s, feixe em 1,85s, volta e fechamento no fim); a parada com os logos é 0,6s mais longa (loop de 5,2s) para dar tempo de ler as marcas.
- Feixe em 4 raios com gradientes rosa/amarelo/azul/vermelho correndo para cima, bloom e véu de luz; abre com mola e fecha estreitando até virar um traço.
- Logos saem em arco com escalonamento, flutuam e giram levemente, e caem de volta em ordem inversa; a pasta "pula" na abertura e no fechamento.
- Som seguindo o desenho da referência (medido por envelope e brilho espectral): sopro do cursor, silêncio, clique e a música entra (128 BPM, com pad contínua), grave + whoosh na abertura, "pings" na saída dos logos, sparkle subindo na volta e decaimento curto.
- Exportado em 60fps.

## Reel editorial (EditorialReel)

Baseado na referência `480b5a3c102f16d5e0f18163fff49041_720w.mp4` (commit "New Motion"): fundo cinza-claro, tipografia grande, telas de sites piscando, card de página em destaque e coluna de telas subindo. As telas da referência foram trocadas pelas dos nossos projetos e o texto pelo foco em venda de site, terminando com o logo e a fonte da marca.

- 0–3s: abertura com um único navegador mostrando três sites ao vivo (Misú hero → LCS rolando até a frota → Noka hero), com deslizes de 0,25s no tempo da batida (1,0s e 2,0s), motion blur no deslize e a legenda de cada cliente; o card sai suave para a frase entrar · 3–7s: "Sites que transformam visitas em vendas." letra por letra (Open Sauce Sans) · 7–11s: grade 2×2 com os quatro sites rodando ao vivo (Misú · Restaurante japonês, LCS · Transporte executivo, Noka · Arquitetura e engenharia, Dizzy · Streetwear), que sai pelo topo · 12–14s: logo (cubo + Archivo larga), "Sites e lojas virtuais que vendem." e "Solicite seu orçamento →".
- Histórico: a v1 travava (card com a moeda da Dizzy, cuja gravação perde quadros) e repetia no meio a sequência do começo; a v2 trocou o meio pela grade; a v3 trocou a abertura de prints piscando, pilha e coluna (confusa) pelo navegador único. Os trechos de vídeo foram escolhidos por medição quadro a quadro (~29 quadros únicos/s); na grade, a Dizzy junta os dois trechos lisos da gravação, a moeda 3D girando (6,1s) e a rolagem do catálogo (29,1s), com um deslize entre eles, porque a gravação não tem 3,8s seguidos sem travar.
- Mídia: `dist/media/editorial/opening.*` (abertura, 3s) e `dist/media/editorial/grid.*` (grade 2×2 recortada em quatro cards, 3,8s).
- Som: pulso nas partes rápidas, whoosh na entrada e saída do card, whoosh + "pop" em cada deslize, um toque por palavra da frase, um "pop" por card da grade e acorde no logo.
- Formatos 3:4 (o da referência e do grid do Instagram, 1080×1440) e 9:16.

## Reel de portfólio no monitor (MonitorReel)

Baseado na referência `2072e941c9e055b17fd31f443fcd863b_720w.mp4`: monitor numa mesa escura, parede de ripas iluminada na cor do site que está na tela, cortes rápidos e uma parada final num site de destaque.

- Tela: `dist/media/reel-sites.webm` / `.mp4`, um trecho por site, sem repetição, escolhido onde a gravação está lisa e a página em movimento: Dizzy (moeda 3D, 6,75s) · LCS (rolagem até a frota, 14,0s) · Noka (projetos, 22,7s), com transições deslizantes de 0,25s (xfade slideup), destaque de 2,9s no prato girando da Misú (24,1s) e 1,5s escuro onde o componente desenha o cartão final da Estoke ("Seu site pode ser o próximo.").
- Por que esses trechos: a gravação da Dizzy perde quadros nas partes mais pesadas (até 0,6s congelado), então a parada longa saiu dela e foi para a Misú (30 quadros únicos/s). As medições estão no histórico do commit.
- A luz da parede troca de cor em cada troca de site (vermelho Dizzy, verde LCS, terracota Noka, vermelho Misú, azul Estoke), com flash; motion blur vertical durante o deslize; câmera na mão periódica no loop, aproximação lenta e "soco" de zoom em cada troca; teclado RGB desfocado em primeiro plano.
- Trilha a 100 BPM (tempo = 0,6s): as trocas caem nos tempos 2, 4 e 6 com whoosh, riser até o destaque, drop com impacto e shimmer em 3,6s e acorde final no cartão da Estoke.
- Exportado em 60fps.

## Apresentações de site (DeviceShowcase)

Um único motion (`src/DeviceShowcase.jsx`) e um arquivo por site em `src/sites/`, com os trechos da gravação, as cores e o estilo da trilha. No build, `./sites/current` é trocado pelo arquivo de cada site, gerando `dist/<site>-apresentacao.html` (preview, precisa de `dist/media/` ao lado).

Para um novo site: grave a tela, escolha um trecho por plano (3,333s cada), gere `dist/media/<site>-site.webm/.mp4` com ffmpeg (ver comentário nos arquivos de `src/sites/`), crie `src/sites/<site>.js` copiando um existente e adicione uma linha em `ENTRIES` de `scripts/build-html.mjs`.

### Dizzy House Studio

- Gravação: `Dizzy House Studio _ Tattoo & Dizzy Shop - Opera 2026-10-07 22-45-59.mp4`. 5 planos: 5,5s (moeda 3D + ENTER) · 14,0s ("Dizzy House Shop") · 19,5s (Dizzy Universe 3D) · 25,8s (catálogo) · 31,8s (produtos → Dizzy Menu). A seção de tattoo aparece como "Em construção" na gravação e ficou de fora.
- Tema preto com contorno das esferas no vermelho neon do site (`#E00000`).
- Trilha "hiphop" (type beat boom bap): cada plano é um compasso de 16 semicolcheias a 72 BPM com swing; bumbo seco com sub acompanhando, caixa no 2 e no 4 com ghost note, hi-hats suingados e hi-hat aberto no fim, Rhodes com tremolo (Am9 · Dm9 · Fmaj7 · E7(#9)), melodia de sino esparsa e chiado de vinil. (O estilo "street", trap com 808, continua disponível.)

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
node scripts/export-video.cjs dist/dizzy-apresentacao.html dist/dizzy-apresentacao-9x16.mp4 30 9x16
node scripts/export-video.cjs dist/dizzy-apresentacao.html dist/dizzy-apresentacao-4x5.mp4 30 4x5
node scripts/export-video.cjs dist/reel-monitor.html dist/reel-portfolio-9x16.mp4 60 9x16
node scripts/export-video.cjs dist/reel-monitor.html dist/reel-portfolio-4x5.mp4 60 4x5
node scripts/export-video.cjs dist/reel-editorial.html dist/reel-editorial-3x4.mp4 60 3x4
node scripts/export-video.cjs dist/reel-editorial.html dist/reel-editorial-9x16.mp4 60 9x16
node scripts/export-video.cjs dist/pasta-clientes.html dist/pasta-clientes-9x16.mp4 60 9x16
node scripts/export-video.cjs dist/pasta-clientes.html dist/pasta-clientes-4x5.mp4 60 4x5
node scripts/export-video.cjs dist/saas-estoque.html dist/saas-estoque-9x16.mp4 60 9x16
node scripts/export-video.cjs dist/saas-estoque.html dist/saas-estoque-4x5.mp4 60 4x5
node scripts/export-video.cjs dist/saas-estoque-curto.html dist/saas-estoque-curto-9x16.mp4 60 9x16
node scripts/export-video.cjs dist/saas-estoque-curto.html dist/saas-estoque-curto-4x5.mp4 60 4x5
```

O script captura cada quadro seguindo a timeline (1080 de largura) e junta com a trilha renderizada offline, normalizada em -14 LUFS / -1,5 dBTP (padrão de Instagram, TikTok e YouTube).

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
