# Pendências antes de publicar

- [ ] Códigos hexadecimais oficiais da paleta Estoke ao Cubo (trocar os tokens provisórios em `styles/main.css`, `:root`). Observação: o repositório já tem uma paleta da marca em `src/motionKit.js` (ink `#002450`, blue `#008ACC`, cyan `#2FD4FF` etc.) — confirmar qual vale.
- [ ] Logo oficial em SVG (`assets/logo.svg`). Hoje o vídeo usa o placeholder de cubo isométrico (componente único `#logo` em `index.html`, cena 7). Há um `assets/cube-logo.png` na raiz do repositório que pode ser vetorizado.
- [ ] `@` do perfil (`CONFIG.handle` em `src/config.js`, hoje `@seu_perfil`).
- [ ] Segmento usado na busca da cena 3 (`CONFIG.segmento`, padrão "loja de roupas").
- [ ] Confirmar que "Loja Aurora", "Boutique Lume" e "Casa Vértice" não são lojas reais de Petrópolis (`CONFIG.lojasBusca`).
- [ ] Foto do Brian para a cena 7 (opcional): colocar em `assets/brian.jpg` e trocar `CONFIG.fotoBrian` para `"assets/brian.jpg"`. Sem a foto, a cena segue sem esse bloco.
- [ ] Narração gravada (`assets/audio/vo-brian.wav`, 35 s alinhados ao `CUE_SHEET.md`), efeito de quebra (`assets/audio/sfx-quebra.wav`, entra em 0,90 s) e trilha livre de direitos (`assets/audio/musica.mp3`, de 8,0 s ao fim, volume 0,22). Nenhum desses arquivos existe ainda, por isso só foi gerado `out/trailer_sem_audio.mp4`.
- [ ] Efeitos opcionais (`whoosh.wav` em 13,6 s e 18,0 s, `carimbo.wav` em 28,7 s), se o Brian fornecer.
