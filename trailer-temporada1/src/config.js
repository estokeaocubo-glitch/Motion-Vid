// Configuração do trailer "Perder um cliente e nem perceber" (Temporada 1 · Estoke ao Cubo).
// Tudo que depende do cliente fica aqui; os itens provisórios estão listados em PENDENCIAS.md.
window.CONFIG = {
  segmento: "loja de roupas", // termo digitado na busca da cena 3 (PENDÊNCIA: confirmar)
  cidade: "Petrópolis",
  relogio: "23:47",
  lojasBusca: ["Loja Aurora", "Boutique Lume", "Casa Vértice"], // fictícias (PENDÊNCIA: confirmar que não existem)
  lojaEscolhida: 1, // índice tocado na cena 3 (Boutique Lume)
  handle: "@seu_perfil", // PENDÊNCIA
  // Foto opcional da cena 7. Deixe null enquanto assets/brian.jpg não existir no disco
  // (nunca é buscada pela rede). Com a foto no lugar, troque para "assets/brian.jpg".
  fotoBrian: null,
  votos: [0.42, 0.63, 0.51, 0.9, 0.56], // barras ilustrativas da cena 6; a loja 4 vence
};
