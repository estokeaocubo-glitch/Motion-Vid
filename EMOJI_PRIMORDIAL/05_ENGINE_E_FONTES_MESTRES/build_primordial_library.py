import os
import math
import subprocess
import cv2
import numpy as np
from scipy import ndimage
from PIL import Image

WORKSPACE = r"c:\Users\xavie\Downloads\NOVA LEVA DE MOTION"
PRIM_DIR = os.path.join(WORKSPACE, "EMOJI_PRIMORDIAL")
DIR_PNG = os.path.join(PRIM_DIR, "01_FEICOES_PNG_TRANSPARENTE")
DIR_STUDIO = os.path.join(PRIM_DIR, "02_FEICOES_FUNDO_PADRAO_STUDIO")
DIR_ANIM = os.path.join(PRIM_DIR, "03_ANIMACOES_REAIS_3D")
SCRATCH_DIR = r"C:\Users\xavie\.gemini\antigravity\brain\5df60706-e76c-4b33-a6af-79a638beca22\scratch"

for d in [DIR_PNG, DIR_STUDIO, DIR_ANIM, SCRATCH_DIR]:
    os.makedirs(d, exist_ok=True)

REF_VIDEO = r"C:\Users\xavie\Downloads\gemini_generated_video_c816c9bf.mp4"
SKEP_JPG = r"C:\Users\xavie\Downloads\watermarked_img_16001302659439385027.jpg"
SCHEM_JPG = r"C:\Users\xavie\Downloads\watermarked_img_2736898403867180660.jpg"
HEART_JPG = r"C:\Users\xavie\Downloads\watermarked_img_9677849331975213302.jpg"

STUDIO_BG_BGR = (209, 209, 209)  # Exact #D1D1D1 studio background from gemini_generated_video_c816c9bf.mp4


def cutout_video_frame_rgba(frame_bgr):
    """
    Cuts out a 720x720 center crop from gemini_generated_video_c816c9bf.mp4 (bg #D1D1D1)
    and returns an 800x800 RGBA image with clean alpha channel (preserving AirPods and rimless glass lenses).
    """
    crop = frame_bgr[:, 280:1000].copy()
    crop = cv2.resize(crop, (800, 800), interpolation=cv2.INTER_LANCZOS4)
    b, g, r = crop[:, :, 0].astype(np.float32), crop[:, :, 1].astype(np.float32), crop[:, :, 2].astype(np.float32)

    diff_bg = np.sqrt((b - 209.0) ** 2 + (g - 209.0) ** 2 + (r - 209.0) ** 2)
    bg_cand = diff_bg < 8.5
    labeled, _ = ndimage.label(bg_cand)
    border_labels = set(np.unique(np.concatenate([labeled[0, :], labeled[-1, :], labeled[:, 0], labeled[:, -1]]))) - {0}
    ext_bg = np.isin(labeled, list(border_labels))

    dist_inside = ndimage.distance_transform_edt(~ext_bg)
    alpha = np.clip((dist_inside - 0.7) / 1.8, 0.0, 1.0)

    rgba = cv2.cvtColor(crop, cv2.COLOR_BGR2BGRA)
    mask_edge = (alpha > 0.04) & (alpha < 0.96)
    for c in range(3):
        ch = rgba[:, :, c].astype(np.float32)
        ch_clean = np.where(mask_edge, np.clip((ch - (1.0 - alpha) * 209.0) / np.maximum(alpha, 0.15), 0, 255), ch)
        rgba[:, :, c] = ch_clean.astype(np.uint8)
    rgba[:, :, 3] = (alpha * 255).astype(np.uint8)
    return rgba


def cutout_highres_jpg_rgba_matched(jpg_path, remove_pocket=False):
    """
    Cuts out one of the 765x1024 high-res JPGs (removing the bottom-right watermark while preserving colored pixels)
    and scales it so the head size matches the 800x800 reference video frames.
    """
    img = cv2.imread(jpg_path)
    h, w = img.shape[:2]
    b, g, r = img[:, :, 0].astype(float), img[:, :, 1].astype(float), img[:, :, 2].astype(float)
    is_wm = (np.arange(h)[:, None] > 920) & (np.arange(w)[None, :] > 670) & (np.abs(r - b) < 20)
    img[is_wm] = 255
    b, g, r = img[:, :, 0].astype(float), img[:, :, 1].astype(float), img[:, :, 2].astype(float)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(np.float32)
    yy, xx = np.mgrid[0:h, 0:w]

    is_airpod_band = (yy >= 460) & (yy <= 680)
    is_neutral_white = (np.abs(r - b) < 18) & (np.abs(r - g) < 18)
    bg_cand = np.where(is_airpod_band, (b >= 250) & (g >= 250) & (r >= 250), (gray >= 240) & is_neutral_white)

    labeled, _ = ndimage.label(bg_cand)
    border_labels = set(np.unique(np.concatenate([labeled[0, :], labeled[-1, :], labeled[:, 0], labeled[:, -1]]))) - {0}
    ext_bg = np.isin(labeled, list(border_labels))

    if remove_pocket:
        finger_holes = (xx > 310) & (xx < 460) & (yy > 700) & (yy < 920) & (gray >= 235) & is_neutral_white
        ext_bg = ext_bg | finger_holes

    dist_inside = ndimage.distance_transform_edt(~ext_bg)
    edge_shift = np.where(is_airpod_band, 0.6, 1.3)
    alpha = np.clip((dist_inside - edge_shift) / 1.8, 0.0, 1.0)

    rgba = cv2.cvtColor(img, cv2.COLOR_BGR2BGRA)
    mask_edge = (alpha > 0.02) & (alpha < 0.98)
    for c in range(3):
        ch = rgba[:, :, c].astype(np.float32)
        ch_clean = np.where(mask_edge, np.clip((ch - (1.0 - alpha) * 255.0) / np.maximum(alpha, 0.15), 0, 255), ch)
        rgba[:, :, c] = ch_clean.astype(np.uint8)
    rgba[:, :, 3] = (alpha * 255).astype(np.uint8)

    ys, xs = np.where(rgba[:, :, 3] > 15)
    y0, y1 = ys.min(), ys.max()
    x0, x1 = xs.min(), xs.max()
    crop_rgba = rgba[y0:y1 + 1, x0:x1 + 1]
    ch_h, ch_w = crop_rgba.shape[:2]

    target_h = 700.0 if ch_h > 820 else 638.0
    scale = min(target_h / ch_h, 660.0 / ch_w)
    nw, nh = int(ch_w * scale), int(ch_h * scale)
    resized = cv2.resize(crop_rgba, (nw, nh), interpolation=cv2.INTER_LANCZOS4)

    canvas = np.zeros((800, 800, 4), dtype=np.uint8)
    ox = (800 - nw) // 2
    oy = 60 if ch_h <= 820 else (800 - nh - 20)
    canvas[oy:oy + nh, ox:ox + nw] = resized
    return canvas


