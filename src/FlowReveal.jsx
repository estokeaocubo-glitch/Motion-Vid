import React from "react";
import {
  C, FONT, DISP, clamp, lerp, prog, easeOut, easeIn, easeInOut, rnd, spring, hexA, midi, tone, hiss,
  Grain, CubeLogo, SND, renderEventsWav, MotionPlayer,
} from "./motionKit";
import { FLOW_SHOTS } from "./flowAssets";
import { FLOW_VARIANT } from "./flow/variant";
import { MUSIC_FLOW } from "./audio/miamiFlow";
import { TAPE } from "./audio/tape";

/* =============================================================================
   Estoke ao Cubo — "Venda no automático" (fluxo → projetos → cubo)
   Referência: 587c2d7b4c2af98f4c64e2a105233105_720w.mp4 (16:9, 15s): cards de vidro de um
   fluxo de automação surgem um a um com a câmera acompanhando; zoom out vira bolinhas com
   ícone; da última saem criativos em 3D; tudo vira pontos brancos com ondas e os traços
   desenham o símbolo da marca entre duas palavras.
   Nossa versão: gradiente azul/ciano da marca, fluxo de uma venda automática (pedido →
   estoque → NF-e → envio → WhatsApp → reposição → avaliação), os criativos são sites que
   fizemos (Misú, LCS, Noka, Dizzy) e os traços desenham o cubo da logo entre
   "VENDA" e "no automático".
============================================================================= */
const DURATION = 18;
const ALL_FORMATS = {
  "16x9": { w: 800, h: 450, label: "16:9" },
  "9x16": { w: 450, h: 800, label: "9:16" },
  story: { w: 450, h: 800, label: "Story" },
};
const FORMATS = Object.fromEntries(FLOW_VARIANT.formats.map((f) => [f, ALL_FORMATS[f]]));
// z: zoom base da câmera · R: raio do cubo final · stack: palavras acima/abaixo do cubo
const LAYOUT = {
  "16x9": { z: 1, R: 62, stack: false, word: 34, cam: "wide" },
  "9x16": { z: 1, R: 70, stack: true, word: 34, cam: "tall" },
  // Story: fluxo em escadinha vertical (preenche a altura), conteúdo fora das faixas de
  // interface do Instagram (~14% no topo, ~20% no rodapé) e chamada no final
  story: { z: 1, R: 74, stack: true, word: 38, cam: "story", nodes: "story", spreadY: 1.7, cy: 0.47, mark: 186, cta: true, ctaY: 84 },
};
const T = { morph: 6.1, morphEnd: 7.3, burst: 8.45, round: 10.5, collapse: 11.1, line: 12.2, draw: 12.6, cube: 14.3, words: 14.55, mark: 15.6 };

/* ---------- Fluxo (coordenadas de mundo) ---------- */
const CW = 340;
const CHH = 58;
const DOT = 36;
const NODES = [
  { label: "Pedido recebido", pill: "Agora", icon: "bag", x: 0, y: 0, d: [0, 0], t: 0.35, s: [-24, 0] },
  { label: "Baixa no estoque", pill: "Automático", icon: "box", x: 0, y: 84, d: [0, 58], t: 1.05, s: [-24, 84] },
  { label: "NF-e emitida", pill: "Em 1 min", icon: "receipt", x: 0, y: 168, d: [0, 116], t: 1.75, s: [-24, 168] },
  { label: "Etiqueta de envio", pill: "Em 5 min", icon: "tag", x: 360, y: 168, d: [64, 116], t: 2.45, s: [0, 252] },
  { label: "Cliente no WhatsApp", pill: "Em 10 min", icon: "chat", x: 360, y: 252, d: [64, 174], t: 3.15, s: [0, 336] },
  { label: "Estoque baixo?", pill: "Verificar", icon: "alert", x: 720, y: 252, d: [128, 174], t: 3.85, s: [24, 420] },
  { label: "Pedido ao fornecedor", pill: "Automático", icon: "truck", x: 720, y: 336, d: [128, 232], t: 4.55, s: [24, 504] },
  { label: "Pedir avaliação", pill: "Após 3 dias", icon: "star", x: 720, y: 420, d: [128, 290], t: 5.25, s: [24, 588] },
];
const KEEP = [4, 5, 6, 7]; // viram os 4 pontos brancos que desenham o cubo
const ICON_PATHS = {
  bag: "M6 8h12l-1 12H7L6 8z M9 8V6a3 3 0 0 1 6 0v2",
  box: "M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z M4 7.5l8 4.5 8-4.5 M12 12v9",
  receipt: "M6 3h12v18l-3-2-3 2-3-2-3 2V3z M9 8h6 M9 12h6 M9 16h4",
  tag: "M3 12V4h8l10 10-7 7L3 12z M7.5 8h.01",
  chat: "M4 12a8 8 0 1 1 3.5 6.6L4 20l1.4-3.6A8 8 0 0 1 4 12z M9 12h.01 M12 12h.01 M15 12h.01",
  alert: "M12 4l9 16H3L12 4z M12 10v4 M12 17h.01",
  truck: "M2 7h11v9H2z M13 10h4l3 3v3h-7 M6 18.5h.01 M17 18.5h.01",
  star: "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3z",
};
function LineIcon({ name, size, color = C.ink }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} style={{ display: "block" }}>
      <path d={ICON_PATHS[name]} fill="none" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ---------- Câmera: spline (Catmull-Rom/Hermite) por chaves [t, x, y, zoom] ---------- */
