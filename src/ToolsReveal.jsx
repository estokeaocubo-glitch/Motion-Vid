import React from "react";
import {
  C, FONT, clamp, lerp, prog, easeOut, easeInOut, spring, hexA, rnd,
  Grain, CubeLogo, SyncedVideo, renderEventsWav, MotionPlayer,
} from "./motionKit";
import { AD_CLIP_MP4, AD_CLIP_WEBM, AD_CLIP_DUR } from "./adAssets";
import { TOOLS_DEV, TOOLS_DEV_DUR, TOOLS_SITES } from "./toolsAssets";
import { MUSIC_TOOLS } from "./audio/toolsRef";
import { SFX, SFX_PEAK } from "./audio/sfx";

/* =============================================================================
   Estoke ao Cubo — "dev / tools / site" (11,4s, story 9:16 e 3:4)
   Referência: vídeo "artist / tools / art" (3:4, 11,4s): tela branca dividida em três
   faixas, os nomes "artist", "tools" e "art" aparecem um a um e, quando o beat volta,
   as três faixas viram vídeo ao mesmo tempo (a artista, os materiais na mesa, o desenho).
   Nossa versão, para programação:
     - dev:   o vídeo do programador (assets/dev-programador.mp4), com o recorte da faixa
              acompanhando o rosto e um leve avanço de câmera nos planos abertos
     - tools: animação própria em neon — Pinterest, Python, Java, GitHub e Antigravity
              atravessando a câmera, um a cada duas batidas, com rastros de velocidade e o
              fundo tingido pela cor do ícone; fecha com as cinco lado a lado, uma acendendo
              por batida
     - site:  o que sai disso — a Dizzy (moeda 3D) e os prints de Kaiirós, YMB Cocktails,
              KDust, Trama e Bastos trocando no beat
   Música: a do vídeo de referência, inteira e no mesmo tempo: o beat volta em 3,78s e a
   grade é de 137,6 BPM (uma batida a cada 0,436s); todos os cortes caem nela.
============================================================================= */
const DURATION = 11.4;
const FORMATS = {
  "9x16": { w: 450, h: 800, label: "Story 9:16" },
  "3x4": { w: 450, h: 600, label: "3:4" },
};
const BEAT = 0.436;
const beat = (n) => 3.78 + n * BEAT; // n-ésima batida depois do corte
const T = { dev: 0.75, tools: 1.5, site: 2.25, cut: 3.78, dock: beat(10.5) };
const LABELS = ["dev", "tools", "site"];
/* ---------- Ícones das ferramentas (traço branco sobre o bloco colorido) ---------- */
const ICONS = {
  python: { name: "Python", vb: 24, d: "M14.25.18l.9.2.73.26.59.3.45.32.34.34.25.34.16.33.1.3.04.26.02.2-.01.13V8.5l-.05.63-.13.55-.21.46-.26.38-.3.31-.33.25-.35.19-.35.14-.33.1-.3.07-.26.04-.21.02H8.77l-.69.05-.59.14-.5.22-.41.27-.33.32-.27.35-.2.36-.15.37-.1.35-.07.32-.04.27-.02.21v3.06H3.17l-.21-.03-.28-.07-.32-.12-.35-.18-.36-.26-.36-.36-.35-.46-.32-.59-.28-.73-.21-.88-.14-1.05-.05-1.23.06-1.22.16-1.04.24-.87.32-.71.36-.57.4-.44.42-.33.42-.24.4-.16.36-.1.32-.05.24-.01h.16l.06.01h8.16v-.83H6.18l-.01-2.75-.02-.37.05-.34.11-.31.17-.28.25-.26.31-.23.38-.2.44-.18.51-.15.58-.12.64-.1.71-.06.77-.04.84-.02 1.27.05zm-6.3 1.98l-.23.33-.08.41.08.41.23.34.33.22.41.09.41-.09.33-.22.23-.34.08-.41-.08-.41-.23-.33-.33-.22-.41-.09-.41.09zm13.09 3.95l.28.06.32.12.35.18.36.27.36.35.35.47.32.59.28.73.21.88.14 1.04.05 1.23-.06 1.23-.16 1.04-.24.86-.32.71-.36.57-.4.45-.42.33-.42.24-.4.16-.36.09-.32.05-.24.02-.16-.01h-8.22v.82h5.84l.01 2.76.02.36-.05.34-.11.31-.17.29-.25.25-.31.24-.38.2-.44.17-.51.15-.58.13-.64.09-.71.07-.77.04-.84.01-1.27-.04-1.07-.14-.9-.2-.73-.25-.59-.3-.45-.33-.34-.34-.25-.34-.16-.33-.1-.3-.04-.25-.02-.2.01-.13v-5.34l.05-.64.13-.54.21-.46.26-.38.3-.32.33-.24.35-.2.35-.14.33-.1.3-.06.26-.04.21-.02.13-.01h5.84l.69-.05.59-.14.5-.21.41-.28.33-.32.27-.35.2-.36.15-.36.1-.35.07-.32.04-.28.02-.21V6.07h2.09l.14.01zm-6.47 14.25l-.23.33-.08.41.08.41.23.33.33.23.41.08.41-.08.33-.23.23-.33.08-.41-.08-.41-.23-.33-.33-.23-.41-.08-.41.08z", bg: ["#5A9AD0", "#2B5F8E"], glow: "#4B8BBE", accent: "#FFD43B" },
  java: { name: "Java", vb: 128, d: "M47.617 98.12c-19.192 5.362 11.677 16.439 36.115 5.969-4.003-1.556-6.874-3.351-6.874-3.351-10.897 2.06-15.952 2.222-25.844 1.092-8.164-.935-3.397-3.71-3.397-3.71zm33.189-10.46c-14.444 2.779-22.787 2.69-33.354 1.6-8.171-.845-2.822-4.805-2.822-4.805-21.137 7.016 11.767 14.977 41.309 6.336-3.14-1.106-5.133-3.131-5.133-3.131zm11.319-60.575c.001 0-42.731 10.669-22.323 34.187 6.024 6.935-1.58 13.17-1.58 13.17s15.289-7.891 8.269-17.777c-6.559-9.215-11.587-13.793 15.634-29.58zm9.998 81.144s3.529 2.91-3.888 5.159c-14.102 4.272-58.706 5.56-71.095.171-4.45-1.938 3.899-4.625 6.526-5.192 2.739-.593 4.303-.485 4.303-.485-4.952-3.487-32.013 6.85-13.742 9.815 49.821 8.076 90.817-3.637 77.896-9.468zM85 77.896c2.395-1.634 5.703-3.053 5.703-3.053s-9.424 1.685-18.813 2.474c-11.494.964-23.823 1.154-30.012.326-14.652-1.959 8.033-7.348 8.033-7.348s-8.812-.596-19.644 4.644C17.455 81.134 61.958 83.958 85 77.896zm5.609 15.145c-.108.29-.468.616-.468.616 31.273-8.221 19.775-28.979 4.822-23.725-1.312.464-2 1.543-2 1.543s.829-.334 2.678-.72c7.559-1.575 18.389 10.119-5.032 22.286zM64.181 70.069c-4.614-10.429-20.26-19.553.007-35.559C89.459 14.563 76.492 1.587 76.492 1.587c5.23 20.608-18.451 26.833-26.999 39.667-5.821 8.745 2.857 18.142 14.688 28.815zm27.274 51.748c-19.187 3.612-42.854 3.191-56.887.874 0 0 2.874 2.38 17.646 3.331 22.476 1.437 57-.8 57.816-11.436.001 0-1.57 4.032-18.575 7.231z", bg: ["#FFA733", "#E35F00"], glow: "#F89820" },
  github: { name: "GitHub", vb: 24, d: "M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12", bg: ["#454B55", "#14181E"], glow: "#A8B3C4" },
  antigravity: { name: "Antigravity", vb: 24, d: "M21.751 22.607c1.34 1.005 3.35.335 1.508-1.508C17.73 15.74 18.904 1 12.037 1 5.17 1 6.342 15.74.815 21.1c-2.01 2.009.167 2.511 1.507 1.506 5.192-3.517 4.857-9.714 9.715-9.714 4.857 0 4.522 6.197 9.714 9.715z", bg: ["#4285F4", "#34A853", "#FBBC05", "#EA4335"], glow: "#4285F4" },
  pinterest: { name: "Pinterest", vb: 24, d: "M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z", bg: ["#FF2A4B", "#C8001C"], glow: "#E60023" },
};

