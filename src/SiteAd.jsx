import React, { useLayoutEffect, useRef } from "react";
import {
  C, FONT, DISP, DISPLAY_FONT, measure, fitSize, clamp, lerp, prog, easeOut, easeIn, easeInOut, rnd, spring, hexA, GRAD, GRAD_LIGHT,
  Grain, CubeLogo, SyncedVideo, renderEventsWav, MotionPlayer,
} from "./motionKit";
import { AD_TILES, AD_DIZZY_TILES, AD_CLIP_MP4, AD_CLIP_WEBM, AD_CLIP_DUR } from "./adAssets";
import { MUSIC_AD } from "./audio/bailarAd";
import { SFX, SFX_PEAK } from "./audio/sfx";

/* =============================================================================
   Estoke ao Cubo — anúncio de sites (tipografia cinética, 32s)
   Referência: anúncio "Creator Studio" (Apple), 16:9, 30s: fundo preto, logo com letras
   trocando de fonte, mosaico de telas, frases palavra a palavra, dock de ícones, "Make a
   beat" virando faixas, vídeo abrindo entre palavras e indo para o notebook, texto no
   notebook que vira tablet, rajada de verbos com um efeito por palavra (partículas,
   seleção, curva, lixeira, scanline, brilho), pinceladas, preço, nomes dos apps e logo.
   Nossa versão vende sites: telas dos sites que fizemos, loja virtual se montando,
   "Venda de qualquer lugar." indo do notebook para o celular e verbos do dia a dia de um
   site (Publique, Edite, Destaque, Ranqueie, Chega de template, Converta, Escale, Venda).
   Música: "BAILAR" (120 BPM) — cada corte cai no compasso; a pausa da faixa (46,5–47,5s)
   cai em "Publique.", como a pausa da referência.
============================================================================= */
const DURATION = 32;
const FORMATS = {
  "16x9": { w: 800, h: 450, label: "16:9" },
  "9x16": { w: 450, h: 800, label: "9:16" },
};
// u: escala dos objetos · txt: escala do texto · tall: retrato
const LAYOUTS = {
  "16x9": { u: 1, txt: 1, tall: false },
  "9x16": { u: 0.56, txt: 0.74, tall: true },
};
const T = {
  logoOut: 1.5, mosaic: 1.5, words: 3.5, dock: 5.5, store: 7.5, clip: 9.5, device: 11.5, phone: 13.6,
  publique: 15.5, edite: 17.5, destaque: 18.5, ranqueie: 19.5, template: 20.5, converta: 22.0, escale: 23.0,
  venda: 24.0, brush: 25.25, orcamento: 26.0, servicos: 28.0, logoEnd: 29.6,
};
const BG = "#000000";
const WHITE = "#F5F9FD";
const TEXT = { fontFamily: FONT, fontWeight: 700, letterSpacing: "-0.035em", color: WHITE, whiteSpace: "nowrap" };
const inWin = (t, a, b) => t >= a && t < b;

/* ---------- Logo com letras trocando de fonte ---------- */
const GLITCH_FONTS = [
  { fontFamily: DISPLAY_FONT, fontWeight: 800, fontStretch: "125%", textTransform: "uppercase" },
  { fontFamily: FONT, fontWeight: 800 },
  { fontFamily: "Georgia, 'DejaVu Serif', serif", fontWeight: 400, fontStyle: "italic" },
  { fontFamily: "'Courier New', 'DejaVu Sans Mono', monospace", fontWeight: 700 },
  { fontFamily: FONT, fontWeight: 600, fontStyle: "italic" },
  { fontFamily: "Georgia, 'DejaVu Serif', serif", fontWeight: 700 },
];
const GLITCH_COLORS = [C.cyan, C.sky, "#FFFFFF", C.blue, C.ice, "#7FDBFF"];
const NAME = "Estoke ao Cubo";
function GlitchLogo({ t, t0, settle, size, tagline, column = false }) {
  const lt = t - t0;
  const settled = t >= settle;
  const cube = spring(t - settle + 0.05, { stiffness: 170, damping: 12 });
  const tg = easeOut(prog(t, settle + 0.4, settle + 1.0));
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", flexDirection: column ? "column" : "row", alignItems: "center", gap: size * 0.35 }}>
        <div style={{ width: settled ? size * 1.15 : 0, height: column && !settled ? size * 1.25 : "auto", opacity: clamp(cube * 2), transform: `scale(${clamp(cube, 0, 1.2)}) rotate(${(1 - clamp(cube)) * -40}deg)`, transition: "none" }}>
          {settled && <CubeLogo size={size * 1.25} glow={0.8} />}
        </div>
        <div style={{ display: "flex", alignItems: "baseline", height: size * 1.2 }}>
          {[...NAME].map((ch, i) => {
            const on = lt > i * 0.035;
            if (!on) return <span key={i} style={{ display: "inline-block", width: ch === " " ? size * 0.3 : 0 }} />;
            if (ch === " ") return <span key={i} style={{ display: "inline-block", width: size * 0.3 }} />;
            if (settled) return <span key={i} style={{ ...DISP, fontSize: size, color: WHITE, lineHeight: 1 }}>{ch}</span>;
            const k = Math.floor(t * 14 + i * 3.7);
            const f = GLITCH_FONTS[k % GLITCH_FONTS.length];
            const col = GLITCH_COLORS[(k * 7 + i) % GLITCH_COLORS.length];
            return (
              <span key={i} style={{
                ...f, fontSize: size * (0.9 + 0.25 * rnd(k, i)), color: col, lineHeight: 1, display: "inline-block",
                transform: `translateY(${(rnd(k, i + 9) - 0.5) * size * 0.25}px)`,
              }}>{ch}</span>
            );
          })}
        </div>
      </div>
      {tagline && (
        <div style={{ ...TEXT, fontWeight: 600, fontSize: size * 0.5, color: hexA(C.ice, 0.85), marginTop: size * 0.5, opacity: tg, transform: `translateY(${(1 - tg) * 8}px)`, letterSpacing: "-0.01em" }}>
          {tagline}
        </div>
      )}
    </div>
  );
}

