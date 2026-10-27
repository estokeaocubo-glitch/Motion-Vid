#!/usr/bin/env python3
"""Extrai os elementos oficiais da marca do manual (assets/brand/Manual Estoke Ao Cubo.pdf):

  assets/brand/wordmark.svg   logotipo "ESTOKE / AO CUBO" em vetor (contornos da Monument Extended
                              Bold do manual, página 2), um único path, cor = currentColor
  assets/brand/cube.png       cubo de vidro em alta (página 5), com transparência
  assets/brand/beam.jpg       o fundo de feixe de luz azul → noite da capa (página 1)
  src/brandMark.js            WORDMARK_PATH + viewBox e CUBE_HI (data URL) para os motions

Não extrai a fonte (a Monument Extended é licenciada à parte): só o desenho do logotipo, que é
da marca. Uso: python3 scripts/build-brand-assets.py   (precisa de poppler-utils e Pillow)
"""
import base64, io, os, re, subprocess, tempfile
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PDF = os.path.join(ROOT, "assets", "brand", "Manual Estoke Ao Cubo.pdf")
OUT = os.path.join(ROOT, "assets", "brand")
NUM = re.compile(r"-?\d+(?:\.\d+)?")


def wordmark(tmp):
    svg = os.path.join(tmp, "p2.svg")
    subprocess.run(["pdftocairo", "-svg", "-f", "2", "-l", "2", PDF, svg], check=True)
    s = open(svg).read()
    glyphs = dict(re.findall(r'<g id="(glyph-[\d-]+)">\s*<path d="([^"]+)"', s))
    parts, xs, ys = [], [], []
    for gid, x, y in re.findall(r'xlink:href="#(glyph-[\d-]+)" x="([\d.]+)" y="([\d.]+)"', s):
        if gid not in glyphs:  # glifo vazio (o espaço entre AO e CUBO)
            continue
        ox, oy = float(x), float(y)
        toks = re.findall(r"[MLCZ]|-?\d+(?:\.\d+)?", glyphs[gid])
        out, coords = [], []
        for tk in toks:
            if tk in "MLCZ":
                out.append(tk)
                continue
            coords.append(float(tk))
            if len(coords) == 2:
                px, py = coords[0] + ox, coords[1] + oy
                xs.append(px); ys.append(py)
                out.append(f"{px:.2f} {py:.2f}")
                coords = []
        parts.append(" ".join(out))
    x0, y0, x1, y1 = min(xs), min(ys), max(xs), max(ys)
    d = " ".join(parts)
    d = re.sub(r"(-?\d+\.\d+) (-?\d+\.\d+)", lambda m: f"{float(m.group(1)) - x0:.2f} {float(m.group(2)) - y0:.2f}", d)
    w, h = x1 - x0, y1 - y0
    return d, w, h


def main():
    with tempfile.TemporaryDirectory() as tmp:
        d, w, h = wordmark(tmp)
        open(os.path.join(OUT, "wordmark.svg"), "w").write(
            f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.2f} {h:.2f}" width="{w:.0f}" height="{h:.0f}"><path fill="currentColor" d="{d}"/></svg>\n')
        subprocess.run(["pdfimages", "-png", "-f", "5", "-l", "5", PDF, os.path.join(tmp, "p5")], check=True)
        subprocess.run(["pdfimages", "-png", "-f", "1", "-l", "1", PDF, os.path.join(tmp, "p1")], check=True)
        imgs = sorted(f for f in os.listdir(tmp) if f.startswith("p5-"))
        # p5: [fundo, cubo, máscara do cubo]
        cube = Image.open(os.path.join(tmp, imgs[1])).convert("RGB")
        mask = Image.open(os.path.join(tmp, imgs[2])).convert("L")
        cube.putalpha(mask)
        cube = cube.crop(cube.getbbox())
        cube.save(os.path.join(OUT, "cube.png"))
        Image.open(os.path.join(tmp, sorted(f for f in os.listdir(tmp) if f.startswith("p1-"))[0])).convert("RGB").save(os.path.join(OUT, "beam.jpg"), quality=90)
        small = cube.copy(); small.thumbnail((360, 360), Image.LANCZOS)
        buf = io.BytesIO(); small.save(buf, "WEBP", quality=90)
        js = ("// Gerado por scripts/build-brand-assets.py a partir do manual da marca (assets/brand/).\n"
              "// Logotipo oficial ESTOKE / AO CUBO em vetor (contornos da Monument Extended Bold) e o cubo em alta.\n"
              f'export const WORDMARK_VIEWBOX = [{w:.2f}, {h:.2f}];\n'
              f'export const WORDMARK_PATH = "{d}";\n'
              f'export const CUBE_HI = "data:image/webp;base64,{base64.b64encode(buf.getvalue()).decode()}";\n'
              f'export const CUBE_HI_RATIO = {small.width / small.height:.4f};\n')
        open(os.path.join(ROOT, "src", "brandMark.js"), "w").write(js)
        print("wordmark", round(w), "x", round(h), "| cube", cube.size, "| brandMark.js", len(js) // 1024, "KB")


if __name__ == "__main__":
    main()
