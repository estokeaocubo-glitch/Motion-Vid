import React from "react";
import { FONT, DISPLAY_FONT, clamp, lerp, prog, spring, easeOut, easeInOut, Grain, CubeLogo, SyncedVideo, renderEventsWav, MotionPlayer, tone, Wordmark } from "./motionKit";
import { CAPTIONS } from "./dezembro/captions";
import { VO_DEZ } from "./audio/voDez";
import { MUSIC_SAAS } from "./audio/miamiSaas";
import { SFX, SFX_PEAK } from "./audio/sfx";
import { SFXV, SFXV_PEAK } from "./audio/sfxVo";
import { SFXD, SFXD_PEAK } from "./audio/sfxDez";
import { TAPE, TAPE_PEAK } from "./audio/tape";

/* =============================================================================
   Estoke ao Cubo — "Preparar agora para vender mais" (Reels 9:16, 28,4s)
   Campanha de novembro → dezembro, sobre a narração "foco dezembro" (ElevenLabs).
   GANCHO (0–6,1s): o vídeo "gancho" recortado — a bola em brasa cai na bomboniere (1×), a tampa
   fecha (2×), os 9s parados viram 0,77s de speed ramp (12×, contador 1→30 NOV) e o vidro explode em
   câmera lenta (0,35×) exatamente no "NÃO dá conta"; congela nos cacos ("NÃO QUEBRE NO PICO").
   VIRADAS (padrões de retenção): quebra de padrão no "No pico de vendas" (corte seco + drop), loop
   aberto no "O segredo…" (cadeado abrindo), prova com sites reais, payoff "PREPARE AGORA. VENDA MAIS."
   e CTA com seta para o botão. Legendas palavra por palavra a partir da transcrição.
============================================================================= */
const DURATION = 28.4;
const FORMATS = { "9x16": { w: 450, h: 800, label: "9:16" } };
const T = { hookEnd: 6.12, segredo: 12.4, site: 17.74, prepare: 21.6, cta: 24.02, shatter: 3.42, freeze: 4.6, ramp: 2.1, rampEnd: 2.87 };
const RED = "#FF3B30", GOLD = "#FFC83D", GREEN = "#2EE6A0", BLUE = "#2F7BFF", NAVY = "#06102A";
const KEY = /dezembro|novembro|quebra|concorr|24|horas|estrutura|agora|vender|mais|site|improviso|cliente|segredo|botão/i;
const pop = (t, at, k = 380, d = 16) => clamp(spring(t - at, { stiffness: k, damping: d }), 0, 1.2);
const show = (t, a, b) => t >= a && t < b;
const D = (extra = {}) => ({ fontFamily: DISPLAY_FONT, fontWeight: 800, fontStretch: "125%", textTransform: "uppercase", lineHeight: 0.95, ...extra });

/* ---------- legendas sincronizadas (palavra por palavra) ---------- */
// a legenda some quando a tipografia grande já ocupa a tela (o segredo/agora, prepare/venda mais, CTA)
const NO_CAPTION = [[12.35, 17.7], [21.55, DURATION]];
function Captions({ t, y }) {
  if (NO_CAPTION.some(([a, b]) => t >= a && t < b)) return null;
  const c = CAPTIONS.find((ch) => t >= ch[0][0] - 0.05 && t < ch[ch.length - 1][1] + 0.12);
  if (!c) return null;
  return (
    <div style={{ position: "absolute", left: 16, right: 16, top: y, display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "6px 15px", zIndex: 60 }}>
      {c.map(([a, , w], i) => {
        const p = pop(t, a - 0.03, 520, 18);
        const on = t >= a - 0.03;
        const key = KEY.test(w);
        return (
          <span key={i} style={{ ...D({ fontSize: 29, letterSpacing: "0.005em", lineHeight: 1.05 }), color: !on ? "rgba(255,255,255,.35)" : key ? GOLD : "#fff", WebkitTextStroke: "1.2px rgba(0,0,0,.55)", textShadow: "0 3px 0 rgba(0,0,0,.55), 0 0 18px rgba(0,0,0,.35)", transform: `scale(${on ? lerp(1.12, 1, Math.min(p, 1)) : 1})`, transformOrigin: "50% 100%", display: "inline-block" }}>{w.replace(/[,.?]$/, "")}</span>
        );
      })}
    </div>
  );
}

