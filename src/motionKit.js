/* =============================================================================
   motionKit — núcleo compartilhado dos motions da Estoke ao Cubo
   - Matemática de animação (molas analíticas, easings) para timelines determinísticas
   - Tokens e tipografia da marca, medição de texto, grão, feixes de luz, logo
   - Síntese de áudio (Web Audio), agendamento por eventos e render offline em WAV
   - MotionPlayer: frame escalável + controles (play, timeline, som, loop, formato)
============================================================================= */
import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from "react";
import { BRAND_FONT_CSS, CUBE_LOGO_SRC } from "./brandAssets";

/* ---------- Marca ---------- */
export const C = {
  ink: "#002450",
  night: "#000A1E",
  deep: "#00396F",
  blue: "#008ACC",
  sky: "#4FB3E8",
  cyan: "#2FD4FF",
  ice: "#CFEAF8",
  paper: "#F5F9FD",
  slate: "#4A5B76",
  mist: "#E3ECF5",
};
export const FONT = `'Open Sauce Sans', 'Plus Jakarta Sans', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`;
export const DISPLAY_FONT = `'EAC Display', 'Monument Extended', 'Archivo', 'Arial Black', system-ui, sans-serif`;
export const DISP = {
  fontFamily: DISPLAY_FONT,
  fontWeight: 800,
  fontStretch: "125%",
  fontVariationSettings: "'wdth' 125",
  letterSpacing: "-0.01em",
  textTransform: "uppercase",
};
export const GRAD = `linear-gradient(95deg, ${C.deep} 0%, ${C.blue} 50%, ${C.cyan} 100%)`;
export const GRAD_LIGHT = `linear-gradient(95deg, ${C.sky} 0%, ${C.cyan} 55%, #FFFFFF 100%)`;

