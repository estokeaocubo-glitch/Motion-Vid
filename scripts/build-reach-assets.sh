#!/usr/bin/env bash
# Gera src/reachAssets.js para o motion ReachAd (anúncio "Amplie seu alcance"):
#  Vídeos cinematográficos da Mixkit (Mixkit Video Free License: uso comercial, inclusive anúncios,
#  sem atribuição), recortados (a partir da versão 720p, a maior liberada no plano gratuito) no trecho usado, em 16:9 (1280×720) e vertical (576×1024),
#  WebM (VP9) + MP4 (H.264), com medidas múltiplas de 16 (evita linha verde em decodificadores):
#   - REACH_SALE   (14830 "Man celebrating in front of the computer")  → "VENDER MAIS"
#   - REACH_BEYOND (33546 "Man looking at the horizon raises his hands") → "IR ALÉM"
#   - REACH_SKY    (4204  "Pink sunset seen from a plane window")       → "MUITO ALÉM"
# Os originais são baixados a cada build e não ficam no repositório. Uso: bash scripts/build-reach-assets.sh
set -euo pipefail
cd "$(dirname "$0")/.."
tmp=$(mktemp -d)
clip() { # nome id início duração posição-do-recorte-vertical (0 = esquerda, 1 = direita)
  local name=$1 id=$2 ss=$3 dur=$4 fx=${5:-0.5}
  curl -sS --max-time 120 -o "$tmp/$id.mp4" "https://assets.mixkit.co/videos/$id/$id-720.mp4"
  local wide="scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,fps=30"
  # vertical: recorte 9:16 posicionado para seguir a pessoa em cena
  local tall="crop=ih*9/16:ih:(iw-ih*9/16)*$fx:0,scale=576:1024,fps=30"
  for o in wide tall; do
    local vf=$([ $o = wide ] && echo "$wide" || echo "$tall")
    ffmpeg -v error -ss "$ss" -t "$dur" -i "$tmp/$id.mp4" -an -vf "$vf" -c:v libx264 -preset slow -crf 25 -pix_fmt yuv420p -movflags +faststart "$tmp/${name}_$o.mp4"
    ffmpeg -v error -ss "$ss" -t "$dur" -i "$tmp/$id.mp4" -an -vf "$vf" -c:v libvpx-vp9 -b:v 0 -crf 38 -row-mt 1 -pix_fmt yuv420p "$tmp/${name}_$o.webm"
  done
}
clip SALE 14830 4.8 2.2 0.3
clip BEYOND 33546 0.8 1.8 0.55
clip SKY 4204 10.0 3.6 0.5
{
  echo "// Gerado por scripts/build-reach-assets.sh — trechos de vídeos da Mixkit (licença livre) em base64"
  for n in SALE BEYOND SKY; do
    echo "export const REACH_$n = {"
    for o in wide tall; do
      echo "  $o: { webm: \"data:video/webm;base64,$(base64 -w0 "$tmp/${n}_$o.webm")\", mp4: \"data:video/mp4;base64,$(base64 -w0 "$tmp/${n}_$o.mp4")\" },"
    done
    echo "};"
  done
  echo "export const REACH_DUR = { SALE: 2.2, BEYOND: 1.8, SKY: 3.6 };"
} > src/reachAssets.js
ls -la "$tmp"/*_*.{mp4,webm} | awk '{print $5, $9}'
rm -rf "$tmp"
ls -la src/reachAssets.js
