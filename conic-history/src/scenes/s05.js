/* ============================================================================
   S05 — 원뿔 속에 숨겨진 곡선들 (global 160–200 s, local 0–40)
   Entirely in the navy math space (painted navyMath sky + nebula + stars +
   paper, built once in init). Menaechmus' construction: three cones with
   different apex angles (60° acute / 90° right / 120° obtuse) are each cut by
   a pale-gold plane PERPENDICULAR TO A GENERATOR. The section (exact
   u.coneSection) is drawn as a glowing curve, then plane + curve detach,
   rotate rigidly (axis–angle interpolation, bulging path that clears the cone)
   and come to the front as a flat 2D curve (u.planeBasis coordinates),
   labelled 타원 / 포물선 / 쌍곡선. The hyperbola uses a double cone
   (double:true, upper nappe drawn as a wire ghost) and shows both branches.
   No plates, no procedural people. All lines boil (seed = api.boil).
   Local ink/glowLine wrappers draw the round end caps as separate paths
   (works around the engine's u.ink cap chord artefact).

   Timing map (scene-local seconds; global = local + 160):
     0.0– 2.4  the translucent teal cone from S04 keeps turning at centre
     2.4– 4.6  camera tilts down to a level view (pitch 0.3→0.04) so the drawn
               apex angles are true; the S04 cone becomes the right cone,
               acute (2.5–4.5) & obtuse (2.9–4.9) cones emerge staggered →
               row of three cones, bases aligned (slots 400/960/1520)
     3.0– 9.5    sub: 원뿔과 평면이 만나면 … 서로 다른 모양의 곡선이 (engine)
     5.2– 9.0  row labels 예각/직각/둔각 원뿔 + apex-angle arcs (꼭지각 60°/90°/120°)
     9.0–10.6  acute cone slides to the stage (880,520), pitch back to 0.3; others fade
    10.0–19.0  BEAT 1 타원     (beat-local τ: 0.4–1.0 generator line,
    19.0–28.0  BEAT 2 포물선    1.0–2.5 plane slides in, 2.3–2.9 ⟂ marker,
    28.0–37.0  BEAT 3 쌍곡선    2.5–3.5 section curve draws from the vertex,
                               3.8–6.3 unfold to the front (right side) while the
                               cone drifts 880→600 to make room, 6.0–7.1 label +
                               description, 8.3–9.0 fade. Beat 3: upper nappe
                               grows in at τ 0.9–1.8)
    26.5–31.0   sub: 단순히 아름다운 모양이 아니었습니다 (engine)
    32.0–39.3   sub: 수학적 도구였습니다 (engine)
    35.1–35.9  obtuse cone + generator fade; 35.3–36.8 hyperbola panel glides
               to slot 3; 35.8–37.1 ellipse & parabola panels fade in at slots
               1–2; 37.0–37.6 three labels  →  37.6–39.1 steady lineup (≥1.5 s)
               before the engine fadeOut (39.1–40)
   ========================================================================== */
