import React from "react";
import {
  C, DISP, FONT, clamp, lerp, prog, easeOut, easeInOut, rnd, spring, hexA, midi, tone, hiss,
  CubeLogo, Grain, SND, SyncedVideo, renderEventsWav, MotionPlayer,
} from "./motionKit";

/* =============================================================================
   Estoke ao Cubo — Reel de portfólio no monitor (loop de 8s)
   Referência: "2072e941c9e055b17fd31f443fcd863b_720w.mp4" — monitor numa mesa escura,
   parede de ripas iluminada na cor de cada site, cortes rápidos no tempo da batida
   e uma parada final num site de destaque.
   Tela: dist/media/reel-sites.* (8 cortes de 0,5s + 2,5s da moeda da Dizzy + 1,5s escuro
   onde entra o cartão final da Estoke).
============================================================================= */
const DURATION = 8;
const FORMATS = {
  "9x16": { w: 450, h: 800, label: "9:16" },
  "4x5": { w: 450, h: 562.5, label: "4:5" },
};
// Cor da luz na parede por trecho da montagem (cor dominante de cada marca)
const SEGMENTS = [
  { from: 0.0, site: "Misú", color: "#D1121F" },
  { from: 0.5, site: "LCS", color: "#5FA67A" },
  { from: 1.0, site: "Noka", color: "#D9763F" },
  { from: 1.5, site: "Dizzy", color: "#E0451B" },
  { from: 2.0, site: "Misú", color: "#D1121F" },
  { from: 2.5, site: "LCS", color: "#5FA67A" },
  { from: 3.0, site: "Noka", color: "#D9763F" },
  { from: 3.5, site: "Dizzy", color: "#E00000" },
  { from: 4.0, site: "Dizzy", color: "#E00000", hold: true },
  { from: 6.5, site: "Estoke ao Cubo", color: C.blue, end: true },
];
const segAt = (t) => [...SEGMENTS].reverse().find((s) => t >= s.from) || SEGMENTS[0];
const CUTS = SEGMENTS.map((s) => s.from);
const sinceCut = (t) => Math.min(...CUTS.filter((c) => c <= t).map((c) => t - c));

const LAYOUT = {
  "9x16": { mon: { cx: 236, cy: 340, w: 560 }, deskTop: 480, wallH: 340, kb: { x: -140, y: 600 } },
  "4x5": { mon: { cx: 236, cy: 236, w: 480 }, deskTop: 360, wallH: 236, kb: { x: -150, y: 430 } },
};

// Mistura de cor (hex) para a transição suave da luz da parede
const hx = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
function lightAt(t) {
  const s = segAt(t);
  const i = SEGMENTS.indexOf(s);
  const prev = SEGMENTS[(i - 1 + SEGMENTS.length) % SEGMENTS.length];
  const p = easeOut(prog(t - s.from, 0, 0.12));
  const a = hx(prev.color);
  const b = hx(s.color);
  return a.map((v, k) => Math.round(lerp(v, b[k], p)));
}
const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

/* ---------- Cena ---------- */
function Wall({ t, L, H, light }) {
  const flash = Math.exp(-sinceCut(t) * 7);
  return (
    <div style={{ position: "absolute", left: -40, right: -40, top: -30, height: L.wallH + 90, overflow: "hidden" }}>
      {/* ripas de madeira verticais em leve perspectiva */}
      <div style={{
        position: "absolute", inset: 0, transform: "perspective(600px) rotateY(-14deg) scale(1.25)",
        backgroundImage: "repeating-linear-gradient(90deg, #15110E 0 22px, #0B0907 22px 25px, #1A1511 25px 26px)",
      }} />
      {/* luz colorida vinda de trás do monitor */}
      <div style={{
        position: "absolute", inset: 0, mixBlendMode: "screen",
        background: `radial-gradient(ellipse 95% 120% at 58% 100%, ${rgba(light, 1)} 0%, ${rgba(light, 0.75 + flash * 0.2)} 35%, ${rgba(light, 0.25)} 70%, transparent 100%)`,
      }} />
      {/* brilho especular nas arestas das ripas */}
      <div style={{
        position: "absolute", inset: 0, transform: "perspective(600px) rotateY(-14deg) scale(1.25)", mixBlendMode: "screen", opacity: 0.55,
        backgroundImage: `repeating-linear-gradient(90deg, transparent 0 21px, ${rgba(light, 0.9)} 21px 22px, transparent 22px 26px)`,
        WebkitMaskImage: "radial-gradient(ellipse 80% 110% at 58% 100%, #000 20%, transparent 80%)", maskImage: "radial-gradient(ellipse 80% 110% at 58% 100%, #000 20%, transparent 80%)",
      }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,.35), transparent 35%)" }} />
    </div>
  );
}