/* ---------- Matemática de animação ---------- */
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, p) => a + (b - a) * p;
export const prog = (t, a, b) => clamp((t - a) / (b - a));
export const easeOut = (p) => 1 - Math.pow(1 - p, 3);
export const easeIn = (p) => p * p * p;
export const easeInOut = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
export const rnd = (i, k = 0) => {
  const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return s - Math.floor(s);
};
// Oscilador harmônico amortecido (0 → 1), mesma física do framer-motion
export function spring(s, { stiffness = 180, damping = 14, mass = 1 } = {}) {
  if (s <= 0) return 0;
  const w0 = Math.sqrt(stiffness / mass);
  const z = damping / (2 * Math.sqrt(stiffness * mass));
  if (z < 1) {
    const wd = w0 * Math.sqrt(1 - z * z);
    return 1 - Math.exp(-z * w0 * s) * (Math.cos(wd * s) + ((z * w0) / wd) * Math.sin(wd * s));
  }
  return 1 - Math.exp(-w0 * s) * (1 + w0 * s);
}
export const vel = (f, t, h = 0.008) => (f(t + h) - f(t - h)) / (2 * h);
const parseHex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
export const mix = (a, b, p) => {
  const A = parseHex(a);
  const B = parseHex(b);
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * p)).join(",")})`;
};
export const hexA = (h, a) => `rgba(${parseHex(h).join(",")},${a})`;

/* ---------- Texto ---------- */
export const clipText = (bg) => ({
  backgroundImage: bg,
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  WebkitTextFillColor: "transparent",
  paddingRight: "0.04em",
});
export const gradText = clipText(GRAD);
export const gradLight = clipText(GRAD_LIGHT);

// Mede no DOM com o mesmo estilo do render (largura expandida, variação, tracking)
export const measureCache = new Map();
let probe = null;
export function measure(str, size, display = true, weight = 800) {
  const key = `${display ? "D" : "B"}|${weight}|${size}|${str}`;
  if (measureCache.has(key)) return measureCache.get(key);
  if (typeof document === "undefined") return str.length * size * (display ? 0.8 : 0.56);
  if (!probe) {
    probe = document.createElement("span");
    Object.assign(probe.style, { position: "absolute", left: "-9999px", top: "0", whiteSpace: "pre", visibility: "hidden", lineHeight: "1" });
    document.body.appendChild(probe);
  }
  const st = display ? DISP : { fontFamily: FONT, fontWeight: weight, fontStretch: "100%", fontVariationSettings: "normal", letterSpacing: "-0.02em", textTransform: "none" };
  Object.assign(probe.style, st, { fontSize: `${size}px`, fontWeight: String(display ? DISP.fontWeight : weight) });
  probe.textContent = str;
  const w = probe.getBoundingClientRect().width;
  measureCache.set(key, w);
  return w;
}
export const fitSize = (str, maxW, max, display = true) => Math.min(max, (max * maxW) / measure(str, max, display));

// Revelação por máscara: a palavra sobe de trás de uma linha invisível, com leve giro
export function MaskWord({ s, style, children }) {
  return (
    <span style={{ display: "inline-block", overflow: "hidden", padding: "0.2em 0.06em 0.12em", margin: "-0.2em -0.06em -0.12em", verticalAlign: "top" }}>
      <span style={{
        display: "inline-block", whiteSpace: "pre", opacity: clamp(s * 3),
        transform: `translateY(${(1 - s) * 118}%) rotate(${(1 - clamp(s)) * 7}deg)`, transformOrigin: "0 100%", ...style,
      }}>{children}</span>
    </span>
  );
}

/* ---------- Visual da marca ---------- */
export function CubeLogo({ size = 48, glow = 0, style }) {
  return (
    <img src={CUBE_LOGO_SRC} alt="" width={size * 0.908} height={size} draggable={false}
      style={{
        display: "block", width: size * 0.908, height: size, userSelect: "none",
        filter: glow ? `drop-shadow(0 0 ${12 * glow}px ${hexA(C.cyan, 0.55 * Math.min(glow, 1.6))}) drop-shadow(0 ${10 * glow}px ${24 * glow}px ${hexA(C.blue, 0.45 * Math.min(glow, 1.6))})` : "none",
        ...style,
      }} />
  );
}
export function Wordmark({ size = 20, color = C.ink, inline = false }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: size * 0.5 }}>
      <CubeLogo size={inline ? size * 1.5 : size * 2.3} />
      <div style={{ ...DISP, fontSize: size, lineHeight: 0.95, color, whiteSpace: "nowrap" }}>
        {inline ? "Estoke ao Cubo" : <>Estoke<br />ao Cubo</>}
      </div>
    </div>
  );
}
// Feixe: elipse suave e rotacionada, como as faixas de luz azul das capas da marca
export function Beam({ x, y, w, h, rot, color, a }) {
  return (
    <div style={{
      position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h, borderRadius: "50%", transform: `rotate(${rot}deg)`,
      background: `radial-gradient(ellipse at center, ${hexA(color, a)} 0%, ${hexA(color, a * 0.55)} 38%, ${hexA(color, 0)} 70%)`,
    }} />
  );
}
const GRAIN_URL = `url("data:image/svg+xml;utf8,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .9 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>",
)}")`;
export function Grain({ t, opacity = 0.09 }) {
  const f = Math.floor(t * 24);
  return (
    <div style={{
      position: "absolute", inset: -40, zIndex: 85, pointerEvents: "none", backgroundImage: GRAIN_URL, backgroundSize: "180px 180px",
      opacity, mixBlendMode: "overlay", transform: `translate(${(f * 37) % 40}px, ${(f * 53) % 40}px)`,
    }} />
  );
}

