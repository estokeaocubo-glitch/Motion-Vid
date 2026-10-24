# Estoke ao Cubo — Motions

Motions em React para a Estoke ao Cubo, com timeline determinística, som sintetizado e exportação para MP4.

| Motion | Duração | Formatos | Fonte | Vídeos |
|---|---|---|---|---|
| Promo (venda de sites e lojas) | 40s | 9:16 | `src/EstokeAoCuboPromo.jsx` | `dist/estoke-ao-cubo-reels.mp4` |
| Carrossel Padrão Portfólio | 9s, loop perfeito | 9:16 e 4:5 | `src/PortfolioCarousel.jsx` | `dist/portfolio-carrossel-9x16.mp4`, `dist/portfolio-carrossel-4x5.mp4` |
| Reel de portfólio no monitor | 8s, loop | 9:16 e 4:5 | `src/MonitorReel.jsx` | `dist/reel-portfolio-9x16.mp4`, `dist/reel-portfolio-4x5.mp4` |
| Reel editorial "Sites que transformam visitas em vendas." | 14s, loop | 3:4 e 9:16 | `src/EditorialReel.jsx` | `dist/reel-editorial-3x4.mp4`, `dist/reel-editorial-9x16.mp4` |
| Roda Cultural do CDC: navegação no site com zoom e efeitos | 22,5s | 16:9 e 9:16 | `roda-cultural/edit.py` (captura no zip da raiz) | `dist/roda-cultural-site-16x9.mp4`, `dist/roda-cultural-site-9x16.mp4` |
| "WhatsApp no automático" (UI motion, 3 opções de texto) | 9,2s | 16:9 e 9:16 | `src/AutoPilotAd.jsx` + `src/autopilot/` | `dist/whatsapp-automatico-opcao{1,2,3}-16x9.mp4`, `dist/whatsapp-automatico-opcao{1,2,3}-9x16.mp4` |
| "Venda 24h" (só tipografia, 3 opções de texto) | 9,5s | 9:16 | `src/WordsAd.jsx` + `src/words/` | `dist/venda-24h-opcao1-9x16.mp4`, `dist/venda-24h-opcao2-9x16.mp4`, `dist/venda-24h-opcao3-9x16.mp4` |
| "Site é oxigênio" (Reels narrado) | 55,2s | 9:16 | `src/OxigenioAd.jsx` + `src/oxi/` | `dist/site-oxigenio-9x16.mp4` |
| "dev / tools / site" (três faixas) | 11,4s | Story 9:16 e 3:4 | `src/ToolsReveal.jsx` | `dist/dev-tools-site-9x16.mp4`, `dist/dev-tools-site-3x4.mp4` |
| "Amplie seu alcance" (anúncio de sites) | 31s | 16:9 e 9:16 | `src/ReachAd.jsx` | `dist/anuncio-alcance-16x9.mp4`, `dist/anuncio-alcance-9x16.mp4` |
| Anúncio de sites (tipografia cinética) | 32s | 16:9 e 9:16 | `src/SiteAd.jsx` | `dist/anuncio-sites-16x9.mp4`, `dist/anuncio-sites-9x16.mp4` |
| "Venda no automático" (fluxo → projetos → cubo) | 18s | 16:9, 9:16 e Story | `src/FlowReveal.jsx` + `src/flow/` | `dist/fluxo-automatico-16x9.mp4`, `dist/fluxo-automatico-9x16.mp4`, `dist/fluxo-automatico-story.mp4` |
| SaaS Gestão de Estoque | 52s + corte de 21s | 9:16 e 4:5 | `src/InventorySaaS.jsx` + `src/saas/` | `dist/saas-estoque-9x16.mp4`, `dist/saas-estoque-4x5.mp4`, `dist/saas-estoque-curto-9x16.mp4`, `dist/saas-estoque-curto-4x5.mp4` |
| Pasta "Nossos clientes" | 5,2s, loop | 9:16 e 4:5 | `src/FolderReveal.jsx` | `dist/pasta-clientes-9x16.mp4`, `dist/pasta-clientes-4x5.mp4` |
| Apresentação de site: Misú | 20s, loop perfeito | 9:16 e 4:5 | `src/DeviceShowcase.jsx` + `src/sites/misu.js` | `dist/misu-apresentacao-9x16.mp4`, `dist/misu-apresentacao-4x5.mp4` |
| Apresentação de site: LCS | 16,7s, loop perfeito | 9:16 e 4:5 | `src/DeviceShowcase.jsx` + `src/sites/lcs.js` | `dist/lcs-apresentacao-9x16.mp4`, `dist/lcs-apresentacao-4x5.mp4` |
| Apresentação de site: Noka | 20s, loop perfeito | 9:16 e 4:5 | `src/DeviceShowcase.jsx` + `src/sites/noka.js` | `dist/noka-apresentacao-9x16.mp4`, `dist/noka-apresentacao-4x5.mp4` |
| Apresentação de site: Dizzy | 16,7s, loop perfeito | 9:16 e 4:5 | `src/DeviceShowcase.jsx` + `src/sites/dizzy.js` | `dist/dizzy-apresentacao-9x16.mp4`, `dist/dizzy-apresentacao-4x5.mp4` |

