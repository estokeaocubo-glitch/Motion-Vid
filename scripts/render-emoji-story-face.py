#!/usr/bin/env python3
"""Anima o rosto do motion "Tem site?" (EmojiStoryAd) com a engine 3D do Emoji Primordial.

Em vez de trocar imagens paradas, cada quadro é esculpido pelo PrimordialFaceSculptor:
  - entre uma cena e outra, TODOS os parâmetros (sobrancelhas, pálpebras, olhar, cantos e
    abertura da boca, inclinação da cabeça, blush) são interpolados em 0,42s, então a
    expressão se transforma de verdade, com uma piscada e um leve mergulho de cabeça no meio;
  - dentro da cena o rosto vive: piscadas naturais, olhar com micro-movimento, balanço da
    cabeça e um aceno pequeno em cada batida do "BAILAR"; nas falas a boca fala (visemas).
Cada quadro passa pelo mesmo recorte limpo dos posts (maior peça + contorno suavizado + cor
da borda puxada de dentro), então não sobra fio branco, e o vídeo sai com transparência:
  dist/media/tem-site-emoji-face.webm (VP9 com alfa, 480×480, 30fps)
Os tempos das cenas espelham SCENES em src/EmojiStoryAd.jsx.
Uso: python3 scripts/render-emoji-story-face.py   (opencv-python-headless, numpy, scipy, Pillow)
"""
import importlib.util, math, os, shutil, subprocess, tempfile
from multiprocessing import Pool
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENG_DIR = os.path.join(ROOT, "EMOJI_PRIMORDIAL", "05_ENGINE_E_FONTES_MESTRES")
OUT = os.path.join(ROOT, "dist", "media", "tem-site-emoji-face.webm")
FPS, DURATION, SIZE = 30, 21.5, 480
BAR = lambda n: 2.02 + 2 * n


