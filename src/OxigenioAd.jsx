import React from "react";
import {
  C, FONT, DISP, clamp, lerp, prog, easeOut, easeIn, easeInOut, spring, hexA, rnd, gradText, gradLight, GRAD,
  Grain, CubeLogo, SyncedVideo, renderEventsWav, MotionPlayer, fitSize,
} from "./motionKit";
import { EMO, EMO_ANIM, ICON3D } from "./oxi/assets3d";
import { PHRASES } from "./oxi/captions";
import { VO_SITE } from "./audio/voSite";
import { MUSIC_OXI } from "./audio/oxiMusic";
import { SFX, SFX_PEAK } from "./audio/sfx";
import { SFXV, SFXV_PEAK } from "./audio/sfxVo";

/* =============================================================================
   Estoke ao Cubo — "Site é oxigênio" (Reels 9:16, 55s, narração ElevenLabs)
   Tudo sincronizado com a narração (tempos por palavra em ./oxi/captions.js):
     0–10,7s   O gancho: celular com Reels gravando (horas no cronômetro), fotos subindo,
               story com filtro de cachorrinho e a busca "minha loja petrópolis" → "Nada." (grilos)
     10,7–22,9 A ironia: direct com "Qual o valor?" / "Mandei no direct", "EM PLENO 2026" com
               impacto, cliente esperando, "visto há 3 h" e "comprei em outra loja"
     23–41,4   A solução (visual claro): site surgindo, bolhas de O₂, robô vendedor carimbando
               pedidos, relógio 24H, "sem CLT / folga / vácuo", fluxo entra → catálogo → dúvida →
               cartão → compra (confete + cha-ching), metade site vendendo / metade dormindo
     41,4–55,2 CTA: sua loja amadora com teia × concorrente bonito, a virada "profissionalizar",
               "Link na bio", mãozinha no comentário com "EU QUERO", logo e "SAI DO AMADORISMO."
   Legendas cinéticas: cada palavra entra na hora em que é falada (destaques em ciano/azul).
   Protagonista: o Emoji Primordial (EMOJI_PRIMORDIAL/), recortado do fundo de estúdio, reagindo à
   narração com as feições e animações 3D da biblioteca; objetos 3D do Fluent Emoji (Microsoft, MIT);
   celulares, navegador e maquininha com inclinação 3D, espessura e reflexo.
============================================================================= */
const DURATION = 55.2;
const FORMATS = { "9x16": { w: 450, h: 800, label: "9:16" } };
const T = {
  feed: 2.2, story: 4.2, search: 6.6, go: 8.55, nada: 9.74, dm: 10.7, pleno: 15.9, ano: 16.48, back: 17.95,
  site: 23.0, oxi: 25.56, robo: 26.3, h24: 28.3, sem: 30.26, flow: 34.84, sleep: 39.44, compare: 41.44, prof: 45.84,
  bio: 48.38, quero: 49.48, monto: 51.0, sai: 53.84,
};
const LIGHT = [22.95, T.compare];
const isLight = (t) => t >= LIGHT[0] && t < LIGHT[1];
const ent = (t, a, d = 0.35) => easeOut(prog(t, a, a + d));
const pop = (t, a, o = { stiffness: 260, damping: 16 }) => spring(t - a, o);
const inWin = (t, a, b) => t >= a && t < b;
const MINT = "#2EC4A0";
const RED = "#E05A47";
const abs = (x, y, w, h, extra) => ({ position: "absolute", left: x, top: y, width: w, height: h, ...extra });
// tremor de câmera que morre em `dur` segundos
const shakeAt = (t, at, amp, dur = 0.35) => {
  if (t < at || t > at + dur) return [0, 0];
  const k = 1 - (t - at) / dur;
  return [Math.sin((t - at) * 90) * amp * k, Math.cos((t - at) * 70) * amp * 0.7 * k];
};

/* ---------------- legendas cinéticas ---------------- */
const GIANT = [5, 8, 28]; // "Nada.", "Em pleno 2026,", "Sai do amadorismo." viram tipografia gigante
function Captions({ t }) {
  let k = -1;
  PHRASES.forEach((ws, i) => { if (t >= ws[0][1] - 0.06) k = i; });
  if (k < 0 || GIANT.includes(k)) return null;
  const ws = PHRASES[k];
  const light = isLight(t);
  const nWords = ws.length;
  const size = nWords > 8 ? 27 : nWords > 5 ? 30 : 34;
  return (
    <div style={{ position: "absolute", left: 24, top: 66, width: 402, height: 150, display: "flex", flexWrap: "wrap", justifyContent: "center", alignContent: "center", columnGap: size * 0.28, rowGap: 2, zIndex: 50 }}>
      {ws.map(([w, at, acc], i) => {
        const s = pop(t, at - 0.03, { stiffness: 380, damping: 18 });
        if (s <= 0) return null;
        return (
          <span key={i} style={{
            ...DISP, fontSize: size, lineHeight: 1.08, display: "inline-block",
            color: acc ? (light ? C.blue : C.cyan) : light ? C.ink : "#FFFFFF",
            textShadow: light ? "none" : "0 2px 14px rgba(0,0,0,.45)",
            transform: `translateY(${(1 - clamp(s)) * 14}px) scale(${lerp(0.7, 1, Math.min(s, 1.08))})`, opacity: clamp(s * 2.5),
          }}>{w}</span>
        );
      })}
    </div>
  );
}

/* ---------------- peças ---------------- */
// espessura 3D: camadas deslocadas para o lado que a inclinação revela
const depth = (tilt, n = 9, col = "#2A3654") => Array.from({ length: n }, (_, i) => `${-Math.sign(tilt || 1) * (i + 1) * 0.9}px ${(i + 1) * 0.55}px 0 ${i === n - 1 ? "#0B1020" : col}`).join(", ");
function Phone({ x, y, w, h, light = false, tilt = -12, children, style }) {
  return (
    <div style={{ ...abs(x, y, w, h), perspective: 1100, ...style }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: w * 0.16, background: "linear-gradient(145deg,#2B3550,#0A0F1C 45%)", padding: 7, transform: `rotateY(${tilt}deg) rotateX(5deg)`, boxShadow: `${depth(tilt)}, 0 40px 70px rgba(0,0,0,.45)` }}>
        <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: w * 0.13, overflow: "hidden", background: light ? "#FFFFFF" : "#000" }}>
          {children}
          <div style={{ ...abs(w / 2 - 7 - w * 0.16, 7, w * 0.32, 15), borderRadius: 10, background: "#05080F", zIndex: 30 }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(115deg, rgba(255,255,255,.16) 0%, rgba(255,255,255,0) 32%)", zIndex: 31, pointerEvents: "none" }} />
        </div>
      </div>
    </div>
  );
}
// entra deslizando da direita quando a tela do celular troca
const slideIn = (t, at) => `translateX(${(1 - easeOut(prog(t, at, at + 0.22))) * 100}%)`;
// mãozinha 3D apontando (Fluent): a ponta do dedo fica no canto superior esquerdo da caixa
function Point({ x, y, press = 0, size = 92 }) {
  return <img src={ICON3D.point} alt="" draggable={false} style={{ ...abs(x - size * 0.42, y - size * 0.06, size, size), maxWidth: "none", zIndex: 40, transform: `rotate(-14deg) scale(${1 - press * 0.12})`, transformOrigin: "45% 5%", filter: "drop-shadow(0 10px 14px rgba(0,0,0,.35))" }} />;
}
function Ripple({ x, y, t, at, color = "#FFFFFF" }) {
  if (t < at || t > at + 0.5) return null;
  const p = prog(t, at, at + 0.5);
  return <div style={{ ...abs(x - 30, y - 30, 60, 60), borderRadius: "50%", border: `3px solid ${color}`, transform: `scale(${lerp(0.2, 1.4, easeOut(p))})`, opacity: 1 - p, zIndex: 41 }} />;
}
function Confetti({ x, y, t, at, n = 40 }) {
  if (t < at || t > at + 1.6) return null;
  const s = t - at;
  const cols = [C.cyan, C.blue, MINT, "#FFD25A", "#FF7A9C", "#FFFFFF"];
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const ang = -Math.PI / 2 + (rnd(i, 1) - 0.5) * 2.4;
        const sp = 260 + rnd(i, 2) * 260;
        const px = x + Math.cos(ang) * sp * s;
        const py = y + Math.sin(ang) * sp * s + 480 * s * s;
        return <div key={i} style={{ ...abs(px, py, 6 + rnd(i, 3) * 5, 10 + rnd(i, 4) * 6), background: cols[i % cols.length], borderRadius: 2, transform: `rotate(${(rnd(i, 5) - 0.5) * 1400 * s}deg)`, opacity: 1 - prog(s, 1.1, 1.6), zIndex: 45 }} />;
      })}
    </>
  );
}
function Toast({ t, at, text, sub, y = 232, light = true }) {
  if (t < at) return null;
  const s = pop(t, at, { stiffness: 300, damping: 18 });
  return (
    <div style={{ ...abs(55, y, 340, 56), borderRadius: 18, background: light ? "#FFFFFF" : "#141B2E", boxShadow: "0 14px 40px rgba(0,36,80,.22)", display: "flex", alignItems: "center", gap: 12, padding: "0 16px", transform: `translateY(${(1 - clamp(s)) * -30}px) scale(${lerp(0.85, 1, clamp(s))})`, opacity: clamp(s * 2), zIndex: 46 }}>
      <img src={ICON3D.bell} alt="" style={{ width: 38, height: 38, maxWidth: "none", flex: "none", transform: `rotate(${Math.sin((t - at) * 30) * 18 * Math.exp(-(t - at) * 3)}deg)` }} />
      <div style={{ fontFamily: FONT, lineHeight: 1.2 }}>
        <div style={{ fontWeight: 800, fontSize: 15, color: light ? C.ink : "#fff" }}>{text}</div>
        {sub && <div style={{ fontWeight: 600, fontSize: 12, color: C.slate }}>{sub}</div>}
      </div>
    </div>
  );
}
function Giant({ t, a, b, children, dim = 0.6 }) {
  if (t < a || t >= b) return null;
  const o = clamp(prog(t, a, a + 0.12)) * (1 - prog(t, b - 0.12, b));
  return <div style={{ position: "absolute", inset: 0, background: hexA("#03060E", dim * o), zIndex: 60 }}>{children}</div>;
}