function Tile({ id, size, glow = 1, depth = false, style }) {
  const k = ICONS[id];
  const bg = k.bg.length > 2 ? `linear-gradient(135deg, ${k.bg.join(", ")})` : `linear-gradient(160deg, ${k.bg[0]}, ${k.bg[1]})`;
  const edge = k.bg[k.bg.length - 1];
  // espessura: camadas escuras empilhadas atrás do bloco, como um ícone 3D
  const thick = depth ? [1, 2, 3, 4].map((i) => `${size * 0.012 * i}px ${size * 0.016 * i}px 0 ${hexA(edge, 1)}`).join(", ") + ", " : "";
  return (
    <div style={{
      position: "absolute", width: size, height: size, borderRadius: size * 0.24, background: bg,
      boxShadow: `${thick}0 0 ${size * 0.32 * glow}px ${hexA(k.glow, 0.75)}, 0 0 ${size * 0.08}px ${hexA(k.glow, 0.9)}, inset 0 ${size * 0.04}px ${size * 0.05}px rgba(255,255,255,.35)`,
      display: "grid", placeItems: "center", overflow: "hidden", ...style,
    }}>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(255,255,255,.22), rgba(255,255,255,0) 45%)" }} />
      <svg viewBox={`0 0 ${k.vb} ${k.vb}`} width={size * 0.56} height={size * 0.56} style={{ position: "relative", filter: `drop-shadow(0 ${size * 0.02}px ${size * 0.03}px rgba(0,0,0,.25))` }}>
        <path d={k.d} fill="#fff" fillRule={id === "antigravity" ? "evenodd" : undefined} />
      </svg>
    </div>
  );
}

