#!/usr/bin/env bash
# Gera src/toolsAssets.js para o motion ToolsReveal ("dev / tools / site"):
#  - TOOLS_DEV:   assets/dev-programador.mp4 (vídeo do programador, vertical 576×1024), trecho 0,4–7,25s
#                 em leve câmera lenta (90%) para cobrir os 7,6s depois do corte; o recorte da faixa
#                 (acompanhando o rosto) é feito no componente. Tratamento de cor: o céu estourado atrás
#                 (contraluz) é escurecido só onde a imagem é muito clara (máscara de luminância), e a pessoa
#                 ganha meio-tons mais claros, contraste e cor — para destacar do fundo
#  - TOOLS_SITES: prints dos sites em assets/sites/, em 1280px de largura
# Vídeo em WebM (VP9) + MP4 (H.264). Uso: bash scripts/build-tools-assets.sh
set -euo pipefail
cd "$(dirname "$0")/.."
tmp=$(mktemp -d)
grade="format=gbrp,split=3[b0][d0][m0];\
[b0]eq=gamma=1.18:contrast=1.08:saturation=1.2,colorbalance=rm=0.02:bm=-0.01,format=gbrp[base];\
[d0]curves=all='0/0 0.5/0.34 0.8/0.45 1/0.52',colorbalance=bm=0.03:bh=0.05:rh=-0.02,format=gbrap[dark];\
[m0]format=gray,geq=lum='clip((lum(X,Y)-170)*4,0,255)',dilation,gblur=sigma=1.5[mask];\
[dark][mask]alphamerge[da];[base][da]overlay=format=gbrp,vignette=angle=PI/4.5,format=yuv420p"
vf="$grade,setpts=PTS/0.9,fps=30,scale=576:1024"
ffmpeg -v error -ss 0.4 -t 6.85 -i assets/dev-programador.mp4 -an -filter_complex "$vf" -c:v libx264 -preset slow -crf 22 -pix_fmt yuv420p -movflags +faststart "$tmp/DEV.mp4"
ffmpeg -v error -ss 0.4 -t 6.85 -i assets/dev-programador.mp4 -an -filter_complex "$vf" -c:v libvpx-vp9 -b:v 0 -crf 33 -row-mt 1 -pix_fmt yuv420p "$tmp/DEV.webm"
for s in kaiiros ymb-cocktails kdust trama bastos; do
  f=$(ls assets/sites/$s.* | head -1)
  ffmpeg -v error -i "$f" -vf "scale=1280:-2" -c:v libwebp -quality 80 "$tmp/$s.webp"
done
{
  echo "// Gerado por scripts/build-tools-assets.sh — vídeo e prints em base64"
  echo "export const TOOLS_DEV = { webm: \"data:video/webm;base64,$(base64 -w0 "$tmp/DEV.webm")\", mp4: \"data:video/mp4;base64,$(base64 -w0 "$tmp/DEV.mp4")\" };"
  echo "export const TOOLS_DEV_DUR = $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$tmp/DEV.mp4");"
  echo "export const TOOLS_SITES = ["
  for s in kaiiros ymb-cocktails kdust trama bastos; do echo "  \"data:image/webp;base64,$(base64 -w0 "$tmp/$s.webp")\","; done
  echo "];"
} > src/toolsAssets.js
ls -la "$tmp" | awk '{print $5, $9}'
rm -rf "$tmp"
ls -la src/toolsAssets.js
