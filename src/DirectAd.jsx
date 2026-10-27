import React from "react";
import { FONT, DISP, C, clamp, lerp, prog, spring, easeInOut, Grain, renderEventsWav, MotionPlayer, Wordmark, tone } from "./motionKit";
import { VO_DIRECT } from "./audio/voDirect";
import { MUSIC_DIRECT } from "./audio/deepUrban";
import { SFX, SFX_PEAK } from "./audio/sfx";
import { SFXV, SFXV_PEAK } from "./audio/sfxVo";
import { TEE_PINK_HALO, TEE_BULLET, TEE_CHICANO_FRENTE, TEE_CHICANO_COSTAS } from "./direct/tees";

/* =============================================================================
   Estoke ao Cubo — "Me manda um Direct" (9:16, 22s)
   UI/UX motion em fundo escuro (#0A0F1D) com esferas de luz que mudam de cor com a história:
   azul no gancho, vermelho/laranja no atrito do Direct, verde-esmeralda/ciano na solução.
   Tipografia de impacto em caixa alta, cards de interface com cubic-bezier(0.22, 1, 0.36, 1).
   Tudo sincronizado com a narração ("provocativo O", ElevenLabs, 21,2s); o "AGORA!" cai em
   20,36s, então o vídeo tem 22s para caber a reverberação final de ~1,5s depois do impacto.
============================================================================= */
const DURATION = 22.0;
const FORMATS = { "9x16": { w: 450, h: 800, label: "9:16" } };
const VO_LEN = 21.24;
const T = {
  q2: 3.55, chat: 5.3, msg: 5.6, seen: 6.15, frete: 7.6, stamp: 8.75,
  site: 9.35, tapProd: 10.0, detail: 10.3, tapPix: 11.55, done: 11.9,
  turn: 13.0, pix: 14.15, auto: 14.85, path: 16.2, cta: 18.45, typed: 18.75, send: 19.6, agora: 20.36,
};
const BG = "#0A0F1D";
const GREEN = "#22C55E";
const NEON = "#39FF88";
const RED = "#FF3B30";

/* ---------- curva: cubic-bezier(0.22, 1, 0.36, 1) ---------- */
function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const X = (s) => ((ax * s + bx) * s + cx) * s;
  const Y = (s) => ((ay * s + by) * s + cy) * s;
  const dX = (s) => (3 * ax * s + 2 * bx) * s + cx;
  return (p) => {
    p = clamp(p);
    let s = p;
    for (let i = 0; i < 8; i++) {
      const d = dX(s);
      if (Math.abs(d) < 1e-6) break;
      s = clamp(s - (X(s) - p) / d);
    }
    return Y(s);
  };
}
const EASE = bezier(0.22, 1, 0.36, 1);
const ein = (t, at, d = 0.6) => EASE(prog(t, at, at + d));
const eout = (t, at, d = 0.3) => easeInOut(prog(t, at, at + d));
const soft = (t, at) => clamp(spring(t - at, { stiffness: 190, damping: 24 }), 0, 1);
const punch = (t, at) => clamp(spring(t - at, { stiffness: 320, damping: 17 }), 0, 1.15);

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lerpRGB = (a, b, p) => { const A = hex(a), B = hex(b); return A.map((v, i) => Math.round(v + (B[i] - v) * p)); };
const rgba = (c, a) => `rgba(${c.join(",")},${a})`;

/* ---------- fundo: esferas de luz que mudam de cor por cena ---------- */
const PALETTES = [
  { at: 0, c: ["#2F6FD8", "#7C5CFF", "#2FD4FF"] },          // gancho
  { at: T.chat, c: ["#FF3B30", "#FF8A00", "#FF5A3C"] },     // atrito no Direct
  { at: T.site, c: ["#10B981", "#2FD4FF", "#34D399"] },     // solução
  { at: T.cta, c: ["#10B981", "#2FD4FF", "#22C55E"] },      // CTA
];
function palette(t) {
  let out = PALETTES[0].c;
  for (let i = 1; i < PALETTES.length; i++) {
    const p = easeInOut(prog(t, PALETTES[i].at - 0.2, PALETTES[i].at + 0.5));
    out = out.map((c, k) => { const m = lerpRGB(typeof c === "string" ? c : "#000000", PALETTES[i].c[k], p); return `#${m.map((v) => v.toString(16).padStart(2, "0")).join("")}`; });
  }
  return out.map(hex);
}
const ORBS = [
  { x: 0.2, y: 0.22, r: 230, sp: 0.31, ph: 0, k: 0 },
  { x: 0.85, y: 0.5, r: 260, sp: 0.27, ph: 2.1, k: 1 },
  { x: 0.3, y: 0.86, r: 240, sp: 0.23, ph: 4.0, k: 2 },
];
function Background({ t, W, H }) {
  const pal = palette(t);
  const flash = t >= T.agora ? Math.exp(-(t - T.agora) * 5) : 0;
  return (
    <div style={{ position: "absolute", inset: 0, background: BG, overflow: "hidden" }}>
      {ORBS.map((o, i) => {
        const x = o.x * W + Math.sin(t * o.sp * 2 + o.ph) * 70, y = o.y * H + Math.cos(t * o.sp * 1.7 + o.ph) * 60;
        const r = o.r * (1 + 0.08 * Math.sin(t * 0.9 + o.ph));
        return <div key={i} style={{ position: "absolute", left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: "50%", background: `radial-gradient(circle, ${rgba(pal[o.k], 0.55)} 0%, ${rgba(pal[o.k], 0)} 70%)`, filter: "blur(30px)", opacity: 0.75 }} />;
      })}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(70% 50% at 50% 50%, rgba(10,15,29,0) 40%, rgba(10,15,29,.65) 100%)" }} />
      {flash > 0.01 && <div style={{ position: "absolute", inset: 0, background: `radial-gradient(60% 40% at 50% 62%, rgba(57,255,136,${0.35 * flash}), rgba(57,255,136,0) 70%)` }} />}
    </div>
  );
}

