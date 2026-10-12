// Timeline GSAP única do trailer, pausada e com tempos absolutos (segundos desde o início).
// Os elementos repetidos (cacos, cards, fachadas, linhas da votação) são montados aqui antes das
// animações; a timeline é registrada em window.__timelines pelo script inline do index.html.
(function () {
  const C = window.CONFIG;
  const { IMPACT, SHARDS, TRAIL, SPLASH, HEARTS, STAMP_PARTICLES } = window.SHAPES;
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const el = (tag, cls, parent, html) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    if (parent) parent.appendChild(n);
    return n;
  };
  const F = 1 / 30; // um quadro

  /* ---------------- montagem do DOM ---------------- */
  function buildDom() {
    // CENA 1: gotas, respingos e cacos (camada #debris, viva até 8 s)
    const debris = $("#debris");
    TRAIL.forEach((d, i) => {
      const n = el("div", "drop trail", debris);
      Object.assign(n.style, { width: d.r * 2 + "px", height: d.r * 2 + "px", left: 540 + d.ox - d.r + "px", top: 520 + d.oy - d.r + "px" });
      n.id = "trail-" + i;
    });
    SPLASH.forEach((d, i) => {
      const n = el("div", "drop splash", debris);
      Object.assign(n.style, { width: d.r * 2 + "px", height: d.r * 2 + "px", left: IMPACT.x - d.r + "px", top: IMPACT.y - d.r + "px" });
      n.id = "splash-" + i;
    });
    SHARDS.forEach((s, i) => {
      const n = el("div", "shard", debris, `<svg viewBox="-40 -40 80 80" width="80" height="80"><polygon points="${s.points}" fill="${s.fill}" /></svg>`);
      Object.assign(n.style, { width: "80px", height: "80px", left: IMPACT.x - 40 + "px", top: IMPACT.y - 40 + "px" });
      n.id = "shard-" + i;
    });

    // CENA 3: busca digitada, relógio e cards de resultado
    $("#clock").textContent = C.relogio;
    const query = `${C.segmento} em ${C.cidade}`;
    const typed = $("#typed");
    [...query].forEach((ch) => { el("span", null, typed).textContent = ch === " " ? " " : ch; });
    const results = $("#results");
    const star = `<svg viewBox="0 0 24 24" width="26" height="26"><path d="M12 2.5l2.9 6 6.6.8-4.9 4.6 1.3 6.5L12 17.2l-5.9 3.2 1.3-6.5L2.5 9.3l6.6-.8z" fill="#C9D2E0"/></svg>`;
    C.lojasBusca.forEach((nome, i) => {
      const card = el("div", "card", results, `
        <div class="card-name">${nome}</div>
        <div class="card-stars">${star.repeat(5)}</div>
        <div class="card-chips"><span class="chip">Site</span><span class="chip">WhatsApp</span></div>
        <div class="ripple"></div><div class="card-ring"></div>`);
      card.id = "card-" + i;
    });
    el("div", "card card-empty", results, `<div class="card-name">Sua loja?</div><div class="card-sub">não encontrada</div>`).id = "card-empty";

    // CENA 5: 5 fachadas pequenas e 5 janelas de navegador (rascunho → site pronto)
    const row = $("#s5-row");
    const AWN = ["#0E2147", "#2563EB", "#3DDBB0", "#F5F8FC", "#BFD3FF"];
    const HERO = ["#2563EB", "#0E2147", "#BFD3FF", "#3DDBB0", "#2563EB"];
    const CX = [185, 352.5, 520, 687.5, 855];
    CX.forEach((cx, i) => {
      const stripe = AWN[i] === "#F5F8FC" ? "#BFD3FF" : "#F5F8FC";
      const shop = el("div", "shop", row, `
        <svg viewBox="0 0 150 170" width="150" height="170">
          <rect x="10" y="40" width="130" height="130" fill="#0E2147" stroke="#BFD3FF" stroke-opacity="0.35" stroke-width="3"/>
          <rect x="4" y="22" width="142" height="30" fill="${AWN[i]}"/>
          <rect x="4" y="22" width="20" height="30" fill="${stripe}" opacity="0.55"/><rect x="44" y="22" width="20" height="30" fill="${stripe}" opacity="0.55"/>
          <rect x="84" y="22" width="20" height="30" fill="${stripe}" opacity="0.55"/><rect x="124" y="22" width="22" height="30" fill="${stripe}" opacity="0.55"/>
          <rect x="24" y="78" width="40" height="92" fill="#07122A" stroke="#BFD3FF" stroke-opacity="0.4" stroke-width="3"/>
          <rect x="76" y="78" width="52" height="54" fill="#07122A" stroke="#BFD3FF" stroke-opacity="0.4" stroke-width="3"/>
          <rect x="30" y="4" width="90" height="14" rx="3" fill="#BFD3FF" opacity="0.3"/>
        </svg>`);
      Object.assign(shop.style, { left: cx - 75 + "px", top: 1195 + "px", width: "150px", height: "170px" });
      shop.id = "shop-" + i;
      const win = el("div", "win", row, `
        <div class="win-bar"><i></i><i></i><i></i></div>
        <div class="win-layer draft">
          <b style="left:12px;top:12px;width:136px;height:56px"></b>
          <b style="left:12px;top:80px;width:64px;height:40px"></b><b style="left:84px;top:80px;width:64px;height:40px"></b>
          <b style="left:12px;top:128px;width:64px;height:40px"></b><b style="left:84px;top:128px;width:64px;height:40px"></b>
          <b style="left:30px;top:180px;width:100px;height:18px"></b>
        </div>
        <div class="win-layer site">
          <div class="site-hero" style="background:${HERO[i]}"></div>
          <div class="site-grid"><b></b><b></b><b></b><b></b></div>
          <div class="site-btn"></div>
        </div>`);
      Object.assign(win.style, { left: cx - 80 + "px", top: "945px" });
      win.id = "win-" + i;
    });

    // CENA 6: 5 linhas de votação com miniatura, rótulo, barra e corações
    const rows = $("#vote-rows");
    const heart = `<svg viewBox="0 0 28 28" width="28" height="28"><path d="M14 24.5S3 17.6 3 10.4C3 6.9 5.6 4.5 8.6 4.5c2.3 0 4.2 1.3 5.4 3.2 1.2-1.9 3.1-3.2 5.4-3.2 3 0 5.6 2.4 5.6 5.9 0 7.2-11 14.1-11 14.1z" fill="#3DDBB0"/></svg>`;
    for (let i = 0; i < 5; i++) {
      const r = el("div", "vrow", rows, `
        <div class="vrow-bg" style="position:absolute;inset:0;border-radius:26px;background:rgba(14,33,71,.75);border:3px solid rgba(191,211,255,.16)"></div>
        <div class="vmini">
          <div class="site-hero" style="background:${HERO[i]}"></div>
          <b style="left:8px;top:48px;width:36px;height:24px"></b><b style="left:48px;top:48px;width:36px;height:24px"></b>
          <b style="left:8px;top:78px;width:36px;height:24px"></b><b style="left:48px;top:78px;width:36px;height:24px"></b>
          <div class="site-btn"></div>
        </div>
        <div class="vlabel">Loja ${i + 1}</div>
        <div class="vtrack"><div class="vfill"></div><div class="vfill-win"></div></div>
        <div class="vrow-ring"></div>`);
      r.style.top = i * 178 + "px";
      r.style.background = "transparent";
      r.style.border = "none";
      r.id = "vrow-" + i;
      HEARTS.forEach((wave, w) => wave[i].forEach((h, k) => {
        const n = el("div", "heart", r, heart);
        n.id = `heart-${w}-${i}-${k}`;
      }));
    }
    const sparks = $("#stamp-particles");
    STAMP_PARTICLES.forEach((p, i) => {
      const n = el("div", "spark", sparks);
      Object.assign(n.style, { width: p.r * 2 + "px", height: p.r * 2 + "px", left: -p.r + "px", top: -p.r + "px" });
      n.id = "spark-" + i;
    });

    // CENA 7: foto opcional (só se CONFIG.fotoBrian apontar para um arquivo local) e @ do perfil
    if (C.fotoBrian) $("#brian-photo").style.backgroundImage = `url("${C.fotoBrian}")`;
    else if ($("#brian")) $("#brian").remove();
    $("#handle").textContent = C.handle;
  }

  /* ---------------- timeline ---------------- */
  function build() {
    buildDom();
    const tl = gsap.timeline({ paused: true });
    const lineIn = (targets, at, stagger = 0.12, dur = 0.5) =>
      tl.fromTo(targets, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: dur, ease: "expo.out", stagger }, at);
    const lineOut = (targets, at, dur = 0.3) => tl.to(targets, { y: -40, opacity: 0, duration: dur, ease: "power2.in" }, at);
    const shake = (target, at, offsets) => offsets.forEach(([x, y], k) => tl.set(target, { x, y }, at + k * F));

    /* ===== CENA 1 — A caneca (0–3 s) ===== */
    // o primeiro quadro já mostra a caneca caindo (centro em y = 520, 14°)
    tl.fromTo("#mug", { y: 650, rotation: 14, transformOrigin: "50% 50%" }, { y: 1400, rotation: 32, duration: 0.9, ease: "power1.in" }, 0);
    tl.fromTo("#s1-shadow", { scaleX: 0.35, opacity: 0.12 }, { scaleX: 1, opacity: 0.5, duration: 0.9, ease: "power1.in" }, 0);
    tl.to("#s1-shadow", { scaleX: 1.25, opacity: 0.3, duration: 0.7, ease: "expo.out" }, 0.9);
    TRAIL.forEach((d, i) => {
      tl.fromTo("#trail-" + i, { y: 0, opacity: 1 }, { y: 750 - d.oy * 0.35, duration: 0.9 - d.lag, ease: "power1.in" }, d.lag);
      tl.set("#trail-" + i, { opacity: 0 }, 0.9);
    });
    // impacto em 0,90 s: a caneca some, os cacos aparecem, flash e tremor
    tl.set("#mug", { opacity: 0 }, 0.9);
    tl.set("#flash-fill", { backgroundColor: "#FFFFFF", opacity: 0.55 }, 0.9);
    tl.set("#flash-fill", { opacity: 0 }, 0.9 + 2 * F);
    shake("#cam", 0.9, [[12, -7], [-9, 6], [7, 4], [-5, -3], [2, 2], [0, 0]]);
    SPLASH.forEach((d, i) => {
      const s = "#splash-" + i;
      tl.set(s, { opacity: 0 }, 0);
      tl.set(s, { opacity: 1 }, 0.9);
      tl.to(s, { x: d.dx, y: d.dy, duration: 0.7, ease: "expo.out" }, 0.9);
      tl.to(s, { y: d.dy + d.driftY, duration: 1.1, ease: "sine.inOut" }, 1.6);
      tl.to(s, { opacity: 0, duration: 0.4, ease: "power2.in" }, 2.8);
    });
    // âncoras do bloco A (cena 2): 3 cacos por linha; os 3 últimos viram partículas de fundo
    const lines = $$("#blockA .line-in");
    const anchors = [];
    const LINE_W = [592, 779, 629]; // largura das linhas do bloco A em Bebas Neue 150 px (medida com as fontes locais)
    lines.forEach((ln, i) => {
      const w = LINE_W[i];
      const cy = 606 + 143 * i + 71;
      anchors.push([540 - w / 2 - 46, cy - 28], [540 + w / 2 + 46, cy + 22], [540 + (i - 1) * 140, cy - 92]);
    });
    const BACK = [[170, 420, 0.42], [920, 560, 0.36], [210, 1330, 0.4]];
    SHARDS.forEach((s, i) => {
      const id = "#shard-" + i;
      const p0 = [IMPACT.x + s.dx + s.driftX, IMPACT.y + s.dy + s.driftY];
      const p1 = [p0[0] + (540 - p0[0]) * 0.2, p0[1] + (820 - p0[1]) * 0.2];
      tl.set(id, { opacity: 0, x: 0, y: 0, rotation: 0, scale: 1 }, 0);
      tl.set(id, { opacity: 1 }, 0.9);
      tl.to(id, { x: s.dx, y: s.dy, rotation: s.rot * 0.8, duration: 0.7, ease: "expo.out" }, 0.9);
      tl.to(id, { x: s.dx + s.driftX, y: s.dy + s.driftY, rotation: s.rot * 0.8 + s.driftRot, duration: 1.1, ease: "sine.inOut" }, 1.6);
      tl.to(id, { x: p1[0] - IMPACT.x, y: p1[1] - IMPACT.y, rotation: s.rot * 0.8 + s.driftRot * 1.4, duration: 0.3, ease: "power1.in" }, 2.7);
      if (i < 9) {
        const a = anchors[i];
        tl.to(id, { x: a[0] - IMPACT.x, y: a[1] - IMPACT.y, rotation: s.rot * 0.3, scale: 0.8, duration: 0.5, ease: "expo.inOut" }, 3.0);
        // quando a linha aparece, os cacos dela encolhem e somem (viraram as letras)
        const lineAt = 3.35 + Math.floor(i / 3) * 0.15;
        tl.to(id, { scale: 0.2, opacity: 0, duration: 0.35, ease: "power2.in" }, lineAt + 0.12);
      } else {
        const [bx, by, sc] = BACK[i - 9];
        tl.to(id, { x: bx - IMPACT.x, y: by - IMPACT.y, scale: sc, opacity: 0.15, duration: 0.5, ease: "expo.inOut" }, 3.0);
        tl.to(id, { y: by - IMPACT.y - 60, rotation: "+=30", duration: 4.1, ease: "none" }, 3.5); // paralaxe lenta
        tl.to(id, { opacity: 0, duration: 0.4, ease: "power2.in" }, 7.6);
      }
    });

    /* ===== CENA 2 — A frase (3–8 s) ===== */
    tl.fromTo(lines, { yPercent: 100 }, { yPercent: 0, duration: 0.6, ease: "expo.out", stagger: 0.15 }, 3.35);
    tl.to("#blockA", { y: -60, opacity: 0, duration: 0.35, ease: "power2.in" }, 4.8);
    tl.fromTo("#b1", { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "expo.out" }, 5.05);
    tl.fromTo("#cliente-wrap", { scale: 0.9, opacity: 0, transformOrigin: "50% 50%" }, { scale: 1, opacity: 1, duration: 0.55, ease: "expo.out" }, 5.2);
    // rachadura em 5,75 s: risco desenhado, micro tremor e as metades se separando
    const crack = $("#crack-line");
    const len = Math.ceil(crack.getTotalLength());
    tl.set(crack, { strokeDasharray: len, strokeDashoffset: len }, 0);
    tl.to(crack, { strokeDashoffset: 0, duration: 0.25, ease: "power2.out" }, 5.75);
    shake("#cliente", 5.75, [[4, -2], [-3, 2], [0, 0]]);
    tl.fromTo("#cliente-a", { x: 0, y: 0 }, { x: -4.6, y: 3.8, duration: 0.25, ease: "power2.out" }, 5.75);
    tl.fromTo("#cliente-b", { x: 0, y: 0 }, { x: 4.6, y: -3.8, duration: 0.25, ease: "power2.out" }, 5.75);
    // "e nem perceber." chega só com opacidade, sem movimento e sem som
    tl.fromTo("#silent", { opacity: 0 }, { opacity: 1, duration: 0.8, ease: "sine.inOut" }, 6.4);
    tl.to(["#blockB", "#silent"], { scale: 0.96, opacity: 0, duration: 0.4, ease: "power2.in", transformOrigin: "50% 50%" }, 7.6);

    /* ===== CENA 3 — A busca (8–14 s) ===== */
    tl.fromTo("#phone", { y: 320, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "expo.out" }, 8.0);
    tl.set("#h3b .hl-line", { opacity: 0 }, 0);
    lineIn("#h3a .hl-line", 8.4);
    $$("#typed span").forEach((s, i) => tl.set(s, { display: "inline" }, 8.6 + i * 0.05));
    for (let k = 0, t = 8.6; t < 13.6; k++, t += 0.4) tl.set("#caret", { opacity: k % 2 ? 0 : 1 }, t);
    tl.fromTo(".card:not(.card-empty)", { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "expo.out", stagger: 0.15 }, 10.2);
    lineOut("#h3a .hl-line", 11.1);
    lineIn("#h3b .hl-line", 11.4);
    tl.fromTo("#card-empty", { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "power1.out" }, 11.3);
    tl.to("#card-empty", { opacity: 0.35, duration: 0.25, ease: "sine.inOut", repeat: 3, yoyo: true }, 11.5);
    const pick = "#card-" + C.lojaEscolhida;
    tl.set(pick + " .ripple", { left: 400, top: 80 }, 0);
    tl.fromTo(pick + " .ripple", { scale: 0, opacity: 0.5 }, { scale: 1, opacity: 0, duration: 0.4, ease: "expo.out" }, 12.5);
    tl.fromTo(pick + " .card-ring", { opacity: 0 }, { opacity: 1, duration: 0.15, ease: "power1.out" }, 12.5);
    tl.fromTo(pick, { scale: 1 }, { scale: 1.03, duration: 0.3, ease: "back.out(1.6)" }, 12.55);
    tl.fromTo("#toast", { y: 140 }, { y: 0, duration: 0.6, ease: "expo.out" }, 12.9);
    tl.fromTo("#s3-whip", { x: 0, filter: "blur(0px)" }, { x: -1200, filter: "blur(8px)", duration: 0.4, ease: "power3.in" }, 13.6);

    /* ===== CENA 4 — O lojista (14–18 s) ===== */
    tl.fromTo("#s4-in", { x: 1200 }, { x: 0, duration: 0.5, ease: "expo.out" }, 14.0);
    tl.set("#sign-back", { opacity: 0 }, 0);
    tl.fromTo("#sign-flip", { scaleX: 1 }, { scaleX: 0, duration: 0.2, ease: "power1.in" }, 14.3);
    tl.set("#sign-front", { opacity: 0 }, 14.5);
    tl.set("#sign-back", { opacity: 1 }, 14.5);
    tl.to("#sign-flip", { scaleX: -1, duration: 0.2, ease: "power1.out" }, 14.5);
    tl.set("#sign-hang", { rotation: 0, transformOrigin: "50% 0%" }, 0);
    [[6, 0.12], [-4.5, 0.14], [3, 0.12], [-1.6, 0.11], [0, 0.11]].reduce((t, [r, d]) => {
      tl.to("#sign-hang", { rotation: r, duration: d, ease: "sine.inOut" }, t);
      return t + d;
    }, 14.7);
    tl.fromTo("#s4-cam", { scale: 1, transformOrigin: "440px 1281px" }, { scale: 1.45, duration: 1.2, ease: "power2.inOut" }, 15.0);
    tl.fromTo("#notif", { scale: 0, opacity: 0, transformOrigin: "0% 50%" }, { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(1.6)" }, 15.6);
    lineIn("#h4 .hl-line", 15.8, 0.15, 0.6);
    tl.to("#halo", { opacity: 0.22, duration: 0.5, ease: "sine.inOut", repeat: 1, yoyo: true }, 16.6);
    // corte de luz: 4 quadros de tela escura a partir de 17,87 s
    tl.set("#flash-fill", { backgroundColor: "#07122A", opacity: 1 }, 536 * F);
    tl.set("#flash-fill", { opacity: 0 }, 540 * F);

    /* ===== CENA 5 — O anúncio (18–25 s) ===== */
    tl.fromTo("#porisso", { scale: 1.25, opacity: 0, filter: "blur(10px)", transformOrigin: "50% 50%" }, { scale: 1, opacity: 1, filter: "blur(0px)", duration: 0.7, ease: "expo.out" }, 18.0);
    tl.fromTo("#porisso-wrap", { y: 0, scale: 1, transformOrigin: "50% 50%" }, { y: -430, scale: 0.7, duration: 0.5, ease: "power2.inOut" }, 18.7);
    tl.fromTo(".shop", { scale: 0, transformOrigin: "50% 100%" }, { scale: 1, duration: 0.5, ease: "back.out(1.6)", stagger: 0.1 }, 19.0);
    tl.fromTo("#s5-label", { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "expo.out" }, 19.6);
    tl.set(".win", { opacity: 0 }, 0);
    tl.set(".win .site", { clipPath: "inset(0% 100% 0% 0%)" }, 0);
    tl.set(".win .site-btn", { scale: 1, transformOrigin: "50% 50%" }, 0);
    for (let i = 0; i < 5; i++) {
      const t = 20.2 + 0.5 * i;
      const w = "#win-" + i;
      tl.fromTo(w, { scale: 0.2, y: 120, opacity: 0, transformOrigin: "50% 100%" }, { scale: 1, y: 0, opacity: 1, duration: 0.3, ease: "expo.out" }, t);
      tl.to(w + " .site", { clipPath: "inset(0% 0% 0% 0%)", duration: 0.4, ease: "power2.inOut" }, t + 0.55);
      tl.fromTo(w + " .site-btn", { scale: 1 }, { scale: 1.35, duration: 0.12, ease: "power2.out", yoyo: true, repeat: 1 }, t + 0.95);
    }
    tl.to("#s5-label", { y: -20, opacity: 0, duration: 0.3, ease: "power2.in" }, 23.2);
    tl.fromTo("#s5-pill", { scale: 0, opacity: 0, transformOrigin: "50% 50%" }, { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.6)" }, 23.4);
    tl.fromTo("#s5-line", { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "expo.out" }, 23.6);
    // as janelas sobem e se reagrupam no lugar das miniaturas da votação (cena 6)
    for (let i = 0; i < 5; i++) {
      const fromX = [185, 352.5, 520, 687.5, 855][i];
      const toX = 80 + 18 + 46; // centro da miniatura
      const toY = 560 + 178 * i + 14 + 66;
      tl.to("#win-" + i, { x: toX - fromX, y: toY - 1060, scale: 0.575, duration: 0.4, ease: "power2.inOut", transformOrigin: "50% 50%" }, 24.6);
    }
    tl.to(["#porisso-wrap", ".shop", "#s5-pill-wrap", "#s5-line"], { opacity: 0, duration: 0.35, ease: "power2.in" }, 24.6);

    /* ===== CENA 6 — A votação (25–31 s) ===== */
    tl.fromTo(".vrow-bg, .vlabel, .vtrack", { x: -40, opacity: 0 }, { x: 0, opacity: 1, duration: 0.6, ease: "expo.out", stagger: 0.08 }, 25.0);
    lineIn("#h6 .hl-line", 25.2, 0.15, 0.6);
    tl.set(".vfill", { scaleX: 0, transformOrigin: "0% 50%" }, 0);
    tl.set(".vfill-win", { scaleX: 0, transformOrigin: "0% 50%" }, 0);
    const WAVES = [[0.24, 0.36, 0.3, 0.22, 0.29], [0.36, 0.55, 0.44, 0.47, 0.47], C.votos];
    const SPEED = [0.7, 0.62, 0.66, 0.74, 0.6];
    [25.8, 26.6, 27.4].forEach((at, w) => {
      WAVES[w].forEach((v, i) => {
        tl.to(`#vrow-${i} .vfill`, { scaleX: v, duration: SPEED[i], ease: "power2.out" }, at);
        if (i === 3) tl.to(`#vrow-${i} .vfill-win`, { scaleX: v, duration: SPEED[i], ease: "power2.out" }, at);
        HEARTS[w][i].forEach((h, k) => {
          const x0 = 140 + 680 * v - 14 + h.dx * 0.3;
          tl.set(`#heart-${w}-${i}-${k}`, { left: x0, top: 90, scale: h.s }, 0);
          tl.fromTo(`#heart-${w}-${i}-${k}`, { y: 0, x: 0, opacity: 0 }, { keyframes: [{ opacity: 1, duration: 0.15 }, { opacity: 0, duration: 0.75 }], y: h.dy, x: h.dx, duration: 0.9, ease: "power1.out" }, at + 0.25 + h.delay);
        });
      });
    });
    tl.to("#vrow-3", { scale: 1.06, duration: 0.4, ease: "back.out(1.6)", transformOrigin: "50% 50%" }, 28.4);
    tl.to("#vrow-3 .vrow-ring", { opacity: 1, duration: 0.3, ease: "power1.out" }, 28.4);
    tl.to("#vrow-3 .vfill-win", { opacity: 1, duration: 0.3, ease: "power1.out" }, 28.4);
    tl.to("#vrow-0, #vrow-1, #vrow-2, #vrow-4", { opacity: 0.35, duration: 0.4, ease: "power1.out" }, 28.4);
    tl.fromTo("#stamp", { scale: 1.6, opacity: 0, rotation: -10, transformOrigin: "50% 50%" }, { scale: 1, opacity: 1, rotation: -10, duration: 0.6, ease: "back.out(2.2)" }, 28.7);
    shake("#cam", 28.9, [[5, -3], [-4, 2], [0, 0]]);
    STAMP_PARTICLES.forEach((p, i) => {
      tl.fromTo("#spark-" + i, { x: 0, y: 0, opacity: 0 }, { keyframes: [{ opacity: 1, duration: 0.15 }, { opacity: 0, duration: 0.95 }], x: p.dx, y: p.dy, duration: 1.1, ease: "expo.out" }, 29.3 + i * 0.03);
    });
    tl.to("#s6-out", { y: 80, opacity: 0, duration: 0.4, ease: "power2.in" }, 30.6);

    /* ===== CENA 7 — A chamada e a marca (31–35 s) ===== */
    tl.fromTo("#cta1", { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "expo.out" }, 31.0);
    tl.fromTo("#cta2-mask", { clipPath: "inset(0% 100% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.7, ease: "power3.out" }, 31.4);
    tl.fromTo("#plane", { opacity: 0, x: 0, y: 0 }, { opacity: 1, duration: 0.2, ease: "power1.out" }, 31.6);
    tl.to("#plane", { x: 28, y: -28, duration: 0.2, ease: "power2.out", yoyo: true, repeat: 1 }, 31.75);
    tl.fromTo("#cta3", { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "expo.out" }, 32.1);
    if (C.fotoBrian) {
      tl.fromTo("#brian-photo", { scale: 0, transformOrigin: "50% 50%" }, { scale: 1, duration: 0.5, ease: "back.out(1.6)" }, 32.6);
      tl.fromTo("#brian-caption", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: "expo.out" }, 32.9);
      tl.to("#brian", { opacity: 0, duration: 0.3, ease: "power2.in" }, 33.3); // abre espaço para a marca
    }
    tl.to("#s7-texts", { y: -120, scale: 0.9, duration: 0.4, ease: "power2.inOut", transformOrigin: "50% 40%" }, 33.3);
    const outline = $("#cube-outline");
    const olen = Math.ceil(outline.getTotalLength());
    tl.set(outline, { strokeDasharray: olen, strokeDashoffset: olen }, 0);
    tl.set(".cube-face", { opacity: 0 }, 0);
    tl.to(outline, { strokeDashoffset: 0, duration: 0.5, ease: "power2.inOut" }, 33.4);
    ["#face-top", "#face-left", "#face-right"].forEach((f, i) => tl.to(f, { opacity: 1, duration: 0.1, ease: "none" }, 33.9 + i * 0.1));
    tl.fromTo("#wordmark-mask", { clipPath: "inset(0% 100% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.45, ease: "power3.out" }, 33.95);
    tl.fromTo("#handle", { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: "expo.out" }, 34.05);
    // 34,4–35 s: quadro final parado

    return tl;
  }

  // Montagem síncrona: o runtime do HyperFrames carrega as fontes locais antes de capturar os quadros,
  // e nenhuma medida depende delas (as larguras de texto usadas ficam fixas acima).
  window.buildTrailerTimeline = build;
})();
