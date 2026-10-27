import React from "react";
import { FONT, clamp, lerp, prog, spring, easeInOut, easeOut, Grain, CubeLogo, renderEventsWav, MotionPlayer, Wordmark } from "./motionKit";
import { MUSIC_REACH } from "./audio/alexaReach";
import { SFX, SFX_PEAK } from "./audio/sfx";

/* =============================================================================
   Estoke ao Cubo — "Carrossel de sites" (4:5 e 9:16, 14s, loop)
   Refaz a referência do carrossel em perspectiva (pin 961377851726596244): fundo cinza-claro,
   um card de vidro escuro com o título respira no centro; aos 5s ele ganha cor e vira um
   carrossel 3D (cover flow) que gira card a card, mostrando os sites que fizemos (Dizzy, LCS,
   Arteiro, K-Dust, Ruppel, Kairós); no fim volta ao card do título, fechando o loop.
============================================================================= */
const DURATION = 14;
const FORMATS = { "4x5": { w: 480, h: 600, label: "4:5" }, "9x16": { w: 450, h: 800, label: "9:16" } };
const T = { color: 4.7, flow: 5.0, back: 12.8 };
const SITES = [
  { img: "media/coverflow/dizzy-shop.webp", name: "Dizzy House", seg: "loja virtual" },
  { img: "media/coverflow/lcs-hero.webp", name: "LCS Turismo", seg: "transporte executivo" },
  { img: "media/coverflow/arteiro.webp", name: "Arteiro", seg: "arte popular e mobiliário", pos: "2% 40%" },
  { img: "media/coverflow/kdust.webp", name: "K-Dust", seg: "streetwear" },
  { img: "media/coverflow/ruppel.webp", name: "Ruppel", seg: "streetwear · drop 02", pos: "79% 0%" },
  { img: "media/coverflow/kairos.webp", name: "Kairós", seg: "streetwear" },
];
// itens do carrossel: o card do título (índice 0) e os sites
const ITEMS = [{ title: true }, ...SITES];
const N = ITEMS.length;
// a cada passo o carrossel gira um card para a esquerda; o último passo volta ao título
const STEPS = Array.from({ length: N }, (_, i) => T.flow + 0.55 + i * 1.12);

function position(t) {
  // posição contínua do carrossel (0 = título no centro), com um "assentar" rápido em cada passo
  let pos = 0;
  STEPS.forEach((s) => { pos += easeInOut(clamp((t - s) / 0.5)); });
  return pos;
}

function TitleCard({ w, h, colored }) {
  return (
    <div style={{ position: "absolute", inset: 0, borderRadius: 30, overflow: "hidden", background: "#6E6E70" }}>
      <div style={{ position: "absolute", inset: 0, opacity: colored, background: "linear-gradient(180deg, #3D4A63 0%, #2F6FD8 45%, #39B6F2 80%, #8FE3FF 100%)" }} />
      <div style={{ position: "absolute", inset: 0, opacity: colored, background: "radial-gradient(70% 45% at 50% 100%, rgba(255,255,255,.45), transparent 70%)" }} />
      <div style={{ position: "absolute", left: "50%", top: 12, width: 8, height: 8, marginLeft: -4, borderRadius: 4, background: "rgba(255,255,255,.75)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: h * 0.3, textAlign: "center", color: "#fff", fontWeight: 800, fontSize: w * 0.105, lineHeight: 1.08, letterSpacing: "-0.03em" }}>Sites que vendem<br />o dia todo</div>
      <div style={{ position: "absolute", left: w * 0.12, right: w * 0.12, bottom: h * 0.11, textAlign: "center", color: "rgba(255,255,255,.82)", fontWeight: 600, fontSize: w * 0.045, lineHeight: 1.4 }}>
        Sob medida, rápidos no celular e com o caminho certo até o WhatsApp.
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: h * 0.04, display: "flex", justifyContent: "center" }}><Wordmark size={w * 0.034} color="#FFFFFF" /></div>
    </div>
  );
}

function SiteCard({ site, w, h }) {
  return (
    <div style={{ position: "absolute", inset: 0, borderRadius: 30, overflow: "hidden", background: "#111" }}>
      <img src={site.img} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: site.pos || "30% 20%" }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,.72) 100%)" }} />
      <div style={{ position: "absolute", left: "50%", top: 12, width: 8, height: 8, marginLeft: -4, borderRadius: 4, background: "rgba(255,255,255,.75)" }} />
      <div style={{ position: "absolute", left: w * 0.08, bottom: h * 0.07, color: "#fff" }}>
        <div style={{ fontWeight: 800, fontSize: w * 0.1, letterSpacing: "-0.035em", lineHeight: 1 }}>·{site.name}</div>
        <div style={{ marginTop: 6, fontWeight: 600, fontSize: w * 0.045, opacity: 0.8 }}>{site.seg}</div>
      </div>
    </div>
  );
}