Biblioteca do **Emoji Primordial 3D** (36 feições, 12 animações, documentação e engine): ver [`EMOJI_PRIMORDIAL/README.md`](EMOJI_PRIMORDIAL/README.md).
Trailer da Temporada 1 em HyperFrames ("Perder um cliente e nem perceber"): ver [`trailer-temporada1/`](trailer-temporada1/).

`src/motionKit.js` reúne o que o carrossel usa: molas e easings, tokens e fontes da marca, grão e feixes de luz, síntese de áudio, render offline da trilha e o player com troca de formato. (O promo ainda tem suas próprias cópias dessas peças.)

## Posts do Instagram (`posts-insta/`)

São 8 posts estáticos em 4:5 (1080×1350), seguindo as referências: produto em fundo claro, ciclo em azul escuro, card de dados em vidro, camadas de vidro e lançamento de site num notebook. Só aparecem os sites da Dizzy, LCS, Arteiro, K-Dust, Ruppel e Kairós. Os prints da Ruppel e da Arteiro foram tirados dos sites no ar (páginas de lançamento). Os emojis são as feições do Emoji Primordial (o rosto da Estoke ao Cubo) em **SVG com contorno vetorial**, geradas por `posts-insta/cutout_faces.py` em `posts-insta/img/face/`. O recorte de origem tem o maxilar serrilhado e pontinhos claros no contorno, então cada feição vira um traçado Bézier suave do formato do rosto (usado como máscara) sobre a imagem 3D com a faixa da borda limpa. A borda fica nítida em qualquer tamanho e não deixa fio nem ponto branco. O script precisa de `scikit-image`. Entram só as feições de frente; as de ângulo, as de olhos fechados ou piscando (06, 07 e 08) e a 36 (lista "Não usar") ficam de fora.

1. `01-site-de-cara-nova`: "Seu negócio merece um site de cara nova!", com a LCS no notebook.
2. `02-combo-que-vende`: "O combo que vende!", com a loja da Dizzy, o selo de vidro "24h" e o rosto em "estrategista".
3. `03-acontece-com-todo-mundo`: o ciclo "Sem site → Cliente não te acha → Venda perdida", e a Estoke ao Cubo resolve.
4. `04-vendendo-24-7`: o card "Seu site vendendo 24/7", com o pedido às 03:15, o rosto surpreso e o sorrindo.
5. `05-sites-que-vendem`: "Sites que vendem de verdade", com Kairós, Dizzy e K-Dust em camadas de vidro.
6. `06-feitos-pela-estoke`: o portfólio com Dizzy, LCS, Arteiro, K-Dust, Ruppel e Kairós.
7. `07-ruppel-rompa-o-padrao`: "O site da Ruppel tá na contagem regressiva!".
8. `08-arteiro-em-breve`: "Algo especial vem aí", a loja online da Arteiro.

Os posts ficam em `posts-insta/posts.html` e são gerados com `NODE_PATH=/opt/node22/lib/node_modules node posts-insta/render.cjs`, que grava os PNGs em `posts-insta/out/`.