/* ---------- 1. gancho: vídeo recortado + letreiros ---------- */
function Hook({ t, W, H }) {
  if (t >= T.hookEnd + 0.3) return null;
  const fr = clamp((t - T.freeze) / (T.hookEnd - T.freeze));
  const zoom = 1 + 0.18 * easeOut(fr) + (t >= T.shatter && t < T.shatter + 0.25 ? 0.05 * (1 - (t - T.shatter) / 0.25) : 0);
  const shake = t >= T.shatter && t < T.shatter + 0.45 ? (1 - (t - T.shatter) / 0.45) * 10 : 0;
  const flash = t >= T.shatter && t < T.shatter + 0.12 ? 1 - (t - T.shatter) / 0.12 : 0;
  const out = easeInOut(prog(t, T.hookEnd - 0.08, T.hookEnd + 0.2));
  const ramp = show(t, T.ramp - 0.05, T.rampEnd + 0.1);
  const day = Math.max(1, Math.min(30, Math.round(lerp(1, 30, prog(t, T.ramp, T.rampEnd)))));
  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - out, transform: `scale(${1 + out * 0.15})` }}>
      <div style={{ position: "absolute", inset: 0, transform: `translate(${Math.sin(t * 93) * shake}px, ${Math.cos(t * 71) * shake}px) scale(${zoom})`, transformOrigin: "50% 58%", filter: t >= T.freeze ? `saturate(${lerp(1, 0.55, fr)}) contrast(${lerp(1, 1.12, fr)})` : "none" }}>
        <SyncedVideo t={t} duration={6.9} webm="media/dezembro/hook.webm" mp4="media/dezembro/hook.mp4" style={{ objectFit: "cover" }} />
      </div>
      {/* tarja de cima (cobre a fileira de ícones do vídeo original) */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 215, background: "linear-gradient(180deg, #000 80%, rgba(0,0,0,0))" }} />
      {flash > 0 && <div style={{ position: "absolute", inset: 0, background: "#fff", opacity: flash * 0.7 }} />}
      {/* letreiro de abertura: aparece no quadro 0 */}
      {t < T.shatter && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 56, textAlign: "center" }}>
          <div style={{ ...D({ fontSize: 34, color: "#fff" }), textShadow: "0 0 20px rgba(255,120,40,.5)" }}>sua loja em</div>
          <div style={{ ...D({ fontSize: 50, color: GOLD }), textShadow: "0 0 26px rgba(255,200,60,.55)", transform: `scale(${1 + 0.05 * Math.sin(t * 6)})` }}>dezembro 👇</div>
        </div>
      )}
      {/* speed ramp: contador de novembro voando */}
      {ramp && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 300, textAlign: "center", ...D({ fontSize: 86, color: "#fff" }), textShadow: "0 0 30px rgba(0,0,0,.8)", filter: "blur(0.4px)" }}>
          {String(day).padStart(2, "0")}<span style={{ fontSize: 36, color: GOLD }}> nov</span>
        </div>
      )}
      {/* explosão */}
      {t >= T.shatter && (() => {
        const p = pop(t, T.shatter + 0.02, 420, 12);
        return (
          <div style={{ position: "absolute", left: 0, right: 0, top: 60, textAlign: "center", transform: `scale(${lerp(1.35, 1, Math.min(p, 1))}) rotate(${t < T.freeze ? Math.sin(t * 40) * 2 : -3}deg)` }}>
            <div style={{ ...D({ fontSize: 58, color: RED }), textShadow: "0 0 30px rgba(255,59,48,.6), 0 4px 0 #000" }}>quebra.</div>
          </div>
        );
      })()}
      {t >= T.freeze + 0.15 && (() => {
        const p = pop(t, T.freeze + 0.15, 380, 15);
        return (
          <div style={{ position: "absolute", left: 30, right: 30, top: 150, textAlign: "center", transform: `translateY(${(1 - Math.min(p, 1)) * 20}px)`, opacity: clamp(p * 2) }}>
            <span style={{ display: "inline-block", padding: "8px 14px", background: "#fff", color: "#000", ...D({ fontSize: 22 }) }}>não quebre no pico.</span>
          </div>
        );
      })()}
    </div>
  );
}