const CAM = [
  [0, 60, 30, 1.55],
  [1.05, 60, 70, 1.5],
  [1.75, 100, 130, 1.42],
  [2.45, 230, 170, 1.32],
  [3.15, 330, 215, 1.25],
  [3.85, 545, 250, 1.15],
  [4.55, 600, 300, 1.08],
  [5.25, 615, 330, 1.02],
  [6.1, 360, 210, 0.72],
  [7.3, 64, 145, 1.45],
  [8.3, 128, 300, 1.4],
  [9.3, 115, 390, 1.12],
  [11.1, 120, 380, 1.18],
];
// 9:16: a câmera segue cada card de perto (o fluxo é largo) e só abre no panorama
const CAM_TALL = [
  [0, 0, 30, 1.25],
  [1.05, 0, 70, 1.25],
  [1.75, 0, 125, 1.22],
  [2.45, 360, 165, 1.2],
  [3.15, 360, 215, 1.2],
  [3.85, 720, 250, 1.18],
  [4.55, 720, 300, 1.15],
  [5.25, 720, 345, 1.12],
  [6.1, 360, 210, 0.42],
  [7.3, 64, 145, 1.6],
  [8.3, 128, 300, 1.5],
  [9.3, 118, 400, 0.8],
  [11.1, 120, 390, 0.86],
];
const CAM_STORY = [
  [0, 0, 70, 1.08],
  [1.05, 0, 110, 1.08],
  [1.75, 0, 160, 1.08],
  [2.45, 0, 225, 1.08],
  [3.15, 0, 290, 1.08],
  [3.85, 0, 355, 1.08],
  [4.55, 0, 420, 1.07],
  [5.25, 0, 470, 1.06],
  [6.1, 0, 324, 0.8],
  [7.3, 64, 150, 1.6],
  [8.3, 128, 300, 1.5],
  [9.3, 112, 470, 0.78],
  [11.1, 116, 460, 0.84],
];
const CAMS = { wide: CAM, tall: CAM_TALL, story: CAM_STORY };
function camAt(t, which = "wide") {
  const K = CAMS[which];
  if (t <= K[0][0]) return { x: K[0][1], y: K[0][2], z: K[0][3] };
  if (t >= K[K.length - 1][0]) { const k = K[K.length - 1]; return { x: k[1], y: k[2], z: k[3] }; }
  let i = 0;
  while (t > K[i + 1][0]) i++;
  const a = K[i];
  const b = K[i + 1];
  const dt = b[0] - a[0];
  const u = (t - a[0]) / dt;
  const tan = (j, c) => {
    const p = K[Math.max(0, j - 1)];
    const n = K[Math.min(K.length - 1, j + 1)];
    return ((n[c] - p[c]) / Math.max(1e-6, n[0] - p[0])) * dt;
  };
  const h00 = 2 * u ** 3 - 3 * u ** 2 + 1;
  const h10 = u ** 3 - 2 * u ** 2 + u;
  const h01 = -2 * u ** 3 + 3 * u ** 2;
  const h11 = u ** 3 - u ** 2;
  const v = (c) => h00 * a[c] + h10 * tan(i, c) + h01 * b[c] + h11 * tan(i + 1, c);
  return { x: v(1), y: v(2), z: v(3) };
}

