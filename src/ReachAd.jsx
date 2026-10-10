import React from "react";
import {
  C, FONT, DISP, clamp, lerp, prog, easeOut, easeIn, easeInOut, rnd, spring, hexA,
  Grain, CubeLogo, SyncedVideo, renderEventsWav, MotionPlayer,
} from "./motionKit";
import { AD_TILES, AD_CLIP_MP4, AD_CLIP_WEBM, AD_CLIP_DUR } from "./adAssets";
import { REACH_TRAMA } from "./reachAssets";
import { MUSIC_REACH } from "./audio/alexaReach";
import { SFX, SFX_PEAK } from "./audio/sfx";

/* =============================================================================
   Estoke ao Cubo — "Amplie seu alcance" (anúncio de sites, 31s)
   Referência: anúncio Freepik → Magnific (16:9, 31s): pilhas de imagens caindo em 3D
   com palavras pequenas, anel de imagens girando, "EXPAND YOUR REACH" com as imagens
   explodindo do centro, imagens deslizando, lista de ferramentas rolando, moldura de
   seleção se deformando, imagens em tela cheia com texto gigante ("REWRITE THE RULES",
   "DREAM BIGGER", "MUCH BIGGER"), feixes de luz em V e a logo no fundo claro.
   Nossa versão: as imagens são telas dos 9 sites que fizemos; "VENDER MAIS" sobre o
   vídeo da Dizzy, "IR ALÉM" sobre a foto da Trama e "MUITO ALÉM" com a câmera recuando
   de um site até o mural com todos; fecha com "vendas." e a logo.
   Música: "Alexa 2" (EMANVEL) — forte no começo, pausa enquanto a lista e a moldura
   aparecem e o drop (17,47s da faixa) cai exatamente nas imagens em tela cheia.
============================================================================= */
const DURATION = 31;
const FORMATS = {
  "16x9": { w: 800, h: 450, label: "16:9" },
  "9x16": { w: 450, h: 800, label: "9:16" },
};
const LAYOUTS = {
  "16x9": { u: 1, txt: 1, tall: false },
  "9x16": { u: 0.62, txt: 0.78, tall: true },
};
const T = {
  stacks: 0, ring: 1.9, expand: 4.4, burst: 6.0, flow: 7.3, list: 9.6, select: 13.2, big: 16.0,
  big2: 18.0, big3: 19.6, beams: 23.0, light: 27.0, lockup: 28.2,
};
const NAVY = "#000E26";
const WHITE = "#F5F9FD";
const SMALL = { fontFamily: FONT, fontWeight: 600, color: WHITE, letterSpacing: "-0.01em", whiteSpace: "nowrap" };
const inWin = (t, a, b) => t >= a && t < b;
const tile = (i) => AD_TILES[((i % AD_TILES.length) + AD_TILES.length) % AD_TILES.length];

function Card({ i, w, h, style }) {
  return (
    <div style={{ position: "absolute", width: w, height: h, borderRadius: 6, overflow: "hidden", background: "#111", boxShadow: "0 10px 26px rgba(0,0,0,.55)", ...style }}>
      <img src={tile(i)} alt="" draggable={false} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
    </div>
  );
}
// Palavras em corte seco (centro da tela)
function Cut({ t, steps, style, out }) {
  let cur = null;
  let at = 0;
  for (const [ts, txt] of steps) if (t >= ts) { cur = txt; at = ts; }
  if (!cur || (out != null && t >= out)) return null;
  const p = spring(t - at, { stiffness: 320, damping: 20 });
  return (
    <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", zIndex: 30 }}>
      <div style={{ ...SMALL, ...style, transform: `scale(${lerp(0.94, 1, clamp(p))})` }}>{cur}</div>
    </div>
  );
}

