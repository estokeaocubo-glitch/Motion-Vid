import React from "react";
import { FONT, DISPLAY_FONT, clamp, lerp, prog, spring, easeOut, easeInOut, Grain, CubeLogo, renderEventsWav, MotionPlayer } from "./motionKit";
import { MUSIC_SAAS } from "./audio/miamiSaas";
import { SFX, SFX_PEAK } from "./audio/sfx";
import { SFXV, SFXV_PEAK } from "./audio/sfxVo";

/* =============================================================================
   Estoke ao Cubo — "Em 5 segundos" (Reels 9:16, 33s)
   Formato da referência de retenção (snapinsta 1792878042172): tela de notebook filmada no
   escuro, um player com um cronômetro no topo, e um gancho de contagem que prende até o fim.
   Aqui: contagem 5→0 com o cursor parado em "Finalizar compra" → PIX aprovado → "você ficou
   5 segundos esperando a venda" → "e ainda está 00:12 AQUI" → "isso é ATENÇÃO" → "atenção VENDE"
   → "mas você... sem site / só no direct / perde a madrugada" → card laranja "AGORA você pode
   ter um site que vende 24h" (85% → 100%) → "assim como esses aqui" (Ruppel, Dizzy, Kairós) →
   "0 cansaço" → "orçamento no direct". Valores ilustrativos.
============================================================================= */
const DURATION = 33;
const FORMATS = { "9x16": { w: 450, h: 800, label: "9:16" } };
const OR = "#FF6A13";
const CREAM = "#FFF4DC";
const GLOW = (c = "rgba(255,240,210,.55)") => `0 0 14px ${c}, 0 0 34px ${c}`;
const T = { sale: 6.0, ficou: 7.4, aqui: 10.4, atencao: 13.2, vende: 15.4, mas: 17.6, agora: 21.4, pct: 23.4, esses: 26.0, zero: 28.2, fim: 30.2 };
const pop = (t, at, k = 360, d = 16) => clamp(spring(t - at, { stiffness: k, damping: d }), 0, 1.2);
const show = (t, a, b) => t >= a && t < b;

/* ---------- textos ---------- */
function Small({ t, at, children, y, color = "#fff", size = 15 }) {
  const p = pop(t, at, 420, 18);
  if (t < at) return null;
  return <div style={{ position: "absolute", left: 0, right: 0, top: y, textAlign: "center", fontFamily: DISPLAY_FONT, fontWeight: 800, fontStretch: "125%", fontSize: size, letterSpacing: "0.02em", textTransform: "uppercase", color, textShadow: GLOW(), opacity: clamp(p * 3), transform: `translateY(${(1 - Math.min(p, 1)) * 8}px)` }}>{children}</div>;
}
function Big({ t, at, children, y, color = CREAM, size = 96, glow }) {
  const p = pop(t, at, 380, 14);
  if (t < at) return null;
  return <div style={{ position: "absolute", left: 0, right: 0, top: y, textAlign: "center", fontFamily: DISPLAY_FONT, fontWeight: 800, fontStretch: "125%", fontSize: size, lineHeight: 1, letterSpacing: "-0.01em", textTransform: "uppercase", color, textShadow: GLOW(glow), transform: `scale(${lerp(1.5, 1, Math.min(p, 1))})`, opacity: clamp(p * 3) }}>{children}</div>;
}

