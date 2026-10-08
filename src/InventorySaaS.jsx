import React from "react";
import {
  C, FONT, DISP, clamp, lerp, prog, easeOut, easeIn, easeInOut, rnd, spring, vel, hexA, midi, tone, hiss,
  GRAD, GRAD_LIGHT, Beam, Grain, CubeLogo, SND, renderEventsWav, MotionPlayer,
} from "./motionKit";
import { VARIANT } from "./saas/variant";

/* =============================================================================
   Estoke ao Cubo — Sistema de Gestão de Estoque (motion SaaS, 35s)
   Estética Apple/Linear: ícones 3D "soft-matte", UI em glassmorphism, fundos que
   alternam navy/preto e claro (paper), feixes azul e ciano, grão e
   títulos em Monument, como no manual da marca.
   Cenas ligadas por match-cuts: o anel vira portal (1→2), o card de relatórios vira a
   tela do monitor (2→3), o card flutuante branco vira o fundo claro (3→4), o check da
   equipe abre o fundo escuro (4→5) e as barras sobem para o fundo final com a logo.
============================================================================= */
const HOOK = 2.0; // gancho antes da cena 1: as cenas abaixo usam tempo local (t - HOOK)
const FULL_DURATION = HOOK + 37.5;
const FORMATS = {
  "9x16": { w: 450, h: 800, label: "9:16" },
  "4x5": { w: 450, h: 562.5, label: "4:5" },
};
// cy: centro do palco visual · ty: topo do bloco de texto · k: escala dos objetos · lineY: linha de processos (cena 4)
const LAYOUTS = {
  "9x16": { cy: 330, ty: 596, k: 1, txt: 1, lineY: 132, monY: 352, toasts: true },
  "4x5": { cy: 214, ty: 420, k: 0.72, txt: 0.86, lineY: 58, monY: 226, toasts: false },
};
// Paleta da marca (motionKit C): navy/preto, azul e ciano
const P = {
  neon: C.cyan,
  neonDeep: C.deep,
  elec: C.blue,
  ink: C.ink,
  inkSoft: C.slate,
  paper: C.paper,
  dash: "#001A3A",
};
const T = { s2: 5, s3: 12, s4: 20, s5: 28, fin: 31.6 };
const STEPS = [6.9, 8.3, 9.7]; // giros do prisma (cena 2)

const expoIn = (p) => (p <= 0 ? 0 : Math.pow(2, 10 * p - 10));
const expoInOut = (p) => (p <= 0 ? 0 : p >= 1 ? 1 : p < 0.5 ? Math.pow(2, 20 * p - 10) / 2 : (2 - Math.pow(2, -20 * p + 10)) / 2);
const HL_DARK = GRAD_LIGHT;
const HL_LIGHT = GRAD;

/* ---------- Ícones 3D soft-matte (SVG) ---------- */
const rr = (x, y, w, h, r) => `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`;
const circ = (x, y, r) => `M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
// [luz, meio, sombra, lateral da extrusão]
const TINT = {
  green: ["#D6F6FF", "#3FC6F0", "#0089CC", "#005F94"],
  blue: ["#CFE0F5", "#2F6FB8", "#00396F", "#002450"],
  white: ["#FFFFFF", "#EEF3F8", "#CBD6E2", "#9FAEC0"],
  amber: ["#FFE7AE", "#FFB840", "#E47F14", "#A65A0B"],
  dark: ["#5A6B78", "#2A3540", "#151C24", "#0B1016"],
};
const BAR_W = [2, 1.5, 3, 2, 1.5, 3, 2, 1.5, 2, 3, 1.5, 2, 2, 3];
const ICONS = {
  sheet: [
    { d: rr(20, 12, 60, 76, 12), f: "white" },
    { d: rr(28, 21, 44, 11, 4), f: C.blue },
    ...[0, 1, 2, 3].flatMap((r) => [0, 1].map((c) => ({ d: rr(28 + c * 23, 39 + r * 11, 21, 7, 2.5), f: r === 0 ? "#A9DCF5" : "#DDE7F1" }))),
  ],
  box: [
    { d: "M50 16 L86 33 L50 50 L14 33Z", f: "#F2D19C", spec: true },
    { d: "M14 33 L50 50 L50 88 L14 71Z", f: "#D8A160" },
    { d: "M86 33 L50 50 L50 88 L86 71Z", f: "#B47A40" },
    { d: "M29 26 L65 43 L71 40 L35 23Z", f: "#FBE9C8" },
    { d: "M65 43 L71 40 L71 54 L65 57Z", f: "#E8CFA2" },
  ],
  barcode: [
    { d: rr(12, 24, 76, 52, 12), f: "white" },
    ...BAR_W.map((w, i) => ({ d: rr(22 + i * 4, 34, w, 26, 0.6), f: C.ink })),
    { d: "M16 47 H84", st: C.cyan, sw: 2.5 },
  ],
  invoice: [
    { d: "M24 10 H76 Q80 10 80 14 V88 L73 83 L66 88 L59 83 L52 88 L45 83 L38 88 L31 83 L20 88 V14 Q20 10 24 10Z", f: "white" },
    { d: rr(29, 20, 26, 6, 3), f: C.blue },
    { d: rr(29, 32, 42, 4, 2), f: "#C8D4E1" },
    { d: rr(29, 41, 34, 4, 2), f: "#C8D4E1" },
    { d: rr(29, 50, 38, 4, 2), f: "#C8D4E1" },
    { d: rr(29, 62, 18, 8, 4), f: C.sky },
    { d: rr(53, 62, 18, 8, 4), f: C.ink },
  ],
  scanner: [
    { d: "M42 46 H60 L54 86 Q53 90 49 90 H45 Q41 90 41 86 Z", f: "blue" },
    { d: rr(14, 18, 62, 32, 14), f: "blue" },
    { d: rr(21, 25, 34, 14, 6), f: "#001634" },
    { d: rr(24, 28, 10, 4, 2), f: C.cyan },
    { d: "M82 22 L94 15", st: P.neonDeep, sw: 3.5 },
    { d: "M82 34 L96 34", st: P.neonDeep, sw: 3.5 },
    { d: "M82 46 L94 53", st: P.neonDeep, sw: 3.5 },
  ],
  truck: [
    { d: rr(8, 24, 54, 40, 8), f: "white" },
    { d: "M62 36 H76 Q80 36 82 39 L91 51 Q92 53 92 55 V64 H62 Z", f: "green" },
    { d: "M67 41 H75 L83 52 H67 Z", f: "#D6F3FF" },
    { d: rr(15, 33, 30, 6, 3), f: C.blue },
    { d: circ(26, 68, 10), f: "dark" },
    { d: circ(74, 68, 10), f: "dark" },
    { d: circ(26, 68, 4), f: "#C9D4E0" },
    { d: circ(74, 68, 4), f: "#C9D4E0" },
  ],
  chart: [
    { d: rr(12, 14, 76, 70, 14), f: "white" },
    { d: rr(24, 54, 11, 20, 3.5), f: "blue", ext: 2.5 },
    { d: rr(40, 44, 11, 30, 3.5), f: "blue", ext: 2.5 },
    { d: rr(56, 30, 11, 44, 3.5), f: "green", ext: 2.5 },
    { d: "M22 44 L38 34 L50 38 L70 22", st: C.ink, sw: 2.5 },
  ],
  alert: [
    { d: "M50 12 Q55 12 58 17 L90 74 Q93 80 89 84 Q87 86 83 86 H17 Q13 86 11 84 Q7 80 10 74 L42 17 Q45 12 50 12Z", f: "amber" },
    { d: rr(45.5, 34, 9, 28, 4.5), f: "#3A2205" },
    { d: circ(50, 72, 5.2), f: "#3A2205" },
  ],
  team: [
    { d: "M46 86 Q48 60 66 60 Q86 60 88 86Z", f: "green" },
    { d: circ(66, 42, 12), f: "green" },
    { d: "M12 86 Q14 54 38 54 Q62 54 64 86Z", f: "blue" },
    { d: circ(38, 32, 15), f: "blue" },
  ],
  file: [
    { d: "M28 10 H62 L78 26 V84 Q78 90 72 90 H28 Q22 90 22 84 V16 Q22 10 28 10Z", f: "white" },
    { d: "M62 10 V22 Q62 26 66 26 H78Z", f: "#C9D4E0" },
    { d: rr(30, 36, 32, 5, 2.5), f: "#C8D4E1" },
    { d: rr(30, 46, 40, 5, 2.5), f: "#C8D4E1" },
    { d: rr(30, 56, 24, 5, 2.5), f: "#C8D4E1" },
    { d: rr(30, 68, 24, 10, 5), f: C.blue },
  ],
  check: [
    { d: circ(50, 50, 40), f: "green" },
    { d: "M32 51 L45 63 L69 38", st: "#FFFFFF", sw: 9 },
  ],
};

// gradientes compartilhados por todos os ícones (referenciados por id no documento)
function IconDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <defs>
        {Object.entries(TINT).map(([n, c]) => (
          <linearGradient key={n} id={`iq-${n}`} x1="0" y1="0" x2="0.35" y2="1">
            <stop offset="0" stopColor={c[0]} />
            <stop offset="0.5" stopColor={c[1]} />
            <stop offset="1" stopColor={c[2]} />
          </linearGradient>
        ))}
        <radialGradient id="iq-spec" cx="0.3" cy="0.18" r="0.75">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.6" />
          <stop offset="0.55" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="iq-steel" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.5" stopColor="#D4DCE6" />
          <stop offset="1" stopColor="#8E9CAE" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function Icon3D({ kind, size, shadow = 0.35, style }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} style={{
      display: "block", overflow: "visible",
      filter: shadow ? `drop-shadow(0 ${size * 0.12}px ${size * 0.14}px rgba(0,0,0,${shadow}))` : "none", ...style,
    }}>
      {ICONS[kind].map((it, i) => {
        if (it.st) return <path key={i} d={it.d} fill="none" stroke={it.st} strokeWidth={it.sw || 4} strokeLinecap="round" strokeLinejoin="round" />;
        const tint = TINT[it.f];
        if (!tint) {
          return (
            <g key={i}>
              <path d={it.d} fill={it.f} />
              {it.spec && <path d={it.d} fill="url(#iq-spec)" />}
            </g>
          );
        }
        const ext = it.ext ?? 5;
        return (
          <g key={i}>
            {ext > 0 && <path d={it.d} fill={tint[3]} transform={`translate(0 ${ext})`} />}
            <path d={it.d} fill={`url(#iq-${it.f})`} />
            <path d={it.d} fill="url(#iq-spec)" />
          </g>
        );
      })}
    </svg>
  );
}

function Sparkle({ size, color = P.neon, rot = 0 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} style={{ display: "block", transform: `rotate(${rot}deg)`, filter: `drop-shadow(0 0 ${size * 0.35}px ${hexA(color, 0.9)})` }}>
      <path d="M12 0 C13 7 17 11 24 12 C17 13 13 17 12 24 C11 17 7 13 0 12 C7 11 11 7 12 0Z" fill={color} />
    </svg>
  );
}

// Mão 3D (cursor de apontar), ponta do dedo em (27, 3) do viewBox 64×72
const HAND = [rr(22, 2, 12, 40, 6), rr(34, 24, 11, 22, 5.5), rr(45, 28, 10, 20, 5), rr(55, 33, 8, 16, 4), rr(18, 36, 45, 32, 13), "M20 44 L10 36 Q5 33 3 38 Q2 42 6 46 L18 60Z"];
function Hand({ x, y, size, press = 0 }) {
  const s = size / 64;
  return (
    <div style={{ position: "absolute", left: x - 27 * s, top: y - 3 * s, width: size, zIndex: 70, pointerEvents: "none", transform: `scale(${1 - press * 0.1}) rotate(${-8 + press * 4}deg)`, transformOrigin: `${27 * s}px ${3 * s}px` }}>
      <svg viewBox="0 0 64 72" width={size} height={size * 1.125} style={{ display: "block", overflow: "visible", filter: `drop-shadow(0 ${10 - press * 6}px ${12 - press * 5}px rgba(0,26,60,.35))` }}>
        {HAND.map((d, i) => <path key={`o${i}`} d={d} fill="#001B3D" stroke="#001B3D" strokeWidth="4.5" strokeLinejoin="round" />)}
        {HAND.map((d, i) => <path key={`e${i}`} d={d} fill={TINT.white[3]} transform="translate(0 2.2)" />)}
        {HAND.map((d, i) => <path key={`f${i}`} d={d} fill="url(#iq-white)" />)}
        {HAND.map((d, i) => <path key={`s${i}`} d={d} fill="url(#iq-spec)" />)}
      </svg>
    </div>
  );
}

