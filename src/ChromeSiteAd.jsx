import React from "react";
import { FONT, clamp, lerp, prog, spring, easeOut, easeInOut, Grain, CubeLogo, SyncedVideo, renderEventsWav, MotionPlayer } from "./motionKit";
import { MUSIC_CHROME } from "./audio/chromeRef";

/* =============================================================================
   Estoke ao Cubo — "Site no navegador" (16:9 e 9:16, 17,2s)
   Refaz a referência do navegador (pin 723038915213386080) com um site nosso, a LCS Transporte
   e Turismo: cursor → dock de apps → clique no navegador → círculo verde → o ícone cresce →
   fundo azul, uma linha branca desenha um círculo que vira a barra de endereço e digita →
   a linha amarela desce até a janela, que mostra a gravação real do site rolando →
   fundo amarelo com o zigue-zague verde e os prints do site em colagem → nome do cliente →
   fundo preto com a logo da LCS e "site por Estoke ao Cubo".
   O ícone do navegador é genérico (globo), não a marca de um navegador específico.
   Áudio e tempos: os da própria referência (cortes medidos quadro a quadro).
============================================================================= */
const DURATION = 17.2;
const T = { dock: 0.55, click: 1.85, green: 2.07, blue: 3.38, ring: 3.5, pill: 3.95, type: 4.3, up: 5.05, win: 5.35, yellow: 12.3, collage: 13.2, name: 15.0, black: 16.3 };
const FORMATS = { "16x9": { w: 800, h: 450, label: "16:9" }, "9x16": { w: 450, h: 800, label: "9:16" } };
const PAL = { green: "#1FA35A", blue: "#3D7FE8", blueDeep: "#2A62C9", yellow: "#F7E43A", zig: "#22A35A", lcs: "#5E8C6A" };
const ADDRESS = "lcs transporte e turismo";
const SITE = { webm: "media/chrome/lcs-scroll.webm", mp4: "media/chrome/lcs-scroll.mp4", dur: 6.9 };
const SHOTS = [0, 1, 2, 3, 4, 5, 6].map((i) => `media/chrome/shot${i}.webp`);
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

/* ---------- cena 1: dock ---------- */
function Dock({ t, W, H, u }) {
  if (t >= T.green + 0.3) return null;
  const cx = W / 2, cy = H / 2;
  const iconS = 30 * u, gap = 10 * u;
  const total = DOCK.length * iconS + (DOCK.length - 1) * gap + 28 * u;
  const p = pop(t, T.dock, 260, 15);
  const bx = cx - total / 2;
  const browserX = bx + 14 * u + 2 * (iconS + gap) + iconS / 2;
  // cursor: entra de baixo, para no navegador, clica
  const cp = easeInOut(prog(t, 0.0, 0.7));
  const cp2 = easeInOut(prog(t, 1.0, 1.55));
  const curX = lerp(lerp(W * 0.62, cx - 6 * u, cp), browserX - 4 * u, cp2);
  const curY = lerp(lerp(H * 0.9, cy - 46 * u, cp), cy - 4 * u, cp2);
  const hover = clamp(prog(t, 1.45, 1.7));
  const press = t >= T.click - 0.06 && t < T.click + 0.1;
  return (
    <>
      <div style={{ position: "absolute", left: bx, top: cy - (iconS + 22 * u) / 2, width: total, height: iconS + 22 * u, borderRadius: 40 * u, background: "rgba(255,255,255,.92)", boxShadow: "0 8px 30px rgba(0,0,0,.12), inset 0 0 0 1px rgba(0,0,0,.06)", transform: `scale(${Math.min(p, 1.1)})`, opacity: clamp(p * 3) }}>
        {DOCK.map((k, i) => {
          const ip = pop(t, T.dock + 0.08 + i * 0.07, 380, 15);
          const isB = k === "browser";
          const lift = isB ? hover * 8 * u : 0;
          const sc = isB ? 1 + hover * 0.35 + (press ? -0.1 : 0) : 1;
          return (
            <div key={k} style={{ position: "absolute", left: 14 * u + i * (iconS + gap), top: 11 * u, transform: `translateY(${-lift}px) scale(${Math.min(ip, 1.1) * sc})`, transformOrigin: "50% 100%" }}>
              <AppIcon kind={k} size={iconS} />
            </div>
          );
        })}
      </div>
      {t < T.green && <Cursor x={curX} y={curY} s={u} press={press} />}
    </>
  );
}

