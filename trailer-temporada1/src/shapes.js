// Formas e trajetórias "aleatórias" do trailer, todas calculadas uma vez no carregamento a partir
// de um PRNG com semente fixa (mulberry32(24)): o render sai igual toda vez.
(function () {
  function mulberry32(a) {
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rand = mulberry32(24);
  const range = (a, b) => a + (b - a) * rand();
  const round = (v) => Math.round(v * 10) / 10;

  // Ponto de impacto da caneca (cena 1): base da caneca tocando o chão (y = 1400)
  const IMPACT = { x: 540, y: 1360 };

  // 12 cacos: polígono de 5 a 7 vértices em volta do próprio centro, vetor de explosão,
  // deriva lenta e rotação final fixos. As cores repetem as partes da caneca.
  const SHARD_FILLS = ["#F5F8FC", "#F5F8FC", "#E8EEF7", "#3DDBB0", "#F5F8FC", "#BFD3FF", "#F5F8FC", "#E8EEF7", "#3DDBB0", "#F5F8FC", "#F5F8FC", "#E8EEF7"];
  const SHARDS = SHARD_FILLS.map((fill, i) => {
    const n = 5 + Math.floor(rand() * 3);
    const size = range(22, 44);
    const pts = [];
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2 + range(-0.35, 0.35);
      const r = size * range(0.55, 1);
      pts.push(`${round(Math.cos(a) * r)},${round(Math.sin(a) * r)}`);
    }
    // explosão em leque, mais para cima e para os lados (o chão segura a parte de baixo)
    const ang = (-180 + (i + 0.5) * (180 / 12) + range(-6, 6)) * (Math.PI / 180);
    const dist = range(170, 400);
    return {
      fill,
      points: pts.join(" "),
      dx: round(Math.cos(ang) * dist),
      dy: round(Math.sin(ang) * dist * 0.85),
      rot: round(range(-220, 220)),
      driftX: round(range(-6, 6)),
      driftY: round(range(-6, 2)),
      driftRot: round(range(-14, 14)),
    };
  });

  // 8 gotas de café seguindo a caneca na queda (posição relativa ao centro da caneca + atraso)
  const TRAIL = Array.from({ length: 8 }, (_, i) => ({
    r: round(range(6, 14)),
    ox: round(range(-120, -10)),
    oy: round(-110 - i * 22 + range(-10, 10)),
    lag: round(0.03 + i * 0.012),
  }));

  // 10 respingos abrindo em coroa no impacto
  const SPLASH = Array.from({ length: 10 }, (_, i) => {
    const ang = (-165 + i * (150 / 9) + range(-5, 5)) * (Math.PI / 180);
    const dist = range(110, 260);
    return { r: round(range(5, 12)), dx: round(Math.cos(ang) * dist), dy: round(Math.sin(ang) * dist), driftY: round(range(-5, 3)) };
  });

  // Corações da votação (cena 6): para cada onda e cada barra, de 2 a 4 corações
  const HEARTS = [0, 1, 2].map(() => [0, 1, 2, 3, 4].map(() => Array.from({ length: 2 + Math.floor(rand() * 3) }, () => ({
    dx: round(range(-40, 40)), dy: round(range(-150, -90)), delay: round(range(0, 0.25)), s: round(range(0.8, 1.15)),
  }))));

  // 6 partículas saindo do selo (cena 6)
  const STAMP_PARTICLES = Array.from({ length: 6 }, (_, i) => {
    const ang = (i / 6) * Math.PI * 2 + range(-0.3, 0.3);
    const dist = range(170, 230);
    return { r: round(range(4, 8)), dx: round(Math.cos(ang) * dist), dy: round(Math.sin(ang) * dist) };
  });

  window.SHAPES = { IMPACT, SHARDS, TRAIL, SPLASH, HEARTS, STAMP_PARTICLES };
})();