/* ---------- Mosaico de telas dos sites ---------- */
// Mistura equilibrada: ~40% Dizzy (inclusive a tela do centro), o resto dividido entre LCS, Noka e
// Misú, alternando para telas vizinhas serem sempre de sites diferentes.
// AD_TILES: [0, AD_DIZZY_TILES) = Dizzy; depois LCS, Noka, Misú intercalados (3 de cada).
function mosaicTile(r, c) {
  const site = (c + r * 2) % 5; // 0–1: Dizzy · 2: LCS · 3: Noka · 4: Misú
  const k = r * 7 + c * 3;
  if (site <= 1) return (k + site) % AD_DIZZY_TILES;
  return AD_DIZZY_TILES + ((k % 3) * 3 + (site - 2));
}
function Mosaic({ t, W, H, L }) {
  const lt = t - T.mosaic;
  const cols = L.tall ? 4 : 6;
  const rows = L.tall ? 9 : 5;
  const tw = 170;
  const th = 106;
  const gap = 12;
  const zoom = lerp(2.1, 1, easeOut(prog(lt, 0, 0.9))) * (L.tall ? 0.9 : 1);
  const out = easeIn(prog(lt, 1.75, 2.05));
  const scroll = lt * 26;
  const gw = cols * (tw + gap);
  const gh = rows * (th + gap);
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", opacity: 1 - out, filter: out > 0 ? `blur(${out * 8}px)` : "none" }}>
      <div style={{
        position: "absolute", left: W / 2 - gw / 2, top: H / 2 - gh / 2 - scroll, width: gw, height: gh,
        transform: `perspective(900px) rotateX(24deg) rotateZ(-10deg) scale(${zoom * (1 - out * 0.1)})`, transformOrigin: `50% ${50 + (scroll / gh) * 100}%`,
      }}>
        {Array.from({ length: cols * rows }, (_, i) => {
          const r = Math.floor(i / cols);
          const c = i % cols;
          const d = Math.hypot(c - (cols - 1) / 2, r - (rows - 1) / 2);
          const s = spring(lt - d * 0.05, { stiffness: 150, damping: 14 });
          return (
            <div key={i} style={{
              position: "absolute", left: c * (tw + gap), top: r * (th + gap), width: tw, height: th, borderRadius: 7, overflow: "hidden",
              opacity: clamp(s * 2), transform: `scale(${clamp(s, 0, 1.1)})`, boxShadow: "0 10px 24px rgba(0,0,0,.6)", background: "#111",
            }}>
              <img src={AD_TILES[mosaicTile(r, c)]} alt="" draggable={false} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at center, rgba(0,0,0,0) 40%, ${BG} 100%)` }} />
    </div>
  );
}

/* ---------- Frase em corte seco, palavra a palavra ---------- */
function CutLine({ t, steps, size }) {
  // steps: [[tempo, "texto visível"], ...]; troca seca a cada passo, com pequeno "pop"
  let cur = null;
  let at = 0;
  for (const [ts, txt] of steps) if (t >= ts) { cur = txt; at = ts; }
  if (!cur) return null;
  const p = spring(t - at, { stiffness: 320, damping: 20 });
  return (
    <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
      <div style={{ ...TEXT, fontSize: size, transform: `scale(${lerp(0.96, 1, clamp(p))})` }}>{cur}</div>
    </div>
  );
}

/* ---------- Dock de serviços ---------- */
const ICON_D = {
  site: "M3 5h18v14H3z M3 9h18 M6 7h.01 M8.5 7h.01",
  cart: "M3 4h2l2.4 10.5h10.2L20 7H6.2 M9 19.5h.01 M17 19.5h.01",
  seo: "M10.5 4a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13z M15.5 15.5L21 21",
  chat: "M4 12a8 8 0 1 1 3.5 6.6L4 20l1.4-3.6A8 8 0 0 1 4 12z",
  card: "M3 6h18v12H3z M3 10h18 M6 15h4",
  chart: "M4 20V10 M10 20V4 M16 20v-7 M22 20H2",
  globe: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M3 12h18 M12 3c3 3.5 3 14.5 0 18 M12 3c-3 3.5-3 14.5 0 18",
  phone: "M8 2h8v20H8z M11 18.5h2",
  lock: "M6 11h12v10H6z M8.5 11V8a3.5 3.5 0 0 1 7 0v3",
};
const DOCK = [
  ["site", `linear-gradient(145deg, ${C.sky}, ${C.blue})`],
  ["cart", "linear-gradient(145deg, #3DD6FF, #0077B6)"],
  ["seo", `linear-gradient(145deg, #7FDBFF, ${C.deep})`],
  ["chat", "linear-gradient(145deg, #4FE0B0, #0B8F6B)"],
  ["card", `linear-gradient(145deg, ${C.ice}, ${C.sky})`],
  ["chart", `linear-gradient(145deg, ${C.cyan}, ${C.blue})`],
  ["globe", `linear-gradient(145deg, ${C.blue}, ${C.ink})`],
  ["phone", `linear-gradient(145deg, #9FE7FF, ${C.blue})`],
  ["lock", `linear-gradient(145deg, ${C.deep}, ${C.night})`],
];
function LineGlyph({ name, size, color = "#FFFFFF", sw = 1.9 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} style={{ display: "block" }}>
      <path d={ICON_D[name]} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function Dock({ t, W, H, L }) {
  const lt = t - T.dock;
  const n = DOCK.length;
  const size = 64 * L.u * (L.tall ? 1.15 : 1);
  const gap = 12 * L.u;
  const show = DOCK.map((_, i) => spring(lt - 0.08 - Math.abs(i - (n - 1) / 2) * 0.07, { stiffness: 200, damping: 14 }));
  const wave = lerp(-2, n + 1, easeInOut(prog(lt, 1.0, 1.85)));
  const out = easeIn(prog(lt, 1.8, 2.0));
  const barW = n * (size + gap) + gap;
  return (
    <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", opacity: 1 - out, transform: `scale(${1 - out * 0.06})` }}>
      <div style={{
        position: "relative", width: barW, height: size + gap * 2, borderRadius: size * 0.42, display: "flex", alignItems: "flex-end", justifyContent: "center", gap,
        padding: gap, boxSizing: "border-box", background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.16)",
        backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", transform: `scaleX(${lerp(0.4, 1, easeOut(prog(lt, 0, 0.45)))})`,
      }}>
        {DOCK.map(([icon, bg], i) => {
          const mag = 1 + 0.42 * Math.exp(-((i - wave) ** 2) / 1.2);
          const s = clamp(show[i], 0, 1.2);
          return (
            <div key={icon} style={{
              width: size, height: size, flex: "0 0 auto", borderRadius: size * 0.24, background: bg, display: "grid", placeItems: "center",
              transform: `translateY(${-(mag - 1) * size * 0.5}px) scale(${s * mag})`, transformOrigin: "50% 100%", opacity: clamp(show[i] * 2),
              boxShadow: "inset 0 1px 0 rgba(255,255,255,.4), 0 8px 18px rgba(0,0,0,.45)",
            }}>
              <LineGlyph name={icon} size={size * 0.5} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- "Monte sua loja." → blocos montam uma loja ---------- */
// retângulos da loja em coordenadas de uma área 440×270 (centro em 0,0)
const STORE = [
  { x: -220, y: -135, w: 440, h: 30, bg: "rgba(255,255,255,.1)", r: 8 },
  { x: -206, y: -126, w: 54, h: 12, bg: C.cyan, r: 6 },
  { x: -40, y: -125, w: 34, h: 10, bg: "rgba(255,255,255,.35)", r: 5 },
  { x: 2, y: -125, w: 34, h: 10, bg: "rgba(255,255,255,.35)", r: 5 },
  { x: 44, y: -125, w: 34, h: 10, bg: "rgba(255,255,255,.35)", r: 5 },
  { x: 182, y: -128, w: 24, h: 16, bg: C.sky, r: 5, cart: true },
  { x: -220, y: -96, w: 440, h: 92, bg: GRAD, r: 12, hero: true },
  ...[0, 1, 2].flatMap((k) => {
    const x = -220 + k * 152;
    return [
      { x, y: 6, w: 136, h: 82, bg: [`linear-gradient(140deg, ${C.sky}, ${C.deep})`, `linear-gradient(140deg, ${C.cyan}, ${C.blue})`, `linear-gradient(140deg, ${C.ice}, ${C.sky})`][k], r: 10 },
      { x, y: 96, w: 96, h: 9, bg: "rgba(255,255,255,.55)", r: 4 },
      { x, y: 112, w: 58, h: 11, bg: C.cyan, r: 4, price: true },
      { x: x + 80, y: 109, w: 56, h: 18, bg: "#FFFFFF", r: 9, buy: true },
    ];
  }),
];
function Store({ t, W, H, L }) {
  const lt = t - T.store;
  const s = (L.tall ? 0.9 : 1.1) * (L.tall ? W / 480 : 1);
  const textP = spring(lt, { stiffness: 260, damping: 20 });
  const blast = prog(lt, 0.42, 0.5);
  const out = easeIn(prog(lt, 1.8, 2.0));
  const cart = spring(lt - 1.45, { stiffness: 300, damping: 12 });
  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - out }}>
      {blast < 1 && (
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", opacity: 1 - blast }}>
          <div style={{ ...TEXT, fontSize: 56 * L.txt, transform: `scale(${lerp(0.96, 1, clamp(textP)) * (1 + blast * 0.15)})`, filter: blast > 0 ? `blur(${blast * 6}px)` : "none" }}>Monte sua loja.</div>
        </div>
      )}
      <div style={{ position: "absolute", left: W / 2, top: H / 2, transform: `scale(${s * (1 - out * 0.08)})` }}>
        {STORE.map((b, i) => {
          const a = spring(lt - 0.45 - i * 0.025, { stiffness: 140, damping: 14 });
          if (a <= 0) return null;
          const fx = (rnd(i, 1) - 0.5) * 300;
          const fy = (rnd(i, 2) - 0.5) * 120;
          return (
            <div key={i} style={{
              position: "absolute", left: lerp(fx, b.x, clamp(a, 0, 1.1)), top: lerp(fy, b.y, clamp(a, 0, 1.1)), width: b.w, height: b.h, borderRadius: b.r,
              background: b.bg, opacity: clamp(a * 3), transform: `rotate(${(1 - clamp(a)) * (rnd(i, 3) - 0.5) * 90}deg)`,
              display: "grid", placeItems: "center", overflow: "hidden",
              boxShadow: b.hero ? `0 10px 30px ${hexA(C.blue, 0.4)}` : "none",
            }}>
              {b.hero && <div style={{ ...TEXT, fontSize: 20, opacity: clamp((lt - 0.9) * 4) }}>Coleção nova</div>}
              {b.buy && <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 9, color: C.ink, opacity: clamp((lt - 0.95) * 4) }}>Comprar</div>}
              {b.cart && cart > 0 && <div style={{ position: "absolute", right: -2, top: -2, width: 11, height: 11, borderRadius: 11, background: "#FFFFFF", color: C.ink, fontFamily: FONT, fontWeight: 800, fontSize: 8, display: "grid", placeItems: "center", transform: `scale(${clamp(cart, 0, 1.3)})` }}>1</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Notebook / celular ---------- */
// Vídeo da Dizzy (30fps, sincronizado com a timeline): começa quando o quadro abre entre as palavras
const CLIP_START = T.clip + 0.35;
function ClipVideo({ t }) {
  // leve ampliação (2%) esconde qualquer resíduo de borda do decodificador dentro da moldura
  return <SyncedVideo t={clamp(t - CLIP_START, 0, AD_CLIP_DUR - 0.04)} duration={AD_CLIP_DUR} webm={AD_CLIP_WEBM} mp4={AD_CLIP_MP4} style={{ transform: "scale(1.02)" }} />;
}
function SelectBox({ children, pad = 10, color = C.cyan }) {
  const h = (pos) => <div style={{ position: "absolute", width: 7, height: 7, background: "#FFFFFF", border: `1.5px solid ${color}`, boxSizing: "border-box", ...pos }} />;
  return (
    <div style={{ position: "relative", padding: pad, border: `1.5px solid ${color}` }}>
      {children}
      {h({ left: -4, top: -4 })}{h({ right: -4, top: -4 })}{h({ left: -4, bottom: -4 })}{h({ right: -4, bottom: -4 })}
      {h({ left: "calc(50% - 3.5px)", top: -4 })}{h({ left: "calc(50% - 3.5px)", bottom: -4 })}
    </div>
  );
}
// "Mostre ▢ seu trabalho." → o quadro com o site abre entre as palavras, ocupa a tela, vira a tela do
// notebook e depois o celular. É um único quadro (e um único <video>) do começo ao fim: nada recarrega.
function ClipAndDevice({ t, W, H, L }) {
  const lt = t - T.clip;
  const fs = L.tall ? 30 : 54;
  const open = easeInOut(prog(lt, 0.35, 0.85));
  const full = easeInOut(prog(lt, 1.15, 1.55));
  const toLap = easeInOut(prog(lt, 1.75, 2.25));
  const toPhone = easeInOut(prog(t, T.phone, T.phone + 0.6));
  const out = easeIn(prog(t, T.publique - 0.2, T.publique));
  if (lt < 0 || out >= 1) return null;
  const cx = W / 2;
  // notebook e celular
  const lw = L.tall ? 400 : 470;
  const lh = lw * 0.62;
  const ly = H / 2 - (L.tall ? 40 : 18);
  const pw = L.tall ? 230 : 170;
  const ph = pw * 2.05;
  const sw = lerp(lw, pw, toPhone);
  const sh = lerp(lh, ph, toPhone);
  const sy = lerp(ly, H / 2, toPhone);
  // quadro entre as palavras (posição pela largura real das palavras)
  const adv = (str) => measure(str, fs, false, 700) - str.length * fs * 0.035;
  const wl = adv("Mostre");
  const wr = adv("seu trabalho.");
  const gap = fs * 0.28;
  const cw = 150 * L.txt * 1.2 * open;
  const chh = lerp(fs * 0.9, fs * 1.4, open);
  const total = wl + gap + cw + gap + wr;
  const left0 = cx - total / 2;
  const boxCx0 = left0 + wl + gap + cw / 2;
  // retângulo do vídeo/tela em cada fase (contínuo entre elas)
  let rect;
  if (lt < 1.55) rect = { cx: lerp(boxCx0, cx, full), cy: H / 2, w: lerp(cw, W, full), h: lerp(chh, H, full), r: lerp(10, 0, full), bd: 0 };
  else rect = { cx, cy: lerp(H / 2, sy, toLap), w: lerp(W, sw, toLap), h: lerp(H, sh, toLap), r: lerp(0, lerp(10, 28, toPhone), toLap), bd: lerp(0, lerp(8, 7, toPhone), toLap) };
  const words = [["Venda", 0.65], ["de qualquer", 1.05], ["lugar.", 1.45]].filter(([, d]) => t >= T.device + d).map(([w]) => w);
  const showText = t >= T.device + 0.6;
  const grad = prog(t, T.phone + 0.2, T.phone + 0.7);
  const hue = (t - T.phone) * 0.6;
  const tap = t - (T.phone + 1.55);
  const phoneLines = toPhone > 0.5;
  const textFs = phoneLines
    ? fitSize("de qualquer", sw - 64, 40, false)
    : fitSize(words.join(" ") || "Venda", sw - 70, 44 * (L.tall ? 0.85 : 1), false);
  const base = 1 - toPhone;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - out, transform: `scale(${1 - out * 0.08}) rotate(${Math.sin(t * 1.3) * 0.6 * toPhone}deg)`, transformOrigin: `${cx}px ${H / 2}px` }}>
      {full < 1 && (
        <>
          <div style={{ ...TEXT, position: "absolute", left: left0, top: H / 2, transform: "translateY(-50%)", fontSize: fs, opacity: 1 - prog(full, 0, 0.45) }}>Mostre</div>
          <div style={{ ...TEXT, position: "absolute", left: left0 + wl + gap + cw + gap, top: H / 2, transform: "translateY(-50%)", fontSize: fs, opacity: 1 - prog(full, 0, 0.45) }}>seu trabalho.</div>
        </>
      )}
      {/* base do notebook */}
      {toLap > 0 && base > 0 && (
        <div style={{
          position: "absolute", left: cx - lw * 0.62, top: ly + lh / 2 + 2, width: lw * 1.24, height: 12, borderRadius: "0 0 14px 14px",
          background: "linear-gradient(180deg, #3A4352, #12161D)", opacity: toLap * base, boxShadow: "0 14px 30px rgba(0,0,0,.6)",
        }} />
      )}
      <div style={{
        position: "absolute", left: rect.cx - rect.w / 2, top: rect.cy - rect.h / 2, width: rect.w, height: rect.h, boxSizing: "border-box", overflow: "hidden",
        borderRadius: rect.r, border: rect.bd > 0.2 ? `${rect.bd}px solid #0D1016` : "none", opacity: open > 0 ? 1 : 0,
        boxShadow: lt < 1.55 ? `0 0 0 1px rgba(255,255,255,.2), 0 10px 40px ${hexA(C.blue, 0.35)}` : toLap > 0 ? `0 0 0 1px rgba(255,255,255,.12), 0 30px 60px rgba(0,0,0,.6), 0 0 60px ${hexA(C.blue, 0.25 * grad)}` : "none",
        background: grad > 0 ? `linear-gradient(${150 + hue * 30}deg, ${C.deep} 0%, ${C.blue} 45%, ${C.cyan} 100%)` : "#05070B",
      }}>
        {!showText && <ClipVideo t={t} />}
        {showText && (
          <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", padding: 14 }}>
            <SelectBox pad={8} color={grad > 0.5 ? "#FFFFFF" : C.cyan}>
              <div style={{ ...TEXT, fontSize: textFs, lineHeight: 1.02, whiteSpace: phoneLines ? "normal" : "nowrap", width: phoneLines ? sw - 70 : "auto", textAlign: "left" }}>
                {phoneLines ? <>Venda<br />de qualquer<br />lugar.</> : words.join(" ")}
              </div>
            </SelectBox>
          </div>
        )}
        {toPhone > 0.6 && <div style={{ position: "absolute", left: "50%", top: 6, width: 54, height: 14, marginLeft: -27, borderRadius: 10, background: "#0D1016", opacity: prog(toPhone, 0.6, 1) }} />}
      </div>
      {tap > 0 && tap < 0.7 && (() => {
        const r = 12 + tap * 90;
        return <div style={{ position: "absolute", left: cx + 30 - r, top: H / 2 + 60 - r, width: r * 2, height: r * 2, borderRadius: "50%", border: "2px solid rgba(255,255,255,.8)", opacity: 1 - tap / 0.7 }} />;
      })()}
    </div>
  );
}

/* ---------- Partículas de texto ("Publique.") ---------- */
const glyphCache = new Map();
function glyphPoints(text, size, step) {
  const font = `700 ${size}px 'Open Sauce Sans'`;
  const ready = typeof document !== "undefined" && document.fonts && document.fonts.check(font);
  const key = `${text}|${size}|${step}|${ready}`;
  if (glyphCache.has(key)) return glyphCache.get(key);
  const cv = document.createElement("canvas");
  const ctx = cv.getContext("2d");
  ctx.font = font;
  const w = Math.ceil(ctx.measureText(text).width) + 20;
  const h = Math.ceil(size * 1.4);
  cv.width = w;
  cv.height = h;
  ctx.font = font;
  ctx.fillStyle = "#fff";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 10, h / 2);
  const d = ctx.getImageData(0, 0, w, h).data;
  const pts = [];
  for (let y = 0; y < h; y += step) for (let x = 0; x < w; x += step) if (d[(y * w + x) * 4 + 3] > 140) pts.push([x - w / 2, y - h / 2]);
  glyphCache.set(key, pts);
  return pts;
}
function ParticleText({ t, W, H, L }) {
  const ref = useRef(null);
  const lt = t - T.publique;
  const size = Math.round(78 * L.txt);
  useLayoutEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const dpr = window.devicePixelRatio || 1;
    if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    const ctx = cv.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const pts = glyphPoints("Publique.", size, 3);
    const burst = easeOut(prog(lt, 0.5, 1.1)); // dissolve (na pausa da música)
    const back = easeInOut(prog(lt, 1.15, 1.7)); // reconverge em ciano
    const solid = 1 - prog(lt, 0.45, 0.6);
    const out = prog(lt, 1.85, 2.0);
    pts.forEach(([x, y], i) => {
      const a = rnd(i, 1) * Math.PI * 2;
      const dist = (40 + rnd(i, 2) * 220) * L.u * (L.tall ? 1.4 : 1);
      const k = burst * (1 - back);
      const px = W / 2 + x + Math.cos(a) * dist * k + Math.sin(lt * 3 + i) * 2 * k;
      const py = H / 2 + y + Math.sin(a) * dist * k * 0.7 + k * k * 40;
      const tw = 0.5 + 0.5 * Math.sin(lt * 18 + i * 1.7);
      const col = back > 0.2 ? C.cyan : (i % 3 ? WHITE : C.ice);
      ctx.globalAlpha = (1 - solid) * (1 - out) * (back > 0.9 ? 1 - prog(lt, 1.7, 1.85) : 0.55 + 0.45 * tw);
      ctx.fillStyle = col;
      const r = 1.1 + (k > 0.1 ? rnd(i, 4) * 1.2 : 0);
      ctx.fillRect(px - r / 2, py - r / 2, r, r);
    });
    ctx.globalAlpha = 1;
  });
  const solidA = 1 - prog(lt, 0.45, 0.6);
  const finalA = prog(lt, 1.6, 1.75) * (1 - prog(lt, 1.85, 2.0));
  const p = spring(lt, { stiffness: 260, damping: 20 });
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <canvas ref={ref} style={{ position: "absolute", left: 0, top: 0, width: W, height: H }} />
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
        <div style={{ ...TEXT, fontSize: size, opacity: solidA, transform: `scale(${lerp(0.96, 1, clamp(p))})` }}>Publique.</div>
      </div>
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
        <div style={{ ...TEXT, fontSize: size, color: C.cyan, opacity: finalA, textShadow: `0 0 24px ${hexA(C.cyan, 0.7)}` }}>Publique.</div>
      </div>
    </div>
  );
}

/* ---------- Rajada de verbos ---------- */
function Verb({ children, size, style }) {
  return <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}><div style={{ ...TEXT, fontSize: size, ...style }}>{children}</div></div>;
}
function Edite({ t, L }) {
  const lt = t - T.edite;
  const box = easeOut(prog(lt, 0.05, 0.25));
  const grow = spring(lt - 0.45, { stiffness: 260, damping: 13 });
  const caret = Math.floor(lt * 4) % 2 === 0;
  return (
    <Verb size={64 * L.txt}>
      <div style={{ transform: `scale(${1 + clamp(grow, 0, 1.2) * 0.12})`, opacity: 1 }}>
        <div style={{ opacity: box, position: "relative" }}>
          <SelectBox pad={10}>
            <span>Edite.</span>
            <span style={{ display: "inline-block", width: 3, height: "0.9em", marginLeft: 4, background: C.cyan, verticalAlign: "-0.1em", opacity: caret ? 1 : 0 }} />
          </SelectBox>
        </div>
      </div>
    </Verb>
  );
}
function Destaque({ t, L }) {
  const lt = t - T.destaque;
  const hl = easeInOut(prog(lt, 0.08, 0.4));
  const size = 64 * L.txt;
  return (
    <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
      <div style={{ position: "relative", ...TEXT, fontSize: size, padding: "0 0.18em" }}>
        <div style={{ position: "absolute", left: 0, top: "8%", bottom: "4%", width: `${hl * 100}%`, background: GRAD_LIGHT, borderRadius: 6, transform: "skewX(-8deg)" }} />
        <span style={{ position: "relative" }}>Destaque.</span>
        <span style={{ position: "absolute", left: "0.18em", top: 0, color: C.ink, clipPath: `inset(0 ${100 - hl * 100}% 0 0)` }}>Destaque.</span>
      </div>
    </div>
  );
}
function Ranqueie({ t, L }) {
  const lt = t - T.ranqueie;
  const word = "Ranqueie.";
  const size = 58 * L.txt;
  const arrow = easeOut(prog(lt, 0.45, 0.7));
  return (
    <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
      <div style={{ position: "relative", display: "flex", alignItems: "flex-end", transform: `translateY(${size * 0.6}px)` }}>
        {[...word].map((ch, i) => {
          const s = spring(lt - i * 0.035, { stiffness: 220, damping: 15 });
          const rise = i * size * 0.13;
          return (
            <span key={i} style={{
              ...TEXT, fontSize: size, display: "inline-block", opacity: clamp(s * 2),
              transform: `translateY(${-rise * clamp(s, 0, 1.15) + (1 - clamp(s)) * 20}px) rotate(${-8 * clamp(s)}deg)`,
              color: i >= word.length - 3 ? C.cyan : WHITE,
            }}>{ch}</span>
          );
        })}
        <svg width={size * 0.9} height={size * 1.6} viewBox="0 0 30 50" style={{ marginLeft: size * 0.15, transform: `translateY(${-word.length * size * 0.13 - size * 0.4}px)`, opacity: arrow, overflow: "visible" }}>
          <path d="M4 46 L24 6 M12 8 L24 6 L26 18" fill="none" stroke={C.cyan} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
            pathLength="1" strokeDasharray="1" strokeDashoffset={1 - arrow} />
        </svg>
      </div>
    </div>
  );
}
// "Chega de template." — as letras caem numa lixeira de vidro
function Template({ t, W, H, L }) {
  const lt = t - T.template;
  const word = "Chega de template.";
  const size = 50 * L.txt;
  const binIn = spring(lt - 0.35, { stiffness: 140, damping: 14 });
  const binX = W / 2;
  const binY = H / 2 + (L.tall ? 150 : 95);
  const out = easeIn(prog(lt, 1.35, 1.5));
  const wobble = Math.sin(Math.max(0, lt - 1.0) * 24) * Math.exp(-Math.max(0, lt - 1.0) * 6) * 6 * (lt > 1.0 ? 1 : 0);
  const track = size * 0.035; // letterSpacing -0.035em do TEXT
  const adv = (n) => measure(word.slice(0, n), size, false, 700) - n * track;
  const total = adv(word.length);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - out }}>
      {[...word].map((ch, i) => {
        const x0 = W / 2 - total / 2 + (adv(i) + adv(i + 1)) / 2;
        const y0 = H / 2 - (L.tall ? 60 : 40);
        const appear = spring(lt - i * 0.012, { stiffness: 260, damping: 18 });
        const fall = easeIn(prog(lt, 0.55 + i * 0.022, 0.95 + i * 0.022));
        const x = lerp(x0, binX + (rnd(i, 3) - 0.5) * 30, fall);
        const y = lerp(y0, binY + 10, fall) - Math.sin(fall * Math.PI) * 40;
        if (fall >= 1) return null;
        return (
          <span key={i} style={{
            ...TEXT, position: "absolute", left: x, top: y, fontSize: size, opacity: clamp(appear * 2) * (1 - prog(fall, 0.85, 1)),
            transform: `translate(-50%, -50%) rotate(${fall * (rnd(i, 4) - 0.5) * 400}deg) scale(${1 - fall * 0.5})`,
          }}>{ch}</span>
        );
      })}
      {binIn > 0 && (
        <div style={{ position: "absolute", left: binX, top: binY, transform: `translate(-50%, -50%) translateY(${(1 - clamp(binIn)) * 60}px) rotate(${wobble}deg)`, opacity: clamp(binIn * 2) }}>
          <svg width={70 * L.u * (L.tall ? 1.6 : 1)} height={80 * L.u * (L.tall ? 1.6 : 1)} viewBox="0 0 70 80">
            <defs>
              <linearGradient id="bin-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFFFFF" stopOpacity=".45" /><stop offset="1" stopColor="#FFFFFF" stopOpacity=".08" /></linearGradient>
            </defs>
            <path d="M8 10 H62 L56 76 Q55 79 52 79 H18 Q15 79 14 76 Z" fill="url(#bin-g)" stroke="rgba(255,255,255,.55)" strokeWidth="1.5" />
            <ellipse cx="35" cy="10" rx="27" ry="5" fill="rgba(255,255,255,.18)" stroke="rgba(255,255,255,.6)" strokeWidth="1.5" />
            {lt > 1.0 && [0, 1, 2, 3, 4].map((k) => <circle key={k} cx={22 + k * 6.5} cy={64 - (k % 2) * 7} r={6} fill={[C.sky, C.ice, C.cyan, "#FFFFFF", C.blue][k]} opacity=".85" />)}
          </svg>
        </div>
      )}
    </div>
  );
}
function Converta({ t, L }) {
  const lt = t - T.converta;
  const word = "Converta.";
  const size = 64 * L.txt;
  const done = prog(lt, 0.5, 0.65);
  return (
    <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
      <div style={{ display: "flex" }}>
        {[...word].map((ch, i) => {
          const s = spring(lt - 0.05 - i * 0.03, { stiffness: 170, damping: 13 });
          const dx = (rnd(i, 7) - 0.5) * size * 4;
          const dy = (rnd(i, 8) - 0.5) * size * 2;
          return (
            <span key={i} style={{
              ...TEXT, fontSize: size, display: "inline-block", color: done > 0.5 ? C.cyan : WHITE,
              transform: `translate(${dx * (1 - clamp(s))}px, ${dy * (1 - clamp(s))}px) rotate(${(1 - clamp(s)) * (rnd(i, 9) - 0.5) * 180}deg)`,
              opacity: clamp(s * 3), textShadow: done > 0.5 ? `0 0 18px ${hexA(C.cyan, 0.5)}` : "none",
            }}>{ch}</span>
          );
        })}
      </div>
    </div>
  );
}
// "Escale." — scanline: o que passou fica nítido, o resto pixelado
function Escale({ t, W, H, L }) {
  const ref = useRef(null);
  const lt = t - T.escale;
  const size = Math.round(70 * L.txt);
  const scan = easeInOut(prog(lt, 0.12, 0.7));
  useLayoutEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const pw = Math.round(W / 9);
    const ph = Math.round(H / 9);
    if (cv.width !== pw) { cv.width = pw; cv.height = ph; }
    const ctx = cv.getContext("2d");
    ctx.clearRect(0, 0, pw, ph);
    ctx.fillStyle = WHITE;
    ctx.font = `700 ${size / 9}px 'Open Sauce Sans'`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Escale.", pw / 2, ph / 2);
  });
  const x = lerp(W * 0.18, W * 0.82, scan);
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <canvas ref={ref} style={{ position: "absolute", left: 0, top: 0, width: W, height: H, imageRendering: "pixelated", clipPath: `inset(0 0 0 ${x}px)` }} />
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", clipPath: `inset(0 ${W - x}px 0 0)` }}>
        <div style={{ ...TEXT, fontSize: size }}>Escale.</div>
      </div>
      {scan > 0 && scan < 1 && (
        <div style={{ position: "absolute", left: x - 1, top: H / 2 - size * 0.75, width: 2, height: size * 1.5, background: C.cyan, boxShadow: `0 0 14px 3px ${hexA(C.cyan, 0.7)}` }} />
      )}
    </div>
  );
}
function Venda({ t, W, H, L }) {
  const lt = t - T.venda;
  const size = 96 * L.txt;
  const p = spring(lt, { stiffness: 200, damping: 14 });
  const glow = 0.6 + 0.4 * Math.sin(lt * 6);
  const sweep = prog(lt, 0.25, 0.85);
  return (
    <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
      <div style={{ position: "relative", transform: `scale(${lerp(0.9, 1, clamp(p, 0, 1.1))})` }}>
        <div style={{
          ...TEXT, fontSize: size, backgroundImage: `linear-gradient(100deg, ${C.sky} 0%, #FFFFFF ${sweep * 100 - 10}%, #FFFFFF ${sweep * 100}%, ${C.cyan} ${sweep * 100 + 12}%, ${C.blue} 100%)`,
          WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent",
          filter: `drop-shadow(0 0 ${18 * glow}px ${hexA(C.cyan, 0.75)}) drop-shadow(0 0 ${44 * glow}px ${hexA(C.blue, 0.5)})`,
        }}>Venda.</div>
        {Array.from({ length: 10 }, (_, i) => {
          const ph = (lt * 0.9 + rnd(i, 1)) % 1;
          const a = rnd(i, 2) * Math.PI * 2;
          const r = size * (0.6 + ph * 0.9);
          return <div key={i} style={{ position: "absolute", left: "50%", top: "50%", width: 4, height: 4, borderRadius: 4, background: "#FFFFFF", boxShadow: `0 0 8px ${C.cyan}`, transform: `translate(${Math.cos(a) * r}px, ${Math.sin(a) * r * 0.5}px)`, opacity: Math.sin(ph * Math.PI) * clamp(lt * 3) }} />;
        })}
      </div>
    </div>
  );
}