/* ---------- Fundo: gradiente da marca com manchas de luz que derivam ---------- */
function FlowBg({ t, W, H }) {
  const blob = (x, y, r, color, a) => (
    <div style={{ position: "absolute", left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: "50%", background: `radial-gradient(circle, ${hexA(color, a)} 0%, ${hexA(color, a * 0.45)} 38%, ${hexA(color, 0)} 70%)` }} />
  );
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: `linear-gradient(140deg, ${C.ink} 0%, #0A5FA6 42%, ${C.blue} 70%, ${C.sky} 100%)` }}>
      {blob(W * (0.72 + 0.08 * Math.sin(t * 0.35)), H * (0.25 + 0.06 * Math.cos(t * 0.3)), Math.max(W, H) * 0.42, C.ice, 0.55)}
      {blob(W * (0.2 + 0.06 * Math.cos(t * 0.28)), H * (0.8 + 0.05 * Math.sin(t * 0.4)), Math.max(W, H) * 0.45, C.ink, 0.6)}
      {blob(W * (0.45 + 0.1 * Math.sin(t * 0.22 + 1)), H * (0.5 + 0.08 * Math.sin(t * 0.31)), Math.max(W, H) * 0.32, C.cyan, 0.32)}
      {blob(W * (0.9 + 0.04 * Math.sin(t * 0.5)), H * (0.92 + 0.04 * Math.cos(t * 0.45)), Math.max(W, H) * 0.3, "#FFFFFF", 0.22)}
    </div>
  );
}