/* ---------- Texto: palavras entram com mola + desfoque (estilo Apple) ---------- */
function Words({ text, t, t0, t1 = 99, size, color = "#FFFFFF", hl = [], hlBg = HL_DARK, weight = 800, stagger = 0.055, maxW = 400, lh = 1.08, track = "-0.035em", disp = false }) {
  const words = text.split(" ");
  return (
    <div style={{
      display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: size * 0.26, maxWidth: maxW, margin: "0 auto",
      fontFamily: FONT, fontWeight: weight, fontSize: size, lineHeight: lh, letterSpacing: track, color,
      ...(disp ? { ...DISP, lineHeight: 1.04 } : null),
    }}>
      {words.map((w, i) => {
        const s = spring(t - t0 - i * stagger, { stiffness: 150, damping: 17 });
        const e = easeIn(prog(t, t1 + i * 0.02, t1 + 0.32 + i * 0.02));
        const on = clamp(s * 1.5) * (1 - e);
        const hi = hl.includes(i);
        return (
          <span key={i} style={{
            display: "inline-block", paddingBottom: "0.08em", opacity: on,
            transform: on > 0 ? `translateY(${(1 - s) * size * 0.55 - e * size * 0.4}px) scale(${lerp(0.92, 1, clamp(s))})` : "none",
            filter: on > 0 && on < 1 ? `blur(${(1 - clamp(s)) * 7 + e * 6}px)` : "none",
            ...(hi ? { backgroundImage: hlBg, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" } : null),
          }}>{w}</span>
        );
      })}
    </div>
  );
}
function TextBlock({ L, children, z = 50 }) {
  return <div style={{ position: "absolute", left: 22, right: 22, top: L.ty, zIndex: z, textAlign: "center" }}>{children}</div>;
}

const layer = (z, extra) => ({ position: "absolute", inset: 0, overflow: "hidden", zIndex: z, ...extra });
const BG_DARK = "radial-gradient(120% 80% at 50% 40%, #00396F 0%, #001634 45%, #000A1E 100%)";
const BG_NAVY = "radial-gradient(120% 80% at 50% 36%, #0B4C8C 0%, #002450 48%, #000A1E 100%)";
const BG_LIGHT = "radial-gradient(120% 90% at 50% 38%, #FFFFFF 0%, #F5F9FD 52%, #DCE9F5 100%)";
function Glow({ x, y, r, color, a }) {
  return <div style={{ position: "absolute", left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: "50%", background: `radial-gradient(circle, ${hexA(color, a)} 0%, ${hexA(color, a * 0.4)} 40%, ${hexA(color, 0)} 70%)` }} />;
}

/* =============================================================================
   Cena 1 — Do caos ao controle (0–5s)
============================================================================= */
const CHAOS = Array.from({ length: 12 }, (_, i) => {
  const a = (i / 12) * Math.PI * 2 + rnd(i, 1) * 0.45;
  const r = 118 + rnd(i, 2) * 80;
  return { kind: ["sheet", "box", "barcode", "invoice"][i % 4], x: Math.cos(a) * r, y: Math.sin(a) * r * 1.3, z: 0.62 + rnd(i, 3) * 0.6, rot: (rnd(i, 4) - 0.5) * 56, d: rnd(i, 5) * 0.55 };
});
// raio do halo: nasce com o cubo, pulsa e depois abre como portal para a cena 2
function ringRadius(t, L, W, H) {
  const form = spring(t - 3.72, { stiffness: 200, damping: 9 });
  const pulse = 1 + 0.05 * Math.sin((t - 3.8) * Math.PI * 2 * 1.1) * clamp((t - 3.9) * 3);
  const ex = expoIn(prog(t, 4.45, 5.15));
  return { r: lerp(84 * L.k * form * pulse, Math.hypot(W, H) * 0.8, ex), ex, form, pulse };
}
function Scene1({ t, W, H, L }) {
  const cx = W / 2;
  const { cy, k } = L;
  const cam = lerp(1, 1.08, easeInOut(prog(t, 0, 3.8)));
  return (
    <div style={layer(1, { background: BG_DARK })}>
      <Beam x={W * 0.15} y={H * 0.16} w={560} h={110} rot={-28 + Math.sin(t * 0.4) * 3} color={C.blue} a={0.42} />
      <Beam x={W * 0.9} y={H * 0.72} w={520} h={90} rot={-28} color={C.cyan} a={0.22} />
      <Glow x={cx - 120} y={cy - 180} r={220} color={P.neon} a={0.07} />
      <Glow x={cx + 140} y={cy + 160} r={200} color={P.elec} a={0.08} />
      <div style={{ position: "absolute", inset: 0, transform: `scale(${cam})`, transformOrigin: `${cx}px ${cy}px` }}>
        {CHAOS.map((c, i) => {
          const app = spring(t - 0.15 - c.d, { stiffness: 120, damping: 11 });
          const pull = easeIn(prog(t, 2.6 + c.d * 0.4, 3.62 + c.d * 0.15));
          const ang = Math.atan2(c.y, c.x) + pull * 2.4;
          const r = Math.hypot(c.x, c.y) * (1 - pull);
          const fx = Math.sin(t * 0.8 + i * 1.7) * 10 * (1 - pull);
          const fy = Math.cos(t * 0.7 + i * 1.1) * 12 * (1 - pull);
          const size = 72 * k;
          const x = cx + (Math.cos(ang) * r + fx) * k;
          const y = cy + (Math.sin(ang) * r + fy) * k;
          const sc = clamp(app, 0, 1.3) * (1 - pull * 0.9) * c.z;
          const o = clamp(app * 2) * (1 - prog(pull, 0.75, 1));
          if (o <= 0) return null;
          // rastro de movimento: o desfoque cresce com a velocidade da sucção
          const blur = (c.z < 0.82 ? (0.82 - c.z) * 9 : 0) + pull * 4;
          // inclinação 3D contínua: os ícones giram no espaço, não só no plano
          const tx = Math.sin(t * 1.1 + i * 2.1) * 26;
          const ty = Math.cos(t * 0.9 + i * 1.3) * 30;
          return (
            <div key={i} style={{
              position: "absolute", left: x - size / 2, top: y - size / 2, width: size, height: size, opacity: o, zIndex: Math.round(c.z * 10),
              transform: `perspective(${420 * k}px) rotateX(${tx}deg) rotateY(${ty}deg) scale(${sc}) rotate(${c.rot + Math.sin(t * 0.9 + i) * 8 + pull * 220}deg)`,
              filter: blur > 0.3 ? `blur(${blur}px)` : "none",
            }}>
              <Icon3D kind={c.kind} size={size} shadow={0.45} />
            </div>
          );
        })}
        {/* partículas sugadas em espiral */}
        {t > 2.3 && t < 3.9 && Array.from({ length: 28 }, (_, j) => {
          const ph = (t * 0.9 + rnd(j, 7)) % 1;
          const a = j * 2.4 + ph * 4;
          const r = (1 - ph) * 250 * k;
          const o = prog(t, 2.3, 2.7) * (1 - prog(t, 3.7, 3.88)) * Math.sin(ph * Math.PI);
          return <div key={j} style={{ position: "absolute", left: cx + Math.cos(a) * r - 2, top: cy + Math.sin(a) * r * 1.2 - 2, width: 4, height: 4, borderRadius: 4, background: P.neon, opacity: o, boxShadow: `0 0 8px ${P.neon}` }} />;
        })}
      </div>
      {/* clarão no nascimento do cubo */}
      {t > 3.72 && t < 4.6 && <Glow x={cx} y={cy} r={190 * k} color="#E6F7FF" a={0.75 * Math.exp(-(t - 3.72) * 5)} />}
      <TextBlock L={L}>
        <Words disp text="Transforme o estoque bagunçado em um sistema fluido." t={t} t0={0.55} t1={4.15} size={23 * L.txt} color="#EAF4FC" hl={[6, 7]} />
      </TextBlock>
    </div>
  );
}
// O cubo da marca: recebe o caos, pulsa e se dissolve na luz do portal (fica acima da cena 2)
function CubeOverlay({ t, W, H, L }) {
  if (t < 3.6 || t > 5.2) return null;
  const { form, pulse, ex } = ringRadius(t, L, W, H);
  const size = 122 * L.k;
  const o = clamp(form * 3) * (1 - prog(ex, 0.25, 0.75));
  const sc = clamp(form, 0, 1.3) * pulse * lerp(1, 2.4, ex);
  return (
    <div style={{
      position: "absolute", left: W / 2, top: L.cy, zIndex: 41, opacity: o, pointerEvents: "none",
      transform: `translate(-50%, -50%) scale(${sc}) rotate(${(1 - clamp(form)) * -70}deg)`,
    }}>
      <CubeLogo size={size} glow={1.3 + 0.4 * Math.sin(t * 7)} />
    </div>
  );
}
function RingOverlay({ t, W, H, L }) {
  if (t < 3.72 || t > 5.3) return null;
  const cx = W / 2;
  const { r, ex } = ringRadius(t, L, W, H);
  const o = lerp(0.45, 1, prog(t, 4.3, 4.45)) * (1 - prog(ex, 0.55, 1));
  const bw = lerp(2, 10, ex);
  return (
    <div style={{
      position: "absolute", left: cx - r, top: L.cy - r, width: r * 2, height: r * 2, borderRadius: "50%", zIndex: 40, opacity: o, pointerEvents: "none",
      border: `${bw}px solid ${P.neon}`, boxShadow: `0 0 18px ${P.neon}, 0 0 60px ${hexA(P.neon, 0.6)}, inset 0 0 22px ${hexA(P.neon, 0.8)}`,
    }} />
  );
}

/* =============================================================================
   Cena 2 — O cubo vira um prisma 3D: cada face é um módulo, a logo fica no topo (5–12s)
============================================================================= */
const MODULES = [
  { kind: "box", title: "Compras", sub: "Entradas e notas" },
  { kind: "scanner", title: "Armazém", sub: "Rastreio de lotes" },
  { kind: "chart", title: "Vendas", sub: "Relatórios e giro" },
  { kind: "truck", title: "Logística", sub: "Rotas e entregas" },
];
// ângulo do prisma: entra girando e para em cada face com mola (overshoot elástico)
const prismRot = (t) => (1 - spring(t - 5.0, { stiffness: 46, damping: 11 })) * 270
  - STEPS.reduce((acc, s) => acc + 90 * spring(t - s, { stiffness: 150, damping: 13 }), 0);
function Scene2({ t, W, H, L }) {
  const cx = W / 2;
  const { k } = L;
  const ccy = L.cy - 6 * k;
  const { r } = ringRadius(t, L, W, H);
  const enter = easeOut(prog(t, 4.45, 5.7));
  const zoom = expoIn(prog(t, 11.2, 12.0));
  const camS = lerp(1.22, 1, enter) * lerp(1, 7.2, zoom);
  const cw = 158 * k;
  const ch = 196 * k;
  const rot = prismRot(t);
  const em = spring(t - 5.0, { stiffness: 90, damping: 12 });
  const omega = Math.abs(vel(prismRot, t));
  const mblur = Math.min(1.6, omega / 320) * k + zoom * 6;
  const navy = prog(t, 11.3, 11.8);
  const zoomFace = STEPS.length;
  const bob = Math.sin(t * 1.3) * 5 * k;
  return (
    <div style={layer(2, { background: BG_LIGHT, opacity: prog(t, 4.3, 4.55), clipPath: t < 5.2 ? `circle(${r}px at ${cx}px ${L.cy}px)` : "none" })}>
      <Glow x={cx - 150} y={ccy - 200 * k} r={230} color={P.neon} a={0.22} />
      <Glow x={cx + 150} y={ccy + 120 * k} r={230} color={P.elec} a={0.16} />
      <div style={{ position: "absolute", inset: 0, transform: `scale(${camS})`, transformOrigin: `${cx}px ${ccy}px`, filter: mblur > 0.2 ? `blur(${mblur}px)` : "none" }}>
        {/* órbita e sombra no chão: o halo do cubo deitado sob o prisma */}
        <div style={{
          position: "absolute", left: cx - 150 * k, top: ccy + ch / 2 + 8 * k, width: 300 * k, height: 64 * k, borderRadius: "50%",
          border: `1.5px solid ${hexA(P.elec, 0.4)}`, boxShadow: `0 0 24px ${hexA(P.neon, 0.35)}`, opacity: clamp((t - 5.1) * 2),
        }} />
        <div style={{ position: "absolute", left: cx - 100 * k, top: ccy + ch / 2 + 22 * k, width: 200 * k, height: 34 * k, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(0,36,80,.28), rgba(0,36,80,0) 70%)", opacity: clamp(em) }} />
        <div style={{ position: "absolute", left: cx, top: ccy + bob, width: 0, height: 0, perspective: `${900 * k}px` }}>
          <div style={{ position: "absolute", left: 0, top: 0, transformStyle: "preserve-3d", transform: `rotateX(-13deg) rotateY(${rot}deg) scale(${clamp(em, 0, 1.2)})` }}>
            {MODULES.map((m, i) => {
              const zf = Math.cos(((i * 90 + rot) * Math.PI) / 180);
              const front = clamp((zf - 0.86) / 0.14);
              return (
                <div key={m.title} style={{
                  position: "absolute", left: -cw / 2, top: -ch / 2, width: cw, height: ch, boxSizing: "border-box",
                  transform: `rotateY(${i * 90}deg) translateZ(${cw / 2}px)`, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden",
                  borderRadius: 12 * k, background: "linear-gradient(160deg, #FFFFFF 0%, #EEF5FB 60%, #DDEAF6 100%)", border: "1px solid rgba(255,255,255,.95)",
                  boxShadow: `inset 0 1px 0 #fff, inset 0 0 0 ${1.5 * front}px ${hexA(P.elec, 0.8)}, 0 0 ${34 * front}px ${hexA(P.neon, 0.5 * front)}`,
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 * k, overflow: "hidden",
                }}>
                  <div style={{ transform: `translateY(${Math.sin(t * 2 + i) * 3 * k}px) rotate(${Math.sin(t * 1.4 + i) * 4}deg) scale(${1 + front * 0.08})` }}>
                    <Icon3D kind={m.kind} size={86 * k} shadow={0.22} />
                  </div>
                  <div style={{ ...DISP, fontSize: 15 * k, color: P.ink }}>{m.title}</div>
                  <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 11.5 * k, color: P.inkSoft, marginTop: -5 * k }}>{m.sub}</div>
                  {/* brilho de vidro que percorre a face ativa */}
                  {front > 0 && <div style={{ position: "absolute", top: -40 * k, bottom: -40 * k, width: 40 * k, left: `${lerp(-30, 130, ((t * 0.55 + i * 0.3) % 1.6) / 1.6)}%`, transform: "rotate(18deg)", background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,.75), rgba(255,255,255,0))", opacity: front * 0.8 }} />}
                  {/* sombreamento: a face escurece ao virar de lado */}
                  <div style={{ position: "absolute", inset: 0, background: P.ink, opacity: (1 - Math.max(0, zf)) * 0.22 }} />
                  {i === zoomFace && navy > 0 && <div style={{ position: "absolute", inset: 0, background: P.dash, opacity: navy }} />}
                </div>
              );
            })}
            {/* topo do prisma: a marca */}
            <div style={{
              position: "absolute", left: -cw / 2, top: -cw / 2, width: cw, height: cw, transform: `rotateX(90deg) translateZ(${ch / 2}px)`,
              borderRadius: 12 * k, background: `linear-gradient(135deg, ${C.deep}, ${C.ink} 60%, ${C.night})`, display: "grid", placeItems: "center",
              boxShadow: `inset 0 0 0 1px ${hexA(C.cyan, 0.5)}, inset 0 0 30px ${hexA(C.cyan, 0.25)}`,
            }}>
              <div style={{ transform: `rotate(${-rot}deg)` }}><CubeLogo size={70 * k} glow={0.8} /></div>
            </div>
          </div>
        </div>
      </div>
      <TextBlock L={L}>
        <Words text="Compras, Armazém, Vendas e Logística." t={t} t0={5.6} t1={10.9} size={22 * L.txt} weight={700} color={P.ink} track="-0.025em" />
        <div style={{ height: 8 * L.txt }} />
        <Words disp text="Tudo em um só lugar." t={t} t0={7.2} t1={10.95} size={25 * L.txt} color={P.ink} hl={[0, 1, 2, 3, 4]} hlBg={HL_LIGHT} />
      </TextBlock>
    </div>
  );
}

/* =============================================================================
   Cena 3 — Monitor com dashboard + card flutuante (12–20s)
============================================================================= */
const SW = 392;
const SH = 245;
const SLOT = { x: 64, y: 100, w: 186, h: 132 }; // painel do dashboard que vira o card flutuante
const CHART_PTS = Array.from({ length: 48 }, (_, i) => {
  const u = i / 47;
  return [u, 0.16 + 0.62 * easeInOut(u) + 0.06 * Math.sin(u * 9) + 0.03 * Math.sin(u * 23)];
});
function chartPath(w, h, upto) {
  const pts = [];
  for (let i = 0; i < CHART_PTS.length; i++) {
    const [u, v] = CHART_PTS[i];
    if (u <= upto) pts.push([u, v]);
    else {
      const [u0, v0] = CHART_PTS[i - 1];
      const f = (upto - u0) / (u - u0);
      pts.push([upto, lerp(v0, v, f)]);
      break;
    }
  }
  const line = pts.map(([u, v], i) => `${i ? "L" : "M"}${(u * w).toFixed(1)} ${((1 - v) * h).toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1];
  return { line, area: `${line} L${(last[0] * w).toFixed(1)} ${h} L0 ${h}Z`, end: [last[0] * w, (1 - last[1]) * h] };
}
function Dashboard({ t, hideSlot }) {
  const panel = { position: "absolute", borderRadius: 10, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)" };
  const lbl = { fontFamily: FONT, fontWeight: 600, fontSize: 7.5, color: "rgba(220,232,255,.6)" };
  const val = { fontFamily: FONT, fontWeight: 800, fontSize: 15, color: "#FFFFFF", letterSpacing: "-0.03em" };
  const mini = chartPath(SLOT.w - 24, 64, 1);
  return (
    <div style={{ position: "absolute", inset: 0, background: `linear-gradient(160deg, #0A2E5C 0%, ${P.dash} 60%)`, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 52, background: "rgba(0,0,0,.22)", borderRight: "1px solid rgba(255,255,255,.06)" }}>
        <div style={{ position: "absolute", left: 16, top: 14 }}><CubeLogo size={20} /></div>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} style={{ position: "absolute", left: 17, top: 56 + i * 30, width: 18, height: 18, borderRadius: 6, background: i === 0 ? hexA(P.neon, 0.9) : "rgba(255,255,255,.12)", boxShadow: i === 0 ? `0 0 12px ${hexA(P.neon, 0.6)}` : "none" }} />
        ))}
      </div>
      <div style={{ position: "absolute", left: 64, top: 13, fontFamily: FONT, fontWeight: 800, fontSize: 13, color: "#FFFFFF", letterSpacing: "-0.02em" }}>Visão geral</div>
      <div style={{ position: "absolute", right: 12, top: 12, width: 92, height: 18, borderRadius: 9, background: "rgba(255,255,255,.07)" }} />
      {[["Itens ativos", "3.218"], ["Pedidos hoje", "146"], ["Rupturas", "0"]].map(([l, v], i) => (
        <div key={l} style={{ ...panel, left: 64 + i * 108, top: 42, width: 100, height: 48 }}>
          <div style={{ ...lbl, position: "absolute", left: 10, top: 9 }}>{l}</div>
          <div style={{ ...val, position: "absolute", left: 10, top: 21, color: i === 2 ? P.neon : "#FFFFFF" }}>{v}</div>
        </div>
      ))}
      <div style={{ ...panel, left: SLOT.x, top: SLOT.y, width: SLOT.w, height: SLOT.h, opacity: hideSlot ? 0 : 1 }}>
        <div style={{ ...lbl, position: "absolute", left: 12, top: 10, color: "#FFFFFF", fontWeight: 700 }}>Nível de estoque</div>
        <svg width={SLOT.w - 24} height={64} style={{ position: "absolute", left: 12, bottom: 14, overflow: "visible" }}>
          <path d={mini.area} fill={hexA(P.neon, 0.12)} />
          <path d={mini.line} fill="none" stroke={P.neon} strokeWidth="2" />
        </svg>
      </div>
      <div style={{ ...panel, left: 258, top: SLOT.y, width: 122, height: SLOT.h }}>
        <div style={{ ...lbl, position: "absolute", left: 10, top: 10, color: "#FFFFFF", fontWeight: 700 }}>Giro por categoria</div>
        {[0.55, 0.8, 0.42, 0.95, 0.68].map((h, i) => {
          const hh = 70 * h * (0.9 + 0.1 * Math.sin(t * 2.2 + i * 1.3));
          return <div key={i} style={{ position: "absolute", left: 14 + i * 21, bottom: 14, width: 12, height: hh, borderRadius: 4, background: i === 3 ? `linear-gradient(180deg, ${P.neon}, ${P.neonDeep})` : `linear-gradient(180deg, ${C.sky}, ${P.elec})` }} />;
        })}
      </div>
    </div>
  );
}
function StockCard({ t, k }) {
  const draw = easeInOut(prog(t, 15.0, 18.4));
  const cnt = lerp(8240, 12480, easeOut(prog(t, 15.0, 18.4)));
  const giro = lerp(3.2, 4.8, easeOut(prog(t, 15.0, 18.4)));
  const cw = 360 * k;
  const chH = 92 * k;
  const chW = cw - 40 * k;
  const ch = chartPath(chW, chH, Math.max(0.001, draw));
  const live = 0.5 + 0.5 * Math.sin(t * 6);
  return (
    <div style={{ position: "absolute", inset: 0, padding: `${18 * k}px ${20 * k}px`, boxSizing: "border-box", fontFamily: FONT }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ fontWeight: 800, fontSize: 16.5 * k, lineHeight: 1.15, letterSpacing: "-0.03em", color: P.ink, maxWidth: 230 * k }}>Nível de Estoque e Giro em Tempo Real</div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 * k, padding: `${4 * k}px ${8 * k}px`, borderRadius: 99, background: hexA(P.neon, 0.18), fontWeight: 700, fontSize: 10 * k, color: C.deep }}>
          <div style={{ width: 6 * k, height: 6 * k, borderRadius: 9, background: P.neonDeep, boxShadow: `0 0 ${6 + live * 6}px ${P.neon}` }} />Ao vivo
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 14 * k, marginTop: 10 * k }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 34 * k, letterSpacing: "-0.04em", color: P.ink, lineHeight: 1 }}>{Math.round(cnt).toLocaleString("pt-BR")}</div>
          <div style={{ fontWeight: 600, fontSize: 10.5 * k, color: P.inkSoft, marginTop: 3 * k }}>itens em estoque</div>
        </div>
        <div style={{ marginLeft: "auto", textAlign: "right" }}>
          <div style={{ fontWeight: 800, fontSize: 20 * k, letterSpacing: "-0.03em", color: P.elec, lineHeight: 1 }}>{giro.toFixed(1).replace(".", ",")}x</div>
          <div style={{ fontWeight: 600, fontSize: 10.5 * k, color: P.inkSoft, marginTop: 3 * k }}>giro / mês</div>
        </div>
      </div>
      <svg width={chW} height={chH} style={{ position: "absolute", left: 20 * k, bottom: 18 * k, overflow: "visible" }}>
        <defs>
          <linearGradient id="sc-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={P.neon} stopOpacity="0.45" />
            <stop offset="1" stopColor={P.neon} stopOpacity="0" />
          </linearGradient>
          <linearGradient id="sc-line" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={P.elec} />
            <stop offset="1" stopColor={P.neonDeep} />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((g) => <line key={g} x1="0" x2={chW} y1={chH * g} y2={chH * g} stroke="rgba(0,36,80,.07)" strokeDasharray="3 4" />)}
        <path d={ch.area} fill="url(#sc-area)" />
        <path d={ch.line} fill="none" stroke="url(#sc-line)" strokeWidth={3 * k} strokeLinecap="round" strokeLinejoin="round" />
        {draw > 0.01 && (
          <g>
            <circle cx={ch.end[0]} cy={ch.end[1]} r={(8 + live * 5) * k} fill={hexA(P.neon, 0.25)} />
            <circle cx={ch.end[0]} cy={ch.end[1]} r={4.5 * k} fill="#FFFFFF" stroke={P.neonDeep} strokeWidth={2.5 * k} />
          </g>
        )}
      </svg>
    </div>
  );
}
const TOASTS = [
  { t: 13.9, text: "Pedido #4822 recebido", kind: "file" },
  { t: 15.7, text: "Lote 118 conferido no armazém", kind: "box" },
  { t: 17.5, text: "NF-e 5531 emitida", kind: "invoice" },
];
function Toasts({ t, W, H }) {
  return TOASTS.map((n, i) => {
    const s = spring(t - n.t, { stiffness: 160, damping: 15 });
    const out = easeIn(prog(t, n.t + 1.55, n.t + 1.85));
    if (s <= 0 || out >= 1 || t > 19.3) return null;
    return (
      <div key={i} style={{
        position: "absolute", left: W / 2, top: H - 118, zIndex: 25, transform: `translate(-50%, ${(1 - s) * 40 - out * 30}px) scale(${lerp(0.9, 1, clamp(s))})`,
        opacity: clamp(s * 2) * (1 - out), filter: out > 0 ? `blur(${out * 6}px)` : "none",
        display: "flex", alignItems: "center", gap: 10, padding: "9px 16px 9px 10px", borderRadius: 16, whiteSpace: "nowrap",
        background: "rgba(255,255,255,.09)", border: "1px solid rgba(255,255,255,.22)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
        boxShadow: `0 14px 30px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.25)`, fontFamily: FONT, fontWeight: 700, fontSize: 13.5, color: "#FFFFFF",
      }}>
        <Icon3D kind={n.kind} size={26} shadow={0.25} />
        {n.text}
        <div style={{ width: 7, height: 7, borderRadius: 7, background: C.cyan, boxShadow: `0 0 10px ${C.cyan}` }} />
      </div>
    );
  });
}
const PILLS = [
  { text: "Controle", t: 16.2, dx: -112, dy: -158, depth: 1.1 },
  { text: "Previsão", t: 16.6, dx: 108, dy: 152, depth: 0.95 },
  { text: "Escala", t: 17.0, dx: -96, dy: 210, depth: 1.2 },
];
function Scene3({ t, W, H, L }) {
  const cx = W / 2;
  const { k } = L;
  const my = L.monY;
  const pull = spring(t - 12.0, { stiffness: 38, damping: 10.5 });
  const sFill = Math.max(W / (SW * k), H / (SH * k)) * 1.06;
  const camS = lerp(sFill, 1, pull);
  const tilt = clamp(pull);
  const ap = easeInOut(prog(t, 14.2, 15.6));
  const camA = lerp(1, 1.22, ap);
  const fc = { x: cx, y: my + 10 * k };
  // posição do painel (slot) no frame, para o card sair exatamente de lá
  const sx = cx + (SLOT.x + SLOT.w / 2 - SW / 2) * k * camS;
  const sy = my + (SLOT.y + SLOT.h / 2 - SH / 2) * k * camS;
  const slot = { x: fc.x + (sx - fc.x) * camA, y: fc.y + (sy - fc.y) * camA, w: SLOT.w * k * camS * camA };
  const lift = spring(t - 14.3, { stiffness: 90, damping: 12 });
  const cw = 360 * k;
  const chh = 250 * k;
  const cS = lerp(slot.w / cw, 1, lift);
  const zt = expoIn(prog(t, 19.3, 20.0));
  const thru = lerp(1, 9, zt);
  const dim = 1 - ap * 0.35;
  return (
    <div style={layer(3, { background: BG_NAVY })}>
      <Beam x={W * 0.1} y={H * 0.1} w={560} h={110} rot={-30} color={C.cyan} a={0.25} />
      <Glow x={cx - 160} y={my - 220 * k} r={260} color={P.elec} a={0.3} />
      <Glow x={cx + 170} y={my + 240 * k} r={240} color={P.neon} a={0.1} />
      <div style={{ position: "absolute", inset: 0, transform: `scale(${thru})`, transformOrigin: `${fc.x}px ${fc.y}px`, filter: zt > 0.02 ? `blur(${zt * 7}px)` : "none" }}>
        <div style={{ position: "absolute", inset: 0, transform: `scale(${camA})`, transformOrigin: `${fc.x}px ${fc.y}px`, filter: ap > 0.02 ? `blur(${ap * 2.2}px) brightness(${dim})` : "none" }}>
          <div style={{ position: "absolute", inset: 0, transform: `scale(${camS})`, transformOrigin: `${cx}px ${my}px` }}>
            {/* reflexo/mesa */}
            <Glow x={cx} y={my + (SH / 2 + 92) * k} r={210 * k} color={P.elec} a={0.22 * tilt} />
            <div style={{
              position: "absolute", left: cx - (SW / 2 + 10) * k, top: my - (SH / 2 + 10) * k, width: (SW + 20) * k, height: (SH + 20) * k,
              transform: `perspective(1400px) rotateX(${tilt * 5}deg) rotateY(${Math.sin(t * 0.45) * 5 * tilt}deg)`, transformOrigin: "50% 60%",
            }}>
              {/* pé do monitor */}
              <div style={{ position: "absolute", left: "50%", top: (SH + 20) * k - 4, width: 64 * k, height: 70 * k, marginLeft: -32 * k, background: "linear-gradient(90deg, #8D97A6, #DCE2EA 45%, #9AA4B2)", clipPath: "polygon(18% 0, 82% 0, 100% 100%, 0 100%)" }} />
              <div style={{ position: "absolute", left: "50%", top: (SH + 20) * k + 64 * k, width: 180 * k, height: 12 * k, marginLeft: -90 * k, borderRadius: 8 * k, background: "linear-gradient(180deg, #E6EBF1, #8E99A8)", boxShadow: "0 14px 30px rgba(0,0,0,.5)" }} />
              <div style={{ position: "absolute", inset: 0, borderRadius: 16 * k, background: "#0A0D12", boxShadow: `0 40px 80px rgba(0,0,0,.55), 0 0 0 1px rgba(255,255,255,.08), 0 0 70px ${hexA(P.elec, 0.25)}` }} />
              <div style={{ position: "absolute", left: 10 * k, top: 10 * k, width: SW * k, height: SH * k, borderRadius: 8 * k, overflow: "hidden" }}>
                <div style={{ position: "absolute", left: 0, top: 0, width: SW, height: SH, transform: `scale(${k})`, transformOrigin: "0 0" }}>
                  <Dashboard t={t} hideSlot={t > 14.32} />
                </div>
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(125deg, rgba(255,255,255,.08) 0%, rgba(255,255,255,0) 40%)" }} />
              </div>
            </div>
          </div>
        </div>
        {/* card flutuante */}
        {t > 14.3 && (
          <div style={{
            position: "absolute", left: fc.x - cw / 2, top: fc.y - chh / 2, width: cw, height: chh, zIndex: 20, borderRadius: 24 * k,
            transform: `translate(${(slot.x - fc.x) * (1 - lift)}px, ${(slot.y - fc.y) * (1 - lift) + Math.sin(t * 1.6) * 4 * k * clamp(lift)}px) scale(${cS}) rotate(${Math.sin(t * 0.9) * 0.8}deg)`,
            background: "rgba(255,255,255,.96)", border: "1px solid rgba(255,255,255,.9)",
            boxShadow: `0 ${30 * lift}px ${80 * lift}px rgba(0,0,0,.45), 0 0 ${60 * lift}px ${hexA(P.elec, 0.4)}, inset 0 1px 0 #fff`, overflow: "hidden",
          }}>
            <StockCard t={t} k={k} />
          </div>
        )}
        {PILLS.map((p) => {
          const s = spring(t - p.t, { stiffness: 140, damping: 12 });
          if (s <= 0) return null;
          const x = fc.x + p.dx * k + Math.sin(t * 1.2 + p.dx) * 5 * p.depth;
          const y = fc.y + p.dy * k + Math.cos(t * 1.1 + p.dy) * 6 * p.depth;
          return (
            <div key={p.text} style={{
              position: "absolute", left: x, top: y, zIndex: 30, transform: `translate(-50%, -50%) scale(${clamp(s, 0, 1.3) * p.depth})`, opacity: clamp(s * 2),
              display: "flex", alignItems: "center", gap: 8 * k, padding: `${9 * k}px ${16 * k}px ${9 * k}px ${12 * k}px`, borderRadius: 99,
              background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.28)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
              boxShadow: `0 12px 30px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.3), 0 0 24px ${hexA(P.neon, 0.18)}`,
              fontFamily: FONT, fontWeight: 700, fontSize: 16 * k, color: "#FFFFFF", letterSpacing: "-0.02em", whiteSpace: "nowrap",
            }}>
              <Sparkle size={16 * k} rot={(t - p.t) * 90} />
              {p.text}
            </div>
          );
        })}
      </div>
      {L.toasts && <Toasts t={t} W={W} H={H} />}
    </div>
  );
}

