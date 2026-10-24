#!/usr/bin/env python3
"""Edição dinâmica da navegação no site da Roda Cultural do CDC (captura de tela do Opera).

Pega a gravação (zip na raiz do repositório) e gera:
  dist/roda-cultural-site-16x9.mp4   1920×1080, 30fps
  dist/roda-cultural-site-9x16.mp4   1080×1920, 30fps (o 16:9 no meio, título em cima, crédito embaixo)

Como a edição funciona:
  - Rolagem: as paradas da captura passam a 6×, a rolagem a ~1,6×, com motion blur
    (média dos quadros que cada quadro de saída atravessa) e um whoosh por trecho.
  - Seções: em cada parada importante a câmera dá um zoom com impacto (pop, flash e
    tremida) num ponto da seção. Seções com 2 etapas fazem um pan ou um segundo zoom.
  - Batida: a trilha é o beat "DISTANCE" a partir do retorno do beat (67,28s da faixa),
    que cai na primeira rolagem. A duração de cada rolagem é esticada ou encolhida para
    que o zoom da seção seguinte comece exatamente num kick da música.
  - Fim: rewind de fita do rodapé até o topo e um card "site por Estoke ao Cubo".

Uso: python3 roda-cultural/edit.py   (precisa de ffmpeg; baixa os efeitos da Mixkit)
Efeitos: Mixkit Sound Effects Free License (uso comercial, sem atribuição) e os efeitos
analógicos do repositório. Música: "DISTANCE" (licenciada pelo usuário, já usada no projeto).
"""
import base64, glob, io, math, os, re, subprocess, tempfile, urllib.request, zipfile
from functools import lru_cache
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont
from scipy.signal import find_peaks, stft

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ZIP = glob.glob(os.path.join(ROOT, "Roda Cultural do CDC*.zip"))[0]
MUSIC = os.path.join(ROOT, "TRAP TYPE BEAT - _DISTANCE_ _ FREESTYLE BEAT _ HARD TYPE BEAT _ FREE RAP INSTRUMENTAL 2026 [zuHucgfzkoA].mp3")
MUSIC_DROP = 67.28  # o beat volta depois do break
TAPE_DIR = os.path.join(ROOT, "Efeitos Analógicos (15)")
FPS = 30
W, H = 1920, 1080
SR = 48000
LIME = (212, 255, 58)
PINK = (230, 25, 90)

# Seções: (trecho da captura, etapas). Etapa: ((cx, cy) normalizados, zoom, segura mínimo, som)
HERO = dict(src=(0.5, 2.4), dur=2.0)
STOPS = [
    ((6.45, 6.62), [((0.50, 0.33), 1.40, 0.75, "pop")]),                                   # O que rola na roda
    ((8.32, 9.30), [((0.30, 0.55), 1.60, 0.45, "pop"), ((0.70, 0.55), 1.60, 0.60, "sweep")]),  # Hall da fama
    ((11.02, 11.28), [((0.33, 0.62), 1.60, 0.80, "pop")]),                                 # Próxima edição · quinta 29/10
    ((13.30, 13.57), [((0.50, 0.42), 1.30, 0.90, "hit")]),                                 # Manifesto
    ((14.75, 14.97), [((0.27, 0.50), 1.50, 0.45, "pop"), ((0.73, 0.50), 1.50, 0.55, "sweep")]),  # Galeria bruta
    ((16.88, 17.10), [((0.50, 0.60), 1.60, 0.70, "pop")]),                                 # Apoie nossos MCs
    ((18.55, 18.56), [((0.50, 0.68), 1.35, 0.55, "pop"), ((0.334, 0.77), 2.40, 0.85, "sparkle")]),  # Quem fecha · Estoke ao Cubo
    ((19.15, 19.48), [((0.50, 0.72), 1.40, 0.80, "hit")]),                                 # Quer rimar? Cola na roda
    ((22.00, 22.01), [((0.50, 0.45), 1.25, 0.70, "pop"), ((0.497, 0.895), 3.00, 1.10, "credit")]),  # Rodapé · crédito
]
SCROLLS = [(4.85, 6.45), (6.62, 8.32), (9.30, 11.02), (11.28, 13.30), (13.57, 14.75), (14.97, 16.88), (17.10, 18.55), (18.56, 19.15), (19.48, 20.90)]
REWIND = dict(src=(20.7, 4.9), dur=1.2)
END = dict(src=29.5, dur=2.7)

