#!/usr/bin/env python3
"""Gera src/oxi/assets3d.js para o motion "Site é oxigênio" (OxigenioAd):

  EMO        feições do Emoji Primordial recortadas (WebP com alpha, 420 px)
  EMO_ANIM   animações 3D do Emoji Primordial recortadas (WebM VP9 com alpha, 420 px, 24 fps)
  ICON3D     objetos 3D do Fluent Emoji da Microsoft (licença MIT), WebP com alpha

O fundo de estúdio (#D1D1D1 nas feições, ~#CED0CD nas animações) é removido com o mesmo método da
engine da biblioteca (build_primordial_library.py → cutout_video_frame_rgba): a região de cor de fundo
conectada às bordas vira transparente. A borda recebe alpha suave pela distância de cor e tem a cor
"descontaminada" do cinza, para não deixar franja clara no fundo escuro do motion.
Uso: python3 scripts/build-oxi-assets.py
"""
import base64, os, subprocess, tempfile, urllib.parse, urllib.request
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LIB = os.path.join(ROOT, "EMOJI_PRIMORDIAL")
SIZE = 420

# feições estáticas usadas no motion (01_ = transparente original quando existe; senão recorte da versão de estúdio)
STILLS = ["02_sorriso_gentil", "08_olhos_fechados_zen", "14_triste_desapontado", "15_revirando_olhos_tedio",
          "33_inclinado_desconfiado_original", "35_estrategista_maos_piramide", "01_neutro_focado"]
# feições que não vamos usar nos motions (ver "Não usar" em EMOJI_PRIMORDIAL/README.md)
NAO_USAR = {"36_impactado_segurando_coracao"}
assert not NAO_USAR & set(STILLS), "feição na lista de não usar"
ANIMS = ["11_falando_locucao_loop", "02_dizendo_NAO_cabeca_3d", "10_revirando_olhos_eye_roll", "08_desconfiado_side_eye_rock",
         "07_aceno_SIM_aprovando", "03_virada_dramatica_180_sorriso", "06_piscadinha_wink_charme"]
FLUENT = "https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets"
ICONS = {
    "robot": "Robot/3D/robot_3d.png", "clock": "Alarm clock/3D/alarm_clock_3d.png", "coin": "Coin/3D/coin_3d.png",
    "card": "Credit card/3D/credit_card_3d.png", "moon": "Crescent moon/3D/crescent_moon_3d.png", "zzz": "Zzz/3D/zzz_3d.png",
    "cricket": "Cricket/3D/cricket_3d.png", "web": "Spider web/3D/spider_web_3d.png", "party": "Party popper/3D/party_popper_3d.png",
    "magnifier": "Magnifying glass tilted left/3D/magnifying_glass_tilted_left_3d.png", "moneybag": "Money bag/3D/money_bag_3d.png",
    "bell": "Bell/3D/bell_3d.png", "camera": "Camera with flash/3D/camera_with_flash_3d.png", "hourglass": "Hourglass not done/3D/hourglass_not_done_3d.png",
    "point": "Backhand index pointing up/Default/3D/backhand_index_pointing_up_3d_default.png", "cross": "Cross mark/3D/cross_mark_3d.png",
    "check": "Check mark button/3D/check_mark_button_3d.png", "heart": "Red heart/3D/red_heart_3d.png", "collision": "Collision/3D/collision_3d.png",
    "sparkles": "Sparkles/3D/sparkles_3d.png", "cart": "Shopping cart/3D/shopping_cart_3d.png", "fire": "Fire/3D/fire_3d.png",
    "speech": "Speech balloon/3D/speech_balloon_3d.png", "dog": "Dog face/3D/dog_face_3d.png",
}


def key_out(rgb, bg):
    """RGB uint8 (H,W,3) + cor de fundo → RGBA float (0..1), fundo conectado às bordas transparente."""
    f = rgb.astype(np.float32)
    diff = np.sqrt(((f - np.asarray(bg, np.float32)) ** 2).sum(-1))
    cand = diff < 14.0
    lab, _ = ndimage.label(cand)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bgm = np.isin(lab, list(border))
    alpha = (~bgm).astype(np.float32)
    # anel de borda: alpha pela distância de cor ao fundo (antialiasing do render original)
    ring = ndimage.binary_dilation(bgm, iterations=2) & ~bgm
    alpha[ring] = np.clip(diff[ring] / 48.0, 0, 1)
    alpha = np.minimum(alpha, ndimage.gaussian_filter(alpha, 0.6) + 0.15 * alpha)
    a = alpha[..., None]
    col = np.where(a > 0.02, (f - np.asarray(bg, np.float32) * (1 - a)) / np.maximum(a, 0.02), 0)
    return np.dstack([np.clip(col, 0, 255) / 255.0, alpha])


