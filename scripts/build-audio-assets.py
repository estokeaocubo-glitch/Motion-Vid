#!/usr/bin/env python3
"""Gera os módulos de áudio embutidos (mp3 em base64) usados pelos motions.

  src/audio/miamiSaas.js  trecho da "Miami" para o motion SaaS (MUSIC_SAAS)
  src/audio/miamiFlow.js  trecho da "Miami" para o "Venda no automático" (MUSIC_FLOW)
  src/audio/bailarAd.js   trecho da "BAILAR" para o anúncio de sites (MUSIC_AD)
  src/audio/tape.js       efeitos analógicos do repositório (TAPE, TAPE_PEAK)
  src/audio/sfx.js        efeitos gravados da Mixkit (SFX, SFX_PEAK)

Mixkit: Sound Effects Free License — uso comercial (vídeos, anúncios) sem atribuição.
Os arquivos são baixados de assets.mixkit.co a cada build (não ficam versionados).
Cada efeito é recortado no trecho útil, normalizado para pico de -1 dBFS e recebe a
posição do seu golpe principal (PEAK, em segundos), para os motions alinharem o golpe
ao corte. Uso: python3 scripts/build-audio-assets.py
"""
import base64, json, os, subprocess, tempfile, urllib.request
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MIAMI = os.path.join(ROOT, "[FREE] Nemzzz x Sample x Hoodtrap Type Beat - _Miami_ [sc9ICHEniso].mp3")
BAILAR = os.path.join(ROOT, "[FREE] Latin Trap x Mexican Type Beat - ''BAILAR'' 🇲🇽 _ Cuban Trap Type Beat 2025 [mdU25uOFZRg].mp3")
TAPE_DIR = os.path.join(ROOT, "Efeitos Analógicos (15)")

# Música: id → (arquivo, constante exportada, início na faixa, duração)
MUSIC = {
    "miamiSaas": (MIAMI, "MUSIC_SAAS", 16.0, 54.0),  # drop da "Miami" (24,97s) em 8,97s do trecho
    "miamiFlow": (MIAMI, "MUSIC_FLOW", 23.0, 20.5),  # golpe de 39,38s da faixa em 16,38s do trecho
    "bailarAd": (BAILAR, "MUSIC_AD", 30.0, 33.0),     # drop da "BAILAR" (32,02s) em 2,02s do trecho
}
# Efeitos analógicos do repositório: id → (arquivo, início, duração)
TAPE = {
    "rewindKick": ("Speed Rewind Kick.wav", 0, 1.04),
    "fwdDown": ("Forward Audio Down.wav", 0, 1.25),
    "dialDown": ("Dial Down.wav", 0, 2.29),
    "shutDown": ("Audio Shut Down.wav", 0, 2.1),
    "tuning": ("Tuning Jumble.wav", 0, 3.6),
}
# Mixkit: id → (número do efeito, início, duração ou None)
SFX = {
    "airWhoosh": (1489, 0, None),        # Air woosh — movimento de câmera
    "windSwoosh": (1468, 0, None),       # Cinematic transition wind swoosh — transição maior
    "tunnelWhoosh": (1486, 0, 2.6),      # Cinematic tunnel reverb woosh — portal
    "shortWind": (1461, 0, None),        # Short wind swoosh
    "airSweep": (168, 0, None),          # Fast air sweep transition — movimentos curtos
    "smallSweep": (166, 0, None),        # Fast small sweep transition — giros, entradas de painel
    "zoomImpact": (772, 0, None),        # Quick zoom impact — atravessar a câmera
    "logoImpact": (2902, 0, 3.2),        # Movie impact intro presentation — logo/cubo
    "trailerRiser": (790, 0, None),      # Cinematic trailer riser — antes do cubo
    "deepHit": (498, 0, 1.6),            # Deep heartbeat impact — grave de apoio
    "lightPop": (3005, 0, None),         # Explainer video pops whoosh light pop — elementos surgindo
    "dryPop": (2356, 0, None),           # Dry pop up notification alert — notificações
    "bubblePop": (2357, 0, None),        # Bubble pop up alert notification — nós/barras
    "hardPop": (2364, 0, 0.4),           # Hard pop click — encaixe do pedido
    "mouseClick": (2997, 0, 0.5),        # Clear mouse clicks — clique da mão
    "mouseClose": (1113, 0, 0.4),        # Mouse click close — pegar o arquivo
    "switchTap": (2585, 0, 0.3),         # On or off light switch tap — interruptor
    "confirm": (2867, 0, None),          # Confirmation tone — pedido enviado / CTA
    "positive": (951, 0, 1.8),           # Positive notification — equipe atualizada
    "alertBeep": (2868, 0, 0.6),         # Double beep tone alert — estoque baixo
    "sparkleSweep": (2633, 0, 2.3),      # Sweeping sparkle presentation intro — cubo/logo
    "sparkleTouch": (3083, 0, 1.5),      # Magic sparkle touch — palavras-chave
    "techSlide": (3120, 0, 0.8),         # Technology transition slide — linha do fluxo
    "lockShut": (2849, 0, None),         # Shut and lock — cadeado
    "typing": (1396, 5.0, 4.0),          # Soft typing on a digital keyboard — digitação da logo
    "glitch": (2946, 0, 1.6),            # Virtual quick glitch — logo trocando de fonte
    "glitchBreak": (2951, 0, 0.6),       # Digital glitch break — logo assentando
    "crumple": (2996, 0, None),          # Quick paper crumple sound — "template" amassado
    "paperTrash": (2381, 0, None),       # Pile of paper trash — cai na lixeira
    "marker": (2998, 0, None),           # Pen marker line — marca-texto
}