function EndCard({ t }) {
  const lt = t - 6.5;
  if (lt < 0) return null;
  const s = spring(lt - 0.1, { stiffness: 170, damping: 14 });
  const s2 = spring(lt - 0.35, { stiffness: 170, damping: 18 });
  return (
    <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 50% 60%, #0B2440 0%, ${C.night} 70%)`, display: "flex", alignItems: "center", justifyContent: "center", gap: 18 }}>
      <div style={{ transform: `scale(${s}) rotate(${(1 - s) * -90}deg)`, opacity: clamp(s * 2) }}>
        <CubeLogo size={84} glow={1.2} />
      </div>
      <div style={{ opacity: clamp(s2 * 2), transform: `translateX(${(1 - s2) * 20}px)` }}>
        <div style={{ ...DISP, fontSize: 30, lineHeight: 0.95, color: "#FFFFFF" }}>Estoke<br />ao Cubo</div>
        <div style={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, color: C.ice, marginTop: 8 }}>Seu site pode ser o próximo.</div>
      </div>
    </div>
  );
}

function Monitor({ t, L, light }) {
  const { cx, cy, w } = L.mon;
  const h = (w * 9) / 16;
  const punch = Math.exp(-sinceCut(t) * 9) * 0.015;
  return (
    <div style={{ position: "absolute", left: cx - w / 2, top: cy - h / 2, width: w, height: h, perspective: 1400, zIndex: 10 }}>
      <div style={{ position: "absolute", inset: 0, transform: `rotateY(-7deg) rotateX(3deg) scale(${1 + punch})`, transformStyle: "preserve-3d" }}>
        {/* pé do monitor */}
        <div style={{ position: "absolute", left: w / 2 - 34, top: h - 4, width: 68, height: 70, background: "linear-gradient(180deg, #16181C, #0A0B0D)", clipPath: "polygon(30% 0, 70% 0, 82% 100%, 18% 100%)" }} />
        <div style={{ position: "absolute", left: w / 2 - 80, top: h + 60, width: 160, height: 14, borderRadius: "50%", background: "#0C0D10", boxShadow: `0 0 30px ${rgba(light, 0.25)}` }} />
        <div style={{
          position: "absolute", inset: 0, borderRadius: 8, background: "#060708", padding: 6,
          boxShadow: `0 0 0 1px rgba(255,255,255,.07), 0 30px 80px -10px rgba(0,0,0,.9), 0 0 120px ${rgba(light, 0.35)}`,
        }}>
          <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", borderRadius: 3, background: "#000" }}>
            <SyncedVideo t={t} duration={DURATION} webm="media/reel-sites.webm" mp4="media/reel-sites.mp4" />
            <EndCard t={t} />
            {/* reflexo leve no vidro */}
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(120deg, rgba(255,255,255,.07), transparent 35%)", pointerEvents: "none" }} />
          </div>
        </div>
        {/* LEDs da borda inferior, como na referência */}
        {[0, 1].map((i) => (
          <span key={i} style={{ position: "absolute", left: w / 2 - 14 + i * 16, top: h + 10, width: 9, height: 9, borderRadius: "50%", border: `2px solid ${i ? "#7BD38A" : "#E8A33D"}`, opacity: 0.7 }} />
        ))}
      </div>
    </div>
  );
}

function Desk({ t, L, H, light }) {
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: L.deskTop, bottom: 0, background: "linear-gradient(180deg, #0B0C0E 0%, #050506 60%, #020203 100%)" }}>
      {/* brilho da tela refletido na mesa */}
      <div style={{ position: "absolute", left: "10%", right: "-10%", top: -10, height: 120, background: `radial-gradient(ellipse at 55% 0%, ${rgba(light, 0.28)}, transparent 70%)` }} />
    </div>
  );
}

// Teclado mecânico em primeiro plano, com retroiluminação RGB e desfoque de profundidade
function Keyboard({ t, L }) {
  const rows = 5;
  const cols = 15;
  const keys = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const hue = (c * 22 + r * 14 + t * 90) % 360;
      keys.push(
        <div key={`${r}-${c}`} style={{
          position: "absolute", left: c * 34, top: r * 34, width: 30, height: 30, borderRadius: 5, background: "#121316",
          boxShadow: `0 4px 0 #08090A, 0 5px 10px hsla(${hue}, 90%, 55%, .32), inset 0 1px 0 rgba(255,255,255,.06)`,
        }} />,
      );
    }
  }
  return (
    <div style={{
      position: "absolute", left: L.kb.x, top: L.kb.y, width: cols * 34, height: rows * 34, zIndex: 20, filter: "blur(3px) brightness(.8)",
      transform: "perspective(520px) rotateX(62deg) rotateZ(-16deg) scale(.95)", transformOrigin: "50% 0",
      WebkitMaskImage: "linear-gradient(90deg, #000 40%, transparent 95%)", maskImage: "linear-gradient(90deg, #000 40%, transparent 95%)",
    }}>
      {keys}
    </div>
  );
}

