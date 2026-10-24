#!/usr/bin/env python3
"""Gera as feições do Emoji Primordial em SVG, com contorno vetorial.

Fonte: EMOJI_PRIMORDIAL/02_FEICOES_FUNDO_PADRAO_STUDIO (as 36 feições sobre #D1D1D1 liso).
A biblioteca vem com pontinhos e lascas cinza-claro no contorno (até nas transparentes
originais). Por isso cada feição vira um SVG em duas camadas:
  - contorno: um <clipPath> vetorial e suave do formato do rosto, traçado da máscara (maior
    peça, sem buracos, recuada para dentro do anel serrilhado) e bem suavizado, em curvas
    Bézier. É ele que define a borda, nítida em qualquer tamanho;
  - miolo: a imagem 3D original (o sombreado não vira vetor sem perder o volume), com a
    faixa da borda limpa: pixel cinza perto do contorno é trocado pela cor de pele/cabelo
    mais próxima, e a cor é estendida para fora, então o anti-alias do contorno nunca
    encontra cinza.
Só entram as feições de frente (01–05, 09–20 e 33–35): nas de ângulo a lente sai do rosto e,
nas de olhos fechados ou piscando (06–08), os óculos deixam a expressão estranha.
A 36 está na lista "Não usar" do EMOJI_PRIMORDIAL/README.md.
Uso: python3 posts-insta/cutout_faces.py   →  posts-insta/img/face/<nome>.svg
(precisa de scikit-image para traçar o contorno)
"""
import base64, glob, io, os
import numpy as np
from PIL import Image
from scipy import ndimage
from skimage import measure

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "EMOJI_PRIMORDIAL", "02_FEICOES_FUNDO_PADRAO_STUDIO")
OUT = os.path.join(ROOT, "posts-insta", "img", "face")
BG = 209.0
USE = set(range(1, 6)) | set(range(9, 21)) | {33, 34, 35}
PAD = 10


def face_mask(dist):
    lab, n = ndimage.label(dist > 14)
    sizes = ndimage.sum(np.ones_like(dist), lab, range(1, n + 1))
    m = ndimage.binary_fill_holes(lab == (1 + int(np.argmax(sizes))))
    m = ndimage.binary_closing(m, iterations=3)
    m = ndimage.binary_opening(m, iterations=3)
    return ndimage.binary_fill_holes(m)


def smooth_path(mask):
    """Contorno vetorial: curva de nível da máscara suavizada, simplificada e em Bézier."""
    # suavização forte: o recorte de origem tem maxilar serrilhado; o nível 0,6 recua ~1,5px
    g = ndimage.gaussian_filter(mask.astype(np.float32), 5.5)
    c = max(measure.find_contours(g, 0.6), key=len)
    c = measure.approximate_polygon(c, tolerance=0.6)[:-1]
    pts = c[:, ::-1]  # (linha, coluna) → (x, y)
    n = len(pts)
    d = [f"M{pts[0][0]:.1f} {pts[0][1]:.1f}"]
    for i in range(n):  # Catmull-Rom fechado → cúbicas
        p0, p1, p2, p3 = pts[i - 1], pts[i], pts[(i + 1) % n], pts[(i + 2) % n]
        c1 = p1 + (p2 - p0) / 6
        c2 = p2 - (p3 - p1) / 6
        d.append(f"C{c1[0]:.1f} {c1[1]:.1f} {c2[0]:.1f} {c2[1]:.1f} {p2[0]:.1f} {p2[1]:.1f}")
    return "".join(d) + "Z"


def build(path, max_px=None, quality=90):
    """max_px: lado máximo da imagem embutida (o contorno continua vetorial no tamanho original)."""
    a = np.asarray(Image.open(path).convert("RGB")).astype(np.float32)
    dist = np.abs(a - BG).max(-1)
    mask = ndimage.binary_erosion(face_mask(dist), iterations=3)
    # pixels confiáveis: dentro do rosto e, perto da borda, nada parecido com o cinza do fundo
    edge_band = mask & ~ndimage.binary_erosion(mask, iterations=12)
    speck = edge_band & (dist < 26)
    # e o que for bem mais claro que a vizinhança (pontinhos na pele; o AirPod é claro por inteiro)
    lum = a.mean(-1)
    speck |= edge_band & (lum - ndimage.median_filter(lum, size=9) > 20)
    good = ndimage.binary_erosion(mask, iterations=1) & ~ndimage.binary_dilation(speck, iterations=1)
    _, (iy, ix) = ndimage.distance_transform_edt(~good, return_indices=True)
    rgb = a[iy, ix]
    ys, xs = np.where(mask)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    side = max(y1 - y0, x1 - x0) + 2 * PAD
    oy, ox = y0 - (side - (y1 - y0)) // 2, x0 - (side - (x1 - x0)) // 2
    canvas = np.zeros((side, side, 3), np.float32)
    cm = np.zeros((side, side), bool)
    sy0, sx0 = max(0, oy), max(0, ox)
    sy1, sx1 = min(a.shape[0], oy + side), min(a.shape[1], ox + side)
    canvas[sy0 - oy:sy1 - oy, sx0 - ox:sx1 - ox] = rgb[sy0:sy1, sx0:sx1]
    cm[sy0 - oy:sy1 - oy, sx0 - ox:sx1 - ox] = mask[sy0:sy1, sx0:sx1]
    # a cor de dentro também cobre a sobra do quadrado (o contorno corta tudo isso)
    _, (iy, ix) = ndimage.distance_transform_edt(~ndimage.binary_erosion(cm, iterations=1), return_indices=True)
    canvas = canvas[iy, ix]
    buf = io.BytesIO()
    im = Image.fromarray(canvas.clip(0, 255).astype(np.uint8))
    if max_px and side > max_px:
        im = im.resize((max_px, max_px), Image.LANCZOS)
    im.save(buf, "WEBP", quality=quality, method=6)
    img = base64.b64encode(buf.getvalue()).decode()
    d = smooth_path(cm)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 {side} {side}" width="{side}" height="{side}">'
            f'<defs><clipPath id="c"><path d="{d}"/></clipPath></defs>'
            f'<image width="{side}" height="{side}" clip-path="url(#c)" xlink:href="data:image/webp;base64,{img}" href="data:image/webp;base64,{img}"/></svg>\n')


def main():
    os.makedirs(OUT, exist_ok=True)
    for f in glob.glob(os.path.join(OUT, "*")):
        os.remove(f)
    for f in sorted(glob.glob(os.path.join(SRC, "*.png"))):
        name = os.path.basename(f)[:-4]
        if int(name[:2]) in USE:
            open(os.path.join(OUT, name + ".svg"), "w").write(build(f))
    print(len(os.listdir(OUT)), "feições (SVG) em", os.path.relpath(OUT, ROOT))


if __name__ == "__main__":
    main()