class PrimordialFaceSculptor:
    """
    Ultra-Refined 3D/2.5D Facial Expression Sculptor on the 800x800 Primordial Emoji:
    1. Spotless 36.2px Circular Iris + 3D Spherical White Sclera (_move_gaze_rigid):
       Eliminates any brown lower-eyelid smudge or unmasked iris ring when looking up/down/sideways.
    2. Corner-Anchored Seamless In-Lens Eyelid Closure (_apply_3d_blink):
       Both partial blinks (0.15..0.80) and full closures (1.0) stay anchored to the exact
       inner and outer canthus corners (y=410 at |nx_c|=1.0) with continuous inside-lens skin.
    3. True Stomion-Split Mouth Parting with Continuous Smile Blending (smile_mix 0.0..1.0):
       Smoothly blends between F0 (neutral) and F238 (native 3D smile) without any 1-frame snap,
       and parts the lips along the exact anatomical stomion curve.
    """
    def __init__(self, f0_bgr, f238_bgr):
        self.H, self.W = 800, 800
        self.yy, self.xx = np.mgrid[0:self.H, 0:self.W].astype(np.float32)

        self.f0_rgba = cutout_video_frame_rgba(f0_bgr)
        M_align = np.float32([[1, 0, 0], [0, 1, 2.0]])
        f238_aligned = cv2.warpAffine(f238_bgr, M_align, (f238_bgr.shape[1], f238_bgr.shape[0]), borderMode=cv2.BORDER_REPLICATE)
        self.f238_rgba = cutout_video_frame_rgba(f238_aligned)

        self.f0_bgr = self.f0_rgba[:, :, :3]
        self.f238_bgr = self.f238_rgba[:, :, :3]
        self.base_alpha = self.f0_rgba[:, :, 3]

        # Only blend F238 below y=438 (cheeks, mouth, chin) so the upper face and eyes (y<438)
        # ALWAYS preserve F0's exact 1:1 eye/eyelash geometry without any vertical ghosting!
        self.w_lower_face = np.clip((self.yy - 438.0) / 10.0, 0.0, 1.0)[..., None]

        self.inner_both, self.lash_both, self.y_open_l, self.y_open_r = self._build_exact_lut_apertures()

    def _build_exact_lut_apertures(self):
        pts_top_l = np.array([
            [233, 398.0], [234, 395.5], [236, 391.8], [238, 388.8], [240, 385.7],
            [244, 380.8], [248, 377.0], [252, 374.0], [256, 371.5], [260, 369.5],
            [264, 367.8], [270, 365.5], [277, 363.8], [285, 363.0], [293, 363.2],
            [301, 364.5], [309, 366.8], [316, 370.2], [322, 374.5], [326, 376.9],
            [330, 380.3], [334, 384.4], [338, 389.1], [342, 395.1], [346, 402.5], [347, 405.5]
        ], dtype=np.float32)
        pts_top_r = np.array([
            [453, 405.5], [456, 402.6], [460, 394.6], [464, 388.6], [468, 383.9],
            [472, 377.2], [478, 372.2], [484, 368.3], [491, 365.8], [499, 364.2],
            [507, 363.2], [515, 363.0], [523, 363.6], [530, 365.0], [536, 367.2],
            [540, 368.6], [544, 370.6], [548, 372.8], [552, 375.5], [556, 378.6],
            [560, 382.7], [564, 387.8], [566, 390.8], [568, 395.5], [569, 398.5]
        ], dtype=np.float32)
        pts_bot_l = np.array([
            [233, 399.5], [236, 406.8], [240, 412.2], [246, 417.2], [252, 421.2],
            [260, 425.2], [268, 428.6], [276, 430.8], [284, 431.8], [292, 432.2],
            [300, 432.0], [308, 431.5], [316, 430.6], [324, 429.0], [332, 426.4],
            [338, 423.4], [343, 419.8], [347, 407.5]
        ], dtype=np.float32)
        pts_bot_r = np.array([
            [453, 407.5], [457, 419.8], [462, 423.4], [468, 426.4], [476, 429.0],
            [484, 430.6], [492, 431.5], [500, 432.0], [508, 432.2], [516, 431.8],
            [524, 430.8], [532, 428.6], [540, 425.2], [548, 421.2], [554, 417.2],
            [560, 412.2], [564, 406.8], [568, 399.5]
        ], dtype=np.float32)

        xs = np.arange(800, dtype=np.float32)
        y_top_l = ndimage.gaussian_filter1d(np.interp(xs, pts_top_l[:, 0], pts_top_l[:, 1]), sigma=1.5)
        y_top_r = ndimage.gaussian_filter1d(np.interp(xs, pts_top_r[:, 0], pts_top_r[:, 1]), sigma=1.5)
        y_bot_l = ndimage.gaussian_filter1d(np.interp(xs, pts_bot_l[:, 0], pts_bot_l[:, 1]), sigma=1.5)
        y_bot_r = ndimage.gaussian_filter1d(np.interp(xs, pts_bot_r[:, 0], pts_bot_r[:, 1]), sigma=1.5)

        def make_eye_masks(y_top, y_bot, x_min, x_max, cx_peak):
            in_x = np.clip((self.xx - x_min) / 1.5, 0.0, 1.0) * np.clip((x_max - self.xx) / 1.5, 0.0, 1.0)
            in_top = np.clip((self.yy - (y_top[None, :] - 0.9)) / 1.5, 0.0, 1.0)
            in_bot = np.clip((y_bot[None, :] - self.yy) / 1.6, 0.0, 1.0)
            ap = in_x * in_top * in_bot
            w_center = np.power(np.clip(1.0 - ((self.xx - cx_peak) / 30.0) ** 2, 0.0, 1.0), 1.5)
            lash_band = (np.clip((self.yy - (y_top[None, :] - 2.2)) / 1.0, 0.0, 1.0) *
                         np.clip((y_top[None, :] + 0.3 - self.yy) / 1.2, 0.0, 1.0))
            return ap, lash_band * w_center

        ap_l, lash_l = make_eye_masks(y_top_l, y_bot_l, 233.5, 346.5, 290.0)
        ap_r, lash_r = make_eye_masks(y_top_r, y_bot_r, 453.5, 568.0, 510.0)
        inner_both = np.clip(ap_l + ap_r, 0.0, 1.0)[..., None]
        lash_both = np.clip(lash_l + lash_r, 0.0, 1.0)[..., None]
        return inner_both, lash_both, y_top_l - 2.5, y_top_r - 2.5

    def _move_gaze_rigid(self, img_bgr, gx, gy):
        if abs(gx) < 0.05 and abs(gy) < 0.05:
            return img_bgr
        eyeball = img_bgr.astype(np.float32).copy()
        for (cx_i, cy_i, cx_eye) in [(293.2, 397.5, 291.0), (505.8, 397.5, 509.0)]:
            # 1. Socket-fixed 3D Spherical White Sclera (never shifts dark bottom shading up into the eye!)
            dx_sock = self.xx - cx_eye
            dy_sock = self.yy - 398.0
            sph_shade = 1.0 - 0.000035 * (dx_sock ** 2) - 0.000045 * (dy_sock ** 2)
            sclera_bgr = np.array([220.0, 219.0, 223.0])[None, None, :] * np.clip(sph_shade, 0.88, 1.0)[..., None]

            # 2. Complete 3D Iris with upper-arch extension (ry_top=41.0) so zero white sliver appears under lash
            dx_i = self.xx - cx_i
            dy_i = self.yy - cy_i
            ry = np.where(dy_i < 0, 41.0, 36.2)
            r_norm = np.sqrt((dx_i / 36.4) ** 2 + (dy_i / ry) ** 2) * 36.2
            r_circ = np.sqrt(dx_i ** 2 + dy_i ** 2)

            iris_orig = img_bgr.astype(np.float32)
            t_vert = np.clip((self.yy - (cy_i - 35.0)) / 70.0, 0.0, 1.0)[..., None]
            synth_iris = (np.array([50.0, 62.0, 76.0])[None, None, :] * (1.0 - t_vert) +
                          np.array([86.0, 100.0, 120.0])[None, None, :] * t_vert)
            limbal_dark = np.clip((36.2 - r_norm) / 3.2, 0.55, 1.0)[..., None]
            synth_iris = synth_iris * limbal_dark

            in_safe_orig = (
                np.clip((32.5 - r_circ) / 3.0, 0.0, 1.0) *
                np.clip((self.yy - 369.0) / 3.0, 0.0, 1.0) *
                np.clip((427.0 - self.yy) / 3.0, 0.0, 1.0)
            )[..., None]
            clean_iris = iris_orig * in_safe_orig + synth_iris * (1.0 - in_safe_orig)
            w_iris = np.clip((36.2 - r_norm) / 1.8, 0.0, 1.0)[..., None]

            iris_rgba = np.dstack([clean_iris, w_iris])
            shifted_iris_rgba = cv2.remap(
                iris_rgba,
                (self.xx - gx).astype(np.float32),
                (self.yy - gy).astype(np.float32),
                interpolation=cv2.INTER_LANCZOS4,
                borderMode=cv2.BORDER_CONSTANT,
                borderValue=(0, 0, 0, 0)
            )
            sh_iris = shifted_iris_rgba[:, :, :3]
            sh_w = shifted_iris_rgba[:, :, 3:4]

            eye_patch = sh_iris * sh_w + sclera_bgr * (1.0 - sh_w)
            box = (np.abs(dx_sock) < 85) & (np.abs(dy_sock) < 55)
            eyeball = np.where(box[..., None], eye_patch, eyeball)

        comp = img_bgr.astype(np.float32) * (1.0 - self.inner_both) + eyeball * self.inner_both
        lash_col = np.array([38.0, 35.0, 42.0])[None, None, :]
        comp = comp * (1.0 - self.lash_both * 0.95) + lash_col * (self.lash_both * 0.95)
        return np.clip(comp, 0, 255).astype(np.uint8)

    def _apply_3d_blink(self, img_bgr, blink_l=0.0, blink_r=0.0, arch_style="relaxed"):
        if blink_l <= 0.02 and blink_r <= 0.02:
            return img_bgr
        out = img_bgr.copy().astype(np.float32)
        b_ch, g_ch, r_ch = img_bgr[:, :, 0].astype(float), img_bgr[:, :, 1].astype(float), img_bgr[:, :, 2].astype(float)
        xs = np.arange(800, dtype=np.float32)

        for blink_val, (ex, ey, erx, ery, is_left, y_open_1d) in [
            (blink_l, (289.5, 400.0, 68.0, 39.0, True,  self.y_open_l)),
            (blink_r, (510.5, 400.0, 68.0, 39.0, False, self.y_open_r))
        ]:
            if blink_val <= 0.02:
                continue
            nx = (self.xx - ex) / erx
            nx_c = (self.xx - ex) / 58.5

            y_top_1d = 351.0 + 7.0 * ((xs - ex) / erx) ** 2
            y_bot_1d = 437.0 - 5.0 * ((xs - ex) / erx) ** 2

            p_top = np.zeros((800, 3), dtype=np.float32)
            p_bot = np.zeros((800, 3), dtype=np.float32)
            for x_i in range(int(ex - erx - 8), int(ex + erx + 8)):
                x_src = min(x_i, 338) if is_left else max(x_i, 462)
                yt = int(np.clip(y_top_1d[x_src], 348, 366))
                yb = int(np.clip(y_bot_1d[x_src], 426, 445))
                p_top[x_i] = np.mean(out[yt - 2:yt + 1, x_src, :], axis=0)
                p_bot[x_i] = np.mean(out[yb:yb + 3, x_src, :], axis=0)
            p_top = cv2.GaussianBlur(p_top[None, :, :], (19, 1), 5.0)[0]
            p_bot = cv2.GaussianBlur(p_bot[None, :, :], (19, 1), 5.0)[0]

            y_top = 351.0 + 7.0 * nx * nx
            y_bot = 437.0 - 5.0 * nx * nx
            t_v = np.clip((self.yy - y_top) / np.maximum(1.0, y_bot - y_top), 0.0, 1.0)[..., None]

            lid_skin = p_top[None, :, :] * (1.0 - t_v) + p_bot[None, :, :] * t_v
            bulge = 1.0 + 0.045 * np.sin(t_v * np.pi) * np.clip(1.0 - nx[..., None] ** 2, 0.0, 1.0)
            crease_sub = 0.090 * np.exp(-((t_v - 0.17) / 0.055) ** 2) * np.clip(1.0 - (nx[..., None] / 0.82) ** 2, 0.0, 1.0)
            lid_skin = np.clip(lid_skin * (bulge - crease_sub), 0, 255)

            open_top_y = y_open_1d[None, :]
            if arch_style == "happy" and blink_val > 0.85:
                closed_bot_y = 397.0 + 6.5 * (nx_c * nx_c)
            else:
                closed_bot_y = 414.5 - 12.0 * (nx_c * nx_c)

            lash_y = open_top_y + (closed_bot_y - open_top_y) * min(1.0, blink_val)

            fill_bot = y_bot if blink_val > 0.85 else lash_y + 1.2
            in_v = np.clip((self.yy - y_top) / 3.8, 0.0, 1.0) * np.clip((fill_bot - self.yy) / 2.0, 0.0, 1.0)
            in_h = np.clip((1.0 - nx * nx) * 4.0, 0.0, 1.0)

            is_blue_metal = (self.yy < 384) & ((b_ch - r_ch) > 8) & (np.abs(self.xx - 400.0) < 62)
            if is_left:
                bridge_safe = np.clip((350.5 - self.xx) / 3.5, 0.0, 1.0) * (~is_blue_metal).astype(np.float32)
            else:
                bridge_safe = np.clip((self.xx - 449.5) / 3.5, 0.0, 1.0) * (~is_blue_metal).astype(np.float32)

            alpha_skin = (in_v * in_h * bridge_safe)[..., None]
            out = out * (1.0 - alpha_skin) + lid_skin * alpha_skin

            taper = np.clip(1.0 - nx_c * nx_c, 0.0, 1.0)
            lash_half_w = 1.4 + 2.4 * taper
            dist_lash = np.abs(self.yy - lash_y)
            lash_alpha = (np.clip(1.0 - dist_lash / np.maximum(0.8, lash_half_w), 0.0, 1.0) * np.power(taper, 0.45) * bridge_safe)[..., None] * 0.94
            shad_dist = np.abs(self.yy - (lash_y + 2.5))
            shad_alpha = (np.clip(1.0 - shad_dist / 3.0, 0.0, 1.0) * taper * bridge_safe)[..., None] * 0.24
            out = out * (1.0 - shad_alpha) + (lid_skin * 0.55) * shad_alpha
            lash_col = np.array([32.0, 25.0, 36.0])[None, None, :]
            out = out * (1.0 - lash_alpha) + lash_col * lash_alpha

        return np.clip(out, 0, 255).astype(np.uint8)

    def sculpt(self,
               use_smile_base=False,
               smile_mix=None,
               smirk_dir=0.0,
               gaze_x=0.0, gaze_y=0.0,
               blink_l=0.0, blink_r=0.0,
               blink_style="relaxed",
               eye_scale=0.0,
               brow_l_dy=0.0, brow_r_dy=0.0,
               brow_tilt_l=0.0, brow_tilt_r=0.0,
               smile_l=0.0, smile_r=0.0,
               mouth_open=0.0, mouth_width=0.0,
               show_teeth=True,
               head_yaw=0.0, head_pitch=0.0, head_roll=0.0):
        # 1. Select or smoothly blend base (F0 neutral vs F238 native 3D smile strictly below y=438)
        if smile_mix is None:
            eff_smile_mix = 1.0 if use_smile_base else 0.0
        else:
            eff_smile_mix = float(np.clip(smile_mix, 0.0, 1.0))

        if abs(smirk_dir) > 0.05:
            sig = 1.0 / (1.0 + np.exp(-(self.xx - 400.0) / 24.0))
            mix = (sig if smirk_dir > 0 else (1.0 - sig)) * abs(smirk_dir)
            w_f238 = mix[..., None] * self.w_lower_face
            base_bgr = (self.f0_bgr.astype(np.float32) * (1.0 - w_f238) +
                        self.f238_bgr.astype(np.float32) * w_f238).astype(np.uint8)
            eff_smile_mix = 0.5 * abs(smirk_dir)
        elif eff_smile_mix > 0.01:
            w_f238 = eff_smile_mix * self.w_lower_face
            base_bgr = (self.f0_bgr.astype(np.float32) * (1.0 - w_f238) +
                        self.f238_bgr.astype(np.float32) * w_f238).astype(np.uint8)
        else:
            base_bgr = self.f0_bgr.copy()

        # 2. Spotless 36.2px circular iris gaze tracking inside 3D white sclera
        base_bgr = self._move_gaze_rigid(base_bgr, gaze_x, gaze_y)

        # 3. Corner-anchored seamless inside-lens 3D Eyelid Blink / Wink
        base_bgr = self._apply_3d_blink(base_bgr, blink_l, blink_r, arch_style=blink_style)

        rgba = np.dstack([base_bgr, self.base_alpha])
        dx = np.zeros_like(self.xx)
        dy = np.zeros_like(self.yy)

        # 4. Eye Scale
        if abs(eye_scale) > 0.01:
            for (ex, ey) in [(291.0, 400.0), (509.0, 400.0)]:
                vx = self.xx - ex
                vy = self.yy - ey
                r2 = (vx * vx + vy * vy) / (36.0 * 36.0)
                w = np.exp(-r2 * 1.2)
                dx -= vx * w * eye_scale
                dy -= vy * w * eye_scale

        # 5. Eyebrows (clamped strictly at y <= 330 so top glass lens rim at y=335 is untouched)
        above_lens = np.clip((330.0 - self.yy) / 5.0, 0.0, 1.0)
        for (bx, by, b_dy, b_tilt, sign) in [
            (287.0, 313.0, brow_l_dy, brow_tilt_l, 1.0),
            (513.0, 313.0, brow_r_dy, brow_tilt_r, -1.0)
        ]:
            if abs(b_dy) > 0.1 or abs(b_tilt) > 0.1:
                nx = (self.xx - bx) / 68.0
                ny = (self.yy - by) / 24.0
                w = np.exp(-(nx * nx + ny * ny) * 1.05) * above_lens
                local_dy = b_dy + b_tilt * (sign * nx * 1.3)
                dy -= w * local_dy

        brow_zone = (self.yy > 250.0) & (self.yy < 331.5)
        dy = np.where(brow_zone, np.minimum(dy, 330.0 - self.yy), dy)

        # 6. Natural 3D Mouth & Lip Sculpting (strictly below nose tip y > 528)
        nx_m = (self.xx - 400.0) / 78.0
        y_stom_f0 = 573.0 - 8.5 * (nx_m * nx_m)
        y_stom_f238 = 569.0 - 11.5 * (nx_m * nx_m)
        y_stom = y_stom_f0 * (1.0 - eff_smile_mix) + y_stom_f238 * eff_smile_mix

        # Pre-clean the dark closed-mouth stomion line when the mouth opens so no residual line remains
        if mouth_open > 0.8:
            clean_strength = float(np.clip((mouth_open - 0.8) / 3.0, 0.0, 1.0))
            stom_band = (
                np.exp(-((self.yy - y_stom) / 6.0) ** 2) *
                np.clip(1.0 - (nx_m / 1.22) ** 4, 0.0, 1.0)
            )[..., None] * clean_strength
            y_up_sample = np.clip((y_stom - 8.0).astype(np.int32), 0, 799)
            y_dn_sample = np.clip((y_stom + 9.0).astype(np.int32), 0, 799)
            x_idx = np.clip(self.xx.astype(np.int32), 0, 799)
            lip_fill = 0.52 * rgba[y_up_sample, x_idx, :3].astype(np.float32) + 0.48 * rgba[y_dn_sample, x_idx, :3].astype(np.float32)
            rgba[:, :, :3] = np.clip(rgba[:, :, :3].astype(np.float32) * (1.0 - stom_band) + lip_fill * stom_band, 0, 255).astype(np.uint8)

        # When mouth narrows (mouth_width < 0, e.g. O/U/Shock), preserve the main lip body (|x-400| <= 62px)
        # and soften the pointed outer corner commissures at |x-400| in [62..98] so the contracted lips
        # wrap smoothly around the oval cavity without any pointed outer wings
        if mouth_width < -1.0:
            narrow_t = float(np.clip(-mouth_width / 11.0, 0.0, 1.0))
            abs_dx = np.abs(self.xx - 400.0)
            wing_x = np.clip((abs_dx - 62.0) / 9.0, 0.0, 1.0) * np.clip((98.0 - abs_dx) / 10.0, 0.0, 1.0)
            wing_y = np.exp(-((self.yy - 564.0) / 13.0) ** 2)
            wing_mask = (wing_x * wing_y * narrow_t)[..., None]
            y_cheek = np.clip((self.yy - 16.0).astype(np.int32), 0, 799)
            x_cheek = np.clip(self.xx.astype(np.int32), 0, 799)
            cheek_rgb = rgba[y_cheek, x_cheek, :3].astype(np.float32)
            rgba[:, :, :3] = np.clip(rgba[:, :, :3].astype(np.float32) * (1.0 - wing_mask) + cheek_rgb * wing_mask, 0, 255).astype(np.uint8)

        below_nose = np.clip((self.yy - 528.0) / 9.0, 0.0, 1.0)
        for (cx_m, s_val, x_sign) in [(322.0, smile_l, -1.0), (478.0, smile_r, 1.0)]:
            if abs(s_val) > 0.1:
                nx = (self.xx - cx_m) / 52.0
                ny = (self.yy - 566.0) / 36.0
                w = np.exp(-(nx * nx + ny * ny) * 1.1) * below_nose
                dx -= w * (x_sign * s_val * 0.42)
                dy -= w * (-s_val)

        # Coupled 3D Horizontal Lip Contraction/Expansion
        ap_rx = float(np.clip(64.0 + mouth_width * 1.50, 36.0, 76.0))
        scale_x = 0.0
        if abs(mouth_width) > 0.1:
            r_lip_0 = 66.0
            r_lip_target = float(np.clip(66.0 + mouth_width * 1.30, ap_rx + 7.5, 78.0))
            scale_x = ((r_lip_0 / r_lip_target) - 1.0) * 1.18
            w_horiz = np.exp(-((self.xx - 400.0) / 96.0) ** 4)
            w_vert = np.exp(-((self.yy - 574.0) / 45.0) ** 2) * below_nose
            dx += (self.xx - 400.0) * scale_x * w_horiz * w_vert

        if mouth_open < -0.1:
            n_x = np.clip(1.0 - nx_m * nx_m, 0.0, 1.0)
            dist_s = self.yy - y_stom
            w_press = np.exp(-(dist_s / 18.0) ** 2) * n_x * below_nose
            dy += dist_s * (-mouth_open * 0.075) * w_press

        if mouth_open > 0.2:
            nx_ap = (self.xx - 400.0) / ap_rx
            p_shape = float(np.clip(0.85 + 0.024 * mouth_width, 0.52, 0.90))
            horiz_prof = np.power(np.clip(1.0 - nx_ap * nx_ap, 0.0, 1.0), p_shape)

            corner_shift = -0.55 * (smile_l * np.clip(-nx_m, 0, 1) + smile_r * np.clip(nx_m, 0, 1))
            narrowness = float(np.clip(-mouth_width / 14.0, 0.0, 1.0))

            nx_m_src = nx_m * (1.0 + 0.85 * scale_x)
            y_stom_src = (573.0 - 8.5 * (nx_m_src ** 2)) * (1.0 - eff_smile_mix) + (569.0 - 11.5 * (nx_m_src ** 2)) * eff_smile_mix

            y_mid_oval = 574.5 + 0.12 * mouth_open
            y_stom_eff = (y_stom + corner_shift) * (1.0 - narrowness) + y_mid_oval * narrowness

            up_ratio = 0.26 + 0.22 * narrowness
            dn_ratio = 0.74 + 0.08 * narrowness
            up_shift = up_ratio * mouth_open * horiz_prof
            dn_shift = dn_ratio * mouth_open * horiz_prof

            y_upper_edge = y_stom_eff - up_shift
            y_lower_edge = y_stom_eff + dn_shift

            w_x_env = np.exp(-((self.xx - 400.0) / (ap_rx + 18.0)) ** 4)
            dy_mid = (y_stom_src - y_stom_eff) * w_x_env

            fade_up = np.clip((self.yy - 528.0) / np.maximum(1.0, y_upper_edge - 528.0), 0.0, 1.0)
            fade_dn = np.clip((728.0 - self.yy) / np.maximum(1.0, 728.0 - (y_lower_edge + 36.0)), 0.0, 1.0)
            fade_dn_full = np.where(self.yy < y_lower_edge + 36.0, 1.0, fade_dn)
            fade_up_full = np.where(self.yy > y_upper_edge - 18.0, 1.0, fade_up)

            half_gap = np.maximum(2.5, 0.5 * (y_lower_edge - y_upper_edge))
            mid_gap = 0.5 * (y_upper_edge + y_lower_edge)
            t_lip = (self.yy - mid_gap) / half_gap

            w_up = 0.5 * (1.0 - np.tanh((t_lip + 0.65) * 2.2))
            w_dn = 0.5 * (1.0 + np.tanh((t_lip - 0.65) * 2.2))
            dy_split = (
                dy_mid * (fade_up_full * fade_dn_full) +
                w_up * (up_shift * fade_up) -
                w_dn * (dn_shift * fade_dn_full)
            )
            dy += dy_split.astype(np.float32)

        warped = cv2.remap(rgba, (self.xx + dx).astype(np.float32), (self.yy + dy).astype(np.float32),
                           interpolation=cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_CONSTANT, borderValue=(0, 0, 0, 0))

        # 7. Render natural 3D oral cavity, warm inner lip mucosa roll, tongue & optional upper teeth
        if mouth_open > 1.5:
            out_bgr = warped[:, :, :3].astype(np.float32)
            nx_ap = (self.xx - 400.0) / ap_rx
            p_shape = float(np.clip(0.85 + 0.024 * mouth_width, 0.52, 0.90))
            horiz_prof = np.power(np.clip(1.0 - nx_ap * nx_ap, 0.0, 1.0), p_shape)

            corner_shift = -0.55 * (smile_l * np.clip(-nx_m, 0, 1) + smile_r * np.clip(nx_m, 0, 1))
            narrowness = float(np.clip(-mouth_width / 14.0, 0.0, 1.0))
            y_mid_oval = 574.5 + 0.12 * mouth_open
            y_stom_eff = (y_stom + corner_shift) * (1.0 - narrowness) + y_mid_oval * narrowness

            up_ratio = 0.26 + 0.22 * narrowness
            dn_ratio = 0.74 + 0.08 * narrowness
            y_upper_edge = y_stom_eff - up_ratio * mouth_open * horiz_prof
            y_lower_edge = y_stom_eff + dn_ratio * mouth_open * horiz_prof

            gap_h = np.maximum(0.5, y_lower_edge - y_upper_edge)
            t_gap = np.clip((self.yy - y_upper_edge) / gap_h, 0.0, 1.0)

            dist_inside_y = np.minimum(self.yy - y_upper_edge, y_lower_edge - self.yy)
            dist_inside_x = (1.0 - np.abs(nx_ap)) * ap_rx
            dist_inside = np.minimum(dist_inside_y, dist_inside_x)

            # Warm subsurface-scattered inner lip roll
            in_x_span = np.clip((1.08 - np.abs(nx_ap)) * 4.0, 0.0, 1.0)
            roll_w = (0.28 * np.exp(-((dist_inside + 1.0) / 2.2) ** 2) * in_x_span)[..., None]
            inner_lip_col = np.array([72.0, 74.0, 118.0])[None, None, :]
            out_bgr = out_bgr * (1.0 - roll_w) + inner_lip_col * roll_w

            # Smooth anti-aliased interior cavity mask (2.2px soft transition across dist_inside = 0)
            in_gap = np.clip((dist_inside + 0.9) / 2.2, 0.0, 1.0)[..., None]

            cyl_light = np.clip(1.0 - 0.50 * (nx_ap * nx_ap), 0.35, 1.0)[..., None]
            cav_bgr = np.array([34.0, 28.0, 62.0])[None, None, :] * cyl_light

            tongue_y = np.clip((t_gap - 0.38) / 0.24, 0.0, 1.0)
            tongue_x = np.clip(1.0 - (nx_ap * 1.08) ** 2, 0.0, 1.0)
            tongue_mask = (tongue_y * tongue_x)[..., None]
            tongue_dome = (0.82 + 0.24 * np.sin(t_gap[..., None] * np.pi)) * (1.0 - 0.07 * np.exp(-((nx_ap / 0.20) ** 2))[..., None])
            tongue_bgr = np.array([66.0, 60.0, 138.0])[None, None, :] * cyl_light * tongue_dome
            cav_bgr = cav_bgr * (1.0 - tongue_mask * 0.85) + tongue_bgr * (tongue_mask * 0.85)

            if show_teeth:
                teeth_bottom_t = np.clip(6.2 / np.maximum(6.2, gap_h), 0.25, 0.44)
                teeth_mask = (np.clip((teeth_bottom_t - t_gap) / 0.12, 0.0, 1.0) * np.clip(1.0 - (nx_ap * 1.05) ** 2, 0.0, 1.0))[..., None]
                tooth_groove = 1.0 - 0.05 * (np.cos((self.xx - 400.0) * (2.0 * np.pi / 13.5)) ** 8)[..., None]
                top_ao = np.clip(t_gap / 0.14, 0.55, 1.0)[..., None]
                teeth_bgr = np.array([208.0, 216.0, 228.0])[None, None, :] * cyl_light * tooth_groove * top_ao
                cav_bgr = cav_bgr * (1.0 - teeth_mask * 0.90) + teeth_bgr * (teeth_mask * 0.90)

            inner_ao = np.clip(dist_inside / 2.8, 0.68, 1.0)[..., None]
            top_overhang_ao = np.clip(t_gap / 0.18, 0.65, 1.0)[..., None]
            cav_bgr = cav_bgr * inner_ao * top_overhang_ao

            out_bgr = out_bgr * (1.0 - in_gap) + cav_bgr * in_gap
            warped[:, :, :3] = np.clip(out_bgr, 0, 255).astype(np.uint8)

        # 8. Subtle 2.5D Head Parallax (Yaw & Pitch) AFTER mouth cavity rendering so mouth and cavity never detach
        if abs(head_yaw) > 0.1 or abs(head_pitch) > 0.1:
            nx_h = (self.xx - 400.0) / 210.0
            ny_h = (self.yy - 410.0) / 240.0
            w_h = np.exp(-(nx_h * nx_h + ny_h * ny_h) * 1.1)
            dx_h = (-w_h * head_yaw).astype(np.float32)
            dy_h = (-w_h * head_pitch).astype(np.float32)
            warped = cv2.remap(warped, self.xx + dx_h, self.yy + dy_h,
                               interpolation=cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_CONSTANT, borderValue=(0, 0, 0, 0))

        # 9. Head Roll (Tilt)
        if abs(head_roll) > 0.2:
            M_rot = cv2.getRotationMatrix2D((400.0, 410.0), head_roll, 1.0)
            warped = cv2.warpAffine(warped, M_rot, (800, 800), flags=cv2.INTER_LANCZOS4,
                                    borderMode=cv2.BORDER_CONSTANT, borderValue=(0, 0, 0, 0))

        return warped


