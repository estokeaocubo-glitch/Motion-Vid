#!/usr/bin/env python3
"""Feições vetoriais 2D do Emoji Primordial (Estoke ao Cubo).

Versão ilustrada e 100% vetorial do personagem 3D, no traço dos emojis de meme (contorno
grosso, cor chapada, sombra simples, blush hachurado, gotinhas de suor), sem perder o que
é dele: pele marrom (cores amostradas do 3D), cabelo curto com degradê, óculos sem aro
com ponte azul-marinho, AirPods e olhos castanhos.

Cada feição é montada de peças (olhos, sobrancelhas, boca, extras, inclinação) num
viewBox 512×512, então dá para criar novas só acrescentando uma linha em FEICOES.
Uso: python3 EMOJI_PRIMORDIAL/06_FEICOES_VETORIAIS_2D/gerar_feicoes.py
     → svg/<nn>_<nome>.svg e catalogo.html (prancha com todas)
"""
import os

DIR = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(DIR, "svg")

# paleta (amostrada do Emoji Primordial 3D)
SKIN, SKIN_SHADE, SKIN_LIGHT = "#9A7461", "#6F4C3A", "#B6927F"
HAIR, HAIR_LINE = "#1F1C1B", "#3B3431"
LINE = "#1C1310"
IRIS, PUPIL = "#5A3B28", "#120C0A"
NAVY = "#34405A"
MOUTH_IN, TONGUE = "#4A1E1A", "#D9606A"
BLUSH, BLUSH_LINE = "#E2566E", "#C23A53"
WATER = "#8FD3FF"
W = 7  # espessura do contorno

EYE = {"L": (178, 268), "R": (334, 268)}
HEAD = "M256 84 C364 84 430 156 432 256 C434 356 368 444 256 448 C144 444 78 356 80 256 C82 156 148 84 256 84 Z"


def ellipse(cx, cy, rx, ry, fill, stroke=LINE, sw=W, extra=""):
    return f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}" {extra}/>'


def stroke_path(d, color=LINE, sw=W, extra=""):
    return f'<path d="{d}" fill="none" stroke="{color}" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round" {extra}/>'


