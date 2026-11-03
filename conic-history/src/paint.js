/* paint.js — shared painted-background helpers (ANIM.paint) */ ANIM.paint = ANIM.paint || {};
/* ============================================================================
   ANIM.paint — Ghibli-style painted backgrounds (gouache / watercolour).
   Everything is drawn through the engine's hand-drawn primitives
   (u.ink / u.sketch / u.shape / u.wash / u.brush / u.dab). All helpers are
   deterministic for a given `seed`. Static helpers are meant to be called ONCE
   in a scene's init() on an offscreen u.layer(); the `*Animate`/per-frame ones
   (marked [frame]) are cheap enough for draw().
   Coordinates: 1920x1080 virtual px, unless noted. Colors: '#hex'.

   API (all under ANIM.paint, `P` below):
     colors                          palette object (dawnGold, bronze, indigo, marble, ...)
     mix(hexA,hexB,t) -> hex         hex-safe colour mix (u.mixHex returns rgb())
     sky(ctx,{preset,seed,horizon,sun,clouds,cloudCount,stars})
                                     preset 'dawn'|'day'|'dusk'|'night'|'navyMath'
     sun(ctx,{x,y,r,color,glow,alpha,seed})
     stars(ctx,{seed,count,yMax,color,alpha})
     nebula(ctx,{seed,colors,count,alpha})
     haze(ctx,{y0,y1,color,alpha,seed,n})      misty horizontal band (atmospheric perspective)
     cloudMass(ctx,x,y,w,h,{seed,color,shadow,light,lightDir,alpha})
     clouds(ctx,{y,count,seed,scale,alpha,light,color,shadow,spread,lightDir,xMin,xMax})
     cloudLayer({...clouds opts, pad}) -> canvas (W+2*pad wide, transparent)
     cloudsAnimate(ctx,t,{layer,speed,y,alpha,offset}) [frame]  drifts a cached cloudLayer with wrap
     cloudShadows(ctx,t,{box,seed,alpha,speed,count,color}) [frame]
     sea(ctx,{horizonY,bottom,seed,colorTop,colorBottom,colorFar,foam,sunX,sunColor})
     seaSparkle(ctx,t,{horizonY,bottom,seed,count,color,x,spread,alpha}) [frame]
     hills(ctx,{layers:[{y,amp,color,freq,fade,trees,treeKind,alpha,bottom}],seed,haze,ink,bottom})
     island(ctx,{x,y,w,h,seed,color,cliff,fade,haze,trees,ink})
     islands(ctx,{y,list:[{x,w,h,...}],seed,...})
     ground(ctx,{y,color,seed,dark,light,bottom,n})
     column(ctx,{x,y,h,d,seed,light,color,shade,deep,ink,fluting,capital,jitter,w})
     temple(ctx,{x,y,w,h,columns,seed,light,color,shade,deep,ink,cella}) -> {stylobateY,colTop,apexY}
     interior(ctx,{seed,vp,depths,light,color,dark,floor,fog}) -> {vp,floorY,altar:{x,y,size}}
     lightShaft(ctx,{x,y,angle,width,length,alpha,color,seed,spread,flicker}) [frame-ok]
     altarCube(ctx,{x,y,size,wx,hy,dz,seed,glow,gold,light,color,moss,chisel,shadow,ink}) -> {top,center,verts}
     altarCube3d(ctx,P,{origin,size,seed,color,ink,w,alpha,glow,gold,light,chisel})
     stoneBlock(ctx,{...altarCube opts})  alias: altarCube without glow/moss (workshop blocks)
     workshop(ctx,{seed,sky}) -> {groundY,blocks:[...],scaffold:{x,y,w,h},awning}
     study(ctx,{seed,night}) -> {lamps:[{x,y,scale}],tray:{x,y,w,h},table:{x,y,w,h},scrolls:[...]}
     lamp(ctx,{x,y,scale,seed,color})            clay oil lamp body (static)
     flame(ctx,t,{x,y,scale,seed,color,core}) [frame]
     lampFlicker(ctx,t,{x,y,scale,seed,pool,poolColor,alpha}) [frame]  flame + warm light pool
     papyrus(ctx,{x,y,w,h,seed,rolled,color,ink,alpha,rot})
     sandTray(ctx,{x,y,w,h,seed,wood,sand,ink}) -> inner rect
     sandLine(ctx,pts,{seed,w,alpha,color,hi,closed})
     particles(ctx,t,{kind:'dust'|'ember'|'leaf'|'glint',count,box,seed,color,size,speed,alpha}) [frame]
     birds(ctx,t,{count,seed,box,scale,color,speed,alpha}) [frame]  gull silhouettes, 12fps flap
     grass(ctx,t,{x,y,w,count,seed,color,height,wind,alpha,blades}) [frame]
     tuft(ctx,{x,y,seed,color,height,sway,blades,alpha,w})          one tuft (static or per-frame)
     foliage(ctx,{x,y,rx,ry,seed,color,light,shadow,lightDir,n,alpha})
     olive(ctx,{x,y,scale,seed,light,trunk,leaf})  olive tree
     cypress(ctx,{x,y,scale,seed,color,alpha,lean})
     smoke(ctx,t,{x,y,seed,scale,alpha,color,count,rise,wind}) [frame]
     finish(ctx,{paperAlpha,edge,edgeColor,mode})  paper texture + edge darkening
   ========================================================================== */