/* ---------- Vídeo sincronizado com a timeline ---------- */
// No player: toca normalmente e corrige deriva/pausa junto com a timeline.
// Na exportação (window.__CAPTURE): busca o quadro exato de cada instante.
export function SyncedVideo({ t, duration, webm, mp4, style }) {
  const ref = useRef(null);
  const last = useRef({ t: 0, at: 0 });
  useLayoutEffect(() => {
    const v = ref.current;
    if (!v) return;
    const target = ((t % duration) + duration) % duration;
    if (typeof window !== "undefined" && window.__CAPTURE) {
      if (!v.paused) v.pause();
      if (Math.abs(v.currentTime - target) > 0.0005) v.currentTime = target;
      return;
    }
    last.current = { t: target, at: performance.now() };
    if (Math.abs(v.currentTime - target) > 0.15) v.currentTime = target;
    if (v.paused) v.play().catch(() => {});
  }, [t, duration]);
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
    <video ref={ref} muted playsInline preload="auto" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block", ...style }}>
      {webm && <source src={webm} type="video/webm" />}
      {mp4 && <source src={mp4} type="video/mp4" />}
    </video>
  );
}

/* =============================================================================
   Áudio — síntese com Web Audio, sem arquivos
============================================================================= */
export const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

export function makeEngine(offlineCtx) {
  const AC = typeof window !== "undefined" && (window.AudioContext || window.webkitAudioContext);
  if (!offlineCtx && !AC) return null;
  const ctx = offlineCtx || new AC();
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -16;
  comp.knee.value = 12;
  comp.ratio.value = 4;
  comp.attack.value = 0.004;
  comp.release.value = 0.2;
  const master = ctx.createGain();
  master.gain.value = 0.85;
  master.connect(comp);
  comp.connect(ctx.destination);
  const len = Math.floor(ctx.sampleRate * 2.4);
  const ir = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2);
  }
  const rev = ctx.createConvolver();
  rev.buffer = ir;
  const revOut = ctx.createGain();
  revOut.gain.value = 0.5;
  rev.connect(revOut);
  revOut.connect(master);
  const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const nd = noiseBuf.getChannelData(0);
  for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
  return { ctx, master, rev, noise: noiseBuf };
}