# ---------- olhos ----------
def eye(kind, side, look=(0, 0), lid=0.5, uid=""):
    cx, cy = EYE[side]
    dx, dy = look
    cid = f"e{side}{uid}"
    if kind in ("closed_happy", "wink_closed"):
        return stroke_path(f"M{cx-28} {cy+8} Q{cx} {cy-22} {cx+28} {cy+8}", sw=9)
    if kind == "closed_calm":
        return stroke_path(f"M{cx-27} {cy-2} Q{cx} {cy+16} {cx+27} {cy-2}", sw=8)
    if kind == "heart":
        h = (f"M{cx} {cy+26} C{cx-40} {cy} {cx-34} {cy-30} {cx-14} {cy-28} C{cx-4} {cy-27} {cx} {cy-18} {cx} {cy-14} "
             f"C{cx} {cy-18} {cx+4} {cy-27} {cx+14} {cy-28} C{cx+34} {cy-30} {cx+40} {cy} {cx} {cy+26} Z")
        return (f'<path d="{h}" fill="#E8344E" stroke="{LINE}" stroke-width="{W}" stroke-linejoin="round"/>'
                + ellipse(cx - 13, cy - 14, 6, 4, "#fff", "none", 0, 'opacity=".85"'))
    if kind == "stress":  # pupilas pretas enormes com aro branco (ref. "estressado")
        bags = "".join(stroke_path(f"M{cx-30+i*4} {cy+40+i*7} Q{cx} {cy+50+i*7} {cx+30-i*4} {cy+40+i*7}", SKIN_SHADE, 3) for i in range(3))
        return bags + ellipse(cx, cy, 38, 37, "#fff", sw=8) + f'<circle cx="{cx+dx}" cy="{cy+3+dy}" r="29" fill="{PUPIL}"/>'
    rx, ry = (37, 35) if kind == "glossy" else (37, 36) if kind == "tiny" else (35, 31)
    parts = [f'<clipPath id="{cid}"><ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}"/></clipPath>',
             ellipse(cx, cy, rx, ry, "#fff", "none", 0)]
    inner = []
    if kind == "glossy":  # olhão brilhando (ref. "implorando")
        inner += [f'<circle cx="{cx+dx}" cy="{cy+dy}" r="29" fill="#2A1A12"/>',
                  f'<circle cx="{cx+dx+10}" cy="{cy+dy-10}" r="10" fill="#fff"/>', f'<circle cx="{cx+dx-9}" cy="{cy+dy+10}" r="5" fill="#fff"/>']
    elif kind == "tiny":
        inner += [f'<circle cx="{cx+dx}" cy="{cy+dy}" r="7" fill="{PUPIL}"/>']
    elif kind == "money":
        inner += [f'<text x="{cx+dx}" y="{cy+dy+16}" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="48" fill="#1FA34A">$</text>']
    else:
        inner += [f'<circle cx="{cx+dx}" cy="{cy+dy}" r="21" fill="{IRIS}"/>', f'<circle cx="{cx+dx}" cy="{cy+dy}" r="12" fill="{PUPIL}"/>',
                  f'<circle cx="{cx+dx+7}" cy="{cy+dy-7}" r="6" fill="#fff"/>', f'<circle cx="{cx+dx-6}" cy="{cy+dy+7}" r="2.5" fill="#fff" opacity=".8"/>']
    if kind in ("halflid", "angry"):  # pálpebra caindo (convencido, cansado, sem reação) ou em diagonal (bravo)
        top = cy - ry - 2
        if kind == "halflid":
            y = cy - ry + 2 * ry * lid
            inner += [f'<rect x="{cx-rx-2}" y="{top}" width="{2*rx+4}" height="{y-top}" fill="{SKIN}"/>',
                      stroke_path(f"M{cx-rx} {y+2} Q{cx} {y-4} {cx+rx} {y+2}", sw=8)]
        else:
            inner_x, outer_x = (cx + rx, cx - rx) if side == "L" else (cx - rx, cx + rx)
            pts = f"{outer_x},{top} {inner_x},{top} {inner_x},{cy+4} {outer_x},{cy-14}"
            inner += [f'<polygon points="{pts}" fill="{SKIN}"/>', stroke_path(f"M{outer_x} {cy-14} L{inner_x} {cy+4}", sw=8)]
    parts.append(f'<g clip-path="url(#{cid})">{"".join(inner)}</g>')
    parts.append(ellipse(cx, cy, rx, ry, "none"))
    return "".join(parts)


# ---------- sobrancelhas: (y da ponta de dentro, y da ponta de fora) relativos à base ----------
def brows(spec):
    if spec is None:
        return ""
    out = []
    for side, (din, dout) in zip("LR", spec):
        cx, _ = EYE[side]
        base = 204
        xin, xout = (cx + 32, cx - 34) if side == "L" else (cx - 32, cx + 34)
        mid = (xin + xout) / 2
        out.append(f'<path d="M{xout} {base+dout} Q{mid} {base+min(din, dout)-12} {xin} {base+din}" fill="none" stroke="{HAIR}" stroke-width="14" stroke-linecap="round"/>')
    return "".join(out)


