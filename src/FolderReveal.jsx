import React from "react";
import {
  FONT, DISP, clamp, lerp, prog, easeOut, easeIn, easeInOut, rnd, spring, midi, tone, hiss,
  Grain, SND, renderEventsWav, MotionPlayer,
} from "./motionKit";
import { CLIENT_LOGOS } from "./portfolioAssets";

/* =============================================================================
   Estoke ao Cubo — "Nossos clientes": pasta que abre um feixe de luz com os logos
   Referência: "2bd63997cba454b2744b6f348a45040d (1).mp4" — pasta azul estilo macOS em fundo
   preto, cursor pousa e clica, um cone de luz colorida sai da pasta, os itens voam e
   flutuam no feixe, depois caem de volta e o feixe se fecha. Os itens viraram os 9 logos
   de clientes do carrossel. Loop de 5,2s (a referência tem 4,5s; a parada é 0,6s mais
   longa para dar tempo de ler os logos).
============================================================================= */
const DURATION = 5.2;
const FORMATS = {
  "9x16": { w: 450, h: 800, label: "9:16" },
  "4x5": { w: 450, h: 562.5, label: "4:5" },
};
const LAYOUT = {
  "9x16": { fy: 0.62, logo: 62 },
  "4x5": { fy: 0.68, logo: 50 },
};
const T = {
  click: 0.95, // clique (a música entra)
  open: 1.85, // segundo clique: o feixe abre
  out: 1.95, // logos saem
  back: 4.1, // logos voltam
  close: 4.55, // feixe fecha
};
const CLIENTS = ["ruppel", "arteiro", "dizzy", "kaiiros", "k-dust", "lcs", "vicente", "yuri-miguez", "op-studios"];
// posições finais dentro do feixe (x em fração da largura, y em fração da altura da pasta até o topo)
const SPOTS = [[0.29, 0.2], [0.5, 0.12], [0.71, 0.2], [0.39, 0.38], [0.61, 0.38], [0.25, 0.55], [0.5, 0.55], [0.75, 0.55], [0.5, 0.74]];

/* ---------- Pasta (estilo macOS) ---------- */
function Folder({ x, y, s }) {
  const w = 112;
  const h = 86;
  return (
    <div style={{ position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h, transform: `scale(${s})`, zIndex: 30 }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: w * 0.42, height: 18, borderRadius: "8px 8px 0 0", background: "#5CB9EE" }} />
      <div style={{ position: "absolute", left: 0, top: 9, width: w, height: h - 9, borderRadius: 9, background: "#5CB9EE" }} />
      <div style={{
        position: "absolute", left: 0, top: 21, width: w, height: h - 21, borderRadius: 9,
        background: "linear-gradient(180deg, #74CCF7 0%, #4AAFE9 100%)", boxShadow: "inset 0 1px 0 rgba(255,255,255,.45)",
      }} />
    </div>
  );
}