## Roda Cultural do CDC: navegação no site (`roda-cultural/edit.py`)

Edição dinâmica da gravação de tela do site (o zip "Roda Cultural do CDC … .zip" na raiz). É feita em Python e ffmpeg, direto sobre a captura em 1080p.

- **Rolagem:** as paradas da gravação passam a 6× e a rolagem a cerca de 1,6×, com motion blur e um whoosh por trecho.
- **Zoom por seção:** cada seção recebe um zoom com punch, um flash leve e uma tremida. Hall da Fama e Galeria ganham um pan. O card "Estoke ao Cubo · Patrocínio do Site" e o crédito do rodapé ganham um segundo zoom com brilho.
- **Batida:** a trilha é o beat "DISTANCE" a partir da volta do beat (67,28s), que cai na primeira rolagem. As rolagens são esticadas ou encolhidas para que cada zoom comece num kick.
- **Fim:** um rewind de fita volta do rodapé ao topo e fecha com o card "site por Estoke ao Cubo".
- **9:16:** o quadro 16:9 fica no meio, com fundo desfocado, "RODA CULTURAL DO CDC" em cima e o crédito embaixo.
- **Como gerar:** `python3 roda-cultural/edit.py`. O script baixa os efeitos da Mixkit e grava os dois MP4s em `dist/`.

## "WhatsApp no automático" (AutoPilotAd)

Feito a partir do vídeo "Auto Pilot": interface limpa com vidro fosco, que vende pela tranquilidade em vez da urgência.

- **Abertura:** o cursor liga a chave, que fica verde WhatsApp e mostra "ON".
- **Lista e cards:** a lista da esquerda acende um item por vez, e a bolinha colorida desce. Na direita, um card de vidro prova cada função e é trocado de baixo para cima:
  - conversa respondida na hora
  - cliente recuperado (ou dúvida tirada, na opção 2)
  - agenda de horários confirmados
  - madrugada, com pedidos via PIX subindo e a régua de horário passando por 01:00 a 05:00
- **Fim:** a câmera avança e desfoca, como na referência. Fecha com a chave ON, a frase da opção e a logo.
- **Três textos, mesmo componente:**
  - `src/autopilot/v1.js`, direta: "Piloto automático" → Responde clientes / Fecha vendas / Agenda horários / 24/7
  - `src/autopilot/v2.js`, curta: "Seu WhatsApp no automático" → Responde clientes / Tira dúvidas / Agenda e vende / 24/7 sem pausas
  - `src/autopilot/v3.js`, dor e solução: "Chega de perder cliente no vácuo." → Atende na hora / Faz follow-up / Agenda sozinho / 24h por dia
- **Áudio e tempos:** o áudio original da referência (`auto-pilot (audio original).m4a`), com os tempos medidos quadro a quadro na própria referência: clique em 0,24–0,44s, itens em 1,0 / 2,9 / 4,85 / 6,65s e saída em 8,0s.

## "Venda 24h" (WordsAd)

Feito a partir do vídeo "we don't just edit": só tipografia, de 1 a 3 palavras por tela.

- **Ritmo e corte:** corte seco na batida e fundo invertendo entre branco e preto. A palavra anterior fica pequena, alinhada à esquerda, em cima da nova.
- **Virada:** aos 2,0s, gigante no preto, com glitch.
- **Fim:** "estoke ao cubo." digitado letra a letra, alternando o fundo. Fecha no branco, com a logo e "sites e lojas virtuais que vendem 24h".
- **Três roteiros, mesmo componente:**
  - `src/words/v1.js`, fiel à ideia: "difícil / vender / das 8h às 18h? → seu site / vende / 24 horas / por dia. / até / enquanto / você / dorme."
  - `src/words/v2.js`, manifesto: "sua loja / fecha / às 18h. → seu cliente não. / catálogo. / pagamentos. / automação. / venda 24/7 / com um site."
  - `src/words/v3.js`, contraste: "das 8h às 18h / você trabalha. → das 18h às 8h / seu site / vende. / tenha sua / vitrine / 24h."