function Frame({ t, format = "4x5" }) {
  const F = FORMATS[format];
  const W = F.w, H = F.h;
  const vertical = H / W > 1.5;
  const cw = W * (vertical ? 0.6 : 0.5), ch = cw * 1.32;
  const cx = W / 2, cy = H * (vertical ? 0.47 : 0.46);
  // fase 1: o card do título entra e "respira"; o fundo tem uma cópia desfocada (reflexo)
  const enter = clamp(spring(t, { stiffness: 120, damping: 16 }), 0, 1.1);
  const breathe = 1 + 0.035 * Math.sin(t * 1.6);
  const colored = easeInOut(prog(t, T.color, T.flow + 0.2)) * (1 - easeInOut(prog(t, T.back + 0.4, DURATION - 0.1)));
  const flowIn = easeOut(prog(t, T.flow, T.flow + 0.6));
  const flowOut = easeInOut(prog(t, T.back, T.back + 0.8));
  const spread = flowIn * (1 - flowOut);
  const pos = position(t);
  const loopFade = clamp(prog(t, DURATION - 0.6, DURATION));
  const cards = ITEMS.map((it, i) => {
    // distância circular até o centro
    let d = i - pos;
    d = ((d % N) + N + N / 2) % N - N / 2;
    const ad = Math.abs(d);
    const x = Math.sign(d) * (ad <= 1 ? ad * cw * 0.78 : cw * 0.78 + (ad - 1) * cw * 0.32);
    const s = ad < 1 ? lerp(1, 0.74, ad) : lerp(0.74, 0.6, Math.min(1, ad - 1));
    const ry = -Math.sign(d) * Math.min(1, ad) * 32;
    const vis = ad < 2.2 ? 1 : 0;
    return { it, i, d, ad, x: x * spread, s: lerp(1, s, spread), ry: ry * spread, vis: i === 0 ? 1 : vis * spread, z: 100 - Math.round(ad * 10) };
  });
  const dots = ITEMS.map((_, i) => i);
  const active = Math.round(pos) % N;
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", fontFamily: FONT, background: "#F2F2F2" }}>
      {/* reflexo desfocado do card ao fundo */}
      <div style={{ position: "absolute", left: cx - cw * 0.75, top: cy - ch * 0.75, width: cw * 1.5, height: ch * 1.5, borderRadius: 60, background: colored > 0.1 ? "linear-gradient(180deg, #8FA7D6, #BFE7FA)" : "#BDBDBF", filter: "blur(40px)", opacity: 0.35 * enter * (1 - spread * 0.6) }} />
      <div style={{ position: "absolute", inset: 0, perspective: 900 }}>
        {cards.map(({ it, i, x, s, ry, vis, z }) => {
          if (vis <= 0.01) return null;
          const sc = s * (i === 0 ? breathe * Math.min(enter, 1.05) : 1) * (i === 0 && spread < 0.05 ? 1 : 1);
          return (
            <div key={i} style={{
              position: "absolute", left: cx - cw / 2, top: cy - ch / 2, width: cw, height: ch, zIndex: z,
              transform: `translateX(${x}px) rotateY(${ry}deg) scale(${sc})`, opacity: vis,
              boxShadow: "0 30px 60px rgba(0,0,0,.22)", borderRadius: 30,
            }}>
              {it.title ? <TitleCard w={cw} h={ch} colored={colored} /> : <SiteCard site={it} w={cw} h={ch} />}
            </div>
          );
        })}
      </div>
      {/* paginação */}
      <div style={{ position: "absolute", left: 0, right: 0, top: cy + ch / 2 + 22, display: "flex", justifyContent: "center", opacity: spread }}>
        <div style={{ display: "flex", gap: 5, padding: "6px 9px", borderRadius: 12, background: "rgba(0,0,0,.12)" }}>
          {dots.map((i) => <span key={i} style={{ width: i === active ? 14 : 5, height: 5, borderRadius: 3, background: i === active ? "#333" : "rgba(0,0,0,.3)", transition: "none" }} />)}
        </div>
      </div>
      <div style={{ position: "absolute", inset: 0, background: "#F2F2F2", opacity: loopFade * 0 }} />
      <Grain t={t} opacity={0.025} />
    </div>
  );
}

/* =============================================================================
   Som — a referência veio sem áudio: "Alexa 2" com o drop no início do carrossel (5s) e um
   "swoosh" curto a cada giro.
============================================================================= */
const MUSIC_OFF = 16.17 - T.flow;
const SAMPLES = { music: MUSIC_REACH.alexaReach, ...SFX };
function buildEvents() {
  const ev = [];
  const fx = (at, name, gain, opts = {}) => ev.push({ t: Math.max(0, at - (SFX_PEAK[name] || 0) / (opts.rate || 1)), fn: (A, w) => A.sample(name, w, { gain, ...opts }) });
  ev.push({ t: 0, dur: DURATION, fn: (A, w, off = 0) => A.sample("music", w, { off: MUSIC_OFF + off, dur: DURATION - off, gain: 0.5, fadeIn: 0.3,
    env: [[0, 0.6], [T.flow - 0.05, 0.6], [T.flow, 1], [DURATION - 0.8, 1], [DURATION, 0]] }) });
  fx(0.15, "lightPop", 0.08);
  fx(T.color, "sparkleSweep", 0.08);
  fx(T.flow, "airWhoosh", 0.12);
  STEPS.forEach((s, i) => fx(s + 0.05, "smallSweep", 0.08, { rate: 1 + (i % 3) * 0.05 }));
  fx(T.back, "windSwoosh", 0.08);
  return ev;
}
const EVENTS = buildEvents();
const renderWav = () => renderEventsWav(EVENTS, DURATION, { samples: SAMPLES });

// Usado pelo exportador de vídeo (scripts/export-video.cjs)
const MOTION = { Frame, duration: DURATION, formats: FORMATS, renderWav };

export default function CoverflowAd() {
  return (
    <MotionPlayer Frame={Frame} duration={DURATION} events={EVENTS} formats={FORMATS} defaultFormat="4x5" renderWav={renderWav} samples={SAMPLES}
      fontsToLoad={[`800 16px "Open Sauce Sans"`]}
      scenes={[{ name: "Título", from: 0 }, { name: "Carrossel", from: T.flow }, { name: "Volta", from: T.back }]} />
  );
}
