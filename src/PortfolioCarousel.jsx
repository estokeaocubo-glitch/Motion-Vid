import React from "react";
import {
  C, DISP, FONT, gradLight, clamp, lerp, prog, easeOut, easeIn, easeInOut, rnd, spring, hexA,
  fitSize, MaskWord, CubeLogo, Wordmark, Beam, Grain, SND, renderEventsWav, MotionPlayer,
} from "./motionKit";
import { CLIENT_LOGOS } from "./portfolioAssets";

/* =============================================================================
   Estoke ao Cubo — Carrossel Padrão Portfólio (loop perfeito de 9s)
   Baseado no projeto OpenShot "01_Carrossel_Padrao_Portfolio": cubo de cristal
   fixo no centro e 9 clientes em órbita 3D; cada um chega à frente por 1s.
   Movimento "passo e pausa": giro de 40° com overshoot, depois leitura do logo.
============================================================================= */
const DURATION = 9;
const STEP = 360 / 9;

// Para trocar/adicionar clientes: edite esta lista (e os logos em assets/clients).
// Com N clientes, ajuste DURATION = N para manter 1s por cliente.
const CLIENTS = [
  { id: "ruppel", name: "Ruppel", segment: "Streetwear" },
  { id: "arteiro", name: "Arteiro", segment: "Loja" },
  { id: "dizzy", name: "Dizzy", segment: "House Studio" },
  { id: "kaiiros", name: "Kaiirós", segment: "Site no ar" },
  { id: "k-dust", name: "K Dust", segment: "Site no ar" },
  { id: "lcs", name: "LCS", segment: "Transporte e Turismo" },
  { id: "vicente", name: "Vicente", segment: "Auto Center" },
  { id: "yuri-miguez", name: "Yuri Miguez", segment: "Site no ar" },
  { id: "op-studios", name: "OP Studio's", segment: "Studio" },
];

const FORMATS = {
  "9x16": { w: 450, h: 800, label: "9:16" },
  "4x5": { w: 450, h: 562.5, label: "4:5" },
};
// Composição por formato (unidades lógicas; exporta em 1080 de largura)
const LAYOUT = {
  "9x16": { top: 52, title: 104, titleSize: 27, titleLines: 2, cx: 225, cy: 372, R: 172, ry: 104, cube: 124, badge: 112, name: 606, sub: 650, counter: 688, foot: 742 },
  "4x5": { top: 22, title: 74, titleSize: 21, titleLines: 1, cx: 225, cy: 254, R: 168, ry: 70, cube: 92, badge: 92, name: 400, sub: 440, counter: 470, foot: 518 },
};

const wrap = (t) => ((t % DURATION) + DURATION) % DURATION;
// Overshoot com fim exato (mantém o loop perfeito): easeOutBack
const backOut = (p, s = 1.5) => 1 + (s + 1) * Math.pow(p - 1, 3) + s * Math.pow(p - 1, 2);
const MOVE_START = 0.4; // dentro de cada segundo: 0–0.4 pausa, 0.4–1.0 giro
function rotationAt(t) {
  const tt = wrap(t);
  const k = Math.floor(tt);
  const p = prog(tt - k, MOVE_START, 1);
  return (k + backOut(p)) * STEP;
}
// Tempo desde a última chegada de um cliente à frente (0 no instante da chegada)
const sinceArrival = (t) => wrap(t) % 1;

/* ---------- Órbita ---------- */
function Badge({ client, x, y, size, depth, front, t, L }) {
  const sweep = prog(sinceArrival(t), 0.02, 0.55);
  const blur = (1 - depth) * 2.6;
  return (
    <div style={{
      position: "absolute", left: x - size / 2, top: y - size / 2, width: size, height: size, zIndex: Math.round(depth * 100),
      filter: `brightness(${lerp(0.42, 1, depth)}) saturate(${lerp(0.6, 1, depth)})${blur > 0.3 ? ` blur(${blur.toFixed(2)}px)` : ""}`,
    }}>
      {front > 0.02 && (
        <div style={{
          position: "absolute", inset: -size * 0.09, borderRadius: "50%", opacity: front,
          background: `conic-gradient(from ${t * 160}deg, ${C.cyan}, ${hexA(C.blue, 0.1)} 30%, ${C.sky} 55%, ${hexA(C.cyan, 0.1)} 80%, ${C.cyan})`,
          boxShadow: `0 0 ${36 * front}px ${hexA(C.cyan, 0.55)}`,
        }} />
      )}
      <div style={{
        position: "absolute", inset: 0, borderRadius: "50%", overflow: "hidden",
        boxShadow: `0 ${size * 0.12}px ${size * 0.3}px -${size * 0.08}px rgba(0,0,0,.65), 0 0 0 ${Math.max(1.5, size * 0.025)}px rgba(255,255,255,.85)`,
      }}>
        <img src={CLIENT_LOGOS[client.id]} alt={client.name} draggable={false} style={{ width: "100%", height: "100%", display: "block" }} />
        {front > 0.5 && sweep > 0 && sweep < 1 && (
          <div style={{
            position: "absolute", top: "-30%", bottom: "-30%", width: "38%", left: `${lerp(-60, 130, easeInOut(sweep))}%`, transform: "rotate(22deg)",
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,.55), transparent)", mixBlendMode: "screen",
          }} />
        )}
      </div>
      {depth > 0.62 && (
        // Reflexo no "chão": cópia invertida e esmaecida
        <div style={{
          position: "absolute", left: 0, top: size * 1.06, width: size, height: size * 0.55, overflow: "hidden", opacity: (depth - 0.62) * 0.9,
          WebkitMaskImage: "linear-gradient(180deg, rgba(0,0,0,.55), transparent 85%)", maskImage: "linear-gradient(180deg, rgba(0,0,0,.55), transparent 85%)",
        }}>
          <img src={CLIENT_LOGOS[client.id]} alt="" draggable={false} style={{ width: size, height: size, borderRadius: "50%", transform: "scaleY(-1)", display: "block", filter: "blur(1.5px)" }} />
        </div>
      )}
    </div>
  );
}

