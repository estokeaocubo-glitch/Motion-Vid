import React from "react";
import {
  C, FONT, clamp, lerp, prog, easeOut, easeInOut, spring, hexA,
  Grain, CubeLogo, SyncedVideo, renderEventsWav, MotionPlayer,
} from "./motionKit";
import { AD_CLIP_MP4, AD_CLIP_WEBM, AD_CLIP_DUR } from "./adAssets";
import { TOOLS_DEV, TOOLS_ICONS, TOOLS_DUR, TOOLS_SITES } from "./toolsAssets";
import { MUSIC_TOOLS } from "./audio/distanceTools";
import { SFX, SFX_PEAK } from "./audio/sfx";

/* =============================================================================
   Estoke ao Cubo — "dev / tools / site" (12s, vertical)
   Referência: vídeo "artist / tools / art" (3:4, 11,4s): tela branca dividida em três
   faixas, os nomes "artist", "tools" e "art" aparecem um a um e, quando o beat volta,
   as três faixas viram vídeo ao mesmo tempo (a artista, os materiais na mesa, o desenho).
   Nossa versão, para programação:
     - dev:   programador de costas com os monitores cheios de código (Mixkit 41637)
     - tools: o vídeo enviado (pilha de ícones neon com o Pinterest na frente) e, no mesmo
              estilo, Python, Java, GitHub e Antigravity passando pela câmera; fecha com as
              cinco ferramentas lado a lado, pulsando no beat
     - site:  o que sai disso — a Dizzy (moeda 3D) e os prints de Kaiirós, YMB Cocktails,
              KDust, Trama e Bastos trocando no beat
   Música: "DISTANCE" — o trecho começa no respiro da faixa e o beat volta (67,29s da
   faixa) exatamente no corte para os vídeos (3,79s).
============================================================================= */
const DURATION = 12;
const FORMATS = {
  "3x4": { w: 450, h: 600, label: "3:4" },
  "9x16": { w: 450, h: 800, label: "9:16" },
};
// Batidas da faixa depois do corte (segundos do vídeo)
const BEATS = [3.79, 5.0, 5.9, 6.5, 7.1, 8.39, 9.19, 9.89, 10.49, 11.69];
const T = { dev: 0.75, tools: 1.5, site: 2.25, cut: 3.79, fly: 5.0, dock: 8.39 };
const LABELS = ["dev", "tools", "site"];

