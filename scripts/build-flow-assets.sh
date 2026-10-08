#!/usr/bin/env bash
# Gera src/flowAssets.js com quadros dos sites (gravações em dist/media) para o motion FlowReveal.
# Uso: bash scripts/build-flow-assets.sh
set -euo pipefail
cd "$(dirname "$0")/.."
tmp=$(mktemp -d)
shot() { # id arquivo tempo filtro
  ffmpeg -v error -ss "$3" -i "dist/media/$2" -frames:v 1 -vf "$4" -c:v libwebp -quality 72 "$tmp/$1.webp"
}
shot misu misu-site.mp4 8 "scale=400:-1"
shot lcs lcs-site.mp4 4 "scale=400:-1"
shot noka noka-site.mp4 8 "scale=400:-1"
shot dizzy dizzy-site.mp4 4 "scale=400:-1"
shot misuLogo misu-site.mp4 0.6 "crop=300:380:330:80,scale=240:-1"
shot nokaLogo noka-site.mp4 0.6 "crop=560:540:200:0,scale=250:-1"
{
  echo "// Gerado por scripts/build-flow-assets.sh — quadros dos sites que fizemos (webp em base64)"
  echo "export const FLOW_SHOTS = {"
  for id in misu lcs noka dizzy misuLogo nokaLogo; do
    echo "  $id: \"data:image/webp;base64,$(base64 -w0 "$tmp/$id.webp")\","
  done
  echo "};"
} > src/flowAssets.js
rm -rf "$tmp"
ls -la src/flowAssets.js