- **Áudio e cortes:** o áudio original do vídeo de referência (`venda-24h (audio original).m4a`). Os 18 cortes de palavra, os 4 da digitação e o quadro final usam exatamente os tempos da referência, medidos quadro a quadro pelas trocas de fundo: a virada fica em 2,0s, o glitch em 3,03s e o final em 8,9s.

## "Site é oxigênio" (OxigenioAd)

Reels narrado (voz ElevenLabs, `VO - Voce gasta horas gravando Reels (ElevenLabs).mp3`), com tudo sincronizado com a fala.
Os tempos de cada palavra saem da transcrição com faster-whisper, revisada à mão, em `src/oxi/captions.js`.

- **Legendas cinéticas:** cada palavra entra na hora em que é falada, com os destaques em ciano (fundo escuro) ou azul (fundo claro). "NADA.", "EM PLENO 2026" e "SAI DO AMADORISMO." viram tipografia gigante com impacto.
- **0–10,7s, o gancho:** celular gravando Reels, com o cronômetro em horas. Depois o feed com fotos subindo, o story com filtro de cachorrinho balançando a orelha e a busca "minha loja petrópolis", que termina em "Nenhum resultado encontrado", com grilos.
- **10,7–22,9s, a ironia:** o direct com "Qual o valor?" e "Mandei no direct", e "EM PLENO 2026" com tremor. Em seguida o cliente digitando, "visto há 3 h", "Deixa, comprei em outra loja." e "cliente saiu da conversa".
- **23–41,4s, a solução (visual claro):**
  - O site surgindo e as bolhas de O₂.
  - O robô vendedor carimbando pedidos "PAGO", o relógio 24H acelerado e a lista riscada "sem CLT / folga / vácuo".
  - A jornada de compra: entra, catálogo, dúvida no chat, cartão na maquininha "APROVADO", "Comprar agora", confete e "Nova venda!".
  - Metade da tela com o site vendendo de madrugada, metade com você dormindo (lua e "Zzz").
- **41,4–55,2s, o CTA:**
  - "Loja do Zé!!!" amadora, com teia e preço só no direct, contra o concorrente bonito, com as vendas indo para ele.
  - A virada para "Sua loja ✓", com o carimbo PRO.
  - O perfil com "LINK NA BIO", a mãozinha no comentário com "EU QUERO" pulsando, a logo e "SAI DO AMADORISMO.".
- **Protagonista:** um personagem genérico, uma bola escura brilhante de borda iridescente (roxo e ciano), com olhos de traço e brilhinhos em volta. Ele é desenhado no próprio componente (`Orb`) e reage à narração.
  - Fala dentro do Reels, ganha o filtro de cachorrinho e diz "não" no "NADA.".
  - Revira os olhos no direct, olha de lado no "2026", fica entediado esperando e acena feliz no "oxigênio".
  - Dorme no travesseiro, pula no "EU QUERO", sorri na logo e pisca no final.
  - A foto do perfil no "Link na bio" é a logo da Estoke ao Cubo.
- **Objetos 3D:** vêm do Fluent Emoji da Microsoft (licença MIT): robô, relógio, moedas, cartão, saco de dinheiro, estourador de festa, sino, lua, Zzz, grilo, teia, lupa, ampulheta, câmera, X e a mãozinha.
- **Profundidade:** celulares, navegador e maquininha aparecem inclinados em 3D, com espessura e reflexo.
- **Som:** narração por cima de tudo e a trilha "DISTANCE" baixa por baixo.
  - A trilha some no "Nada." (só os grilos) e baixa no "Em pleno 2026".
  - Efeitos em cada ação: obturador, digitação, cliques, pops do direct, impactos, carimbos, tique-taque, moedas da venda, corneta do confete, ronco e sininhos de venda.
  - Os efeitos novos vêm da Mixkit e ficam num módulo separado: `src/audio/sfxVo.js`.

## "dev / tools / site" (ToolsReveal)

Refeito a partir do vídeo "artist / tools / art", agora para programação, pensado para story:

