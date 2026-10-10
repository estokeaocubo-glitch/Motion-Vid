#!/usr/bin/env bash
# Gera src/toolsAssets.js para o motion ToolsReveal ("dev / tools / site"):
#  - TOOLS_DEV:   Mixkit 41637 ("Experienced programmer working on a computer": dev de costas, monitores com código),
#                 Mixkit Video Free License (uso comercial sem atribuição), baixado na versão 720p a cada build
#  - TOOLS_ICONS: assets/tools-icons.mp4 (vídeo de referência enviado: pilha de ícones neon com o Pinterest na frente),
#                 só o trecho do começo (0,15–1,45s), antes de aparecerem os outros apps
#  - TOOLS_SITES: prints dos sites em assets/sites/, em 1280px de largura
# Vídeos em WebM (VP9) + MP4 (H.264), medidas múltiplas de 16. Uso: bash scripts/build-tools-assets.sh
set -euo pipefail
cd "$(dirname "$0")/.."
tmp=$(mktemp -d)
vid() { # nome entrada início duração largura altura
  local vf="scale=$5:$6:force_original_aspect_ratio=increase,crop=$5:$6,fps=30"
  ffmpeg -v error -ss "$3" -t "$4" -i "$2" -an -vf "$vf" -c:v libx264 -preset slow -crf 24 -pix_fmt yuv420p -movflags +faststart "$tmp/$1.mp4"
  ffmpeg -v error -ss "$3" -t "$4" -i "$2" -an -vf "$vf" -c:v libvpx-vp9 -b:v 0 -crf 36 -row-mt 1 -pix_fmt yuv420p "$tmp/$1.webm"
}
curl -sS --max-time 120 -o "$tmp/41637.mp4" "https://assets.mixkit.co/videos/41637/41637-720.mp4"
vid DEV "$tmp/41637.mp4" 0 8.8 1024 576
vid ICONS assets/tools-icons.mp4 0.15 1.3 736 416
for s in kaiiros ymb-cocktails kdust trama bastos; do
  f=$(ls assets/sites/$s.* | head -1)
  ffmpeg -v error -i "$f" -vf "scale=1280:-2" -c:v libwebp -quality 80 "$tmp/$s.webp"
done
{
  echo "// Gerado por scripts/build-tools-assets.sh — vídeos e prints em base64"
  for n in DEV ICONS; do
    echo "export const TOOLS_$n = { webm: \"data:video/webm;base64,$(base64 -w0 "$tmp/$n.webm")\", mp4: \"data:video/mp4;base64,$(base64 -w0 "$tmp/$n.mp4")\" };"
  done
  echo "export const TOOLS_DUR = { DEV: 8.8, ICONS: 1.3 };"
  echo "export const TOOLS_SITES = ["
  for s in kaiiros ymb-cocktails kdust trama bastos; do echo "  \"data:image/webp;base64,$(base64 -w0 "$tmp/$s.webp")\","; done
  echo "];"
} > src/toolsAssets.js
ls -la "$tmp" | awk '{print $5, $9}'
rm -rf "$tmp"
ls -la src/toolsAssets.js
