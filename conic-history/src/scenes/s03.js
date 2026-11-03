/* ============================================================================
   S03 — 수학자들이 마주한 난제  (global 80–120 s, local 0–40)
   Hybrid: C01 plate (stoa at sunset, three mathematicians around a sand tray)
   → navy math space (cube a vs cube x, x³ = 2a³, "water" pours showing the
   volume is exactly 2a³) → Hippocrates' proportion a : x = x : y = y : 2a
   turning into four glowing segments that flow out toward the next scene.

   Timing map (scene-local seconds; subtitles from script.js in brackets):
     0.0–18.0  C01 plate, one slow push-in toward the sand tray (zoom 1.00→1.10,
               keeps breathing through the dissolve)                [2–6.8, 8–15.5]
               living: breathing sunset glow, oil-lamp flicker + warm pool,
               warm dust motes in the sunlit table band, two distant birds
    15.8–18.0    dissolve: living elements dim, plate graded toward navy, navy layer over
    18.0–19.4  cubes a (left) and x (right, edge ∛2·a) fade in — both at the same
               camera depth so the projected edge ratio is exactly 1.26; labels a, a³, x, = ?
    18.9–21.6  compass sketch tied to cube a's floor edge (arc of length a, then a
               guessed 1.26× arc) that gets erased: the length resists construction
    19.2–21.4  x³ = 2a³ typed (top)                                 [18–25]
    20.3–22.6  pour 1: cube a drains into cube x → water level a³/x² ("a³" level mark)
    22.0–24.0  x = ∛2 × a typed (hand-drawn vinculum over the 2);  24.4  x ≈ 1.26a
    22.8–23.4  cube a refills;  23.6–25.9  pour 2 → cube x exactly full ("2a³")
    26.4–27.0  cube a refills again → hold: a³ (full) beside 2a³ (full)   [26–30.5]
    29.8–31.6  cubes + formulas fade out (floor glow lingers to 33.6)
    31.3–34.3  proportion  a : x = x : y = y : 2a  typed             [31.5–39.3]
    32.4–34.8  four glowing segments a, x, y, 2a grow out of the typing, one per 0.6 s
    35.2–37.4  "× ∛2" braces between the rows
    37.4–39.4  segments stream off to the right (cleared by ≈39.2, before the engine fade)
   ========================================================================== */
