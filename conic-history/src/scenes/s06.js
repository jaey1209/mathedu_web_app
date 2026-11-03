/* ============================================================================
   S06 — 두 곡선이 만나는 순간  (global 200–240 s, local 0–40)
   All math space (navy sky + nebula + stars layer). A sand-scratched figure
   (Menaechmus' two curves in a sand tray) darkens and dissolves into a modern
   coordinate plane; the two parabolas x² = ay and y² = 2ax draw on as glowing
   hand-inked curves; their non-origin intersection (∛2·a, ∛4·a) is marked in
   gold, a perpendicular drops to the x-axis, x³ = 2a³ → x = ∛2·a appears; the
   glowing segment of length x lifts off the axis and becomes the edge of the
   new cube (volume 2a³) next to the original cube (a³); both glow gold.

   Geometry: a = 1 unit = 250 px, origin at (640, 720). Intersection of
   x² = y and y² = 2x (other than O): x⁴ = 2x → x = 2^(1/3) ≈ 1.2599,
   y = x² = 2^(2/3) ≈ 1.5874  →  pixel (955.0, 323.2).

   Timing map (scene-local seconds; subtitles from script.js in brackets):
     0.0– 3.8  sand-tray figure (two scratched curves + two scratched lines)
               darkens and dissolves into the navy plane      [1–39.5 caption]
     2.2– 3.8  faint grid fades in;  2.6–4.0 axes ink on;  3.6–4.4 ticks/labels
     4.2– 7.6  parabola 1  x² = ay draws (left arm → O → right arm) [4–8.5]
     6.6– 7.4    label x² = ay
    11.2–14.6  parabola 2  y² = 2ax draws (lower arm → O → upper arm) [11–15.5]
    13.6–14.4    label y² = 2ax
    18.0–19.3  O ringed briefly (the trivial intersection), gold marker +
               pulse rings at the other intersection from 18.5        [18–25.5]
    19.3–20.0    coordinates (∛2a, ∛4a)
    19.8–20.8    perpendicular drops to the x-axis; foot tick + label x
    21.2–23.0    x³ = 2a³ typed;  23.4–25.0  x = ∛2 × a typed;  25.3 x ≈ 1.26a
    25.6–      the segment O→foot (length x) glows gold on the axis
    26.3–28.3  segment lifts and turns into the front-bottom edge of the new
               cube; the plane fades out (26.3–28.8)                  [27–34.5]
    28.0–29.6  new cube (edge ∛2·a) fades in around the edge
    29.4–31.0  original cube (edge a) fades in on the left
    31.2–33.2  labels: a / x = ∛2·a ; 원래 부피: a³ / 새로운 부피: 2a³
    32.5–      top line  x = ∛2·a ≈ 1.26a
    36.0–40.0  both cubes glow gold; engine fade-out 0.9             [35–39.5]
   ========================================================================== */