/* ---------- Ícones das ferramentas (traço branco sobre o bloco colorido) ---------- */
const ICONS = {
  python: { name: "Python", vb: 24, d: "M14.25.18l.9.2.73.26.59.3.45.32.34.34.25.34.16.33.1.3.04.26.02.2-.01.13V8.5l-.05.63-.13.55-.21.46-.26.38-.3.31-.33.25-.35.19-.35.14-.33.1-.3.07-.26.04-.21.02H8.77l-.69.05-.59.14-.5.22-.41.27-.33.32-.27.35-.2.36-.15.37-.1.35-.07.32-.04.27-.02.21v3.06H3.17l-.21-.03-.28-.07-.32-.12-.35-.18-.36-.26-.36-.36-.35-.46-.32-.59-.28-.73-.21-.88-.14-1.05-.05-1.23.06-1.22.16-1.04.24-.87.32-.71.36-.57.4-.44.42-.33.42-.24.4-.16.36-.1.32-.05.24-.01h.16l.06.01h8.16v-.83H6.18l-.01-2.75-.02-.37.05-.34.11-.31.17-.28.25-.26.31-.23.38-.2.44-.18.51-.15.58-.12.64-.1.71-.06.77-.04.84-.02 1.27.05zm-6.3 1.98l-.23.33-.08.41.08.41.23.34.33.22.41.09.41-.09.33-.22.23-.34.08-.41-.08-.41-.23-.33-.33-.22-.41-.09-.41.09zm13.09 3.95l.28.06.32.12.35.18.36.27.36.35.35.47.32.59.28.73.21.88.14 1.04.05 1.23-.06 1.23-.16 1.04-.24.86-.32.71-.36.57-.4.45-.42.33-.42.24-.4.16-.36.09-.32.05-.24.02-.16-.01h-8.22v.82h5.84l.01 2.76.02.36-.05.34-.11.31-.17.29-.25.25-.31.24-.38.2-.44.17-.51.15-.58.13-.64.09-.71.07-.77.04-.84.01-1.27-.04-1.07-.14-.9-.2-.73-.25-.59-.3-.45-.33-.34-.34-.25-.34-.16-.33-.1-.3-.04-.25-.02-.2.01-.13v-5.34l.05-.64.13-.54.21-.46.26-.38.3-.32.33-.24.35-.2.35-.14.33-.1.3-.06.26-.04.21-.02.13-.01h5.84l.69-.05.59-.14.5-.21.41-.28.33-.32.27-.35.2-.36.15-.36.1-.35.07-.32.04-.28.02-.21V6.07h2.09l.14.01zm-6.47 14.25l-.23.33-.08.41.08.41.23.33.33.23.41.08.41-.08.33-.23.23-.33.08-.41-.08-.41-.23-.33-.33-.23-.41-.08-.41.08z", bg: ["#5A9AD0", "#2B5F8E"], glow: "#4B8BBE", accent: "#FFD43B" },
  java: { name: "Java", vb: 128, d: "M47.617 98.12c-19.192 5.362 11.677 16.439 36.115 5.969-4.003-1.556-6.874-3.351-6.874-3.351-10.897 2.06-15.952 2.222-25.844 1.092-8.164-.935-3.397-3.71-3.397-3.71zm33.189-10.46c-14.444 2.779-22.787 2.69-33.354 1.6-8.171-.845-2.822-4.805-2.822-4.805-21.137 7.016 11.767 14.977 41.309 6.336-3.14-1.106-5.133-3.131-5.133-3.131zm11.319-60.575c.001 0-42.731 10.669-22.323 34.187 6.024 6.935-1.58 13.17-1.58 13.17s15.289-7.891 8.269-17.777c-6.559-9.215-11.587-13.793 15.634-29.58zm9.998 81.144s3.529 2.91-3.888 5.159c-14.102 4.272-58.706 5.56-71.095.171-4.45-1.938 3.899-4.625 6.526-5.192 2.739-.593 4.303-.485 4.303-.485-4.952-3.487-32.013 6.85-13.742 9.815 49.821 8.076 90.817-3.637 77.896-9.468zM85 77.896c2.395-1.634 5.703-3.053 5.703-3.053s-9.424 1.685-18.813 2.474c-11.494.964-23.823 1.154-30.012.326-14.652-1.959 8.033-7.348 8.033-7.348s-8.812-.596-19.644 4.644C17.455 81.134 61.958 83.958 85 77.896zm5.609 15.145c-.108.29-.468.616-.468.616 31.273-8.221 19.775-28.979 4.822-23.725-1.312.464-2 1.543-2 1.543s.829-.334 2.678-.72c7.559-1.575 18.389 10.119-5.032 22.286zM64.181 70.069c-4.614-10.429-20.26-19.553.007-35.559C89.459 14.563 76.492 1.587 76.492 1.587c5.23 20.608-18.451 26.833-26.999 39.667-5.821 8.745 2.857 18.142 14.688 28.815zm27.274 51.748c-19.187 3.612-42.854 3.191-56.887.874 0 0 2.874 2.38 17.646 3.331 22.476 1.437 57-.8 57.816-11.436.001 0-1.57 4.032-18.575 7.231z", bg: ["#FFA733", "#E35F00"], glow: "#F89820" },
  github: { name: "GitHub", vb: 24, d: "M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12", bg: ["#454B55", "#14181E"], glow: "#A8B3C4" },
  antigravity: { name: "Antigravity", vb: 24, d: "M21.751 22.607c1.34 1.005 3.35.335 1.508-1.508C17.73 15.74 18.904 1 12.037 1 5.17 1 6.342 15.74.815 21.1c-2.01 2.009.167 2.511 1.507 1.506 5.192-3.517 4.857-9.714 9.715-9.714 4.857 0 4.522 6.197 9.714 9.715z", bg: ["#4285F4", "#34A853", "#FBBC05", "#EA4335"], glow: "#4285F4" },
  pinterest: { name: "Pinterest", vb: 24, d: "M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z", bg: ["#FF2A4B", "#C8001C"], glow: "#E60023" },
};
const FLY = ["python", "java", "github", "antigravity"];
const DOCK = ["python", "java", "github", "antigravity", "pinterest"];