/* ---------- conteúdo do player (área 380×280) ---------- */
function Countdown({ t }) {
  if (t >= T.ficou) return null;
  const n = Math.max(0, 5 - Math.floor(t + 0.0001));
  const frac = t - Math.floor(t);
  const beat = 1 + 0.12 * Math.exp(-frac * 7);
  const sold = t >= T.sale;
  const sp = pop(t, T.sale, 300, 13);
  const press = t >= T.sale - 0.12 && t < T.sale + 0.08;
  const shake = !sold && t > 3 ? Math.sin(t * 60) * (t - 3) * 0.6 : 0;
  return (
    <>
      {/* card do checkout */}
      <div style={{ position: "absolute", left: 95, top: 34, width: 190, padding: 12, borderRadius: 14, background: "#16161A", border: "1px solid rgba(255,255,255,.1)", transform: `translateX(${shake}px)`, opacity: sold ? 1 - clamp((t - T.sale - 0.6) * 3) : 1 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <img src="media/coverflow/ruppel.webp" alt="" style={{ width: 46, height: 46, borderRadius: 8, objectFit: "cover", objectPosition: "38% 80%" }} />
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#C9CDD6" }}>Camiseta Ruppel 240g</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>R$ 129,90</div>
          </div>
        </div>
        <div style={{ marginTop: 10, height: 34, borderRadius: 10, background: sold ? "#16A34A" : OR, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, color: "#fff", transform: `scale(${press ? 0.94 : sold ? 1 + 0.08 * Math.exp(-(t - T.sale) * 6) : 1 + 0.03 * Math.sin(t * 9)})`, boxShadow: sold ? "0 0 22px rgba(22,163,74,.6)" : `0 0 ${10 + 8 * Math.sin(t * 9)}px rgba(255,106,19,.55)` }}>
          {sold ? "✓ PIX APROVADO" : "Finalizar compra"}
        </div>
      </div>
      {/* cursor parado em cima do botão */}
      {!sold && (
        <svg width="18" height="22" viewBox="0 0 26 32" style={{ position: "absolute", left: 252 + Math.sin(t * 2) * 1.5, top: 104, transform: `scale(${press ? 0.85 : 1})`, filter: "drop-shadow(0 2px 3px rgba(0,0,0,.6))" }}>
          <path d="M2 2 L2 26 L8 20 L12 30 L17 28 L13 18 L22 18 Z" fill="#fff" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      )}
      {/* número da contagem */}
      {!sold ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 150, textAlign: "center", fontFamily: DISPLAY_FONT, fontWeight: 800, fontStretch: "125%", fontSize: 92, lineHeight: 1, color: OR, textShadow: GLOW("rgba(255,120,40,.6)"), transform: `scale(${beat})` }}>{n}</div>
      ) : (
        <>
          <div style={{ position: "absolute", left: 0, right: 0, top: 150, textAlign: "center", fontFamily: DISPLAY_FONT, fontWeight: 800, fontStretch: "125%", fontSize: 40, lineHeight: 1, color: "#4ADE80", textShadow: GLOW("rgba(74,222,128,.6)"), transform: `scale(${Math.min(sp, 1.15)})` }}>VENDEU.</div>
          {[...Array(14)].map((_, i) => {
            const a = (i / 14) * Math.PI * 2, r = 30 + (t - T.sale) * 260;
            return <div key={i} style={{ position: "absolute", left: 190 + Math.cos(a) * r, top: 170 + Math.sin(a) * r * 0.7, width: 5, height: 5, borderRadius: 3, background: i % 2 ? OR : "#4ADE80", opacity: clamp(1 - (t - T.sale) * 1.6) }} />;
          })}
          <div style={{ position: "absolute", left: 60, right: 60, top: 214, padding: "8px 10px", borderRadius: 12, background: "rgba(255,255,255,.92)", display: "flex", alignItems: "center", gap: 8, transform: `translateY(${(1 - Math.min(pop(t, T.sale + 0.15), 1)) * 30}px)`, opacity: clamp((t - T.sale - 0.15) * 5) }}>
            <div style={{ width: 24, height: 24, borderRadius: 6, background: "#32BCAD", color: "#fff", fontSize: 8, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center" }}>PIX</div>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#111" }}>Nova venda no site · R$ 129,90</div>
          </div>
        </>
      )}
      {!sold && <Small t={t} at={0.15} y={244} size={11} color="#B9B9C2">alguém vai comprar no seu site em…</Small>}
    </>
  );
}

function Mas({ t }) {
  if (!show(t, T.mas, T.agora)) return null;
  const items = [["✕", "sem site", T.mas + 0.7], ["✕", "vende só no direct", T.mas + 1.3], ["✕", "perde a venda das 3h", T.mas + 1.9]];
  return (
    <>
      <Small t={t} at={T.mas} y={56}>mas você…</Small>
      {items.map(([ic, txt, at], i) => {
        const p = pop(t, at, 420, 17);
        return t < at ? null : (
          <div key={i} style={{ position: "absolute", left: 110, top: 104 + i * 42, display: "flex", alignItems: "center", gap: 10, opacity: clamp(p * 3), transform: `translateX(${(1 - Math.min(p, 1)) * 20}px)` }}>
            <span style={{ width: 24, height: 24, borderRadius: 7, background: "rgba(255,59,48,.18)", color: "#FF5A4F", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 13 }}>{ic}</span>
            <span style={{ fontFamily: DISPLAY_FONT, fontWeight: 800, fontStretch: "125%", fontSize: 13, color: "#fff", textTransform: "uppercase", textShadow: GLOW() }}>{txt}</span>
          </div>
        );
      })}
    </>
  );
}