function Cursor({ x, y, p = 0, o = 1 }) {
  return (
    <div style={{ position: "absolute", left: x - 4, top: y - 2, zIndex: 60, opacity: o, pointerEvents: "none" }}>
      <svg width="26" height="26" viewBox="0 0 28 28" style={{ transform: `scale(${1 - p * 0.15})`, transformOrigin: "4px 2px", filter: "drop-shadow(0 3px 6px rgba(0,0,0,.5))" }}>
        <path d="M4 2 L4 22 L9.5 17 L13 25.5 L16.6 24 L13.2 15.7 L20.5 15.5 Z" fill="#0A0A0A" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

/* ---------- Feixe de luz ---------- */
// Cone de 4 raios com gradientes de cor que correm para cima, borda brilhante e bloom
const RAY_COLORS = [
  ["#FF3FA4", "#FFE36E", "#5A7CFF", "#FF5A3C", "#FF3FA4"],
  ["#FF5A3C", "#FFFFFF", "#FF3FA4", "#5A7CFF", "#FF5A3C"],
  ["#5A7CFF", "#FF3FA4", "#FFE36E", "#FFFFFF", "#5A7CFF"],
  ["#FFE36E", "#5A7CFF", "#FF5A3C", "#FF3FA4", "#FFE36E"],
];
function LightBeam({ t, W, fy, H }) {
  if (t < T.open - 0.02 || t > T.close + 0.35) return null;
  const openS = spring(t - T.open, { stiffness: 140, damping: 16 });
  const reach = easeOut(prog(t, T.open, T.open + 0.18)); // altura sobe rápido
  const shut = easeInOut(prog(t, T.close, T.close + 0.3)); // estreita até virar um traço
  const fade = 1 - prog(t, T.close + 0.22, T.close + 0.32);
  const base = 92; // largura na boca da pasta
  const topW = lerp(base, W * 0.86, clamp(openS, 0, 1.15)) * (1 - shut * 0.94);
  const baseW = base * (1 - shut * 0.7);
  const yBase = fy - 24;
  const yTop = lerp(yBase, -20, reach);
  const cx = W / 2;
  const flow = (t * 160) % 400; // as cores correm para cima
  const rays = RAY_COLORS.map((cols, i) => {
    const a = i / 4;
    const b = (i + 1) / 4;
    const poly = `polygon(${cx - topW / 2 + topW * a}px ${yTop}px, ${cx - topW / 2 + topW * b}px ${yTop}px, ${cx - baseW / 2 + baseW * b}px ${yBase}px, ${cx - baseW / 2 + baseW * a}px ${yBase}px)`;
    return (
      <div key={i} style={{
        position: "absolute", inset: 0, clipPath: poly, WebkitClipPath: poly,
        backgroundImage: `linear-gradient(180deg, ${cols.join(", ")})`, backgroundSize: "100% 400px", backgroundPosition: `0 ${-flow + i * 70}px`,
      }} />
    );
  });
  const outline = `polygon(${cx - topW / 2}px ${yTop}px, ${cx + topW / 2}px ${yTop}px, ${cx + baseW / 2}px ${yBase}px, ${cx - baseW / 2}px ${yBase}px)`;
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 10, opacity: fade }}>
      {/* bloom: cópia desfocada por trás */}
      <div style={{ position: "absolute", inset: 0, filter: "blur(18px)", opacity: 0.75 }}>{rays}</div>
      <div style={{ position: "absolute", inset: 0 }}>{rays}</div>
      {/* véu branco suave no centro, como o brilho da referência */}
      <div style={{
        position: "absolute", inset: 0, clipPath: outline, WebkitClipPath: outline, mixBlendMode: "soft-light",
        background: "linear-gradient(180deg, rgba(255,255,255,.35), rgba(255,255,255,0) 60%, rgba(255,255,255,.5))",
      }} />
    </div>
  );
}

/* ---------- Logos ---------- */
function Logos({ t, W, fy, size }) {
  if (t < T.out || t > T.close + 0.1) return null;
  const yBase = fy - 30;
  return (
    <>
      {CLIENTS.map((id, i) => {
        const [sx, sy] = SPOTS[i];
        const tx = sx * W;
        const ty = lerp(yBase, 30, sy) + 10;
        const d = i * 0.035;
        const go = spring(t - T.out - d, { stiffness: 120, damping: 13 });
        const back = easeIn(prog(t, T.back + (8 - i) * 0.025, T.back + 0.38 + (8 - i) * 0.025));
        // trajetória: sai da boca da pasta em arco até a posição, volta caindo
        const p = clamp(go, 0, 1.2);
        let x = lerp(W / 2, tx, p);
        let y = lerp(yBase, ty, p) - Math.sin(clamp(go) * Math.PI) * 30;
        const floatY = Math.sin(t * 2.4 + i * 1.3) * 5 * clamp(go);
        const floatR = Math.sin(t * 1.8 + i) * 8;
        x = lerp(x, W / 2 + (i - 4) * 4, back);
        y = lerp(y + floatY, yBase + 20, back);
        const sc = lerp(0.35, 1, clamp(go * 1.4)) * lerp(1, 0.45, back);
        const o = clamp((t - T.out - d) * 10) * (1 - prog(back, 0.85, 1));
        return (
          <div key={id} style={{
            position: "absolute", left: x - size / 2, top: y - size / 2, width: size, height: size, zIndex: 20, opacity: o,
            transform: `scale(${sc}) rotate(${(1 - clamp(go)) * -90 + floatR + back * 120}deg)`,
          }}>
            <img src={CLIENT_LOGOS[id]} alt={id} draggable={false} style={{
              width: "100%", height: "100%", borderRadius: "50%", display: "block",
              boxShadow: "0 8px 20px rgba(0,0,0,.45), 0 0 0 2px rgba(255,255,255,.9)",
            }} />
          </div>
        );
      })}
    </>
  );
}