def ff(*args):
    subprocess.run(["ffmpeg", "-v", "error", "-y", *args], check=True)


def peak_db(path):
    out = subprocess.run(["ffmpeg", "-hide_banner", "-i", path, "-af", "volumedetect", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    return float(out.split("max_volume:")[1].split("dB")[0])


def hit_time(path):
    """Segundo do golpe principal (maior energia em janelas de 20 ms)."""
    sr = 22050
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(sr), "-f", "f32le", "-"],
                         capture_output=True).stdout
    x = np.frombuffer(raw, np.float32)
    w = int(sr * 0.02)
    r = [np.sqrt(np.mean(x[k:k + w] ** 2)) for k in range(0, max(1, len(x) - w), w)]
    return round(int(np.argmax(r)) * 0.02, 3)


def encode(src, start, dur, dst, bitrate, normalize):
    trim = ["-ss", str(start)] + (["-t", str(dur)] if dur else [])
    tmp = dst + ".wav"
    # recorte com fade curto no fim (evita estalo quando o efeito é cortado)
    fade = f"afade=t=out:st={max(0.0, (dur or 99) - 0.08)}:d=0.08" if dur else "anull"
    ff(*trim, "-i", src, "-ac", "2", "-ar", "44100", "-af", fade, tmp)
    gain = -1.0 - peak_db(tmp) if normalize else 0.0
    ff("-i", tmp, "-af", f"volume={gain:.2f}dB", "-c:a", "libmp3lame", "-b:a", bitrate, dst)
    t = hit_time(tmp)
    os.remove(tmp)
    return t


def module(path, const, files, peaks=None):
    with open(path, "w") as f:
        f.write("// Gerado por scripts/build-audio-assets.py — não editar à mão\n")
        f.write(f"export const {const} = {{\n")
        for k, p in files.items():
            f.write(f'  {k}: "data:audio/mpeg;base64,{base64.b64encode(open(p, "rb").read()).decode()}",\n')
        f.write("};\n")
        if peaks is not None:
            f.write(f"// segundo do golpe principal de cada efeito (para alinhar ao corte)\n")
            f.write(f"export const {const}_PEAK = {json.dumps(peaks)};\n")
    print(f"{os.path.relpath(path, ROOT)}: {os.path.getsize(path) // 1024} KB")


def main():
    out = os.path.join(ROOT, "src", "audio")
    os.makedirs(out, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        for k, (src, const, s, d) in MUSIC.items():
            p = os.path.join(tmp, k + ".mp3")
            encode(src, s, d, p, "160k", normalize=False)
            module(os.path.join(out, k + ".js"), const, {k: p})
        files, peaks = {}, {}
        for k, (f, s, d) in TAPE.items():
            p = os.path.join(tmp, k + ".mp3")
            peaks[k] = encode(os.path.join(TAPE_DIR, f), s, d, p, "128k", normalize=True)
            files[k] = p
        module(os.path.join(out, "tape.js"), "TAPE", files, peaks)
        files, peaks = {}, {}
        for k, (num, s, d) in SFX.items():
            src = os.path.join(tmp, f"mixkit-{num}.wav")
            urllib.request.urlretrieve(f"https://assets.mixkit.co/active_storage/sfx/{num}/{num}.wav", src)
            p = os.path.join(tmp, k + ".mp3")
            peaks[k] = encode(src, s, d, p, "128k", normalize=True)
            files[k] = p
        module(os.path.join(out, "sfx.js"), "SFX", files, peaks)


if __name__ == "__main__":
    main()
