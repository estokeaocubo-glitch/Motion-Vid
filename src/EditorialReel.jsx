import React from "react";
import {
  C, DISP, FONT, clamp, lerp, prog, easeOut, easeIn, easeInOut, spring, hexA, midi, tone, hiss,
  CubeLogo, Grain, SND, SyncedVideo, renderEventsWav, MotionPlayer,
} from "./motionKit";

/* =============================================================================
   Estoke ao Cubo — Reel editorial "Sites que transformam visitas em vendas." (loop de 14s)
   Referência: "480b5a3c102f16d5e0f18163fff49041_720w.mp4" — fundo cinza-claro, tipografia
   grande e telas de sites piscando, card de página em destaque e coluna de telas subindo.
   As telas são prints dos nossos projetos (Misú, LCS, Noka, Dizzy) em dist/media/editorial/.
   v3: a abertura com prints piscando, pilha e coluna ficou confusa; agora é um único
   navegador com três sites ao vivo (opening.*: Misú → LCS → Noka, deslizes no tempo) e a
   legenda de cada cliente. A segunda metade é uma grade 2×2 com os quatro sites rodando
   ao vivo (grid.*), em seções diferentes das da abertura.
============================================================================= */
const DURATION = 14;
const FORMATS = {
  "3x4": { w: 450, h: 600, label: "3:4" },
  "9x16": { w: 450, h: 800, label: "9:16" },
};
const BG = "#DFDDDE"; // cinza da referência
const INK = "#0E1116";

/* ---------- Abertura: um navegador com três sites ao vivo ---------- */
// opening.*: Misú (hero) → LCS (rolagem até a frota) → Noka (hero), com deslizes de 0,25s em 1,0s e 2,0s
const OPEN = { in: 0.12, out: 2.62, end: 3.05 };
const OPEN_SITES = [
  { from: 0, name: "Misú", seg: "Restaurante japonês" },
  { from: 1.0, name: "LCS", seg: "Transporte executivo" },
  { from: 2.0, name: "Noka", seg: "Arquitetura e engenharia" },
];
function OpeningCard({ t, H }) {
  if (t > OPEN.end) return null;
  const s = spring(t - OPEN.in, { stiffness: 150, damping: 20 });
  const out = easeInOut(prog(t, OPEN.out, OPEN.end));
  const w = 340;
  const vh = (w * 9) / 16;
  const cy = H * 0.44;
  // motion blur vertical no deslize entre sites
  const slide = Math.max(0, ...[1.0, 2.0].map((c) => 1 - Math.abs(t - c) / 0.14));
  const site = [...OPEN_SITES].reverse().find((x) => t >= x.from);
  const capS = spring(t - site.from - 0.05, { stiffness: 260, damping: 22 });
  return (
    <div style={{
      position: "absolute", left: 225 - w / 2, top: cy - (vh + 22) / 2, width: w, zIndex: 4,
      opacity: clamp(s * 2) * (1 - out),
      transform: `translateY(${(1 - s) * 50 + out * 60}px) scale(${(0.92 + 0.08 * clamp(s, 0, 1.05)) * (1 - out * 0.08)})`,
      filter: out > 0.05 ? `blur(${(out * 6).toFixed(1)}px)` : "none",
    }}>
      <div style={{ background: "#FAFAFA", borderRadius: 6, overflow: "hidden", boxShadow: "0 30px 60px -28px rgba(0,0,0,.45), 0 0 0 1px rgba(0,0,0,.05)" }}>
        <div style={{ height: 22, display: "flex", alignItems: "center", gap: 5, padding: "0 10px", borderBottom: "1px solid #ECECEC" }}>
          {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => <span key={c} style={{ width: 7, height: 7, borderRadius: 7, background: c }} />)}
        </div>
        <div style={{ position: "relative", width: w, height: vh, overflow: "hidden", background: "#111" }}>
          <SyncedVideo t={clamp(t, 0, 2.999)} duration={3} webm="media/editorial/opening.webm" mp4="media/editorial/opening.mp4"
            style={{ filter: slide > 0.05 ? `blur(${(slide * 3).toFixed(1)}px)` : "none" }} />
        </div>
      </div>
      <div style={{ height: 22, marginTop: 12, overflow: "hidden", display: "flex", gap: 8, alignItems: "baseline", fontFamily: FONT, color: INK }}>
        <div style={{ display: "flex", gap: 8, alignItems: "baseline", transform: `translateY(${(1 - capS) * 100}%)`, opacity: clamp(capS * 2) }}>
          <span style={{ fontWeight: 700, fontSize: 14 }}>{site.name}</span>
          <span style={{ fontWeight: 600, fontSize: 11.5, color: "#5A5D63" }}>{site.seg}</span>
        </div>
      </div>
    </div>
  );
}