/* ---------- tools: ícones atravessando a câmera ---------- */
const FLY = ["pinterest", "python", "java", "github", "antigravity"];
const DOCK = ["python", "java", "github", "antigravity", "pinterest"];
const GAP = 2.2; // distância entre ícones na pilha
const NEAR = 0.3; // distância em que o ícone "atravessa" a câmera
const FX = [0, 0.55, -0.5, 0.5, -0.45]; // pilha em zigue-zague
const FY = [0, -0.14, 0.1, -0.12, 0.08];
const PASS = [2, 4, 6, 8, 10].map(beat); // um ícone a cada duas batidas
// avanço: devagar entre as batidas e um "soco" até atravessar o ícone na batida
const lunge = (p) => 0.3 * p + 0.7 * p * p * p;
function camZ(t) {
  const keys = [[T.cut, -2.0], ...PASS.map((p, k) => [p, k * GAP - NEAR])];
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [a, za] = keys[i];
    const [b, zb] = keys[i + 1];
    if (t <= b) return lerp(za, zb, lunge(prog(t, a, b)));
  }
  return keys[keys.length - 1][1] + (t - keys[keys.length - 1][0]) * 3;
}
function camXY(cz) {
  const f = clamp((cz + NEAR) / GAP, 0, FLY.length - 1);
  const i = Math.min(Math.floor(f), FLY.length - 2);
  const p = easeInOut(clamp(f - i));
  return [lerp(FX[i], FX[i + 1], p), lerp(FY[i], FY[i + 1], p)];
}
const STARS = Array.from({ length: 70 }, (_, i) => [(rnd(i, 1) - 0.5) * 5, (rnd(i, 2) - 0.5) * 2.4, rnd(i, 3) * 12]);
function FlyThrough({ t, PW, PH }) {
  const cz = camZ(t);
  const v = (camZ(t + 0.01) - camZ(t - 0.01)) / 0.02; // velocidade da câmera
  const [cx, cy] = camXY(cz);
  const base = PH * 0.38;
  const proj = (x, y, d) => [PW / 2 + (x - cx) * PH * 0.9 / d, PH / 2 + (y - cy) * PH * 0.9 / d];
  // cor do próximo ícone tinge o fundo, mais forte quanto mais perto
  const next = FLY.findIndex((_, k) => k * GAP - cz > NEAR);
  const nd = next >= 0 ? next * GAP - cz : 9;
  const tint = next >= 0 ? ICONS[FLY[next]].glow : "#000000";
  // clarão na cor do ícone logo depois de atravessá-lo
  const lastPass = PASS.filter((p) => p <= t).pop();
  const flashK = PASS.indexOf(lastPass);
  const flash = lastPass != null ? Math.exp(-(t - lastPass) * 9) : 0;
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: `radial-gradient(70% 90% at 50% 50%, ${hexA(tint, clamp(0.5 / nd, 0, 0.45))}, #000 75%)` }}>
      {STARS.map(([x, y, z0], i) => {
        const d = ((z0 - cz) % 12 + 12) % 12 + 0.2;
        const [px, py] = proj(x, y, d);
        const ang = Math.atan2(py - PH / 2, px - PW / 2);
        const len = 2 + Math.min(70, v * 9 / d);
        return <div key={i} style={{
          position: "absolute", left: px, top: py, width: len, height: Math.max(1, 2.2 / d), borderRadius: 2,
          background: "#fff", opacity: clamp((12 - d) / 6) * 0.55, transformOrigin: "0 50%", transform: `rotate(${ang}rad)`,
        }} />;
      })}
      {FLY.map((id, k) => {
        const d = k * GAP - cz;
        if (d < NEAR || d > 10) return null;
        const size = base / d;
        const [x, y] = proj(FX[k], FY[k], d);
        const op = clamp((d - NEAR) / 0.25) * clamp((10 - d) / 3);
        const blur = Math.min(7, (v * size) / (d * 260));
        const turn = (FX[k] - cx) * 40;
        return (
          <Tile key={id} id={id} size={size} glow={1.2} depth style={{
            left: x - size / 2, top: y - size / 2, opacity: op, zIndex: Math.round(1000 - d * 100),
            transform: `perspective(${PH * 2.2}px) rotateY(${-turn - 14}deg) rotateX(${(FY[k] - cy) * -40 + 6}deg) rotateZ(${-6 + k * 3}deg)`,
            filter: blur > 0.4 ? `blur(${blur.toFixed(2)}px)` : undefined,
          }} />
        );
      })}
      {flash > 0.02 && <div style={{ position: "absolute", inset: 0, background: ICONS[FLY[flashK]].glow, opacity: flash * 0.55, zIndex: 2000 }} />}
    </div>
  );
}

