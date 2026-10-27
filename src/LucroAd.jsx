import React from "react";
import { FONT, clamp, lerp, prog, spring, easeOut, easeInOut, Grain, CubeLogo, renderEventsWav, MotionPlayer, BrandWordmark } from "./motionKit";
import { LUCRO_FONT_CSS } from "./lucro/fonts";
import { MUSIC_SAAS } from "./audio/miamiSaas";
import { SFX, SFX_PEAK } from "./audio/sfx";
import { SFXV, SFXV_PEAK } from "./audio/sfxVo";

/* =============================================================================
   Estoke ao Cubo — "Quanto você lucrou?" (Reels 9:16, 22s, UI motion + tipografia cinética)
   Roteiro da Ideia 3: "QUANTO VOCÊ VENDEU?" → risca e vira "LUCROU?" (drop da "Miami" em 2,0s)
   → caderninho rasurado com luz quente → sugado pelo cubo → bento do sistema (PDV, estoque,
   fluxo de caixa, reposição, lucro) → clique em "Vender": vendeu → baixou → somou →
   zoom no lucro contando → "sem planilha. sem caderninho. sem achismo." → logo + "comenta CONTROLE".
   Valores ilustrativos.
============================================================================= */
const DURATION = 22;
const FORMATS = { "9x16": { w: 450, h: 800, label: "9:16" } };
const T = { drop: 2.0, book: 3.0, suck: 5.0, bento: 6.0, demo: 9.0, zoom: 13.0, sem: 16.0, end: 19.0 };
const NIGHT = "#000A1E";
const CYAN = "#2FD4FF";
const GREEN = "#4ADE80";
const AMBER = "#F5C26B";
const MONO = "'Space Mono', 'DejaVu Sans Mono', monospace";
const HAND = "'Caveat', cursive";

const pop = (t, at, k = 360, d = 17) => clamp(spring(t - at, { stiffness: k, damping: d }), 0, 1.2);
const brl = (v) => v.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

/* ---------- 0–3s: QUANTO VOCÊ VENDEU? → LUCROU? ---------- */
function Hook({ t }) {
  if (t >= T.book) return null;
  const words = [["QUANTO", 0.12, 290], ["VOCÊ", 0.62, 362]];
  const strike = easeOut(prog(t, T.drop - 0.12, T.drop + 0.05));
  const g = t >= T.drop + 0.05 && t < T.drop + 0.3 ? 1 - (t - T.drop - 0.05) / 0.25 : 0;
  const lucrou = t >= T.drop + 0.17;
  const out = easeInOut(prog(t, T.book - 0.25, T.book));
  const big = { position: "absolute", left: 0, right: 0, textAlign: "center", fontWeight: 800, letterSpacing: "-0.045em", lineHeight: 1, color: "#fff" };
  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - out, transform: `scale(${1 + out * 0.2})` }}>
      {words.map(([w, at, y]) => {
        const p = pop(t, at);
        return t < at ? null : <div key={w} style={{ ...big, top: y, fontSize: 70, transform: `scale(${lerp(1.5, 1, Math.min(p, 1))})`, opacity: clamp(p * 3) }}>{w}</div>;
      })}
      {t >= 1.12 && (() => {
        const p = pop(t, 1.12);
        const word = lucrou ? "LUCROU?" : "VENDEU?";
        const col = lucrou ? { background: `linear-gradient(90deg, ${GREEN}, ${CYAN})`, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" } : {};
        const layer = (extra) => <div style={{ ...big, top: 434, fontSize: 82, transform: `scale(${lerp(1.5, 1, Math.min(p, 1)) * (lucrou ? 1 + 0.12 * Math.exp(-(t - T.drop - 0.17) * 8) : 1)})`, ...col, ...extra }}>{word}</div>;
        return (
          <>
            {g > 0 ? (
              <>
                {layer({ color: "#FF2A55", background: "none", WebkitBackgroundClip: "initial", transform: `translateX(${-10 * g}px)`, clipPath: "inset(0 0 50% 0)", opacity: 0.85 })}
                {layer({ transform: `translateX(${14 * g}px)`, clipPath: "inset(50% 0 0 0)" })}
              </>
            ) : layer({})}
            {!lucrou && strike > 0 && <div style={{ position: "absolute", left: 60, top: 476, height: 9, width: 330 * strike, background: "#FF3B30", borderRadius: 4, transform: "rotate(-4deg)" }} />}
          </>
        );
      })()}
    </div>
  );
}