function route(A, node, { send = 0, pan = 0, panTo = null, w, dur }) {
  let n = node;
  if ((pan || panTo != null) && A.ctx.createStereoPanner) {
    const p = A.ctx.createStereoPanner();
    p.pan.setValueAtTime(pan, w);
    if (panTo != null) p.pan.linearRampToValueAtTime(panTo, w + dur);
    n.connect(p);
    n = p;
  }
  n.connect(A.out);
  if (send) {
    const g = A.ctx.createGain();
    g.gain.value = send;
    n.connect(g);
    g.connect(A.send);
  }
}
export function tone(A, w, { type = "sine", f, f2, glide, dur = 0.2, v = 0.2, a = 0.004, lp, q = 1, send = 0, pan = 0 }) {
  const { ctx } = A;
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(f, w);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, w + (glide || dur));
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, w);
  g.gain.exponentialRampToValueAtTime(v, w + a);
  g.gain.exponentialRampToValueAtTime(0.0001, w + Math.max(dur, a + 0.01));
  let n = o;
  if (lp) {
    const fl = ctx.createBiquadFilter();
    fl.type = "lowpass";
    fl.frequency.value = lp;
    fl.Q.value = q;
    o.connect(fl);
    n = fl;
  }
  n.connect(g);
  route(A, g, { send, pan, w, dur });
  o.start(w);
  o.stop(w + dur + 0.05);
}
export function hiss(A, w, { type = "bandpass", f = 1200, f2, q = 1, dur = 0.2, v = 0.2, a = 0.004, shape = "decay", send = 0, pan = 0, panTo = null }) {
  const { ctx } = A;
  const s = ctx.createBufferSource();
  s.buffer = A.noise;
  const fl = ctx.createBiquadFilter();
  fl.type = type;
  fl.Q.value = q;
  fl.frequency.setValueAtTime(f, w);
  if (f2) fl.frequency.exponentialRampToValueAtTime(f2, w + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, w);
  if (shape === "swell") {
    g.gain.exponentialRampToValueAtTime(v, w + dur * 0.62);
    g.gain.exponentialRampToValueAtTime(0.0001, w + dur);
  } else if (shape === "rise") {
    g.gain.exponentialRampToValueAtTime(v, w + dur);
    g.gain.linearRampToValueAtTime(0.0001, w + dur + 0.03);
  } else {
    g.gain.exponentialRampToValueAtTime(v, w + a);
    g.gain.exponentialRampToValueAtTime(0.0001, w + dur);
  }
  s.connect(fl);
  fl.connect(g);
  route(A, g, { send, pan, panTo, w, dur });
  s.start(w, Math.random() * 1.5);
  s.stop(w + dur + 0.06);
}
export function pad(A, w, notes, dur, cut, v = 1) {
  const { ctx } = A;
  const fl = ctx.createBiquadFilter();
  fl.type = "lowpass";
  fl.frequency.value = cut;
  fl.Q.value = 0.7;
  const g = ctx.createGain();
  const peak = 0.04 * v;
  g.gain.setValueAtTime(0.0001, w);
  g.gain.exponentialRampToValueAtTime(peak, w + Math.min(0.35, dur * 0.3));
  g.gain.setValueAtTime(peak, w + dur * 0.72);
  g.gain.exponentialRampToValueAtTime(0.0001, w + dur);
  fl.connect(g);
  route(A, g, { send: 0.55, w, dur });
  notes.forEach((n) => [-8, 8].forEach((det) => {
    const o = ctx.createOscillator();
    o.type = "sawtooth";
    o.frequency.value = midi(n + 12);
    o.detune.value = det;
    o.connect(fl);
    o.start(w);
    o.stop(w + dur + 0.05);
  }));
}
export const SND = {
  kick: (A, w, v = 1) => tone(A, w, { f: 160, f2: 42, glide: 0.12, dur: 0.42, v: 0.9 * v, a: 0.003 }),
  clap: (A, w, v = 1) => [0, 0.011, 0.022].forEach((d, i) => hiss(A, w + d, { f: 1500, q: 0.9, dur: i === 2 ? 0.2 : 0.03, v: 0.3 * v, send: 0.25 })),
  hat: (A, w, v = 1, pan = 0.2) => hiss(A, w, { type: "highpass", f: 7800, dur: 0.045, v: 0.12 * v, pan }),
  bass: (A, w, n, dur = 0.22, v = 1) => tone(A, w, { type: "sawtooth", f: midi(n), dur, v: 0.2 * v, a: 0.006, lp: 420, q: 5 }),
  sub: (A, w, n, dur = 0.45, v = 1) => tone(A, w, { f: midi(n), dur, v: 0.32 * v, a: 0.02 }),
  pluck: (A, w, n, v = 1, pan = 0) => tone(A, w, { type: "triangle", f: midi(n), dur: 0.32, v: 0.11 * v, send: 0.35, pan }),
  bell: (A, w, n, v = 1, pan = 0) => {
    tone(A, w, { f: midi(n), dur: 1.1, v: 0.09 * v, send: 0.5, pan });
    tone(A, w, { f: midi(n + 19), dur: 0.5, v: 0.025 * v, send: 0.5, pan });
  },
  pad,
  whoosh: (A, w, { dur = 0.55, from = 250, to = 3200, v = 0.3, pan = -0.7, panTo = 0.7 } = {}) => hiss(A, w, { f: from, f2: to, q: 1.4, dur, v, shape: "swell", send: 0.2, pan, panTo }),
  pop: (A, w, f = 620, v = 0.2) => tone(A, w, { f: f * 1.8, f2: f, glide: 0.05, dur: 0.11, v, send: 0.12 }),
  tick: (A, w, f = 3000, v = 1) => tone(A, w, { type: "square", f, dur: 0.012, v: 0.03 * v }),
  swipe: (A, w, v = 1) => hiss(A, w, { type: "highpass", f: 1800, f2: 5000, dur: 0.16, v: 0.11 * v, shape: "swell" }),
  shimmer: (A, w, v = 1) => [84, 88, 91, 96].forEach((n, i) => tone(A, w + i * 0.03, { f: midi(n), dur: 1.4, v: 0.035 * v, send: 0.8, pan: i % 2 ? 0.5 : -0.5 })),
};