/* ---------- tools: as cinco ferramentas lado a lado, uma acendendo por batida ---------- */
const PULSE = [12, 13, 14, 15, 16].map(beat); // 9,02 · 9,46 · 9,89 · 10,33 · 10,76
const ALL = beat(17); // 11,2: todas juntas
function Dock({ t, PW, PH }) {
  const u = t - T.dock;
  const n = DOCK.length;
  const size = Math.min(PW / (n + 1.6), PH * 0.42);
  const gap = size * 0.28;
  const total = n * size + (n - 1) * gap;
  const x0 = (PW - total) / 2;
  const hit = (b) => (t >= b ? Math.exp(-(t - b) * 6) : 0);
  return (
    <div style={{ position: "absolute", inset: 0, background: "radial-gradient(60% 80% at 50% 55%, #0B1830, #000 70%)" }}>
      {DOCK.map((id, k) => {
        const p = spring(u - k * 0.06, { stiffness: 260, damping: 15 });
        const pulse = Math.max(hit(PULSE[k]), hit(ALL));
        const float = Math.sin((t + k * 0.4) * 2.4) * size * 0.03;
        const sc = clamp(p, 0, 1.2) * (1 + pulse * 0.14);
        return (
          <React.Fragment key={id}>
            <Tile id={id} size={size} glow={0.7 + pulse * 1.1} depth style={{
              left: x0 + k * (size + gap), top: PH * 0.45 - size / 2 + float - pulse * size * 0.08,
              transform: `perspective(600px) rotateX(10deg) scale(${sc})`, opacity: clamp(p * 2),
            }} />
            <div style={{
              position: "absolute", left: x0 + k * (size + gap) - gap, width: size + gap * 2, top: PH * 0.45 + size * 0.64,
              textAlign: "center", fontFamily: FONT, fontWeight: 600, fontSize: Math.max(8, size * 0.17), color: "#fff",
              opacity: clamp((u - 0.3 - k * 0.06) * 4) * (0.6 + pulse * 0.4), whiteSpace: "nowrap",
            }}>{ICONS[id].name}</div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

function ToolsPanel({ t, PW, PH }) {
  return t < T.dock ? <FlyThrough t={t} PW={PW} PH={PH} /> : <Dock t={t} PW={PW} PH={PH} />;
}

/* ---------- dev: vídeo do programador, recorte seguindo o rosto ---------- */
// [segundo do vídeo depois do corte, altura do rosto (fração da altura do vídeo), zoom]
const FACE = [[0, 0.17, 1.0], [0.67, 0.3, 1.0], [1.22, 0.33, 1.08], [1.78, 0.4, 1.25], [6.22, 0.4, 1.3], [6.78, 0.36, 1.15], [7.33, 0.33, 1.1], [7.7, 0.31, 1.1]];
function faceAt(u) {
  for (let i = 0; i < FACE.length - 1; i++) {
    const [a, fa, za] = FACE[i];
    const [b, fb, zb] = FACE[i + 1];
    if (u <= b) { const p = easeInOut(prog(u, a, b)); return [lerp(fa, fb, p), lerp(za, zb, p)]; }
  }
  return FACE[FACE.length - 1].slice(1);
}
function DevPanel({ t, PW, PH, tall }) {
  const u = clamp(t - T.cut, 0, TOOLS_DEV_DUR - 0.04);
  const [face, zoom] = faceAt(u);
  const vw = PW * zoom;
  const vh = vw * (1024 / 576);
  // rosto a ~42% da faixa no story (abaixo da barra do Instagram) e ~36% no 3:4
  const top = clamp(PH * (tall ? 0.46 : 0.38) - face * vh, PH - vh, 0);
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: "#000" }}>
      <SyncedVideo t={u} duration={TOOLS_DEV_DUR} webm={TOOLS_DEV.webm} mp4={TOOLS_DEV.mp4}
        style={{ inset: "auto", left: (PW - vw) / 2, top, width: vw, height: vh, filter: "contrast(1.06) saturate(1.05)" }} />
    </div>
  );
}

/* ---------- site: Dizzy e os prints trocando no beat ---------- */
const SITE_CUTS = [4, 6, 8, 10, 12].map(beat); // Kaiirós, YMB, KDust, Trama, Bastos
function SitePanel({ t }) {
  if (t < SITE_CUTS[0]) {
    return <SyncedVideo t={clamp(t - T.cut, 0, AD_CLIP_DUR - 0.04)} duration={AD_CLIP_DUR} webm={AD_CLIP_WEBM} mp4={AD_CLIP_MP4} style={{ transform: "scale(1.04)" }} />;
  }
  let i = 0;
  SITE_CUTS.forEach((c, k) => { if (t >= c) i = k; });
  const u = t - SITE_CUTS[i];
  const len = (SITE_CUTS[i + 1] ?? DURATION) - SITE_CUTS[i];
  const p = prog(u, 0, len);
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: "#000" }}>
      <img src={TOOLS_SITES[i]} alt="" draggable={false} style={{
        position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 0%",
        transform: `scale(${lerp(1.1, 1.02, easeOut(p))}) translateY(${lerp(1.5, -1.5, p)}%)`,
      }} />
    </div>
  );
}