/* =============================================================================
   Cena 4 — Automação: linha de processos, mão 3D, pedido arrastado (20–28s)
============================================================================= */
const NODES = [
  { label: "Compras", kind: "box" },
  { label: "Armazém", kind: "scanner" },
  { label: "Vendas", kind: "chart" },
  { label: "Logística", kind: "truck" },
];
const SEQ = [
  { kind: "alert", label: "Estoque baixo", t: 24.75, dx: -128 },
  { kind: "invoice", label: "NF-e emitida", t: 25.35, dx: 0 },
  { kind: "team", label: "Equipe atualizada", t: 25.95, dx: 128 },
];
const TEAM_CHECK = 26.5;
const BLINDS = 27.35; // persianas para a cena 5 (fecham em 28,15)
// trajetória da mão: [tempo, x, y] em coordenadas relativas ao centro (×k)
function handPath(t, cx, cy, k, W) {
  const sw = { x: cx + 128 * k, y: cy - 66 * k };
  const file = { x: cx + 112 * k, y: cy + 150 * k };
  const zone = { x: cx, y: cy + 40 * k };
  const KEYS = [
    [21.0, W + 50, cy + 250 * k],
    [21.85, sw.x, sw.y],
    [22.35, sw.x, sw.y],
    [22.95, file.x, file.y],
    [23.1, file.x, file.y],
    [23.9, zone.x, zone.y],
    [24.1, zone.x, zone.y],
    [24.65, W + 60, cy + 210 * k],
  ];
  if (t <= KEYS[0][0]) return { x: KEYS[0][1], y: KEYS[0][2], zone, file };
  for (let i = 0; i < KEYS.length - 1; i++) {
    const [t0, x0, y0] = KEYS[i];
    const [t1, x1, y1] = KEYS[i + 1];
    if (t <= t1) {
      const p = easeInOut(prog(t, t0, t1));
      const arc = x0 === x1 && y0 === y1 ? 0 : Math.sin(p * Math.PI) * 30 * k;
      return { x: lerp(x0, x1, p), y: lerp(y0, y1, p) - arc, zone, file };
    }
  }
  const last = KEYS[KEYS.length - 1];
  return { x: last[1], y: last[2], zone, file };
}
function Scene4({ t, W, H, L }) {
  const cx = W / 2;
  const { cy, k } = L;
  const settle = lerp(1.05, 1, easeOut(prog(t, 20.0, 21.2)));
  const flash = 1 - easeOut(prog(t, 20.0, 20.45));
  // linha de processos
  const ly = L.lineY;
  const xs = [0.14, 0.38, 0.62, 0.86].map((f) => f * W);
  const draw = easeInOut(prog(t, 20.35, 21.35));
  const lineEnd = lerp(xs[0], xs[3], draw);
  const travel = ((t - 21.35) / 1.6) % 1;
  // painel
  const pIn = spring(t - 20.55, { stiffness: 110, damping: 14 });
  const pOut = easeIn(prog(t, 24.4, 24.8));
  const pw = 340 * k;
  const ph = 206 * k;
  const pTop = cy - 100 * k;
  const on = spring(t - 22.12, { stiffness: 220, damping: 16 });
  const press = Math.max(...[[22.02, 22.3], [22.97, 23.98]].map(([a, b]) => (t < a || t > b + 0.12 ? 0 : t < a + 0.08 ? (t - a) / 0.08 : t <= b ? 1 : 1 - (t - b) / 0.12)));
  const hp = handPath(t, cx, cy, k, W);
  const dropS = spring(t - 24.0, { stiffness: 160, damping: 13 });
  const grabbed = t >= 23.0 && t < 24.0;
  const fileApp = spring(t - 21.55, { stiffness: 150, damping: 11 });
  let fx = hp.file.x;
  let fy = hp.file.y + Math.sin(t * 2.2) * 4 * k;
  if (t >= 23.0) {
    fx = hp.x - 14 * k;
    fy = hp.y + 6 * k;
  }
  const fileO = t < 24.0 ? clamp(fileApp * 2) : 1 - prog(t, 24.0, 24.15);
  const fileS = (t < 24.0 ? clamp(fileApp, 0, 1.2) : lerp(1, 0.4, prog(t, 24.0, 24.15))) * (grabbed ? 1.08 : 1);
  const ripple = t > 22.1 && t < 22.8 ? prog(t, 22.1, 22.8) : 0;
  return (
    <div style={layer(4, { background: BG_LIGHT })}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(0,36,80,.10) 1px, transparent 1.3px)", backgroundSize: "18px 18px", opacity: 0.8 }} />
      <Glow x={cx + 160} y={cy - 160} r={240} color={P.neon} a={0.18} />
      <Glow x={cx - 170} y={cy + 200} r={240} color={P.elec} a={0.12} />
      <div style={{ position: "absolute", inset: 0, transform: `scale(${settle})`, transformOrigin: `${cx}px ${cy}px` }}>
        {/* linha conectando os processos */}
        <div style={{ position: "absolute", left: xs[0], top: ly - 1.5, width: xs[3] - xs[0], height: 3, borderRadius: 3, background: "rgba(0,36,80,.08)" }} />
        <div style={{ position: "absolute", left: xs[0], top: ly - 1.5, width: lineEnd - xs[0], height: 3, borderRadius: 3, background: `linear-gradient(90deg, ${P.neonDeep}, ${P.elec})`, boxShadow: `0 0 12px ${hexA(P.neon, 0.7)}` }} />
        {draw > 0 && <div style={{ position: "absolute", left: lineEnd - 5, top: ly - 5, width: 10, height: 10, borderRadius: 10, background: "#FFFFFF", boxShadow: `0 0 12px 3px ${P.neon}`, opacity: 1 - prog(t, 21.3, 21.5) }} />}
        {t > 21.35 && <div style={{ position: "absolute", left: lerp(xs[0], xs[3], travel) - 4, top: ly - 4, width: 8, height: 8, borderRadius: 8, background: "#FFFFFF", boxShadow: `0 0 10px 3px ${P.neon}`, opacity: Math.sin(travel * Math.PI) }} />}
        {NODES.map((n, i) => {
          const s = spring(t - (20.35 + (i / 3) * 1.0), { stiffness: 220, damping: 12 });
          const sz = 50 * k;
          return (
            <div key={n.label} style={{ position: "absolute", left: xs[i] - sz / 2, top: ly - sz / 2, width: sz, zIndex: 5, opacity: clamp(s * 2), transform: `scale(${clamp(s, 0, 1.3)})` }}>
              <div style={{
                width: sz, height: sz, borderRadius: "50%", display: "grid", placeItems: "center", background: "rgba(255,255,255,.85)", border: "1px solid #fff",
                boxShadow: `0 10px 22px rgba(0,36,80,.14), 0 0 0 ${2 * clamp(s)}px ${hexA(P.neonDeep, 0.35)}`, backdropFilter: "blur(10px)",
              }}>
                <Icon3D kind={n.kind} size={30 * k} shadow={0.18} />
              </div>
              <div style={{ textAlign: "center", marginTop: 6 * k, marginLeft: -20, marginRight: -20, fontFamily: FONT, fontWeight: 700, fontSize: 11 * k, color: P.inkSoft }}>{n.label}</div>
            </div>
          );
        })}
        {/* painel de pedidos */}
        {pOut < 1 && t > 20.5 && (
          <div style={{
            position: "absolute", left: cx - pw / 2, top: pTop, width: pw, height: ph, zIndex: 10, borderRadius: 24 * k, boxSizing: "border-box", padding: 18 * k,
            opacity: clamp(pIn * 2) * (1 - pOut), transform: `translateY(${(1 - pIn) * 50 - pOut * 24}px) scale(${lerp(0.94, 1, clamp(pIn)) * lerp(1, 0.9, pOut)})`,
            filter: pOut > 0 ? `blur(${pOut * 8}px)` : "none",
            background: "linear-gradient(160deg, rgba(255,255,255,.95), rgba(255,255,255,.7))", border: "1px solid #fff", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
            boxShadow: "0 30px 60px rgba(0,36,80,.16), inset 0 1px 0 #fff", fontFamily: FONT,
          }}>
            <div style={{ fontWeight: 600, fontSize: 10.5 * k, color: P.inkSoft, letterSpacing: ".02em" }}>Pedidos de compra</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6 * k }}>
              <div style={{ fontWeight: 800, fontSize: 17 * k, letterSpacing: "-0.03em", color: P.ink }}>Reposição Automática</div>
              <div style={{ position: "relative", width: 50 * k, height: 28 * k, borderRadius: 99, background: on > 0.5 ? `linear-gradient(90deg, ${P.neonDeep}, #2FD4FF)` : "#D5DDE6", boxShadow: on > 0.5 ? `0 0 ${18 * clamp(on)}px ${hexA(P.neon, 0.7)}` : "inset 0 1px 3px rgba(0,0,0,.15)" }}>
                {ripple > 0 && <div style={{ position: "absolute", left: "50%", top: "50%", width: 30 * k, height: 30 * k, margin: -15 * k, borderRadius: "50%", border: `2px solid ${P.neon}`, transform: `scale(${1 + ripple * 2.5})`, opacity: 1 - ripple }} />}
                <div style={{ position: "absolute", top: 3 * k, left: lerp(3, 25, clamp(on, 0, 1.08)) * k, width: 22 * k, height: 22 * k, borderRadius: "50%", background: "#FFFFFF", boxShadow: "0 2px 6px rgba(0,0,0,.25)" }} />
              </div>
            </div>
            <div style={{ height: 1, background: "rgba(0,36,80,.08)", margin: `${14 * k}px 0` }} />
            <div style={{
              position: "relative", height: 92 * k, borderRadius: 16 * k, boxSizing: "border-box",
              border: dropS > 0 ? `1.5px solid ${hexA(P.neonDeep, 0.5)}` : `1.5px dashed rgba(0,36,80,${0.22 + (grabbed ? 0.2 * Math.sin(t * 10) ** 2 : 0)})`,
              background: dropS > 0 ? hexA(P.neon, 0.14 * clamp(dropS)) : grabbed ? "rgba(47,212,255,.06)" : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
            }}>
              {dropS <= 0 && <div style={{ fontWeight: 600, fontSize: 12.5 * k, color: P.inkSoft }}>Arraste o pedido aqui</div>}
              {dropS > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 12 * k, transform: `scale(${lerp(0.8, 1, clamp(dropS))})`, opacity: clamp(dropS * 2) }}>
                  <Icon3D kind="file" size={44 * k} shadow={0.15} />
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 15 * k, color: P.ink, letterSpacing: "-0.02em" }}>Pedido #4821 · 240 un.</div>
                    <div style={{ fontWeight: 600, fontSize: 11 * k, color: C.blue, marginTop: 2 * k }}>Enviado ao fornecedor</div>
                  </div>
                  <div style={{ transform: `scale(${clamp(spring(t - 24.15, { stiffness: 260, damping: 12 }), 0, 1.3)})` }}><Icon3D kind="check" size={28 * k} shadow={0.15} /></div>
                </div>
              )}
            </div>
          </div>
        )}
        {/* arquivo do pedido arrastado */}
        {fileO > 0 && t > 21.5 && (
          <div style={{ position: "absolute", left: fx - 32 * k, top: fy - 32 * k, zIndex: 60, opacity: fileO, transform: `scale(${fileS}) rotate(${grabbed ? Math.sin(prog(t, 23.1, 23.9) * Math.PI) * -10 : -6}deg)` }}>
            <Icon3D kind="file" size={64 * k} shadow={grabbed ? 0.35 : 0.22} />
          </div>
        )}
        {t > 20.9 && t < 24.8 && <Hand x={hp.x} y={hp.y} size={52 * k} press={press} />}
        {/* sequência: alerta → nota → equipe */}
        {t > 24.6 && SEQ.map((s, i) => {
          const sp = spring(t - s.t, { stiffness: 170, damping: 11 });
          if (sp <= 0) return null;
          const x = cx + s.dx * k;
          const sz = 84 * k;
          const pulse = s.kind === "alert" && t < 25.6 ? prog(t, 24.85, 25.6) : 0;
          const arrow = i > 0 ? easeOut(prog(t, s.t - 0.2, s.t + 0.05)) : 0;
          const checkS = s.kind === "team" ? spring(t - TEAM_CHECK, { stiffness: 260, damping: 12 }) : i < 2 ? spring(t - SEQ[i + 1].t - 0.15, { stiffness: 260, damping: 12 }) : 0;
          return (
            <React.Fragment key={s.kind}>
              {i > 0 && (
                <div style={{ position: "absolute", left: x - 128 * k + 46 * k, top: cy - 1.5, width: (128 - 92) * k * arrow, height: 3, borderRadius: 3, background: `linear-gradient(90deg, ${P.neonDeep}, ${P.elec})` }} />
              )}
              <div style={{ position: "absolute", left: x - sz / 2, top: cy - sz / 2, width: sz, height: sz, zIndex: 20, opacity: clamp(sp * 2), transform: `translateY(${(1 - clamp(sp)) * 30}px) scale(${clamp(sp, 0, 1.3)}) rotate(${(1 - clamp(sp)) * -25 + Math.sin(t * 1.8 + i) * 3}deg)` }}>
                {pulse > 0 && <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `2px solid ${TINT.amber[1]}`, transform: `scale(${1 + pulse * 0.9})`, opacity: 1 - pulse }} />}
                <Icon3D kind={s.kind} size={sz} shadow={0.25} />
                {checkS > 0 && <div style={{ position: "absolute", right: -6 * k, top: -6 * k, transform: `scale(${clamp(checkS, 0, 1.3)})` }}><Icon3D kind="check" size={30 * k} shadow={0.2} /></div>}
              </div>
              <div style={{
                position: "absolute", left: x - 70 * k, width: 140 * k, top: cy + sz / 2 + 14 * k, textAlign: "center", opacity: clamp((sp - 0.3) * 2),
                fontFamily: FONT, fontWeight: 700, fontSize: 12.5 * k, color: P.ink, letterSpacing: "-0.01em",
              }}>{s.label}</div>
            </React.Fragment>
          );
        })}
      </div>
      <TextBlock L={L}>
        <Words disp text="Zere as rupturas." t={t} t0={20.6} t1={27.2} size={27 * L.txt} color={P.ink} hl={[2]} hlBg={HL_LIGHT} />
        <div style={{ height: 8 * L.txt }} />
        <Words text="Automatize pedidos e acompanhe cada item em tempo real." t={t} t0={21.25} t1={27.25} size={19 * L.txt} weight={600} color={P.inkSoft} stagger={0.04} maxW={360} track="-0.015em" lh={1.25} />
      </TextBlock>
      <div style={{ position: "absolute", inset: 0, background: "#FFFFFF", opacity: flash, zIndex: 90, pointerEvents: "none" }} />
      {/* persianas: 6 faixas do fundo escuro da cena 5 descem/sobem alternadas, no ritmo */}
      {t > BLINDS && Array.from({ length: 6 }, (_, j) => {
        const p = expoInOut(prog(t, BLINDS + j * 0.05, BLINDS + 0.55 + j * 0.05));
        if (p <= 0) return null;
        const sw = W / 6;
        return (
          <div key={j} style={{
            position: "absolute", left: j * sw, top: 0, width: sw + 1, height: H, zIndex: 95, background: BG_DARK, backgroundSize: `${W}px ${H}px`, backgroundPosition: `${-j * sw}px 0`,
            transform: `translateY(${(1 - p) * (j % 2 ? H : -H)}px)`, boxShadow: p < 1 ? `0 0 30px ${hexA(C.cyan, 0.35)}` : "none",
          }} />
        );
      })}
    </div>
  );
}

