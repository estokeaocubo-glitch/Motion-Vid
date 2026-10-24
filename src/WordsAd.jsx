import React from "react";
import { C, FONT, clamp, lerp, prog, spring, fitSize, Grain, CubeLogo, renderEventsWav, MotionPlayer } from "./motionKit";
import { SCRIPT } from "./words/variant";
import { MUSIC_AD } from "./audio/bailarAd";
import { SFX, SFX_PEAK } from "./audio/sfx";

/* =============================================================================
   Estoke ao Cubo — "Venda 24h" (Reels 9:16, ~8,5s, só tipografia)
   Referência: vídeo "we don't just edit" — uma ideia por tela, 1 a 3 palavras, corte seco na batida,
   fundo invertendo entre branco e preto, a palavra anterior pequena em cima, a virada gigante no
   preto aos 2,0s com glitch, e o fim digitado letra a letra alternando o fundo.
   Três roteiros (./words/v1.js, v2.js, v3.js) com o mesmo componente.
   Música: "BAILAR" a partir de 30s da faixa — grade de 0,25s e o drop (32,01s) cai na virada (2,0s).
============================================================================= */
const STEPS = SCRIPT.steps;
const TYPED = SCRIPT.typed;
const TYPE_PREFIX = (() => {
  const s = TYPED.text;
  const n = 6;
  return Array.from({ length: n }, (_, i) => s.slice(0, Math.round(((i + 1) / n) * s.length)));
})();
const TYPE_STEP = 0.25;
const END_HOLD = TYPED.at + TYPE_PREFIX.length * TYPE_STEP;
const DURATION = Math.round((END_HOLD + 1.3) * 100) / 100;
const FORMATS = { "9x16": { w: 450, h: 800, label: "9:16" } };
const INK = "#0A0A0B";
const PAPER = "#F3F3F1";
const DROP = 2.0;
const word = { fontFamily: FONT, fontWeight: 800, letterSpacing: "-0.045em", whiteSpace: "nowrap", lineHeight: 1 };

function current(t) {
  // passo atual: um passo do roteiro, um prefixo da digitação ou o quadro final
  if (t >= END_HOLD) return { bg: "b", main: TYPED.text, at: END_HOLD, final: true };
  if (t >= TYPED.at) {
    const k = Math.min(TYPE_PREFIX.length - 1, Math.floor((t - TYPED.at) / TYPE_STEP));
    return { bg: k % 2 ? "w" : "b", main: TYPE_PREFIX[k], at: TYPED.at + k * TYPE_STEP, typed: true };
  }
  let s = STEPS[0];
  STEPS.forEach((st) => { if (t >= st[0]) s = st; });
  return { at: s[0], bg: s[1], main: s[2], small: s[3], size: s[4] };
}

function Frame({ t }) {
  const st = current(t);
  const dark = st.bg === "b";
  const fg = dark ? "#FFFFFF" : INK;
  const lt = t - st.at;
  const xl = st.size === "xl";
  const base = st.typed || st.final ? fitSize(TYPED.text, 380, 56, false) : xl ? fitSize(st.main, 400, 150, false) : fitSize(st.main, 390, 64, false);
  // entrada seca: 1 quadro maior e assenta (sem fade), como na referência
  const pop = lerp(1.07, 1, clamp(spring(lt, { stiffness: 700, damping: 30 })));
  // glitch na virada: fatias deslocadas e separação de cor por ~0,2s
  const g = t >= DROP && t < DROP + 0.22 ? 1 - (t - DROP) / 0.22 : 0;
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
      {st.final && <div style={{ position: "absolute", left: 0, top: 410, width: 450, textAlign: "center", fontFamily: FONT, fontWeight: 600, fontSize: 16, color: C.ice, opacity: clamp((lt - 0.25) * 4) }}>sites e lojas virtuais que vendem 24h</div>}
      <Grain t={t} opacity={dark ? 0.07 : 0.05} />
    </div>
  );
}

/* =============================================================================
   Som — "BAILAR" (o trecho de 30s embutido no anúncio de sites): drop na virada; glitch curto
   no drop e teclas na digitação do fim.
============================================================================= */
const SAMPLES = { music: MUSIC_AD.bailarAd, ...SFX };
function buildEvents() {
  const ev = [];
  const fx = (at, name, gain, opts = {}) => ev.push({ t: Math.max(0, at - SFX_PEAK[name] / (opts.rate || 1)), fn: (A, w) => A.sample(name, w, { gain, ...opts }) });
  ev.push({ t: 0, dur: DURATION, fn: (A, w, off = 0) => A.sample("music", w, { off, dur: DURATION - off, gain: 0.85, fadeIn: 0.01, env: [[0, 1], [DURATION - 0.6, 1], [DURATION, 0]] }) });
  fx(DROP, "glitch", 0.12);
  TYPE_PREFIX.forEach((_, k) => fx(TYPED.at + k * TYPE_STEP, "mouseClick", 0.07, { rate: 1 + (k % 3) * 0.06 }));
  fx(END_HOLD, "logoImpact", 0.1);
  return ev.sort((a, b) => a.t - b.t);
}
const EVENTS = buildEvents();
const renderWav = () => renderEventsWav(EVENTS, DURATION, { samples: SAMPLES });

// Usado pelo exportador de vídeo (scripts/export-video.cjs)
const MOTION = { Frame, duration: DURATION, formats: FORMATS, renderWav };

export default function WordsAd() {
  return (
    <MotionPlayer Frame={Frame} duration={DURATION} events={EVENTS} formats={FORMATS} defaultFormat="9x16" renderWav={renderWav} samples={SAMPLES}
      fontsToLoad={[`800 16px "Open Sauce Sans"`]}
      scenes={[{ name: SCRIPT.name, from: 0 }, { name: "Virada", from: DROP }, { name: "Fim", from: TYPED.at }]} />
  );
}
