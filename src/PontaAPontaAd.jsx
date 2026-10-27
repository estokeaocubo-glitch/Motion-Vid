import React from "react";
import { FONT, C, clamp, lerp, prog, spring, easeInOut, Grain, renderEventsWav, MotionPlayer, Wordmark } from "./motionKit";
import { VO_PONTA } from "./audio/voPonta";
import { DIZZY_TEE } from "./pontaAPonta/dizzyTee";
import { SFX, SFX_PEAK } from "./audio/sfx";

/* =============================================================================
   Estoke ao Cubo — "Controle de ponta a ponta" (9:16, 24s, sistemas sob medida)
   Promo de produto no estilo UI/UX minimalista: fundo off-white com esferas de degradê que
   flutuam e entram/saem pelas bordas, tipografia cinética (fade + blur que se dissipa) e cards
   de interface que entram com a curva cubic-bezier(0.22, 1, 0.36, 1), sem quique.
   A jornada segue a narração ("provocativo", ElevenLabs, 21,4s): produção → estoque e caixa
   integrados → venda no celular do cliente → CTA (siga e receba uma versão de testes).
============================================================================= */
const DURATION = 24.0;
const FORMATS = { "9x16": { w: 450, h: 800, label: "9:16" } };
const VO_AT = 0.4; // a narração entra 0,4s depois do primeiro quadro (as esferas abrem antes)
const VO_LEN = 21.39;
const T = { open: 0, prod: 6.0, click: 7.0, done: 8.85, words: 9.6, align: 11.3, stock: 12.1, phone: 14.9, tap: 16.1, approved: 16.35, cta: 18.6, merge: 19.35, final: 19.75, logo: 20.4, teste: 20.45 };

/* ---------- curva da marca: cubic-bezier(0.22, 1, 0.36, 1) ---------- */
function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const X = (s) => ((ax * s + bx) * s + cx) * s;
  const Y = (s) => ((ay * s + by) * s + cy) * s;
  const dX = (s) => (3 * ax * s + 2 * bx) * s + cx;
  return (p) => {
    p = clamp(p);
    let s = p;
    for (let i = 0; i < 8; i++) {
      const d = dX(s);
      if (Math.abs(d) < 1e-6) break;
      s = clamp(s - (X(s) - p) / d);
    }
    return Y(s);
  };
}
const EASE = bezier(0.22, 1, 0.36, 1);
const ein = (t, at, d = 0.7) => EASE(prog(t, at, at + d));
const eout = (t, at, d = 0.35) => easeInOut(prog(t, at, at + d));
// mola amortecida (sem quique): só para pops pequenos
const soft = (t, at) => clamp(spring(t - at, { stiffness: 170, damping: 26 }), 0, 1);