/* ---------------- Emoji Primordial e objetos 3D ---------------- */
// respiração contínua das diretrizes da biblioteca: dy = sin(t·2,5)·4 px, roll = cos(t·1,8)·1,5°
const breathe = (t) => `translateY(${Math.sin(t * 2.5) * 4}px) rotate(${Math.cos(t * 1.8) * 1.5}deg)`;
function enterOut(t, at, out) {
  const s = spring(t - at, { stiffness: 240, damping: 15 });
  const o = out != null ? easeIn(prog(t, out, out + 0.25)) : 0;
  return { s, o, scale: lerp(0.55, 1, clamp(s)) * (1 - o * 0.4), op: clamp(s * 3) * (1 - o) };
}
// feição estática (sempre com mola na entrada e respiração, nunca "recorte parado")
function Emo({ name, x, y, size, t, at = 0, out, flip = false, z = 20, shadow = true }) {
  if (t < at || (out != null && t > out + 0.25)) return null;
  const e = enterOut(t, at, out);
  return (
    <div style={{ ...abs(x, y, size, size), zIndex: z, transform: `scale(${e.scale})`, transformOrigin: "50% 90%", opacity: e.op }}>
      {shadow && <div style={{ ...abs(size * 0.2, size * 0.9, size * 0.6, size * 0.12), borderRadius: "50%", background: "radial-gradient(closest-side, rgba(0,0,0,.35), rgba(0,0,0,0))" }} />}
      <img src={EMO[name]} alt="" draggable={false} style={{ ...abs(0, 0, size, size), maxWidth: "none", transform: `${breathe(t + at)}${flip ? " scaleX(-1)" : ""}` }} />
    </div>
  );
}
// animação 3D da biblioteca (WebM com alpha); segura o último quadro depois de terminar
function EmoAnim({ name, x, y, size, t, at = 0, out, z = 20, loop = false, shadow = true }) {
  if (t < at || (out != null && t > out + 0.25)) return null;
  const a = EMO_ANIM[name];
  const e = enterOut(t, at, out);
  const lt = t - at;
  const vt = loop ? lt % a.dur : clamp(lt, 0, a.dur - 0.05);
  return (
    <div style={{ ...abs(x, y, size, size), zIndex: z, transform: `scale(${e.scale})`, transformOrigin: "50% 90%", opacity: e.op }}>
      {shadow && <div style={{ ...abs(size * 0.2, size * 0.9, size * 0.6, size * 0.12), borderRadius: "50%", background: "radial-gradient(closest-side, rgba(0,0,0,.35), rgba(0,0,0,0))" }} />}
      <div style={{ ...abs(0, 0, size, size), transform: breathe(t + at) }}>
        <SyncedVideo t={vt} duration={a.dur} webm={a.webm} style={{ objectFit: "contain", background: "transparent" }} />
      </div>
    </div>
  );
}
// objeto 3D (Fluent Emoji): entra com mola e flutua
function Ico({ name, x, y, size, t, at = 0, out, rot = 0, float = 1, z = 22, style }) {
  if (t < at || (out != null && t > out + 0.25)) return null;
  const e = enterOut(t, at, out);
  return (
    <img src={ICON3D[name]} alt="" draggable={false} style={{
      ...abs(x, y, size, size), maxWidth: "none", zIndex: z, opacity: e.op,
      transform: `translateY(${Math.sin(t * 2.2 + x) * 5 * float}px) rotate(${rot + Math.cos(t * 1.7 + y) * 4 * float}deg) scale(${e.scale})`,
      filter: "drop-shadow(0 14px 18px rgba(0,0,0,.35))", ...style,
    }} />
  );
}