/* ---------- molduras ---------- */
function Label({ text, t, at, cut, top = 9 }) {
  if (t < at) return null;
  const p = spring(t - at, { stiffness: 300, damping: 18 });
  if (!cut) {
    return (
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
        <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 15, color: C.ink, letterSpacing: "-0.01em", transform: `scale(${lerp(0.8, 1, clamp(p))})`, opacity: clamp(p * 2) }}>{text}</div>
      </div>
    );
  }
  return (
    <div style={{ position: "absolute", left: 12, top, fontFamily: FONT, fontWeight: 700, fontSize: 13, color: "#fff", letterSpacing: "-0.01em", textShadow: "0 1px 6px rgba(0,0,0,.55)", zIndex: 5 }}>{text}</div>
  );
}

function Frame({ t, format = "9x16" }) {
  const F = FORMATS[format];
  const W = F.w;
  const H = F.h;
  const PH = H / 3;
  const tall = format === "9x16";
  const cut = t >= T.cut;
  // no corte, cada faixa entra com um leve "soco" de escala; os prints também a cada troca
  const punch = (k) => {
    if (!cut) return 1;
    let at = T.cut;
    if (k === 2) SITE_CUTS.forEach((c) => { if (t >= c) at = c; });
    return 1 + 0.05 * Math.exp(-(t - at) * 7);
  };
  const panels = [
    () => <DevPanel t={t} PW={W} PH={PH} tall={tall} />,
    () => <ToolsPanel t={t} PW={W} PH={PH} />,
    () => <SitePanel t={t} />,
  ];
  const ats = [T.dev, T.tools, T.site];
  // no story, o nome da faixa de cima desce para fugir da barra de progresso e do perfil
  const labelTop = (k) => (tall && k === 0 ? 64 : 9);
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: cut ? "#000" : "#FFFFFF", fontFamily: FONT }}>
      {LABELS.map((lb, k) => (
        <div key={lb} style={{ position: "absolute", left: 0, top: k * PH, width: W, height: PH, overflow: "hidden" }}>
          {cut && <div style={{ position: "absolute", inset: 0, transform: `scale(${punch(k)})` }}>{panels[k]()}</div>}
          {cut && <div style={{ position: "absolute", left: 0, top: labelTop(k) - 9, width: "45%", height: "40%", background: "radial-gradient(90% 100% at 0% 0%, rgba(0,0,0,.5), rgba(0,0,0,0) 70%)", zIndex: 4 }} />}
          <Label text={lb} t={t} at={ats[k]} cut={cut} top={labelTop(k)} />
          {!cut && k < 2 && <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 1, background: hexA(C.ink, 0.14) }} />}
        </div>
      ))}
      {cut && (
        // assinatura (como a marca d'água da referência); no story fica no alto da faixa de baixo,
        // longe do campo de resposta
        <div style={{ position: "absolute", right: 10, ...(tall ? { top: PH * 2 + 9 } : { bottom: 9 }), display: "flex", alignItems: "center", gap: 5, opacity: 0.85, zIndex: 6 }}>
          <CubeLogo size={15} />
          <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 10, color: "#fff", textShadow: "0 1px 4px rgba(0,0,0,.6)" }}>estoke ao cubo</div>
        </div>
      )}
      {cut && <div style={{ position: "absolute", left: 0, right: 0, top: PH, height: 1, background: "rgba(0,0,0,.6)", zIndex: 4 }} />}
      {cut && <div style={{ position: "absolute", left: 0, right: 0, top: PH * 2, height: 1, background: "rgba(0,0,0,.6)", zIndex: 4 }} />}
      {cut && <Grain t={t} opacity={0.04} />}
    </div>
  );
}