function Orbit({ t, L }) {
  const rot = rotationAt(t);
  const items = CLIENTS.map((client, i) => {
    const th = ((i * STEP - rot) * Math.PI) / 180;
    const z = Math.cos(th);
    const depth = (z + 1) / 2;
    const s = lerp(0.42, 1.28, Math.pow(depth, 1.4));
    const front = Math.pow(clamp(z), 14);
    return { client, x: L.cx + Math.sin(th) * L.R, y: L.cy + z * L.ry, size: L.badge * s, depth, front };
  });
  const d = sinceArrival(t);
  const pulse = Math.exp(-d * 5);
  const bob = Math.sin((wrap(t) / DURATION) * Math.PI * 2 * 3) * 4;
  return (
    <>
      {/* Trilho da órbita: elipse com frente mais brilhante */}
      <svg width={450} height={L.cy + L.ry + 120} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", zIndex: 1 }}>
        <defs>
          <linearGradient id="pcOrbit" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={C.sky} stopOpacity=".05" />
            <stop offset="1" stopColor={C.cyan} stopOpacity=".55" />
          </linearGradient>
          <radialGradient id="pcFloor">
            <stop offset="0" stopColor={C.blue} stopOpacity=".35" />
            <stop offset="1" stopColor={C.blue} stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx={L.cx} cy={L.cy + L.ry * 0.35} rx={L.R * 1.25} ry={L.ry * 1.05} fill="url(#pcFloor)" />
        <ellipse cx={L.cx} cy={L.cy} rx={L.R} ry={L.ry} fill="none" stroke="url(#pcOrbit)" strokeWidth="1.5" />
        <ellipse cx={L.cx} cy={L.cy} rx={L.R * 0.86} ry={L.ry * 0.86} fill="none" stroke={hexA(C.sky, 0.12)} strokeWidth="1" strokeDasharray="2 7" />
      </svg>
      {/* Raios de luz atrás do cubo */}
      <div style={{
        position: "absolute", left: L.cx - L.cube * 1.6, top: L.cy - L.cube * 0.25 - L.cube * 1.6, width: L.cube * 3.2, height: L.cube * 3.2, borderRadius: "50%",
        zIndex: 2, opacity: 0.55 + pulse * 0.35, transform: `rotate(${(wrap(t) / DURATION) * 360}deg)`,
        background: `repeating-conic-gradient(from 0deg, ${hexA(C.cyan, 0.16)} 0deg 6deg, transparent 6deg 30deg)`,
        WebkitMaskImage: "radial-gradient(circle, #000 0%, transparent 68%)", maskImage: "radial-gradient(circle, #000 0%, transparent 68%)",
      }} />
      {/* Cubo de cristal fixo no centro (atrás da metade da frente, à frente da metade de trás) */}
      <div style={{ position: "absolute", left: L.cx - (L.cube * 0.908) / 2, top: L.cy - L.cube * 0.62 + bob, zIndex: 50 }}>
        <CubeLogo size={L.cube} glow={1 + pulse * 0.9} style={{ transform: `scale(${1 + pulse * 0.035})` }} />
      </div>
      <div style={{
        position: "absolute", left: L.cx - L.cube * 0.55, top: L.cy + L.cube * 0.42, width: L.cube * 1.1, height: L.cube * 0.16, borderRadius: "50%", zIndex: 49,
        background: `radial-gradient(ellipse, ${hexA("#000000", 0.55)}, transparent 70%)`, transform: `scaleX(${1 - bob * 0.01})`,
      }} />
      {items.map((it) => <Badge key={it.client.id} {...it} t={t} L={L} />)}
    </>
  );
}