/* ---------- 3–6s: caderninho rasurado, sugado pelo cubo ---------- */
const LINES = [
  ["Camiseta P — 12 10 8?", 3.15], ["Bermuda M — ??", 3.4], ["caixa: R$ 1.230", 3.62, true], ["caixa: R$ 1.0?? conferir", 3.9], ["fiado D. Maria 45", 4.15], ["Tênis 39 — tem 2?", 4.4],
];
function Notebook({ t }) {
  if (t < T.book - 0.1 || t >= T.bento) return null;
  const inP = pop(t, T.book, 260, 18);
  const suck = easeInOut(prog(t, T.suck, T.suck + 0.7));
  const cap = (txt, at, y, size, color) => {
    const p = pop(t, at);
    return t < at ? null : <div style={{ position: "absolute", left: 0, right: 0, top: y, textAlign: "center", fontWeight: 800, fontSize: size, letterSpacing: "-0.035em", color, transform: `translateY(${(1 - Math.min(p, 1)) * 16}px)`, opacity: clamp(p * 2) * (1 - suck) }}>{txt}</div>;
  };
  return (
    <>
      {cap("não é quanto vendeu.", T.book + 0.05, 110, 30, "#E8D9C2")}
      {cap("é quanto sobrou.", T.book + 0.45, 150, 40, "#FFFFFF")}
      <div style={{
        position: "absolute", left: 225 - 160, top: 250, width: 320, height: 380, background: "#FBFAF4", borderRadius: 6,
        backgroundImage: "repeating-linear-gradient(180deg, transparent 0 33px, #B9D3EA 33px 35px), linear-gradient(90deg, transparent 46px, #F2A0A0 46px 48px, transparent 48px)",
        boxShadow: "14px 18px 0 rgba(0,0,0,.25)", transformOrigin: "50% 50%",
        transform: `translate(0, ${(1 - Math.min(inP, 1)) * 80}px) rotate(${lerp(-5, 340, suck)}deg) scale(${lerp(1, 0.02, suck) * lerp(0.8, 1, Math.min(inP, 1))})`, opacity: clamp(inP * 2),
      }}>
        <div style={{ position: "absolute", left: 12, top: 18, bottom: 18, width: 16, background: "radial-gradient(circle, #2b2b2b 4px, transparent 5px) 0 0 / 16px 34px repeat-y" }} />
        {LINES.map(([txt, at, struck], i) => {
          const w = clamp((t - at) / 0.32);
          return (
            <div key={i} style={{ position: "absolute", left: 56, top: 12 + i * 35, fontFamily: HAND, fontWeight: 600, fontSize: 26, color: "#1E2A6A", whiteSpace: "nowrap", clipPath: `inset(0 ${100 - w * 100}% 0 0)` }}>
              {txt}
              {struck && <div style={{ position: "absolute", left: 0, top: "52%", height: 3, width: `${clamp((t - at - 0.35) / 0.2) * 100}%`, background: "#1E2A6A" }} />}
            </div>
          );
        })}
        <div style={{ position: "absolute", right: 30, bottom: 34, width: 86, height: 86, borderRadius: "50%", border: "8px solid rgba(120,70,30,.2)" }} />
      </div>
      {[["caixa: ???", 3.75, 40, 520, -6], ["estoque: acho que 8", 4.2, 190, 590, 4]].map(([txt, at, x, y, r]) => {
        const p = pop(t, at, 420, 16);
        return t < at ? null : <div key={txt} style={{ position: "absolute", left: x, top: y, fontFamily: MONO, fontWeight: 700, fontSize: 19, padding: "6px 12px", background: "#FF3B30", color: "#fff", border: "3px solid #000", transform: `rotate(${r}deg) scale(${Math.min(p, 1.1) * (1 - suck)})` }}>{txt}</div>;
      })}
    </>
  );
}