ANIM.scene({
  id: 's06', title: '두 곡선이 만나는 순간',
  start: ANIM.TIMES.s06[0], end: ANIM.TIMES.s06[1],
  mood: t => (t < 26 ? 'rise' : 'finale'),
  fadeIn: 0.9, fadeOut: 0.9,

  init(api, S) {
    const { u, W, H } = api, P = ANIM.paint;

    /* ---------------------------------------------------- navy math space */
    S.navy = u.layer(W, H, c => {
      P.sky(c, { preset: 'navyMath', seed: 61, horizon: H * 1.05, clouds: false });
      P.nebula(c, { seed: 67, alpha: 0.8, count: 11, colors: ['#1f3f6e', '#2a2a66', '#1c4d58', '#3a2f66'] });
      P.stars(c, { seed: 71, count: 150, yMax: H, alpha: 0.55 });
      u.paper(c, 0.14);
    });

    /* ------------------------------------------- coordinate system (exact) */
    S.U = 250;                                   // a = 1 unit = 250 px
    S.O = { x: 640, y: 720 };
    const px = (S.px = (x, y) => ({ x: S.O.x + x * S.U, y: S.O.y - y * S.U }));
    S.cb = Math.cbrt(2);                         // ∛2 ≈ 1.2599
    S.ix = { x: S.cb, y: S.cb * S.cb };           // intersection (∛2, ∛4)
    S.ipx = px(S.ix.x, S.ix.y);                  // ≈ (955.0, 323.2)
    S.foot = px(S.ix.x, 0);

    // parabola 1: x² = y  (opens up), parametrised in x, then resampled to even arc length
    const p1 = []; for (let i = 0; i <= 320; i++) { const x = -1.72 + 3.44 * i / 320; p1.push(px(x, x * x)); }
    S.par1 = u.resample(p1, 5);
    // parabola 2: y² = 2x  (opens right), parametrised in y from the lower arm to the upper arm
    const p2 = []; for (let i = 0; i <= 320; i++) { const y = -1.3 + 4.3 * i / 320; p2.push(px(y * y / 2, y)); }
    S.par2 = u.resample(p2, 5);

    // faint hand-inked grid (static layer; the axes boil per frame)
    S.grid = u.layer(W, H, c => {
      const col = '#9ff5ea';
      for (let x = -2.5; x <= 4.5; x += 0.5) { const X = px(x, 0).x; if (X < 30 || X > W - 30) continue; const major = Math.abs(x - Math.round(x)) < 1e-6; u.ink(c, [{ x: X, y: 30 }, { x: X, y: H - 20 }], { w: major ? 1.5 : 1.0, color: col, alpha: major ? 0.17 : 0.08, jitter: 0.9, seed: 300 + x * 4, taper: 0, step: 10 }); }
      for (let y = -1.5; y <= 3; y += 0.5) { const Y = px(0, y).y; if (Y < 20 || Y > H - 20) continue; const major = Math.abs(y - Math.round(y)) < 1e-6; u.ink(c, [{ x: 40, y: Y }, { x: W - 40, y: Y }], { w: major ? 1.5 : 1.0, color: col, alpha: major ? 0.17 : 0.08, jitter: 0.9, seed: 400 + y * 4, taper: 0, step: 10 }); }
    });

    /* ------------------------------ sand-tray figure (Menaechmus' sketch) */
    S.sand = u.layer(W, H, c => {
      P.sandTray(c, { x: -140, y: -140, w: W + 280, h: H + 280, seed: 61 });
      // two scratched "diameters" (slightly off the modern axes) and the two curves, roughly
      const wob = (pts, j, s) => u.wobble(u.resample(pts, 12), j, s, 0.004);
      P.sandLine(c, wob([{ x: 120, y: 742 }, { x: 1800, y: 706 }], 4, 5), { seed: 5, w: 9, color: '#7a5d3a' });
      P.sandLine(c, wob([{ x: 652, y: 60 }, { x: 628, y: 1040 }], 4, 6), { seed: 6, w: 9, color: '#7a5d3a' });
      P.sandLine(c, wob(S.par1, 4, 7), { seed: 7, w: 11, color: '#6f5232' });
      P.sandLine(c, wob(S.par2, 4, 8), { seed: 8, w: 11, color: '#6f5232' });
      // a few grains / pebbles and a finger-smudge where the curves cross
      const r = u.rng(91); for (let i = 0; i < 70; i++) { const x = r() * W, y = r() * H; u.dab(c, x, y, 2 + r() * 4, r() < 0.5 ? '#6d5636' : '#efe0b8', 0.5, 0.3); }
      u.wash(c, u.ellipsePts(S.ipx.x, S.ipx.y, 70, 40, 24, 0.5), '#b89c6e', { seed: 3, passes: 2, spread: 8, alpha: 0.25 });
      // low light: a single oil lamp off-frame at the upper left; the rest of the tray falls into shadow
      c.fillStyle = 'rgba(28,18,10,0.5)'; c.fillRect(0, 0, W, H);
      const g = c.createRadialGradient(430, 300, 80, 430, 300, 1500); g.addColorStop(0, 'rgba(255,214,150,0.55)'); g.addColorStop(0.35, 'rgba(255,190,120,0.18)'); g.addColorStop(1, 'rgba(10,6,4,0.75)');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      u.paper(c, 0.22);
    });

    /* ------------------------------------------------- cached glow sprite */
    S.spr = {};
    S.glow = (c, x, y, r, color, alpha = 0.6) => {
      let s = S.spr[color];
      if (!s) s = S.spr[color] = u.layer(256, 256, cc => { const g = cc.createRadialGradient(128, 128, 0, 128, 128, 128); g.addColorStop(0, color); g.addColorStop(0.35, u.alpha(color, 0.5)); g.addColorStop(1, u.alpha(color, 0)); cc.fillStyle = g; cc.fillRect(0, 0, 256, 256); });
      c.save(); c.globalAlpha *= alpha; c.drawImage(s, x - r, y - r, r * 2, r * 2); c.restore();
    };

    /* ------------------------------------------------------ text metrics */
    S.F = { f1: 'x³ = 2a³', f2: 'x = ∛2 × a', f3: 'x ≈ 1.26a', top: 'x = ∛2 × a ≈ 1.26a' };
    const m = u.layer(8, 8).getContext('2d');
    S.w = { f1: u.math(m, S.F.f1, 0, 0, { size: 64 }), f2: u.math(m, S.F.f2, 0, 0, { size: 58 }) };

    /* --------------------------------------------- 3D layout for the cubes */
    S.A = { o: [-2.25, -1, -0.5], s: 1 };                       // original cube a (left)
    S.X = { o: [0.95 - S.cb / 2, -1, -S.cb / 2], s: S.cb };    // new cube, edge ∛2·a (right)
    S.cam = (t, E) => u.camera({ yaw: 0.50 + 0.12 * E.sine(u.seg(t, 26, 40)), pitch: 0.30, dist: 10, fov: 2350, cx: W * 0.5 + 95, cy: 470, target: [0, 0, 0] });
    S.chimed = false;
  },

  draw(api, t, S) {
    const { ctx: c, u, W, H } = api, E = u.ease, P = ANIM.paint;
    const boil = api.boil, tq = api.tq;
    const gold = '#f3d27a', ivory = '#f6f1e6', teal = '#58e0d0', inkM = '#9ff5ea';

    /* --------------------------------------------------- background */
    c.drawImage(S.navy, 0, 0);
    u.motes(c, t, { count: 26, seed: 29, color: inkM, size: 2.2, speed: 0.4, alpha: 0.28, drift: 0.7 });
    if (P.particles) P.particles(c, t, { kind: 'glint', count: 9, box: [60, 20, W - 120, 420], seed: 31, size: 0.8, speed: 0.5, alpha: 0.3, color: '#fff6dc' });

    /* ----------------------------------- sand figure → plane (0–3.8) */
    const kPlane = E.io(u.seg(t, 1.6, 3.8));
    if (kPlane < 1) {
      c.save(); c.globalAlpha = 1 - kPlane; c.drawImage(S.sand, 0, 0);
      // lamp flicker over the sand (warm pool breathing from the upper left) + a little drifting dust
      const fl = 0.8 + 0.14 * u.noise2(t * 7 + 3, 1) + 0.06 * u.snoise(t * 23);
      c.globalCompositeOperation = 'soft-light'; S.glow(c, 430, 300, 1300 * fl, '#ffd9a0', 0.9 * fl); c.globalCompositeOperation = 'source-over';
      u.motes(c, t, { count: 16, box: [100, 60, 1000, 600], seed: 23, color: '#ffe3b0', size: 2.2, speed: 0.35, alpha: 0.22, drift: 0.6 });
      // the room darkens while the figure dissolves
      c.fillStyle = `rgba(6,8,20,${0.55 * E.io(u.seg(t, 0.4, 3.2))})`; c.fillRect(0, 0, W, H);
      c.restore();
    }

    /* ----------------------------- coordinate plane (fades 26.3–28.8) */
    const kPlaneOut = 1 - E.io(u.seg(t, 26.3, 28.8));
    const pa = kPlane * kPlaneOut;                     // plane alpha
    if (pa > 0.005) {
      c.save(); c.globalAlpha = pa * E.io(u.seg(t, 2.2, 3.8)); c.drawImage(S.grid, 0, 0); c.restore();

      // axes (hand-inked, boiling), drawn on 2.6–4.0
      const kx = E.out(u.seg(tq, 2.6, 3.5)), ky = E.out(u.seg(tq, 3.0, 4.0));
      const O = S.O, axCol = '#d9f7f2';
      if (kx > 0) {
        const x0 = 70, x1 = u.lerp(x0, W - 70, kx);
        u.ink(c, [{ x: x0, y: O.y }, { x: x1, y: O.y }], { w: 3, color: axCol, alpha: 0.85 * pa, jitter: 1.0, seed: boil * 3 + 11, taper: 0.05, step: 8 });
        if (kx > 0.98) arrow(x1, O.y, 0);
      }
      if (ky > 0) {
        const y0 = 1000, y1 = u.lerp(y0, 40, ky);
        u.ink(c, [{ x: O.x, y: y0 }, { x: O.x, y: y1 }], { w: 3, color: axCol, alpha: 0.85 * pa, jitter: 1.0, seed: boil * 3 + 12, taper: 0.05, step: 8 });
        if (ky > 0.98) arrow(O.x, y1, -Math.PI / 2);
      }
      // ticks + unit labels (a = 1 unit), axis names
      const kt = E.out(u.seg(t, 3.6, 4.4));
      if (kt > 0.01) {
        const tick = (p, vert, lab, dx, dy, a) => { u.ink(c, vert ? [{ x: p.x - 11, y: p.y }, { x: p.x + 11, y: p.y }] : [{ x: p.x, y: p.y - 11 }, { x: p.x, y: p.y + 11 }], { w: 2.4, color: axCol, alpha: 0.8 * a, jitter: 0.5, seed: boil + p.x * 0.1 + p.y * 0.3, taper: 0.2 }); if (lab) u.math(c, lab, p.x + dx, p.y + dy, { size: 34, color: ivory, alpha: 0.72 * a }); };
        [1, 2, 3, 4].forEach(i => tick(S.px(i, 0), false, i === 1 ? 'a' : i + 'a', 0, 34, kt * pa));
        [-1].forEach(i => tick(S.px(i, 0), false, '−a', 0, 34, kt * pa));
        [1, 2].forEach(i => tick(S.px(0, i), true, i === 1 ? 'a' : i + 'a', -36, 0, kt * pa));
        u.math(c, 'x', W - 60, O.y + 44, { size: 46, color: ivory, alpha: 0.9 * kt * pa });
        u.math(c, 'y', O.x - 46, 60, { size: 46, color: ivory, alpha: 0.9 * kt * pa });
        u.math(c, 'O', O.x - 28, O.y + 36, { size: 38, color: ivory, alpha: 0.8 * kt * pa });
      }

      /* ------------------------------ parabola 1: x² = ay (4.2–7.6) */
      drawCurve(S.par1, E.io(u.seg(t, 4.2, 7.6)), teal, boil * 3 + 101, pa);
      const kl1 = E.out(u.seg(t, 6.6, 7.4));
      if (kl1 > 0.01) u.math(c, 'x² = ay', 290, 300, { size: 52, color: '#bffff5', align: 'right', alpha: kl1 * pa, glow: 16 });

      /* ----------------------------- parabola 2: y² = 2ax (11.2–14.6) */
      drawCurve(S.par2, E.io(u.seg(t, 11.2, 14.6)), gold, boil * 3 + 202, pa);
      const kl2 = E.out(u.seg(t, 13.6, 14.4));
      if (kl2 > 0.01) u.math(c, 'y² = 2ax', 1560, 250, { size: 52, color: '#ffe9a8', align: 'left', alpha: kl2 * pa, glow: 16 });

      /* ------------------------------------ intersection (18.0–25.5) */
      if (t >= 18.0) {
        if (!S.chimed) { S.chimed = true; try { ANIM.snd.chime(880, 2.4, 0.09); } catch (e) { } }
        // O: the trivial intersection, ringed briefly (18.0–19.3)
        const kO = Math.min(E.out(u.seg(t, 18.0, 18.5)), 1 - E.io(u.seg(t, 18.8, 19.3)));
        if (kO > 0.01) { const r = 22 + 10 * E.out(u.seg(t, 18.0, 18.6)); u.ink(c, u.circlePts(O.x, O.y, r, 28), { w: 2.6, color: inkM, alpha: 0.7 * kO * pa, jitter: 0.8, seed: boil * 3 + 31, closed: true, taper: 0 }); }

        // gold marker at (∛2a, ∛4a) with pulse rings
        const I = S.ipx, kI = E.outBack(u.seg(t, 18.5, 19.0));
        if (kI > 0.01) {
          const pulse = 0.8 + 0.2 * Math.sin((t - 18.5) * 4.2);
          S.glow(c, I.x, I.y, 120 * pulse, gold, 0.35 * pa);
          S.glow(c, I.x, I.y, 44, '#fff3c4', 0.6 * pa);
          u.dab(c, I.x, I.y, 13 * kI, gold, 0.95 * pa, 0.6); u.dab(c, I.x, I.y, 6 * kI, '#ffffff', 0.95 * pa, 0.7);
          u.ink(c, u.circlePts(I.x, I.y, 19 * kI, 24), { w: 2.8, color: '#ffe9a8', alpha: 0.9 * pa, jitter: 0.7, seed: boil * 3 + 41, closed: true, taper: 0 });
          // expanding rings every 1.6 s
          for (let k = 0; k < 2; k++) { const ph = ((t - 18.5) / 1.6 + k * 0.5) % 1; if (t - 18.5 < k * 0.8) continue; const r = 20 + 75 * ph, a = (1 - ph) * (1 - ph) * 0.6; u.ink(c, u.circlePts(I.x, I.y, r, 32), { w: 2, color: gold, alpha: a * pa, jitter: 0.6, seed: boil * 3 + 51 + k, closed: true, taper: 0 }); }
        }
        // coordinates label (upper-left of the point, clear of both arms)
        const kC = E.out(u.seg(t, 19.3, 20.0));
        if (kC > 0.01) u.math(c, '(∛2a, ∛4a)', I.x - 28, I.y - 52, { size: 42, color: ivory, align: 'right', alpha: 0.95 * kC * pa, glow: 12 });

        // perpendicular to the x-axis (dashed, hand-inked), foot tick and label x
        const kD = E.io(u.seg(tq, 19.8, 20.8));
        if (kD > 0.01) {
          const L = (S.foot.y - I.y) * kD; const dash = 20, gap = 13; let s0 = 0, i = 0;
          while (s0 < L) { const s1 = Math.min(L, s0 + dash); u.ink(c, [{ x: I.x, y: I.y + s0 }, { x: I.x, y: I.y + s1 }], { w: 2.6, color: '#ffe9a8', alpha: 0.8 * pa, jitter: 0.5, seed: boil * 3 + 61 + i, taper: 0.2, step: 5 }); s0 += dash + gap; i++; }
          if (kD > 0.97) {
            const kf = E.out(u.seg(t, 20.8, 21.3));
            u.ink(c, [{ x: S.foot.x, y: S.foot.y - 14 }, { x: S.foot.x, y: S.foot.y + 14 }], { w: 3.4, color: gold, alpha: 0.95 * pa, jitter: 0.5, seed: boil * 3 + 71, taper: 0.2 });
            u.dab(c, S.foot.x, S.foot.y, 7, gold, 0.9 * pa, 0.6);
            u.math(c, 'x', S.foot.x + 16, S.foot.y + 44, { size: 46, color: gold, alpha: kf * pa, glow: 16 });
          }
        }

        // formulas (typed at 12 fps) in the empty lower-right quadrant
        const fx = 1510;
        typed(S.F.f1, S.w.f1, fx, 520, E.sine(u.seg(tq, 21.2, 23.0)), 64, gold, 22, pa);
        typed(S.F.f2, S.w.f2, fx, 612, E.sine(u.seg(tq, 23.4, 25.0)), 58, gold, 18, pa);
        const k3 = E.out(u.seg(t, 25.3, 25.9)); if (k3 > 0.01) u.math(c, S.F.f3, fx, 690, { size: 46, color: ivory, alpha: k3 * pa, glow: 12 });

        // the segment O→foot of length x glows gold on the axis (25.6–)
        const kS = E.out(u.seg(t, 25.6, 26.3));
        if (kS > 0.01 && t < 26.3) {
          const pl = 0.85 + 0.15 * Math.sin(t * 5);
          u.glowLine(c, [{ x: O.x, y: O.y }, { x: S.foot.x, y: S.foot.y }], { color: gold, w: 6 * kS, halo: 30, alpha: kS * pl * pa, seed: boil * 3 + 81, jitter: 0.5 });
        }
      }
    }

    /* ---------------------------- segment lifts → cubes (26.3–40) */
    if (t >= 26.3) {
      const Pj = S.cam(t, E);
      const eX = bottomEdge(Pj, S.X.o, S.X.s);           // front-bottom edge of the new cube
      const left = eX.a.x < eX.b.x ? eX.a : eX.b, right = left === eX.a ? eX.b : eX.a;
      const kL = E.io(u.seg(t, 26.3, 28.3));
      const lift = -170 * Math.sin(Math.PI * kL);        // rises off the axis, then settles onto the cube edge
      const p0 = { x: u.lerp(S.O.x, left.x, kL), y: u.lerp(S.O.y, left.y, kL) + lift }, p1 = { x: u.lerp(S.foot.x, right.x, kL), y: u.lerp(S.foot.y, right.y, kL) + lift };
      const kGold = E.io(u.seg(t, 36, 39.5));
      const colFace = P.mix(teal, gold, kGold), colEdge = P.mix(inkM, '#ffe9a8', kGold);

      // floor light pools under the cubes
      const kX = E.out(u.seg(t, 28.0, 29.6)), kA = E.out(u.seg(t, 29.4, 31.0));
      const cA = [S.A.o[0] + 0.5, S.A.o[2] + 0.5], cX = [S.X.o[0] + S.X.s / 2, S.X.o[2] + S.X.s / 2];
      const fa = Pj(cA[0], -1, cA[1]), fxp = Pj(cX[0], -1, cX[1]); const brf = 0.8 + 0.2 * Math.sin(t * 0.9);
      c.save(); c.translate(0, fa.y + 10); c.scale(1, 0.3); c.translate(0, -(fa.y + 10));
      S.glow(c, fa.x, fa.y + 10, 380, colFace, 0.12 * brf * kA); S.glow(c, fxp.x, fxp.y + 10, 500, colFace, 0.14 * brf * kX);
      c.restore();

      // cubes
      if (kA > 0.01) u.cube(c, Pj, { origin: S.A.o, size: S.A.s, color: colFace, edge: colEdge, faceAlpha: 0.13, w: 3, jitter: 0.8, seed: boil * 7 + 500, alpha: kA, hiddenAlpha: 0.25 });
      if (kX > 0.01) u.cube(c, Pj, { origin: S.X.o, size: S.X.s, color: colFace, edge: colEdge, faceAlpha: 0.13, w: 3, jitter: 0.8, seed: boil * 11 + 600, alpha: kX, hiddenAlpha: 0.25 });

      // the lifted segment (stays gold over the new cube's edge, then eases away)
      const kSeg = 1 - E.io(u.seg(t, 30.0, 31.5));
      if (kSeg > 0.01) {
        const pl = 0.85 + 0.15 * Math.sin(t * 5);
        c.save(); c.globalCompositeOperation = 'lighter';
        if (kL > 0.01 && kL < 0.99) { // faint trail while moving
          const tr = [{ x: u.lerp(S.O.x, p0.x, 0.6), y: u.lerp(S.O.y, p0.y, 0.6) }, p0];
          u.ink(c, tr, { w: 16, color: u.alpha(gold, 0.15), jitter: 1.2, seed: boil * 3 + 91, taper: 0.9, step: 8 });
        }
        c.restore();
        u.glowLine(c, [p0, p1], { color: gold, w: 6, halo: 30, alpha: kSeg * pl, seed: boil * 3 + 81, jitter: 0.5 });
        S.glow(c, p0.x, p0.y, 34, '#fff3c4', 0.5 * kSeg); S.glow(c, p1.x, p1.y, 34, '#fff3c4', 0.5 * kSeg);
      }

      // labels
      const kLab = E.out(u.seg(t, 31.2, 32.2)), kVol = E.out(u.seg(t, 32.2, 33.2));
      if (kLab > 0.01) {
        const ea = bottomEdge(Pj, S.A.o, S.A.s);
        u.math(c, 'a', ea.mx, ea.my + 46, { size: 50, color: gold, alpha: kLab * kA, glow: 16 });
        u.math(c, 'x = ∛2 × a', eX.mx, eX.my + 46, { size: 50, color: gold, alpha: kLab * kX, glow: 16 });
      }
      if (kVol > 0.01) {
        const ea = bottomEdge(Pj, S.A.o, S.A.s);
        volLabel('원래 부피: ', 'a³', ea.mx, ea.my + 122, kVol * kA);
        volLabel('새로운 부피: ', '2a³', eX.mx, eX.my + 122, kVol * kX);
      }
      const kTop = E.out(u.seg(t, 32.5, 33.5));
      if (kTop > 0.01) u.math(c, S.F.top, W / 2, 150, { size: 60, color: P.mix(gold, '#fff3c4', kGold * 0.6), alpha: kTop, glow: 24 });

      // finale: both cubes glow gold (36–40)
      if (kGold > 0.01) {
        const ca3 = Pj(cA[0], -0.5, cA[1]), cx3 = Pj(cX[0], -1 + S.X.s / 2, cX[1]);
        c.save(); c.globalCompositeOperation = 'lighter';
        S.glow(c, ca3.x, ca3.y, 300 + 60 * Math.sin(t * 1.3), gold, 0.28 * kGold);
        S.glow(c, cx3.x, cx3.y, 400 + 70 * Math.sin(t * 1.1 + 1), gold, 0.34 * kGold);
        c.restore();
        u.motes(c, t, { count: 40, box: [200, 200, W - 400, 600], seed: 97, color: '#ffe9a8', size: 2.8, speed: 0.8, alpha: 0.5 * kGold, drift: 1 });
        u.grade(c, '#f3d27a', 0.16 * kGold, 'soft-light');
      }
    }

    /* ----------------------------------------------------- helpers */
    function drawCurve(pts, k, color, seed, a) {
      if (k <= 0.002 || a <= 0.005) return;
      const n = Math.max(2, Math.round(pts.length * k));
      const part = pts.slice(0, n);
      u.glowLine(c, part, { color, w: 5, halo: 26, alpha: a, seed, jitter: 0.6 });
      if (k < 0.995) { const h = part[part.length - 1]; S.glow(c, h.x, h.y, 60, '#ffffff', 0.5 * a); u.dab(c, h.x, h.y, 7, '#ffffff', 0.9 * a, 0.6); }
    }
    function arrow(x, y, ang) {
      const ca = Math.cos(ang), sa = Math.sin(ang), L = 26, Wd = 11;
      const tip = { x, y }, l = { x: x - L * ca + Wd * sa, y: y - L * sa - Wd * ca }, r = { x: x - L * ca - Wd * sa, y: y - L * sa + Wd * ca };
      u.ink(c, [l, tip, r], { w: 3, color: '#d9f7f2', alpha: 0.85 * pa, jitter: 0.5, seed: boil * 3 + 13 + ang, taper: 0.3, step: 4 });
    }
    function typed(str, w, cx, y, p, size, color, glowK, a) {
      if (p <= 0 || a <= 0.01) return;
      const s = u.typed(str, p); const x0 = cx - w / 2;
      u.math(c, s, x0, y, { size, color, align: 'left', alpha: a, glow: glowK });
      if (p < 1) { const cw = u.math(c, s, -9999, -9999, { size, alpha: 0 }); S.glow(c, x0 + cw + 6, y, 26, '#fff6d0', 0.5 * a); }
    }
    function volLabel(txt, mth, cx, y, a) {
      if (a <= 0.01) return;
      const wt = u.textW(c, txt, 38, 'sans', 500), wm = u.math(c, mth, -9999, -9999, { size: 50, alpha: 0 });
      const x0 = cx - (wt + wm) / 2;
      u.text(c, txt, x0, y, { size: 38, color: ivory, align: 'left', alpha: a, glow: 8 });
      u.math(c, mth, x0 + wt, y, { size: 50, color: ivory, align: 'left', alpha: a, glow: 14 });
    }
    function bottomEdge(Pj, o, s) {
      const cs = [[o[0], o[1], o[2]], [o[0] + s, o[1], o[2]], [o[0] + s, o[1], o[2] + s], [o[0], o[1], o[2] + s]].map(v => Pj(v[0], v[1], v[2]));
      let k = 0; cs.forEach((p, i) => { if (p.y > cs[k].y) k = i; });
      const a = cs[k], n1 = cs[(k + 1) % 4], n2 = cs[(k + 3) % 4];
      const b = Math.hypot(n1.x - a.x, n1.y - a.y) > Math.hypot(n2.x - a.x, n2.y - a.y) ? n1 : n2;
      return { a, b, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
    }
  },
});