def load(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


VAR = load("variacoes", os.path.join(ENG_DIR, "gerar_variacoes_3d.py"))
RECIPES = {n: dict(p) for n, _, p in VAR.VARIACOES + VAR.CARICATAS}

# (início, receita, falando de..até) — mesmo roteiro de SCENES no JSX
SCENES = [
    (0.0, "53_tedio_total", None),
    (BAR(0), "57_choque_extremo", None),
    (BAR(1), "62_sorriso_forcado", (BAR(1) + 0.35, BAR(1) + 1.45)),
    (BAR(2), "61_quase_chorando", None),
    (BAR(3), "54_julgando_de_lado", None),
    (BAR(4), "52_teve_ideia", None),
    (BAR(5), "47_confiante_olhar_firme", None),
    (BAR(6), "63_sonolento", None),
    (BAR(6) + 1.0, "56_derretido_apaixonado", None),
    (BAR(7), "64_nariz_empinado", None),
]
MORPH = 0.42
NUM = ["smile_mix", "smirk_dir", "gaze_x", "gaze_y", "blink_l", "blink_r", "eye_scale", "brow_l_dy", "brow_r_dy", "brow_tilt_l",
       "brow_tilt_r", "smile_l", "smile_r", "mouth_open", "mouth_width", "head_yaw", "head_pitch", "head_roll", "blush"]


def norm(r):
    r = dict(r)
    if r.pop("use_smile_base", False):
        r["smile_mix"] = 1.0
    return {k: float(r.get(k, 0.0)) for k in NUM} | {"show_teeth": r.get("show_teeth", True), "blink_style": r.get("blink_style", "relaxed")}


def ease(p):
    p = min(1.0, max(0.0, p))
    return 4 * p ** 3 if p < 0.5 else 1 - (-2 * p + 2) ** 3 / 2


def blink_curve(t, starts, dur=0.2):
    v = 0.0
    for s in starts:
        x = (t - s) / dur
        if 0 <= x <= 1:
            v = max(v, 1 - abs(2 * x - 1))
    return v


def params_at(t):
    i = max(j for j, s in enumerate(SCENES) if t >= s[0])
    start, name, talk = SCENES[i]
    cur = norm(RECIPES[name])
    prev = norm(RECIPES[SCENES[i - 1][1]]) if i else cur
    k = ease((t - start) / MORPH) if i else 1.0
    p = {key: prev[key] + (cur[key] - prev[key]) * k for key in NUM}
    p["show_teeth"] = cur["show_teeth"] if k > 0.5 else prev["show_teeth"]
    p["blink_style"] = cur["blink_style"] if k > 0.5 else prev["blink_style"]
    # vida: piscadas (uma no meio de cada transição + a cada ~2,7s), olhar e cabeça
    starts = [s[0] + 0.08 for s in SCENES[1:]] + [0.9 + 2.7 * n + 0.4 * math.sin(n * 2.3) for n in range(9)]
    b = blink_curve(t, starts)
    p["blink_l"] += (1 - p["blink_l"]) * b
    p["blink_r"] += (1 - p["blink_r"]) * b
    p["gaze_x"] += 1.6 * math.sin(t * 1.3) + 0.8 * math.sin(t * 3.1)
    p["gaze_y"] += 1.0 * math.sin(t * 0.9 + 1)
    p["head_roll"] += 1.8 * math.sin(t * 1.7)
    p["head_yaw"] += 1.5 * math.sin(t * 1.1 + 0.5)
    beat = (t - 2.02) % 0.5 if t >= 2.02 else 9
    p["head_pitch"] += 2.2 * math.exp(-beat * 9) if beat < 0.5 else 0
    p["head_pitch"] += 3.0 * math.sin(math.pi * min(1, (t - start) / MORPH)) if i and t - start < MORPH else 0
    if talk and talk[0] <= t <= talk[1]:  # boca falando "é… só pelo direct"
        ph = (t - talk[0]) * 13
        p["mouth_open"] += 7 * abs(math.sin(ph)) * (0.6 + 0.4 * math.sin(ph * 0.37))
        p["mouth_width"] += 3 * math.sin(ph * 0.5)
    for key in ("gaze_x",):
        p[key] = max(-16.0, min(16.0, p[key]))
    p["gaze_y"] = max(-16.0, min(8.0, p["gaze_y"]))
    return p


SCULPTOR = None


def init_worker():
    global SCULPTOR
    import cv2
    eng = load("engine", os.path.join(ENG_DIR, "build_primordial_library.py"))
    cap = cv2.VideoCapture(os.path.join(ENG_DIR, "PADRAO_OURO_REFERENCIA_3D.mp4"))
    frames = []
    while True:
        ok, f = cap.read()
        if not ok:
            break
        frames.append(f)
    SCULPTOR = eng.PrimordialFaceSculptor(frames[0], frames[238])


def clean(rgba_bgr):
    """Recorte limpo: maior peça, contorno suavizado e cor de borda puxada de dentro."""
    a = rgba_bgr[:, :, 2::-1].astype(np.float32)  # BGR → RGB
    al = rgba_bgr[:, :, 3:4].astype(np.float32) / 255.0
    comp = a * al + 209.0 * (1 - al)
    dist = np.abs(comp - 209.0).max(-1)
    lab, n = ndimage.label(dist > 14)
    sizes = ndimage.sum(np.ones_like(dist), lab, range(1, n + 1))
    m = ndimage.binary_fill_holes(lab == (1 + int(np.argmax(sizes))))
    m = ndimage.binary_opening(ndimage.binary_closing(m, iterations=3), iterations=3)
    m = ndimage.binary_erosion(ndimage.binary_fill_holes(m), iterations=3)
    g = ndimage.gaussian_filter(m.astype(np.float32), 3.0)
    alpha = np.clip((g - 0.42) / 0.3, 0, 1)
    edge = m & ~ndimage.binary_erosion(m, iterations=12)
    speck = edge & ((dist < 26) | (comp.mean(-1) - ndimage.median_filter(comp.mean(-1), size=9) > 20))
    good = ndimage.binary_erosion(m, iterations=1) & ~ndimage.binary_dilation(speck, iterations=1)
    _, (iy, ix) = ndimage.distance_transform_edt(~good, return_indices=True)
    rgb = comp[iy, ix]
    out = Image.fromarray(np.dstack([rgb, alpha * 255]).clip(0, 255).astype(np.uint8), "RGBA")
    return out.resize((SIZE, SIZE), Image.LANCZOS)


def render(args):
    idx, t, tmp = args
    p = params_at(t)
    blush = p.pop("blush")
    rgba = SCULPTOR.sculpt(**p)
    if blush > 0.01:
        rgba = VAR.add_blush(rgba, blush, p["head_roll"])
    clean(rgba).save(os.path.join(tmp, f"{idx:05d}.png"))
    return idx


def main():
    tmp = tempfile.mkdtemp(prefix="emoji-face-")
    n = int(round(DURATION * FPS))
    with Pool(os.cpu_count() or 4, initializer=init_worker) as pool:
        for done in pool.imap_unordered(render, [(i, i / FPS, tmp) for i in range(n)], chunksize=4):
            if done % 60 == 0:
                print(f"{done / FPS:5.1f}s", flush=True)
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-framerate", str(FPS), "-i", os.path.join(tmp, "%05d.png"), "-c:v", "libvpx-vp9",
                    "-pix_fmt", "yuva420p", "-b:v", "0", "-crf", "28", "-auto-alt-ref", "0", "-row-mt", "1", OUT], check=True)
    shutil.rmtree(tmp)
    print(os.path.relpath(OUT, ROOT), os.path.getsize(OUT) // 1024, "KB")


if __name__ == "__main__":
    main()
