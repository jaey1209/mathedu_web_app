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
                 lamp flame + pool (0.095,0.74), window stars twinkle, sea sparkle
                 in the window, warm dust motes
     3.0–11.5    sub: 시간이 흘러… 새로운 곡선들을 연구했습니다 (engine)
    13.0–14.2    dissolve D01→D02 (1.2 s)
    13.0–30.6  D02 hand + cone close-up, zoom 1.04→1.14 toward the cone
                 big lamp flame (0.16,0.17) + pool + thin smoke, motes
    14.0–21.0    sub: 원뿔을 평면으로 잘랐을 때 나타나는 곡선들 (engine)
    16.4–21.9    gold section curve traces itself around the cone (16.4–17.8),
                 holds at ≈0.3 alpha with a faint sheen, fades 20.9–21.9
    23.0–30.5    caption (engine, bottom-left)
    29.4–30.6    dissolve D02→D03 (1.2 s)
    29.4–40.0  D03 window at night, zoom 1.00→1.08 toward the sky/cone
                 stars twinkle (upper right), lamp (0.08,0.72), moon path sparkle
    30.5–38.8    sub: …그는 질문을 바꾸었습니다 (engine)
    32.0–40.0    teal light blooms from the sill cone (0.69,0.75)
    34.5–40.0    translucent teal wireframe cone rises from the sill cone to the
                 centre (y≈470), growing, slow yaw; room grades teal and the
                 navy math layer dissolves in (→0.6 at 40) — hand-off to S05
   ========================================================================== */