/* Renderiza os eventos offline e devolve WAV estéreo 16-bit em base64.
   loop=true: renderiza dois ciclos e devolve o segundo, já com as caudas de reverb
   do ciclo anterior, para o arquivo emendar sem corte quando o vídeo repetir. */
export async function renderEventsWav(events, duration, { loop = false, sampleRate = 48000 } = {}) {
  const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const cycles = loop ? 2 : 1;
  const ctx = new OAC(2, Math.ceil(sampleRate * duration * cycles), sampleRate);
  const eng = makeEngine(ctx);
  const bus = ctx.createGain();
  bus.connect(eng.master);
  const send = ctx.createGain();
  send.connect(eng.rev);
  const A = { ctx, out: bus, send, noise: eng.noise };
  for (let c = 0; c < cycles; c++) events.forEach((e) => e.fn(A, Math.max(0.001, e.t + c * duration)));
  const buf = await ctx.startRendering();
  const start = loop ? Math.round(sampleRate * duration) : 0;
  const n = Math.round(sampleRate * duration);
  const L = buf.getChannelData(0);
  const R = buf.getChannelData(1);
  const out = new DataView(new ArrayBuffer(44 + n * 4));
  const str = (o, x) => [...x].forEach((ch, i) => out.setUint8(o + i, ch.charCodeAt(0)));
  str(0, "RIFF"); out.setUint32(4, 36 + n * 4, true); str(8, "WAVE"); str(12, "fmt ");
  out.setUint32(16, 16, true); out.setUint16(20, 1, true); out.setUint16(22, 2, true); out.setUint32(24, sampleRate, true);
  out.setUint32(28, sampleRate * 4, true); out.setUint16(32, 4, true); out.setUint16(34, 16, true); str(36, "data"); out.setUint32(40, n * 4, true);
  for (let i = 0; i < n; i++) {
    out.setInt16(44 + i * 4, clamp(L[start + i], -1, 1) * 0x7fff, true);
    out.setInt16(46 + i * 4, clamp(R[start + i], -1, 1) * 0x7fff, true);
  }
  const bytes = new Uint8Array(out.buffer);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

/* =============================================================================
   MotionPlayer — frame escalável + controles discretos fora do frame
   props: Frame({t, format}), duration, events, formats {id: {w, h, label}}, scenes [{name, from}]
============================================================================= */
const PLAYER_CSS = `
.mk-btn{width:34px;height:34px;border-radius:999px;display:grid;place-items:center;color:rgba(233,235,242,.75);background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);transition:background .2s,color .2s;cursor:pointer;font:inherit}
.mk-btn:hover{background:rgba(255,255,255,.12);color:#fff}
.mk-btn:focus-visible,.mk-range:focus-visible,.mk-seg button:focus-visible{outline:2px solid #2FD4FF;outline-offset:2px}
.mk-btn[aria-pressed="true"]{color:#2FD4FF}
.mk-sound-off{width:auto;padding:0 12px 0 10px;display:flex;gap:6px;align-items:center;font-size:12px;font-weight:700;color:#00203F;background:#2FD4FF;border-color:#2FD4FF;animation:mkPulse 1.6s ease-out infinite;white-space:nowrap}
.mk-sound-off:hover{background:#7FE3FF;color:#00203F}
@keyframes mkPulse{0%{box-shadow:0 0 0 0 rgba(47,212,255,.55)}100%{box-shadow:0 0 0 12px rgba(47,212,255,0)}}
@media (prefers-reduced-motion: reduce){.mk-sound-off{animation:none}}
.mk-range{-webkit-appearance:none;appearance:none;width:100%;height:4px;border-radius:4px;cursor:pointer;background:transparent;margin:0}
.mk-range::-webkit-slider-runnable-track{height:4px;border-radius:4px;background:transparent}
.mk-range::-webkit-slider-thumb{-webkit-appearance:none;width:12px;height:12px;margin-top:-4px;border-radius:50%;background:#fff;box-shadow:0 0 0 3px rgba(47,212,255,.5)}
.mk-range::-moz-range-thumb{width:12px;height:12px;border:0;border-radius:50%;background:#fff;box-shadow:0 0 0 3px rgba(47,212,255,.5)}
.mk-seg{display:flex;padding:3px;border-radius:999px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08)}
.mk-seg button{border:0;background:transparent;color:rgba(233,235,242,.6);font:inherit;font-size:11px;font-weight:700;padding:5px 10px;border-radius:999px;cursor:pointer}
.mk-seg button[aria-pressed="true"]{background:#2FD4FF;color:#00203F}
`;
const fmtTime = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

export function MotionPlayer({ Frame, duration, events = [], formats, defaultFormat, scenes = [], renderWav, fontsToLoad = [] }) {
  const fmtIds = Object.keys(formats);
  const [format, setFormat] = useState(defaultFormat || fmtIds[0]);
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [loop, setLoop] = useState(true);
  const [soundOn, setSoundOn] = useState(false);
  const [, setFontTick] = useState(0);
  const [box, setBox] = useState({ w: 400, h: 700 });
  const tRef = useRef(0);
  const loopRef = useRef(loop);
  const playingRef = useRef(playing);
  const soundRef = useRef(soundOn);
  const areaRef = useRef(null);
  const audio = useRef({ eng: null, bus: null, send: null, anchorCtx: 0, anchorT: 0, idx: 0 });
  loopRef.current = loop;
  playingRef.current = playing;
  soundRef.current = soundOn;
  const F = formats[format];

  const audioStop = useCallback(() => {
    const a = audio.current;
    if (!a.eng || !a.bus) return;
    const { bus, send } = a;
    const now = a.eng.ctx.currentTime;
    bus.gain.setTargetAtTime(0, now, 0.015);
    send.gain.setTargetAtTime(0, now, 0.015);
    setTimeout(() => {
      try {
        bus.disconnect();
        send.disconnect();
      } catch (e) {
        /* já desconectado */
      }
    }, 400);
    a.bus = null;
    a.send = null;
  }, []);
  const audioStart = useCallback((fromT) => {
    const a = audio.current;
    if (!a.eng) return;
    audioStop();
    const { ctx } = a.eng;
    a.bus = ctx.createGain();
    a.bus.connect(a.eng.master);
    a.send = ctx.createGain();
    a.send.connect(a.eng.rev);
    a.anchorCtx = ctx.currentTime + 0.05;
    a.anchorT = fromT;
    const i = events.findIndex((e) => e.t >= fromT - 0.001);
    a.idx = i < 0 ? events.length : i;
  }, [audioStop, events]);
  const audioPump = (curT) => {
    const a = audio.current;
    if (!a.bus) return;
    const { ctx } = a.eng;
    const A = { ctx, out: a.bus, send: a.send, noise: a.eng.noise };
    while (a.idx < events.length && events[a.idx].t < curT + 0.25) {
      const e = events[a.idx++];
      const w = a.anchorCtx + (e.t - a.anchorT);
      if (w < ctx.currentTime - 0.02) continue;
      try {
        e.fn(A, Math.max(w, ctx.currentTime + 0.001));
      } catch (err) {
        /* um efeito com problema não deve parar o vídeo */
      }
    }
  };

  // Relógio mestre: com som ligado, o tempo vem do relógio do AudioContext
  useEffect(() => {
    if (!playing) return undefined;
    let raf;
    let last = null;
    const tick = (now) => {
      if (last == null) last = now;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const a = audio.current;
      const live = soundRef.current && a.bus;
      let nt = live ? Math.max(a.anchorT, a.anchorT + (a.eng.ctx.currentTime - a.anchorCtx)) : tRef.current + dt;
      if (nt >= duration) {
        if (loopRef.current) {
          nt -= duration;
          if (live) audioStart(nt);
        } else {
          tRef.current = duration;
          setT(duration);
          setPlaying(false);
          return;
        }
      }
      tRef.current = nt;
      if (live) audioPump(nt);
      setT(nt);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, duration]);

  useEffect(() => {
    if (playing && soundOn) audioStart(tRef.current);
    else audioStop();
  }, [playing, soundOn, audioStart, audioStop]);
  useEffect(() => () => {
    audioStop();
    const a = audio.current;
    if (a.eng) a.eng.ctx.close().catch(() => {});
  }, [audioStop]);

  const seek = useCallback((v) => {
    tRef.current = clamp(v, 0, duration);
    setT(tRef.current);
    if (playingRef.current && soundRef.current) audioStart(tRef.current);
  }, [audioStart, duration]);
  const restart = useCallback(() => {
    seek(0);
    setPlaying(true);
  }, [seek]);
  const toggle = useCallback(() => {
    if (tRef.current >= duration) seek(0);
    setPlaying((p) => !p);
  }, [seek, duration]);
  // O navegador só libera áudio após um clique: o motor nasce aqui
  const toggleSound = useCallback(() => {
    const a = audio.current;
    const first = !a.eng;
    if (first) {
      a.eng = makeEngine();
      if (!a.eng) return;
    }
    if (a.eng.ctx.state === "suspended") a.eng.ctx.resume().catch(() => {});
    if (first || !soundRef.current) {
      if (first) {
        tRef.current = 0;
        setT(0);
      }
      setSoundOn(true);
      setPlaying(true);
    } else setSoundOn(false);
  }, []);

  // Fontes embutidas: reavalia medidas de texto quando carregarem
  useEffect(() => {
    let alive = true;
    const fl = typeof document !== "undefined" ? document.fonts : null;
    if (fl && fl.load) {
      Promise.all([`800 50px "EAC Display"`, `700 16px "Open Sauce Sans"`, `600 16px "Open Sauce Sans"`, ...fontsToLoad].map((f) => fl.load(f)))
        .catch(() => {})
        .then(() => fl.ready)
        .then(() => {
          if (!alive) return;
          measureCache.clear();
          setFontTick((x) => x + 1);
        });
    }
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const el = areaRef.current;
    if (!el) return undefined;
    const fit = () => setBox({ w: el.clientWidth - 32, h: el.clientHeight - 24 });
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.target && e.target.type === "range" && e.key.startsWith("Arrow")) return;
      if (e.code === "Space") {
        e.preventDefault();
        toggle();
      } else if (e.key === "r" || e.key === "R") restart();
      else if (e.key === "m" || e.key === "M") toggleSound();
      else if (e.key === "ArrowRight") seek(tRef.current + 1);
      else if (e.key === "ArrowLeft") seek(tRef.current - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle, restart, seek, toggleSound]);

  useEffect(() => {
    window.__eac = { seek, play: () => setPlaying(true), pause: () => setPlaying(false), setFormat, renderSoundtrack: renderWav };
  }, [seek, renderWav]);

  const scale = Math.max(0.2, Math.min(box.w / F.w, box.h / F.h));
  const scene = [...scenes].reverse().find((s) => t >= s.from);
  const ctrlW = Math.max(300, F.w * scale);

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", height: "100dvh", minHeight: 520, background: "#00050F", fontFamily: FONT, color: "#E9EBF2" }}>
      <style>{BRAND_FONT_CSS + PLAYER_CSS}</style>
      <div ref={areaRef} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", flex: "1 1 0", minHeight: 0, padding: "16px 16px 8px" }}>
        <div style={{
          width: F.w * scale, height: F.h * scale, flex: "none", position: "relative", overflow: "hidden", borderRadius: 22,
          boxShadow: "0 40px 120px -30px rgba(0,138,204,.4), 0 0 0 1px rgba(255,255,255,.07)",
        }}>
          <div style={{ width: F.w, height: F.h, transform: `scale(${scale})`, transformOrigin: "0 0", position: "relative" }}>
            <Frame t={t} format={format} />
          </div>
        </div>
      </div>
      <div style={{ width: "100%", display: "flex", justifyContent: "center", padding: "4px 16px 16px" }}>
        <div style={{ width: ctrlW, maxWidth: "100%", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <button type="button" className="mk-btn" onClick={toggle} aria-label={playing ? "Pausar" : "Reproduzir"}>
            {playing ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15a1 1 0 0 0 1.5.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5z" /></svg>
            )}
          </button>
          <button type="button" className="mk-btn" onClick={restart} aria-label="Reiniciar">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /></svg>
          </button>
          <div style={{ display: "flex", flexDirection: "column", flex: "1 1 120px", minWidth: 0, gap: 4 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, letterSpacing: ".08em", textTransform: "uppercase", color: "rgba(233,235,242,.5)", fontWeight: 600 }}>
              <span>{scene ? scene.name : ""}</span>
              <span style={{ fontVariantNumeric: "tabular-nums" }}>{fmtTime(t)} / {fmtTime(duration)}</span>
            </div>
            <div style={{ position: "relative", height: 12, display: "flex", alignItems: "center" }}>
              <div style={{ position: "absolute", left: 0, right: 0, height: 4, borderRadius: 4, background: "rgba(255,255,255,.1)" }} />
              <div style={{ position: "absolute", left: 0, width: `${(t / duration) * 100}%`, height: 4, borderRadius: 4, background: GRAD_LIGHT }} />
              {scenes.slice(1).map((s) => (
                <span key={s.name + s.from} style={{ position: "absolute", left: `${(s.from / duration) * 100}%`, width: 2, height: 8, marginLeft: -1, borderRadius: 1, background: "rgba(255,255,255,.28)" }} />
              ))}
              <input id="mk-scrub" className="mk-range" type="range" min={0} max={duration} step={0.01} value={t} aria-label="Linha do tempo"
                onChange={(e) => seek(parseFloat(e.target.value))} style={{ position: "relative" }} />
            </div>
          </div>
          <button type="button" className={soundOn ? "mk-btn" : "mk-btn mk-sound-off"} onClick={toggleSound} aria-pressed={soundOn}
            aria-label={soundOn ? "Desligar som" : "Ativar som"} title={soundOn ? "Desligar som (M)" : "Ativar som (M)"}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 5 6 9H3v6h3l5 4z" fill="currentColor" />
              {soundOn ? <><path d="M15.5 8.5a5 5 0 0 1 0 7" /><path d="M18.5 5.5a9 9 0 0 1 0 13" /></> : <path d="M16 9l5 6M21 9l-5 6" />}
            </svg>
            {!soundOn && <span>Ativar som</span>}
          </button>
          <button type="button" className="mk-btn" onClick={() => setLoop((l) => !l)} aria-pressed={loop} aria-label="Repetir em loop">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 2l4 4-4 4" /><path d="M3 11V9a3 3 0 0 1 3-3h15" /><path d="M7 22l-4-4 4-4" /><path d="M21 13v2a3 3 0 0 1-3 3H3" /></svg>
          </button>
          {fmtIds.length > 1 && (
            <div className="mk-seg" role="group" aria-label="Formato">
              {fmtIds.map((id) => (
                <button key={id} type="button" aria-pressed={format === id} onClick={() => setFormat(id)}>{formats[id].label || id}</button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
