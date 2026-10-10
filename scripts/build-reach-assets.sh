#!/usr/bin/env bash
# Gera src/reachAssets.js para o motion ReachAd (anúncio "Amplie seu alcance"):
#  - REACH_TRAMA: a foto dos tecidos da Trama (recorte da captura em assets/sites), para "IR ALÉM"
# As telas dos sites e o vídeo da Dizzy vêm de src/adAssets.js. Uso: bash scripts/build-reach-assets.sh
set -euo pipefail
cd "$(dirname "$0")/.."
tmp=$(mktemp -d)
ffmpeg -v error -i assets/sites/trama.webp -vf "crop=820:592:212:286,scale=1280:-1" -c:v libwebp -quality 80 "$tmp/trama.webp"
{
  echo "// Gerado por scripts/build-reach-assets.sh"
  echo "export const REACH_TRAMA = \"data:image/webp;base64,$(base64 -w0 "$tmp/trama.webp")\";"
} > src/reachAssets.js
rm -rf "$tmp"
ls -la src/reachAssets.js