/* ---------- Grade de projetos (segunda metade) ---------- */
// Um vídeo 2×2 (grid.*) recortado em quatro cards; cada card mostra um quadrante
const GRID = { from: 7.0, to: 11.0 };
const PROJECTS = [
  { name: "Misú", seg: "Restaurante japonês", q: [0, 0] },
  { name: "LCS", seg: "Transporte executivo", q: [1, 0] },
  { name: "Noka", seg: "Arquitetura e engenharia", q: [0, 1] },
  { name: "Dizzy", seg: "Streetwear", q: [1, 1] },
];
function ProjectGrid({ t, H }) {
  // sempre montado (invisível fora da janela) para os vídeos já estarem carregados quando a grade entra
  const visible = t >= GRID.from && t <= GRID.to;
  const lt = clamp(t - GRID.from, 0, GRID.to - GRID.from);
  const cw = 200;
  const ch = (cw * 9) / 16;
  const top = H * 0.36;
  return (
    <>
      {PROJECTS.map((p, k) => {
        const col = k % 2;
        const row = Math.floor(k / 2);
        const s = spring(lt - k * 0.16, { stiffness: 210, damping: 19 });
        const out = easeIn(prog(t, GRID.to - 0.55 + k * 0.05, GRID.to - 0.1 + k * 0.05));
        const x = 225 + (col ? 6 : -cw - 6);
        const y = top + row * (ch + 44) + (1 - s) * 40 - out * (H * 0.9);
        const blur = out > 0.05 && out < 0.95 ? 3 * Math.sin(out * Math.PI) : 0;
        return (
          <div key={p.name} style={{
            position: "absolute", left: x, top: y, width: cw, zIndex: 3, opacity: visible ? clamp(s * 2.5) : 0, visibility: visible ? "visible" : "hidden",
            transform: `scale(${0.85 + 0.15 * clamp(s, 0, 1.1)})`, filter: blur > 0.3 ? `blur(${blur.toFixed(1)}px)` : "none",
          }}>
            <div style={{ background: "#FAFAFA", boxShadow: "0 14px 30px -14px rgba(0,0,0,.45)" }}>
              <div style={{ height: 12, display: "flex", alignItems: "center", gap: 3, padding: "0 6px" }}>
                {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => <span key={c} style={{ width: 4, height: 4, borderRadius: 4, background: c }} />)}
              </div>
              <div style={{ position: "relative", width: cw, height: ch, overflow: "hidden" }}>
                <SyncedVideo t={clamp(lt, 0, 3.799)} duration={3.8} webm="media/editorial/grid.webm" mp4="media/editorial/grid.mp4"
                  style={{ inset: "auto", left: -p.q[0] * cw, top: -p.q[1] * ch, width: cw * 2, height: ch * 2, objectFit: "fill" }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "baseline", marginTop: 7, fontFamily: FONT, color: INK }}>
              <span style={{ fontWeight: 700, fontSize: 11 }}>{p.name}</span>
              <span style={{ fontWeight: 600, fontSize: 9.5, color: "#5A5D63" }}>{p.seg}</span>
            </div>
          </div>
        );
      })}
    </>
  );
}