ANIM.scene({
  id: 's03', title: '수학자들이 마주한 난제',
  start: ANIM.TIMES.s03[0], end: ANIM.TIMES.s03[1],
  mood: 'math',
  fadeIn: 0.9, fadeOut: 0.9,

  init(api, S) {
    const { u, W, H } = api, P = ANIM.paint;
    // cached radial-glow sprites (same stops as u.glow) — big gradient fills are the costliest thing in software raster
    S.spr = {};
    S.glow = (c, x, y, r, color, alpha = 0.6) => {
      let s = S.spr[color];
      if (!s) s = S.spr[color] = u.layer(256, 256, cc => { const g = cc.createRadialGradient(128, 128, 0, 128, 128, 128); g.addColorStop(0, color); g.addColorStop(0.35, u.alpha(color, 0.5)); g.addColorStop(1, u.alpha(color, 0)); cc.fillStyle = g; cc.fillRect(0, 0, 256, 256); });
      c.save(); c.globalAlpha *= alpha; c.drawImage(s, x - r, y - r, r * 2, r * 2); c.restore();
    };
    // navy math space: painted sky + nebula (extra low blobs) + stars + soft teal floor haze + paper, built once
    S.navy = u.layer(W, H, c => {
      P.sky(c, { preset: 'navyMath', seed: 33, horizon: H * 1.05, clouds: false });
      P.nebula(c, { seed: 37, alpha: 0.75, count: 16, colors: ['#1f3f6e', '#2a2a66', '#1c4d58', '#3a2f66'] });
      const r = u.rng(41), cols = ['#1f3f6e', '#1c4d58', '#2a2a66', '#24456a'];
      for (let i = 0; i < 7; i++) u.dab(c, r() * W, 640 + r() * 380, 220 + r() * 300, cols[i % 4], 0.10 + r() * 0.08, 0.1);
      P.stars(c, { seed: 43, count: 220, yMax: H, alpha: 0.55 });
      c.save(); c.translate(0, 900); c.scale(1, 0.26); c.translate(0, -900); S.glow(c, W * 0.5, 900, 1150, '#2a8a86', 0.16); S.glow(c, W * 0.5, 900, 700, '#58e0d0', 0.07); c.restore();
      u.paper(c, 0.14);
    });
    // availability of paint helpers (local fallbacks below; paint.js is never edited)
    S.has = { lamp: !!(P && P.lampFlicker), flame: !!(P && P.flame), birds: !!(P && P.birds), particles: !!(P && P.particles) };
    // pre-warm every glow colour used in draw so no u.layer is created mid-playback
    S.m = u.layer(8, 8).getContext('2d');
    ['#ffc46a', '#fff0c0', '#fff3c4', '#58e0d0', '#bff4ff', '#dffffb', '#fff6d0'].forEach(col => S.glow(S.m, 0, 0, 1, col, 0));
    // 3D layout (y up, floor at y = -1). cube a: edge 1, cube x: edge ∛2 ≈ 1.26.
    // The cube centres are derived from the camera yaw every frame so both sit at camera depth 0 (see draw).
    S.cbrt2 = Math.cbrt(2);
    S.A = { s: 1 }; S.X = { s: S.cbrt2 }; S.sep = 2.0;
    // pour windows (cube a → cube x), each carrying exactly a³; refills of cube a
    S.pours = [[20.3, 22.6], [23.6, 25.9]];
    S.refills = [[22.8, 23.4], [26.4, 27.0]];
    // formula strings + measured widths (typed left-aligned from a centred origin); cumulative widths for the caret
    S.F = { f1: 'x³ = 2a³', f2: 'x = ∛2 × a', f3: 'x ≈ 1.26a', prop: 'a : x = x : y = y : 2a', ratio: '× ∛2' };
    const m = S.m;
    const cum = (str, size) => Array.from({ length: str.length + 1 }, (_, i) => u.math(m, str.slice(0, i), 0, 0, { size, alpha: 0 }));
    S.cw = { f1: cum(S.F.f1, 66), f2: cum(S.F.f2, 60), prop: cum(S.F.prop, 76), ratio: cum(S.F.ratio, 46) };
    S.w = { f1: S.cw.f1[S.F.f1.length], f2: S.cw.f2[S.F.f2.length], prop: S.cw.prop[S.F.prop.length], ratio: S.cw.ratio[S.F.ratio.length] };
    // Hippocrates segments: a, x = ∛2·a, y = ∛4·a, 2a  (unit = 360 px → 360 : 453.6 : 571.5 : 720)
    S.unit = 360;
    S.segs = [
      { lab: 'a', len: 1, t0: 32.4 },
      { lab: 'x', len: S.cbrt2, t0: 33.0 },
      { lab: 'y', len: S.cbrt2 * S.cbrt2, t0: 33.6 },
      { lab: '2a', len: 2, t0: 34.2 },
    ];
  },

  draw(api, t, S) {
    const { ctx: c, u, W, H } = api, P = ANIM.paint, E = u.ease;
    const boil = api.boil, tq = api.tq;
    const breathe = (speed, seed) => 0.85 + 0.15 * u.noise2(t * speed + seed * 5.3, seed);
    const gold = '#f3d27a', ivory = '#f6f1e6', teal = '#58e0d0';
    // hand-drawn vinculum over the radicand (the ∛ glyph has no bar): x0..x1 at the glyph's cap height
    const vinc = (x0, x1, y, size, color, a) => { if (a > 0.01) u.ink(c, [{ x: x0, y: y - size * 0.41 }, { x: x1, y: y - size * 0.41 }], { w: size * 0.045, color, alpha: a, jitter: 0.4, seed: boil * 3 + 61, taper: 0.1, step: 4 }); };

    /* ------------------------------------------------------------ plate (0–18) */
    const kNavy = E.io(u.seg(t, 15.8, 18.0)), live = 1 - kNavy;
    if (t < 18.0) {
      const kb = u.kb(t, 0, 18, { zoom: 1.0, fx: 0.5, fy: 0.5 }, { zoom: 1.10, fx: 0.47, fy: 0.6 });
      const R = u.plate(c, 'C01', kb);
      if (R) {
        const pp = (px, py) => u.platePt(R, px, py); const sz = R.w / W;
        // 1. sunset: breathing glow at the painted sun, warm bloom along the horizon
        const sun = pp(0.625, 0.215); const br = breathe(0.45, 3);
        S.glow(c, sun.x, sun.y, 0.34 * R.h * br, '#ffc46a', 0.2 * br * live);
        S.glow(c, sun.x, sun.y, 0.1 * R.h, '#fff0c0', 0.32 * br * live);
        // 2. oil lamp (bottom right): boiling flame on the painted spout + flickering warm pool
        const lamp = pp(0.757, 0.9);
        if (S.has.lamp) P.lampFlicker(c, t, { x: lamp.x, y: lamp.y, scale: 0.5 * sz, seed: 5, pool: 300, alpha: 0.95 * live });
        else { u.lamp(c, lamp.x, lamp.y - 10 * sz, 180 * sz, t, { alpha: 0.3 * live, seed: 5 }); S.glow(c, lamp.x, lamp.y - 8 * sz, 22 * sz, '#fff3c4', 0.9 * live); }
        // 3. warm dust motes drifting in the low sunlight over the table (kept off the faces)
        u.motes(c, t, { count: 22, box: [pp(0.06, 0).x, pp(0, 0.55).y, R.w * 0.88, R.h * 0.36], seed: 17, color: '#ffe2b0', size: 2.3 * sz, speed: 0.4, alpha: 0.2 * live, drift: 0.7 });
        // 4. two distant birds in the sky gap left of the colonnade
        if (S.has.birds) P.birds(c, t, { count: 2, seed: 19, box: [pp(0.13, 0).x, pp(0, 0.04).y, R.w * 0.16, R.h * 0.1], scale: 0.6 * sz, color: '#4a3a50', speed: 0.5, alpha: 0.5 * live });
        u.grade(c, '#ffb060', 0.07 * live);
        // dissolve: pull the plate toward the navy before the navy layer comes over it (no muddy midpoint)
        if (kNavy > 0) u.grade(c, '#1b2447', 0.7 * kNavy, 'multiply');
      }
    }

    /* ------------------------------------------------------ math space (15.8–40) */
    if (kNavy <= 0) return;
    c.save(); c.globalAlpha = kNavy; c.drawImage(S.navy, 0, 0); c.restore();
    u.motes(c, t, { count: 24, seed: 29, color: '#9ff5ea', size: 2.2, speed: 0.4, alpha: 0.3 * kNavy, drift: 0.7 });

    /* ---------------------------------------- beat A: cubes a and x (18.0–31.6) */
    const kCube = E.out(u.seg(t, 18.0, 19.4)), kOut = 1 - E.io(u.seg(t, 29.8, 31.6));
    const cubeA = kCube * kOut;
    const kFloor = kCube * (1 - E.io(u.seg(t, 32.4, 33.8)));   // floor light lingers under the typing proportion
    if (kFloor > 0.01) {
      // long lens (dist 16 / fov 2800 ≈ same on-screen scale as dist 10 / fov 1760) so both cubes read as the same solid
      const yaw = 0.52 + 0.1 * E.sine(u.seg(t, 17, 31)), pitch = 0.32;
      const Pj = u.camera({ yaw, pitch, dist: 16, fov: 2800, cx: W * 0.5, cy: 570, target: [0, 0, 0] });
      // both cube centres at camera depth 0 (x·sin(yaw) + z·cos(yaw) = 0) → projected edge ratio is exactly ∛2
      const d = S.sep, cA = [-d * Math.cos(yaw), d * Math.sin(yaw)], cX = [d * Math.cos(yaw), -d * Math.sin(yaw)];
      const oA = [cA[0] - 0.5, -1, cA[1] - 0.5], oX = [cX[0] - S.X.s / 2, -1, cX[1] - S.X.s / 2];

      // floor light under the cubes (breathing), each ellipse squashed about its own floor point
      const brf = 0.8 + 0.2 * Math.sin(t * 0.9);
      const fa = Pj(cA[0], -1, cA[1]), fx = Pj(cX[0], -1, cX[1]);
      c.save(); c.globalAlpha = kFloor * 0.9; c.translate(0, fa.y + 10); c.scale(1, 0.32); c.translate(0, -(fa.y + 10)); S.glow(c, fa.x, fa.y + 10, 400, teal, 0.11 * brf); c.restore();
      c.save(); c.globalAlpha = kFloor * 0.9; c.translate(0, fx.y + 10); c.scale(1, 0.32); c.translate(0, -(fx.y + 10)); S.glow(c, fx.x, fx.y + 10, 520, teal, 0.13 * brf); c.restore();

      if (cubeA > 0.01) {
        // --- water: a³ poured twice from cube a into cube x ---
        let poured = 0, levelA = 1, streamK = 0;
        S.pours.forEach(([p0, p1]) => {
          const k = E.io(u.seg(t, p0, p1)); poured += k;
          if (t >= p0 && t < p1) { levelA = 1 - k; streamK = Math.min(E.out(u.seg(t, p0, p0 + 0.4)), 1 - E.in(u.seg(t, p1 - 0.5, p1))); }
          else if (t >= p1) levelA = 0;
        });
        S.refills.forEach(([r0, r1], i) => { const nxt = S.pours[i + 1] ? S.pours[i + 1][0] : 1e9; if (t >= r0 && t < nxt) levelA = E.out(u.seg(t, r0, r1)); });
        const levelX = poured / (S.X.s * S.X.s);           // height of poured volume in cube x (units of a)
        const kWater = E.out(u.seg(t, 19.3, 19.9)) * cubeA; // water appears shortly after the cubes

        const ripple = 0.006 * Math.sin(t * 5.3) * (streamK > 0 ? 1 : 0.3);
        waterBox(Pj, oA, [S.A.s, Math.max(0, levelA * S.A.s + (levelA > 0.02 ? ripple : 0)), S.A.s], kWater * (levelA > 0.005 ? 1 : 0));
        u.cube(c, Pj, { origin: oA, size: S.A.s, color: teal, edge: '#9ff5ea', faceAlpha: 0.12, w: 3, jitter: 0.8, seed: boil * 7 + 100, alpha: cubeA, hiddenAlpha: 0.25 });
        waterBox(Pj, oX, [S.X.s, Math.min(S.X.s, Math.max(0, levelX * 1 + (levelX > 0.02 ? ripple : 0))), S.X.s], kWater * (levelX > 0.005 ? 1 : 0));
        u.cube(c, Pj, { origin: oX, size: S.X.s, color: teal, edge: '#9ff5ea', faceAlpha: 0.12, w: 3, jitter: 0.8, seed: boil * 11 + 300, alpha: cubeA, hiddenAlpha: 0.25 });

        // pouring stream: from cube a's top rim corner nearest cube x, landing just inside cube x's near top rim
        if (streamK > 0.01) {
          const topA = [[0, 0], [1, 0], [1, 1], [0, 1]].map(([i, j]) => Pj(oA[0] + i, 0, oA[2] + j)); const p0 = topA.reduce((b, p) => p.x > b.x ? p : b);
          const topX = [[0, 0], [1, 0], [1, 1], [0, 1]].map(([i, j]) => Pj(oX[0] + i * S.X.s, -1 + S.X.s, oX[2] + j * S.X.s)); const rim = topX.reduce((b, p) => p.x < b.x ? p : b);
          const ctr = Pj(cX[0], -1 + S.X.s, cX[1]); const p1 = { x: u.lerp(rim.x, ctr.x, 0.3), y: u.lerp(rim.y, ctr.y, 0.3) };
          const cp = { x: (p0.x + p1.x) / 2, y: Math.min(p0.y, p1.y) - 150 };
          const bz = (q, ph) => ({ x: q * q * p0.x + 2 * q * ph * cp.x + ph * ph * p1.x, y: q * q * p0.y + 2 * q * ph * cp.y + ph * ph * p1.y });
          c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = streamK * cubeA;
          // faint continuous stream under the drops
          const arc = []; for (let i = 0; i <= 24; i++) arc.push(bz(1 - i / 24, i / 24));
          u.glowLine(c, arc, { color: '#bff4ff', w: 3, halo: 20, alpha: 0.12, seed: boil + 400, jitter: 0.6 });
          const n = 22, rr = u.rng(71);
          for (let i = 0; i < n; i++) {
            const off = rr(), sp = 0.75 + rr() * 0.5, sz = 0.9 + rr() * 0.9, wob = (rr() - 0.5) * 2;
            const ph = ((t * 0.8 * sp + off) % 1); const q = 1 - ph;
            const tx = 2 * q * (cp.x - p0.x) + 2 * ph * (p1.x - cp.x), ty = 2 * q * (cp.y - p0.y) + 2 * ph * (p1.y - cp.y); const L = Math.hypot(tx, ty) || 1;
            const side = Math.sin(ph * 9 + i) * 7 * wob;                       // drops stray a little off the arc
            const b = bz(q, ph); const x = b.x - ty / L * side, y = b.y + tx / L * side;
            const a = Math.sin(ph * Math.PI) * (0.6 + 0.4 * Math.sin(t * 6 + i * 2));
            // teardrop stretched along the motion
            u.ink(c, [{ x: x - tx / L * 14 * sz, y: y - ty / L * 14 * sz }, { x, y }], { w: 7 * sz, color: '#bff4ff', alpha: 0.7 * a, jitter: 0.3, seed: boil + i, taper: 0.7, step: 3 });
            u.dab(c, x, y, 9 * sz, '#bff4ff', 0.5 * a, 0.25); u.dab(c, x, y, 3 * sz, '#ffffff', 0.9 * a, 0.5);
          }
          S.glow(c, p1.x, p1.y, 70, '#bff4ff', 0.35 * streamK); S.glow(c, p0.x, p0.y, 50, '#bff4ff', 0.25 * streamK);
          c.restore();
        }

        // --- labels (all kept above y ≈ 860) ---
        const ea = bottomEdge(Pj, oA, S.A.s), ex = bottomEdge(Pj, oX, S.X.s);
        const lab = (str, x, y, a, o = {}) => { if (a > 0.01) u.math(c, str, x, y, Object.assign({ size: 54, color: gold, alpha: a * cubeA, glow: 18 }, o)); };
        // volume marks on cube x at the water line: = a³ after pour 1, 2a³ after pour 2
        const L1 = 1 / (S.X.s * S.X.s), kL1 = Math.min(E.out(u.seg(t, 22.3, 22.9)), 1 - E.io(u.seg(t, 25.4, 25.9)));
        const kL2 = E.out(u.seg(t, 25.9, 26.5)), pulse = 1 + 0.08 * Math.sin((t - 25.9) * 5) * (1 - u.seg(t, 25.9, 27.9));
        lab('a', ea.mx, ea.my + 36, E.out(u.seg(t, 18.5, 19.2)));
        lab('a³', ea.mx, ea.my + 90, E.out(u.seg(t, 19.0, 19.7)) * (1 - kL1), { size: 50, color: ivory, glow: 12 });
        lab('x', ex.mx, ex.my + 36, E.out(u.seg(t, 18.9, 19.6)));
        // "?" beside x until the length is named (24.4) — the length that is hard to construct
        const kQ = Math.min(E.out(u.seg(t, 19.5, 20.1)), 1 - E.io(u.seg(t, 24.2, 24.9))); const qb = 0.7 + 0.3 * (0.5 + 0.5 * Math.sin(t * 2.2));
        lab('= ?', ex.mx + 40, ex.my + 36, kQ * qb, { align: 'left', color: '#ffe9a8' });
        const waterLab = (str, level, a, o = {}) => {
          if (a <= 0.01) return;
          const p = Pj(oX[0] + S.X.s, oX[1] + level, oX[2] + S.X.s), q = Pj(oX[0] + S.X.s, oX[1] + level, oX[2]); const r = p.x > q.x ? p : q;
          u.ink(c, [{ x: r.x + 4, y: r.y }, { x: r.x + 24, y: r.y }], { w: 2.6, color: o.color || ivory, alpha: a * cubeA * 0.9, jitter: 0.5, seed: boil * 3 + 50, taper: 0.2 }); // level tick
          lab(str, r.x + 32, r.y, a, Object.assign({ align: 'left' }, o));
        };
        waterLab('a³', L1, kL1, { color: '#bff4ff', glow: 16, size: 50 });
        waterLab('2a³', S.X.s, kL2, { color: '#ffe9a8', glow: 26, size: 58 * pulse });
        // refill flash on cube a (each time it is filled again)
        S.refills.forEach(([r0, r1]) => { const kf = 1 - u.seg(t, r0, r1 + 0.4); if (t >= r0 && kf > 0) { const q = Pj(cA[0], -0.5, cA[1]); S.glow(c, q.x, q.y, 170, '#dffffb', 0.45 * kf * kf * cubeA); } });

        // --- compass sketch tied to cube a's floor edge (18.9–21.6), then erased: the length resists construction ---
        {
          const kc1 = E.out(u.seg(tq, 18.9, 19.7)), kc2 = E.out(u.seg(tq, 19.9, 20.7)), ke = 1 - E.io(u.seg(t, 21.0, 21.6));
          const ac = (kc1 > 0 ? 1 : 0) * ke * cubeA * 0.75;
          if (ac > 0.01) {
            // pivot = cube a's floor corner nearer cube x; the sketch lives in the gap between the cubes, on the floor line
            const piv = ea.a.x > ea.b.x ? ea.a : ea.b, far = piv === ea.a ? ea.b : ea.a, tgt = ex.a.x < ex.b.x ? ex.a : ex.b;
            const r = Math.hypot(far.x - piv.x, far.y - piv.y), ab = Math.atan2(tgt.y - piv.y, tgt.x - piv.x);
            const kb0 = E.out(u.seg(tq, 18.9, 19.4));
            // floor baseline from cube a toward cube x
            u.sketch(c, [{ x: piv.x, y: piv.y }, { x: u.lerp(piv.x, tgt.x, 0.8 * kb0), y: u.lerp(piv.y, tgt.y, 0.8 * kb0) }], { passes: 2, w: 2, jitter: 1.6, seed: boil * 3 + 962, alpha: ac * 0.7, color: ivory });
            u.dab(c, piv.x, piv.y, 5, ivory, ac * 0.9, 0.5);
            // arc 1: the compass carries length a (cube a's edge) from upright down onto the baseline → a tick
            const s1 = ab - 1.35, e1 = s1 + 1.35 * kc1;
            u.sketch(c, u.ellipsePts(piv.x, piv.y, r, r, 24, 0, s1, e1), { passes: 2, w: 2.2, jitter: 2, seed: boil * 3 + 901, alpha: ac, color: ivory });
            u.sketch(c, [{ x: piv.x, y: piv.y }, { x: piv.x + r * Math.cos(e1), y: piv.y + r * Math.sin(e1) }], { passes: 1, w: 1.6, jitter: 1.5, seed: boil * 3 + 941, alpha: ac * 0.6, color: ivory });
            if (kc1 >= 1) { const px = piv.x + r * Math.cos(ab), py = piv.y + r * Math.sin(ab); u.ink(c, [{ x: px, y: py - 14 }, { x: px, y: py + 14 }], { w: 2.6, color: ivory, alpha: ac, jitter: 0.5, seed: boil * 3 + 951, taper: 0.2 }); }
            // arc 2: a guessed longer length (1.26 r) swung the same way — nothing fixes where it should land: "?"
            if (kc2 > 0) {
              const r2 = r * 1.26, e2 = s1 + 1.35 * kc2;
              u.sketch(c, u.ellipsePts(piv.x, piv.y, r2, r2, 24, 0, s1, e2), { passes: 2, w: 2.2, jitter: 2.2, seed: boil * 3 + 902, alpha: ac, color: ivory });
              u.sketch(c, [{ x: piv.x, y: piv.y }, { x: piv.x + r2 * Math.cos(e2), y: piv.y + r2 * Math.sin(e2) }], { passes: 1, w: 1.6, jitter: 1.5, seed: boil * 3 + 942, alpha: ac * 0.6, color: ivory });
              if (kc2 >= 1) u.math(c, '?', piv.x + r2 * Math.cos(ab) + 8, piv.y + r2 * Math.sin(ab) - 30, { size: 40, color: ivory, alpha: ac, glow: 8 });
            }
          }
        }

        // --- formulas (typed at 12 fps, left-aligned from the centred origin) ---
        const typed = (key, y, p, size, color, glowK) => {
          if (p <= 0) return; const str = S.F[key], s = u.typed(str, p), x0 = W / 2 - S.w[key] / 2;
          u.math(c, s, x0, y, { size, color, align: 'left', alpha: cubeA, glow: glowK });
          if (p < 1) S.glow(c, x0 + S.cw[key][s.length] + 6, y, 26, '#fff6d0', 0.5 * cubeA);
          return { x0, n: s.length };
        };
        typed('f1', 112, E.sine(u.seg(tq, 19.2, 21.4)), 66, gold, 22);
        const f2 = typed('f2', 196, E.sine(u.seg(tq, 22.0, 24.0)), 60, gold, 18);
        if (f2 && f2.n >= 6) vinc(f2.x0 + S.cw.f2[5] - 3, f2.x0 + S.cw.f2[6] + 2, 196, 60, gold, cubeA);
        const k3 = E.out(u.seg(t, 24.4, 25.1)); if (k3 > 0.01) u.math(c, S.F.f3, W / 2, 270, { size: 50, color: ivory, alpha: k3 * cubeA, glow: 12 });
      }

      /* helpers for this beat */
      function waterBox(Pj, o, d, a) {
        if (a <= 0.01 || d[1] <= 0.002) return;
        const [x, y, z] = o, [w, h, dp] = d;
        const V = [[x, y, z], [x + w, y, z], [x + w, y + h, z], [x, y + h, z], [x, y, z + dp], [x + w, y, z + dp], [x + w, y + h, z + dp], [x, y + h, z + dp]].map(v => Pj(v[0], v[1], v[2]));
        const F = [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [3, 2, 6, 7], [0, 3, 7, 4], [1, 2, 6, 5]];
        const faces = F.map((f, i) => { const pts = f.map(k => V[k]); return { pts, i, depth: pts.reduce((s, p) => s + p.z, 0) / 4 }; }).sort((p, q) => q.depth - p.depth);
        c.save();
        faces.forEach((f, k) => {
          const front = k >= 3; const top = f.i === 3;
          if (top) { // boiling water surface, lighter
            u.shape(c, f.pts, { fill: '#a9ecff', jitter: 1.6, seed: boil * 3 + 77, alpha: a * (front ? 0.5 : 0.25) });
            if (front) u.ink(c, [...f.pts, f.pts[0]], { w: 2, color: '#dffaff', jitter: 1.2, seed: boil * 5 + 78, alpha: a * 0.6, taper: 0, closed: true });
          } else { c.globalAlpha = a * (front ? 0.34 : 0.16); c.fillStyle = '#3fb8e6'; u.polyPath(c, f.pts, true); c.fill(); }
        });
        c.restore();
      }
      function bottomEdge(Pj, o, s) {
        const cs = [[o[0], o[1], o[2]], [o[0] + s, o[1], o[2]], [o[0] + s, o[1], o[2] + s], [o[0], o[1], o[2] + s]].map(v => Pj(v[0], v[1], v[2]));
        let k = 0; cs.forEach((p, i) => { if (p.y > cs[k].y) k = i; });
        const a = cs[k], n1 = cs[(k + 1) % 4], n2 = cs[(k + 3) % 4];
        const b = Math.hypot(n1.x - a.x, n1.y - a.y) > Math.hypot(n2.x - a.x, n2.y - a.y) ? n1 : n2;
        return { a, b, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
      }
    }

    /* -------------------------------- beat B: Hippocrates' proportion (31.3–40) */
    if (t >= 31.0) {
      const kPropOut = 1 - E.io(u.seg(t, 37.0, 37.8));
      // proportion typed at centre
      const pP = E.sine(u.seg(tq, 31.3, 34.3));
      if (pP > 0 && kPropOut > 0.01) {
        const s = u.typed(S.F.prop, pP); const x0 = W / 2 - S.w.prop / 2;
        u.math(c, s, x0, 250, { size: 76, color: gold, align: 'left', alpha: kPropOut, glow: 26 });
        if (pP < 1) S.glow(c, x0 + S.cw.prop[s.length] + 8, 250, 30, '#fff6d0', 0.5);
      }
      // four glowing segments a, x, y, 2a (grow out of the typing, one per 0.6 s)
      const xs = W / 2 - 400, rows = [430, 535, 640, 745];
      S.segs.forEach((sg, i) => {
        const kd = E.out(u.seg(t, sg.t0, sg.t0 + 0.6)); if (kd <= 0.001) return;
        const len = sg.len * S.unit * kd;
        // flow out (37.4–): one after another the segments stream off to the right while the frame is still bright
        const kFlow = E.io(u.seg(t, 37.4 + i * 0.18, 38.9 + i * 0.18));
        const y = rows[i] - 70 * kFlow, dx = kFlow * 2100, a = 1 - 0.3 * kFlow;
        const pulse = 0.85 + 0.15 * Math.sin(t * 2.4 - i * 0.9); const col = i % 2 ? gold : teal;
        if (kFlow > 0.01) { // comet tail behind the moving segment
          c.save(); c.globalCompositeOperation = 'lighter';
          u.ink(c, [{ x: xs + dx - 460 * kFlow, y: y + 2 }, { x: xs + dx + 10, y }], { w: 28, color: u.alpha(col, 0.3 * kFlow), jitter: 1.5, seed: boil * 3 + i, taper: 0.9, step: 8 });
          c.restore();
        }
        u.glowLine(c, [{ x: xs + dx, y }, { x: xs + dx + len, y }], { color: col, w: 6, halo: 30, alpha: a * pulse, seed: boil * 3 + i * 17, jitter: 0.5 });
        // end ticks
        [xs + dx, xs + dx + len].forEach((tx, k) => u.ink(c, [{ x: tx, y: y - 16 }, { x: tx, y: y + 16 }], { w: 3.2, color: i % 2 ? '#ffe9a8' : '#c8fff8', alpha: a * (k ? kd : 1), jitter: 0.5, seed: boil * 5 + i * 7 + k, taper: 0.3 }));
        const kl = Math.min(1, kd * 1.6);
        if (kl > 0.01) u.math(c, sg.lab, xs + dx - 46, y, { size: 52, color: i % 2 ? gold : '#c8fff8', align: 'right', alpha: kl * a, glow: 16 });
      });
      // braces between consecutive rows at one fixed x: each length is the previous × ∛2
      const kR = E.out(u.seg(t, 35.2, 35.9)) * (1 - E.io(u.seg(t, 36.9, 37.4)));
      if (kR > 0.01) {
        const bx = xs + 2 * S.unit + 70;
        for (let i = 0; i < 3; i++) {
          const y0 = rows[i] + 12, y1 = rows[i + 1] - 12, ym = (y0 + y1) / 2;
          const up = u.curve([{ x: bx, y: y0 }, { x: bx + 14, y: y0 + 12 }, { x: bx + 14, y: ym - 14 }, { x: bx + 28, y: ym }], 6);
          const dn = u.curve([{ x: bx + 28, y: ym }, { x: bx + 14, y: ym + 14 }, { x: bx + 14, y: y1 - 12 }, { x: bx, y: y1 }], 6);
          u.ink(c, up, { w: 2.6, color: ivory, alpha: 0.75 * kR, jitter: 0.7, seed: boil * 7 + i * 3, taper: 0.25 });
          u.ink(c, dn, { w: 2.6, color: ivory, alpha: 0.75 * kR, jitter: 0.7, seed: boil * 7 + i * 3 + 1, taper: 0.25 });
          const tx = bx + 44; u.math(c, S.F.ratio, tx, ym, { size: 46, color: ivory, align: 'left', alpha: 0.9 * kR, glow: 12 });
          vinc(tx + S.cw.ratio[3] - 2, tx + S.cw.ratio[4] + 2, ym, 46, ivory, 0.9 * kR);
        }
      }
    }
  },
});