/* ---------- Fluxo no mundo (cards → bolinhas) ---------- */
function nodeGeom(n, t, L) {
  const m = easeInOut(prog(t, T.morph, T.morphEnd));
  const [bx, by] = L.nodes === "story" ? n.s : [n.x, n.y];
  return { m, x: lerp(bx, n.d[0], m), y: lerp(by, n.d[1], m), w: lerp(CW, DOT, m), h: lerp(CHH, DOT, m) };
}
function Flow({ t, W, H, L }) {
  const cam = camAt(t, L.cam);
  const z = cam.z * L.z;
  const fade = 1 - prog(t, T.collapse - 0.25, T.collapse + 0.1);
  const iconOut = prog(t, T.round, T.collapse - 0.1); // ícones somem, bolinhas ficam brancas lisas
  const geo = NODES.map((n) => nodeGeom(n, t, L));
  return (
    <div style={{ position: "absolute", left: 0, top: 0, transformOrigin: "0 0", transform: `translate(${W / 2}px, ${H / 2}px) scale(${z}) translate(${-cam.x}px, ${-cam.y}px)` }}>
      {/* conexões */}
      {NODES.slice(1).map((n, i) => {
        const a = geo[i];
        const b = geo[i + 1];
        const e = easeOut(prog(t, n.t - 0.3, n.t + 0.02));
        if (e <= 0) return null;
        const horiz = Math.abs(b.y - a.y) < 1;
        const x0 = Math.min(a.x, a.x + (b.x - a.x) * e);
        const y0 = Math.min(a.y, a.y + (b.y - a.y) * e);
        const len = horiz ? Math.abs(b.x - a.x) * e : Math.abs(b.y - a.y) * e;
        return (
          <div key={i} style={{
            position: "absolute", left: horiz ? x0 : a.x - 0.8, top: horiz ? a.y - 0.8 : y0, width: horiz ? len : 1.6, height: horiz ? 1.6 : len,
            background: "rgba(255,255,255,.7)", opacity: fade,
          }} />
        );
      })}
      {NODES.map((n, i) => {
        const g = geo[i];
        const a = spring(t - n.t, { stiffness: 170, damping: 16 });
        if (a <= 0) return null;
        const o = clamp(a * 2) * (KEEP.includes(i) && t >= T.collapse ? 0 : fade);
        if (o <= 0) return null;
        // profundidade de campo: cards longe do centro da tela desfocam (fase do fluxo)
        const sx = (g.x - cam.x) * z;
        const sy = (g.y - cam.y) * z;
        const far = Math.max(Math.abs(sx) / (W / 2), Math.abs(sy) / (H / 2));
        const dof = (1 - g.m) * Math.max(0, far - 0.78) * 5;
        const textO = 1 - prog(g.m, 0, 0.4);
        const fresh = Math.exp(-Math.max(0, t - n.t) * 2.5) * (t > n.t ? 1 : 0);
        return (
          <div key={i} style={{
            position: "absolute", left: g.x - g.w / 2, top: g.y - g.h / 2, width: g.w, height: g.h, borderRadius: lerp(12, DOT / 2, g.m), boxSizing: "border-box",
            opacity: o, transform: `translateY(${(1 - clamp(a)) * 18}px) scale(${lerp(0.94, 1, clamp(a))})`, filter: dof > 0.2 ? `blur(${dof}px)` : "none",
            background: `rgba(255,255,255,${lerp(0.2, 1, g.m)})`, border: "1px solid rgba(255,255,255,.55)",
            backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
            boxShadow: `0 10px 26px rgba(0,30,70,.22), inset 0 1px 0 rgba(255,255,255,.45), 0 0 ${18 * fresh}px ${hexA(C.cyan, 0.7 * fresh)}`,
          }}>
            <div style={{
              position: "absolute", left: lerp(13, (DOT - 30) / 2, g.m), top: (g.h - 30) / 2, width: 30, height: 30, borderRadius: 8, background: "#FFFFFF",
              display: "grid", placeItems: "center", opacity: 1 - iconOut,
            }}>
              <LineIcon name={n.icon} size={17} />
            </div>
            {textO > 0 && (
              <>
                <div style={{ position: "absolute", left: 54, top: 0, height: g.h, display: "flex", alignItems: "center", fontFamily: FONT, fontWeight: 600, fontSize: 14.5, color: "#FFFFFF", whiteSpace: "nowrap", opacity: textO, letterSpacing: "-0.01em" }}>
                  {n.label}
                </div>
                <div style={{
                  position: "absolute", right: 11, top: (g.h - 26) / 2, height: 26, padding: "0 9px 0 11px", borderRadius: 99, background: "#FFFFFF", opacity: textO,
                  display: "flex", alignItems: "center", gap: 6, fontFamily: FONT, fontWeight: 700, fontSize: 11.5, color: C.ink, whiteSpace: "nowrap",
                }}>
                  {n.pill}
                  <span style={{ width: 7, height: 7, borderRadius: 7, background: C.ink }} />
                </div>
              </>
            )}
          </div>
        );
      })}
      <Projects t={t} L={L} />
    </div>
  );
}