/* ---------------- 0–10,7s: o gancho ---------------- */
const SW = 216; // largura útil da tela do celular do gancho
function ReelsScreen({ t }) {
  const secs = Math.floor(3600 + t * 2400);
  const hh = String(Math.floor(secs / 3600)).padStart(2, "0");
  const mm = String(Math.floor((secs % 3600) / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");
  const blink = Math.sin(t * 9) > -0.2 ? 1 : 0.15;
  return (
    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg,#2B3A55,#111725)" }}>
      <EmoAnim name="11_falando_locucao_loop" x={-2} y={110} size={220} t={t} at={-0.6} loop shadow={false} />
      <div style={{ ...abs(14, 34, 64, 24), borderRadius: 12, background: "rgba(0,0,0,.45)", display: "flex", alignItems: "center", gap: 6, padding: "0 9px", fontFamily: FONT, fontWeight: 800, fontSize: 12, color: "#fff" }}>
        <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#FF3B3B", opacity: blink }} />REC
      </div>
      <div style={{ ...abs(SW - 98, 34, 86, 24), borderRadius: 12, background: "rgba(0,0,0,.45)", fontFamily: FONT, fontWeight: 800, fontSize: 13, color: "#fff", textAlign: "center", lineHeight: "24px", fontVariantNumeric: "tabular-nums" }}>{hh}:{mm}:{ss}</div>
      <div style={{ ...abs(SW / 2 - 32, 384, 64, 64), borderRadius: "50%", border: "4px solid #fff", display: "grid", placeItems: "center" }}>
        <div style={{ width: 42, height: 42, borderRadius: "50%", background: "#FF3B3B", transform: `scale(${0.82 + Math.abs(Math.sin(t * 4)) * 0.18})` }} />
      </div>
    </div>
  );
}
const TILE_COLS = ["#FFB86B", "#7FD3FF", "#FF8FAB", "#B9A7FF", "#8BE3C1", "#FFD86B", "#A0B4D8", "#FF9F7A", "#6FD6E8"];
function FeedScreen({ t }) {
  const lt = t - T.feed;
  const tile = (SW - 4 * 4) / 3;
  const off = lt * 230;
  const first = Math.floor(off / (tile + 4));
  const flash = [0.1, 0.55, 1.05, 1.4].reduce((m, a) => Math.max(m, lt >= a ? Math.exp(-(lt - a) * 12) : 0), 0);
  return (
    <div style={{ position: "absolute", inset: 0, background: "#fff", transform: slideIn(t, T.feed) }}>
      <div style={{ ...abs(0, 26, SW, 40), display: "flex", alignItems: "center", gap: 8, padding: "0 12px", fontFamily: FONT, fontWeight: 800, fontSize: 12, color: "#111" }}>
        <span style={{ width: 22, height: 22, borderRadius: "50%", background: "linear-gradient(135deg,#FFB86B,#FF5E8A)" }} />@sua_loja
      </div>
      <div style={{ ...abs(0, 70, SW, 440), overflow: "hidden" }}>
        {Array.from({ length: 7 }, (_, r) => r + first).map((row) =>
          [0, 1, 2].map((c) => {
            const id = row * 3 + c;
            return (
              <div key={id} style={{ ...abs(4 + c * (tile + 4), row * (tile + 4) - off + 4, tile, tile), background: TILE_COLS[id % TILE_COLS.length], borderRadius: 3 }}>
                <div style={{ ...abs(tile * 0.28, tile * 0.28, tile * 0.44, tile * 0.44), borderRadius: id % 2 ? "50%" : 8, background: "rgba(255,255,255,.55)" }} />
              </div>
            );
          }))}
      </div>
      {[0.3, 0.9, 1.5].map((a, i) => lt > a && lt < a + 0.6 && (
        <svg key={i} viewBox="0 0 24 24" width="34" height="34" style={{ position: "absolute", left: 40 + i * 55, top: 300 - (lt - a) * 120, opacity: 1 - prog(lt, a + 0.3, a + 0.6), transform: `scale(${spring(lt - a, { stiffness: 400, damping: 12 })})` }}>
          <path d="M12 21s-8-5.2-8-11a4.6 4.6 0 0 1 8-3 4.6 4.6 0 0 1 8 3c0 5.8-8 11-8 11z" fill="#FF3B5C" />
        </svg>
      ))}
      <div style={{ position: "absolute", inset: 0, background: "#fff", opacity: flash * 0.85 }} />
    </div>
  );
}
function StoryScreen({ t }) {
  const lt = t - T.story;
  const flap = Math.sin(t * 13) * 13;
  const tongue = t >= 5.82 ? spring(t - 5.82, { stiffness: 300, damping: 10 }) : 0;
  const cx = SW / 2;
  return (
    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(170deg,#FF9A62,#FF5E8A 60%,#B45CFF)", transform: slideIn(t, T.story) }}>
      <div style={{ ...abs(10, 26, SW - 20, 4), display: "flex", gap: 4 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ flex: 1, borderRadius: 2, background: "rgba(255,255,255,.35)", overflow: "hidden" }}>
            <div style={{ width: `${clamp((lt - i * 0.8) / 0.8) * 100}%`, height: "100%", background: "#fff" }} />
          </div>
        ))}
      </div>
      <div style={{ ...abs(8, 100, 200, 200) }}>
        {/* orelhas 3D do filtro, balançando */}
        {[-1, 1].map((sd) => (
          <div key={sd} style={{ ...abs(sd < 0 ? 6 : 132, 0, 62, 112), borderRadius: "50% 50% 46% 46% / 40% 40% 60% 60%", background: "radial-gradient(circle at 40% 30%, #B07A55, #7A4A2C 70%)", boxShadow: "inset -6px -10px 14px rgba(0,0,0,.35)", transformOrigin: "50% 8%", transform: `rotate(${sd * (24 + flap)}deg)`, zIndex: 1 }}>
            <div style={{ ...abs(14, 18, 34, 72), borderRadius: "50%", background: "radial-gradient(circle at 40% 30%, #E7A98A, #C27E5E)" }} />
          </div>
        ))}
        <img src={EMO["02_sorriso_gentil"]} alt="" draggable={false} style={{ ...abs(0, 6, 200, 200), maxWidth: "none", zIndex: 2, transform: breathe(t) }} />
        <div style={{ ...abs(84, 116 + tongue * 2, 32, 34 * clamp(tongue, 0, 1.2)), borderRadius: "0 0 16px 16px", background: "linear-gradient(#FF6B8B,#E0466A)", zIndex: 3 }} />
        <div style={{ ...abs(80, 100, 40, 26), borderRadius: "50%", background: "radial-gradient(circle at 35% 30%, #6B4A3A, #1B0F0A 65%)", boxShadow: "0 3px 6px rgba(0,0,0,.4)", zIndex: 4 }} />
      </div>
      <div style={{ ...abs(12, 400, SW - 24, 36), borderRadius: 18, border: "2px solid rgba(255,255,255,.7)", fontFamily: FONT, fontWeight: 600, fontSize: 12, color: "#fff", lineHeight: "32px", paddingLeft: 14 }}>Enviar mensagem</div>
    </div>
  );
}
const QUERY = "minha loja petrópolis";
function SearchScreen({ t }) {
  const n = clamp(Math.floor((t - 6.75) / 0.075) + 1, 0, QUERY.length);
  const loading = inWin(t, T.go + 0.05, T.nada);
  const empty = t >= T.nada;
  const es = pop(t, T.nada, { stiffness: 260, damping: 15 });
  return (
    <div style={{ position: "absolute", inset: 0, background: "#fff", transform: slideIn(t, T.search) }}>
      <div style={{ ...abs(0, 52, SW, 30), textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 20, color: "#5F6368", letterSpacing: "-0.02em" }}>Pesquisa</div>
      <div style={{ ...abs(12, 96, SW - 24, 42), borderRadius: 21, border: "1.5px solid #DADCE0", boxShadow: t >= T.go && t < T.go + 0.2 ? "0 0 0 4px rgba(37,99,235,.25)" : "0 2px 8px rgba(0,0,0,.08)", display: "flex", alignItems: "center", gap: 8, padding: "0 12px" }}>
        <svg viewBox="0 0 24 24" width="17" height="17"><circle cx="10" cy="10" r="6.5" fill="none" stroke="#5F6368" strokeWidth="2.4" /><line x1="15" y1="15" x2="21" y2="21" stroke="#5F6368" strokeWidth="2.4" strokeLinecap="round" /></svg>
        <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: 13, color: "#202124", whiteSpace: "nowrap" }}>{QUERY.slice(0, n)}</span>
        {t < T.go && <span style={{ width: 2, height: 17, background: C.blue, opacity: Math.sin(t * 12) > 0 ? 1 : 0 }} />}
      </div>
      {loading && [0, 1, 2].map((i) => (
        <div key={i} style={{ ...abs(16, 160 + i * 70, SW - 32, 56) }}>
          {[0, 1, 2].map((k) => <div key={k} style={{ height: k ? 9 : 12, width: `${[60, 95, 80][k]}%`, marginBottom: 9, borderRadius: 5, background: `linear-gradient(90deg,#EEF1F5 ${((t * 160) % 200) - 60}%,#DCE2EA ${((t * 160) % 200) - 30}%,#EEF1F5 ${(t * 160) % 200}%)` }} />)}
        </div>
      ))}
      {empty && (
        <div style={{ ...abs(0, 180, SW, 230), display: "flex", flexDirection: "column", alignItems: "center", transform: `scale(${lerp(0.8, 1, clamp(es))})`, opacity: clamp(es * 2) }}>
          <svg viewBox="0 0 80 80" width="84" height="84"><circle cx="34" cy="34" r="22" fill="none" stroke="#BDC1C6" strokeWidth="6" /><line x1="50" y1="50" x2="68" y2="68" stroke="#BDC1C6" strokeWidth="7" strokeLinecap="round" /><path d="M26 26 L42 42 M42 26 L26 42" stroke={RED} strokeWidth="5" strokeLinecap="round" /></svg>
          <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 15, color: "#202124", marginTop: 12, textAlign: "center", lineHeight: 1.25 }}>Nenhum resultado encontrado</div>
          <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 11.5, color: "#70757A", marginTop: 6, textAlign: "center", padding: "0 14px", lineHeight: 1.35 }}>para “{QUERY}”. Verifique a ortografia ou tente outras palavras.</div>
        </div>
      )}
    </div>
  );
}
/* ---------------- 10,7–22,9s: o direct ---------------- */
const BUBBLES = [
  [11.0, "L", "Oi! Qual o valor?"],
  [12.5, "L", "Tem site pra eu ver?"],
  [14.1, "R", "Mandei no direct"],
  [20.6, "L", "??"],
  [21.8, "L", "Deixa, comprei em outra loja."],
];
function DMScreen({ t }) {
  const typing = inWin(t, 18.1, 20.5);
  const seen = t >= 20.4;
  return (
    <div style={{ position: "absolute", inset: 0, background: "#fff", transform: slideIn(t, T.dm) }}>
      <div style={{ ...abs(0, 26, SW, 54), display: "flex", alignItems: "center", gap: 9, padding: "0 12px", borderBottom: "1px solid #EFEFEF" }}>
        <svg viewBox="0 0 24 24" width="16" height="16"><path d="M15 4 L7 12 L15 20" fill="none" stroke="#111" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        <span style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#FFB86B,#FF5E8A)", flex: "none" }} />
        <div style={{ fontFamily: FONT, lineHeight: 1.2 }}>
          <div style={{ fontWeight: 800, fontSize: 12.5, color: "#111" }}>cliente_petropolis</div>
          <div style={{ fontWeight: 600, fontSize: 10.5, color: seen ? RED : "#8E8E8E" }}>{seen ? "Você: visto há 3 h" : "Ativo agora"}</div>
        </div>
      </div>
      <div style={{ ...abs(10, 92, SW - 20, 320), display: "flex", flexDirection: "column", gap: 8 }}>
        {BUBBLES.filter(([at]) => t >= at).map(([at, side, txt], i) => {
          const s = pop(t, at, { stiffness: 340, damping: 17 });
          return (
            <div key={i} style={{ alignSelf: side === "L" ? "flex-start" : "flex-end", maxWidth: 160, padding: "8px 12px", borderRadius: 18, background: side === "L" ? "#EFEFEF" : "#3797F0", color: side === "L" ? "#111" : "#fff", fontFamily: FONT, fontWeight: 600, fontSize: 13, lineHeight: 1.3, transformOrigin: side === "L" ? "0% 100%" : "100% 100%", transform: `scale(${lerp(0.5, 1, Math.min(s, 1.06))})`, opacity: clamp(s * 3) }}>{txt}</div>
          );
        })}
        {typing && (
          <div style={{ alignSelf: "flex-start", padding: "10px 14px", borderRadius: 18, background: "#EFEFEF", display: "flex", gap: 4 }}>
            {[0, 1, 2].map((k) => <span key={k} style={{ width: 7, height: 7, borderRadius: "50%", background: "#8E8E8E", transform: `translateY(${Math.sin(t * 10 - k) * 3}px)` }} />)}
          </div>
        )}
        {t >= 22.3 && <div style={{ alignSelf: "center", fontFamily: FONT, fontWeight: 600, fontSize: 10.5, color: "#8E8E8E", marginTop: 4, opacity: ent(t, 22.3, 0.25) }}>cliente saiu da conversa</div>}
      </div>
      <div style={{ ...abs(10, 412, SW - 20, 36), borderRadius: 18, background: "#F2F2F2", fontFamily: FONT, fontWeight: 600, fontSize: 12, color: "#8E8E8E", lineHeight: "36px", paddingLeft: 14 }}>Mensagem...</div>
    </div>
  );
}
function HookPhone({ t }) {
  if (t >= 23.0) return null;
  const inS = spring(t + 0.25, { stiffness: 200, damping: 16 });
  const out = easeIn(prog(t, 22.6, 22.98));
  const dimDuringGiant = inWin(t, T.pleno, T.back) ? 0.3 : 1;
  const screen = t < T.feed ? <ReelsScreen t={t} /> : t < T.story ? <FeedScreen t={t} /> : t < T.search ? <StoryScreen t={t} /> : t < T.dm ? <SearchScreen t={t} /> : <DMScreen t={t} />;
  return (
    <Phone x={110} y={240} w={230} h={470} tilt={-14 + Math.sin(t * 0.9) * 6} style={{ transform: `translateY(${out * 90}px) scale(${lerp(0.88, 1, clamp(inS)) * lerp(1, 0.7, out)})`, opacity: (1 - out) * dimDuringGiant, zIndex: 10 }}>
      {screen}
    </Phone>
  );
}
function HookExtras({ t }) {
  if (t >= 23.0) return null;
  const shutter = [2.3, 2.75, 3.25, 3.6].reduce((m, a) => Math.max(m, t >= a ? Math.exp(-(t - a) * 10) : 0), 0);
  return (
    <>
      <Ico name="camera" x={18} y={300} size={96} t={t} at={T.feed} out={T.story - 0.2} rot={-12} style={{ filter: `drop-shadow(0 14px 18px rgba(0,0,0,.35)) brightness(${1 + shutter * 0.6})` }} />
      <Ico name="dog" x={330} y={270} size={84} t={t} at={T.story + 0.2} out={T.search - 0.2} rot={10} />
      <Ico name="magnifier" x={318} y={250} size={100} t={t} at={T.search + 0.1} out={T.nada - 0.25} rot={t >= T.go && t < T.go + 0.3 ? -20 : 8} />
      <EmoAnim name="10_revirando_olhos_eye_roll" x={-18} y={560} size={190} t={t} at={14.25} out={T.pleno - 0.1} z={15} />
      <Ico name="hourglass" x={322} y={252} size={88} t={t} at={18.1} out={22.55} rot={Math.floor((t - 18.1) / 1.2) % 2 ? 180 : 0} />
      <Emo name="15_revirando_olhos_tedio" x={-14} y={565} size={180} t={t} at={T.back + 0.1} out={22.55} z={15} />
    </>
  );
}
function Nada({ t }) {
  return (
    <Giant t={t} a={T.nada} b={10.68} dim={0.5}>
      {[0, 1, 2].map((k) => {
        const lt = t - T.nada - k * 0.14;
        if (lt < 0) return null;
        const s = k === 0 ? spring(lt, { stiffness: 420, damping: 15 }) : 1;
        return <div key={k} style={{ ...abs(0, 250, 450, 160), textAlign: "center", ...DISP, fontSize: fitSize("NADA.", 400, 120), lineHeight: "160px", color: k ? "transparent" : "#fff", WebkitTextStroke: k ? `2px ${hexA("#FFFFFF", 0.5 - k * 0.15)}` : "none", transform: `scale(${k ? 1 + lt * 0.5 : lerp(1.6, 1, clamp(s))})`, opacity: k ? clamp(1 - lt * 1.6) : clamp(s * 3) }}>NADA.</div>;
      })}
      <Ico name="cricket" x={lerp(-90, 470, prog(t, T.nada + 0.1, 10.68))} y={600 - Math.abs(Math.sin((t - T.nada) * 9)) * 50} size={74} t={t} at={T.nada + 0.1} float={0} z={61} />
      <EmoAnim name="02_dizendo_NAO_cabeca_3d" x={120} y={420} size={210} t={t} at={T.nada + 0.05} z={61} />
    </Giant>
  );
}
function Pleno({ t }) {
  const s1 = pop(t, T.pleno, { stiffness: 420, damping: 16 });
  const s2 = pop(t, T.ano, { stiffness: 500, damping: 14 });
  return (
    <Giant t={t} a={T.pleno} b={T.back} dim={0.82}>
      <div style={{ ...abs(0, 300, 450, 70), textAlign: "center", ...DISP, fontSize: 54, lineHeight: "70px", color: "#fff", transform: `scale(${lerp(1.5, 1, clamp(s1))})`, opacity: clamp(s1 * 3) }}>EM PLENO</div>
      <Ico name="collision" x={95} y={330} size={260} t={t} at={T.ano - 0.02} float={0.3} z={0} style={{ opacity: 0.85, filter: "blur(.5px) drop-shadow(0 14px 18px rgba(0,0,0,.35))" }} />
      <EmoAnim name="08_desconfiado_side_eye_rock" x={130} y={560} size={190} t={t} at={T.pleno + 0.25} z={61} />
      {t >= T.ano && <div style={{ ...abs(0, 372, 450, 170), textAlign: "center", ...DISP, fontSize: fitSize("2026", 400, 150), lineHeight: "170px", ...gradLight, transform: `scale(${lerp(2.2, 1, clamp(s2))})`, opacity: clamp(s2 * 3), filter: "drop-shadow(0 10px 30px rgba(47,212,255,.35))" }}>2026</div>}
    </Giant>
  );
}

