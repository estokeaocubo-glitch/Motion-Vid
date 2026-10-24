import React from "react";
import { C, FONT, clamp, lerp, prog, spring, fitSize, Grain, CubeLogo, renderEventsWav, MotionPlayer } from "./motionKit";
import { SCRIPT } from "./words/variant";
import { MUSIC_WORDS } from "./audio/wordsRef";

/* =============================================================================
   Estoke ao Cubo — "Venda 24h" (Reels 9:16, 9,5s, só tipografia)
   Referência: vídeo "we don't just edit" — uma ideia por tela, 1 a 3 palavras, corte seco na batida,
   fundo invertendo entre branco e preto, a palavra anterior pequena em cima, a virada gigante no
   preto aos 2,0s, glitch aos 3,03s e o fim digitado letra a letra alternando o fundo.
   Áudio: o original do vídeo de referência; os cortes são os da própria referência (medidos quadro
   a quadro pelas trocas de fundo), então cada palavra cai na mesma batida.
   Três roteiros (./words/v1.js, v2.js, v3.js) com o mesmo componente.
============================================================================= */
// cortes da referência (s): 18 telas de palavra, 4 da digitação e o quadro final
const CUTS = [0, 0.733, 1.4, 2.0, 2.533, 3.033, 3.5, 3.967, 4.367, 4.733, 5.167, 5.533, 5.9, 6.233, 6.567, 6.9, 7.2, 7.5];
const TYPE_CUTS = [7.8, 8.033, 8.333, 8.6];
const END_HOLD = 8.9;
const DURATION = 9.5;
const STEPS = SCRIPT.steps;
const TYPED = SCRIPT.typed;
const TYPE_PREFIX = TYPE_CUTS.map((_, i) => TYPED.slice(0, Math.round(((i + 1) / TYPE_CUTS.length) * TYPED.length)));
const FORMATS = { "9x16": { w: 450, h: 800, label: "9:16" } };
const INK = "#0A0A0B";
const PAPER = "#F3F3F1";
const DROP = CUTS[3];
const GLITCH = CUTS[5];
const word = { fontFamily: FONT, fontWeight: 800, letterSpacing: "-0.045em", whiteSpace: "nowrap", lineHeight: 1 };
const bgOf = (i) => (i % 2 ? "b" : "w");

function current(t) {
  // passo atual: uma tela do roteiro, um prefixo da digitação ou o quadro final (branco, como na referência)
  if (t >= END_HOLD) return { bg: "w", main: TYPED, at: END_HOLD, final: true };
  let k = -1;
  TYPE_CUTS.forEach((c, i) => { if (t >= c) k = i; });
  if (k >= 0) return { bg: bgOf(k), main: TYPE_PREFIX[k], at: TYPE_CUTS[k], typed: true };
  let i = 0;
  CUTS.forEach((c, j) => { if (t >= c) i = j; });
  const [main, small, size] = STEPS[i];
  return { at: CUTS[i], bg: bgOf(i), main, small, size };
}

function Frame({ t }) {
  const st = current(t);
  const dark = st.bg === "b";
  const fg = dark ? "#FFFFFF" : INK;
  const lt = t - st.at;
  const xl = st.size === "xl";
  const base = st.typed || st.final ? fitSize(TYPED, 380, 56, false) : xl ? fitSize(st.main, 400, 150, false) : st.size === "l" ? fitSize(st.main, 400, 104, false) : fitSize(st.main, 390, 64, false);
  // entrada seca: 1 quadro maior e assenta (sem fade), como na referência
  const pop = lerp(1.07, 1, clamp(spring(lt, { stiffness: 700, damping: 30 })));
  // glitch (como o "create" da referência): fatias deslocadas e separação de cor por ~0,2s
  const g = t >= GLITCH && t < GLITCH + 0.22 ? 1 - (t - GLITCH) / 0.22 : 0;
  const smallSize = xl ? 40 : 30;
  const y = 330;
  const finalIn = st.final ? clamp(spring(lt, { stiffness: 220, damping: 16 })) : 0;
  const text = (style) => (
    <div style={{ position: "absolute", left: 0, top: y, width: 450, display: "flex", justifyContent: "center", ...style }}>
      {/* a palavra anterior fica pequena, alinhada à esquerda, em cima da nova (como "we / don't") */}
      <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-start", transform: `scale(${pop})`, transformOrigin: "50% 60%" }}>
        {st.small && <div style={{ ...word, fontSize: smallSize, color: fg, marginBottom: xl ? -base * 0.06 : 0, marginLeft: base * 0.04 }}>{st.small}</div>}
        <div style={{ ...word, fontSize: base, color: fg }}>{st.main}</div>
      </div>
    </div>
  );
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: dark ? INK : PAPER }}>
      {g > 0 ? (
        <>
          {text({ color: "#FF2A55", transform: `translateX(${-8 * g}px)`, mixBlendMode: "screen", opacity: 0.8, clipPath: "inset(0 0 55% 0)" })}
          {text({ transform: `translateX(${14 * g}px)`, clipPath: "inset(45% 0 0 0)" })}
          {text({ transform: `translateX(${-6 * g}px)`, clipPath: "inset(0 0 45% 0)" })}
        </>
      ) : text({})}
      {st.final && (
        <div style={{ position: "absolute", left: 0, top: 230, width: 450, display: "flex", justifyContent: "center", transform: `scale(${lerp(0.5, 1, finalIn)})`, opacity: finalIn }}>
          <CubeLogo size={70} glow={1} />
        </div>
      )}
      {st.final && <div style={{ position: "absolute", left: 0, top: 410, width: 450, textAlign: "center", fontFamily: FONT, fontWeight: 600, fontSize: 16, color: dark ? C.ice : C.slate, opacity: clamp((lt - 0.15) * 5) }}>sites e lojas virtuais que vendem 24h</div>}
      <Grain t={t} opacity={dark ? 0.07 : 0.05} />
    </div>
  );
}

/* =============================================================================
   Som — o áudio original do vídeo de referência, inteiro e sem efeitos por cima.
============================================================================= */
const SAMPLES = { music: MUSIC_WORDS.wordsRef };
function buildEvents() {
  return [{ t: 0, dur: DURATION, fn: (A, w, off = 0) => A.sample("music", w, { off, dur: DURATION - off, gain: 1, fadeIn: 0.005 }) }];
}
const EVENTS = buildEvents();
const renderWav = () => renderEventsWav(EVENTS, DURATION, { samples: SAMPLES });

// Usado pelo exportador de vídeo (scripts/export-video.cjs)
const MOTION = { Frame, duration: DURATION, formats: FORMATS, renderWav };

export default function WordsAd() {
  return (
    <MotionPlayer Frame={Frame} duration={DURATION} events={EVENTS} formats={FORMATS} defaultFormat="9x16" renderWav={renderWav} samples={SAMPLES}
      fontsToLoad={[`800 16px "Open Sauce Sans"`]}
      scenes={[{ name: SCRIPT.name, from: 0 }, { name: "Virada", from: DROP }, { name: "Fim", from: TYPE_CUTS[0] }]} />
  );
}