/* ---------- Projetos: saem da última bolinha em 3D, flutuam e viram pontos ---------- */
const SHOTS = [
  { img: "lcs", w: 156, h: 98, dx: -205, dy: 70, rot: -5, ry: 16, d: 0 },
  { img: "misuLogo", w: 96, h: 122, dx: -118, dy: 128, rot: 4, ry: 10, d: 0.07 },
  { img: "misu", w: 156, h: 98, dx: -40, dy: 190, rot: 2, ry: -8, d: 0.14 },
  { img: "noka", w: 156, h: 98, dx: 110, dy: 165, rot: -3, ry: -14, d: 0.21 },
  { img: "nokaLogo", w: 104, h: 100, dx: 190, dy: 80, rot: 6, ry: -18, d: 0.28 },
  { img: "dizzy", w: 156, h: 98, dx: 58, dy: 92, rot: -2, ry: 6, d: 0.35 },
];
function Projects({ t, L }) {
  if (t < T.burst - 0.05 || t > T.collapse + 0.2) return null;
  const [ox, oy] = NODES[NODES.length - 1].d;
  return SHOTS.map((s, i) => {
    const a = spring(t - T.burst - s.d, { stiffness: 120, damping: 12 });
    if (a <= 0) return null;
    const q = easeInOut(prog(t, T.round + s.d * 0.35, T.round + 0.5 + s.d * 0.35)); // vira ponto
    const back = easeIn(prog(t, T.collapse - 0.35 + s.d * 0.2, T.collapse + 0.05));
    const fl = Math.sin(t * 1.6 + i * 1.9) * 5;
    const x = ox + s.dx * clamp(a, 0, 1.1) * (1 - back);
    const y = oy + (s.dy * (L.spreadY || 1) + fl) * clamp(a, 0, 1.1) * (1 - back);
    const w = lerp(s.w, 18, q);
    const h = lerp(s.h, 18, q);
    return (
      <div key={s.img} style={{
        position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h, zIndex: 5 + i, opacity: clamp(a * 3) * (1 - prog(back, 0.6, 1)),
        transform: `perspective(600px) rotateY(${lerp(70, s.ry, clamp(a)) * (1 - q)}deg) rotate(${s.rot * (1 - q)}deg) scale(${lerp(0.3, 1, clamp(a, 0, 1.15))})`,
        borderRadius: lerp(6, 9, q), overflow: "hidden", background: "#FFFFFF",
        boxShadow: `0 ${16 * (1 - q)}px ${34 * (1 - q)}px rgba(0,20,50,.4)`,
      }}>
        <img src={FLOW_SHOTS[s.img]} alt="" draggable={false} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", opacity: 1 - q }} />
      </div>
    );
  });
}

