#!/usr/bin/env python3
"""Recorta as feições do Emoji Primordial para WebP transparente, com borda limpa.

Fonte: EMOJI_PRIMORDIAL/02_FEICOES_FUNDO_PADRAO_STUDIO (as 36 feições sobre #D1D1D1 liso).
Mesmo as 6 transparentes originais trazem pontinhos e lascas cinza no contorno, então todas
saem daqui, pelo mesmo processo:
  1. máscara = pixels longe do cinza do fundo; fica só a maior peça (some com os pontinhos
     soltos) e os buracos internos são preenchidos;
  2. a máscara recua 1px e ganha uma borda suave (anti-alias) a partir dela mesma, sem
     usar o cinza como transparência;
  3. a cor da faixa de borda vem do pixel interno mais próximo, então não sobra halo claro.
Só entram as feições de frente (01–20 e 33–35): nas de ângulo a lente dos óculos sai do
rosto e vira um vidro cinza solto. A 36 está na lista "Não usar" do EMOJI_PRIMORDIAL/README.md.
Uso: python3 posts-insta/cutout_faces.py   →  posts-insta/img/face/<nome>.webp (400×400)
"""
import glob, os
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "EMOJI_PRIMORDIAL", "02_FEICOES_FUNDO_PADRAO_STUDIO")
OUT = os.path.join(ROOT, "posts-insta", "img", "face")
BG = 209.0
USE = set(range(1, 21)) | {33, 34, 35}


def cutout(path):
    a = np.asarray(Image.open(path).convert("RGB")).astype(np.float32)
    dist = np.abs(a - BG).max(-1)
    lab, n = ndimage.label(dist > 14)
    sizes = ndimage.sum(np.ones_like(dist), lab, range(1, n + 1))
    mask = ndimage.binary_fill_holes(lab == (1 + int(np.argmax(sizes))))
    mask = ndimage.binary_opening(mask, iterations=2)
    core = ndimage.binary_erosion(mask, iterations=1)
    alpha = np.clip(ndimage.gaussian_filter(core.astype(np.float32), 0.9) * 1.25 - 0.1, 0, 1)
    alpha[ndimage.binary_erosion(core, iterations=2)] = 1
    # cor da borda = pixel interno mais próximo (bem dentro do rosto, longe do cinza)
    inner = ndimage.binary_erosion(mask, iterations=4)
    _, (iy, ix) = ndimage.distance_transform_edt(~inner, return_indices=True)
    band = ~inner
    rgb = a.copy()
    rgb[band] = a[iy[band], ix[band]]
    return Image.fromarray(np.dstack([rgb, alpha * 255]).astype(np.uint8), "RGBA")


def main():
    os.makedirs(OUT, exist_ok=True)
    for f in glob.glob(os.path.join(OUT, "*.webp")):
        os.remove(f)
    for f in sorted(glob.glob(os.path.join(SRC, "*.png"))):
        name = os.path.basename(f)[:-4]
        if int(name[:2]) not in USE:
            continue
        im = cutout(f)
        im = im.crop(im.getbbox())
        side = max(im.size) + 8
        off = ((side - im.width) // 2, (side - im.height) // 2)
        # a cor do rosto foi estendida para fora dele, então RGB e alfa são reduzidos separados
        # (a borda nunca puxa cor de pixel transparente)
        rgb = Image.new("RGB", (side, side)); rgb.paste(im.convert("RGB"), off)
        edge = np.asarray(rgb).copy(); filled = np.zeros((side, side), bool); filled[off[1]:off[1] + im.height, off[0]:off[0] + im.width] = True
        _, (iy, ix) = ndimage.distance_transform_edt(~filled, return_indices=True)
        rgb = Image.fromarray(edge[iy, ix])
        al = Image.new("L", (side, side), 0); al.paste(im.getchannel("A"), off)
        out = rgb.resize((400, 400), Image.LANCZOS); out.putalpha(al.resize((400, 400), Image.LANCZOS))
        out.save(os.path.join(OUT, name + ".webp"), quality=95)
    print(len(os.listdir(OUT)), "feições em", os.path.relpath(OUT, ROOT))


if __name__ == "__main__":
    main()