SFX_IDS = {"airWhoosh": 1489, "windSwoosh": 1468, "zoomImpact": 772, "deepHit": 498, "lightPop": 3005, "hardPop": 2364,
           "sparkle": 3083, "logoImpact": 2902, "smallSweep": 166, "airSweep": 168}


def ease(p, kind):
    p = min(1.0, max(0.0, p))
    if kind == "out":
        return 1 - (1 - p) ** 3
    if kind == "back":  # passa um pouco e volta (zoom com punch)
        c = 1.9
        return 1 + (c + 1) * (p - 1) ** 3 + c * (p - 1) ** 2
    return 4 * p ** 3 if p < 0.5 else 1 - (-2 * p + 2) ** 3 / 2


def music_kicks():
    a = decode(MUSIC, MUSIC_DROP - 4, 60, mono=True, sr=22050)
    f, _, Z = stft(a, 22050, nperseg=1024, noverlap=768)
    low = np.log1p(np.abs(Z[f < 150]) * 50).sum(0)
    env = np.maximum(0, np.diff(low))
    pk, _ = find_peaks(env, height=np.percentile(env, 98), distance=int(22050 / 256 * 0.2))
    return [MUSIC_DROP - 4 + p * 256 / 22050 for p in pk]


def decode(path, start=0.0, dur=None, mono=False, sr=SR):
    cmd = ["ffmpeg", "-v", "error", "-ss", str(start)] + (["-t", str(dur)] if dur else []) + ["-i", path, "-ac", "1" if mono else "2", "-ar", str(sr), "-f", "f32le", "-"]
    a = np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, np.float32)
    return a if mono else a.reshape(-1, 2)


class Plan:
    """Linha do tempo de saída: quadros (fonte, blur), chaves de câmera, impactos e sons."""

    def __init__(self, moving, kicks_out):
        self.frames, self.keys, self.hits, self.sfx = [], [], [], []
        self.moving, self.kicks = moving, kicks_out
        self.t = 0.0

    def key(self, t, z, cx, cy, e="inout"):
        self.keys.append((t, z, cx, cy, e))

    def hold(self, src_a, src_b, dur):
        n = round(dur * FPS)
        for i in range(n):
            self.frames.append((src_a + (src_b - src_a) * i / max(1, n - 1), 0.0))
        self.t += n / FPS

    def next_kick(self, t, lo=0.0):
        return next((k for k in self.kicks if k >= t + lo - 0.04), t + lo)

    def scroll(self, a, b, end_on_kick=True):
        speed = lambda s: 1.6 if self.moving[min(len(self.moving) - 1, int(s * FPS))] else 6.0
        nat = sum((1 / FPS) / speed(a + i / FPS) for i in range(int((b - a) * FPS)))
        stretch = 1.0
        if end_on_kick:
            cands = [k for k in self.kicks if self.t + 0.7 * nat <= k <= self.t + 1.45 * nat]
            if cands:
                k = min(cands, key=lambda k: abs(k - self.t - nat))
                stretch = (k - self.t) / nat
        t0, s = self.t, a
        z = 1.08
        self.key(t0 + 0.32, z, 0.5, 0.5, "inout")
        self.sfx.append((t0, "airWhoosh" if len(self.sfx) % 2 else "airSweep", 0.55))
        target = t0 + nat * stretch
        while s < b and self.t < target - 0.5 / FPS:
            rate = speed(s) / stretch
            s += rate / FPS
            self.frames.append((min(s, b), rate / FPS))
            self.t += 1 / FPS
        return self.t

    def stop(self, src, stages):
        t = self.t
        starts = []
        for i, (_, _, mn, _) in enumerate(stages):
            starts.append(t)
            t = self.next_kick(t, mn) if i < len(stages) - 1 else t + mn
        end = t
        for (c, z, mn, snd), st in zip(stages, starts):
            first = st == starts[0]
            self.key(st, *self.keys[-1][1:4], "inout") if not first else None
            self.key(st + (0.32 if snd != "sweep" else 0.45), z, c[0], c[1], "back" if snd != "sweep" else "inout")
            self.hits.append((st, 0 if snd == "sweep" else (1.6 if snd in ("hit", "credit") else 1.0)))
            self.sfx += {"pop": [(st, "hardPop", 0.8), (st, "lightPop", 0.5)], "sweep": [(st, "smallSweep", 0.55)],
                         "hit": [(st, "deepHit", 0.9), (st, "hardPop", 0.6)], "sparkle": [(st, "zoomImpact", 0.7), (st + 0.1, "sparkle", 0.6)],
                         "credit": [(st, "zoomImpact", 0.9), (st + 0.12, "sparkle", 0.7)]}[snd]
        last = self.keys[-1]
        self.key(end, last[1] * 1.04, last[2], last[3], "inout")
        self.hold(src[0], src[1], end - self.t)


