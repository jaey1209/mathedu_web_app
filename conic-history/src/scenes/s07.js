/* ============================================================================
   S07 — 수수께끼에서 수학의 새로운 세계로  (global 240–272 s, local 0–32)
   Hybrid finale. Painted plates G01 → G02 (Apollonius) with slow Ken Burns and
   living light, a dissolve into the navy math space where ONE modern double
   cone is cut by three different planes (exact u.coneSection, double:true),
   the three sections flattened side by side (u.planeBasis), gathered into one
   glowing cone that becomes the glowing cone-lamp of the P01 title card.
   No procedural people. All drawn lines boil (seed = api.boil). fadeOut: 0.

   Timing map (scene-local seconds; global = local + 240):
     0.0– 5.6  G01 scroll library: zoom 1.00→1.08 toward the papyrus. "Hours
               passing": the shaft overlay (aligned to the painted fan of rays,
               (0.40,0.02)→(0.64,0.56)) eases 0.16→0.06, a soft sun patch slides
               along the floor (0.45,0.62)→(0.68,0.66), grade cool→amber
     2.0– 7.8    sub: 이후 아폴로니오스는 … 발전시켰습니다 (engine)
     4.4– 5.6    dissolve G01→G02 (1.2 s)
     4.4– 9.6  G02 Apollonius with the double-cone papyrus: zoom 1.02→1.10
               toward the sheet; sea sparkle on the bay (window, y 0.355–0.43)
               + gulls in the sky, warm dust
     8.6– 9.6    dissolve G02 → navy math space (1.0 s)
     9.0–16.5    sub: 타원, 포물선, 쌍곡선이라는 이름도 … 정착되었습니다 (engine)
     9.2–10.2  modern double cone fades in at (870,470), slow yaw 0.11 rad/s
    10.0–19.1  top caption 하나의 원뿔 · 서로 다른 평면 (y=72)
     9.6–12.4  BEAT 타원     plane oblique to the axis (normal 32° off axis)
    12.4–15.2  BEAT 포물선   plane parallel to a generator (vertex on the front
                            one); the parallel generator is shown dashed gold
    15.2–18.6  BEAT 쌍곡선   plane parallel to the axis, both nappes → two branches
               (beat-local τ: 0.05–0.95 plane slides in ⟂ the axis from screen
                right, 0.95–1.85 section draws (far part fainter), 0.9–1.4 the
                name lands in the right-hand column and HOLDS; at the beat end
                the plane fades in 0.3 s and the name dims to 0.4 so the three
                names accumulate (타원 / 포물선 / 쌍곡선 at y 300/440/580);
                the hyperbola holds until the cone fades)
    18.9–19.9  cone (+ column labels) fade
    19.7–21.2  three flattened sections rise in equal 520×340 panels at slots
               400/960/1520 (staggered 0.25 s)
    19.0–24.5    sub: 하나의 수수께끼에서 시작된 탐구는 … 열었습니다 (engine)
    20.6–21.3  panel labels 타원 · 포물선 · 쌍곡선 (+ how each plane was placed)
    22.0–22.6  panel labels fade
    22.3–24.6  GATHER: frames vanish in 0.5 s, each curve (staggered 0.2 s)
               turns teal→gold, arcs toward the lamp point and dissolves into a
               gold glow that has been growing there since 22.3; the gold cone
               rises out of that glow from 23.2 (= the P01 cone-lamp, match cut)
               with a frame-wide warm bloom; glints spike as the curves land
    24.0–25.2  dissolve to P01 (twilight desk, glowing cone) while the cone keeps
               growing: zoom 1.00→1.05 over 24.6–32; lamp flame (0.103,0.735),
               cone-lamp breathing (0.74,0.69), sun-path sparkle on the sea,
               twinkling stars (sky band only, y < 0.16 of the plate)
    25.4–28.3  centre phrase  하나의 질문이, 새로운 수학을 탄생시켰다.
    28.3–32.0  title 《이차곡선의 탄생》 (serif, gold glow) + overline
               신탁이 남긴 수수께끼 + hand-inked gold rule — holds (fadeOut 0)
   ========================================================================== */