ANIM.scene({
  id: 's05', title: '원뿔 속에 숨겨진 곡선들',
  start: ANIM.TIMES.s05[0], end: ANIM.TIMES.s05[1],
  mood: 'rise',
  fadeIn: 0.9, fadeOut: 0.9,

  init(api, S) {
    const { u, W, H } = api; const P = ANIM.paint; const DEG = Math.PI / 180; const E = u.ease;
    /* ---------------------------------------------------- background layer */
    S.navy = u.layer(W, H, c => {
      P.sky(c, { preset: 'navyMath', seed: 55, horizon: H * 1.05, clouds: false });
      P.nebula(c, { seed: 59, alpha: 0.8, count: 12, colors: ['#1f3f6e', '#2a2a66', '#1c4d58', '#3a2f66'] });
      P.stars(c, { seed: 67, count: 150, yMax: H, alpha: 0.55 });
      u.paper(c, 0.14);
    });
    // twinkling stars (positions 0..1 of the frame)
    { const r = u.rng(91); S.twk = []; for (let i = 0; i < 34; i++) S.twk.push({ x: r(), y: r() * 0.85, ph: r() * 6.28, f: 0.5 + r() * 1.4, s: 0.6 + r() }); }
    // cached glow sprites (one drawImage instead of a big radial fill)
    S.spr = {};
    S.glow = (c, x, y, r, color, alpha = 0.6) => {
      let s = S.spr[color];
      if (!s) s = S.spr[color] = u.layer(256, 256, cc => { const g = cc.createRadialGradient(128, 128, 0, 128, 128, 128); g.addColorStop(0, color); g.addColorStop(0.35, u.alpha(color, 0.5)); g.addColorStop(1, u.alpha(color, 0)); cc.fillStyle = g; cc.fillRect(0, 0, 256, 256); });
      c.save(); c.globalAlpha *= alpha; c.drawImage(s, x - r, y - r, r * 2, r * 2); c.restore();
    };

    /* --------------------------------------------------------- camera base */
    S.PITCH = 0.3; S.DIST = 9;
    S.yawAt = t => 1.85 + 0.05 * t;                     // continues S04's final yaw, very slow orbit
    // S04 hands over pitch 0.3; the camera tilts down to a near-level view for the row (true apex angles), then back up for the cuts
    S.pitchAt = t => t < 7 ? u.lerp(S.PITCH, 0.04, E.io(u.seg(t, 2.4, 4.6))) : u.lerp(0.04, S.PITCH, E.io(u.seg(t, 9.0, 10.6)));
    S.STAGE = { cx0: 880, cx1: 600, cy: 520 };          // the active cone starts centre-left and drifts left while the panel unfolds
    S.PANEL = { x: 1400, y: 440 };                      // where the unfolded 2D curve comes to rest
    S.SLOTS = [{ x: 400, y: 430 }, { x: 960, y: 430 }, { x: 1520, y: 430 }];   // final side-by-side
    S.LABY = [745, 808];                                // name / description rows (same for beat panel and finale)

    /* ---------------------------------------------------------- the cones */
    // apex at origin, opening toward -y. hUp>0 = upper nappe (double cone)
    S.cones = [
      { id: 0, name: '예각 원뿔', ang: '꼭지각 60°', alpha: 30 * DEG, h: 2.25, hUp: 0, fovBeat: 1500 },
      { id: 1, name: '직각 원뿔', ang: '꼭지각 90°', alpha: 45 * DEG, h: 2.0, hUp: 0, fovBeat: 1350 },
      { id: 2, name: '둔각 원뿔', ang: '꼭지각 120°', alpha: 60 * DEG, h: 1.1, hUp: 1.0, fovBeat: 1000 },
    ];
    S.s04cone = { alpha: 0.46, h: 2.6, hUp: 0 };        // the cone that rose at the end of S04

    /* ---------------------------------------------------- beats (exact math) */
    const V = { add: (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k], dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], norm: a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }, scale: (a, k) => [a[0] * k, a[1] * k, a[2] * k] };
    S.V = V;
    // facing basis of the camera (screen-right, screen-up, normal = away from the camera) as world vectors
    S.facingBasis = (yaw, pitch) => { const xr = [Math.cos(yaw), 0, -Math.sin(yaw)]; const yu = [-Math.sin(pitch) * Math.sin(yaw), Math.cos(pitch), -Math.sin(pitch) * Math.cos(yaw)]; return { xr, yu, N: V.cross(xr, yu) }; };
    S.beats = [
      { id: 'ellipse', cone: 0, t0: 10, name: '타원', desc: '닫힌 곡선', yp: -0.95, orient: 'ex', type: 'ellipse' },
      { id: 'parabola', cone: 1, t0: 19, name: '포물선', desc: '한 방향으로 무한히 뻗는 곡선', yp: -0.45, orient: 'ey', type: 'parabola' },
      { id: 'hyperbola', cone: 2, t0: 28, name: '쌍곡선', desc: '서로 분리된 두 갈래', yp: -0.3, orient: 'ey', type: 'hyperbola', double: true },
    ];
    for (const b of S.beats) {
      const K = S.cones[b.cone]; const al = K.alpha; b.t1 = b.t0 + 9;
      // generator chosen so that, mid-cut, it faces the camera's front-right (plane clearly visible, not edge-on)
      const yawMid = S.yawAt(b.t0 + 3.2); const th = -yawMid - Math.PI / 4 - 0.15;
      const g = [Math.sin(al) * Math.cos(th), -Math.cos(al), Math.sin(al) * Math.sin(th)];        // unit generator direction (down the LOWER nappe)
      const s = -b.yp / Math.cos(al);                                                              // distance along the generator to the cut point
      const p = V.scale(g, s);
      b.g = g; b.s = s; b.p = p;
      b.genLen = K.h / Math.cos(al);                                                               // apex → base rim of the lower nappe (never past the rim)
      b.genUp = K.hUp / Math.cos(al);                                                              // continuation through the apex onto the upper nappe (double cone only)
      b.plane = { p, nrm: g };                                                                     // plane ⟂ generator through p
      b.typeCheck = u.conicType(al, g);
      if (b.typeCheck !== b.type) console.warn('S05: conic type mismatch', b.id, b.typeCheck);
      // exact section; each nappe is then clipped at its own height (lower: y ≥ −h, upper: y ≤ hUp), splitting where points drop out
      const raw = u.coneSection({ alpha: al, h: Math.max(K.h, K.hUp), double: !!b.double, plane: b.plane, n: 360 });
      b.branches = []; raw.forEach(br => { let cur = []; br.forEach(q => { if (q.y >= -K.h - 1e-9 && q.y <= K.hUp + 1e-9) cur.push(q); else if (cur.length) { b.branches.push(cur); cur = []; } }); if (cur.length) b.branches.push(cur); }); b.branches = b.branches.filter(br => br.length > 1);
      // in-plane axis direction (lies in the axial plane, ⟂ g), pointing from p INTO the cone (downward)
      const d = [-Math.cos(al) * Math.cos(th), -Math.sin(al), -Math.cos(al) * Math.sin(th)];
      b.d = d;
      // plane basis → rotate in-plane so the axis is local +x (orient 'ex') or local +y (orient 'ey')
      const B = u.planeBasis(b.plane); b.basis = B;
      const d2 = { x: V.dot(d, B.ex), y: V.dot(d, B.ey) }; let phi = Math.atan2(d2.y, d2.x); if (b.orient === 'ey') phi -= Math.PI / 2;
      const cph = Math.cos(phi), sph = Math.sin(phi);
      let ux = V.add(V.scale(B.ex, cph), B.ey, sph), uy = V.add(V.scale(B.ex, -sph), B.ey, cph), N = B.N.slice();
      const loc = q => { const r = B.to2d(q); return { x: r.x * cph + r.y * sph, y: -r.x * sph + r.y * cph }; };
      let pts = b.branches.map(br => br.map(loc));
      // choose the plane's normal sign so the unfolding rotation is the short way (mirror only across the curve's own symmetry axis)
      const F = S.facingBasis(S.yawAt(b.t0 + 3.8), S.PITCH);
      if (V.dot(N, F.N) < 0) { N = V.scale(N, -1); if (b.orient === 'ex') { uy = V.scale(uy, -1); pts = pts.map(br => br.map(q => ({ x: q.x, y: -q.y }))); } else { ux = V.scale(ux, -1); pts = pts.map(br => br.map(q => ({ x: -q.x, y: q.y }))); } }
      b.closed = b.type === 'ellipse';
      // the cut point p is the origin of the plane basis → local (0,0) before re-centring.
      // vertex index per branch: the point at p for the branch through the cut point, otherwise (other hyperbola branch) the
      // point nearest the first branch along the axis. The curve is later drawn outward from this index.
      const vtx = (br, bi) => {
        let best = 0, bd = 1e9; br.forEach((q, i) => { const dd = Math.hypot(q.x, q.y); if (dd < bd) { bd = dd; best = i; } });
        if (bd < 0.05 || pts.length === 1) return best;
        const other = pts[1 - bi]; const my = br.reduce((a, q) => a + q.y, 0) / br.length, oy = other.reduce((a, q) => a + q.y, 0) / other.length;
        let bi2 = 0, bv = oy > my ? -1e9 : 1e9; br.forEach((q, i) => { if (oy > my ? q.y > bv : q.y < bv) { bv = q.y; bi2 = i; } }); return bi2;
      };
      let iv = pts.map(vtx);
      if (b.closed) { // rotate the loop (first == last point) so the vertex sits mid-array → symmetric growth both ways from p
        pts = pts.map((br, bi) => { const m = br.length - 1; const a = (iv[bi] + Math.floor(m / 2)) % m; const out = []; for (let i = 0; i <= m; i++) out.push(br[(a + i) % m]); return out; });
        iv = pts.map(vtx);
      }
      b.iv = iv;
      // open sides (which y-side the open ends run to) → tight pad there so the branches reach the panel border
      let openTop = false, openBot = false;
      if (!b.closed) pts.forEach((br, bi) => { for (const e of [0, br.length - 1]) { if (br[e].y > br[iv[bi]].y) openTop = true; else openBot = true; } });
      // bounding box → panel rectangle; local coords relative to the panel centre
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; pts.forEach(br => br.forEach(q => { x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); y0 = Math.min(y0, q.y); y1 = Math.max(y1, q.y); }));
      let pad = 0.22 + 0.06 * (x1 - x0 + y1 - y0) / 2; if (b.double) pad = Math.min(pad, 0.18);
      const padT = openTop ? 0.06 : pad, padB = openBot ? 0.06 : pad;
      const cx = (x0 + x1) / 2, cy = (y0 - padB + y1 + padT) / 2;
      b.loc = pts.map(br => br.map(q => ({ x: q.x - cx, y: q.y - cy })));
      b.hw = (x1 - x0) / 2 + pad; b.hh = (y1 - y0 + padT + padB) / 2;
      b.C = V.add(V.add(b.p, ux, cx), uy, cy);                                    // 3D centre of the panel while attached
      b.ux = ux; b.uy = uy; b.N = N;
      // where the cut point p sits in local coords (for the right-angle marker)
      b.pLoc = { x: -cx, y: -cy };
      // faint tapered continuations past each open end (0.22 units along the end tangent) — "the curve goes on"
      b.ext = []; if (!b.closed) b.loc.forEach(br => { const n = br.length; for (const [e, f] of [[0, 2], [n - 1, n - 3]]) { const dx = br[e].x - br[f].x, dy = br[e].y - br[f].y, L = Math.hypot(dx, dy) || 1; b.ext.push({ p: br[e], d: { x: dx / L, y: dy / L } }); } });
      // panel fit: px per unit so the panel fits 720×520 on the right, and 460×420 in a final slot
      b.scalePanel = Math.min(720 / (2 * b.hw), 520 / (2 * b.hh), 300);
      b.scaleSlot = Math.min(470 / (2 * b.hw), 400 / (2 * b.hh), 220);
    }
  },

  draw(api, t, S) {
    const { ctx: c, u, W, H } = api; const E = u.ease; const boil = api.boil; const V = S.V; const TAU = Math.PI * 2;
    const TEAL = '#58e0d0', TEAL2 = '#9ff5ea', GOLD = '#f3d27a', GOLD2 = '#ffe9a8', IVORY = '#f6f1e6';
    const breathe = (speed, seed) => 0.85 + 0.15 * u.noise2(t * speed + seed * 5.3, seed);
    const yaw = S.yawAt(t), pitch = S.pitchAt(t), dist = S.DIST;

    /* ------------------------------------------------------- background */
    c.drawImage(S.navy, 0, 0);
    { // twinkling stars + drifting teal motes (cheap)
      const tq = api.tq; c.save(); c.globalCompositeOperation = 'lighter';
      for (const s of S.twk) { const k = 0.5 + 0.5 * Math.sin(tq * s.f + s.ph); const a = 0.7 * (0.1 + 0.9 * k * k); const x = s.x * W, y = s.y * H, r = 1.6 * s.s * (0.8 + 0.5 * k); S.glow(c, x, y, r * 2.6, '#fff6dc', a * 0.3); u.dab(c, x, y, r, '#fff6dc', a, 0.5); }
      c.restore();
      u.motes(c, t, { count: 26, box: [0, 0, W, H * 0.85], seed: 5, color: TEAL2, size: 3, speed: 0.35, alpha: 0.3, drift: 0.7 });
    }

    /* --------------------------------------------------------- helpers */
    // ink with the round end caps drawn as separate paths (the engine's cap pass joins the two arcs with a hairline chord)
    const ink = (cc, pts, o = {}) => {
      u.ink(cc, pts, Object.assign({}, o, { cap: false }));
      const { w = 3, color = '#2b1d14', jitter = 1.4, seed = 1, alpha = 1, closed = false, taper = 0.4, step = 6, freq = 0.09, cap = true } = o;
      if (!cap || closed || w < 2 || !pts || pts.length < 2) return;
      const R = u.resample(pts, step); const n = R.length; if (n < 2) return;
      cc.save(); cc.globalAlpha *= alpha; cc.fillStyle = color;
      for (const i of [0, n - 1]) {
        const p0 = R[Math.max(0, i - 1)], p1 = R[Math.min(n - 1, i + 1)];
        let dx = p1.x - p0.x, dy = p1.y - p0.y; const len = Math.hypot(dx, dy) || 1; dx /= len; dy /= len;
        const nx = -dy, ny = dx, s = i * step;
        const off = u.snoise(s * freq * 0.35 + seed * 7.3, seed * 3.1) * jitter;
        const tw = 1 - taper + taper * Math.sin(Math.PI * (i / (n - 1)));
        const ww = Math.max(0.4, w * tw * (0.7 + 0.6 * u.noise2(s * freq + seed * 2.2, seed * 5 + 1)));
        cc.beginPath(); cc.arc(R[i].x + nx * off, R[i].y + ny * off, ww / 2, 0, TAU); cc.fill();
      }
      cc.restore();
    };
    const glowLine = (cc, pts, o = {}) => {
      const { color = TEAL, w = 4, halo = 18, alpha = 1, seed = 1, jitter = 0.6, closed = false } = o;
      cc.save(); cc.globalCompositeOperation = 'lighter';
      ink(cc, pts, { w: halo, color: u.alpha(color, 0.10 * alpha), jitter, seed, closed, taper: 0 });
      ink(cc, pts, { w: halo * 0.45, color: u.alpha(color, 0.22 * alpha), jitter, seed, closed, taper: 0 });
      cc.restore();
      ink(cc, pts, { w, color: u.alpha(color, alpha), jitter, seed, closed, taper: 0.1 });
      ink(cc, pts, { w: w * 0.4, color: u.alpha('#ffffff', 0.7 * alpha), jitter, seed, closed, taper: 0.1 });
    };
    const cam = (cx, cy, fov, ty) => u.camera({ yaw, pitch, dist, fov, cx, cy, target: [0, ty, 0] });
    const flipCam = P => { const P2 = (x, y, z) => P(x, -y, z); P2.pts = arr => arr.map(p => P2(p.x, p.y, p.z)); P2.o = P.o; return P2; };
    // world point that projects to screen (sx,sy) at depth Z (relative to the camera target)
    const screenToWorld = (P, sx, sy, Z) => { const o = P.o; const s = o.fov / (o.dist + Z); const X = (sx - o.cx) / s, Y = -(sy - o.cy) / s; const cp = Math.cos(o.pitch), sp = Math.sin(o.pitch), cyw = Math.cos(o.yaw), syw = Math.sin(o.yaw); const y = Y * cp + Z * sp, z1 = -Y * sp + Z * cp; const x = X * cyw + z1 * syw, z = -X * syw + z1 * cyw; return [o.target[0] + x, o.target[1] + y, o.target[2] + z]; };
    // rotation taking basis Rp=[ex,ey,N] to Rt, as axis-angle; returns v -> rotated by k*angle
    const rotBetween = (Rp, Rt) => {
      const R = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
      for (let r = 0; r < 3; r++) for (let cc = 0; cc < 3; cc++) { let v = 0; for (let k = 0; k < 3; k++) v += Rt[k][r] * Rp[k][cc]; R[r][cc] = v; }   // R = Rt·Rpᵀ (columns = basis vectors)
      const tr = R[0][0] + R[1][1] + R[2][2]; const ang = Math.acos(u.clamp((tr - 1) / 2, -1, 1));
      let ax = [R[2][1] - R[1][2], R[0][2] - R[2][0], R[1][0] - R[0][1]]; const L = Math.hypot(ax[0], ax[1], ax[2]);
      if (L < 1e-6) { // identity or 180°: take the dominant column of R+I
        let best = 0, bl = -1; for (let j = 0; j < 3; j++) { const col = [R[0][j] + (j === 0), R[1][j] + (j === 1), R[2][j] + (j === 2)]; const l = Math.hypot(col[0], col[1], col[2]); if (l > bl) { bl = l; best = j; } }
        ax = V.norm([R[0][best] + (best === 0), R[1][best] + (best === 1), R[2][best] + (best === 2)]); if (ang < 1e-6) ax = [0, 1, 0];
      } else ax = V.scale(ax, 1 / L);
      return (v, k) => { const a = ang * k, ca = Math.cos(a), sa = Math.sin(a); const kv = V.cross(ax, v), kd = V.dot(ax, v); return [v[0] * ca + kv[0] * sa + ax[0] * kd * (1 - ca), v[1] * ca + kv[1] * sa + ax[1] * kd * (1 - ca), v[2] * ca + kv[2] * sa + ax[2] * kd * (1 - ca)]; };
    };

    // ---- translucent teal cone (+ optional upper nappe drawn as a wire ghost) ----
    function drawCone(P, K, a, o = {}) {
      if (a <= 0.003) return null;
      const { upAlpha = 1, glowApex = true } = o;
      const draw = (co, aa, flip, fill) => {
        c.save(); c.globalAlpha = aa;
        if (fill) { c.fillStyle = u.alpha(TEAL, 0.13); u.polyPath(c, co.outline, true); c.fill(); c.fillStyle = u.alpha(TEAL, 0.09); u.polyPath(c, co.ring, true); c.fill(); }
        const j = 0.7, sd = boil * 5 + K.id * 40 + (flip ? 20 : 0);
        ink(c, co.farArc, { w: 2.2, color: TEAL2, alpha: 0.35, jitter: j, seed: sd + 1, taper: 0, step: 5 });
        glowLine(c, co.nearArc, { color: TEAL, w: 3.2, halo: 16, alpha: 0.95, seed: sd + 2, jitter: j });
        glowLine(c, [co.apex2d, co.sil[0]], { color: TEAL, w: 3.2, halo: 16, alpha: 0.95, seed: sd + 3, jitter: j });
        glowLine(c, [co.apex2d, co.sil[1]], { color: TEAL, w: 3.2, halo: 16, alpha: 0.95, seed: sd + 4, jitter: j });
        c.restore();
      };
      const co = u.coneOutline(P, K.alpha, K.h, [0, 0, 0], 96);
      let co2 = null;
      if (K.hUp > 0 && upAlpha > 0.003) { co2 = u.coneOutline(flipCam(P), K.alpha, K.hUp, [0, 0, 0], 96); draw(co2, a * upAlpha, true, false); }
      draw(co, a, false, true);
      if (glowApex) S.glow(c, co.apex2d.x, co.apex2d.y, 70, '#bffff5', 0.3 * a);
      return { co, co2 };
    }
    // apex-angle arc between the two silhouette lines (hand-drawn)
    function apexArc(co, a, seed) {
      if (a <= 0.003) return;
      const ap = co.apex2d; const a0 = Math.atan2(co.sil[0].y - ap.y, co.sil[0].x - ap.x), a1 = Math.atan2(co.sil[1].y - ap.y, co.sil[1].x - ap.x);
      let d = a1 - a0; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
      const pts = u.ellipsePts(ap.x, ap.y, 64, 64, 14, 0, a0, a0 + d);
      ink(c, pts, { w: 2.4, color: GOLD, alpha: 0.85 * a, jitter: 0.6, seed: boil * 3 + seed, taper: 0.3, step: 5 });
    }
    // ---- a panel = pale-gold plane rectangle + the section curve, at a rigid pose {C, ux, uy} ----
    function drawPanel(P, b, pose, o = {}) {
      const { alpha = 1, prog = 1, curveAlpha = 1, planeAlpha = 1, farTest = false, farAlpha = 0.45, glow = 0, marker = 0 } = o;
      if (alpha <= 0.003) return;
      const map = q => { const w = V.add(V.add(pose.C, pose.ux, q.x), pose.uy, q.y); return P(w[0], w[1], w[2]); };
      // plane rectangle: warm light on navy (mostly additive), hand-drawn gold border
      if (planeAlpha > 0.003) {
        const Q = [{ x: -b.hw, y: -b.hh }, { x: b.hw, y: -b.hh }, { x: b.hw, y: b.hh }, { x: -b.hw, y: b.hh }].map(map);
        c.save(); c.globalAlpha = alpha * planeAlpha;
        c.fillStyle = u.alpha('#fff2c8', 0.04); u.polyPath(c, Q, true); c.fill();
        c.globalCompositeOperation = 'lighter'; c.fillStyle = u.alpha('#ffe9a8', 0.07); u.polyPath(c, Q, true); c.fill(); c.globalCompositeOperation = 'source-over';
        ink(c, Q, { w: 2.4, color: GOLD2, alpha: 0.6, jitter: 0.8, seed: boil * 3 + b.t0 + 7, closed: true, taper: 0, step: 6 });
        c.restore();
      }
      if (glow > 0) { const cc = map({ x: 0, y: 0 }); c.save(); c.globalCompositeOperation = 'lighter'; S.glow(c, cc.x, cc.y, Math.max(b.hw, b.hh) * 1.1 * cc.s * 0.55, '#ffe9a8', 0.06 * glow * alpha * breathe(1.2, 4)); c.restore(); }
      // right-angle marker at the cut point p (plane ⟂ generator): halo pass under the ink + a small gold glow at the cut point
      if (marker > 0.003) {
        const m = 0.34; const pl = b.pLoc; const back = V.scale(b.g, -m); // along the generator back toward the apex
        const ax = b.orient === 'ex' ? { x: m, y: 0 } : { x: 0, y: m };    // along the curve axis (in-plane direction d)
        const w0 = V.add(V.add(pose.C, pose.ux, pl.x), pose.uy, pl.y);
        const A = V.add(w0, back), B = V.add(V.add(V.add(w0, back), pose.ux, ax.x), pose.uy, ax.y), Cc = V.add(V.add(w0, pose.ux, ax.x), pose.uy, ax.y);
        const pts = [A, B, Cc].map(w => P(w[0], w[1], w[2])); const p2 = P(w0[0], w0[1], w0[2]);
        S.glow(c, p2.x, p2.y, 40, GOLD2, 0.5 * alpha * marker);
        c.save(); c.globalCompositeOperation = 'lighter'; ink(c, pts, { w: 10, color: u.alpha(GOLD2, 0.2 * alpha * marker), jitter: 0.4, seed: boil * 3 + 31, taper: 0, step: 4 }); c.restore();
        ink(c, pts, { w: 3.2, color: GOLD2, alpha: 0.95 * alpha * marker, jitter: 0.4, seed: boil * 3 + 31, taper: 0, step: 4 });
      }
      // section curve (branches), drawn outward from each vertex; near/far split while attached to the cone
      if (curveAlpha > 0.003 && prog > 0.01) {
        b.loc.forEach((br, bi) => {
          const n = br.length; const iv = b.iv[bi]; const full = prog >= 0.999;
          let i0 = 0, i1 = n - 1;
          if (!full) { i0 = iv - Math.round(prog * iv); i1 = iv + Math.round(prog * (n - 1 - iv)); if (i1 - i0 < 1) { i1 = Math.min(n - 1, i0 + 1); i0 = Math.max(0, i1 - 1); } }
          const closed = b.closed && full;
          const pts = []; const far = [];
          for (let i = i0; i <= i1; i++) { const q = br[i]; const w = V.add(V.add(pose.C, pose.ux, q.x), pose.uy, q.y); const sp = P(w[0], w[1], w[2]); pts.push(sp); if (farTest) far.push(sp.z > P(0, w[1], 0).z + 1e-6); }
          const seed = boil * 7 + b.t0 * 3 + bi * 11;
          if (!farTest) { glowLine(c, pts, { color: TEAL, w: 4.2, halo: 22, alpha: alpha * curveAlpha, seed, jitter: 0.6, closed }); return; }
          // split into runs of equal visibility
          let i = 0; while (i < pts.length) { let j = i; while (j + 1 < pts.length && far[j + 1] === far[i]) j++; const run = pts.slice(i, j + 2 > pts.length ? j + 1 : j + 2); if (run.length >= 2) glowLine(c, run, { color: TEAL, w: far[i] ? 3 : 4.2, halo: far[i] ? 14 : 22, alpha: alpha * curveAlpha * (far[i] ? farAlpha : 1), seed: seed + i, jitter: 0.6 }); i = j + 1; }
        });
        // open curves: faint continuations exiting the panel (only once the panel is detached and the curve complete)
        if (!farTest && prog >= 0.999 && b.ext.length) {
          c.save(); c.globalCompositeOperation = 'lighter';
          b.ext.forEach((e, ei) => {
            for (let k = 0; k < 3; k++) { const q0 = { x: e.p.x + e.d.x * 0.075 * k, y: e.p.y + e.d.y * 0.075 * k }, q1 = { x: e.p.x + e.d.x * 0.075 * (k + 1.15), y: e.p.y + e.d.y * 0.075 * (k + 1.15) }; ink(c, [map(q0), map(q1)], { w: 3.6 - k * 0.9, color: u.alpha(TEAL, (0.34 - k * 0.1) * alpha * curveAlpha), jitter: 0.4, seed: boil * 3 + ei * 5 + k, taper: 0, step: 5 }); }
          });
          c.restore();
        }
      }
    }
    const facingPose = (P, sx, sy, Z) => { const F = S.facingBasis(P.o.yaw, P.o.pitch); return { C: screenToWorld(P, sx, sy, Z), ux: F.xr, uy: F.yu, N: F.N }; };
    const Zfor = (P, scale) => P.o.fov / scale - P.o.dist;   // depth at which 1 unit = `scale` px

    /* ------------------------------------------- cone poses (row / stage) */
    // returns {pose:{cx,cy,fov,ty}, alpha, morph} for cone i at time t, or null. ty = camera target height (row: bases aligned)
    const ROWY = 500, ROWFOV = 1100; const rowTy = K => -K.h + 1.0;
    const stageOf = (K, kUn = 0) => ({ cx: u.lerp(S.STAGE.cx0, S.STAGE.cx1, kUn), cy: S.STAGE.cy, fov: K.fovBeat, ty: -(K.h - K.hUp) / 2 });
    const lerpPose = (a, b, k) => ({ cx: u.lerp(a.cx, b.cx, k), cy: u.lerp(a.cy, b.cy, k), fov: u.lerp(a.fov, b.fov, k), ty: u.lerp(a.ty, b.ty, k) });
    function conePose(i) {
      const K = S.cones[i]; const b = S.beats[i]; const row = { cx: S.SLOTS[i].x, cy: ROWY, fov: ROWFOV, ty: rowTy(K) };
      const kUn = E.io(u.seg(t - b.t0, 3.8, 6.3)); const st = stageOf(K, kUn);
      if (i === 1 && t < 5) { // the S04 cone (target −1.3 = mid-height) morphs into the right cone at centre
        const k = E.io(u.seg(t, 2.5, 5)); return { pose: lerpPose({ cx: 960, cy: 470, fov: 1500, ty: -1.3 }, row, k), alpha: 1, morph: k };
      }
      if (t < 9) { // acute / obtuse cones emerge staggered from behind the centre cone, scaling 0.85→1
        const ts = i === 0 ? 2.5 : 2.9; const k = E.io(u.seg(t, ts, ts + 2.0));
        return { pose: lerpPose({ cx: 960, cy: 485, fov: ROWFOV * 0.85, ty: row.ty }, row, k), alpha: i === 1 ? 1 : Math.pow(u.seg(t, ts, ts + 1.8), 1.6), morph: 1 };
      }
      if (i === 0) { if (t < b.t0 + 0.5) return { pose: lerpPose(row, st, E.io(u.seg(t, 9, 10.5))), alpha: 1, morph: 1 }; return { pose: st, alpha: 1 - E.io(u.seg(t, b.t1 - 0.7, b.t1)), morph: 1 }; }
      if (t < 9.9) return { pose: row, alpha: 1 - E.io(u.seg(t, 9, 9.9)), morph: 1 };
      if (t < b.t0) return null;
      return { pose: st, alpha: Math.min(E.out(u.seg(t, b.t0, b.t0 + 0.6)), 1 - E.io(u.seg(t, b.t1 - 0.7, b.t1))), morph: 1 };
    }

    /* --------------------------------------------------------- intro row */
    const kLab = Math.min(E.out(u.seg(t, 5.2, 5.9)), 1 - E.io(u.seg(t, 8.3, 8.95)));
    for (let i = 0; i < 3; i++) {
      const cp = conePose(i); if (!cp || cp.alpha <= 0.003) continue;
      const K0 = S.cones[i]; let K = K0;
      if (i === 1 && cp.morph < 1) K = { id: 1, alpha: u.lerp(S.s04cone.alpha, K0.alpha, cp.morph), h: u.lerp(S.s04cone.h, K0.h, cp.morph), hUp: 0 };
      const activeBeat = S.beats[i]; const inBeat = t >= activeBeat.t0 - 1 && t < activeBeat.t1;
      if (inBeat) continue;                                   // drawn by the beat block below (with plane/curve)
      const P = cam(cp.pose.cx, cp.pose.cy, cp.pose.fov, cp.pose.ty);
      const r = drawCone(P, K, cp.alpha, { upAlpha: 0 });   // the obtuse cone's upper nappe only appears when the hyperbola cut needs it
      if (r && kLab > 0 && t >= 5 && t < 9.4) {
        const a = kLab * cp.alpha; apexArc(r.co, a, i * 7);
        u.text(c, K0.name, cp.pose.cx, S.LABY[0], { size: 44, font: 'serif', weight: 700, color: '#f6d784', alpha: a, glow: 18, glowColor: '#d9a441' });
        u.text(c, K0.ang, cp.pose.cx, S.LABY[1] - 8, { size: 34, weight: 600, color: GOLD2, alpha: 0.95 * a, glow: 12, glowColor: '#d9a441' });
      }
    }

    /* -------------------------------------------------------------- beats */
    const FIN = { coneOut: [35.1, 35.9], labelOut: [35.1, 35.7], glide: [35.3, 36.8], panelsIn: 35.8, labelsIn: [37.0, 37.6], gate: 35.6 };
    for (const b of S.beats) {
      const last = b === S.beats[2];
      if (t < b.t0 - 1 || (t >= b.t1 + 0.01 && !last)) continue;
      const K = S.cones[b.cone]; const cp = conePose(b.cone); if (!cp) continue;
      const tau = t - b.t0;
      const P = cam(cp.pose.cx, cp.pose.cy, cp.pose.fov, cp.pose.ty);
      // fade-in (0–0.6) for every beat; the last beat fades its cone out early for the finale instead of at t1
      const kFade = last ? Math.min(E.out(u.seg(t, b.t0, b.t0 + 0.6)), 1 - E.io(u.seg(t, FIN.coneOut[0], FIN.coneOut[1]))) : cp.alpha;
      // upper nappe (double cone) grows in as a wire ghost while the plane is arriving
      const upA = K.hUp > 0 ? 0.55 * E.io(u.seg(tau, 0.9, 1.8)) : 0;
      drawCone(P, K, kFade, { upAlpha: upA });
      // 1. the chosen generator (apex → base rim), drawn progressively; on the double cone it continues through the apex (fainter)
      const kGen = E.out(u.seg(tau, 0.4, 1.0)); const genA = kGen * kFade * (1 - 0.6 * E.io(u.seg(tau, 3.8, 4.4)));
      if (kGen > 0) {
        const e = V.scale(b.g, b.genLen * kGen); const a2 = P(0, 0, 0), e2 = P(e[0], e[1], e[2]);
        c.save(); c.globalCompositeOperation = 'lighter'; ink(c, [a2, e2], { w: 14, color: u.alpha(GOLD, 0.14 * genA), jitter: 0.6, seed: boil * 3 + 5, taper: 0, step: 5 }); c.restore();
        ink(c, [a2, e2], { w: 3.6, color: GOLD2, alpha: 0.95 * genA, jitter: 0.6, seed: boil * 3 + 5, taper: 0.15, step: 5 });
        if (b.genUp > 0 && upA > 0) { const e3 = V.scale(b.g, -b.genUp * kGen); const p3 = P(e3[0], e3[1], e3[2]); ink(c, [a2, p3], { w: 2.6, color: GOLD2, alpha: 0.5 * genA * (upA / 0.55), jitter: 0.6, seed: boil * 3 + 6, taper: 0.4, step: 5 }); }
        const pp = P(b.p[0], b.p[1], b.p[2]); S.glow(c, pp.x, pp.y, 34, GOLD2, 0.5 * genA);
      }
      // 2. plane slides in along its own in-plane axis (1.0–2.5), 3. curve draws (2.5–3.5), 4. unfold (3.8–6.3)
      const kSlide = E.out(u.seg(tau, 1.0, 2.5)); const kCurve = E.io(u.seg(tau, 2.5, 3.5)); const kUn = E.io(u.seg(tau, 3.8, 6.3));
      const kMove = last ? E.io(u.seg(t, FIN.glide[0], FIN.glide[1])) : 0;
      if (kSlide > 0) {
        // attached pose (with slide offset): pick whichever in-plane axis moves more across the screen, come from the right
        const C0 = b.C; let dir = b.ux; { const c0 = P(C0[0], C0[1], C0[2]); const px = P(C0[0] + b.ux[0], C0[1] + b.ux[1], C0[2] + b.ux[2]).x - c0.x, py = P(C0[0] + b.uy[0], C0[1] + b.uy[1], C0[2] + b.uy[2]).x - c0.x; dir = Math.abs(px) >= Math.abs(py) ? V.scale(b.ux, Math.sign(px) || 1) : V.scale(b.uy, Math.sign(py) || 1); }
        const slideD = 3.2 * (1 - kSlide);
        const attached = { C: V.add(C0, dir, slideD), ux: b.ux, uy: b.uy, N: b.N };
        const planeA = Math.min(1, u.seg(tau, 1.0, 1.5)) * kFade;
        if (kUn <= 0) {
          drawPanel(P, b, attached, { alpha: planeA, prog: kCurve, curveAlpha: 1, planeAlpha: 1, farTest: true, marker: E.out(u.seg(tau, 2.3, 2.9)) });
        } else {
          // ghost of the section stays on the cone (fades in only once the moving panel has cleared it); the ⟂ marker holds a little longer
          drawPanel(P, b, { C: C0, ux: b.ux, uy: b.uy, N: b.N }, { alpha: kFade, prog: 1, curveAlpha: 0.38 * E.io(u.seg(kUn, 0.3, 0.65)), planeAlpha: 0, farTest: true, farAlpha: 0.4, marker: 1 - E.io(u.seg(kUn, 0.3, 0.55)) });
          // rigid motion: attached pose → facing pose at the right side (then, for the last beat, on to final slot 3)
          let sx = S.PANEL.x, sy = S.PANEL.y, scale = b.scalePanel, pAlpha = kFade;
          if (last) { sx = u.lerp(S.PANEL.x, S.SLOTS[2].x, kMove); sy = u.lerp(S.PANEL.y, S.SLOTS[2].y, kMove); scale = u.lerp(b.scalePanel, b.scaleSlot, kMove); pAlpha = 1; }
          const tgt = facingPose(P, sx, sy, Zfor(P, scale));
          const rot = rotBetween([b.ux, b.uy, b.N], [tgt.ux, tgt.uy, tgt.N]);
          const k = kUn; const ux = rot(b.ux, k), uy = rot(b.uy, k);
          // path bulges toward the camera (−N) and screen-right so the panel swings clear of the cone instead of through it
          const bul = Math.sin(Math.PI * k);
          const Cc = V.add(V.add([u.lerp(C0[0], tgt.C[0], k), u.lerp(C0[1], tgt.C[1], k), u.lerp(C0[2], tgt.C[2], k)], tgt.N, -0.6 * bul), tgt.ux, 0.7 * bul);
          drawPanel(P, b, { C: Cc, ux, uy }, { alpha: pAlpha, prog: 1, curveAlpha: 1, planeAlpha: 1, farTest: false, glow: k });
          // a few warm motes where the light is (the resting panel)
          if (kUn > 0.5 && kMove < 1) u.motes(c, t, { count: 10, box: [S.PANEL.x - 420, S.PANEL.y - 320, 840, 640], seed: 9, color: GOLD2, size: 3, speed: 0.25, alpha: 0.3 * u.seg(kUn, 0.5, 0.8) * pAlpha * (1 - kMove), drift: 0.5 });
        }
      }
      // 5. labels (name + short description) under the panel
      const kOut = last ? 1 - E.io(u.seg(t, FIN.labelOut[0], FIN.labelOut[1])) : kFade;
      const kName = Math.min(E.out(u.seg(tau, 6.0, 6.6)), kOut), kDesc = Math.min(E.out(u.seg(tau, 6.5, 7.1)), kOut);
      if (kName > 0) u.text(c, b.name, S.PANEL.x, S.LABY[0], { size: 60, font: 'serif', weight: 700, color: '#f6d784', alpha: kName, glow: 24, glowColor: '#d9a441', spacing: 4 });
      if (kDesc > 0) u.text(c, b.desc, S.PANEL.x, S.LABY[1], { size: 36, weight: 500, color: IVORY, alpha: 0.9 * kDesc });
    }

    /* ---------------------------------------- finale: three curves side by side (≈36–40) */
    if (t >= FIN.gate) {
      const P = cam(S.STAGE.cx1, S.STAGE.cy, 1400, 0);
      for (let i = 0; i < 2; i++) {
        const b = S.beats[i]; const a = E.out(u.seg(t, FIN.panelsIn + i * 0.3, FIN.panelsIn + 1.0 + i * 0.3)); if (a <= 0) continue;
        const sc = b.scaleSlot * (0.92 + 0.08 * a);
        drawPanel(P, b, facingPose(P, S.SLOTS[i].x, S.SLOTS[i].y, Zfor(P, sc)), { alpha: a, prog: 1, glow: 0.8 });
      }
      const kL = E.out(u.seg(t, FIN.labelsIn[0], FIN.labelsIn[1]));
      u.motes(c, t, { count: 16, box: [80, 130, 1760, 580], seed: 11, color: GOLD2, size: 3, speed: 0.25, alpha: 0.3 * E.out(u.seg(t, FIN.panelsIn, FIN.panelsIn + 1.2)), drift: 0.5 });
      if (kL > 0) for (let i = 0; i < 3; i++) {
        const b = S.beats[i];
        u.text(c, b.name, S.SLOTS[i].x, S.LABY[0], { size: 56, font: 'serif', weight: 700, color: '#f6d784', alpha: kL, glow: 24, glowColor: '#d9a441', spacing: 4 });
        u.text(c, b.desc, S.SLOTS[i].x, S.LABY[1], { size: 34, weight: 500, color: IVORY, alpha: 0.9 * kL });
      }
    }
  },
});
