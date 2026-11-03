/* ============================================================================
   S04 — 메나이크모스의 새로운 발상 (global 120–160 s, local 0–40)
   Hybrid: painted plates D01 → D02 → D03 + camera (slow Ken Burns) + living
   light (lamp flame/pool, window stars twinkling, moon-path sparkle, dust),
   one brief hand-drawn gold "section curve" over the hand-held cone, and a
   translucent teal wireframe cone that rises from the window-sill cone toward
   the frame centre while the room dissolves toward the navy math space (S05).
   No procedural people, no modern coordinates/symbols, no text.

   Timing map (scene-local seconds; global = local + 120):
     0.0–14.2  D01 night study, zoom 1.00→1.10 toward the cones on the table
                 lamp flame + pool (0.095,0.74), window stars twinkle (3 hero
                 stars breathe slowly), faint moon-path sparkle on the sea
                 inside the window, warm dust motes
     3.0–11.5    sub: 시간이 흘러… 새로운 곡선들을 연구했습니다 (engine)
    13.0–14.2    dissolve D01→D02 (1.2 s)
    13.0–27.6  D02 hand + cone close-up, zoom 1.04→1.14 toward the cone
                 big lamp flame (0.158,0.18) + pool + thin smoke, motes
    14.0–21.0    sub: 원뿔을 평면으로 잘랐을 때 나타나는 곡선들 (engine)
    16.4–21.9    gold section curve (cut ⟂ to a generator, tilt ≈ tan 22°)
                 traces itself around the cone (16.4–17.8), holds at ≈0.55 core
                 alpha with a faint 'lighter' halo, fades 20.9–21.9
    23.0–30.5    caption (engine, bottom-left) — his face is back on screen
                 from ≈27.2, so the disclaimer runs mostly over D03
    26.6–27.6    D02 sinks into shadow (multiply) while D03 comes up
    26.8–27.6    dissolve D02→D03 (0.8 s)
    26.8–40.0  D03 window at night, zoom 1.03→1.08, focus drifting DOWN the
                 image (fy 0.55→0.58) so the sill cone RISES in frame
                 (painted cone mid ≈ 796→782 px, base ≈ 868→858 px: above the
                 two-line subtitle backing at y ≈ 893)
                 stars twinkle (upper right), lamp (0.082,0.728), moon-path
                 sparkle on the sea (drawn outside the sky clip)
    30.5–38.8    sub: …그는 질문을 바꾸었습니다 (engine)
    32.0–35.5    the bronze sill cone is cooled toward teal ('color' blend) and
                 a teal bloom ('screen') grows from it + glints + motes
    33.5–38.6    the teal wireframe cone lifts off the sill (starts at the
                 painted cone's size, fov 470·sz → 1500), arcs up toward the
                 centre (960,470), pitch 0.16→0.30 so the base ellipse opens,
                 colour warm-teal → #58e0d0; the sill goes dark as the light
                 leaves it. Room grades teal, navy math layer → 0.85 by 39.2.
    38.6–40.0    steady hold: cone at S05's opening pose. fadeOut 0.3.

   HAND-OFF for S05 (frame at local 40 / global 160):
     navy layer alpha 0.85 over the dark D03 plate (room barely visible),
     cone: u.camera({ yaw: 1.85, pitch: 0.30, dist: 9, fov: 1500, cx: 960,
     cy: 470, target: [0, -1.3, 0] }), u.coneOutline(P, 0.46, 2.6) — exactly
     S05's conePose(1) at t=0 (cx 960, cy 470, fov 1500, S.PITCH 0.3,
     yawAt(0)=1.85, S.s04cone {alpha 0.46, h 2.6}).  If S05 ever sets
     fadeIn: 0, set fadeOut: 0 here for a fully continuous cut.
   ========================================================================== */
