// Corte curto (~16s) do motion SaaS: trechos da timeline completa (tempo global, em segundos),
// todos começando em tempo de batida (120 BPM) para a música emendar no ritmo.
export const VARIANT = {
  name: "curto",
  segments: [
    { from: 0, to: 2, name: "Gancho" },
    { from: 4.5, to: 8, name: "Cubo" },
    { from: 13, to: 16.5, name: "Dashboard" },
    { from: 24, to: 26.5, name: "Automação" },
    { from: 34, to: 38.5, name: "Logo + CTA" },
  ],
};
