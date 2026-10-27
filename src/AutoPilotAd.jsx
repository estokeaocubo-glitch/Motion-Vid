import React from "react";
import { C, FONT, clamp, lerp, prog, spring, easeInOut, easeOut, fitSize, Grain, CubeLogo, renderEventsWav, MotionPlayer, Wordmark } from "./motionKit";
import { SCRIPT } from "./autopilot/variant";
import { MUSIC_AUTOPILOT } from "./audio/autoPilotRef";

/* =============================================================================
   Estoke ao Cubo — "WhatsApp no automático" (UI motion, 9,2s, 16:9 e 9:16)
   Referência: vídeo "Auto Pilot" — o cursor liga a chave, a lista da esquerda acende item por
   item (a bolinha colorida desce) e, na direita, um card de vidro fosco prova cada função,
   trocando de baixo para cima. No fim a régua das madrugadas corre com os pedidos subindo.
   Áudio: o original da referência; os tempos são os da própria referência (medidos quadro a
   quadro): clique 0,24–0,44s, lista em 1,0s, itens em 1,0 / 2,9 / 4,85 / 6,65s, saída em 8,0s.
   Três textos (./autopilot/v1.js, v2.js, v3.js) com o mesmo componente.
============================================================================= */
const DURATION = 9.22;
const T = { press: 0.24, on: 0.44, open: 1.0, out: 8.0, end: 8.4 };
const ITEMS = [1.0, 2.9, 4.85, 6.65];
const WA = "#25D366";
const INK = "#1C1D21";
const FAINT = "#C6C8CE";
const DOTS = ["#1F7BFF", WA, "#14C8B4", "#FF9F1C"];
const FORMATS = {
  "16x9": { w: 800, h: 450, label: "16:9" },
  "9x16": { w: 450, h: 800, label: "9:16" },
};
// posição da chave, da lista e do card (o card é sempre 360×400, só muda de lugar)
const LAYOUT = {
  "16x9": { label: { x: 52, y: 225, w: 330, align: "left" }, toggle: { x: 420, y: 170, w: 310, h: 110 }, list: { x: 50, y: 225, w: 330, max: 40, gap: 1.62, center: true }, card: { x: 412, y: 25 } },
  "9x16": { label: { x: 40, y: 300, w: 370, align: "center" }, toggle: { x: 95, y: 370, w: 260, h: 92 }, list: { x: 44, y: 92, w: 360, max: 36, gap: 1.42, center: false }, card: { x: 45, y: 352 } },
};
const CW = 360;
const CH = 400;

const glass = (a = 0.72) => ({
  background: `linear-gradient(135deg, rgba(255,255,255,${a}) 0%, rgba(240,247,255,${a - 0.16}) 55%, rgba(255,255,255,${a - 0.06}) 100%)`,
  border: "1px solid rgba(255,255,255,.92)",
  boxShadow: "0 10px 26px rgba(20,30,60,.18), inset 0 1px 0 rgba(255,255,255,.9)",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
});
// brilho iridescente que corre por cima do vidro
function Sheen({ t, r = 14 }) {
  return (
    <div style={{
      position: "absolute", inset: 0, borderRadius: r, pointerEvents: "none", mixBlendMode: "overlay", opacity: 0.55,
      background: `linear-gradient(115deg, transparent 20%, rgba(255,190,240,.7) 38%, rgba(160,230,255,.7) 50%, rgba(200,255,200,.6) 62%, transparent 80%)`,
      backgroundSize: "260% 100%", backgroundPosition: `${(t * 18) % 260}% 0`,
    }} />
  );
}