/* ---------- Pinceladas (transição) ---------- */
const STROKES = [C.blue, C.cyan, C.sky, C.ice, C.blue, C.cyan, "#7FDBFF", C.sky];
function Brush({ t, W, H }) {
  const lt = t - T.brush;
  if (lt < 0 || lt > 0.95) return null;
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 60, overflow: "hidden" }}>
      {STROKES.map((col, i) => {
        const a = easeOut(prog(lt, i * 0.025, 0.32 + i * 0.025));
        const b = easeIn(prog(lt, 0.5 + i * 0.02, 0.85 + i * 0.02));
        const len = Math.hypot(W, H) * 0.75;
        const x = W * (0.08 + i * 0.12);
        const y = H * (0.2 + rnd(i, 3) * 0.6);
        return (
          <div key={i} style={{
            position: "absolute", left: x, top: y, width: 34 + rnd(i, 4) * 26, height: len, borderRadius: 40,
            background: `linear-gradient(180deg, ${hexA(col, 0)}, ${col} 25%, ${col} 75%, ${hexA(col, 0)})`,
            transform: `translate(-50%, -50%) rotate(${28 + rnd(i, 5) * 14}deg) scaleY(${a * (1 - b)}) translateY(${(b - (1 - a)) * len * 0.5}px)`,
            opacity: 0.92, filter: "blur(0.6px)",
          }} />
        );
      })}
    </div>
  );
}

