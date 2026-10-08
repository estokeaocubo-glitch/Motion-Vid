import React, { useRef, useLayoutEffect, useEffect } from "react";
import {
  C, DISP, FONT, clamp, lerp, prog, easeOut, easeInOut, rnd, spring, hexA, vel, midi, tone, hiss,
  fitSize, Wordmark, Grain, SND, renderEventsWav, MotionPlayer,
} from "./motionKit";
// "./sites/current" é resolvido no build para o site de cada apresentação (scripts/build-html.mjs)
import { SITE } from "./sites/current";

/* =============================================================================
   Estoke ao Cubo — Apresentação de site (DeviceShowcase, loop)
   Referência: tablet flutuando em 3D sobre fundo escuro com esferas brilhantes
   desfocadas; o site passa seção a seção e o aparelho gira entre os planos.
   Conteúdo da tela (src/sites/<site>.js):
   - modo vídeo: trechos de uma gravação de tela, um por plano (cortes escondidos no giro)
   - modo imagem: print de página inteira rolando (scripts/capture-site.cjs)
============================================================================= */
const N_SHOTS = SITE.shots || 5;
const DURATION = SITE.video ? SITE.video.duration : 15;
const T = DURATION / N_SHOTS; // duração de cada plano; os cortes caem em k·T, no meio do giro
const TR = 0.7; // duração do "chicote" entre planos
const ACCENT = SITE.accent || C.cyan;
const THEME = {
  label: ACCENT,
  bg: ["#0A1422", "#05090F", "#020407"],
  sphere: ["#0E2438", "#081422", "#040A12"],
  highlight: "140,190,230",
  ...(SITE.theme || {}),
};
const FORMATS = {
  "9x16": { w: 450, h: 800, label: "9:16" },
  "4x5": { w: 450, h: 562.5, label: "4:5" },
};
const LAYOUT = {
  "9x16": { cx: 225, cy: 400, device: 1.08, labelY: 612, top: 46 },
  "4x5": { cx: 225, cy: 270, device: 0.95, labelY: 440, top: 24 },
};

/* ---------- Aparelho ---------- */
const SCREEN_RATIO = SITE.video ? SITE.video.w / SITE.video.h : 1.44;
const DEV = { w: 400, bezel: 10, r: 24 };
const SCREEN = { w: DEV.w - DEV.bezel * 2, h: Math.round((DEV.w - DEV.bezel * 2) / SCREEN_RATIO) };
DEV.h = SCREEN.h + DEV.bezel * 2;

// Poses por plano (graus, px, escala) e deriva lenta dentro do plano (push-in)
const POSES = [
  { p: { rx: 12, ry: -14, rz: -5, x: 0, y: -6, s: 1 }, d: { ry: 7, rz: 1.5, s: 0.06 } },
  { p: { rx: -24, ry: 14, rz: 7, x: 4, y: 30, s: 1.04 }, d: { ry: -6, rx: 4, s: 0.06 } },
  { p: { rx: 20, ry: 16, rz: -7, x: -6, y: -16, s: 0.98 }, d: { ry: -5, s: 0.05 } },
  { p: { rx: 8, ry: -20, rz: 6, x: 6, y: 6, s: 1.02 }, d: { ry: 6, s: 0.05 } },
  { p: { rx: -16, ry: -8, rz: -4, x: -4, y: 20, s: 1.03 }, d: { rx: 5, ry: 5, s: 0.05 } },
  { p: { rx: 16, ry: 12, rz: 5, x: 2, y: -10, s: 1 }, d: { ry: -6, s: 0.06 } },
];
const KEYS = ["rx", "ry", "rz", "x", "y", "s"];
const poseOf = (k, p) => {
  const P = POSES[((k % POSES.length) + POSES.length) % POSES.length];
  const o = {};
  KEYS.forEach((key) => (o[key] = (P.p[key] || 0) + (P.d[key] || 0) * p));
  return o;
};
// Overshoot com fim exato, para o giro "assentar" e o loop fechar
const backOut = (p, s = 1.2) => 1 + (s + 1) * Math.pow(p - 1, 3) + s * Math.pow(p - 1, 2);
const wrapT = (t) => ((t % DURATION) + DURATION) % DURATION;
function poseAt(tt) {
  const t = wrapT(tt);
  const k = Math.floor(t / T);
  const local = t - k * T;
  let a;
  let b;
  let q;
  let i;
  if (local < TR / 2) {
    a = poseOf(k - 1, 1);
    b = poseOf(k, 0);
    q = (local + TR / 2) / TR;
    i = k;
  } else if (local > T - TR / 2) {
    a = poseOf(k, 1);
    b = poseOf(k + 1, 0);
    q = (local - (T - TR / 2)) / TR;
    i = k + 1;
  } else return poseOf(k, (local - TR / 2) / (T - TR));
  const e = backOut(easeInOut(q));
  const o = {};
  KEYS.forEach((key) => (o[key] = lerp(a[key], b[key], e)));
  const mid = Math.sin(q * Math.PI);
  o.ry += mid * (i % 2 ? -20 : 20);
  o.s -= mid * 0.07;
  return o;
}