/* =============================================================================
   Som — a música do vídeo de referência, inteira e sem cortes (o ritmo do motion segue
   a grade dela). Efeitos gravados bem baixos, só nos ícones atravessando a câmera.
============================================================================= */
const MUSIC = { gain: 0.9 };
const SAMPLES = { music: MUSIC_TOOLS.toolsRef, ...SFX };
function buildEvents() {
  const ev = [];
  const fx = (at, name, gain, opts = {}) => ev.push({ t: Math.max(0, at - SFX_PEAK[name] / (opts.rate || 1)), fn: (A, w) => A.sample(name, w, { gain, ...opts }) });
  ev.push({
    t: 0, dur: DURATION,
    fn: (A, w, off = 0) => A.sample("music", w, { off, dur: DURATION - off, gain: MUSIC.gain, fadeIn: 0.02, env: [[0, 1], [DURATION - 0.25, 1], [DURATION, 0]] }),
  });
  PASS.forEach((p, k) => fx(p, "airWhoosh", 0.05, { rate: [1, 1.06, 0.96, 1.1, 1.02][k] }));
  return ev.sort((a, b) => a.t - b.t);
}
const EVENTS = buildEvents();
const renderWav = () => renderEventsWav(EVENTS, DURATION, { samples: SAMPLES });

// Usado pelo exportador de vídeo (scripts/export-video.cjs)
const MOTION = { Frame, duration: DURATION, formats: FORMATS, renderWav };

export default function ToolsReveal() {
  return (
    <MotionPlayer Frame={Frame} duration={DURATION} events={EVENTS} formats={FORMATS} defaultFormat="9x16" renderWav={renderWav} samples={SAMPLES}
      fontsToLoad={[`700 16px "Open Sauce Sans"`]}
      scenes={[
        { name: "Nomes", from: 0 },
        { name: "Corte", from: T.cut },
        { name: "Ferramentas", from: T.dock },
      ]} />
  );
}