ANIM.scene({
  id: 's04', title: '메나이크모스의 새로운 발상',
  start: ANIM.TIMES.s04[0], end: ANIM.TIMES.s04[1],
  mood: t => (t < 30 ? 'ancient' : 'rise'),
  fadeIn: 0.9, fadeOut: 0,

  init(api, S) {
    const { u, W, H } = api; const P = ANIM.paint;
    S.beats = [
      { id: 'D01', t0: 0.0, t1: 14.2, fade: 1.0 },
      { id: 'D02', t0: 13.0, t1: 27.6, fade: 1.2 },
      { id: 'D03', t0: 26.8, t1: 40.0, fade: 0.8 },
    ];
    S.has = { lampFlicker: !!(P && P.lampFlicker), smoke: !!(P && P.smoke), sparkle: !!(P && P.seaSparkle), particles: !!(P && P.particles) };
    // navy math space (for the hand-off dissolve at the end) — built once
    S.navy = u.layer(W, H, c => {
      P.sky(c, { preset: 'navyMath', seed: 44, horizon: H * 1.05, clouds: false });
      P.nebula(c, { seed: 53, alpha: 0.8, count: 11, colors: ['#1f3f6e', '#2a2a66', '#1c4d58', '#3a2f66'] });
      P.stars(c, { seed: 61, count: 150, yMax: H, alpha: 0.55 });
      u.paper(c, 0.14);
    });
    // cached big glows (one drawImage per frame instead of large radial fills)
    S.tealL = u.layer(900, 900, c => { u.glow(c, 450, 450, 440, '#58e0d0', 0.55); u.glow(c, 450, 450, 180, '#bffff5', 0.5); });
    S.warmL = u.layer(900, 900, c => { u.glow(c, 450, 450, 440, '#ffb640', 0.5); u.glow(c, 450, 450, 190, '#ffd98a', 0.4); });
    // deterministic twinkling stars (positions in 0..1 of a box)
    const mkStars = (seed, n) => { const r = u.rng(seed); const o = []; for (let i = 0; i < n; i++) o.push({ x: r(), y: r(), ph: r() * 6.28, f: 0.6 + r() * 1.6, s: 0.6 + r() * 1.0 }); return o; };
    S.starsD01 = mkStars(71, 14);
    // three 'hero' stars in the D01 window that breathe slowly enough to be seen during the 8 s subtitle
    S.heroD01 = [{ x: 0.30, y: 0.16, ph: 0.4, f: 0.45, s: 1.0 }, { x: 0.63, y: 0.07, ph: 2.6, f: 0.6, s: 1.15 }, { x: 0.82, y: 0.30, ph: 4.4, f: 0.7, s: 0.9 }];
    S.starsD03 = mkStars(73, 26);
    // the teal cone (apex at origin, opens toward -y) — S05 reads the same numbers back (S.s04cone)
    S.cone = { alpha: 0.46, h: 2.6 };
  },

  draw(api, t, S) {
    const { ctx: c, u, W, H } = api; const P = ANIM.paint; const E = u.ease; const boil = api.boil;

    /* ------------------------------------------------- global envelopes */
    const kT = E.io(u.seg(t, 32, 35.5));          // teal bloom on the sill cone
    const kRise = E.io(u.seg(t, 33.5, 38.6));     // the wireframe cone lifts off and settles at centre
    const kNavy = 0.85 * E.io(u.seg(t, 35, 39.2)); // navy math space dissolves in

    /* ---------------------------------------------------------- helpers */
    const breathe = (speed, seed) => 0.85 + 0.15 * u.noise2(t * speed + seed * 5.3, seed);
    const layerAt = (L, x, y, s, alpha, mode = 'source-over') => { if (alpha <= 0.002) return; c.save(); c.globalAlpha *= alpha; c.globalCompositeOperation = mode; c.drawImage(L, x - 450 * s, y - 450 * s, 900 * s, 900 * s); c.restore(); };
    // twinkling stars inside a frame box (lighter): slow sinusoidal brightness, 12 fps hold
    const twinkle = (list, box, size, alpha, color = '#fff6dc') => {
      const tq = api.tq; c.save(); c.globalCompositeOperation = 'lighter';
      for (const s of list) {
        const k = 0.5 + 0.5 * Math.sin(tq * s.f + s.ph); const a = alpha * (0.15 + 0.85 * k * k);
        const x = box[0] + s.x * box[2], y = box[1] + s.y * box[3], r = size * s.s * (0.8 + 0.5 * k);
        u.dab(c, x, y, r * 2.6, color, a * 0.35, 0.1); u.dab(c, x, y, r, color, a, 0.5);
      }
      c.restore();
    };
    // lamp: boiling flame + flickering warm pool at a plate point (pool is in px before the flame scale; lampFlicker multiplies pool*scale)
    const lamp = (R, fx, fy, scale, pool, seed, alpha = 1) => {
      const p = u.platePt(R, fx, fy);
      if (S.has.lampFlicker) P.lampFlicker(c, t, { x: p.x, y: p.y, scale, seed, pool, alpha });
      else { u.lamp(c, p.x, p.y - 10 * scale, pool * scale, t, { seed, alpha: 0.3 * alpha }); }
      return p;
    };

    /* ------------------------------------------------------------ beats */
    // D01 — night study: lamp, window stars (+3 hero stars), moonlit sea sparkle, dust (0–14.2)
    function D01(a) {
      const kb = u.kb(t, 0, 14.2, { zoom: 1.0, fx: 0.5, fy: 0.5 }, { zoom: 1.10, fx: 0.44, fy: 0.58 });
      const R = u.plate(c, 'D01', Object.assign(kb, { alpha: a })); if (!R) return;
      const sz = R.w / W;
      c.save(); c.globalAlpha = a;
      // 1. window: twinkling stars + faint moon-path sparkle on the sea (clipped to the window opening)
      const win = [u.platePt(R, 0.595, 0.02), u.platePt(R, 0.905, 0.02), u.platePt(R, 0.905, 0.33), u.platePt(R, 0.595, 0.33)];
      c.save(); u.polyPath(c, win, true); c.clip();
      twinkle(S.starsD01, [win[0].x, win[0].y, win[1].x - win[0].x, 0.19 * R.h], 2.3 * sz, 0.95);
      twinkle(S.heroD01, [win[0].x, win[0].y, win[1].x - win[0].x, 0.19 * R.h], 3.0 * sz, 1.0);
      if (S.has.sparkle) P.seaSparkle(c, t, { horizonY: u.platePt(R, 0, 0.245).y, bottom: u.platePt(R, 0, 0.31).y, seed: 5, count: 14, x: u.platePt(R, 0.70, 0).x, spread: 0.05 * R.w, alpha: 0.4, color: '#dfe9ff' });
      c.restore();
      // 2. the clay lamp: boiling flame + warm pool breathing over the table and his hands
      const lp = lamp(R, 0.095, 0.745, 1.35 * sz, 300, 31, 0.85);
      layerAt(S.warmL, lp.x + 0.06 * R.w, lp.y - 0.05 * R.h, 0.9 * sz * breathe(6, 3), 0.22);
      // 3. warm dust drifting in the lamplight
      u.motes(c, t, { count: 26, box: [R.x + 0.02 * R.w, R.y + 0.45 * R.h, 0.5 * R.w, 0.5 * R.h], seed: 9, color: '#ffe3a0', size: 2.2 * sz, speed: 0.45, alpha: 0.3, drift: 0.7 });
      u.grade(c, '#ffd9a0', 0.06);
      c.restore();
    }

    // D02 — hand holding the cone: big lamp flame, thin smoke, motes, gold section curve (13–27.6)
    function D02(a) {
      const kb = u.kb(t, 13, 27.6, { zoom: 1.04, fx: 0.42, fy: 0.42 }, { zoom: 1.14, fx: 0.39, fy: 0.40 });
      const R = u.plate(c, 'D02', Object.assign(kb, { alpha: a })); if (!R) return;
      const sz = R.w / W;
      c.save(); c.globalAlpha = a;
      // 1. lamp: boiling flame sitting on the painted wick + flickering pool; a thread of smoke above
      const lp = lamp(R, 0.158, 0.18, 1.7 * sz, 260, 37, 0.8);
      if (S.has.smoke) P.smoke(c, t, { x: lp.x + 4 * sz, y: lp.y - 0.15 * R.h, seed: 41, scale: 0.55 * sz, alpha: 0.16, color: '#d9d0c8', count: 6, rise: 0.22 * R.h, wind: 0.35 });
      // 2. dust motes in the lamplight
      u.motes(c, t, { count: 22, box: [R.x, R.y + 0.05 * R.h, 0.7 * R.w, 0.7 * R.h], seed: 13, color: '#ffe3a0', size: 2.4 * sz, speed: 0.4, alpha: 0.26, drift: 0.6 });
      // 3. the imagined cut: a faint gold curve traces itself around the cone, holds, fades (16.4–21.9)
      goldCurve(R, sz);
      u.grade(c, '#ffd9a0', 0.05);
      // 4. the hands sink into shadow during the last second so the D03 dissolve is a dip, not a double exposure
      const kDip = E.io(u.seg(t, 26.6, 27.6)); if (kDip > 0) u.grade(c, '#1b2447', 0.4 * kDip, 'multiply');
      c.restore();
    }

    // the brief gold section-curve overlay over the hand-held cone (image-fraction geometry; approximate placement is fine)
    function goldCurve(R, sz) {
      const kIn = E.out(u.seg(t, 16.4, 17.8)), kOut = 1 - E.io(u.seg(t, 20.9, 21.9)); if (kIn <= 0 || kOut <= 0) return;
      const A = u.platePt(R, 0.327, 0.262), B = u.platePt(R, 0.392, 0.478);       // apex → base centre (painted cone axis)
      let dx = B.x - A.x, dy = B.y - A.y; const L = Math.hypot(dx, dy) || 1; dx /= L; dy /= L; const nx = -dy, ny = dx;
      const f = 0.52;                                                               // cut at 52 % of the height (the lower end clears the fingers)
      const C = { x: A.x + dx * L * f, y: A.y + dy * L * f };
      const w = 0.058 * R.w * f, k = 0.46;                                          // half-width at the cut centre (glow radius), foreshortening of the ellipse
      const tilt = 0.40;                                                            // ≈ tan(half-angle): the cut is ⟂ to a generator, as in Menaechmus (S05)
      // across-axis radius follows the cone surface: the end that sits lower on the axis is wider
      const pt = th => { const s = f + (w * tilt * Math.cos(th)) / L; const r = 0.058 * R.w * s; const ax = r * k * Math.sin(th) + w * tilt * Math.cos(th); return { x: C.x + nx * r * Math.cos(th) + dx * ax, y: C.y + ny * r * Math.cos(th) + dy * ax }; };
      const n = 48; const near = [], far = [];
      for (let i = 0; i <= n; i++) near.push(pt((i / n) * Math.PI));              // sin>0: side toward the base (facing us)
      for (let i = 0; i <= n; i++) far.push(pt(Math.PI + (i / n) * Math.PI));
      // trace progressively: near half first, then the far (hidden) half
      const pN = u.clamp(kIn * 1.6), pF = u.clamp(kIn * 1.6 - 0.6);
      const sl = (arr, p) => arr.slice(0, Math.max(2, Math.round(p * (arr.length - 1)) + 1));
      const gold = '#f3d27a', alpha = 0.55 * kOut;
      c.save(); c.globalCompositeOperation = 'lighter';
      u.glow(c, C.x, C.y, w * 1.8, '#f3d27a', 0.2 * kIn * kOut * breathe(3, 9));
      if (pN > 0.02) u.ink(c, sl(near, pN), { w: 22 * sz, color: u.alpha(gold, 0.12), jitter: 0.6, seed: boil * 3 + 11, taper: 0, step: 4 });
      c.restore();
      if (pN > 0.02) { u.ink(c, sl(near, pN), { w: 5 * sz, color: gold, alpha, jitter: 0.7, seed: boil * 3 + 11, taper: 0.15, step: 4 }); u.ink(c, sl(near, pN), { w: 1.8 * sz, color: '#fff3c4', alpha: alpha * 0.85, jitter: 0.5, seed: boil * 3 + 12, taper: 0.15, step: 4 }); }
      if (pF > 0.02) u.ink(c, sl(far, pF), { w: 3 * sz, color: gold, alpha: alpha * 0.45, jitter: 0.7, seed: boil * 3 + 13, taper: 0.15, step: 4 });
    }

    // D03 — looking up at the stars; the sill cone cools to teal and blooms; returns the sill point for the hand-off (26.8–40)
    function D03(a) {
      // focus drifts DOWN the image so the painted sill cone rises in frame (stays above the subtitle band)
      const kb = u.kb(t, 26.8, 40, { zoom: 1.03, fx: 0.5, fy: 0.55 }, { zoom: 1.08, fx: 0.55, fy: 0.58 });
      const R = u.plate(c, 'D03', Object.assign(kb, { alpha: a })); if (!R) return null;
      const sz = R.w / W;
      c.save(); c.globalAlpha = a;
      // 1. night sky: twinkling stars (upper right, between the pillars), then the moon path on the sea (outside the sky clip)
      const sky = [u.platePt(R, 0.47, 0.0), u.platePt(R, 0.90, 0.0), u.platePt(R, 0.90, 0.56), u.platePt(R, 0.47, 0.56)];
      c.save(); u.polyPath(c, sky, true); c.clip();
      twinkle(S.starsD03, [sky[0].x, sky[0].y, sky[1].x - sky[0].x, 0.42 * R.h], 1.6 * sz, 0.85);
      c.restore();
      if (S.has.sparkle) P.seaSparkle(c, t, { horizonY: u.platePt(R, 0, 0.575).y, bottom: u.platePt(R, 0, 0.66).y, seed: 7, count: 22, x: u.platePt(R, 0.735, 0).x, spread: 0.06 * R.w, alpha: 0.45, color: '#dfe9ff' });
      // 2. the small lamp on the shelf (left)
      lamp(R, 0.082, 0.728, 1.0 * sz, 220, 43, 0.8);
      u.motes(c, t, { count: 14, box: [R.x, R.y + 0.4 * R.h, 0.3 * R.w, 0.5 * R.h], seed: 15, color: '#ffe3a0', size: 2.0 * sz, speed: 0.4, alpha: 0.25, drift: 0.6 });
      // 3. teal light blooming from the bronze cone on the sill (32→); the energy leaves the sill as the wireframe rises
      const cp = u.platePt(R, 0.69, 0.75); const kSill = kT * (1 - 0.75 * kRise);
      if (kT > 0) {
        const br = 0.9 + 0.1 * Math.sin(t * 2.3);
        // cool the bronze toward teal first (hue/colour blend), so the glow reads teal and not gold
        c.save(); c.globalCompositeOperation = 'color'; u.glow(c, cp.x, cp.y - 0.02 * R.h, 0.09 * R.w, '#58e0d0', 0.5 * kT); c.restore();
        layerAt(S.tealL, cp.x, cp.y - 0.03 * R.h, (0.35 + 0.55 * kT) * sz * br, (0.25 + 0.55 * kT) * br * (1 - 0.75 * kRise), 'screen');
        if (S.has.particles) P.particles(c, t, { kind: 'glint', count: 12, box: [cp.x - 0.12 * R.w, cp.y - 0.28 * R.h, 0.24 * R.w, 0.32 * R.h], seed: 67, size: 1.0 * sz, speed: 0.7, alpha: 0.7 * kSill, color: '#bffff5' });
        u.motes(c, t, { count: 30, box: [cp.x - 0.14 * R.w, cp.y - 0.45 * R.h, 0.28 * R.w, 0.5 * R.h], seed: 69, color: '#9ff5ea', size: 2.4 * sz, speed: 0.8, alpha: 0.5 * kSill, drift: 0.8 });
      }
      c.restore();
      return { sill: u.platePt(R, 0.692, 0.745), sz };   // mid-height of the painted bronze cone (apex ≈0.675, base ≈0.81)
    }

    const FN = { D01, D02, D03 };

    /* ------------------------------------------------- beat sequencing */
    let drawn = 0, sillInfo = null;
    for (const b of S.beats) {
      if (t < b.t0 || t > b.t1) continue;
      const a = drawn === 0 ? 1 : E.sine(u.seg(t, b.t0, b.t0 + b.fade));
      if (a <= 0.001) continue;
      const r = FN[b.id](a); drawn++;
      if (b.id === 'D03' && r) sillInfo = r;
    }
    if (!drawn) { c.fillStyle = '#101a33'; c.fillRect(0, 0, W, H); }

    /* ----------------------------------- hand-off: navy space + rising teal cone (33.5–40) */
    if (kRise > 0 && sillInfo) {
      const { sill, sz: ssz } = sillInfo;
      // the room cools toward the math space
      u.grade(c, '#58e0d0', 0.12 * kRise, 'soft-light');
      if (kNavy > 0.002) { c.save(); c.globalAlpha = kNavy; c.drawImage(S.navy, 0, 0); c.restore(); }
      // the physical model goes dark and cool as the light leaves it
      c.save(); c.globalCompositeOperation = 'multiply'; u.glow(c, sill.x, sill.y, 0.075 * W * ssz, '#1b2447', 0.5 * kRise); c.restore();
      // the model lifts off the sill, arcs up through his gaze line, grows and tips toward the viewer as it becomes the idea
      // starts over the painted cone at (nearly) its size; ends exactly at S05's opening pose (cx 960, cy 470, fov 1500, pitch 0.3)
      const cx = u.lerp(sill.x, W * 0.5, kRise), cy = u.lerp(sill.y, 470, kRise) - 55 * Math.sin(Math.PI * kRise);
      const fov = u.lerp(470 * ssz, 1500, kRise), yaw = 1.85, pitch = u.lerp(0.16, 0.30, kRise);
      const { alpha: ca, h } = S.cone;
      const Pj = u.camera({ yaw, pitch, dist: 9, fov, cx, cy, target: [0, -h * 0.5, 0] });
      const co = u.coneOutline(Pj, ca, h, [0, 0, 0], 96);
      const kA = E.out(u.seg(t, 33.5, 35.5));
      const col = P.mix('#9fe8c8', '#58e0d0', kRise);                 // inherits the model's warm teal, cools to the math teal
      const baseC = Pj(0, -h, 0);
      c.save(); c.globalAlpha = kA;
      // body: additive gradient (bright at the apex, almost nothing at the base) gives it volume instead of a flat tint
      c.save(); c.globalCompositeOperation = 'lighter';
      c.fillStyle = u.grad(c, co.apex2d.x, co.apex2d.y, baseC.x, baseC.y, [[0, u.alpha(col, 0.30)], [1, u.alpha(col, 0.06)]]);
      u.polyPath(c, co.outline, true); c.fill();
      c.fillStyle = u.alpha(col, 0.08); u.polyPath(c, co.ring, true); c.fill();
      c.restore();
      // faint inner rings (hand-drawn): the body has depth and quietly prefigures the S05 cuts
      [0.33, 0.66].forEach((k, i) => { const ring = Pj.pts(u.coneRing(ca, -h * k, 48)); u.ink(c, ring, { w: 1.6, color: '#9ff5ea', alpha: 0.18, jitter: 1.0, seed: boil * 5 + 30 + i, taper: 0, step: 5, closed: true }); });
      // silhouette: far arc fainter (behind), near arc + generators as boiling glow lines (heavier so the boil survives 960 px)
      const j = 1.2;
      u.ink(c, co.farArc, { w: 2.4, color: '#9ff5ea', alpha: 0.35, jitter: j, seed: boil * 5 + 21, taper: 0, step: 5 });
      u.glowLine(c, co.nearArc, { color: col, w: 4.0, halo: 18, alpha: 0.95, seed: boil * 5 + 22, jitter: j });
      u.glowLine(c, [co.apex2d, co.sil[0]], { color: col, w: 4.0, halo: 18, alpha: 0.95, seed: boil * 5 + 23, jitter: j });
      u.glowLine(c, [co.apex2d, co.sil[1]], { color: col, w: 4.0, halo: 18, alpha: 0.95, seed: boil * 5 + 24, jitter: j });
      u.glow(c, co.apex2d.x, co.apex2d.y, 20 + 30 * kRise, '#bffff5', 0.18);
      c.restore();
      u.motes(c, t, { count: 24, box: [cx - 260, cy - 320, 520, 640], seed: 77, color: '#9ff5ea', size: 2.4, speed: 0.5, alpha: 0.35 * kRise, drift: 0.8 });
    }
  },
});
