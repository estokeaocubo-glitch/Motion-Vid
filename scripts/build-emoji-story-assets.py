#!/usr/bin/env python3
"""Gera src/emojiStory/faces.js para o motion "Tem site?" (EmojiStoryAd).

Pega as variações 3D do Emoji Primordial (EMOJI_PRIMORDIAL/06_VARIACOES_3D, fundo de estúdio)
e as transforma em SVG com contorno vetorial (posts-insta/cutout_faces.py: sem borda branca),
com a imagem embutida reduzida para 460px. Saída: FACES = { id: "data:image/svg+xml;base64,..." }.
Uso: python3 scripts/build-emoji-story-assets.py
"""
import base64, importlib.util, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "EMOJI_PRIMORDIAL", "06_VARIACOES_3D", "02_FUNDO_PADRAO_STUDIO")
spec = importlib.util.spec_from_file_location("cutout", os.path.join(ROOT, "posts-insta", "cutout_faces.py"))
cutout = importlib.util.module_from_spec(spec)
spec.loader.exec_module(cutout)

FACES = {
    "tedio": "53_tedio_total", "choque": "57_choque_extremo", "forcado": "62_sorriso_forcado", "chorando": "61_quase_chorando",
    "julgando": "54_julgando_de_lado", "ideia": "52_teve_ideia", "confiante": "47_confiante_olhar_firme",
    "sonolento": "63_sonolento", "derretido": "56_derretido_apaixonado", "empinado": "64_nariz_empinado",
    "nervoso": "43_nervoso_sorriso_amarelo", "rindo": "42_rindo_alto",
}


def main():
    lines = ["// Gerado por scripts/build-emoji-story-assets.py — Emoji Primordial 3D (variações 37–64), contorno vetorial", "export const FACES = {"]
    for k, name in FACES.items():
        svg = cutout.build(os.path.join(SRC, name + ".png"), max_px=460, quality=86)
        lines.append(f'  {k}: "data:image/svg+xml;base64,{base64.b64encode(svg.encode()).decode()}",')
    lines.append("};")
    dst = os.path.join(ROOT, "src", "emojiStory", "faces.js")
    open(dst, "w").write("\n".join(lines) + "\n")
    print(os.path.relpath(dst, ROOT), os.path.getsize(dst) // 1024, "KB")


if __name__ == "__main__":
    main()