/* ---------- 2. "No pico de vendas…" calendário + WhatsApp lotado ---------- */
function Pico({ t }) {
  if (!show(t, T.hookEnd - 0.05, T.segredo + 0.25)) return null;
  const out = easeInOut(prog(t, T.segredo - 0.1, T.segredo + 0.2));
  const calOut = easeInOut(prog(t, 7.95, 8.3));
  const days = [...Array(31)].map((_, i) => i + 1);
  const peaks = { 20: 0.55, 21: 0.6, 22: 0.75, 23: 0.95, 24: 1, 26: 0.5, 28: 0.55, 30: 0.8, 31: 0.7 };
  const chatIn = pop(t, 8.06, 260, 18);
  const unread = Math.round(lerp(3, 47, easeOut(prog(t, 8.2, 10.3))));
  const msgs = [["tem tamanho M?", 8.25], ["qual o valor do frete?", 8.6], ["aceita pix??", 8.95], ["oii, alguém aí?", 9.3], ["vocês entregam dia 23?", 9.65], ["???", 10.0]];
  const lost = t >= 10.58;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - out, transform: `translateX(${-out * 120}px)` }}>
      {/* calendário de dezembro com o pico */}
      <div style={{ position: "absolute", left: 30, right: 30, top: 150, opacity: 1 - calOut, transform: `scale(${1 - calOut * 0.2})` }}>
        <div style={{ ...D({ fontSize: 40, color: "#fff" }) }}>dezembro</div><div style={{ ...D({ fontSize: 18, color: GOLD }), margin: "6px 0 12px" }}>o pico de vendas do ano</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
          {days.map((d, i) => {
            const at = 6.3 + i * 0.03;
            const pk = peaks[d] || 0.12;
            const h = 46 * pk * clamp((t - at - 0.2) / 0.4);
            const hot = pk > 0.5;
            return (
              <div key={d} style={{ position: "relative", height: 50, borderRadius: 8, background: d === 25 ? "rgba(255,59,48,.25)" : "rgba(255,255,255,.06)", border: `1px solid ${d === 25 ? RED : "rgba(255,255,255,.1)"}`, overflow: "hidden", opacity: clamp((t - at) * 6) }}>
                <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: h, background: hot ? `linear-gradient(180deg, ${GOLD}, #FF7A1A)` : "rgba(255,255,255,.18)" }} />
                <div style={{ position: "absolute", left: 6, top: 4, fontSize: 11, fontWeight: 800, color: "#fff" }}>{d}</div>
                {d === 25 && <div style={{ position: "absolute", right: 4, top: 3, fontSize: 11 }}>🎄</div>}
              </div>
            );
          })}
        </div>
      </div>
      {/* WhatsApp lotado */}
      {t >= 8.06 && (
        <div style={{ position: "absolute", left: 50, right: 50, top: 120, height: 400, borderRadius: 30, background: "#0B141A", border: "6px solid #1C1C22", overflow: "hidden", transform: `translateY(${(1 - Math.min(chatIn, 1)) * 300}px) rotate(${lost ? -2 : 0}deg)` }}>
          <div style={{ height: 52, background: "#1F2C33", display: "flex", alignItems: "center", gap: 10, padding: "0 14px" }}>
            <div style={{ width: 30, height: 30, borderRadius: 15, background: "#2A3942" }} />
            <div style={{ color: "#E9EDEF", fontWeight: 700, fontSize: 14 }}>Sua loja</div>
            <div style={{ marginLeft: "auto", minWidth: 30, height: 24, borderRadius: 12, background: "#25D366", color: "#062", fontWeight: 900, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 7px", transform: `scale(${1 + 0.15 * Math.abs(Math.sin(t * 9))})` }}>{unread}</div>
          </div>
          <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 7 }}>
            {msgs.map(([m, at], i) => t >= at && (
              <div key={i} style={{ alignSelf: "flex-start", maxWidth: "80%", background: "#202C33", color: "#E9EDEF", fontSize: 13, padding: "7px 10px", borderRadius: 10, borderTopLeftRadius: 2, transform: `scale(${Math.min(pop(t, at, 480, 16), 1)})`, transformOrigin: "0 0" }}>{m}</div>
            ))}
            {lost && (
              <div style={{ alignSelf: "flex-start", background: "#3A1414", border: `1px solid ${RED}`, color: "#FFD7D4", fontSize: 13, fontWeight: 700, padding: "7px 10px", borderRadius: 10, transform: `scale(${Math.min(pop(t, 10.58, 460, 13), 1.05)})`, transformOrigin: "0 0" }}>deixa, comprei na concorrência 👋</div>
            )}
          </div>
          <div style={{ position: "absolute", left: 12, bottom: 12, color: "#8696A0", fontSize: 12, fontWeight: 600 }}>{t < 10.58 ? "digitando… (no manual)" : "visto por último ontem"}</div>
        </div>
      )}
      {t >= 10.6 && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 462, textAlign: "center", zIndex: 5, transform: `scale(${Math.min(pop(t, 10.6, 420, 13), 1.1)}) rotate(-4deg)` }}>
          <span style={{ display: "inline-block", padding: "8px 14px", background: RED, color: "#fff", ...D({ fontSize: 26 }) }}>− 1 cliente</span>
        </div>
      )}
    </div>
  );
}