/* ---------- cubo: aparece no centro (suga o caderno) e sobe para o topo ---------- */
function Cube({ t }) {
  if (t < T.suck || t >= T.sem) return null;
  const grow = pop(t, T.suck + 0.15, 220, 15);
  const up = easeInOut(prog(t, T.bento - 0.1, T.bento + 0.5));
  const size = lerp(150, 40, up) * Math.min(grow, 1.1);
  const x = lerp(225, 52, up), y = lerp(430, 62, up);
  return (
    <div style={{ position: "absolute", left: x - size * 0.454, top: y - size / 2, transform: `rotate(${(1 - Math.min(grow, 1)) * -90}deg)` }}>
      <CubeLogo size={size} glow={lerp(1.4, 0.6, up)} />
    </div>
  );
}

/* ---------- bento do sistema ---------- */
const CARD = { position: "absolute", boxSizing: "border-box", borderRadius: 20, padding: 16, overflow: "hidden", color: "#fff", background: "linear-gradient(160deg, rgba(255,255,255,.10), rgba(255,255,255,.04))", border: "1px solid rgba(255,255,255,.15)", boxShadow: "inset 0 1px 0 rgba(255,255,255,.14), 0 18px 36px rgba(0,0,0,.35)" };
const LBL = { fontSize: 12, fontWeight: 700, color: "#8FA6C6", display: "flex", alignItems: "center", gap: 6 };
const Dot = ({ c }) => <span style={{ width: 7, height: 7, borderRadius: 4, background: c, display: "inline-block" }} />;
const BOXES = { pdv: [30, 230, 190, 170], est: [230, 230, 190, 170], cx: [30, 410, 390, 190], rep: [30, 610, 190, 130], luc: [230, 610, 190, 130] };

