#!/usr/bin/env python3
"""Novas variações 3D do Emoji Primordial, esculpidas pela própria engine.

Usa o PrimordialFaceSculptor de build_primordial_library.py sobre o vídeo padrão-ouro
(PADRAO_OURO_REFERENCIA_3D.mp4, quadros 0 = neutro e 238 = sorriso nativo), exatamente como
as 36 feições originais. Só muda a receita de parâmetros: olhar, pálpebras (piscada parcial),
sobrancelhas, cantos da boca, abertura/largura da boca, tamanho do olho e inclinação.
As expressões seguem as referências de emoji de meme (convencido, implorando, estressado,
cansado...) e versões sérias e refinadas, sempre com o rosto 3D padrão.

Uso: python3 EMOJI_PRIMORDIAL/05_ENGINE_E_FONTES_MESTRES/gerar_variacoes_3d.py
  → EMOJI_PRIMORDIAL/06_VARIACOES_3D/01_PNG_TRANSPARENTE/<nome>.png  (800×800 RGBA)
  → EMOJI_PRIMORDIAL/06_VARIACOES_3D/02_FUNDO_PADRAO_STUDIO/<nome>.png (800×800 sobre #D1D1D1)
  → EMOJI_PRIMORDIAL/06_VARIACOES_3D/CATALOGO_VARIACOES_3D.jpg
Precisa de opencv-python(-headless), numpy, scipy e Pillow.
"""
import importlib.util, os
import cv2
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
PRIM = os.path.dirname(HERE)
OUT = os.path.join(PRIM, "06_VARIACOES_3D")
DIR_PNG = os.path.join(OUT, "01_PNG_TRANSPARENTE")
DIR_STUDIO = os.path.join(OUT, "02_FUNDO_PADRAO_STUDIO")
VIDEO = os.path.join(HERE, "PADRAO_OURO_REFERENCIA_3D.mp4")

spec = importlib.util.spec_from_file_location("primordial", os.path.join(HERE, "build_primordial_library.py"))
engine = importlib.util.module_from_spec(spec)
spec.loader.exec_module(engine)