/* ---------- Tipografia ---------- */
const LINES = ["Sites que", "transformam", "visitas em", "vendas."];
const WORD_T = [3.0, 3.25, 3.55, 3.85, 4.15, 4.45]; // entrada de cada palavra
function Headline({ t, H }) {
  if (t > 12.6) return null;
  const size = 46;
  const top = H * 0.3;
  let w = 0;
  const outP = (k) => easeIn(prog(t, 12.0 + k * 0.05, 12.35 + k * 0.05));
  return (
    <div style={{ position: "absolute", left: 16, top, zIndex: 0 }}>
      {LINES.map((line, li) => (
        <div key={li} style={{ height: size * 1.02, overflow: "hidden", display: "flex", gap: size * 0.24 }}>
          {line.split(" ").map((word) => {
            const ws = WORD_T[Math.min(w, WORD_T.length - 1)];
            const wi = w++;
            return (
              <span key={word} style={{ display: "flex", fontFamily: FONT, fontWeight: 600, fontSize: size, lineHeight: 1, letterSpacing: "-0.035em", color: INK }}>
                {[...word].map((ch, ci) => {
                  const s = spring(t - ws - ci * 0.025, { stiffness: 230, damping: 19 });
                  const o = outP(wi);
                  return <span key={ci} style={{ display: "inline-block", transform: `translateY(${(1 - s) * 105 + o * 110}%)`, opacity: clamp(s * 3) }}>{ch}</span>;
                })}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function Header() {
  return (
    <div style={{ position: "absolute", left: 16, top: 16, display: "flex", gap: 46, fontFamily: FONT, fontSize: 8.5, fontWeight: 600, color: "#5A5D63", zIndex: 5 }}>
      <span>Estoke ao Cubo</span>
      <span>Sites &amp; lojas virtuais</span>
    </div>
  );
}

// Final: logo e fonte da marca + chamada para orçamento
function EndCard({ t, H }) {
  const lt = t - 12.35;
  if (lt < 0) return null;
  const s = spring(lt, { stiffness: 170, damping: 15 });
  const s2 = spring(lt - 0.2, { stiffness: 200, damping: 20 });
  const s3 = spring(lt - 0.45, { stiffness: 200, damping: 18 });
  const fade = easeIn(prog(t, 13.7, 14));
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: H * 0.3, display: "flex", flexDirection: "column", alignItems: "flex-start", padding: "0 16px", gap: 16, opacity: 1 - fade, zIndex: 6 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, opacity: clamp(s * 2), transform: `translateY(${(1 - s) * 30}px)` }}>
        <CubeLogo size={70} style={{ transform: `rotate(${(1 - s) * -60}deg)` }} />
        <div style={{ ...DISP, fontSize: 34, lineHeight: 0.95, color: C.ink }}>Estoke<br />ao Cubo</div>
      </div>
      <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 21, letterSpacing: "-0.02em", color: INK, opacity: clamp(s2 * 2), transform: `translateY(${(1 - s2) * 18}px)` }}>
        Sites e lojas virtuais que vendem.
      </div>
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 8, background: C.ink, color: "#fff", fontFamily: FONT, fontWeight: 700, fontSize: 13,
        padding: "11px 18px", borderRadius: 30, opacity: clamp(s3 * 2), transform: `translateY(${(1 - s3) * 14}px) scale(${0.9 + 0.1 * clamp(s3)})`,
      }}>
        Solicite seu orçamento →
      </div>
    </div>
  );
}

function Frame({ t, format = "3x4" }) {
  const H = FORMATS[format].h;
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: BG }}>
      <Header />
      <Headline t={t} H={H} />
      <OpeningCard t={t} H={H} />
      <ProjectGrid t={t} H={H} />
      <EndCard t={t} H={H} />
      <Grain t={t} opacity={0.05} />
    </div>
  );
}