# ---------- bocas ----------
def mouth(kind):
    if kind is None:
        return ""
    m = {
        "smile": stroke_path("M210 382 Q256 416 302 382", sw=8),
        "smile_soft": stroke_path("M222 388 Q256 406 290 388", sw=7),
        "smirk": stroke_path("M222 394 Q266 400 300 370", sw=8),
        "flat": stroke_path("M226 392 L286 392", sw=7),
        "flat_small": stroke_path("M240 394 L272 394", sw=6),
        "flat_tilt": stroke_path("M228 398 L288 386", sw=7),
        "frown": stroke_path("M216 404 Q256 374 296 404", sw=8),
        "wavy": stroke_path("M212 394 q11 -10 22 0 t22 0 t22 0 t22 0", sw=7),
        "o": ellipse(256, 396, 17, 23, MOUTH_IN),
        "big": ('<path d="M198 372 Q256 450 314 372 Q256 388 198 372 Z" fill="' + MOUTH_IN + '"/>'
                '<path d="M208 377 Q256 391 304 377 L298 390 Q256 401 214 390 Z" fill="#fff"/>'
                '<path d="M226 418 Q256 400 286 418 Q256 434 226 418 Z" fill="' + TONGUE + '"/>'
                + stroke_path("M198 372 Q256 450 314 372 Q256 388 198 372 Z", sw=7)),
        "laugh": ('<path d="M186 364 Q256 470 326 364 Q256 380 186 364 Z" fill="' + MOUTH_IN + '"/>'
                  '<path d="M222 428 Q256 404 290 428 Q256 446 222 428 Z" fill="' + TONGUE + '"/>'
                  + stroke_path("M186 364 Q256 470 326 364 Q256 380 186 364 Z", sw=7)),
        "teeth": ('<rect x="204" y="372" width="104" height="42" rx="18" fill="#fff" stroke="' + LINE + f'" stroke-width="{W}"/>'
                  + stroke_path("M208 393 L304 393", sw=4) + "".join(stroke_path(f"M{x} 376 L{x} 410", sw=3.5) for x in (230, 256, 282))),
    }
    return m[kind]


# ---------- extras ----------
def blush(strong=1.0):
    out = []
    for cx in (150, 362):
        out.append(f'<ellipse cx="{cx}" cy="{348}" rx="38" ry="19" fill="{BLUSH}" opacity="{0.45*strong:.2f}"/>')
        out += [stroke_path(f"M{cx-14+i*12} 340 l-8 16", BLUSH_LINE, 3, f'opacity="{0.8*strong:.2f}"') for i in range(3)]
    return "".join(out)


def drop(x, y, s=1.0):
    d = "M0 -40 C18 -12 26 2 26 14 A26 26 0 1 1 -26 14 C-26 2 -18 -12 0 -40 Z"
    return (f'<g transform="translate({x} {y}) scale({s})"><path d="{d}" fill="{WATER}" stroke="{LINE}" stroke-width="{W}" stroke-linejoin="round"/>'
            f'<ellipse cx="-9" cy="10" rx="5" ry="9" fill="#fff" opacity=".8"/></g>')


def sweat_marks():  # os "u" de suor espalhados (ref. "estressado")
    pts = [(180, 158), (330, 150), (122, 350), (392, 352), (210, 432), (306, 430)]
    return "".join(stroke_path(f"M{x-7} {y-8} Q{x} {y+10} {x+7} {y-8}", HAIR_LINE, 4.5) for x, y in pts)


def tears():
    return "".join(f'<path d="M{x} 286 C{x+d*6} 330 {x+d*20} 360 {x+d*22} 400 C{x+d*24} 420 {x+d*6} 424 {x+d*2} 404 C{x-d*2} 370 {x-d*4} 330 {x} 286 Z" '
                   f'fill="{WATER}" stroke="{LINE}" stroke-width="5" stroke-linejoin="round"/>' for x, d in ((150, -1), (362, 1)))


def vein():
    return f'<g transform="translate(372 150) rotate(12)">' + "".join(
        stroke_path(f"M{a} {b} Q{c} {e} {f} {g}", "#E23B3B", 8) for a, b, c, e, f, g in
        ((-24, -6, -10, -8, -6, -22), (6, -22, 8, -8, 24, -6), (24, 6, 10, 8, 6, 22), (-6, 22, -8, 8, -24, 6))) + "</g>"


