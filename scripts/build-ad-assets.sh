#!/usr/bin/env bash
# Gera src/adAssets.js para o motion SiteAd (anúncio de sites):
#  - AD_TILES: telas dos sites que fizemos para o mosaico — 7 da Dizzy, 3 de cada LCS/Noka/Misú
#    (intercaladas) e 1 de cada Kaiirós, YMB Cocktails, KDust, Trama e Bastos (capturas em assets/sites)
#  - AD_CLIP_MP4: vídeo (30fps) da abertura da Dizzy — moeda 3D girando — o trecho da gravação
#    original sem quadros perdidos (6,5–9,1s); abre entre as palavras e vai para o notebook
# Fontes: gravação original da Dizzy (raiz do repositório) e dist/media/*-site.mp4.
# Uso: bash scripts/build-ad-assets.sh
set -euo pipefail
cd "$(dirname "$0")/.."
DIZZY="Dizzy House Studio _ Tattoo & Dizzy Shop - Opera 2026-10-07 22-45-59.mp4"
tmp=$(mktemp -d)
i=0
tile() { ffmpeg -v error -ss "$2" -i "$1" -frames:v 1 -vf "scale=256:-1" -c:v libwebp -quality 72 "$tmp/t$i.webp"; i=$((i + 1)); }
for s in 7.0 8.4 16 20 24 29.3 33; do tile "$DIZZY" "$s"; done
for spec in "lcs 3" "noka 7" "misu 6" "lcs 9" "noka 11" "misu 10" "lcs 12" "noka 15" "misu 14"; do
  set -- $spec
  tile "dist/media/$1-site.mp4" "$2"
done
# capturas de outros sites que fizemos (assets/sites): Kaiirós, YMB Cocktails, KDust, Trama, Bastos
for f in kaiiros.png ymb-cocktails.webp kdust.webp trama.webp bastos.png; do
  ffmpeg -v error -i "assets/sites/$f" -vf "scale=320:-1" -c:v libwebp -quality 74 "$tmp/t$i.webp"; i=$((i + 1))
done
ffmpeg -v error -ss 6.5 -t 2.6 -i "$DIZZY" -an -vf "scale=1024:576,fps=30" -c:v libx264 -preset slow -crf 22 -pix_fmt yuv420p -movflags +faststart "$tmp/clip.mp4"
# 1024×576: largura e altura múltiplas de 16 — evita a linha verde que alguns decodificadores
# (Safari, aceleração de hardware) desenham na borda quando a altura não é múltipla de 16
# WebM (VP9) para navegadores sem H.264, como o Chromium da exportação
ffmpeg -v error -ss 6.5 -t 2.6 -i "$DIZZY" -an -vf "scale=1024:576,fps=30" -c:v libvpx-vp9 -b:v 0 -crf 34 -row-mt 1 -pix_fmt yuv420p "$tmp/clip.webm"
{
  echo "// Gerado por scripts/build-ad-assets.sh — telas e vídeo dos sites que fizemos (base64)"
  echo "export const AD_TILES = ["
  for f in $(ls "$tmp"/t*.webp | sort -V); do echo "  \"data:image/webp;base64,$(base64 -w0 "$f")\","; done
  echo "];"
  echo "export const AD_DIZZY_TILES = 7; // as primeiras são da Dizzy"
  echo "export const AD_EXTRA_TILES = 16; // a partir daqui: Kaiirós, YMB Cocktails, KDust, Trama, Bastos"
  echo "export const AD_CLIP_MP4 = \"data:video/mp4;base64,$(base64 -w0 "$tmp/clip.mp4")\";"
  echo "export const AD_CLIP_WEBM = \"data:video/webm;base64,$(base64 -w0 "$tmp/clip.webm")\";"
  echo "export const AD_CLIP_DUR = 2.6;"
} > src/adAssets.js
ls -la "$tmp/clip.mp4" "$tmp/clip.webm" src/adAssets.js
rm -rf "$tmp"