function Frame({ t, format = "9x16" }) {
  const F = FORMATS[format];
  const L = LAYOUT[format];
  const light = lightAt(t);
  // câmera na mão: soma de senoides (periódica em 8s) + aproximação lenta + "soco" a cada corte
  const ph = (t / DURATION) * Math.PI * 2;
  const sx = Math.sin(ph * 3) * 2.2 + Math.sin(ph * 7 + 1) * 1.1;
  const sy = Math.cos(ph * 4) * 1.8 + Math.sin(ph * 9 + 2) * 0.9;
  const rot = Math.sin(ph * 2 + 0.5) * 0.35;
  const push = 1.02 + 0.04 * easeInOut(prog(t, 0, 6.5)) - 0.04 * easeInOut(prog(t, 6.5, 8));
  const punch = Math.exp(-sinceCut(t) * 10) * 0.012;
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: "#030304", fontFamily: FONT }}>
      <div style={{ position: "absolute", inset: 0, transform: `translate(${sx}px, ${sy}px) rotate(${rot}deg) scale(${push + punch})` }}>
        <Wall t={t} L={L} H={F.h} light={light} />
        <Desk t={t} L={L} H={F.h} light={light} />
        <Monitor t={t} L={L} light={light} />
        <Keyboard t={t} L={L} />
      </div>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 42%, transparent 50%, rgba(0,0,0,.7) 100%)", pointerEvents: "none", zIndex: 30 }} />
      <Grain t={t} opacity={0.08} />
    </div>
  );
}

/* =============================================================================
   Som — 8s a 120 BPM: groove com impacto em cada corte, riser, drop na parada
   da Dizzy e acorde final no cartão da Estoke
============================================================================= */
function buildEvents() {
  const ev = [];
  const add = (t, fn) => ev.push({ t, fn });
  const B = 0.5;
  // 0–4s: um corte por tempo
  for (let b = 0; b < 8; b++) {
    const tb = b * B;
    add(tb, (A, w) => SND.kick(A, w, 1));
    add(tb, (A, w) => hiss(A, w, { type: "highpass", f: 3000, f2: 7000, dur: 0.07, v: 0.16, pan: b % 2 ? 0.4 : -0.4 })); // "clique" do corte
    if (b % 2 === 1) add(tb, (A, w) => SND.clap(A, w, 1));
    for (let i = 1; i < 4; i++) add(tb + i * (B / 4), (A, w) => SND.hat(A, w, i === 2 ? 0.8 : 0.4, i % 2 ? 0.3 : -0.3));
    add(tb, (A, w) => SND.bass(A, w, [45, 45, 41, 43][Math.floor(b / 2)] - 12, 0.3, 1));
    add(tb, (A, w) => SND.pluck(A, w, [69, 72, 76, 79, 81, 79, 76, 72][b], 0.8, b % 2 ? 0.4 : -0.4));
  }
  add(3.0, (A, w) => hiss(A, w, { f: 300, f2: 7000, q: 2, dur: 1, v: 0.2, shape: "rise", send: 0.3 }));
  // 4–6,5s: drop na parada da Dizzy
  add(4.0, (A, w) => {
    tone(A, w, { f: 110, f2: 30, glide: 0.7, dur: 1.2, v: 0.7, send: 0.4 });
    hiss(A, w, { type: "lowpass", f: 1400, f2: 120, dur: 0.9, v: 0.3, send: 0.6 });
  });
  add(4.0, (A, w) => SND.shimmer(A, w, 0.8));
  [4.0, 4.75, 5.5, 6.0].forEach((tb, i) => add(tb, (A, w) => SND.kick(A, w, i === 0 ? 1 : 0.7)));
  [5.0, 6.0].forEach((tb) => add(tb, (A, w) => SND.clap(A, w, 0.9)));
  for (let i = 0; i < 10; i++) add(4.0 + i * 0.25 + 0.125, (A, w) => SND.hat(A, w, 0.45, i % 2 ? 0.3 : -0.3));
  add(4.0, (A, w) => SND.pad(A, w, [45, 52, 55, 60], 2.5, 1600, 1.1));
  [[4.25, 76], [4.75, 79], [5.25, 84], [5.75, 83], [6.25, 79]].forEach(([tb, n]) => add(tb, (A, w) => SND.bell(A, w, n, 0.8, 0.2)));
  // 6,5–8s: cartão final
  add(6.45, (A, w) => SND.whoosh(A, w, { dur: 0.6, from: 4000, to: 300, v: 0.25, pan: 0, panTo: 0 }));
  add(6.6, (A, w) => [72, 76, 79, 84].forEach((n, i) => tone(A, w + i * 0.06, { type: "triangle", f: midi(n), dur: 1.3, v: 0.08, send: 0.5, pan: i / 3 - 0.5 })));
  add(6.6, (A, w) => SND.pad(A, w, [48, 55, 59, 64], 1.4, 2000, 1));
  return ev.sort((a, b) => a.t - b.t);
}
const EVENTS = buildEvents();
const renderWav = () => renderEventsWav(EVENTS, DURATION, { loop: true });

// Usado pelo exportador de vídeo (scripts/export-video.cjs)
const MOTION = { Frame, duration: DURATION, formats: FORMATS, renderWav, loop: true };

export default function MonitorReel() {
  return (
    <MotionPlayer Frame={Frame} duration={DURATION} events={EVENTS} formats={FORMATS} defaultFormat="9x16" renderWav={renderWav}
      scenes={[{ name: "Cortes", from: 0 }, { name: "Destaque", from: 4 }, { name: "Estoke ao Cubo", from: 6.5 }]} />
  );
}