/* ---------- Orçamento e serviços ---------- */
function Orcamento({ t, L }) {
  const lt = t - T.orcamento;
  const rev = easeOut(prog(lt, 0.05, 0.6));
  const out = easeIn(prog(lt, 1.8, 2.0));
  return (
    <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", opacity: 1 - out }}>
      <div style={{ ...TEXT, fontSize: 46 * L.txt, clipPath: `inset(-20% ${(1 - rev) * 100}% -20% 0)`, whiteSpace: L.tall ? "normal" : "nowrap", textAlign: "center", maxWidth: L.tall ? 380 : "none", lineHeight: 1.08 }}>
        Solicite seu <span style={{ color: C.cyan }}>orçamento.</span>
      </div>
    </div>
  );
}
const SERVICES = [
  [["Sites institucionais", C.cyan, "site"], ["Lojas virtuais", C.sky, "cart"]],
  [["Landing pages", "#7FDBFF", "chart"], ["Gestão de estoque", C.ice, "seo"]],
];
function Servicos({ t, L }) {
  const lt = t - T.servicos;
  const set = lt < 0.8 ? 0 : 1;
  const st = lt - set * 0.8;
  const out = easeIn(prog(lt, 1.45, 1.6));
  return (
    <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", opacity: 1 - out }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 * L.txt }}>
        {SERVICES[set].map(([name, col, icon], i) => {
          const s = spring(st - i * 0.08, { stiffness: 220, damping: 17 });
          const leave = set === 0 ? easeIn(prog(lt, 0.68, 0.8)) : 0;
          return (
            <div key={name} style={{
              display: "flex", alignItems: "center", gap: 12 * L.txt, opacity: clamp(s * 2) * (1 - leave),
              transform: `translateY(${(1 - clamp(s)) * 24 - leave * 16}px)`, filter: leave > 0 ? `blur(${leave * 6}px)` : "none",
            }}>
              <div style={{ width: 40 * L.txt, height: 40 * L.txt, borderRadius: 10 * L.txt, background: `linear-gradient(145deg, ${col}, ${C.blue})`, display: "grid", placeItems: "center" }}>
                <LineGlyph name={icon} size={22 * L.txt} />
              </div>
              <div style={{ ...TEXT, fontSize: 40 * L.txt, color: col }}>{name}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Frame({ t, format = "16x9" }) {
  const F = FORMATS[format];
  const L = LAYOUTS[format];
  const W = F.w;
  const H = F.h;
  const p = { t, W, H, L };
  const logoOut = easeIn(prog(t, 1.3, 1.5));
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: BG, fontFamily: FONT }}>
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 50% 55%, ${hexA(C.ink, 0.55)} 0%, rgba(0,0,0,0) 65%)` }} />
      {t < T.logoOut && (
        <div style={{ position: "absolute", inset: 0, opacity: 1 - logoOut, transform: `scale(${1 + logoOut * 0.6})`, filter: logoOut > 0 ? `blur(${logoOut * 8}px)` : "none" }}>
          <GlitchLogo t={t} t0={0.05} settle={0.95} size={L.tall ? 30 : 50} column={L.tall} />
        </div>
      )}
      {inWin(t, T.mosaic, T.words) && <Mosaic {...p} />}
      {inWin(t, T.words, T.dock) && <CutLine t={t} size={58 * L.txt} steps={[[T.words, "Um"], [T.words + 0.4, "Um site."], [T.words + 1.0, "Vendas"], [T.words + 1.4, "Vendas 24 horas."]]} />}
      {inWin(t, T.dock, T.store) && <Dock {...p} />}
      {inWin(t, T.store, T.clip) && <Store {...p} />}
      {inWin(t, T.clip, T.publique) && <ClipAndDevice {...p} />}
      {inWin(t, T.publique, T.edite) && <ParticleText {...p} />}
      {inWin(t, T.edite, T.destaque) && <Edite {...p} />}
      {inWin(t, T.destaque, T.ranqueie) && <Destaque {...p} />}
      {inWin(t, T.ranqueie, T.template) && <Ranqueie {...p} />}
      {inWin(t, T.template, T.converta) && <Template {...p} />}
      {inWin(t, T.converta, T.escale) && <Converta {...p} />}
      {inWin(t, T.escale, T.venda) && <Escale {...p} />}
      {inWin(t, T.venda, T.brush + 0.45) && <Venda {...p} />}
      <Brush {...p} />
      {inWin(t, T.orcamento, T.servicos) && <Orcamento {...p} />}
      {inWin(t, T.servicos, T.logoEnd) && <Servicos {...p} />}
      {t >= T.logoEnd && <GlitchLogo t={t} t0={T.logoEnd} settle={T.logoEnd + 0.85} size={L.tall ? 30 : 50} column={L.tall} tagline="Sites e lojas virtuais que vendem." />}
      <Grain t={t} opacity={0.05} />
    </div>
  );
}

/* =============================================================================
   Som — "BAILAR" (120 BPM) com o drop no mosaico; efeitos gravados (Mixkit), baixos,
   só onde a imagem pede (golpe de cada efeito alinhado ao corte)
============================================================================= */
const MUSIC = { drop: 2.02, gain: 0.5 }; // drop da faixa (32,02s) dentro do trecho embutido (começa em 30s)
const SAMPLES = { music: MUSIC_AD.bailarAd, ...SFX };
function buildEvents() {
  const ev = [];
  const fx = (at, name, gain, opts = {}) => ev.push({ t: Math.max(0, at - SFX_PEAK[name] / (opts.rate || 1)), fn: (A, w) => A.sample(name, w, { gain, ...opts }) });
  const off0 = MUSIC.drop - T.mosaic;
  const endF = off0 + DURATION;
  ev.push({
    t: 0, dur: DURATION,
    fn: (A, w, off = 0) => A.sample("music", w, {
      off: off0 + off, dur: DURATION - off, gain: MUSIC.gain, fadeIn: 0.03,
      env: [[0, 1.6], [MUSIC.drop - 0.1, 1.6], [MUSIC.drop, 1], [endF - 1.3, 1], [endF, 0]],
    }),
  });
  ev.push({ t: 0.05, fn: (A, w) => A.sample("glitch", w, { gain: 0.12, dur: 1.0, fadeOut: 0.2 }) });
  fx(0.95, "glitchBreak", 0.14);
  fx(T.mosaic + 0.05, "windSwoosh", 0.18);
  DOCK.forEach((_, i) => fx(T.dock + 0.1 + Math.abs(i - 4) * 0.07, "bubblePop", 0.04, { rate: 0.9 + (4 - Math.abs(i - 4)) * 0.06 }));
  fx(T.dock + 1.2, "smallSweep", 0.1);
  fx(T.store + 0.45, "airSweep", 0.13);
  fx(T.store + 1.45, "dryPop", 0.1);
  fx(T.clip + 0.4, "smallSweep", 0.11);
  fx(T.clip + 1.3, "airWhoosh", 0.16);
  fx(T.clip + 2.0, "shortWind", 0.1);
  fx(T.device + 0.65, "mouseClose", 0.14);
  fx(T.phone + 0.3, "windSwoosh", 0.14);
  fx(T.phone + 1.55, "mouseClick", 0.2);
  fx(T.publique + 0.55, "sparkleSweep", 0.14);
  fx(T.publique + 1.65, "sparkleTouch", 0.12);
  fx(T.edite + 0.08, "mouseClick", 0.22);
  fx(T.destaque + 0.1, "marker", 0.22);
  fx(T.ranqueie + 0.2, "airSweep", 0.1, { rate: 1.12 });
  fx(T.template + 0.75, "crumple", 0.2);
  fx(T.template + 1.0, "paperTrash", 0.16);
  fx(T.converta + 0.2, "smallSweep", 0.11);
  fx(T.escale + 0.3, "techSlide", 0.2);
  fx(T.venda + 0.05, "sparkleTouch", 0.14);
  fx(T.brush + 0.2, "windSwoosh", 0.2);
  fx(T.orcamento + 0.1, "dryPop", 0.1);
  fx(T.servicos + 0.05, "smallSweep", 0.09);
  fx(T.servicos + 0.85, "smallSweep", 0.09, { rate: 1.06 });
  ev.push({ t: T.logoEnd, fn: (A, w) => A.sample("glitch", w, { gain: 0.1, dur: 0.85, fadeOut: 0.2 }) });
  fx(T.logoEnd + 0.85, "glitchBreak", 0.13);
  fx(T.logoEnd + 0.9, "logoImpact", 0.12);
  return ev.sort((a, b) => a.t - b.t);
}
const EVENTS = buildEvents();
const renderWav = () => renderEventsWav(EVENTS, DURATION, { samples: SAMPLES });

// Usado pelo exportador de vídeo (scripts/export-video.cjs)
const MOTION = { Frame, duration: DURATION, formats: FORMATS, renderWav };

export default function SiteAd() {
  return (
    <MotionPlayer Frame={Frame} duration={DURATION} events={EVENTS} formats={FORMATS} defaultFormat="16x9" renderWav={renderWav} samples={SAMPLES}
      fontsToLoad={[`800 16px "Open Sauce Sans"`]}
      scenes={[
        { name: "Logo", from: 0 },
        { name: "Mosaico", from: T.mosaic },
        { name: "Um site", from: T.words },
        { name: "Serviços", from: T.dock },
        { name: "Loja", from: T.store },
        { name: "Trabalho", from: T.clip },
        { name: "Qualquer lugar", from: T.device },
        { name: "Verbos", from: T.publique },
        { name: "Orçamento", from: T.orcamento },
        { name: "Logo final", from: T.logoEnd },
      ]} />
  );
}