function Agora({ t }) {
  if (!show(t, T.agora, T.esses)) return null;
  const p = pop(t, T.agora, 260, 16);
  const pct = t < T.pct ? 0 : Math.round(lerp(85, 100, easeOut(prog(t, T.pct, T.pct + 1.2))));
  const words = [["AGORA", T.agora + 0.1, 40], ["VOCÊ PODE", T.agora + 0.6, 15], ["TER UM SITE", T.agora + 1.0, 26], ["QUE VENDE 24H", T.agora + 1.4, 26]];
  return (
    <div style={{ position: "absolute", left: 120, top: 18, width: 140, height: 244, borderRadius: 6, background: OR, boxShadow: "0 0 40px rgba(255,106,19,.45)", transform: `scaleY(${Math.min(p, 1.05)})`, transformOrigin: "50% 50%", overflow: "hidden" }}>
      {t < T.pct ? (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
          {words.map(([w, at, s]) => t >= at && <div key={w} style={{ fontFamily: DISPLAY_FONT, fontWeight: 800, fontStretch: "125%", fontSize: s * 0.62, color: "#fff", textAlign: "center", lineHeight: 1, transform: `scale(${lerp(1.4, 1, Math.min(pop(t, at, 420, 16), 1))})` }}>{w}</div>)}
        </div>
      ) : (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontFamily: DISPLAY_FONT, fontWeight: 800, fontStretch: "125%", fontSize: 40, color: "#fff", lineHeight: 1 }}>{pct}%</div>
          <div style={{ marginTop: 6, fontSize: 10, fontWeight: 800, color: "#fff", letterSpacing: ".08em" }}>{pct >= 100 ? "SITE NO AR" : "PUBLICANDO…"}</div>
          <div style={{ marginTop: 10, width: 96, height: 6, borderRadius: 3, background: "rgba(255,255,255,.3)" }}><div style={{ width: `${pct}%`, height: "100%", borderRadius: 3, background: "#fff" }} /></div>
        </div>
      )}
    </div>
  );
}

function Esses({ t }) {
  if (!show(t, T.esses, T.zero)) return null;
  const sites = ["ruppel", "dizzy-shop", "kairos"];
  return (
    <>
      <Small t={t} at={T.esses} y={40}>assim como esses aqui</Small>
      {sites.map((s, i) => {
        const at = T.esses + 0.4 + i * 0.25;
        const p = pop(t, at, 320, 15);
        return t < at ? null : (
          <img key={s} src={`media/coverflow/${s}.webp`} alt="" style={{ position: "absolute", left: 22 + i * 116, top: 92, width: 104, height: 140, objectFit: "cover", objectPosition: s === "ruppel" ? "79% 0%" : "30% 20%", borderRadius: 10, border: "2px solid rgba(255,255,255,.85)", boxShadow: "0 0 24px rgba(255,106,19,.35)", transform: `translateY(${(1 - Math.min(p, 1)) * 40}px) rotate(${(i - 1) * 4}deg) scale(${Math.min(p, 1.05)})` }} />
        );
      })}
      <Small t={t} at={T.esses + 1.3} y={250} size={11} color="#B9B9C2">feitos pela estoke ao cubo</Small>
    </>
  );
}

