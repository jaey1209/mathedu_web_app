/* ============================================================================
   S01 — 신탁이 내려오다 (0:00–0:40)
   Hybrid: painted plates (A01→A02→A03→A04) + camera (slow Ken Burns) + living
   light: sun glow, sea sparkle, gulls, torch flames & smoke, breathing light
   shaft, dust motes, censer smoke, oracle light-pulse, golden altar bloom.
   No procedural people, no geometry, no text (subtitles/caption come from the
   engine). All effect positions are image-fraction coordinates via u.platePt.

   Timing map (scene-local seconds == global seconds):
     0.0– 9.6  A01 Delos dawn panorama, zoom 1.00→1.12 toward the temple
     8.6– 9.6    dissolve A01→A02 (1.0 s)
     9.0–17.6  A02 procession, pan-up along the path, zoom 1.18→1.06
    16.4–17.6    dissolve A02→A03 (1.2 s)
    17.0–31.7  A03 temple interior, zoom 1.00→1.13 on the altar
    19.5–30.6    oracle: shaft/altar light pulses, rising dust (mood 'oracle' from 18)
    30.6–31.8    gold flare + dissolve A03→A04
    31.0–40.0  A04 altar close-up, gold bloom rises 31–33.5 then breathes, zoom 1.00→1.12

   Performance note: large radial glows are pre-rendered ONCE in init() into
   transparent layers (sun, altar pool, bloom, flare) and composited with a
   single drawImage per frame; only small glows (torches, censers) are live.
   ========================================================================== */