function Frame({ t, format = "9x16" }) {
  const F = FORMATS[format];
  const L = LAYOUT[format];
  const W = F.w;
  const fy = L.fy * F.h;
  // cursor: entra pela direita, pousa na pasta, clica duas vezes e sobe com o feixe
  const arrive = easeOut(prog(t, 0.05, 0.55));
  let cx = lerp(W * 0.78, W / 2 + 8, arrive);
  let cy = lerp(fy + 120, fy + 6, arrive);
  const leave = easeInOut(prog(t, T.open - 0.05, T.open + 0.35));
  cx = lerp(cx, W / 2 + 4, leave);
  cy = lerp(cy, fy - 260, leave);
  const curO = 1 - prog(t, T.open + 0.15, T.open + 0.4);
  const press = Math.max(...[T.click, T.open - 0.12].map((c) => {
    const d = t - c;
    return d < 0 || d > 0.22 ? 0 : d < 0.07 ? d / 0.07 : 1 - (d - 0.07) / 0.15;
  }));
  // pasta: afunda no clique e dá um "pulo" quando o feixe abre e quando os logos voltam
  const bounce = Math.exp(-Math.max(0, t - T.open) * 8) * Math.sin(Math.max(0, t - T.open) * 30) * 0.06 * (t > T.open ? 1 : 0)
    + Math.exp(-Math.max(0, t - T.close) * 8) * Math.sin(Math.max(0, t - T.close) * 30) * 0.05 * (t > T.close ? 1 : 0);
  const fs = 1 - press * 0.06 + bounce;
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: "#000000", fontFamily: FONT }}>
      <LightBeam t={t} W={W} fy={fy} H={F.h} />
      <Logos t={t} W={W} fy={fy} size={L.logo} />
      <Folder x={W / 2} y={fy} s={fs} />
      <div style={{ position: "absolute", left: 0, right: 0, top: fy + 50, textAlign: "center", color: "#FFFFFF", fontFamily: FONT, fontWeight: 600, fontSize: 12.5, zIndex: 31 }}>
        Nossos clientes
      </div>
      {curO > 0 && <Cursor x={cx} y={cy} p={press} o={curO} />}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 26, textAlign: "center", ...DISP, fontSize: 10, letterSpacing: ".08em", color: "rgba(255,255,255,.4)", zIndex: 31 }}>
        Estoke ao Cubo
      </div>
      <Grain t={t} opacity={0.04} />
    </div>
  );
}

