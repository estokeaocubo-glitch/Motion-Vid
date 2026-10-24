import React from "react";
import { FONT, clamp, lerp, prog, spring, easeOut, easeInOut, Grain, CubeLogo, SyncedVideo, renderEventsWav, MotionPlayer } from "./motionKit";
import { MUSIC_AD } from "./audio/bailarAd";
import { SFX, SFX_PEAK } from "./audio/sfx";
import { SFXV, SFXV_PEAK } from "./audio/sfxVo";

/* =============================================================================
   Estoke ao Cubo — "Site no navegador" (16:9 e 9:16, 17,2s)
   Refaz a referência do navegador (pin 723038915213386080) com um site nosso, a LCS Transporte
   e Turismo: cursor → dock de apps → clique no navegador → círculo verde → o ícone cresce →
   fundo azul, uma linha branca desenha um círculo que vira a barra de endereço e digita →
   a linha amarela desce até a janela, que mostra a gravação real do site rolando →
   fundo amarelo com o zigue-zague verde e os prints do site em colagem → nome do cliente →
   fundo preto com a logo da LCS e "site por Estoke ao Cubo".
   O ícone do navegador é genérico (globo), não a marca de um navegador específico.
   Tempos: os da própria referência (cortes medidos quadro a quadro). O áudio da referência veio
   praticamente mudo, então o som é a "BAILAR" (drop no círculo verde) e um efeito por ação.
   Fecha com a chamada "quer o seu site assim? · orçamento no direct".
============================================================================= */
const DURATION = 18.8;
const T = { dock: 0.55, click: 1.85, green: 2.07, blue: 3.38, ring: 3.5, pill: 3.95, type: 4.3, up: 5.05, win: 5.35, yellow: 12.3, collage: 13.2, name: 15.0, black: 16.3, cta: 17.25 };
const FORMATS = { "16x9": { w: 800, h: 450, label: "16:9" }, "9x16": { w: 450, h: 800, label: "9:16" } };
const PAL = { green: "#1FA35A", blue: "#3D7FE8", blueDeep: "#2A62C9", yellow: "#F7E43A", zig: "#22A35A", lcs: "#5E8C6A" };
const ADDRESS = "lcs transporte e turismo";
const SITE = { webm: "media/chrome/lcs-scroll.webm", mp4: "media/chrome/lcs-scroll.mp4", dur: 7.03 };
const SHOTS = [0, 1, 2, 3, 4, 5].map((i) => `media/chrome/shot${i}.webp`);
const pop = (t, at, k = 320, d = 16) => clamp(spring(t - at, { stiffness: k, damping: d }), 0, 1.2);