/* ---------- 3. "O segredo…" loop aberto + novembro → dezembro ---------- */
function Segredo({ t }) {
  if (!show(t, T.segredo - 0.05, T.site + 0.25)) return null;
  const out = easeInOut(prog(t, T.site - 0.1, T.site + 0.2));
  const lockOpen = t >= 12.9;
  const reveal = easeInOut(prog(t, 13.6, 14.0));
  const blocks = [["site no ar", 14.1], ["catálogo", 14.45], ["pix e cartão", 14.8], ["whatsapp no automático", 15.15]];
  const agora = t >= 15.86, nov = t >= 16.78;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - out, transform: `translateX(${-out * 120}px)` }}>
      {/* o segredo (cadeado) */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 200, textAlign: "center", opacity: 1 - reveal, transform: `scale(${1 - reveal * 0.3})` }}>
        <svg width="80" height="96" viewBox="0 0 40 48" style={{ transform: `scale(${Math.min(pop(t, T.segredo, 380, 13), 1.1)})` }}>
          <path d={lockOpen ? "M12 22 V14 a8 8 0 0 1 16 0" : "M12 22 V14 a8 8 0 0 1 16 0 V22"} fill="none" stroke={GOLD} strokeWidth="4.5" strokeLinecap="round" style={{ transform: lockOpen ? "translate(9px,-5px) rotate(18deg)" : "none", transformOrigin: "28px 22px" }} />
          <rect x="6" y="22" width="28" height="22" rx="5" fill={GOLD} />
          <circle cx="20" cy="33" r="3.5" fill={NAVY} />
        </svg>
        <div style={{ ...D({ fontSize: 56, color: "#fff" }), marginTop: 10 }}>o segredo</div>
        <div style={{ ...D({ fontSize: 22, color: GOLD }), marginTop: 6 }}>pra faturar alto em dezembro</div>
      </div>
      {/* novembro (estruturar) → dezembro (lucrar) */}
      {t >= 13.6 && (
        <div style={{ position: "absolute", left: 18, right: 18, top: 130, opacity: reveal, display: "flex", gap: 8, alignItems: "stretch" }}>
          <div style={{ flex: 1.15, minWidth: 0, borderRadius: 18, padding: 12, background: nov ? "rgba(47,123,255,.22)" : "rgba(255,255,255,.06)", border: `2px solid ${nov ? BLUE : "rgba(255,255,255,.12)"}`, boxShadow: nov ? "0 0 30px rgba(47,123,255,.45)" : "none" }}>
            <div style={{ ...D({ fontSize: 17, color: "#fff" }) }}>novembro</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#9FB3D9", marginBottom: 10 }}>estruturar</div>
            {blocks.map(([b, at]) => t >= at && (
              <div key={b} style={{ marginTop: 8, padding: "9px 10px", borderRadius: 10, background: "#fff", color: NAVY, fontSize: 13, fontWeight: 800, display: "flex", alignItems: "center", gap: 7, transform: `translateY(${(1 - Math.min(pop(t, at, 420, 14), 1)) * -40}px)` }}>
                <span style={{ width: 18, height: 18, borderRadius: 9, background: GREEN, color: "#04251a", fontSize: 11, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>✓</span>{b}
              </div>
            ))}
          </div>
          <div style={{ alignSelf: "center", ...D({ fontSize: 28, color: GOLD }) }}>→</div>
          <div style={{ flex: 0.85, minWidth: 0, borderRadius: 18, padding: 12, background: "rgba(46,230,160,.12)", border: `2px solid rgba(46,230,160,.35)` }}>
            <div style={{ ...D({ fontSize: 17, color: "#fff" }) }}>dezembro</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#9FE8CB", marginBottom: 10 }}>lucrar</div>
            <svg width="100%" height="180" viewBox="0 0 120 180">
              {[0, 1, 2, 3, 4].map((i) => {
                const h = (30 + i * 30) * clamp((t - 14.4 - i * 0.18) / 0.4);
                return <rect key={i} x={6 + i * 23} y={170 - h} width="16" height={h} rx="3" fill={i === 4 ? GREEN : "rgba(46,230,160,.45)"} />;
              })}
            </svg>
          </div>
        </div>
      )}
      {agora && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 520, textAlign: "center", transform: `scale(${lerp(2.2, 1, Math.min(pop(t, 15.86, 420, 12), 1))}) rotate(-6deg)` }}>
          <span style={{ display: "inline-block", padding: "6px 16px", border: `4px solid ${GOLD}`, color: GOLD, ...D({ fontSize: 40 }) }}>agora.</span>
        </div>
      )}
    </div>
  );
}