/* ---------- cena 2: verde + ícone crescendo ---------- */
function GreenIcon({ t, W, H, u }) {
  if (t < T.green || t >= T.blue + 0.45) return null;
  const cx = W / 2, cy = H / 2;
  const R = Math.hypot(W, H);
  const e = easeOut(prog(t, T.green - 0.02, T.green + 0.25));
  const g = easeInOut(prog(t, T.green + 0.1, T.blue));
  const size = lerp(46, 250, g) * u;
  const rot = lerp(0, 140, g);
  return (
    <>
      <div style={{ position: "absolute", left: cx - R * e, top: cy - R * e, width: 2 * R * e, height: 2 * R * e, borderRadius: "50%", background: PAL.green }} />
      <div style={{ position: "absolute", left: cx - size * 0.62, top: cy - size * 0.62, width: size * 1.24, height: size * 1.24, borderRadius: "50%", background: "rgba(255,255,255,.14)" }} />
      <div style={{ position: "absolute", left: cx - size / 2, top: cy - size / 2, transform: `rotate(${rot}deg)` }}><AppIcon kind="browser" size={size} /></div>
    </>
  );
}

/* ---------- cena 3: azul, anel que vira barra de endereço ---------- */
function Address({ t, W, H, u }) {
  if (t < T.blue - 0.02 || t >= T.yellow) return null;
  const cx = W / 2, cy = H / 2;
  const R = Math.hypot(W, H);
  const e = easeOut(prog(t, T.blue - 0.02, T.blue + 0.3));
  // anel: desenha o traço (dasharray) e depois achata em pílula
  const draw = easeInOut(prog(t, T.ring, T.pill));
  const m = easeInOut(prog(t, T.pill, T.type));
  const pw = lerp(120, 300, m) * u, ph = lerp(120, 34, m) * u;
  const up = easeInOut(prog(t, T.up, T.win));
  const py = lerp(cy, H * (H > W ? 0.12 : 0.1), up);
  const shown = ADDRESS.slice(0, Math.round(ADDRESS.length * clamp(prog(t, T.type, T.up - 0.1))));
  const rot = lerp(-40, 0, m);
  const peri = 2 * Math.PI * 60;
  return (
    <>
      <div style={{ position: "absolute", left: cx - R * e, top: cy - R * e, width: 2 * R * e, height: 2 * R * e, borderRadius: "50%", background: PAL.blue }} />
      {t >= T.ring && (
        m < 0.02 ? (
          <svg width={140 * u} height={140 * u} viewBox="0 0 140 140" style={{ position: "absolute", left: cx - 70 * u, top: cy - 70 * u, transform: "rotate(-90deg)" }}>
            <circle cx="70" cy="70" r="60" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeDasharray={peri} strokeDashoffset={peri * (1 - draw)} />
          </svg>
        ) : (
          <div style={{ position: "absolute", left: cx - pw / 2, top: py - ph / 2, width: pw, height: ph, borderRadius: ph, border: `${2.5 * u}px solid #fff`, boxSizing: "border-box", transform: `rotate(${rot}deg)`, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 * u }}>
            {m > 0.6 && <svg width={11 * u} height={11 * u} viewBox="0 0 12 12" style={{ opacity: clamp((m - 0.6) * 3) }}><rect x="2" y="5" width="8" height="6" rx="1" fill="#fff" /><path d="M4 5 V3.5 a2 2 0 0 1 4 0 V5" stroke="#fff" strokeWidth="1.4" fill="none" /></svg>}
            <span style={{ color: "#fff", fontWeight: 600, fontSize: 13 * u, letterSpacing: "0.12em", whiteSpace: "nowrap" }}>{shown}{t >= T.type && t < T.up && Math.floor(t * 4) % 2 ? "|" : ""}</span>
          </div>
        )
      )}
    </>
  );
}

