#!/usr/bin/env bash
# Gera src/adAssets.js para o motion SiteAd (anúncio de sites):
#  - AD_TILES: 16 telas dos sites que fizemos (mosaico)
#  - AD_CLIP: sequência de quadros de uma gravação (o "vídeo" que abre entre as palavras e vai para o notebook)
# Fonte: gravações em dist/media/*-site.mp4. Uso: bash scripts/build-ad-assets.sh
set -euo pipefail
cd "$(dirname "$0")/.."
tmp=$(mktemp -d)
i=0
for spec in "misu 2" "lcs 3" "noka 3" "dizzy 5" "misu 6" "lcs 6" "noka 7" "dizzy 8" "misu 10" "lcs 9" "noka 11" "dizzy 11" "misu 14" "lcs 12" "noka 15" "dizzy 14"; do
  set -- $spec
  ffmpeg -v error -ss "$2" -i "dist/media/$1-site.mp4" -frames:v 1 -vf "scale=256:-1" -c:v libwebp -quality 70 "$tmp/t$i.webp"
  i=$((i + 1))
done
ffmpeg -v error -ss 5.8 -t 2.0 -i dist/media/misu-site.mp4 -vf "fps=6,scale=480:-1" -c:v libwebp -quality 72 "$tmp/c%02d.webp"
{
  echo "// Gerado por scripts/build-ad-assets.sh — quadros dos sites que fizemos (webp em base64)"
  echo "export const AD_TILES = ["
  for f in $(ls "$tmp"/t*.webp | sort -V); do echo "  \"data:image/webp;base64,$(base64 -w0 "$f")\","; done
  echo "];"
  echo "export const AD_CLIP = ["
  for f in $(ls "$tmp"/c*.webp | sort -V); do echo "  \"data:image/webp;base64,$(base64 -w0 "$f")\","; done
  echo "];"
} > src/adAssets.js
rm -rf "$tmp"
ls -la src/adAssets.js; grep -c "data:image" src/adAssets.js
