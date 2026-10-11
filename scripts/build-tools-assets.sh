#!/usr/bin/env bash
# Gera src/toolsAssets.js para o motion ToolsReveal ("dev / tools / site"):
#  - TOOLS_DEV_INTRO:  assets/dev-intro.mov (programador de camisa vermelha, céu azul), trecho 3,65–5,39s
#                      (começa olhando para o lado e termina virando para a câmera), abre a faixa "dev"
#  - TOOLS_DEV_MORRO:  assets/dev-morro.mov (selfie no morro, montanhas ao fundo), trecho 1,5–3,25s
#  - TOOLS_DEV:        assets/dev-video.mp4 (celular com o site + notebook com código), 3,7s em leve
#                      câmera lenta (90%) → 4,1s
#  - TOOLS_SITES:      prints dos sites em assets/sites/, em 1280px de largura
# Vídeo em WebM (VP9) + MP4 (H.264). Uso: bash scripts/build-tools-assets.sh
set -euo pipefail
cd "$(dirname "$0")/.."
tmp=$(mktemp -d)
vf="setpts=PTS/0.9,fps=30,scale=720:1280,eq=contrast=1.04:saturation=1.08"
ffmpeg -v error -i assets/dev-video.mp4 -an -vf "$vf" -c:v libx264 -preset slow -crf 22 -pix_fmt yuv420p -movflags +faststart "$tmp/DEV.mp4"
ffmpeg -v error -i assets/dev-video.mp4 -an -vf "$vf" -c:v libvpx-vp9 -b:v 0 -crf 33 -row-mt 1 -pix_fmt yuv420p "$tmp/DEV.webm"
ivf="fps=30,scale=720:1280,eq=contrast=1.04:saturation=1.06"
clip() { # nome arquivo início duração [velocidade] [tratamento de cor]
  local v="setpts=PTS/${5:-1},${6:-null},$ivf"
  ffmpeg -v error -ss "$3" -t "$4" -i "$2" -an -vf "$v" -c:v libx264 -preset slow -crf 22 -pix_fmt yuv420p -movflags +faststart "$tmp/$1.mp4"
  ffmpeg -v error -ss "$3" -t "$4" -i "$2" -an -vf "$v" -c:v libvpx-vp9 -b:v 0 -crf 33 -row-mt 1 -pix_fmt yuv420p "$tmp/$1.webm"
}
# contraluz: clareia sombras e meio-tons (o rosto) sem estourar o céu
clip INTRO assets/dev-intro.mov 3.65 1.74 1 "curves=all='0/0 0.06/0.18 0.2/0.42 0.4/0.62 0.7/0.83 1/1',colorbalance=rs=0.03:rm=0.02,eq=saturation=1.12:contrast=1.05"
clip MORRO assets/dev-morro.mov 1.5 1.75
for s in kaiiros ymb-cocktails kdust trama bastos; do
  f=$(ls assets/sites/$s.* | head -1)
  ffmpeg -v error -i "$f" -vf "scale=1280:-2" -c:v libwebp -quality 80 "$tmp/$s.webp"
done
{
  echo "// Gerado por scripts/build-tools-assets.sh — vídeos e prints em base64"
  for n in INTRO MORRO; do
    echo "export const TOOLS_DEV_$n = { webm: \"data:video/webm;base64,$(base64 -w0 "$tmp/$n.webm")\", mp4: \"data:video/mp4;base64,$(base64 -w0 "$tmp/$n.mp4")\", dur: $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$tmp/$n.mp4") };"
  done
  echo "export const TOOLS_DEV = { webm: \"data:video/webm;base64,$(base64 -w0 "$tmp/DEV.webm")\", mp4: \"data:video/mp4;base64,$(base64 -w0 "$tmp/DEV.mp4")\" };"
  echo "export const TOOLS_DEV_DUR = $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$tmp/DEV.mp4");"
  echo "export const TOOLS_SITES = ["
  for s in kaiiros ymb-cocktails kdust trama bastos; do echo "  \"data:image/webp;base64,$(base64 -w0 "$tmp/$s.webp")\","; done
  echo "];"
} > src/toolsAssets.js
ls -la "$tmp" | awk '{print $5, $9}'
rm -rf "$tmp"
ls -la src/toolsAssets.js