/* ---------- Pontos brancos → ondas → cubo desenhado ---------- */
const hexPt = (cx, cy, R, k) => {
  const a = ((-90 + 60 * k) * Math.PI) / 180;
  return [cx + Math.cos(a) * R, cy + Math.sin(a) * R];
};
function hexAlong(cx, cy, R, f) {
  const u = ((f % 1) + 1) % 1 * 6;
  const k = Math.floor(u);
  const [x0, y0] = hexPt(cx, cy, R, k);
  const [x1, y1] = hexPt(cx, cy, R, k + 1);
  return [lerp(x0, x1, u - k), lerp(y0, y1, u - k)];
}
function Finale({ t, W, H, L }) {
  if (t < T.collapse - 0.02) return null;
  const cx = W / 2;
  const cy = L.stack ? H * (L.cy || 0.48) : H / 2;
  const R = L.R;
  const cam = camAt(T.collapse, L.cam);
  const z = cam.z * L.z;
  // posições de partida: onde as bolinhas estavam na tela no instante do colapso
  const starts = KEEP.map((i) => [W / 2 + (NODES[i].d[0] - cam.x) * z, H / 2 + (NODES[i].d[1] - cam.y) * z]);
  const line = [[cx + 34, cy - 100], [cx + 24, cy - 36], [cx + 18, cy + 18], [cx - 30, cy + 92]];
  const target = [hexPt(cx, cy, R, 0), hexPt(cx, cy, R, 2), hexPt(cx, cy, R, 4), [cx, cy]];
  const orbitF = [0, 2 / 6, 4 / 6];
  const p1 = easeInOut(prog(t, T.collapse, T.collapse + 0.75));
  const p2 = easeInOut(prog(t, T.line, T.line + 0.7));
  const dots = KEEP.map((_, j) => {
    let [x, y] = [lerp(starts[j][0], line[j][0], p1), lerp(starts[j][1], line[j][1], p1)];
    [x, y] = [lerp(x, target[j][0], p2), lerp(y, target[j][1], p2) - Math.sin(p2 * Math.PI) * 18];
    if (j < 3 && t > T.line + 0.7) [x, y] = hexAlong(cx, cy, R, orbitF[j] + (t - T.line - 0.7) * 0.07);
    return [x, y];
  });
  const size = lerp(lerp(DOT * z, 16, p1), 8, p2);
  const hexD = easeInOut(prog(t, T.draw, T.draw + 1.0));
  const yD = easeInOut(prog(t, T.draw + 0.6, T.draw + 1.4));
  const hexPath = `M${[0, 1, 2, 3, 4, 5, 6].map((k) => hexPt(cx, cy, R, k).join(" ")).join(" L")}`;
  const inner = [1, 5, 3].map((k) => `M${cx} ${cy} L${hexPt(cx, cy, R, k).join(" ")}`).join(" ");
  const cube = spring(t - T.cube, { stiffness: 110, damping: 12 });
  const lineO = 1 - p2;
  const wordP = (t0) => easeOut(prog(t, t0, t0 + 0.7));
  const wl = wordP(T.words);
  const wr = wordP(T.words + 0.4);
  const mark = easeOut(prog(t, T.mark, T.mark + 0.6));
  const cta = spring(t - T.mark - 0.35, { stiffness: 150, damping: 13 });
  const drift = 1 + easeOut(prog(t, T.cube, DURATION)) * 0.04;
  const wordStyle = (p) => ({
    clipPath: `inset(-20% ${(1 - p) * 100}% -20% 0)`, filter: p < 1 ? `blur(${(1 - p) * 6}px)` : "none", opacity: clamp(p * 2),
    transform: `translateX(${(1 - p) * -14}px)`, whiteSpace: "nowrap",
  });
  return (
    <div style={{ position: "absolute", inset: 0, transform: `scale(${drift})`, transformOrigin: `${cx}px ${cy}px` }}>
      {/* ondas concêntricas */}
      {t > T.collapse + 0.3 && [0, 1, 2, 3, 4].map((j) => {
        const tt = t - T.collapse - 0.3 - j * 0.35;
        if (tt < 0) return null;
        const r = 40 + tt * 150;
        const o = clamp(tt * 2) * Math.max(0, 1 - tt / 3.2) * 0.5;
        return <div key={j} style={{ position: "absolute", left: cx - r, top: cy - r, width: r * 2, height: r * 2, borderRadius: "50%", border: "18px solid rgba(255,255,255,.12)", filter: "blur(8px)", opacity: o }} />;
      })}
      <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {lineO > 0 && <path d={`M${dots.map((d) => d.join(" ")).join(" L")}`} fill="none" stroke="rgba(255,255,255,.8)" strokeWidth="1.5" opacity={lineO * clamp((t - T.collapse) * 3)} />}
        {hexD > 0 && <path d={hexPath} fill="none" stroke="#FFFFFF" strokeWidth="1.5" strokeLinejoin="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - hexD} opacity={lerp(1, 0.55, clamp(cube))} />}
        {yD > 0 && <path d={inner} fill="none" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - yD} opacity={lerp(1, 0.4, clamp(cube))} />}
      </svg>
      {/* cubo de vidro da logo se materializa dentro do traço */}
      {cube > 0 && (
        <div style={{ position: "absolute", left: cx, top: cy, transform: `translate(-50%, -50%) scale(${lerp(0.6, 1, clamp(cube, 0, 1.15))})`, opacity: clamp(cube * 2) }}>
          <CubeLogo size={R * 1.92} glow={1.1} />
        </div>
      )}
      {dots.map(([x, y], j) => (
        <div key={j} style={{
          position: "absolute", left: x - size / 2, top: y - size / 2, width: size, height: size, borderRadius: "50%", background: "#FFFFFF",
          boxShadow: "0 0 12px rgba(255,255,255,.7)", opacity: j === 3 ? 1 - clamp(cube * 3) : 1,
        }} />
      ))}
      {L.stack ? (
        <>
          <div style={{ position: "absolute", left: 0, right: 0, top: cy - R - 92, textAlign: "center", display: "flex", justifyContent: "center" }}>
            <div style={{ ...DISP, fontSize: L.word, color: "#FFFFFF", ...wordStyle(wl) }}>Venda</div>
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: cy + R + 40, display: "flex", justifyContent: "center" }}>
            <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: L.word, letterSpacing: "-0.03em", color: "#FFFFFF", ...wordStyle(wr) }}>no automático</div>
          </div>
        </>
      ) : (
        <>
          <div style={{ position: "absolute", right: W - (cx - R - 40), top: cy - L.word * 0.62, ...DISP, fontSize: L.word, color: "#FFFFFF", ...wordStyle(wl) }}>Venda</div>
          <div style={{ position: "absolute", left: cx + R + 40, top: cy - L.word * 0.7, fontFamily: FONT, fontWeight: 700, fontSize: L.word, letterSpacing: "-0.03em", color: "#FFFFFF", ...wordStyle(wr) }}>no automático</div>
        </>
      )}
      {L.cta && cta > 0 && (
        <div style={{ position: "absolute", left: 0, right: 0, top: cy + R + (L.ctaY || 104), display: "flex", justifyContent: "center", opacity: clamp(cta * 2) }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8, height: 44, padding: "0 22px", borderRadius: 99, background: "#FFFFFF", color: C.ink,
            fontFamily: FONT, fontWeight: 800, fontSize: 15.5, letterSpacing: "-0.02em", whiteSpace: "nowrap", position: "relative", overflow: "hidden",
            transform: `scale(${clamp(cta, 0, 1.2)})`, boxShadow: `0 14px 30px rgba(0,20,50,.3), 0 0 30px ${hexA(C.cyan, 0.35)}`,
          }}>
            Solicite seu orçamento
            <svg width="15" height="15" viewBox="0 0 16 16"><path d="M3 8 H12 M8.5 4 L12.5 8 L8.5 12" fill="none" stroke={C.ink} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <div style={{ position: "absolute", top: -20, bottom: -20, width: 40, left: `${lerp(-20, 120, ((t - T.mark) % 1.8) / 1.8)}%`, transform: "rotate(20deg)", background: `linear-gradient(90deg, ${hexA(C.cyan, 0)}, ${hexA(C.cyan, 0.35)}, ${hexA(C.cyan, 0)})` }} />
          </div>
        </div>
      )}
      <div style={{
        position: "absolute", left: 0, right: 0, bottom: L.mark || (L.stack ? 90 : 34), textAlign: "center", ...DISP, fontSize: 11, letterSpacing: ".18em",
        color: "rgba(255,255,255,.85)", opacity: mark, transform: `translateY(${(1 - mark) * 8}px)`,
      }}>Estoke ao Cubo</div>
    </div>
  );
}