function Fim({ t }) {
  if (t < T.fim) return null;
  const dots = [0, 1, 2];
  const lit = Math.floor(clamp((t - T.fim - 0.3) / 0.35, 0, 3));
  return (
    <>
      <Small t={t} at={T.fim} y={58}>o próximo passo</Small>
      <div style={{ position: "absolute", left: 0, right: 0, top: 96, display: "flex", justifyContent: "center", alignItems: "center", gap: 6 }}>
        {dots.map((d) => (
          <React.Fragment key={d}>
            <span style={{ width: 16, height: 16, borderRadius: 8, background: d < lit ? OR : "rgba(255,255,255,.18)", boxShadow: d < lit ? "0 0 14px rgba(255,106,19,.7)" : "none" }} />
            {d < 2 && <span style={{ width: 28, height: 3, background: d < lit - 1 ? OR : "rgba(255,255,255,.18)" }} />}
          </React.Fragment>
        ))}
      </div>
      <Small t={t} at={T.fim + 1.2} y={130} size={11} color="#B9B9C2">seu site com a sua cara</Small>
      {t >= T.fim + 1.5 && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 168, display: "flex", justifyContent: "center" }}>
          <div style={{ padding: "11px 20px", borderRadius: 30, background: OR, color: "#fff", fontWeight: 800, fontSize: 15, boxShadow: "0 0 26px rgba(255,106,19,.6)", transform: `scale(${Math.min(pop(t, T.fim + 1.5, 300, 13), 1.1)})` }}>orçamento no direct ↗</div>
        </div>
      )}
      {t >= T.fim + 1.9 && <div style={{ position: "absolute", left: 0, right: 0, top: 226, display: "flex", justifyContent: "center", alignItems: "center", gap: 7, color: "#fff", fontWeight: 800, fontSize: 13, opacity: clamp((t - T.fim - 1.9) * 4) }}><CubeLogo size={18} />estoke ao cubo</div>}
    </>
  );
}

function PlayerContent({ t }) {
  const mm = (s) => `00:${String(Math.floor(s)).padStart(2, "0")}`;
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 8, display: "flex", justifyContent: "center", alignItems: "center", gap: 5, fontSize: 9, fontWeight: 700, color: "#D6D6DE" }}>
        <span style={{ width: 5, height: 5, borderRadius: 3, background: OR }} />{mm(t)}
      </div>
      <Countdown t={t} />
      {show(t, T.ficou, T.aqui) && (
        <>
          <Small t={t} at={T.ficou} y={52}>você ficou</Small>
          <Big t={t} at={T.ficou + 0.45} y={82}>5</Big>
          <Small t={t} at={T.ficou + 0.9} y={190}>segundos</Small>
          <Small t={t} at={T.ficou + 1.4} y={216} size={11} color={OR}>esperando a venda.</Small>
        </>
      )}
      {show(t, T.aqui, T.atencao) && (
        <>
          <Small t={t} at={T.aqui} y={70} size={12}>e ainda está</Small>
          <Big t={t} at={T.aqui + 0.3} y={98} size={48}>{mm(t)}</Big>
          <Big t={t} at={T.aqui + 1.2} y={160} size={34} color={OR} glow="rgba(255,120,40,.6)">AQUI.</Big>
          {t >= T.aqui + 1.6 && <div style={{ position: "absolute", left: 0, right: 0, top: 204 + Math.sin(t * 8) * 3, textAlign: "center", color: OR, fontSize: 20, fontWeight: 900 }}>↓</div>}
        </>
      )}
      {show(t, T.atencao, T.vende) && (
        <>
          <Small t={t} at={T.atencao} y={84} size={12}>isso é</Small>
          <Big t={t} at={T.atencao + 0.4} y={110} size={40}>ATENÇÃO.</Big>
        </>
      )}
      {show(t, T.vende, T.mas) && (
        <>
          <Small t={t} at={T.vende} y={44}>atenção</Small>
          <svg width="90" height="80" viewBox="0 0 90 80" style={{ position: "absolute", left: 145, top: 76 }}>
            {[0, 1, 2, 3].map((i) => <rect key={i} x={6 + i * 20} y={70 - (i + 1) * 15 * clamp((t - T.vende - 0.3 - i * 0.12) / 0.3)} width="12" height={(i + 1) * 15 * clamp((t - T.vende - 0.3 - i * 0.12) / 0.3)} rx="2" fill={i === 3 ? OR : "#5B5B66"} />)}
            <path d="M6 58 L30 44 L50 48 L84 10" stroke="#fff" strokeWidth="3" fill="none" strokeDasharray="120" strokeDashoffset={120 * (1 - clamp((t - T.vende - 0.6) / 0.5))} />
          </svg>
          <Big t={t} at={T.vende + 1.0} y={172} size={44} color={OR} glow="rgba(255,120,40,.6)">VENDE.</Big>
        </>
      )}
      <Mas t={t} />
      <Agora t={t} />
      <Esses t={t} />
      {show(t, T.zero, T.fim) && (
        <>
          <Big t={t} at={T.zero} y={70} size={96} color={OR} glow="rgba(255,120,40,.6)">0</Big>
          <Small t={t} at={T.zero + 0.5} y={178}>cansaço.</Small>
          <Small t={t} at={T.zero + 0.9} y={202} size={11} color="#B9B9C2">o site atende e vende sozinho</Small>
        </>
      )}
      <Fim t={t} />
    </div>
  );
}