/* ---------- pedaços de interface ---------- */
function Hand({ x, y, s = 1 }) {
  return (
    <svg width={44 * s} height={50 * s} viewBox="0 0 36 42" style={{ position: "absolute", left: x - 13 * s, top: y - 6 * s, overflow: "visible", filter: "drop-shadow(0 3px 4px rgba(0,0,0,.25))" }}>
      <path d="M11 7 a3 3 0 0 1 6 0 V17 a2.5 2.5 0 0 1 5 0 v1 a2.5 2.5 0 0 1 5 0 v1 a2.5 2.5 0 0 1 5 0 V30 q0 9 -9 9 H16 q-5 0 -8 -4 L2 25 a2.8 2.8 0 0 1 4.6 -3.2 L11 25 Z"
        fill="#fff" stroke="#111" strokeWidth="2" strokeLinejoin="round" />
      <path d="M17 17 v6 M22 18 v5 M27 19 v4" stroke="#111" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function Ticks({ color = "#34B7F1" }) {
  return (
    <svg width="15" height="9" viewBox="0 0 15 9" style={{ marginLeft: 3 }}>
      <path d="M1 5 l2.5 2.5 L9 1.5 M6 6.5 l1 1 L13.5 1.5" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function Check({ size = 10, color = "#fff" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 10 10"><path d="M2 5.2 l2 2 L8 2.8" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
  );
}
const popIn = (t, at) => clamp(spring(t - at, { stiffness: 260, damping: 18 }), 0, 1.2);

function Bubble({ t, at, side, text, time, read }) {
  const p = popIn(t, at);
  if (t < at) return null;
  const out = side === "out";
  return (
    <div style={{ display: "flex", justifyContent: out ? "flex-end" : "flex-start", transform: `translateY(${(1 - Math.min(p, 1)) * 10}px) scale(${lerp(0.85, 1, Math.min(p, 1))})`, transformOrigin: out ? "100% 100%" : "0 100%", opacity: Math.min(1, p * 1.6) }}>
      <div style={{
        maxWidth: 222, padding: "7px 10px 5px", borderRadius: 12, fontSize: 11.5, lineHeight: 1.35, color: "#111B21",
        borderBottomRightRadius: out ? 3 : 12, borderBottomLeftRadius: out ? 12 : 3,
        background: out ? "linear-gradient(135deg, rgba(217,253,211,.95), rgba(190,245,200,.82))" : "rgba(255,255,255,.93)",
        boxShadow: "0 2px 6px rgba(0,0,0,.08)",
      }}>
        {text}
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", fontSize: 8.5, color: "#667781", marginTop: 2 }}>
          {time}{out && <Ticks color={read ? "#34B7F1" : "#8696A0"} />}
        </div>
      </div>
    </div>
  );
}
function Typing({ t, a, b }) {
  if (t < a || t >= b) return null;
  return (
    <div style={{ display: "flex", justifyContent: "flex-end" }}>
      <div style={{ display: "flex", gap: 4, padding: "9px 12px", borderRadius: 12, background: "rgba(217,253,211,.9)" }}>
        {[0, 1, 2].map((i) => <div key={i} style={{ width: 5, height: 5, borderRadius: 3, background: "#5E8F6B", opacity: 0.35 + 0.65 * Math.max(0, Math.sin((t - a) * 12 - i * 0.9)) }} />)}
      </div>
    </div>
  );
}
function Chip({ t, at, children }) {
  const p = popIn(t, at);
  if (t < at) return null;
  return (
    <div style={{ display: "flex", justifyContent: "center", marginTop: 2 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 20, fontSize: 9.5, fontWeight: 700, color: "#0B6B3A", background: "rgba(255,255,255,.9)", border: `1px solid ${WA}55`, transform: `scale(${lerp(0.6, 1, Math.min(p, 1))})`, opacity: Math.min(1, p * 1.5) }}>
        <div style={{ width: 13, height: 13, borderRadius: 7, background: WA, display: "flex", alignItems: "center", justifyContent: "center" }}><Check size={9} /></div>
        {children}
      </div>
    </div>
  );
}

// conversas dos cards de chat: [lado, texto, hora, atraso a partir do card]
const CHATS = {
  reply: {
    name: "Ana Paula", status: "online", av: ["#FFB199", "#FF0844"],
    lines: [["in", "Oi! Quanto tá o kit presente? Entregam hoje?", "23:47", 0.25], ["typing", 0.55, 0.95], ["out", "Oi, Ana! O kit sai R$ 89,90 e a entrega é hoje até as 20h. Separo o seu?", "23:47", 0.95]],
    chip: ["respondido em 3 segundos", 1.35],
  },
  recover: {
    name: "Carla Souza", status: "visto por último ontem", av: ["#A18CD1", "#FBC2EB"],
    lines: [["in", "Vou pensar e te falo", "ontem 16:02", -1], ["day", "hoje", 0.2], ["out", "Oi, Carla! Seu pedido ainda tá separado. Liberei frete grátis até hoje às 23h59.", "09:00", 0.4], ["in", "Fechado! Me manda o PIX", "09:04", 1.05]],
    chip: ["venda recuperada · R$ 189,90", 1.4],
  },
  faq: {
    name: "Rafael Lima", status: "online", av: ["#84FAB0", "#8FD3F4"],
    lines: [["in", "Vocês entregam em Niterói? Qual o prazo?", "21:12", 0.2], ["typing", 0.45, 0.75], ["out", "Entregamos sim! Chega em 1 dia útil, com frete grátis acima de R$ 150.", "21:12", 0.75], ["in", "Perfeito, vou pedir agora", "21:13", 1.2]],
    chip: ["dúvida resolvida em 3 segundos", 1.5],
  },
};
function ChatCard({ t, a, chat }) {
  const c = CHATS[chat];
  return (
    <div style={{ position: "absolute", left: 22, top: 26, width: CW - 44, height: CH - 52, borderRadius: 18, overflow: "hidden", ...glass(0.6) }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,.7)", background: "rgba(255,255,255,.45)" }}>
        <div style={{ width: 28, height: 28, borderRadius: 14, background: `linear-gradient(135deg, ${c.av[0]}, ${c.av[1]})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 12 }}>{c.name[0]}</div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#111B21" }}>{c.name}</div>
          <div style={{ fontSize: 9, color: c.status === "online" ? "#0B8F4A" : "#667781" }}>{c.status}</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4, padding: "3px 7px", borderRadius: 10, background: `${WA}22`, fontSize: 8.5, fontWeight: 700, color: "#0B6B3A" }}>
          <div style={{ width: 6, height: 6, borderRadius: 3, background: WA }} />piloto automático
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: 12 }}>
        {c.lines.map((l, i) => {
          if (l[0] === "typing") return <Typing key={i} t={t} a={a + l[1]} b={a + l[2]} />;
          if (l[0] === "day") return t >= a + l[2] ? <div key={i} style={{ alignSelf: "center", fontSize: 8.5, fontWeight: 700, color: "#54656F", padding: "3px 9px", borderRadius: 8, background: "rgba(255,255,255,.85)", opacity: clamp((t - a - l[2]) * 5) }}>{l[1]}</div> : null;
          return <Bubble key={i} t={t} at={a + l[3]} side={l[0]} text={l[1]} time={l[2]} read={t > a + l[3] + 0.4} />;
        })}
        <Chip t={t} at={a + c.chip[1]}>{c.chip[0]}</Chip>
      </div>
      <Sheen t={t} r={18} />
    </div>
  );
}

const AGENDA = [["Juliana", "Corte + escova", "14:00"], ["Marcos", "Barba", "15:30"], ["Fernanda", "Manicure", "17:00"], ["Bruno", "Corte masculino", "18:30"]];
function AgendaCard({ t, a }) {
  return (
    <>
      <div style={{ position: "absolute", left: 18, top: 20, padding: "6px 12px", borderRadius: 14, fontSize: 11, fontWeight: 700, color: "#1B2A4A", ...glass(0.8) }}>Agenda de sábado · marcada pelo WhatsApp</div>
      {AGENDA.map(([who, what, hour], i) => {
        const at = a + 0.15 + i * 0.2;
        const p = Math.min(1, popIn(t, at));
        const ok = t > at + 0.45;
        return t < at ? null : (
          <div key={i} style={{ position: "absolute", left: 18, top: 70 + i * 76, width: CW - 36, height: 62, borderRadius: 16, display: "flex", alignItems: "center", padding: "0 14px", boxSizing: "border-box", ...glass(0.7), transform: `translateX(${(1 - p) * 40}px)`, opacity: p }}>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: "#111B21" }}>Horário com {who}</div>
              <div style={{ fontSize: 10, color: "#54656F", marginTop: 2 }}>{what} · {hour}</div>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4, padding: "4px 9px", borderRadius: 12, fontSize: 9.5, fontWeight: 700, background: ok ? WA : "rgba(255,255,255,.9)", color: ok ? "#fff" : "#54656F", border: "1px solid rgba(255,255,255,.9)" }}>
              {ok && <Check size={9} />}{ok ? "Confirmado" : "Enviando…"}
            </div>
            <Sheen t={t + i} r={16} />
          </div>
        );
      })}
    </>
  );
}

const NIGHT = [
  ["pix", "Pedido #401 pago via PIX", "01:12"], ["ag", "Agendamento confirmado · Juliana", "01:47"], ["oi", "Nova cliente: Beatriz", "02:05"],
  ["pix", "Pedido #402 pago via PIX", "02:38"], ["rs", "Orçamento enviado · R$ 450", "03:02"], ["pix", "Pedido #403 pago via PIX", "03:15"],
  ["ag", "Agendamento confirmado · Marcos", "03:41"], ["oi", "Dúvida respondida · frete", "04:08"], ["pix", "Pedido #404 pago via PIX", "04:26"],
  ["ag", "Lembrete enviado · Fernanda", "04:53"], ["pix", "Pedido #405 pago via PIX", "05:20"],
];
const ICON_BG = { "pix": WA, "ag": "#1F7BFF", "oi": "#14C8B4", "rs": "#FF9F1C" };
const ICON_TXT = { "pix": "PIX", "ag": "AG", "oi": "OI", "rs": "R$" };
function NightCard({ t, a }) {
  const lt = Math.max(0, t - a);
  const scroll = lt * 62 + easeOut(clamp(lt * 2)) * 40;
  const RULER = 70;
  const hourPx = 120;
  // a régua anda junto com a lista: começa em 1h e passa pelas madrugadas
  const rx = -(lt * 105);
  return (
    <>
      <div style={{ position: "absolute", left: 0, top: 0, width: CW, height: CH - RULER, overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 18, top: 0, width: CW - 36, transform: `translateY(${150 - scroll}px)` }}>
          {NIGHT.map(([ic, txt, hour], i) => (
            <div key={i} style={{ height: 40, marginBottom: 8, borderRadius: 12, display: "flex", alignItems: "center", gap: 9, padding: "0 10px", position: "relative", ...glass(0.78) }}>
              <div style={{ width: 24, height: 24, borderRadius: 8, background: ICON_BG[ic], color: "#fff", fontSize: 7.5, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{ICON_TXT[ic]}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#1B1E2E" }}>{txt}</div>
              <div style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700, color: "#5A5F7A", fontVariantNumeric: "tabular-nums" }}>{hour}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ position: "absolute", left: 0, bottom: 0, width: CW, height: RULER, background: "rgba(255,255,255,.96)", overflow: "hidden" }}>
        <div style={{ position: "absolute", left: rx + 40, top: 8, height: 40, width: 2000 }}>
          {Array.from({ length: 96 }, (_, i) => (
            <div key={i} style={{ position: "absolute", left: i * (hourPx / 8), top: 0, width: 1.2, height: i % 8 === 0 ? 22 : i % 4 === 0 ? 15 : 9, background: "#9AA0B4" }} />
          ))}
          {Array.from({ length: 12 }, (_, i) => (
            <div key={i} style={{ position: "absolute", left: i * hourPx - 20, top: 30, width: 40, textAlign: "center", fontSize: 11, fontWeight: 700, color: "#4A5068" }}>{`${String(i + 1).padStart(2, "0")}:00`}</div>
          ))}
        </div>
        <div style={{ position: "absolute", left: CW / 2 - 1, top: 4, width: 2, height: 30, borderRadius: 1, background: "#FF5A3C" }} />
      </div>
    </>
  );
}

// fundos "artísticos" dos cards (como as fotos atrás do vidro na referência)
const ART = [
  (t) => `radial-gradient(circle at ${30 + t * 3}% 22%, rgba(255,255,255,.95) 0 9%, rgba(255,240,250,.6) 16%, transparent 30%), radial-gradient(circle at 78% 70%, rgba(255,255,255,.85) 0 7%, rgba(255,226,240,.5) 14%, transparent 26%), radial-gradient(circle at 12% 84%, rgba(255,250,255,.8) 0 6%, transparent 20%), linear-gradient(160deg, #2E8CD8 0%, #6EC1F5 45%, #1C5FA8 100%)`,
  (t) => `radial-gradient(ellipse 60% 40% at ${70 - t * 2}% 18%, rgba(250,246,226,.95), transparent 70%), repeating-linear-gradient(118deg, rgba(255,255,255,.0) 0 14px, rgba(255,255,255,.14) 14px 18px), linear-gradient(135deg, #DCD6B6 0%, #7E8C3C 38%, #3E5A22 70%, #1E3314 100%)`,
  (t) => `repeating-linear-gradient(${-28 + t}deg, rgba(255,255,255,.0) 0 7px, rgba(255,255,255,.35) 7px 9px, rgba(20,40,150,.0) 9px 16px), radial-gradient(circle at 25% 30%, #9CC4FF, transparent 45%), radial-gradient(circle at 80% 75%, #3B2EA8, transparent 50%), linear-gradient(140deg, #3E7BE8 0%, #2A3FB8 50%, #6A8CFF 100%)`,
  (t) => `linear-gradient(180deg, #3A3A78 0%, #6B5BB0 35%, #B36FB0 62%, #E58A6E 85%, #F2A65A 100%)`,
];

function Card({ k, t, a }) {
  return (
    <div style={{ position: "absolute", inset: 0, borderRadius: 26, overflow: "hidden", background: ART[k](t), boxShadow: "0 24px 50px rgba(30,40,80,.22), 0 2px 0 rgba(255,255,255,.6) inset" }}>
      {k === 0 && <ChatCard t={t} a={a} chat="reply" />}
      {k === 1 && <ChatCard t={t} a={a} chat={SCRIPT.chat2} />}
      {k === 2 && <AgendaCard t={t} a={a} />}
      {k === 3 && <NightCard t={t} a={a} />}
    </div>
  );
}

/* ---------- cenas ---------- */
function ToggleScene({ t, L }) {
  const lab = L.label;
  const tg = L.toggle;
  const on = easeInOut(prog(t, T.press, T.on));
  const leave = easeInOut(prog(t, T.open - 0.08, T.open + 0.25));
  // o cursor entra pela direita e para em cima do botão; aperta e arrasta o botão até o fim
  const knob = tg.h - 12;
  const kx = lerp(6, tg.w - knob - 6, on);
  const enter = easeOut(prog(t, 0, 0.22));
  const press = t > T.press - 0.04 && t < T.on + 0.06 ? 0.9 : 1;
  const hx = lerp(tg.w + 40, kx + knob * 0.55, enter);
  const hy = lerp(tg.h + 40, knob * 0.5, enter);
  const lsize = SCRIPT.toggle.length > 20 ? 30 : 40;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - leave, transform: `translateY(${-leave * 60}px) scale(${1 - leave * 0.08})`, filter: leave > 0 ? `blur(${leave * 6}px)` : "none" }}>
      <div style={{ position: "absolute", left: lab.x, top: lab.align === "left" ? lab.y : lab.y - lsize * 1.1, width: lab.w, transform: lab.align === "left" ? "translateY(-50%)" : "translateY(-50%)", fontSize: lsize, fontWeight: 600, letterSpacing: "-0.025em", lineHeight: 1.1, color: INK, textAlign: lab.align }}>
        {SCRIPT.toggle}
      </div>
      <div style={{ position: "absolute", left: tg.x, top: tg.y, width: tg.w, height: tg.h, borderRadius: tg.h / 2, overflow: "hidden", background: "linear-gradient(180deg, #CFD1D6, #B7BAC1)", boxShadow: "inset 0 3px 8px rgba(0,0,0,.18)" }}>
        <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: kx + knob + 6, borderRadius: tg.h / 2, background: `linear-gradient(180deg, #3BE07C, ${WA} 55%, #18B455)`, opacity: clamp(on * 1.4) }} />
        <div style={{ position: "absolute", left: kx, top: 6, width: knob, height: knob, borderRadius: knob / 2, background: on > 0.05 ? "radial-gradient(circle at 35% 30%, rgba(255,255,255,.98), rgba(225,255,236,.75) 55%, rgba(190,240,210,.6))" : "radial-gradient(circle at 35% 30%, #fff, #F1F2F4)", boxShadow: "0 6px 14px rgba(0,0,0,.2), inset 0 -2px 6px rgba(0,0,0,.06)" }} />
      </div>
      <div style={{ position: "absolute", left: tg.x + tg.w / 2 - 30, top: tg.y + tg.h + 16, width: 60, textAlign: "center", fontSize: 13, fontWeight: 800, letterSpacing: "0.12em", color: on > 0.5 ? "#0B8F4A" : "#9A9DA6" }}>{on > 0.5 ? "ON" : "OFF"}</div>
      <div style={{ position: "absolute", left: tg.x, top: tg.y, transform: `scale(${press})`, transformOrigin: `${hx}px ${hy}px` }}>
        <Hand x={hx} y={hy} s={tg.h / 90} />
      </div>
    </div>
  );
}

function ListScene({ t, L }) {
  const li = L.list;
  const longest = SCRIPT.items.reduce((a, b) => (b.length > a.length ? b : a));
  const size = Math.min(li.max, fitSize(longest, li.w - 26, li.max, false));
  const step = size * li.gap;
  const top = li.center ? li.y - (step * 3) / 2 : li.y;
  let k = 0;
  ITEMS.forEach((c, i) => { if (t >= c) k = i; });
  // a bolinha desce de um item para o outro e troca de cor
  const dotY = ITEMS.reduce((y, c, i) => (i === 0 ? 0 : lerp(y, i * step, clamp(spring(t - c, { stiffness: 240, damping: 22 })))), 0);
  const fadeOut = easeInOut(prog(t, T.out, T.end));
  return (
    <div style={{ position: "absolute", left: li.x, top: top }}>
      {SCRIPT.items.map((s, i) => {
        const appear = clamp(spring(t - T.open - i * 0.06, { stiffness: 200, damping: 20 }));
        const act = clamp(spring(t - ITEMS[i], { stiffness: 260, damping: 24 })) * (i === 3 ? 1 : 1 - clamp(spring(t - ITEMS[i + 1], { stiffness: 260, damping: 24 })));
        return (
          <div key={i} style={{
            position: "absolute", left: 0, top: i * step - size / 2, whiteSpace: "nowrap", fontSize: size, fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1,
            color: act > 0.5 ? INK : FAINT, opacity: appear * (1 - fadeOut * 0.4), transform: `translate(${act * 22}px, ${(1 - appear) * 30}px) scale(${1 + act * 0.04})`, transformOrigin: "0 50%",
          }}>{s}</div>
        );
      })}
      {t >= ITEMS[0] && (
        <div style={{ position: "absolute", left: 2, top: dotY - 4, width: 9, height: 9, borderRadius: 5, background: DOTS[k], boxShadow: `0 0 10px ${DOTS[k]}`, transform: `scale(${clamp(spring(t - ITEMS[0] - 0.1, { stiffness: 300, damping: 16 }), 0, 1.3)})` }} />
      )}
    </div>
  );
}

function CardStack({ t, L }) {
  const cp = L.card;
  const cards = [];
  ITEMS.forEach((a, k) => {
    const next = ITEMS[k + 1];
    const yIn = k === 0 ? 0 : lerp(CH + 70, 0, easeInOut(prog(t, a - 0.14, a + 0.36)));
    const yOut = next == null ? 0 : lerp(0, -(CH + 70), easeInOut(prog(t, next - 0.14, next + 0.36)));
    const first = k === 0 ? clamp(spring(t - T.open, { stiffness: 170, damping: 17 }), 0, 1.15) : 1;
    if (t < (k === 0 ? T.open : a - 0.14) || (next != null && t > next + 0.36)) return;
    cards.push(
      <div key={k} style={{ position: "absolute", left: cp.x, top: cp.y, width: CW, height: CH, transform: `translateY(${yIn + yOut + (1 - Math.min(first, 1)) * 60}px) scale(${lerp(0.7, 1, first)})`, opacity: clamp(first * 1.5) }}>
        <Card k={k} t={t} a={a} />
      </div>
    );
  });
  return <>{cards}</>;
}

function Finale({ t, F }) {
  if (t < T.out + 0.2) return null;
  const p = clamp(spring(t - T.out - 0.25, { stiffness: 200, damping: 17 }));
  const q = clamp(spring(t - T.out - 0.42, { stiffness: 200, damping: 18 }));
  const vertical = F.h > F.w;
  const line = SCRIPT.end;
  const size = Math.min(vertical ? 30 : 34, fitSize(line, F.w - (vertical ? 70 : 140), vertical ? 30 : 34, false) * (vertical ? 1.6 : 1));
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, transform: `scale(${lerp(0.6, 1, p)})`, opacity: p }}>
        <div style={{ width: 54, height: 30, borderRadius: 15, background: `linear-gradient(180deg, #3BE07C, ${WA})`, position: "relative", boxShadow: `0 6px 18px ${WA}55` }}>
          <div style={{ position: "absolute", right: 3, top: 3, width: 24, height: 24, borderRadius: 12, background: "#fff" }} />
        </div>
        <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: "0.12em", color: "#0B8F4A" }}>ON</div>
      </div>
      <div style={{ maxWidth: F.w - 60, textAlign: "center", fontSize: size, fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.1, color: INK, opacity: q, transform: `translateY(${(1 - q) * 16}px)` }}>{line}</div>
      <div style={{ marginTop: 10, opacity: clamp((t - T.out - 0.55) * 4) }}>
        <Wordmark size={11} color={C.ink} />
      </div>
    </div>
  );
}