function Tile({ id, size, glow = 1, style }) {
  const k = ICONS[id];
  const bg = k.bg.length > 2 ? `linear-gradient(135deg, ${k.bg.join(", ")})` : `linear-gradient(160deg, ${k.bg[0]}, ${k.bg[1]})`;
  return (
    <div style={{
      position: "absolute", width: size, height: size, borderRadius: size * 0.24, background: bg,
      boxShadow: `0 0 ${size * 0.32 * glow}px ${hexA(k.glow, 0.75)}, 0 0 ${size * 0.08}px ${hexA(k.glow, 0.9)}, inset 0 ${size * 0.04}px ${size * 0.05}px rgba(255,255,255,.35)`,
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
// Cada ícone passa pela câmera numa batida (5,9 · 6,5 · 7,1 · 8,0s)
const PASS = [5.9, 6.5, 7.1, 8.0];
function camZ(t) {
  // posição da câmera: avança aos trancos, acelerando em cada batida
  const keys = [[T.fly, -2.6], ...PASS.map((p, k) => [p, k * 2.2 - 0.35]), [T.dock, 3 * 2.2 + 0.4]];
  for (let i = 0; i < keys.length - 1; i++) {
    const [a, za] = keys[i];
    const [b, zb] = keys[i + 1];
    if (t <= b) return lerp(za, zb, easeInOut(prog(t, a, b)));
  }
  return keys[keys.length - 1][1];
}
function FlyThrough({ t, PW, PH }) {
  const cz = camZ(t);
  const base = PH * 0.42;
  const items = FLY.map((id, k) => {
    const d = k * 2.2 - cz;
    if (d < 0.18 || d > 9) return null;
    const s = 1 / d;
    const size = base * s;
    // pilha em diagonal (cada ícone um pouco à direita e acima do anterior); a câmera
    // acompanha a pilha e deixa o ícone da vez levemente à esquerda, saindo pela borda
    const f = (cz + 0.35) / 2.2;
    const x = PW / 2 + (k * 0.55 - (f * 0.55 + 0.14)) * PH * s;
    const y = PH / 2 + (-k * 0.12 + f * 0.12) * PH * s;
    const op = clamp((d - 0.18) / 0.3) * clamp((9 - d) / 3);
    return (
      <Tile key={id} id={id} size={size} glow={1.1} style={{
        left: x - size / 2, top: y - size / 2, opacity: op, zIndex: Math.round(1000 - d * 100),
        transform: `perspective(${PH * 2}px) rotateY(${-22 + 10 / (1 + d)}deg) rotateZ(${-7}deg)`,
      }} />
    );
  });
  return <div style={{ position: "absolute", inset: 0, background: "#000" }}>{items}</div>;
}

/* ---------- tools: as cinco ferramentas lado a lado ---------- */
function Dock({ t, PW, PH }) {
  const u = t - T.dock;
  const n = DOCK.length;
  const size = Math.min(PW / (n + 1.6), PH * 0.42);
  const gap = size * 0.28;
  const total = n * size + (n - 1) * gap;
  const x0 = (PW - total) / 2;
  const after = BEATS.filter((b) => b > T.dock + 0.3);
  return (
    <div style={{ position: "absolute", inset: 0, background: "radial-gradient(60% 80% at 50% 55%, #0B1830, #000 70%)" }}>
      {DOCK.map((id, k) => {
        const p = spring(u - k * 0.08, { stiffness: 260, damping: 15 });
        // pulso no beat: cada batida acende um ícone, da esquerda para a direita
        let pulse = 0;
        after.forEach((b, j) => { if (j % n === k) pulse = Math.max(pulse, Math.exp(-Math.max(0, t - b) * 6) * (t >= b ? 1 : 0)); });
        const float = Math.sin((t + k * 0.4) * 2.4) * size * 0.03;
        const sc = clamp(p, 0, 1.2) * (1 + pulse * 0.12);
        return (
          <React.Fragment key={id}>
            <Tile id={id} size={size} glow={0.8 + pulse * 0.9} style={{
              left: x0 + k * (size + gap), top: PH * 0.47 - size / 2 + float,
              transform: `scale(${sc})`, opacity: clamp(p * 2),
            }} />
            <div style={{
              position: "absolute", left: x0 + k * (size + gap) - gap, width: size + gap * 2, top: PH * 0.47 + size * 0.62,
              textAlign: "center", fontFamily: FONT, fontWeight: 600, fontSize: Math.max(8, size * 0.17), color: "#fff",
              opacity: clamp((u - 0.35 - k * 0.08) * 4) * 0.72, whiteSpace: "nowrap",
            }}>{ICONS[id].name}</div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

function ToolsPanel({ t, PW, PH }) {
  if (t < T.fly) {
    // vídeo enviado: a pilha de ícones neon com o Pinterest na frente
    return <SyncedVideo t={clamp(t - T.cut, 0, TOOLS_DUR.ICONS - 0.04)} duration={TOOLS_DUR.ICONS} webm={TOOLS_ICONS.webm} mp4={TOOLS_ICONS.mp4} style={{ background: "#000" }} />;
  }
  if (t < T.dock) return <FlyThrough t={t} PW={PW} PH={PH} />;
  return <Dock t={t} PW={PW} PH={PH} />;
}

/* ---------- site: Dizzy e os prints trocando no beat ---------- */
const SITE_CUTS = [6.5, 7.1, 8.39, 9.19, 9.89]; // Kaiirós, YMB, KDust, Trama, Bastos
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
function Label({ text, t, at, cut }) {
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
    <div style={{ position: "absolute", left: 12, top: 9, fontFamily: FONT, fontWeight: 700, fontSize: 13, color: "#fff", letterSpacing: "-0.01em", textShadow: "0 1px 6px rgba(0,0,0,.55)", zIndex: 5 }}>{text}</div>
  );
}

function Frame({ t, format = "3x4" }) {
  const F = FORMATS[format];
  const W = F.w;
  const H = F.h;
  const PH = H / 3;
  const cut = t >= T.cut;
  // no corte, cada faixa entra com um leve "soco" de escala
  const punch = cut ? 1 + 0.05 * Math.exp(-(t - T.cut) * 7) : 1;
  const panels = [
    () => <SyncedVideo t={clamp(t - T.cut, 0, TOOLS_DUR.DEV - 0.04)} duration={TOOLS_DUR.DEV} webm={TOOLS_DEV.webm} mp4={TOOLS_DEV.mp4} style={{ objectPosition: "50% 40%" }} />,
    () => <ToolsPanel t={t} PW={W} PH={PH} />,
    () => <SitePanel t={t} />,
  ];
  const ats = [T.dev, T.tools, T.site];
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: cut ? "#000" : "#FFFFFF", fontFamily: FONT }}>
      {LABELS.map((lb, k) => (
        <div key={lb} style={{ position: "absolute", left: 0, top: k * PH, width: W, height: PH, overflow: "hidden" }}>
          {cut && <div style={{ position: "absolute", inset: 0, transform: `scale(${punch})` }}>{panels[k]()}</div>}
          <Label text={lb} t={t} at={ats[k]} cut={cut} />
          {!cut && k < 2 && <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 1, background: hexA(C.ink, 0.14) }} />}
        </div>
      ))}
      {cut && (
        // assinatura no canto, como a marca d'água da referência
        <div style={{ position: "absolute", right: 10, bottom: 9, display: "flex", alignItems: "center", gap: 5, opacity: 0.85, zIndex: 6 }}>
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
   Som — "DISTANCE": respiro da faixa (reforçado) com os nomes aparecendo e o beat
   voltando no corte. Efeitos gravados bem baixos, só para marcar os movimentos.
============================================================================= */
const MUSIC = { drop: 3.79, gain: 0.5 }; // beat de 67,29s da faixa dentro do trecho (começa em 63,5s)
const SAMPLES = { music: MUSIC_TOOLS.distanceTools, ...SFX };
function buildEvents() {
  const ev = [];
  const fx = (at, name, gain, opts = {}) => ev.push({ t: Math.max(0, at - SFX_PEAK[name] / (opts.rate || 1)), fn: (A, w) => A.sample(name, w, { gain, ...opts }) });
  ev.push({
    t: 0, dur: DURATION,
    fn: (A, w, off = 0) => A.sample("music", w, {
      off, dur: DURATION - off, gain: MUSIC.gain, fadeIn: 0.05,
      env: [[0, 1.9], [MUSIC.drop - 0.03, 1.9], [MUSIC.drop, 1], [DURATION - 0.7, 1], [DURATION, 0]],
    }),
  });
  [T.dev, T.tools, T.site].forEach((at, i) => fx(at, "lightPop", 0.07, { rate: [1, 1.07, 1.14][i] }));
  fx(T.cut, "deepHit", 0.1);
  fx(T.fly, "airSweep", 0.07);
  PASS.forEach((p, k) => fx(p, "airWhoosh", 0.06, { rate: [1, 1.06, 0.96, 1.1][k] }));
  DOCK.forEach((_, k) => fx(T.dock + k * 0.08 + 0.05, "bubblePop", 0.04, { rate: 1 + k * 0.05 }));
  SITE_CUTS.forEach((c, k) => fx(c, "smallSweep", 0.035, { rate: [1, 1.05, 0.97, 1.08, 1.02][k] }));
  return ev.sort((a, b) => a.t - b.t);
}
const EVENTS = buildEvents();
const renderWav = () => renderEventsWav(EVENTS, DURATION, { samples: SAMPLES });

// Usado pelo exportador de vídeo (scripts/export-video.cjs)
const MOTION = { Frame, duration: DURATION, formats: FORMATS, renderWav };

export default function ToolsReveal() {
  return (
    <MotionPlayer Frame={Frame} duration={DURATION} events={EVENTS} formats={FORMATS} defaultFormat="3x4" renderWav={renderWav} samples={SAMPLES}
      fontsToLoad={[`700 16px "Open Sauce Sans"`]}
      scenes={[
        { name: "Nomes", from: 0 },
        { name: "Corte", from: T.cut },
        { name: "Ícones", from: T.fly },
        { name: "Ferramentas", from: T.dock },
      ]} />
  );
}