# (nome, tipo, parâmetros do sculpt) — numeração continua a das 36 originais
VARIACOES = [
    # cômicas (refs. de emoji de meme), no limite das faixas seguras da engine
    ("37_convencido_olhar_de_lado", "cômica", dict(smirk_dir=1.0, smile_r=10, smile_l=-2, blink_l=0.62, blink_r=0.62, gaze_x=15, gaze_y=4,
                                                     brow_l_dy=9, brow_tilt_l=6, brow_r_dy=-13, head_roll=-10, head_yaw=5)),
    ("38_implorando_olhos_grandes", "cômica", dict(eye_scale=0.14, gaze_y=-6, brow_l_dy=-12, brow_r_dy=-12, brow_tilt_l=-10, brow_tilt_r=-10,
                                                     smile_l=-7, smile_r=-7, mouth_width=-8, mouth_open=-3, head_roll=8, head_pitch=6)),
    ("39_estressado_olhar_vidrado", "cômica", dict(eye_scale=0.14, brow_l_dy=-6, brow_r_dy=-6, brow_tilt_l=-6, brow_tilt_r=-6,
                                                     mouth_width=-10, mouth_open=-5, smile_l=-5, smile_r=-5, head_pitch=-4)),
    ("40_cansado_palpebra_caida", "cômica", dict(blink_l=0.7, blink_r=0.7, gaze_y=6, brow_l_dy=2, brow_r_dy=2, brow_tilt_l=-6, brow_tilt_r=-6,
                                                   smile_l=-6, smile_r=-6, mouth_width=-4, head_roll=-6, head_pitch=6)),
    ("41_sem_reacao", "cômica", dict(blink_l=0.55, blink_r=0.55, mouth_width=-6, mouth_open=-4)),
    ("42_rindo_alto", "cômica", dict(use_smile_base=True, mouth_open=24, mouth_width=8, smile_l=10, smile_r=10, brow_l_dy=-12, brow_r_dy=-12,
                                      blink_l=0.8, blink_r=0.8, blink_style="happy", show_teeth=True, head_roll=8, head_pitch=-6)),
    ("43_nervoso_sorriso_amarelo", "cômica", dict(smile_l=2, smile_r=2, mouth_open=10, mouth_width=8, show_teeth=True, gaze_x=15,
                                                   brow_l_dy=-12, brow_r_dy=-12, brow_tilt_l=-10, brow_tilt_r=-10, head_roll=-4, head_yaw=-4)),
    ("44_desconfiado_olhos_cerrados", "cômica", dict(blink_l=0.62, blink_r=0.62, gaze_x=-15, brow_l_dy=10, brow_tilt_l=8, brow_r_dy=-6,
                                                      smile_l=-6, smile_r=2, head_roll=6)),
    ("45_chocado_queixo_caido", "cômica", dict(eye_scale=0.14, brow_l_dy=-13, brow_r_dy=-13, mouth_open=24, mouth_width=-10, show_teeth=False,
                                                head_pitch=-8)),
    ("46_ironico_meio_sorriso", "cômica", dict(smirk_dir=-1.0, smile_l=9, blink_l=0.45, blink_r=0.45, brow_l_dy=-13, brow_r_dy=6, gaze_x=-10,
                                                head_roll=7)),
    # sérias e refinadas
    ("47_confiante_olhar_firme", "séria", dict(smile_mix=0.6, smile_l=3, smile_r=3, brow_l_dy=5, brow_r_dy=5, brow_tilt_l=4, brow_tilt_r=4,
                                               blink_l=0.25, blink_r=0.25, head_roll=-3, head_yaw=3)),
    ("48_determinado", "séria", dict(brow_l_dy=10, brow_r_dy=10, brow_tilt_l=10, brow_tilt_r=10, blink_l=0.35, blink_r=0.35,
                                     smile_l=-4, smile_r=-4, mouth_open=-3, head_pitch=4)),
    ("49_aprovando_satisfeito", "séria", dict(use_smile_base=True, smile_l=8, smile_r=8, blink_l=0.55, blink_r=0.55, blink_style="happy",
                                              brow_l_dy=-6, brow_r_dy=-6, head_roll=6, head_pitch=6)),
    ("50_atento_olhando_lado", "séria", dict(smile_mix=0.4, gaze_x=15, gaze_y=-2, brow_r_dy=-10, brow_l_dy=-4, head_yaw=6)),
    ("51_preocupado", "séria", dict(brow_l_dy=-10, brow_r_dy=-10, brow_tilt_l=-10, brow_tilt_r=-10, smile_l=-10, smile_r=-10, gaze_y=7,
                                    mouth_width=-4, head_pitch=5)),
    ("52_teve_ideia", "séria", dict(use_smile_base=True, gaze_x=10, gaze_y=-16, brow_l_dy=-13, brow_r_dy=-13, smile_l=6, smile_r=6,
                                    mouth_open=6, mouth_width=4, show_teeth=True, head_roll=-6)),
]


def main():
    os.makedirs(DIR_PNG, exist_ok=True)
    os.makedirs(DIR_STUDIO, exist_ok=True)
    cap = cv2.VideoCapture(VIDEO)
    frames = []
    while True:
        ok, f = cap.read()
        if not ok:
            break
        frames.append(f)
    sculptor = engine.PrimordialFaceSculptor(frames[0], frames[238])
    thumbs = []
    for name, tipo, params in VARIACOES:
        rgba = sculptor.sculpt(**params)
        cv2.imwrite(os.path.join(DIR_PNG, name + ".png"), rgba)
        a = rgba[:, :, 3:4].astype(np.float32) / 255.0
        comp = (rgba[:, :, :3].astype(np.float32) * a + np.full((800, 800, 3), 209.0) * (1 - a)).astype(np.uint8)
        cv2.imwrite(os.path.join(DIR_STUDIO, name + ".png"), comp)
        t = cv2.resize(comp, (240, 240), interpolation=cv2.INTER_AREA)
        cv2.putText(t, name[:24], (6, 230), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (25, 25, 25), 1, cv2.LINE_AA)
        thumbs.append(t)
    cols = 4
    while len(thumbs) % cols:
        thumbs.append(np.full((240, 240, 3), 209, np.uint8))
    sheet = np.vstack([np.hstack(thumbs[r * cols:(r + 1) * cols]) for r in range(len(thumbs) // cols)])
    cv2.imwrite(os.path.join(OUT, "CATALOGO_VARIACOES_3D.jpg"), sheet, [cv2.IMWRITE_JPEG_QUALITY, 92])
    print(len(VARIACOES), "variações em", os.path.relpath(OUT, os.path.dirname(PRIM)))


if __name__ == "__main__":
    main()