ANIM.scene({
  id: 's01', title: '신탁이 내려오다',
  start: ANIM.TIMES.s01[0], end: ANIM.TIMES.s01[1],
  mood: t => (t < 18 ? 'ancient' : 'oracle'),
  fadeIn: 0.9, fadeOut: 0.9,

  init(api, S) {
    const { u, W, H } = api; const P = ANIM.paint;
    S.beats = [
      { id: 'A01', t0: 0.0, t1: 9.6, fade: 1.0 },
      { id: 'A02', t0: 8.6, t1: 17.6, fade: 1.0 },
      { id: 'A03', t0: 16.4, t1: 31.7, fade: 1.2 },
      { id: 'A04', t0: 30.6, t1: 40.0, fade: 1.1 },
    ];
    S.has = {
      flame: !!(P && P.flame), smoke: !!(P && P.smoke), birds: !!(P && P.birds),
      sparkle: !!(P && P.seaSparkle), particles: !!(P && P.particles),
    };
    // --- pre-rendered glow layers (sizes in plate-units at zoom 1, i.e. R.w = 1920) ---
    // sun (A01/A02): centred 800x800
    S.sunL = u.layer(800, 800, c => { u.glow(c, 400, 400, 370, '#ffd98a', 0.24); u.glow(c, 400, 400, 130, '#fff0c0', 0.3); });
    S.sunL.cx = 400; S.sunL.cy = 400;
    // altar pool (A03): altar point at (600,450); pool above, wide floor glow below
    S.altarL = u.layer(1000, 980, c => { u.glow(c, 500, 410, 310, '#ffd98a', 1.0); u.glow(c, 500, 480, 480, '#ffb640', 0.5); });
    S.altarL.cx = 500; S.altarL.cy = 430;
    // bloom (A04): full frame, cube centre at (960,594) for zoom 1 — overall light only, no edge lines
    S.bloomL = u.layer(W, H, c => {
      c.fillStyle = u.alpha('#f3d27a', 0.05); c.fillRect(0, 0, W, H);               // faint warm wash
      u.glow(c, 960, 594, 860, '#f3d27a', 0.14); u.glow(c, 960, 594, 480, '#f6dc8a', 0.23);
      u.glow(c, 960, 486, 150, '#fff3c4', 0.14); u.glow(c, 960, 920, 960, '#f3d27a', 0.08);
    });
    // flare at the end of the oracle: full frame
    S.flareL = u.layer(W, H, c => { u.glow(c, 960, 594, 1134, '#fff0c4', 0.85); u.glow(c, 960, 594, 486, '#ffffff', 0.5); });
  },

  draw(api, t, S) {
    const { ctx: c, u, W, H } = api; const P = ANIM.paint;

    /* ---------------------------------------------------------- helpers */
    // oracle pulse (19.5–30.6): slow heartbeat 0..1, eased in; keeps rising into the flare
    const oracleEnv = u.smooth(19.5, 21.0, t) * (1 - u.smooth(31.4, 32.0, t));
    const beat = 0.5 + 0.5 * Math.sin((t - 19.5) * Math.PI * 2 * 0.42 - Math.PI / 2);
    const pulse = oracleEnv * (0.35 + 0.65 * beat);
    // flare at the end of the oracle (30.6 → peak 31.1 → gone 31.8)
    const flare = u.smooth(30.6, 31.1, t) * (1 - u.smooth(31.1, 31.8, t));
    const breathe = (speed, seed) => 0.85 + 0.15 * u.noise2(t * speed + seed * 5.3, seed);
    // draw a cached glow layer centred on (x,y), scaled by s, with alpha
    const layerAt = (L, x, y, s, alpha, cx = L.cx || L.width / 2, cy = L.cy || L.height / 2) => {
      if (alpha <= 0.002) return; c.save(); c.globalAlpha *= alpha; c.drawImage(L, x - cx * s, y - cy * s, L.width * s, L.height * s); c.restore();
    };

    /* ----------------------------------------------------------- beats */
    function A01(a) {
      const kb = u.kb(t, 0, 9.6, { zoom: 1.0, fx: 0.5, fy: 0.52 }, { zoom: 1.12, fx: 0.6, fy: 0.5 });
      const R = u.plate(c, 'A01', Object.assign(kb, { alpha: a })); if (!R) return;
      const sz = R.w / W;
      c.save(); c.globalAlpha = a;
      // 1. low dawn sun breathing at the horizon (left)
      const sun = u.platePt(R, 0.07, 0.6); const br = breathe(0.5, 3);
      layerAt(S.sunL, sun.x, sun.y, sz * br, br);
      // 2. sun path sparkling on the sea
      const hz = u.platePt(R, 0, 0.775).y;
      if (S.has.sparkle) P.seaSparkle(c, t, { horizonY: hz, bottom: R.y + R.h + 10, seed: 5, count: 55, x: u.platePt(R, 0.16, 0).x, spread: 0.42 * R.w, alpha: 0.7, color: '#fff0c0' });
      // 3. gulls over the bay
      if (S.has.birds) P.birds(c, t, { count: 4, seed: 11, box: [R.x + R.w * 0.06, R.y + R.h * 0.4, R.w * 0.42, R.h * 0.22], scale: 1.15 * sz, color: '#3a3350', speed: 0.7, alpha: 0.7 });
      c.restore();
    }

    function A02(a) {
      const kb = u.kb(t, 9, 17.6, { zoom: 1.18, fx: 0.42, fy: 0.72 }, { zoom: 1.06, fx: 0.55, fy: 0.42 });
      const R = u.plate(c, 'A02', Object.assign(kb, { alpha: a })); if (!R) return;
      const sz = R.w / W;
      c.save(); c.globalAlpha = a;
      // 1. low sun over the sea (breathing)
      const sun = u.platePt(R, 0.13, 0.33); const br = breathe(0.45, 7);
      layerAt(S.sunL, sun.x, sun.y, sz * 0.8 * br, br);
      // 2. torches: boiling flames + thin smoke, at the painted torch heads
      const torches = [[0.437, 0.335, 1.0, 21], [0.537, 0.30, 0.9, 22], [0.65, 0.36, 0.95, 23]];
      torches.forEach(([fx, fy, k, seed]) => {
        const p = u.platePt(R, fx, fy);
        if (S.has.smoke) P.smoke(c, t, { x: p.x, y: p.y - 18 * sz, seed, scale: 0.55 * sz * k, alpha: 0.28, color: '#cfc3bc', count: 7, rise: 0.22 * R.h, wind: 0.25 });
        u.glow(c, p.x, p.y - 10 * sz, 0.07 * R.h * k * breathe(6, seed), '#ffb640', 0.3);
        if (S.has.flame) P.flame(c, t, { x: p.x, y: p.y + 2 * sz, scale: 0.95 * sz * k, seed, alpha: 0.95 });
      });
      // 3. two distant gulls over the sea (left)
      if (S.has.birds) P.birds(c, t, { count: 2, seed: 13, box: [R.x + R.w * 0.02, R.y + R.h * 0.22, R.w * 0.28, R.h * 0.14], scale: 0.8 * sz, color: '#4a4058', speed: 0.6, alpha: 0.55 });
      c.restore();
    }

    function A03(a) {
      const kb = u.kb(t, 17, 31.7, { zoom: 1.0, fx: 0.5, fy: 0.55 }, { zoom: 1.13, fx: 0.5, fy: 0.62 });
      const R = u.plate(c, 'A03', Object.assign(kb, { alpha: a })); if (!R) return;
      const sz = R.w / W; const lightK = 1 + 0.6 * pulse + 1.2 * flare;
      c.save(); c.globalAlpha = a;
      // 1. breathing light shaft from the oculus to the altar (additive, over the painted one)
      const top = u.platePt(R, 0.5, -0.02), alt = u.platePt(R, 0.5, 0.74);
      u.shaft(c, t, top.x, top.y, alt.x, alt.y, 0.035 * R.w, 0.11 * R.w, '#ffe3a0', 0.12 * lightK, 2);
      u.shaft(c, t, top.x, top.y, alt.x, alt.y + 0.03 * R.h, 0.015 * R.w, 0.05 * R.w, '#fff2cc', 0.1 * lightK, 5);
      // altar pool + floor glow pulsing with the oracle (one cached layer)
      layerAt(S.altarL, alt.x, alt.y, sz * (0.92 + 0.08 * pulse), (0.18 + 0.22 * pulse) * (1 + 0.8 * flare));
      // 2. dust motes rising inside the shaft (more visible as the oracle speaks)
      u.motes(c, t, { count: 70, box: [alt.x - 0.12 * R.w, R.y, 0.24 * R.w, alt.y - R.y + 0.02 * R.h], seed: 9, color: '#ffe9b0', size: 2.4 * sz, speed: 0.55, alpha: 0.28 + 0.3 * pulse, drift: 0.8 });
      // 3. censer smoke (left & right tripods) + ember glow in the bowls
      const cen = [[0.14, 0.635, 41], [0.858, 0.70, 42]];
      cen.forEach(([fx, fy, seed]) => {
        const p = u.platePt(R, fx, fy);
        if (S.has.smoke) P.smoke(c, t, { x: p.x, y: p.y, seed, scale: 0.95 * sz, alpha: 0.32, color: '#d9d2cc', count: 10, rise: 0.42 * R.h, wind: 0.12 });
        u.glow(c, p.x, p.y, 0.045 * R.w * breathe(5, seed), '#ffb640', 0.22);
      });
      // oracle: the whole frame warms and brightens on the heartbeat
      if (pulse > 0.02) u.grade(c, '#ffd27a', 0.09 * pulse, 'soft-light');
      c.restore();
    }

    function A04(a) {
      const kb = u.kb(t, 31, 40, { zoom: 1.0, fx: 0.5, fy: 0.55 }, { zoom: 1.12, fx: 0.5, fy: 0.55 });
      const R = u.plate(c, 'A04', Object.assign(kb, { alpha: a })); if (!R) return;
      const sz = R.w / W;
      const e = u.smooth(31, 33.5, t);                       // gold rising
      const br = 0.88 + 0.12 * Math.sin((t - 31) * 2.0);     // slow breath
      c.save(); c.globalAlpha = a;
      // 1. light from above breathing
      const top = u.platePt(R, 0.5, -0.05), cube = u.platePt(R, 0.5, 0.55);
      u.shaft(c, t, top.x, top.y, cube.x, cube.y - 0.12 * R.h, 0.05 * R.w, 0.16 * R.w, '#ffe3a0', 0.1 + 0.06 * e, 8);
      // 2. golden bloom on the altar (overall light only — no glowing edge lines)
      layerAt(S.bloomL, cube.x, cube.y, sz, e * br, 960, 594);
      // 3. rising glints & dust around the altar
      if (S.has.particles) P.particles(c, t, { kind: 'glint', count: 16, box: [cube.x - 0.22 * R.w, cube.y - 0.35 * R.h, 0.44 * R.w, 0.6 * R.h], seed: 61, size: 1.1 * sz, speed: 0.8, alpha: 0.65 * e });
      u.motes(c, t, { count: 50, box: [cube.x - 0.3 * R.w, cube.y - 0.45 * R.h, 0.6 * R.w, 0.8 * R.h], seed: 63, color: '#ffe9b0', size: 2.6 * sz, speed: 0.7, alpha: 0.4 * e, drift: 0.9 });
      c.restore();
    }

    const FN = { A01, A02, A03, A04 };

    /* ------------------------------------------------- beat sequencing */
    // first active beat is drawn opaque; a following beat dissolves in over its `fade`
    let drawn = 0;
    for (const b of S.beats) {
      if (t < b.t0 || t > b.t1) continue;
      const a = drawn === 0 ? 1 : u.ease.sine(u.seg(t, b.t0, b.t0 + b.fade));
      if (a <= 0.001) continue;
      FN[b.id](a); drawn++;
    }
    if (!drawn) { c.fillStyle = '#101a33'; c.fillRect(0, 0, W, H); }

    /* --------------------------------------------- oracle-end gold flare */
    if (flare > 0.002) { c.save(); c.globalAlpha = flare; c.drawImage(S.flareL, 0, 0); c.restore(); }
  },
});