/* ---------- Conteúdo da tela ---------- */
// Vídeo sincronizado com a timeline: no player corrige deriva e pausa junto;
// na exportação (window.__CAPTURE) busca o quadro exato de cada instante.
function ScreenVideo({ t }) {
  const ref = useRef(null);
  const last = useRef({ t: 0, at: 0 });
  useLayoutEffect(() => {
    const v = ref.current;
    if (!v) return;
    const target = wrapT(t);
    if (typeof window !== "undefined" && window.__CAPTURE) {
      if (!v.paused) v.pause();
      if (Math.abs(v.currentTime - target) > 0.0005) v.currentTime = target;
      return;
    }
    last.current = { t: target, at: performance.now() };
    if (Math.abs(v.currentTime - target) > 0.15) v.currentTime = target;
    if (v.paused) v.play().catch(() => {});
  }, [t]);
  useEffect(() => {
    const id = setInterval(() => {
      const v = ref.current;
      if (!v || window.__CAPTURE) return;
      if (performance.now() - last.current.at > 150 && !v.paused) {
        v.pause();
        v.currentTime = last.current.t;
      }
    }, 80);
    return () => clearInterval(id);
  }, []);
  return (
    <video ref={ref} muted playsInline preload="auto" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }}>
      <source src={SITE.video.webm} type="video/webm" />
      <source src={SITE.video.mp4} type="video/mp4" />
    </video>
  );
}

// Modo imagem: print de página inteira rolando seção a seção
function ScreenImage({ t }) {
  const scale = SCREEN.w / SITE.width;
  const viewH = SCREEN.h / scale;
  const maxScroll = Math.max(0, SITE.height - viewH);
  const story = (SITE.story || [0, 1, 2, 3, 4]).map((i) => SITE.sections[Math.min(i, SITE.sections.length - 1)]);
  const top = (k, f) => {
    const s = story[((k % story.length) + story.length) % story.length];
    return clamp(s.top + f * Math.min(s.h, viewH * 0.9) - 20, 0, maxScroll);
  };
  const scrollAt = (tt) => {
    const w = wrapT(tt);
    const k = Math.floor(w / T);
    const local = w - k * T;
    if (local > T - TR / 2) return lerp(top(k, 0.45), top(k + 1, 0), easeInOut((local - (T - TR / 2)) / TR));
    if (local < TR / 2) return lerp(top(k - 1, 0.45), top(k, 0), easeInOut((local + TR / 2) / TR));
    return lerp(top(k, 0), top(k, 0.45), easeInOut((local - TR / 2) / (T - TR)));
  };
  const sy = scrollAt(t);
  const blur = Math.min(5, Math.abs(vel(scrollAt, t)) * scale * 0.004);
  return (
    <img src={SITE.src} alt={SITE.title} draggable={false} style={{
      position: "absolute", left: 0, top: 0, width: SCREEN.w, display: "block", transform: `translateY(${-sy * scale}px)`,
      filter: blur > 0.4 ? `blur(${blur.toFixed(2)}px)` : "none",
    }} />
  );
}