/* ---------- 0–1,9s: pilhas de cards caindo ---------- */
function Stacks({ t, W, H, L }) {
  const cw = (L.tall ? 230 : 200) * (L.tall ? 1 : 1);
  const ch = cw * 0.62;
  const out = prog(t, T.ring - 0.15, T.ring + 0.1);
  const col = (cy, dir, seed) => Array.from({ length: 7 }, (_, k) => {
    const ph = (t * 0.55 + k / 7) % 1; // cada card desce e é substituído
    const y = cy + dir * lerp(-ch * 0.75, ch * 0.75, ph);
    const s = 1 - Math.abs(ph - 0.5) * 0.5;
    return (
      <Card key={`${seed}${k}`} i={seed + k * 3} w={cw} h={ch} style={{
        left: W / 2 - cw / 2, top: y - ch / 2, zIndex: Math.round((1 - Math.abs(ph - 0.5)) * 10),
        transform: `perspective(700px) rotateX(${dir * lerp(55, -10, ph)}deg) rotateZ(${(rnd(k, seed) - 0.5) * 14}deg) scale(${s})`,
        opacity: Math.sin(ph * Math.PI) * (1 - out),
      }} />
    );
  });
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      {col(L.tall ? H * 0.2 : H * 0.12, 1, 1)}
      {col(L.tall ? H * 0.8 : H * 0.88, -1, 5)}
    </div>
  );
}

/* ---------- 1,9–4,4s: anel de sites girando ---------- */
function Ring({ t, W, H, L }) {
  const lt = t - T.ring;
  const n = 18;
  const R = Math.min(W, H) * (L.tall ? 0.42 : 0.4);
  const open = spring(lt, { stiffness: 70, damping: 11 });
  const out = easeIn(prog(t, T.expand - 0.25, T.expand));
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      {Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2 + lt * 0.55 + (1 - clamp(open)) * 1.2;
        const r = R * clamp(open, 0, 1.15) * (1 + out * 1.4) * (0.82 + rnd(i, 3) * 0.3);
        const x = W / 2 + Math.cos(a) * r;
        const y = H / 2 + Math.sin(a) * r * 0.82;
        const z = (Math.sin(a) + 1) / 2;
        const w = (L.tall ? 64 : 76) * (0.75 + rnd(i, 4) * 0.55);
        const h = w * (rnd(i, 5) > 0.5 ? 0.66 : 1.15);
        return (
          <Card key={i} i={i * 5 + 2} w={w} h={h} style={{
            left: x - w / 2, top: y - h / 2, zIndex: Math.round(z * 10), opacity: clamp(open * 2) * (1 - out),
            transform: `perspective(600px) rotateY(${Math.cos(a) * 25}deg) rotateZ(${(rnd(i, 6) - 0.5) * 18}deg) scale(${lerp(0.8, 1.08, z)})`,
            filter: z < 0.25 ? `blur(${(0.25 - z) * 6}px)` : "none",
          }} />
        );
      })}
    </div>
  );
}