const GREEN = "#22C55E";
// degradê da marca no texto (vai no próprio span que tem filtro/transform, senão o recorte some)
const GRAD_TEXT = { background: `linear-gradient(95deg, ${C.deep}, ${C.blue} 45%, ${C.cyan})`, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" };
const INK = C.ink;
const MUTED = "#5B6B84";

/* ---------- fundo: off-white com esferas de degradê ---------- */
const BLOBS = [
  { c1: C.cyan, c2: "rgba(47,212,255,0)", r: 300, x: 0.15, y: 0.18, ax: 60, ay: 40, sp: 0.23, ph: 0 },
  { c1: C.blue, c2: "rgba(0,138,204,0)", r: 340, x: 0.9, y: 0.42, ax: 50, ay: 70, sp: 0.19, ph: 1.7 },
  { c1: "#9FD8FF", c2: "rgba(159,216,255,0)", r: 280, x: 0.25, y: 0.82, ax: 70, ay: 40, sp: 0.21, ph: 3.1 },
  { c1: "#7C8CFF", c2: "rgba(124,140,255,0)", r: 220, x: 0.75, y: 0.95, ax: 40, ay: 30, sp: 0.27, ph: 4.4 },
];
// esferas de vidro nítidas, com sombra, que atravessam a tela e saem pelas bordas
const ORBS = [
  { r: 58, from: [-80, 150], to: [520, 90], a: 0.0, d: 15 },
  { r: 34, from: [520, 610], to: [-60, 700], a: 1.5, d: 13 },
  { r: 46, from: [380, 860], to: [470, -80], a: 7.0, d: 16 },
  { r: 26, from: [-50, 420], to: [480, 300], a: 12.5, d: 11 },
  { r: 52, from: [500, 690], to: [-90, 780], a: 17.0, d: 12 },
];

function Background({ t, W, H }) {
  // as esferas "abrem" do centro nos primeiros 1,4s
  const open = ein(t, 0, 1.4);
  return (
    <div style={{ position: "absolute", inset: 0, background: "#F6F8FC", overflow: "hidden" }}>
      {BLOBS.map((b, i) => {
        const bx = lerp(W / 2, b.x * W, open) + Math.sin(t * b.sp * 2 + b.ph) * b.ax;
        const by = lerp(H / 2, b.y * H, open) + Math.cos(t * b.sp * 1.6 + b.ph) * b.ay;
        const r = b.r * lerp(0.35, 1, open) * (1 + 0.06 * Math.sin(t * 0.7 + b.ph));
        return <div key={i} style={{ position: "absolute", left: bx - r, top: by - r, width: r * 2, height: r * 2, borderRadius: "50%", background: `radial-gradient(circle at 50% 50%, ${b.c1} 0%, ${b.c2} 68%)`, opacity: 0.42 * open, filter: "blur(28px)" }} />;
      })}
      {ORBS.map((o, i) => {
        const p = (t - o.a) / o.d;
        if (p < 0 || p > 1) return null;
        const e = easeInOut(p);
        const x = lerp(o.from[0], o.to[0], e), y = lerp(o.from[1], o.to[1], e) + Math.sin(t * 1.3 + i) * 10;
        return (
          <div key={i} style={{ position: "absolute", left: x - o.r, top: y - o.r, width: o.r * 2, height: o.r * 2, borderRadius: "50%", overflow: "hidden",
            // vidro: só uma luz passando, sem borda; desfoca levemente o que está atrás
            background: "radial-gradient(circle at 32% 26%, rgba(255,255,255,.22) 0%, rgba(255,255,255,.03) 45%, rgba(47,212,255,.04) 75%, rgba(255,255,255,.1) 100%)",
            backdropFilter: "blur(4px) saturate(140%) brightness(1.05)", WebkitBackdropFilter: "blur(4px) saturate(140%) brightness(1.05)",
            boxShadow: `inset 0 0 ${o.r * 0.35}px rgba(255,255,255,.22)`, opacity: 0.75 }}>
            <div style={{ position: "absolute", left: "16%", top: "10%", width: "42%", height: "26%", borderRadius: "50%", background: "radial-gradient(closest-side, rgba(255,255,255,.55), rgba(255,255,255,0))", transform: "rotate(-28deg)" }} />
            <div style={{ position: "absolute", left: "22%", bottom: "6%", width: "60%", height: "20%", borderRadius: "50%", background: "radial-gradient(closest-side, rgba(143,227,255,.3), rgba(143,227,255,0))" }} />
          </div>
        );
      })}
      {/* véu claro no centro para o texto respirar */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(60% 40% at 50% 45%, rgba(246,248,252,.75), rgba(246,248,252,0) 75%)" }} />
    </div>
  );
}

/* ---------- tipografia cinética ---------- */
function KWord({ t, at, out, y, size = 40, weight = 800, color = INK, dx = 0, dy = 18, grad, align = "center", x = 0, children, style }) {
  if (t < at - 0.01) return null;
  const p = ein(t, at, 0.75);
  const o = out != null ? eout(t, out, 0.35) : 0;
  if (o >= 1) return null;
  const blur = (1 - p) * 10 + o * 10;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: y, textAlign: align, padding: "0 34px", fontFamily: FONT, fontWeight: weight, fontSize: size, lineHeight: 1.08, letterSpacing: "-0.035em", color,
      opacity: clamp(p * 1.6) * (1 - o), filter: blur > 0.05 ? `blur(${blur}px)` : "none",
      transform: `translate(${x + (1 - p) * dx}px, ${(1 - p) * dy - o * 16}px)`, ...style }}>
      {grad ? <span style={{ background: `linear-gradient(95deg, ${C.deep}, ${C.blue} 45%, ${C.cyan})`, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>{children}</span> : children}
    </div>
  );
}

/* ---------- peças de interface ---------- */
function Cursor({ x, y, press }) {
  return (
    <svg width="26" height="30" viewBox="0 0 26 30" style={{ position: "absolute", left: x - 4, top: y - 2, transform: `scale(${1 - press * 0.12})`, transformOrigin: "4px 2px", filter: "drop-shadow(0 4px 6px rgba(0,0,0,.35))", zIndex: 20 }}>
      <path d="M4 2 L4 24 L9.5 19 L13.5 28 L17 26.4 L13 17.6 L20.5 17.6 Z" fill="#fff" stroke="#0B1222" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}
function Ripple({ t, at, x, y, r = 46 }) {
  const p = prog(t, at, at + 0.7);
  if (p <= 0 || p >= 1) return null;
  const e = EASE(p);
  return (
    <>
      <div style={{ position: "absolute", left: x - r * e, top: y - r * e, width: r * 2 * e, height: r * 2 * e, borderRadius: "50%", border: `2px solid ${GREEN}`, opacity: 1 - p, zIndex: 19 }} />
      <div style={{ position: "absolute", left: x - 16, top: y - 16, width: 32, height: 32, borderRadius: "50%", background: GREEN, opacity: 0.45 * (1 - p) * (1 - p), transform: `scale(${0.6 + e * 0.8})`, zIndex: 19 }} />
    </>
  );
}
function WindowBar({ title }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "11px 14px", borderBottom: "1px solid rgba(255,255,255,.07)" }}>
      {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => <span key={c} style={{ width: 8, height: 8, borderRadius: 4, background: c }} />)}
      <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 600, color: "#8A97AD" }}>{title}</span>
      <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ width: 6, height: 6, borderRadius: 3, background: GREEN, boxShadow: `0 0 6px ${GREEN}` }} />
        <span style={{ fontSize: 10, color: "#8A97AD", fontWeight: 600 }}>ao vivo</span>
      </span>
    </div>
  );
}
const cardStyle = { position: "absolute", borderRadius: 20, background: "linear-gradient(180deg, #0F1A2E 0%, #0A1324 100%)", border: "1px solid rgba(255,255,255,.08)", boxShadow: "0 40px 80px rgba(0,36,80,.28), 0 10px 24px rgba(0,36,80,.18)", color: "#fff", overflow: "hidden" };
const brl = (v) => "R$ " + Math.round(v).toLocaleString("pt-BR");

