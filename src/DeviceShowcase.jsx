import React from "react";
import {
  C, DISP, FONT, clamp, lerp, prog, easeOut, easeInOut, rnd, spring, hexA, vel,
  Wordmark, Grain, SND, renderEventsWav, MotionPlayer,
} from "./motionKit";
import { SITE } from "./sites/showcase";

/* =============================================================================
   Estoke ao Cubo — Apresentação de site (DeviceShowcase, loop de 15s)
   Referência: tablet flutuando em 3D sobre fundo escuro com esferas brilhantes
   desfocadas; o site rola seção a seção e o aparelho gira entre os planos.
   O conteúdo vem de src/sites/showcase.js (gerado por scripts/capture-site.cjs).
============================================================================= */
const DURATION = 15;
const FORMATS = {
  "9x16": { w: 450, h: 800, label: "9:16" },
  "4x5": { w: 450, h: 562.5, label: "4:5" },
};
const LAYOUT = {
  "9x16": { cx: 225, cy: 400, device: 1.08, labelY: 640, top: 46 },
  "4x5": { cx: 225, cy: 280, device: 0.95, labelY: 470, top: 24 },
};
const RIM = C.cyan; // cor do contorno de luz das esferas (a referência usa laranja: "#FF7A2F")
const PROJECT = { name: SITE.projectName || "Projeto", url: SITE.displayUrl || SITE.url.replace(/^https?:\/\//, "").replace(/\/$/, "") };

/* ---------- Aparelho ---------- */
const DEV = { w: 400, h: 286, bezel: 11, r: 26 };
const SCREEN = { w: DEV.w - DEV.bezel * 2, h: DEV.h - DEV.bezel * 2 };
const IMG_SCALE = SCREEN.w / SITE.width; // px lógicos por px da imagem
const VIEW_H = SCREEN.h / IMG_SCALE; // altura visível da página, em px da imagem
const MAX_SCROLL = Math.max(0, SITE.height - VIEW_H);
// Seções do roteiro: SITE.story (índices em SITE.sections) ou as 5 primeiras detectadas
const STORY = (SITE.story || [0, 1, 2, 3, 4]).map((i) => SITE.sections[Math.min(i, SITE.sections.length - 1)]);
const secTop = (i, frac = 0) => {
  const s = STORY[Math.min(i, STORY.length - 1)];
  return clamp(s.top + frac * Math.min(s.h, VIEW_H * 0.9) - 20, 0, MAX_SCROLL);
};

// Planos: pose do aparelho (graus, px, escala), deriva lenta (push-in) e rolagem da página
const A = { rx: 14, ry: -12, rz: -5, x: 0, y: -6, s: 1 };
const SHOTS = [
  { from: 0, to: 4.5, pose: A, drift: { ry: 6, rz: 1.5, s: 0.05 }, scroll: [[0, 0], [1.4, 0], [4.3, 0.55]] },
  { from: 5.2, to: 8.2, pose: { rx: -24, ry: 14, rz: 7, x: 4, y: 34, s: 1.05 }, drift: { ry: -6, rx: 4, s: 0.06 }, scroll: [[5.2, 1.0], [8.2, 1.45]] },
  { from: 8.9, to: 11.0, pose: { rx: 22, ry: 16, rz: -7, x: -6, y: -18, s: 0.98 }, drift: { ry: -5, s: 0.05 }, scroll: [[8.9, 2.0], [11.0, 2.45]] },
  { from: 11.6, to: 13.3, pose: { rx: 10, ry: -20, rz: 6, x: 6, y: 6, s: 1.02 }, drift: { ry: 5, s: 0.04 }, scroll: [[11.6, 3.0], [13.3, 3.45]] },
];
// Rolagem: chaves [tempo, posição] onde posição = índice de seção + fração; fecha o loop voltando ao topo
const SCROLL_KEYS = [...SHOTS.flatMap((s) => s.scroll), [14.5, 0], [15, 0]];
function scrollAt(t) {
  const k = SCROLL_KEYS;
  let p = 0;
  for (let i = 1; i < k.length; i++) {
    if (t <= k[i][0]) {
      const [t0, a] = k[i - 1];
      const [t1, b] = k[i];
      const q = easeInOut(prog(t, t0, t1));
      const ya = secTop(Math.floor(a), a % 1);
      const yb = secTop(Math.floor(b), b % 1);
      return lerp(ya, yb, q);
    }
    p = i;
  }
  return secTop(Math.floor(k[p][1]), k[p][1] % 1);
}

const KEYS = ["rx", "ry", "rz", "x", "y", "s"];
const poseIn = (shot, t) => {
  const p = easeInOut(prog(t, shot.from, shot.to));
  const o = {};
  KEYS.forEach((k) => (o[k] = (shot.pose[k] || 0) + ((shot.drift && shot.drift[k]) || 0) * p));
  return o;
};
// Overshoot com fim exato para o "chicote" entre planos
const backOut = (p, s = 1.2) => 1 + (s + 1) * Math.pow(p - 1, 3) + s * Math.pow(p - 1, 2);
function poseAt(t) {
  for (let i = 0; i < SHOTS.length; i++) {
    const sh = SHOTS[i];
    if (t >= sh.from && t <= sh.to) return poseIn(sh, t);
    const next = SHOTS[i + 1];
    const nFrom = next ? next.from : DURATION;
    if (t > sh.to && t < nFrom) {
      const a = poseIn(sh, sh.to);
      const b = next ? poseIn(next, next.from) : poseIn(SHOTS[0], 0);
      const q = backOut(easeInOut(prog(t, sh.to, nFrom)));
      const o = {};
      KEYS.forEach((k) => (o[k] = lerp(a[k], b[k], q)));
      // giro extra no meio do chicote
      const mid = Math.sin(prog(t, sh.to, nFrom) * Math.PI);
      o.ry += mid * (i % 2 ? -18 : 18);
      o.s -= mid * 0.06;
      return o;
    }
  }
  return poseIn(SHOTS[0], 0);
}

function Device({ t, L }) {
  const p = poseAt(t);
  const pv = Math.abs(vel((tt) => poseAt(tt).ry, t)) + Math.abs(vel((tt) => poseAt(tt).rx, t));
  const blur = Math.min(10, pv * 0.035);
  const sy = scrollAt(t);
  const sv = Math.abs(vel(scrollAt, t)) * IMG_SCALE; // px lógicos/s
  const scrollBlur = Math.min(5, sv * 0.004);
  const bob = Math.sin((t / DURATION) * Math.PI * 2 * 2) * 4;
  // Reflexo: a faixa de brilho desliza conforme o aparelho gira
  const glare = 50 + p.ry * 2.2 - p.rx * 1.2;
  return (
    <div style={{
      position: "absolute", left: L.cx - DEV.w / 2, top: L.cy - DEV.h / 2, width: DEV.w, height: DEV.h, perspective: 1100, zIndex: 20,
      filter: blur > 0.4 ? `blur(${blur.toFixed(2)}px)` : "none",
    }}>
      <div style={{
        position: "absolute", inset: 0, transformStyle: "preserve-3d",
        transform: `translate(${p.x}px, ${p.y + bob}px) scale(${p.s * L.device}) rotateX(${p.rx}deg) rotateY(${p.ry}deg) rotateZ(${p.rz}deg)`,
      }}>
        {/* espessura: placa traseira deslocada no eixo Z */}
        <div style={{ position: "absolute", inset: 0, borderRadius: DEV.r, background: "linear-gradient(135deg, #2A3445, #0B0F17 60%)", transform: "translateZ(-10px)", boxShadow: `0 40px 80px -20px rgba(0,0,0,.8), 0 0 40px ${hexA(RIM, 0.12)}` }} />
        <div style={{
          position: "absolute", inset: 0, borderRadius: DEV.r, background: "linear-gradient(145deg, #3A4558 0%, #121820 30%, #0A0E15 100%)", padding: DEV.bezel,
          boxShadow: `inset 0 0 0 1.5px rgba(255,255,255,.14), inset 0 1px 0 rgba(255,255,255,.25)`,
        }}>
          <div style={{ position: "relative", width: SCREEN.w, height: SCREEN.h, borderRadius: DEV.r - DEV.bezel + 2, overflow: "hidden", background: "#000" }}>
            <img src={SITE.src} alt={SITE.title} draggable={false} style={{
              position: "absolute", left: 0, top: 0, width: SCREEN.w, display: "block", transform: `translateY(${-sy * IMG_SCALE}px)`,
              filter: scrollBlur > 0.4 ? `blur(${scrollBlur.toFixed(2)}px)` : "none",
            }} />
            <div style={{ position: "absolute", inset: 0, background: `linear-gradient(115deg, transparent ${glare - 18}%, rgba(255,255,255,.12) ${glare}%, transparent ${glare + 14}%)`, pointerEvents: "none" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Esferas (bokeh com contorno de luz) ---------- */
// z < 0 atrás do aparelho, z > 0 na frente; o desfoque cresce com a distância do plano focal.
// Posicionadas à mão como na referência: acima e abaixo do aparelho, deixando a tela livre.
const SPHERES = [
  { x: 120, y: 40, r: 110, z: -0.25 }, { x: 390, y: 130, r: 70, z: -0.5 }, { x: 20, y: 250, r: 45, z: -0.85 },
  { x: 300, y: 650, r: 120, z: -0.3 }, { x: 70, y: 720, r: 70, z: -0.6 }, { x: 430, y: 560, r: 40, z: -0.9 },
  { x: 230, y: 790, r: 60, z: -0.75 }, { x: 470, y: 330, r: 55, z: -0.7 },
  { x: -20, y: 520, r: 90, z: 0.75 }, // única de primeiro plano fixa, cortada na borda
].map((sp, i) => ({ ...sp, ax: 14 + rnd(i, 5) * 22, ay: 18 + rnd(i, 6) * 30, ph: rnd(i, 7) * Math.PI * 2 }));
// Esferas de primeiro plano que cruzam a tela nas trocas de plano (funcionam como wipe)
const CROSS = SHOTS.map((s, i) => ({ t: s.to + 0.05, dir: i % 2 ? -1 : 1 })).concat([{ t: 13.6, dir: 1 }]);

function Sphere({ x, y, r, z, H }) {
  const blur = Math.abs(z) * (z > 0 ? 16 : 9);
  const k = lerp(0.55, 1, 1 - Math.max(0, -z));
  return (
    <div style={{
      position: "absolute", left: x - r, top: (y / 800) * H - r, width: r * 2, height: r * 2, borderRadius: "50%", zIndex: z > 0 ? 40 : 5,
      background: `radial-gradient(circle at 34% 30%, rgba(140,190,230,${0.28 * k}) 0%, rgba(20,40,60,0) 32%), radial-gradient(circle at 50% 50%, #0E2438 0%, #081422 62%, #040A12 100%)`,
      boxShadow: `inset ${-r * 0.14}px ${-r * 0.12}px ${r * 0.22}px ${-r * 0.07}px ${hexA(RIM, 0.85 * k)}, 0 0 ${r * 0.35}px ${hexA(RIM, 0.12 * k)}`,
      filter: blur > 0.5 ? `blur(${blur.toFixed(1)}px)` : "none", opacity: lerp(0.55, 1, k),
    }} />
  );
}

function Spheres({ t, H, front }) {
  const ph = (t / DURATION) * Math.PI * 2; // fase periódica: o loop fecha
  const items = SPHERES.filter((s) => (front ? s.z > 0 : s.z <= 0)).map((s, i) => (
    <Sphere key={i} x={s.x + Math.sin(ph + s.ph) * s.ax} y={s.y + Math.cos(ph * (s.z > 0 ? 2 : 1) + s.ph) * s.ay} r={s.r * (1 + Math.max(0, s.z) * 0.6)} z={s.z} H={H} />
  ));
  if (front) {
    CROSS.forEach((c, i) => {
      const p = prog(t, c.t - 0.45, c.t + 0.45);
      if (p <= 0 || p >= 1) return;
      const e = easeInOut(p);
      items.push(<Sphere key={`c${i}`} x={c.dir > 0 ? lerp(560, -120, e) : lerp(-120, 560, e)} y={lerp(980, 120, e)} r={170} z={1} H={H} />);
    });
  }
  return <>{items}</>;
}

/* ---------- Textos (discretos, como na referência) ---------- */
function ProjectLabel({ t, L }) {
  const s = spring(t - 0.5, { stiffness: 170, damping: 18 });
  const out = easeOut(prog(t, 3.9, 4.4));
  if (t > 4.5) return null;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: L.labelY, zIndex: 60, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, opacity: clamp(s * 1.5) * (1 - out), transform: `translateY(${(1 - s) * 14 - out * 10}px)` }}>
      <div style={{ fontFamily: FONT, fontSize: 10.5, fontWeight: 700, letterSpacing: ".3em", color: RIM }}>PROJETO</div>
      <div style={{ ...DISP, fontSize: 20, color: "#FFFFFF", textAlign: "center" }}>{PROJECT.name}</div>
      <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: hexA(C.ice, 0.75) }}>{PROJECT.url}</div>
    </div>
  );
}

function Frame({ t, format = "9x16" }) {
  const F = FORMATS[format];
  const L = LAYOUT[format];
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", fontFamily: FONT, background: "radial-gradient(ellipse at 50% 40%, #0A1422 0%, #05090F 60%, #020407 100%)" }}>
      <Spheres t={t} H={F.h} front={false} />
      <Device t={t} L={L} />
      <Spheres t={t} H={F.h} front />
      <div style={{ position: "absolute", left: 0, right: 0, top: L.top, zIndex: 60, display: "flex", justifyContent: "center", opacity: 0.85 }}>
        <Wordmark size={11} color="#FFFFFF" inline />
      </div>
      <ProjectLabel t={t} L={L} />
      <div style={{ position: "absolute", inset: 0, zIndex: 70, background: "radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(0,0,0,.6) 100%)", pointerEvents: "none" }} />
      <Grain t={t} opacity={0.07} />
    </div>
  );
}

/* =============================================================================
   Som — ambiente em loop de 15s: pad, pulsos suaves, whoosh nos giros
============================================================================= */
const CHORDS = [[45, 52, 55, 60], [41, 48, 52, 57], [48, 55, 59, 64], [43, 50, 55, 59]]; // Am7 · Fmaj7 · Cmaj7 · G
function buildEvents() {
  const ev = [];
  const add = (t, fn) => ev.push({ t, fn });
  CHORDS.forEach((ch, i) => add(i * 3.75, (A, w) => SND.pad(A, w, ch, 3.75, 1300, 1.2)));
  for (let b = 0; b < 30; b++) {
    const tb = b * 0.5;
    const ch = CHORDS[Math.floor(tb / 3.75)];
    if (b % 2 === 0) add(tb, (A, w) => SND.sub(A, w, ch[0] - 12, 0.9, 0.7));
    add(tb + 0.25, (A, w) => SND.hat(A, w, 0.45, b % 2 ? 0.4 : -0.4));
    if (b % 4 === 0) add(tb, (A, w) => SND.kick(A, w, 0.45));
    add(tb, (A, w) => SND.pluck(A, w, ch[(b * 3) % 4] + 24, 0.35, b % 2 ? 0.5 : -0.5));
  }
  SHOTS.forEach((s, i) => {
    add(s.to - 0.05, (A, w) => SND.whoosh(A, w, { dur: 0.75, from: 300, to: 3200, v: 0.24, pan: i % 2 ? 0.8 : -0.8, panTo: i % 2 ? -0.8 : 0.8 }));
    add(s.to + 0.55, (A, w) => SND.pop(A, w, 520 + i * 90, 0.09));
  });
  add(13.5, (A, w) => SND.whoosh(A, w, { dur: 0.9, from: 4000, to: 300, v: 0.2, pan: 0, panTo: 0 }));
  add(0.5, (A, w) => SND.shimmer(A, w, 0.6));
  return ev.sort((a, b) => a.t - b.t);
}
const EVENTS = buildEvents();
const renderWav = () => renderEventsWav(EVENTS, DURATION, { loop: true });

// Usado pelo exportador de vídeo (scripts/export-video.cjs)
const MOTION = { Frame, duration: DURATION, formats: FORMATS, renderWav, loop: true };

export default function DeviceShowcase() {
  return (
    <MotionPlayer Frame={Frame} duration={DURATION} events={EVENTS} formats={FORMATS} defaultFormat="9x16" renderWav={renderWav}
      scenes={[{ name: "Início", from: 0 }, { name: "Seção 2", from: 4.5 }, { name: "Seção 3", from: 8.2 }, { name: "Seção 4", from: 11 }, { name: "Volta", from: 13.3 }]} />
  );
}
