import React from "react";
import {
  C, DISP, FONT, clamp, lerp, prog, easeOut, easeIn, easeInOut, spring, hexA, midi, tone, hiss,
  CubeLogo, Grain, SND, SyncedVideo, renderEventsWav, MotionPlayer,
} from "./motionKit";

/* =============================================================================
   Estoke ao Cubo — Reel editorial "Sites que transformam visitas em vendas." (loop de 14s)
   Referência: "480b5a3c102f16d5e0f18163fff49041_720w.mp4" — fundo cinza-claro, tipografia
   grande e telas de sites piscando, card de página em destaque e coluna de telas subindo.
   As telas são prints dos nossos projetos (Misú, LCS, Noka, Dizzy) em dist/media/editorial/;
   os cards animados usam dist/media/editorial/cards.* (moeda da Dizzy + prato da Misú).
============================================================================= */
const DURATION = 14;
const FORMATS = {
  "3x4": { w: 450, h: 600, label: "3:4" },
  "9x16": { w: 450, h: 800, label: "9:16" },
};
const BG = "#DFDDDE"; // cinza da referência
const INK = "#0E1116";
const shot = (i) => `media/editorial/s${String(i % 27).padStart(2, "0")}.webp`;

/* ---------- Telas piscando ---------- */
// [início, duração, centro x, centro y (fração da altura), largura, índice da tela]
const FLASH_A = [0, 1, 2, 3, 4, 5, 6, 7].map((k) => [
  0.04 + k * 0.12, 0.12, [150, 200, 238, 260, 262, 250, 268, 268][k], [0.64, 0.52, 0.44, 0.41, 0.39, 0.39, 0.4, 0.4][k], 292, k,
]);
const FLASH_G = [0, 1, 2, 3, 4, 5, 6, 7].map((k) => [7.2 + k * 0.17, 0.17, 225 + (k % 2 ? 14 : -10), 0.52, 270, 8 + k]);

function Thumb({ i, cx, cy, w, style }) {
  const h = (w * 9) / 16;
  return (
    <div style={{ position: "absolute", left: cx - w / 2, top: cy - h / 2, width: w, height: h, boxShadow: "0 10px 30px -12px rgba(0,0,0,.35)", background: "#fff", ...style }}>
      <img src={shot(i)} alt="" draggable={false} style={{ width: "100%", height: "100%", display: "block", objectFit: "cover" }} />
    </div>
  );
}

function Flashes({ t, H, list }) {
  const cur = list.find(([s, d]) => t >= s && t < s + d);
  if (!cur) return null;
  const [, , cx, fy, w, i] = cur;
  return <Thumb i={i} cx={cx} cy={fy * H} w={w} />;
}

// Card de página em destaque (clipe animado), com telas empilhadas por baixo
function Card({ t, H, from, to, clipStart, fy, stackFrom }) {
  if (t < from || t > to) return null;
  const lt = t - from;
  const s = spring(lt, { stiffness: 260, damping: 22 });
  const grow = easeInOut(prog(lt, 0.2, to - from)) * 0.08;
  const out = easeIn(prog(t, to - 0.15, to));
  const w = 360;
  const h = (w * 9) / 16 + 26;
  const cy = fy * H;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - out }}>
      {[0, 1, 2].map((k) => (
        <Thumb key={k} i={stackFrom + k} cx={225 + (k - 1) * 6} cy={cy + h / 2 + 18 + k * 16 - (1 - s) * 40} w={300 - k * 18}
          style={{ zIndex: 1, opacity: clamp(s * 2), transform: `translateY(${-lt * 12 * (k + 1)}px)` }} />
      ))}
      <div style={{
        position: "absolute", left: 225 - w / 2, top: cy - h / 2, width: w, height: h, zIndex: 2, background: "#FAFAFA",
        transform: `scale(${(0.86 + 0.14 * s) * (1 + grow)})`, opacity: clamp(s * 3), boxShadow: "0 18px 40px -16px rgba(0,0,0,.4)",
      }}>
        <div style={{ height: 26, display: "flex", alignItems: "center", gap: 5, padding: "0 10px", borderBottom: "1px solid #ECECEC" }}>
          {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => <span key={c} style={{ width: 7, height: 7, borderRadius: 7, background: c }} />)}
        </div>
        <div style={{ position: "relative", width: w, height: (w * 9) / 16, overflow: "hidden" }}>
          <SyncedVideo t={clipStart + clamp(lt, 0, 1.999)} duration={4} webm="media/editorial/cards.webm" mp4="media/editorial/cards.mp4" />
        </div>
      </div>
    </div>
  );
}

// Coluna de telas subindo rápido (filme)
function Filmstrip({ t, H, from, dur, first }) {
  if (t < from || t > from + dur) return null;
  const p = easeInOut(prog(t, from, from + dur));
  const w = 150;
  const gap = 92;
  const y0 = lerp(H + 60, -6 * gap - 60, p);
  return (
    <>
      {[0, 1, 2, 3, 4, 5].map((k) => <Thumb key={k} i={first + k} cx={225} cy={y0 + k * gap} w={w} style={{ zIndex: 3, boxShadow: "none" }} />)}
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
      <Flashes t={t} H={H} list={FLASH_A} />
      <Card t={t} H={H} from={1.0} to={2.4} clipStart={0} fy={0.42} stackFrom={16} />
      <Filmstrip t={t} H={H} from={2.35} dur={0.65} first={10} />
      <Flashes t={t} H={H} list={FLASH_G} />
      <Card t={t} H={H} from={8.6} to={10.4} clipStart={2} fy={0.55} stackFrom={20} />
      <Filmstrip t={t} H={H} from={10.35} dur={0.75} first={4} />
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
  const shutter = (A, w, v = 1) => {
    hiss(A, w, { type: "highpass", f: 4000, dur: 0.025, v: 0.16 * v });
    tone(A, w, { type: "square", f: 1800, dur: 0.012, v: 0.025 * v });
  };
  FLASH_A.concat(FLASH_G).forEach(([s], k) => add(s, (A, w) => shutter(A, w, k % 2 ? 0.8 : 1)));
  // pulso nas partes rápidas
  [[0, 3], [7.2, 11.2]].forEach(([a, b]) => {
    for (let tb = a; tb < b - 0.01; tb += 0.5) {
      add(tb, (A, w) => SND.kick(A, w, 0.7));
      add(tb + 0.25, (A, w) => SND.hat(A, w, 0.6, 0.3));
      add(tb, (A, w) => SND.sub(A, w, 33, 0.4, 0.5));
    }
  });
  [1.0, 8.6].forEach((tc) => {
    add(tc, (A, w) => SND.pop(A, w, 520, 0.22));
    add(tc, (A, w) => SND.whoosh(A, w, { dur: 0.35, from: 800, to: 3000, v: 0.15, pan: 0, panTo: 0 }));
  });
  [2.35, 10.35].forEach((tc) => add(tc, (A, w) => SND.whoosh(A, w, { dur: 0.7, from: 300, to: 5000, v: 0.26, pan: 0, panTo: 0 })));
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
      scenes={[{ name: "Telas", from: 0 }, { name: "Frase", from: 3 }, { name: "Telas", from: 7.2 }, { name: "Logo", from: 12 }]} />
  );
}