/* ---------- Cena 2: matéria-prima → produção ---------- */
function ProductionCard({ t, W }) {
  const enter = ein(t, T.prod, 0.95);
  const exit = eout(t, T.words, 0.38);
  if (t < T.prod || exit >= 1) return null;
  const cw = 380, ch = 318, x0 = (W - cw) / 2, y0 = 262;
  // cursor: entra pelo canto e para sobre o botão
  const btn = { x: 34 + 150 / 2, y: 132 + 19 };
  const cp = ein(t, T.prod + 0.55, 0.85);
  const cx = lerp(cw + 40, btn.x + 20, cp), cy = lerp(ch + 50, btn.y + 6, cp);
  const press = t >= T.click - 0.06 && t < T.click + 0.12 ? 1 : 0;
  const fill = easeInOut(prog(t, T.click + 0.3, T.done - 0.05));
  const done = soft(t, T.done);
  const toast = ein(t, T.click + 0.15, 0.5);
  return (
    <div style={{ position: "absolute", inset: 0, perspective: 1100 }}>
      <div style={{ ...cardStyle, left: x0, top: y0, width: cw, height: ch,
        transform: `translateY(${(1 - enter) * 300}px) rotateX(${lerp(24, 7, enter) * (1 - exit)}deg) scale(${lerp(1, 0.55, exit)})`,
        transformOrigin: "50% 100%", opacity: clamp(enter * 2) * (1 - exit), filter: exit > 0.02 ? `blur(${exit * 6}px)` : "none" }}>
        <WindowBar title="Produção · Estoke Sistema" />
        <div style={{ display: "flex", gap: 10, padding: "14px 16px 0" }}>
          {[["Insumos em estoque", toast > 0.5 ? "1.490 kg" : "1.240 kg"], ["OPs ativas", "3"]].map(([k, v]) => (
            <div key={k} style={{ flex: 1, padding: "10px 12px", borderRadius: 12, background: "rgba(255,255,255,.05)" }}>
              <div style={{ fontSize: 10, color: "#8A97AD", fontWeight: 600 }}>{k}</div>
              <div style={{ fontSize: 19, fontWeight: 800, marginTop: 3, letterSpacing: "-0.02em" }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ position: "absolute", left: 34, top: 132, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 150, height: 38, borderRadius: 11, background: press ? "#16A34A" : GREEN, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12.5, fontWeight: 800, color: "#05220F", transform: `scale(${press ? 0.95 : 1})`, boxShadow: "0 6px 16px rgba(34,197,94,.35)" }}>
            + Entrada de Insumos
          </div>
          <div style={{ opacity: toast, transform: `translateX(${(1 - toast) * 12}px)`, fontSize: 11, fontWeight: 700, color: "#86EFAC" }}>+250 kg algodão cru</div>
        </div>
        <div style={{ position: "absolute", left: 16, right: 16, top: 196, padding: "14px 14px 16px", borderRadius: 14, background: "rgba(255,255,255,.05)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800 }}>Ordem de Produção #402</div>
              <div style={{ fontSize: 10.5, color: "#8A97AD", fontWeight: 600, marginTop: 2 }}>Camiseta 240g · 15 un.</div>
            </div>
            {done > 0.01 ? (
              <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 20, background: "rgba(34,197,94,.16)", color: "#86EFAC", fontSize: 11, fontWeight: 800, opacity: done, transform: `scale(${lerp(0.8, 1, done)})` }}>
                <svg width="11" height="11" viewBox="0 0 12 12"><path d="M2 6.3 L4.8 9 L10 3.4" fill="none" stroke="#86EFAC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                Concluído
              </div>
            ) : (
              <div style={{ fontSize: 15, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{Math.round(fill * 100)}%</div>
            )}
          </div>
          <div style={{ marginTop: 12, height: 8, borderRadius: 4, background: "rgba(255,255,255,.08)", overflow: "hidden" }}>
            <div style={{ width: `${fill * 100}%`, height: "100%", borderRadius: 4, background: fill >= 1 ? GREEN : `linear-gradient(90deg, ${C.blue}, ${C.cyan})` }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 9, fontSize: 9.5, color: "#8A97AD", fontWeight: 600 }}>
            {["Corte", "Costura", "Acabamento", "Pronto"].map((s, i) => <span key={s} style={{ color: fill >= (i + 1) / 4 - 0.01 ? "#CFEAF8" : "#5D6A80" }}>{s}</span>)}
          </div>
        </div>
        <Ripple t={t} at={T.click} x={btn.x + 4} y={btn.y} />
        {cp > 0 && <Cursor x={cx} y={cy} press={press} />}
      </div>
    </div>
  );
}

/* ---------- Cena 3: Estoque · Caixa · Integrados ---------- */
function StaggerWords({ t }) {
  if (t < T.words || t > T.stock + 0.4) return null;
  const al = ein(t, T.align, 0.75);
  const out = eout(t, T.stock - 0.25, 0.35);
  const items = [
    { s: "Estoque", at: T.words + 0.3, from: [-92, 214], to: [0, 318], dx: -50, dy: 0 },
    { s: "Caixa", at: T.words + 0.68, from: [0, 380], to: [0, 382], dx: 0, dy: 30 },
    { s: "Integrados", at: T.words + 1.05, from: [36, 548], to: [0, 446], dx: 40, dy: 0, grad: true },
  ];
  return items.map((it) => {
    const x = lerp(it.from[0], it.to[0], al), y = lerp(it.from[1], it.to[1], al);
    return <KWord key={it.s} t={t} at={it.at} y={y} x={x} dx={it.dx} dy={it.dy} size={54}>
      <span style={{ opacity: 1 - out, filter: out > 0.02 ? `blur(${out * 10}px)` : "none", display: "inline-block", transform: `scale(${lerp(1, 1.1, out)})`, ...(it.grad ? GRAD_TEXT : {}) }}>{it.s}</span>
    </KWord>;
  });
}

/* ---------- Cena 4: estoque e caixa em tempo real ---------- */
const CHART = [0.22, 0.28, 0.25, 0.36, 0.33, 0.45, 0.42, 0.55, 0.6, 0.58, 0.72, 0.8, 0.92];
function StockCard({ t, W }) {
  const enter = ein(t, T.stock + 0.05, 0.9);
  const exit = eout(t, T.phone, 0.45);
  if (t < T.stock || exit >= 1) return null;
  const cw = 380, ch = 360, x0 = (W - cw) / 2, y0 = 238;
  const move = easeInOut(prog(t, T.stock + 0.6, T.stock + 1.3));
  const mp = Math.round(lerp(120, 105, move)), pf = Math.round(lerp(40, 55, move));
  const chipA = soft(t, T.stock + 0.6), chipB = soft(t, T.stock + 0.9);
  const draw = easeInOut(prog(t, T.stock + 0.9, T.phone - 0.15));
  const cash = lerp(18420, 21960, draw);
  const gw = cw - 64, gh = 92;
  const pts = CHART.map((v, i) => [(i / (CHART.length - 1)) * gw, gh - v * gh]);
  const n = draw * (pts.length - 1);
  const shown = pts.slice(0, Math.floor(n) + 1);
  if (n % 1 > 0 && Math.floor(n) + 1 < pts.length) {
    const a = pts[Math.floor(n)], b = pts[Math.floor(n) + 1], f = n % 1;
    shown.push([lerp(a[0], b[0], f), lerp(a[1], b[1], f)]);
  }
  const line = shown.map((p) => p.join(",")).join(" ");
  const last = shown[shown.length - 1];
  const Row = ({ label, sub, qty, chip, chipP, color, bg }) => (
    <div style={{ display: "flex", alignItems: "center", padding: "11px 12px", borderRadius: 12, background: "rgba(255,255,255,.05)" }}>
      <div style={{ width: 30, height: 30, borderRadius: 9, background: bg, marginRight: 10 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12.5, fontWeight: 800 }}>{label}</div>
        <div style={{ fontSize: 10, color: "#8A97AD", fontWeight: 600, marginTop: 1 }}>{sub}</div>
      </div>
      {chipP > 0.01 && <div style={{ marginRight: 10, padding: "4px 8px", borderRadius: 14, fontSize: 10.5, fontWeight: 800, color, background: color === GREEN ? "rgba(34,197,94,.15)" : "rgba(255,107,107,.15)", opacity: chipP, transform: `translateY(${(1 - chipP) * 6}px)` }}>{chip}</div>}
      <div style={{ fontSize: 17, fontWeight: 800, fontVariantNumeric: "tabular-nums", minWidth: 62, textAlign: "right" }}>{qty} <span style={{ fontSize: 10, color: "#8A97AD" }}>un.</span></div>
    </div>
  );
  return (
    <div style={{ position: "absolute", inset: 0, perspective: 1100 }}>
      <div style={{ ...cardStyle, left: x0, top: y0, width: cw, height: ch,
        transform: `translateY(${(1 - enter) * 300}px) rotateX(${lerp(22, 6, enter)}deg) scale(${lerp(1, 0.62, exit)})`,
        transformOrigin: "50% 60%", opacity: clamp(enter * 2) * (1 - exit), filter: exit > 0.02 ? `blur(${exit * 8}px)` : "none" }}>
        <WindowBar title="Estoque & Caixa · Estoke Sistema" />
        <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "14px 16px 0" }}>
          <Row label="Matéria-Prima" sub="Algodão cru · baixa automática" qty={mp} chip="-15 un." chipP={chipA} color="#FF8A8A" bg="linear-gradient(135deg,#3B4A63,#5B6B84)" />
          <Row label="Produto Final" sub="Camiseta 240g · OP #402" qty={pf} chip="+15 un." chipP={chipB} color={GREEN} bg={`linear-gradient(135deg, ${C.blue}, ${C.cyan})`} />
        </div>
        <div style={{ margin: "12px 16px 0", padding: "12px 16px 14px", borderRadius: 14, background: "rgba(255,255,255,.05)" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
            <span style={{ fontSize: 10.5, fontWeight: 600, color: "#8A97AD" }}>Caixa do mês</span>
            <span style={{ fontSize: 10.5, fontWeight: 800, color: "#86EFAC" }}>▲ {(draw * 19.2).toFixed(1).replace(".", ",")}%</span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", marginTop: 2, fontVariantNumeric: "tabular-nums" }}>{brl(cash)}</div>
          <svg width={gw} height={gh + 6} style={{ display: "block", marginTop: 6, overflow: "visible" }}>
            <defs>
              <linearGradient id="pa-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={C.cyan} stopOpacity="0.35" /><stop offset="1" stopColor={C.cyan} stopOpacity="0" /></linearGradient>
            </defs>
            {[0.25, 0.5, 0.75].map((g) => <line key={g} x1="0" x2={gw} y1={gh * g} y2={gh * g} stroke="rgba(255,255,255,.06)" />)}
            {shown.length > 1 && <polygon points={`0,${gh} ${line} ${last[0]},${gh}`} fill="url(#pa-area)" />}
            {shown.length > 1 && <polyline points={line} fill="none" stroke={C.cyan} strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round" />}
            {draw > 0 && <circle cx={last[0]} cy={last[1]} r="4.5" fill="#fff" stroke={C.cyan} strokeWidth="2.5" />}
          </svg>
        </div>
      </div>
    </div>
  );
}

/* ---------- Cena 5: no celular do cliente ---------- */
function Phone({ t, W }) {
  const enter = ein(t, T.phone + 0.15, 0.95);
  const exit = eout(t, T.cta - 0.05, 0.45);
  if (t < T.phone || exit >= 1) return null;
  const pw = 236, ph = 480, x0 = (W - pw) / 2, y0 = 196;
  const tap = { x: pw / 2, y: 384 };
  const press = t >= T.tap - 0.06 && t < T.tap + 0.12 ? 1 : 0;
  const pop = soft(t, T.approved);
  const float = Math.sin(t * 1.4) * 4;
  return (
    <div style={{ position: "absolute", inset: 0, perspective: 1200 }}>
      <div style={{ position: "absolute", left: x0, top: y0, width: pw, height: ph, borderRadius: 42, background: "#0B0F17", padding: 9, boxSizing: "border-box",
        boxShadow: "0 50px 90px rgba(0,36,80,.32), 0 12px 26px rgba(0,36,80,.2), inset 0 0 0 1.5px rgba(255,255,255,.12)",
        transform: `translateY(${(1 - enter) * 340 + float + exit * 120}px) rotateY(${lerp(-18, -4, enter) + Math.sin(t * 0.8) * 2}deg) rotateX(${lerp(14, 3, enter)}deg) scale(${lerp(0.9, 1, enter)})`,
        opacity: clamp(enter * 2) * (1 - exit) }}>
        <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 34, overflow: "hidden", background: "#FFFFFF", color: "#0B1222" }}>
          <div style={{ position: "absolute", left: "50%", top: 8, width: 76, height: 22, marginLeft: -38, borderRadius: 12, background: "#0B0F17", zIndex: 5 }} />
          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 18px 0", fontSize: 10, fontWeight: 700 }}><span>9:41</span><span>●●●</span></div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 16px 10px" }}>
            <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: "-0.02em" }}>Catálogo</span>
            <span style={{ fontSize: 10, fontWeight: 700, padding: "4px 8px", borderRadius: 10, background: "#EEF3F9", color: MUTED, display: "flex", alignItems: "center", gap: 4 }}><svg width="10" height="11" viewBox="0 0 10 11"><path d="M1.5 3.5h7l-.6 6.5H2.1z M3.3 3.5V2.6a1.7 1.7 0 0 1 3.4 0v.9" fill="none" stroke={MUTED} strokeWidth="1.2" strokeLinejoin="round" /></svg>1</span>
          </div>
          <div style={{ margin: "0 14px", height: 200, borderRadius: 18, overflow: "hidden", background: "#000" }}>
            <img src={DIZZY_TEE} alt="" decoding="sync" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div style={{ padding: "12px 16px 0" }}>
            <div style={{ fontSize: 13.5, fontWeight: 800 }}>Baby Tee Dizzy Bullet</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
              <span style={{ fontSize: 17, fontWeight: 800 }}>R$ 65,00</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: MUTED }}>em estoque: 55</span>
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
              {["P", "M", "G", "GG"].map((s, i) => <span key={s} style={{ width: 30, height: 26, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10.5, fontWeight: 800, border: i === 1 ? "1.5px solid #0B1222" : "1px solid #D9E1EC" }}>{s}</span>)}
            </div>
          </div>
          <div style={{ position: "absolute", left: 14, right: 14, top: tap.y - 21, height: 42, borderRadius: 14, background: press ? "#16A34A" : "#0B1222", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, transform: `scale(${press ? 0.96 : 1})` }}>Comprar Agora</div>
          <Ripple t={t} at={T.tap} x={tap.x} y={tap.y} r={54} />
          {/* pop-up: pagamento aprovado */}
          {pop > 0.01 && (
            <>
              <div style={{ position: "absolute", inset: 0, background: "rgba(11,18,34,.28)", opacity: pop, zIndex: 8 }} />
              <div style={{ position: "absolute", left: 16, right: 16, top: 128, padding: "20px 16px 18px", borderRadius: 22, background: "rgba(255,255,255,.96)", boxShadow: "0 24px 50px rgba(0,36,80,.3)", textAlign: "center", zIndex: 9,
                opacity: pop, transform: `translateY(${(1 - pop) * 26}px) scale(${lerp(0.9, 1, pop)})` }}>
                <div style={{ width: 48, height: 48, margin: "0 auto", borderRadius: 24, background: GREEN, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 20px rgba(34,197,94,.4)" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24"><path d="M5 12.5 L10 17 L19 7.5" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="22" strokeDashoffset={22 * (1 - ein(t, T.approved + 0.12, 0.5))} /></svg>
                </div>
                <div style={{ marginTop: 12, fontSize: 15, fontWeight: 800, letterSpacing: "-0.02em" }}>Pagamento Aprovado</div>
                <div style={{ marginTop: 5, fontSize: 11, fontWeight: 600, color: MUTED, lineHeight: 1.35 }}>Pedido enviado<br />para expedição</div>
                <div style={{ marginTop: 12, height: 5, borderRadius: 3, background: "#E7EDF5", overflow: "hidden" }}>
                  <div style={{ width: `${easeInOut(prog(t, T.approved + 0.4, T.approved + 1.8)) * 100}%`, height: "100%", background: `linear-gradient(90deg, ${C.blue}, ${C.cyan})` }} />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Cena 6: Sistemas Reais → CTA ---------- */
function Closing({ t, W }) {
  if (t < T.cta) return null;
  const merge = ein(t, T.merge - 0.1, 0.45);
  const gone = eout(t, T.final - 0.05, 0.3);
  const a = ein(t, T.cta, 0.6), b = ein(t, T.cta + 0.15, 0.6);
  const word = (s, p, side, grad) => (
    <span style={{ display: "inline-block", ...(grad ? GRAD_TEXT : {}), opacity: clamp(p * 1.6) * (1 - gone), filter: `blur(${(1 - p) * 10 + gone * 12}px)`,
      transform: `translateX(${(1 - p) * side * 120 + side * lerp(10, 4, merge)}px) scale(${lerp(1, 1.04, merge)})` }}>{s}</span>
  );
  const btnIn = soft(t, T.cta + 0.3);
  const pulse = t > T.cta + 0.9 ? 1 + 0.035 * Math.max(0, Math.sin((t - T.cta) * 6.5)) : 1;
  const ring = ((t - T.cta - 0.9) % 1.1) / 1.1;
  const arrowY = Math.sin(t * 7) * 5;
  return (
    <>
      {gone < 1 && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 330, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 50, letterSpacing: "-0.04em", color: INK, whiteSpace: "nowrap" }}>
          {word("Sistemas", a, -1)}{" "}
          {word("Reais", b, 1, true)}
        </div>
      )}
      <KWord t={t} at={T.final} y={258} size={40} dy={22}>Sua operação</KWord>
      <KWord t={t} at={T.final + 0.22} y={304} size={40} dy={22}>completa em</KWord>
      <KWord t={t} at={T.final + 0.44} y={350} size={40} dy={22} grad>um só lugar.</KWord>
      <div style={{ position: "absolute", left: 0, right: 0, top: 452, display: "flex", justifyContent: "center", opacity: ein(t, T.logo, 0.8), filter: `blur(${(1 - ein(t, T.logo, 0.8)) * 8}px)`, transform: `translateY(${(1 - ein(t, T.logo, 0.8)) * 14}px)` }}>
        <Wordmark size={15} color={INK} />
      </div>
      {/* CTA: "pra quem me seguir agora, eu te mando uma versão de testes" */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 560, display: "flex", flexDirection: "column", alignItems: "center", opacity: btnIn, transform: `translateY(${(1 - btnIn) * 40}px)` }}>
        <svg width="22" height="26" viewBox="0 0 22 26" style={{ transform: `translateY(${arrowY}px)`, marginBottom: 10 }}>
          <path d="M11 2 V22 M3 14 L11 22 L19 14" fill="none" stroke={C.blue} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div style={{ position: "relative" }}>
          {t > T.cta + 0.9 && <div style={{ position: "absolute", inset: -4, borderRadius: 34, border: `2px solid ${C.cyan}`, opacity: 0.7 * (1 - ring), transform: `scale(${1 + ring * 0.18})` }} />}
          <div style={{ padding: "17px 34px", borderRadius: 30, background: `linear-gradient(95deg, ${C.deep}, ${C.blue} 55%, ${C.cyan})`, color: "#fff", fontFamily: FONT, fontWeight: 800, fontSize: 17, letterSpacing: "-0.01em", boxShadow: "0 18px 36px rgba(0,138,204,.35)", transform: `scale(${pulse})` }}>
            + Seguir agora
          </div>
        </div>
        <div style={{ marginTop: 12, fontFamily: FONT, fontSize: 12.5, fontWeight: 600, color: MUTED, opacity: ein(t, T.teste, 0.6), transform: `translateY(${(1 - ein(t, T.teste, 0.6)) * 8}px)` }}>e receba uma <b style={{ color: INK }}>versão de testes</b></div>
      </div>
    </>
  );
}

