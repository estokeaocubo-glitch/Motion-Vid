import React from "react";
import { C, FONT, clamp, lerp, prog, spring, easeOut, easeInOut, Grain, CubeLogo, SyncedVideo, renderEventsWav, MotionPlayer } from "./motionKit";
import { SITE_PRINT } from "./emojiStory/sitePrint";
import { MUSIC_AD } from "./audio/bailarAd";
import { SFX, SFX_PEAK } from "./audio/sfx";
import { SFXV, SFXV_PEAK } from "./audio/sfxVo";

/* =============================================================================
   Estoke ao Cubo — "Tem site?" (Reels 9:16, 21,5s)
   Historinha contada só com as variações 3D do Emoji Primordial (EMOJI_PRIMORDIAL/06_VARIACOES_3D):
   segunda sem venda → cliente pergunta "tem site?" → só pelo direct → visualizou e sumiu →
   concorrente vendendo → chama a Estoke ao Cubo → site no ar → Pix às 3h → nariz empinado.
   O rosto é ANIMADO (não troca de imagem): um vídeo com transparência renderizado quadro a quadro
   pela engine 3D (scripts/render-emoji-story-face.py → media/tem-site-emoji-face.webm). A
   expressão se transforma a cada compasso do "BAILAR" (drop em 2,02s, compasso de 2s), com
   piscadas, olhar vivo, aceno na batida e boca falando. Legenda palavra por palavra e um efeito
   por cena.
============================================================================= */
const DURATION = 21.5;
const BAR = (n) => 2.02 + 2 * n; // início de cada compasso depois do drop
const FORMATS = { "9x16": { w: 450, h: 800, label: "9:16" } };
const INK = "#0E1B33";
const BLUE = "#1F6BFF";

// cenas: [início, feição, legenda (linhas), cor de fundo de cima, de baixo]
const SCENES = [
  [0, "tedio", ["segunda, 9h.", "nenhuma venda."], "#E9EDF2", "#CBD3DD"],
  [BAR(0), "choque", ["o cliente:", "“vocês têm site?”"], "#FFF1E3", "#FFC9A3"],
  [BAR(1), "forcado", ["você:", "“é… só pelo direct”"], "#FFF6DA", "#F6D98B"],
  [BAR(2), "chorando", ["visualizou.", "e sumiu."], "#E6E9F2", "#AEB8CC"],
  [BAR(3), "julgando", ["e o concorrente", "vendendo pelo site."], "#EEE9F7", "#C9BCE6"],
  [BAR(4), "ideia", ["aí você chama a", "estoke ao cubo."], "#E3F1FF", "#9FCBFF"],
  [BAR(5), "confiante", ["site no ar.", "com a sua cara."], "#E5F2FF", "#7FB6FF"],
  [BAR(6), "sonolento", ["3h da manhã…"], "#1A2440", "#0B1226"],
  [BAR(6) + 1.0, "derretido", ["pix caindo", "enquanto você dorme."], "#1A2440", "#0B1226"],
  [BAR(7), "empinado", ["agora:"], "#F2F6FB", "#D5E3F5"],
];
const END = BAR(8); // card final

function sceneAt(t) {
  let i = 0;
  SCENES.forEach((s, j) => { if (t >= s[0]) i = j; });
  return i;
}

/* ---------- peças ---------- */
const FACE_VIDEO = { webm: "media/tem-site-emoji-face.webm", size: 414 };
function Face({ t, i }) {
  const [at, id] = SCENES[i];
  // a transformação da expressão está no vídeo; aqui só um leve "respiro" na troca e a flutuação
  const kick = 1 + 0.03 * Math.exp(-Math.max(0, t - at) * 7) * Math.sin(Math.max(0, t - at) * 18);
  const float = Math.sin(t * 2.2) * 3;
  const dark = id === "sonolento" || id === "derretido";
  const S = FACE_VIDEO.size;
  return (
    <>
      <div style={{ position: "absolute", left: 225 - 105, top: 640, width: 210, height: 34, borderRadius: "50%", background: dark ? "rgba(0,0,0,.45)" : "rgba(20,30,60,.18)", filter: "blur(8px)" }} />
      <div style={{ position: "absolute", left: 225 - S / 2, top: 254 + float, width: S, height: S, transform: `scale(${kick})`, transformOrigin: "50% 80%", filter: "drop-shadow(0 18px 26px rgba(10,20,50,.28))" }}>
        <SyncedVideo t={t} duration={DURATION} webm={FACE_VIDEO.webm} style={{ objectFit: "contain" }} />
      </div>
    </>
  );
}

