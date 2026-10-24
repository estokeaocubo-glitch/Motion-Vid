// Roteiro padrão (Opção 1). As outras opções entram por alias no build (scripts/build-html.mjs).
// Opção 1 — fiel à ideia: "Difícil vender das 8h às 18h? Seu site vende 24 horas por dia. Até enquanto você dorme."
// [tempo, fundo ("w" branco / "b" preto), palavra, palavra pequena acima, tamanho ("xl" = gigante da virada)]
export const SCRIPT = {
  name: "Opção 1 · fiel à ideia",
  steps: [
    [0.0, "w", "difícil"],
    [0.75, "b", "vender", "difícil"],
    [1.25, "w", "das 8h"],
    [1.5, "w", "às 18h?", "das 8h"],
    [2.0, "b", "seu site", null, "xl"],
    [2.75, "w", "vende"],
    [3.25, "b", "24 horas"],
    [3.75, "w", "por dia."],
    [4.25, "b", "até"],
    [4.5, "w", "enquanto"],
    [4.75, "b", "você"],
    [5.0, "w", "dorme."],
  ],
  typed: { at: 5.75, text: "estoke ao cubo." },
};
