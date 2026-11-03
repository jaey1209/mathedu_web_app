/* ============================================================================
   S02 — 두 배로 만들었는데, 왜 실패했을까?  (global 40–80 s, local 0–40)
   Beats (local seconds):
     0–17   B01 workshop plate, one slow push-in; hammer-rhythm stone-dust puffs,
            sea sparkle in the gap, sunlit yard dust, two gulls
     5.5–12 B02 insert (rope measuring) — straight cut in / out on 12 fps frames
     14–17  dissolve to the navy math space (a soft teal bloom at the altar bridges it)
     16.4–18.6  cubes a / 2a fade in (after the plate is gone) · labels 18.0–19.6
     19.6–23.45 eight unit stones placed one by one (held steps) → 8a³ (23.8)
     24.6–29.0  top line  모서리 길이 2배 → 부피 8배
     29.5–33.2  big cube fades away; 32–35 dotted ghost cube (edge ∛2·a) is drawn
            edge by edge; ? (34.6) / 2a³ (35.6)
   Camera: gentle bird's-eye (pitch −0.30), long lens (dist 60) so the on-screen
   edge ratios stay close to 2 : 1 and 1.26 : 1.
   ========================================================================== */
ANIM.scene({
  id: 's02', title: '두 배로 만들었는데, 왜 실패했을까?',
  start: ANIM.TIMES.s02[0], end: ANIM.TIMES.s02[1],
  mood: t => (t < 15.5 ? 'work' : 'math'),
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
    // static top line pre-rendered (58 px serif with a 26 px glow is costly per frame)
    S.topLine = u.layer(W, 220, c => u.text(c, '모서리 길이 2배  →  부피 8배', W / 2, 108, { size: 58, font: 'serif', weight: 700, color: '#f6e9c8', glow: 26, glowColor: '#d9a441', spacing: 2 }));
    // 3D layout (y up, floor at y = -1)
    S.big = { o: [-3.55, -1, -1], s: 2 };            // 2a cube  (centre x = -2.55)
    S.small = { o: [1.55, -1, -1.5], s: 1 };          // a cube   (centre x = 2.05) — near the same camera depth as the big cube
    S.cbrt2 = Math.cbrt(2);
    S.ghost = { o: [-2.55 - S.cbrt2 / 2, -1, -S.cbrt2 / 2], s: S.cbrt2 };   // wanted cube, edge ∛2·a
    // 8 unit sub-cubes of the 2a cube (origin offsets), placement order: bottom layer back→front, then top
    S.subs = [];
    for (let y = 0; y < 2; y++) for (let z = 0; z < 2; z++) for (let x = 0; x < 2; x++) S.subs.push([S.big.o[0] + x, S.big.o[1] + y, S.big.o[2] + z]);
    S.T = { subStart: 19.6, subStep: 0.55 };
    S.T.subEnd = S.T.subStart + 7 * S.T.subStep;      // 8th stone lands (23.45)
  },

  draw(api, t, S) {
    const { ctx: c, u, W, H } = api, P = ANIM.paint, E = u.ease;
    const boil = api.boil;
    const kNavy = t < 14 ? 0 : E.io(u.seg(t, 14, 17));
    const insert = api.tq >= 5.5 && api.tq < 12.0;       // B02 insert: straight cut on 12 fps boundaries

    /* ---------------------------------------------------------- plates (0–17) */
    if (t < 17) {
      if (!insert) {
        const kb1 = u.kb(t, 0, 14, { zoom: 1.0, fx: 0.45, fy: 0.46 }, { zoom: 1.10, fx: 0.42, fy: 0.40 });
        const r1 = u.plate(c, 'B01', kb1);
        const pp = (px, py) => u.platePt(r1, px, py);
        // living elements — B01 (image-fraction positions)
        // 1) sea sparkle in the strip of sea between the scaffold post and the cypress
        c.save(); u.polyPath(c, [pp(0.615, 0.418), pp(0.685, 0.418), pp(0.685, 0.525), pp(0.615, 0.525)], true); c.clip();
        P.seaSparkle(c, t, { horizonY: pp(0, 0.428).y, bottom: pp(0, 0.515).y, x: pp(0.65, 0).x, spread: r1.w * 0.085, count: 12, seed: 5, alpha: 0.4 });
        c.restore();
        // 2) stone dust bursting from the chisels on a hammer rhythm (12 fps bursts, two workers out of phase)
        chiselPuff(c, t, pp(0.482, 0.215), { period: 0.8, offset: 0.0, seed: 3, scale: r1.s * 0.9, dir: -0.4 });
        chiselPuff(c, t, pp(0.594, 0.742), { period: 0.8, offset: 0.37, seed: 9, scale: r1.s * 0.75, dir: 0.5 });
        // 3) drifting grit in the sunlit right half of the yard (below the sea strip, so the additive dots stay warm)
        P.particles(c, t, { kind: 'dust', count: 18, box: [pp(0.45, 0).x, pp(0, 0.53).y, r1.w * 0.5, r1.h * 0.42], seed: 7, size: 1.8, speed: 0.6, alpha: 0.6, color: '#fff0c8' });
        // 4) two gulls over the sea gap
        P.birds(c, t, { count: 2, seed: 11, box: [pp(0.595, 0).x, pp(0, 0.05).y, r1.w * 0.14, r1.h * 0.16], scale: 0.65, speed: 0.55, color: '#3a3a4a', alpha: 0.7 });
        u.grade(c, '#ffd9a0', 0.07);
        // bridge into the math space: a soft teal bloom where the big altar stands (no geometry on the plate)
        const kBridge = kNavy * (1 - E.io(u.seg(t, 16.0, 17.0)));
        if (kBridge > 0.01) { const q = pp(0.40, 0.35); u.glow(c, q.x, q.y, 420, '#58e0d0', 0.25 * kBridge); }
      } else {
        const kb2 = u.kb(t, 5.5, 12.0, { zoom: 1.04, fx: 0.50, fy: 0.46 }, { zoom: 1.13, fx: 0.47, fy: 0.42 }, E.sine);
        const r2 = u.plate(c, 'B02', kb2);
        const q = (px, py) => u.platePt(r2, px, py);
        // sunlit dust motes drifting over the marble; glints on the distant sea (top right)
        u.motes(c, t, { count: 18, box: [q(0.05, 0).x, q(0, 0.05).y, r2.w * 0.9, r2.h * 0.9], seed: 13, color: '#fff3d0', size: 2.4, speed: 0.45, alpha: 0.32, drift: 0.6 });
        P.particles(c, t, { kind: 'glint', count: 9, box: [q(0.74, 0).x, q(0, 0.02).y, r2.w * 0.25, r2.h * 0.12], seed: 17, size: 0.7, alpha: 0.6 });
        u.grade(c, '#ffd090', 0.08);
      }
    }

    /* --------------------------------------------------- math space (14–40) */
    if (t >= 14) {
      if (t < 17) {
        // plate is already on screen: lay the navy space over it with rising alpha
        c.save(); c.globalAlpha = kNavy; c.drawImage(S.navy, 0, 0); c.restore();
      } else c.drawImage(S.navy, 0, 0);
      if (kNavy <= 0) return;

      // slow camera drift — gentle bird's-eye, long lens (ratios on screen ≈ true ratios)
      const yaw = 0.56 + 0.12 * E.sine(u.seg(t, 14, 40)), pitch = -0.30;
      const Pj = u.camera({ yaw, pitch, dist: 60, fov: 9360, cx: W * 0.53, cy: 455, target: [0, 0, 0] });
      const kCube = E.out(u.seg(t, 16.4, 18.6));              // cubes arrive once the plate is gone

      // faint horizon haze around the floor plane (behind the cubes) + breathing floor light under each cube
      const fb = Pj(-2.55, -1, 0), fs = Pj(2.05, -1, -1);
      const floorY = Pj(0, -1, 0).y;
      c.save(); c.globalAlpha = 0.08 * kCube;
      c.fillStyle = u.grad(c, 0, floorY - 150, 0, floorY + 190, [[0, u.alpha('#1c4d58', 0)], [0.45, '#1c4d58'], [1, u.alpha('#1c4d58', 0)]]);
      c.fillRect(0, floorY - 150, W, 340); c.restore();
      const br = 0.8 + 0.2 * Math.sin(t * 0.9);
      const floorGlow = (p, r, a) => { c.save(); c.translate(0, p.y + 10); c.scale(1, 0.32); c.translate(0, -(p.y + 10)); u.glow(c, p.x, p.y + 10, r, '#58e0d0', a); c.restore(); };
      c.save(); c.globalAlpha = kCube * 0.9; floorGlow(fb, 620, 0.28 * br); floorGlow(fs, 380, 0.22 * br); c.restore();
      // two layers of motes: fine sharp ones, and a few large out-of-focus ones for depth
      u.motes(c, t, { count: 30, seed: 29, color: '#9ff5ea', size: 3, speed: 0.28, alpha: 0.5 * kNavy, drift: 0.6 });
      u.motes(c, t, { count: 9, seed: 53, color: '#9ff5ea', size: 5.5, speed: 0.18, alpha: 0.2 * kNavy, drift: 1.1 });

      /* --- big cube (2a) and its 8 unit stones --- */
      const nSub = t < S.T.subStart ? 0 : Math.min(8, Math.floor((t - S.T.subStart) / S.T.subStep) + 1);
      const kBigFade = 1 - E.io(u.seg(t, 29.5, 33.2));         // question beat: big cube dissolves
      const bigA = kCube * kBigFade;
      if (bigA > 0.01) {
        // the 2a frame eases down as the first stone lands, then dissolves once all eight are in
        const kFr = E.out(u.seg(t, S.T.subStart, S.T.subStart + 0.4));
        const outerA = (1 - 0.85 * kFr) * (1 - E.io(u.seg(t, S.T.subEnd + 0.8, S.T.subEnd + 1.4)));
        if (outerA > 0.01) u.cube(c, Pj, { origin: S.big.o, size: S.big.s, color: '#58e0d0', edge: '#9ff5ea', faceAlpha: 0.16 - 0.12 * kFr, w: 3, jitter: 0.8, seed: boil * 3 + 1, alpha: bigA * outerA, hiddenAlpha: 0.22 });
        if (nSub) {
          // draw the placed stones back → front
          const placed = S.subs.slice(0, nSub).map((o, i) => { const q = Pj(o[0] + 0.5, o[1] + 0.5, o[2] + 0.5); return { o, i, z: q.z }; }).sort((a, b) => b.z - a.z);
          placed.forEach(({ o, i }, k) => {
            const t0 = S.T.subStart + i * S.T.subStep; const kd = E.outc(u.seg(api.tq, t0, t0 + 0.3));   // 12 fps drop-in from above
            // each stone slightly smaller than its cell so the eight read as separate blocks
            const g = 0.08, org = [o[0] + g, o[1] + g + (1 - kd) * 1.1, o[2] + g];
            u.cube(c, Pj, { origin: org, size: 1 - 2 * g, color: '#6fe8da', edge: '#c8fff8', faceAlpha: 0.2 + 0.06 * (k / Math.max(1, placed.length - 1)), w: 2.6, jitter: 0.7, seed: boil * 5 + 40 + i * 13, alpha: bigA * (0.35 + 0.65 * kd), hiddenAlpha: 0.05, glow: false });
            // soft flash as the stone settles (drawn after the stone, so it sits on top of lower layers)
            const kf = 1 - u.seg(t, t0 + 0.2, t0 + 0.75); if (kf > 0) { const q = Pj(o[0] + 0.5, o[1] + 0.5, o[2] + 0.5); u.glow(c, q.x, q.y, 150 * q.s / 156, '#dffffb', 0.5 * kf * kf * bigA); }
          });
        }
      }

      /* --- small cube (a) --- */
      if (kCube > 0.01) u.cube(c, Pj, { origin: S.small.o, size: S.small.s, color: '#58e0d0', edge: '#9ff5ea', faceAlpha: 0.16, w: 3, jitter: 0.8, seed: boil * 7 + 200, alpha: kCube, hiddenAlpha: 0.25 });

      /* --- labels --- */
      const eb = bottomEdge(Pj, S.big.o, S.big.s), es = bottomEdge(Pj, S.small.o, S.small.s);
      const gold = '#f3d27a', ivory = '#f6f1e6';
      const lab = (str, x, y, a, o = {}) => { if (a > 0.01) u.math(c, str, x, y, Object.assign({ size: 54, color: gold, alpha: a, glow: 18 }, o)); };
      lab('a', es.mx, es.my + 44, E.out(u.seg(t, 18.0, 18.8)));
      lab('a³', es.mx, es.my + 102, E.out(u.seg(t, 19.0, 19.8)), { size: 50, color: ivory, glow: 12 });
      lab('2a', eb.mx, eb.my + 44, E.out(u.seg(t, 18.4, 19.2)) * kBigFade);
      // running count beside the big cube while the stones fill (clear of the drop envelope), then 8a³
      if (nSub && t < 23.8) { const lf = leftPoint(Pj, S.big.o, S.big.s), cc = Pj(-2.55, 0, 0); u.math(c, String(nSub), lf.x - 54, cc.y, { size: 66, color: '#c8fff8', glow: 22, alpha: 0.95 * kBigFade, align: 'right' }); }
      if (t >= 23.8) { const k8 = E.out(u.seg(t, 23.8, 24.5)); const pulse = 1 + 0.08 * Math.sin((t - 23.8) * 5) * (1 - u.seg(t, 23.8, 26.2)); lab('8a³', eb.mx, eb.my + 102, k8 * kBigFade, { size: 56 * pulse, color: '#ffe9a8', glow: 26 }); }
      if (t >= 23.8 && t < 24.4 && !S.chimed) { S.chimed = true; try { ANIM.snd.chime(660, 2.4, 0.08); } catch (e) { } }
      // top line (pre-rendered), gone before the question narration begins at local 29
      const kC = Math.min(E.out(u.seg(t, 24.6, 25.3)), 1 - E.io(u.seg(t, 28.2, 29.0)));
      if (kC > 0.01) { c.save(); c.globalAlpha = kC; c.drawImage(S.topLine, 0, 0); c.restore(); }

      /* --- question beat: ghost cube with edge ∛2·a, drawn edge by edge, dotted --- */
      const kG = u.seg(t, 32, 35.2);
      if (kG > 0.001) {
        const cg = Pj(-2.55, -1 + S.cbrt2 / 2, 0);
        u.glow(c, cg.x, cg.y, 1.25 * S.cbrt2 * cg.s, gold, 0.10 * E.out(kG));          // soft gold bloom under the sketch
        dottedCube(u, c, Pj, S.ghost.o, S.ghost.s, { p: kG, color: gold, w: 3.2, seed: boil * 11 + 500 });
        const eg = bottomEdge(Pj, S.ghost.o, S.ghost.s);
        const kQ = E.out(u.seg(t, 34.6, 35.4)), breathe = 0.7 + 0.3 * (0.5 + 0.5 * Math.sin(t * 1.6));
        u.text(c, '?', cg.x, cg.y, { size: 110, font: 'serif', weight: 700, color: '#ffe9a8', alpha: 0.6 * kQ * breathe, glow: 36, glowColor: '#f3d27a' });
        lab('?', eg.mx, eg.my + 44, kQ, { size: 54, color: gold });
        lab('2a³', eg.mx, eg.my + 102, E.out(u.seg(t, 35.6, 36.4)), { size: 56, color: '#ffe9a8', glow: 26 });
      }
    }

    /* helpers (scene-local) */
    // one hammer-blow of stone dust: 5 warm puffs burst from (x,y) during the first 0.45 s of every `period`
    function chiselPuff(c, t, pt, o) {
      const { period = 0.8, offset = 0, seed = 1, scale = 1, dir = 0, alpha = 0.42 } = o;
      const tt = t - offset; if (tt < 0) return;
      const cyc = Math.floor(tt / period), age = u.tq(tt - cyc * period, 12) / 0.45; if (age >= 1) return;
      const r = u.rng(seed + cyc * 17);
      c.save(); c.globalAlpha *= alpha * (1 - age) * (1 - 0.6 * age);
      for (let i = 0; i < 5; i++) {
        const ang = -Math.PI / 2 + (r() - 0.5) * 2.4 + dir; const sp = (26 + r() * 46) * scale;
        const px = pt.x + Math.cos(ang) * sp * age, py = pt.y + Math.sin(ang) * sp * age + 14 * age * age * scale;
        u.dab(c, px, py, (7 + 15 * age + r() * 6) * scale, '#f7efe0', 0.8, 0.3);
      }
      c.restore();
    }
    function leftPoint(Pj, o, s) {   // leftmost projected vertex of the cube
      let best = null; for (let i = 0; i < 8; i++) { const p = Pj(o[0] + (i & 1) * s, o[1] + ((i >> 1) & 1) * s, o[2] + ((i >> 2) & 1) * s); if (!best || p.x < best.x) best = p; } return best;
    }
    function bottomEdge(Pj, o, s) {
      const cs = [[o[0], o[1], o[2]], [o[0] + s, o[1], o[2]], [o[0] + s, o[1], o[2] + s], [o[0], o[1], o[2] + s]].map(v => Pj(v[0], v[1], v[2]));
      let k = 0; cs.forEach((p, i) => { if (p.y > cs[k].y) k = i; });
      const a = cs[k], n1 = cs[(k + 1) % 4], n2 = cs[(k + 3) % 4];
      const b = Math.hypot(n1.x - a.x, n1.y - a.y) > Math.hypot(n2.x - a.x, n2.y - a.y) ? n1 : n2;   // longer visible bottom edge
      return { a, b, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
    }
    // dashed cube drawn as a pencil path: bottom loop → four uprights → top loop; edge i grows during p ∈ [i/12, (i+1)/12]
    function dottedCube(u, c, Pj, o, s, opt) {
      const { p = 1, color = '#f3d27a', w = 2.5, seed = 1, dash = 17, gap = 13 } = opt;
      const [x, y, z] = o;
      const V = [[x, y, z], [x + s, y, z], [x + s, y + s, z], [x, y + s, z], [x, y, z + s], [x + s, y, z + s], [x + s, y + s, z + s], [x, y + s, z + s]].map(v => Pj(v[0], v[1], v[2]));
      const PATH = [[0, 1], [1, 5], [5, 4], [4, 0], [0, 3], [1, 2], [5, 6], [4, 7], [3, 2], [2, 6], [6, 7], [7, 3]];
      const faces = u.cubeFaces(Pj, o, s), front = faces.slice(3), keys = new Set();
      const key = (a, b) => { const ka = a.x.toFixed(1) + ',' + a.y.toFixed(1), kb = b.x.toFixed(1) + ',' + b.y.toFixed(1); return ka < kb ? ka + '|' + kb : kb + '|' + ka; };
      front.forEach(f => { for (let i = 0; i < 4; i++) keys.add(key(f.pts[i], f.pts[(i + 1) % 4])); });
      const halos = [], cores = [];
      PATH.forEach(([ia, ib], i) => {
        const q = E.out(u.clamp(p * 12 - i)); if (q <= 0) return;
        const a = V[ia], b = V[ib]; const vis = keys.has(key(a, b)); const L = Math.hypot(b.x - a.x, b.y - a.y);
        const n = Math.max(1, Math.floor(L / (dash + gap)));
        for (let k = 0; k < n; k++) {
          const t0 = (k * (dash + gap)) / L; if (t0 >= q) break;
          const t1 = Math.min(q, (k * (dash + gap) + dash) / L);
          const pts = [{ x: u.lerp(a.x, b.x, t0), y: u.lerp(a.y, b.y, t0) }, { x: u.lerp(a.x, b.x, t1), y: u.lerp(a.y, b.y, t1) }];
          const sd = seed + i * 101 + k;
          if (vis) halos.push({ pts, sd });
          cores.push({ pts, sd, vis });
        }
      });
      c.save(); c.globalCompositeOperation = 'lighter';
      halos.forEach(d => u.ink(c, d.pts, { w: w * 3.2, color: u.alpha(color, 0.12), jitter: 0.5, seed: d.sd, taper: 0, step: 4 }));
      c.restore();
      cores.forEach(d => u.ink(c, d.pts, { w: d.vis ? w : w * 0.7, color, alpha: d.vis ? 0.85 : 0.35, jitter: 0.6, seed: d.sd, taper: 0.2, step: 4 }));
    }
  },
});
