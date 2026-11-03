/* ============================================================================
   S02 — 두 배로 만들었는데, 왜 실패했을까?  (global 40–80 s, local 0–40)
   Beats (local seconds):
     0–14   B01 workshop plate, slow push-in; dust, sea sparkle, stone-dust puffs, gulls
     6–12   B02 insert (rope measuring), dissolve in/out
     14–17  crossfade to navy math space; cubes a / 2a fade in (15–18)
     17.5–  labels a, a³, 2a
     20.4–24.3  eight unit cubes placed one by one (held steps) → 8a³ (24.6)
     25.4–29.3  centre line  모서리 길이 2배 → 부피 8배
     29.5–33  big cube fades away; 32–35 dotted ghost cube (edge ∛2·a) draws on; ? / 2a³
   ========================================================================== */
ANIM.scene({
  id: 's02', title: '두 배로 만들었는데, 왜 실패했을까?',
  start: ANIM.TIMES.s02[0], end: ANIM.TIMES.s02[1],
  mood: t => (t < 20 ? 'work' : 'math'),
  fadeIn: 0.9, fadeOut: 0.9,

  init(api, S) {
    const { u, W, H } = api, P = ANIM.paint;
    // navy math space: painted sky + nebula + stars + paper, built once
    S.navy = u.layer(W, H, c => {
      P.sky(c, { preset: 'navyMath', seed: 22, horizon: H * 1.05, clouds: false });
      P.nebula(c, { seed: 31, alpha: 0.75, count: 10, colors: ['#1f3f6e', '#2a2a66', '#1c4d58', '#3a2f66'] });
      P.stars(c, { seed: 41, count: 140, yMax: H, alpha: 0.55 });
      u.paper(c, 0.14);
    });
    // 3D layout (y up, floor at y = -1)
    S.big = { o: [-3.55, -1, -1], s: 2 };            // 2a cube  (centre x = -2.55)
    S.small = { o: [1.55, -1, -0.5], s: 1 };          // a cube   (centre x = 2.05)
    S.cbrt2 = Math.cbrt(2);
    S.ghost = { o: [-2.55 - S.cbrt2 / 2, -1, -S.cbrt2 / 2], s: S.cbrt2 };   // wanted cube, edge ∛2·a
    // 8 unit sub-cubes of the 2a cube (origin offsets), placement order: bottom layer back→front, then top
    S.subs = [];
    for (let y = 0; y < 2; y++) for (let z = 0; z < 2; z++) for (let x = 0; x < 2; x++) S.subs.push([S.big.o[0] + x, S.big.o[1] + y, S.big.o[2] + z]);
    S.T = { subStart: 20.4, subStep: 0.55 };
  },

  draw(api, t, S) {
    const { ctx: c, u, W, H } = api, P = ANIM.paint, E = u.ease;
    const boil = api.boil;

    /* ---------------------------------------------------------- plates (0–17) */
    if (t < 17.2) {
      const kb1 = u.kb(t, 0, 14, { zoom: 1.0, fx: 0.45, fy: 0.46 }, { zoom: 1.10, fx: 0.42, fy: 0.40 });
      const r1 = u.plate(c, 'B01', kb1);
      const pp = (px, py) => u.platePt(r1, px, py);
      // living elements — B01 (image-fraction positions)
      // 1) sea sparkle, clipped to the visible strip of sea between the big block and the awning
      c.save(); u.polyPath(c, [pp(0.57, 0.365), pp(0.74, 0.365), pp(0.74, 0.47), pp(0.57, 0.475)], true); c.clip();
      P.seaSparkle(c, t, { horizonY: pp(0, 0.37).y, bottom: pp(0, 0.47).y, x: pp(0.655, 0).x, spread: r1.w * 0.16, count: 26, seed: 5, alpha: 0.55 });
      c.restore();
      // 2) stone dust from the two chisels (small warm puffs)
      P.smoke(c, t, { x: pp(0.485, 0.2).x, y: pp(0.485, 0.2).y, seed: 3, scale: 0.32, alpha: 0.2, color: '#f3ead8', count: 5, rise: 70, wind: 0.3 });
      P.smoke(c, t, { x: pp(0.565, 0.705).x, y: pp(0.565, 0.705).y, seed: 9, scale: 0.28, alpha: 0.18, color: '#f3ead8', count: 4, rise: 55, wind: -0.2 });
      // 3) drifting dust / grit in the sunlight over the yard
      P.particles(c, t, { kind: 'dust', count: 26, box: [pp(0.08, 0).x, pp(0, 0.42).y, r1.w * 0.64, r1.h * 0.5], seed: 7, size: 1.1, speed: 0.6, alpha: 0.5, color: '#fff0c8' });
      // 4) two gulls over the sea gap
      P.birds(c, t, { count: 2, seed: 11, box: [pp(0.595, 0).x, pp(0, 0.05).y, r1.w * 0.14, r1.h * 0.16], scale: 0.65, speed: 0.55, color: '#3a3a4a', alpha: 0.7 });
      u.grade(c, '#ffd9a0', 0.07);

      // B02 insert cut: dissolve in 5.6–6.6, out 11.4–12.4
      const a2 = Math.min(E.io(u.seg(t, 5.6, 6.6)), 1 - E.io(u.seg(t, 11.4, 12.4)));
      if (a2 > 0) {
        const kb2 = u.kb(t, 5.6, 12.4, { zoom: 1.04, fx: 0.50, fy: 0.46 }, { zoom: 1.13, fx: 0.47, fy: 0.42 }, E.sine);
        kb2.alpha = a2; const r2 = u.plate(c, 'B02', kb2);
        c.save(); c.globalAlpha *= a2;
        const q = (px, py) => u.platePt(r2, px, py);
        // sunlit dust motes drifting over the marble; glints on the distant sea (top right)
        u.motes(c, t, { count: 18, box: [q(0.05, 0).x, q(0, 0.05).y, r2.w * 0.9, r2.h * 0.9], seed: 13, color: '#fff3d0', size: 2.4, speed: 0.45, alpha: 0.32, drift: 0.6 });
        P.particles(c, t, { kind: 'glint', count: 9, box: [q(0.74, 0).x, q(0, 0.02).y, r2.w * 0.25, r2.h * 0.12], seed: 17, size: 0.7, alpha: 0.6 });
        u.grade(c, '#ffd090', 0.08);
        c.restore();
      }
    }

    /* --------------------------------------------------- math space (14–40) */
    if (t >= 14) {
      const kNavy = E.io(u.seg(t, 14, 17));
      if (t < 17.2) {
        // plate is already on screen: lay the navy space over it with rising alpha
        c.save(); c.globalAlpha = kNavy; c.drawImage(S.navy, 0, 0); c.restore();
      } else c.drawImage(S.navy, 0, 0);
      if (kNavy <= 0) return;

      // slow camera drift
      const yaw = 0.56 + 0.12 * E.sine(u.seg(t, 14, 40)), pitch = 0.33;
      const Pj = u.camera({ yaw, pitch, dist: 10, fov: 1560, cx: W * 0.53, cy: 570, target: [0, 0, 0] });
      const kCube = E.out(u.seg(t, 15, 18));

      // flat floor light under the cubes (breathing) — grounds the models in the space
      const br = 0.8 + 0.2 * Math.sin(t * 0.9);
      const fb = Pj(-2.55, -1, 0), fs = Pj(2.05, -1, 0);
      c.save(); c.globalAlpha = kCube * 0.9; c.translate(0, fb.y + 10); c.scale(1, 0.32); c.translate(0, -(fb.y + 10));
      u.glow(c, fb.x, fb.y + 10, 620, '#58e0d0', 0.13 * br); u.glow(c, fs.x, fs.y + 10, 380, '#58e0d0', 0.11 * br);
      c.restore();
      u.motes(c, t, { count: 24, seed: 29, color: '#9ff5ea', size: 2.2, speed: 0.4, alpha: 0.3 * kNavy, drift: 0.7 });

      /* --- big cube (2a) and its 8 unit cubes --- */
      const nSub = t < S.T.subStart ? 0 : Math.min(8, Math.floor((t - S.T.subStart) / S.T.subStep) + 1);
      const kBigFade = 1 - E.io(u.seg(t, 29.5, 33.2));         // question beat: big cube dissolves
      const bigA = kCube * kBigFade;
      if (bigA > 0.01) {
        const outerA = nSub ? 0.4 : 1;
        u.cube(c, Pj, { origin: S.big.o, size: S.big.s, color: '#58e0d0', edge: '#9ff5ea', faceAlpha: nSub ? 0.04 : 0.16, w: 3, jitter: 0.8, seed: boil * 3 + 1, alpha: bigA * outerA, hiddenAlpha: 0.22 });
        if (nSub) {
          // draw the placed sub-cubes back → front
          const placed = S.subs.slice(0, nSub).map((o, i) => { const q = Pj(o[0] + 0.5, o[1] + 0.5, o[2] + 0.5); return { o, i, z: q.z }; }).sort((a, b) => b.z - a.z);
          placed.forEach(({ o, i }) => {
            const t0 = S.T.subStart + i * S.T.subStep; const kd = E.outc(u.seg(api.tq, t0, t0 + 0.3));   // 12 fps drop-in
            // each block slightly smaller than its cell so the eight read as separate stones
            const g = 0.05, org = [o[0] + g, o[1] + g + (1 - kd) * 1.1, o[2] + g];
            u.cube(c, Pj, { origin: org, size: 1 - 2 * g, color: '#6fe8da', edge: '#c8fff8', faceAlpha: 0.26, w: 2.6, jitter: 0.7, seed: boil * 5 + 40 + i * 13, alpha: bigA * (0.35 + 0.65 * kd), hiddenAlpha: 0.1 });
            // soft flash as the block settles
            const kf = 1 - u.seg(t, t0 + 0.2, t0 + 0.75); if (kf > 0) { const q = Pj(o[0] + 0.5, o[1] + 0.5, o[2] + 0.5); u.glow(c, q.x, q.y, 150 * q.s / 176, '#dffffb', 0.5 * kf * kf * bigA); }
          });
        }
      }

      /* --- small cube (a) --- */
      u.cube(c, Pj, { origin: S.small.o, size: S.small.s, color: '#58e0d0', edge: '#9ff5ea', faceAlpha: 0.16, w: 3, jitter: 0.8, seed: boil * 7 + 200, alpha: kCube, hiddenAlpha: 0.25 });

      /* --- labels --- */
      const eb = bottomEdge(Pj, S.big.o, S.big.s), es = bottomEdge(Pj, S.small.o, S.small.s);
      const gold = '#f3d27a', ivory = '#f6f1e6';
      const lab = (str, x, y, a, o = {}) => { if (a > 0.01) u.math(c, str, x, y, Object.assign({ size: 54, color: gold, alpha: a, glow: 18 }, o)); };
      lab('a', es.mx, es.my + 44, E.out(u.seg(t, 17.5, 18.3)));
      lab('a³', es.mx, es.my + 102, E.out(u.seg(t, 18.6, 19.4)), { size: 50, color: ivory, glow: 12 });
      lab('2a', eb.mx, eb.my + 44, E.out(u.seg(t, 18.0, 18.8)) * kBigFade);
      // running count while the unit cubes fill, then 8a³
      if (nSub && t < 24.6) { const top = topPoint(Pj, S.big.o, S.big.s); u.math(c, String(nSub), top.x, top.y - 52, { size: 66, color: '#c8fff8', glow: 22, alpha: 0.95 * kBigFade }); }
      if (t >= 24.6) { const k8 = E.out(u.seg(t, 24.6, 25.3)); const pulse = 1 + 0.08 * Math.sin((t - 24.6) * 5) * (1 - u.seg(t, 24.6, 27)); lab('8a³', eb.mx, eb.my + 102, k8 * kBigFade, { size: 56 * pulse, color: '#ffe9a8', glow: 26 }); }
      // centre line
      const kC = Math.min(E.out(u.seg(t, 25.4, 26.1)), 1 - E.io(u.seg(t, 29.3, 30.1)));
      if (kC > 0.01) u.text(c, '모서리 길이 2배  →  부피 8배', W / 2, 100, { size: 58, font: 'serif', weight: 700, color: '#f6e9c8', alpha: kC, glow: 26, glowColor: '#d9a441', spacing: 2 });

      /* --- question beat: ghost cube with edge ∛2·a, dotted --- */
      const kG = E.io(u.seg(t, 32, 35.2));
      if (kG > 0.01) {
        dottedCube(u, c, Pj, S.ghost.o, S.ghost.s, { p: kG, color: gold, w: 3.2, seed: boil * 11 + 500 });
        const eg = bottomEdge(Pj, S.ghost.o, S.ghost.s);
        const kQ = E.out(u.seg(t, 34.6, 35.4)), breathe = 0.7 + 0.3 * (0.5 + 0.5 * Math.sin(t * 1.6));
        const cg = Pj(-2.55, -1 + S.cbrt2 / 2, 0);
        u.text(c, '?', cg.x, cg.y, { size: 150, font: 'serif', weight: 700, color: '#ffe9a8', alpha: kQ * breathe, glow: 40, glowColor: '#f3d27a' });
        lab('?', eg.mx, eg.my + 44, kQ, { size: 54, color: gold });
        lab('2a³', eg.mx, eg.my + 102, E.out(u.seg(t, 35.6, 36.4)), { size: 56, color: '#ffe9a8', glow: 26 });
      }
    }

    /* helpers (scene-local) */
    function topPoint(Pj, o, s) {   // highest projected vertex of the cube
      let best = null; for (let i = 0; i < 8; i++) { const p = Pj(o[0] + (i & 1) * s, o[1] + ((i >> 1) & 1) * s, o[2] + ((i >> 2) & 1) * s); if (!best || p.y < best.y) best = p; } return best;
    }
    function bottomEdge(Pj, o, s) {
      const cs = [[o[0], o[1], o[2]], [o[0] + s, o[1], o[2]], [o[0] + s, o[1], o[2] + s], [o[0], o[1], o[2] + s]].map(v => Pj(v[0], v[1], v[2]));
      let k = 0; cs.forEach((p, i) => { if (p.y > cs[k].y) k = i; });
      const a = cs[k], n1 = cs[(k + 1) % 4], n2 = cs[(k + 3) % 4];
      const b = Math.hypot(n1.x - a.x, n1.y - a.y) > Math.hypot(n2.x - a.x, n2.y - a.y) ? n1 : n2;   // longer visible bottom edge
      return { a, b, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
    }
    function dottedCube(u, c, Pj, o, s, opt) {
      const { p = 1, color = '#f3d27a', w = 2.5, seed = 1, dash = 17, gap = 13 } = opt;
      const faces = u.cubeFaces(Pj, o, s), front = faces.slice(3), keys = new Set();
      const key = (a, b) => { const ka = a.x.toFixed(1) + ',' + a.y.toFixed(1), kb = b.x.toFixed(1) + ',' + b.y.toFixed(1); return ka < kb ? ka + '|' + kb : kb + '|' + ka; };
      front.forEach(f => { for (let i = 0; i < 4; i++) keys.add(key(f.pts[i], f.pts[(i + 1) % 4])); });
      u.cubeEdges(Pj, o, s).forEach(([a, b], i) => {
        const vis = keys.has(key(a, b)); const L = Math.hypot(b.x - a.x, b.y - a.y); const n = Math.max(1, Math.floor(L / (dash + gap))); const nn = Math.ceil(n * p);
        for (let k = 0; k < nn; k++) {
          const t0 = (k * (dash + gap)) / L, t1 = Math.min(1, (k * (dash + gap) + dash) / L);
          const pts = [{ x: u.lerp(a.x, b.x, t0), y: u.lerp(a.y, b.y, t0) }, { x: u.lerp(a.x, b.x, t1), y: u.lerp(a.y, b.y, t1) }];
          if (vis) { c.save(); c.globalCompositeOperation = 'lighter'; u.ink(c, pts, { w: w * 3.2, color: u.alpha(color, 0.12), jitter: 0.5, seed: seed + i * 7 + k, taper: 0, step: 4 }); c.restore(); }
          u.ink(c, pts, { w: vis ? w : w * 0.7, color, alpha: vis ? 0.85 : 0.35, jitter: 0.6, seed: seed + i * 7 + k, taper: 0.2, step: 4 });
        }
      });
    }
  },
});