def build_plan(moving, kicks):
    p = Plan(moving, kicks)
    # abertura: fechado no título, empurra devagar e abre de uma vez no drop
    p.key(0, 1.26, 0.5, 0.31, "inout"); p.key(1.35, 1.34, 0.5, 0.31, "inout"); p.key(HERO["dur"], 1.0, 0.5, 0.5, "inout")
    p.sfx += [(0.0, "deepHit", 0.9), (1.4, "windSwoosh", 0.75)]
    p.hits.append((0.0, 1.2))
    p.hold(*HERO["src"], HERO["dur"])
    p.hits.append((p.t, 1.4)); p.sfx.append((p.t, "zoomImpact", 0.75))
    for (a, b), (src, stages) in zip(SCROLLS, STOPS):
        p.key(p.t, *p.keys[-1][1:4], "inout")
        p.scroll(a, b)
        p.stop(src, stages)
    # rewind de fita até o topo
    t0 = p.t
    p.key(t0, *p.keys[-1][1:4], "inout"); p.key(t0 + 0.25, 1.12, 0.5, 0.5, "out")
    p.sfx.append((t0 - 0.05, "rewindKick", 1.0))
    n = round(REWIND["dur"] * FPS)
    a, b = REWIND["src"]
    for i in range(n):
        s = a + (b - a) * ease(i / (n - 1), "inout")
        p.frames.append((s, abs(b - a) / n * 1.4))
    p.t += n / FPS
    p.key(p.t, 1.35, 0.5, 0.36, "inout"); p.key(p.t + 0.7, 1.0, 0.5, 0.5, "out")
    p.hits.append((p.t, 1.3)); p.sfx.append((p.t, "zoomImpact", 0.8))
    p.end_at = p.t + 0.55
    p.sfx.append((p.end_at, "logoImpact", 0.75))
    p.hold(END["src"], END["src"], END["dur"])
    return p


def cam_at(keys, t):
    if t <= keys[0][0]:
        return keys[0][1:4]
    for (ta, za, xa, ya, _), (tb, zb, xb, yb, e) in zip(keys, keys[1:]):
        if ta <= t <= tb:
            q = ease((t - ta) / max(1e-6, tb - ta), e)
            return za + (zb - za) * q, xa + (xb - xa) * q, ya + (yb - ya) * q
    return keys[-1][1:4]


@lru_cache(maxsize=48)
def src_frame(i, fdir, n):
    i = max(1, min(n, i))
    return np.asarray(Image.open(os.path.join(fdir, f"{i:05d}.jpg")).convert("RGB"), np.float32)


def blended(s, span, fdir, n):
    k = max(1, min(6, round(span * FPS)))
    idx = [round((s - span * j / k) * FPS) + 1 for j in range(k)] if k > 1 else [round(s * FPS) + 1]
    return sum(src_frame(i, fdir, n) for i in idx) / len(idx)


def font(path, size):
    return ImageFont.truetype(path, size)


def brand_fonts(tmp):
    css = open(os.path.join(ROOT, "src", "brandAssets.js")).read()
    m = re.search(r"font-family:'EAC Display';src:url\(data:font/woff2;base64,([A-Za-z0-9+/=]+)\)", css)
    disp = os.path.join(tmp, "eac-display.woff2")
    open(disp, "wb").write(base64.b64decode(m.group(1)))
    return disp, os.path.join(ROOT, "assets", "open-sauce-sans-latin-700-normal.woff2")