/* ---------- ícones do dock (genéricos, desenhados aqui) ---------- */
function AppIcon({ kind, size }) {
  const s = size;
  const base = { width: s, height: s, borderRadius: s / 2, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 3px 8px rgba(0,0,0,.15)" };
  if (kind === "browser")
    return (
      <svg width={s} height={s} viewBox="0 0 40 40" style={{ filter: "drop-shadow(0 3px 6px rgba(0,0,0,.2))" }}>
        <circle cx="20" cy="20" r="19" fill="#2D7DF6" />
        <circle cx="20" cy="20" r="19" fill="none" stroke="#fff" strokeOpacity=".35" />
        <ellipse cx="20" cy="20" rx="8" ry="18" fill="none" stroke="#fff" strokeWidth="2.4" />
        <path d="M2 20 H38 M5 11 H35 M5 29 H35" stroke="#fff" strokeWidth="2.4" fill="none" />
        <circle cx="20" cy="20" r="18" fill="none" stroke="#fff" strokeWidth="2.4" />
      </svg>
    );
  const map = {
    photos: <div style={{ ...base, background: "conic-gradient(#FF5A5F, #FFB400, #3DDC84, #2D9CDB, #9B51E0, #FF5A5F)" }}><div style={{ width: s * 0.3, height: s * 0.3, borderRadius: "50%", background: "#fff" }} /></div>,
    send: <div style={{ ...base, background: "#2AABEE" }}><svg width={s * 0.55} height={s * 0.55} viewBox="0 0 20 20"><path d="M2 9 L18 2 L13 18 L9 11 Z" fill="#fff" /></svg></div>,
    cloud: <div style={{ ...base, background: "#3FA9F5" }}><div style={{ width: s * 0.55, height: s * 0.3, borderRadius: s, background: "#fff" }} /></div>,
    mail: <div style={{ ...base, background: "#1E88E5" }}><svg width={s * 0.55} height={s * 0.55} viewBox="0 0 20 20"><rect x="2" y="4" width="16" height="12" rx="2" fill="#fff" /><path d="M2 5 L10 11 L18 5" stroke="#1E88E5" strokeWidth="2" fill="none" /></svg></div>,
  };
  return map[kind];
}
const DOCK = ["photos", "send", "browser", "cloud", "mail"];

function Cursor({ x, y, s = 1, press = false }) {
  return (
    <svg width={26 * s} height={32 * s} viewBox="0 0 26 32" style={{ position: "absolute", left: x, top: y, transform: `scale(${press ? 0.82 : 1})`, transformOrigin: "0 0", filter: "drop-shadow(0 2px 3px rgba(0,0,0,.35))", zIndex: 30 }}>
      <path d="M2 2 L2 26 L8 20 L12 30 L17 28 L13 18 L22 18 Z" fill="#111" stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

/* ---------- cena 1: dock (grande, como na referência) ---------- */
function Dock({ t, W, H, u }) {
  if (t >= T.green + 0.3) return null;
  const vertical = H > W;
  const cx = W / 2, cy = H / 2;
  const iconS = (vertical ? 58 : 62) * u, gap = 16 * u;
  const total = DOCK.length * iconS + (DOCK.length - 1) * gap + 44 * u;
  const p = pop(t, T.dock, 260, 15);
  const bx = cx - total / 2;
  const browserX = bx + 22 * u + 2 * (iconS + gap) + iconS / 2;
  const cp = easeInOut(prog(t, 0.0, 0.7));
  const cp2 = easeInOut(prog(t, 1.0, 1.55));
  const curX = lerp(lerp(W * 0.7, cx - 10 * u, cp), browserX - 6 * u, cp2);
  const curY = lerp(lerp(H * 0.92, cy - 80 * u, cp), cy - 4 * u, cp2);
  const hover = clamp(prog(t, 1.45, 1.7));
  const press = t >= T.click - 0.06 && t < T.click + 0.1;
  const h = iconS + 36 * u;
  return (
    <>
      <div style={{ position: "absolute", left: bx, top: cy - h / 2, width: total, height: h, borderRadius: h, background: "rgba(255,255,255,.95)", boxShadow: "0 16px 50px rgba(0,0,0,.13), inset 0 0 0 1px rgba(0,0,0,.05)", transform: `scale(${Math.min(p, 1.08)})`, opacity: clamp(p * 3) }}>
        {DOCK.map((k, i) => {
          const ip = pop(t, T.dock + 0.08 + i * 0.07, 380, 15);
          const isB = k === "browser";
          const lift = isB ? hover * 14 * u : 0;
          const sc = isB ? 1 + hover * 0.3 + (press ? -0.1 : 0) : 1;
          return (
            <div key={k} style={{ position: "absolute", left: 22 * u + i * (iconS + gap), top: 18 * u, transform: `translateY(${-lift}px) scale(${Math.min(ip, 1.1) * sc})`, transformOrigin: "50% 100%" }}>
              <AppIcon kind={k} size={iconS} />
            </div>
          );
        })}
      </div>
      {t < T.green && <Cursor x={curX} y={curY} s={u * 1.6} press={press} />}
    </>
  );
}

/* ---------- cena 2: verde com anéis + ícone gigante girando (motion blur) ---------- */
function GreenIcon({ t, W, H, u }) {
  if (t < T.green || t >= T.blue + 0.45) return null;
  const cx = W / 2, cy = H / 2;
  const R = Math.hypot(W, H);
  const e = easeOut(prog(t, T.green - 0.02, T.green + 0.22));
  const gP = prog(t, T.green + 0.02, T.green + 0.55);
  const g = easeOut(gP);
  const size = lerp(62, 300, g) * u * (1 + 0.04 * Math.sin((t - T.green) * 4));
  const rot = lerp(-160, 0, g) + (t - T.green) * 18;
  const vel = gP > 0 && gP < 1 ? 1 - gP : 0;
  const pulse = (k) => 1 + 0.03 * Math.sin((t - T.green) * 5 + k);
  return (
    <>
      <div style={{ position: "absolute", left: cx - R * e, top: cy - R * e, width: 2 * R * e, height: 2 * R * e, borderRadius: "50%", background: PAL.green }} />
      {[[1.75, "#18914F"], [1.32, "#1C9E55"]].map(([k, c], i) => (
        <div key={i} style={{ position: "absolute", left: cx - size * k / 2 * pulse(i), top: cy - size * k / 2 * pulse(i), width: size * k * pulse(i), height: size * k * pulse(i), borderRadius: "50%", background: c, opacity: e }} />
      ))}
      <div style={{ position: "absolute", left: cx - size / 2, top: cy - size / 2, transform: `rotate(${rot}deg)`, filter: vel > 0.05 ? `blur(${vel * 5 * u}px)` : "none" }}><AppIcon kind="browser" size={size} /></div>
    </>
  );
}

/* ---------- cena 3: azul, anel grande que vira a barra de endereço ---------- */
function Address({ t, W, H, u }) {
  if (t < T.blue - 0.02 || t >= T.yellow + 0.4) return null;
  const vertical = H > W;
  const cx = W / 2, cy = H / 2;
  const R = Math.hypot(W, H);
  const e = easeOut(prog(t, T.blue - 0.02, T.blue + 0.3));
  const draw = easeOut(prog(t, T.ring - 0.05, T.ring + 0.33));
  const m = easeInOut(prog(t, T.pill - 0.1, T.type));
  const ringD = 260 * u;
  const pw = lerp(ringD, (vertical ? 400 : 520) * u, m), ph = lerp(ringD, 66 * u, m);
  const upP = prog(t, T.up, T.win);
  const up = easeInOut(upP);
  const topY = H * (vertical ? 0.1 : 0.11);
  const py = lerp(cy, topY, up);
  const sc = lerp(1, vertical ? 0.78 : 0.62, up);
  const shown = ADDRESS.slice(0, Math.round(ADDRESS.length * clamp(prog(t, T.type, T.up - 0.1))));
  const rot = lerp(-35, 0, m);
  const peri = 2 * Math.PI * 120;
  const blurUp = upP > 0 && upP < 1 ? Math.sin(upP * Math.PI) * 4 * u : 0;
  return (
    <>
      <div style={{ position: "absolute", left: cx - R * e, top: cy - R * e, width: 2 * R * e, height: 2 * R * e, borderRadius: "50%", background: PAL.blue }} />
      {t >= T.ring - 0.05 && t < T.yellow && (
        m < 0.02 ? (
          <svg width={ringD} height={ringD} viewBox="0 0 260 260" style={{ position: "absolute", left: cx - ringD / 2, top: cy - ringD / 2, transform: "rotate(-90deg)" }}>
            <circle cx="130" cy="130" r="120" fill="none" stroke="#fff" strokeWidth="9" strokeLinecap="round" strokeDasharray={peri} strokeDashoffset={peri * (1 - draw)} />
          </svg>
        ) : (
          <div style={{ position: "absolute", left: cx - pw / 2, top: py - ph / 2, width: pw, height: ph, borderRadius: ph, border: `${4.5 * u}px solid #fff`, boxSizing: "border-box", transform: `rotate(${rot}deg) scale(${sc})`, display: "flex", alignItems: "center", justifyContent: "center", gap: 12 * u, filter: blurUp > 0.2 ? `blur(${blurUp}px)` : "none" }}>
            {m > 0.6 && <svg width={22 * u} height={22 * u} viewBox="0 0 12 12" style={{ opacity: clamp((m - 0.6) * 3) }}><rect x="2" y="5" width="8" height="6" rx="1" fill="#fff" /><path d="M4 5 V3.5 a2 2 0 0 1 4 0 V5" stroke="#fff" strokeWidth="1.4" fill="none" /></svg>}
            <span style={{ color: "#fff", fontWeight: 700, fontSize: (vertical ? 22 : 28) * u, letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{shown}{t >= T.type && t < T.up && Math.floor(t * 4) % 2 ? "|" : ""}</span>
          </div>
        )
      )}
    </>
  );
}

/* ---------- cena 4: janela com moldura grossa e o site rolando ---------- */
function Browser({ t, W, H, u }) {
  if (t < T.win - 0.05 || t >= T.yellow + 0.85) return null;
  const vertical = H > W;
  const ww = vertical ? W * 0.92 : W * 0.78, wh = vertical ? ww * 0.74 : ww * 0.58;
  const jumps = [[5.35, 0, 0], [7.5, -0.05, 0.02], [8.9, 0.05, -0.02], [9.9, -0.03, 0.02], [10.9, 0.05, 0.0], [11.6, -0.02, -0.01]];
  let j = jumps[0], jp = jumps[0];
  jumps.forEach((x, i) => { if (t >= x[0]) { j = x; jp = jumps[Math.max(0, i - 1)]; } });
  const jt = easeOut(clamp((t - j[0]) / 0.18));
  const jx = lerp(jp[1], j[1], jt), jy = lerp(jp[2], j[2], jt);
  const jumpBlur = t - j[0] < 0.18 && j !== jumps[0] ? (1 - jt) * 6 * u : 0;
  const p = pop(t, T.win, 240, 16);
  // saída: vira uma tira estreita (tipo celular) e atravessa a tela para a esquerda
  const o1 = easeInOut(prog(t, T.yellow - 0.1, T.yellow + 0.35));
  const o2 = easeIn3(prog(t, T.yellow + 0.3, T.yellow + 0.8));
  const curW = lerp(ww, ww * 0.16, o1), curH = lerp(wh, wh * 1.15, o1);
  const cx = W / 2 + jx * W * (vertical ? 0.15 : 1) - o2 * W * 0.9, cy = H * (vertical ? 0.56 : 0.57) + jy * H * (vertical ? 0.5 : 1);
  const lineTop = H * (vertical ? 0.1 : 0.11) + 22 * u;
  const lineLen = clamp(prog(t, T.win - 0.2, T.win + 0.25));
  const b = 9 * u;
  return (
    <>
      {t < T.yellow && <div style={{ position: "absolute", left: 0, right: 0, top: H * 0.64, bottom: 0, background: PAL.blueDeep, opacity: 0.55 }} />}
      <div style={{ position: "absolute", left: W / 2 - 2.5 * u, top: lineTop, width: 5 * u, height: Math.max(0, cy - curH / 2 - lineTop) * lineLen, background: PAL.yellow, opacity: 1 - o1 }} />
      <div style={{ position: "absolute", left: 0, width: (cx - curW / 2) * lineLen, top: cy + curH * 0.12, height: 5 * u, background: PAL.yellow, opacity: 1 - o1 }} />
      <div style={{
        position: "absolute", left: cx - curW / 2, top: cy - curH / 2, width: curW, height: curH, borderRadius: 22 * u, background: "#fff", padding: b, boxSizing: "border-box",
        boxShadow: `0 0 0 ${b * 0.7}px #2F6FDD, 0 26px 60px rgba(0,20,80,.4)`,
        transform: `scale(${Math.min(p, 1.06)}) rotate(${(1 - Math.min(p, 1)) * -6}deg)`, opacity: clamp(p * 2) * (o1 < 1 || o2 < 1 ? 1 : 0),
        filter: jumpBlur + o2 * 8 * u > 0.3 ? `blur(${jumpBlur + o2 * 8 * u}px)` : "none",
      }}>
        <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 14 * u, overflow: "hidden", background: "#eee" }}>
          <SyncedVideo t={t - T.win} duration={SITE.dur} webm={SITE.webm} mp4={SITE.mp4} style={{ objectFit: "cover", objectPosition: vertical ? "45% top" : "top" }} />
        </div>
      </div>
    </>
  );
}
const easeIn3 = (p) => p * p * p;

/* ---------- cena 5: amarelo + zigue-zague + colagem em perspectiva ---------- */
function Collage({ t, W, H, u }) {
  if (t < T.yellow - 0.02 || t >= T.black) return null;
  const vertical = H > W;
  const e = easeOut(prog(t, T.yellow - 0.02, T.yellow + 0.3));
  const zz = easeInOut(prog(t, T.yellow + 0.25, T.yellow + 1.1));
  // zigue-zague fica na metade de baixo/esquerda, longe do nome
  const pts = vertical ? [[-30, 0.86], [0.3, 0.66], [0.55, 0.84], [1.1, 0.6]] : [[-0.05, 0.95], [0.18, 0.62], [0.34, 0.9], [0.52, 0.58]];
  const d = pts.map((p, i) => `${i ? "L" : "M"}${(p[0] < -1 ? p[0] : p[0] * W)} ${p[1] * H}`).join(" ");
  const slideOut = easeInOut(prog(t, T.name - 0.15, T.name + 0.6));
  const cam = (t - T.collage) * 18 * u; // a câmera anda devagar para a esquerda
  const cards = vertical
    ? [[0.06, 0.1, -6], [0.44, 0.14, 5], [0.1, 0.32, 4], [0.47, 0.37, -5], [0.12, 0.55, -3], [0.46, 0.6, 6]]
    : [[0.04, 0.08, -6], [0.36, 0.05, 5], [0.66, 0.1, -4], [0.12, 0.42, 4], [0.42, 0.38, -5], [0.7, 0.45, 3]];
  const cw = (vertical ? 210 : 290) * u;
  const nameX = slideOut;
  return (
    <>
      <div style={{ position: "absolute", inset: 0, background: PAL.yellow, clipPath: `inset(0 0 0 ${(1 - e) * 100}%)` }} />
      <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
        <path d={d} fill="none" stroke={PAL.zig} strokeWidth={18 * u} strokeLinejoin="miter" strokeDasharray="4000" strokeDashoffset={4000 * (1 - zz)} />
      </svg>
      <div style={{ position: "absolute", inset: 0, perspective: `${900 * u}px` }}>
        {cards.map(([x, y, r], i) => {
          const at = T.collage + i * 0.14;
          const p = pop(t, at, 300, 17);
          if (t < at) return null;
          const ry = (i % 2 ? -1 : 1) * 14;
          return (
            <img key={i} src={SHOTS[i]} alt="" style={{
              position: "absolute", left: x * W - cam - slideOut * W * 1.3, top: y * H, width: cw, borderRadius: 10 * u, border: `${5 * u}px solid #fff`, zIndex: 10 + i,
              boxShadow: "0 22px 40px rgba(0,0,0,.28)",
              transform: `translateX(${(1 - Math.min(p, 1)) * W * 0.7}px) rotate(${r}deg) rotateY(${ry}deg) scale(${Math.min(p, 1.05)})`,
              filter: slideOut > 0.02 && slideOut < 0.98 ? `blur(${Math.sin(slideOut * Math.PI) * 6 * u}px)` : "none",
            }} />
          );
        })}
      </div>
      {t >= T.name && (() => {
        const p = pop(t, T.name + 0.1, 260, 15);
        return (
          <div style={{ position: "absolute", right: vertical ? 0 : 40 * u, left: vertical ? 0 : "auto", top: vertical ? H * 0.2 : H / 2 - 50 * u, textAlign: vertical ? "center" : "right", transform: `translateX(${(1 - Math.min(p, 1)) * 60 * u}px)`, opacity: clamp(p * 2) }}>
            <div style={{ fontWeight: 800, fontSize: (vertical ? 46 : 56) * u, letterSpacing: "-0.04em", lineHeight: 1, color: "#111" }}>LCS Transporte<br />& Turismo</div>
            <div style={{ marginTop: 12 * u, fontWeight: 700, fontSize: (vertical ? 18 : 20) * u, color: "#3A3A3A" }}>site no ar · feito pela Estoke ao Cubo</div>
          </div>
        );
      })()}
    </>
  );
}

/* ---------- cena 6: preto + logo da LCS, depois a chamada da Estoke ao Cubo ---------- */
function Outro({ t, W, H, u }) {
  if (t < T.black) return null;
  const p = pop(t, T.black + 0.05, 260, 15);
  const q = pop(t, T.black + 0.35);
  const toCta = easeInOut(prog(t, T.cta - 0.15, T.cta + 0.25));
  const c1 = pop(t, T.cta + 0.05, 260, 14), c2 = pop(t, T.cta + 0.3), c3 = pop(t, T.cta + 0.55, 300, 14);
  return (
    <div style={{ position: "absolute", inset: 0, background: "#000" }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - toCta, transform: `scale(${1 - toCta * 0.1})` }}>
        <img src="media/chrome/lcs-logo.webp" alt="" style={{ position: "absolute", left: W / 2 - 60 * u, top: H / 2 - 120 * u, width: 120 * u, transform: `scale(${Math.min(p, 1.1)})` }} />
        <div style={{ position: "absolute", left: 0, right: 0, top: H / 2 + 76 * u, display: "flex", justifyContent: "center", alignItems: "center", gap: 10 * u, opacity: clamp(q * 2) }}>
          <CubeLogo size={24 * u} />
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 18 * u }}>site por estoke ao cubo</span>
        </div>
      </div>
      {t >= T.cta && (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 * u }}>
          <div style={{ transform: `scale(${Math.min(c1, 1.1)}) rotate(${(1 - Math.min(c1, 1)) * -50}deg)` }}><CubeLogo size={70 * u} glow={1.2} /></div>
          <div style={{ color: "#fff", fontWeight: 800, fontSize: 36 * u, letterSpacing: "-0.04em", textAlign: "center", lineHeight: 1.05, opacity: clamp(c2 * 2), transform: `translateY(${(1 - Math.min(c2, 1)) * 14 * u}px)` }}>quer o seu site assim?</div>
          <div style={{ padding: `${12 * u}px ${24 * u}px`, borderRadius: 40 * u, background: PAL.yellow, color: "#111", fontWeight: 800, fontSize: 20 * u, transform: `scale(${Math.min(c3, 1.1)})` }}>orçamento no direct →</div>
        </div>
      )}
    </div>
  );
}

