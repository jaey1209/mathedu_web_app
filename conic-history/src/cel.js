/* ============================================================================
   cel.js — cel-animated characters for the painted backgrounds.
   Studio practice: painted background + flat cel characters (one shadow
   tone, inked outline that boils), drawn on twos (12 drawings/s).
   ANIM.cel.figure(ctx, o) draws one person with the origin at the feet.
     o.view  'back' (walking away, 3/4 back) | 'side' (profile, facing ±1)
     o.H     height in px · o.phase walk phase (0..1 per two steps)
     o.walk  0 = standing, 1 = walking · o.kind 'man'|'woman'|'elder'|'youth'
     o.pal   {skin, hair, tunic, mantle, belt} · o.mantle bool · o.long bool
     o.prop  'staff'|'torch'|'child'|'hammer'|null · o.t global time
     o.light -1 = light from the left (shadow on the right)
   ANIM.cel.torchFlame(ctx, x, y, s, t, seed) · ANIM.cel.smokeTrail(...)
   ========================================================================== */
(function () {
  'use strict';
  const A = window.ANIM, u = A.u, TAU = Math.PI * 2;
  const C = (A.cel = A.cel || {});
  const INK = '#2a1a12';
  const shade = (hex, k) => { const [r, g, b] = u.hex2rgb(hex); const m = (v, w) => Math.round(v * (1 - k) + w * k); return `rgb(${m(r, 52)},${m(g, 42)},${m(b, 70)})`; };

  // one cel part: wobbly fill + clipped shadow on the side away from the light + inked outline
  function part(ctx, pts, base, o = {}) {
    const { sh = 0.4, lw = 2, seed = 1, light = -1, shadowFrac = 0.42, ink = true, closed = true, alpha = 1, rim } = o;
    if (pts.length < 3) return;
    const P = u.wobble(u.resample([...pts, pts[0]], Math.max(3, lw * 2.2)), lw * 0.18, seed);
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; P.forEach(p => { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y); });
    ctx.save(); ctx.globalAlpha *= alpha;
    ctx.fillStyle = base; u.polyPath(ctx, P, true); ctx.fill();
    if (sh > 0) {
      ctx.save(); u.polyPath(ctx, P, true); ctx.clip();
      const w = x1 - x0, edge = light < 0 ? x1 - w * shadowFrac : x0 + w * shadowFrac, far = light < 0 ? x1 + 4 : x0 - 4;
      ctx.beginPath(); ctx.moveTo(far, y0 - 4);
      const n = 6; for (let i = 0; i <= n; i++) { const yy = y0 - 4 + (y1 - y0 + 8) * i / n; ctx.lineTo(edge + u.snoise(i * 0.9 + seed, seed) * w * 0.07, yy); }
      ctx.lineTo(far, y1 + 4); ctx.closePath(); ctx.fillStyle = shade(base, sh); ctx.fill();
      ctx.restore();
    }
    ctx.restore();
    if (rim) u.ink(ctx, P.filter(p => (light < 0 ? p.x < x0 + (x1 - x0) * 0.25 : p.x > x1 - (x1 - x0) * 0.25)), { w: lw * 0.9, color: rim, seed: seed + 5, jitter: 0.3, alpha: 0.55 * alpha, taper: 0.8 });
    if (ink) u.ink(ctx, pts, { w: lw, color: INK, seed, jitter: lw * 0.25, closed, taper: 0.15, alpha });
  }
  C.part = part; C.shade = shade;

  const lerp = u.lerp;
  // tapered limb between two points (thigh, arm…) as a polygon
  function limbPoly(a, b, w0, w1) { const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L; return [{ x: a.x + nx * w0, y: a.y + ny * w0 }, { x: b.x + nx * w1, y: b.y + ny * w1 }, { x: b.x - nx * w1, y: b.y - ny * w1 }, { x: a.x - nx * w0, y: a.y - ny * w0 }]; }

  C.torchFlame = (ctx, x, y, s, t, seed = 1) => {
    const f = u.boil(t, 12) + seed * 7; const r = u.rng(f);
    u.glow(ctx, x, y - s * 0.5, s * 3.2, '#ffb347', 0.45);
    for (let k = 0; k < 3; k++) {
      const hh = s * (1.6 - k * 0.45) * (0.85 + r() * 0.3), ww = s * (0.55 - k * 0.14);
      const col = ['#e8611e', '#f7a530', '#fff1b0'][k];
      const lean = (r() - 0.5) * s * 0.35;
      const pts = [{ x: x - ww, y }, { x: x - ww * 0.8, y: y - hh * 0.45 }, { x: x + lean, y: y - hh }, { x: x + ww * 0.8, y: y - hh * 0.5 }, { x: x + ww, y }, { x, y: y + ww * 0.4 }];
      ctx.save(); ctx.fillStyle = col; u.polyPath(ctx, u.curve(pts, 5, true), true); ctx.fill(); ctx.restore();
    }
  };
  // smoke trailing from a moving source: posAt(time) -> {x,y,s}; pure in t
  C.smokeTrail = (ctx, t, posAt, o = {}) => {
    const { n = 14, life = 2.4, seed = 1, color = '#cfc6b8', alpha = 0.32, rise = 70, wind = 18 } = o;
    for (let i = 0; i < n; i++) {
      const age = (i + ((t * n / life) % 1)) * life / n; const te = t - age; const p = posAt(te); if (!p) continue;
      const k = age / life; const r = (6 + 26 * k) * p.s;
      const x = p.x + (wind * age + Math.sin(te * 2.1 + i) * 6) * p.s, y = p.y - rise * age * p.s;
      u.dab(ctx, x, y, r, color, alpha * (1 - k) * Math.min(1, k * 6), 0.15);
    }
  };

  /* -------- the figure -------- */
  C.figure = (ctx, o) => {
    const { x, y, H = 300, view = 'back', facing = 1, walk = 1, kind = 'man', pal = {}, mantle = true, long = false, prop = null, light = -1, seed = 1, t = 0, alpha = 1, rim = '#ffe2a6' } = o;
    const phase = ((o.phase ?? 0) % 1 + 1) % 1;
    const s = H, lw = Math.max(1.1, H * 0.0085);
    const b = A.api ? A.api.boil : u.boil(t); const sd = seed * 31 + b * 7;
    const P = (px, py) => ({ x: x + px * s * (view === 'side' ? facing : 1), y: y + py * s });
    const skin = pal.skin || '#e6b98f', hair = pal.hair || '#2f1f16', tunic = pal.tunic || '#d8c7a2', mant = pal.mantle || '#7c4a32', belt = pal.belt || '#6b4528', sandal = '#6a4630';
    const elder = kind === 'elder', woman = kind === 'woman', youth = kind === 'youth';
    const W = (woman ? 0.92 : 1) * (youth ? 0.9 : 1);
    const ph = phase * TAU, L = Math.max(0, Math.sin(ph)) * walk, R = Math.max(0, Math.sin(ph + Math.PI)) * walk;
    const bob = -0.013 * Math.sin(ph) ** 2 * walk, sway = 0.011 * Math.sin(ph) * walk;
    const bend = elder ? 0.05 : 0;
    const opt = (k) => ({ lw, seed: sd + k, light, alpha, rim });
    // ground shadow (long, toward the lower right: low sun on the left)
    ctx.save(); ctx.globalAlpha *= 0.28 * alpha; ctx.fillStyle = '#3a2a3a'; ctx.beginPath(); ctx.ellipse(x + s * 0.09 * -light, y + s * 0.012, s * 0.2, s * 0.035, -0.12 * light, 0, TAU); ctx.fill(); ctx.restore();

    if (view === 'back') {
      const hipY = -0.5 + bob, shY = -0.8 + bob + bend, headY = -0.925 + bob + bend * 1.25, headX = sway * 0.6 + (elder ? 0.0 : 0);
      // legs: stance straight, lifted leg shows its sole
      const leg = (side, lift) => {
        const hx = sway + side * 0.05 * W, fx = side * 0.045 * W + sway * 0.3 - side * lift * 0.01;
        const footY = -lift * 0.075, knee = P(lerp(hx, fx, 0.5) + side * 0.008, -0.27 - lift * 0.05);
        const hip = P(hx, hipY + 0.02), ank = P(fx, footY - 0.03 + lift * 0.02);
        part(ctx, limbPoly(hip, knee, s * 0.04 * W, s * 0.03 * W), skin, opt(10 + side));
        part(ctx, limbPoly(knee, ank, s * 0.03 * W, s * 0.018 * W), skin, opt(12 + side));
        // sandal: contact = heel seen from behind; lifted = sole facing us
        const f = P(fx, footY);
        if (lift > 0.25) part(ctx, u.ellipsePts(f.x, f.y - s * 0.012, s * 0.026 * W, s * 0.038 * (0.6 + lift * 0.5), 10), sandal, { ...opt(14 + side), sh: 0.25 });
        else part(ctx, u.ellipsePts(f.x, f.y - s * 0.008, s * 0.028 * W, s * 0.016, 10), sandal, { ...opt(14 + side), sh: 0.25 });
      };
      // draw the lifted leg first (it is behind the stance leg)
      if (L > R) { leg(-1, L); leg(1, R); } else { leg(1, R); leg(-1, L); }
      // tunic (chiton): hem swings against the hips, lags the step
      const hemY = long ? -0.07 : (woman ? -0.12 : -0.3), lag = Math.sin(ph - 0.6) * walk;
      const shW = (woman ? 0.11 : 0.125) * W * (elder ? 0.95 : 1), waW = 0.095 * W, hemW = (long ? 0.15 : 0.135) * W;
      const tunicPts = [P(sway * 0.4 - shW, shY), P(sway * 0.4 + shW, shY), P(sway + waW + 0.005, -0.57 + bob), P(sway * 0.6 + hemW + lag * 0.012, hemY + bob + lag * 0.008),
        P(sway * 0.6 + hemW * 0.35, hemY + 0.012 + bob), P(sway * 0.6, hemY + bob - 0.006), P(sway * 0.6 - hemW * 0.35, hemY + 0.012 + bob), P(sway * 0.6 - hemW + lag * 0.012, hemY + bob - lag * 0.008), P(sway - waW - 0.005, -0.57 + bob)];
      part(ctx, tunicPts, tunic, opt(20));
      // fold lines
      for (let k = -1; k <= 1; k += 2) u.ink(ctx, [P(sway + k * 0.03, -0.55 + bob), P(sway * 0.6 + k * 0.05 + lag * 0.008, hemY + bob - 0.01)], { w: lw * 0.55, color: INK, seed: sd + 30 + k, alpha: 0.55 * alpha, taper: 0.6 });
      // belt
      u.ink(ctx, [P(sway - waW, -0.6 + bob), P(sway + waW, -0.6 + bob)], { w: lw * 1.6, color: belt, seed: sd + 33, alpha, taper: 0.2 });
      // himation draped from the left shoulder across the back to the right hip and down
      if (mantle) {
        const ml = Math.sin(ph - 1.0) * walk;
        const m = [P(sway * 0.4 - shW - 0.01, shY - 0.005), P(sway * 0.4 - shW * 0.2, shY - 0.01), P(sway + waW * 0.7, -0.62 + bob), P(sway + waW + 0.02, -0.44 + bob), P(sway * 0.6 + hemW * 0.9 + ml * 0.01, (long ? -0.18 : -0.24) + bob), P(sway * 0.6 + hemW * 0.2, (long ? -0.24 : -0.33) + bob), P(sway - waW * 0.6, -0.5 + bob), P(sway * 0.4 - shW - 0.012, shY + 0.18)];
        part(ctx, m, mant, opt(40));
        u.ink(ctx, [P(sway * 0.4 - shW * 0.5, shY + 0.03), P(sway + waW * 0.4, -0.5 + bob)], { w: lw * 0.6, color: INK, seed: sd + 41, alpha: 0.6 * alpha, taper: 0.5 });
        u.ink(ctx, [P(sway * 0.4 - shW * 0.2, shY + 0.06), P(sway + waW * 0.9, -0.38 + bob)], { w: lw * 0.55, color: INK, seed: sd + 42, alpha: 0.5 * alpha, taper: 0.5 });
      }
      // arms swing opposite to the legs
      const arm = (side, swing, k) => {
        const sh = P(sway * 0.4 + side * shW * 0.95, shY + 0.03);
        let hand, elbow;
        if (prop === 'torch' && side === 1) { elbow = P(sway * 0.4 + side * shW * 1.25, shY - 0.05); hand = P(sway * 0.4 + side * shW * 1.15, shY - 0.17); }
        else if (prop === 'staff' && side === 1) { elbow = P(sway * 0.4 + side * shW * 1.35, shY + 0.15); hand = P(sway * 0.4 + side * shW * 1.45, shY + 0.27 - swing * 0.02); }
        else if (prop === 'child' && side === -1) { elbow = P(sway * 0.4 - shW * 1.15, shY + 0.16); hand = P(sway * 0.2 - shW * 0.4, shY + 0.2); }
        else {
          const fwd = swing; // + forward (away from camera → shorter), - back (toward camera → longer, out)
          elbow = P(sway * 0.4 + side * (shW * 1.08 + 0.01 * Math.max(0, -fwd)), shY + 0.15 - 0.02 * Math.max(0, fwd));
          hand = P(sway * 0.4 + side * (shW * 1.02 + 0.03 * Math.max(0, -fwd)), shY + 0.31 - 0.08 * Math.max(0, fwd));
        }
        part(ctx, limbPoly(sh, elbow, s * 0.03 * W, s * 0.026 * W), mantle && side === -1 ? mant : skin, opt(50 + k));
        part(ctx, limbPoly(elbow, hand, s * 0.025 * W, s * 0.02 * W), skin, opt(52 + k));
        part(ctx, u.ellipsePts(hand.x, hand.y, s * 0.022 * W, s * 0.024 * W, 9), skin, { ...opt(54 + k), sh: 0.3 });
        return hand;
      };
      const swing = Math.sin(ph) * walk;
      const hl = arm(-1, -swing, 0), hr = arm(1, swing, 1);
      // neck + head (back of head: hair mass, ears)
      part(ctx, limbPoly(P(headX, shY - 0.005), P(headX, headY + 0.04), s * 0.028, s * 0.026), skin, opt(60));
      const hc = P(headX, headY);
      part(ctx, u.ellipsePts(hc.x - s * 0.06, hc.y + s * 0.005, s * 0.011, s * 0.017, 8), skin, { ...opt(61), sh: 0.2 });
      part(ctx, u.ellipsePts(hc.x + s * 0.06, hc.y + s * 0.005, s * 0.011, s * 0.017, 8), skin, { ...opt(62), sh: 0.2 });
      const hr0 = s * 0.064, hrY = s * 0.072; const hpts = [];
      const curls = hair !== '#d9d4cb' && !woman && !elder;
      for (let i = 0; i < 18; i++) { const a = Math.PI + (i / 17) * Math.PI * 1.0 - 0.0; const bump = curls ? 1 + 0.08 * Math.abs(Math.sin(i * 1.7)) : 1; hpts.push({ x: hc.x + Math.cos(a) * hr0 * bump, y: hc.y + Math.sin(a) * hrY * bump }); }
      hpts.push({ x: hc.x + hr0 * 1.02, y: hc.y + hrY * 0.55 }, { x: hc.x, y: hc.y + hrY * (woman ? 0.95 : 0.75) }, { x: hc.x - hr0 * 1.02, y: hc.y + hrY * 0.55 });
      part(ctx, hpts, hair, { ...opt(63), sh: 0.35 });
      if (woman) { part(ctx, u.ellipsePts(hc.x + s * 0.005, hc.y - s * 0.035, s * 0.032, s * 0.028, 12), hair, { ...opt(64), sh: 0.35 }); u.ink(ctx, [{ x: hc.x - s * 0.05, y: hc.y + s * 0.0 }, { x: hc.x + s * 0.05, y: hc.y - s * 0.005 }], { w: lw * 1.2, color: pal.band || '#c9a34a', seed: sd + 65, alpha, taper: 0.3 }); }
      // props
      if (prop === 'torch') {
        const top = { x: hr.x + s * 0.03, y: hr.y - s * 0.33 }, bot = { x: hr.x - s * 0.01, y: hr.y + s * 0.08 };
        u.ink(ctx, [bot, top], { w: lw * 1.6, color: '#5a3a22', seed: sd + 70, alpha, taper: 0.1 });
        C.torchFlame(ctx, top.x, top.y, s * 0.05, t, seed);
      }
      if (prop === 'staff') {
        const plant = Math.sin(ph) * walk; const top = { x: hr.x + s * 0.01, y: hr.y - s * 0.2 }, bot = { x: hr.x + s * (0.06 + plant * 0.03), y: y - s * 0.01 + Math.max(0, plant) * -s * 0.04 };
        u.ink(ctx, [top, bot], { w: lw * 1.5, color: '#6b4a2c', seed: sd + 71, alpha, taper: 0.1 });
      }
      if (prop === 'child') {
        // a child held on the left arm, looking back over the mother's shoulder
        const c = P(sway * 0.4 - shW * 0.55, shY - 0.04);
        part(ctx, u.ellipsePts(c.x, c.y + s * 0.08, s * 0.06, s * 0.09, 12), pal.childTunic || '#e7dcc0', opt(80));
        part(ctx, u.ellipsePts(c.x, c.y - s * 0.03, s * 0.045, s * 0.05, 12), skin, { ...opt(81), sh: 0.3 });
        const ch = [];
        for (let i = 0; i < 12; i++) { const a = Math.PI * 1.05 + (i / 11) * Math.PI * 0.9; ch.push({ x: c.x + Math.cos(a) * s * 0.048, y: c.y - s * 0.035 + Math.sin(a) * s * 0.045 }); }
        ch.push({ x: c.x + s * 0.03, y: c.y - s * 0.05 }, { x: c.x - s * 0.03, y: c.y - s * 0.045 });
        part(ctx, ch, pal.childHair || '#3a2618', { ...opt(82), sh: 0.3 });
        const blink = (Math.floor(t * 12 + seed * 5) % 47) < 2;
        [-1, 1].forEach(k => { const ex = c.x + k * s * 0.015, ey = c.y - s * 0.02; if (blink) u.ink(ctx, [{ x: ex - s * 0.006, y: ey }, { x: ex + s * 0.006, y: ey }], { w: lw * 0.7, color: INK, seed: sd + 83 + k, alpha }); else { ctx.save(); ctx.globalAlpha *= alpha; ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(ex, ey, s * 0.0055, s * 0.0075, 0, 0, TAU); ctx.fill(); ctx.restore(); } });
        part(ctx, limbPoly({ x: c.x + s * 0.03, y: c.y + s * 0.03 }, { x: c.x + s * 0.09, y: c.y + s * 0.05 }, s * 0.016, s * 0.014), skin, { ...opt(85), sh: 0.25 });
      }
      return;
    }
  };
})();