(function () {
  'use strict';
  const A = window.ANIM, u = A.u, W = A.W, H = A.H, P = A.paint, TAU = Math.PI * 2;

  /* ------------------------------------------------------------- palette */
  const C = (P.colors = {
    dawnGold: '#f2c879', bronze: '#b5762f', indigo: '#1b2447', marble: '#e8e1d3', shadow: '#3b3558',
    seaDeep: '#2f6f9f', seaLight: '#5aa6c9', olive: '#6f8a4e', navy: '#0b1230', navy2: '#121c45',
    teal: '#58e0d0', gold: '#f3d27a', ivory: '#f6f1e6', ink: '#2b1d14', inkMath: '#9ff5ea',
    peach: '#e9a07a', lavender: '#8f7fb0', cream: '#fbf1dc', sand: '#d9c49a', wood: '#7a5a3a', woodDark: '#4e3722',
  });
  const hex = (r, g, b) => '#' + [r, g, b].map(v => Math.round(u.clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('');
  const mix = (P.mix = (a, b, t) => { const A1 = u.hex2rgb(a), B1 = u.hex2rgb(b); t = u.clamp(t); return hex(u.lerp(A1[0], B1[0], t), u.lerp(A1[1], B1[1], t), u.lerp(A1[2], B1[2], t)); });
  const shade = (h, k) => mix(h, k < 0 ? '#000000' : '#ffffff', Math.abs(k));
  const R = seed => u.rng(seed);
  const poly = (ctx, pts, color, alpha = 1) => { ctx.save(); ctx.globalAlpha *= alpha; ctx.fillStyle = color; u.polyPath(ctx, pts, true); ctx.fill(); ctx.restore(); };
  const clipPoly = (ctx, pts) => { u.polyPath(ctx, pts, true); ctx.clip(); };
  const seg = (a, b, n = 2) => { const o = []; for (let i = 0; i <= n; i++) o.push({ x: u.lerp(a.x, b.x, i / n), y: u.lerp(a.y, b.y, i / n) }); return o; };

  /* ------------------------------------------- horizontal brushy band fill */
  // n brush strokes between y0..y1 across the width, slightly tilted & scattered.
  P.brushBand = (ctx, y0, y1, color, seed = 1, o = {}) => {
    const { n = 10, w = 110, alpha = 0.16, tilt = 0.02, x0 = -80, x1 = W + 80, scatter = 0.3 } = o;
    const r = R(seed);
    for (let i = 0; i < n; i++) {
      const y = u.lerp(y0, y1, (i + r()) / n), dy = (r() - 0.5) * tilt * (x1 - x0); const xa = x0 + r() * 140, xb = x1 - r() * 140;
      u.brush(ctx, xa, y - dy / 2, xb, y + dy / 2, { w: w * (0.7 + r() * 0.6), color, alpha: alpha * (0.7 + r() * 0.6), seed: seed * 7.1 + i, scatter });
    }
  };
  P.haze = (ctx, o = {}) => { const { y0 = H * 0.5, y1 = H * 0.65, color = '#efe0cf', alpha = 0.12, seed = 1, n = 8 } = o; P.brushBand(ctx, y0, y1, color, seed + 0.5, { n, w: 150, alpha, tilt: 0.01 }); };

  /* ---------------------------------------------------------------- sky */
  const SKY = {
    dawn: { stops: [[0, '#1b2447'], [0.28, '#4a4474'], [0.55, '#8f7fb0'], [0.76, '#e9a07a'], [0.92, '#f2c879'], [1, '#f7dca0']], cloud: { color: '#f6e3cc', shadow: '#9a7fa6', light: '#fff2d2' }, sun: { color: '#ffd98a' }, hazeColor: '#f3cf98' },
    day: { stops: [[0, '#2f6f9f'], [0.35, '#5a9ac6'], [0.7, '#9cc5dd'], [1, '#d8e6ea']], cloud: { color: '#f8f6f0', shadow: '#9fa6c4', light: '#ffffff' }, hazeColor: '#dce6ea' },
    dusk: { stops: [[0, '#2a2550'], [0.3, '#5a4477'], [0.58, '#a3607a'], [0.8, '#d9774f'], [1, '#f0b56a']], cloud: { color: '#e9b59a', shadow: '#6f4d79', light: '#ffd9b0' }, sun: { color: '#ffb26b' }, hazeColor: '#e8a070' },
    night: { stops: [[0, '#05081a'], [0.45, '#121a3c'], [0.8, '#1b2447'], [1, '#2b3660']], cloud: { color: '#2b3360', shadow: '#141a38', light: '#3d4a7a' }, hazeColor: '#2b3660' },
    navyMath: { stops: [[0, '#070d2a'], [0.5, '#0b1230'], [0.85, '#121c45'], [1, '#1a2a5c']], cloud: { color: '#15214d', shadow: '#0a1130', light: '#223466' }, hazeColor: '#1a2a5c' },
  };
  P.skyPreset = n => SKY[n] || SKY.dawn;
  P.sky = (ctx, o = {}) => {
    const { preset = 'dawn', seed = 1, horizon = H * 0.62, sun, clouds = true, cloudCount, stars } = o;
    const K = SKY[preset] || SKY.dawn; const r = R(seed + 11);
    const bottom = Math.min(H, horizon + 40);
    // 1. base gradient (sky bands 0..horizon)
    ctx.save(); ctx.fillStyle = u.grad(ctx, 0, 0, 0, horizon, K.stops); ctx.fillRect(0, 0, W, bottom + 2); ctx.restore();
    // 2. brushy bands: each stop band gets strokes of its colour + a warmer/cooler variant to break uniformity
    const st = K.stops;
    for (let i = 0; i < st.length; i++) {
      const y0 = (i === 0 ? 0 : st[i - 1][0]) * horizon, y1 = st[i][0] * horizon; if (y1 - y0 < 4) continue;
      const c = st[i][1]; P.brushBand(ctx, y0 - 30, y1 + 30, c, seed + i * 3, { n: 7, w: 120 + (y1 - y0) * 0.3, alpha: 0.14, tilt: 0.025 });
      P.brushBand(ctx, y0, y1, shade(c, (i % 2 ? 0.08 : -0.06)), seed + i * 3 + 1, { n: 4, w: 90, alpha: 0.1, tilt: 0.03 });
    }
    // 3. preset extras
    if (preset === 'night' || preset === 'navyMath' || stars) P.stars(ctx, { seed: seed + 5, count: stars === undefined ? (preset === 'navyMath' ? 160 : 320) : stars, yMax: horizon * 0.95, alpha: preset === 'navyMath' ? 0.55 : 0.9 });
    if (preset === 'navyMath') P.nebula(ctx, { seed: seed + 7, alpha: 0.9 });
    if (sun) P.sun(ctx, Object.assign({ x: W * 0.62, y: horizon - 30, r: 60, color: (K.sun || SKY.dawn.sun).color, seed }, sun === true ? {} : sun));
    // 4. horizon haze
    P.haze(ctx, { y0: horizon - 110, y1: horizon + 10, color: K.hazeColor, alpha: preset === 'night' || preset === 'navyMath' ? 0.07 : 0.14, seed: seed + 9 });
    // 5. clouds
    if (clouds) {
      const cc = cloudCount === undefined ? (preset === 'navyMath' ? 0 : preset === 'night' ? 3 : 6) : cloudCount;
      if (cc) P.clouds(ctx, Object.assign({ y: horizon * 0.42, count: cc, seed: seed + 21, scale: 1, spread: horizon * 0.3, lightDir: sun && sun.x !== undefined ? Math.sign(sun.x - W / 2) * 0.6 || -0.6 : -0.6 }, K.cloud, typeof clouds === 'object' ? clouds : {}));
    }
  };
  P.sun = (ctx, o = {}) => {
    const { x = W * 0.6, y = H * 0.5, r = 60, color = '#ffd98a', glow = 1, alpha = 1, seed = 1 } = o;
    ctx.save(); ctx.globalAlpha *= alpha;
    u.glow(ctx, x, y, r * 7 * glow, color, 0.35); u.glow(ctx, x, y, r * 3 * glow, color, 0.45);
    u.dab(ctx, x, y, r * 1.15, color, 0.9, 0.8); u.dab(ctx, x, y, r * 0.8, mix(color, '#ffffff', 0.5), 0.95, 0.85);
    // soft horizontal glare strokes
    const rr = R(seed + 3); for (let i = 0; i < 4; i++) { const yy = y + (rr() - 0.5) * r * 1.6; u.brush(ctx, x - r * (3 + rr() * 3), yy, x + r * (3 + rr() * 3), yy, { w: r * 0.5, color, alpha: 0.08, seed: seed + i, scatter: 0.2 }); }
    ctx.restore();
  };
  P.stars = (ctx, o = {}) => {
    const { seed = 1, count = 260, yMax = H * 0.7, color = '#fff6dc', alpha = 0.9 } = o; const r = R(seed);
    ctx.save(); ctx.globalAlpha *= alpha;
    for (let i = 0; i < count; i++) { const x = r() * W, y = r() * r() * yMax; const s = 0.5 + r() * 1.6; ctx.fillStyle = u.alpha(color, 0.3 + r() * 0.65); ctx.beginPath(); ctx.arc(x, y, s, 0, TAU); ctx.fill(); if (r() < 0.07) u.glow(ctx, x, y, s * 9, color, 0.3); }
    ctx.restore();
  };
  P.nebula = (ctx, o = {}) => {
    const { seed = 1, colors = ['#1f3f6e', '#2a2a66', '#1c4d58', '#3a2f66'], count = 14, alpha = 1 } = o; const r = R(seed);
    ctx.save(); ctx.globalAlpha *= alpha;
    for (let i = 0; i < count; i++) { const x = r() * W, y = r() * H * 0.7, rad = 160 + r() * 320; u.dab(ctx, x, y, rad, colors[i % colors.length], 0.12 + r() * 0.08, 0.1); }
    for (let i = 0; i < 5; i++) { const x = r() * W, y = r() * H * 0.6; u.brush(ctx, x - 300, y + (r() - 0.5) * 80, x + 300, y - (r() - 0.5) * 80, { w: 140, color: '#58e0d0', alpha: 0.025, seed: seed + i, scatter: 0.5 }); }
    ctx.restore();
  };

  /* ------------------------------------------------------------- clouds */
  // One cumulus mass built from overlapping dabs: flat-ish underside, cauliflower top.
  P.cloudMass = (ctx, cx, cy, w, h, o = {}) => {
    const { seed = 1, color = '#f8f6f0', shadow = '#9fa6c4', light = '#ffffff', lightDir = -0.6, alpha = 1, lobes } = o;
    const r = R(seed); const k = lobes || Math.max(3, Math.round((w / h) * 1.7));
    const L = [];
    for (let i = 0; i < k; i++) { const t = (i + 0.5) / k; const x = cx + (t - 0.5) * w * 0.88; const edge = 1 - Math.pow(Math.abs(t - 0.5) * 2, 1.5); const rr = h * (0.26 + 0.36 * edge) * (0.85 + r() * 0.3); const y = cy + h * 0.28 - rr * 0.8 - r() * h * 0.1; L.push({ x, y, r: rr }); }
    const S = []; L.forEach(l => { const m = 2 + Math.floor(r() * 3); for (let j = 0; j < m; j++) { const a = -Math.PI * (0.1 + 0.8 * r()); const d = l.r * (0.5 + r() * 0.4); S.push({ x: l.x + Math.cos(a) * d, y: l.y + Math.sin(a) * d * 0.9, r: l.r * (0.32 + r() * 0.3) }); } });
    const all = L.concat(S);
    // silhouette = upper envelope of all lobes, flat-ish underside: one wobbly polygon (no visible circles)
    const yBot = cy + h * 0.27; const x0 = cx - w * 0.5 - h * 0.1, x1 = cx + w * 0.5 + h * 0.1; const topE = [], botE = [];
    for (let x = x0; x <= x1; x += 7) {
      let yt = Infinity, yb = -Infinity; all.forEach(l => { const dx = x - l.x; if (Math.abs(dx) < l.r) { const dy = Math.sqrt(l.r * l.r - dx * dx); yt = Math.min(yt, l.y - dy); yb = Math.max(yb, l.y + dy); } });
      if (yt === Infinity) continue; topE.push({ x, y: yt }); botE.push({ x, y: Math.min(yb, yBot + u.snoise(x * 0.02 + seed, seed) * h * 0.04) });
    }
    if (topE.length < 3) return;
    const sil = [...topE, ...botE.reverse()];
    ctx.save(); ctx.globalAlpha *= alpha;
    // fuzzy halo so the edge is not a hard cut-out
    for (let i = 0; i < topE.length; i += 5) u.dab(ctx, topE[i].x, topE[i].y + h * 0.03, h * 0.14, color, 0.25, 0.15);
    u.shape(ctx, sil, { fill: color, jitter: 2.2, seed });
    ctx.save(); clipPoly(ctx, u.wobble(u.resample([...sil, sil[0]], 10), 1.1, seed));
    // underside shade: gradient band + brushy strokes
    ctx.fillStyle = u.grad(ctx, 0, cy - h * 0.15, 0, yBot + 4, [[0, u.alpha(shadow, 0)], [0.55, u.alpha(shadow, 0.42)], [1, u.alpha(shadow, 0.7)]]); ctx.fillRect(x0, cy - h * 0.2, x1 - x0, h);
    P.brushBand(ctx, cy + h * 0.02, yBot, shadow, seed + 3, { n: 4, w: h * 0.22, alpha: 0.22, tilt: 0.01, x0: x0, x1: x1, scatter: 0.5 });
    // per-lobe modelling: shadow on the side away from light, soft light on top
    L.forEach((l, i) => { u.dab(ctx, l.x - lightDir * l.r * 0.55, l.y + l.r * 0.55, l.r * 0.9, shadow, 0.22, 0.15); });
    all.forEach((l, i) => { if (i % 4 === 3) return; u.dab(ctx, l.x + lightDir * l.r * 0.3, l.y - l.r * 0.25, l.r * 0.7, light, 0.5, 0.2); });
    // dry-brush texture
    for (let i = 0; i < 4; i++) { const yy = cy + (r() - 0.55) * h * 0.5; u.brush(ctx, cx - w * 0.4, yy, cx + w * 0.4, yy + (r() - 0.5) * 14, { w: h * 0.2, color: i % 2 ? shadow : light, alpha: 0.1, seed: seed + 40 + i, scatter: 0.7 }); }
    ctx.restore();
    // faint ink-less rim: a slightly darker soft line under the lobes on the shadow side
    u.ink(ctx, botE.reverse(), { w: 2, color: shadow, alpha: 0.18, jitter: 1.5, seed: seed + 9, taper: 0.3, step: 10 });
    ctx.restore();
  };
  P.clouds = (ctx, o = {}) => {
    const { y = H * 0.25, count = 6, seed = 1, scale = 1, alpha = 1, light = '#ffffff', color = '#f8f6f0', shadow = '#9fa6c4', spread = 120, lightDir = -0.6, xMin = -200, xMax = W + 200 } = o;
    const r = R(seed + 99);
    const items = []; for (let i = 0; i < count; i++) { const t = (i + 0.2 + r() * 0.6) / count; const w = (260 + r() * 420) * scale, h = w * (0.28 + r() * 0.22); items.push({ x: u.lerp(xMin, xMax, t), y: y + (r() - 0.5) * 2 * spread, w, h, s: seed + i * 17 }); }
    items.sort((a, b) => a.y - b.y); // farther (higher) first
    items.forEach(it => P.cloudMass(ctx, it.x, it.y, it.w, it.h, { seed: it.s, color, shadow, light, lightDir, alpha }));
  };
  // cached transparent cloud strip for drifting; width W + 2*pad so it can wrap seamlessly
  P.cloudLayer = (o = {}) => { const { pad = 300 } = o; const w = W + pad * 2; return u.layer(w, H, c => { c.translate(pad, 0); P.clouds(c, Object.assign({ xMin: -pad + 60, xMax: W + pad - 60 }, o)); }); };
  P.cloudsAnimate = (ctx, t, o = {}) => {
    const { layer, speed = 6, y = 0, alpha = 1, offset = 0 } = o; if (!layer) return;
    const w = layer.width; const dx = -(((t * speed + offset) % w) + w) % w;
    ctx.save(); ctx.globalAlpha *= alpha; ctx.drawImage(layer, dx - (w - W) / 2, y); ctx.drawImage(layer, dx + w - (w - W) / 2, y); ctx.restore();
  };
  P.cloudShadows = (ctx, t, o = {}) => {
    const { box = [0, H * 0.6, W, H * 0.4], seed = 1, alpha = 0.18, speed = 14, count = 4, color = '#3b3558' } = o; const r = R(seed + 4);
    ctx.save(); ctx.globalCompositeOperation = 'multiply';
    for (let i = 0; i < count; i++) { const w = box[2] * (0.25 + r() * 0.3), ph = r() * box[2]; const x = box[0] + (((t * speed * (0.7 + r() * 0.6) + ph) % (box[2] + w * 2)) - w); const y = box[1] + r() * box[3]; u.dab(ctx, x, y, w * 0.5, color, alpha, 0.2); }
    ctx.restore();
  };

  /* ---------------------------------------------------------------- sea */
  P.sea = (ctx, o = {}) => {
    const { horizonY = H * 0.62, bottom = H, seed = 1, colorTop = '#2f6f9f', colorBottom = '#5aa6c9', colorFar = '#8fb9cf', foam = '#dcebf0', sunX = null, sunColor = '#ffe3a0' } = o;
    const r = R(seed + 2); const hh = bottom - horizonY;
    ctx.save();
    ctx.fillStyle = u.grad(ctx, 0, horizonY, 0, bottom, [[0, colorFar], [0.18, colorTop], [1, colorBottom]]); ctx.fillRect(0, horizonY, W, hh + 2);
    // horizontal brushy bands, bigger strokes nearer
    for (let i = 0; i < 5; i++) { const y0 = horizonY + hh * (i / 5), y1 = horizonY + hh * ((i + 1) / 5); const c = mix(colorTop, colorBottom, (i + 0.5) / 5); P.brushBand(ctx, y0, y1, shade(c, i % 2 ? -0.1 : 0.1), seed + 30 + i, { n: 6, w: 40 + i * 30, alpha: 0.18, tilt: 0 }); }
    // sun path on the water
    if (sunX !== null) { for (let i = 0; i < 18; i++) { const t = r(); const y = horizonY + hh * t * t; const len = 40 + 260 * t; u.brush(ctx, sunX - len / 2 + (r() - 0.5) * 120, y, sunX + len / 2 + (r() - 0.5) * 120, y, { w: 10 + 26 * t, color: sunColor, alpha: 0.18 * (1 - t * 0.5), seed: seed + 80 + i, scatter: 0.2 }); } }
    // wave strokes: short wobbly horizontal ink lines, thin & faint far, bolder near
    ctx.globalAlpha *= 1;
    for (let i = 0; i < 90; i++) { const t = r(); const y = horizonY + hh * Math.pow(t, 1.4) + 6; const len = 30 + 320 * t * t; const x = r() * (W + 200) - 100; const pts = u.wobble(seg({ x, y }, { x: x + len, y: y + (r() - 0.5) * 6 }, 6), 1.5 + 3 * t, seed + i); u.ink(ctx, pts, { w: 1.2 + 2.6 * t, color: r() < 0.6 ? foam : shade(colorTop, -0.25), alpha: 0.12 + 0.3 * t, seed: seed + i * 3, jitter: 0.6, taper: 0.5 }); }
    // foam line right at horizon (very faint, breaks the hard edge)
    u.brush(ctx, -40, horizonY + 2, W + 40, horizonY + 2, { w: 8, color: foam, alpha: 0.18, seed: seed + 7, scatter: 0.3 });
    ctx.restore();
  };
  P.seaSparkle = (ctx, t, o = {}) => {
    const { horizonY = H * 0.62, bottom = H, seed = 1, count = 60, color = '#fff3c4', x = W * 0.62, spread = 700, alpha = 1 } = o;
    const b = u.boil(t); const r = R(seed * 3 + b * 0.731); const hh = bottom - horizonY;
    ctx.save(); ctx.globalAlpha *= alpha; ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < count; i++) { const k = r(); const y = horizonY + hh * k * k + 4; const sx = x + (r() - 0.5) * spread * (0.35 + 1.3 * k); const len = 2 + 14 * k; const a = 0.25 + r() * 0.6; u.dab(ctx, sx, y, 1.5 + 3 * k, color, a * 0.7, 0.2); if (k > 0.25) u.ink(ctx, [{ x: sx - len / 2, y }, { x: sx + len / 2, y }], { w: 1 + 1.4 * k, color, alpha: a, seed: b + i, jitter: 0.3, taper: 0.6 }); }
    ctx.restore();
  };

  /* -------------------------------------------------------- hills / islands */
  const ridge = (base, amp, freq, seed, x0 = -60, x1 = W + 60, step = 22) => { const pts = []; for (let x = x0; x <= x1; x += step) { const v = u.fbm(x * freq + seed * 3.7, seed * 1.3, 3) - 0.5; const v2 = u.noise2(x * freq * 4 + seed, seed * 9) - 0.5; pts.push({ x, y: base - amp * (v * 1.6 + v2 * 0.25) }); } return pts; };
  const treesOnRidge = (ctx, pts, o) => {
    const { count = 8, seed = 1, kind = 'mixed', scale = 1, color, leaf, trunk, fade = 0, haze = '#ddd', x0 = 0, x1 = W } = o; const r = R(seed + 77);
    for (let i = 0; i < count; i++) { const x = u.lerp(x0, x1, r()); const p = pts.reduce((a, q) => (Math.abs(q.x - x) < Math.abs(a.x - x) ? q : a), pts[0]); const k = kind === 'mixed' ? (r() < 0.55 ? 'cypress' : 'olive') : kind; const s = scale * (0.7 + r() * 0.6); if (k === 'cypress') P.cypress(ctx, { x, y: p.y + 4, scale: s, seed: seed + i, color: mix(color || '#2f3d2a', haze, fade), alpha: 1 }); else P.olive(ctx, { x, y: p.y + 4, scale: s * 0.7, seed: seed + i, leaf: mix(leaf || '#6f8a4e', haze, fade), trunk: mix(trunk || '#5a4634', haze, fade), light: 0.3 }); }
  };
  P.hills = (ctx, o = {}) => {
    const { layers = [], seed = 1, haze = '#e4cdb6', ink = '#2b1d14', bottom = H } = o; const n = layers.length;
    layers.forEach((L, i) => {
      const { y = H * 0.55, amp = 120, color = '#6f8a4e', freq = 0.0022, alpha = 1, trees = 0, treeKind = 'mixed', treeScale = 1 } = L; const fade = L.fade === undefined ? u.lerp(0.62, 0.08, n > 1 ? i / (n - 1) : 1) : L.fade; const bot = L.bottom || bottom;
      const col = mix(color, haze, fade), s = seed + i * 13; const pts = ridge(y, amp, freq, s);
      const polyPts = [...pts, { x: W + 60, y: bot + 50 }, { x: -60, y: bot + 50 }];
      ctx.save(); ctx.globalAlpha *= alpha;
      u.shape(ctx, polyPts, { fill: col, jitter: 2, seed: s });
      ctx.save(); clipPoly(ctx, polyPts);
      // texture: darker strokes following slopes + lighter strokes on lit side; sparser when far
      const r = R(s + 5); const strokes = Math.round(26 * (1 - fade * 0.6));
      // slope strokes following the ridge direction (lit side lighter, far side darker)
      for (let k = 0; k < strokes; k++) { const i0 = Math.floor(r() * (pts.length - 8)); const p0 = pts[i0], p1 = pts[i0 + 6]; const dy = 10 + r() * Math.min(260, (bot - y) * 0.6); const slope = Math.sign(p1.y - p0.y) || 1; u.brush(ctx, p0.x, p0.y + dy, p1.x + (r() - 0.5) * 80, p1.y + dy + (r() - 0.5) * 60, { w: 40 + r() * 80, color: slope < 0 ? shade(col, 0.16) : shade(col, -0.2), alpha: 0.2 * (1 - fade * 0.5), seed: s + k, scatter: 0.5 }); }
      // valley shadows + scrub dapples near the ridge
      if (fade < 0.5) { for (let k = 0; k < 5; k++) { const i0 = Math.floor(r() * (pts.length - 1)); const p = pts[i0]; u.dab(ctx, p.x, p.y + 60 + r() * 80, 90 + r() * 120, shade(col, -0.28), 0.22, 0.2); }
        const nd = Math.round(40 * (1 - fade)); for (let k = 0; k < nd; k++) { const i0 = Math.floor(r() * (pts.length - 1)); const p = pts[i0]; const rr = 6 + r() * 14; u.dab(ctx, p.x + (r() - 0.5) * 30, p.y + 8 + r() * 120, rr, r() < 0.6 ? shade(col, -0.3) : shade(col, 0.2), 0.45, 0.35); } }
      // a few contour strokes (hand-drawn terracing feel) for the nearest layers
      if (fade < 0.25) for (let k = 0; k < 6; k++) { const i0 = Math.floor(r() * (pts.length - 14)); const dy = 30 + r() * 120; const cp = pts.slice(i0, i0 + 12).map(p => ({ x: p.x, y: p.y + dy + (r() - 0.5) * 6 })); u.ink(ctx, cp, { w: 1.4, color: shade(col, -0.35), alpha: 0.25, jitter: 1.5, seed: s + 60 + k, taper: 0.8 }); }
      // soft lighter haze near ridge for far layers
      if (fade > 0.3) P.brushBand(ctx, y - amp * 0.5, y + amp * 0.6, haze, s + 2, { n: 4, w: 90, alpha: 0.12 * fade, tilt: 0 });
      ctx.restore();
      // ridge ink
      u.ink(ctx, pts, { w: 1.6 + (1 - fade) * 1.2, color: mix(ink, haze, fade * 0.8), alpha: 0.28 + (1 - fade) * 0.3, jitter: 1.4, seed: s, taper: 0, step: 8 });
      if (trees) treesOnRidge(ctx, pts, { count: trees, seed: s, kind: treeKind, scale: treeScale * (0.5 + (1 - fade) * 0.6), color: shade(col, -0.35), leaf: L.leaf || mix(shade(col, 0.12), '#8a9a6a', 0.35), trunk: L.trunk || shade(col, -0.5), fade: fade * 0.6, haze });
      ctx.restore();
    });
  };
  P.island = (ctx, o = {}) => {
    const { x = W * 0.5, y = H * 0.6, w = 700, h = 220, seed = 1, color = '#6f8a4e', cliff = '#b99a6d', fade = 0.25, haze = '#e4cdb6', trees = 6, ink = '#2b1d14', alpha = 1, leaf, trunk } = o;
    const col = mix(color, haze, fade), cl = mix(cliff, haze, fade); const r = R(seed + 3);
    // silhouette: dome(s) with cliffs falling to the waterline
    const top = []; const n = 34; for (let i = 0; i <= n; i++) { const t = i / n; const xx = x - w / 2 + w * t; const env = Math.sin(Math.PI * t); const bump = 0.65 * Math.pow(env, 0.7) + 0.35 * u.fbm(t * 5 + seed, seed, 3) * env; top.push({ x: xx, y: y - h * bump - (t > 0.02 && t < 0.98 ? 0 : -6) }); }
    const polyPts = [...top, { x: x + w / 2 + 10, y: y + 30 }, { x: x - w / 2 - 10, y: y + 30 }];
    ctx.save(); ctx.globalAlpha *= alpha;
    u.shape(ctx, polyPts, { fill: col, jitter: 2, seed });
    ctx.save(); clipPoly(ctx, polyPts);
    // cliffs: ochre band near water, brushy
    P.brushBand(ctx, y - h * 0.22, y + 4, cl, seed + 4, { n: 6, w: 50, alpha: 0.35, tilt: 0.01, x0: x - w / 2, x1: x + w / 2 });
    for (let k = 0; k < 10; k++) { const xx = x + (r() - 0.5) * w * 0.9; u.brush(ctx, xx, y - h * (0.1 + r() * 0.5), xx + (r() - 0.5) * 60, y - 4, { w: 24 + r() * 30, color: r() < 0.5 ? shade(cl, -0.2) : shade(col, -0.2), alpha: 0.25, seed: seed + 20 + k, scatter: 0.4 }); }
    // lit slope / shadow slope
    for (let k = 0; k < 8; k++) { const t = r(); const p = top[Math.floor(t * n)]; u.brush(ctx, p.x, p.y + 20, p.x + (t < 0.5 ? -60 : 60), p.y + 90, { w: 60, color: t < 0.5 ? shade(col, 0.15) : shade(col, -0.2), alpha: 0.2, seed: seed + 40 + k }); }
    ctx.restore();
    u.ink(ctx, top, { w: 1.8, color: mix(ink, haze, fade * 0.7), alpha: 0.45, jitter: 1.3, seed, taper: 0.2 });
    if (trees) treesOnRidge(ctx, top, { count: trees, seed: seed + 9, kind: 'mixed', scale: 0.55 + (1 - fade) * 0.5, color: shade(col, -0.4), fade: fade * 0.5, haze, x0: x - w * 0.4, x1: x + w * 0.4 });
    // reflection smudge on the water
    u.brush(ctx, x - w * 0.4, y + 14, x + w * 0.4, y + 14, { w: 24, color: shade(col, -0.1), alpha: 0.14, seed: seed + 8, scatter: 0.3 });
    ctx.restore();
  };
  P.islands = (ctx, o = {}) => { const { y = H * 0.6, list = [], seed = 1 } = o; list.slice().sort((a, b) => (a.fade === undefined ? 0 : -a.fade) - (b.fade === undefined ? 0 : -b.fade)).forEach((it, i) => P.island(ctx, Object.assign({ y, seed: seed + i * 7 }, o, it))); };
  P.ground = (ctx, o = {}) => {
    const { y = H * 0.66, bottom = H, color = '#cdb087', dark = '#8d6f4a', light = '#e9d3a8', seed = 1, n = 14 } = o;
    ctx.save(); ctx.fillStyle = u.grad(ctx, 0, y, 0, bottom, [[0, mix(color, light, 0.3)], [1, color]]); ctx.fillRect(0, y, W, bottom - y + 2);
    P.brushBand(ctx, y, bottom, dark, seed + 1, { n, w: 120, alpha: 0.14, tilt: 0.01 }); P.brushBand(ctx, y, bottom, light, seed + 2, { n: n * 0.7, w: 100, alpha: 0.14, tilt: 0.01 });
    const r = R(seed + 6); for (let i = 0; i < 40; i++) { const t = r(); const yy = y + (bottom - y) * t; const len = 20 + 200 * t; const x = r() * W; u.ink(ctx, u.wobble(seg({ x, y: yy }, { x: x + len, y: yy + (r() - 0.5) * 8 }, 4), 2, seed + i), { w: 1 + 2 * t, color: dark, alpha: 0.18, seed: seed + i, taper: 0.5 }); }
    ctx.restore();
  };

  /* --------------------------------------------------- column / temple */
  P.column = (ctx, o = {}) => {
    const { x, y, h = 300, d = 40, seed = 1, light = -0.6, color = '#e8e1d3', shade: sh = '#b9aa9c', deep = '#8a7c86', ink = '#5a4636', inkAlpha = 0.55, fluting = true, capital = true, jitter = 1.1, w = 1.8 } = o;
    const capH = capital ? d * 0.42 : 0, shaftH = h - capH, yTop = y - shaftH;
    const prof = k => (d / 2) * (k < 0.3 ? 1 + 0.03 * (k / 0.3) : 1.03 - 0.26 * ((k - 0.3) / 0.7));
    const Lp = [], Rp = []; const N = 8; for (let i = 0; i <= N; i++) { const k = i / N; const yy = y - shaftH * k, hw = prof(k); Lp.push({ x: x - hw, y: yy }); Rp.push({ x: x + hw, y: yy }); }
    const shaft = [...Lp, ...Rp.slice().reverse()];
    u.shape(ctx, shaft, { fill: color, jitter: jitter * 0.6, seed });
    // shading strip on the side away from light
    const dark = light < 0 ? 1 : -1; const strip = []; for (let i = 0; i <= N; i++) { const k = i / N; const hw = prof(k); strip.push({ x: x + dark * hw * 0.25, y: y - shaftH * k }); } for (let i = N; i >= 0; i--) { const k = i / N; const hw = prof(k); strip.push({ x: x + dark * hw * 1.02, y: y - shaftH * k }); }
    u.wash(ctx, strip, sh, { seed: seed + 1, passes: 2, spread: 2, alpha: 0.75 });
    const strip2 = []; for (let i = 0; i <= N; i++) { const k = i / N; const hw = prof(k); strip2.push({ x: x + dark * hw * 0.62, y: y - shaftH * k }); } for (let i = N; i >= 0; i--) { const k = i / N; const hw = prof(k); strip2.push({ x: x + dark * hw * 1.02, y: y - shaftH * k }); }
    u.wash(ctx, strip2, deep, { seed: seed + 2, passes: 2, spread: 1.5, alpha: 0.5 });
    // reflected light on the far edge of the dark side (classic Ghibli column rim)
    u.ink(ctx, (dark > 0 ? Rp : Lp).map(p => ({ x: p.x - dark * d * 0.06, y: p.y })), { w: d * 0.05, color: mix(sh, '#ffffff', 0.35), alpha: 0.3, seed: seed + 9, jitter: 0.4, taper: 0.2 });
    // lit edge
    u.ink(ctx, Lp.map(p => ({ x: p.x + (dark < 0 ? 0 : d * 0.1) + (dark < 0 ? d * 0.1 : 0) - (dark > 0 ? 0 : 0), y: p.y })), { w: d * 0.08, color: mix(color, '#ffffff', 0.5), alpha: 0.35, seed: seed + 4, jitter: 0.4, taper: 0.2 });
    if (fluting) { const nF = d > 30 ? 3 : 2; for (let f = 1; f <= nF; f++) { const fx = (f / (nF + 1)) * 2 - 1; const pts = []; for (let i = 0; i <= N; i++) { const k = i / N; pts.push({ x: x + fx * prof(k) * 0.9, y: y - shaftH * k }); } u.sketch(ctx, pts, { passes: 1, w: 0.9, jitter: 0.8, seed: seed + 10 + f, alpha: 0.18 * (fx * dark > 0 ? 1.4 : 0.8), color: ink }); } }
    u.ink(ctx, Lp, { w, color: ink, alpha: inkAlpha, jitter, seed, taper: 0.15 }); u.ink(ctx, Rp, { w, color: ink, alpha: inkAlpha, jitter, seed: seed + 3, taper: 0.15 });
    if (capital) {
      const hwT = prof(1); const ech = d * 0.24, ab = capH - ech; const abW = d * 0.68;
      const echinus = [{ x: x - hwT, y: yTop }, { x: x + hwT, y: yTop }, { x: x + hwT + (abW - hwT) * 0.25, y: yTop - ech * 0.3 }, { x: x + abW * 0.96, y: yTop - ech * 0.72 }, { x: x + abW, y: yTop - ech }, { x: x - abW, y: yTop - ech }, { x: x - abW * 0.96, y: yTop - ech * 0.72 }, { x: x - hwT - (abW - hwT) * 0.25, y: yTop - ech * 0.3 }];
      u.shape(ctx, echinus, { fill: color, stroke: ink, w: w * 0.9, jitter: 0.8, seed: seed + 5, alpha: 1, inkOpt: { alpha: inkAlpha } });
      u.wash(ctx, [echinus[0], echinus[1], { x: x + hwT * 0.9, y: yTop - ech * 0.6 }, { x: x - hwT * 0.9, y: yTop - ech * 0.6 }], sh, { seed: seed + 6, passes: 1, spread: 1, alpha: 0.5 });
      const abacus = u.rectPts(x - abW - d * 0.04, yTop - capH, (abW + d * 0.04) * 2, ab);
      u.shape(ctx, abacus, { fill: mix(color, '#ffffff', 0.15), stroke: ink, w: w * 0.9, jitter: 0.7, seed: seed + 7, inkOpt: { alpha: inkAlpha } });
      if (dark > 0) u.wash(ctx, [{ x, y: yTop - ech }, { x: x + abW, y: yTop - ech }, { x: x + hwT, y: yTop }, { x, y: yTop }], deep, { seed: seed + 8, passes: 1, spread: 1, alpha: 0.3 }); else u.wash(ctx, [{ x, y: yTop - ech }, { x: x - abW, y: yTop - ech }, { x: x - hwT, y: yTop }, { x, y: yTop }], deep, { seed: seed + 8, passes: 1, spread: 1, alpha: 0.3 });
    }
    return { top: y - h, yTop, d };
  };
  P.temple = (ctx, o = {}) => {
    const { x = W / 2, y = H * 0.6, w = 700, h = 340, columns = 6, seed = 1, light = -0.6, color = '#e8e1d3', shade: sh = '#b9aa9c', deep = '#8a7c86', ink = '#5a4636', cella = true, inkAlpha = 0.55 } = o;
    const sh1 = h * 0.03; const yS = y - 3 * sh1; const colH = h * 0.5; const d = w / (columns * 2.7); const margin = d * 1.5; const spacing = (w - 2 * margin) / (columns - 1);
    const yE0 = yS - colH; const entH = h * 0.16; const yP = yE0 - entH; const apex = y - h; const r = R(seed + 1);
    const wj = Math.max(1.2, Math.min(2.4, h / 170));
    // cella wall (dark, behind the columns)
    if (cella) { const cw = w - margin * 1.6; u.shape(ctx, u.rectPts(x - cw / 2, yE0 + 2, cw, colH), { fill: deep, jitter: 1, seed: seed + 2 }); u.wash(ctx, u.rectPts(x - cw / 2, yE0 + 2, cw, colH * 0.6), shade(deep, -0.35), { seed: seed + 3, passes: 2, spread: 3, alpha: 0.5 }); const door = u.rectPts(x - d * 0.9, yS - colH * 0.75, d * 1.8, colH * 0.75); u.shape(ctx, door, { fill: shade(deep, -0.55), jitter: 0.8, seed: seed + 4 }); }
    // crepidoma (3 steps)
    for (let i = 0; i < 3; i++) { const inset = i * sh1 * 1.3; const yy = y - i * sh1; const pts = u.rectPts(x - w / 2 + inset, yy - sh1, w - inset * 2, sh1); u.shape(ctx, pts, { fill: i === 2 ? color : mix(color, sh, 0.25 * (2 - i)), stroke: ink, w: wj, jitter: 1, seed: seed + 10 + i, inkOpt: { alpha: inkAlpha * 0.8 } }); u.wash(ctx, u.rectPts(x - w / 2 + inset, yy - sh1 * 0.35, w - inset * 2, sh1 * 0.35), sh, { seed: seed + 20 + i, passes: 1, spread: 1, alpha: 0.4 }); }
    // columns
    for (let i = 0; i < columns; i++) { const cx = x - w / 2 + margin + spacing * i + (r() - 0.5) * 2; P.column(ctx, { x: cx, y: yS, h: colH, d, seed: seed + 100 + i * 3, light, color, shade: sh, deep, ink, inkAlpha, jitter: 1, w: wj }); }
    // entablature: architrave + frieze (triglyphs/metopes) + cornice
    const aH = entH * 0.42, fH = entH * 0.4, cH = entH * 0.18; const ew = w - margin * 0.6;
    u.shape(ctx, u.rectPts(x - ew / 2, yE0 - aH, ew, aH), { fill: mix(color, sh, 0.15), stroke: ink, w: wj, jitter: 1, seed: seed + 30, inkOpt: { alpha: inkAlpha } });
    u.shape(ctx, u.rectPts(x - ew / 2, yE0 - aH - fH, ew, fH), { fill: color, stroke: ink, w: wj, jitter: 1, seed: seed + 31, inkOpt: { alpha: inkAlpha } });
    const nT = columns * 2 - 1; const tw = ew / (nT * 2 - 1);
    for (let i = 0; i < nT * 2 - 1; i += 2) { const tx = x - ew / 2 + tw * i; const tg = u.rectPts(tx + tw * 0.15, yE0 - aH - fH + fH * 0.08, tw * 0.7, fH * 0.84); u.shape(ctx, tg, { fill: mix(sh, deep, 0.4), jitter: 0.6, seed: seed + 40 + i }); for (let g = 1; g <= 2; g++) u.sketch(ctx, [{ x: tx + tw * 0.15 + tw * 0.7 * g / 3, y: yE0 - aH - fH + fH * 0.12 }, { x: tx + tw * 0.15 + tw * 0.7 * g / 3, y: yE0 - aH - fH * 0.12 }], { passes: 1, w: 0.9, jitter: 0.5, alpha: 0.4, seed: seed + g + i, color: ink }); }
    u.shape(ctx, u.rectPts(x - ew / 2 - d * 0.25, yE0 - entH, ew + d * 0.5, cH), { fill: mix(color, '#ffffff', 0.2), stroke: ink, w: wj, jitter: 1, seed: seed + 32, inkOpt: { alpha: inkAlpha } });
    // shadow under cornice onto frieze top / under architrave
    u.wash(ctx, u.rectPts(x - ew / 2, yE0 - aH - fH, ew, fH * 0.25), sh, { seed: seed + 33, passes: 1, spread: 1.5, alpha: 0.5 });
    // pediment
    const pw = ew + d * 0.5; const tri = [{ x: x - pw / 2, y: yP }, { x: x + pw / 2, y: yP }, { x, y: apex }];
    u.shape(ctx, tri, { fill: mix(color, sh, 0.35), jitter: 1, seed: seed + 50 });
    const triIn = [{ x: x - pw / 2 + d * 0.5, y: yP - cH * 0.9 }, { x: x + pw / 2 - d * 0.5, y: yP - cH * 0.9 }, { x, y: apex + cH * 1.6 }];
    u.wash(ctx, triIn, mix(sh, deep, 0.5), { seed: seed + 51, passes: 2, spread: 2, alpha: 0.5 });
    // tympanum: faint sculptural blobs
    for (let i = 0; i < 5; i++) { const t = (i + 0.5) / 5; const px = x - pw * 0.32 + pw * 0.64 * t; const hh = (apex - yP) * (0.25 + 0.4 * Math.sin(Math.PI * t)); u.dab(ctx, px, yP - cH - Math.abs(hh) * 0.5, Math.abs(hh) * 0.55, mix(color, sh, 0.2), 0.5, 0.5); }
    // raking cornices (ink) + horizontal cornice already
    u.ink(ctx, [tri[0], tri[2], tri[1]], { w: wj * 1.3, color: ink, alpha: inkAlpha, jitter: 1.2, seed: seed + 52, taper: 0.1 });
    u.ink(ctx, [{ x: x - pw / 2 + d * 0.3, y: yP - cH * 0.4 }, { x: x - d * 0.2, y: apex + cH * 1.1 }], { w: wj * 0.9, color: ink, alpha: inkAlpha * 0.6, jitter: 1, seed: seed + 53, taper: 0.2 });
    u.ink(ctx, [{ x: x + pw / 2 - d * 0.3, y: yP - cH * 0.4 }, { x: x + d * 0.2, y: apex + cH * 1.1 }], { w: wj * 0.9, color: ink, alpha: inkAlpha * 0.6, jitter: 1, seed: seed + 54, taper: 0.2 });
    // acroteria
    [[x, apex], [x - pw / 2, yP], [x + pw / 2, yP]].forEach(([ax, ay], i) => u.shape(ctx, [{ x: ax - d * 0.18, y: ay }, { x: ax + d * 0.18, y: ay }, { x: ax + d * 0.1, y: ay - d * 0.35 }, { x: ax, y: ay - d * 0.5 }, { x: ax - d * 0.1, y: ay - d * 0.35 }], { fill: color, stroke: ink, w: wj * 0.8, jitter: 0.7, seed: seed + 60 + i, inkOpt: { alpha: inkAlpha * 0.7 } }));
    // sunlit glaze on the lit side
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; u.dab(ctx, x + (light < 0 ? -w * 0.3 : w * 0.3), yS - colH * 0.5, w * 0.35, '#f2c879', 0.12, 0.2); ctx.restore();
    return { stylobateY: yS, colTop: yE0, apexY: apex, columnsX: Array.from({ length: columns }, (_, i) => x - w / 2 + margin + spacing * i) };
  };

  /* ----------------------------------------------------- temple interior */
  P.interior = (ctx, o = {}) => {
    const { seed = 1, vp = [W * 0.5, H * 0.43], depths = [0.95, 1.35, 1.95, 2.8, 4.1, 6], light = -0.4, color = '#a2949a', dark = '#140f22', floor = '#4a4052', fog = '#2a2440', altarSize = 150 } = o;
    const [vx, vy] = vp; const r = R(seed + 1);
    ctx.save();
    ctx.fillStyle = u.grad(ctx, 0, 0, 0, H, [[0, dark], [0.45, fog], [0.62, mix(floor, fog, 0.3)], [1, mix(floor, dark, 0.35)]]); ctx.fillRect(0, 0, W, H);
    P.brushBand(ctx, -20, vy, mix(dark, fog, 0.5), seed + 2, { n: 12, w: 180, alpha: 0.14, tilt: 0.03 });
    // deep end: a dark cella wall with a soft lighter patch above the altar spot
    u.dab(ctx, vx, vy + 30, 420, dark, 0.8, 0.25); u.dab(ctx, vx, vy - 60, 240, shade(dark, -0.5), 0.7, 0.3);
    // floor slabs: converging lines + depth lines
    const floorY = z => vy + (H + 60 - vy) / z;
    for (let i = -7; i <= 7; i++) { const xb = vx + i * 260; const yEnd = floorY(6.5); const xe = vx + (xb - vx) / 6.5; u.ink(ctx, [{ x: xb, y: H + 40 }, { x: xe, y: yEnd }], { w: 2, color: shade(floor, -0.5), alpha: 0.35, jitter: 1.2, seed: seed + 20 + i, taper: 0 }); }
    for (let z = 1; z < 7; z += 0.5 + z * 0.12) { const yy = floorY(z); const hw = W * 0.9 / z + 200; u.ink(ctx, [{ x: vx - hw, y: yy }, { x: vx + hw, y: yy }], { w: 2.2 / Math.sqrt(z), color: shade(floor, -0.5), alpha: 0.28, jitter: 1, seed: seed + 40 + z * 7, taper: 0 }); }
    // marble floor glaze: brushy lighter/darker patches
    for (let k = 0; k < 18; k++) { const z = 1 + r() * 4; const yy = floorY(z); const xx = vx + (r() - 0.5) * W * 1.2 / Math.sqrt(z); u.brush(ctx, xx - 120 / z, yy, xx + 120 / z, yy, { w: 60 / Math.sqrt(z), color: r() < 0.5 ? shade(floor, 0.25) : shade(floor, -0.3), alpha: 0.18, seed: seed + 60 + k, scatter: 0.4 }); }
    // columns, far -> near, two rows
    const ds = depths.slice().sort((a, b) => b - a);
    ds.forEach((z, i) => { const s = 1 / z; const fade = u.clamp((z - 0.9) / 6); const yB = floorY(z); const hC = (H * 1.05) * s; const d = W * 0.055 * s; const xoff = W * 0.46 * s;
      [-1, 1].forEach(side => { const cx = vx + side * xoff; const col = mix(color, fog, fade * 0.85); const shd = mix(shade(color, -0.3), fog, fade * 0.85); const dp = mix(shade(color, -0.55), fog, fade * 0.85);
        // column shadow on the floor
        u.wash(ctx, [{ x: cx - d * 0.6, y: yB }, { x: cx + d * 0.6, y: yB }, { x: cx + d * 0.8 - side * d * 2.2, y: yB + d * 0.9 }, { x: cx - d * 0.8 - side * d * 2.2, y: yB + d * 0.9 }], dark, { seed: seed + 90 + i, passes: 1, spread: 4, alpha: 0.35 * (1 - fade) });
        P.column(ctx, { x: cx, y: yB, h: hC, d, seed: seed + 200 + i * 5 + side, light: side * -0.6, color: col, shade: shd, deep: dp, ink: mix('#1a1420', fog, fade), inkAlpha: 0.6 * (1 - fade * 0.6), jitter: 1, w: 1.4 + s, fluting: z < 3 });
      });
      // ceiling beam between the pair (dark), only for nearer rows
      if (z < 3) { const yT = yB - hC; u.shape(ctx, [{ x: vx - xoff - d * 0.8, y: yT }, { x: vx + xoff + d * 0.8, y: yT }, { x: vx + xoff + d * 0.8, y: yT - d * 0.55 }, { x: vx - xoff - d * 0.8, y: yT - d * 0.55 }], { fill: mix(shade(color, -0.6), dark, 0.4), stroke: '#1a1420', w: 1.6, jitter: 1, seed: seed + 300 + i, inkOpt: { alpha: 0.35 } }); }
    });
    // ambient fog band at floor level + darken corners
    P.brushBand(ctx, floorY(3) - 30, floorY(1.6), fog, seed + 8, { n: 6, w: 160, alpha: 0.1, tilt: 0 });
    ctx.restore();
    return { vp, floorY: floorY(1.6), altar: { x: vx, y: floorY(1.45), size: altarSize } };
  };
  P.lightShaft = (ctx, o = {}) => {
    const { x = W * 0.55, y = -40, angle = Math.PI * 0.64, width = 140, length = 1000, alpha = 0.3, color = '#ffe9b0', seed = 1, spread = 1.7, flicker = 1 } = o;
    const r = R(seed + 2); const dx = Math.cos(angle), dy = Math.sin(angle);
    ctx.save();
    for (let i = 0; i < 4; i++) { const k = 0.35 + r() * 0.7; const off = (r() - 0.5) * width * 0.6; const nx = -dy * off, ny = dx * off; u.ray(ctx, x + nx, y + ny, x + nx + dx * length * (0.9 + r() * 0.2), y + ny + dy * length * (0.9 + r() * 0.2), width * 0.45 * k, width * spread * k * 0.6, color, alpha * flicker * (0.35 + r() * 0.5)); }
    // impact pool
    ctx.globalCompositeOperation = 'lighter'; u.dab(ctx, x + dx * length, y + dy * length, width * spread * 0.8, color, alpha * flicker * 0.35, 0.1);
    ctx.restore();
  };

  /* ---------------------------------------------------------- altar cube */
  // 3/4 view stone block. (x,y) = front-bottom vertex (nearest corner). Returns verts for prop placement.
  P.altarCube = (ctx, o = {}) => {
    const { x = W / 2, y = H * 0.7, size = 160, wx = size, hy = size, dz = size, seed = 1, glow = 0, gold = 0, light = -0.6, color = '#e8e1d3', moss = 0.5, chisel = 1, shadow = true, ink = '#4a3a3a', alpha = 1, jitter = 1.2, w } = o;
    const e1 = { x: 0.84 * wx, y: -0.30 * wx }, e2 = { x: -0.78 * dz, y: -0.36 * dz }, e3 = { x: 0, y: -0.94 * hy };
    const add = (a, b) => ({ x: a.x + b.x, y: a.y + b.y }); const V0 = { x, y }, V1 = add(V0, e1), V2 = add(V0, e2), V3 = add(V0, e3), V4 = add(V3, e1), V5 = add(V3, e2), V6 = add(V4, e2);
    const base = mix(color, '#f3d27a', gold * 0.55); const lit = light < 0 ? 'L' : 'R';
    const top = [V3, V4, V6, V5], right = [V0, V1, V4, V3], left = [V0, V2, V5, V3];
    const cTop = shade(base, 0.12), cL = lit === 'L' ? shade(base, -0.08) : shade(mix(base, '#3b3558', 0.35), -0.15), cR = lit === 'R' ? shade(base, -0.08) : shade(mix(base, '#3b3558', 0.35), -0.15);
    const ww = w || Math.max(1.6, Math.min(3.2, size / 60));
    const r = R(seed + 1);
    ctx.save(); ctx.globalAlpha *= alpha;
    if (glow > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; u.glow(ctx, V3.x + (e1.x + e2.x) * 0.5, V3.y + (e1.y + e2.y) * 0.5 + hy * 0.3, size * 2.2, '#f3d27a', 0.55 * glow); ctx.restore(); }
    if (shadow) { const sh = [V0, V1, add(V1, { x: dz * 0.5, y: dz * 0.1 }), add(V2, { x: dz * 0.4, y: dz * 0.08 }), V2]; u.wash(ctx, sh, '#3b3558', { seed: seed + 2, passes: 2, spread: 5, alpha: 0.28 }); }
    // faces
    const faces = [[left, cL], [right, cR], [top, cTop]];
    faces.forEach(([f, c], i) => u.shape(ctx, f, { fill: c, jitter, seed: seed + 3 + i }));
    // stone texture per face: dabs of lighter/darker, chisel strokes along a face direction
    const faceTex = (f, c, ea, eb, s) => { ctx.save(); clipPoly(ctx, u.wobble(u.resample([...f, f[0]], 10), jitter * 0.5, s)); const rr = R(s);
      for (let k = 0; k < 7; k++) { const a = rr(), b = rr(); const p = { x: f[0].x + ea.x * a + eb.x * b, y: f[0].y + ea.y * a + eb.y * b }; u.dab(ctx, p.x, p.y, size * (0.12 + rr() * 0.2), rr() < 0.5 ? shade(c, -0.14) : shade(c, 0.12), 0.35, 0.3); }
      if (chisel) { const n = Math.round(10 * chisel); for (let k = 0; k < n; k++) { const a = rr(), b = rr(), l = 0.06 + rr() * 0.12; const p = { x: f[0].x + ea.x * a + eb.x * b, y: f[0].y + ea.y * a + eb.y * b }; const q = { x: p.x + ea.x * l * 0.3 + eb.x * l, y: p.y + ea.y * l * 0.3 + eb.y * l }; u.ink(ctx, [p, q], { w: 1.1, color: shade(c, -0.35), alpha: 0.35, jitter: 0.4, seed: s + k, taper: 0.5 }); u.ink(ctx, [{ x: p.x + 1.5, y: p.y + 1.5 }, { x: q.x + 1.5, y: q.y + 1.5 }], { w: 0.9, color: shade(c, 0.3), alpha: 0.35, jitter: 0.4, seed: s + k + 0.5, taper: 0.5 }); } }
      ctx.restore(); };
    faceTex(left, cL, e2, e3, seed + 10); faceTex(right, cR, e1, e3, seed + 20); faceTex(top, cTop, e1, e2, seed + 30);
    // a crack or two
    if (r() < 0.8) { const p0 = add(V0, { x: e3.x * 0.1 + e1.x * 0.5, y: e3.y * 0.1 + e1.y * 0.5 }); const pts = [p0]; let p = p0; for (let k = 0; k < 4; k++) { p = add(p, { x: e3.x * 0.12 + (r() - 0.5) * size * 0.1, y: e3.y * 0.12 + (r() - 0.5) * size * 0.05 }); pts.push(p); } u.ink(ctx, pts, { w: 1.2, color: shade(cR, -0.5), alpha: 0.5, jitter: 0.8, seed: seed + 40, taper: 0.6 }); }
    // moss / weathering at base edges
    if (moss > 0) { const n = Math.round(9 * moss); for (let k = 0; k < n; k++) { const t = r(); const onL = r() < 0.5; const p = onL ? add(V0, { x: e2.x * t, y: e2.y * t }) : add(V0, { x: e1.x * t, y: e1.y * t }); u.dab(ctx, p.x, p.y - r() * size * 0.08, size * (0.03 + r() * 0.05), r() < 0.6 ? '#6f8a4e' : '#4e6a3a', 0.6 * moss, 0.3); } u.brush(ctx, V2.x, V2.y, V0.x, V0.y, { w: size * 0.06, color: '#5a4a3a', alpha: 0.18 * moss, seed: seed + 50, scatter: 0.4 }); u.brush(ctx, V0.x, V0.y, V1.x, V1.y, { w: size * 0.06, color: '#5a4a3a', alpha: 0.18 * moss, seed: seed + 51, scatter: 0.4 }); }
    // edges
    const E = [[V0, V1], [V1, V4], [V4, V3], [V3, V0], [V0, V2], [V2, V5], [V5, V3], [V4, V6], [V6, V5]];
    E.forEach(([a, b], i) => u.ink(ctx, [a, b], { w: ww, color: ink, alpha: 0.7, jitter: jitter, seed: seed + 60 + i, taper: 0.15 }));
    if (glow > 0) { ctx.save(); E.forEach(([a, b], i) => u.glowLine(ctx, [a, b], { color: '#f3d27a', w: ww * 0.9, halo: ww * 6, alpha: glow, seed: seed + 70 + i, jitter: 0.6 })); ctx.globalCompositeOperation = 'lighter'; u.glow(ctx, V3.x + (e1.x + e2.x) * 0.5, V3.y + (e1.y + e2.y) * 0.5, size * 0.9, '#ffe9b0', 0.35 * glow); ctx.restore(); }
    ctx.restore();
    return { top: { x: V3.x + (e1.x + e2.x) * 0.5, y: V3.y + (e1.y + e2.y) * 0.5 }, center: { x: V3.x + (e1.x + e2.x) * 0.5, y: V3.y + (e1.y + e2.y) * 0.5 - e3.y * 0.5 }, verts: { V0, V1, V2, V3, V4, V5, V6 }, e1, e2, e3 };
  };
  P.stoneBlock = (ctx, o = {}) => P.altarCube(ctx, Object.assign({ glow: 0, moss: 0.15, chisel: 0.8, color: '#d8cfbf' }, o));
  // stone-filled cube on the engine's 3D camera (u.cubeFaces) — for S02 crossfade with u.cube
  P.altarCube3d = (ctx, Pc, o = {}) => {
    const { origin = [0, 0, 0], size = 1, seed = 1, color = '#e8e1d3', ink = '#4a3a3a', w = 2.4, alpha = 1, glow = 0, gold = 0, light = -0.6, chisel = 1, jitter = 1 } = o;
    const faces = u.cubeFaces(Pc, origin, size); const front = faces.slice(3); const base = mix(color, '#f3d27a', gold * 0.55);
    ctx.save(); ctx.globalAlpha *= alpha;
    if (glow > 0) { const c = Pc(origin[0] + size / 2, origin[1] + size / 2, origin[2] + size / 2); ctx.save(); ctx.globalCompositeOperation = 'lighter'; u.glow(ctx, c.x, c.y, c.s * size * 1.6, '#f3d27a', 0.5 * glow); ctx.restore(); }
    // face index i: 0 z-min,1 z-max,2 y-min(bottom),3 y-max(top),4 x-min,5 x-max
    front.forEach((f, k) => { const i = f.i; const tone = i === 3 ? 0.12 : i === 2 ? -0.45 : ((i === 4 || i === 0) === (light < 0)) ? -0.06 : -0.26; const c = tone > 0 ? shade(base, tone) : shade(mix(base, '#3b3558', -tone * 0.9), tone * 0.6);
      u.shape(ctx, f.pts, { fill: c, jitter, seed: seed + 3 + k });
      ctx.save(); clipPoly(ctx, u.wobble(u.resample([...f.pts, f.pts[0]], 10), jitter * 0.5, seed + 3 + k)); const rr = R(seed + 10 + i); const ea = { x: f.pts[1].x - f.pts[0].x, y: f.pts[1].y - f.pts[0].y }, eb = { x: f.pts[3].x - f.pts[0].x, y: f.pts[3].y - f.pts[0].y }; const px = Math.hypot(ea.x, ea.y);
      for (let q = 0; q < 6; q++) { const a = rr(), b = rr(); u.dab(ctx, f.pts[0].x + ea.x * a + eb.x * b, f.pts[0].y + ea.y * a + eb.y * b, px * (0.1 + rr() * 0.18), rr() < 0.5 ? shade(c, -0.14) : shade(c, 0.12), 0.35, 0.3); }
      if (chisel) for (let q = 0; q < 8 * chisel; q++) { const a = rr(), b = rr(), l = 0.06 + rr() * 0.1; const p = { x: f.pts[0].x + ea.x * a + eb.x * b, y: f.pts[0].y + ea.y * a + eb.y * b }; const q2 = { x: p.x + ea.x * l * 0.3 + eb.x * l, y: p.y + ea.y * l * 0.3 + eb.y * l }; u.ink(ctx, [p, q2], { w: 1.1, color: shade(c, -0.35), alpha: 0.35, jitter: 0.4, seed: seed + q + i * 9, taper: 0.5 }); }
      ctx.restore(); });
    // visible edges = edges of front faces
    const keyOf = (a, b) => { const ka = a.x.toFixed(1) + ',' + a.y.toFixed(1), kb = b.x.toFixed(1) + ',' + b.y.toFixed(1); return ka < kb ? ka + '|' + kb : kb + '|' + ka; }; const seen = new Set(); let n = 0;
    front.forEach(f => { for (let i = 0; i < 4; i++) { const a = f.pts[i], b = f.pts[(i + 1) % 4]; const k = keyOf(a, b); if (seen.has(k)) continue; seen.add(k); n++; u.ink(ctx, [a, b], { w, color: ink, alpha: 0.7, jitter, seed: seed + 60 + n, taper: 0.15 }); if (glow > 0) u.glowLine(ctx, [a, b], { color: '#f3d27a', w: w * 0.9, halo: w * 6, alpha: glow, seed: seed + 80 + n, jitter: 0.6 }); } });
    ctx.restore();
  };

  /* ------------------------------------------------------ foliage / trees */
  P.foliage = (ctx, o = {}) => {
    const { x, y, rx = 80, ry = 60, seed = 1, color = '#6f8a4e', light, shadow, lightDir = -0.6, n = 14, alpha = 1 } = o;
    const lt = light || shade(color, 0.25), sd = shadow || mix(color, '#3b3558', 0.45); const r = R(seed + 1);
    ctx.save(); ctx.globalAlpha *= alpha;
    const cl = []; for (let i = 0; i < n; i++) { const a = r() * TAU, d = Math.sqrt(r()); cl.push({ x: x + Math.cos(a) * d * rx, y: y + Math.sin(a) * d * ry, r: (rx + ry) * 0.5 * (0.24 + r() * 0.24) }); }
    // union of wobbly clump discs = flat silhouette (no gradient rings), then global shading inside the clip
    const discs = cl.map((c, i) => u.wobble(u.circlePts(c.x, c.y, c.r, 14), 1.5, seed + i));
    const unionPath = () => { ctx.beginPath(); discs.forEach(d => { ctx.moveTo(d[0].x, d[0].y); for (let i = 1; i < d.length; i++) ctx.lineTo(d[i].x, d[i].y); ctx.closePath(); }); };
    unionPath(); ctx.fillStyle = color; ctx.fill();
    ctx.save(); unionPath(); ctx.clip();
    const R0 = Math.max(rx, ry);
    u.dab(ctx, x - lightDir * R0 * 0.35, y + ry * 0.55, R0 * 1.25, sd, 0.75, 0.1);   // big shadow mass, low-right
    u.dab(ctx, x + lightDir * R0 * 0.4, y - ry * 0.45, R0 * 0.95, lt, 0.6, 0.05);   // light mass, upper-left
    cl.forEach((c, i) => { if (i % 2) u.dab(ctx, c.x - lightDir * c.r * 0.3, c.y + c.r * 0.4, c.r * 0.9, sd, 0.3, 0.1); else u.dab(ctx, c.x + lightDir * c.r * 0.3, c.y - c.r * 0.35, c.r * 0.6, lt, 0.35, 0.1); });
    // leaf-cluster dabs along the rim (spiky silhouette feel) + squiggles
    for (let i = 0; i < n; i++) { const c = cl[i]; const a = r() * TAU; u.dab(ctx, c.x + Math.cos(a) * c.r * 0.8, c.y + Math.sin(a) * c.r * 0.8, c.r * 0.35, Math.sin(a) > 0 ? sd : lt, 0.35, 0.2); }
    ctx.restore();
    for (let i = 0; i < Math.max(2, n * 0.35); i++) { const c = cl[Math.floor(r() * cl.length)]; const pts = []; for (let k = 0; k < 4; k++) pts.push({ x: c.x + (r() - 0.5) * c.r * 1.3, y: c.y + (r() - 0.5) * c.r * 1.3 }); u.ink(ctx, u.curve(pts, 4), { w: 1.3, color: shade(sd, -0.2), alpha: 0.45, jitter: 0.8, seed: seed + 30 + i, taper: 0.6 }); }
    ctx.restore();
  };
  P.olive = (ctx, o = {}) => {
    const { x, y, scale = 1, seed = 1, light = -0.6, trunk = '#6b5541', leaf = '#8a9a6a', alpha = 1 } = o; const r = R(seed + 2); const s = scale;
    ctx.save(); ctx.globalAlpha *= alpha;
    // gnarled trunk: wobbly polyline widened into a shape
    const spine = [{ x, y }]; let px = x, py = y; for (let k = 1; k <= 4; k++) { px += (r() - 0.5) * 30 * s; py -= (22 + r() * 14) * s; spine.push({ x: px, y: py }); }
    const left = [], right = []; spine.forEach((p, i) => { const w = (14 - i * 2.4) * s; left.push({ x: p.x - w, y: p.y }); right.push({ x: p.x + w, y: p.y }); });
    const trunkPts = [...left, ...right.reverse()]; u.shape(ctx, trunkPts, { fill: trunk, stroke: shade(trunk, -0.5), w: 1.6 * Math.max(0.5, s), jitter: 1.4, seed, inkOpt: { alpha: 0.6 } });
    u.wash(ctx, [...left.slice(0, 5), ...left.slice(0, 5).reverse().map(p => ({ x: p.x + 6 * s, y: p.y }))], shade(trunk, light < 0 ? 0.3 : -0.4), { seed: seed + 3, passes: 1, spread: 1, alpha: 0.4 });
    for (let k = 0; k < 3; k++) { const p = spine[2 + (k % 2)]; const b = [p, { x: p.x + (r() - 0.5) * 70 * s, y: p.y - (20 + r() * 25) * s }, { x: p.x + (r() - 0.5) * 110 * s, y: p.y - (45 + r() * 30) * s }]; u.ink(ctx, u.curve(b, 5), { w: (6 - k) * s, color: trunk, alpha: 0.95, jitter: 1.4, seed: seed + 10 + k, taper: 0.5 }); }
    // canopy: 3-5 clumps, grey-green
    const top = spine[spine.length - 1]; const nC = 3 + Math.floor(r() * 3); const clumps = [];
    for (let k = 0; k < nC; k++) clumps.push({ x: top.x + (r() - 0.5) * 150 * s, y: top.y - (10 + r() * 50) * s, rx: (45 + r() * 35) * s, ry: (32 + r() * 22) * s });
    clumps.sort((a, b) => a.y - b.y).forEach((c, k) => P.foliage(ctx, { x: c.x, y: c.y, rx: c.rx, ry: c.ry, seed: seed + 20 + k, color: leaf, light: shade(leaf, 0.3), shadow: mix(leaf, '#3b3558', 0.45), lightDir: light, n: 10 }));
    ctx.restore();
  };
  P.cypress = (ctx, o = {}) => {
    const { x, y, scale = 1, seed = 1, color = '#2f3d2a', alpha = 1, lean = 0 } = o; const r = R(seed + 5); const s = scale; const hgt = (150 + r() * 60) * s, wid = (22 + r() * 10) * s;
    const L = [], Rr = []; const N = 10; for (let i = 0; i <= N; i++) { const k = i / N; const env = Math.pow(Math.sin(Math.PI * Math.min(1, k * 0.92 + 0.05)), 0.7) * (1 - k * 0.55); const hw = wid * env * (0.8 + u.noise2(k * 6 + seed, seed) * 0.6); const xx = x + lean * k * k * 30 * s + u.snoise(k * 3 + seed, 1) * 3 * s; L.push({ x: xx - hw, y: y - hgt * k }); Rr.push({ x: xx + hw, y: y - hgt * k }); }
    const pts = [...L, ...Rr.reverse()];
    ctx.save(); ctx.globalAlpha *= alpha;
    u.shape(ctx, pts, { fill: color, jitter: 2.2, seed });
    // texture: lighter dabs on the lit side, darker on the other
    for (let i = 1; i < N; i++) { const p = L[i], q = Rr[N - i]; const cx = (p.x + q.x) / 2, hw = (q.x - p.x) / 2; if (hw < 2) continue; u.dab(ctx, cx - hw * 0.45, p.y + (r() - 0.5) * 8, hw * 0.75, shade(color, 0.22), 0.4, 0.3); u.dab(ctx, cx + hw * 0.5, p.y + (r() - 0.5) * 8, hw * 0.7, shade(color, -0.35), 0.4, 0.3); }
    u.ink(ctx, pts, { w: 1.2 * Math.max(0.6, s), color: shade(color, -0.4), alpha: 0.5, jitter: 1.6, seed: seed + 1, closed: true });
    u.ink(ctx, [{ x, y }, { x, y: y - hgt * 0.1 }], { w: 3 * s, color: '#4a3a2a', alpha: 0.8, seed: seed + 2 });
    ctx.restore();
  };
  P.tuft = (ctx, o = {}) => {
    const { x, y, seed = 1, color = '#7a8a4a', height = 40, sway = 0, blades = 7, alpha = 0.9, w = 2 } = o; const r = R(seed + 3);
    ctx.save(); ctx.globalAlpha *= alpha;
    for (let i = 0; i < blades; i++) { const hgt = height * (0.55 + r() * 0.5); const dir = (i / (blades - 1) - 0.5) * 1.6 + (r() - 0.5) * 0.4; const bx = x + (r() - 0.5) * 10; const tipX = bx + dir * hgt * 0.5 + sway * hgt * 0.6, tipY = y - hgt + Math.abs(sway) * hgt * 0.15; const mid = { x: bx + dir * hgt * 0.2 + sway * hgt * 0.2, y: y - hgt * 0.55 }; u.ink(ctx, u.curve([{ x: bx, y }, mid, { x: tipX, y: tipY }], 5), { w: w * (0.8 + r() * 0.5), color: i % 3 === 0 ? shade(color, 0.2) : i % 3 === 1 ? color : shade(color, -0.25), alpha: 0.9, jitter: 0.4, seed: seed + i, taper: 0.9, step: 4 }); }
    ctx.restore();
  };
  // [frame] wind-swayed tufts across a strip; sway quantized to 12fps holds
  P.grass = (ctx, t, o = {}) => {
    const { x = 0, y = H * 0.8, w = W, count = 14, seed = 1, color = '#7a8a4a', height = 40, wind = 0.5, alpha = 0.9, blades = 7 } = o; const r = R(seed + 8); const tq = u.tq(t, 12);
    for (let i = 0; i < count; i++) { const tx = x + r() * w, ty = y + (r() - 0.5) * 20, ph = r() * TAU, hs = 0.7 + r() * 0.6; const sway = wind * (0.55 * Math.sin(tq * 1.9 + ph + tx * 0.004) + 0.3 * Math.sin(tq * 4.3 + ph * 2) + 0.15); P.tuft(ctx, { x: tx, y: ty, seed: seed + i * 11, color, height: height * hs, sway, blades, alpha }); }
  };

  /* -------------------------------------------------------- lamp / flame */
  P.lamp = (ctx, o = {}) => {
    const { x, y, scale = 1, seed = 1, color = '#9a6a3a' } = o; const s = scale; // (x,y) = spout tip where the flame sits
    const body = [{ x: x - 44 * s, y: y + 8 * s }, { x: x - 36 * s, y: y + 22 * s }, { x: x - 8 * s, y: y + 26 * s }, { x: x + 4 * s, y: y + 18 * s }, { x: x + 2 * s, y: y + 6 * s }, { x: x - 10 * s, y: y + 2 * s }, { x: x - 30 * s, y: y + 1 * s }];
    u.shape(ctx, body, { fill: color, stroke: shade(color, -0.55), w: 1.6, jitter: 1, seed, inkOpt: { alpha: 0.7 } });
    u.wash(ctx, [body[0], body[1], { x: x - 20 * s, y: y + 24 * s }, { x: x - 28 * s, y: y + 10 * s }], shade(color, -0.35), { seed: seed + 1, passes: 1, spread: 1, alpha: 0.5 });
    u.dab(ctx, x - 24 * s, y + 10 * s, 10 * s, shade(color, 0.3), 0.5, 0.3);
    u.shape(ctx, u.ellipsePts(x - 26 * s, y + 6 * s, 9 * s, 4 * s, 16), { fill: shade(color, -0.6), jitter: 0.5, seed: seed + 2 });
    u.ink(ctx, [{ x: x - 2 * s, y: y + 4 * s }, { x: x + 1 * s, y: y - 2 * s }], { w: 2 * s, color: '#2b1d14', alpha: 0.8, seed }); // wick
  };
  // [frame] boiling flame: hold at 8fps (boil), teardrop shape drawn with u.shape
  P.flame = (ctx, t, o = {}) => {
    const { x, y, scale = 1, seed = 1, color = '#ffb640', core = '#fff3c4', alpha = 1 } = o; const b = u.boil(t); const r = R(seed * 13 + b);
    const h = (26 + r() * 10) * scale, lean = (r() - 0.5) * 8 * scale, wv = (7 + r() * 3) * scale;
    const pts = u.curve([{ x: x - wv, y }, { x: x - wv * 0.9 + lean * 0.3, y: y - h * 0.45 }, { x: x + lean, y: y - h }, { x: x + wv * 0.9 + lean * 0.3, y: y - h * 0.45 }, { x: x + wv, y }], 4, true);
    ctx.save(); ctx.globalAlpha *= alpha; ctx.globalCompositeOperation = 'lighter';
    u.glow(ctx, x, y - h * 0.4, h * 1.6, color, 0.45);
    u.shape(ctx, pts, { fill: color, jitter: 0.8, seed: b + seed, alpha: 0.9 });
    const in2 = pts.map(p => ({ x: x + (p.x - x) * 0.5, y: y + (p.y - y) * 0.55 })); u.shape(ctx, in2, { fill: core, jitter: 0.5, seed: b + seed + 1, alpha: 0.95 });
    ctx.restore();
  };
  // [frame] flame + warm light pool whose intensity flickers (8fps holds)
  P.lampFlicker = (ctx, t, o = {}) => {
    const { x, y, scale = 1, seed = 1, pool = 320, poolColor = '#ffb640', alpha = 1 } = o; const b = u.boil(t); const r = R(seed * 7 + b);
    const k = 0.82 + r() * 0.18;
    ctx.save(); ctx.globalAlpha *= alpha; ctx.globalCompositeOperation = 'lighter';
    u.glow(ctx, x, y - 10 * scale, pool * scale * k, poolColor, 0.22 * k); u.glow(ctx, x, y - 10 * scale, pool * 0.45 * scale * k, '#ffd98a', 0.18 * k);
    ctx.restore();
    P.flame(ctx, t, { x, y, scale, seed, alpha });
  };

  /* ------------------------------------------------ papyrus / sand tray */
  P.papyrus = (ctx, o = {}) => {
    const { x, y, w = 360, h = 200, seed = 1, rolled = true, color = '#e6d3a3', ink = '#5a4636', alpha = 1, rot = 0 } = o; const r = R(seed + 4);
    ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(x + w / 2, y + h / 2); ctx.rotate(rot); ctx.translate(-(x + w / 2), -(y + h / 2));
    const sheet = u.rectPts(x, y, w, h);
    u.wash(ctx, u.rectPts(x + 6, y + 8, w, h), '#3b3558', { seed, passes: 1, spread: 3, alpha: 0.25 }); // cast shadow
    u.shape(ctx, sheet, { fill: color, stroke: ink, w: 1.5, jitter: 2, seed, inkOpt: { alpha: 0.55 } });
    ctx.save(); clipPoly(ctx, u.wobble(u.resample([...sheet, sheet[0]], 10), 1, seed));
    // fibres: faint horizontal and vertical strokes
    for (let i = 0; i < 18; i++) { const yy = y + r() * h; u.ink(ctx, [{ x: x + r() * 30, y: yy }, { x: x + w - r() * 30, y: yy + (r() - 0.5) * 4 }], { w: 1 + r() * 2, color: shade(color, -0.2), alpha: 0.18, jitter: 0.5, seed: seed + i, taper: 0.3 }); }
    for (let i = 0; i < 10; i++) { const xx = x + r() * w; u.ink(ctx, [{ x: xx, y: y + r() * 20 }, { x: xx + (r() - 0.5) * 4, y: y + h - r() * 20 }], { w: 1 + r() * 1.5, color: shade(color, -0.15), alpha: 0.12, jitter: 0.5, seed: seed + 30 + i, taper: 0.3 }); }
    P.brushBand(ctx, y, y + h, shade(color, -0.12), seed + 2, { n: 4, w: 40, alpha: 0.18, tilt: 0, x0: x, x1: x + w, scatter: 0.4 }); u.dab(ctx, x + w * 0.3, y + h * 0.4, w * 0.35, shade(color, 0.2), 0.35, 0.3);
    ctx.restore();
    if (rolled) { [[x, -1], [x + w, 1]].forEach(([rx, dir], i) => { const rr = h * 0.08; const roll = u.rectPts(rx - rr, y - rr * 0.3, rr * 2, h + rr * 0.6); u.shape(ctx, roll, { fill: shade(color, -0.1), stroke: ink, w: 1.5, jitter: 1.2, seed: seed + 50 + i, inkOpt: { alpha: 0.6 } }); u.wash(ctx, u.rectPts(rx - rr + (dir < 0 ? 0 : rr * 1.1), y - rr * 0.3, rr * 0.9, h + rr * 0.6), shade(color, -0.35), { seed: seed + 55 + i, passes: 1, spread: 1, alpha: 0.5 }); u.shape(ctx, u.ellipsePts(rx, y - rr * 0.3, rr, rr * 0.5, 16), { fill: shade(color, -0.25), stroke: ink, w: 1.2, jitter: 0.6, seed: seed + 57 + i, inkOpt: { alpha: 0.5 } }); u.ink(ctx, u.ellipsePts(rx, y - rr * 0.3, rr * 0.5, rr * 0.25, 12, 0, 0, Math.PI * 1.7), { w: 1, color: ink, alpha: 0.4, seed: seed + 58 + i }); }); }
    ctx.restore();
  };
  P.sandTray = (ctx, o = {}) => {
    const { x, y, w = 420, h = 260, seed = 1, wood = '#7a5a3a', sand = '#d9c49a', ink = '#3a2a1a' } = o; const r = R(seed + 6); const f = Math.max(10, Math.min(22, w * 0.045));
    u.wash(ctx, u.rectPts(x + 8, y + 10, w, h), '#3b3558', { seed, passes: 1, spread: 4, alpha: 0.28 });
    u.shape(ctx, u.rectPts(x, y, w, h), { fill: wood, stroke: ink, w: 2, jitter: 1.4, seed, inkOpt: { alpha: 0.7 } });
    // wood grain on the frame
    for (let i = 0; i < 8; i++) { const yy = y + (i < 4 ? r() * f : h - r() * f); u.ink(ctx, [{ x: x + 10, y: yy }, { x: x + w - 10, y: yy + (r() - 0.5) * 3 }], { w: 1, color: shade(wood, -0.4), alpha: 0.35, jitter: 0.6, seed: seed + i, taper: 0.3 }); }
    const inner = u.rectPts(x + f, y + f, w - 2 * f, h - 2 * f);
    u.shape(ctx, inner, { fill: sand, stroke: ink, w: 1.6, jitter: 1, seed: seed + 1, inkOpt: { alpha: 0.6 } });
    ctx.save(); clipPoly(ctx, inner);
    P.brushBand(ctx, y + f, y + h - f, shade(sand, -0.1), seed + 2, { n: 5, w: 50, alpha: 0.2, tilt: 0, x0: x + f, x1: x + w - f, scatter: 0.4 });
    u.wash(ctx, u.rectPts(x + f, y + f, w - 2 * f, f * 1.2), shade(sand, -0.35), { seed: seed + 3, passes: 2, spread: 3, alpha: 0.4 }); u.wash(ctx, u.rectPts(x + f, y + f, f * 1.2, h - 2 * f), shade(sand, -0.35), { seed: seed + 4, passes: 2, spread: 3, alpha: 0.35 });
    for (let i = 0; i < 160; i++) { const px = x + f + r() * (w - 2 * f), py = y + f + r() * (h - 2 * f); u.dab(ctx, px, py, 1 + r() * 2.2, r() < 0.5 ? shade(sand, -0.3) : shade(sand, 0.3), 0.45, 0.2); }
    ctx.restore();
    return { x: x + f, y: y + f, w: w - 2 * f, h: h - 2 * f };
  };
  P.sandLine = (ctx, pts, o = {}) => {
    const { seed = 1, w = 4, alpha = 1, color = '#8a6d45', hi = '#efe0b8', closed = false } = o;
    ctx.save(); ctx.globalAlpha *= alpha;
    u.ink(ctx, pts.map(p => ({ x: p.x - 1.5, y: p.y - 1.5 })), { w: w * 0.8, color: hi, alpha: 0.6, jitter: 0.8, seed: seed + 1, closed, taper: 0.3 });
    u.ink(ctx, pts, { w, color, alpha: 0.85, jitter: 0.9, seed, closed, taper: 0.3 });
    u.ink(ctx, pts, { w: w * 0.4, color: shade(color, -0.35), alpha: 0.6, jitter: 0.6, seed: seed + 2, closed, taper: 0.3 });
    ctx.restore();
  };

  /* -------------------------------------------- per-frame effects (cheap) */
  P.particles = (ctx, t, o = {}) => {
    const { kind = 'dust', count = 40, box = [0, 0, W, H], seed = 1, color, size = 1, speed = 1, alpha = 1 } = o; const [bx, by, bw, bh] = box; const r = R(seed + 17);
    const col = color || { dust: '#ffe9b0', ember: '#ffa040', leaf: '#8a9a4a', glint: '#fff6dc' }[kind];
    ctx.save(); ctx.globalAlpha *= alpha; if (kind !== 'leaf') ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < count; i++) {
      const x0 = r() * bw, y0 = r() * bh, ph = r() * TAU, sp = (0.6 + r() * 0.8) * speed, sz = (0.6 + r() * 0.9) * size;
      let x, y, a;
      if (kind === 'dust') { x = x0 + Math.sin(t * 0.35 * sp + ph) * 28 + t * 6 * sp; y = y0 - t * 9 * sp + Math.cos(t * 0.5 + ph) * 10; a = 0.25 + 0.3 * (0.5 + 0.5 * Math.sin(t * 1.1 + ph)); }
      else if (kind === 'ember') { x = x0 + Math.sin(t * 1.3 * sp + ph) * 18; y = y0 - t * 60 * sp; a = 0.4 + 0.5 * (0.5 + 0.5 * Math.sin(t * 7 + ph * 3)); }
      else if (kind === 'leaf') { x = x0 + t * 40 * sp + Math.sin(t * 1.5 + ph) * 30; y = y0 + t * 45 * sp + Math.sin(t * 2.2 + ph) * 12; a = 0.9; }
      else { x = x0; y = y0; const tw = 0.5 + 0.5 * Math.sin(t * (1.5 + sp) * 2 + ph); a = tw * tw * 0.9; }
      x = bx + (((x % bw) + bw) % bw); y = by + (((y % bh) + bh) % bh);
      if (kind === 'leaf') { const rot = t * 2 * sp + ph; u.shape(ctx, u.ellipsePts(x, y, 9 * sz, 4 * sz, 10, rot), { fill: col, jitter: 0.6, seed: seed + i, alpha: a }); }
      else if (kind === 'glint') { const rr = (3 + 4 * sz) * a; u.dab(ctx, x, y, rr * 1.8, col, a * 0.35, 0.1); u.ink(ctx, [{ x: x - rr, y }, { x: x + rr, y }], { w: 1.2, color: col, alpha: a, jitter: 0.2, seed: i, taper: 0.9 }); u.ink(ctx, [{ x, y: y - rr }, { x, y: y + rr }], { w: 1.2, color: col, alpha: a, jitter: 0.2, seed: i + 1, taper: 0.9 }); }
      else { const rr = (kind === 'ember' ? 2.2 : 3) * sz; u.dab(ctx, x, y, rr * 2.2, col, a * 0.5, 0.15); u.dab(ctx, x, y, rr * 0.8, kind === 'ember' ? '#fff0b0' : col, a * 0.9, 0.5); }
    }
    ctx.restore();
  };
  // gulls: tiny "M" silhouettes, 4-key flap cycle held at 12fps
  P.birds = (ctx, t, o = {}) => {
    const { count = 5, seed = 1, box = [0, 60, W, 420], scale = 1, color = '#2b2a3a', speed = 1, alpha = 0.85 } = o; const [bx, by, bw, bh] = box; const r = R(seed + 23); const f = u.frame(t, 12);
    const KEY = [-1, -0.2, 0.9, 0.1];
    ctx.save(); ctx.globalAlpha *= alpha;
    for (let i = 0; i < count; i++) {
      const x0 = r() * bw, y0 = r() * bh, ph = r() * TAU, sp = (40 + r() * 40) * speed, s = scale * (0.6 + r() * 0.8), dir = r() < 0.75 ? 1 : -1, fo = Math.floor(r() * 4);
      const x = bx + ((((x0 + dir * t * sp) % bw) + bw) % bw), y = by + y0 + Math.sin(t * 0.8 + ph) * 14; const k = KEY[(f + fo) % 4];
      const wl = 14 * s, dy = -k * 7 * s;
      const left = u.curve([{ x: x - wl, y: y + dy }, { x: x - wl * 0.5, y: y + dy * 0.35 - 1.5 * s }, { x, y }], 3), right = u.curve([{ x, y }, { x: x + wl * 0.5, y: y + dy * 0.35 - 1.5 * s }, { x: x + wl, y: y + dy }], 3);
      u.ink(ctx, left, { w: 2.2 * s, color, alpha: 1, jitter: 0.3, seed: i + f, taper: 0.7, step: 3 }); u.ink(ctx, right, { w: 2.2 * s, color, alpha: 1, jitter: 0.3, seed: i + f + 9, taper: 0.7, step: 3 });
    }
    ctx.restore();
  };
  P.smoke = (ctx, t, o = {}) => {
    const { x, y, seed = 1, scale = 1, alpha = 0.5, color = '#cfc6c0', count = 9, rise = 160, wind = 0.4 } = o; const r = R(seed + 31);
    ctx.save(); ctx.globalAlpha *= alpha;
    for (let i = 0; i < count; i++) { const ph = r(), sw = r() * TAU, sp = 0.7 + r() * 0.6; const age = ((t * 0.22 * sp + ph) % 1); const px = x + age * age * wind * rise * scale * 1.5 + Math.sin(age * 6 + sw) * 12 * scale * age; const py = y - age * rise * scale; const rad = (8 + age * 42) * scale; u.dab(ctx, px, py, rad, color, (1 - age) * (1 - age) * 0.55 + 0.05, 0.25); }
    ctx.restore();
  };

  /* ------------------------------------------------------ composed sets */
  P.workshop = (ctx, o = {}) => {
    const { seed = 1, sky = 'day' } = o; const r = R(seed + 41); const gy = H * 0.64;
    P.sky(ctx, { preset: sky, seed, horizon: gy, cloudCount: 4, sun: sky === 'dawn' ? { x: W * 0.2, y: gy - 60, r: 50 } : false });
    P.hills(ctx, { layers: [{ y: gy - 190, amp: 110, color: '#8a7a5a', trees: 0, fade: 0.6 }, { y: gy - 90, amp: 70, color: '#8a6f45', trees: 5, treeKind: 'cypress', fade: 0.35 }], seed: seed + 2, haze: '#e8d6b8', bottom: gy + 10 });
    // quarry rock face on the right/mid: strata
    const rockTop = ridge(gy - 330, 70, 0.002, seed + 5, W * 0.42, W + 60, 24); const rock = [{ x: W * 0.42, y: gy + 10 }, ...rockTop, { x: W + 60, y: gy + 10 }];
    u.shape(ctx, rock, { fill: '#c9b088', jitter: 2, seed: seed + 6 });
    ctx.save(); clipPoly(ctx, rock);
    for (let i = 0; i < 9; i++) { const yy = gy - 300 + i * 36 + r() * 10; u.brush(ctx, W * 0.4, yy, W + 60, yy + (r() - 0.5) * 30, { w: 34, color: i % 2 ? '#b89a6e' : '#d9c19a', alpha: 0.35, seed: seed + 10 + i, scatter: 0.3 }); u.ink(ctx, u.wobble(seg({ x: W * 0.42 + r() * 200, y: yy + 14 }, { x: W + 40, y: yy + 14 + (r() - 0.5) * 24 }, 10), 3, seed + i), { w: 1.6, color: '#6a5436', alpha: 0.4, jitter: 1.5, seed: seed + 20 + i, taper: 0.2 }); }
    for (let i = 0; i < 10; i++) { const xx = W * 0.45 + r() * W * 0.55, yy = gy - 280 + r() * 260; u.dab(ctx, xx, yy, 40 + r() * 70, r() < 0.5 ? '#9c7f55' : '#e3cfa6', 0.3, 0.3); }
    // cut-block notches
    for (let i = 0; i < 4; i++) { const xx = W * 0.55 + i * 200 + r() * 60, yy = gy - 60 - r() * 90; u.shape(ctx, u.rectPts(xx, yy, 90 + r() * 60, 50 + r() * 30), { fill: '#8f7450', stroke: '#5a4634', w: 1.6, jitter: 1.5, seed: seed + 30 + i, inkOpt: { alpha: 0.6 } }); }
    ctx.restore();
    u.ink(ctx, rockTop, { w: 2, color: '#5a4634', alpha: 0.6, jitter: 1.6, seed: seed + 7, taper: 0 });
    // ground
    P.ground(ctx, { y: gy, color: '#cdb087', dark: '#8d6f4a', light: '#ecd9b0', seed: seed + 3 });
    // dust haze in mid-ground
    for (let i = 0; i < 6; i++) u.dab(ctx, W * 0.3 + r() * W * 0.6, gy - 40 + r() * 80, 180 + r() * 160, '#f1e2c3', 0.18, 0.1);
    // scaffold (left-center): 4 posts, 2 beams, diagonal braces, planks
    const sx = W * 0.18, sw = 520, sh = 430, stop = gy - sh; const posts = [sx, sx + sw * 0.33, sx + sw * 0.66, sx + sw];
    const woodC = '#9a7146', woodD = '#5a3f26';
    const beams = [stop + 20, stop + 170, stop + 320];
    posts.forEach((px, i) => { const p = [{ x: px + (r() - 0.5) * 6, y: gy + 20 }, { x: px + (r() - 0.5) * 8, y: stop - 10 }]; u.ink(ctx, p, { w: 13, color: woodC, alpha: 1, jitter: 1.5, seed: seed + 50 + i, taper: 0.05 }); u.ink(ctx, p, { w: 13, color: woodD, alpha: 0.35, jitter: 1.5, seed: seed + 50 + i, taper: 0.05 }); u.ink(ctx, p.map(q => ({ x: q.x - 4, y: q.y })), { w: 3, color: shade(woodC, 0.3), alpha: 0.5, jitter: 1, seed: seed + 55 + i, taper: 0.1 }); });
    beams.forEach((by, i) => { const p = [{ x: sx - 30, y: by + (r() - 0.5) * 6 }, { x: sx + sw + 40, y: by + (r() - 0.5) * 8 }]; u.ink(ctx, p, { w: 11, color: woodC, alpha: 1, jitter: 1.4, seed: seed + 60 + i, taper: 0.05 }); u.ink(ctx, p, { w: 4, color: woodD, alpha: 0.4, jitter: 1.4, seed: seed + 65 + i, taper: 0.05 }); if (i < 2) { for (let k = 0; k < 5; k++) { const x0 = sx + k * sw / 5; u.shape(ctx, [{ x: x0, y: by - 4 }, { x: x0 + sw / 5 - 8, y: by - 4 }, { x: x0 + sw / 5 - 8, y: by - 14 }, { x: x0, y: by - 14 }], { fill: shade(woodC, 0.15), stroke: woodD, w: 1.4, jitter: 1, seed: seed + 70 + i * 5 + k, inkOpt: { alpha: 0.5 } }); } } });
    for (let i = 0; i < 3; i++) { const x0 = posts[i], x1 = posts[i + 1]; u.ink(ctx, [{ x: x0, y: beams[i % 2 + 1] }, { x: x1, y: beams[i % 2] }], { w: 7, color: woodC, alpha: 0.95, jitter: 1.3, seed: seed + 80 + i, taper: 0.1 }); }
    // lashings
    posts.forEach((px, i) => beams.forEach((by, k) => { for (let m = 0; m < 3; m++) u.ink(ctx, [{ x: px - 9, y: by - 8 + m * 5 }, { x: px + 9, y: by - 4 + m * 5 }], { w: 1.6, color: '#d9c49a', alpha: 0.8, jitter: 0.5, seed: seed + i * 7 + k * 3 + m, taper: 0.3 }); }));
    // awning cloth over the scaffold top
    const aw = [{ x: sx - 60, y: stop - 30 }, { x: sx + sw * 0.5, y: stop + 10 }, { x: sx + sw + 70, y: stop - 40 }, { x: sx + sw + 50, y: stop - 120 }, { x: sx + sw * 0.5, y: stop - 80 }, { x: sx - 40, y: stop - 110 }];
    const awPts = u.curve(aw, 6, true); u.shape(ctx, awPts, { fill: '#e8d8b4', stroke: '#6a5436', w: 2, jitter: 1.6, seed: seed + 90, inkOpt: { alpha: 0.6 } });
    ctx.save(); clipPoly(ctx, awPts); P.brushBand(ctx, stop - 120, stop + 10, '#c9b48c', seed + 91, { n: 5, w: 40, alpha: 0.25, tilt: 0.02, x0: sx - 60, x1: sx + sw + 70 }); for (let i = 0; i < 5; i++) { const xx = sx + i * sw / 4.2; u.ink(ctx, [{ x: xx, y: stop - 115 }, { x: xx + 10, y: stop + 5 }], { w: 2, color: '#a98a5a', alpha: 0.4, jitter: 2, seed: seed + 95 + i, taper: 0.2 }); } ctx.restore();
    u.wash(ctx, [{ x: sx - 20, y: stop - 20 }, { x: sx + sw + 30, y: stop - 30 }, { x: sx + sw + 30, y: stop + 60 }, { x: sx - 20, y: stop + 60 }], '#3b3558', { seed: seed + 92, passes: 2, spread: 6, alpha: 0.18 });
    // awning ropes to the ground
    u.ink(ctx, [{ x: sx - 60, y: stop - 30 }, { x: sx - 160, y: gy + 10 }], { w: 2, color: '#6a5436', alpha: 0.7, jitter: 1.2, seed: seed + 96 }); u.ink(ctx, [{ x: sx + sw + 70, y: stop - 40 }, { x: sx + sw + 190, y: gy + 20 }], { w: 2, color: '#6a5436', alpha: 0.7, jitter: 1.2, seed: seed + 97 });
    // stone blocks: a stack + loose ones
    const blocks = [];
    const put = (bx, by, s, sd, extra) => { const info = P.stoneBlock(ctx, Object.assign({ x: bx, y: by, size: s, seed: sd }, extra || {})); blocks.push({ x: bx, y: by, size: s, info }); };
    put(W * 0.62, gy + 150, 110, seed + 1); put(W * 0.62 + 95, gy + 118, 110, seed + 2, { wx: 110, hy: 60, dz: 110 });
    put(W * 0.80, gy + 120, 90, seed + 3); put(W * 0.80 - 72, gy + 88, 90, seed + 4); put(W * 0.80 - 36, gy + 120 - 85, 90, seed + 5);
    put(W * 0.36, gy + 190, 140, seed + 6, { chisel: 1.2 });
    // rubble + chips
    for (let i = 0; i < 26; i++) { const xx = r() * W, yy = gy + 20 + r() * (H - gy - 20); const s = 6 + r() * 16; u.shape(ctx, u.ellipsePts(xx, yy, s, s * 0.6, 8, r()), { fill: r() < 0.5 ? '#bfae92' : '#9a8a70', stroke: '#5a4634', w: 1, jitter: 1.5, seed: seed + 100 + i, inkOpt: { alpha: 0.4 } }); }
    // tools: mallet, chisels, rope coil, bucket
    const tx = W * 0.5, ty = gy + 250;
    u.ink(ctx, [{ x: tx, y: ty }, { x: tx + 90, y: ty - 30 }], { w: 6, color: '#8a6a44', alpha: 1, jitter: 1, seed: seed + 120 }); u.shape(ctx, u.rectPts(tx + 80, ty - 60, 44, 44), { fill: '#6a5236', stroke: '#2b1d14', w: 1.6, jitter: 1.2, seed: seed + 121, inkOpt: { alpha: 0.7 } });
    for (let i = 0; i < 3; i++) u.ink(ctx, [{ x: tx - 60 + i * 26, y: ty + 20 }, { x: tx - 20 + i * 26, y: ty - 20 }], { w: 4.5, color: '#8f8f93', alpha: 1, jitter: 0.6, seed: seed + 125 + i, taper: 0.5 });
    const cx = W * 0.12, cy = gy + 150; for (let i = 0; i < 4; i++) u.ink(ctx, u.ellipsePts(cx, cy, 46 - i * 7, 20 - i * 3, 24), { w: 3.5, color: '#c9ad7c', alpha: 0.95, jitter: 1.2, seed: seed + 130 + i, closed: true });
    u.shape(ctx, [{ x: W * 0.28, y: gy + 280 }, { x: W * 0.28 + 60, y: gy + 280 }, { x: W * 0.28 + 52, y: gy + 220 }, { x: W * 0.28 + 8, y: gy + 220 }], { fill: '#7a5a3a', stroke: '#2b1d14', w: 1.6, jitter: 1.2, seed: seed + 140, inkOpt: { alpha: 0.7 } }); u.ink(ctx, u.curve([{ x: W * 0.28 + 8, y: gy + 222 }, { x: W * 0.28 + 30, y: gy + 190 }, { x: W * 0.28 + 52, y: gy + 222 }], 6), { w: 2.5, color: '#2b1d14', alpha: 0.7, jitter: 1, seed: seed + 141 });
    // cast shadows of posts on ground
    posts.forEach((px, i) => u.wash(ctx, [{ x: px - 8, y: gy + 20 }, { x: px + 8, y: gy + 20 }, { x: px + 140, y: gy + 60 }, { x: px + 124, y: gy + 62 }], '#3b3558', { seed: seed + 150 + i, passes: 1, spread: 3, alpha: 0.22 }));
    return { groundY: gy, blocks, scaffold: { x: sx, y: stop, w: sw, h: sh }, awning: { x: sx - 60, y: stop - 120, w: sw + 130, h: 130 } };
  };

  P.study = (ctx, o = {}) => {
    const { seed = 1, night = false } = o; const r = R(seed + 61);
    const floorY = H * 0.6;
    // view through the stoa: sky + garden
    P.sky(ctx, { preset: night ? 'night' : 'dawn', seed, horizon: floorY - 80, cloudCount: night ? 2 : 4, sun: night ? false : { x: W * 0.78, y: floorY - 130, r: 44 } });
    P.hills(ctx, { layers: [{ y: floorY - 140, amp: 70, color: night ? '#2a3350' : '#7a8a6a', fade: 0.55, trees: 0 }, { y: floorY - 95, amp: 40, color: night ? '#1d2440' : '#6f8a4e', fade: 0.25, trees: 6, treeKind: 'cypress' }], seed: seed + 2, haze: night ? '#2b3660' : '#eed9b8', bottom: floorY });
    P.olive(ctx, { x: W * 0.72, y: floorY - 20, scale: 1.4, seed: seed + 3, leaf: night ? '#3f4a4a' : '#8a9a6a', trunk: night ? '#2e2a2a' : '#6b5541' });
    // garden ground strip
    P.ground(ctx, { y: floorY - 70, bottom: floorY, color: night ? '#3a3a44' : '#b5a27a', dark: night ? '#22222c' : '#8d6f4a', light: night ? '#4a4a58' : '#d9c49a', seed: seed + 4, n: 6 });
    // stoa floor (stone slabs)
    const stone = night ? '#4a4452' : '#cfc4b4', stoneD = night ? '#2c2834' : '#9c8f84';
    ctx.save(); ctx.fillStyle = u.grad(ctx, 0, floorY, 0, H, [[0, stone], [1, shade(stone, -0.2)]]); ctx.fillRect(0, floorY, W, H - floorY);
    P.brushBand(ctx, floorY, H, stoneD, seed + 5, { n: 10, w: 140, alpha: 0.14, tilt: 0.005 }); P.brushBand(ctx, floorY, H, shade(stone, 0.2), seed + 6, { n: 6, w: 120, alpha: 0.12, tilt: 0.005 });
    const vpx = W * 0.5, vpy = floorY - 260; for (let i = -6; i <= 6; i++) { const xb = vpx + i * 360; u.ink(ctx, [{ x: xb, y: H + 20 }, { x: vpx + (xb - vpx) * 0.45, y: floorY }], { w: 2, color: stoneD, alpha: 0.45, jitter: 1.2, seed: seed + 10 + i, taper: 0 }); }
    [1.12, 1.3, 1.6, 2.1, 3].forEach((z, i) => { const yy = vpy + (H - vpy) / z; if (yy < floorY) return; u.ink(ctx, [{ x: -20, y: yy }, { x: W + 20, y: yy }], { w: 2, color: stoneD, alpha: 0.4, jitter: 1, seed: seed + 20 + i, taper: 0 }); });
    ctx.restore();
    // parapet + columns + architrave
    const colX = [W * 0.08, W * 0.36, W * 0.64, W * 0.92]; const colH = H * 0.62, colD = 74;
    u.shape(ctx, u.rectPts(-20, floorY - 150, W + 40, 150), { fill: night ? '#3a3542' : '#d9cfbf', jitter: 1.5, seed: seed + 30 });
    u.wash(ctx, u.rectPts(-20, floorY - 150, W + 40, 30), night ? '#1e1a28' : '#a89c90', { seed: seed + 31, passes: 2, spread: 3, alpha: 0.5 });
    P.brushBand(ctx, floorY - 150, floorY, night ? '#2a2633' : '#bfb2a2', seed + 32, { n: 5, w: 80, alpha: 0.2, tilt: 0 });
    u.ink(ctx, [{ x: -20, y: floorY - 150 }, { x: W + 20, y: floorY - 150 }], { w: 2.2, color: night ? '#15121c' : '#5a4636', alpha: 0.55, jitter: 1.3, seed: seed + 33, taper: 0 });
    colX.forEach((cx, i) => P.column(ctx, { x: cx, y: floorY + 6, h: colH, d: colD, seed: seed + 40 + i * 3, light: night ? 0.5 : -0.6, color: night ? '#5a5466' : '#e8e1d3', shade: night ? '#39344a' : '#b9aa9c', deep: night ? '#241f30' : '#8a7c86', ink: night ? '#15121c' : '#5a4636', jitter: 1.1, w: 2 }));
    const arch = u.rectPts(-20, floorY + 6 - colH - 10, W + 40, 60); u.shape(ctx, arch, { fill: night ? '#4d4759' : '#e2d9c9', stroke: night ? '#15121c' : '#5a4636', w: 2.2, jitter: 1.4, seed: seed + 50, inkOpt: { alpha: 0.6 } });
    u.wash(ctx, u.rectPts(-20, floorY + 6 - colH + 36, W + 40, 16), night ? '#1e1a28' : '#a89c90', { seed: seed + 51, passes: 1, spread: 2, alpha: 0.5 });
    u.shape(ctx, u.rectPts(-20, -10, W + 40, floorY + 6 - colH), { fill: night ? '#1b1826' : '#8f8378', jitter: 1.5, seed: seed + 52 });
    P.brushBand(ctx, -10, floorY - colH, night ? '#0f0d16' : '#6f6459', seed + 53, { n: 8, w: 140, alpha: 0.2, tilt: 0.01 });
    // table
    const tb = { x: W * 0.17, y: H * 0.66, w: W * 0.66, h: 36 }; const wood = night ? '#5a3f28' : '#8a6340', woodD = night ? '#2b1d14' : '#4e3722';
    u.wash(ctx, u.rectPts(tb.x + 20, tb.y + 30, tb.w, H - tb.y), '#1d1930', { seed: seed + 60, passes: 2, spread: 6, alpha: night ? 0.45 : 0.25 });
    [[tb.x + 50, 1], [tb.x + tb.w - 90, 1]].forEach(([lx], i) => { u.shape(ctx, u.rectPts(lx, tb.y + tb.h, 40, H - tb.y - tb.h + 10), { fill: shade(wood, -0.25), stroke: woodD, w: 2, jitter: 1.2, seed: seed + 61 + i, inkOpt: { alpha: 0.6 } }); u.ink(ctx, [{ x: lx + 20, y: tb.y + tb.h + 60 }, { x: lx + (i ? -140 : 180), y: tb.y + tb.h + 8 }], { w: 9, color: shade(wood, -0.2), alpha: 1, jitter: 1.2, seed: seed + 64 + i, taper: 0.1 }); });
    u.shape(ctx, u.rectPts(tb.x, tb.y, tb.w, tb.h), { fill: wood, stroke: woodD, w: 2.2, jitter: 1.4, seed: seed + 66, inkOpt: { alpha: 0.7 } });
    ctx.save(); clipPoly(ctx, u.rectPts(tb.x, tb.y, tb.w, tb.h)); for (let i = 0; i < 14; i++) { const yy = tb.y + r() * tb.h; u.ink(ctx, [{ x: tb.x + r() * 60, y: yy }, { x: tb.x + tb.w - r() * 60, y: yy + (r() - 0.5) * 6 }], { w: 1 + r() * 1.5, color: woodD, alpha: 0.3, jitter: 1.2, seed: seed + 70 + i, taper: 0.3 }); } P.brushBand(ctx, tb.y, tb.y + tb.h, shade(wood, 0.2), seed + 71, { n: 3, w: 30, alpha: 0.25, tilt: 0, x0: tb.x, x1: tb.x + tb.w }); ctx.restore();
    u.wash(ctx, u.rectPts(tb.x, tb.y + tb.h - 10, tb.w, 10), woodD, { seed: seed + 72, passes: 1, spread: 1, alpha: 0.5 });
    // props on the table (sit on tb.y, drawn slightly overlapping the top edge)
    const scrolls = [];
    P.papyrus(ctx, { x: tb.x + 60, y: tb.y - 180, w: 330, h: 190, seed: seed + 80, rot: -0.06 }); scrolls.push({ x: tb.x + 60, y: tb.y - 180, w: 330, h: 190 });
    P.papyrus(ctx, { x: tb.x + tb.w - 420, y: tb.y - 150, w: 290, h: 160, seed: seed + 81, rot: 0.05, rolled: true }); scrolls.push({ x: tb.x + tb.w - 420, y: tb.y - 150, w: 290, h: 160 });
    const trayO = { x: tb.x + tb.w * 0.5 - 230, y: tb.y - 220, w: 460, h: 230 }; const tray = P.sandTray(ctx, Object.assign({ seed: seed + 82, wood: shade(wood, -0.1), sand: night ? '#b8a27c' : '#d9c49a' }, trayO));
    const lamps = [{ x: tb.x + tb.w - 70, y: tb.y - 26, scale: 1 }, { x: tb.x + 30, y: tb.y - 24, scale: 0.8 }];
    lamps.forEach((l, i) => { if (night) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; u.glow(ctx, l.x, l.y - 20, 380 * l.scale, '#ffb640', 0.16); ctx.restore(); } P.lamp(ctx, { x: l.x, y: l.y, scale: l.scale, seed: seed + 90 + i }); });
    // ink pot + stylus
    u.shape(ctx, [{ x: tb.x + 440, y: tb.y + 2 }, { x: tb.x + 470, y: tb.y + 2 }, { x: tb.x + 466, y: tb.y - 30 }, { x: tb.x + 444, y: tb.y - 30 }], { fill: '#3a3238', stroke: '#15121c', w: 1.5, jitter: 1, seed: seed + 95, inkOpt: { alpha: 0.7 } });
    u.ink(ctx, [{ x: tb.x + 462, y: tb.y - 28 }, { x: tb.x + 500, y: tb.y - 80 }], { w: 3, color: '#c9ad7c', alpha: 1, jitter: 0.6, seed: seed + 96, taper: 0.4 });
    if (night) { ctx.save(); ctx.globalCompositeOperation = 'multiply'; u.vignette(ctx, 0.35, '#1b2447'); ctx.restore(); }
    return { lamps, tray, table: tb, scrolls, floorY };
  };

  /* --------------------------------------------------------------- finish */
  P.finish = (ctx, o = {}) => {
    const { paperAlpha = 0.18, edge = 0.22, edgeColor = '#3b3558', mode = 'multiply' } = o;
    if (paperAlpha > 0) u.paper(ctx, paperAlpha, mode);
    if (edge > 0) { const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 1.05); g.addColorStop(0, u.alpha(edgeColor, 0)); g.addColorStop(1, u.alpha(edgeColor, edge)); ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  };
})();