function Frame({ t, format = "16x9" }) {
  const F = FORMATS[format];
  const W = F.w, H = F.h;
  const u = Math.min(W, H) / 450;
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", fontFamily: FONT, background: "#FBFBFB" }}>
      <Dock t={t} W={W} H={H} u={u} />
      <GreenIcon t={t} W={W} H={H} u={u} />
      <Address t={t} W={W} H={H} u={u} />
      <Collage t={t} W={W} H={H} u={u} />
      <Browser t={t} W={W} H={H} u={u} />
      <Outro t={t} W={W} H={H} u={u} />
      <Grain t={t} opacity={0.03} />
    </div>
  );
}

/* =============================================================================
   Som — "BAILAR" com o drop no círculo verde (2,07s) e um efeito para cada ação.
============================================================================= */
const MUSIC_DELAY = T.green - 2.02; // drop da "BAILAR" em 2,02s do trecho
const SAMPLES = { music: MUSIC_AD.bailarAd, ...SFX, ...SFXV };
const PEAK = { ...SFX_PEAK, ...SFXV_PEAK };
function buildEvents() {
  const ev = [];
  const fx = (at, name, gain, opts = {}) => ev.push({ t: Math.max(0, at - (PEAK[name] || 0) / (opts.rate || 1)), fn: (A, w) => A.sample(name, w, { gain, ...opts }) });
  ev.push({ t: MUSIC_DELAY, dur: DURATION - MUSIC_DELAY, fn: (A, w, off = 0) => A.sample("music", w, { off, dur: DURATION - MUSIC_DELAY - off, gain: 0.45, fadeIn: 0.05,
    env: [[0, 0.6], [1.98, 0.6], [2.02, 1], [T.black - MUSIC_DELAY - 0.1, 1], [T.black - MUSIC_DELAY, 0.65], [T.cta - MUSIC_DELAY, 1], [DURATION - MUSIC_DELAY - 0.5, 1], [DURATION - MUSIC_DELAY, 0]] }) });
  fx(T.dock, "lightPop", 0.12);
  DOCK.forEach((_, i) => fx(T.dock + 0.08 + i * 0.07, "bubblePop", 0.07, { rate: 1 + i * 0.07 }));
  fx(1.5, "smallSweep", 0.05);
  fx(T.click, "mouseClick", 0.2);
  fx(T.green, "zoomImpact", 0.16); fx(T.green + 0.05, "airWhoosh", 0.1);
  fx(T.blue, "windSwoosh", 0.12);
  fx(T.ring, "techSlide", 0.08);
  fx(T.type, "typing", 0.12, { dur: T.up - T.type - 0.1 });
  fx(T.up, "confirm", 0.08);
  fx(T.win, "airSweep", 0.12); fx(T.win + 0.1, "hardPop", 0.1);
  [7.5, 8.9, 9.9, 10.9, 11.6].forEach((at, i) => fx(at, "dryPop", 0.07, { rate: 1 + (i % 3) * 0.06 }));
  fx(T.yellow, "windSwoosh", 0.12);
  [0, 1, 2, 3, 4, 5].forEach((i) => fx(T.collage + i * 0.14, "shutter", 0.06, { rate: 1 + (i % 3) * 0.05 }));
  fx(T.name, "airWhoosh", 0.1); fx(T.name + 0.15, "sparkleTouch", 0.1);
  fx(T.black, "logoImpact", 0.16);
  fx(T.cta, "airWhoosh", 0.1); fx(T.cta + 0.05, "hardPop", 0.12); fx(T.cta + 0.55, "bell", 0.12);
  fx(T.yellow + 0.3, "airSweep", 0.1); fx(T.name - 0.15, "windSwoosh", 0.08);
  return ev;
}
const EVENTS = buildEvents();
const renderWav = () => renderEventsWav(EVENTS, DURATION, { samples: SAMPLES });

// Usado pelo exportador de vídeo (scripts/export-video.cjs)
const MOTION = { Frame, duration: DURATION, formats: FORMATS, renderWav };

export default function ChromeSiteAd() {
  return (
    <MotionPlayer Frame={Frame} duration={DURATION} events={EVENTS} formats={FORMATS} defaultFormat="16x9" renderWav={renderWav} samples={SAMPLES}
      fontsToLoad={[`800 16px "Open Sauce Sans"`]}
      scenes={[{ name: "Dock", from: 0 }, { name: "Navegador", from: T.green }, { name: "Endereço", from: T.blue }, { name: "Site", from: T.win }, { name: "Colagem", from: T.yellow }, { name: "Logo", from: T.black }, { name: "Chamada", from: T.cta }]} />
  );
}