/* ---------- ícones ---------- */
const Pin = ({ s = 28, c = C.cyan }) => (
  <svg width={s} height={s * 1.25} viewBox="0 0 24 30"><path d="M12 29 C12 29 2 17.5 2 11 a10 10 0 0 1 20 0 C22 17.5 12 29 12 29Z" fill={c} /><circle cx="12" cy="11" r="4" fill={BG} /></svg>
);
const PhoneIco = ({ s = 26, c = "#fff" }) => (
  <svg width={s} height={s * 1.6} viewBox="0 0 20 32"><rect x="1.5" y="1.5" width="17" height="29" rx="4" fill="none" stroke={c} strokeWidth="2.2" /><rect x="7" y="4" width="6" height="2" rx="1" fill={c} /></svg>
);
const XIco = ({ s = 22, c = RED }) => (
  <svg width={s} height={s} viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill={c} /><path d="M7.5 7.5 L16.5 16.5 M16.5 7.5 L7.5 16.5" stroke="#fff" strokeWidth="3" strokeLinecap="round" /></svg>
);
const Bolt = ({ s = 16, c = "#FACC15" }) => (
  <svg width={s} height={s} viewBox="0 0 24 24"><path d="M13.5 2 L4 13.5 h6.5 L9.5 22 L20 9.5 h-6.5 Z" fill={c} /></svg>
);
const Cart = ({ s = 16, c = "#fff" }) => (
  <svg width={s} height={s} viewBox="0 0 24 24"><path d="M2.5 3.5 h3 l2.4 11 h10.6 l2-8 H7" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /><circle cx="9.5" cy="19.5" r="1.7" fill={c} /><circle cx="17" cy="19.5" r="1.7" fill={c} /></svg>
);
const Plane = ({ s = 26, c = "#fff" }) => (
  <svg width={s} height={s} viewBox="0 0 24 24"><path d="M21.5 2.5 L10.5 13.5 M21.5 2.5 L14.5 21.5 L10.5 13.5 L2.5 9.5 Z" fill="none" stroke={c} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" /></svg>
);
const Envelope = ({ s = 18, c = "#fff" }) => (
  <svg width={s} height={s} viewBox="0 0 24 24"><rect x="2.5" y="5" width="19" height="14" rx="2.5" fill="none" stroke={c} strokeWidth="2.2" /><path d="M3.5 6.5 L12 13 L20.5 6.5" fill="none" stroke={c} strokeWidth="2.2" strokeLinejoin="round" /></svg>
);
const PixIco = ({ s = 16, c = "#fff" }) => (
  <svg width={s} height={s} viewBox="0 0 24 24"><path d="M12 2.5 L21.5 12 L12 21.5 L2.5 12 Z" fill="none" stroke={c} strokeWidth="2.4" strokeLinejoin="round" /><path d="M8 12 L12 8 L16 12 L12 16 Z" fill={c} /></svg>
);
const Check = ({ s = 40, c = "#fff", p = 1 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24"><path d="M5 12.5 L10 17.5 L19.5 7" fill="none" stroke={c} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="24" strokeDashoffset={24 * (1 - p)} /></svg>
);
function Clock({ t, s = 18 }) {
  const a = t * 900, b = t * 75;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none" stroke="#FF8A65" strokeWidth="2" />
      <line x1="12" y1="12" x2="12" y2="5" stroke="#FF8A65" strokeWidth="2" strokeLinecap="round" transform={`rotate(${a} 12 12)`} />
      <line x1="12" y1="12" x2="16" y2="12" stroke="#FF8A65" strokeWidth="2" strokeLinecap="round" transform={`rotate(${b} 12 12)`} />
    </svg>
  );
}
function Ripple({ t, at, x, y, r = 40 }) {
  const p = prog(t, at, at + 0.6);
  if (p <= 0 || p >= 1) return null;
  const e = EASE(p);
  return (
    <>
      <div style={{ position: "absolute", left: x - r * e, top: y - r * e, width: r * 2 * e, height: r * 2 * e, borderRadius: "50%", border: `2px solid ${GREEN}`, opacity: 1 - p, zIndex: 30 }} />
      <div style={{ position: "absolute", left: x - 15, top: y - 15, width: 30, height: 30, borderRadius: "50%", background: GREEN, opacity: 0.5 * (1 - p) * (1 - p), transform: `scale(${0.6 + e * 0.8})`, zIndex: 30 }} />
    </>
  );
}

/* ---------- títulos de impacto ---------- */
function Impact({ t, at, out, y, size = 34, children, slideOut = 0, slideIn = 0, style }) {
  if (t < at - 0.01) return null;
  const p = punch(t, at);
  const o = out != null ? eout(t, out, 0.28) : 0;
  if (o >= 1) return null;
  const pi = Math.min(p, 1);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: y, textAlign: "center", padding: "0 26px", ...DISP, fontSize: size, lineHeight: 1.04, color: "#fff",
      opacity: clamp(pi * 2) * (slideOut ? 1 : 1 - o), filter: `blur(${(1 - pi) * 8 + (slideOut ? 0 : o * 8)}px)`,
      transform: `translateX(${(1 - pi) * slideIn - o * slideOut}px) scale(${slideIn ? 1 : lerp(1.35, 1, pi) * (p > 1 ? 1 + (p - 1) * 0.3 : 1)})`, ...style }}>
      {children}
    </div>
  );
}
const G = ({ c = NEON, children }) => <span style={{ color: c, textShadow: `0 0 18px ${c}66` }}>{children}</span>;