function Bento({ t }) {
  if (t < T.bento - 0.05) return null;
  const order = ["pdv", "est", "cx", "rep", "luc"];
  const inOf = (k) => pop(t, T.bento + 0.25 + order.indexOf(k) * 0.22, 300, 17);
  const box = (k, children, extra = {}) => {
    const [x, y, w, h] = BOXES[k];
    const p = inOf(k);
    return <div style={{ ...CARD, left: x, top: y, width: w, height: h, transform: `translateY(${(1 - Math.min(p, 1)) * 40}px) scale(${lerp(0.85, 1, Math.min(p, 1.05))})`, opacity: clamp(p * 2), ...extra }}>{children}</div>;
  };
  // demo: clique em "Vender" → venda → estoque 8→7 → caixa +89,90
  const click = 9.6, baixou = 10.35, somou = 11.05;
  const sold = t >= click;
  const stock = t >= baixou ? 7 : 8;
  const stockFlip = Math.exp(-Math.max(0, t - baixou) * 7) * (t >= baixou ? 1 : 0);
  const cash = t >= somou;
  const cashP = pop(t, somou, 300, 14);
  // zoom no card de lucro
  const z = easeInOut(prog(t, T.zoom, T.zoom + 0.7));
  const [lx, ly, lw, lh] = BOXES.luc;
  const scale = lerp(1, 2.0, z);
  const tx = lerp(0, 225 - (lx + lw / 2) * 2.0, z), ty = lerp(0, 430 - (ly + lh / 2) * 2.0, z);
  const counter = 18430 * easeOut(prog(t, T.zoom + 0.35, T.zoom + 2.1));
  const dim = easeInOut(prog(t, T.sem - 0.1, T.sem + 0.35));
  const curve = "M0 150 C30 142 50 152 80 138 S130 112 160 120 S210 104 240 90 S290 84 320 64 S352 50 358 44";
  return (
    <div style={{ position: "absolute", inset: 0, transformOrigin: "0 0", transform: `translate(${tx}px, ${ty}px) scale(${scale})`, filter: dim > 0 ? `blur(${dim * 6}px)` : "none", opacity: 1 - dim * 0.65 }}>
      {box("pdv", (
        <>
          <div style={LBL}><Dot c={CYAN} />PDV</div>
          {!sold ? (
            <>
              <div style={{ marginTop: 12, fontSize: 14, fontWeight: 700, color: "#C9D6EA" }}>Camiseta P + Boné</div>
              <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.03em" }}>R$ 89,90</div>
              <div style={{ position: "absolute", left: 16, right: 16, bottom: 16, height: 40, borderRadius: 12, background: t >= click - 0.08 ? "#0A86C4" : "linear-gradient(90deg, #0A9BE0, #2FD4FF)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 17, transform: `scale(${t >= click - 0.08 ? 0.95 : 1})` }}>Vender</div>
            </>
          ) : (
            <>
              <div style={{ marginTop: 12, fontSize: 14, fontWeight: 700, color: GREEN }}>✓ Venda registrada</div>
              <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.03em", transform: `scale(${1 + 0.15 * Math.exp(-(t - click) * 8)})`, transformOrigin: "0 50%" }}>R$ 89,90</div>
              <div style={{ position: "absolute", left: 16, right: 16, bottom: 16, fontFamily: MONO, fontSize: 11, color: "#B9C7DA", lineHeight: 1.6 }}>1× Camiseta P · 59,90<br />1× Boné preto · 30,00</div>
            </>
          )}
        </>
      ))}
      {box("est", (
        <>
          <div style={LBL}><Dot c={GREEN} />Estoque · Camiseta P</div>
          <div style={{ marginTop: 14, fontSize: 52, fontWeight: 800, letterSpacing: "-0.04em", transform: `translateY(${-stockFlip * 14}px) scale(${1 + stockFlip * 0.25})`, transformOrigin: "0 50%", color: stockFlip > 0.2 ? AMBER : "#fff" }}>{stock} <span style={{ fontSize: 16, color: "#A9BBD4" }}>un.</span></div>
          <div style={{ position: "absolute", left: 16, right: 16, bottom: 22, height: 9, borderRadius: 5, background: "rgba(255,255,255,.1)", overflow: "hidden" }}><div style={{ width: `${stock * 10}%`, height: "100%", background: `linear-gradient(90deg, #16A34A, ${GREEN})` }} /></div>
        </>
      ))}
      {box("cx", (
        <>
          <div style={{ display: "flex", justifyContent: "space-between" }}><div style={LBL}><Dot c={CYAN} />Fluxo de caixa · hoje</div>{cash && <div style={{ fontSize: 15, fontWeight: 800, color: GREEN, transform: `scale(${Math.min(cashP, 1.1)})` }}>+ R$ 89,90</div>}</div>
          <svg width="358" height="150" viewBox="0 0 358 150" style={{ position: "absolute", left: 16, bottom: 10 }}>
            <defs><linearGradient id="lcf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={CYAN} stopOpacity=".4" /><stop offset="1" stopColor={CYAN} stopOpacity="0" /></linearGradient></defs>
            <path d={curve + " L358 150 L0 150 Z"} fill="url(#lcf)" />
            <path d={curve} fill="none" stroke={CYAN} strokeWidth="3.5" strokeLinecap="round" strokeDasharray="520" strokeDashoffset={520 * (1 - easeOut(prog(t, T.bento + 0.7, T.bento + 1.8)))} />
            {cash && <circle cx="358" cy="44" r={6 + 6 * Math.exp(-(t - somou) * 5)} fill={NIGHT} stroke={GREEN} strokeWidth="3.5" />}
          </svg>
        </>
      ))}
      {box("rep", (
        <>
          <div style={LBL}><Dot c={AMBER} />Reposição</div>
          <div style={{ marginTop: 10, fontSize: 18, fontWeight: 800 }}>Boné preto</div>
          <div style={{ position: "absolute", left: 16, bottom: 16, fontSize: 12, fontWeight: 800, color: AMBER, padding: "4px 10px", borderRadius: 20, background: "rgba(245,181,68,.15)", border: "1px solid rgba(245,181,68,.4)" }}>⚠ repor agora</div>
        </>
      ))}
      {box("luc", (
        <>
          <div style={LBL}><Dot c={GREEN} />Lucro líquido · mês</div>
          <div style={{ marginTop: 10, fontSize: 30, fontWeight: 800, letterSpacing: "-0.04em", fontVariantNumeric: "tabular-nums" }}>R$ {t >= T.zoom + 0.35 ? brl(counter) : "—"}</div>
          {t >= T.zoom + 2.1 && <div style={{ fontSize: 12, fontWeight: 800, color: GREEN, transform: `scale(${Math.min(pop(t, T.zoom + 2.1), 1.1)})`, transformOrigin: "0 50%" }}>▲ no positivo</div>}
          {z > 0.5 && <div style={{ position: "absolute", right: 10, bottom: 6, fontSize: 6.5, color: "#7D90AE", fontWeight: 700 }}>valores ilustrativos</div>}
        </>
      ), { border: `1px solid rgba(74,222,128,${0.15 + 0.35 * z})` })}
      {/* setas da demonstração */}
      {[[baixou - 0.25, 220, 290, 230, 290], [somou - 0.25, 325, 400, 325, 412]].map(([at, x1, y1, x2, y2], i) => {
        const p = clamp((t - at) / 0.22);
        return p > 0 && t < T.zoom ? <div key={i} style={{ position: "absolute", left: Math.min(x1, x2) - 8, top: Math.min(y1, y2) - 8, width: 16 + Math.abs(x2 - x1), height: 16 + Math.abs(y2 - y1), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: GREEN, opacity: p * (1 - clamp((t - at - 0.9) / 0.3)), fontWeight: 900 }}>{i ? "↓" : "→"}</div> : null;
      })}
      {/* cursor */}
      {t >= T.demo && t < T.zoom && (() => {
        const p = easeInOut(prog(t, T.demo, click - 0.05));
        const x = lerp(330, 125, p), y = lerp(700, 372, p);
        const press = t >= click - 0.08 && t < click + 0.12 ? 0.85 : 1;
        return (
          <svg width="26" height="32" viewBox="0 0 26 32" style={{ position: "absolute", left: x, top: y, transform: `scale(${press})`, filter: "drop-shadow(0 3px 4px rgba(0,0,0,.5))" }}>
            <path d="M2 2 L2 26 L8 20 L12 30 L17 28 L13 18 L22 18 Z" fill="#fff" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
          </svg>
        );
      })()}
    </div>
  );
}

/* ---------- textos por cima do bento ---------- */
function Kinetic({ t }) {
  const items = [];
  if (t >= T.bento && t < T.demo) {
    ["PDV", "ESTOQUE", "FINANCEIRO"].forEach((w, i) => items.push([w, T.bento + 0.25 + i * 0.35, 120 + i * 0, i]));
  }
  if (t >= T.demo + 0.5 && t < T.zoom) {
    [["vendeu →", 9.62], ["baixou →", 10.37], ["somou.", 11.07]].forEach(([w, at], i) => items.push([w, at, 0, i]));
  }
  // linha de palavras no topo, ao lado do cubo
  const row = items.length ? (
    <div style={{ position: "absolute", left: 92, right: 20, top: 46, display: "flex", gap: 10, alignItems: "center", height: 34 }}>
      {items.map(([w, at], i) => {
        const p = pop(t, at, 420, 16);
        return t < at ? null : <span key={w} style={{ fontWeight: 800, fontSize: 24, letterSpacing: "-0.03em", color: w.startsWith("somou") ? GREEN : "#fff", transform: `scale(${lerp(1.5, 1, Math.min(p, 1))})`, opacity: clamp(p * 3), whiteSpace: "nowrap" }}>{w}</span>;
      })}
    </div>
  ) : null;
  const sub = t >= T.demo + 0.5 && t < T.zoom ? <div style={{ position: "absolute", left: 30, right: 30, top: 150, fontSize: 17, fontWeight: 700, color: "#A9BBD4", opacity: clamp((t - T.demo - 0.6) * 4) }}>vendeu no caixa, o estoque baixa sozinho e o financeiro já soma.</div> : null;
  return <>{row}{sub}</>;
}

function Sem({ t }) {
  if (t < T.sem || t >= T.end + 0.3) return null;
  const out = easeInOut(prog(t, T.end - 0.2, T.end + 0.3));
  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - out }}>
      {[["SEM PLANILHA.", T.sem + 0.1, 300], ["SEM CADERNINHO.", T.sem + 1.0, 372], ["SEM ACHISMO.", T.sem + 1.9, 444]].map(([w, at, y]) => {
        const p = pop(t, at, 380, 15);
        return t < at ? null : <div key={w} style={{ position: "absolute", left: 0, right: 0, top: y, textAlign: "center", whiteSpace: "nowrap", fontWeight: 800, fontSize: 44, letterSpacing: "-0.045em", color: w === "SEM ACHISMO." ? GREEN : "#fff", transform: `scale(${lerp(1.6, 1, Math.min(p, 1))})`, opacity: clamp(p * 3) }}>{w}</div>;
      })}
    </div>
  );
}