/* ---------- 4,4–7,3s: "AMPLIE SEU ALCANCE" + sites explodindo ---------- */
function Expand({ t, W, H, L }) {
  const lt = t - T.expand;
  const fs = (L.tall ? 34 : 46);
  const grow = lerp(0.6, 1, easeOut(prog(lt, 0, 0.8)));
  const split = easeInOut(prog(t, T.burst, T.burst + 0.4));
  const fade = easeIn(prog(t, T.flow - 0.35, T.flow));
  const two = lt >= 0.5;
  const gapY = split * fs * (L.tall ? 3.4 : 2.6);
  return (
    <div style={{ position: "absolute", inset: 0, background: NAVY, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at center, ${hexA(C.blue, 0.22)}, rgba(0,0,0,0) 60%)` }} />
      {/* sites explodindo do centro */}
      {t >= T.burst && Array.from({ length: 22 }, (_, i) => {
        const b = t - T.burst - (i % 6) * 0.04;
        if (b < 0) return null;
        const a = rnd(i, 1) * Math.PI * 2;
        const dist = easeOut(clamp(b / 1.1)) * Math.max(W, H) * (0.25 + rnd(i, 2) * 0.55);
        const w = (L.tall ? 70 : 84) * (0.7 + rnd(i, 3) * 0.6) * lerp(0.4, 1.25, clamp(b / 1.2));
        const h = w * (rnd(i, 4) > 0.5 ? 0.66 : 1.2);
        return (
          <Card key={i} i={i * 7 + 1} w={w} h={h} style={{
            left: W / 2 + Math.cos(a) * dist - w / 2, top: H / 2 + Math.sin(a) * dist * 0.75 - h / 2, zIndex: 5,
            transform: `rotate(${(rnd(i, 5) - 0.5) * 30}deg)`, opacity: clamp(b * 6) * (1 - fade),
          }} />
        );
      })}
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", zIndex: 50, opacity: 1 - fade }}>
        <div style={{ textAlign: "center", transform: `scale(${grow})`, textShadow: "0 4px 24px rgba(0,8,24,.85)" }}>
          <div style={{ ...DISP, fontSize: fs * (two ? 0.62 : 1), color: WHITE, lineHeight: 1, transform: `translateY(${-gapY / 2}px)` }}>Amplie</div>
          {two && <div style={{ ...DISP, fontSize: fs, color: WHITE, lineHeight: 1.05, transform: `translateY(${gapY / 2}px)`, whiteSpace: "nowrap" }}>seu alcance</div>}
        </div>
      </div>
      {/* coluna de sites entre as palavras (como na referência) */}
      {split > 0 && t < T.burst + 0.9 && [0, 1, 2].map((k) => (
        <Card key={k} i={k * 4 + 3} w={(L.tall ? 64 : 70) * split} h={(L.tall ? 44 : 48) * split} style={{
          left: W / 2 - ((L.tall ? 64 : 70) * split) / 2 + (k - 1) * 14 * split, top: H / 2 - 24 * split + (k - 1) * 10, zIndex: 8,
          transform: `rotate(${(k - 1) * 8}deg)`, opacity: 1 - prog(t, T.burst + 0.6, T.burst + 0.9),
        }} />
      ))}
    </div>
  );
}

/* ---------- 7,3–9,6s: sites deslizando em profundidade ---------- */
function Flow({ t, W, H, L }) {
  const lt = t - T.flow;
  const out = easeIn(prog(t, T.list - 0.3, T.list));
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", opacity: 1 - out }}>
      {Array.from({ length: 9 }, (_, i) => {
        const depth = 0.55 + rnd(i, 1) * 0.8;
        const w = (L.tall ? 150 : 170) * depth;
        const h = w * (rnd(i, 2) > 0.5 ? 0.62 : 1.05);
        const speed = 38 * depth;
        const x = ((rnd(i, 3) * (W + w * 2) + lt * speed) % (W + w * 2)) - w;
        const y = H * (L.tall ? 0.12 + rnd(i, 4) * 0.76 : 0.08 + rnd(i, 4) * 0.84);
        const near = Math.abs(y - H / 2) < h * 0.6;
        return (
          <Card key={i} i={i * 3 + 7} w={w} h={h} style={{
            left: x, top: y - h / 2, zIndex: Math.round(depth * 10), opacity: clamp(lt * 3) * (near ? 0.35 : 1),
            filter: depth < 0.8 ? `blur(${(0.8 - depth) * 6}px)` : "none", transform: `rotate(${(rnd(i, 5) - 0.5) * 8}deg)`,
          }} />
        );
      })}
    </div>
  );
}

/* ---------- 9,6–13,2s: lista de recursos ---------- */
const FEATURES = [
  "Loja virtual", "Landing page", "SEO", "Checkout", "Pix", "WhatsApp", "Domínio", "Hospedagem", "Blog", "Agendamento",
  "Catálogo", "Painel admin", "Métricas", "Responsivo", "Integrações", "Cardápio digital", "Orçamento online", "Área do cliente",
  "Formulários", "Galeria", "Frete", "Cupons", "Avaliações", "Multilíngue",
];
function List({ t, W, H, L }) {
  const lt = t - T.list;
  const fs = L.tall ? 15 : 13;
  const lineH = fs * 1.35;
  const scroll = lt * 26;
  const listIn = prog(lt, 0.25, 0.6) * (1 - prog(t, T.select - 0.55, T.select - 0.2));
  const fx = L.tall ? W / 2 - 70 : W / 2 - 60;
  const pop = (k) => spring(lt - 0.6 - k * 0.55, { stiffness: 180, damping: 14 }) * (1 - prog(t, T.select - 0.5, T.select - 0.2));
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <div style={{
        position: "absolute", left: fx, top: 0, bottom: 0, width: W - fx, opacity: listIn,
        maskImage: "linear-gradient(180deg, transparent 0%, #000 30%, #000 70%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(180deg, transparent 0%, #000 30%, #000 70%, transparent 100%)",
      }}>
        {[...FEATURES, ...FEATURES].map((f, i) => {
          const y = H / 2 - 80 + i * lineH - scroll;
          const near = Math.abs(y - H / 2) < lineH * 1.2;
          return <div key={i} style={{ ...SMALL, position: "absolute", left: 0, top: y, fontSize: fs, color: hexA(C.ice, near ? 0 : 0.42), fontWeight: 500 }}>{f}</div>;
        })}
      </div>
      {/* recortes de sites aparecendo ao lado */}
      {[0, 1, 2].map((k) => {
        const s = pop(k);
        if (s <= 0) return null;
        const side = k % 2 ? 1 : -1;
        const w = L.tall ? 110 : 120;
        return <Card key={k} i={k * 6 + 4} w={w} h={w * 0.66} style={{
          left: W / 2 + side * (L.tall ? 105 : 190) - w / 2, top: H / 2 + (k - 1) * (L.tall ? 150 : 90) - w * 0.33,
          transform: `scale(${clamp(s, 0, 1.15)}) rotate(${side * 6}deg)`, opacity: clamp(s * 2), zIndex: 3,
        }} />;
      })}
      <div style={{ position: "absolute", left: fx - 16, top: H / 2, transform: "translateY(-50%)", display: "flex", alignItems: "center", gap: 8, zIndex: 5, opacity: clamp(lt * 4) }}>
        <svg width="9" height="10" viewBox="0 0 9 10"><path d="M0 0 L9 5 L0 10 Z" fill={C.cyan} /></svg>
        <div style={{ ...SMALL, fontSize: L.tall ? 19 : 17 }}>e tudo o que você precisa</div>
      </div>
    </div>
  );
}

/* ---------- 13,2–16s: moldura de seleção se deformando ---------- */
const SHAPES = [
  [[-60, -70], [40, -60], [55, 70], [-40, 60]],
  [[-30, -110], [70, -90], [40, 120], [-80, 90]],
  [[-150, -40], [110, -80], [150, 50], [-100, 90]],
  [[-110, -60], [120, -50], [100, 70], [-130, 60]],
  [[0, -90], [130, 0], [0, 90], [-130, 0]],
];
function Select({ t, W, H, L }) {
  const lt = t - T.select;
  const u = L.tall ? 0.85 : 1;
  const seg = clamp(lt / 0.62, 0, SHAPES.length - 1.001);
  const k = Math.floor(seg);
  const f = easeInOut(seg - k);
  const grow = easeOut(prog(lt, 0, 0.35));
  const out = easeIn(prog(t, T.big - 0.3, T.big));
  const pts = SHAPES[k].map(([x, y], i) => [W / 2 + lerp(x, SHAPES[k + 1][i][0], f) * u * grow * (1 - out), H / 2 + lerp(y, SHAPES[k + 1][i][1], f) * u * grow * (1 - out)]);
  return (
    <div style={{ position: "absolute", inset: 0, background: NAVY, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at center, ${hexA(C.blue, 0.2)}, rgba(0,0,0,0) 65%)` }} />
      <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
        <path d={`M${pts.map((p) => p.join(" ")).join(" L")} Z`} fill="none" stroke={C.cyan} strokeWidth="1.6" style={{ filter: `drop-shadow(0 0 6px ${hexA(C.cyan, 0.7)})` }} />
        {pts.map(([x, y], i) => <rect key={i} x={x - 4} y={y - 3} width={i % 2 ? 9 : 7} height={i % 2 ? 7 : 6} rx="1" fill={NAVY} stroke={C.cyan} strokeWidth="1.2" />)}
      </svg>
      <Cut t={t} steps={[[T.select + 0.45, "pra"], [T.select + 1.0, "pra você"]]} style={{ fontSize: L.tall ? 22 : 20 }} out={T.big - 0.15} />
    </div>
  );
}