/* =============================================================================
   Cena 5 — Cadeado → barras de crescimento → logo (28–35s)
============================================================================= */
const BAR_H = [70, 112, 160, 222];
function Scene5({ t, W, H, L }) {
  const cx = W / 2;
  const { k } = L;
  const cy = L.cy + 10 * k;
  const push = lerp(1, 1.06, easeInOut(prog(t, 28, 31.8)));
  const le = spring(t - 28.15, { stiffness: 120, damping: 12 });
  const cl = spring(t - 29.0, { stiffness: 420, damping: 18 });
  const sq = t > 29.05 ? Math.exp(-(t - 29.05) * 10) * Math.sin((t - 29.05) * 40) * 0.05 : 0;
  const mo = easeInOut(prog(t, 29.85, 30.35));
  const bw = 132;
  const bh = 106;
  const bottom = cy + 83 * k;
  const bodyTop = bottom - bh * k;
  const arrowP = easeOut(prog(t, 30.75, 31.25));
  const bars = [0, 1, 2, 3].map((j) => {
    const g = spring(t - 30.3 - j * 0.12, { stiffness: 110, damping: 11 });
    const w0 = bw / 4;
    const w1 = 36;
    const gap = lerp(0, 12, mo);
    const w = lerp(w0, w1, mo);
    const total = 4 * w + 3 * gap;
    const x = cx + (-total / 2 + j * (w + gap)) * k;
    const h = lerp(bh, BAR_H[j], g) * k;
    return { x, w: w * k, h, j };
  });
  const tips = bars.map((b) => [b.x + b.w / 2, bottom - b.h - 18 * k]);
  const shO = 1 - mo;
  return (
    <div style={layer(5, { background: BG_DARK })}>
      <Beam x={W * 0.85} y={H * 0.18} w={560} h={110} rot={28 + Math.sin(t * 0.5) * 3} color={C.blue} a={0.4} />
      <Beam x={W * 0.1} y={H * 0.85} w={480} h={90} rot={28} color={C.cyan} a={0.2} />
      <Glow x={cx} y={cy} r={260 * k} color={P.neon} a={0.12 + 0.1 * mo} />
      <Glow x={cx + 160} y={cy - 240 * k} r={200} color={P.elec} a={0.14} />
      <div style={{ position: "absolute", inset: 0, transform: `scale(${push})`, transformOrigin: `${cx}px ${cy}px` }}>
        {/* ondas de segurança */}
        {[0, 1, 2].map((j) => {
          const tw = t - (29.05 + j * 0.22);
          if (tw < 0 || tw > 1.4) return null;
          const r = (90 + tw * 190) * k;
          return <div key={j} style={{ position: "absolute", left: cx - r, top: cy + 20 * k - r, width: r * 2, height: r * 2, borderRadius: "50%", border: `2px solid ${P.neon}`, opacity: (1 - tw / 1.4) * 0.8, boxShadow: `0 0 18px ${hexA(P.neon, 0.5)}, inset 0 0 18px ${hexA(P.neon, 0.3)}` }} />;
        })}
        <div style={{ position: "absolute", inset: 0, opacity: clamp(le * 2), transform: `perspective(900px) rotateY(${lerp(-50, 0, clamp(le))}deg) scale(${lerp(0.5, 1, clamp(le, 0, 1.2)) * (1 + sq)}) translateY(${Math.sin(t * 1.5) * 4 * k * (1 - mo)}px)`, transformOrigin: `${cx}px ${cy}px` }}>
          {/* alça */}
          {shO > 0 && (
            <svg width={120 * k} height={110 * k} viewBox="0 0 120 110" style={{ position: "absolute", left: cx - 60 * k, top: bodyTop - 78 * k + lerp(-28, 0, clamp(cl, 0, 1.05)) * k - mo * 40 * k, opacity: shO, overflow: "visible" }}>
              <path d="M22 96 V52 Q22 14 60 14 Q98 14 98 52 V96" fill="none" stroke="#5D6B7E" strokeWidth="19" strokeLinecap="round" transform="translate(0 3)" />
              <path d="M22 96 V52 Q22 14 60 14 Q98 14 98 52 V96" fill="none" stroke="url(#iq-steel)" strokeWidth="17" strokeLinecap="round" />
            </svg>
          )}
          {bars.map((b) => {
            const R0 = [[24, 0, 0, 24], [0, 0, 0, 0], [0, 0, 0, 0], [0, 24, 24, 0]][b.j];
            const rad = R0.map((r) => `${lerp(r, 10, mo) * k}px`).join(" ");
            return (
              <div key={b.j} style={{
                position: "absolute", left: b.x, top: bottom - b.h, width: b.w + (mo < 0.05 ? 0.6 : 0), height: b.h, borderRadius: rad,
                background: mo > 0 ? `linear-gradient(180deg, ${mixColor("#7FDBFF", "#D8F6FF", mo)} 0%, #008ACC 60%, #00396F 100%)` : "linear-gradient(180deg, #5BF0A4 0%, #008ACC 60%, #00396F 100%)",
                boxShadow: `0 ${8 * k}px 0 #002450, 0 ${24 * k}px ${40 * k}px rgba(0,0,0,.45), inset 0 2px 0 rgba(255,255,255,.5)${mo > 0 ? `, 0 0 ${28 * mo}px ${hexA(P.neon, 0.55 * mo)}` : ""}`,
              }} />
            );
          })}
          {/* fechadura */}
          {mo < 1 && (
            <div style={{ position: "absolute", left: cx - 9 * k, top: bodyTop + 34 * k, opacity: 1 - prog(t, 29.85, 30.05) }}>
              <div style={{ width: 18 * k, height: 18 * k, borderRadius: "50%", background: "#001634" }} />
              <div style={{ width: 8 * k, height: 18 * k, margin: `${-4 * k}px auto 0`, borderRadius: 4 * k, background: "#001634" }} />
            </div>
          )}
          {/* seta de tendência */}
          {arrowP > 0 && (
            <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
              <path d={`M${tips.map((p) => p.join(" ")).join(" L")}`} fill="none" stroke="#FFFFFF" strokeWidth={4 * k} strokeLinecap="round" strokeLinejoin="round"
                pathLength="1" strokeDasharray="1" strokeDashoffset={1 - arrowP} style={{ filter: `drop-shadow(0 0 8px ${P.neon})` }} />
              {arrowP > 0.95 && (() => {
                const [x1, y1] = tips[3];
                const [x0, y0] = tips[2];
                const a = Math.atan2(y1 - y0, x1 - x0);
                const s = 14 * k;
                const p1 = [x1 - Math.cos(a - 0.5) * s, y1 - Math.sin(a - 0.5) * s];
                const p2 = [x1 - Math.cos(a + 0.5) * s, y1 - Math.sin(a + 0.5) * s];
                return <path d={`M${p1.join(" ")} L${x1} ${y1} L${p2.join(" ")}`} fill="none" stroke="#FFFFFF" strokeWidth={4 * k} strokeLinecap="round" strokeLinejoin="round" />;
              })()}
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}
const mixColor = (a, b, p) => {
  const h = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
  const A = h(a);
  const B = h(b);
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * p)).join(",")})`;
};

const WORDMARK = "Estoke ao Cubo";
const TAGLINE = "Transforme complexidade em controle.";
const TYPE = { w0: 32.45, wd: 0.055, g0: 33.35, gd: 0.032 };
const HL_FROM = TAGLINE.indexOf("controle");
const CTA = { rise: 34.6, btn: 34.85, tap: 36.1 };
function Typed({ text, n, style, caret, hlFrom = 99, hlColor }) {
  return (
    <div style={style}>
      {[...text].map((ch, i) => (
        <React.Fragment key={i}>
          <span style={{ opacity: i < n ? 1 : 0, color: i >= hlFrom ? hlColor : undefined }}>{ch}</span>
          {caret && i === n - 1 && <Caret />}
        </React.Fragment>
      ))}
      {caret && n === 0 && <Caret />}
    </div>
  );
}
function Caret() {
  return (
    <span style={{ position: "relative", display: "inline-block", width: 0 }}>
      <span style={{ position: "absolute", left: 2, top: "0.1em", width: "0.09em", minWidth: 2, height: "0.95em", borderRadius: 2, background: P.neonDeep, boxShadow: `0 0 8px ${P.neon}`, opacity: "var(--caret)" }} />
    </span>
  );
}
function Final({ t, W, H, L }) {
  const cx = W / 2;
  const { k } = L;
  const wp = expoInOut(prog(t, T.fin, T.fin + 0.45));
  const lg = spring(t - 32.05, { stiffness: 130, damping: 11 });
  const logoY = H * 0.4;
  const nW = clamp(Math.floor((t - TYPE.w0) / TYPE.wd) + 1, 0, WORDMARK.length);
  const nG = clamp(Math.floor((t - TYPE.g0) / TYPE.gd) + 1, 0, TAGLINE.length);
  const typingW = t >= TYPE.w0 - 0.2 && t < TYPE.g0;
  const typingG = t >= TYPE.g0;
  const doneG = t > TYPE.g0 + TAGLINE.length * TYPE.gd;
  const blink = doneG || t < TYPE.w0 ? (Math.floor(t * 2.2) % 2 === 0 ? 1 : 0) : 1;
  const ringT = t - 32.05;
  const drift = lerp(1.04, 1, easeOut(prog(t, 32, 37.5)));
  const up = easeInOut(prog(t, CTA.rise, CTA.rise + 0.55)) * 46 * k;
  const btn = spring(t - CTA.btn, { stiffness: 150, damping: 12 });
  const press = t < CTA.tap - 0.05 || t > CTA.tap + 0.3 ? 0 : t < CTA.tap + 0.05 ? (t - CTA.tap + 0.05) / 0.1 : 1 - (t - CTA.tap - 0.05) / 0.25;
  const tapT = t - CTA.tap;
  const btnY = logoY - up + 196 * k;
  const handIn = easeOut(prog(t, CTA.tap - 0.75, CTA.tap - 0.05));
  const handOut = easeIn(prog(t, CTA.tap + 0.45, CTA.tap + 0.9));
  const hx = lerp(W + 40, cx + 70 * k, handIn) + handOut * 140;
  const hy = lerp(btnY + 170 * k, btnY + 4 * k, handIn) + handOut * 120;
  return (
    <div style={layer(6, { background: BG_LIGHT, clipPath: `inset(${(1 - wp) * 100}% 0 0 0)`, "--caret": blink })}>
      <Glow x={cx - 150 + Math.sin(t * 0.5) * 20} y={logoY - 120} r={240} color={P.neon} a={0.25} />
      <Glow x={cx + 160} y={logoY + 220 * k} r={240} color={P.elec} a={0.18} />
      <div style={{ position: "absolute", inset: 0, transform: `scale(${drift}) translateY(${-up}px)`, transformOrigin: `${cx}px ${logoY}px` }}>
        {ringT > 0 && ringT < 1.2 && (() => {
          const r = (50 + easeOut(ringT / 1.2) * 110) * k;
          return <div style={{ position: "absolute", left: cx - r, top: logoY - r, width: r * 2, height: r * 2, borderRadius: "50%", border: `3px solid ${P.neon}`, opacity: 1 - ringT / 1.2, boxShadow: `0 0 20px ${hexA(P.neon, 0.6)}` }} />;
        })()}
        <div style={{ position: "absolute", left: cx, top: logoY, transform: `translate(-50%, -50%) scale(${clamp(lg, 0, 1.3)}) rotate(${(1 - clamp(lg)) * -30}deg)`, opacity: clamp(lg * 3) }}>
          <CubeLogo size={96 * k} glow={0.9} />
        </div>
        <Typed text={WORDMARK} n={nW} caret={typingW} style={{
          position: "absolute", left: 0, right: 0, top: logoY + 74 * k, textAlign: "center", ...DISP, fontSize: 30 * k, color: C.ink, whiteSpace: "pre",
        }} />
        <Typed text={TAGLINE} n={nG} caret={typingG} hlFrom={HL_FROM} hlColor={C.blue} style={{
          position: "absolute", left: 20, right: 20, top: logoY + 126 * k, textAlign: "center", fontFamily: FONT, fontWeight: 700, fontSize: 20 * L.txt,
          letterSpacing: "-0.025em", color: P.ink, whiteSpace: "pre",
        }} />
      </div>
      {/* chamada para ação: botão com brilho, tocado pela mão 3D */}
      {btn > 0 && (
        <div style={{
          position: "absolute", left: cx, top: btnY, zIndex: 10, opacity: clamp(btn * 2),
          transform: `translate(-50%, -50%) scale(${clamp(btn, 0, 1.25) * (1 - press * 0.06)})`,
          display: "flex", alignItems: "center", gap: 10 * k, height: 50 * k, padding: `0 ${26 * k}px`, borderRadius: 99, overflow: "hidden",
          background: GRAD, color: "#FFFFFF", fontFamily: FONT, fontWeight: 800, fontSize: 16 * L.txt, letterSpacing: "-0.02em", whiteSpace: "nowrap",
          boxShadow: `0 ${16 * k}px ${34 * k}px ${hexA(C.blue, 0.38)}, inset 0 1px 0 rgba(255,255,255,.35), 0 0 ${tapT > 0 && tapT < 1 ? 40 * (1 - tapT) : 0}px ${hexA(C.cyan, 0.8)}`,
        }}>
          Agende uma demonstração
          <svg width={16 * k} height={16 * k} viewBox="0 0 16 16"><path d="M3 8 H12 M8.5 4 L12.5 8 L8.5 12" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <div style={{ position: "absolute", top: -20, bottom: -20, width: 46 * k, left: `${lerp(-20, 120, ((t - CTA.btn) % 1.8) / 1.8)}%`, transform: "rotate(20deg)", background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,.55), rgba(255,255,255,0))" }} />
        </div>
      )}
      {tapT > 0 && tapT < 0.8 && (() => {
        const r = (20 + easeOut(tapT / 0.8) * 120) * k;
        return <div style={{ position: "absolute", left: cx + 70 * k - r, top: btnY - r, width: r * 2, height: r * 2, borderRadius: "50%", zIndex: 9, border: `2px solid ${C.cyan}`, opacity: 1 - tapT / 0.8 }} />;
      })()}
      {handIn > 0 && handOut < 1 && <Hand x={hx} y={hy} size={52 * k} press={press} />}
    </div>
  );
}

/* =============================================================================
   Gancho (0–2s, antes da cena 1): a dor em número, para segurar quem está rolando o feed
============================================================================= */
const LOSS = 18240;
function Hook({ t, W, H, L }) {
  const cx = W / 2;
  const { cy, k } = L;
  const out = easeIn(prog(t, 1.62, 2.0));
  const ic = spring(t - 0.05, { stiffness: 200, damping: 11 });
  const cnt = Math.round(LOSS * easeOut(prog(t, 0.3, 1.45)));
  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 30, opacity: 1 - out, transform: `scale(${1 + out * 0.25})`, transformOrigin: `${cx}px ${cy}px`,
      filter: out > 0 ? `blur(${out * 10}px)` : "none",
    }}>
      <Glow x={cx} y={cy - 40 * k} r={230 * k} color={TINT.amber[1]} a={0.16 + 0.06 * Math.sin(t * 14)} />
      {[0, 1].map((j) => {
        const tw = t - 0.15 - j * 0.35;
        if (tw < 0 || tw > 0.9) return null;
        const r = (50 + tw * 150) * k;
        return <div key={j} style={{ position: "absolute", left: cx - r, top: cy - 90 * k - r, width: r * 2, height: r * 2, borderRadius: "50%", border: `2px solid ${TINT.amber[1]}`, opacity: (1 - tw / 0.9) * 0.7 }} />;
      })}
      <div style={{ position: "absolute", left: cx, top: cy - 90 * k, transform: `translate(-50%, -50%) scale(${clamp(ic, 0, 1.3)}) rotate(${Math.sin(t * 18) * 4 * (1 - prog(t, 0.2, 1.2))}deg)` }}>
        <Icon3D kind="alert" size={92 * k} shadow={0.4} />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: cy + 10 * k, textAlign: "center", opacity: clamp((t - 0.25) * 5) }}>
        <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 52 * k, letterSpacing: "-0.045em", color: "#FFFFFF", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
          <span style={{ color: TINT.amber[1] }}>−</span>R$ {cnt.toLocaleString("pt-BR")}
        </div>
        <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 13 * k, color: "rgba(234,244,252,.65)", marginTop: 8 * k }}>em vendas perdidas por falta de estoque</div>
      </div>
      <TextBlock L={L}>
        <Words disp text="Cada ruptura é uma venda perdida." t={t} t0={0.15} size={25 * L.txt} color="#EAF4FC" hl={[3, 4]} hlBg={`linear-gradient(90deg, ${TINT.amber[0]}, ${TINT.amber[1]})`} stagger={0.07} />
      </TextBlock>
    </div>
  );
}

function FullFrame({ t: tg, format = "9x16" }) {
  const F = FORMATS[format];
  const L = LAYOUTS[format];
  const t = tg - HOOK;
  const p = { t, W: F.w, H: F.h, L };
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: C.night, fontFamily: FONT }}>
      <IconDefs />
      {t < 5.3 && <Scene1 {...p} />}
      {tg < 2.05 && <Hook {...p} t={tg} />}
      {t >= 4.3 && t < 12.0 && <Scene2 {...p} />}
      <RingOverlay {...p} />
      <CubeOverlay {...p} />
      {t >= 12.0 && t < 20.0 && <Scene3 {...p} />}
      {t >= 20.0 && t < 28.2 && <Scene4 {...p} />}
      {t >= 28.15 && t < 32.1 && <Scene5 {...p} />}
      {t >= T.fin && <Final {...p} />}
      <Grain t={tg} opacity={0.07} />
    </div>
  );
}

/* =============================================================================
   Som — 120 BPM, I–V–vi–IV em Dó. Pad ambiente no caos, batida entra no portal,
   arpejo nas cenas de produto, pausa no cadeado e acorde final com a logo.
   Cada movimento importante tem o seu efeito (pop, swipe, tique, clique, clack).
============================================================================= */
// Assinatura sonora do cubo: "plim" de vidro (sino + harmônico agudo + brilho), sempre que o cubo aparece
function cubeChime(A, w, v = 1) {
  [84, 91, 96].forEach((n, i) => tone(A, w + i * 0.025, { f: midi(n), dur: 1.6 - i * 0.3, v: (0.08 - i * 0.02) * v, send: 0.7, pan: i - 1 }));
  tone(A, w, { type: "triangle", f: midi(108), dur: 0.25, v: 0.02 * v, send: 0.5 });
  SND.shimmer(A, w + 0.04, 0.6 * v);
}
function buildEvents() {
  const ev = [];
  const add = (t, fn) => ev.push({ t, fn });
  const B = 0.5;
  const CH = [
    { b: 36, n: [48, 52, 55, 59] },
    { b: 43, n: [47, 50, 55, 59] },
    { b: 45, n: [45, 48, 52, 55] },
    { b: 41, n: [45, 48, 52, 53] },
  ];
  const chordAt = (tt) => CH[Math.floor(tt / 2) % 4];
  for (let tb = 0; tb < 32; tb += 2) {
    const ch = chordAt(tb);
    const v = tb < 4 ? 1.9 : tb >= 28 ? 2.3 : 1.3;
    add(tb, (A, w) => SND.pad(A, w, ch.n, 2.1, tb < 4 ? 1100 : 1900, v));
  }
  const quiet = [[11.2, 12.0], [19.3, 20.0], [27.45, 28.0]];
  const isQuiet = (tt) => quiet.some(([a, b]) => tt >= a && tt < b);
  let k = 0;
  for (let tb = 5.0; tb < 28; tb += B, k++) {
    if (isQuiet(tb)) continue;
    const ch = chordAt(tb);
    add(tb, (A, w) => SND.kick(A, w, 0.75));
    if (tb % 1 === 0.5) add(tb, (A, w) => SND.clap(A, w, 0.65));
    add(tb + B / 2, (A, w) => SND.hat(A, w, 0.7, 0.25));
    if (tb >= 12) add(tb + B / 4, (A, w) => SND.hat(A, w, 0.3, -0.3));
    add(tb, (A, w) => SND.bass(A, w, ch.b, B * 0.45, 0.9));
    add(tb + B * 0.75, (A, w) => SND.bass(A, w, ch.b + 12, B * 0.2, 0.5));
    if (tb >= 12) {
      const arp = [0, 1, 2, 3, 2, 1];
      [0, B / 2].forEach((o, j) => {
        const n = ch.n[arp[(k * 2 + j) % arp.length]] + 24;
        add(tb + o, (A, w) => SND.pluck(A, w, n, 0.55, j ? 0.35 : -0.35));
      });
    }
  }
  const click = (A, w, v = 1) => {
    hiss(A, w, { type: "highpass", f: 3500, dur: 0.018, v: 0.28 * v });
    tone(A, w, { type: "square", f: 2200, dur: 0.015, v: 0.04 * v });
  };
  const riser = (t0, dur, v = 0.13) => add(t0, (A, w) => {
    hiss(A, w, { f: 400, f2: 7000, q: 1.2, dur, v, shape: "rise", send: 0.3 });
    tone(A, w, { f: 180, f2: 900, glide: dur, dur, a: dur * 0.85, v: 0.04, send: 0.4 });
  });
  const hit = (t0, v = 1) => add(t0, (A, w) => {
    SND.kick(A, w, 1.05 * v);
    tone(A, w, { f: 70, f2: 34, glide: 0.5, dur: 1.2, v: 0.45 * v, send: 0.2 });
    hiss(A, w, { type: "highpass", f: 6000, dur: 0.9, v: 0.06 * v, send: 0.4 });
    SND.shimmer(A, w, 0.8 * v);
  });

  // Cena 1: ar, ícones surgindo, sucção e nascimento do anel
  add(0, (A, w) => hiss(A, w, { type: "lowpass", f: 900, dur: 3.2, v: 0.05, shape: "swell", send: 0.4 }));
  CHAOS.forEach((c, i) => add(0.2 + c.d, (A, w) => SND.pop(A, w, 420 + i * 45, 0.05)));
  riser(2.6, 1.12, 0.14);
  hit(3.74, 1);
  add(3.76, (A, w) => cubeChime(A, w));
  add(4.45, (A, w) => SND.whoosh(A, w, { dur: 0.75, from: 200, to: 6000, v: 0.26, pan: 0, panTo: 0 }));
  // Cena 2: cartões saindo do anel e giros do carrossel
  add(5.05, (A, w) => cubeChime(A, w, 0.5));
  MODULES.forEach((_, i) => add(5.12 + i * 0.1, (A, w) => SND.pluck(A, w, [72, 76, 79, 84][i], 1.1, i / 1.5 - 1)));
  STEPS.forEach((s, i) => {
    add(s, (A, w) => { SND.swipe(A, w, 1.2); SND.tick(A, w, 2600, 1); });
    add(s + 0.22, (A, w) => SND.pop(A, w, [660, 740, 880][i], 0.12));
  });
  riser(11.2, 0.8, 0.15);
  // Cena 3: monitor, card flutuante, contador, palavras-chave
  hit(12.0, 0.85);
  add(12.02, (A, w) => SND.whoosh(A, w, { dur: 0.9, from: 6000, to: 300, v: 0.18, pan: 0.4, panTo: -0.4 }));
  add(13.0, (A, w) => SND.pop(A, w, 520, 0.08));
  add(14.3, (A, w) => { SND.pop(A, w, 700, 0.16); SND.shimmer(A, w, 0.55); SND.whoosh(A, w, { dur: 0.45, from: 600, to: 4000, v: 0.12 }); });
  for (let tt = 15.0, i = 0; tt < 18.4; tt += 0.075 + i * 0.0012, i++) add(tt, (A, w) => SND.tick(A, w, 2400 + i * 30, 0.8));
  add(15.0, (A, w) => tone(A, w, { f: 300, f2: 900, glide: 3.4, dur: 3.4, a: 1.6, v: 0.025, send: 0.4 }));
  PILLS.forEach((p, i) => add(p.t, (A, w) => { SND.bell(A, w, [84, 88, 91][i], 1, [-0.5, 0.5, -0.2][i]); SND.pop(A, w, 900 + i * 120, 0.08); }));
  riser(19.3, 0.7, 0.15);
  // Cena 4: linha, mão, pedido, sequência
  add(20.0, (A, w) => { SND.kick(A, w, 0.9); hiss(A, w, { type: "highpass", f: 5000, dur: 0.7, v: 0.08, send: 0.5 }); SND.bell(A, w, 84, 0.9); });
  add(20.35, (A, w) => hiss(A, w, { f: 800, f2: 5000, q: 1.5, dur: 1.0, v: 0.06, shape: "swell", pan: -0.6, panTo: 0.6 }));
  NODES.forEach((_, i) => add(20.35 + (i / 3) * 1.0, (A, w) => SND.pop(A, w, [520, 620, 740, 880][i], 0.13)));
  add(20.55, (A, w) => SND.swipe(A, w, 0.8));
  add(21.0, (A, w) => SND.swipe(A, w, 0.5));
  add(21.55, (A, w) => SND.pop(A, w, 600, 0.1));
  add(22.04, (A, w) => click(A, w));
  add(22.12, (A, w) => { tone(A, w, { type: "triangle", f: 880, f2: 1320, glide: 0.08, dur: 0.14, v: 0.08 }); SND.pop(A, w, 980, 0.1); });
  add(22.99, (A, w) => click(A, w, 0.7));
  add(23.1, (A, w) => SND.whoosh(A, w, { dur: 0.7, from: 400, to: 2400, v: 0.1, pan: 0.5, panTo: -0.2 }));
  add(24.0, (A, w) => { tone(A, w, { f: 170, f2: 70, glide: 0.15, dur: 0.22, v: 0.35 }); click(A, w, 0.6); });
  add(24.06, (A, w) => SND.bell(A, w, 79, 1));
  add(24.16, (A, w) => SND.bell(A, w, 84, 1));
  add(24.42, (A, w) => SND.swipe(A, w, 0.9));
  [24.75, 24.9].forEach((tt) => add(tt, (A, w) => tone(A, w, { type: "square", f: 988, dur: 0.09, v: 0.045, lp: 2600 })));
  add(24.75, (A, w) => SND.pop(A, w, 560, 0.12));
  add(25.15, (A, w) => SND.tick(A, w, 3200, 1));
  add(25.35, (A, w) => { hiss(A, w, { f: 3000, q: 1.5, dur: 0.18, v: 0.08, shape: "swell" }); SND.pop(A, w, 700, 0.12); });
  add(25.75, (A, w) => SND.tick(A, w, 3400, 1));
  add(25.95, (A, w) => [76, 79, 83].forEach((n, i) => SND.bell(A, w + i * 0.03, n, 0.9, i - 1)));
  add(TEAM_CHECK, (A, w) => { SND.pluck(A, w, 84, 1.2); SND.pluck(A, w + 0.07, 88, 1.2); });
  riser(27.2, 0.6, 0.12);
  // persianas: um "swipe" curto por faixa, alternando os lados
  for (let j = 0; j < 6; j++) add(BLINDS + 0.2 + j * 0.05, (A, w) => hiss(A, w, { type: "highpass", f: 2500, f2: 6000, dur: 0.12, v: 0.06, shape: "swell", pan: j / 2.5 - 1 }));
  add(BLINDS + 0.55, (A, w) => SND.kick(A, w, 0.7));
  // Cena 5: cadeado, ondas, barras
  add(28.05, (A, w) => tone(A, w, { f: 60, f2: 40, glide: 0.8, dur: 1.2, v: 0.4, send: 0.3 }));
  add(28.15, (A, w) => SND.whoosh(A, w, { dur: 0.5, from: 2000, to: 400, v: 0.12, pan: -0.4, panTo: 0 }));
  add(29.0, (A, w) => {
    hiss(A, w, { type: "highpass", f: 4000, dur: 0.03, v: 0.38 });
    tone(A, w, { type: "square", f: 1600, dur: 0.02, v: 0.07 });
    tone(A, w, { f: 240, f2: 110, glide: 0.1, dur: 0.18, v: 0.42 });
    tone(A, w + 0.005, { type: "triangle", f: 1250, dur: 0.3, v: 0.04, send: 0.4 });
  });
  [0, 1, 2].forEach((j) => add(29.05 + j * 0.22, (A, w) => tone(A, w, { f: 150 - j * 15, f2: 90, glide: 0.6, dur: 0.75, v: 0.22 - j * 0.04, send: 0.55 })));
  add(29.85, (A, w) => { SND.swipe(A, w, 1); tone(A, w, { f: 300, f2: 700, glide: 0.4, dur: 0.45, a: 0.3, v: 0.04, send: 0.3 }); });
  [67, 72, 76, 79].forEach((n, j) => add(30.3 + j * 0.12, (A, w) => { SND.pluck(A, w, n + 12, 1.3, j / 1.5 - 1); SND.pop(A, w, 500 + j * 120, 0.08); }));
  add(30.75, (A, w) => SND.bell(A, w, 91, 1));
  riser(31.1, 0.55, 0.15);
  // Final: corte claro, logo, digitação
  add(T.fin, (A, w) => SND.whoosh(A, w, { dur: 0.5, from: 300, to: 6000, v: 0.18, pan: 0, panTo: 0 }));
  hit(32.05, 1.1);
  add(32.05, (A, w) => { SND.pad(A, w, [48, 52, 55, 59, 62], 5.4, 2600, 2.6); SND.sub(A, w, 36, 1.6, 1); cubeChime(A, w); });
  [...WORDMARK].forEach((ch, i) => {
    if (ch !== " ") add(TYPE.w0 + i * TYPE.wd, (A, w) => { hiss(A, w, { type: "highpass", f: 5000, dur: 0.02, v: 0.09 }); tone(A, w, { type: "square", f: 1700 + (i % 4) * 140, dur: 0.008, v: 0.02 }); });
  });
  [...TAGLINE].forEach((ch, i) => {
    if (ch !== " ") add(TYPE.g0 + i * TYPE.gd, (A, w) => hiss(A, w, { type: "highpass", f: 5500, dur: 0.016, v: 0.06, pan: (i % 5) / 5 - 0.4 }));
  });
  add(34.5, (A, w) => { SND.bell(A, w, 79, 0.8, -0.3); SND.bell(A, w + 0.08, 84, 0.8, 0.3); });
  // CTA: botão sobe, mão entra, toque e confirmação
  add(CTA.rise, (A, w) => SND.swipe(A, w, 0.7));
  add(CTA.btn, (A, w) => SND.pop(A, w, 640, 0.16));
  add(CTA.tap - 0.75, (A, w) => SND.whoosh(A, w, { dur: 0.6, from: 600, to: 2500, v: 0.08, pan: 0.6, panTo: 0.1 }));
  add(CTA.tap, (A, w) => { click(A, w); SND.kick(A, w, 0.6); });
  add(CTA.tap + 0.04, (A, w) => [79, 84, 88, 91].forEach((n, i) => SND.bell(A, w + i * 0.05, n, 0.8, i / 1.5 - 1)));
  add(CTA.tap + 0.05, (A, w) => SND.shimmer(A, w, 0.7));
  // tudo acima é tempo local; o gancho vem antes
  const out = ev.map((e) => ({ t: e.t + HOOK, fn: e.fn }));
  const addG = (t, fn) => out.push({ t, fn });
  addG(0, (A, w) => { tone(A, w, { f: 58, f2: 46, glide: 2, dur: 2.1, a: 0.25, v: 0.3, send: 0.3 }); hiss(A, w, { type: "lowpass", f: 600, dur: 2, v: 0.05, shape: "swell" }); SND.kick(A, w, 0.9); });
  [0.15, 0.32, 0.5, 0.67].forEach((tt, i) => addG(tt, (A, w) => tone(A, w, { type: "square", f: i % 2 ? 784 : 988, dur: 0.09, v: 0.04, lp: 2600, pan: i % 2 ? 0.3 : -0.3 })));
  for (let tt = 0.3, i = 0; tt < 1.45; tt += 0.05 + i * 0.002, i++) addG(tt, (A, w) => SND.tick(A, w, 3200 - i * 40, 0.8));
  addG(0.2, (A, w) => SND.clap(A, w, 0.5));
  // tensão contínua: pulso grave tipo batimento + riser até a virada para o caos
  [0, 0.5, 1.0, 1.25, 1.5].forEach((tt, i) => addG(tt, (A, w) => { SND.kick(A, w, 0.55 + i * 0.08); SND.sub(A, w, 31, 0.35, 0.9); }));
  addG(0.6, (A, w) => { hiss(A, w, { f: 300, f2: 5000, q: 1.2, dur: 1.0, v: 0.14, shape: "rise", send: 0.3 }); tone(A, w, { type: "sawtooth", f: 110, f2: 330, glide: 1.0, dur: 1.0, a: 0.9, v: 0.035, lp: 1400 }); });
  addG(1.45, (A, w) => tone(A, w, { f: 300, f2: 110, glide: 0.4, dur: 0.5, v: 0.12 }));
  addG(1.6, (A, w) => SND.whoosh(A, w, { dur: 0.5, from: 4000, to: 300, v: 0.16, pan: 0, panTo: 0 }));
  return out.sort((a, b) => a.t - b.t);
}
const FULL_EVENTS = buildEvents();
const FULL_SCENES = [
  { name: "Gancho", from: 0 },
  { name: "Caos → cubo", from: HOOK },
  { name: "Módulos", from: HOOK + T.s2 },
  { name: "Dashboard", from: HOOK + T.s3 },
  { name: "Automação", from: HOOK + T.s4 },
  { name: "Segurança", from: HOOK + T.s5 },
  { name: "Logo + CTA", from: HOOK + T.fin },
];

/* ---------- Variante: completo ou corte curto (trechos da timeline completa) ---------- */
const SEGS = VARIANT.segments;
const OFFS = SEGS ? SEGS.reduce((acc, sg) => [...acc, acc[acc.length - 1] + sg.to - sg.from], [0]) : null;
const DURATION = SEGS ? OFFS[OFFS.length - 1] : FULL_DURATION;
const mapTime = (u) => {
  for (let i = 0; i < SEGS.length; i++) if (u < OFFS[i + 1]) return SEGS[i].from + (u - OFFS[i]);
  return SEGS[SEGS.length - 1].to;
};
const Frame = SEGS ? ({ t, format }) => <FullFrame t={mapTime(Math.min(t, DURATION - 1e-4))} format={format} /> : FullFrame;
const EVENTS = SEGS
  ? SEGS.flatMap((sg, i) => FULL_EVENTS.filter((e) => e.t >= sg.from && e.t < sg.to).map((e) => ({ t: OFFS[i] + e.t - sg.from, fn: e.fn })))
  : FULL_EVENTS;
const SCENES = SEGS ? SEGS.map((sg, i) => ({ name: sg.name, from: OFFS[i] })) : FULL_SCENES;
// No corte, a trilha é a da versão completa recortada nos mesmos trechos (com micro-fades
// de 6ms nas emendas), para notas e reverbs que atravessam o corte soarem inteiros.
async function renderWav() {
  const full = await renderEventsWav(FULL_EVENTS, FULL_DURATION);
  if (!SEGS) return full;
  const bin = atob(full);
  const src = new Int16Array(new Uint8Array([...bin].map((c) => c.charCodeAt(0))).buffer, 44);
  const SR = 48000;
  const fade = Math.round(SR * 0.006);
  const parts = SEGS.map((sg) => src.slice(Math.round(sg.from * SR) * 2, Math.round(sg.to * SR) * 2));
  const n = parts.reduce((a, p) => a + p.length, 0);
  const out = new Int16Array(n);
  let o = 0;
  parts.forEach((p) => {
    const frames = p.length / 2;
    for (let f = 0; f < frames; f++) {
      const g = Math.min(1, f / fade, (frames - 1 - f) / fade);
      out[o + f * 2] = p[f * 2] * g;
      out[o + f * 2 + 1] = p[f * 2 + 1] * g;
    }
    o += p.length;
  });
  const hdr = new DataView(new ArrayBuffer(44));
  const str = (off, x) => [...x].forEach((ch, i) => hdr.setUint8(off + i, ch.charCodeAt(0)));
  str(0, "RIFF"); hdr.setUint32(4, 36 + n * 2, true); str(8, "WAVE"); str(12, "fmt ");
  hdr.setUint32(16, 16, true); hdr.setUint16(20, 1, true); hdr.setUint16(22, 2, true); hdr.setUint32(24, SR, true);
  hdr.setUint32(28, SR * 4, true); hdr.setUint16(32, 4, true); hdr.setUint16(34, 16, true); str(36, "data"); hdr.setUint32(40, n * 2, true);
  const bytes = new Uint8Array(44 + n * 2);
  bytes.set(new Uint8Array(hdr.buffer), 0);
  bytes.set(new Uint8Array(out.buffer), 44);
  let b = "";
  for (let i = 0; i < bytes.length; i += 0x8000) b += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(b);
}

// Usado pelo exportador de vídeo (scripts/export-video.cjs)
const MOTION = { Frame, duration: DURATION, formats: FORMATS, renderWav };

export default function InventorySaaS() {
  return (
    <MotionPlayer Frame={Frame} duration={DURATION} events={EVENTS} formats={FORMATS} defaultFormat="9x16" renderWav={renderWav}
      fontsToLoad={[`800 16px "Open Sauce Sans"`]} scenes={SCENES} />
  );
}