/* ---------- Cena 1: título que rola de uma pergunta para a outra ---------- */
// Cada linha é uma máscara: a pergunta antiga sobe e sai, a nova sobe por baixo (linha 2 com 0,08s de atraso),
// com um leve blur de movimento no meio do trajeto. O "ONDE" fica no mesmo lugar nas duas.
const HOOK = [
  [<>Onde estão</>, <>Onde é mais</>],
  [<>Seus <G c={C.cyan}>clientes?</G></>, <><G>Fácil</G> comprar?</>],
];
function HookTitle({ t }) {
  if (t < 0.3 || t > T.chat + 0.1) return null;
  const size = 34, lh = size * 1.18;
  const out = eout(t, T.chat - 0.3, 0.3);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 322, opacity: 1 - out, filter: out > 0.02 ? `blur(${out * 8}px)` : "none", transform: `scale(${lerp(1, 1.06, out)})` }}>
      {HOOK.map(([a, b], i) => {
        const pin = punch(t, 0.35 + i * 0.1);
        const roll = EASE(prog(t, T.q2 + i * 0.08, T.q2 + i * 0.08 + 0.55));
        const mb = Math.sin(Math.PI * roll) * 3.5;
        const line = { position: "absolute", left: 0, right: 0, top: 0, height: lh, display: "flex", alignItems: "center", justifyContent: "center", whiteSpace: "nowrap", filter: mb > 0.05 ? `blur(${mb}px)` : "none" };
        return (
          <div key={i} style={{ position: "relative", height: lh, overflow: "hidden", ...DISP, fontSize: size, lineHeight: 1, color: "#fff",
            opacity: clamp(pin * 2), transform: `scale(${lerp(1.3, 1, Math.min(pin, 1)) * (pin > 1 ? 1 + (pin - 1) * 0.3 : 1)})`, filter: pin < 1 ? `blur(${(1 - Math.min(pin, 1)) * 8}px)` : "none" }}>
            <div style={{ ...line, transform: `translateY(${-roll * lh}px)`, opacity: 1 - roll * 0.6 }}><span>{a}</span></div>
            <div style={{ ...line, transform: `translateY(${(1 - roll) * lh}px)`, opacity: 0.4 + roll * 0.6 }}><span>{b}</span></div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Cena 1: ícones convergem ---------- */
const FLY = Array.from({ length: 12 }, (_, i) => {
  const a = (i / 12) * Math.PI * 2 + 0.3;
  return { a, d: 330 + (i % 3) * 60, kind: i % 3 === 1 ? "phone" : "pin", delay: (i % 4) * 0.12, spin: (i % 2 ? 1 : -1) * (20 + i * 3) };
});
function Converge({ t, W, H }) {
  if (t > T.chat) return null;
  const out = eout(t, T.chat - 0.35, 0.35);
  return FLY.map((f, i) => {
    const p = ein(t, f.delay, 2.6);
    // convergem e param num anel em volta do título (mais aberto na vertical, para não cobrir o texto)
    const d = lerp(f.d, 175 + (i % 3) * 18, p);
    const a = f.a + p * 0.6 + EASE(prog(t, T.q2, T.q2 + 0.8)) * 0.35;
    const x = W / 2 + Math.cos(a) * d * 1.1, y = 370 + Math.sin(a) * d * 1.35;
    const op = clamp(prog(t, f.delay, f.delay + 0.4)) * (1 - out) * (0.55 + 0.45 * ((i % 3) / 2));
    return (
      <div key={i} style={{ position: "absolute", left: x - 14, top: y - 18, opacity: op, transform: `rotate(${(1 - p) * f.spin}deg) scale(${lerp(1.15, 0.85, p)})`, filter: `drop-shadow(0 0 10px ${f.kind === "pin" ? "rgba(47,212,255,.55)" : "rgba(255,255,255,.35)"})` }}>
        {f.kind === "pin" ? <Pin s={i % 2 ? 24 : 30} c={i % 4 === 0 ? NEON : C.cyan} /> : <PhoneIco s={22} />}
      </div>
    );
  });
}

/* ---------- Cena 2A: atrito no Direct ---------- */
const card = { position: "absolute", borderRadius: 22, background: "linear-gradient(180deg, rgba(23,30,48,.94), rgba(15,20,34,.94))", border: "1px solid rgba(255,255,255,.09)", boxShadow: "0 30px 70px rgba(0,0,0,.5)", color: "#fff", overflow: "hidden", fontFamily: FONT };
function Bubble({ t, at, children, me }) {
  const p = soft(t, at);
  if (t < at) return null;
  return (
    <div style={{ alignSelf: me ? "flex-end" : "flex-start", maxWidth: "78%", padding: "10px 14px", borderRadius: 18, borderBottomLeftRadius: me ? 18 : 6, borderBottomRightRadius: me ? 6 : 18,
      background: me ? "linear-gradient(135deg, #7C3AED, #3B82F6)" : "#262C3D", fontSize: 14, fontWeight: 600, lineHeight: 1.3,
      opacity: p, transform: `translateY(${(1 - p) * 14}px) scale(${lerp(0.9, 1, p)})`, transformOrigin: me ? "100% 100%" : "0 100%" }}>{children}</div>
  );
}
function ChatScene({ t, W }) {
  if (t < T.chat || t > T.site + 0.5) return null;
  const enter = ein(t, T.chat, 0.6);
  const push = EASE(prog(t, T.site, T.site + 0.42));
  const drain = prog(t, T.seen + 0.15, T.stamp - 0.1);
  const pat = 1 - drain;
  const barC = pat > 0.6 ? GREEN : pat > 0.3 ? "#FACC15" : RED;
  const st = punch(t, T.stamp);
  const shake = t > T.stamp && t < T.stamp + 0.3 ? Math.sin((t - T.stamp) * 90) * 6 * (1 - (t - T.stamp) / 0.3) : 0;
  const cw = 370, x0 = (W - cw) / 2;
  return (
    <div style={{ position: "absolute", inset: 0, transform: `translateX(${-push * 520 + shake}px)`, opacity: 1 - push * 0.6 }}>
      <Impact t={t} at={T.chat + 0.05} y={92} size={20} style={{ opacity: 0.9 }}>No Direct…</Impact>
      <div style={{ ...card, left: x0, top: 170, width: cw, height: 320, transform: `translateY(${(1 - enter) * 220}px) scale(${lerp(0.94, 1, enter)})`, opacity: enter }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,.07)" }}>
          <div style={{ width: 34, height: 34, borderRadius: 17, background: "linear-gradient(135deg,#F59E0B,#EC4899,#8B5CF6)", padding: 2 }}><div style={{ width: "100%", height: "100%", borderRadius: "50%", background: "#3B4256" }} /></div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 800 }}>cliente.quer.comprar</div>
            <div style={{ fontSize: 10.5, color: "#8A93A8", fontWeight: 600 }}>Direct</div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "16px 14px" }}>
          <Bubble t={t} at={T.msg}>Oi! Tem disponível? Qual o valor?</Bubble>
          <Bubble t={t} at={T.frete}>E o frete pra minha cidade?</Bubble>
        </div>
        {t >= T.seen && (
          <div style={{ position: "absolute", left: 16, right: 16, bottom: 18, opacity: ein(t, T.seen, 0.4) }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, fontWeight: 700, color: "#FF8A65" }}>
              <Clock t={t} /> Visto há 2 horas...
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, fontSize: 10.5, fontWeight: 700, color: "#8A93A8" }}>
              <span>Paciência do cliente</span><span style={{ color: barC }}>{Math.round(pat * 100)}%</span>
            </div>
            <div style={{ marginTop: 6, height: 9, borderRadius: 5, background: "rgba(255,255,255,.08)", overflow: "hidden" }}>
              <div style={{ width: `${pat * 100}%`, height: "100%", borderRadius: 5, background: barC, boxShadow: `0 0 12px ${barC}` }} />
            </div>
          </div>
        )}
      </div>
      {t >= T.stamp && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 540, display: "flex", justifyContent: "center", transform: `rotate(-8deg) scale(${lerp(2.4, 1, Math.min(st, 1)) * (st > 1 ? 1 + (st - 1) * 0.2 : 1)})`, opacity: clamp(st * 3) }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 20px", border: `4px solid ${RED}`, borderRadius: 12, color: RED, ...DISP, fontSize: 25, background: "rgba(255,59,48,.08)", boxShadow: `0 0 28px rgba(255,59,48,.35)` }}>
            Difícil e lento <XIco s={26} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Cena 2B: o site do concorrente ---------- */
