#!/usr/bin/env bash
# Gera src/toolsAssets.js para o motion ToolsReveal ("dev / tools / site"):
#  - TOOLS_DEV_INTRO:  assets/dev-intro.mov (programador de camisa vermelha, céu azul), trecho 3,65–5,39s
#                      (começa olhando para o lado e termina virando para a câmera), abre a faixa "dev"
#  - TOOLS_DEV_MORRO:  assets/dev-morro.mov (selfie no morro, montanhas ao fundo), trecho 1,5–3,25s
#  - TOOLS_DEV:        assets/dev-video.mp4 (celular com o site + notebook com código), 3,7s em leve
#                      câmera lenta (90%) → 4,1s
#  - TOOLS_SITE_MISU / TOOLS_SITE_LCS: trechos das gravações de tela (dist/media/*-site.mp4): o hero do
#                      Misú com os sushis (2,0s) e o hero da LCS com a van (3,1s), 1,75s cada
#  - TOOLS_TRAMA:      print do site da Trama (assets/sites/trama.webp), em 1280px de largura
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
clip DEV_INTRO assets/dev-intro.mov 3.65 1.74 1 "curves=all='0/0 0.06/0.18 0.2/0.42 0.4/0.62 0.7/0.83 1/1',colorbalance=rs=0.03:rm=0.02,eq=saturation=1.12:contrast=1.05"
clip DEV_MORRO assets/dev-morro.mov 1.5 1.75
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
  for n in DEV_INTRO DEV_MORRO SITE_MISU SITE_LCS; do
    echo "export const TOOLS_$n = { webm: \"data:video/webm;base64,$(base64 -w0 "$tmp/$n.webm")\", mp4: \"data:video/mp4;base64,$(base64 -w0 "$tmp/$n.mp4")\", dur: $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$tmp/$n.mp4") };"
  done
  echo "export const TOOLS_DEV = { webm: \"data:video/webm;base64,$(base64 -w0 "$tmp/DEV.webm")\", mp4: \"data:video/mp4;base64,$(base64 -w0 "$tmp/DEV.mp4")\" };"
  echo "export const TOOLS_DEV_DUR = $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$tmp/DEV.mp4");"
  echo "export const TOOLS_TRAMA = \"data:image/webp;base64,$(base64 -w0 "$tmp/trama.webp")\";"
} > src/toolsAssets.js
ls -la "$tmp" | awk '{print $5, $9}'
rm -rf "$tmp"
ls -la src/toolsAssets.js