def end_card(img, p, fonts, logo, vertical):
    """Card final por cima do topo do site: escurece, entra a logo e o crédito."""
    if p <= 0:
        return img
    w, h = img.size
    k = min(1, p * 2.5)
    soft = img.filter(ImageFilter.GaussianBlur(int(4 + 14 * k)))
    img = Image.blend(img, Image.blend(soft, Image.new("RGB", img.size, (8, 8, 10)), 0.72), k)
    d = ImageDraw.Draw(img)
    pop = ease(p * 2.2, "back")
    u = h / 1080 if not vertical else 1.25
    ls = int(210 * u * max(0.01, pop))
    cy = h * (0.36 if not vertical else 0.42)
    if ls > 4:
        lg = logo.resize((int(ls * 0.908), ls), Image.LANCZOS)
        img.paste(lg, (w // 2 - lg.width // 2, int(cy - ls / 2)), lg)
    q = ease((p - 0.18) * 3, "out")
    if q > 0:
        y0 = cy + 140 * u + (1 - q) * 30
        f0 = font(fonts[1], int(30 * u)); f1 = font(fonts[0], int(84 * u)); f2 = font(fonts[1], int(40 * u))
        rows = (("SITE POR", f0, (200, 200, 205), 0), ("ESTOKE AO CUBO", f1, (255, 255, 255), 44 * u), ("@estokeaocubo", f2, LIME, 150 * u))
        if vertical:
            rows = (("SITE POR", f0, (200, 200, 205), 0), ("ESTOKE", f1, (255, 255, 255), 44 * u), ("AO CUBO", f1, (255, 255, 255), 140 * u), ("@estokeaocubo", f2, LIME, 250 * u))
        layer = Image.new("RGBA", img.size, (0, 0, 0, 0)); ld = ImageDraw.Draw(layer)
        for txt, f, col, dy in rows:
            ld.text((w / 2 - ld.textlength(txt, font=f) / 2, y0 + dy), txt, font=f, fill=col + (int(255 * q),))
        img.paste(layer, (0, 0), layer)
    return img


def vertical(frame16, t, fonts, title_in):
    """9:16: o quadro 16:9 no meio, fundo desfocado, título em cima e crédito embaixo."""
    bg = frame16.resize((192, 108), Image.BILINEAR).crop((96 - 30, 0, 96 + 31, 108)).resize((1080, 1920), Image.BILINEAR)
    bg = bg.filter(ImageFilter.GaussianBlur(28))
    bg = Image.blend(bg, Image.new("RGB", bg.size, (6, 6, 8)), 0.62)
    fg = frame16.resize((1080, 608), Image.LANCZOS)
    bg.paste(fg, (0, 656))
    d = ImageDraw.Draw(bg)
    d.rectangle((0, 652, 1080, 655), fill=PINK); d.rectangle((0, 1264, 1080, 1267), fill=PINK)
    q = ease(title_in, "out")
    if q > 0:
        f1 = font(fonts[0], 74); f2 = font(fonts[1], 34); f3 = font(fonts[1], 30)
        layer = Image.new("RGBA", bg.size, (0, 0, 0, 0)); ld = ImageDraw.Draw(layer)
        a = int(255 * q); dy = int((1 - q) * 24)
        for txt, f, col, y in (("RODA CULTURAL", f1, (255, 255, 255), 400), ("DO CDC", f1, LIME, 486), ("batalha de rima · toda quinta · petrópolis", f2, (220, 220, 225), 590)):
            ld.text((540 - ld.textlength(txt, font=f) / 2, y + dy), txt, font=f, fill=col + (a,))
        txt = "site por @estokeaocubo"
        ld.text((540 - ld.textlength(txt, font=f3) / 2, 1330 - dy), txt, font=f3, fill=(200, 200, 205, int(a * 0.9)))
        bg.paste(layer, (0, 0), layer)
    return bg


def render_audio(plan, tmp, dur):
    out = np.zeros((int(dur * SR) + SR, 2), np.float32)
    m = decode(MUSIC, MUSIC_DROP - HERO["dur"], dur)
    fade = np.ones(len(m)); nf = int(0.9 * SR); fade[-nf:] = np.linspace(1, 0, nf)
    out[: len(m)] += m * 0.8 * fade[:, None]
    cache = {}
    for t, name, gain in plan.sfx:
        if name not in cache:
            if name == "rewindKick":
                path = os.path.join(TAPE_DIR, "Speed Rewind Kick.wav")
            else:
                path = os.path.join(tmp, f"{name}.wav")
                urllib.request.urlretrieve(f"https://assets.mixkit.co/active_storage/sfx/{SFX_IDS[name]}/{SFX_IDS[name]}.wav", path)
            a = decode(path)
            cache[name] = a / max(1e-6, np.abs(a).max()) * 0.6
        a = cache[name]
        i = int(max(0, t) * SR)
        n = min(len(a), len(out) - i)
        out[i : i + n] += a[:n] * gain
    out = out[: int(dur * SR)]
    path = os.path.join(tmp, "mix.wav")
    import wave
    pcm = (np.clip(out, -1, 1) * 32767).astype("<i2")
    with wave.open(path, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
    return path


def main():
    tmp = tempfile.mkdtemp(prefix="roda-")
    with zipfile.ZipFile(ZIP) as z:
        name = [n for n in z.namelist() if n.endswith(".mp4")][0]
        cap = os.path.join(tmp, "cap.mp4")
        open(cap, "wb").write(z.read(name))
    fdir = os.path.join(tmp, "fr"); os.makedirs(fdir)
    subprocess.run(["ffmpeg", "-v", "error", "-i", cap, "-vf", f"fps={FPS}", "-q:v", "2", os.path.join(fdir, "%05d.jpg")], check=True)
    n = len(os.listdir(fdir))
    # quadros em movimento (rolagem) x parados, pela diferença entre quadros em baixa resolução
    small = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", cap, "-vf", f"fps={FPS},scale=160:90,format=gray", "-f", "rawvideo", "-"], capture_output=True, check=True).stdout, np.uint8).reshape(-1, 90, 160).astype(np.float32)
    diff = np.r_[0, np.abs(np.diff(small, axis=0)).mean((1, 2))]
    moving = diff > 1.0
    moving = np.convolve(moving, np.ones(3), "same") > 0
    kicks = [k - (MUSIC_DROP - HERO["dur"]) for k in music_kicks()]
    plan = build_plan(moving, [k for k in kicks if k >= HERO["dur"] - 0.01])
    dur = len(plan.frames) / FPS
    print(f"duração {dur:.2f}s · {len(plan.frames)} quadros")
    fonts = brand_fonts(tmp)
    logo = Image.open(os.path.join(ROOT, "assets", "cube-logo.png")).convert("RGBA")
    wav = render_audio(plan, tmp, dur)
    outs = {}
    for tag, (ow, oh) in {"16x9": (W, H), "9x16": (1080, 1920)}.items():
        dst = os.path.join(ROOT, "dist", f"roda-cultural-site-{tag}.mp4")
        outs[tag] = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{ow}x{oh}", "-r", str(FPS), "-i", "-", "-i", wav,
                                      "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-profile:v", "high",
                                      "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-shortest", "-movflags", "+faststart", dst], stdin=subprocess.PIPE)
    for fi, (s, span) in enumerate(plan.frames):
        t = fi / FPS
        z, cx, cy = cam_at(plan.keys, t)
        # tremida e flash curtos em cada impacto
        sx = sy = fl = 0.0
        for ht, amp in plan.hits:
            dt = t - ht
            if 0 <= dt < 0.3 and amp:
                k = (1 - dt / 0.3) ** 2 * amp
                sx += math.sin(dt * 90 + ht) * 9 * k; sy += math.cos(dt * 77 + ht) * 7 * k
                fl = max(fl, 0.1 * k * (1 if dt < 0.07 else 0))
        arr = blended(s, span, fdir, n)
        img = Image.fromarray(arr.clip(0, 255).astype(np.uint8))
        cw, ch = W / z, H / z
        x0 = min(max(cx * W - cw / 2 + sx / z, 0), W - cw); y0 = min(max(cy * H - ch / 2 + sy / z, 0), H - ch)
        img = img.resize((W, H), Image.BICUBIC, box=(x0, y0, x0 + cw, y0 + ch))
        if fl > 0:
            img = Image.blend(img, Image.new("RGB", img.size, (255, 255, 255)), min(0.5, fl))
        ep = (t - plan.end_at) / 1.2
        v = vertical(img, t, fonts, min(1, t / 0.5) if t < plan.end_at else max(0, 1 - (t - plan.end_at) * 4))
        img16 = end_card(img, ep, fonts, logo, False)
        if ep > 0:
            v = end_card(v, ep, fonts, logo, True)
        outs["16x9"].stdin.write(img16.tobytes())
        outs["9x16"].stdin.write(v.tobytes())
        if fi % 60 == 0:
            print(f"{t:5.1f}s", flush=True)
    for p in outs.values():
        p.stdin.close(); p.wait()
    print("ok", [os.path.relpath(os.path.join(ROOT, "dist", f"roda-cultural-site-{k}.mp4"), ROOT) for k in outs])


if __name__ == "__main__":
    main()