const PRODUCTS = [
  { img: TEE_PINK_HALO, name: "Baby Tee Pink Halo Boxy", price: "R$ 65,00" },
  { img: TEE_BULLET, name: "Baby Tee Dizzy Bullet", price: "R$ 65,00" },
  { img: TEE_CHICANO_FRENTE, name: "Cropped Gold Chicano", price: "R$ 80,00" },
  { img: TEE_CHICANO_COSTAS, name: "Cropped Chicano Costas", price: "R$ 80,00" },
];
const Photo = ({ p, h, r = 14 }) => (
  <div style={{ height: h, borderRadius: r, overflow: "hidden", background: "#000" }}>
    <img src={p.img} alt="" decoding="sync" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
  </div>
);
const Tee = ({ c = "#fff", s = 60 }) => (
  <svg width={s} height={s} viewBox="0 0 64 64"><path d="M22 8 L12 12 L4 24 L13 29 L16 25 L16 56 L48 56 L48 25 L51 29 L60 24 L52 12 L42 8 C40 13 36 15 32 15 C28 15 24 13 22 8Z" fill={c} /></svg>
);
function SiteScene({ t, W }) {
  if (t < T.site || t > T.turn + 0.45) return null;
  const enter = EASE(prog(t, T.site, T.site + 0.5));
  const exit = eout(t, T.turn, 0.4);
  const det = ein(t, T.detail, 0.45);
  const done = soft(t, T.done);
  const timer = Math.min(30, Math.round(30 * prog(t, T.site + 0.3, T.done)));
  const pw = 250, ph = 500, x0 = (W - pw) / 2, y0 = 170;
  const pressP = t >= T.tapProd - 0.05 && t < T.tapProd + 0.1;
  const pressX = t >= T.tapPix - 0.05 && t < T.tapPix + 0.1;
  // celular 3D: entra girando e fica balançando de leve
  const turn = EASE(prog(t, T.site, T.site + 0.9));
  const ry = lerp(48, -16, turn) + Math.sin((t - T.site) * 1.3) * 6;
  const rx = lerp(16, 7, turn) + Math.sin((t - T.site) * 0.9 + 1) * 2;
  const rz = lerp(-6, 1.5, turn);
  const float = Math.sin((t - T.site) * 1.6) * 5;
  const glare = prog(t, T.site + 0.2, T.site + 1.4);
  return (
    <div style={{ position: "absolute", inset: 0, transform: `translateX(${(1 - enter) * 520}px) scale(${lerp(1, 0.55, exit)})`, opacity: 1 - exit, filter: exit > 0.02 ? `blur(${exit * 8}px)` : "none" }}>
      <Impact t={t} at={T.site + 0.1} y={92} size={20}>No site do <G>concorrente</G></Impact>
      {/* sombra no "chão" */}
      <div style={{ position: "absolute", left: x0 + 20 + ry * 1.5, top: y0 + ph + 10, width: pw - 40, height: 30, borderRadius: "50%", background: "radial-gradient(closest-side, rgba(0,0,0,.6), rgba(0,0,0,0))", filter: "blur(6px)" }} />
      <div style={{ position: "absolute", left: x0, top: y0, width: pw, height: ph, perspective: 950 }}>
      <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", transform: `translateY(${float}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg)` }}>
        {/* espessura: camadas de metal atrás da frente */}
        {Array.from({ length: 14 }, (_, i) => (
          <div key={i} style={{ position: "absolute", inset: 0, borderRadius: 40, transform: `translateZ(${-(i + 1) * 1.1}px)`, background: i === 13 ? "#0B0E16" : `linear-gradient(${90 + ry * 2}deg, #3A4152, #9AA3B5 ${45 + ry}%, #2A303D)` }} />
        ))}
        <div style={{ position: "absolute", inset: 0, borderRadius: 40, background: "#05070D", padding: 8, boxSizing: "border-box", transform: "translateZ(0.6px)", boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,.22), 0 0 60px rgba(16,185,129,.18)" }}>
        <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 33, overflow: "hidden", background: "#FFFFFF", color: "#0B1222", fontFamily: FONT }}>
          <div style={{ position: "absolute", left: "50%", top: 8, width: 74, height: 21, marginLeft: -37, borderRadius: 11, background: "#05070D", zIndex: 5 }} />
          {/* cronômetro */}
          <div style={{ position: "absolute", right: 12, top: 40, zIndex: 6, padding: "4px 8px", borderRadius: 10, background: "#0B1222", color: "#fff", fontSize: 10.5, fontWeight: 800, fontVariantNumeric: "tabular-nums", display: "flex", alignItems: "center", gap: 4 }}>
            <Bolt s={11} /> 0:{String(timer).padStart(2, "0")}
          </div>
          <div style={{ padding: "40px 16px 10px", fontSize: 15, fontWeight: 800 }}>Loja</div>
          {/* vitrine */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "0 14px", opacity: 1 - det, transform: `translateX(${-det * 60}px)` }}>
            {PRODUCTS.map((p, i) => (
              <div key={i} style={{ transform: i === 0 && pressP ? "scale(.95)" : "none" }}>
                <Photo p={p} h={112} />
                <div style={{ fontSize: 10.5, fontWeight: 700, marginTop: 5 }}>{p.name}</div>
                <div style={{ fontSize: 11, fontWeight: 800 }}>{p.price}</div>
              </div>
            ))}
          </div>
          {/* página do produto */}
          {det > 0.01 && (
            <div style={{ position: "absolute", left: 0, right: 0, top: 70, bottom: 0, background: "#fff", transform: `translateX(${(1 - det) * 240}px)` }}>
              <div style={{ margin: "0 14px" }}><Photo p={PRODUCTS[0]} h={200} r={18} /></div>
              <div style={{ padding: "12px 16px 0" }}>
                <div style={{ fontSize: 14, fontWeight: 800 }}>{PRODUCTS[0].name}</div>
                <div style={{ fontSize: 19, fontWeight: 800, marginTop: 2 }}>{PRODUCTS[0].price}</div>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: "#10B981", marginTop: 4 }}>Frete calculado: grátis · chega amanhã</div>
              </div>
              <div style={{ position: "absolute", left: 14, right: 14, top: 318, height: 44, borderRadius: 14, background: pressX ? "#0E9F6E" : "#10B981", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 14, fontWeight: 800, transform: `scale(${pressX ? 0.96 : 1})`, boxShadow: "0 10px 22px rgba(16,185,129,.35)" }}>
                <PixIco s={15} /> Comprar com Pix
              </div>
            </div>
          )}
          <Ripple t={t} at={T.tapProd} x={70} y={150} />
          <Ripple t={t} at={T.tapPix} x={117} y={70 + 340} />
          {/* check gigante */}
          {done > 0.01 && (
            <div style={{ position: "absolute", inset: 0, zIndex: 20, background: `rgba(16,185,129,${0.94 * done})`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#fff" }}>
              <div style={{ width: 110, height: 110, borderRadius: 55, background: "rgba(255,255,255,.2)", display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${lerp(0.4, 1, done)})`, boxShadow: "0 0 50px rgba(255,255,255,.35)" }}>
                <Check s={70} p={ein(t, T.done + 0.08, 0.45)} />
              </div>
              <div style={{ marginTop: 18, fontSize: 21, fontWeight: 800, letterSpacing: "-0.02em", opacity: done, transform: `translateY(${(1 - done) * 10}px)` }}>Compra fechada</div>
              <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 6, fontSize: 17, fontWeight: 800, opacity: done }}>em 30s <Bolt s={18} /></div>
            </div>
          )}
          {/* reflexo de vidro passando pela tela */}
          {glare > 0 && glare < 1 && <div style={{ position: "absolute", top: -60, bottom: -60, width: 90, left: lerp(-140, 300, glare), background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,.45), rgba(255,255,255,0))", transform: "rotate(18deg)", zIndex: 40, pointerEvents: "none" }} />}
        </div>
        </div>
      </div>
      </div>
    </div>
  );
}

/* ---------- Cena 3: a virada + prova ---------- */
function Notif({ t, at, icon, children, y }) {
  const p = soft(t, at);
  if (t < at) return null;
  return (
    <div style={{ position: "absolute", left: 14, right: 14, top: y, display: "flex", alignItems: "center", gap: 10, padding: "11px 13px", borderRadius: 16, background: "rgba(20,28,44,.92)", border: "1px solid rgba(52,211,153,.35)", boxShadow: "0 14px 30px rgba(0,0,0,.45), 0 0 24px rgba(16,185,129,.25)", color: "#fff", fontFamily: FONT, opacity: p, transform: `translateY(${(1 - p) * -40}px) scale(${lerp(0.92, 1, p)})`, zIndex: 10 }}>
      <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg,#10B981,#2FD4FF)", display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</div>
      <div style={{ fontSize: 13.5, fontWeight: 800 }}>{children}</div>
    </div>
  );
}
function TurnScene({ t, W }) {
  if (t < T.turn || t > T.cta + 0.4) return null;
  const enter = ein(t, T.turn + 0.15, 0.6);
  const cardOut = eout(t, T.path - 0.3, 0.35);
  const all = eout(t, T.cta - 0.05, 0.3);
  const cw = 360, x0 = (W - cw) / 2;
  // caminho Produto → Pix → Caixa
  const nodes = [{ s: "Produto", at: T.path + 0.55, ico: <Tee c="#fff" s={24} /> }, { s: "Pix", at: T.path + 1.05, ico: <PixIco s={20} /> }, { s: "Caixa", at: T.path + 1.65, ico: <Cart s={20} /> }];
  const line = easeInOut(prog(t, T.path + 0.5, T.path + 1.7));
  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - all, transform: `scale(${lerp(1, 0.9, all)})` }}>
      <Impact t={t} at={T.turn + 0.2} out={T.path - 0.15} y={90} size={30}>O cliente compra<br />de quem <G>facilita.</G></Impact>
      {cardOut < 1 && (
        <div style={{ ...card, left: x0, top: 250, width: cw, height: 330, opacity: enter * (1 - cardOut), transform: `translateY(${(1 - enter) * 160}px) scale(${lerp(0.94, 1, enter) * lerp(1, 0.9, cardOut)})`, background: "#0F1626" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "11px 14px", borderBottom: "1px solid rgba(255,255,255,.07)" }}>
            {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => <span key={c} style={{ width: 8, height: 8, borderRadius: 4, background: c }} />)}
            <span style={{ marginLeft: 10, flex: 1, padding: "4px 10px", borderRadius: 8, background: "rgba(255,255,255,.06)", fontSize: 10.5, color: "#A8B3C7", fontWeight: 600 }}>sualoja.com.br</span>
          </div>
          <div style={{ padding: 14 }}>
            <div style={{ height: 92, borderRadius: 14, background: "linear-gradient(120deg, #064E3B, #0E7490)", padding: 14, boxSizing: "border-box" }}>
              <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.02em" }}>Nova coleção</div>
              <div style={{ marginTop: 6, display: "inline-block", padding: "5px 10px", borderRadius: 8, background: "#fff", color: "#064E3B", fontSize: 10.5, fontWeight: 800 }}>Comprar agora</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 10 }}>
              {PRODUCTS.slice(1, 4).map((p, i) => <Photo key={i} p={p} h={70} r={10} />)}
            </div>
          </div>
          <Notif t={t} at={T.pix} y={150} icon={<Cart s={17} />}>Pix recebido • R$ 189,90</Notif>
          <Notif t={t} at={T.auto} y={210} icon={<Bolt s={17} c="#fff" />}>Venda no automático</Notif>
        </div>
      )}
      {t >= T.path && (
        <>
          <Impact t={t} at={T.path + 0.1} y={150} size={30}>Simplifique<br />o caminho até<br />o seu <G>caixa.</G></Impact>
          <div style={{ position: "absolute", left: 60, right: 60, top: 470 }}>
            <div style={{ position: "absolute", left: 30, right: 30, top: 28, height: 3, borderRadius: 2, background: "rgba(255,255,255,.1)" }} />
            <div style={{ position: "absolute", left: 30, top: 28, height: 3, borderRadius: 2, width: `calc(${line} * (100% - 60px))`, background: `linear-gradient(90deg, ${C.cyan}, ${NEON})`, boxShadow: `0 0 12px ${NEON}` }} />
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              {nodes.map((n) => {
                const on = soft(t, n.at);
                return (
                  <div key={n.s} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, opacity: lerp(0.35, 1, clamp(prog(t, T.path + 0.2, T.path + 0.6))) }}>
                    <div style={{ width: 58, height: 58, borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center", background: on > 0.05 ? `linear-gradient(135deg, #10B981, ${C.cyan})` : "rgba(255,255,255,.07)", boxShadow: on > 0.05 ? `0 0 ${24 * on}px rgba(57,255,136,.5)` : "none", transform: `scale(${lerp(0.9, 1, on)})` }}>{n.ico}</div>
                    <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 800, color: on > 0.05 ? "#fff" : "#7D879B" }}>{n.s}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ---------- Cena 4: CTA para o Direct ---------- */
const TYPED = "Quero meu site!";
function CtaScene({ t, W }) {
  if (t < T.cta) return null;
  const enter = ein(t, T.cta + 0.05, 0.55);
  const n = Math.round(TYPED.length * prog(t, T.typed, T.typed + 0.6));
  const caret = t < T.send && Math.floor(t * 3) % 2 === 0;
  const cur = ein(t, T.typed + 0.4, 0.45);
  const press = t >= T.send - 0.06 && t < T.send + 0.1;
  const sent = soft(t, T.send + 0.05);
  const glow = 0.6 + 0.4 * Math.sin(t * 5);
  const big = punch(t, T.agora);
  const btn = soft(t, T.agora + 0.15);
  const pulse = t > T.agora + 0.6 ? 1 + 0.04 * Math.max(0, Math.sin((t - T.agora) * 7)) : 1;
  const cw = 360, x0 = (W - cw) / 2, cy = 150;
  const shake = t > T.agora && t < T.agora + 0.28 ? Math.sin((t - T.agora) * 95) * 7 * (1 - (t - T.agora) / 0.28) : 0;
  return (
    <div style={{ position: "absolute", inset: 0, transform: `translate(${shake}px, ${shake * 0.4}px)` }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 46, display: "flex", justifyContent: "center", opacity: ein(t, T.cta + 0.2, 0.6) }}><Wordmark size={13} color="#FFFFFF" /></div>
      <div style={{ ...card, left: x0, top: cy, width: cw, height: 250, opacity: enter, transform: `translateY(${(1 - enter) * 120}px) scale(${lerp(0.92, 1, enter)})` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 16px 12px" }}>
          <div style={{ width: 46, height: 46, borderRadius: 23, display: "flex", alignItems: "center", justifyContent: "center", background: `linear-gradient(135deg, ${C.cyan}, ${NEON})`, boxShadow: `0 0 ${18 + glow * 18}px rgba(57,255,136,${0.35 + glow * 0.3})` }}>
            <Plane s={24} c="#06281A" />
          </div>
          <div>
            <div style={{ fontSize: 14.5, fontWeight: 800 }}>estokeaocubo</div>
            <div style={{ fontSize: 10.5, color: "#8A93A8", fontWeight: 600 }}>Direct · responde na hora</div>
          </div>
        </div>
        <div style={{ height: 96, padding: "4px 14px", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          {sent > 0.01 && <div style={{ alignSelf: "flex-end", padding: "10px 14px", borderRadius: 18, borderBottomRightRadius: 6, background: "linear-gradient(135deg, #7C3AED, #3B82F6)", fontSize: 14, fontWeight: 700, opacity: sent, transform: `translateY(${(1 - sent) * 20}px) scale(${lerp(0.85, 1, sent)})`, transformOrigin: "100% 100%" }}>{TYPED}</div>}
        </div>
        <div style={{ position: "absolute", left: 14, right: 14, bottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ flex: 1, height: 42, borderRadius: 21, border: "1px solid rgba(255,255,255,.14)", display: "flex", alignItems: "center", padding: "0 16px", fontSize: 14, fontWeight: 600, color: sent > 0.5 ? "#6B7489" : "#fff" }}>
            {sent > 0.5 ? "Mensagem..." : TYPED.slice(0, n)}{caret && <span style={{ display: "inline-block", width: 2, height: 17, marginLeft: 1, background: NEON }} />}
          </div>
          <div style={{ height: 42, padding: "0 16px", borderRadius: 21, display: "flex", alignItems: "center", fontSize: 13.5, fontWeight: 800, color: "#06281A", background: NEON, transform: `scale(${press ? 0.92 : 1})`, boxShadow: `0 0 18px rgba(57,255,136,.45)` }}>Enviar</div>
        </div>
        <Ripple t={t} at={T.send} x={cw - 52} y={250 - 37} r={34} />
        {cur > 0 && t < T.send + 0.5 && (
          <svg width="24" height="28" viewBox="0 0 26 30" style={{ position: "absolute", left: lerp(cw + 30, cw - 50, cur), top: lerp(330, 250 - 38, cur), opacity: 1 - eout(t, T.send + 0.2, 0.3), transform: `scale(${press ? 0.88 : 1})`, filter: "drop-shadow(0 4px 6px rgba(0,0,0,.5))" }}>
            <path d="M4 2 L4 24 L9.5 19 L13.5 28 L17 26.4 L13 17.6 L20.5 17.6 Z" fill="#fff" stroke="#0B1222" strokeWidth="1.6" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      {t >= T.agora && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 450, textAlign: "center", ...DISP, fontSize: 50, lineHeight: 1, color: "#fff",
          transform: `scale(${lerp(0.3, 1, Math.min(big, 1)) * (big > 1 ? 1 + (big - 1) * 0.35 : 1)})`, opacity: clamp(big * 3),
          textShadow: `0 0 18px rgba(57,255,136,.9), 0 0 46px rgba(57,255,136,.55)` }}>
          Mude isso<br /><span style={{ color: NEON }}>agora.</span>
        </div>
      )}
      {t >= T.agora + 0.1 && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 612, display: "flex", justifyContent: "center", opacity: btn, transform: `translateY(${(1 - btn) * 30}px)` }}>
          <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", inset: -5, borderRadius: 34, border: `2px solid ${NEON}`, opacity: 0.7 * (1 - ((t - T.agora) % 0.9) / 0.9), transform: `scale(${1 + (((t - T.agora) % 0.9) / 0.9) * 0.16})` }} />
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 28px", borderRadius: 30, background: `linear-gradient(95deg, #10B981, ${NEON})`, color: "#05210F", ...DISP, fontSize: 16, boxShadow: "0 0 30px rgba(57,255,136,.45)", transform: `scale(${pulse})` }}>
              Me manda um Direct <Envelope s={19} c="#05210F" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Frame ---------- */
function Frame({ t, format = "9x16" }) {
  const F = FORMATS[format];
  const W = F.w, H = F.h;
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", fontFamily: FONT, background: BG }}>
      <Background t={t} W={W} H={H} />
      <Converge t={t} W={W} H={H} />
      {/* Cena 1: o gancho */}
      <HookTitle t={t} />
      <ChatScene t={t} W={W} />
      <SiteScene t={t} W={W} />
      <TurnScene t={t} W={W} />
      <CtaScene t={t} W={W} />
      <Grain t={t} opacity={0.035} />
    </div>
  );
}

/* =============================================================================
   Som — trilha "Deep Urban" (Mixkit, 124 BPM): o build fica por baixo do gancho e do Direct,
   o drop entra na virada para o site do concorrente (9,35s). A música fica baixa e abaixa
   mais sob a voz; no "AGORA!" (20,36s) entram sub-drop + impacto e a música é cortada a seco,
   sobrando só a reverberação do impacto no último 1,5s.
============================================================================= */
const SPEECH = [[0, 3.16], [3.52, 5.04], [5.48, 8.96], [9.38, 12.64], [13.2, 15.66], [16.3, 18.28], [18.66, 20.78]];
const DUCK = 0.42;
function musicEnv() {
  const env = [[0, DUCK]];
  SPEECH.forEach(([a, b]) => { if (a > 0.2) env.push([a - 0.12, 1], [a, DUCK]); env.push([b, DUCK], [b + 0.12, 1]); });
  const out = env.filter(([x]) => x < T.agora - 0.05);
  out.push([T.agora - 0.05, DUCK], [T.agora + 0.04, DUCK], [T.agora + 0.06, 0], [DURATION, 0]);
  return out.sort((a, b) => a[0] - b[0]);
}
const MUSIC_ENV = musicEnv();
const PEAK = { ...SFX_PEAK, ...SFXV_PEAK };
const SAMPLES = { vo: VO_DIRECT.voDirect, music: MUSIC_DIRECT.deepUrban, ...SFX, ...SFXV };
const SFX_PLAN = [
  [0.1, "airWhoosh", 0.16, { rate: 0.8 }],
  [0.35, "zoomImpact", 0.14],
  [T.q2, "tunnelWhoosh", 0.14, { rate: 1.1 }],
  [T.chat, "airSweep", 0.12],
  [T.msg, "dryPop", 0.2], [T.frete, "dryPop", 0.17],
  [T.seen, "tick", 0.16, { dur: 2.3, fadeOut: 0.2 }],
  [T.stamp - 0.5, "alertBeep", 0.07],
  [T.stamp, "lockShut", 0.3], [T.stamp, "deepHit", 0.28],
  [T.site, "tunnelWhoosh", 0.2],
  [T.tapProd, "bubblePop", 0.22], [T.detail, "smallSweep", 0.1],
  [T.tapPix, "bubblePop", 0.22],
  [T.done, "coinWin", 0.3], [T.done + 0.05, "positive", 0.12],
  [T.turn, "windSwoosh", 0.16],
  [T.turn + 0.2, "zoomImpact", 0.12],
  [T.pix, "coinWin", 0.26], [T.auto, "bell", 0.2],
  [T.path, "airSweep", 0.12],
  [T.path + 0.55, "lightPop", 0.12], [T.path + 1.05, "lightPop", 0.12], [T.path + 1.65, "lightPop", 0.14],
  [T.cta, "tunnelWhoosh", 0.16, { rate: 1.15 }],
  [T.cta + 0.1, "dryPop", 0.2],
  [T.typed, "typing", 0.28, { dur: 0.55, fadeOut: 0.08 }],
  [T.send, "mouseClick", 0.3], [T.send + 0.05, "bubblePop", 0.16],
  [T.agora, "logoImpact", 0.6], [T.agora, "deepHit", 0.5],
];
function buildEvents() {
  const ev = [];
  const fx = (at, name, gain, opts = {}) => ev.push({ t: Math.max(0, at - (PEAK[name] || 0) / (opts.rate || 1)), fn: (A, w) => A.sample(name, w, { gain, ...opts }) });
  ev.push({ t: 0, dur: VO_LEN, fn: (A, w, off = 0) => A.sample("vo", w, { off, dur: VO_LEN - off, gain: 1.15 }) });
  ev.push({ t: 0, dur: DURATION, fn: (A, w, off = 0) => A.sample("music", w, { off, dur: DURATION - off, gain: 0.09, fadeIn: 0.2, fadeOut: 0.004, env: MUSIC_ENV }) });
  // sub-drop cravado no "AGORA!"
  ev.push({ t: T.agora, fn: (A, w) => tone(A, w, { type: "sine", f: 90, f2: 30, glide: 0.9, dur: 1.4, v: 0.6, a: 0.005 }) });
  SFX_PLAN.forEach(([at, n, g, o]) => fx(at, n, g, o));
  return ev;
}
const EVENTS = buildEvents();
const renderWav = () => renderEventsWav(EVENTS, DURATION, { samples: SAMPLES });

// Usado pelo exportador de vídeo (scripts/export-video.cjs)
const MOTION = { Frame, duration: DURATION, formats: FORMATS, renderWav };

export default function DirectAd() {
  return (
    <MotionPlayer Frame={Frame} duration={DURATION} events={EVENTS} formats={FORMATS} defaultFormat="9x16" renderWav={renderWav} samples={SAMPLES}
      fontsToLoad={[`800 16px "Open Sauce Sans"`, `800 16px "EAC Display"`]}
      scenes={[{ name: "Gancho", from: 0 }, { name: "Direct", from: T.chat }, { name: "Concorrente", from: T.site }, { name: "Virada", from: T.turn }, { name: "Caminho", from: T.path }, { name: "CTA", from: T.cta }]} />
  );
}
