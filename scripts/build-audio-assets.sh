#!/usr/bin/env bash
# Gera os módulos de áudio embutidos (mp3 em base64) a partir das músicas e efeitos do repositório:
#  - src/audio/miamiSaas.js  → trecho da "Miami" para o motion SaaS
#  - src/audio/miamiFlow.js  → trecho da "Miami" para o "Venda no automático"
#  - src/audio/tape.js       → efeitos analógicos recortados no trecho útil
# Uso: bash scripts/build-audio-assets.sh
set -euo pipefail
cd "$(dirname "$0")/.."
MIAMI="[FREE] Nemzzz x Sample x Hoodtrap Type Beat - _Miami_ [sc9ICHEniso].mp3"
SFX="Efeitos Analógicos (15)"
mkdir -p src/audio
tmp=$(mktemp -d)
enc() { # entrada início duração saída
  ffmpeg -v error -ss "$2" -t "$3" -i "$1" -ac 2 -ar 44100 -c:a libmp3lame -b:a "${5:-160k}" "$tmp/$4.mp3"
}
module() { # arquivo nome-da-const ids...
  local out=$1 name=$2; shift 2
  { echo "// Gerado por scripts/build-audio-assets.sh — não editar à mão"
    echo "export const $name = {"
    for id in "$@"; do echo "  $id: \"data:audio/mpeg;base64,$(base64 -w0 "$tmp/$id.mp3")\","; done
    echo "};"; } > "$out"
}
# Música (o drop da faixa está em 24,97s; ver MUSIC em cada motion)
enc "$MIAMI" 16.0 54.0 miamiSaas
enc "$MIAMI" 9.5 20.5 miamiFlow
# Efeitos (início e duração do trecho útil de cada arquivo)
enc "$SFX/Fast Audio Scrub.wav" 1.4 1.5 fastScrub 128k
enc "$SFX/Audio_Sweep_1.wav" 2.1 2.7 sweep1 128k
enc "$SFX/Audio_Sweep_2.wav" 1.0 2.45 sweep2 128k
enc "$SFX/Rewind Broken Tape.wav" 2.5 2.0 rewindTape 128k
enc "$SFX/Speed Rewind Kick.wav" 0 1.04 rewindKick 128k
enc "$SFX/Turn Dial Back and Forth.wav" 0 0.75 dialTurn 128k
enc "$SFX/Forward Audio Down.wav" 0 1.25 fwdDown 128k
enc "$SFX/Dial Down.wav" 0 2.29 dialDown 128k
enc "$SFX/Audio Shut Down.wav" 0 2.1 shutDown 128k
enc "$SFX/Tuning Jumble.wav" 0 3.6 tuning 128k
module src/audio/miamiSaas.js MUSIC_SAAS miamiSaas
module src/audio/miamiFlow.js MUSIC_FLOW miamiFlow
module src/audio/tape.js TAPE fastScrub sweep1 sweep2 rewindTape rewindKick dialTurn fwdDown dialDown shutDown tuning
rm -rf "$tmp"
ls -la src/audio