/* ---------------- 23–41,4s: a solução ---------------- */
function Browser({ x, y, w, h, t, at, children, url = "sualoja.com.br", style, tilt = 0 }) {
  const s = pop(t, at, { stiffness: 220, damping: 18 });
  const ry = lerp(-35, tilt, clamp(s)) + Math.sin(t * 0.8) * 3;
  return (
    <div style={{ ...abs(x, y, w, h), borderRadius: 16, background: "#fff", overflow: "hidden", boxShadow: `${depth(ry, 7, "#C9D6E6")}, 0 30px 60px rgba(0,36,80,.22)`, transform: `perspective(1200px) rotateY(${ry}deg) rotateX(${lerp(14, 6, clamp(s))}deg) scale(${lerp(0.85, 1, clamp(s))})`, opacity: clamp(s * 2), ...style }}>
      <div style={{ height: 26, background: "#EDF1F7", display: "flex", alignItems: "center", gap: 5, padding: "0 10px" }}>
        {["#FF6159", "#FFBD2E", "#28C940"].map((c) => <span key={c} style={{ width: 8, height: 8, borderRadius: "50%", background: c }} />)}
        <span style={{ marginLeft: 10, flex: 1, height: 16, borderRadius: 8, background: "#fff", fontFamily: FONT, fontWeight: 600, fontSize: 9.5, color: C.slate, lineHeight: "16px", paddingLeft: 8 }}>{url}</span>
      </div>
      <div style={{ position: "relative", width: w, height: h - 26 }}>{children}</div>
    </div>
  );
}
const PRODUCTS = ["#FFB86B", "#7FD3FF", "#FF8FAB", "#8BE3C1"];
function SiteContent({ t, at, w }) {
  const hero = easeOut(prog(t, at + 0.25, at + 0.6));
  const cw = (w - 20 - 3 * 10) / 4;
  return (
    <>
      <div style={{ ...abs(0, 0, w, 104), background: GRAD, clipPath: `inset(0 ${(1 - hero) * 100}% 0 0)` }}>
        <div style={{ ...abs(16, 22, 150, 13), borderRadius: 7, background: "#fff" }} />
        <div style={{ ...abs(16, 44, 110, 9), borderRadius: 5, background: "rgba(255,255,255,.7)" }} />
        <div style={{ ...abs(16, 66, 74, 22), borderRadius: 11, background: "#fff", fontFamily: FONT, fontWeight: 800, fontSize: 9, color: C.ink, lineHeight: "22px", textAlign: "center" }}>Comprar</div>
        <div style={{ ...abs(w - 120, 14, 100, 78), borderRadius: 12, background: "rgba(255,255,255,.22)" }} />
      </div>
      {PRODUCTS.map((c, i) => {
        const s = pop(t, at + 0.6 + i * 0.08, { stiffness: 320, damping: 16 });
        return (
          <div key={i} style={{ ...abs(10 + i * (cw + 10), 118, cw, 120), borderRadius: 10, background: "#F4F7FB", transform: `translateY(${(1 - clamp(s)) * 20}px)`, opacity: clamp(s * 2) }}>
            <div style={{ ...abs(8, 8, cw - 16, 60), borderRadius: 8, background: c }} />
            <div style={{ ...abs(8, 76, cw - 24, 8), borderRadius: 4, background: "#D5DCE6" }} />
            <div style={{ ...abs(8, 92, 34, 10), borderRadius: 5, background: C.blue }} />
          </div>
        );
      })}
    </>
  );
}
function SiteScene({ t }) {
  if (!inWin(t, T.site, T.flow + 0.3)) return null;
  const out = easeIn(prog(t, T.flow, T.flow + 0.3));
  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - out, transform: `scale(${1 - out * 0.1})` }}>
      <Browser x={30} y={232} w={390} h={290} t={t} at={T.site + 0.05} tilt={-8}>
        <SiteContent t={t} at={T.site + 0.05} w={390} />
      </Browser>
      {/* bolhas de O₂ subindo do site */}
      {Array.from({ length: 7 }, (_, i) => {
        const a = T.oxi - 0.1 + i * 0.1;
        if (t < a || t > a + 1.4) return null;
        const s = t - a;
        const r = 16 + rnd(i, 7) * 14;
        return <div key={i} style={{ ...abs(50 + rnd(i, 8) * 330, 470 - s * 210, r * 2, r * 2), borderRadius: "50%", background: "rgba(47,212,255,.18)", border: `2px solid ${C.cyan}`, display: "grid", placeItems: "center", fontFamily: FONT, fontWeight: 800, fontSize: r * 0.62, color: C.blue, opacity: clamp(s * 5) * (1 - prog(s, 1.0, 1.4)), transform: `scale(${spring(s, { stiffness: 300, damping: 12 })})` }}>O₂</div>;
      })}
      <EmoAnim name="07_aceno_SIM_aprovando" x={120} y={540} size={210} t={t} at={T.oxi - 0.1} out={T.robo - 0.2} />
      <Robot t={t} />
      <Orders t={t} />
      <Clock24 t={t} />
      <NoList t={t} />
    </div>
  );
}
const STAMPS = [27.0, 27.6, 28.2, 31.3, 32.5, 34.2];
function Robot({ t }) {
  if (t < T.robo) return null;
  const s = pop(t, T.robo, { stiffness: 200, damping: 14 });
  const st = STAMPS.reduce((m, a) => (t >= a - 0.12 && t < a + 0.25 ? Math.max(m, t < a ? prog(t, a - 0.12, a) : 1 - prog(t, a + 0.05, a + 0.25)) : m), 0);
  return (
    <div style={{ ...abs(282, 560, 160, 160), transform: `translateX(${(1 - clamp(s)) * 220}px) translateY(${Math.sin(t * 3) * 6 + st * 10}px) rotate(${-st * 16}deg)`, transformOrigin: "30% 80%", zIndex: 20 }}>
      <div style={{ ...abs(26, 146, 108, 16), borderRadius: "50%", background: "radial-gradient(closest-side, rgba(0,36,80,.3), rgba(0,36,80,0))" }} />
      <img src={ICON3D.robot} alt="" draggable={false} style={{ ...abs(0, 0, 160, 160), maxWidth: "none", filter: "drop-shadow(0 16px 20px rgba(0,36,80,.3))" }} />
    </div>
  );
}
function Stamp({ t, at, label = "PAGO", color = C.blue, x, y }) {
  if (t < at) return null;
  const s = pop(t, at, { stiffness: 500, damping: 14 });
  return <div style={{ ...abs(x, y, 62, 26), border: `2.5px solid ${color}`, borderRadius: 6, color, fontFamily: FONT, fontWeight: 800, fontSize: 12, letterSpacing: "0.08em", lineHeight: "21px", textAlign: "center", transform: `rotate(-10deg) scale(${lerp(1.8, 1, clamp(s))})`, opacity: clamp(s * 3) }}>{label}</div>;
}
function Orders({ t }) {
  if (!inWin(t, 26.7, T.h24 + 0.3)) return null;
  const out = easeIn(prog(t, T.h24, T.h24 + 0.3));
  return (
    <div style={{ position: "absolute", inset: 0, transform: `translateX(${-out * 300}px)`, opacity: 1 - out }}>
      {[0, 1, 2].map((i) => {
        const s = pop(t, 26.75 + i * 0.6, { stiffness: 300, damping: 18 });
        return (
          <div key={i} style={{ ...abs(28, 560 + i * 62, 255, 52), borderRadius: 14, background: "#fff", boxShadow: "0 8px 24px rgba(0,36,80,.12)", transform: `translateX(${(1 - clamp(s)) * -60}px)`, opacity: clamp(s * 2), fontFamily: FONT, padding: "8px 14px", lineHeight: 1.25 }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: C.ink }}>Pedido #{1041 + i}</div>
            <div style={{ fontWeight: 600, fontSize: 11.5, color: C.slate }}>R$ {["129,90", "89,90", "249,90"][i]}</div>
            <Stamp t={t} at={STAMPS[i]} x={170} y={13} />
          </div>
        );
      })}
    </div>
  );
}
function Clock24({ t }) {
  if (!inWin(t, T.h24, T.sem + 0.3)) return null;
  const s = pop(t, T.h24, { stiffness: 260, damping: 16 });
  const out = easeIn(prog(t, T.sem, T.sem + 0.3));
  const lt = t - T.h24;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: clamp(s * 2) * (1 - out), transform: `translateX(${-out * 300}px)` }}>
      <img src={ICON3D.clock} alt="" draggable={false} style={{ ...abs(26, 578, 140, 140), maxWidth: "none", transform: `scale(${lerp(0.6, 1, clamp(s))}) rotate(${Math.sin(lt * 60) * 7}deg)`, filter: "drop-shadow(0 16px 20px rgba(0,36,80,.3))" }} />
      <div style={{ ...abs(180, 590, 140, 100), ...DISP, fontSize: 88, lineHeight: "100px", ...gradText }}>24H</div>
      <div style={{ ...abs(184, 688, 140, 22), fontFamily: FONT, fontWeight: 800, fontSize: 16, color: C.ink }}>por dia, todo dia</div>
    </div>
  );
}
const NO = [[T.sem, 31.3, "Reclamar de CLT"], [32.08, 32.5, "Pedir folga"], [33.0, 34.2, "Deixar cliente no vácuo"]];
function NoList({ t }) {
  if (!inWin(t, T.sem, T.flow + 0.3)) return null;
  return (
    <>
      {NO.map(([at, cross, label], i) => {
        if (t < at) return null;
        const s = pop(t, at, { stiffness: 300, damping: 18 });
        const strike = easeOut(prog(t, cross - 0.05, cross + 0.2));
        return (
          <div key={i} style={{ ...abs(26, 562 + i * 64, 270, 54), borderRadius: 14, background: "#fff", boxShadow: "0 8px 24px rgba(0,36,80,.12)", display: "flex", alignItems: "center", gap: 10, padding: "0 12px", transform: `translateX(${(1 - clamp(s)) * -60}px)`, opacity: clamp(s * 2) }}>
            <div style={{ width: 34, height: 34, flex: "none", display: "grid", placeItems: "center" }}>
              {strike > 0 ? <img src={ICON3D.cross} alt="" style={{ width: 34, height: 34, maxWidth: "none", transform: `scale(${spring(t - cross + 0.05, { stiffness: 500, damping: 12 })})` }} /> : <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#E3ECF5" }} />}
            </div>
            <div style={{ position: "relative", fontFamily: FONT, fontWeight: 800, fontSize: 14.5, color: strike > 0.5 ? C.slate : C.ink }}>
              {label}
              <div style={{ ...abs(-2, 9, 0, 3), width: `calc(${strike * 100}% + 4px)`, background: RED, borderRadius: 2 }} />
            </div>
          </div>
        );
      })}
    </>
  );
}
/* fluxo: entra → catálogo → dúvida → cartão → compra */
function FlowScene({ t }) {
  if (!inWin(t, T.flow, T.sleep + 0.3)) return null;
  const s = pop(t, T.flow, { stiffness: 220, damping: 18 });
  const out = easeIn(prog(t, T.sleep, T.sleep + 0.3));
  const PW = 196;
  const stage = t < 35.74 ? 0 : t < 37.62 ? 1 : 2;
  const scroll = easeInOut(prog(t, 35.8, 36.5)) * 150;
  const buy = 38.55;
  const done = t >= 38.6;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: clamp(s * 2) * (1 - out), transform: `translateY(${(1 - clamp(s)) * 40}px)` }}>
      <Phone x={40} y={240} w={210} h={430} light tilt={10 + Math.sin(t * 0.9) * 4}>
        <div style={{ position: "absolute", inset: 0, background: "#fff" }}>
          {stage < 2 && (
            <div style={{ position: "absolute", left: 0, top: -scroll * (stage === 1 ? 1 : 0), width: PW }}>
              <div style={{ height: 150, background: GRAD, position: "relative" }}>
                <div style={{ ...abs(14, 54, 120, 12), borderRadius: 6, background: "#fff" }} />
                <div style={{ ...abs(14, 74, 90, 8), borderRadius: 4, background: "rgba(255,255,255,.7)" }} />
                <div style={{ ...abs(14, 96, 96, 26), borderRadius: 13, background: "#fff", fontFamily: FONT, fontWeight: 800, fontSize: 10, color: C.ink, lineHeight: "26px", textAlign: "center", transform: `scale(${t >= 35.35 && t < 35.5 ? 0.92 : 1})` }}>Ver catálogo</div>
              </div>
              <div style={{ padding: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {Array.from({ length: 8 }, (_, i) => (
                  <div key={i} style={{ height: 96, borderRadius: 10, background: "#F4F7FB", padding: 6 }}>
                    <div style={{ height: 54, borderRadius: 7, background: TILE_COLS[i % TILE_COLS.length] }} />
                    <div style={{ height: 6, width: "70%", borderRadius: 3, background: "#D5DCE6", marginTop: 7 }} />
                    <div style={{ height: 8, width: 34, borderRadius: 4, background: C.blue, marginTop: 6 }} />
                  </div>
                ))}
              </div>
            </div>
          )}
          {stage === 1 && t >= 36.76 && (
            <div style={{ ...abs(8, 238, PW - 16, 170), borderRadius: 16, background: "#fff", boxShadow: "0 -6px 24px rgba(0,36,80,.16)", padding: 10, display: "flex", flexDirection: "column", gap: 7, transform: `translateY(${(1 - ent(t, 36.76, 0.3)) * 180}px)` }}>
              <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 11, color: C.ink }}>Atendimento</div>
              {[[36.85, "R", "Tem no tamanho M?"], [37.2, "L", "Tem sim! Pronta entrega."]].map(([at, side, txt], i) => t >= at && (
                <div key={i} style={{ alignSelf: side === "L" ? "flex-start" : "flex-end", padding: "6px 10px", borderRadius: 14, background: side === "L" ? "#EDF1F7" : C.blue, color: side === "L" ? C.ink : "#fff", fontFamily: FONT, fontWeight: 600, fontSize: 11, transform: `scale(${Math.min(pop(t, at), 1.05)})`, transformOrigin: side === "L" ? "0 100%" : "100% 100%" }}>{txt}</div>
              ))}
            </div>
          )}
          {stage === 2 && (
            <div style={{ position: "absolute", inset: 0, padding: "40px 14px 0", transform: slideIn(t, 37.62) }}>
              <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 16, color: C.ink }}>Pagamento</div>
              <div style={{ marginTop: 14, height: 70, borderRadius: 12, background: GRAD, position: "relative" }}>
                <div style={{ ...abs(12, 14, 26, 18), borderRadius: 4, background: "#FFD86B" }} />
                <div style={{ ...abs(12, 44, 110, 9), borderRadius: 4, background: "rgba(255,255,255,.7)" }} />
              </div>
              <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", fontFamily: FONT, fontWeight: 800, fontSize: 14, color: C.ink }}><span>Total</span><span>R$ 189,90</span></div>
              <div style={{ marginTop: 18, height: 42, borderRadius: 21, background: done ? MINT : C.blue, color: "#fff", fontFamily: FONT, fontWeight: 800, fontSize: 13, lineHeight: "42px", textAlign: "center", transform: `scale(${t >= buy && t < buy + 0.12 ? 0.94 : 1})` }}>{done ? "Pedido confirmado ✓" : "Comprar agora"}</div>
            </div>
          )}
        </div>
      </Phone>
      {/* cursor/mão tocando */}
      {inWin(t, 34.95, 35.7) && <Point x={lerp(280, 118, easeInOut(prog(t, 34.95, 35.3)))} y={lerp(720, 352, easeInOut(prog(t, 34.95, 35.3)))} press={t >= 35.35 && t < 35.5 ? 1 : 0} />}
      <Ripple x={118} y={352} t={t} at={35.35} color={C.blue} />
      {inWin(t, 38.2, 39.0) && <Point x={lerp(280, 146, easeInOut(prog(t, 38.2, 38.5)))} y={lerp(740, 474, easeInOut(prog(t, 38.2, 38.5)))} press={t >= buy && t < buy + 0.12 ? 1 : 0} />}
      <Ripple x={146} y={474} t={t} at={buy} color={MINT} />
      <Pos t={t} />
      <Confetti x={146} y={470} t={t} at={38.6} />
      <Ico name="party" x={190} y={360} size={110} t={t} at={38.6} rot={-15} z={44} />
      <Ico name="moneybag" x={300} y={640} size={96} t={t} at={38.7} z={44} />
      {[0, 1, 2].map((k) => t >= 38.62 + k * 0.08 && t < 39.6 && <img key={k} src={ICON3D.coin} alt="" style={{ ...abs(330 + k * 22 - (t - 38.62) * 60, 520 - (t - 38.62 - k * 0.08) * 420 + (t - 38.62) ** 2 * 520, 48, 48), maxWidth: "none", transform: `rotateY(${(t - 38.62) * 900}deg)`, zIndex: 44 }} />)}
      <Toast t={t} at={38.62} text="Nova venda!" sub="R$ 189,90 · agora" y={236} />
    </div>
  );
}
function Pos({ t }) {
  const approved = t >= 38.2;
  const cardIn = easeOut(prog(t, 37.62, 37.95));
  const cardOut = easeIn(prog(t, 38.35, 38.6));
  const wobble = inWin(t, 37.95, 38.2) ? Math.sin((t - 37.95) * 40) * 2 : 0;
  return (
    <>
      <div style={{ ...abs(282, 420, 130, 220), borderRadius: 22, background: `linear-gradient(150deg, #22406E, ${C.ink} 55%)`, boxShadow: `${depth(-10, 8, "#0B1A33")}, 0 26px 40px rgba(0,36,80,.35)`, transform: "perspective(800px) rotateY(-14deg) rotateX(6deg)" }}>
        <div style={{ ...abs(14, 16, 102, 64), borderRadius: 10, background: approved ? MINT : "#0B1A33", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: FONT, color: "#fff" }}>
          <div style={{ fontWeight: 800, fontSize: approved ? 13 : 15 }}>{approved ? "APROVADO" : "R$ 189,90"}</div>
          {!approved && <div style={{ fontWeight: 600, fontSize: 9, opacity: 0.7 }}>aproxime o cartão</div>}
        </div>
        <div style={{ ...abs(14, 92, 102, 112), display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6 }}>
          {Array.from({ length: 12 }, (_, i) => <div key={i} style={{ borderRadius: 6, background: i === 11 ? MINT : "#22355C" }} />)}
        </div>
      </div>
      {cardIn > 0 && cardOut < 1 && (
        <img src={ICON3D.card} alt="" draggable={false} style={{ ...abs(lerp(470, 286, cardIn) + cardOut * 220, 340 + wobble, 130, 130), maxWidth: "none", transform: `perspective(600px) rotateY(${lerp(-40, 0, cardIn)}deg) rotate(${lerp(18, -10, cardIn)}deg)`, filter: "drop-shadow(0 16px 20px rgba(0,0,0,.35))", zIndex: 25 }} />
      )}
    </>
  );
}
/* metade vendendo, metade dormindo */
function SleepScene({ t }) {
  if (!inWin(t, T.sleep, T.compare + 0.3)) return null;
  const s = pop(t, T.sleep, { stiffness: 220, damping: 18 });
  const out = easeIn(prog(t, T.compare, T.compare + 0.3));
  return (
    <div style={{ position: "absolute", inset: 0, opacity: clamp(s * 2) * (1 - out) }}>
      <div style={{ ...abs(20, 228, 410, 270), borderRadius: 24, background: "#FFFFFF", boxShadow: "0 18px 40px rgba(0,36,80,.14)", overflow: "hidden", transform: `translateY(${(1 - clamp(s)) * -40}px)` }}>
        <div style={{ ...abs(14, 12, 120, 24), borderRadius: 12, background: hexA(C.blue, 0.1), color: C.blue, fontFamily: FONT, fontWeight: 800, fontSize: 12, lineHeight: "24px", textAlign: "center" }}>Seu site, 3h da manhã</div>
        {[39.6, 40.1, 40.6, 41.0].map((at, i) => t >= at && (
          <div key={i} style={{ ...abs(14, 46 + i * 54, 382, 46), borderRadius: 14, background: "#F4F7FB", display: "flex", alignItems: "center", gap: 10, padding: "0 12px", transform: `translateX(${(1 - clamp(pop(t, at))) * 60}px)`, opacity: clamp(pop(t, at) * 2), fontFamily: FONT }}>
            <img src={ICON3D.coin} alt="" style={{ width: 30, height: 30, maxWidth: "none", flex: "none", transform: `rotateY(${Math.max(0, 1 - (t - at) * 2) * 360}deg)` }} />
            <span style={{ fontWeight: 800, fontSize: 13, color: C.ink, flex: 1 }}>Nova venda</span>
            <span style={{ fontWeight: 800, fontSize: 13, color: MINT }}>+R$ {["89,90", "149,90", "59,90", "219,90"][i]}</span>
          </div>
        ))}
      </div>
      <div style={{ ...abs(20, 508, 410, 270), borderRadius: 24, background: "linear-gradient(180deg,#0B1530,#03060E)", overflow: "hidden", transform: `translateY(${(1 - clamp(s)) * 40}px)` }}>
        {Array.from({ length: 14 }, (_, i) => <div key={i} style={{ ...abs(rnd(i, 1) * 400, rnd(i, 2) * 150, 3, 3), borderRadius: "50%", background: "#fff", opacity: 0.3 + 0.7 * Math.abs(Math.sin(t * 2 + i)) }} />)}
        <img src={ICON3D.moon} alt="" style={{ ...abs(300, 14, 92, 92), maxWidth: "none", transform: `rotate(${Math.sin(t) * 6}deg)`, filter: "drop-shadow(0 0 18px rgba(255,231,166,.45))" }} />
        <div style={{ ...abs(14, 12, 64, 24), borderRadius: 12, background: "rgba(255,255,255,.12)", color: "#fff", fontFamily: FONT, fontWeight: 800, fontSize: 12, lineHeight: "24px", textAlign: "center" }}>Você</div>
        <div style={{ ...abs(70, 170, 270, 64), borderRadius: 32, background: "radial-gradient(circle at 40% 30%, #FFFFFF, #CBD6E6)", boxShadow: "0 10px 20px rgba(0,0,0,.35)" }} />
        <img src={EMO["08_olhos_fechados_zen"]} alt="" style={{ ...abs(118, 50, 170, 170), maxWidth: "none", transform: `rotate(${-12 + Math.sin(t * 1.6) * 3}deg)` }} />
        <div style={{ ...abs(40, 214, 330, 70), borderRadius: "34px 34px 16px 16px", background: `linear-gradient(160deg, ${C.blue}, ${C.deep})`, boxShadow: "inset 0 6px 10px rgba(255,255,255,.15)" }} />
        <img src={ICON3D.zzz} alt="" style={{ ...abs(270, 70 - ((t - T.sleep) * 18) % 30, 70, 70), maxWidth: "none", opacity: 0.9, transform: `scale(${1 + Math.sin(t * 2.4) * 0.08})` }} />
      </div>
    </div>
  );
}

