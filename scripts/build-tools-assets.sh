#!/usr/bin/env bash
# Gera src/toolsAssets.js para o motion ToolsReveal ("dev / tools / site"):
#  - TOOLS_DEV_INTRO:  assets/dev-intro.mov (programador de camisa vermelha, céu azul), trecho 1,0–2,74s
#                      (o gesto de "shh" e o aceno), abre a faixa "dev"
#  - TOOLS_DEV_PHOTOS: assets/dev-foto.jpg (no espelho da Dizzy), foto do programador (convertida do
#                      HEIC do iPhone), em 1080px de largura
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
ffmpeg -v error -ss 1.0 -t 1.74 -i assets/dev-intro.mov -an -vf "$ivf" -c:v libx264 -preset slow -crf 22 -pix_fmt yuv420p -movflags +faststart "$tmp/INTRO.mp4"
ffmpeg -v error -ss 1.0 -t 1.74 -i assets/dev-intro.mov -an -vf "$ivf" -c:v libvpx-vp9 -b:v 0 -crf 33 -row-mt 1 -pix_fmt yuv420p "$tmp/INTRO.webm"
ffmpeg -v error -i assets/dev-foto.jpg -c:v libwebp -quality 82 "$tmp/foto.webp"
for s in kaiiros ymb-cocktails kdust trama bastos; do
  f=$(ls assets/sites/$s.* | head -1)
  ffmpeg -v error -i "$f" -vf "scale=1280:-2" -c:v libwebp -quality 80 "$tmp/$s.webp"
done
{
  echo "// Gerado por scripts/build-tools-assets.sh — fotos, vídeo e prints em base64"
  echo "export const TOOLS_DEV_INTRO = { webm: \"data:video/webm;base64,$(base64 -w0 "$tmp/INTRO.webm")\", mp4: \"data:video/mp4;base64,$(base64 -w0 "$tmp/INTRO.mp4")\" };"
  echo "export const TOOLS_DEV_INTRO_DUR = $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$tmp/INTRO.mp4");"
  echo "export const TOOLS_DEV_PHOTOS = ["
  echo "  \"data:image/webp;base64,$(base64 -w0 "$tmp/foto.webp")\","
  echo "];"
  echo "export const TOOLS_DEV = { webm: \"data:video/webm;base64,$(base64 -w0 "$tmp/DEV.webm")\", mp4: \"data:video/mp4;base64,$(base64 -w0 "$tmp/DEV.mp4")\" };"
  echo "export const TOOLS_DEV_DUR = $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$tmp/DEV.mp4");"
  echo "export const TOOLS_SITES = ["
  for s in kaiiros ymb-cocktails kdust trama bastos; do echo "  \"data:image/webp;base64,$(base64 -w0 "$tmp/$s.webp")\","; done
  echo "];"
} > src/toolsAssets.js
ls -la "$tmp" | awk '{print $5, $9}'
rm -rf "$tmp"
ls -la src/toolsAssets.js