function Frame({ t, format = FLOW_VARIANT.defaultFormat }) {
  const F = FORMATS[format];
  const L = LAYOUT[format];
  const p = { t, W: F.w, H: F.h, L };
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", fontFamily: FONT, background: C.ink }}>
      <FlowBg t={t} W={F.w} H={F.h} />
      {t < T.collapse + 0.25 && <Flow {...p} />}
      <Finale {...p} />
      <Grain t={t} opacity={0.06} />
    </div>
  );
}

/* =============================================================================
   Som — 100 BPM, leve e "tech": pad, batida suave e baixo; cada card que surge toca
   uma nota subindo; zoom out com whoosh, projetos com pops e brilho, colapso com
   queda e ondas graves, cubo desenhado com sinos subindo e o "plim" de vidro da marca.
============================================================================= */
function cubeChime(A, w, v = 1) {
  [84, 91, 96].forEach((n, i) => tone(A, w + i * 0.025, { f: midi(n), dur: 1.6 - i * 0.3, v: (0.08 - i * 0.02) * v, send: 0.7, pan: i - 1 }));
  tone(A, w, { type: "triangle", f: midi(108), dur: 0.25, v: 0.02 * v, send: 0.5 });
  SND.shimmer(A, w + 0.04, 0.6 * v);
}
// Música ("Miami") e efeitos analógicos gravados (scripts/build-audio-assets.sh).
// drop: segundo do golpe do drop dentro do trecho embutido (24,97s na faixa; o trecho começa em 9,5s)
const MUSIC = { drop: 15.47, gain: 0.55 };
const TAPE_PEAK = { fastScrub: 0.85, sweep1: 1.05, sweep2: 1.25, rewindTape: 1.2, rewindKick: 0.85, dialTurn: 0.55, fwdDown: 0.45, dialDown: 0.7, shutDown: 1.1, tuning: 0.9 };
const SAMPLES = { music: MUSIC_FLOW.miamiFlow, ...TAPE };
function buildEvents() {
  const ev = [];
  const add = (t, fn) => ev.push({ t, fn });
  // música: a intro calma da faixa acompanha o fluxo e o drop entra na revelação do cubo
  const off0 = MUSIC.drop - T.cube;
  const endF = off0 + DURATION;
  ev.push({
    t: 0, dur: DURATION,
    fn: (A, w, off = 0) => A.sample("music", w, {
      off: off0 + off, dur: DURATION - off, gain: MUSIC.gain, fadeIn: off > 0 ? 0.03 : 0.004,
      env: [[0, 1.8], [MUSIC.drop - 0.4, 1.8], [MUSIC.drop - 0.02, 1], [endF - 1.2, 1], [endF, 0]],
    }),
  });
  const tapeAt = (t, name, gain, opts) => add(Math.max(0, t - TAPE_PEAK[name]), (A, w) => A.sample(name, w, { gain, ...opts }));
  // cards do fluxo: a linha "corre" e cada card entra com um pop
  NODES.forEach((n, i) => {
    if (i > 0) add(n.t - 0.3, (A, w) => hiss(A, w, { type: "highpass", f: 3000, f2: 6000, dur: 0.25, v: 0.035, shape: "swell", pan: i % 2 ? 0.4 : -0.4 }));
    add(n.t, (A, w) => { SND.pop(A, w, 700 + i * 40, 0.1); SND.tick(A, w, 2400 + i * 150, 0.8); });
  });
  // zoom out → bolinhas
  tapeAt(T.morphEnd - 0.3, "sweep2", 0.5);
  NODES.forEach((_, i) => add(T.morphEnd - 0.15 + i * 0.04, (A, w) => SND.tick(A, w, 2600 + i * 120, 0.7)));
  // projetos saindo
  tapeAt(T.burst + 0.05, "rewindKick", 0.65);
  SHOTS.forEach((s, i) => add(T.burst + s.d, (A, w) => SND.pop(A, w, 520 + i * 70, 0.12)));
  // viram pontos e colapsam
  tapeAt(T.round + 0.2, "dialTurn", 1.6);
  tapeAt(T.collapse - 0.05, "shutDown", 0.55);
  [0, 0.35, 0.7].forEach((d, j) => add(T.collapse + 0.3 + d, (A, w) => tone(A, w, { f: 110 - j * 8, f2: 70, glide: 0.8, dur: 1.0, v: 0.16, send: 0.6 })));
  // cubo sendo desenhado: sintonia de rádio + subida até o drop
  add(T.draw, (A, w) => A.sample("tuning", w, { gain: 0.3, dur: T.cube - T.draw - 0.1, fadeOut: 0.3 }));
  add(T.draw, (A, w) => hiss(A, w, { f: 400, f2: 8000, q: 1.2, dur: T.cube - T.draw, v: 0.1, shape: "rise", send: 0.3 }));
  // cubo + palavras (o drop da música marca o tempo)
  add(T.cube, (A, w) => { tone(A, w, { f: 70, f2: 36, glide: 0.5, dur: 1.2, v: 0.3, send: 0.2 }); cubeChime(A, w, 0.7); });
  add(T.words, (A, w) => SND.swipe(A, w, 0.7));
  add(T.words + 0.4, (A, w) => SND.swipe(A, w, 0.7));
  if (FLOW_VARIANT.defaultFormat === "story") add(T.mark + 0.35, (A, w) => SND.pop(A, w, 640, 0.14));
  add(DURATION - 2.29, (A, w) => A.sample("dialDown", w, { gain: 0.35 }));
  return ev.sort((a, b) => a.t - b.t);
}
const EVENTS = buildEvents();
const renderWav = () => renderEventsWav(EVENTS, DURATION, { samples: SAMPLES });

// Usado pelo exportador de vídeo (scripts/export-video.cjs)
const MOTION = { Frame, duration: DURATION, formats: FORMATS, renderWav };

export default function FlowReveal() {
  return (
    <MotionPlayer Frame={Frame} duration={DURATION} events={EVENTS} formats={FORMATS} defaultFormat={FLOW_VARIANT.defaultFormat} renderWav={renderWav} samples={SAMPLES}
      scenes={[
        { name: "Fluxo", from: 0 },
        { name: "Zoom out", from: T.morph },
        { name: "Projetos", from: T.burst },
        { name: "Cubo", from: T.collapse },
      ]} />
  );
}