function Device({ t, L }) {
  const p = poseAt(t);
  const pv = Math.abs(vel((x) => poseAt(x).ry, t)) + Math.abs(vel((x) => poseAt(x).rx, t));
  const blur = Math.min(10, pv * 0.035);
  const bob = Math.sin((wrapT(t) / DURATION) * Math.PI * 2 * 3) * 4;
  const glare = 50 + p.ry * 2.2 - p.rx * 1.2; // o reflexo desliza conforme o aparelho gira
  return (
    <div style={{
      position: "absolute", left: L.cx - DEV.w / 2, top: L.cy - DEV.h / 2, width: DEV.w, height: DEV.h, perspective: 1100, zIndex: 20,
      filter: blur > 0.4 ? `blur(${blur.toFixed(2)}px)` : "none",
    }}>
      <div style={{
        position: "absolute", inset: 0, transformStyle: "preserve-3d",
        transform: `translate(${p.x}px, ${p.y + bob}px) scale(${p.s * L.device}) rotateX(${p.rx}deg) rotateY(${p.ry}deg) rotateZ(${p.rz}deg)`,
      }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: DEV.r, background: "linear-gradient(135deg, #2E2F33, #0C0C0E 60%)", transform: "translateZ(-10px)", boxShadow: `0 40px 80px -20px rgba(0,0,0,.85), 0 0 50px ${hexA(ACCENT, 0.14)}` }} />
        <div style={{
          position: "absolute", inset: 0, borderRadius: DEV.r, background: "linear-gradient(145deg, #45464C 0%, #151517 30%, #0B0B0D 100%)", padding: DEV.bezel,
          boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,.14), inset 0 1px 0 rgba(255,255,255,.25)",
        }}>
          <div style={{ position: "relative", width: SCREEN.w, height: SCREEN.h, borderRadius: DEV.r - DEV.bezel + 2, overflow: "hidden", background: "#0D0D0D" }}>
            {SITE.video ? <ScreenVideo t={t} /> : <ScreenImage t={t} />}
            <div style={{ position: "absolute", inset: 0, background: `linear-gradient(115deg, transparent ${glare - 18}%, rgba(255,255,255,.1) ${glare}%, transparent ${glare + 14}%)`, pointerEvents: "none" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Esferas (bokeh com contorno de luz) ---------- */
// z < 0 atrás do aparelho, z > 0 na frente; o desfoque cresce com a distância do plano focal.
// Posicionadas como na referência: acima e abaixo do aparelho, deixando a tela livre.
const SPHERES = [
  { x: 120, y: 40, r: 110, z: -0.25 }, { x: 390, y: 130, r: 70, z: -0.5 }, { x: 20, y: 250, r: 45, z: -0.85 },
  { x: 300, y: 650, r: 120, z: -0.3 }, { x: 70, y: 720, r: 70, z: -0.6 }, { x: 430, y: 560, r: 40, z: -0.9 },
  { x: 230, y: 790, r: 60, z: -0.75 }, { x: 470, y: 330, r: 55, z: -0.7 },
  { x: -10, y: 760, r: 70, z: 0.7 }, // única de primeiro plano fixa, abaixo do aparelho
].map((sp, i) => ({ ...sp, ax: 14 + rnd(i, 5) * 22, ay: 18 + rnd(i, 6) * 30, ph: rnd(i, 7) * Math.PI * 2 }));
// Esferas de primeiro plano que cruzam a tela nos cortes (funcionam como wipe)
const CROSS = Array.from({ length: N_SHOTS }, (_, k) => ({ t: k * T, dir: k % 2 ? -1 : 1 }));

function Sphere({ x, y, r, z, H }) {
  const blur = Math.abs(z) * (z > 0 ? 16 : 9);
  const k = lerp(0.55, 1, 1 - Math.max(0, -z));
  return (
    <div style={{
      position: "absolute", left: x - r, top: (y / 800) * H - r, width: r * 2, height: r * 2, borderRadius: "50%", zIndex: z > 0 ? 40 : 5,
      background: `radial-gradient(circle at 34% 30%, rgba(${THEME.highlight},${0.16 * k}) 0%, rgba(0,0,0,0) 32%), radial-gradient(circle at 50% 50%, ${THEME.sphere[0]} 0%, ${THEME.sphere[1]} 62%, ${THEME.sphere[2]} 100%)`,
      boxShadow: `inset ${-r * 0.14}px ${-r * 0.12}px ${r * 0.22}px ${-r * 0.07}px ${hexA(ACCENT, 0.95 * k)}, 0 0 ${r * 0.35}px ${hexA(ACCENT, 0.14 * k)}`,
      filter: blur > 0.5 ? `blur(${blur.toFixed(1)}px)` : "none", opacity: lerp(0.55, 1, k),
    }} />
  );
}

function Spheres({ t, H, front }) {
  const ph = (wrapT(t) / DURATION) * Math.PI * 2; // fase periódica: o loop fecha
  const items = SPHERES.filter((s) => (front ? s.z > 0 : s.z <= 0)).map((s, i) => (
    <Sphere key={i} x={s.x + Math.sin(ph + s.ph) * s.ax} y={s.y + Math.cos(ph * (s.z > 0 ? 2 : 1) + s.ph) * s.ay} r={s.r * (1 + Math.max(0, s.z) * 0.6)} z={s.z} H={H} />
  ));
  if (front) {
    const w = wrapT(t);
    CROSS.forEach((c, i) => {
      // distância ao corte com volta no loop (o corte em 0 também acontece em DURATION)
      let d = w - c.t;
      if (d > DURATION / 2) d -= DURATION;
      const p = (d + 0.45) / 0.9;
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
  const out = easeOut(prog(t, T - 0.75, T - 0.3));
  if (t > T) return null;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: L.labelY, zIndex: 60, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, opacity: clamp(s * 1.5) * (1 - out), transform: `translateY(${(1 - s) * 14 - out * 10}px)` }}>
      <div style={{ fontFamily: FONT, fontSize: 10.5, fontWeight: 700, letterSpacing: ".3em", color: THEME.label }}>PROJETO</div>
      <div style={{ ...DISP, fontSize: fitSize(SITE.projectName.toUpperCase(), 390, 21), color: "#FFFFFF", textAlign: "center", whiteSpace: "nowrap" }}>{SITE.projectName}</div>
      <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: "rgba(245,240,235,.72)" }}>{SITE.subtitle || SITE.url}</div>
    </div>
  );
}