- **0–3,78s** tela branca dividida em três faixas; "dev", "tools" e "site" aparecem um a um (0,75 · 1,5 · 2,25s).
- **3,78s (beat volta)** as três faixas viram vídeo juntas, com os nomes no canto:
  - **dev**: a foto do programador no espelho da Dizzy (`assets/dev-foto.jpg`, recortada sem a moldura do espelho), preenchendo a largura da faixa (da cabeça à cintura), com avanço lento e um leve "soco" de zoom a cada quatro batidas.
  - **tools**: animação própria em neon — Pinterest, Python, Java, GitHub e Antigravity atravessando a câmera (um a cada duas batidas), com profundidade, rastros de velocidade, desfoque de movimento e o fundo tingido pela cor do ícone; a partir de 8,36s as cinco lado a lado, uma acendendo por batida e todas juntas no fim.
  - **site**: Misú (hero com os sushis), Dizzy (moeda 3D), LCS (hero com a van) e Trama (print), nessa ordem, trocando a cada quatro batidas.
- Nomes das faixas no canto de cima, só com sombra no texto; sem logo nem assinatura.
- Som: a música do vídeo de referência (`dev-tools-site (audio original).m4a`), inteira e no tempo original — 137,6 BPM, beat voltando em 3,78s; todos os cortes caem nessa grade.
- Vídeos e print: `src/toolsAssets.js`, gerado por `bash scripts/build-tools-assets.sh`. Ícones: traços do Simple Icons (Python, GitHub, Pinterest), Devicon (Java) e Lobe Icons (Antigravity), embutidos no componente.

## "Amplie seu alcance" (ReachAd)

Baseado no anúncio Freepik → Magnific enviado como referência, refeito para vender sites com as telas dos 9 sites que fizemos:

- **0–2s** pilhas de sites caindo em 3D (topo e rodapé): "nós" · "criamos" · "sites".
- **2–4,4s** anel 3D de sites girando: "pra você" · "crescer.".
- **4,4–7,3s** fundo navy: "AMPLIE SEU ALCANCE" cresce, as palavras se abrem e os sites explodem do centro.
- **7,3–9,6s** sites deslizando em profundidade: "com" · "design sob medida".
- **9,6–13,2s** lista de recursos rolando (loja virtual, Pix, SEO, WhatsApp, agendamento, cardápio digital…) em volta de "▸ e tudo o que você precisa", com recortes de sites aparecendo.
- **13,2–16s** moldura ciano com alças se deformando: "pra você".
- **16s (drop)** tela cheia com texto gigante sobre vídeos de visual tech e limpo (Mixkit, licença livre para uso comercial): "VENDER MAIS" (notebook com código e café numa mesa escura, com notificações "Novo pedido · R$…" e "Pagamento aprovado" pipocando), "IR ALÉM" (celular na mão à noite, luzes azuis desfocadas) e "MUITO ALÉM" (janela do avião sobre as nuvens no pôr do sol, com a câmera avançando). Cada vídeo tem recorte próprio para o 9:16.
- **23–27s** feixes de luz ciano em V: "hoje," · "seu site" · "vira" → clarão.
- **27–31s** fundo claro: "vendas." → cubo + "Estoke ao Cubo" + "Sites e lojas virtuais que vendem.".
- Som: "Alexa 2" (EMANVEL) — forte no começo, a pausa da faixa cobre a lista e a moldura, e o drop (17,47s da faixa) cai exatamente em "VENDER MAIS"; efeitos gravados ~15 dB abaixo da música.
- Vídeos: `src/reachAssets.js`, gerado por `bash scripts/build-reach-assets.sh` (baixa da Mixkit, recorta o trecho e gera 16:9 e vertical em WebM + MP4; os originais não ficam no repositório); telas dos sites vêm de `src/adAssets.js`.

## Anúncio de sites (SiteAd)

Baseado no anúncio "Creator Studio" (Apple) enviado como referência: fundo preto, tipografia cinética e um efeito diferente em cada palavra, refeito para vender sites da Estoke ao Cubo:

- **0–1,5s** logo com as letras trocando de fonte e cor até assentar em "ESTOKE AO CUBO" com o cubo.
- **1,5s (drop)** mosaico 3D com 9 sites que fizemos — Dizzy (~20%, inclusive a tela do centro), LCS, Noka, Misú, Kaiirós, YMB Cocktails, KDust, Trama e Bastos (~10% cada), vizinhas sempre de sites diferentes. Capturas de Kaiirós, YMB, KDust, Trama e Bastos em `assets/sites/`.
- **3,5s** "Um site." / "Vendas 24 horas." em corte seco, palavra a palavra.
- **5,5s** dock de serviços (site, loja, SEO, WhatsApp, pagamento, métricas, domínio, mobile, segurança) com onda de ampliação.
- **7,5s** "Monte sua loja." explode em blocos que montam uma loja virtual (carrinho recebe "1").
- **9,5s** "Mostre ▢ seu trabalho.": a abertura da Dizzy (moeda 3D girando, vídeo real a 30fps sincronizado com a timeline, trecho da gravação sem quadros perdidos) abre entre as palavras, ocupa a tela e vira a tela do notebook — um único quadro de vídeo do começo ao fim, sem recarregar.
- **11,5s** "Venda de qualquer lugar." selecionado no notebook, que vira celular com gradiente da marca.
- **15,5s** rajada de verbos: Publique (partículas, na pausa da música) · Edite (caixa de seleção) · Destaque (marca-texto) · Ranqueie (letras subindo + seta) · Chega de template (letras caem na lixeira) · Converta (letras embaralhadas se encaixam) · Escale (scanline: pixelado → nítido) · Venda (brilho).
- **25,3s** pinceladas azuis → "Solicite seu orçamento." → serviços (sites institucionais, lojas virtuais, landing pages, gestão de estoque) → logo + "Sites e lojas virtuais que vendem."
- Som: "BAILAR" (120 BPM, mesmo andamento da referência) com o drop no mosaico e a pausa da faixa em "Publique."; efeitos gravados (glitch, swooshes, cliques, marca-texto, papel amassado, lixo de papel, brilho) ~15 dB abaixo da música.
- Imagens e vídeo: `src/adAssets.js`, gerado por `bash scripts/build-ad-assets.sh` a partir da gravação original da Dizzy e das gravações em `dist/media/` (vídeo em MP4 e WebM, para o Chromium da exportação).

## "Venda no automático" (FlowReveal)

Baseado na referência `587c2d7b4c2af98f4c64e2a105233105_720w.mp4` (commit "gere com nosso design"), refeito com a identidade da Estoke ao Cubo:

- **0–6s Fluxo**: cards de vidro surgem um a um, ligados por linhas, com a câmera acompanhando em spline suave e profundidade de campo: Pedido recebido → Baixa no estoque → NF-e emitida → Etiqueta de envio → Cliente no WhatsApp → Estoque baixo? → Pedido ao fornecedor → Pedir avaliação (cada um com selo de tempo: "Agora", "Em 5 min", "Após 3 dias"…).
- **6–8,4s Zoom out**: panorama do fluxo; os cards encolhem até virar bolinhas brancas com ícone e a câmera desce pela cadeia.
- **8,4–11s Projetos**: da última bolinha saem, em 3D, quadros dos sites que fizemos (LCS, Misú, Noka, Dizzy); flutuam e viram pontos.
- **11–18s Cubo**: tudo colapsa em 4 pontos brancos ligados por uma linha, ondas concêntricas, os pontos desenham o hexágono e o "Y" do cubo e o cubo de vidro da logo se materializa; "VENDA" (Monument) e "no automático" (Open Sauce) se revelam dos lados (em cima/embaixo no 9:16) e "Estoke ao Cubo" assina.
- Fundo: gradiente navy → azul → sky com manchas de luz gelo/ciano que derivam, e grão.
- Câmera própria para o 9:16 (segue cada card de perto, já que o fluxo é largo).
- **Versão Story** (`dist/fluxo-automatico-story.html`, variante em `src/flow/story.js`): o fluxo desce em escadinha vertical e preenche a altura, o panorama mostra o fluxo inteiro legível, todo o conteúdo importante fica fora das faixas de interface do Instagram (~14% no topo, ~20% no rodapé) e o final ganha o botão "Solicite seu orçamento".
- Som: música "Miami" com a batida desde o primeiro quadro; o golpe forte que a faixa dá depois de quase 1s de pausa (39,38s) cai na revelação do cubo, então a pausa acontece enquanto o cubo é desenhado. Efeitos gravados: slide e pop leve em cada card, whoosh de ar no zoom out, swoosh de vento nos projetos, "shut down" no colapso, sintonia de rádio baixinha e brilho no desenho do cubo, impacto na revelação.
- Imagens dos sites: `src/flowAssets.js`, gerado por `bash scripts/build-flow-assets.sh` a partir das gravações em `dist/media/`.

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
- Som: música "Miami" (Nemzzz, hoodtrap) com o drop (24,97s da faixa) caindo no instante em que o caos entra no cubo; a pausa longa da faixa coincide com a digitação da logo e o CTA. Efeitos 100% gravados (Mixkit + analógicos do repositório), sem síntese: pops leves nos elementos que surgem, whooshes de ar e de vento nos movimentos de câmera, impacto de zoom ao atravessar o card, clique de mouse real e interruptor na automação, cadeado mecânico, brilho e impacto na logo, teclado real na digitação. Golpe de cada efeito alinhado ao corte; efeitos ~12 dB abaixo da música.
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