/* =============================================================================
   Som — 14s a 120 BPM: pulso nas partes rápidas, clique em cada tela, whoosh na
   coluna, toque por palavra, respiro na frase e acorde final no logo
============================================================================= */
function buildEvents() {
  const ev = [];
  const add = (t, fn) => ev.push({ t, fn });
  // abertura: card entra, desliza entre os sites no tempo da batida e sai
  add(OPEN.in, (A, w) => SND.whoosh(A, w, { dur: 0.45, from: 300, to: 2400, v: 0.18, pan: 0, panTo: 0 }));
  [1.0, 2.0].forEach((c, i) => {
    add(c - 0.12, (A, w) => SND.whoosh(A, w, { dur: 0.3, from: 600, to: 4500, v: 0.2, pan: i ? 0.5 : -0.5, panTo: i ? -0.5 : 0.5 }));
    add(c, (A, w) => SND.pop(A, w, [620, 740][i], 0.16));
  });
  add(OPEN.out, (A, w) => SND.whoosh(A, w, { dur: 0.45, from: 2400, to: 400, v: 0.16, pan: 0, panTo: 0 }));
  // pulso nas partes rápidas
  [[0, 3], [7.0, 11.0]].forEach(([a, b]) => {
    for (let tb = a; tb < b - 0.01; tb += 0.5) {
      add(tb, (A, w) => SND.kick(A, w, 0.7));
      add(tb + 0.25, (A, w) => SND.hat(A, w, 0.6, 0.3));
      add(tb, (A, w) => SND.sub(A, w, 33, 0.4, 0.5));
    }
  });
  // grade de projetos: um "pop" por card e whoosh na saída
  PROJECTS.forEach((_, k) => add(GRID.from + k * 0.16, (A, w) => SND.pop(A, w, [520, 620, 740, 880][k], 0.2)));
  add(GRID.to - 0.6, (A, w) => SND.whoosh(A, w, { dur: 0.6, from: 400, to: 5000, v: 0.26, pan: 0, panTo: 0 }));
  // frase: toque por palavra + respiro harmônico
  WORD_T.forEach((tw, i) => add(tw, (A, w) => SND.bell(A, w, [72, 74, 76, 79, 81, 84][i], 0.55, -0.2 + i * 0.08)));
  add(3.0, (A, w) => SND.pad(A, w, [48, 55, 59, 64], 4.2, 1500, 1));
  add(11.2, (A, w) => SND.pad(A, w, [45, 52, 55, 60], 1.2, 1500, 0.8));
  // final: logo
  add(12.0, (A, w) => SND.whoosh(A, w, { dur: 0.45, from: 3000, to: 400, v: 0.18, pan: 0, panTo: 0 }));
  add(12.35, (A, w) => {
    [72, 76, 79, 84].forEach((n, i) => tone(A, w + i * 0.06, { type: "triangle", f: midi(n), dur: 1.3, v: 0.08, send: 0.5, pan: i / 3 - 0.5 }));
    SND.sub(A, w, 36, 1.2, 0.8);
  });
  add(12.35, (A, w) => SND.pad(A, w, [48, 55, 59, 64], 1.6, 2000, 1));
  add(12.8, (A, w) => SND.pop(A, w, 700, 0.18));
  return ev.sort((a, b) => a.t - b.t);
}
const EVENTS = buildEvents();
const renderWav = () => renderEventsWav(EVENTS, DURATION, { loop: true });

// Usado pelo exportador de vídeo (scripts/export-video.cjs)
const MOTION = { Frame, duration: DURATION, formats: FORMATS, renderWav, loop: true };

export default function EditorialReel() {
  return (
    <MotionPlayer Frame={Frame} duration={DURATION} events={EVENTS} formats={FORMATS} defaultFormat="3x4" renderWav={renderWav}
      scenes={[{ name: "Abertura", from: 0 }, { name: "Frase", from: 3 }, { name: "Projetos", from: 7 }, { name: "Logo", from: 12 }]} />
  );
}
