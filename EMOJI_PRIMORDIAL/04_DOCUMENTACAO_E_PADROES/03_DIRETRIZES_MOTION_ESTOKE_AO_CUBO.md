# Diretrizes de Motion Design e Controle de Qualidade — Estoke ao Cubo

Este guia estabelece como integrar o **Emoji Primordial** nos vídeos e motions comerciais da **Estoke ao Cubo** (Reels, Shorts, TikTok, criativos de tráfego pago e apresentações B2B), mantendo a unidade estética e o padrão de qualidade.

---

## 1. Paleta Oficial e Harmonia com o Emoji Primordial

O Emoji Primordial possui iluminação de estúdio quente e tons de pele ricos. Para que ele se destaque com máximo contraste e elegância nas peças da **Estoke ao Cubo**, utilize exclusivamente a paleta oficial:

| Papel na Composição | Cor / Nome | Hex | RGB | Como combinar com o Emoji |
| :--- | :--- | :--- | :--- | :--- |
| **Fundo Nativo Studio 3D** | Cinza Studio Padrão | `#D1D1D1` | `(209, 209, 209)` | Usar quando o vídeo for focado 100% no personagem (cortes de reação ou tela cheia). |
| **Fundo Editorial Claro** | Off-White / Papel Quente | `#F4F3EE` | `(244, 243, 238)` | Usar com os recortes transparentes (`01_FEICOES_PNG_TRANSPARENTE`) em motions tipográficos e UI. |
| **Fundo Editorial Escuro** | Grafite Profundo | `#1C1D21` | `(28, 29, 33)` | Usar em cenas de contraste dramático, alertas de dor do cliente ou *dark mode* de UI. |
| **Cor de Ação / Tech** | Azul Cobalto Estoke | `#2563EB` | `(37, 99, 235)` | Botões de CTA, destaques de métricas positivas, cursores e bordas de cards ativos. |
| **Cor de Alerta / Energia** | Terracota / Coral | `#E05A47` | `(224, 90, 71)` | Alertas de "empresa sem site", queda de conversão, ícones de erro e ênfase crítica. |

---

## 2. Regras de Animação, Física e Lip-Sync em Projetos Reais

### 2.1. Proibição de "Recorte Estático Duro" (*Cutout Jerk*)
* **Nunca** mova o PNG estático em linha reta ou troque de feição em corte seco (`1 frame`) sem transição.
* **Sempre** utilize:
  1. **Interpolação pelo `PrimordialFaceSculptor`**: Para transições faciais, varie continuamente `smile_mix`, `gaze_x/y`, `blink_l/r`, `mouth_open` e `mouth_width` usando curvas senoidais ou gaussianas suaves.
  2. **Mola Amortecida (*Spring Physics*)**: Em entradas de cena ou flutuação em cards UI, adicione respiração contínua (`dy = sin(t * 2.5) * 4px`, `roll = cos(t * 1.8) * 1.5°`).
  3. **Piscada de Transição (*Bridge Blink*)**: Sempre que o personagem mudar drasticamente a direção do olhar ou passar de uma expressão séria/pensativa para um sorriso (ex.: `12_pensativo_teve_ideia.mp4`), insira uma piscada rápida de `4 a 6 quadros` (`blink_l = blink_r = sin(u * pi)`) no meio da transição. Isso replica o reflexo humano real e torna a mudança de expressão 100% orgânica.

### 2.2. Cadência Fonética para Locuções (*Lip-Sync*)
Ao sincronizar o Emoji Primordial com uma locução em português:
* **Sílabas Abertas (`A`, `Á`, `É`)**: `mouth_open = 15..18`, `mouth_width = +2..+4`, `smile_mix = 0.80`, `show_teeth = True`.
* **Sílabas Médias Sorriso (`E`, `I`, `Ê`)**: `mouth_open = 10..12`, `mouth_width = +6..+8`, `smile_mix = 0.90`, `show_teeth = True`.
* **Sílabas Arredondadas (`O`, `Ô`, `U`, `ÃO`)**: `mouth_open = 14..17`, `mouth_width = -11..-14`, `smile_mix = 0.10..0.15`, `show_teeth = False`.
* **Consoantes Bilabiais (`M`, `B`, `P`)**: Fechar brevemente a boca por `2 a 3 quadros` com `mouth_open = -4.0`, `mouth_width = +3.0`, `show_teeth = False`.
* **Regra de Ouro do Lip-Sync**: Nunca altere `use_smile_base` de forma binária (`True/False`) entre sílabas vizinhas; use sempre `smile_mix` contínuo (`0.10 <-> 0.90`) para evitar que as bochechas "pisquem".

---

## 3. Checklist de Controle de Qualidade (QA) Antes de Exportar

Antes de aprovar qualquer nova feição ou vídeo do Emoji Primordial, verifique os 6 pontos abaixo em zoom de 200%:

- [ ] **1. Inspeção Ocular (Zero Linha Cortando o Olho)**:
  - A esclera branca está 100% limpa e contínua até as bordas da abertura ocular?
  - Em olhares para cima (`gaze_y < -8`), não há nenhuma mancha marrom da pálpebra inferior subindo para o branco do olho?
- [ ] **2. Inspeção de Piscadas e Ponte dos Óculos**:
  - Durante piscadas parciais (`blink = 0.3..0.7`) ou totais (`1.0`), a pálpebra permanece ancorada nos cantos internos e externos?
  - A ponte metálica azul-acinzentada no centro dos óculos (`x = 351..449`) permanece 100% visível e sem manchas de pele?
- [ ] **3. Inspeção do Aro Superior das Lentes (`y = 335`)**:
  - Ao baixar ou arquear as sobrancelhas, a linha horizontal superior da lente sem aro continua perfeitamente reta?
- [ ] **4. Inspeção da Boca em Choque / Vogais O-U**:
  - A abertura oral está 100% alinhada com os lábios (sem nenhuma linha escura da boca fechada flutuando acima do lábio superior)?
  - Os cantos externos dos lábios contraíram junto com a abertura oval (sem "asas" horizontais sobrando nas laterais)?
  - O topo da cavidade oral forma um arco arredondado natural acompanhando o arco do cupido?
- [ ] **5. Inspeção de Recorte Alpha e AirPods (`01_FEICOES_PNG_TRANSPARENTE`)**:
  - Os dois AirPods Pro nas orelhas estão 100% íntegros e opacos (`alpha = 255`), sem buracos na haste branca?
- [ ] **6. Codificação de Vídeo Padrão**:
  - Vídeos exportados em `.mp4` com codec **H.264 (`libx264`, `-crf 17`, `-pix_fmt yuv420p`, `24 fps`)** para compatibilidade universal em navegadores, WhatsApp, Instagram e editores (Premiere / After Effects / CapCut / DaVinci).
