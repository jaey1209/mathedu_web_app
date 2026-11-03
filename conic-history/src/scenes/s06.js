/* ============================================================================
   S06 — 두 곡선이 만나는 순간  (global 200–240 s, local 0–40)
   All math space (navy sky + nebula + stars layer). A sand-scratched figure
   (Menaechmus' two curves in a sand tray) darkens and dissolves into a modern
   coordinate plane; the two parabolas x² = ay and y² = 2ax draw on as glowing
   hand-inked curves; their non-origin intersection (∛2·a, ∛4·a) is marked in
   gold, a perpendicular drops to the x-axis, x³ = 2a³ → x = ∛2·a appears; the
   glowing segment of length x lifts off the axis, turns upright and becomes
   the front vertical edge of the new cube (volume 2a³) next to the original
   cube (a³); both glow gold.

   Geometry: a = 1 unit = 250 px, origin at (640, 720). Intersection of
   x² = y and y² = 2x (other than O): x⁴ = 2x → x = 2^(1/3) ≈ 1.2599,
   y = x² = 2^(2/3) ≈ 1.5874  →  pixel (955.0, 323.2).
   3D: near-orthographic lens (dist 40, fov 10400) and both cubes placed at the
   same camera depth, so projected edge ratios are honest: vertical edges
   1.253 (1.244 at the end of the yaw drift), bottom edges 1.22; the new
   cube's front vertical edge is ≈ 314 px = the 315 px segment on the axis.

   Timing map (scene-local seconds; subtitles from script.js in brackets):
     0.0– 2.4  sand-tray figure holds (engine fade-in 0.9); the room starts
               to darken at 1.6                                   [1–39.5 caption]
     2.4– 4.0  sand dissolves (warm → near-dark → navy) into the plane
     3.0– 4.2  faint grid;  3.2–4.0 x-axis inks on the scratched line;
     3.5– 4.4  y-axis;  4.0–4.6 ticks / labels
     4.2– 7.6  parabola 1  x² = ay draws (left arm → O → right arm) [4–8.5]
     6.6– 7.4    label x² = ay
    11.2–14.6  parabola 2  y² = 2ax draws (lower arm → O → upper arm) [11–15.5]
    13.6–14.4    label y² = 2ax
    18.0–26.0  slow camera push-in (zoom 1 → 1.04)
    18.0–19.3  O ringed briefly (the trivial intersection), gold marker +
               pulse rings at the other intersection from 18.5        [18–25.5]
    19.3–20.0    coordinates (∛2·a, ∛4·a)
    19.8–20.8    perpendicular drops to the x-axis; foot tick + label x
    21.2–23.0    x³ = 2a³ typed;  23.4–25.0  x = ∛2 × a typed;  25.3 x ≈ 1.26a
    25.6–      the segment O→foot (length x) glows gold on the axis
    26.3–28.3  segment lifts, turns upright and settles on the front vertical
               edge of the new cube; text fades 26.3–27.4, curves 26.3–28.8
    27.6–29.2  new cube (edge ∛2·a) fades in around the edge        [27–34.5]
    29.4–31.0  original cube (edge a) fades in on the left
    31.2–33.2  labels: a / x = ∛2 × a ; 원래 부피: a³ / 새로운 부피: 2a³
    32.5–      top line  x = ∛2 × a ≈ 1.26a
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
    // a strip of the same navy that fades the plane out just above the subtitle band (y 808–904)
    S.bandY = 808;
    S.band = u.layer(W, 96, c => {
      c.drawImage(S.navy, 0, S.bandY, W, 96, 0, 0, W, 96);
      c.globalCompositeOperation = 'destination-in';
      c.fillStyle = u.grad(c, 0, 0, 0, 96, [[0, 'rgba(0,0,0,0)'], [0.35, 'rgba(0,0,0,0.35)'], [0.72, 'rgba(0,0,0,0.92)'], [1, 'rgba(0,0,0,1)']]);
      c.fillRect(0, 0, W, 96);
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
    // parabola 2: y² = 2x  (opens right), lower arm → O → upper arm. The lower arm stops at
    // y = −0.62 (pixel y ≈ 875) and melts into the navy band strip, so nothing enters the subtitle band.
    const p2 = []; for (let i = 0; i <= 320; i++) { const y = -0.62 + 3.62 * i / 320; p2.push(px(y * y / 2, y)); }
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
      // two scratched "diameters" that sit exactly where the modern axes will be inked (match-cut),
      // and the two curves, roughly
      const wob = (pts, j, s) => u.wobble(u.resample(pts, 12), j, s, 0.004);
      P.sandLine(c, wob([{ x: 120, y: S.O.y }, { x: 1800, y: S.O.y }], 3, 5), { seed: 5, w: 9, color: '#7a5d3a' });
      P.sandLine(c, wob([{ x: S.O.x, y: 60 }, { x: S.O.x, y: 880 }], 3, 6), { seed: 6, w: 9, color: '#7a5d3a' });
      P.sandLine(c, wob(S.par1, 3, 7), { seed: 7, w: 11, color: '#6f5232' });
      P.sandLine(c, wob(S.par2, 3, 8), { seed: 8, w: 11, color: '#6f5232' });
      // a few grains / pebbles and a faint finger-smudge where the curves cross
      const r = u.rng(91); for (let i = 0; i < 70; i++) { const x = r() * W, y = r() * H; u.dab(c, x, y, 2 + r() * 4, r() < 0.5 ? '#6d5636' : '#efe0b8', 0.5, 0.3); }
      u.wash(c, u.ellipsePts(S.ipx.x, S.ipx.y, 70, 40, 24, 0.5), '#b89c6e', { seed: 3, passes: 2, spread: 8, alpha: 0.1 });
      // low light: an oil lamp off-frame at the upper left (static pool baked here; a smaller sprite
      // breathes over it per frame) and a faint bounce light from the lower right so the grain reads everywhere
      c.fillStyle = 'rgba(28,18,10,0.5)'; c.fillRect(0, 0, W, H);
      const g = c.createRadialGradient(430, 300, 80, 430, 300, 1500); g.addColorStop(0, 'rgba(255,214,150,0.55)'); g.addColorStop(0.35, 'rgba(255,190,120,0.18)'); g.addColorStop(1, 'rgba(10,6,4,0.55)');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      const g2 = c.createRadialGradient(1720, 1010, 40, 1720, 1010, 820); g2.addColorStop(0, 'rgba(255,205,150,0.16)'); g2.addColorStop(1, 'rgba(255,205,150,0)');
      c.fillStyle = g2; c.fillRect(0, 0, W, H);
      u.paper(c, 0.22);
    });

    /* ------------------------------------------------- cached glow sprite */
    S.spr = {};
    S.glow = (c, x, y, r, color, alpha = 0.6) => {
      let s = S.spr[color];
      if (!s) {
        if (Object.keys(S.spr).length > 16) { u.glow(c, x, y, r, color, alpha); return; }   // never grow without bound
        s = S.spr[color] = u.layer(256, 256, cc => { const g = cc.createRadialGradient(128, 128, 0, 128, 128, 128); g.addColorStop(0, color); g.addColorStop(0.35, u.alpha(color, 0.5)); g.addColorStop(1, u.alpha(color, 0)); cc.fillStyle = g; cc.fillRect(0, 0, 256, 256); });
      }
      c.save(); c.globalAlpha *= alpha; c.drawImage(s, x - r, y - r, r * 2, r * 2); c.restore();
    };
    // pre-build the sprites draw() uses, so no canvas is allocated inside draw
    ['#f3d27a', '#58e0d0', '#fff3c4', '#ffffff', '#ffd9a0', '#fff6d0'].forEach(col => S.glow(u.layer(2, 2).getContext('2d'), 0, 0, 1, col, 0));

    /* ------------------------------------------------------ text metrics */
    S.F = { f1: 'x³ = 2a³', f2: 'x = ∛2 × a', f3: 'x ≈ 1.26a', top: 'x = ∛2 × a ≈ 1.26a' };
    S.m = u.layer(8, 8).getContext('2d');
    S.w = { f1: u.math(S.m, S.F.f1, 0, 0, { size: 64 }), f2: u.math(S.m, S.F.f2, 0, 0, { size: 58 }), f3: u.math(S.m, S.F.f3, 0, 0, { size: 46 }) };
    S.fx0 = 1510 - Math.max(S.w.f1, S.w.f2, S.w.f3) / 2;      // common left edge of the formula block

    /* --------------------------------------------- 3D layout for the cubes */
    const yaw0 = 0.50, ax = -2.2, xc = 0.55;
    S.A = { o: [ax, -1, -0.5], s: 1 };                                   // original cube a (left)
    const zA = (ax + 0.5) * Math.sin(yaw0);                               // camera depth of cube A's centre
    const zX = (zA - xc * Math.sin(yaw0)) / Math.cos(yaw0);               // put the new cube at the same depth
    S.X = { o: [xc - S.cb / 2, -1, zX - S.cb / 2], s: S.cb };             // new cube, edge ∛2·a (right)
    S.yaw0 = yaw0;
    S.cam = (t, E) => u.camera({ yaw: yaw0 + 0.06 * E.sine(u.seg(t, 28.3, 40)), pitch: 0.30, dist: 40, fov: 10400, cx: W * 0.5 + 10, cy: 445, target: [0, 0, 0] });
    S.chimed = false;
  },

  draw(api, t, S) {
    const { ctx: c, u, W, H } = api, E = u.ease, P = ANIM.paint;
    const boil = api.boil, tq = api.tq;
    const gold = '#f3d27a', ivory = '#f6f1e6', teal = '#58e0d0', inkM = '#9ff5ea';
    if (t < 18.0) S.chimed = false;                       // seek-safe chime flag

    /* --------------------------------------------------- background */
    c.drawImage(S.navy, 0, 0);
    u.motes(c, t, { count: 26, seed: 29, color: inkM, size: 2.2, speed: 0.4, alpha: 0.28, drift: 0.7 });
    if (P.particles) P.particles(c, t, { kind: 'glint', count: 9, box: [60, 20, W - 120, 420], seed: 31, size: 0.8, speed: 0.5, alpha: 0.3, color: '#fff6dc' });

    /* ----------------------------------- sand figure → plane (0–4.0) */
    const kPlane = E.io(u.seg(t, 2.4, 4.0));
    if (kPlane < 1) {
      c.save(); c.globalAlpha = 1 - kPlane; c.drawImage(S.sand, 0, 0);
      // lamp flicker over the sand (warm pool breathing from the upper left) + a little drifting dust
      const fl = 0.8 + 0.14 * u.noise2(t * 7 + 3, 1) + 0.06 * u.snoise(t * 23);
      c.globalCompositeOperation = 'soft-light'; S.glow(c, 430, 300, 700 * fl, '#ffd9a0', 0.55 * fl); c.globalCompositeOperation = 'source-over';
      u.motes(c, t, { count: 16, box: [100, 60, 1000, 600], seed: 23, color: '#ffe3b0', size: 2.2, speed: 0.35, alpha: 0.22, drift: 0.6 });
      // the room darkens before and through the dissolve (warm → near-dark → navy, never a grey mix)
      c.fillStyle = `rgba(6,8,20,${0.85 * E.io(u.seg(t, 1.6, 3.4))})`; c.fillRect(0, 0, W, H);
      c.restore();
    }

    /* ----------------------------- coordinate plane (fades 26.3–28.8) */
    const kPlaneOut = 1 - E.io(u.seg(t, 26.3, 28.8));
    const pa = kPlane * kPlaneOut;                     // plane alpha (curves, axes)
    const ta = pa * (1 - E.io(u.seg(t, 26.3, 27.4)));  // text alpha: labels/formulas leave before the curves
    if (pa > 0.005) {
      // one very slow push-in over the intersection beat (uniform transform: exactness preserved)
      const kz = E.io(u.seg(t, 18, 26));
      api.cam({ zoom: 1 + 0.04 * kz, y: 12 * kz });
      c.save(); c.globalAlpha = pa * E.io(u.seg(t, 3.0, 4.2)); c.drawImage(S.grid, 0, 0); c.restore();

      // axes (hand-inked, boiling), inked over the scratched sand lines 3.2–4.4
      const kx = E.out(u.seg(tq, 3.2, 4.0)), ky = E.out(u.seg(tq, 3.5, 4.4));
      const O = S.O, axCol = '#d9f7f2';
      if (kx > 0) {
        const x0 = 70, x1 = u.lerp(x0, W - 70, kx);
        u.ink(c, [{ x: x0, y: O.y }, { x: x1, y: O.y }], { w: 3, color: axCol, alpha: 0.85 * pa, jitter: 1.0, seed: boil * 3 + 11, taper: 0.05, step: 8 });
        arrow(x1, O.y, 0, u.seg(kx, 0.9, 1));
      }
      if (ky > 0) {
        const y0 = 880, y1 = u.lerp(y0, 52, ky);
        u.ink(c, [{ x: O.x, y: y0 }, { x: O.x, y: y1 }], { w: 3, color: axCol, alpha: 0.85 * pa, jitter: 1.0, seed: boil * 3 + 12, taper: 0.05, step: 8 });
        arrow(O.x, y1, -Math.PI / 2, u.seg(ky, 0.9, 1));
      }
      // ticks + unit labels (a = 1 unit), axis names
      const kt = E.out(u.seg(t, 4.0, 4.6));
      const kf = E.out(u.seg(t, 20.8, 21.3));            // foot label 'x' is up → dim the neighbouring 'a' tick label
      if (kt > 0.01) {
        const tick = (p, vert, lab, dx, dy, a, la = 1) => { u.ink(c, vert ? [{ x: p.x - 11, y: p.y }, { x: p.x + 11, y: p.y }] : [{ x: p.x, y: p.y - 11 }, { x: p.x, y: p.y + 11 }], { w: 2.4, color: axCol, alpha: 0.8 * a, jitter: 0.5, seed: boil + p.x * 0.1 + p.y * 0.3, taper: 0.2 }); if (lab) u.math(c, lab, p.x + dx, p.y + dy, { size: 34, color: ivory, alpha: 0.72 * a * la * (ta / Math.max(pa, 1e-6)) }); };
        [1, 2, 3, 4].forEach(i => tick(S.px(i, 0), false, i === 1 ? 'a' : i + 'a', 0, 34, kt * pa, i === 1 ? 1 - 0.55 * kf : 1));
        [-1].forEach(i => tick(S.px(i, 0), false, '−a', 0, 34, kt * pa));
        [1, 2].forEach(i => tick(S.px(0, i), true, i === 1 ? 'a' : i + 'a', -36, 0, kt * pa));
        u.math(c, 'x', W - 84, O.y + 44, { size: 46, color: ivory, alpha: 0.9 * kt * ta });
        u.math(c, 'y', O.x - 46, 76, { size: 46, color: ivory, alpha: 0.9 * kt * ta });
        u.math(c, 'O', O.x - 28, O.y + 36, { size: 38, color: ivory, alpha: 0.8 * kt * ta });
      }

      /* ------------------------------ parabola 1: x² = ay (4.2–7.6) */
      drawCurve(S.par1, E.io(u.seg(t, 4.2, 7.6)), teal, boil * 3 + 101, pa);
      const kl1 = E.out(u.seg(t, 6.6, 7.4));
      if (kl1 > 0.01) u.math(c, 'x² = ay', 290, 300, { size: 52, color: '#bffff5', align: 'right', alpha: kl1 * ta, glow: 16 });

      /* ----------------------------- parabola 2: y² = 2ax (11.2–14.6) */
      drawCurve(S.par2, E.io(u.seg(t, 11.2, 14.6)), gold, boil * 3 + 202, pa);
      const kl2 = E.out(u.seg(t, 13.6, 14.4));
      if (kl2 > 0.01) u.math(c, 'y² = 2ax', 1560, 250, { size: 52, color: '#ffe9a8', align: 'left', alpha: kl2 * ta, glow: 16 });

      /* ------------------------------------ intersection (18.0–25.5) */
      if (t >= 18.0) {
        if (t < 18.6 && !S.chimed) { S.chimed = true; try { ANIM.snd.chime(880, 2.4, 0.09); } catch (e) { } }
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
        // coordinates label (upper-left of the point, clear of both arms); '·' keeps the radicand to the digit
        const kC = E.out(u.seg(t, 19.3, 20.0));
        if (kC > 0.01) u.math(c, '(∛2·a, ∛4·a)', I.x - 28, I.y - 52, { size: 42, color: ivory, align: 'right', alpha: 0.95 * kC * ta, glow: 12 });

        // perpendicular to the x-axis (dashed, hand-inked), foot tick and label x
        const kD = E.io(u.seg(tq, 19.8, 20.8));
        if (kD > 0.01) {
          const L = (S.foot.y - I.y) * kD; const dash = 20, gap = 13; let s0 = 0, i = 0;
          while (s0 < L) { const s1 = Math.min(L, s0 + dash); u.ink(c, [{ x: I.x, y: I.y + s0 }, { x: I.x, y: I.y + s1 }], { w: 2.6, color: '#ffe9a8', alpha: 0.8 * pa, jitter: 0.5, seed: boil * 3 + 61 + i, taper: 0.2, step: 5 }); s0 += dash + gap; i++; }
          if (kD > 0.97) {
            u.ink(c, [{ x: S.foot.x, y: S.foot.y - 14 }, { x: S.foot.x, y: S.foot.y + 14 }], { w: 3.4, color: gold, alpha: 0.95 * pa, jitter: 0.5, seed: boil * 3 + 71, taper: 0.2 });
            u.dab(c, S.foot.x, S.foot.y, 7, gold, 0.9 * pa, 0.6);
            u.math(c, 'x', S.foot.x + 24, S.foot.y + 44, { size: 46, color: gold, alpha: kf * ta, glow: 16 });
          }
        }

        // formulas (typed at 12 fps), left-aligned on a common edge in the lower-right quadrant
        typed(S.F.f1, S.fx0, 460, E.sine(u.seg(tq, 21.2, 23.0)), 64, gold, 22, ta);
        typed(S.F.f2, S.fx0, 552, E.sine(u.seg(tq, 23.4, 25.0)), 58, gold, 18, ta);
        const k3 = E.out(u.seg(t, 25.3, 25.9)); if (k3 > 0.01) u.math(c, S.F.f3, S.fx0, 630, { size: 46, color: ivory, align: 'left', alpha: k3 * ta, glow: 12 });

        // the segment O→foot of length x glows gold on the axis (25.6–)
        const kS = E.out(u.seg(t, 25.6, 26.3));
        if (kS > 0.01 && t < 26.3) {
          const pl = 0.85 + 0.15 * Math.sin(t * 5);
          u.glowLine(c, [{ x: O.x, y: O.y }, { x: S.foot.x, y: S.foot.y }], { color: gold, w: 6 * kS, halo: 30, alpha: kS * pl * pa, seed: boil * 3 + 81, jitter: 0.5 });
        }
      }
      api.endCam();
      // melt the plane into the navy just above the subtitle band (screen space; only once the sand is gone)
      c.save(); c.globalAlpha = kPlaneOut * E.io(u.seg(t, 3.8, 4.4)); c.drawImage(S.band, 0, S.bandY); c.restore();
    }

    /* ---------------------------- segment lifts → cubes (26.3–40) */
    if (t >= 26.3) {
      const Pj = S.cam(t, E);
      const eX = frontVert(Pj, S.X.o, S.X.s);            // front vertical edge of the new cube (a: bottom, b: top)
      const eA = frontVert(Pj, S.A.o, S.A.s);
      const kL = E.io(u.seg(t, 26.3, 28.3));
      // the segment rises off the axis, turns upright and settles on the cube edge
      const posAt = k => { const lift = -150 * Math.sin(Math.PI * k); return [{ x: u.lerp(S.O.x, eX.a.x, k), y: u.lerp(S.O.y, eX.a.y, k) + lift }, { x: u.lerp(S.foot.x, eX.b.x, k), y: u.lerp(S.foot.y, eX.b.y, k) + lift }]; };
      const [p0, p1] = posAt(kL);
      const kGold = E.io(u.seg(t, 36, 39.5));
      const colFace = P.mix(teal, gold, kGold), colEdge = P.mix(inkM, gold, kGold);

      // floor light pools under the cubes (teal → gold crossfade with fixed sprites; each squashed about its own centre)
      const kX = E.out(u.seg(t, 27.6, 29.2)), kA = E.out(u.seg(t, 29.4, 31.0));
      const cA = [S.A.o[0] + 0.5, S.A.o[2] + 0.5], cX = [S.X.o[0] + S.X.s / 2, S.X.o[2] + S.X.s / 2];
      const fa = Pj(cA[0], -1, cA[1]), fxp = Pj(cX[0], -1, cX[1]); const brf = 0.8 + 0.2 * Math.sin(t * 0.9);
      const pool = (p, r, a) => { if (a <= 0.003) return; c.save(); c.translate(0, p.y + 10); c.scale(1, 0.3); c.translate(0, -(p.y + 10)); S.glow(c, p.x, p.y + 10, r, teal, a * (1 - kGold)); if (kGold > 0.003) S.glow(c, p.x, p.y + 10, r, gold, a * kGold); c.restore(); };
      pool(fa, 380, 0.12 * brf * kA); pool(fxp, 500, 0.14 * brf * kX);

      // cubes
      const faceA = 0.13 + 0.07 * kGold;
      if (kA > 0.01) u.cube(c, Pj, { origin: S.A.o, size: S.A.s, color: colFace, edge: colEdge, faceAlpha: faceA, w: 3, jitter: 0.8, seed: boil * 7 + 500, alpha: kA, hiddenAlpha: 0.25 });
      if (kX > 0.01) u.cube(c, Pj, { origin: S.X.o, size: S.X.s, color: colFace, edge: colEdge, faceAlpha: faceA, w: 3, jitter: 0.8, seed: boil * 11 + 600, alpha: kX, hiddenAlpha: 0.25 });

      // the lifted segment (stays gold over the new cube's edge, then eases away)
      const kSeg = 1 - E.io(u.seg(t, 30.0, 31.5));
      if (kSeg > 0.01) {
        const pl = 0.85 + 0.15 * Math.sin(t * 5);
        if (kL > 0.01 && kL < 0.99) {                   // gold afterimages trail the moving segment
          [[0.08, 0.25], [0.16, 0.12]].forEach(([dk, a]) => { const k = kL - dk; if (k <= 0) return; const [q0, q1] = posAt(k); S.glow(c, q0.x, q0.y, 24, gold, a); S.glow(c, q1.x, q1.y, 24, gold, a); S.glow(c, (q0.x + q1.x) / 2, (q0.y + q1.y) / 2, 24, gold, a * 0.8); });
        }
        u.glowLine(c, [p0, p1], { color: gold, w: 6, halo: 30, alpha: kSeg * pl, seed: boil * 3 + 81, jitter: 0.5 });
        S.glow(c, p0.x, p0.y, 34, '#fff3c4', 0.5 * kSeg); S.glow(c, p1.x, p1.y, 34, '#fff3c4', 0.5 * kSeg);
      }

      // labels on one shared baseline under both cubes
      const yb = Math.max(eA.a.y, eX.a.y);
      const kLab = E.out(u.seg(t, 31.2, 32.2)), kVol = E.out(u.seg(t, 32.2, 33.2));
      if (kLab > 0.01) {
        u.math(c, 'a', fa.x, yb + 46, { size: 50, color: gold, alpha: kLab * kA, glow: 16 });
        u.math(c, 'x = ∛2 × a', fxp.x, yb + 46, { size: 50, color: gold, alpha: kLab * kX, glow: 16 });
      }
      if (kVol > 0.01) {
        volLabel('원래 부피: ', 'a³', fa.x, yb + 112, kVol * kA);
        volLabel('새로운 부피: ', '2a³', fxp.x, yb + 112, kVol * kX);
      }
      const kTop = E.out(u.seg(t, 32.5, 33.5));
      if (kTop > 0.01) u.math(c, S.F.top, W / 2, 150, { size: 60, color: P.mix(gold, '#fff3c4', kGold * 0.6), alpha: kTop, glow: 24 });

      // finale: both cubes glow gold (36–40): hot cores on the vertices, warm blooms, gold grade
      if (kGold > 0.01) {
        const verts = (o, s) => [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1], [0, 1, 0], [1, 1, 0], [1, 1, 1], [0, 1, 1]].map(v => Pj(o[0] + v[0] * s, o[1] + v[1] * s, o[2] + v[2] * s));
        verts(S.A.o, S.A.s).forEach(p => S.glow(c, p.x, p.y, 20, '#fff3c4', 0.45 * kGold * kA));
        verts(S.X.o, S.X.s).forEach(p => S.glow(c, p.x, p.y, 22, '#fff3c4', 0.5 * kGold * kX));
        const ca3 = Pj(cA[0], -0.5, cA[1]), cx3 = Pj(cX[0], -1 + S.X.s / 2, cX[1]);
        c.save(); c.globalCompositeOperation = 'lighter';
        S.glow(c, ca3.x, ca3.y, 280 + 40 * Math.sin(t * 1.3), gold, 0.45 * kGold);
        S.glow(c, cx3.x, cx3.y, 380 + 50 * Math.sin(t * 1.1 + 1), gold, 0.5 * kGold);
        c.restore();
        u.motes(c, t, { count: 40, box: [200, 200, W - 400, 600], seed: 97, color: '#ffe9a8', size: 2.8, speed: 0.8, alpha: 0.5 * kGold, drift: 1 });
        u.grade(c, '#f3d27a', 0.25 * kGold, 'soft-light');
      }
    }

    /* ----------------------------------------------------- helpers */
    function drawCurve(pts, k, color, seed, a) {
      if (k <= 0.002 || a <= 0.005) return;
      const n = Math.max(2, Math.round(pts.length * k));
      const part = pts.slice(0, n);
      u.glowLine(c, part, { color, w: 5, halo: 26, alpha: a, seed, jitter: 0.6 });
      if (k < 0.995) { const h = part[part.length - 1]; if (h.y < 850) { S.glow(c, h.x, h.y, 60, '#ffffff', 0.5 * a); u.dab(c, h.x, h.y, 7, '#ffffff', 0.9 * a, 0.6); } }
    }
    function arrow(x, y, ang, a = 1) {
      if (a <= 0.01) return;
      const ca = Math.cos(ang), sa = Math.sin(ang), L = 26, Wd = 11;
      const tip = { x, y }, l = { x: x - L * ca + Wd * sa, y: y - L * sa - Wd * ca }, r = { x: x - L * ca - Wd * sa, y: y - L * sa + Wd * ca };
      u.ink(c, [l, tip, r], { w: 3, color: '#d9f7f2', alpha: 0.85 * pa * a, jitter: 0.5, seed: boil * 3 + 13 + ang, taper: 0.3, step: 4 });
    }
    function typed(str, x0, y, p, size, color, glowK, a) {
      if (p <= 0 || a <= 0.01) return;
      const s = u.typed(str, p);
      u.math(c, s, x0, y, { size, color, align: 'left', alpha: a, glow: glowK });
      if (p < 1) { const cw = u.math(S.m, s, 0, 0, { size, alpha: 0 }); S.glow(c, x0 + cw + 6, y, 26, '#fff6d0', 0.5 * a); }
    }
    function volLabel(txt, mth, cx, y, a) {
      if (a <= 0.01) return;
      const wt = u.textW(c, txt, 38, 'sans', 500), wm = u.math(S.m, mth, 0, 0, { size: 50, alpha: 0 });
      const x0 = cx - (wt + wm) / 2;
      u.text(c, txt, x0, y, { size: 38, color: ivory, align: 'left', alpha: a, glow: 8 });
      u.math(c, mth, x0 + wt, y, { size: 50, color: ivory, align: 'left', alpha: a, glow: 14 });
    }
    // front vertical edge: from the lowest projected bottom corner straight up (unaffected by yaw,
    // equally scaled by pitch for both cubes → its on-screen ratio is the true edge ratio)
    function frontVert(Pj, o, s) {
      const cs = [[o[0], o[1], o[2]], [o[0] + s, o[1], o[2]], [o[0] + s, o[1], o[2] + s], [o[0], o[1], o[2] + s]];
      const ps = cs.map(v => Pj(v[0], v[1], v[2]));
      let k = 0; ps.forEach((p, i) => { if (p.y > ps[k].y) k = i; });
      const v = cs[k];
      return { a: ps[k], b: Pj(v[0], v[1] + s, v[2]) };
    }
  },
});