/* ---------------- 41,4–55,2s: comparativo e CTA ---------------- */
function ProSite({ t, w, h, label, glow }) {
  return (
    <div style={{ position: "absolute", inset: 0, background: "#fff" }}>
      <div style={{ ...abs(0, 0, w, 110), background: GRAD }}>
        <div style={{ ...abs(18, 26, 160, 14), borderRadius: 7, background: "#fff" }} />
        <div style={{ ...abs(18, 50, 120, 9), borderRadius: 5, background: "rgba(255,255,255,.7)" }} />
        <div style={{ ...abs(18, 72, 86, 24), borderRadius: 12, background: "#fff", fontFamily: FONT, fontWeight: 800, fontSize: 10, color: C.ink, lineHeight: "24px", textAlign: "center" }}>Comprar</div>
      </div>
      {PRODUCTS.map((c, i) => <div key={i} style={{ ...abs(14 + i * ((w - 28) / 4), 124, (w - 28) / 4 - 10, h - 140), borderRadius: 10, background: "#F4F7FB", padding: 6 }}><div style={{ height: "60%", borderRadius: 7, background: c }} /></div>)}
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(110deg, transparent ${((t * 70) % 200) - 40}%, rgba(255,255,255,.6) ${((t * 70) % 200) - 25}%, transparent ${((t * 70) % 200) - 10}%)`, opacity: glow }} />
      <div style={{ ...abs(w - 128, 10, 116, 26), borderRadius: 13, background: "#fff", color: C.blue, fontFamily: FONT, fontWeight: 800, fontSize: 11.5, lineHeight: "26px", textAlign: "center" }}>{label}</div>
    </div>
  );
}
function CompareScene({ t }) {
  if (!inWin(t, T.compare, T.bio + 0.3)) return null;
  const s = pop(t, T.compare, { stiffness: 220, damping: 18 });
  const out = easeIn(prog(t, T.bio, T.bio + 0.3));
  const wipe = easeInOut(prog(t, T.prof, T.prof + 0.7));
  const flicker = t < T.prof && Math.sin(t * 23) > 0.6 ? 0.45 : 1;
  const sales = Math.round(lerp(1890, 2340, prog(t, 41.6, 44.5)));
  const W = 410;
  const H = 262;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: clamp(s * 2) * (1 - out) }}>
      {/* sua loja: amadora → profissional */}
      <div style={{ ...abs(20, 228, W, H), borderRadius: 22, overflow: "hidden", background: "#C9C2B3", transform: `translateX(${(1 - clamp(s)) * -60}px)` }}>
        <div style={{ position: "absolute", inset: 0, filter: "grayscale(.7) sepia(.35)" }}>
          <div style={{ ...abs(14, 40, 210, 26), fontFamily: "'Comic Sans MS', 'Comic Neue', cursive", fontWeight: 700, fontSize: 22, color: "#5A4632", transform: "rotate(-3deg)" }}>Loja do Zé!!!</div>
          <div style={{ ...abs(16, 84, 120, 92), background: "#A89F8E", border: "3px dashed #7B7262", display: "grid", placeItems: "center", fontFamily: FONT, fontSize: 11, fontWeight: 700, color: "#5A4632", transform: "rotate(2deg)" }}>imagem não carregou</div>
          <div style={{ ...abs(150, 96, 120, 18), background: "#D8D0BF" }} /><div style={{ ...abs(150, 124, 90, 14), background: "#D8D0BF" }} />
          <div style={{ ...abs(150, 150, 110, 28), borderRadius: 2, background: "#B85C38", color: "#fff", fontFamily: "'Comic Sans MS', cursive", fontSize: 12, lineHeight: "28px", textAlign: "center", opacity: flicker }}>CHAMA NO DIRECT</div>
          <div style={{ ...abs(16, 200, 250, 40), fontFamily: FONT, fontSize: 11, fontWeight: 600, color: "#6E6250" }}>Preço? Só no direct. Atendemos seg a sex (às vezes).</div>
        </div>
        {t < T.prof + 0.9 && <img src={ICON3D.web} alt="" style={{ ...abs(W - 120, -14, 130, 130), maxWidth: "none", opacity: 0.9, transform: `translateY(${easeIn(prog(t, T.prof, T.prof + 0.6)) * 320}px) rotate(${prog(t, T.prof, T.prof + 0.6) * 50}deg)` }} />}
        {t < T.prof + 0.9 && <img src={ICON3D.web} alt="" style={{ ...abs(-20, H - 96, 104, 104), maxWidth: "none", opacity: 0.8, transform: `scaleY(-1) translateY(${-easeIn(prog(t, T.prof, T.prof + 0.6)) * 320}px)` }} />}
        <div style={{ position: "absolute", inset: 0, clipPath: `inset(0 ${(1 - wipe) * 100}% 0 0)` }}>
          <ProSite t={t} w={W} h={H} label="Sua loja ✓" glow={1} />
        </div>
        <div style={{ ...abs(12, 10, 92, 24), borderRadius: 12, background: wipe > 0.5 ? C.blue : "#5A4632", color: "#fff", fontFamily: FONT, fontWeight: 800, fontSize: 11.5, lineHeight: "24px", textAlign: "center" }}>SUA LOJA</div>
        {t >= 47.3 && <Stamp t={t} at={47.3} label="PRO" color={MINT} x={W - 92} y={H - 56} />}
      </div>
      {/* concorrente: bonito, brilhando e vendendo */}
      <div style={{ ...abs(20, 506, W, H), borderRadius: 22, overflow: "hidden", boxShadow: `0 0 ${30 + Math.sin(t * 4) * 10}px ${hexA(C.cyan, wipe > 0.5 ? 0.15 : 0.45)}`, transform: `translateX(${(1 - clamp(s)) * 60}px)`, opacity: wipe > 0.5 ? 0.75 : 1 }}>
        <ProSite t={t + 1.3} w={W} h={H} label={`Hoje: R$ ${sales.toLocaleString("pt-BR")}`} glow={1} />
        <div style={{ ...abs(12, 10, 118, 24), borderRadius: 12, background: C.ink, color: "#fff", fontFamily: FONT, fontWeight: 800, fontSize: 11.5, lineHeight: "24px", textAlign: "center" }}>CONCORRENTE</div>
      </div>
      <Emo name="33_inclinado_desconfiado_original" x={290} y={402} size={160} t={t} at={43.3} out={T.prof - 0.15} z={35} />
      <Emo name="35_estrategista_maos_piramide" x={280} y={392} size={175} t={t} at={T.prof + 0.1} out={T.bio - 0.1} z={35} />
      {/* as vendas escorrendo pro concorrente */}
      {Array.from({ length: 6 }, (_, i) => {
        const a = 42.3 + i * 0.13;
        if (t < a || t > a + 0.75) return null;
        const p = easeInOut(prog(t, a, a + 0.75));
        return <img key={i} src={ICON3D.coin} alt="" style={{ ...abs(lerp(120 + i * 40, 300 - i * 20, p), lerp(420, 640, p) - Math.sin(p * Math.PI) * 60, 40, 40), maxWidth: "none", transform: `rotateY(${p * 720}deg)`, filter: "drop-shadow(0 6px 8px rgba(0,0,0,.35))", zIndex: 30 }} />;
      })}
    </div>
  );
}
function BioScene({ t }) {
  if (!inWin(t, T.bio, T.monto + 0.3)) return null;
  const s = pop(t, T.bio, { stiffness: 220, damping: 18 });
  const out = easeIn(prog(t, T.monto, T.monto + 0.3));
  const toPost = easeInOut(prog(t, T.quero, T.quero + 0.35));
  const press = t >= 48.75 && t < 48.9 ? 1 : 0;
  const typed = "EU QUERO".slice(0, clamp(Math.floor((t - 49.96) / 0.06) + 1, 0, 8));
  const sent = t >= 50.55;
  const qs = pop(t, 49.96, { stiffness: 260, damping: 10 });
  return (
    <div style={{ position: "absolute", inset: 0, opacity: clamp(s * 2) * (1 - out), transform: `scale(${lerp(0.9, 1, clamp(s))})` }}>
      <div style={{ ...abs(40, 330, 370, 400), borderRadius: 26, background: "#fff", overflow: "hidden", boxShadow: "0 30px 70px rgba(0,0,0,.4)" }}>
        {/* perfil */}
        <div style={{ position: "absolute", inset: 0, transform: `translateX(${-toPost * 100}%)` }}>
          <div style={{ ...abs(20, 24, 84, 84), borderRadius: "50%", padding: 4, background: GRAD }}>
            <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: "#D1D1D1", overflow: "hidden" }}><img src={EMO["01_neutro_focado"]} alt="" style={{ width: "112%", height: "112%", maxWidth: "none", marginLeft: "-6%", marginTop: "-2%" }} /></div>
          </div>
          <div style={{ ...abs(120, 34, 240, 60), display: "flex", justifyContent: "space-around", fontFamily: FONT, color: C.ink, textAlign: "center", lineHeight: 1.2 }}>
            {[["128", "posts"], ["3,4 mil", "seguidores"], ["180", "seguindo"]].map(([a, b]) => <div key={b}><div style={{ fontWeight: 800, fontSize: 16 }}>{a}</div><div style={{ fontWeight: 600, fontSize: 11, color: C.slate }}>{b}</div></div>)}
          </div>
          <div style={{ ...abs(22, 122, 330, 70), fontFamily: FONT, color: C.ink, lineHeight: 1.35 }}>
            <div style={{ fontWeight: 800, fontSize: 15 }}>Estoke ao Cubo</div>
            <div style={{ fontWeight: 600, fontSize: 12.5, color: C.slate }}>Sites e lojas virtuais que vendem 24h.</div>
          </div>
          <div style={{ ...abs(22, 212, 326, 56), borderRadius: 28, background: GRAD, color: "#fff", ...DISP, fontSize: 22, lineHeight: "56px", textAlign: "center", boxShadow: `0 0 ${18 + Math.sin(t * 8) * 10}px ${hexA(C.cyan, 0.6)}`, transform: `scale(${(1 + Math.sin(t * 8) * 0.02) * (press ? 0.94 : 1)})` }}>LINK NA BIO</div>
          <div style={{ ...abs(22, 290, 326, 90), display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 4 }}>
            {[0, 1, 2].map((i) => <div key={i} style={{ borderRadius: 6, background: [GRAD, C.ink, C.blue][i] }} />)}
          </div>
        </div>
        {/* post com comentário */}
        <div style={{ position: "absolute", inset: 0, transform: `translateX(${(1 - toPost) * 100}%)` }}>
          <div style={{ ...abs(0, 0, 370, 250), background: `radial-gradient(circle at 50% 45%, ${C.blue}, ${C.night})`, display: "grid", placeItems: "center" }}><CubeLogo size={96} glow={1} /></div>
          <div style={{ ...abs(16, 262, 340, 36), display: "flex", gap: 18, alignItems: "center" }}>
            <svg viewBox="0 0 24 24" width="28" height="28"><path d="M12 21s-8-5.2-8-11a4.6 4.6 0 0 1 8-3 4.6 4.6 0 0 1 8 3c0 5.8-8 11-8 11z" fill="none" stroke={C.ink} strokeWidth="2" /></svg>
            <svg viewBox="0 0 24 24" width="30" height="30" style={{ transform: `scale(${1 + Math.max(0, Math.sin(t * 9)) * 0.15})` }}><path d="M4 12a8 8 0 1 1 4 6.9L3 20l1.3-4.4A8 8 0 0 1 4 12z" fill={hexA(C.cyan, 0.25)} stroke={C.blue} strokeWidth="2.2" strokeLinejoin="round" /></svg>
            <svg viewBox="0 0 24 24" width="26" height="26"><path d="M3 11 L21 4 L14 21 L11 13 Z" fill="none" stroke={C.ink} strokeWidth="2" strokeLinejoin="round" /></svg>
          </div>
          {sent && <div style={{ ...abs(16, 304, 300, 26), fontFamily: FONT, fontSize: 13, color: C.ink, transform: `scale(${Math.min(pop(t, 50.55), 1.05)})`, transformOrigin: "0 50%" }}><b>voce</b> eu quero</div>}
          <div style={{ ...abs(14, 344, 342, 40), borderRadius: 20, border: `2px solid ${typed ? C.blue : "#DADFE8"}`, fontFamily: FONT, fontWeight: 700, fontSize: 13.5, color: typed && !sent ? C.ink : "#9AA6B8", lineHeight: "36px", paddingLeft: 14 }}>{sent ? "Adicione um comentário..." : typed || "Adicione um comentário..."}</div>
        </div>
      </div>
      {/* "EU QUERO" pulsando em destaque */}
      {t >= 49.9 && (
        <div style={{ ...abs(0, 234, 450, 84), textAlign: "center", ...DISP, fontSize: 64, lineHeight: "84px", ...gradLight, transform: `scale(${lerp(0.5, 1, clamp(qs)) * (1 + Math.sin(t * 9) * 0.04)})`, opacity: clamp(qs * 3), filter: `drop-shadow(0 0 ${14 + Math.sin(t * 9) * 8}px ${hexA(C.cyan, 0.55)})` }}>EU QUERO</div>
      )}
      {/* mãozinha: clica no link e depois aponta o comentário */}
      {t < T.quero ? (
        <Point x={lerp(380, 232, easeInOut(prog(t, 48.42, 48.72)))} y={lerp(800, 560, easeInOut(prog(t, 48.42, 48.72)))} press={press} />
      ) : (
        <Point x={lerp(232, 90, easeInOut(prog(t, T.quero, T.quero + 0.35)))} y={lerp(560, 612, easeInOut(prog(t, T.quero, T.quero + 0.35))) + Math.sin(t * 9) * 8} />
      )}
      <Emo name="36_impactado_segurando_coracao" x={268} y={560} size={180} t={t} at={50.0} out={T.monto - 0.05} z={42} />
      <Ripple x={262} y={570} t={t} at={48.75} />
    </div>
  );
}
function Brand({ t }) {
  if (t < T.monto || t > T.sai + 0.3) return null;
  const s = pop(t, 51.38, { stiffness: 200, damping: 13 });
  const out = easeIn(prog(t, T.sai - 0.05, T.sai + 0.25));
  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - out }}>
      <EmoAnim name="03_virada_dramatica_180_sorriso" x={115} y={232} size={220} t={t} at={T.monto} />
      <div style={{ ...abs(0, 470, 450, 260), display: "flex", flexDirection: "column", alignItems: "center", transform: `scale(${lerp(0.4, 1, clamp(s))})`, opacity: clamp(s * 2) }}>
        <CubeLogo size={96} glow={1.2} />
        <div style={{ ...DISP, fontSize: 32, color: "#fff", marginTop: 14 }}>ESTOKE AO CUBO</div>
        <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 16, color: C.ice, marginTop: 6 }}>Sites e lojas virtuais que vendem.</div>
      </div>
    </div>
  );
}
function Sai({ t }) {
  if (t < T.sai) return null;
  const words = [["SAI", 53.84, 92], ["DO", 54.02, 92], ["AMADORISMO.", 54.16, fitSize("AMADORISMO.", 400, 80)]];
  const ls = pop(t, 54.5, { stiffness: 220, damping: 15 });
  return (
    <>
      <div style={{ ...abs(0, 236, 450, 290), display: "flex", flexDirection: "column", alignItems: "center", zIndex: 55 }}>
        {words.map(([w, at, size], i) => {
          if (t < at) return null;
          const s = pop(t, at, { stiffness: 480, damping: 15 });
          return <div key={i} style={{ ...DISP, fontSize: size, lineHeight: 1.02, ...(i === 2 ? gradLight : { color: "#fff" }), transform: `scale(${lerp(1.7, 1, clamp(s))})`, opacity: clamp(s * 3) }}>{w}</div>;
        })}
      </div>
      <EmoAnim name="06_piscadinha_wink_charme" x={30} y={520} size={200} t={t} at={54.3} z={55} />
      <div style={{ ...abs(226, 580, 200, 140), display: "flex", flexDirection: "column", alignItems: "center", gap: 8, zIndex: 55, transform: `scale(${lerp(0.5, 1, clamp(ls))})`, opacity: clamp(ls * 2) }}>
        <CubeLogo size={64} glow={1} />
        <div style={{ ...DISP, fontSize: 17, color: "#fff", whiteSpace: "nowrap" }}>ESTOKE AO CUBO</div>
      </div>
    </>
  );
}

/* ---------------- quadro ---------------- */
function Frame({ t }) {
  const light = (() => {
    if (t < 22.95) return 0;
    if (t < 23.4) return easeInOut(prog(t, 22.95, 23.4));
    if (t < T.compare) return 1;
    return 1 - easeInOut(prog(t, T.compare, T.compare + 0.35));
  })();
  const shakes = [shakeAt(t, T.nada, 6), shakeAt(t, T.ano, 10, 0.45), shakeAt(t, T.sai, 6), shakeAt(t, 54.16, 8)];
  const sx = shakes.reduce((a, s) => a + s[0], 0);
  const sy = shakes.reduce((a, s) => a + s[1], 0);
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: C.night, fontFamily: FONT }}>
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(120% 70% at 50% 40%, #0E2147 0%, ${C.night} 70%)` }} />
      {light > 0 && (
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(110% 70% at 50% 35%, #FFFFFF 0%, ${C.paper} 55%, ${C.mist} 100%)`, clipPath: t < T.compare ? `circle(${light * 120}% at 50% 48%)` : "none", opacity: t >= T.compare ? light : 1 }} />
      )}
      <div style={{ position: "absolute", inset: 0, transform: `translate(${sx}px, ${sy}px)` }}>
        <HookPhone t={t} />
        <HookExtras t={t} />
        <SiteScene t={t} />
        <FlowScene t={t} />
        <SleepScene t={t} />
        <CompareScene t={t} />
        <BioScene t={t} />
        <Brand t={t} />
        <Nada t={t} />
        <Pleno t={t} />
        <Sai t={t} />
        <Captions t={t} />
      </div>
      <Grain t={t} opacity={light > 0.5 ? 0.03 : 0.05} />
    </div>
  );
}