function EndCard({ t }) {
  if (t < T.end) return null;
  const p = pop(t, T.end + 0.1, 220, 14);
  const q = pop(t, T.end + 0.45);
  const r = pop(t, T.end + 0.9, 300, 14);
  return (
    <>
      <div style={{ position: "absolute", left: 225 - 60, top: 200, transform: `scale(${Math.min(p, 1.1)}) rotate(${(1 - Math.min(p, 1)) * -60}deg)` }}><CubeLogo size={120} glow={1.3} /></div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 350, textAlign: "center", opacity: clamp(q * 2), transform: `translateY(${(1 - Math.min(q, 1)) * 14}px)` }}>
        <div style={{ display: "flex", justifyContent: "center" }}><BrandWordmark height={58} color="#FFFFFF" /></div>
        <div style={{ marginTop: 10, fontSize: 19, fontWeight: 700, color: "#A9BBD4", padding: "0 40px", lineHeight: 1.35 }}>estoque, caixa e financeiro num sistema só.</div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 540, display: "flex", justifyContent: "center", transform: `scale(${Math.min(r, 1.1)})`, opacity: clamp(r * 2) }}>
        <div style={{ padding: "16px 28px", borderRadius: 40, background: "linear-gradient(90deg, #0A9BE0, #2FD4FF)", color: "#001226", fontWeight: 800, fontSize: 22, boxShadow: "0 14px 34px rgba(47,212,255,.35)" }}>comenta CONTROLE ↓</div>
      </div>
    </>
  );
}