/* ---------- 16–23s: tela cheia com texto gigante ---------- */
function BigWords({ t, t0, top, bottom, L, H }) {
  const fs = L.tall ? 58 : 72;
  const a = spring(t - t0, { stiffness: 160, damping: 14 });
  const b = spring(t - t0 - 0.12, { stiffness: 160, damping: 14 });
  const word = (txt, s, y, align) => (
    <div style={{
      position: "absolute", left: 0, right: 0, textAlign: "center", ...(align === "top" ? { top: y } : { bottom: y }),
      ...DISP, fontSize: fs, color: "#FFFFFF", lineHeight: 1, opacity: clamp(s * 2),
      transform: `scale(${lerp(1.35, 1, clamp(s))})`, filter: s < 1 ? `blur(${(1 - clamp(s)) * 8}px)` : "none",
      textShadow: "0 6px 30px rgba(0,0,0,.45)",
    }}>{txt}</div>
  );
  const pad = L.tall ? H * 0.16 : H * 0.07;
  return (
    <>
      {word(top, a, pad, "top")}
      {word(bottom, b, pad, "bottom")}
    </>
  );
}
function Big({ t, W, H, L }) {
  const s1 = inWin(t, T.big, T.big2);
  const s2 = inWin(t, T.big2, T.big3);
  const s3 = inWin(t, T.big3, T.beams);
  const out = easeIn(prog(t, T.beams - 0.25, T.beams));
  // "MUITO ALÉM": a câmera recua de um site até o mural com todos
  const pull = easeInOut(prog(t, T.big3 + 0.15, T.big3 + 2.6));
  const cols = L.tall ? 5 : 7;
  const rows = L.tall ? 9 : 7;
  const tw = 160;
  const th = 100;
  const gap = 10;
  const gw = cols * (tw + gap);
  const gh = rows * (th + gap);
  const focusC = Math.floor(cols / 2);
  const focusR = Math.floor(rows / 2);
  const zoomFull = Math.max(W / tw, H / th) * 1.02;
  const zoom = lerp(zoomFull, L.tall ? 0.62 : 0.72, pull);
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: "#000", opacity: 1 - out }}>
      {s1 && (
        <div style={{ position: "absolute", inset: 0, transform: `scale(${lerp(1, 1.1, prog(t, T.big, T.big2))})` }}>
          <SyncedVideo t={clamp(t - T.big, 0, AD_CLIP_DUR - 0.04)} duration={AD_CLIP_DUR} webm={AD_CLIP_WEBM} mp4={AD_CLIP_MP4} style={{ transform: "scale(1.28) translateY(9%)" }} />
        </div>
      )}
      {s2 && (
        <div style={{ position: "absolute", inset: 0, transform: `scale(${lerp(1.12, 1.0, easeOut(prog(t, T.big2, T.big3)))}) translateX(${lerp(-12, 12, prog(t, T.big2, T.big3))}px)` }}>
          <img src={REACH_TRAMA} alt="" draggable={false} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        </div>
      )}
      {s3 && (
        <div style={{ position: "absolute", left: W / 2, top: H / 2, width: 0, height: 0 }}>
          <div style={{ position: "absolute", left: 0, top: 0, transform: `scale(${zoom})` }}>
            {Array.from({ length: cols * rows }, (_, i) => {
              const r = Math.floor(i / cols);
              const c = i % cols;
              return (
                <Card key={i} i={(r * 4 + c * 3 + 16 - focusR * 4 - focusC * 3 + AD_TILES.length * 4) % AD_TILES.length} w={tw} h={th} style={{
                  left: (c - focusC) * (tw + gap) - tw / 2, top: (r - focusR) * (th + gap) - th / 2, borderRadius: 4,
                }} />
              );
            })}
          </div>
        </div>
      )}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,.35), rgba(0,0,0,0) 35%, rgba(0,0,0,0) 65%, rgba(0,0,0,.35))" }} />
      {s1 && <BigWords t={t} t0={T.big} top="Vender" bottom="mais" L={L} H={H} />}
      {s2 && <BigWords t={t} t0={T.big2} top="Ir" bottom="além" L={L} H={H} />}
      {s3 && <BigWords t={t} t0={T.big3} top="Muito" bottom="além" L={L} H={H} />}
    </div>
  );
}