/* ---------- Textos ---------- */
const LABEL_IN = 0.55; // o nome do próximo cliente entra quando o logo passa da metade do giro
function ClientLabel({ t, L, i }) {
  const c = CLIENTS[i];
  // Janela do rótulo i, contada a partir da entrada (com volta no loop)
  const d = wrap(t - (i - (1 - LABEL_IN)));
  if (d > 1.07) return null;
  const s = spring(d - 0.04, { stiffness: 210, damping: 17 });
  const out = easeOut(prog(d, 0.97, 1.07));
  const nameSize = fitSize(c.name.toUpperCase(), 380, 36);
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 120, opacity: 1 - out, transform: `translateY(${-out * 18}px)`, filter: out > 0.05 ? `blur(${out * 6}px)` : "none" }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: L.name, textAlign: "center", ...DISP, fontSize: nameSize, lineHeight: 1, color: "#FFFFFF" }}>
        <MaskWord s={s}>{c.name}</MaskWord>
      </div>
      <div style={{
        position: "absolute", left: 0, right: 0, top: L.sub, textAlign: "center", fontFamily: FONT, fontSize: 15, fontWeight: 600, color: C.ice,
        letterSpacing: ".02em", opacity: clamp(spring(d - 0.08) * 1.6), transform: `translateY(${(1 - spring(d - 0.08)) * 10}px)`,
      }}>{c.segment}</div>
    </div>
  );
}

function Counter({ t, L }) {
  const rot = rotationAt(t);
  const pos = ((rot / STEP) % CLIENTS.length + CLIENTS.length) % CLIENTS.length;
  const cur = Math.round(pos) % CLIENTS.length;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: L.counter, display: "flex", justifyContent: "center", alignItems: "center", gap: 12, zIndex: 120 }}>
      <span style={{ fontFamily: FONT, fontSize: 12, fontWeight: 700, color: C.cyan, fontVariantNumeric: "tabular-nums", letterSpacing: ".08em" }}>
        {String(cur + 1).padStart(2, "0")}
      </span>
      <div style={{ display: "flex", gap: 5 }}>
        {CLIENTS.map((c, i) => {
          let dist = Math.abs(i - pos);
          dist = Math.min(dist, CLIENTS.length - dist);
          const a = clamp(1 - dist);
          return <span key={c.id} style={{ width: 6 + a * 16, height: 4, borderRadius: 2, background: a > 0.5 ? C.cyan : hexA(C.sky, 0.3 + a * 0.5) }} />;
        })}
      </div>
      <span style={{ fontFamily: FONT, fontSize: 12, fontWeight: 700, color: hexA(C.ice, 0.55), fontVariantNumeric: "tabular-nums", letterSpacing: ".08em" }}>
        {String(CLIENTS.length).padStart(2, "0")}
      </span>
    </div>
  );
}

function Header({ L }) {
  const size = L.titleLines === 2 ? fitSize("MARCAS QUE JÁ", 380, L.titleSize) : fitSize("MARCAS QUE JÁ ESTÃO NO AR", 400, L.titleSize);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: L.top, zIndex: 120, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <Wordmark size={12} color="#FFFFFF" inline />
      <div style={{ position: "absolute", top: L.title - L.top - 22, fontFamily: FONT, fontSize: 11, fontWeight: 700, letterSpacing: ".34em", color: C.cyan }}>PORTFÓLIO</div>
      <div style={{ position: "absolute", top: L.title - L.top, ...DISP, fontSize: size, lineHeight: 1.04, color: "#FFFFFF", textAlign: "center", whiteSpace: "nowrap" }}>
        {L.titleLines === 2 ? <>Marcas que já<br /><span style={gradLight}>estão no ar</span></> : <>Marcas que já <span style={gradLight}>estão no ar</span></>}
      </div>
    </div>
  );
}