/* ---------- cena 4: janela com o site rolando ---------- */
function Browser({ t, W, H, u }) {
  if (t < T.win - 0.05 || t >= T.yellow + 0.35) return null;
  const vertical = H > W;
  const ww = vertical ? W * 0.9 : W * 0.72, wh = ww * 0.58;
  // pequenos "saltos" de posição nas batidas da referência
  const jumps = [[5.35, 0, 0], [7.5, -0.06, 0.02], [8.9, 0.05, -0.03], [9.9, -0.03, 0.03], [10.9, 0.06, 0.0], [11.6, -0.02, -0.02]];
  let j = jumps[0];
  jumps.forEach((x) => { if (t >= x[0]) j = x; });
  const kick = Math.exp(-Math.max(0, t - j[0]) * 9);
  const p = pop(t, T.win, 240, 16);
  const out = easeInOut(prog(t, T.yellow - 0.05, T.yellow + 0.3));
  const cx = W / 2 + j[1] * W * (vertical ? 0.15 : 1), cy = H * 0.56 + j[2] * H * (vertical ? 0.5 : 1);
  const lineTop = H * (vertical ? 0.12 : 0.1) + 18 * u;
  const lineLen = clamp(prog(t, T.win - 0.2, T.win + 0.25));
  return (
    <>
      <div style={{ position: "absolute", left: 0, right: 0, top: H * 0.62, bottom: 0, background: PAL.blueDeep, opacity: 0.6 }} />
      <div style={{ position: "absolute", left: W / 2 - 1.5 * u, top: lineTop, width: 3 * u, height: (cy - wh / 2 - lineTop) * lineLen, background: PAL.yellow, opacity: 1 - out }} />
      <div style={{ position: "absolute", left: 0, width: W * lineLen * 0.5, top: cy + wh * 0.1, height: 3 * u, background: PAL.yellow, opacity: 1 - out }} />
      <div style={{
        position: "absolute", left: cx - ww / 2, top: cy - wh / 2, width: ww, height: wh, borderRadius: 14 * u, background: "#fff", padding: 6 * u, boxSizing: "border-box",
        boxShadow: "0 20px 50px rgba(0,20,80,.35)",
        transform: `scale(${Math.min(p, 1.06) * (1 + 0.03 * kick) * lerp(1, 0.2, out)}) rotate(${(1 - Math.min(p, 1)) * -6 + out * 8}deg)`, opacity: clamp(p * 2) * (1 - out),
      }}>
        <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 9 * u, overflow: "hidden", background: "#eee" }}>
          <SyncedVideo t={t - T.win} duration={SITE.dur} webm={SITE.webm} mp4={SITE.mp4} style={{ objectFit: "cover", objectPosition: "top" }} />
        </div>
      </div>
    </>
  );
}