function Frame({ t }) {
  // luz: noite azul; no caderninho, um quente de balcão de lojinha
  const warm = clamp(prog(t, T.book - 0.2, T.book + 0.2)) * (1 - clamp(prog(t, T.suck + 0.2, T.bento)));
  const shake = t >= T.drop && t < T.drop + 0.3 ? (1 - (t - T.drop) / 0.3) * 6 : 0;
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", fontFamily: FONT, background: NIGHT }}>
      <style>{LUCRO_FONT_CSS}</style>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(70% 45% at 10% 8%, rgba(47,212,255,.18), transparent 70%), radial-gradient(60% 45% at 100% 100%, rgba(0,138,204,.28), transparent 70%)" }} />
      <div style={{ position: "absolute", inset: 0, opacity: warm, background: "radial-gradient(80% 60% at 50% 45%, #5A3A18, #1C1208 75%)" }} />
      <div style={{ position: "absolute", inset: 0, transform: `translate(${Math.sin(t * 90) * shake}px, ${Math.cos(t * 77) * shake}px)` }}>
        <Hook t={t} />
        <Notebook t={t} />
        <Bento t={t} />
        <Cube t={t} />
        <Kinetic t={t} />
        <Sem t={t} />
        <EndCard t={t} />
      </div>
      <Grain t={t} opacity={0.06} />
    </div>
  );
}

