# Pacote Instagram: sites e sistemas sob medida

Este pacote cobre o feed em 4:5 e os stories em 9:16. A direção de arte segue a pasta `novas referencias/`, com a identidade da Estoke ao Cubo.

- **Peças:** as artes estão em `posts-pacote/posts.src.html`. Cada post e cada story é uma `<section>` com um `id`.
- **PNGs prontos:** ficam em `posts-pacote/out/`.
- **Versão guia dos stories:** fica em `posts-pacote/out/guia/` e mostra as zonas de sticker e as áreas seguras.
- **Para gerar:** `python3 posts-pacote/build.py && NODE_PATH=/opt/node22/lib/node_modules node posts-pacote/render.cjs`.

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
> Ela perguntou o preço às 21:47. Você viu às 9h. Ela já tinha comprado. 🕘
>
> Quem chama no Direct está pronto pra comprar, mas só por alguns minutos. Se a resposta demora, o cliente não espera: ele abre o site do concorrente, vê o preço, calcula o frete e paga no Pix em segundos.
>
> Um site bem feito responde por você: preço, estoque, frete e pagamento, a qualquer hora, inclusive às 3h da manhã. E o pedido cai direto no seu painel.
>
> 👉 Manda **SITE** no nosso Direct que a gente te mostra como tirar seu atendimento da fila.
>
> #sitequevende #lojavirtual #vendasonline #ecommerce #estokeaocubo

### Post 2: estático "Pico de dezembro"

| Arquivo | Referência (layout) | Copy da arte |
|---|---|---|
| `feed2-dezembro-calculadora.png` | `ae0ead012e…` (based on our calculations, you need… + calculadora) | **Headline:** Pelas nossas contas, você precisa de…<br>**Subtítulo:** Dezembro é o pico. Quem vende mais já está no ar em novembro.<br>**Visor da calculadora:** um site no ar antes de dezembro_ |

**Execução visual:** calculadora 3D grande no azul royal, com o logotipo oficial no lugar da marca da calculadora. O visor de LCD fica em Space Mono, e as teclas (MC MR M− M+ ÷ / AC 1 2 + =) têm sombra de profundidade. O Emoji Primordial (sorriso maroto) espia por cima, como o bonequinho da referência. A calculadora sangra pela borda de baixo.

**Legenda:**
> Fizemos as contas: dezembro é o mês que mais vende no ano, e quem está pronto em novembro sai na frente. 📈
>
> Site no ar, catálogo organizado, Pix e frete automáticos, testado antes da correria. Deixar pra dezembro é montar a loja com o cliente já na porta.
>
> Ainda dá tempo de preparar a sua.
>
> 👉 Manda **DEZEMBRO** no Direct e a gente te passa o prazo pra colocar seu site no ar antes do pico.
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
> Quanto do seu dia vai pra conferir planilha, contar estoque e perguntar "esse pedido saiu?" 🤯
>
> A gente desenvolve sistemas sob medida que ligam tudo: a ordem de produção fecha, o estoque atualiza sozinho, o caixa soma e o pedido chega no cliente, sem retrabalho e sem caderninho.
>
> Controle de verdade, do início ao fim, no formato da sua operação (não num sistema genérico).
>
> 👉 Manda **CONTROLE** no Direct e conta como funciona hoje. A gente te mostra como fica no sistema.
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