/* ---------- a "tela do notebook" filmada ---------- */
function Frame({ t }) {
  // câmera na mão: deriva lenta + leve zoom
  const dx = Math.sin(t * 0.7) * 3 + Math.sin(t * 1.9) * 1.2, dy = Math.cos(t * 0.6) * 2.5;
  const z = 1.02 + 0.015 * Math.sin(t * 0.35);
  const capA = t < 15.5;
  const caption = capA ? <>Em 5 segundos alguém compra no seu site<br />sem você sequer cansar 😮<br /><span style={{ fontSize: 12, opacity: 0.85 }}>(feito pela Estoke ao Cubo)</span></> : <>Orçamento no direct 👇</>;
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", fontFamily: FONT, background: "#000" }}>
      <div style={{ position: "absolute", left: 20, right: 20, top: 74, textAlign: "center", color: "#fff", fontWeight: 600, fontSize: 17, lineHeight: 1.3 }}>{caption}</div>
      <div style={{ position: "absolute", left: -30, top: 210, width: 510, height: 470, transform: `translate(${dx}px, ${dy}px) scale(${z}) rotate(-0.6deg)`, filter: "blur(0.35px)" }}>
        {/* monitor: barra de menu, editor ao fundo e a janela do player */}
        <div style={{ position: "absolute", inset: 0, background: "#0B0B0E", borderRadius: 6 }} />
        <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 16, display: "flex", alignItems: "center", gap: 12, padding: "0 12px", fontSize: 8, fontWeight: 700, color: "#C8C8CF", background: "#121216" }}>
          <span>Arquivo</span><span>Editar</span><span>Visualizar</span><span>Janela</span><span>Ajuda</span><span style={{ marginLeft: "auto" }}>sex 24 out</span>
        </div>
        <div style={{ position: "absolute", right: 8, top: 26, width: 110, bottom: 50, fontFamily: "'DejaVu Sans Mono', monospace", fontSize: 6.5, lineHeight: 1.7, color: "#4E5A6E", overflow: "hidden" }}>
          {["// estoke ao cubo · loja", "const pedido = await", "  checkout.finalizar()", "if (pedido.pago) {", "  estoque.baixar(item)", "  caixa.somar(total)", "  whatsapp.avisar()", "}", "// vendendo 24h", "export default Loja"].map((l, i) => <div key={i}>{l}</div>)}
        </div>
        <div style={{ position: "absolute", left: 40, top: 30, width: 400, height: 330, borderRadius: 10, background: "#1A1A1F", boxShadow: "0 20px 50px rgba(0,0,0,.6)", border: "1px solid rgba(255,255,255,.06)" }}>
          <div style={{ height: 26, display: "flex", alignItems: "center", padding: "0 12px", fontSize: 9, fontWeight: 700, color: "#E8E8EE" }}>estoke_em_5_segundos.mp4<span style={{ marginLeft: "auto", color: "#999" }}>✕</span></div>
          <div style={{ position: "absolute", left: 10, right: 10, top: 30, bottom: 10, borderRadius: 6, background: "#050506", overflow: "hidden" }}>
            <PlayerContent t={t} />
          </div>
        </div>
        {/* dock */}
        <div style={{ position: "absolute", left: 90, right: 90, bottom: 66, height: 22, borderRadius: 8, background: "rgba(255,255,255,.08)", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
          {["#3DA5F5", "#7C5CFF", "#22C55E", "#F5B544", "#FF5A5F", "#2FD4FF", "#E5E7EB", "#FF6A13", "#A3E635", "#F472B6", "#60A5FA"].map((c) => <span key={c} style={{ width: 13, height: 13, borderRadius: 4, background: c, opacity: 0.85 }} />)}
        </div>
        {/* teclado sob a luz da tela */}
        <div style={{ position: "absolute", left: 10, right: 10, bottom: 0, height: 40, backgroundImage: "radial-gradient(rgba(255,255,255,.07) 1.5px, transparent 2px)", backgroundSize: "14px 12px", opacity: 0.8 }} />
      </div>
      {/* vinheta de filmagem */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(70% 55% at 50% 55%, transparent 55%, rgba(0,0,0,.65) 100%)" }} />
      <Grain t={t} opacity={0.08} />
    </div>
  );
}

/* =============================================================================
   Som — tique de relógio na contagem, "cha-ching" na venda (drop da "Miami" em 6s) e um
   efeito em cada palavra.
============================================================================= */
const MUSIC_OFF = 8.96 - T.sale;
const SAMPLES = { music: MUSIC_SAAS.miamiSaas, ...SFX, ...SFXV };
const PEAK = { ...SFX_PEAK, ...SFXV_PEAK };
function buildEvents() {
  const ev = [];
  const fx = (at, name, gain, opts = {}) => ev.push({ t: Math.max(0, at - (PEAK[name] || 0) / (opts.rate || 1)), fn: (A, w) => A.sample(name, w, { gain, ...opts }) });
  const at0 = (at, name, gain, opts = {}) => ev.push({ t: at, fn: (A, w) => A.sample(name, w, { gain, ...opts }) });
  ev.push({ t: 0, dur: DURATION, fn: (A, w, off = 0) => A.sample("music", w, { off: MUSIC_OFF + off, dur: DURATION - off, gain: 0.45, fadeIn: 0.2,
    env: [[0, 0.35], [T.sale - 0.05, 0.35], [T.sale, 1], [DURATION - 0.8, 1], [DURATION, 0]] }) });
  [0, 1, 2, 3, 4, 5].forEach((s) => at0(s, "tick", 0.16, { dur: 0.12 }));
  fx(T.sale - 0.05, "mouseClick", 0.2); fx(T.sale, "coinWin", 0.2); fx(T.sale + 0.15, "bell", 0.12);
  fx(T.ficou, "dryPop", 0.1); fx(T.ficou + 0.45, "zoomImpact", 0.16);
  fx(T.aqui + 0.3, "tick", 0.12); fx(T.aqui + 1.2, "hardPop", 0.14);
  fx(T.atencao + 0.4, "deepHit", 0.18);
  fx(T.vende + 0.3, "techSlide", 0.08); fx(T.vende + 1.0, "zoomImpact", 0.16);
  [0.7, 1.3, 1.9].forEach((d) => fx(T.mas + d, "glitch", 0.07));
  fx(T.agora, "windSwoosh", 0.12); fx(T.pct, "trailerRiser", 0.08); fx(T.pct + 1.2, "confirm", 0.12);
  [0.4, 0.65, 0.9].forEach((d, i) => fx(T.esses + d, "shutter", 0.08, { rate: 1 + i * 0.05 }));
  fx(T.zero, "deepHit", 0.16);
  [0.3, 0.65, 1.0].forEach((d, i) => fx(T.fim + d, "bubblePop", 0.1, { rate: 1 + i * 0.08 }));
  fx(T.fim + 1.5, "logoImpact", 0.14);
  return ev;
}
const EVENTS = buildEvents();
const renderWav = () => renderEventsWav(EVENTS, DURATION, { samples: SAMPLES });

// Usado pelo exportador de vídeo (scripts/export-video.cjs)
const MOTION = { Frame, duration: DURATION, formats: FORMATS, renderWav };

export default function CincoSegundosAd() {
  return (
    <MotionPlayer Frame={Frame} duration={DURATION} events={EVENTS} formats={FORMATS} defaultFormat="9x16" renderWav={renderWav} samples={SAMPLES}
      fontsToLoad={[`800 16px "Open Sauce Sans"`]}
      scenes={[{ name: "Contagem", from: 0 }, { name: "Venda", from: T.sale }, { name: "Atenção", from: T.ficou }, { name: "Mas você", from: T.mas }, { name: "Agora", from: T.agora }, { name: "Esses aqui", from: T.esses }, { name: "Fim", from: T.fim }]} />
  );
}
