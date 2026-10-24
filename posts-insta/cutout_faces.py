#!/usr/bin/env python3
"""Recorta as feições do Emoji Primordial (fundo de estúdio #D1D1D1 liso) para PNG/WebP transparente.

Só 6 das 36 feições transparentes estão no repositório (EMOJI_PRIMORDIAL/01_...), então as
outras saem daqui: o fundo é exatamente (209, 209, 209); remove a região dessa cor ligada à
borda e suaviza a borda pela distância de cor (com a cor "despremultiplicada" do cinza).
A feição 36 fica de fora (lista "Não usar" do EMOJI_PRIMORDIAL/README.md).
Uso: python3 posts-insta/cutout_faces.py   →  posts-insta/img/face/<nome>.webp (400×400)
"""
import glob, os
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "EMOJI_PRIMORDIAL", "02_FEICOES_FUNDO_PADRAO_STUDIO")
TRANSP = os.path.join(ROOT, "EMOJI_PRIMORDIAL", "01_FEICOES_PNG_TRANSPARENTE")
OUT = os.path.join(ROOT, "posts-insta", "img", "face")
BG = 209.0
SKIP = {"36_impactado_segurando_coracao"}


def cutout(path):
    a = np.asarray(Image.open(path).convert("RGB")).astype(np.float32)
    dist = np.abs(a - BG).max(-1)
    lab, _ = ndimage.label(dist <= 3)
    border = set(np.unique(np.r_[lab[0], lab[-1], lab[:, 0], lab[:, -1]])) - {0}
    bg = np.isin(lab, list(border))
    # faixa de borda: até 3px do fundo, alfa pela distância de cor
    near = ndimage.binary_dilation(bg, iterations=3) & ~bg
    alpha = np.ones(dist.shape, np.float32)
    alpha[bg] = 0
    alpha[near] = np.clip((dist[near] - 8) / 45.0, 0, 1)
    # tira o fio claro que sobra no contorno: 1px de erosão só na faixa de borda
    eroded = ndimage.minimum_filter(alpha, size=3)
    alpha = np.where(near | ndimage.binary_dilation(near), np.minimum(alpha, (alpha + eroded) / 2), alpha)
    al = np.maximum(alpha, 1e-3)[..., None]
    rgb = np.clip((a - (1 - al) * BG) / al, 0, 255)
    return Image.fromarray(np.dstack([rgb, alpha * 255]).astype(np.uint8), "RGBA")


def main():
    os.makedirs(OUT, exist_ok=True)
    for f in sorted(glob.glob(os.path.join(SRC, "*.png"))):
        name = os.path.basename(f)[:-4]
        if name in SKIP:
            continue
        orig = os.path.join(TRANSP, name + ".png")
        im = Image.open(orig).convert("RGBA") if os.path.exists(orig) else cutout(f)
        im = im.crop(im.getbbox()) if im.getbbox() else im
        side = max(im.size)
        sq = Image.new("RGBA", (side, side), (0, 0, 0, 0))
        sq.paste(im, ((side - im.width) // 2, (side - im.height) // 2))
        sq.resize((400, 400), Image.LANCZOS).save(os.path.join(OUT, name + ".webp"), quality=92)
    print(len(os.listdir(OUT)), "feições em", os.path.relpath(OUT, ROOT))


if __name__ == "__main__":
    main()