/* ---------- Frame ---------- */
function Frame({ t, format = "9x16" }) {
  const F = FORMATS[format];
  const W = F.w, H = F.h;
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", fontFamily: FONT, background: "#F6F8FC" }}>
      <Background t={t} W={W} H={H} />
      {/* Cena 1: abertura */}
      <KWord t={t} at={0.4} out={2.85} y={318} size={24} weight={700} color={MUTED}>Da matéria-prima</KWord>
      <KWord t={t} at={1.42} out={2.95} y={352} size={24} weight={700} grad dx={0}>ao clique do cliente.</KWord>
      <KWord t={t} at={3.3} out={5.7} y={250} size={70} dy={24}>Controle.</KWord>
      <KWord t={t} at={4.2} out={5.75} y={338} size={48} dx={-60} dy={0}>De ponta</KWord>
      <KWord t={t} at={4.8} out={5.8} y={392} size={48} dx={60} dy={0} grad>a ponta.</KWord>
      {t >= 5.0 && t < 6.2 && (() => {
        const p = ein(t, 5.0, 0.6), o = eout(t, 5.82, 0.3);
        return <div style={{ position: "absolute", left: 0, right: 0, top: 488, display: "flex", justifyContent: "center", opacity: p * (1 - o), filter: `blur(${(1 - p) * 8 + o * 8}px)`, transform: `translateY(${(1 - p) * 14}px) scale(${lerp(0.94, 1, p)})` }}><Wordmark size={14} color={INK} /></div>;
      })()}
      {/* Cena 2 */}
      <KWord t={t} at={T.prod + 0.15} out={T.words - 0.05} y={112} size={34}>Da matéria-prima</KWord>
      <KWord t={t} at={T.prod + 0.35} out={T.words - 0.02} y={152} size={34} grad>à produção</KWord>
      <ProductionCard t={t} W={W} />
      {/* Cena 3 */}
      <StaggerWords t={t} />
      {/* Cena 4 */}
      <KWord t={t} at={T.stock + 0.2} out={T.phone - 0.05} y={112} size={34}>Estoque e caixa</KWord>
      <KWord t={t} at={T.stock + 0.4} out={T.phone - 0.02} y={152} size={34} grad>em tempo real</KWord>
      <StockCard t={t} W={W} />
      {/* Cena 5 */}
      <KWord t={t} at={T.phone + 0.35} out={T.cta - 0.1} y={88} size={32}>Direto para as mãos</KWord>
      <KWord t={t} at={T.phone + 0.55} out={T.cta - 0.07} y={126} size={32} grad>do seu cliente</KWord>
      <Phone t={t} W={W} />
      {/* Cena 6 */}
      <Closing t={t} W={W} />
      <Grain t={t} opacity={0.02} />
    </div>
  );
}