/* =============================================================================
   Som — segue o desenho da referência: sopro do cursor, silêncio, clique e a música
   entra; grave na abertura do feixe, brilhos na saída dos logos, sparkle subindo na
   volta e decaimento curto
============================================================================= */
function buildEvents() {
  const ev = [];
  const add = (t, fn) => ev.push({ t, fn });
  add(0.0, (A, w) => hiss(A, w, { type: "highpass", f: 4000, f2: 6500, dur: 0.48, v: 0.05, shape: "swell", pan: 0.5, panTo: 0 }));
  const click = (A, w) => {
    hiss(A, w, { type: "highpass", f: 3500, dur: 0.015, v: 0.3 });
    tone(A, w, { type: "square", f: 2200, dur: 0.015, v: 0.04 });
  };
  add(T.click, click);
  add(T.open - 0.12, click);
  // música: 128 BPM, de 0,95s até 4,3s
  const B = 60 / 128;
  const CH = [[45, 52, 57, 60, 64], [41, 48, 53, 57, 60], [43, 50, 55, 59, 62], [40, 47, 52, 56, 59]];
  let k = 0;
  for (let tb = T.click; tb < 4.25; tb += B, k++) {
    const ch = CH[Math.floor(k / 2) % CH.length];
    add(tb, (A, w) => SND.kick(A, w, 0.95));
    if (k % 2 === 1) add(tb, (A, w) => SND.clap(A, w, 0.9));
    add(tb + B / 2, (A, w) => SND.hat(A, w, 0.8, 0.25));
    add(tb + B / 4, (A, w) => SND.hat(A, w, 0.35, -0.3));
    add(tb + (3 * B) / 4, (A, w) => SND.hat(A, w, 0.35, -0.3));
    add(tb, (A, w) => SND.bass(A, w, ch[0] - 12, B * 0.45, 1));
    add(tb + B / 2, (A, w) => SND.bass(A, w, ch[0], B * 0.3, 0.7));
    if (k % 2 === 0) add(tb, (A, w) => ch.slice(1).forEach((n, j) => tone(A, w + j * 0.01, { type: "triangle", f: midi(n + 12), dur: B * 0.9, v: 0.035, send: 0.35, pan: j / 3 - 0.5 })));
    // corpo contínuo, como a música da referência: pad sustentada a cada dois tempos
    if (k % 2 === 0) add(tb, (A, w) => SND.pad(A, w, ch.slice(0, 4), Math.min(B * 2, 4.3 - tb), 2200, 2.4));
  }
  // abertura do feixe: grave + whoosh subindo
  add(T.open, (A, w) => {
    tone(A, w, { f: 95, f2: 40, glide: 0.4, dur: 0.7, v: 0.6, send: 0.3 });
    SND.whoosh(A, w, { dur: 0.5, from: 300, to: 5000, v: 0.24, pan: 0, panTo: 0 });
  });
  // brilho dos logos saindo (um "ping" por logo)
  CLIENTS.forEach((_, i) => add(T.out + 0.25 + i * 0.035, (A, w) => tone(A, w, { f: midi([84, 88, 91, 86, 89, 93, 84, 88, 96][i]), dur: 0.35, v: 0.035, send: 0.5, pan: (i % 3) / 2 - 0.5 })));
  add(T.out + 0.2, (A, w) => SND.shimmer(A, w, 0.9));
  // volta: sparkle subindo de tom (como a referência) + fechamento
  for (let i = 0; i < 10; i++) add(T.back - 0.1 + i * 0.05, (A, w) => tone(A, w, { f: midi(84 + i * 2), dur: 0.18, v: 0.03, send: 0.5, pan: i % 2 ? 0.4 : -0.4 }));
  add(T.back, (A, w) => hiss(A, w, { type: "highpass", f: 3000, f2: 9000, dur: 0.5, v: 0.08, shape: "swell" }));
  add(T.close, (A, w) => {
    tone(A, w, { f: 180, f2: 70, glide: 0.12, dur: 0.25, v: 0.3 });
    hiss(A, w, { type: "lowpass", f: 1200, dur: 0.12, v: 0.15 });
  });
  return ev.sort((a, b) => a.t - b.t);
}
const EVENTS = buildEvents();
const renderWav = () => renderEventsWav(EVENTS, DURATION, { loop: true });

// Usado pelo exportador de vídeo (scripts/export-video.cjs)
const MOTION = { Frame, duration: DURATION, formats: FORMATS, renderWav, loop: true };

export default function FolderReveal() {
  return (
    <MotionPlayer Frame={Frame} duration={DURATION} events={EVENTS} formats={FORMATS} defaultFormat="9x16" renderWav={renderWav}
      scenes={[{ name: "Cursor", from: 0 }, { name: "Feixe", from: T.open }, { name: "Volta", from: T.back }]} />
  );
}