def sparkle(x, y, s=1.0, color="#FFD43B"):
    d = "M0 -26 C4 -6 6 -4 26 0 C6 4 4 6 0 26 C-4 6 -6 4 -26 0 C-6 -4 -4 -6 0 -26 Z"
    return f'<path transform="translate({x} {y}) scale({s})" d="{d}" fill="{color}" stroke="{LINE}" stroke-width="5" stroke-linejoin="round"/>'


def hands_plead():  # dois punhos juntinhos na frente do queixo (ref. "implorando")
    out = []
    for cx, d in ((212, 1), (300, -1)):
        out.append(f'<path d="M{cx-52} 500 C{cx-60} 456 {cx-40} 418 {cx} 416 C{cx+42} 414 {cx+60} 452 {cx+52} 500 C{cx+30} 516 {cx-30} 516 {cx-52} 500 Z" '
                   f'fill="{SKIN}" stroke="{LINE}" stroke-width="{W}" stroke-linejoin="round"/>')
        for i in range(4):  # dobras dos dedos
            x = cx - 36 + i * 24
            out.append(stroke_path(f"M{x} {428+abs(i-1.5)*4} Q{x+6} {446} {x} {466}", LINE, 4.5))
        tx = cx + d * 30  # polegar por cima, apontando para o centro
        out.append(f'<ellipse cx="{tx}" cy="430" rx="22" ry="13" transform="rotate({-d*25} {tx} 430)" fill="{SKIN_LIGHT}" stroke="{LINE}" stroke-width="{W-1}"/>')
        out.append(f'<ellipse cx="{cx}" cy="492" rx="34" ry="8" fill="{SKIN_SHADE}" opacity=".35"/>')
    return "".join(out)


def hand_chin():  # mão no queixo, indicador apoiado (pensativo)
    return (f'<path d="M270 512 L276 452 C278 428 300 418 322 424 C346 430 352 452 346 476 L340 512 Z" fill="{SKIN}" stroke="{LINE}" stroke-width="{W}" stroke-linejoin="round"/>'
            f'<path d="M292 432 C286 404 292 380 304 372 C316 366 324 378 320 396 L314 430" fill="{SKIN}" stroke="{LINE}" stroke-width="{W}" stroke-linejoin="round"/>'
            + "".join(stroke_path(f"M{300+i*14} 446 Q{306+i*14} 462 {300+i*14} 478", SKIN_SHADE, 4) for i in range(3)))


def zzz():
    return "".join(f'<text x="{x}" y="{y}" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="{s}" fill="{NAVY}">z</text>' for x, y, s in ((404, 140, 44), (440, 100, 34), (466, 68, 26)))


def question():
    return f'<text x="424" y="150" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="96" fill="#2F7BFF" stroke="{LINE}" stroke-width="5" paint-order="stroke">?</text>'


EXTRAS = {"blush": lambda: blush(), "blush_soft": lambda: blush(0.6), "drop": lambda: drop(426, 196), "sweat": sweat_marks,
          "tears": tears, "vein": vein, "sparkles": lambda: sparkle(436, 128) + sparkle(84, 168, 0.7) + sparkle(456, 236, 0.55),
          "hands": hands_plead, "hand_chin": hand_chin, "zzz": zzz, "question": question}
FRONT = {"hands", "hand_chin", "sparkles", "drop", "zzz", "question", "vein"}