/* =============================================================================
   Som — sons orgânicos de interface: whooshes curtos e graves (rate < 1) nas entradas,
   pop/bubble no toque verde, confirmação no "Concluído" e no "Pagamento Aprovado".
   Sem trilha: só a voz e os efeitos.
============================================================================= */
const SAMPLES = { vo: VO_PONTA.voPonta, ...SFX };
const SFX_PLAN = [
  [0.05, "airWhoosh", 0.1, { rate: 0.75 }],
  [0.4, "shortWind", 0.05, { rate: 0.8 }], [1.42, "shortWind", 0.05, { rate: 0.85 }],
  [3.3, "airSweep", 0.07, { rate: 0.8 }], [4.2, "shortWind", 0.05, { rate: 0.8 }], [4.8, "shortWind", 0.05, { rate: 0.9 }],
  [5.05, "sparkleTouch", 0.05],
  [T.prod + 0.05, "airSweep", 0.08, { rate: 0.8 }],
  [T.click, "bubblePop", 0.16], [T.click + 0.15, "lightPop", 0.05],
  [T.done, "confirm", 0.08],
  [T.words, "windSwoosh", 0.07, { rate: 0.85 }],
  [T.words + 0.3, "shortWind", 0.05, { rate: 0.8 }], [T.words + 0.68, "shortWind", 0.05, { rate: 0.85 }], [T.words + 1.05, "shortWind", 0.05, { rate: 0.9 }],
  [T.align, "smallSweep", 0.06, { rate: 0.85 }],
  [T.stock + 0.05, "airSweep", 0.08, { rate: 0.8 }],
  [T.stock + 0.6, "dryPop", 0.05], [T.stock + 0.9, "lightPop", 0.05],
  [T.phone, "techSlide", 0.06, { rate: 0.85 }],
  [T.tap, "bubblePop", 0.16], [T.approved, "positive", 0.08],
  [T.cta, "shortWind", 0.06, { rate: 0.8 }], [T.cta + 0.15, "shortWind", 0.06, { rate: 0.9 }],
  [T.cta + 0.3, "lightPop", 0.06],
  [T.merge, "smallSweep", 0.06, { rate: 0.8 }],
  [T.logo, "sparkleTouch", 0.06], [T.teste, "lightPop", 0.05],
];
function buildEvents() {
  const ev = [];
  const fx = (at, name, gain, opts = {}) => ev.push({ t: Math.max(0, at - (SFX_PEAK[name] || 0) / (opts.rate || 1)), fn: (A, w) => A.sample(name, w, { gain, ...opts }) });
  ev.push({ t: VO_AT, dur: VO_LEN, fn: (A, w, off = 0) => A.sample("vo", w, { off, dur: VO_LEN - off, gain: 1.1 }) });
  SFX_PLAN.forEach(([at, n, g, o]) => fx(at, n, g, o));
  return ev;
}
const EVENTS = buildEvents();
const renderWav = () => renderEventsWav(EVENTS, DURATION, { samples: SAMPLES });

// Usado pelo exportador de vídeo (scripts/export-video.cjs)
const MOTION = { Frame, duration: DURATION, formats: FORMATS, renderWav };

export default function PontaAPontaAd() {
  return (
    <MotionPlayer Frame={Frame} duration={DURATION} events={EVENTS} formats={FORMATS} defaultFormat="9x16" renderWav={renderWav} samples={SAMPLES}
      fontsToLoad={[`800 16px "Open Sauce Sans"`, `700 16px "Open Sauce Sans"`]}
      scenes={[{ name: "Abertura", from: 0 }, { name: "Produção", from: T.prod }, { name: "Integrados", from: T.words }, { name: "Estoque", from: T.stock }, { name: "Cliente", from: T.phone }, { name: "CTA", from: T.cta }]} />
  );
}
