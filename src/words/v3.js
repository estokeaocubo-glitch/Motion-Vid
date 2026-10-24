// Opção 3 — contraste: "Das 8h às 18h você trabalha. Das 18h às 8h seu site vende. Tenha sua vitrine 24h."
export const SCRIPT = {
  name: "Opção 3 · contraste",
  steps: [
    [0.0, "w", "das 8h"],
    [0.5, "w", "às 18h", "das 8h"],
    [1.25, "b", "você trabalha."],
    [2.0, "b", "às 8h", "das 18h", "xl"],
    [2.75, "w", "seu site"],
    [3.25, "b", "vende."],
    [3.75, "w", "tenha sua"],
    [4.25, "b", "vitrine", null, "xl"],
    [4.75, "w", "24h."],
  ],
  typed: { at: 5.5, text: "estoke ao cubo." },
};