/* =============================================================================
   Som — "Miami" com o drop no "LUCROU?" (2,0s) e um efeito para cada ação.
============================================================================= */
const MUSIC_OFF = 8.96 - T.drop; // drop do trecho em 8,96s
const SAMPLES = { music: MUSIC_SAAS.miamiSaas, ...SFX, ...SFXV };
const PEAK = { ...SFX_PEAK, ...SFXV_PEAK };
function buildEvents() {
  const ev = [];
  const fx = (at, name, gain, opts = {}) => ev.push({ t: Math.max(0, at - (PEAK[name] || 0) / (opts.rate || 1)), fn: (A, w) => A.sample(name, w, { gain, ...opts }) });
  ev.push({ t: 0, dur: DURATION, fn: (A, w, off = 0) => A.sample("music", w, { off: MUSIC_OFF + off, dur: DURATION - off, gain: 0.5, fadeIn: 0.05,
    env: [[0, 0.75], [1.95, 0.75], [2.0, 1], [T.sem - 0.1, 1], [T.sem, 0.7], [T.end, 1], [DURATION - 0.7, 1], [DURATION, 0]] }) });
  [0.12, 0.62, 1.12].forEach((at, i) => fx(at, "hardPop", 0.16, { rate: 1 + i * 0.06 }));
  fx(T.drop - 0.1, "marker", 0.14);
  fx(T.drop + 0.05, "glitch", 0.14); fx(T.drop, "deepHit", 0.2);
  [3.15, 3.4, 3.62, 3.9, 4.15, 4.4].forEach((at, i) => fx(at, "marker", 0.06, { rate: 1.1 + (i % 3) * 0.08 }));
  fx(3.75, "dryPop", 0.12); fx(4.2, "dryPop", 0.12, { rate: 0.92 });
  fx(T.suck, "tunnelWhoosh", 0.12); fx(T.suck + 0.15, "zoomImpact", 0.12);
  [0, 1, 2, 3, 4].forEach((i) => fx(T.bento + 0.25 + i * 0.22, "bubblePop", 0.1, { rate: 1 + i * 0.07 }));
  fx(9.6, "mouseClick", 0.18); fx(9.62, "coinWin", 0.1);
  fx(10.35, "tick", 0.12); fx(10.37, "lightPop", 0.1);
  fx(11.05, "coins", 0.1); fx(11.07, "confirm", 0.08);
  fx(T.zoom, "airWhoosh", 0.12); fx(T.zoom + 0.35, "tick", 0.1); fx(T.zoom + 2.1, "positive", 0.12);
  [T.sem + 0.1, T.sem + 1.0, T.sem + 1.9].forEach((at) => fx(at, "zoomImpact", 0.12));
  fx(T.end + 0.1, "logoImpact", 0.16); fx(T.end + 0.9, "bell", 0.1);
  return ev;
}
const EVENTS = buildEvents();
const renderWav = () => renderEventsWav(EVENTS, DURATION, { samples: SAMPLES });

// Usado pelo exportador de vídeo (scripts/export-video.cjs)
const MOTION = { Frame, duration: DURATION, formats: FORMATS, renderWav };

export default function LucroAd() {
  return (
    <MotionPlayer Frame={Frame} duration={DURATION} events={EVENTS} formats={FORMATS} defaultFormat="9x16" renderWav={renderWav} samples={SAMPLES}
      fontsToLoad={[`800 16px "Open Sauce Sans"`, `600 16px "Caveat"`, `700 16px "Space Mono"`]}
      scenes={[{ name: "Gancho", from: 0 }, { name: "Caderninho", from: T.book }, { name: "Sistema", from: T.bento }, { name: "Demo", from: T.demo }, { name: "Lucro", from: T.zoom }, { name: "Sem achismo", from: T.sem }, { name: "Fim", from: T.end }]} />
  );
}