# ---------- cabeça ----------
def head(uid):
    ears = ""
    for x, d in ((80, -1), (432, 1)):
        ears += ellipse(x, 290, 32, 38, SKIN)
        ears += stroke_path(f"M{x+d*-2} 272 Q{x+d*14} 290 {x+d*-2} 308", SKIN_SHADE, 5)
    pods = ""
    for x, d in ((84, -1), (428, 1)):  # AirPods: concha dentro da orelha e haste curta descendo
        pods += (f'<rect x="{x-8}" y="292" width="16" height="44" rx="8" fill="#F7F8FA" stroke="{LINE}" stroke-width="4.5"/>'
                 f'<ellipse cx="{x}" cy="290" rx="14" ry="13" fill="#FFFFFF" stroke="{LINE}" stroke-width="4.5"/>'
                 f'<circle cx="{x+d*-4}" cy="289" r="3.5" fill="#B9C0CA"/>')
    hair = ("M92 236 C86 140 158 70 256 70 C354 70 426 140 420 236 C410 208 390 182 360 168 "
            "C332 156 296 152 256 152 C216 152 180 156 152 168 C122 182 102 208 92 236 Z")
    fade = (stroke_path("M150 128 Q200 92 262 90", "#4A4240", 10, 'opacity=".75"')
            + stroke_path("M104 214 Q112 186 132 168", HAIR_LINE, 6, 'opacity=".8"') + stroke_path("M408 214 Q400 186 380 168", HAIR_LINE, 6, 'opacity=".8"'))
    return (ears
            + f'<clipPath id="h{uid}"><path d="{HEAD}"/></clipPath>'
            + f'<path d="{HEAD}" fill="{SKIN_SHADE}"/>'
            + f'<g clip-path="url(#h{uid})"><ellipse cx="236" cy="240" rx="196" ry="200" fill="{SKIN}"/>'
            + f'<ellipse cx="200" cy="196" rx="70" ry="44" fill="{SKIN_LIGHT}" opacity=".55"/></g>'
            + f'<path d="{HEAD}" fill="none" stroke="{LINE}" stroke-width="{W+1}"/>'
            + f'<path d="{hair}" fill="{HAIR}" stroke="{LINE}" stroke-width="{W}" stroke-linejoin="round"/>' + fade
            + pods
            + stroke_path("M242 334 Q256 348 270 334", SKIN_SHADE, 6))


def glasses():  # sem aro: lentes com brilho, borda fina e ponte/hastes azul-marinho
    out = []
    for x in (110, 268):
        out.append(f'<rect x="{x}" y="220" width="134" height="94" rx="26" fill="#DDEBFF" fill-opacity=".09" stroke="{NAVY}" stroke-opacity=".7" stroke-width="3.5"/>')
        out.append(stroke_path(f"M{x+12} {252} Q{x+14} {232} {x+34} {228}", "#fff", 5, 'opacity=".6"'))
    out.append(stroke_path("M244 250 Q256 238 268 250", NAVY, 6))
    out.append(stroke_path("M110 250 L90 256", NAVY, 6) + stroke_path("M402 250 L422 256", NAVY, 6))
    return "".join(out)


def face(spec, uid):
    eyes = spec.get("eyes", ("normal", "normal"))
    look = spec.get("look", (0, 0))
    lid = spec.get("lid", 0.5)
    extras = spec.get("extras", ())
    back = "".join(EXTRAS[e]() for e in extras if e not in FRONT)
    front = "".join(EXTRAS[e]() for e in extras if e in FRONT)
    body = (head(uid) + back + eye(eyes[0], "L", look, lid, uid) + eye(eyes[1], "R", look, lid, uid)
            + glasses() + brows(spec.get("brows", ((0, 0), (0, 0)))) + mouth(spec.get("mouth", "smile")))
    tilt = spec.get("tilt", 0)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">'
            f'<g transform="rotate({tilt} 256 290)">{body}</g>{front}</svg>\n')