/* ---------- 4. site trabalhando 24h (prova com sites reais) ---------- */
// dois projetos de identidade forte, ~1,7s cada, com um pan lento (o "scroll" na tela do celular)
const SITES = [["ruppel", [62, 96], 0], ["arteiro", [0, 30], 40]];
const SWAP = 19.75;
function Site({ t }) {
  if (!show(t, T.site - 0.05, T.prepare + 0.25)) return null;
  const out = easeInOut(prog(t, T.prepare - 0.1, T.prepare + 0.2));
  const inP = pop(t, T.site, 260, 17);
  const pos = easeInOut(clamp((t - SWAP) / 0.3));
  const hours = Math.round(lerp(0, 24, easeOut(prog(t, 18.3, 20.9))));
  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - out, transform: `scale(${1 + out * 0.2})` }}>
      <div style={{ position: "absolute", left: 225 - 115, top: 120, width: 230, height: 420, borderRadius: 34, background: "#111", border: "7px solid #1E1E24", overflow: "hidden", boxShadow: "0 30px 60px rgba(0,0,0,.5), 0 0 60px rgba(47,123,255,.25)", transform: `translateY(${(1 - Math.min(inP, 1)) * 200}px) rotate(${(1 - Math.min(inP, 1)) * 8}deg)` }}>
        {SITES.map(([s, [x0, x1], y], i) => {
          const a = i === 0 ? T.site : SWAP, b = i === 0 ? SWAP + 0.3 : T.prepare;
          const x = lerp(x0, x1, easeInOut(prog(t, a, b)));
          return <img key={s} src={`media/coverflow/${s}.webp`} alt="" decoding="sync" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: `${x}% ${y}%`, transform: `translateX(${(i - pos) * 100}%)` }} />;
        })}
      </div>
      {/* relógio 24h */}
      <div style={{ position: "absolute", right: 34, top: 110, width: 96, height: 96, borderRadius: 48, background: NAVY, border: `3px solid ${GOLD}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", transform: `scale(${Math.min(pop(t, 18.2, 380, 14), 1.1)})`, boxShadow: "0 0 24px rgba(255,200,60,.4)" }}>
        <div style={{ ...D({ fontSize: 30, color: GOLD }) }}>{hours}h</div>
        <div style={{ fontSize: 9, fontWeight: 800, color: "#fff" }}>vendendo</div>
      </div>
      {[["Pix recebido · R$ 189,90", 19.2, 440], ["Novo pedido · 03:12", 20.4, 486]].map(([m, at, y]) => t >= at && (
        <div key={m} style={{ position: "absolute", left: 70, right: 70, top: y, padding: "9px 12px", borderRadius: 14, background: "rgba(255,255,255,.97)", boxShadow: "0 10px 26px rgba(0,0,0,.4), 0 0 0 2px rgba(50,188,173,.6)", display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 800, color: "#111", transform: `translateY(${(1 - Math.min(pop(t, at, 380, 16), 1)) * 30}px)`, opacity: clamp((t - at) * 6) }}>
          <span style={{ width: 22, height: 22, borderRadius: 6, background: "#32BCAD", color: "#fff", fontSize: 8, fontWeight: 900, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>PIX</span>{m}
        </div>
      ))}
      <div style={{ position: "absolute", left: 0, right: 0, top: 70, textAlign: "center", ...D({ fontSize: 20, color: "#fff" }), opacity: clamp((t - 17.9) * 4) }}>sites que a gente já entregou</div>
    </div>
  );
}

/* ---------- 5. payoff ---------- */
function Prepare({ t }) {
  if (!show(t, T.prepare - 0.05, T.cta + 0.2)) return null;
  const out = easeInOut(prog(t, T.cta - 0.1, T.cta + 0.15));
  const a = pop(t, T.prepare, 420, 13), b = pop(t, 22.92, 420, 12);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - out }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 210, textAlign: "center", ...D({ fontSize: 66, color: "#fff" }), transform: `scale(${lerp(1.7, 1, Math.min(a, 1))})` }}>prepare<br />agora.</div>
      {t >= 22.92 && <div style={{ position: "absolute", left: 0, right: 0, top: 360, textAlign: "center", ...D({ fontSize: 74, color: GREEN }), textShadow: "0 0 30px rgba(46,230,160,.5)", transform: `scale(${lerp(1.8, 1, Math.min(b, 1))})` }}>venda<br />mais.</div>}
    </div>
  );
}

/* ---------- 6. CTA: botão pulsa, leva o clique em 25s e as setas descem até o botão do anúncio ---------- */
const CLICK = 25.0;
function Cta({ t }) {
  if (t < T.cta - 0.05) return null;
  const p = pop(t, T.cta, 300, 14), q = pop(t, 24.3, 420, 12), r = pop(t, 26.2, 260, 15);
  const press = t >= CLICK - 0.06 && t < CLICK + 0.12;
  const pulse = t >= CLICK + 0.12 ? 1 + 0.05 * Math.abs(Math.sin((t - CLICK) * 5)) : 1;
  const ring = clamp((t - CLICK) / 0.6);
  return (
    <>
      {t >= 26.2 && <div style={{ position: "absolute", left: 0, right: 0, top: 62, display: "flex", justifyContent: "center", transform: `scale(${Math.min(r, 1.1)})` }}><Wordmark size={13} color="#FFFFFF" glow={1} /></div>}
      <div style={{ position: "absolute", left: 0, right: 0, top: 150, textAlign: "center", ...D({ fontSize: 30, color: "#fff" }), opacity: clamp(p * 2) }}>seu site pronto<br /><span style={{ color: GOLD }}>ainda em novembro</span></div>
      {t >= 24.3 && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 270, display: "flex", justifyContent: "center" }}>
          {ring > 0 && ring < 1 && <div style={{ position: "absolute", top: -6, width: 260, height: 74, borderRadius: 40, border: `3px solid ${GREEN}`, transform: `scale(${1 + ring * 0.35})`, opacity: 1 - ring }} />}
          <div style={{ padding: "18px 30px", borderRadius: 40, background: `linear-gradient(90deg, ${GREEN}, #19C2FF)`, color: NAVY, ...D({ fontSize: 24 }), boxShadow: `0 0 ${40 + 30 * (pulse - 1) * 20}px rgba(46,230,160,.55)`, transform: `scale(${Math.min(q, 1.1) * (press ? 0.88 : pulse)})` }}>criar meu site</div>
        </div>
      )}
      {/* setas em cascata descendo até o botão nativo do anúncio / link */}
      {t >= CLICK + 0.15 && [0, 1, 2].map((i) => {
        const ph = ((t - CLICK - 0.15) * 1.6 - i * 0.22) % 1;
        const vis = ph < 0 ? 0 : Math.sin(Math.max(0, ph) * Math.PI);
        return <div key={i} style={{ position: "absolute", left: 0, right: 0, top: 380 + i * 52 + ph * 16, textAlign: "center", fontSize: 46, lineHeight: 1, color: GOLD, fontWeight: 900, textShadow: "0 0 20px rgba(255,200,60,.6)", opacity: vis }}>⌄</div>;
      })}
      {t >= CLICK + 0.3 && <div style={{ position: "absolute", left: 0, right: 0, top: 548, textAlign: "center", ...D({ fontSize: 18, color: "#fff" }), opacity: clamp((t - CLICK - 0.3) * 4) }}>toque no botão aqui embaixo</div>}
    </>
  );
}