def save_both_formats(slug, rgba_800):
    png_path = os.path.join(DIR_PNG, f"{slug}.png")
    cv2.imwrite(png_path, rgba_800)

    alpha = rgba_800[:, :, 3:4].astype(np.float32) / 255.0
    bg = np.full((800, 800, 3), STUDIO_BG_BGR, dtype=np.float32)
    comp = (rgba_800[:, :, :3].astype(np.float32) * alpha + bg * (1.0 - alpha)).astype(np.uint8)
    studio_path = os.path.join(DIR_STUDIO, f"{slug}.png")
    cv2.imwrite(studio_path, comp)
    return comp


def build_all_36_feicoes_and_animations():
    cap = cv2.VideoCapture(REF_VIDEO)
    vid_frames = []
    while True:
        ret, f = cap.read()
        if not ret:
            break
        vid_frames.append(f)
    cap.release()
    print(f"Loaded {len(vid_frames)} frames from reference video.")

    skep_rgba = cutout_highres_jpg_rgba_matched(SKEP_JPG)
    schem_rgba = cutout_highres_jpg_rgba_matched(SCHEM_JPG, remove_pocket=True)
    heart_rgba = cutout_highres_jpg_rgba_matched(HEART_JPG)

    sculptor = PrimordialFaceSculptor(vid_frames[0], vid_frames[238])
    gallery_thumbs = []

    # --- GROUP A & B: 20 Sculpted Facial Expressions from Primordial Emoji ---
    feicoes_sculpted = [
        ("01_neutro_focado",            dict(use_smile_base=False)),
        ("02_sorriso_gentil",           dict(use_smile_base=True)),
        ("03_sorriso_largo_feliz",      dict(use_smile_base=True, smile_l=7, smile_r=7, mouth_open=16, mouth_width=6, brow_l_dy=-7, brow_r_dy=-7, show_teeth=True)),
        ("04_sorriso_maroto_smirk_dir", dict(smirk_dir=1.0, smile_r=9, brow_l_dy=4, brow_r_dy=-11, gaze_x=5)),
        ("05_sorriso_maroto_smirk_esq", dict(smirk_dir=-1.0, smile_l=9, brow_l_dy=-11, brow_r_dy=4, gaze_x=-5)),
        ("06_piscadinha_wink_direito",  dict(use_smile_base=True, blink_r=1.0, blink_style="happy", smile_r=8, brow_l_dy=-8, brow_r_dy=3, head_roll=-3)),
        ("07_piscadinha_wink_esquerdo", dict(use_smile_base=True, blink_l=1.0, blink_style="happy", smile_l=8, brow_r_dy=-8, brow_l_dy=3, head_roll=3)),
        ("08_olhos_fechados_zen",       dict(use_smile_base=True, blink_l=1.0, blink_r=1.0, blink_style="relaxed", smile_l=3, smile_r=3)),
        ("09_sobrancelha_arqueada_rock",dict(smirk_dir=0.8, brow_l_dy=6, brow_r_dy=-13, brow_tilt_r=-5, smile_r=6)),
        ("10_desconfiado_side_eye_dir", dict(gaze_x=15, brow_l_dy=5, brow_r_dy=-10, smile_l=-5)),
        ("11_desconfiado_side_eye_esq", dict(gaze_x=-15, brow_r_dy=5, brow_l_dy=-10, smile_r=-5)),
        ("12_surpreso_uau_chocado",     dict(eye_scale=0.12, brow_l_dy=-12, brow_r_dy=-12, mouth_open=23, mouth_width=-14, show_teeth=False)),
        ("13_bravo_serio_focado",       dict(brow_l_dy=9, brow_r_dy=9, brow_tilt_l=9, brow_tilt_r=9, smile_l=-7, smile_r=-7)),
        ("14_triste_desapontado",       dict(brow_l_dy=-4, brow_r_dy=-4, brow_tilt_l=-9, brow_tilt_r=-9, smile_l=-10, smile_r=-10, gaze_y=6)),
        ("15_revirando_olhos_tedio",    dict(gaze_x=4, gaze_y=-16, brow_l_dy=-7, brow_r_dy=-7, smile_l=-6, smile_r=2, mouth_width=-5, head_roll=2.5)),
        ("16_pensativo_olhando_cima",   dict(gaze_x=-12, gaze_y=-11, brow_l_dy=-10, brow_r_dy=4, mouth_width=-7, smile_l=-3, head_roll=3)),
        ("17_fala_vogal_A_aberto",      dict(use_smile_base=True, mouth_open=18, mouth_width=2, smile_l=3, smile_r=3, brow_l_dy=-5, brow_r_dy=-5, show_teeth=True)),
        ("18_fala_vogal_O_U_redondo",   dict(mouth_open=16, mouth_width=-14, brow_l_dy=-4, brow_r_dy=-4, show_teeth=False)),
        ("19_fala_vogal_E_I_sorrindo",  dict(use_smile_base=True, mouth_open=11, mouth_width=8, smile_l=5, smile_r=5, show_teeth=True)),
        ("20_fala_consoante_M_B_P",     dict(mouth_open=-5, mouth_width=4, brow_l_dy=-3, brow_r_dy=-3)),
    ]

    for slug, params in feicoes_sculpted:
        rgba = sculptor.sculpt(**params)
        comp = save_both_formats(slug, rgba)
        thumb = cv2.resize(comp, (180, 180))
        cv2.putText(thumb, slug[:18], (6, 170), cv2.FONT_HERSHEY_SIMPLEX, 0.38, (20, 20, 20), 1)
        gallery_thumbs.append(thumb)

    # --- GROUP C: 12 Real 3D Angles Extracted & Cut Out from Reference Video ---
    video_angle_specs = [
        ("21_angulo_3d_15_esq_focado",       24),
        ("22_angulo_3d_30_esq_suave",        32),
        ("23_angulo_3d_45_esq_tres_quartos", 40),
        ("24_angulo_3d_65_esq_lateral",      47),
        ("25_angulo_3d_90_esq_perfil",       55),
        ("26_angulo_3d_135_esq_nuca",        64),
        ("27_angulo_3d_180_costas_waves",    72),
        ("28_angulo_3d_135_dir_nuca",        80),
        ("29_angulo_3d_90_dir_perfil",       89),
        ("30_angulo_3d_65_dir_lateral",      94),
        ("31_angulo_3d_45_dir_tres_quartos", 98),
        ("32_angulo_3d_25_dir_sorriso",      198),
    ]
    for slug, f_idx in video_angle_specs:
        rgba = cutout_video_frame_rgba(vid_frames[f_idx])
        comp = save_both_formats(slug, rgba)
        thumb = cv2.resize(comp, (180, 180))
        cv2.putText(thumb, slug[:18], (6, 170), cv2.FONT_HERSHEY_SIMPLEX, 0.38, (20, 20, 20), 1)
        gallery_thumbs.append(thumb)

    # --- GROUP D: 4 Additional Expressive Poses (Unified 800x800 Head Scale) ---
    extra_poses = [
        ("33_inclinado_desconfiado_original", skep_rgba),
        ("34_inclinado_curioso_esquerda",     sculptor.sculpt(use_smile_base=True, head_roll=9, brow_l_dy=-11, gaze_x=-8)),
        ("35_estrategista_maos_piramide",     schem_rgba),
        ("36_impactado_segurando_coracao",    heart_rgba),
    ]
    for slug, rgba in extra_poses:
        comp = save_both_formats(slug, rgba)
        thumb = cv2.resize(comp, (180, 180))
        cv2.putText(thumb, slug[:18], (6, 170), cv2.FONT_HERSHEY_SIMPLEX, 0.38, (20, 20, 20), 1)
        gallery_thumbs.append(thumb)

    rows = [np.hstack(gallery_thumbs[r * 6:(r + 1) * 6]) for r in range(6)]
    cv2.imwrite(os.path.join(SCRATCH_DIR, "master_36_feicoes.jpg"), np.vstack(rows))
    cv2.imwrite(os.path.join(PRIM_DIR, "CATALOGO_36_FEICOES.jpg"), np.vstack(rows))
    print("Generated all 36 static feicoes (PNG Transparent + Studio #D1D1D1)!")

    # ==========================================================================
    # PART 2: 12 REAL 3D ANIMATIONS IN THE EXACT STANDARD OF THE REFERENCE VIDEO
    # ==========================================================================
    def save_anim_mp4_and_gif(slug, frames_bgr_list, fps=24):
        mp4_raw = os.path.join(SCRATCH_DIR, f"{slug}_raw.mp4")
        mp4_out = os.path.join(DIR_ANIM, f"{slug}.mp4")
        gif_out = os.path.join(DIR_ANIM, f"{slug}.gif")
        h, w = frames_bgr_list[0].shape[:2]
        writer = cv2.VideoWriter(mp4_raw, cv2.VideoWriter_fourcc(*"mp4v"), fps, (w, h))
        gif_pil = []
        for idx, fbgr in enumerate(frames_bgr_list):
            writer.write(fbgr)
            if idx % 2 == 0:
                rgb = cv2.cvtColor(fbgr, cv2.COLOR_BGR2RGB)
                gif_pil.append(Image.fromarray(rgb).resize((360, 360), Image.Resampling.LANCZOS))
        writer.release()
        subprocess.run([
            "ffmpeg", "-y", "-v", "error", "-i", mp4_raw,
            "-c:v", "libx264", "-preset", "fast", "-crf", "17", "-pix_fmt", "yuv420p",
            mp4_out
        ], check=True)
        gif_pil[0].save(gif_out, save_all=True, append_images=gif_pil[1:], duration=int(1000 / (fps / 2)), loop=0)
        print("Saved animation:", slug)

    def get_vid_square(f_float):
        idx0 = int(math.floor(f_float)) % len(vid_frames)
        idx1 = min(len(vid_frames) - 1, idx0 + 1)
        frac = f_float - math.floor(f_float)
        c0 = vid_frames[idx0][:, 280:1000]
        c1 = vid_frames[idx1][:, 280:1000]
        if frac < 0.01:
            return c0.copy()
        return cv2.addWeighted(c0, 1.0 - frac, c1, frac, 0.0)

    def render_sculpted_on_studio(params):
        rgba = sculptor.sculpt(**params)
        alpha = rgba[:, :, 3:4].astype(np.float32) / 255.0
        bg = np.full((800, 800, 3), STUDIO_BG_BGR, dtype=np.float32)
        comp = (rgba[:, :, :3].astype(np.float32) * alpha + bg * (1.0 - alpha)).astype(np.uint8)
        return cv2.resize(comp, (720, 720), interpolation=cv2.INTER_LANCZOS4)

    # 1. Giro 360 Completo (Turntable 3D original em 720x720)
    f_360 = [get_vid_square(i) for i in range(18, 110)]
    save_anim_mp4_and_gif("01_giro_360_completo_3d", f_360, fps=24)

    # 2. Dizendo NÃO em 3D Real
    f_nao = []
    for i in range(60):
        t = i / 60.0
        angle_norm = math.sin(t * math.pi * 4) * math.exp(-t * 1.2)
        f_idx = 18.0 + abs(angle_norm) * 20.0
        sq = get_vid_square(f_idx)
        if angle_norm < 0:
            sq = cv2.flip(sq, 1)
        f_nao.append(sq)
    save_anim_mp4_and_gif("02_dizendo_NAO_cabeca_3d", f_nao, fps=24)

    # 3. Virada Dramática 180°
    f_180 = [get_vid_square(i) for i in range(72, 109)] + [get_vid_square(i) for i in range(214, 239)]
    save_anim_mp4_and_gif("03_virada_dramatica_180_sorriso", f_180, fps=24)

    # 4. Inspecionando os Dois Lados em 3D
    seq_insp = (
        [18 + (i / 18.0) * 24 for i in range(18)] +
        [42 - (i / 18.0) * 24 for i in range(18)] +
        [144 + (i / 18.0) * 14 for i in range(18)] +
        [194 + (i / 20.0) * 44 for i in range(20)]
    )
    f_insp = [get_vid_square(x) for x in seq_insp]
    save_anim_mp4_and_gif("04_inspecionando_lados_3d", f_insp, fps=24)

    # 5. Double-Take 3D
    f_dt = []
    for i in range(14):
        f_dt.append(get_vid_square(158))
    for i in range(8):
        f_dt.append(get_vid_square(158 - (i / 7.0) * 18))
    for i in range(36):
        lt = i / 36.0
        bl = 1.0 if (0.08 < lt < 0.20 or 0.30 < lt < 0.42) else 0.0
        brow = -12.0 * min(1.0, max(0.0, (lt - 0.25) * 3.0))
        f_dt.append(render_sculpted_on_studio(dict(
            blink_l=bl, blink_r=bl, brow_r_dy=brow, brow_l_dy=brow * 0.4,
            eye_scale=0.09 if lt > 0.4 else 0.0, smirk_dir=0.7 * min(1.0, max(0.0, (lt - 0.4) * 3.0))
        )))
    save_anim_mp4_and_gif("05_double_take_surpresa_3d", f_dt, fps=24)

    # 6. Piscadinha (Wink) & Sorriso de Canto
    f_wink = []
    for i in range(48):
        lt = i / 48.0
        w = math.sin(min(1.0, max(0.0, (lt - 0.12) / 0.65)) * math.pi)
        f_wink.append(render_sculpted_on_studio(dict(
            smirk_dir=w * 1.0,
            blink_r=w * 1.0,
            blink_style="happy",
            smile_r=w * 9.0,
            brow_l_dy=-w * 9.0,
            brow_r_dy=w * 3.0,
            head_yaw=w * 6.0,
            head_roll=-w * 3.5
        )))
    save_anim_mp4_and_gif("06_piscadinha_wink_charme", f_wink, fps=24)

    # 7. Aceno "SIM" Confiante + Sorriso 3D
    f_sim = []
    for i in range(48):
        lt = i / 48.0
        nod = math.sin(lt * math.pi * 4) * 10.0 * math.exp(-lt * 1.1)
        sm = min(1.0, lt * 2.2)
        bl = 1.0 if 0.42 < lt < 0.54 else 0.0
        f_sim.append(render_sculpted_on_studio(dict(
            smile_mix=sm,
            head_pitch=nod, smile_l=sm * 6.0, smile_r=sm * 6.0,
            brow_l_dy=-sm * 5.0, brow_r_dy=-sm * 5.0, blink_l=bl, blink_r=bl
        )))
    save_anim_mp4_and_gif("07_aceno_SIM_aprovando", f_sim, fps=24)

    # 8. Desconfiado Side-Eye & Sobrancelha "The Rock"
    f_side = []
    for i in range(54):
        lt = i / 54.0
        s = math.sin(lt * math.pi)
        f_side.append(render_sculpted_on_studio(dict(
            gaze_x=15.0 * math.sin(lt * math.pi * 2),
            brow_r_dy=-12.0 * s,
            brow_l_dy=5.0 * s,
            smirk_dir=0.7 * s,
            smile_r=5.0 * s,
            smile_l=-4.0 * s,
            head_yaw=-6.0 * math.sin(lt * math.pi * 2),
            head_roll=-3.0 * s
        )))
    save_anim_mp4_and_gif("08_desconfiado_side_eye_rock", f_side, fps=24)

    # 9. Choque / UAU
    f_shock = []
    for i in range(48):
        lt = i / 48.0
        s = math.sin(lt * math.pi)
        f_shock.append(render_sculpted_on_studio(dict(
            eye_scale=0.12 * s,
            brow_l_dy=-12.0 * s,
            brow_r_dy=-12.0 * s,
            mouth_open=23.0 * s,
            mouth_width=-14.0 * s,
            show_teeth=False,
            head_pitch=-5.0 * s
        )))
    save_anim_mp4_and_gif("09_reacao_choque_uau", f_shock, fps=24)

    # 10. Revirando os Olhos (Eye-Roll Refinado: Arco 180° Superior Limpo + Esclera Branca + Suspiro)
    f_roll = []
    for i in range(56):
        lt = i / 56.0
        if lt < 0.78:
            # Smooth 180-degree upper arc from right (+14, 0) -> top (0, -15.5) -> left (-14, 0)
            p = lt / 0.78
            ang = p * math.pi
            env = math.sin(p * math.pi)
            gx = 14.5 * math.cos(ang) * math.sin(min(1.0, p * 4.0) * math.pi * 0.5)
            gy = -16.0 * math.sin(ang)
            f_roll.append(render_sculpted_on_studio(dict(
                gaze_x=gx,
                gaze_y=gy,
                brow_l_dy=-7.0 * env,
                brow_r_dy=-7.0 * env,
                smile_l=-6.0 * env,
                smile_r=2.0 * env,
                mouth_width=-5.0 * env,
                head_pitch=-5.5 * env,
                head_roll=3.0 * env
            )))
        else:
            # Settles back to front with a quick annoyed blink
            p2 = (lt - 0.78) / 0.22
            gx = -14.5 * (1.0 - min(1.0, p2 * 2.0))
            bl = 1.0 if (0.25 < p2 < 0.65) else 0.0
            f_roll.append(render_sculpted_on_studio(dict(
                gaze_x=gx,
                gaze_y=0.0,
                blink_l=bl,
                blink_r=bl,
                smile_l=-3.0 * (1.0 - p2)
            )))
    save_anim_mp4_and_gif("10_revirando_olhos_eye_roll", f_roll, fps=24)

    # 11. Falando / Locução Loop Refinado (Cadência Fonética Natural A/E/O/U/M + Transição Suave de Bochecha + Micro-Olhares)
    f_talk = []
    # Define 7 natural speech syllables over 72 frames (3.0s @ 24fps):
    # (center_t, width_t, open_px, mouth_w, smile_mix, show_teeth)
    syllables = [
        (0.10, 0.06, 15.0,  3.0, 0.85, True),   # "Es-" (E/A open)
        (0.22, 0.06, 14.0, -11.0, 0.15, False), # "-to-" (O round, neutral cheeks!)
        (0.35, 0.06, 11.0,  7.0, 0.90, True),   # "-ke" (E wide smile)
        (0.50, 0.07, 17.0,  2.0, 0.80, True),   # "ao" (A wide open)
        (0.64, 0.06, 15.0, -12.0, 0.10, False), # "Cu-" (U round)
        (0.76, 0.05, -4.0,  3.0, 0.40, False),  # "-b-" (B bilabial closure!)
        (0.86, 0.07, 13.0,  5.0, 0.90, True),   # "-bo!" (O/smile finish)
    ]
    for i in range(72):
        lt = i / 72.0
        t_sec = i / 24.0
        open_amt = 0.0
        w_amt = 0.0
        s_mix = 0.45
        teeth_w = 0.0
        for (ct, wt, op, mw, smx, st) in syllables:
            g = math.exp(-((lt - ct) / wt) ** 2)
            open_amt += op * g
            w_amt += mw * g
            s_mix += (smx - 0.45) * g
            if st:
                teeth_w += g

        s_mix = float(np.clip(s_mix, 0.05, 0.95))
        bl = 1.0 if (0.44 < lt < 0.51) else 0.0
        brow_emph = -6.5 * max(0.0, open_amt / 17.0)
        f_talk.append(render_sculpted_on_studio(dict(
            smile_mix=s_mix,
            mouth_open=open_amt,
            mouth_width=w_amt,
            show_teeth=(teeth_w > 0.35 and w_amt > -5.0),
            smile_l=3.5 * s_mix,
            smile_r=3.5 * s_mix,
            brow_l_dy=brow_emph,
            brow_r_dy=brow_emph,
            gaze_x=3.5 * math.sin(t_sec * 2.1),
            gaze_y=-2.0 * abs(math.cos(t_sec * 2.1)),
            head_yaw=math.sin(t_sec * 2.094) * 5.5,
            head_pitch=math.sin(t_sec * 4.188) * 3.5,
            head_roll=math.cos(t_sec * 2.094) * 2.0,
            blink_l=bl,
            blink_r=bl
        )))
    save_anim_mp4_and_gif("11_falando_locucao_loop", f_talk, fps=24)

    # 12. Pensativo -> Teve uma Ideia! Refinado (Olhar Superior Esquerdo 100% Limpo + Piscada de Transição + Cross-Fade Suave para Sorriso)
    f_idea = []
    for i in range(60):
        lt = i / 60.0
        if lt < 0.48:
            # Phase 1: Smooth entry & hold of thinking pose looking up-left with spotless white sclera
            p = math.sin(min(1.0, lt / 0.18) * math.pi * 0.5)
            f_idea.append(render_sculpted_on_studio(dict(
                smile_mix=0.0,
                gaze_x=-13.0 * p,
                gaze_y=-11.5 * p,
                brow_l_dy=-10.0 * p,
                brow_r_dy=4.5 * p,
                mouth_width=-7.0 * p,
                smile_l=-3.0 * p,
                head_pitch=-5.0 * p,
                head_roll=3.5 * p
            )))
        elif lt < 0.62:
            # Phase 2: "Aha!" transition — blinks naturally while returning gaze to camera and cross-fading smile_mix
            u = (lt - 0.48) / 0.14
            inv = 1.0 - u
            bl = math.sin(u * math.pi)
            f_idea.append(render_sculpted_on_studio(dict(
                smile_mix=u * 0.85,
                gaze_x=-13.0 * inv,
                gaze_y=-11.5 * inv,
                blink_l=bl,
                blink_r=bl,
                brow_l_dy=-10.0 * inv - 9.0 * u,
                brow_r_dy=4.5 * inv - 9.0 * u,
                mouth_width=-7.0 * inv + 3.0 * u,
                head_pitch=-5.0 * inv + 3.0 * math.sin(u * math.pi),
                head_roll=3.5 * inv
            )))
        else:
            # Phase 3: Illuminated Eureka Smile!
            u2 = (lt - 0.62) / 0.38
            sp = math.sin(min(1.0, u2 * 2.2) * math.pi * 0.5)
            nod = math.sin(u2 * math.pi * 2) * 4.0 * math.exp(-u2 * 1.5)
            f_idea.append(render_sculpted_on_studio(dict(
                smile_mix=1.0,
                smile_l=6.5 * sp,
                smile_r=6.5 * sp,
                mouth_open=13.5 * sp,
                mouth_width=4.5 * sp,
                show_teeth=True,
                brow_l_dy=-10.0 * sp,
                brow_r_dy=-10.0 * sp,
                eye_scale=0.08 * sp,
                head_pitch=nod
            )))
    save_anim_mp4_and_gif("12_pensativo_teve_ideia", f_idea, fps=24)


if __name__ == "__main__":
    build_all_36_feicoes_and_animations()