/* ---------- 23–27s: feixes de luz em V ---------- */
function Beams({ t, W, H, L }) {
  const lt = t - T.beams;
  const glow = easeOut(prog(lt, 0, 0.6));
  const flash = prog(t, T.light - 0.35, T.light);
  const pulse = 0.8 + 0.2 * Math.sin(lt * 5);
  const beam = (x1, y1, x2, y2, k) => {
    const len = Math.hypot(x2 - x1, y2 - y1);
    const ang = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
    return (
      <div key={k} style={{
        position: "absolute", left: x1, top: y1, width: len * glow, height: 10, marginTop: -5, borderRadius: 10, transformOrigin: "0 50%", transform: `rotate(${ang}deg)`,
        background: `linear-gradient(90deg, ${hexA(C.cyan, 0)}, ${hexA(C.cyan, 0.9 * pulse)} 70%, ${hexA("#FFFFFF", 0.95)})`,
        filter: "blur(3px)", boxShadow: `0 0 30px ${hexA(C.cyan, 0.7)}`,
      }} />
    );
  };
  const cx = W / 2;
  const top = H * 0.08;
  const bot = H * 0.92;
  const spread = (L.tall ? 0.42 : 0.3) * W * (1 + flash * 1.5);
  return (
    <div style={{ position: "absolute", inset: 0, background: NAVY, overflow: "hidden" }}>
      {beam(cx - spread, -20, cx, top + H * 0.14, "a")}
      {beam(cx + spread, -20, cx, top + H * 0.14, "b")}
      {beam(cx - spread, H + 20, cx, bot - H * 0.14, "c")}
      {beam(cx + spread, H + 20, cx, bot - H * 0.14, "d")}
      <Cut t={t} steps={[[T.beams + 0.2, "hoje,"], [T.beams + 1.0, "seu site"], [T.beams + 1.9, "vira"]]} style={{ fontSize: L.tall ? 26 : 24 }} />
      <div style={{ position: "absolute", inset: 0, background: C.paper, opacity: flash }} />
    </div>
  );
}

