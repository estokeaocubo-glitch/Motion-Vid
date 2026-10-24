#!/usr/bin/env python3
"""Gera src/oxi/assets3d.js para o motion "Site é oxigênio" (OxigenioAd):

  ICON3D     objetos 3D do Fluent Emoji da Microsoft (licença MIT), WebP com alpha, embutidos em base64

O personagem do motion (a bola brilhante) é desenhado no próprio componente, sem arquivo.
Uso: python3 scripts/build-oxi-assets.py
"""
import base64, io, os, tempfile, urllib.parse, urllib.request
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FLUENT = "https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets"
ICONS = {
    "robot": "Robot/3D/robot_3d.png", "clock": "Alarm clock/3D/alarm_clock_3d.png", "coin": "Coin/3D/coin_3d.png",
    "card": "Credit card/3D/credit_card_3d.png", "moon": "Crescent moon/3D/crescent_moon_3d.png", "zzz": "Zzz/3D/zzz_3d.png",
    "cricket": "Cricket/3D/cricket_3d.png", "web": "Spider web/3D/spider_web_3d.png", "party": "Party popper/3D/party_popper_3d.png",
    "magnifier": "Magnifying glass tilted left/3D/magnifying_glass_tilted_left_3d.png", "moneybag": "Money bag/3D/money_bag_3d.png",
    "bell": "Bell/3D/bell_3d.png", "camera": "Camera with flash/3D/camera_with_flash_3d.png", "hourglass": "Hourglass not done/3D/hourglass_not_done_3d.png",
    "point": "Backhand index pointing up/Default/3D/backhand_index_pointing_up_3d_default.png", "cross": "Cross mark/3D/cross_mark_3d.png",
    "collision": "Collision/3D/collision_3d.png", "dog": "Dog face/3D/dog_face_3d.png",
}


def main():
    lines = ["// Gerado por scripts/build-oxi-assets.py — objetos 3D do Fluent Emoji (Microsoft, licença MIT)", "export const ICON3D = {"]
    with tempfile.TemporaryDirectory() as tmp:
        for k, path in ICONS.items():
            p = os.path.join(tmp, k + ".png")
            urllib.request.urlretrieve(f"{FLUENT}/{urllib.parse.quote(path)}", p)
            b = io.BytesIO()
            Image.open(p).convert("RGBA").save(b, "WEBP", quality=90, method=6)
            lines.append(f'  "{k}": "data:image/webp;base64,{base64.b64encode(b.getvalue()).decode()}",')
    lines.append("};")
    dst = os.path.join(ROOT, "src", "oxi", "assets3d.js")
    open(dst, "w").write("\n".join(lines) + "\n")
    print(os.path.relpath(dst, ROOT), os.path.getsize(dst) // 1024, "KB")


if __name__ == "__main__":
    main()
