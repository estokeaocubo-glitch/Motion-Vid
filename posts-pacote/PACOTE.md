# Pacote Instagram: sites e sistemas sob medida

Este pacote cobre o feed em 4:5 e os stories em 9:16. A direção de arte segue a pasta `novas referencias/`, com a identidade da Estoke ao Cubo.

- **Peças:** as artes do lote 1 estão em `posts-pacote/posts.html`. Cada post e cada story é uma `<section>` com um `id`.
- **PNGs prontos:** ficam em `posts-pacote/out/`.
- **Versão guia dos stories:** fica em `posts-pacote/out/guia/` e mostra as zonas de sticker e as áreas seguras.
- **Para gerar:** `python3 posts-pacote/build.py && NODE_PATH=/opt/node22/lib/node_modules node posts-pacote/render.cjs`. O design system compartilhado pelos lotes fica em `base.src.css` + `icons.js`.

---

## Direção de arte extraída das referências

| Aspecto | O que as referências fazem | Como foi aplicado |
|---|---|---|
| **Fundo** | Papel off-white quase liso (#F2F2F0 a #F7F5F0), com um leve clarão no centro. As exceções são as peças "de impacto" em azul cheio (`9921bc9e`, `e91d2c3c`) ou verde (`e1ccda26`). | Papel `#F3F2EE` com clarão radial e grão sutil. O story 3 é em azul cheio, como contraponto. |
| **Cor** | Uma só cor de destaque, quase sempre azul royal saturado. O resto fica em preto/grafite e cinza. | O azul royal `#1F5BFF` entra em conversa com o azul e o ciano da marca. O texto fica em `#0B1222` e o apoio em `#5B6475`. Verde e vermelho aparecem só como estado (Pix aprovado / demora). |
| **Tipografia** | Grotesca pesada, condensada no espaçamento, com o título em dois tons (preto + azul). Caps finas e muito espaçadas nas frases "sussurradas" (`e942ab05`, `fd7062d5`). Uma anotação manuscrita como tempero (`650982d3`). Display em caixa alta para a palavra-golpe (`65b9a9ce`). | Open Sauce 800 com tracking negativo nos títulos e caps espaçadas a 0,2em. Para a palavra-golpe, a display da marca (EAC Display). A manuscrita é a Caveat. A Space Mono faz o visor da calculadora. |
| **Grid e espaçamento** | Margens largas (~6,5% = 70px em 1080), composição centrada com um único objeto-herói no meio. Título no terço superior e rodapé discreto com a marca. | Margem de 70px, título no terço superior, objeto-herói central e a assinatura `ESTOKE / AO CUBO` pequena no rodapé ou no topo. |
| **Cards e mockups** | Metáforas de interface do dia a dia: pílula de notificação preta (`e942`, `fd70`), barra de busca com menu (`157682d9`), planilha (`2b8f0004`), calculadora (`ae0ead01`) e notebook (`9921bc9e`, `c2a15974`). Tudo com sombra longa e macia, cantos bem arredondados e chips de vidro. | Notificação preta em pílula, busca com menu, calculadora 3D, notebook em perspectiva, cards brancos com sombra longa e chips de vidro. |
| **Acabamento** | Objetos 3D em azul (seta, dominó, calculadora, cadeiras), halftone (`65b9`), molduras de canto e setas/linhas tracejadas (`3f0f0128`). | Seta 3D de crescimento, relógio derretendo, pessoas em halftone, molduras de canto, linha tracejada, placa pendurada e o Emoji Primordial espiando a calculadora. |

---

## 1. Feed (4:5 · 1080×1350)

### Post 1: carrossel "O Direct que demora" (5 slides)
Tema: perda de vendas por demora no Direct.

| Slide | Arquivo | Referência (layout) | Copy da arte |
|---|---|---|---|
| 1 | `feed1-1-direct-21h47.png` | `e942ab056f…` (The only call I'll answer) + `fd7062d5be…` (notificação) | **Headline:** ELA PERGUNTOU O PREÇO ÀS 21:47.<br>**Notificação:** NOVA MENSAGEM · "Oi! Ainda tem no M? Quanto fica?"<br>**Selo:** Respondida 11 horas depois<br>**Subtítulo:** Às 9h do dia seguinte, ela já tinha comprado em outro lugar. |
| 2 | `feed1-2-atencao-nao-espera.png` | `d04ed65ee5…` (Attention doesn't wait) | **Headline:** Atenção não espera.<br>**Chips:** visto há 2 h · digitando…<br>**Subtítulo:** Quem pergunta no Direct está pronto pra comprar. Por poucos minutos. |
| 3 | `feed1-3-fila-ou-site.png` | `9b38e72622…` (are you in line or online?) | **Headline:** Seu cliente está na fila ou no site?<br>**Nota manuscrita:** esse aí já foi…<br>**Subtítulo:** Enquanto ele espera sua resposta no Direct, o site do concorrente responde em segundos. |
| 4 | `feed1-4-o-que-o-site-faz.png` | `157682d986…` (What we do? + busca com menu) | **Headline:** O que um site faz por você?<br>**Busca:** seu site responde…<br>**Menu:** Preço e estoque na hora · Frete calculado sozinho · Pix aprovado em segundos · **Vende às 3h da manhã** · Pedido direto no seu painel<br>**Subtítulo:** Tudo isso sem você digitar uma palavra. |
| 5 | `feed1-5-me-manda-um-direct.png` | `8bb53f7e2a…` (Let's keep the conversation going) | **Headline:** Bora tirar seu Direct da fila?<br>**Subtítulo:** A gente cria o site que responde, cobra e vende por você.<br>**Ícones:** Direct · Site · Pix · Sistema<br>**CTA:** Manda SITE no Direct · *a gente responde rapidinho ;)* |

**Execução visual:**
- **Slide 1:** caps espaçadas sobre a pílula preta de notificação (ícone do Direct em degradê), com o selo vermelho do atraso.
- **Slide 2:** relógio 3D azul derretendo, com chips de vidro flutuando.
- **Slide 3:** grade de 104 pessoas cinza, com um vão para o título e uma única pessoa azul (a que foi comprar no site).
- **Slide 4:** barra de busca contornada e o menu com o item azul selecionado, com o cubo da marca desfocado ao fundo.
- **Slide 5:** a assinatura no topo, a fileira de ícones em círculos pastel, a pílula preta de CTA e círculos de cor nos cantos.
- **Paginação e "arrasta →":** em todos os slides.

**Legenda:**
> Ela perguntou o preço às 21:47. Você viu às 9h. Ela já tinha comprado.
>
> Quem chama no Direct está pronto pra comprar, mas só por alguns minutos. Se a resposta demora, o cliente não espera: ele abre o site do concorrente, vê o preço, calcula o frete e paga no Pix em segundos.
>
> Um site bem feito responde por você: preço, estoque, frete e pagamento, a qualquer hora, inclusive às 3h da manhã. E o pedido cai direto no seu painel.
>
> → Manda **SITE** no nosso Direct que a gente te mostra como tirar seu atendimento da fila.
>
> #sitequevende #lojavirtual #vendasonline #ecommerce #estokeaocubo

### Post 2: estático "Pico de dezembro"

| Arquivo | Referência (layout) | Copy da arte |
|---|---|---|
| `feed2-dezembro-calculadora.png` | `ae0ead012e…` (based on our calculations, you need… + calculadora) | **Headline:** Pelas nossas contas, você precisa de…<br>**Subtítulo:** Dezembro é o pico. Quem vende mais já está no ar em novembro.<br>**Visor da calculadora:** um site no ar antes de dezembro_ |

**Execução visual:** calculadora 3D grande no azul royal, com o logotipo oficial no lugar da marca da calculadora. O visor de LCD fica em Space Mono, e as teclas (MC MR M− M+ ÷ / AC 1 2 + =) têm sombra de profundidade. O Emoji Primordial (sorriso maroto) espia por cima, como o bonequinho da referência. A calculadora sangra pela borda de baixo.

**Legenda:**
> Fizemos as contas: dezembro é o mês que mais vende no ano, e quem está pronto em novembro sai na frente.
>
> Site no ar, catálogo organizado, Pix e frete automáticos, testado antes da correria. Deixar pra dezembro é montar a loja com o cliente já na porta.
>
> Ainda dá tempo de preparar a sua.
>
> → Manda **DEZEMBRO** no Direct e a gente te passa o prazo pra colocar seu site no ar antes do pico.
>
> #dezembro #blackfriday #natal #lojavirtual #estokeaocubo

### Post 3: estático "Controle da operação"

| Arquivo | Referência (layout) | Copy da arte |
|---|---|---|
| `feed3-controle-da-operacao.png` | `0a3421a89c…` (Brand Strong. Grow Fast. + seta 3D) | **Headline:** Estoque certo. Venda rápida.<br>**Subtítulo:** Da produção ao cliente final, tudo num sistema só, feito sob medida pra sua operação.<br>**Chips na seta:** OP #402 · concluída ✓ → Estoque +15 un. → Pedido enviado ao cliente<br>**Rodapé:** PRODUÇÃO · ESTOQUE · CAIXA · CLIENTE |

**Execução visual:**
- Título alinhado à esquerda, em dois tons, com a assinatura pequena no canto superior.
- A seta 3D de crescimento sobe em zigue-zague do canto inferior esquerdo até o superior direito, com degradê royal, filete de luz e sombra longa.
- Ao longo da seta, três chips de vidro contam a jornada: produção → estoque → cliente.

**Legenda:**
> Quanto do seu dia vai pra conferir planilha, contar estoque e perguntar "esse pedido saiu?"
>
> A gente desenvolve sistemas sob medida que ligam tudo: a ordem de produção fecha, o estoque atualiza sozinho, o caixa soma e o pedido chega no cliente, sem retrabalho e sem caderninho.
>
> Controle de verdade, do início ao fim, no formato da sua operação (não num sistema genérico).
>
> → Manda **CONTROLE** no Direct e conta como funciona hoje. A gente te mostra como fica no sistema.
>
> #gestão #controledeestoque #sistemasobmedida #pequenasempresas #estokeaocubo

---

## 2. Stories (9:16 · 1080×1920): sequência de conversão

As áreas seguras do Instagram são o topo (250px) e o rodapé (300px), por causa da barra de progresso e da caixa de resposta. Nenhum texto fica nelas. A versão em `out/guia/` marca essas faixas em rosa e mostra onde colar cada sticker. As artes para postar estão em `out/`, sem as marcações.

| # | Arquivo | Função | Referência | Texto na tela | Sticker (onde) |
|---|---|---|---|---|---|
| 1 | `story1-gancho.png` | **Gancho** / pergunta provocativa | `65b9a9ce53…` (Quem não aparece, desaparece!) | Quem demora no Direct, **PERDE A VENDA!**<br>Seu cliente perguntou o preço. Você viu a tempo? | **Enquete**, centralizada entre o texto e a assinatura (y ≈ 1230–1450, dentro da moldura de canto): "Você responde o Direct em menos de 5 min?" → *Sim, sempre / Nem sempre* |
| 2 | `story2-manual-vs-site.png` | **Contraste**: atendimento manual vs. site automático | `3f0f012884…` (we don't create ads / we create brands + placa) | Você não precisa **responder rápido**, precisa de um site que responda.<br>Card MANUAL: "Oi, tem no M?" · visto há 2 h · calcula frete na mão… · **2h14** ✕<br>Card SITE AUTOMÁTICO: Baby Tee · R$ 65,00 · Comprar com Pix · Pix aprovado · **12s** ✓<br>Placa: Qual é o seu? | Sem sticker. A placa pendurada já provoca, e o contraste respira melhor sozinho. Se quiser, um **Quiz** no lugar da placa: "Qual vende enquanto você dorme?" → *Manual / Site* |
| 3 | `story3-site-vendeu.png` | **Prova**: sistema em ação | `9921bc9e…` (notebook no azul) + `fd7062d5…` (notificação) | Enquanto você dormia, **o site vendeu.**<br>Painel · hoje: Vendas da madrugada R$ 1.284 · 9 pedidos<br>Notificações: Pix recebido · R$ 189,90 · Pedido #1043 · 03:12 / Pedido enviado pra expedição · estoque atualizado sozinho | **Caixa de perguntas**, abaixo das notificações (y ≈ 1430–1630): "Qual o seu nicho? Te mostro o painel por dentro" |
| 4 | `story4-cta-direct.png` | **CTA** direto | `fd7062d5…` (My favourite notification) | A NOTIFICAÇÃO QUE VOCÊ VAI AMAR<br>NOVA VENDA · "Pix aprovado · R$ 189,90 · pedido #1044" · Ver<br>**Quer essa no seu celular?**<br>Manda SITE no Direct. A gente te responde rapidinho.<br>Botão: Me manda um Direct | **Link** colado em cima do botão "Me manda um Direct" (y ≈ 1400–1550): `ig.me/m/<seu perfil>`, com o texto "Quero meu site".<br>**Gatilho de resposta no Direct:** quem responder o story com "SITE" recebe a mensagem automática (configurar no Instagram/Meta Business). A nota do guia fica entre a notificação e o título. |

**Fio da sequência:**
1. O story 1 cria a dor e coleta a resposta na enquete (quem marcar "Nem sempre" vira lead quente).
2. O story 2 mostra a saída lado a lado.
3. O story 3 prova com o painel.
4. O story 4 fecha com duas portas de entrada para o Direct: o link e a palavra-gatilho "SITE".

---

# Lote 2: 5 arquétipos de venda + 4 stories

As artes estão em `posts-pacote/lote2.html`, e os PNGs em `posts-pacote/out/lote2/`. A versão guia dos stories fica em `out/lote2/guia/`.

O lote usa o mesmo design system do lote 1 (`base.src.css` + `icons.js`): mesmas fontes e pesos, tracking negativo nos títulos e caps a 0,2em, paleta (papel `#F3F2EE`, royal `#1F5BFF`, tinta `#0B1222`), raios de 26–30px nos cards e 999px nas pílulas, a mesma sombra longa e macia e o grão do papel. O que muda de post para post é só a composição, sempre emprestada de uma referência diferente da pasta.

As interfaces mostram coisas reais: o print da loja da Dizzy, o site da Kairós e a camiseta Baby Tee Pink Halo da Dizzy. Os valores de pedido e de caixa são ilustrativos.

**Travas respeitadas:**
- Nenhuma foto de banco de imagem.
- Nenhum ícone infantil: os ícones são de traço próprio, sem emoji.
- O logotipo é sempre o vetor oficial.
- Todo post ancora a atenção num elemento concreto: planilha, painel, notificação, card de sistema, chat ou comprovante.

## Feed (4:5)

### Post 1: Contraste A vs. B · `l2-feed1-planilha-vs-painel.png`
- **Base estrutural:** `2b8f0004b809ea4248a2258ab0f42aee.jpg` (a planilha do Excel em tela cheia).
- **Arte:** a metade esquerda é a planilha real, com faixa de menu, barra de fórmula, `#REF!`, `#VALOR!`, "??", estoque −1 circulado e a nota manuscrita "vendeu mais do que tinha??". A metade direita é o painel escuro do sistema, com vendas do dia, pedidos, estoque por produto e o gráfico subindo. Um botão → liga um lado ao outro, com os selos ANTES ✕ / DEPOIS ✓.
- **Copy:** **4 planilhas. 1 painel.** / Pedido, estoque e caixa se atualizando sozinhos.
- **Legenda:**
> Planilha de estoque, planilha de vendas, planilha do caixa… e nenhuma conversa com a outra.
>
> Resultado: produto vendido que não existia, Pix que ninguém conferiu e aquela célula com #REF! que todo mundo finge que não viu.
>
> Com um sistema sob medida, cada venda baixa o estoque, soma no caixa e aparece no painel na hora. Uma tela, a verdade da sua operação.
>
> → Manda **PAINEL** no Direct que a gente te mostra como fica com os seus produtos.

### Post 2: UI / Notificação de impacto · `l2-feed2-pedido-0312.png`
- **Base estrutural:** `c38023ae0d4846fbfa178bb00a1dd917.jpg` (pilha de buscas recuando em perspectiva + texto no canto inferior esquerdo).
- **Arte:** uma pilha de notificações da madrugada recua em perspectiva (Pix recebido 23:58, pedido enviado 00:21, estoque atualizado 01:15…). A da frente é a pílula preta grande **PEDIDO APROVADO · 03:12 · Pix · R$ 189,90**, com o selo "sem ninguém online".
- **Copy:** **Você dormindo. O site vendendo.** / Venda que entra de madrugada não espera você acordar.
- **Legenda:**
> 03:12. Pix aprovado. Pedido separado. Estoque atualizado. E você dormindo.
>
> Quem compra de madrugada não manda mensagem esperando resposta: compra de quem deixa comprar. Seu site pode ser o vendedor que nunca fecha, nunca esquece de responder e nunca erra o estoque.
>
> → Manda **SITE** no Direct e descubra quanto você está deixando de vender enquanto dorme.

### Post 3: Carrossel de fluxo (5 slides) · `l2-feed3-1` a `l2-feed3-5`
- **Base estrutural:** `3f0f0128841999d55f5cd50eedeff9e1.jpg` (linha tracejada com pontos sobre papel quadriculado + placa pendurada).
- **Arte:** os 5 slides são um panorama de 5400px. A mesma linha tracejada atravessa todos, no mesmo papel quadriculado e no mesmo grid: rótulo da etapa no topo à esquerda, título em dois tons, um card de UI no centro e a frase de apoio embaixo. A cada slide, um ponto da linha acende em azul.

| Slide | Copy da arte | Card de UI |
|---|---|---|
| 01 · Matéria-prima | **Tudo começa no insumo.** / Registrou a entrada, o sistema já sabe. | Entrada de insumos: Algodão cru +250 kg, estoque de insumos 1.490 kg |
| 02 · Produção | **A produção avisa quando fecha.** / Sem grupo de WhatsApp perguntando "ficou pronto?" | OP #402 · Baby Tee, concluída, barra 100% (Corte → Pronto) |
| 03 · Estoque | **O estoque se conta sozinho.** / Acabou o "deixa eu conferir e te falo". | Matéria-prima −15 un. · Produto final +15 un. |
| 04 · Vitrine | **O site mostra o que tem de verdade.** / Estoque e site falando a mesma língua. | Card da Baby Tee Pink Halo Boxy, R$ 65,00, em estoque: 15 |
| 05 · Cliente | **…até o clique do cliente.** / Manda CONTROLE no Direct. | PIX APROVADO · pedido #1044, estoque −1, expedição avisada; placa pendurada "Bora montar o seu?" |

- **Legenda:**
> Do algodão que chegou de manhã ao Pix que caiu à noite: quantas vezes a informação passa pela sua mão no meio do caminho?
>
> Num sistema sob medida, cada etapa avisa a próxima: entrada de insumo → produção → estoque → site → cliente. Ninguém precisa perguntar, conferir ou atualizar planilha.
>
> Arrasta pra ver a jornada completa.
>
> → Manda **CONTROLE** no Direct e conta como é a sua operação hoje.

### Post 4: Tipografia de impacto + dor · `l2-feed4-demorou-perdeu.png`
- **Base estrutural:** `e91d2c3c2794cbcd1af8c41a0340499c.jpg` ("MASTER YOUR CRAFT": letras gigantes no azul, com o objeto atravessando).
- **Arte:** fundo royal cheio. **DEMOROU,** em branco e **PERDEU.** em ciano, em display gigante, com a notificação do Direct atravessando entre as duas palavras, inclinada: "Oi! Ainda tem?" · visto há 11 h · não respondida. Há textos curtos nos cantos (como na referência) e a pílula branca de CTA.
- **Copy:** **DEMOROU, PERDEU.** / No Direct, a resposta é o produto. / Um site responde preço, estoque e frete na hora, até de madrugada. / Manda SITE no Direct.
- **Legenda:**
> "Oi! Ainda tem?" e a mensagem ficou lá, vista, sem resposta.
>
> Não é falta de cliente. É cliente que chegou pronto pra comprar e foi embora porque ninguém respondeu a tempo. No Direct, cada hora de silêncio vira venda do concorrente.
>
> Um site responde sozinho: preço, tamanho, estoque, frete e pagamento, na hora.
>
> → Manda **SITE** no Direct. A gente responde rápido (prometido).

### Post 5: Prova / portfólio · `l2-feed5-sites-que-vendem.png`
- **Base estrutural:** `c2a15974147e10fa2f428e483496da97.jpg` ("Solution that Works": título em degradê no topo + aparelho central + rodapé de contato).
- **Arte:** título em degradê royal → ciano. No centro, o notebook com a loja da Dizzy House Shop (print real) e o celular com o site da Kairós (print real). Selos de vidro: Pix em 1 clique · Rápido no celular · Pedido direto no painel. No rodapé, as marcas atendidas: Dizzy · LCS · Arteiro · K-Dust · Ruppel · Kairós.
- **Copy:** **Sites que vendem.** / Entregues pra marcas reais. Rodando agora.
- **Legenda:**
> Não é mockup de template. São sites no ar, vendendo agora: Dizzy House, LCS, Arteiro, K-Dust, Ruppel e Kairós.
>
> Cada um feito do zero pro jeito que a marca vende: Pix em 1 clique, carregamento rápido no celular e pedido caindo direto no painel.
>
> O próximo pode ser o seu.
>
> → Manda **PORTFÓLIO** no Direct que a gente te mostra os bastidores de cada projeto.

## Stories (9:16): sequência de 4 telas

| # | Arquivo | Função | Base estrutural | Texto na tela | Sticker (onde) |
|---|---|---|---|---|---|
| 1 | `l2-story1-so-pelo-direct.png` | Gancho | `5e0aa731f7e0a78bcffa87d1e20edbdf.jpg` ("Still Stuck in the Offline Era?") | Ícones pixelados (balão "…" e ampulheta) sobre a linha do chão. **Ainda vendendo só pelo Direct?** (com marca-texto) / Seu cliente já está online. Sua venda também deveria estar. | **Enquete** abaixo do subtítulo (y ≈ 1260–1480): "Hoje sua venda depende de você responder?" → Sim / Não |
| 2 | `l2-story2-manual-x-auto.png` | Contraste | `92187a102e5087ca721a5cb1a499d80a.jpg` ("HR CLINIC": duas poltronas frente a frente + display gigante) | Mesma loja. Mesmo produto. **Resultados diferentes.** Dois celulares frente a frente: Direct com "Tem no M? Quanto?", "E o frete?", "??" e visto há 2 h; loja com Comprar com Pix e pago em 12 s. Selo "vs". Display: **MANUAL × AUTO** | **Quiz** (opcional) logo abaixo do display (y ≈ 1510–1620): "Qual vende às 3h?" → Manual / Auto |
| 3 | `l2-story3-madrugada.png` | Prova | `e1ccda26c79c74c487dab33281821f73.jpg` (rolo de papel em perspectiva no verde + título à direita) | Comprovante desenrolando: vendas da madrugada 23:58 → 05:40, total R$ 399,90, PIX aprovado, respostas 0. **[ Madrugada ] 4 vendas. 0 respostas.** / Enquanto você dormia, o site respondeu, cobrou e vendeu. | **Caixa de perguntas** (y ≈ 1420–1600): "Que horas você mais perde venda?" |
| 4 | `l2-story4-cta.png` | CTA | `8e97ec0438889ff978a22a41962f6739.jpg` (plateia azul desfocada + um único objeto em destaque + chips de data e hora) | sua vez · **Manda SITE no Direct.** O botão "enviar" em 3D sob o holofote, com os chips Hoje (resposta no mesmo dia) e Site + sistema (sob medida). A gente te mostra como fica o seu. | **Link** (y ≈ 1370–1520): `ig.me/m/<seu perfil>`, com o texto "Quero meu site". **Gatilho no Direct:** responder o story com "SITE" dispara a resposta automática. |