/* ---------- cena 5: amarelo + zigue-zague + colagem ---------- */
function Collage({ t, W, H, u }) {
  if (t < T.yellow - 0.02 || t >= T.black) return null;
  const vertical = H > W;
  const e = easeOut(prog(t, T.yellow - 0.02, T.yellow + 0.35));
  const zz = easeInOut(prog(t, T.yellow + 0.3, T.yellow + 1.2));
  const pts = vertical ? [[-20, 560], [130, 420], [260, 540], [470, 330]] : [[-20, 400], [170, 220], [330, 380], [560, 140], [820, 300]];
  const sc = vertical ? 1 : W / 800;
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0] * (vertical ? 1 : sc)} ${p[1] * (vertical ? H / 800 : sc)}`).join(" ");
  const slideOut = easeInOut(prog(t, T.name - 0.1, T.name + 0.5));
  const cards = vertical
    ? [[40, 120, -6], [230, 170, 5], [70, 300, 3], [250, 330, -4], [60, 470, -3], [230, 520, 6], [130, 620, -2]]
    : [[60, 60, -6], [300, 40, 4], [540, 70, -3], [120, 230, 5], [370, 210, -4], [590, 250, 3], [250, 320, -2]];
  const cw = (vertical ? 170 : 200) * u;
  return (
    <>
      <div style={{ position: "absolute", inset: 0, background: PAL.yellow, clipPath: `inset(0 0 0 ${(1 - e) * 100}%)` }} />
      <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
        <path d={d} fill="none" stroke={PAL.zig} strokeWidth={12 * u} strokeLinejoin="miter" strokeDasharray="3000" strokeDashoffset={3000 * (1 - zz)} />
      </svg>
      {cards.map(([x, y, r], i) => {
        const at = T.collage + i * 0.16;
        const p = pop(t, at, 300, 17);
        if (t < at) return null;
        return (
          <img key={i} src={SHOTS[i]} alt="" style={{
            position: "absolute", left: x * (vertical ? 1 : sc) - slideOut * W * 1.2, top: y * (vertical ? H / 800 : sc), width: cw, borderRadius: 6 * u, border: `${3 * u}px solid #fff`,
            boxShadow: "0 12px 26px rgba(0,0,0,.25)", transform: `translateX(${(1 - Math.min(p, 1)) * W * 0.6}px) rotate(${r}deg) scale(${Math.min(p, 1.05)})`,
          }} />
        );
      })}
      {t >= T.name && (() => {
        const p = pop(t, T.name + 0.15, 260, 15);
        return (
          <div style={{ position: "absolute", left: 0, right: 0, top: H / 2 - 30 * u, textAlign: "center", transform: `scale(${Math.min(p, 1.1)})`, opacity: clamp(p * 2) }}>
            <div style={{ fontWeight: 800, fontSize: 30 * u, letterSpacing: "-0.03em", color: "#111" }}>LCS Transporte & Turismo</div>
            <div style={{ marginTop: 6 * u, fontWeight: 700, fontSize: 13 * u, color: "#333" }}>site no ar · feito pela Estoke ao Cubo</div>
          </div>
        );
      })()}
    </>
  );
}

/* ---------- cena 6: preto + logo ---------- */
function Outro({ t, W, H, u }) {
  if (t < T.black) return null;
  const p = pop(t, T.black + 0.05, 260, 15);
  const q = pop(t, T.black + 0.4);
  return (
    <div style={{ position: "absolute", inset: 0, background: "#000" }}>
      <img src="media/chrome/lcs-logo.webp" alt="" style={{ position: "absolute", left: W / 2 - 48 * u, top: H / 2 - 100 * u, width: 96 * u, transform: `scale(${Math.min(p, 1.1)})` }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: H / 2 + 48 * u, display: "flex", justifyContent: "center", alignItems: "center", gap: 7 * u, opacity: clamp(q * 2) }}>
        <CubeLogo size={16 * u} />
        <span style={{ color: "#fff", fontWeight: 700, fontSize: 12 * u }}>site por estoke ao cubo</span>
      </div>
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
      <Browser t={t} W={W} H={H} u={u} />
      <Collage t={t} W={W} H={H} u={u} />
      <Outro t={t} W={W} H={H} u={u} />
      <Grain t={t} opacity={0.03} />
    </div>
  );
}

/* =============================================================================
   Som — o áudio original da referência, inteiro.
============================================================================= */
const SAMPLES = { music: MUSIC_CHROME.chromeRef };
function buildEvents() {
  return [{ t: 0, dur: DURATION, fn: (A, w, off = 0) => A.sample("music", w, { off, dur: DURATION - off, gain: 1, fadeIn: 0.005 }) }];
}
const EVENTS = buildEvents();
const renderWav = () => renderEventsWav(EVENTS, DURATION, { samples: SAMPLES });

// Usado pelo exportador de vídeo (scripts/export-video.cjs)
const MOTION = { Frame, duration: DURATION, formats: FORMATS, renderWav };

export default function ChromeSiteAd() {
  return (
    <MotionPlayer Frame={Frame} duration={DURATION} events={EVENTS} formats={FORMATS} defaultFormat="16x9" renderWav={renderWav} samples={SAMPLES}
      fontsToLoad={[`800 16px "Open Sauce Sans"`]}
      scenes={[{ name: "Dock", from: 0 }, { name: "Navegador", from: T.green }, { name: "Endereço", from: T.blue }, { name: "Site", from: T.win }, { name: "Colagem", from: T.yellow }, { name: "Fim", from: T.black }]} />
  );
}