# ---------- feições: sérias (refinadas) e cômicas (ref. emojis de meme) ----------
FEICOES = [
    ("01_confiante", "séria", dict(mouth="smile", brows=((0, 2), (0, 2)))),
    ("02_sorriso_aberto", "séria", dict(mouth="big", brows=((-6, 0), (-6, 0)))),
    ("03_focado", "séria", dict(mouth="smile_soft", brows=((10, -2), (10, -2)), lid=0.28, eyes=("halflid", "halflid"))),
    ("04_pensativo", "séria", dict(look=(-8, -9), mouth="flat_tilt", brows=((-4, -12), (6, 2)), extras=("hand_chin",))),
    ("05_satisfeito", "séria", dict(eyes=("closed_calm", "closed_calm"), mouth="smile", extras=("blush_soft",))),
    ("06_piscadinha", "séria", dict(eyes=("normal", "wink_closed"), mouth="smirk", brows=((0, 0), (8, 4)), tilt=-4)),
    ("07_bravo", "séria", dict(eyes=("angry", "angry"), mouth="frown", brows=((22, -8), (22, -8)), extras=("vein",))),
    ("08_desconfiado", "séria", dict(eyes=("halflid", "halflid"), lid=0.45, look=(12, 2), mouth="flat_tilt", brows=((10, 4), (-6, -10)))),
    ("09_convencido", "cômica", dict(eyes=("halflid", "halflid"), lid=0.52, look=(14, 4), mouth="smirk", brows=((-2, -14), (14, 4)), tilt=-12)),
    ("10_implorando", "cômica", dict(eyes=("glossy", "glossy"), look=(0, 4), mouth="flat_small", brows=((-14, 4), (-14, 4)), extras=("blush", "hands"), tilt=6)),
    ("11_estressado", "cômica", dict(eyes=("stress", "stress"), mouth="flat", brows=None, extras=("sweat",))),
    ("12_cansado", "cômica", dict(eyes=("halflid", "halflid"), lid=0.6, look=(0, 6), mouth=None, brows=((-8, 0), (-8, 0)), extras=("blush",))),
    ("13_sem_reacao", "cômica", dict(eyes=("halflid", "halflid"), lid=0.5, mouth="flat", brows=((0, 0), (0, 0)))),
    ("14_chocado", "cômica", dict(eyes=("tiny", "tiny"), mouth="o", brows=((-22, -16), (-22, -16)), extras=("drop",))),
    ("15_chorando_de_rir", "cômica", dict(eyes=("closed_happy", "closed_happy"), mouth="laugh", brows=((-10, -2), (-10, -2)), extras=("tears",), tilt=10)),
    ("16_nervoso", "cômica", dict(look=(10, 0), mouth="teeth", brows=((-14, 2), (-14, 2)), extras=("drop",))),
    ("17_apaixonado", "cômica", dict(eyes=("heart", "heart"), mouth="big", extras=("blush",))),
    ("18_dinheiro", "cômica", dict(eyes=("money", "money"), mouth="big", brows=((-8, -2), (-8, -2)), extras=("sparkles",))),
    ("19_confuso", "cômica", dict(look=(-6, -6), mouth="wavy", brows=((-16, -6), (8, 6)), extras=("question",), tilt=-8)),
    ("20_dormindo", "cômica", dict(eyes=("closed_calm", "closed_calm"), mouth="o", extras=("zzz",), tilt=8)),
]


def main():
    os.makedirs(OUT, exist_ok=True)
    cards = []
    for i, (name, tipo, spec) in enumerate(FEICOES):
        svg = face(spec, f"u{i}")
        open(os.path.join(OUT, name + ".svg"), "w").write(svg)
        cards.append(f'<figure><img src="svg/{name}.svg"><figcaption>{name}<br><small>{tipo}</small></figcaption></figure>')
    html = ("<!doctype html><meta charset='utf-8'><title>Feições vetoriais 2D</title><style>"
            "body{margin:0;background:#EEF1F5;font-family:system-ui,sans-serif}main{display:grid;grid-template-columns:repeat(5,1fr);gap:18px;padding:28px;width:1240px}"
            "figure{margin:0;background:#fff;border-radius:22px;padding:14px;text-align:center;box-shadow:0 6px 18px rgba(0,30,80,.08)}"
            "img{width:200px;height:200px}figcaption{font-weight:700;font-size:15px;color:#1B2333}small{color:#7A8496;font-weight:600}</style>"
            "<main>" + "".join(cards) + "</main>")
    open(os.path.join(DIR, "catalogo.html"), "w").write(html)
    print(len(FEICOES), "feições em", os.path.relpath(OUT, os.path.dirname(os.path.dirname(DIR))))


if __name__ == "__main__":
    main()