## Músicas e efeitos gravados

- Músicas de fundo na raiz do repositório (commit "Musicas pra usar de fundo") e efeitos em `Efeitos Analógicos (15)/` (commit "Sons Pra usar"), com licença de uso.
- `python3 scripts/build-audio-assets.py` recorta o trecho usado de cada música, baixa os efeitos escolhidos da [Mixkit](https://mixkit.co/free-sound-effects/) (licença Sound Effects Free: uso comercial sem atribuição; os arquivos não ficam versionados), recorta, normaliza (pico -1 dBFS), mede o golpe principal de cada efeito e gera `src/audio/*.js` (mp3 em base64), embutidos no artifact.
- Mixagem seguindo práticas de sound design para motion: menos efeitos e só onde mudam a percepção, golpe alinhado ao corte, variações de altura em sons repetidos e efeitos 6–12 dB abaixo da música.
- O `motionKit` toca essas amostras junto com a síntese (`samples` no `MotionPlayer` e no `renderEventsWav`; `A.sample(nome, w, { off, dur, gain, env })` nos eventos). Eventos com `dur` (a música) entram no ponto certo quando o player começa no meio.

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
node scripts/export-video.cjs dist/dev-tools-site.html dist/dev-tools-site-9x16.mp4 60 9x16
node scripts/export-video.cjs dist/site-oxigenio.html dist/site-oxigenio-9x16.mp4 60 9x16
node scripts/export-video.cjs dist/venda-24h-opcao1.html dist/venda-24h-opcao1-9x16.mp4 60 9x16
node scripts/export-video.cjs dist/venda-24h-opcao2.html dist/venda-24h-opcao2-9x16.mp4 60 9x16
node scripts/export-video.cjs dist/venda-24h-opcao3.html dist/venda-24h-opcao3-9x16.mp4 60 9x16
node scripts/export-video.cjs dist/dev-tools-site.html dist/dev-tools-site-3x4.mp4 60 3x4
node scripts/export-video.cjs dist/anuncio-alcance.html dist/anuncio-alcance-16x9.mp4 60 16x9
node scripts/export-video.cjs dist/anuncio-alcance.html dist/anuncio-alcance-9x16.mp4 60 9x16
node scripts/export-video.cjs dist/anuncio-sites.html dist/anuncio-sites-16x9.mp4 60 16x9
node scripts/export-video.cjs dist/anuncio-sites.html dist/anuncio-sites-9x16.mp4 60 9x16
node scripts/export-video.cjs dist/fluxo-automatico.html dist/fluxo-automatico-16x9.mp4 60 16x9
node scripts/export-video.cjs dist/fluxo-automatico.html dist/fluxo-automatico-9x16.mp4 60 9x16
node scripts/export-video.cjs dist/fluxo-automatico-story.html dist/fluxo-automatico-story.mp4 60 story
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
