/* ============================================================================
   S03 — 수학자들이 마주한 난제  (global 80–120 s, local 0–40)
   Hybrid: C01 plate (stoa at sunset, three mathematicians around a sand tray)
   → navy math space (cube a vs cube x, x³ = 2a³, "water" pours showing the
   volume is exactly 2a³) → Hippocrates' proportion a : x = x : y = y : 2a
   turning into four glowing segments that flow out toward the next scene.

   Timing map (scene-local seconds; subtitles from script.js in brackets):
     0.0–18.0  C01 plate, one slow push-in toward the sand tray (zoom 1.00→1.10)
               living: breathing sunset glow, oil-lamp flicker + warm pool,
               dust motes in the low light, two distant birds   [2–6.8, 8–15.5]
    15.8–18.0    dissolve to the navy math space
    17.5–19.2  cubes a (left) and x (right, edge ∛2·a) fade in; labels a, a³, x
    19.2–21.4  x³ = 2a³ typed (top)                                 [18–25]
    22.0–24.0  x = ∛2 × a typed;  24.4  x ≈ 1.26a
    22.5–25.0  pour 1: cube a drains into cube x → water level a³/x² ("a³")
    25.2–25.8  cube a refills;  26.0–28.5  pour 2 → cube x exactly full ("2a³")
    29.8–31.6  cubes + formulas fade out                            [26–30.5]
    31.3–34.3  proportion  a : x = x : y = y : 2a  typed             [31.5–39.3]
    34.0–36.7  four glowing segments a, x, y, 2a draw on, one per 0.7 s
    36.9–      "× ∛2" ratio marks between the rows
    38.0–40.0  segments converge and flow off to the right (engine fade-out 0.9)
   ========================================================================== */