/* ---------- 27–31s: "vendas." → logo ---------- */
function Final({ t, W, H, L }) {
  const lt = t - T.light;
  const pop = spring(lt, { stiffness: 220, damping: 14 });
  const shrink = easeInOut(prog(t, T.lockup, T.lockup + 0.55));
  const logo = spring(t - T.lockup - 0.25, { stiffness: 160, damping: 13 });
  const tag = easeOut(prog(t, T.lockup + 0.9, T.lockup + 1.5));
  const fs = L.tall ? 70 : 96;
  return (
    <div style={{ position: "absolute", inset: 0, background: C.paper, display: "grid", placeItems: "center" }}>
      {shrink < 1 && (
        <div style={{
          position: "absolute", fontFamily: FONT, fontWeight: 800, fontSize: fs, letterSpacing: "-0.05em", color: C.ink,
          transform: `scale(${lerp(0.85, 1, clamp(pop, 0, 1.1)) * lerp(1, 0.2, shrink)})`, opacity: 1 - shrink,
        }}>vendas<span style={{ color: C.blue }}>.</span></div>
      )}
      {logo > 0 && (
        <div style={{ display: "flex", flexDirection: L.tall ? "column" : "row", alignItems: "center", gap: 16 * L.txt, opacity: clamp(logo * 2), transform: `scale(${lerp(0.7, 1, clamp(logo, 0, 1.1))})` }}>
          <CubeLogo size={L.tall ? 64 : 58} glow={0.5} />
          <div style={{ textAlign: L.tall ? "center" : "left" }}>
            <div style={{ ...DISP, fontSize: L.tall ? 30 : 34, color: C.ink, lineHeight: 1 }}>Estoke ao Cubo</div>
            <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: L.tall ? 15 : 15, color: C.slate, marginTop: 8, opacity: tag, transform: `translateY(${(1 - tag) * 6}px)` }}>Sites e lojas virtuais que vendem.</div>
          </div>
        </div>
      )}
    </div>
  );
}

function Frame({ t, format = "16x9" }) {
  const F = FORMATS[format];
  const L = LAYOUTS[format];
  const W = F.w;
  const H = F.h;
  const p = { t, W, H, L };
  const fs = L.tall ? 22 : 18;
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: "#000", fontFamily: FONT }}>
      {t < T.ring + 0.15 && <Stacks {...p} />}
      {inWin(t, T.ring - 0.1, T.expand) && <Ring {...p} />}
      <Cut t={t} out={T.expand} style={{ fontSize: fs }} steps={[[0.3, "nós"], [0.75, "criamos"], [1.3, "sites"], [T.ring + 0.05, "pra você"], [T.ring + 0.75, "crescer."]]} />
      {inWin(t, T.expand, T.flow) && <Expand {...p} />}
      {inWin(t, T.flow, T.list) && <Flow {...p} />}
      <Cut t={t} out={T.list} style={{ fontSize: fs }} steps={[[T.flow + 0.2, ""], [T.flow + 0.35, "com"], [T.flow + 0.95, "design sob medida"]]} />
      {inWin(t, T.list, T.select) && <List {...p} />}
      {inWin(t, T.select, T.big) && <Select {...p} />}
      {inWin(t, T.big, T.beams) && <Big {...p} />}
      {inWin(t, T.beams, T.light) && <Beams {...p} />}
      {t >= T.light && <Final {...p} />}
      <Grain t={t} opacity={0.05} />
    </div>
  );
}