function Frame({ t, format = "16x9" }) {
  const F = FORMATS[format];
  const L = LAYOUT[format];
  // câmera: aproxima devagar durante a lista; na saída avança e desfoca, como na referência
  const drift = prog(t, T.open, T.out);
  const out = easeInOut(prog(t, T.out, T.end));
  const zoom = lerp(1, 1.045, drift) + out * 0.35;
  const dx = Math.sin(drift * Math.PI) * (format === "16x9" ? -10 : 0);
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", fontFamily: FONT, background: "#ECEDF0" }}>
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 70% 45% at 30% 110%, rgba(120,170,255,.35), transparent 70%), radial-gradient(ellipse 50% 40% at 85% 105%, ${WA}2E, transparent 70%)` }} />
      {t < T.out + 0.45 && (
        <div style={{ position: "absolute", inset: 0, transform: `translateX(${dx}px) scale(${zoom})`, transformOrigin: "60% 50%", filter: out > 0 ? `blur(${out * 14}px)` : "none", opacity: 1 - out }}>
          {t < T.open + 0.3 && <ToggleScene t={t} L={L} />}
          {t >= T.open - 0.05 && <ListScene t={t} L={L} />}
          <CardStack t={t} L={L} />
        </div>
      )}
      <Finale t={t} F={F} />
      <Grain t={t} opacity={0.035} />
    </div>
  );
}

/* =============================================================================
   Som — o áudio original do vídeo de referência, inteiro e sem efeitos por cima.
============================================================================= */
const SAMPLES = { music: MUSIC_AUTOPILOT.autoPilotRef };
function buildEvents() {
  return [{ t: 0, dur: DURATION, fn: (A, w, off = 0) => A.sample("music", w, { off, dur: DURATION - off, gain: 1, fadeIn: 0.005 }) }];
}
const EVENTS = buildEvents();
const renderWav = () => renderEventsWav(EVENTS, DURATION, { samples: SAMPLES });

// Usado pelo exportador de vídeo (scripts/export-video.cjs)
const MOTION = { Frame, duration: DURATION, formats: FORMATS, renderWav };

export default function AutoPilotAd() {
  return (
    <MotionPlayer Frame={Frame} duration={DURATION} events={EVENTS} formats={FORMATS} defaultFormat="16x9" renderWav={renderWav} samples={SAMPLES}
      fontsToLoad={[`600 16px "Open Sauce Sans"`, `700 16px "Open Sauce Sans"`]}
      scenes={[{ name: "Chave", from: 0 }, ...SCRIPT.items.map((s, i) => ({ name: s, from: ITEMS[i] })), { name: "Fim", from: T.out }]} />
  );
}