function Frame({ t }) {
  const W = 450, H = 800;
  const dark = t >= T.hookEnd;
  const capY = 548; // acima da zona da interface do Reels/TikTok (nome do perfil e descrição)
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", fontFamily: FONT, background: dark ? `radial-gradient(70% 50% at 50% 35%, #12245A, ${NAVY} 70%)` : "#000" }}>
      {dark && <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(255,255,255,.08) 1px, transparent 1.5px)", backgroundSize: "22px 22px", opacity: 0.6 }} />}
      <Hook t={t} W={W} H={H} />
      <Pico t={t} />
      <Segredo t={t} />
      <Site t={t} />
      <Prepare t={t} />
      <Cta t={t} />
      <Captions t={t} y={capY} />
      <Grain t={t} opacity={0.05} />
    </div>
  );
}

/* =============================================================================
   Som — narração por cima; "Miami" baixa com o drop na quebra de padrão (6,12s), silêncio de
   0,2s antes da explosão; SFX em cada ação (ver tabela no README).
============================================================================= */
const MUSIC_OFF = 8.96 - T.hookEnd;
const SAMPLES = { vo: VO_DEZ.voDez, music: MUSIC_SAAS.miamiSaas, ...SFX, ...SFXV, ...SFXD, ...TAPE };
const PEAK = { ...SFX_PEAK, ...SFXV_PEAK, ...SFXD_PEAK, ...TAPE_PEAK };
const SFX_PLAN = [
  // [tempo, efeito, ganho, opções] — o tempo é o do GOLPE (o pico do som cai exatamente aqui)
  [0.05, "fireWhoosh", 0.22, {}],            // brasa caindo no vidro
  [0.1, "dryPop", 0.12, {}],                 // letreiro "sua loja em dezembro"
  [1.98, "glassImpact", 0.16, {}],           // tampa fecha
  [2.1, "tick", 0.1, { dur: 0.75, rate: 1.6 }], // relógio disparando no speed ramp
  [3.42, "glassBreak", 0.85, { dur: 0.78, fadeOut: 0.16 }], // EXPLOSÃO: só o ataque do vidro (0,46s depois do golpe); a cauda "líquida" é cortada antes dos 4s
  [3.42, "glassImpact", 0.6, {}],            // estalo do primeiro quadro
  [3.42, "deepHit", 0.5, {}],
  [3.44, "zoomImpact", 0.3, {}],
  [4.6, "fwdDown", 0.12, {}],                // fita desacelerando no congelamento
  [4.78, "hardPop", 0.12, {}],               // "não quebre no pico."
  [6.12, "windSwoosh", 0.16, {}],            // quebra de padrão → calendário (drop)
  [8.06, "airSweep", 0.12, {}],              // celular sobe
  [8.25, "bubblePop", 0.08, { rate: 1.0 }], [8.6, "bubblePop", 0.08, { rate: 1.06 }], [8.95, "bubblePop", 0.08, { rate: 1.12 }],
  [9.3, "bubblePop", 0.08, { rate: 1.18 }], [9.65, "bubblePop", 0.08, { rate: 1.24 }], [10.0, "alertBeep", 0.08, {}],
  [10.58, "glitch", 0.12, {}],               // "perde cliente"
  [10.6, "hardPop", 0.14, {}],
  [12.4, "tunnelWhoosh", 0.12, {}],          // virada: "O segredo…"
  [12.9, "lockShut", 0.14, {}],              // cadeado abrindo
  [13.6, "sparkleSweep", 0.1, {}],
  [14.1, "lightPop", 0.1, { rate: 1.0 }], [14.45, "lightPop", 0.1, { rate: 1.08 }], [14.8, "lightPop", 0.1, { rate: 1.16 }], [15.15, "lightPop", 0.1, { rate: 1.24 }],
  [15.86, "zoomImpact", 0.2, {}],            // carimbo "AGORA."
  [16.84, "confirm", 0.1, {}],               // novembro acende
  [17.74, "airWhoosh", 0.14, {}],            // celular com os sites
  [SWAP, "smallSweep", 0.12, {}],            // Ruppel → Arteiro
  [19.2, "coinWin", 0.4, {}], [19.2, "bell", 0.22, {}],   // Pix recebido: cha-ching cristalino
  [20.4, "coins", 0.32, {}], [20.4, "bell", 0.2, { rate: 1.12 }], // novo pedido
  [21.6, "deepHit", 0.2, {}], [21.6, "windSwoosh", 0.1, {}], // "PREPARE AGORA."
  [22.92, "zoomImpact", 0.18, {}],           // "VENDA MAIS."
  [24.02, "lightPop", 0.12, {}],             // seta
  [24.3, "lightPop", 0.12, {}],              // botão entra
  [CLICK, "mouseClick", 0.42, {}],          // clique no botão
  [CLICK + 0.15, "airSweep", 0.08, {}],     // setas descendo
  [26.2, "logoImpact", 0.16, {}],
  [27.1, "sparkleTouch", 0.08, {}],
];
function buildEvents() {
  const ev = [];
  const fx = (at, name, gain, opts = {}) => ev.push({ t: Math.max(0, at - (PEAK[name] || 0) / (opts.rate || 1)), fn: (A, w) => A.sample(name, w, { gain, ...opts }) });
  // a voz abre espaço para o vidro e para o "cha-ching" das vendas
  ev.push({ t: 0, dur: 27.64, fn: (A, w, off = 0) => A.sample("vo", w, { off, dur: 27.64 - off, gain: 1.15,
    env: [[0, 1], [3.38, 1], [3.42, 0.55], [3.85, 0.55], [4.1, 1], [19.15, 1], [19.2, 0.75], [19.6, 1], [20.35, 1], [20.4, 0.75], [20.8, 1], [27.64, 1]] }) });
  // sub-drop: senoide de 95 → 32 Hz cravada no quadro da quebra
  ev.push({ t: 3.42, fn: (A, w) => tone(A, w, { type: "sine", f: 95, f2: 32, glide: 0.7, dur: 0.9, v: 0.55, a: 0.005 }) });
  ev.push({ t: 0, dur: DURATION, fn: (A, w, off = 0) => A.sample("music", w, { off: MUSIC_OFF + off, dur: DURATION - off, gain: 0.16, fadeIn: 0.1,
    env: [[0, 0.7], [3.15, 0.9], [3.2, 0.0], [3.6, 0.0], [3.9, 0.9], [6.05, 0.6], [6.12, 1.2], [19.1, 1.2], [19.2, 0.7], [20.8, 1.2], [21.55, 1.0], [21.6, 1.35], [24.0, 1.0], [DURATION - 0.6, 1.0], [DURATION, 0]] }) });
  SFX_PLAN.forEach(([at, n, g, o]) => fx(at, n, g, o));
  return ev;
}
const EVENTS = buildEvents();
const renderWav = () => renderEventsWav(EVENTS, DURATION, { samples: SAMPLES });

// Usado pelo exportador de vídeo (scripts/export-video.cjs)
const MOTION = { Frame, duration: DURATION, formats: FORMATS, renderWav };

export default function DezembroAd() {
  return (
    <MotionPlayer Frame={Frame} duration={DURATION} events={EVENTS} formats={FORMATS} defaultFormat="9x16" renderWav={renderWav} samples={SAMPLES}
      fontsToLoad={[`800 16px "Open Sauce Sans"`]}
      scenes={[{ name: "Gancho", from: 0 }, { name: "Pico de dezembro", from: T.hookEnd }, { name: "O segredo", from: T.segredo }, { name: "Site 24h", from: T.site }, { name: "Prepare agora", from: T.prepare }, { name: "CTA", from: T.cta }]} />
  );
}