function Frame({ t, format = "9x16" }) {
  const F = FORMATS[format];
  const L = LAYOUT[format];
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", fontFamily: FONT, background: `radial-gradient(ellipse at 50% 40%, ${THEME.bg[0]} 0%, ${THEME.bg[1]} 60%, ${THEME.bg[2]} 100%)` }}>
      <Spheres t={t} H={F.h} front={false} />
      <Device t={t} L={L} />
      <Spheres t={t} H={F.h} front />
      <div style={{ position: "absolute", left: 0, right: 0, top: L.top, zIndex: 60, display: "flex", justifyContent: "center", opacity: 0.85 }}>
        <Wordmark size={11} color="#FFFFFF" inline />
      </div>
      <ProjectLabel t={wrapT(t)} L={L} />
      <div style={{ position: "absolute", inset: 0, zIndex: 70, background: "radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(0,0,0,.6) 100%)", pointerEvents: "none" }} />
      <Grain t={t} opacity={0.07} />
    </div>
  );
}

/* =============================================================================
   Som — loop do tamanho do vídeo; cada plano dura 8 tempos e o corte cai no
   tempo 1, com whoosh. Estilo por site (SITE.music):
   - "japanese": escala in (Mi Fá Lá Si Dó), taiko em 3-3-2, koto em arpejo
   - "premium": acordes maj7/add9, pulso de bumbo suave, arpejo de sino limpo
   - "elegant": acordes abertos (add9/maj7), sem bateria, sino a cada dois tempos
============================================================================= */
const BEAT = T / 8;
const taiko = (A, w, v = 1) => {
  tone(A, w, { f: 120, f2: 52, glide: 0.18, dur: 0.6, v: 0.8 * v, a: 0.004, send: 0.25 });
  hiss(A, w, { type: "lowpass", f: 900, dur: 0.12, v: 0.25 * v });
};
const koto = (A, w, n, v = 1, pan = 0) => {
  tone(A, w, { type: "triangle", f: midi(n) * 1.012, f2: midi(n), glide: 0.04, dur: 0.55, v: 0.1 * v, send: 0.4, pan });
  tone(A, w, { f: midi(n + 12), dur: 0.2, v: 0.025 * v, pan });
};
const STYLES = {
  japanese: {
    scale: [64, 65, 69, 71, 72, 76, 77, 81, 83, 84],
    chords: [[45, 52, 57, 60], [41, 48, 53, 57], [38, 45, 50, 53], [45, 52, 57, 60], [41, 48, 53, 57], [40, 47, 52, 56]],
    motifs: [[0, 2, 4, 5, 4, 2, 3, 1], [2, 4, 5, 7, 5, 4, 2, 4], [5, 4, 2, 1, 2, 4, 5, 7], [7, 5, 4, 5, 7, 8, 7, 5], [4, 5, 7, 9, 7, 5, 4, 2], [2, 1, 0, 1, 2, 4, 2, 0]],
    hits: [0, 3, 6],
    hit: taiko,
    lead: koto,
  },
  premium: {
    scale: [67, 69, 71, 74, 76, 79, 81, 83, 86, 88], // Sol maior pentatônica estendida
    chords: [[43, 50, 54, 59], [40, 47, 50, 55], [36, 43, 47, 52], [38, 45, 50, 54], [43, 50, 54, 59], [40, 47, 50, 55]], // Gmaj7 · Em7 · Cmaj7 · D · …
    motifs: [[0, 2, 4, 5, 4, 2, 4, 6], [1, 3, 5, 6, 5, 3, 5, 7], [2, 4, 6, 7, 6, 4, 6, 8], [3, 5, 7, 8, 7, 5, 4, 2], [0, 2, 4, 5, 4, 2, 4, 6], [1, 3, 5, 6, 5, 3, 2, 1]],
    hits: [0, 2, 4, 6],
    hit: (A, w, v = 1) => SND.kick(A, w, 0.55 * v),
    lead: (A, w, n, v = 1, pan = 0) => SND.bell(A, w, n, 0.55 * v, pan),
  },
};
STYLES.elegant = {
  scale: [62, 64, 66, 69, 71, 74, 76, 78, 81, 83], // Ré maior pentatônica
  chords: [[38, 45, 52, 54, 57], [43, 50, 54, 57, 62], [35, 42, 50, 54, 57], [40, 47, 50, 55, 59], [38, 45, 52, 54, 57], [43, 50, 54, 59, 62]], // Dadd9 · Gmaj7 · Bm7 · Em9 …
  motifs: [[4, -1, 6, -1, 5, -1, 3, -1], [5, -1, 7, -1, 6, -1, 4, -1], [3, -1, 5, -1, 6, -1, 8, -1], [6, -1, 5, -1, 4, -1, 2, -1], [4, -1, 6, -1, 8, -1, 7, -1], [5, -1, 4, -1, 3, -1, 4, -1]],
  hits: [],
  hit: () => {},
  lead: (A, w, n, v = 1, pan = 0) => SND.bell(A, w, n, 0.75 * v, pan),
  noHats: true,
};
const STYLE = STYLES[SITE.music] || STYLES.premium;
function buildEvents() {
  const ev = [];
  const add = (t, fn) => ev.push({ t, fn });
  for (let k = 0; k < N_SHOTS; k++) {
    const t0 = k * T;
    const ch = STYLE.chords[k % STYLE.chords.length];
    add(t0, (A, w) => SND.pad(A, w, ch, T, 1200, 1.1));
    STYLE.hits.forEach((b, j) => add(t0 + b * BEAT, (A, w) => STYLE.hit(A, w, j === 0 ? 1 : 0.6)));
    for (let b = 0; b < 8; b++) {
      if (!STYLE.noHats) add(t0 + b * BEAT + BEAT / 2, (A, w) => SND.hat(A, w, 0.45, b % 2 ? 0.4 : -0.4));
      if (!STYLE.noHats || b % 4 === 0) add(t0 + b * BEAT, (A, w) => SND.sub(A, w, ch[0] - 12, STYLE.noHats ? BEAT * 3.5 : BEAT * 0.9, b === 0 ? 0.8 : 0.35));
      const step = STYLE.motifs[k % STYLE.motifs.length][b];
      if (step < 0) continue; // pausa no motivo
      const n = STYLE.scale[step];
      add(t0 + b * BEAT, (A, w) => STYLE.lead(A, w, n, b === 0 ? 1 : 0.7, (STYLE.noHats ? b % 4 < 2 : b % 2 === 0) ? -0.35 : 0.35));
    }
    add(t0 - 0.4 < 0 ? DURATION - 0.4 : t0 - 0.4, (A, w) => SND.whoosh(A, w, { dur: 0.8, from: 300, to: 3200, v: 0.24, pan: k % 2 ? 0.8 : -0.8, panTo: k % 2 ? -0.8 : 0.8 }));
  }
  add(0.05, (A, w) => SND.shimmer(A, w, 0.6));
  return ev.sort((a, b) => a.t - b.t);
}
const EVENTS = buildEvents();
const renderWav = () => renderEventsWav(EVENTS, DURATION, { loop: true });

// Usado pelo exportador de vídeo (scripts/export-video.cjs)
const MOTION = { Frame, duration: DURATION, formats: FORMATS, renderWav, loop: true };

export default function DeviceShowcase() {
  return (
    <MotionPlayer Frame={Frame} duration={DURATION} events={EVENTS} formats={FORMATS} defaultFormat="9x16" renderWav={renderWav}
      scenes={Array.from({ length: N_SHOTS }, (_, k) => ({ name: `Plano ${k + 1}`, from: k * T }))} />
  );
}