ANIM.scene({
  id: 's07', title: '수수께끼에서 수학의 새로운 세계로',
  start: ANIM.TIMES.s07[0], end: ANIM.TIMES.s07[1],
  mood: 'finale',
  fadeIn: 0.9, fadeOut: 0,

  init(api, S) {
    const { u, W, H } = api; const P = ANIM.paint; const DEG = Math.PI / 180;
    S.has = { flame: !!(P && P.flame), lampFlicker: !!(P && P.lampFlicker), smoke: !!(P && P.smoke), sparkle: !!(P && P.seaSparkle), particles: !!(P && P.particles), birds: !!(P && P.birds), shaft: !!(P && P.lightShaft) };

    /* ---------------------------------------------------- navy math space */
    S.navy = u.layer(W, H, c => {
      P.sky(c, { preset: 'navyMath', seed: 77, horizon: H * 1.05, clouds: false });
      P.nebula(c, { seed: 83, alpha: 0.8, count: 12, colors: ['#1f3f6e', '#2a2a66', '#1c4d58', '#3a2f66'] });
      P.stars(c, { seed: 89, count: 150, yMax: H, alpha: 0.55 });
      u.paper(c, 0.14);
    });
    const mkStars = (seed, n, ymax = 1) => { const r = u.rng(seed); const o = []; for (let i = 0; i < n; i++) o.push({ x: r(), y: r() * ymax, ph: r() * 6.28, f: 0.5 + r() * 1.4, s: 0.6 + r() }); return o; };
    S.twk = mkStars(97, 30, 0.85);          // math-space twinkle (frame fractions)
    S.starsP01 = mkStars(101, 20);          // title-card sky twinkle (box fractions)
    // cached glow sprites (one drawImage instead of a big radial fill per call); ry = vertical radius (default r)
    S.spr = {};
    const mkSprite = color => u.layer(256, 256, cc => { const g = cc.createRadialGradient(128, 128, 0, 128, 128, 128); g.addColorStop(0, color); g.addColorStop(0.35, u.alpha(color, 0.5)); g.addColorStop(1, u.alpha(color, 0)); cc.fillStyle = g; cc.fillRect(0, 0, 256, 256); });
    S.glow = (c, x, y, r, color, alpha = 0.6, mode = null, ry = r) => {
      let s = S.spr[color]; if (!s) s = S.spr[color] = mkSprite(color);
      c.save(); c.globalAlpha *= alpha; if (mode) c.globalCompositeOperation = mode; c.drawImage(s, x - r, y - ry, r * 2, ry * 2); c.restore();
    };
    for (const col of ['#bffff5', '#ffc868', '#fff0c0', '#f3d27a', '#ffd9a0']) S.spr[col] = mkSprite(col);   // pre-warm: draw() never allocates

    /* ------------------------------------------------------------ vectors */
    const V = { add: (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k], dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], norm: a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }, scale: (a, k) => [a[0] * k, a[1] * k, a[2] * k] };
    S.V = V;

    /* ------------------------------------------------ the modern double cone */
    S.cone = { alpha: 30 * DEG, h: 2.1, hUp: 2.1 };     // apex at the origin, nappes y∈[-h,0] and [0,hUp]
    S.yawAt = t => 0.9 + 0.11 * t;
    S.PITCH = 0.3; S.DIST = 9; S.FOV = 1300; S.CX = 870; S.CY = 470;
    S.SLOTS = [{ x: 400, y: 450 }, { x: 960, y: 450 }, { x: 1520, y: 450 }];
    S.PWH = 260; S.PHH = 170;                           // one common flat-panel half size (px)
    S.LABX = 1500; S.LABY = [300, 440, 580];            // right-hand name column (accumulating)
    S.G = { x: W * 0.74, y: H * 0.715 };                // gather point = P01 cone-lamp (image fraction 0.74,0.70 at zoom 1)

    /* ----------------------------------------------- beats (exact geometry) */
    S.beats = [
      { id: 'ellipse', name: '타원', desc: '축에 비스듬히 · 모선보다 완만하게', t0: 9.6, t1: 12.4, type: 'ellipse', seed: 100 },
      { id: 'parabola', name: '포물선', desc: '모선과 평행하게', t0: 12.4, t1: 15.2, type: 'parabola', seed: 200 },
      { id: 'hyperbola', name: '쌍곡선', desc: '축과 평행하게 · 두 갈래', t0: 15.2, t1: 18.6, type: 'hyperbola', seed: 300 },
    ];
    const al = S.cone.alpha, h = S.cone.h; const sa = Math.sin(al), ca = Math.cos(al);
    // exact point of generator(th) ∩ plane (apex at the origin); null when parallel
    const sect = (th, pl) => { const dx = sa * Math.cos(th), dy = -ca, dz = sa * Math.sin(th); const n = pl.nrm; const den = n[0] * dx + n[1] * dy + n[2] * dz; if (Math.abs(den) < 1e-9) return null; const tt = (n[0] * pl.p[0] + n[1] * pl.p[1] + n[2] * pl.p[2]) / den; return { x: tt * dx, y: tt * dy, z: tt * dz, th, t: tt }; };
    // open branches end at the last sample inside |y| ≤ hh: add the exact rim crossing (bisection on th) at both ends
    const closeToRim = (branches, pl, hh, n) => {
      const step = 2 * Math.PI / n;
      for (const br of branches) {
        const f = br[0], l = br[br.length - 1]; if (Math.hypot(f.x - l.x, f.y - l.y, f.z - l.z) < 1e-6) continue;   // closed (ellipse)
        const fix = (end, dir) => { const sg = Math.sign(end.t); const inside = q => q && Math.sign(q.t) === sg && Math.abs(q.y) <= hh; if (Math.abs(Math.abs(end.y) - hh) < 1e-9) return null; let lo = end.th, hi = end.th + dir * step; for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2; if (inside(sect(m, pl))) lo = m; else hi = m; } const q = sect(lo, pl); return q && inside(q) ? q : null; };
        const a = fix(f, -1), b = fix(l, 1); if (a) br.unshift(a); if (b) br.push(b);
      }
      return branches;
    };
    for (const b of S.beats) {
      // azimuth whose horizontal direction (cos,0,sin) points toward the camera at mid-beat
      const yawMid = S.yawAt(b.t0 + 1.6); const face = -yawMid - Math.PI / 2;
      let nrm, p;
      if (b.type === 'ellipse') { const th = face + 0.35, ph = 32 * DEG; nrm = [Math.sin(ph) * Math.cos(th), Math.cos(ph), Math.sin(ph) * Math.sin(th)]; p = [0, -1.2, 0]; }
      else if (b.type === 'parabola') { const th = face + 0.55, s = 0.95; nrm = [ca * Math.cos(th), -sa, ca * Math.sin(th)]; p = [s * sa * Math.cos(th), -s * ca, s * sa * Math.sin(th)]; b.genTh = th + Math.PI; }   // plane ∥ generator at azimuth th+π
      else { const th = face + 0.95; nrm = [Math.cos(th), 0, Math.sin(th)]; p = [0.5 * Math.cos(th), 0, 0.5 * Math.sin(th)]; }
      b.plane = { p, nrm };
      b.typeCheck = u.conicType(al, nrm);
      if (b.typeCheck !== b.type) console.warn('S07: conic type mismatch', b.id, b.typeCheck);
      b.branches = closeToRim(u.coneSection({ alpha: al, h, double: true, plane: b.plane, n: 360 }), b.plane, h, 360);
      if (b.type === 'hyperbola' && b.branches.length !== 2) console.warn('S07: hyperbola branch count', b.branches.length);
      // plane basis; in-plane axis direction d = cone axis projected onto the plane (symmetry axis of the conic)
      const B = u.planeBasis(b.plane); b.B = B;
      const a = [0, -1, 0]; const d = V.norm(V.add(a, B.N, -V.dot(a, B.N)));
      const d2 = { x: V.dot(d, B.ex), y: V.dot(d, B.ey) }; let phi = Math.atan2(d2.y, d2.x);
      if (b.type === 'parabola') phi -= Math.PI / 2;                 // parabola: axis → screen-down, i.e. it opens downward like the 3D section (vertex at the top)
      const cph = Math.cos(phi), sph = Math.sin(phi);
      const rot = r => ({ x: r.x * cph + r.y * sph, y: -r.x * sph + r.y * cph });       // rotation by −phi: d → +x (parabola: +y)
      const unrot = q => ({ x: q.x * cph - q.y * sph, y: q.x * sph + q.y * cph });
      const loc2 = b.branches.map(br => br.map(q => rot(B.to2d(q))));
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; loc2.forEach(br => br.forEach(q => { x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); y0 = Math.min(y0, q.y); y1 = Math.max(y1, q.y); }));
      const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2; const pad = Math.min(0.18, 0.12 + 0.04 * (x1 - x0 + y1 - y0) / 2);
      b.loc = loc2.map(br => br.map(q => ({ x: q.x - cx, y: q.y - cy })));
      b.hw = (x1 - x0) / 2 + pad; b.hh = (y1 - y0) / 2 + pad;
      if (b.type === 'hyperbola') { b.hw = Math.min(b.hw, 0.93 * h); b.hh = (y1 - y0) / 2 + 0.06; }   // plane ∥ axis: keep it inside the two rims (its corners stay clear of the caption)
      b.toW = (x, y) => { const q = unrot({ x: x + cx, y: y + cy }); const w = B.to3d(q.x, q.y); return [w.x, w.y, w.z]; };   // local centred → world
      const pe = b.type === 'parabola' ? b.toW(1, 0) : b.toW(0, 1);  // in-plane direction ⟂ the conic axis (local x for the rotated parabola)
      b.slideDir = V.norm(V.add(pe, b.toW(0, 0), -1));
      // flat view: common panel, per-curve scale (the curve fills ~86 % of the panel); hyperbola arms run to the panel edge (h 3.2, clipped)
      const cw = (x1 - x0) / 2, ch = (y1 - y0) / 2;
      b.scaleSlot = Math.min(S.PWH * 0.86 / Math.max(cw, 1e-3), S.PHH * 0.86 / Math.max(ch, 1e-3), 230);
      if (b.type === 'hyperbola') {
        const long = closeToRim(u.coneSection({ alpha: al, h: 3.2, double: true, plane: b.plane, n: 720 }), b.plane, 3.2, 720);
        const lim = { x: S.PWH * 0.97 / b.scaleSlot, y: S.PHH * 0.97 / b.scaleSlot };
        b.flat = long.map(br => br.map(q => { const r = rot(B.to2d(q)); return { x: r.x - cx, y: r.y - cy }; }).filter(q => Math.abs(q.x) <= lim.x && Math.abs(q.y) <= lim.y)).filter(br => br.length > 1);
      } else b.flat = b.loc;
    }
  },

  draw(api, t, S) {
    const { ctx: c, u, W, H } = api; const P = ANIM.paint; const E = u.ease; const boil = api.boil; const V = S.V;
    const TEAL = '#58e0d0', TEAL2 = '#9ff5ea', GOLD = '#f3d27a', GOLD2 = '#ffe9a8', IVORY = '#f6f1e6';
    const breathe = (speed, seed) => 0.85 + 0.15 * u.noise2(t * speed + seed * 5.3, seed);
    const mixHex = (a, b, k) => (P && P.mix) ? P.mix(a, b, k) : (k < 0.5 ? a : b);   // hex-safe mix (u.alpha needs '#hex')

    /* ---------------------------------------------------------- helpers */
    const twinkle = (list, box, size, alpha, color = '#fff6dc', yMax = 1e9) => {
      const tq = api.tq; c.save(); c.globalCompositeOperation = 'lighter';
      for (const s of list) { const k = 0.5 + 0.5 * Math.sin(tq * s.f + s.ph); const a = alpha * (0.15 + 0.85 * k * k); const x = box[0] + s.x * box[2], y = box[1] + s.y * box[3], r = size * s.s * (0.8 + 0.5 * k); if (y > yMax) continue; u.dab(c, x, y, r * 2.6, color, a * 0.35, 0.1); u.dab(c, x, y, r, color, a, 0.5); }
      c.restore();
    };
    const lamp = (R, fx, fy, scale, pool, seed, alpha = 1) => { const p = u.platePt(R, fx, fy); if (S.has.lampFlicker) P.lampFlicker(c, t, { x: p.x, y: p.y, scale, seed, pool, alpha }); else u.lamp(c, p.x, p.y - 10 * scale, pool * scale, t, { seed, alpha: 0.3 * alpha }); return p; };

    /* ============================================================ PLATES */
    // G01 — scroll library: hours passing — shaft overlay aligned to the painted rays, a sun patch creeping along the floor, cool→amber grade (0–5.6)
    function G01(a) {
      const kb = u.kb(t, 0, 5.6, { zoom: 1.0, fx: 0.5, fy: 0.5 }, { zoom: 1.08, fx: 0.47, fy: 0.56 });
      const R = u.plate(c, 'G01', Object.assign(kb, { alpha: a })); if (!R) return;
      const sz = R.w / W; const kT = E.sine(u.seg(t, 0, 5.6));          // hours passing
      c.save(); c.globalAlpha *= a;
      // 1. the painted fan of rays, enriched (same origin/direction as the plate, so no second beam appears)
      const s0 = u.platePt(R, 0.45, -0.12), s1 = u.platePt(R, 0.66, 0.56);   // origin above the frame so the rays have no visible hard start
      const ang = Math.atan2(s1.y - s0.y, s1.x - s0.x), len = Math.hypot(s1.x - s0.x, s1.y - s0.y);
      const br = breathe(0.7, 2); const shA = u.lerp(0.13, 0.05, kT) * br;
      if (S.has.shaft) P.lightShaft(c, { x: s0.x, y: s0.y, angle: ang, width: 95 * sz, length: len, alpha: shA, color: '#ffe6a8', seed: 5, spread: 2.2, flicker: 1 });
      else u.shaft(c, t, s0.x, s0.y, s1.x, s1.y, 40 * sz, 240 * sz, '#ffe6a8', shA, 3);
      // 2. the sun patch on the floor slides as the hours pass (and turns amber)
      const fp = u.platePt(R, u.lerp(0.45, 0.68, kT), u.lerp(0.62, 0.66, kT));
      S.glow(c, fp.x, fp.y, 0.11 * R.w * br, mixHex('#fff0c0', '#ffd9a0', kT), 0.34 * br, 'lighter', 0.035 * R.h * br);
      S.glow(c, fp.x, fp.y, 0.05 * R.w, '#fff0c0', 0.25 * br, 'lighter', 0.016 * R.h);
      // 3. dust drifting in the beam (box around the beam's middle)
      const mid = { x: (s0.x + s1.x) / 2, y: (s0.y + s1.y) / 2 };
      u.motes(c, t, { count: 30, box: [mid.x - 0.14 * R.w, mid.y - 0.3 * R.h, 0.28 * R.w, 0.6 * R.h], seed: 3, color: '#ffe9b8', size: 2.2 * sz, speed: 0.4, alpha: 0.32, drift: 0.7 });
      if (S.has.particles) P.particles(c, t, { kind: 'dust', count: 16, box: [R.x + 0.3 * R.w, R.y + 0.05 * R.h, 0.4 * R.w, 0.6 * R.h], seed: 7, size: 1.1 * sz, speed: 0.5, alpha: 0.35 });
      // 4. the light of the day turns from cool morning to amber afternoon
      u.grade(c, mixHex('#dfe8ff', '#ffb060', kT), 0.05 + 0.13 * kT);
      c.restore();
    }
    // G02 — Apollonius holding the double-cone papyrus: window — sparkle on the bay (left of the temple) + gulls in the sky; warm dust (4.4–9.6)
    function G02(a) {
      const kb = u.kb(t, 4.4, 9.6, { zoom: 1.02, fx: 0.5, fy: 0.5 }, { zoom: 1.10, fx: 0.52, fy: 0.52 });
      const R = u.plate(c, 'G02', Object.assign(kb, { alpha: a })); if (!R) return;
      const sz = R.w / W;
      c.save(); c.globalAlpha *= a;
      const win = [u.platePt(R, 0.0, 0.0), u.platePt(R, 0.235, 0.0), u.platePt(R, 0.235, 0.5), u.platePt(R, 0.0, 0.5)];
      c.save(); u.polyPath(c, win, true); c.clip();
      if (S.has.sparkle) P.seaSparkle(c, t, { horizonY: u.platePt(R, 0, 0.355).y, bottom: u.platePt(R, 0, 0.43).y, seed: 11, count: 14, x: u.platePt(R, 0.05, 0).x, spread: 0.08 * R.w, alpha: 0.5, color: '#fff2d0' });
      if (S.has.birds) P.birds(c, t, { count: 3, seed: 13, box: [win[0].x, u.platePt(R, 0, 0.06).y, 0.2 * R.w, 0.12 * R.h], scale: 0.55 * sz, color: '#3b3558', speed: 0.5, alpha: 0.7 });
      c.restore();
      // warm dust in the sunlit room
      u.motes(c, t, { count: 24, box: [R.x + 0.25 * R.w, R.y + 0.05 * R.h, 0.6 * R.w, 0.7 * R.h], seed: 17, color: '#ffe3a0', size: 2.2 * sz, speed: 0.4, alpha: 0.26, drift: 0.7 });
      u.grade(c, '#ffd9a0', 0.06);
      c.restore();
    }
    // P01 — title card: twilight desk with the glowing cone-lamp (24.2–32)
    function P01(a) {
      const kb = u.kb(t, 24.6, 32.0, { zoom: 1.0, fx: 0.5, fy: 0.5 }, { zoom: 1.05, fx: 0.52, fy: 0.5 });
      const R = u.plate(c, 'P01', Object.assign(kb, { alpha: a })); if (!R) return;
      const sz = R.w / W;
      c.save(); c.globalAlpha *= a;
      // 1. stars twinkle in the deep-blue sky (sky band only — never inside the title overline at y≈218)
      twinkle(S.starsP01, [R.x + 0.3 * R.w, R.y, 0.65 * R.w, 0.16 * R.h], 1.5 * sz, 0.8, '#fff6dc', 176);
      // 2. the setting sun's path sparkles on the sea
      if (S.has.sparkle) P.seaSparkle(c, t, { horizonY: u.platePt(R, 0, 0.645).y, bottom: u.platePt(R, 0, 0.75).y, seed: 19, count: 18, x: u.platePt(R, 0.17, 0).x, spread: 0.07 * R.w, alpha: 0.5, color: '#ffd9a0' });
      // 3. the clay lamp (left) and the breathing cone-lamp (right)
      lamp(R, 0.103, 0.735, 0.85 * sz, 200 * sz, 23, 0.8);
      const cp = u.platePt(R, 0.74, 0.69); const brC = breathe(1.6, 7);
      S.glow(c, cp.x, cp.y, 0.13 * R.w * brC, '#ffc868', 0.3 * brC);
      S.glow(c, cp.x, cp.y + 0.02 * R.h, 0.05 * R.w, '#fff0c0', 0.3 * brC);
      u.motes(c, t, { count: 14, box: [cp.x - 0.08 * R.w, cp.y - 0.2 * R.h, 0.16 * R.w, 0.25 * R.h], seed: 29, color: '#ffe3a0', size: 2.0 * sz, speed: 0.4, alpha: 0.3, drift: 0.6 });
      u.grade(c, '#ffd0a0', 0.05);
      c.restore();
    }

    /* ======================================================== MATH SPACE */
    const cam = (cx, cy, fov, ty, yaw) => u.camera({ yaw: yaw ?? S.yawAt(t), pitch: S.PITCH, dist: S.DIST, fov, cx, cy, target: [0, ty, 0] });
    const flipCam = Pc => { const P2 = (x, y, z) => Pc(x, -y, z); P2.pts = arr => arr.map(p => P2(p.x, p.y, p.z)); P2.o = Pc.o; return P2; };
    // translucent cone (lower nappe + optional upper nappe), nappes drawn far → near
    function drawCone(Pc, K, a, o = {}) {
      if (a <= 0.003) return null;
      const { upAlpha = 1, color = TEAL, color2 = TEAL2, sb = 0, apexGlow = '#bffff5' } = o;
      const one = (co, aa, sd) => {
        c.save(); c.globalAlpha *= aa;
        c.fillStyle = u.alpha(color, 0.20); u.polyPath(c, co.outline, true); c.fill();
        c.fillStyle = u.alpha(color, 0.10); u.polyPath(c, co.ring, true); c.fill();
        u.ink(c, co.farArc, { w: 2.2, color: color2, alpha: 0.35, jitter: 0.7, seed: sd + 1, taper: 0, step: 5 });
        u.glowLine(c, co.nearArc, { color, w: 3.2, halo: 16, alpha: 0.95, seed: sd + 2, jitter: 0.7 });
        u.glowLine(c, [co.apex2d, co.sil[0]], { color, w: 3.2, halo: 16, alpha: 0.95, seed: sd + 3, jitter: 0.7 });
        u.glowLine(c, [co.apex2d, co.sil[1]], { color, w: 3.2, halo: 16, alpha: 0.95, seed: sd + 4, jitter: 0.7 });
        c.restore();
      };
      const co = u.coneOutline(Pc, K.alpha, K.h, [0, 0, 0], 96); let co2 = null;
      if (K.hUp > 0 && upAlpha > 0.003) {
        co2 = u.coneOutline(flipCam(Pc), K.alpha, K.hUp, [0, 0, 0], 96);
        const upFirst = Pc(0, K.hUp, 0).z >= Pc(0, -K.h, 0).z;          // the farther nappe first
        if (upFirst) { one(co2, a * upAlpha, boil * 5 + sb + 20); one(co, a, boil * 5 + sb); }
        else { one(co, a, boil * 5 + sb); one(co2, a * upAlpha, boil * 5 + sb + 20); }
      } else one(co, a, boil * 5 + sb);
      S.glow(c, co.apex2d.x, co.apex2d.y, 70, apexGlow, 0.3 * a);
      return { co, co2 };
    }
    // one cutting beat: plane slides in, section draws (far part fainter); (labels are drawn by drawBeatLabels)
    function drawBeat(b, Pc, tau, kFade) {
      const kSlide = E.out(u.seg(tau, 0.05, 0.95)), kCurve = E.io(u.seg(tau, 0.95, 1.85));
      const planeA = Math.min(1, u.seg(tau, 0.05, 0.4)) * kFade; if (planeA <= 0.003) return;
      // slide along the in-plane direction ⟂ the conic axis (b.slideDir), arriving from screen right for all three beats
      const c0 = b.toW(0, 0), c1 = V.add(c0, b.slideDir); const sx = Pc(c1[0], c1[1], c1[2]).x - Pc(c0[0], c0[1], c0[2]).x; const sgn = sx >= 0 ? 1 : -1;
      const off = V.scale(b.slideDir, sgn * 2.8 * (1 - kSlide));
      const map = (x, y) => { const w = V.add(b.toW(x, y), off); return Pc(w[0], w[1], w[2]); };
      const Q = [map(-b.hw, -b.hh), map(b.hw, -b.hh), map(b.hw, b.hh), map(-b.hw, b.hh)];
      c.save(); c.globalAlpha *= planeA;
      c.fillStyle = u.alpha(GOLD, 0.11); u.polyPath(c, Q, true); c.fill();
      c.globalCompositeOperation = 'lighter'; c.fillStyle = u.alpha(GOLD, 0.05); u.polyPath(c, Q, true); c.fill(); c.globalCompositeOperation = 'source-over';
      u.ink(c, Q, { w: 2.4, color: GOLD2, alpha: 0.6, jitter: 0.8, seed: boil * 3 + b.seed + 7, closed: true, taper: 0, step: 6 });
      c.restore();
      // parabola: the generator the plane is parallel to, dashed gold (from the upper nappe through the apex to beyond the rim)
      if (b.type === 'parabola') {
        const kg = Math.min(E.out(u.seg(tau, 0.3, 0.9)), 1 - E.io(u.seg(tau, 2.3, 2.6))) * kFade;
        if (kg > 0.003) {
          const sa = Math.sin(S.cone.alpha), ca = Math.cos(S.cone.alpha); const g = [sa * Math.cos(b.genTh), -ca, sa * Math.sin(b.genTh)];
          const L0 = -1.0, L1 = S.cone.h / ca + 0.45; const dash = 0.17, gap = 0.1;
          c.save(); c.globalAlpha *= kg;
          for (let s = L0, k = 0; s < L1; s += dash + gap, k++) { const e = Math.min(L1, s + dash); const p0 = Pc(g[0] * s, g[1] * s, g[2] * s), p1 = Pc(g[0] * e, g[1] * e, g[2] * e); u.ink(c, [p0, p1], { w: 2.6, color: GOLD2, alpha: 0.55, jitter: 0.5, seed: boil * 3 + b.seed + 40 + k, taper: 0.3, step: 5 }); }
          c.restore();
        }
      }
      if (kCurve > 0.01) {
        b.branches.forEach((br, bi) => {
          const n = br.length, cnt = Math.max(2, Math.round(kCurve * (n - 1)) + 1);
          const pts = [], far = [];
          for (let i = 0; i < cnt; i++) { const q = br[i]; const sp = Pc(q.x, q.y, q.z); pts.push(sp); far.push(sp.z > Pc(0, q.y, 0).z + 1e-6); }
          const seed = boil * 7 + b.seed + bi * 11;
          // runs of near/far points, overlapped by one point at both ends so there are no bright knots at the silhouette crossings
          let i = 0; while (i < pts.length) { let j = i; while (j + 1 < pts.length && far[j + 1] === far[i]) j++; const run = pts.slice(Math.max(0, i - 1), Math.min(pts.length, j + 2)); if (run.length >= 2) u.glowLine(c, run, { color: TEAL, w: far[i] ? 3 : 4.4, halo: far[i] ? 14 : 22, alpha: kFade * (far[i] ? 0.45 : 1), seed: seed + i, jitter: 0.6 }); i = j + 1; }
        });
      }
    }
    // the accumulating name column: the current beat's name lands at τ 0.9–1.4 and holds; past names stay dimmed
    function drawBeatLabels(kCone) {
      S.beats.forEach((b, i) => {
        if (t < b.t0) return;
        const kIn = E.out(u.seg(t, b.t0 + 0.9, b.t0 + 1.4)); if (kIn <= 0.003) return;
        const last = i === S.beats.length - 1; const kPast = last ? 0 : E.io(u.seg(t, b.t1, b.t1 + 0.35));
        const an = kIn * kCone * u.lerp(1, 0.4, kPast), ad = kIn * kCone * u.lerp(0.9, 0.3, kPast);
        const y = S.LABY[i];
        u.text(c, b.name, S.LABX, y, { size: 64, font: 'serif', weight: 700, color: '#f6d784', alpha: an, glow: 24 * (1 - 0.6 * kPast), glowColor: '#d9a441', spacing: 4 });
        u.text(c, b.desc, S.LABX, y + 58, { size: 34, weight: 500, color: IVORY, alpha: ad });
      });
    }
    // flattened section (plane coordinates) at screen (x,y), scale s px/unit, in the common panel (plane alpha) — color for the teal→gold gather
    function drawFlat(b, x, y, s, alpha, o = {}) {
      const { plane = 1, glow = 0, color = TEAL } = o; if (alpha <= 0.003 || s <= 0.5) return;
      c.save(); c.globalAlpha *= alpha;
      if (plane > 0.003) {
        const Q = [{ x: x - S.PWH, y: y - S.PHH }, { x: x + S.PWH, y: y - S.PHH }, { x: x + S.PWH, y: y + S.PHH }, { x: x - S.PWH, y: y + S.PHH }];
        c.save(); c.globalAlpha *= plane; c.fillStyle = u.alpha(GOLD, 0.09); u.polyPath(c, Q, true); c.fill();
        u.ink(c, Q, { w: 2.2, color: GOLD2, alpha: 0.5, jitter: 0.8, seed: boil * 3 + b.seed + 9, closed: true, taper: 0, step: 6 }); c.restore();
      }
      if (glow > 0.003) S.glow(c, x, y, S.PWH * 1.15, GOLD, 0.14 * glow * breathe(1.2, b.seed));
      const kw = Math.min(1, s / 120);
      b.flat.forEach((br, bi) => { const pts = br.map(q => ({ x: x + q.x * s, y: y + q.y * s })); u.glowLine(c, pts, { color, w: Math.max(1.6, 4.2 * kw), halo: Math.max(6, 22 * kw), alpha: 1, seed: boil * 7 + b.seed + bi * 11, jitter: 0.6, closed: b.type === 'ellipse' }); });
      c.restore();
    }

    function mathSpace(aAll) {
      if (aAll <= 0.003) return;
      c.save(); c.globalAlpha *= aAll;
      c.drawImage(S.navy, 0, 0);
      { const tq = api.tq; c.save(); c.globalCompositeOperation = 'lighter'; for (const s of S.twk) { const k = 0.5 + 0.5 * Math.sin(tq * s.f + s.ph); const a = 0.7 * (0.1 + 0.9 * k * k); const x = s.x * W, y = s.y * H, r = 1.6 * s.s * (0.8 + 0.5 * k); u.dab(c, x, y, r * 2.6, '#fff6dc', a * 0.3, 0.1); u.dab(c, x, y, r, '#fff6dc', a, 0.5); } c.restore(); }
      u.motes(c, t, { count: 26, box: [0, 0, W, H * 0.85], seed: 5, color: TEAL2, size: 2.2, speed: 0.35, alpha: 0.22, drift: 0.7 });

      /* ---- 9.2–19.9: the double cone and the three cutting beats ---- */
      const kCone = Math.min(E.out(u.seg(t, 9.2, 10.2)), 1 - E.io(u.seg(t, 18.9, 19.9)));
      if (kCone > 0.003) {
        const Pc = cam(S.CX, S.CY, S.FOV, 0);
        drawCone(Pc, S.cone, kCone, { upAlpha: 1, sb: 0 });
        for (const b of S.beats) {
          if (t < b.t0 || t >= b.t1 + 0.6) continue;
          const tau = t - b.t0; const last = b === S.beats[2];
          const kFade = last ? kCone : 1 - E.io(u.seg(tau, b.t1 - b.t0 - 0.3, b.t1 - b.t0));
          drawBeat(b, Pc, tau, kFade);
        }
        drawBeatLabels(kCone);
        const kTop = Math.min(E.out(u.seg(t, 10.0, 10.8)), 1 - E.io(u.seg(t, 18.5, 19.1)));
        if (kTop > 0) u.text(c, '하나의 원뿔 · 서로 다른 평면', 960, 72, { size: 40, weight: 600, color: IVORY, alpha: 0.85 * kTop, glow: 10, glowColor: '#58e0d0', spacing: 2 });
      }

      /* ---- 19.7–24.6: three flattened sections side by side → gather into one gold cone ---- */
      const kLab = Math.min(E.out(u.seg(t, 20.6, 21.3)), 1 - E.io(u.seg(t, 22.0, 22.6)));
      // the glow the curves will land in — present before the cone, growing with it
      const kGl = E.out(u.seg(t, 22.3, 23.8)); const kC = E.out(u.seg(t, 23.2, 24.6));
      if (kGl > 0.003) {
        S.glow(c, S.G.x, S.G.y - 60, (120 + 420 * kGl) * breathe(1.5, 11), '#ffc868', 0.42 * kGl);
        S.glow(c, S.G.x, S.G.y - 30, (50 + 140 * kGl), '#fff0c0', 0.4 * kGl * breathe(3, 13));
      }
      for (let i = 0; i < 3; i++) {
        const b = S.beats[i]; const sl = S.SLOTS[i];
        const aIn = E.out(u.seg(t, 19.7 + i * 0.25, 20.7 + i * 0.25)); if (aIn <= 0) continue;
        const kG = E.io(u.seg(t, 22.3 + i * 0.2, 24.0 + i * 0.2));
        const sc = b.scaleSlot * (0.9 + 0.1 * aIn);
        const x = u.lerp(sl.x, S.G.x, kG), y = u.lerp(sl.y, S.G.y - 90, kG) - 120 * Math.sin(Math.PI * kG), s = u.lerp(sc, sc * 0.25, kG), al = aIn * (1 - E.in(kG));
        drawFlat(b, x, y, s, al, { plane: Math.max(0, 1 - kG * 4), glow: 0.9 * Math.max(0, 1 - kG * 2), color: mixHex(TEAL, GOLD, Math.min(1, kG * 1.3)) });
        if (kLab > 0) {
          u.text(c, b.name, sl.x, 700, { size: 56, font: 'serif', weight: 700, color: '#f6d784', alpha: kLab, glow: 24, glowColor: '#d9a441', spacing: 4 });
          u.text(c, b.desc, sl.x, 760, { size: 34, weight: 500, color: IVORY, alpha: 0.9 * kLab });
        }
      }
      // the gathering cone: gold-glowing, apex up, rising out of the glow where the P01 cone-lamp will be (match cut)
      if (kC > 0.003) {
        const K = { alpha: 23.5 * Math.PI / 180, h: 2.45, hUp: 0 };
        const Pg = u.camera({ yaw: 0.4 + 0.3 * (t - 23.2), pitch: 0.2, dist: 9, fov: 1500 * (0.55 + 0.45 * kC), cx: S.G.x, cy: S.G.y - 40, target: [0, -1.15, 0] });
        S.glow(c, S.G.x, S.G.y - 60, 1300, '#ffc868', 0.2 * kC, 'lighter');                  // frame-wide warm bloom: light itself fills the frame
        drawCone(Pg, K, kC, { color: GOLD, color2: GOLD2, sb: 500, apexGlow: '#fff0c0' });
        const spike = Math.exp(-Math.pow((t - 24.05) / 0.4, 2));                              // glints spike as the curves land (kG≈0.9)
        if (S.has.particles) P.particles(c, t, { kind: 'glint', count: 14 + Math.round(16 * spike), box: [S.G.x - 260, S.G.y - 360, 520, 460], seed: 37, size: 1.0 + 0.6 * spike, speed: 0.7, alpha: Math.min(1, 0.8 * kC + 0.7 * spike), color: '#fff0c0' });
        u.motes(c, t, { count: 24, box: [S.G.x - 200, S.G.y - 380, 400, 420], seed: 41, color: '#ffe3a0', size: 2.4, speed: 0.8, alpha: 0.5 * kC, drift: 0.8 });
      }
      c.restore();
    }

    /* ======================================================= SEQUENCING */
    if (t < 5.6) G01(1);
    if (t >= 4.4 && t < 9.6) G02(t < 5.6 ? E.sine(u.seg(t, 4.4, 5.6)) : 1);
    if (t >= 8.6 && t < 25.2) mathSpace(t < 9.6 ? E.sine(u.seg(t, 8.6, 9.6)) : 1);
    if (t >= 24.0) P01(t < 25.2 ? E.sine(u.seg(t, 24.0, 25.2)) : 1);

    /* ------------------------------------------------- title card text */
    if (t >= 25.4) {
      const kPh = Math.min(E.out(u.seg(t, 25.4, 26.3)), 1 - E.io(u.seg(t, 27.7, 28.3)));
      if (kPh > 0) u.text(c, '하나의 질문이, 새로운 수학을 탄생시켰다.', 960, 330, { size: 54, font: 'serif', weight: 700, color: '#f6e9c8', alpha: kPh, glow: 24, glowColor: '#d9a441', spacing: 3 });
      const kT = E.out(u.seg(t, 28.3, 29.6));
      if (kT > 0) {
        const y = 310 + 18 * (1 - kT);
        u.text(c, '《이차곡선의 탄생》', 960 + 3, y + 4, { size: 96, font: 'serif', weight: 700, color: '#000', alpha: 0.45 * kT, spacing: 6 });
        u.text(c, '《이차곡선의 탄생》', 960, y, { size: 96, font: 'serif', weight: 700, color: '#f6d784', alpha: kT, glow: 40, glowColor: '#ffb640', spacing: 6 });
      }
      const kO = E.out(u.seg(t, 29.0, 30.0));
      if (kO > 0) u.text(c, '신탁이 남긴 수수께끼', 960, 218, { size: 38, font: 'serif', weight: 500, color: '#f6e9c8', alpha: 0.9 * kO, glow: 14, glowColor: '#d9a441', spacing: 8 });
      const kR = E.out(u.seg(t, 29.4, 30.4));
      if (kR > 0) {
        const hw = 300 * kR; const pts = [{ x: 960 - hw, y: 392 }, { x: 960 - hw * 0.5, y: 390 }, { x: 960, y: 391 }, { x: 960 + hw * 0.5, y: 390 }, { x: 960 + hw, y: 392 }];
        u.ink(c, pts, { w: 3.4, color: GOLD2, alpha: 0.95, jitter: 0.7, seed: boil * 3 + 77, taper: 0.7, step: 5 });
      }
    }
  },
});