/* =============================================================================
   Som — "Alexa 2": o drop da faixa (17,47s) cai nas imagens em tela cheia (16s);
   a pausa da faixa cobre a lista e a moldura. Efeitos gravados, baixos.
============================================================================= */
const MUSIC = { drop: 16.17, gain: 0.48 }; // drop dentro do trecho embutido (começa em 1,3s da faixa)
const SAMPLES = { music: MUSIC_REACH.alexaReach, ...SFX };
function buildEvents() {
  const ev = [];
  const fx = (at, name, gain, opts = {}) => ev.push({ t: Math.max(0, at - SFX_PEAK[name] / (opts.rate || 1)), fn: (A, w) => A.sample(name, w, { gain, ...opts }) });
  const off0 = MUSIC.drop - T.big;
  const endF = off0 + DURATION;
  ev.push({
    t: 0, dur: DURATION,
    fn: (A, w, off = 0) => A.sample("music", w, {
      off: off0 + off, dur: DURATION - off, gain: MUSIC.gain, fadeIn: 0.08,
      env: [[0, 1], [MUSIC.drop - 8.6, 1], [MUSIC.drop - 8.4, 1.5], [MUSIC.drop - 0.05, 1.5], [MUSIC.drop, 1], [endF - 1.4, 1], [endF, 0]],
    }),
  });
  [0.3, 0.75, 1.3].forEach((tt, i) => fx(tt, "lightPop", 0.06, { rate: [1, 1.08, 0.95][i] }));
  fx(T.ring + 0.3, "airWhoosh", 0.16);
  fx(T.expand + 0.05, "deepHit", 0.14);
  fx(T.burst + 0.2, "windSwoosh", 0.18);
  fx(T.flow + 0.5, "airSweep", 0.09);
  fx(T.list + 0.4, "techSlide", 0.14);
  [0, 1, 2].forEach((k) => fx(T.list + 0.62 + k * 0.55, "dryPop", 0.07, { rate: [1, 1.08, 0.95][k] }));
  fx(T.select + 0.1, "mouseClick", 0.14);
  fx(T.select + 1.0, "mouseClose", 0.1);
  fx(T.big - 0.02, "zoomImpact", 0.12);
  fx(T.big2, "windSwoosh", 0.13);
  fx(T.big3, "windSwoosh", 0.13, { rate: 1.05 });
  fx(T.big3 + 1.2, "airWhoosh", 0.12);
  fx(T.beams + 0.3, "sparkleSweep", 0.08);
  fx(T.light, "lightPop", 0.12);
  fx(T.lockup + 0.3, "sparkleTouch", 0.1);
  fx(T.lockup + 0.3, "logoImpact", 0.1);
  return ev.sort((a, b) => a.t - b.t);
}
const EVENTS = buildEvents();
const renderWav = () => renderEventsWav(EVENTS, DURATION, { samples: SAMPLES });

// Usado pelo exportador de vídeo (scripts/export-video.cjs)
const MOTION = { Frame, duration: DURATION, formats: FORMATS, renderWav };

export default function ReachAd() {
  return (
    <MotionPlayer Frame={Frame} duration={DURATION} events={EVENTS} formats={FORMATS} defaultFormat="16x9" renderWav={renderWav} samples={SAMPLES}
      fontsToLoad={[`800 16px "Open Sauce Sans"`]}
      scenes={[
        { name: "Pilhas", from: 0 },
        { name: "Anel", from: T.ring },
        { name: "Alcance", from: T.expand },
        { name: "Design", from: T.flow },
        { name: "Recursos", from: T.list },
        { name: "Pra você", from: T.select },
        { name: "Tela cheia", from: T.big },
        { name: "Feixes", from: T.beams },
        { name: "Logo", from: T.light },
      ]} />
  );
}