def resize_rgba(rgba, size):
    """Redimensiona com alpha pré-multiplicado (sem franja escura)."""
    pm = np.dstack([rgba[..., :3] * rgba[..., 3:4], rgba[..., 3:4]])
    im = Image.fromarray((pm * 255).round().astype(np.uint8), "RGBA").resize((size, size), Image.LANCZOS)
    a = np.asarray(im).astype(np.float32) / 255.0
    col = np.where(a[..., 3:4] > 0.003, a[..., :3] / np.maximum(a[..., 3:4], 0.003), 0)
    return Image.fromarray((np.dstack([np.clip(col, 0, 1), a[..., 3:4]]) * 255).round().astype(np.uint8), "RGBA")


def webp_data(img, q=88):
    import io
    b = io.BytesIO()
    img.save(b, "WEBP", quality=q, method=6)
    return "data:image/webp;base64," + base64.b64encode(b.getvalue()).decode()


def main():
    out = {"EMO": {}, "EMO_ANIM": {}, "ICON3D": {}}
    for name in STILLS:
        tp = os.path.join(LIB, "01_FEICOES_PNG_TRANSPARENTE", name + ".png")
        if os.path.exists(tp):
            rgba = np.asarray(Image.open(tp).convert("RGBA")).astype(np.float32) / 255.0
        else:
            rgb = np.asarray(Image.open(os.path.join(LIB, "02_FEICOES_FUNDO_PADRAO_STUDIO", name + ".png")).convert("RGB"))
            rgba = key_out(rgb, rgb[4, 4])
        out["EMO"][name] = webp_data(resize_rgba(rgba, SIZE))
        print("feição", name)
    with tempfile.TemporaryDirectory() as tmp:
        for name in ANIMS:
            src = os.path.join(LIB, "03_ANIMACOES_REAIS_3D", name + ".mp4")
            fdir = os.path.join(tmp, name)
            os.makedirs(fdir)
            subprocess.run(["ffmpeg", "-v", "error", "-i", src, os.path.join(fdir, "f%04d.png")], check=True)
            frames = sorted(os.listdir(fdir))
            for fn in frames:
                rgb = np.asarray(Image.open(os.path.join(fdir, fn)).convert("RGB"))
                resize_rgba(key_out(rgb, rgb[4, 4]), SIZE).save(os.path.join(fdir, "k" + fn[1:]))
            webm = os.path.join(tmp, name + ".webm")
            subprocess.run(["ffmpeg", "-v", "error", "-framerate", "24", "-i", os.path.join(fdir, "k%04d.png"), "-c:v", "libvpx-vp9",
                            "-pix_fmt", "yuva420p", "-b:v", "0", "-crf", "30", "-auto-alt-ref", "0", "-row-mt", "1", webm], check=True)
            dur = round(len(frames) / 24.0, 4)
            out["EMO_ANIM"][name] = {"webm": "data:video/webm;base64," + base64.b64encode(open(webm, "rb").read()).decode(), "dur": dur}
            print("animação", name, dur, "s", os.path.getsize(webm) // 1024, "KB")
        for k, path in ICONS.items():
            p = os.path.join(tmp, k + ".png")
            urllib.request.urlretrieve(f"{FLUENT}/{urllib.parse.quote(path)}", p)
            out["ICON3D"][k] = webp_data(Image.open(p).convert("RGBA"), 90)
            print("ícone 3D", k)
    dst = os.path.join(ROOT, "src", "oxi", "assets3d.js")
    with open(dst, "w") as f:
        f.write("// Gerado por scripts/build-oxi-assets.py — Emoji Primordial recortado e objetos 3D do Fluent Emoji (MIT)\n")
        for const, items in out.items():
            f.write(f"export const {const} = {{\n")
            for k, v in items.items():
                if isinstance(v, dict):
                    f.write(f'  "{k}": {{ webm: "{v["webm"]}", dur: {v["dur"]} }},\n')
                else:
                    f.write(f'  "{k}": "{v}",\n')
            f.write("};\n")
    print(os.path.relpath(dst, ROOT), os.path.getsize(dst) // 1024, "KB")


if __name__ == "__main__":
    main()