/* ---------- Fundo ---------- */
function Background({ t, L, H }) {
  const ph = (wrap(t) / DURATION) * Math.PI * 2; // fase periódica: o fundo também fecha o loop
  return (
    <div style={{ position: "absolute", inset: 0, background: C.night, overflow: "hidden" }}>
      <Beam x={40 + Math.sin(ph) * 30} y={H * 0.72 - Math.sin(ph) * 30} w={1000} h={400} rot={-30} color={C.blue} a={0.7} />
      <Beam x={70 + Math.sin(ph) * 30} y={H * 0.7 - Math.sin(ph) * 30} w={760} h={110} rot={-30} color={C.sky} a={0.32} />
      <Beam x={430 - Math.cos(ph) * 30} y={H * 0.12} w={640} h={260} rot={-30} color={C.deep} a={0.7} />
      <Beam x={L.cx} y={L.cy} w={420} h={420} rot={0} color={C.cyan} a={0.1} />
      {Array.from({ length: 22 }, (_, i) => {
        const p = (wrap(t) / DURATION + rnd(i)) % 1;
        const x = rnd(i, 1) * 450 + Math.sin(ph * 2 + i) * 6;
        const y = H * (1.05 - p * 1.1);
        const a = Math.sin(p * Math.PI) * (0.25 + rnd(i, 2) * 0.5);
        const s = 1.5 + rnd(i, 3) * 2.5;
        return <span key={i} style={{ position: "absolute", left: x, top: y, width: s, height: s, borderRadius: "50%", background: C.cyan, opacity: a, boxShadow: `0 0 6px ${C.cyan}` }} />;
      })}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(0,0,0,.55) 100%)" }} />
    </div>
  );
}

function Frame({ t, format = "9x16" }) {
  const F = FORMATS[format];
  const L = LAYOUT[format];
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", fontFamily: FONT, color: "#FFFFFF" }}>
      <Background t={t} L={L} H={F.h} />
      <Header L={L} />
      <Orbit t={t} L={L} />
      {CLIENTS.map((c, i) => <ClientLabel key={c.id} t={t} L={L} i={i} />)}
      <Counter t={t} L={L} />
      <div style={{ position: "absolute", left: 0, right: 0, top: L.foot, zIndex: 120, textAlign: "center", fontFamily: FONT, fontSize: 13, fontWeight: 600, color: hexA(C.ice, 0.7) }}>
        Sua marca pode ser a próxima.
      </div>
      <Grain t={t} />
    </div>
  );
}

/* =============================================================================
   Som — loop de 9s a 120 BPM (1 cliente = 2 tempos), emenda sem corte
============================================================================= */
const CHORDS = [[48, 55, 59, 64], [45, 52, 55, 60], [41, 48, 52, 57], [43, 50, 53, 59]]; // Cmaj7 · Am7 · Fmaj7 · G7
const CHORD_AT = [[0, 0, 3], [3, 1, 3], [6, 2, 1.5], [7.5, 3, 1.5]]; // [início, acorde, duração]
const MELODY = [76, 79, 83, 81, 79, 76, 74, 79, 84]; // nota de chegada de cada cliente

function buildEvents() {
  const ev = [];
  const add = (t, fn) => ev.push({ t, fn });
  for (let b = 0; b < 18; b++) {
    const tb = b * 0.5;
    const [, ci] = [...CHORD_AT].reverse().find(([s]) => tb >= s);
    const ch = CHORDS[ci];
    add(tb, (A, w) => SND.kick(A, w, b % 2 === 0 ? 0.75 : 0.45));
    if (b % 2 === 1) add(tb, (A, w) => SND.clap(A, w, 0.7));
    add(tb + 0.25, (A, w) => SND.hat(A, w, 0.9, 0.25));
    add(tb + 0.125, (A, w) => SND.hat(A, w, 0.35, -0.3));
    add(tb + 0.375, (A, w) => SND.hat(A, w, 0.4, -0.3));
    add(tb, (A, w) => SND.bass(A, w, ch[0] - 12, 0.22, 0.9));
    add(tb + 0.25, (A, w) => SND.bass(A, w, ch[0], 0.16, 0.6));
  }
  CHORD_AT.forEach(([s, ci, dur]) => add(s, (A, w) => SND.pad(A, w, CHORDS[ci], dur, 1700, 1)));
  for (let k = 0; k < 9; k++) {
    add(k + MOVE_START, (A, w) => SND.whoosh(A, w, { dur: 0.6, from: 400, to: 2600, v: 0.2, pan: k % 2 ? 0.7 : -0.7, panTo: k % 2 ? -0.5 : 0.5 }));
    add(k, (A, w) => SND.bell(A, w, MELODY[k], 1, 0));
    add(k, (A, w) => SND.tick(A, w, 2600, 0.8));
  }
  add(0, (A, w) => SND.shimmer(A, w, 0.7));
  return ev.sort((a, b) => a.t - b.t);
}
const EVENTS = buildEvents();
const renderWav = () => renderEventsWav(EVENTS, DURATION, { loop: true });

// Usado pelo exportador de vídeo (scripts/export-video.cjs)
const MOTION = { Frame, duration: DURATION, formats: FORMATS, renderWav, loop: true };

export default function PortfolioCarousel() {
  return (
    <MotionPlayer Frame={Frame} duration={DURATION} events={EVENTS} formats={FORMATS} defaultFormat="9x16" renderWav={renderWav}
      scenes={CLIENTS.map((c, i) => ({ name: c.name, from: i }))} />
  );
}