/* =============================================================================
   Som — narração por cima de tudo, trilha baixa por baixo (some nos "Nada." e no fim),
   e efeitos gravados em cada ação (sons de interface baixos, impactos nos gigantes).
============================================================================= */
const SAMPLES = { vo: VO_SITE.voSite, music: MUSIC_OXI.oxiMusic, ...SFX, ...SFXV };
const PEAK = { ...SFX_PEAK, ...SFXV_PEAK };
function buildEvents() {
  const ev = [];
  const fx = (at, name, gain, opts = {}) => ev.push({ t: Math.max(0, at - PEAK[name] / (opts.rate || 1)), fn: (A, w) => A.sample(name, w, { gain, ...opts }) });
  const at0 = (at, name, gain, opts = {}) => ev.push({ t: at, fn: (A, w) => A.sample(name, w, { gain, ...opts }) });
  ev.push({ t: 0, dur: 55.07, fn: (A, w, off = 0) => A.sample("vo", w, { off, dur: 55.07 - off, gain: 1 }) });
  ev.push({
    t: 0, dur: DURATION,
    fn: (A, w, off = 0) => A.sample("music", w, {
      off, dur: DURATION - off, gain: 0.13, fadeIn: 0.3,
      env: [[0, 1], [9.6, 1], [9.75, 0.15], [10.6, 0.15], [10.9, 1], [15.85, 1], [15.95, 0.4], [17.9, 0.4], [18.1, 1], [53.7, 1], [53.9, 1.3], [54.6, 1.3], [DURATION, 0]],
    }),
  });
  // gancho
  fx(0.05, "switchTap", 0.12);
  [2.3, 2.75, 3.25, 3.6].forEach((a, i) => at0(a, "shutter", 0.18, { rate: [1, 1.05, 0.97, 1.08][i] }));
  fx(T.story, "airSweep", 0.1);
  fx(5.85, "boing", 0.14);
  fx(T.search, "smallSweep", 0.08);
  at0(6.75, "typing", 0.22, { dur: 1.6 });
  fx(T.go, "mouseClick", 0.18);
  fx(T.nada, "deepHit", 0.2);
  at0(9.85, "crickets", 0.5, { dur: 1.2, fadeIn: 0.05, fadeOut: 0.25 });
  // direct
  fx(T.dm, "airWhoosh", 0.1);
  BUBBLES.forEach(([a], i) => fx(a, "bubblePop", 0.12, { rate: [1, 1.06, 0.92, 1.1, 1][i] }));
  fx(T.pleno, "glitch", 0.08);
  fx(T.ano, "zoomImpact", 0.2);
  fx(T.ano, "deepHit", 0.18);
  fx(18.1, "lightPop", 0.05);
  fx(20.4, "alertBeep", 0.05);
  fx(22.3, "dryPop", 0.07);
  // solução
  fx(23.0, "windSwoosh", 0.12);
  fx(23.2, "sparkleSweep", 0.07);
  [23.35, 23.65, 23.73, 23.81, 23.89].forEach((a, i) => fx(a, "lightPop", 0.04, { rate: 1 + i * 0.05 }));
  [25.5, 25.7, 25.9].forEach((a, i) => fx(a, "bubblePop", 0.06, { rate: 1.1 + i * 0.08 }));
  fx(T.robo, "techSlide", 0.1);
  STAMPS.forEach((a) => fx(a, "hardPop", 0.14));
  at0(T.h24 + 0.05, "tick", 0.2, { dur: 1.85, fadeOut: 0.2 });
  [31.3, 32.5, 34.2].forEach((a) => fx(a, "marker", 0.08));
  fx(T.flow, "airSweep", 0.1);
  fx(35.35, "mouseClick", 0.16);
  fx(35.8, "smallSweep", 0.06);
  fx(36.85, "bubblePop", 0.1);
  fx(37.2, "bubblePop", 0.1, { rate: 1.1 });
  fx(37.75, "airSweep", 0.08, { rate: 1.3 });
  fx(38.2, "confirm", 0.1);
  fx(38.55, "mouseClick", 0.16);
  fx(38.62, "coinWin", 0.28);
  fx(38.66, "coins", 0.16);
  fx(38.62, "partyHorn", 0.06);
  fx(T.sleep, "windSwoosh", 0.08);
  at0(39.75, "snore", 0.22, { dur: 1.6, fadeOut: 0.3 });
  [39.6, 40.1, 40.6, 41.0].forEach((a, i) => fx(a, "bell", 0.06, { rate: 1 + i * 0.04 }));
  // CTA
  fx(T.compare, "airWhoosh", 0.1);
  [42.3, 42.43, 42.56, 42.69].forEach((a) => fx(a, "coins", 0.05, { dur: 0.3 }));
  fx(T.prof, "sparkleSweep", 0.1);
  fx(46.0, "glitchBreak", 0.06);
  fx(47.3, "hardPop", 0.14);
  fx(T.bio, "airSweep", 0.08);
  fx(48.75, "mouseClick", 0.18);
  fx(T.quero, "smallSweep", 0.07);
  at0(49.96, "typing", 0.18, { dur: 0.5 });
  fx(49.96, "lightPop", 0.08);
  fx(50.55, "positive", 0.08);
  fx(51.38, "logoImpact", 0.12);
  fx(51.38, "sparkleTouch", 0.08);
  fx(T.sai, "zoomImpact", 0.16);
  fx(54.16, "deepHit", 0.18);
  return ev.sort((a, b) => a.t - b.t);
}
const EVENTS = buildEvents();
const renderWav = () => renderEventsWav(EVENTS, DURATION, { samples: SAMPLES });

// Usado pelo exportador de vídeo (scripts/export-video.cjs)
const MOTION = { Frame, duration: DURATION, formats: FORMATS, renderWav };

export default function OxigenioAd() {
  return (
    <MotionPlayer Frame={Frame} duration={DURATION} events={EVENTS} formats={FORMATS} defaultFormat="9x16" renderWav={renderWav} samples={SAMPLES}
      fontsToLoad={[`800 16px "Open Sauce Sans"`]}
      scenes={[
        { name: "Gancho", from: 0 },
        { name: "Google", from: T.search },
        { name: "Direct", from: T.dm },
        { name: "2026", from: T.pleno },
        { name: "Site", from: T.site },
        { name: "Robô 24h", from: T.robo },
        { name: "Compra", from: T.flow },
        { name: "Dormindo", from: T.sleep },
        { name: "Comparativo", from: T.compare },
        { name: "CTA", from: T.bio },
        { name: "Logo", from: T.monto },
      ]} />
  );
}
