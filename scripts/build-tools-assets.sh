#!/usr/bin/env bash
# Gera src/toolsAssets.js para o motion ToolsReveal ("dev / tools / site"):
#  - TOOLS_DEV_PHOTO:  assets/dev-foto.jpg (o programador no espelho da Dizzy, convertida do HEIC do iPhone),
#                      recortada sem a moldura escura do espelho (direita) e com a cabeça perto do topo
#  - TOOLS_SITE_MISU / TOOLS_SITE_LCS: trechos das gravações de tela (dist/media/*-site.mp4): o hero do
#                      Misú com os sushis (2,0s) e o hero da LCS com a van (3,1s), 1,75s cada
#  - TOOLS_TRAMA:      print do site da Trama (assets/sites/trama.webp), em 1280px de largura
# Vídeo em WebM (VP9) + MP4 (H.264). Uso: bash scripts/build-tools-assets.sh
set -euo pipefail
cd "$(dirname "$0")/.."
tmp=$(mktemp -d)
ffmpeg -v error -i assets/dev-foto.jpg -vf "crop=iw*0.8:ih*0.79:0:ih*0.21" -c:v libwebp -quality 85 "$tmp/foto.webp"
svf="fps=30,scale=1024:576"
site() { # nome arquivo início
  ffmpeg -v error -ss "$3" -t 1.75 -i "$2" -an -vf "$svf" -c:v libx264 -preset slow -crf 23 -pix_fmt yuv420p -movflags +faststart "$tmp/$1.mp4"
  ffmpeg -v error -ss "$3" -t 1.75 -i "$2" -an -vf "$svf" -c:v libvpx-vp9 -b:v 0 -crf 34 -row-mt 1 -pix_fmt yuv420p "$tmp/$1.webm"
}
site SITE_MISU dist/media/misu-site.mp4 2.0
site SITE_LCS dist/media/lcs-site.mp4 3.1
ffmpeg -v error -i assets/sites/trama.webp -vf "scale=1280:-2" -c:v libwebp -quality 80 "$tmp/trama.webp"
{
  echo "// Gerado por scripts/build-tools-assets.sh — vídeos e prints em base64"
  echo "export const TOOLS_DEV_PHOTO = \"data:image/webp;base64,$(base64 -w0 "$tmp/foto.webp")\";"
  for n in SITE_MISU SITE_LCS; do
    echo "export const TOOLS_$n = { webm: \"data:video/webm;base64,$(base64 -w0 "$tmp/$n.webm")\", mp4: \"data:video/mp4;base64,$(base64 -w0 "$tmp/$n.mp4")\", dur: $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$tmp/$n.mp4") };"
  done
  echo "export const TOOLS_TRAMA = \"data:image/webp;base64,$(base64 -w0 "$tmp/trama.webp")\";"
} > src/toolsAssets.js
ls -la "$tmp" | awk '{print $5, $9}'
rm -rf "$tmp"
ls -la src/toolsAssets.js