ANIM.scene({
  id: 's04', title: '메나이크모스의 새로운 발상',
  start: ANIM.TIMES.s04[0], end: ANIM.TIMES.s04[1],
  mood: t => (t < 30 ? 'ancient' : 'rise'),
  fadeIn: 0.9, fadeOut: 0.9,

  init(api, S) {
    const { u, W, H } = api; const P = ANIM.paint;
    S.beats = [
      { id: 'D01', t0: 0.0, t1: 14.2, fade: 1.0 },
      { id: 'D02', t0: 13.0, t1: 30.6, fade: 1.2 },
      { id: 'D03', t0: 29.4, t1: 40.0, fade: 1.2 },
    ];
    S.has = { flame: !!(P && P.flame), lampFlicker: !!(P && P.lampFlicker), smoke: !!(P && P.smoke), sparkle: !!(P && P.seaSparkle), particles: !!(P && P.particles) };
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
    S.starsD03 = mkStars(73, 26);
    // the teal cone (apex at origin, opens toward -y)
    S.cone = { alpha: 0.46, h: 2.6 };
  },

  draw(api, t, S) {
    const { ctx: c, u, W, H } = api; const P = ANIM.paint; const E = u.ease; const boil = api.boil;

    /* ---------------------------------------------------------- helpers */
    const breathe = (speed, seed) => 0.85 + 0.15 * u.noise2(t * speed + seed * 5.3, seed);
    const layerAt = (L, x, y, s, alpha) => { if (alpha <= 0.002) return; c.save(); c.globalAlpha *= alpha; c.drawImage(L, x - 450 * s, y - 450 * s, 900 * s, 900 * s); c.restore(); };
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
    // lamp: boiling flame + flickering warm pool at a plate point
    const lamp = (R, fx, fy, scale, pool, seed, alpha = 1) => {
      const p = u.platePt(R, fx, fy);
      if (S.has.lampFlicker) P.lampFlicker(c, t, { x: p.x, y: p.y, scale, seed, pool, alpha });
      else { u.lamp(c, p.x, p.y - 10 * scale, pool * scale, t, { seed, alpha: 0.3 * alpha }); }
      return p;
    };

    /* ------------------------------------------------------------ beats */
    // D01 — night study: lamp, window stars, moonlit sea sparkle, dust (0–14.2)
    function D01(a) {
      const kb = u.kb(t, 0, 14.2, { zoom: 1.0, fx: 0.5, fy: 0.5 }, { zoom: 1.10, fx: 0.44, fy: 0.58 });
      const R = u.plate(c, 'D01', Object.assign(kb, { alpha: a })); if (!R) return;
      const sz = R.w / W;
      c.save(); c.globalAlpha = a;
      // 1. window: twinkling stars + faint moon-path sparkle on the sea (clipped to the window opening)
      const win = [u.platePt(R, 0.595, 0.02), u.platePt(R, 0.905, 0.02), u.platePt(R, 0.905, 0.33), u.platePt(R, 0.595, 0.33)];
      c.save(); u.polyPath(c, win, true); c.clip();
      twinkle(S.starsD01, [win[0].x, win[0].y, win[1].x - win[0].x, 0.19 * R.h], 1.5 * sz, 0.8);
      c.restore();
      // 2. the clay lamp: boiling flame + warm pool breathing over the table and his hands
      const lp = lamp(R, 0.095, 0.745, 1.35 * sz, 300 * sz, 31, 0.85);
      layerAt(S.warmL, lp.x + 0.06 * R.w, lp.y - 0.05 * R.h, 0.9 * sz * breathe(6, 3), 0.22);
      // 3. warm dust drifting in the lamplight
      u.motes(c, t, { count: 26, box: [R.x + 0.02 * R.w, R.y + 0.45 * R.h, 0.5 * R.w, 0.5 * R.h], seed: 9, color: '#ffe3a0', size: 2.2 * sz, speed: 0.45, alpha: 0.3, drift: 0.7 });
      u.grade(c, '#ffd9a0', 0.06);
      c.restore();
    }

    // D02 — hand holding the cone: big lamp flame, thin smoke, motes, gold section curve (13–30.6)
    function D02(a) {
      const kb = u.kb(t, 13, 30.6, { zoom: 1.04, fx: 0.42, fy: 0.42 }, { zoom: 1.14, fx: 0.39, fy: 0.40 });
      const R = u.plate(c, 'D02', Object.assign(kb, { alpha: a })); if (!R) return;
      const sz = R.w / W;
      c.save(); c.globalAlpha = a;
      // 1. lamp: boiling flame over the painted one + flickering pool; a thread of smoke above
      const lp = lamp(R, 0.158, 0.19, 2.3 * sz, 360 * sz, 37, 0.8);
      if (S.has.smoke) P.smoke(c, t, { x: lp.x + 4 * sz, y: lp.y - 0.17 * R.h, seed: 41, scale: 0.55 * sz, alpha: 0.16, color: '#d9d0c8', count: 6, rise: 0.22 * R.h, wind: 0.35 });
      // 2. dust motes in the lamplight
      u.motes(c, t, { count: 22, box: [R.x, R.y + 0.05 * R.h, 0.7 * R.w, 0.7 * R.h], seed: 13, color: '#ffe3a0', size: 2.4 * sz, speed: 0.4, alpha: 0.26, drift: 0.6 });
      // 3. the imagined cut: a faint gold curve traces itself around the cone, holds, fades (16.4–21.9)
      goldCurve(R, sz);
      u.grade(c, '#ffd9a0', 0.05);
      c.restore();
    }

    // the brief gold section-curve overlay over the hand-held cone (image-fraction geometry; approximate placement is fine)
    function goldCurve(R, sz) {
      const kIn = E.out(u.seg(t, 16.4, 17.8)), kOut = 1 - E.io(u.seg(t, 20.9, 21.9)); if (kIn <= 0 || kOut <= 0) return;
      const A = u.platePt(R, 0.327, 0.262), B = u.platePt(R, 0.392, 0.478);       // apex → base centre (painted cone axis)
      let dx = B.x - A.x, dy = B.y - A.y; const L = Math.hypot(dx, dy) || 1; dx /= L; dy /= L; const nx = -dy, ny = dx;
      const f = 0.55;                                                               // cut at 55 % of the height (above the fingers)
      const C = { x: A.x + dx * L * f, y: A.y + dy * L * f };
      const w = 0.058 * R.w * f, k = 0.46;                                          // half-width at the cut, foreshortening of the ellipse
      const tilt = 0.20;                                                            // slightly oblique cut → ellipse
      const pt = th => ({ x: C.x + nx * w * Math.cos(th) + dx * w * (k * Math.sin(th) + tilt * Math.cos(th)), y: C.y + ny * w * Math.cos(th) + dy * w * (k * Math.sin(th) + tilt * Math.cos(th)) });
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

    // D03 — looking up at the stars; teal light blooms from the sill cone, wireframe cone rises (29.4–40)
    function D03(a) {
      const kb = u.kb(t, 29.4, 40, { zoom: 1.0, fx: 0.5, fy: 0.5 }, { zoom: 1.08, fx: 0.55, fy: 0.46 });
      const R = u.plate(c, 'D03', Object.assign(kb, { alpha: a })); if (!R) return;
      const sz = R.w / W;
      c.save(); c.globalAlpha = a;
      // 1. night sky: twinkling stars (upper right, between the pillars) + moon path on the sea
      const sky = [u.platePt(R, 0.47, 0.0), u.platePt(R, 0.90, 0.0), u.platePt(R, 0.90, 0.56), u.platePt(R, 0.47, 0.56)];
      c.save(); u.polyPath(c, sky, true); c.clip();
      twinkle(S.starsD03, [sky[0].x, sky[0].y, sky[1].x - sky[0].x, 0.42 * R.h], 1.6 * sz, 0.85);
      if (S.has.sparkle) P.seaSparkle(c, t, { horizonY: u.platePt(R, 0, 0.575).y, bottom: u.platePt(R, 0, 0.66).y, seed: 7, count: 22, x: u.platePt(R, 0.735, 0).x, spread: 0.06 * R.w, alpha: 0.55, color: '#dfe9ff' });
      c.restore();
      // 2. the small lamp on the shelf (left)
      lamp(R, 0.082, 0.728, 1.0 * sz, 220 * sz, 43, 0.8);
      u.motes(c, t, { count: 14, box: [R.x, R.y + 0.4 * R.h, 0.3 * R.w, 0.5 * R.h], seed: 15, color: '#ffe3a0', size: 2.0 * sz, speed: 0.4, alpha: 0.25, drift: 0.6 });
      // 3. teal light blooming from the bronze cone on the sill (32→)
      const cp = u.platePt(R, 0.69, 0.75); const kT = E.io(u.seg(t, 32, 36.5));
      if (kT > 0) {
        const br = 0.9 + 0.1 * Math.sin(t * 2.3);
        layerAt(S.tealL, cp.x, cp.y - 0.03 * R.h, (0.35 + 0.55 * kT) * sz * br, (0.25 + 0.55 * kT) * br);
        if (S.has.particles) P.particles(c, t, { kind: 'glint', count: 12, box: [cp.x - 0.12 * R.w, cp.y - 0.28 * R.h, 0.24 * R.w, 0.32 * R.h], seed: 67, size: 1.0 * sz, speed: 0.7, alpha: 0.7 * kT, color: '#bffff5' });
        u.motes(c, t, { count: 30, box: [cp.x - 0.14 * R.w, cp.y - 0.45 * R.h, 0.28 * R.w, 0.5 * R.h], seed: 69, color: '#9ff5ea', size: 2.4 * sz, speed: 0.8, alpha: 0.5 * kT, drift: 0.8 });
      }
      c.restore();
      S._sill = u.platePt(R, 0.692, 0.745);   // mid-height of the painted bronze cone (apex ≈0.675, base ≈0.81)
      S._sillSz = sz;
    }

    const FN = { D01, D02, D03 };

    /* ------------------------------------------------- beat sequencing */
    let drawn = 0;
    for (const b of S.beats) {
      if (t < b.t0 || t > b.t1) continue;
      const a = drawn === 0 ? 1 : E.sine(u.seg(t, b.t0, b.t0 + b.fade));
      if (a <= 0.001) continue;
      FN[b.id](a); drawn++;
    }
    if (!drawn) { c.fillStyle = '#101a33'; c.fillRect(0, 0, W, H); }

    /* ----------------------------------- hand-off: navy space + rising teal cone (34.5–40) */
    const kRise = E.io(u.seg(t, 34.5, 39.6));
    if (kRise > 0) {
      // the room cools toward the math space
      u.grade(c, '#58e0d0', 0.12 * kRise, 'soft-light');
      c.save(); c.globalAlpha = 0.6 * E.io(u.seg(t, 36, 40)); c.drawImage(S.navy, 0, 0); c.restore();
      // the model lifts off the sill, grows and turns as it becomes a translucent teal cone
      // starts exactly over the painted cone (same size), then lifts toward the centre and grows
      const sill = S._sill || { x: W * 0.692, y: H * 0.745 }, ssz = S._sillSz || 1;
      const cx = u.lerp(sill.x, W * 0.5, kRise), cy = u.lerp(sill.y, 470, kRise);
      const fov = u.lerp(610 * ssz, 1500, kRise), yaw = 0.2 + (t - 34.5) * 0.3, pitch = 0.3;
      const { alpha: ca, h } = S.cone;
      const Pj = u.camera({ yaw, pitch, dist: 9, fov, cx, cy, target: [0, -h * 0.5, 0] });
      const co = u.coneOutline(Pj, ca, h, [0, 0, 0], 96);
      const kA = E.out(u.seg(t, 34.5, 36.5));
      c.save(); c.globalAlpha = kA;
      // body (translucent) + base disc
      c.fillStyle = u.alpha('#58e0d0', 0.14); u.polyPath(c, co.outline, true); c.fill();
      c.fillStyle = u.alpha('#58e0d0', 0.10); u.polyPath(c, co.ring, true); c.fill();
      // glowing silhouette lines, far arc fainter (behind), near arc bright
      const j = 0.7;
      u.ink(c, co.farArc, { w: 2.2, color: '#9ff5ea', alpha: 0.35, jitter: j, seed: boil * 5 + 21, taper: 0, step: 5 });
      u.glowLine(c, co.nearArc, { color: '#58e0d0', w: 3.2, halo: 16, alpha: 0.95, seed: boil * 5 + 22, jitter: j });
      u.glowLine(c, [co.apex2d, co.sil[0]], { color: '#58e0d0', w: 3.2, halo: 16, alpha: 0.95, seed: boil * 5 + 23, jitter: j });
      u.glowLine(c, [co.apex2d, co.sil[1]], { color: '#58e0d0', w: 3.2, halo: 16, alpha: 0.95, seed: boil * 5 + 24, jitter: j });
      u.glow(c, co.apex2d.x, co.apex2d.y, 30 + 70 * kRise, '#bffff5', 0.35);
      c.restore();
      u.motes(c, t, { count: 24, box: [cx - 260, cy - 320, 520, 640], seed: 77, color: '#9ff5ea', size: 2.4, speed: 0.5, alpha: 0.35 * kRise, drift: 0.8 });
      // the physical model on the sill dims as the idea leaves it
      layerAt(S.tealL, sill.x, sill.y, 0.5 * ssz, 0.35 * kRise);
    }
  },
});