function Caption({ t, i }) {
  const [at, , lines, top] = SCENES[i];
  const dark = top.startsWith("#1A");
  let w = 0;
  return (
    <div style={{ position: "absolute", left: 30, right: 30, top: 108, textAlign: "center" }}>
      {lines.map((line, li) => (
        <div key={li} style={{ fontSize: li === 0 ? 30 : 40, fontWeight: 800, letterSpacing: "-0.035em", lineHeight: 1.12, color: li === 0 ? (dark ? "#9FB3D9" : "#4A5B76") : dark ? "#fff" : INK }}>
          {line.split(" ").map((word, wi) => {
            const p = clamp(spring(t - at - 0.06 - (w++) * 0.07, { stiffness: 380, damping: 18 }), 0, 1.15);
            const brand = word.includes("estoke") || word.includes("cubo");
            return (
              <span key={wi} style={{ display: "inline-block", marginRight: 9, transform: `translateY(${(1 - p) * 18}px) scale(${lerp(0.6, 1, p)})`, opacity: clamp(p * 2), color: brand ? BLUE : undefined }}>{word}</span>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function Bubble({ t, at, side, children, y }) {
  if (t < at) return null;
  const p = clamp(spring(t - at, { stiffness: 340, damping: 17 }), 0, 1.15);
  const left = side === "in";
  return (
    <div style={{
      position: "absolute", top: y, [left ? "left" : "right"]: 34, maxWidth: 260, padding: "12px 16px", borderRadius: 20,
      [left ? "borderBottomLeftRadius" : "borderBottomRightRadius"]: 5,
      background: left ? "#fff" : "#D9FDD3", color: "#111B21", fontSize: 17, fontWeight: 600, lineHeight: 1.3,
      boxShadow: "0 10px 24px rgba(20,30,60,.16)", transform: `scale(${lerp(0.5, 1, p)})`, transformOrigin: left ? "0% 100%" : "100% 100%", opacity: clamp(p * 2),
    }}>{children}</div>
  );
}

function Notif({ t, at, title, sub, y = 682 }) {
  if (t < at) return null;
  const p = clamp(spring(t - at, { stiffness: 300, damping: 18 }), 0, 1.1);
  return (
    <div style={{
      position: "absolute", left: 40, right: 40, top: y, display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 18,
      background: "rgba(255,255,255,.92)", boxShadow: "0 14px 30px rgba(0,0,0,.25)", transform: `translateY(${(1 - p) * 40}px)`, opacity: clamp(p * 2),
    }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: "#32BCAD", color: "#fff", fontWeight: 900, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}>PIX</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: "#111" }}>{title}</div>
        <div style={{ fontSize: 13, color: "#555", fontWeight: 600 }}>{sub}</div>
      </div>
      <div style={{ fontSize: 12, color: "#888", fontWeight: 700 }}>agora</div>
    </div>
  );
}

function Props({ t }) {
  return (
    <>
      {/* conversa: o cliente pergunta, você responde, ele visualiza e some */}
      {t >= 1.45 && t < BAR(3) && <Bubble t={t} at={1.45} side="in" y={650}>Oi! Vocês têm site? Queria ver os produtos</Bubble>}
      {t >= BAR(1) + 0.35 && t < BAR(3) && <Bubble t={t} at={BAR(1) + 0.35} side="out" y={712}>É… só pelo direct mesmo…</Bubble>}
      {t >= BAR(2) + 0.5 && t < BAR(3) && (
        <div style={{ position: "absolute", right: 40, top: 768, fontSize: 13, fontWeight: 700, color: "#5B6577", opacity: clamp((t - BAR(2) - 0.5) * 4) }}>visualizado às 9:14 ✓✓</div>
      )}
      {/* concorrente: celular com "+1 pedido" pulando */}
      {t >= BAR(3) && t < BAR(4) && [0, 1, 2].map((k) => {
        const p = clamp(spring(t - BAR(3) - 0.35 - k * 0.32, { stiffness: 300, damping: 15 }), 0, 1.1);
        return <div key={k} style={{ position: "absolute", left: [40, 300, 170][k], top: [668, 690, 726][k], padding: "8px 14px", borderRadius: 14, background: "#16A34A", color: "#fff", fontWeight: 800, fontSize: 16, transform: `scale(${p})`, boxShadow: "0 8px 18px rgba(22,163,74,.35)" }}>+1 pedido</div>;
      })}
      {/* ideia: chip da Estoke ao Cubo */}
      {t >= BAR(4) + 0.3 && t < BAR(5) && (() => {
        const p = clamp(spring(t - BAR(4) - 0.3, { stiffness: 300, damping: 16 }), 0, 1.1);
        return <div style={{ position: "absolute", left: 225 - 110, top: 684, width: 220, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "12px 0", borderRadius: 40, background: "#fff", boxShadow: "0 12px 26px rgba(31,107,255,.3)", transform: `scale(${p})`, fontWeight: 800, fontSize: 18, color: INK }}><CubeLogo size={26} />estoke ao cubo</div>;
      })()}
      {/* site no ar: navegador com a loja */}
      {t >= BAR(5) + 0.15 && t < BAR(6) && (() => {
        const p = clamp(spring(t - BAR(5) - 0.15, { stiffness: 260, damping: 18 }), 0, 1.1);
        return (
          <div style={{ position: "absolute", left: 40, right: 40, top: 640, borderRadius: 14, overflow: "hidden", background: "#fff", boxShadow: "0 18px 40px rgba(20,40,90,.3)", transform: `translateY(${(1 - p) * 60}px) rotate(${(1 - p) * -4}deg)`, opacity: clamp(p * 2) }}>
            <div style={{ height: 22, background: "#EEF1F5", display: "flex", alignItems: "center", gap: 5, padding: "0 10px" }}>{["#FF5F57", "#FEBC2E", "#28C840"].map((c) => <i key={c} style={{ width: 8, height: 8, borderRadius: 4, background: c }} />)}<span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, color: "#6B7686" }}>sualoja.com.br</span></div>
            <img src={SITE_PRINT} alt="" style={{ display: "block", width: "100%", height: 120, objectFit: "cover", objectPosition: "top" }} />
          </div>
        );
      })()}
      {/* madrugada: lua + pix */}
      {t >= BAR(6) && t < BAR(7) && (
        <>
          <div style={{ position: "absolute", right: 46, top: 250, width: 54, height: 54, borderRadius: "50%", boxShadow: "-12px 8px 0 0 #FFE7A0", transform: "rotate(-20deg)", opacity: 0.95 }} />
          {[[60, 280, 0], [380, 330, 0.7], [90, 560, 1.3], [350, 590, 0.4]].map(([x, y, d], k) => (
            <div key={k} style={{ position: "absolute", left: x, top: y, width: 4, height: 4, borderRadius: 2, background: "#fff", opacity: 0.4 + 0.5 * Math.abs(Math.sin(t * 2 + d)) }} />
          ))}
          <Notif t={t} at={BAR(6) + 0.85} title="Pix recebido · R$ 189,90" sub="Pedido #403 pelo site" />
          <Notif t={t} at={BAR(6) + 1.35} title="Pix recebido · R$ 97,00" sub="Pedido #404 pelo site" y={604} />
        </>
      )}
    </>
  );
}

function EndCard({ t }) {
  const lt = t - BAR(7);
  if (lt < 0.7) return null;
  const p = clamp(spring(lt - 0.7, { stiffness: 240, damping: 16 }), 0, 1.1);
  const q = clamp(spring(lt - 0.95, { stiffness: 240, damping: 18 }), 0, 1.1);
  return (
    <>
      <div style={{ position: "absolute", left: 30, right: 30, top: 650, textAlign: "center", transform: `scale(${lerp(0.6, 1, p)})`, opacity: clamp(p * 2) }}>
        <div style={{ fontSize: 38, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.05, color: INK }}>site que vende <span style={{ color: BLUE }}>24h</span>.</div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 726, display: "flex", justifyContent: "center", alignItems: "center", gap: 10, opacity: clamp(q * 2), transform: `translateY(${(1 - q) * 14}px)` }}>
        <CubeLogo size={30} />
        <div style={{ fontSize: 20, fontWeight: 800, color: INK }}>estoke ao cubo</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#5B6577" }}>· orçamento no direct</div>
      </div>
    </>
  );
}

function Frame({ t }) {
  const i = sceneAt(t);
  const [, , , top, bottom] = SCENES[i];
  // fundo troca de cor junto com a cena (transição rápida de 0,2s)
  const prev = SCENES[Math.max(0, i - 1)];
  const k = easeInOut(prog(t, SCENES[i][0], SCENES[i][0] + 0.2));
  const mix = (a, b) => {
    const pa = a.match(/\w\w/g).map((h) => parseInt(h, 16)), pb = b.match(/\w\w/g).map((h) => parseInt(h, 16));
    return `rgb(${pa.map((v, j) => Math.round(lerp(v, pb[j], k))).join(",")})`;
  };
  const bgTop = mix(prev[3], top), bgBot = mix(prev[4], bottom);
  // impacto da troca: leve zoom da câmera
  const punch = 1 + 0.035 * Math.exp(-(t - SCENES[i][0]) * 9) * (t >= SCENES[i][0] ? 1 : 0);
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", fontFamily: FONT, background: `linear-gradient(180deg, ${bgTop}, ${bgBot})` }}>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${punch})` }}>
        <div style={{ position: "absolute", left: 225 - 200, top: 260, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,.55), rgba(255,255,255,0) 70%)" }} />
        <Caption t={t} i={i} />
        <Face t={t} i={i} />
        <Props t={t} />
        <EndCard t={t} />
      </div>
      <Grain t={t} opacity={0.04} />
    </div>
  );
}

/* =============================================================================
   Som — "BAILAR" com o drop no "vocês têm site?", e um efeito por cena.
============================================================================= */
const SAMPLES = { music: MUSIC_AD.bailarAd, ...SFX, ...SFXV };
const PEAK = { ...SFX_PEAK, ...SFXV_PEAK };
function buildEvents() {
  const ev = [];
  const fx = (at, name, gain, opts = {}) => ev.push({ t: Math.max(0, at - (PEAK[name] || 0) / (opts.rate || 1)), fn: (A, w) => A.sample(name, w, { gain, ...opts }) });
  ev.push({ t: 0, dur: DURATION, fn: (A, w, off = 0) => A.sample("music", w, { off, dur: DURATION - off, gain: 0.42, fadeIn: 0.2,
    env: [[0, 0.7], [1.9, 0.7], [2.02, 1], [BAR(6) - 0.1, 1], [BAR(6), 0.45], [BAR(7) - 0.1, 0.45], [BAR(7), 1], [DURATION - 0.8, 1], [DURATION, 0]] }) });
  fx(0.15, "crickets", 0.12);
  fx(1.45, "bubblePop", 0.16);
  fx(BAR(0), "zoomImpact", 0.22); fx(BAR(0), "boing", 0.12);
  fx(BAR(1), "dryPop", 0.14); fx(BAR(1) + 0.35, "bubblePop", 0.14, { rate: 1.08 });
  fx(BAR(2), "deepHit", 0.2); fx(BAR(2) + 0.5, "mouseClick", 0.1);
  fx(BAR(3), "airWhoosh", 0.12); [0, 1, 2].forEach((k) => fx(BAR(3) + 0.35 + k * 0.32, "lightPop", 0.1, { rate: 1 + k * 0.08 }));
  fx(BAR(4), "sparkleTouch", 0.14); fx(BAR(4) + 0.3, "hardPop", 0.12);
  fx(BAR(5), "sparkleSweep", 0.1); fx(BAR(5) + 0.15, "confirm", 0.1);
  fx(BAR(6) + 0.05, "snore", 0.12);
  fx(BAR(6) + 0.85, "bell", 0.14); fx(BAR(6) + 1.0, "coinWin", 0.16); fx(BAR(6) + 1.35, "coins", 0.12);
  fx(BAR(7), "windSwoosh", 0.12); fx(BAR(7) + 0.7, "logoImpact", 0.16);
  return ev;
}
const EVENTS = buildEvents();
const renderWav = () => renderEventsWav(EVENTS, DURATION, { samples: SAMPLES });

// Usado pelo exportador de vídeo (scripts/export-video.cjs)
const MOTION = { Frame, duration: DURATION, formats: FORMATS, renderWav };

export default function EmojiStoryAd() {
  return (
    <MotionPlayer Frame={Frame} duration={DURATION} events={EVENTS} formats={FORMATS} defaultFormat="9x16" renderWav={renderWav} samples={SAMPLES}
      fontsToLoad={[`800 16px "Open Sauce Sans"`]}
      scenes={SCENES.map(([at, id]) => ({ name: id, from: at }))} />
  );
}