ANIM.scene({
  id: 's03', title: '수학자들이 마주한 난제',
  start: ANIM.TIMES.s03[0], end: ANIM.TIMES.s03[1],
  mood: 'math',
  fadeIn: 0.9, fadeOut: 0.9,

  init(api, S) {
    const { u, W, H } = api, P = ANIM.paint;
    // navy math space: painted sky + nebula + stars + paper, built once
    S.navy = u.layer(W, H, c => {
      P.sky(c, { preset: 'navyMath', seed: 33, horizon: H * 1.05, clouds: false });
      P.nebula(c, { seed: 37, alpha: 0.75, count: 10, colors: ['#1f3f6e', '#2a2a66', '#1c4d58', '#3a2f66'] });
      P.stars(c, { seed: 43, count: 140, yMax: H, alpha: 0.55 });
      u.paper(c, 0.14);
    });
    // availability of paint helpers (local fallbacks below; paint.js is never edited)
    S.has = { lamp: !!(P && P.lampFlicker), flame: !!(P && P.flame), birds: !!(P && P.birds), particles: !!(P && P.particles) };
    // cached radial-glow sprites (same stops as u.glow) — big gradient fills are the costliest thing in software raster
    S.spr = {};
    S.glow = (c, x, y, r, color, alpha = 0.6) => {
      let s = S.spr[color];
      if (!s) s = S.spr[color] = u.layer(256, 256, cc => { const g = cc.createRadialGradient(128, 128, 0, 128, 128, 128); g.addColorStop(0, color); g.addColorStop(0.35, u.alpha(color, 0.5)); g.addColorStop(1, u.alpha(color, 0)); cc.fillStyle = g; cc.fillRect(0, 0, 256, 256); });
      c.save(); c.globalAlpha *= alpha; c.drawImage(s, x - r, y - r, r * 2, r * 2); c.restore();
    };
    // 3D layout (y up, floor at y = -1). cube a: edge 1, cube x: edge ∛2 ≈ 1.26
    S.cbrt2 = Math.cbrt(2);
    S.A = { o: [-3.05, -1, -0.5], s: 1 };                              // centre x = -2.55
    S.X = { o: [1.45 - S.cbrt2 / 2, -1, -S.cbrt2 / 2], s: S.cbrt2 };   // centre x =  1.45
    // pour windows (cube a → cube x), each carrying exactly a³
    S.pours = [[22.5, 25.0], [26.0, 28.5]];
    S.refill = [25.2, 25.8];
    // formula strings + measured widths (typed left-aligned from a centred origin)
    S.F = { f1: 'x³ = 2a³', f2: 'x = ∛2 × a', f3: 'x ≈ 1.26a', prop: 'a : x = x : y = y : 2a' };
    const m = u.layer(8, 8).getContext('2d');
    S.w = { f1: u.math(m, S.F.f1, 0, 0, { size: 66 }), f2: u.math(m, S.F.f2, 0, 0, { size: 60 }), prop: u.math(m, S.F.prop, 0, 0, { size: 76 }) };
    // Hippocrates segments: a, x = ∛2·a, y = ∛4·a, 2a  (unit = 300 px)
    S.unit = 360;
    S.segs = [
      { lab: 'a', len: 1, t0: 34.0 },
      { lab: 'x', len: S.cbrt2, t0: 34.7 },
      { lab: 'y', len: S.cbrt2 * S.cbrt2, t0: 35.4 },
      { lab: '2a', len: 2, t0: 36.1 },
    ];
  },

  draw(api, t, S) {
    const { ctx: c, u, W, H } = api, P = ANIM.paint, E = u.ease;
    const boil = api.boil, tq = api.tq;
    const breathe = (speed, seed) => 0.85 + 0.15 * u.noise2(t * speed + seed * 5.3, seed);

    /* ------------------------------------------------------------ plate (0–18) */
    const kNavy = E.io(u.seg(t, 15.8, 18.0));
    if (t < 18.0) {
      const kb = u.kb(t, 0, 16, { zoom: 1.0, fx: 0.5, fy: 0.5 }, { zoom: 1.10, fx: 0.47, fy: 0.6 });
      const R = u.plate(c, 'C01', kb);
      if (R) {
        const pp = (px, py) => u.platePt(R, px, py); const sz = R.w / W;
        // 1. sunset: breathing glow at the painted sun, warm bloom along the horizon
        const sun = pp(0.625, 0.215); const br = breathe(0.45, 3);
        S.glow(c, sun.x, sun.y, 0.34 * R.h * br, '#ffc46a', 0.2 * br);
        S.glow(c, sun.x, sun.y, 0.1 * R.h, '#fff0c0', 0.32 * br);
        // 2. oil lamp (bottom right): boiling flame + flickering warm pool
        const lamp = pp(0.757, 0.885);
        if (S.has.lamp) P.lampFlicker(c, t, { x: lamp.x, y: lamp.y, scale: 0.6 * sz, seed: 5, pool: 300, alpha: 0.95 });
        else { u.lamp(c, lamp.x, lamp.y - 10 * sz, 180 * sz, t, { alpha: 0.3, seed: 5 }); S.glow(c, lamp.x, lamp.y - 8 * sz, 22 * sz, '#fff3c4', 0.9); }
        // 3. dust motes drifting in the low sunlight over the table
        u.motes(c, t, { count: 28, box: [pp(0.08, 0).x, pp(0, 0.28).y, R.w * 0.84, R.h * 0.58], seed: 17, color: '#ffe2b0', size: 2.3 * sz, speed: 0.4, alpha: 0.26, drift: 0.7 });
        // 4. two distant birds in the sky gap left of the colonnade
        if (S.has.birds) P.birds(c, t, { count: 2, seed: 19, box: [pp(0.13, 0).x, pp(0, 0.04).y, R.w * 0.16, R.h * 0.1], scale: 0.6 * sz, color: '#4a3a50', speed: 0.5, alpha: 0.5 });
        u.grade(c, '#ffb060', 0.07);
      }
    }

    /* ------------------------------------------------------ math space (15.8–40) */
    if (kNavy <= 0) return;
    c.save(); c.globalAlpha = kNavy; c.drawImage(S.navy, 0, 0); c.restore();

    const gold = '#f3d27a', ivory = '#f6f1e6', teal = '#58e0d0';
    u.motes(c, t, { count: 24, seed: 29, color: '#9ff5ea', size: 2.2, speed: 0.4, alpha: 0.3 * kNavy, drift: 0.7 });

    /* ---------------------------------------- beat A: cubes a and x (17.5–31.6) */
    const kCube = E.out(u.seg(t, 17.5, 19.2)), kOut = 1 - E.io(u.seg(t, 29.8, 31.6));
    const cubeA = kCube * kOut;
    if (cubeA > 0.01) {
      const yaw = 0.52 + 0.1 * E.sine(u.seg(t, 17, 31)), pitch = 0.32;
      const Pj = u.camera({ yaw, pitch, dist: 10, fov: 1760, cx: W * 0.5, cy: 628, target: [0, 0, 0] });
      const cA = [S.A.o[0] + 0.5, S.A.o[2] + 0.5], cX = [S.X.o[0] + S.X.s / 2, S.X.o[2] + S.X.s / 2];

      // floor light under the cubes (breathing)
      const brf = 0.8 + 0.2 * Math.sin(t * 0.9);
      const fa = Pj(cA[0], -1, cA[1]), fx = Pj(cX[0], -1, cX[1]);
      c.save(); c.globalAlpha = cubeA * 0.9; c.translate(0, fa.y + 10); c.scale(1, 0.32); c.translate(0, -(fa.y + 10));
      S.glow(c, fa.x, fa.y + 10, 400, teal, 0.11 * brf); S.glow(c, fx.x, fx.y + 10, 520, teal, 0.13 * brf);
      c.restore();

      // --- water: a³ poured twice from cube a into cube x ---
      let poured = 0, levelA = 1, streamK = 0;
      S.pours.forEach(([p0, p1], i) => {
        const k = E.io(u.seg(t, p0, p1)); poured += k;
        if (t >= p0 && t < p1) { levelA = 1 - k; streamK = Math.min(E.out(u.seg(t, p0, p0 + 0.4)), 1 - E.in(u.seg(t, p1 - 0.5, p1))); }
        else if (t >= p1) levelA = 0;
      });
      if (t >= S.refill[0] && t < S.pours[1][0]) levelA = E.out(u.seg(t, S.refill[0], S.refill[1]));
      const levelX = poured / (S.X.s * S.X.s);           // height of poured volume in cube x (units of a)
      const kWater = E.out(u.seg(t, 19.5, 20.5)) * cubeA; // water appears shortly after the cubes

      // draw order: back cube first (both cubes are side by side; x is nearer the camera on the right)
      const ripple = 0.006 * Math.sin(t * 5.3) * (streamK > 0 ? 1 : 0.3);
      waterBox(Pj, S.A.o, [S.A.s, Math.max(0, levelA * S.A.s + (levelA > 0.02 ? ripple : 0)), S.A.s], kWater * (levelA > 0.005 ? 1 : 0));
      u.cube(c, Pj, { origin: S.A.o, size: S.A.s, color: teal, edge: '#9ff5ea', faceAlpha: 0.12, w: 3, jitter: 0.8, seed: boil * 7 + 100, alpha: cubeA, hiddenAlpha: 0.25 });
      waterBox(Pj, S.X.o, [S.X.s, Math.min(S.X.s, Math.max(0, levelX * 1 + (levelX > 0.02 ? ripple : 0))), S.X.s], kWater * (levelX > 0.005 ? 1 : 0));
      u.cube(c, Pj, { origin: S.X.o, size: S.X.s, color: teal, edge: '#9ff5ea', faceAlpha: 0.12, w: 3, jitter: 0.8, seed: boil * 11 + 300, alpha: cubeA, hiddenAlpha: 0.25 });

      // pouring stream: glowing drops along an arc from the top of cube a to the top of cube x
      if (streamK > 0.01) {
        const p0 = Pj(cA[0], 0.02, cA[1]), p1 = Pj(cX[0], -1 + S.X.s + 0.04, cX[1]);
        const cp = { x: (p0.x + p1.x) / 2, y: Math.min(p0.y, p1.y) - 170 };
        c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = streamK * cubeA;
        const n = 14, rr = u.rng(71);
        for (let i = 0; i < n; i++) {
          const off = rr(), sp = 0.75 + rr() * 0.5, sz = 0.9 + rr() * 0.9, wob = (rr() - 0.5) * 2;
          const ph = ((t * 0.55 * sp + off) % 1); const q = 1 - ph;
          const tx = 2 * q * (cp.x - p0.x) + 2 * ph * (p1.x - cp.x), ty = 2 * q * (cp.y - p0.y) + 2 * ph * (p1.y - cp.y); const L = Math.hypot(tx, ty) || 1;
          const side = Math.sin(ph * 9 + i) * 9 * wob;                       // drops stray a little off the arc
          const x = q * q * p0.x + 2 * q * ph * cp.x + ph * ph * p1.x - ty / L * side, y = q * q * p0.y + 2 * q * ph * cp.y + ph * ph * p1.y + tx / L * side;
          const a = Math.sin(ph * Math.PI) * (0.6 + 0.4 * Math.sin(t * 6 + i * 2));
          // teardrop stretched along the motion
          u.ink(c, [{ x: x - tx / L * 14 * sz, y: y - ty / L * 14 * sz }, { x, y }], { w: 7 * sz, color: '#bff4ff', alpha: 0.7 * a, jitter: 0.3, seed: boil + i, taper: 0.7, step: 3 });
          u.dab(c, x, y, 9 * sz, '#bff4ff', 0.5 * a, 0.25); u.dab(c, x, y, 3 * sz, '#ffffff', 0.9 * a, 0.5);
        }
        S.glow(c, p1.x, p1.y, 70, '#bff4ff', 0.35 * streamK); S.glow(c, p0.x, p0.y, 50, '#bff4ff', 0.25 * streamK);
        c.restore();
      }

      // --- labels ---
      const ea = bottomEdge(Pj, S.A.o, S.A.s), ex = bottomEdge(Pj, S.X.o, S.X.s);
      const lab = (str, x, y, a, o = {}) => { if (a > 0.01) u.math(c, str, x, y, Object.assign({ size: 54, color: gold, alpha: a * cubeA, glow: 18 }, o)); };
      lab('a', ea.mx, ea.my + 44, E.out(u.seg(t, 18.3, 19.0)));
      lab('a³', ea.mx, ea.my + 102, E.out(u.seg(t, 18.9, 19.6)), { size: 50, color: ivory, glow: 12 });
      lab('x', ex.mx, ex.my + 44, E.out(u.seg(t, 18.8, 19.5)));
      // "?" beside x until the length is named (24.4) — the length that is hard to construct
      const kQ = Math.min(E.out(u.seg(t, 19.4, 20.0)), 1 - E.io(u.seg(t, 24.2, 24.9))); const qb = 0.7 + 0.3 * (0.5 + 0.5 * Math.sin(t * 2.2));
      lab('= ?', ex.mx + 62, ex.my + 44, kQ * qb, { align: 'left', color: '#ffe9a8' });
      // volume marks on cube x at the water line: a³ after pour 1, 2a³ after pour 2
      const waterLab = (str, level, a, o = {}) => { if (a <= 0.01) return; const p = Pj(S.X.o[0] + S.X.s, S.X.o[1] + level, S.X.o[2] + S.X.s); const q = Pj(S.X.o[0] + S.X.s, S.X.o[1] + level, S.X.o[2]); const r = p.x > q.x ? p : q; lab(str, r.x + 30, r.y, a, Object.assign({ align: 'left' }, o)); };
      const L1 = 1 / (S.X.s * S.X.s), kL1 = Math.min(E.out(u.seg(t, 24.8, 25.4)), 1 - E.io(u.seg(t, 28.3, 28.8)));
      waterLab('a³', L1, kL1, { color: '#bff4ff', glow: 16, size: 50 });
      const kL2 = E.out(u.seg(t, 28.5, 29.1)), pulse = 1 + 0.08 * Math.sin((t - 28.5) * 5) * (1 - u.seg(t, 28.5, 30.5));
      waterLab('2a³', S.X.s, kL2, { color: '#ffe9a8', glow: 26, size: 58 * pulse });
      // refill flash on cube a (second a³)
      const kf = 1 - u.seg(t, S.refill[0], S.refill[1] + 0.4); if (t >= S.refill[0] && kf > 0) { const q = Pj(cA[0], -0.5, cA[1]); S.glow(c, q.x, q.y, 170, '#dffffb', 0.45 * kf * kf * cubeA); }

      // --- ruler-and-compass attempts that get erased (19.6–24.2): the length resists construction ---
      [[19.6, 1], [21.9, 2]].forEach(([t0, k]) => {
        const kd = E.out(u.seg(tq, t0, t0 + 0.9)), ke = 1 - E.io(u.seg(t, t0 + 1.6, t0 + 2.2)); const a = Math.min(kd > 0 ? 1 : 0, ke) * cubeA * 0.55;
        if (a <= 0.01 || kd <= 0) return;
        const cx0 = 330 + k * 40, cy0 = 300, r = 118 - k * 12, a0 = -2.6 + k * 0.4, a1 = a0 + 2.4 * kd;
        u.sketch(c, u.ellipsePts(cx0, cy0, r, r, 28, 0, a0, a1), { passes: 2, w: 2.2, jitter: 2.2, seed: boil * 3 + 900 + k, alpha: a, color: ivory });
        const kl = E.out(u.seg(tq, t0 + 0.45, t0 + 0.9)); if (kl > 0) u.sketch(c, [{ x: cx0 - r * 1.1, y: cy0 + 44 }, { x: cx0 - r * 1.1 + (r * 2.3) * kl, y: cy0 + 40 - k * 6 }], { passes: 2, w: 2.2, jitter: 2, seed: boil * 3 + 920 + k, alpha: a, color: ivory });
        // compass pivot (pencil dot) and a faint radius line to the arc
        u.dab(c, cx0, cy0, 5, ivory, a * 0.9, 0.5);
        u.sketch(c, [{ x: cx0, y: cy0 }, { x: cx0 + r * Math.cos(a1), y: cy0 + r * Math.sin(a1) }], { passes: 1, w: 1.6, jitter: 1.5, seed: boil * 3 + 940 + k, alpha: a * 0.6, color: ivory });
      });

      // --- formulas (typed at 12 fps, left-aligned from the centred origin) ---
      const typed = (str, w, y, p, size, color, glowK, a) => { if (p <= 0 || a <= 0.01) return; const s = u.typed(str, p); u.math(c, s, W / 2 - w / 2, y, { size, color, align: 'left', alpha: a * cubeA, glow: glowK }); if (p < 1) { const cw = u.math(c, s, -9999, -9999, { size, alpha: 0 }); S.glow(c, W / 2 - w / 2 + cw + 6, y, 26, '#fff6d0', 0.5 * a * cubeA); } };
      typed(S.F.f1, S.w.f1, 112, E.sine(u.seg(tq, 19.2, 21.4)), 66, gold, 22, 1);
      typed(S.F.f2, S.w.f2, 196, E.sine(u.seg(tq, 22.0, 24.0)), 60, gold, 18, 1);
      const k3 = E.out(u.seg(t, 24.4, 25.1)); if (k3 > 0.01) u.math(c, S.F.f3, W / 2, 270, { size: 50, color: ivory, alpha: k3 * cubeA, glow: 12 });

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
      const kPropOut = 1 - E.io(u.seg(t, 37.8, 38.9));
      // proportion typed at centre
      const pP = E.sine(u.seg(tq, 31.3, 34.3));
      if (pP > 0 && kPropOut > 0.01) {
        const s = u.typed(S.F.prop, pP); const x0 = W / 2 - S.w.prop / 2;
        u.math(c, s, x0, 250, { size: 76, color: gold, align: 'left', alpha: kPropOut, glow: 26 });
        if (pP < 1) { const cw = u.math(c, s, -9999, -9999, { size: 76, alpha: 0 }); S.glow(c, x0 + cw + 8, 250, 30, '#fff6d0', 0.5); }
      }
      // four glowing segments a, x, y, 2a
      const xs = W / 2 - 400, rows = [430, 535, 640, 745];
      let flowAny = 0;
      S.segs.forEach((sg, i) => {
        const kd = E.out(u.seg(t, sg.t0, sg.t0 + 0.6)); if (kd <= 0.001) return;
        const len = sg.len * S.unit * kd;
        // flow out (38.0–): one after another the segments stream off to the right, carrying their labels
        const kFlow = E.in(u.seg(t, 38.0 + i * 0.22, 39.9 + i * 0.22)); flowAny = Math.max(flowAny, kFlow);
        const y = rows[i] - 70 * kFlow, dx = kFlow * 1900, a = 1 - 0.3 * kFlow;
        const pulse = 0.85 + 0.15 * Math.sin(t * 2.4 - i * 0.9); const col = i % 2 ? gold : teal;
        if (kFlow > 0.01) { // comet tail behind the moving segment
          c.save(); c.globalCompositeOperation = 'lighter';
          u.ink(c, [{ x: xs + dx - 420 * kFlow, y: y + 2 }, { x: xs + dx + 10, y }], { w: 22, color: u.alpha(col, 0.22 * kFlow), jitter: 1.5, seed: boil * 3 + i, taper: 0.9, step: 8 });
          c.restore();
        }
        u.glowLine(c, [{ x: xs + dx, y }, { x: xs + dx + len, y }], { color: col, w: 6, halo: 30, alpha: a * pulse, seed: boil * 3 + i * 17, jitter: 0.5 });
        // end ticks
        [xs + dx, xs + dx + len].forEach((tx, k) => u.ink(c, [{ x: tx, y: y - 16 }, { x: tx, y: y + 16 }], { w: 3.2, color: i % 2 ? '#ffe9a8' : '#c8fff8', alpha: a * (k ? kd : 1), jitter: 0.5, seed: boil * 5 + i * 7 + k, taper: 0.3 }));
        const kl = Math.min(1, kd * 1.6);
        if (kl > 0.01) u.math(c, sg.lab, xs + dx - 46, y, { size: 52, color: i % 2 ? gold : '#c8fff8', align: 'right', alpha: kl * a, glow: 16 });
      });
      // ratio marks between consecutive rows: each length is the previous × ∛2
      const kR = E.out(u.seg(t, 36.9, 37.6)) * (1 - E.io(u.seg(t, 37.9, 38.4)));
      if (kR > 0.01) for (let i = 0; i < 3; i++) {
        const x = xs + Math.max(S.segs[i].len, S.segs[i + 1].len) * S.unit + 70, y = (rows[i] + rows[i + 1]) / 2;
        u.ink(c, u.curve([{ x: x - 30, y: y - 34 }, { x: x - 14, y }, { x: x - 30, y: y + 34 }], 6), { w: 2.4, color: ivory, alpha: 0.55 * kR, jitter: 0.8, seed: boil * 7 + i * 3, taper: 0.3 });
        u.math(c, '× ∛2', x, y, { size: 40, color: ivory, align: 'left', alpha: 0.85 * kR, glow: 10 });
      }
    }
  },
});
