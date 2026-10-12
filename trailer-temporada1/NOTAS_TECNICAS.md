# Notas técnicas — Trailer Temporada 1

## Ferramentas

- **HyperFrames:** CLI `hyperframes@0.8.149`, fixado em `package.json`, que é o que `npx hyperframes init` gera. O Chrome headless foi baixado com `npx hyperframes browser ensure`.
- **Skills:** o `init` instalou as skills em `~/.claude/skills/` (`hyperframes`, `hyperframes-core`, `hyperframes-animation` e outras). Foram lidas antes de escrever a composição.
- **Plugin do Claude Code:** não instalei o plugin (`claude plugin install hyperframes@hyperframes`), porque a sessão roda num container na nuvem. As skills standalone cobrem o mesmo conteúdo.
- **Briefing:** o prompt mestre já é um briefing completo. Por isso pulei a entrevista de intenção do `/hyperframes` e não criei `BRIEF.md`.
- **Arquivos locais:** GSAP 3.14.2 e as fontes (Bebas Neue 400; Montserrat 500, 600 e 800, todas OFL, via `@fontsource`) ficam em `assets/`. Nenhuma requisição de rede acontece durante o render.

## Comandos

```bash
npx hyperframes@0.8.149 check                         # lint + runtime + layout + contraste
npx hyperframes@0.8.149 snapshot --at 6.1 --no-end    # quadros avulsos
npx hyperframes@0.8.149 render --quality delivery --fps 30 --output out/trailer_sem_audio.mp4
```

## Adaptações por causa das regras do skill oficial (hyperframes-core)

1. **Registro da timeline num script inline.** O `lint` só reconhece o registro em `window.__timelines` quando ele está no HTML. Por isso, `src/timeline.js` só monta a timeline (`window.buildTrailerTimeline`), e o `index.html` a registra em `window.__timelines["trailer-temporada1"]`.
2. **Montagem síncrona.** Na primeira versão, a timeline era montada dentro de `document.fonts.ready`, o que o skill permite. Na prática, o runtime não controlou essa timeline e todos os snapshots saíram congelados no quadro 0. Agora a montagem é síncrona.
   - As únicas medidas que dependiam das fontes, a largura das três linhas do bloco A, foram tiradas com as fontes locais e ficam fixas em `LINE_W`.
   - O runtime do HyperFrames carrega as fontes antes da captura (o log mostra "Fonts: 4 loaded").
3. **Tremor de câmera.** As cenas ficam dentro de um wrapper `#cam`, que recebe os tremores; o `#stage`, que é a raiz da composição, não é animado. O skill proíbe animar a visibilidade de um clip, e mexer na raiz afetaria também `#bg`, `#grain` e `#flash`.
4. **Flash.** A timeline anima o filho `#flash-fill`, e não o clip `#flash`. É o padrão do skill ("anime um filho, não o `.clip`").
5. **Camada `#debris` (cacos e café).** É um clip próprio, de 0 a 8 s, porque os cacos atravessam as cenas 1 e 2.
6. **Uma só composição.** O `lint` sugere mover cada cena para uma subcomposição (`timeline_track_too_dense` e `nested_structure_needs_subcomposition`). São só avisos e servem para a leitura no Studio. Mantive uma composição única, com uma timeline e tempos absolutos, como o documento pede. Dividir em sete timelines quebraria os cacos que passam da cena 1 para a 2.
7. **Fontes reserva.** Tirei as fontes reserva nomeadas (`Impact`, `Arial`) das pilhas de fonte. Com elas, o compilador do HyperFrames tentava buscar faces equivalentes no Google Fonts. Agora as pilhas são só `"Bebas Neue", sans-serif` e `"Montserrat", sans-serif`.
8. **Estados iniciais.** Todos os transforms e opacidades animados começam por `fromTo` ou `tl.set` na timeline, nunca por CSS. O skill proíbe CSS e tween no mesmo `transform` (`gsap_css_transform_conflict`).

## Ajustes de layout feitos na revisão quadro a quadro

- **Placa ABERTO/FECHADO:** tem 240 px de largura, porque "FECHADO" em 64 px não cabia em 180 px.
- **Push-in da cena 4:** o zoom (1 → 1,45) é centrado em x = 440 (entre a porta e o celular do balcão), e não exatamente no celular. Centrado no celular, a placa "FECHADO" saía pela esquerda da área segura. O selo "0 notificações" foi para perto do celular depois do zoom.
- **Avião de papel (cena 7):** tem 64 px, para `ME CHAMA NO DIRECT` (120 px, 775 px de largura) e o ícone caberem nos 860 px da área segura.
- **Campo de busca:** o padding foi reduzido para "loja de roupas em Petrópolis" (411 px em Montserrat 600 de 28 px) caber numa linha.
- **Rachadura de CLIENTE:** as duas metades se afastam perpendicularmente à rachadura (cerca de 6 px cada) para a separação ficar visível. Um deslocamento só ao longo do traço não abre a fenda.
- **Card "Sua loja?":** pulsa duas vezes com 0,25 s por meia-onda, e não 0,3 s, para caber entre 11,5 e 12,5 s, antes do toque.
- **Grão:** é estático (`feTurbulence` com `seed="24"`), uma das opções que o documento permite.

## Conflitos internos do documento (seguido o detalhe da cena)

- **Tamanhos mínimos (seção 2.4):** a interface do celular usa tamanhos que a própria cena 3 define abaixo de 32 px: relógio de 30 px, chips de 24 px, "não encontrada" de 24 px e "Pedido enviado" de 28 px.
- **Verde-menta:** o documento pede no máximo um destaque por tela, mas as cenas definem vários elementos em verde-menta no mesmo quadro. Exemplos: o anel do card tocado e o check do "Pedido enviado" junto de "COMPRA DE OUTRO"; os botões dos sites, a pílula TEMPORADA 1 e os pontos da linha da cena 5; o cubo junto de "ME CHAMA NO DIRECT". Segui as cores de cada elemento como estão descritas.

## Determinismo

- **Valores fixos:** os valores "aleatórios" (cacos, gotas, respingos, corações, partículas do selo) vêm de `mulberry32(24)` em `src/shapes.js` e são calculados uma vez no carregamento.
- **Sem relógio nem timers:** não há `Math.random`, `Date.now`, `setTimeout`, `setInterval`, `requestAnimationFrame`, `@keyframes` nem `transition`.
- **Cursor e pulsos:** o cursor piscando é uma sequência de `tl.set` na timeline. Os pulsos (card vazio e halo do poste) usam `repeat` finito.
- **Verificação:** dois renders seguidos comparados quadro a quadro (resultado no resumo final da entrega).
