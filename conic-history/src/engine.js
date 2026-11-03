/* ============================================================================
   《신탁이 남긴 수수께끼: 이차곡선의 탄생》 — shared 2D animation engine
   Virtual canvas 1920x1080, Canvas2D only. Everything that must look
   hand-drawn goes through u.ink / u.wash / u.shape (wobbly, boiling lines).
   Scenes register with ANIM.scene({...}); subtitles live in script.js.
   ========================================================================== */
(function () {
  'use strict';
  const W = 1920, H = 1080;
  const A = (window.ANIM = window.ANIM || {});
  Object.assign(A, {
    W, H, scenes: [], subtitles: [], time: 0, playing: false, dur: 272,
    started: false, showSubs: true, voice: false, sound: true, fps: 24,
    stats: { frames: 0, ms: 0 }, debug: false,
  });

  /* ------------------------------------------------------------ utils */
  const u = (A.u = {});
  const TAU = (u.TAU = Math.PI * 2);
  u.clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
  u.lerp = (a, b, t) => a + (b - a) * t;
  u.map = (v, a, b, c, d, cl = true) => { let t = (v - a) / (b - a); if (cl) t = u.clamp(t); return c + (d - c) * t; };
  u.smooth = (a, b, x) => { const t = u.clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  u.seg = (t, t0, t1) => u.clamp((t - t0) / (t1 - t0));
  u.ease = {
    io: t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
    ioc: t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    out: t => 1 - (1 - t) * (1 - t),
    outc: t => 1 - Math.pow(1 - t, 3),
    outq: t => 1 - Math.pow(1 - t, 5),
    in: t => t * t,
    inc: t => t * t * t,
    sine: t => -(Math.cos(Math.PI * t) - 1) / 2,
    outBack: t => { const c = 1.2; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
  };
  // held frames ("on twos"): animation drawn at 12 fps, boil at 8 fps
  u.frame = (t, fps = 12) => Math.floor(t * fps);
  u.tq = (t, fps = 12) => Math.floor(t * fps) / fps;
  u.boil = (t, fps = 8) => Math.floor(t * fps);
  u.rng = seed => { let s = (Math.floor(seed * 7919 + 13) >>> 0) || 1; return () => { s |= 0; s = (s + 0x6d2b79f5) | 0; let r = Math.imul(s ^ (s >>> 15), 1 | s); r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r; return ((r ^ (r >>> 14)) >>> 0) / 4294967296; }; };
  const hash2 = (x, y) => { const n = Math.sin(x * 127.1 + y * 311.7 + 0.37) * 43758.5453; return n - Math.floor(n); };
  u.noise2 = (x, y = 0) => { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi; const a = hash2(xi, yi), b = hash2(xi + 1, yi), c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1); const ux = xf * xf * (3 - 2 * xf), uy = yf * yf * (3 - 2 * yf); return u.lerp(u.lerp(a, b, ux), u.lerp(c, d, ux), uy); };
  u.snoise = (x, y = 0) => u.noise2(x, y) * 2 - 1;
  u.fbm = (x, y = 0, o = 4) => { let v = 0, amp = 0.5, f = 1, s = 0; for (let i = 0; i < o; i++) { v += amp * u.noise2(x * f + i * 17.17, y * f - i * 9.3); s += amp; amp *= 0.5; f *= 2.03; } return v / s; };
  u.hsl = (h, s, l, a = 1) => `hsla(${h},${s}%,${l}%,${a})`;
  u.rgba = (r, g, b, a = 1) => `rgba(${r},${g},${b},${a})`;
  u.hex2rgb = hex => { const h = hex.replace('#', ''); const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  u.alpha = (hex, a) => { const [r, g, b] = u.hex2rgb(hex); return `rgba(${r},${g},${b},${a})`; };
  u.mixHex = (h1, h2, t) => { const a = u.hex2rgb(h1), b = u.hex2rgb(h2); return `rgb(${Math.round(u.lerp(a[0], b[0], t))},${Math.round(u.lerp(a[1], b[1], t))},${Math.round(u.lerp(a[2], b[2], t))})`; };
  u.dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  u.pt = (x, y) => ({ x, y });
  u.layer = (w = W, h = H, fn) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const ctx = c.getContext('2d'); if (fn) fn(ctx, c); return c; };

  /* --------------------------------------------------- geometry helpers */
  u.ellipsePts = (cx, cy, rx, ry, n = 64, rot = 0, a0 = 0, a1 = TAU) => { const p = []; const cr = Math.cos(rot), sr = Math.sin(rot); for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * (i / n); const x = rx * Math.cos(a), y = ry * Math.sin(a); p.push({ x: cx + x * cr - y * sr, y: cy + x * sr + y * cr }); } return p; };
  u.circlePts = (cx, cy, r, n = 48) => u.ellipsePts(cx, cy, r, r, n);
  u.rectPts = (x, y, w, h) => [{ x, y }, { x: x + w, y }, { x: x + w, y: y + h }, { x, y: y + h }];
  // smooth Catmull-Rom through control points -> dense polyline
  u.curve = (pts, segs = 8, closed = false) => { const n = pts.length; if (n < 2) return pts.slice(); const out = []; const get = i => pts[closed ? (i + n) % n : u.clamp(i, 0, n - 1)]; const last = closed ? n : n - 1; for (let i = 0; i < last; i++) { const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2); for (let j = 0; j < segs; j++) { const t = j / segs, t2 = t * t, t3 = t2 * t; out.push({ x: 0.5 * (2 * p1.x + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3), y: 0.5 * (2 * p1.y + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3) }); } } if (!closed) out.push(pts[n - 1]); else out.push(out[0]); return out; };
  u.resample = (pts, step = 6) => { if (pts.length < 2) return pts.slice(); const out = [pts[0]]; let carry = 0; for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i]; const L = Math.hypot(b.x - a.x, b.y - a.y); if (L < 1e-6) continue; let d = step - carry; while (d <= L) { const t = d / L; out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }); d += step; } carry = L - (d - step); } const l = pts[pts.length - 1]; if (u.dist(out[out.length - 1], l) > 0.5) out.push(l); return out; };
  // displace polyline with low-frequency noise (hand tremor)
  u.wobble = (pts, jitter = 2, seed = 1, freq = 0.02) => pts.map((p, i) => ({ x: p.x + u.snoise(i * freq * 7 + seed * 11.1, seed) * jitter, y: p.y + u.snoise(i * freq * 7 + seed * 3.7, seed + 50) * jitter }));
  u.polyPath = (ctx, pts, closed = true) => { ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y); if (closed) ctx.closePath(); };

  /* ---------------------------------------------------------- ink line
     Variable-width ribbon with tremor; seed changes every boil frame so
     the line "boils" like pencil tests / cel animation. */
  u.ink = (ctx, pts, o = {}) => {
    const { w = 3, color = '#2b1d14', jitter = 1.4, seed = 1, alpha = 1, closed = false, taper = 0.4, step = 6, freq = 0.09, cap = true } = o;
    if (!pts || pts.length < 2) return;
    let P = u.resample(closed ? [...pts, pts[0]] : pts, step);
    const n = P.length; if (n < 2) return;
    const L = new Array(n), R = new Array(n);
    for (let i = 0; i < n; i++) {
      const p0 = P[Math.max(0, i - 1)], p1 = P[Math.min(n - 1, i + 1)];
      let dx = p1.x - p0.x, dy = p1.y - p0.y; const len = Math.hypot(dx, dy) || 1; dx /= len; dy /= len;
      const nx = -dy, ny = dx, s = i * step;
      const off = u.snoise(s * freq * 0.35 + seed * 7.3, seed * 3.1) * jitter;
      const tw = closed ? 1 : 1 - taper + taper * Math.sin(Math.PI * (i / (n - 1)));
      const ww = Math.max(0.4, w * tw * (0.7 + 0.6 * u.noise2(s * freq + seed * 2.2, seed * 5 + 1)));
      const cx = P[i].x + nx * off, cy = P[i].y + ny * off;
      L[i] = { x: cx + nx * ww / 2, y: cy + ny * ww / 2 }; R[i] = { x: cx - nx * ww / 2, y: cy - ny * ww / 2 };
    }
    ctx.save(); ctx.globalAlpha *= alpha; ctx.fillStyle = color; ctx.beginPath();
    ctx.moveTo(L[0].x, L[0].y); for (let i = 1; i < n; i++) ctx.lineTo(L[i].x, L[i].y);
    for (let i = n - 1; i >= 0; i--) ctx.lineTo(R[i].x, R[i].y); ctx.closePath(); ctx.fill();
    if (cap && !closed) { const r0 = u.dist(L[0], R[0]) / 2, r1 = u.dist(L[n - 1], R[n - 1]) / 2; ctx.beginPath(); ctx.arc(P[0].x, P[0].y, r0, 0, TAU); ctx.arc(P[n - 1].x, P[n - 1].y, r1, 0, TAU); ctx.fill(); }
    ctx.restore();
  };
  // several thin passes = pencil / sketch feel
  u.sketch = (ctx, pts, o = {}) => { const { passes = 2, w = 1.4, jitter = 2.5, seed = 1, alpha = 0.6 } = o; for (let k = 0; k < passes; k++) u.ink(ctx, pts, Object.assign({}, o, { w, jitter, seed: seed + k * 13.7, alpha })); };
  // wobbly filled shape (cel paint) with optional ink outline
  u.shape = (ctx, pts, o = {}) => {
    const { fill, stroke, w = 3, jitter = 1.5, seed = 1, alpha = 1, closed = true, inkOpt = {} } = o;
    const P = u.wobble(u.resample(closed ? [...pts, pts[0]] : pts, 10), jitter * 0.5, seed);
    if (fill) { ctx.save(); ctx.globalAlpha *= alpha; ctx.fillStyle = fill; u.polyPath(ctx, P, true); ctx.fill(); ctx.restore(); }
    if (stroke) u.ink(ctx, pts, Object.assign({ w, color: stroke, jitter, seed, closed, alpha }, inkOpt));
  };
  // watercolor-ish fill: layered translucent wobbly fills, darker rim
  u.wash = (ctx, pts, color, o = {}) => {
    const { seed = 1, passes = 3, spread = 5, alpha = 0.4, closed = true } = o;
    ctx.save(); ctx.globalAlpha *= alpha;
    for (let k = 0; k < passes; k++) { const P = u.wobble(u.resample(closed ? [...pts, pts[0]] : pts, 12), spread * (0.4 + k * 0.5), seed + k * 31); ctx.fillStyle = color; u.polyPath(ctx, P, true); ctx.fill(); }
    ctx.restore();
  };
  // soft round dab (gouache) and dabbed brush stroke
  u.dab = (ctx, x, y, r, color, alpha = 0.5, soft = 0.55) => { const g = ctx.createRadialGradient(x, y, r * soft, x, y, r); g.addColorStop(0, color); g.addColorStop(1, u.alpha(color.startsWith('#') ? color : '#000000', 0)); ctx.save(); ctx.globalAlpha *= alpha; ctx.fillStyle = color.startsWith('#') ? g : color; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.restore(); };
  u.brush = (ctx, x0, y0, x1, y1, o = {}) => { const { w = 30, color = '#888', alpha = 0.35, seed = 1, scatter = 0.25, step = 0.35 } = o; const L = Math.hypot(x1 - x0, y1 - y0); const n = Math.max(2, Math.floor(L / (w * step))); const r = u.rng(seed); for (let i = 0; i <= n; i++) { const t = i / n; const x = u.lerp(x0, x1, t) + (r() - 0.5) * w * scatter, y = u.lerp(y0, y1, t) + (r() - 0.5) * w * scatter; u.dab(ctx, x, y, w * (0.45 + r() * 0.3), color, alpha * (0.7 + r() * 0.3)); } };
  u.grad = (ctx, x0, y0, x1, y1, stops) => { const g = ctx.createLinearGradient(x0, y0, x1, y1); stops.forEach(([p, c]) => g.addColorStop(p, c)); return g; };
  u.glow = (ctx, x, y, r, color, alpha = 0.6) => { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, color); g.addColorStop(0.35, u.alpha(color, 0.5)); g.addColorStop(1, u.alpha(color, 0)); ctx.save(); ctx.globalAlpha *= alpha; ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore(); };
  // glowing line (for mathematical curves): halo + core
  u.glowLine = (ctx, pts, o = {}) => { const { color = '#58e0d0', w = 4, halo = 18, alpha = 1, seed = 1, jitter = 0.6, closed = false } = o; ctx.save(); ctx.globalCompositeOperation = 'lighter'; u.ink(ctx, pts, { w: halo, color: u.alpha(color, 0.10 * alpha), jitter, seed, closed, taper: 0 }); u.ink(ctx, pts, { w: halo * 0.45, color: u.alpha(color, 0.22 * alpha), jitter, seed, closed, taper: 0 }); ctx.restore(); u.ink(ctx, pts, { w, color: u.alpha(color, alpha), jitter, seed, closed, taper: 0.1 }); u.ink(ctx, pts, { w: w * 0.4, color: u.alpha('#ffffff', 0.7 * alpha), jitter, seed, closed, taper: 0.1 }); };

  /* -------------------------------------------------- texture overlays */
  let paperTex = null, grainTex = [];
  u.paper = (ctx, alpha = 0.18, mode = 'multiply') => {
    if (!paperTex) { paperTex = u.layer(512, 512, c => { const id = c.createImageData(512, 512), d = id.data; for (let y = 0; y < 512; y++) for (let x = 0; x < 512; x++) { const i = (y * 512 + x) * 4; const f = u.fbm(x * 0.03, y * 0.03, 3) * 0.6 + u.noise2(x * 0.4, y * 0.4) * 0.4; const v = 200 + (f - 0.5) * 110; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; } c.putImageData(id, 0, 0); }); }
    ctx.save(); ctx.globalAlpha *= alpha; ctx.globalCompositeOperation = mode; ctx.fillStyle = ctx.createPattern(paperTex, 'repeat'); ctx.fillRect(0, 0, W, H); ctx.restore();
  };
  u.grain = (ctx, t, alpha = 0.07) => {
    if (!grainTex.length) for (let k = 0; k < 4; k++) grainTex.push(u.layer(256, 256, c => { const id = c.createImageData(256, 256), d = id.data; const r = u.rng(k + 3); for (let i = 0; i < d.length; i += 4) { const v = 110 + r() * 90; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; } c.putImageData(id, 0, 0); }));
    const k = Math.floor(t * 12) % 4; ctx.save(); ctx.globalAlpha *= alpha; ctx.globalCompositeOperation = 'overlay'; ctx.translate((k * 37) % 256, (k * 91) % 256); ctx.fillStyle = ctx.createPattern(grainTex[k], 'repeat'); ctx.fillRect(-256, -256, W + 512, H + 512); ctx.restore();
  };
  u.vignette = (ctx, s = 0.55, color = '#000') => { const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.95); g.addColorStop(0, u.alpha(color, 0)); g.addColorStop(1, u.alpha(color, s)); ctx.save(); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore(); };
  // soft light shaft (god ray) polygon
  u.ray = (ctx, x0, y0, x1, y1, w0, w1, color = '#ffe9b0', alpha = 0.25) => { const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L; const g = ctx.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, u.alpha(color, 1)); g.addColorStop(1, u.alpha(color, 0)); ctx.save(); ctx.globalAlpha *= alpha; ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x0 + nx * w0, y0 + ny * w0); ctx.lineTo(x1 + nx * w1, y1 + ny * w1); ctx.lineTo(x1 - nx * w1, y1 - ny * w1); ctx.lineTo(x0 - nx * w0, y0 - ny * w0); ctx.closePath(); ctx.fill(); ctx.restore(); };

  /* -------------------------------------------------------------- text */
  A.fonts = {
    sans: "'Pretendard','Noto Sans KR','Noto Sans CJK KR','Apple SD Gothic Neo','Malgun Gothic','Segoe UI',sans-serif",
    serif: "'Noto Serif KR','Noto Serif CJK KR','Nanum Myeongjo','Apple Myungjo','Batang','Georgia',serif",
    math: "'STIX Two Math','Cambria Math','Latin Modern Math','Times New Roman','Noto Serif CJK KR',serif",
  };
  u.text = (ctx, str, x, y, o = {}) => {
    const { size = 40, font = 'sans', weight = 500, italic = false, color = '#fff', align = 'center', base = 'middle', alpha = 1, glow = 0, glowColor, stroke, strokeW = 0, spacing = 0, maxWidth } = o;
    ctx.save(); ctx.globalAlpha *= alpha; ctx.font = `${italic ? 'italic ' : ''}${weight} ${size}px ${A.fonts[font] || font}`; ctx.textAlign = align; ctx.textBaseline = base; if ('letterSpacing' in ctx) ctx.letterSpacing = spacing + 'px';
    if (glow) { ctx.shadowColor = glowColor || color; ctx.shadowBlur = glow; }
    if (stroke) { ctx.lineJoin = 'round'; ctx.strokeStyle = stroke; ctx.lineWidth = strokeW || size * 0.12; maxWidth ? ctx.strokeText(str, x, y, maxWidth) : ctx.strokeText(str, x, y); }
    ctx.fillStyle = color; maxWidth ? ctx.fillText(str, x, y, maxWidth) : ctx.fillText(str, x, y);
    if (glow) { ctx.shadowBlur = 0; maxWidth ? ctx.fillText(str, x, y, maxWidth) : ctx.fillText(str, x, y); }
    ctx.restore();
  };
  u.textW = (ctx, str, size, font = 'sans', weight = 500) => { ctx.save(); ctx.font = `${weight} ${size}px ${A.fonts[font] || font}`; const w = ctx.measureText(str).width; ctx.restore(); return w; };
  // math string: latin letters italic serif, others upright. Uses unicode ², ³, ∛.
  u.math = (ctx, str, x, y, o = {}) => {
    const { size = 48, color = '#f3d27a', align = 'center', alpha = 1, glow = 0, base = 'middle' } = o;
    ctx.save(); ctx.globalAlpha *= alpha; ctx.textBaseline = base;
    const parts = []; let cur = '', mode = null;
    for (const ch of str) { const m = /[a-zA-Z]/.test(ch) ? 'i' : 'u'; if (mode !== null && m !== mode) { parts.push([mode, cur]); cur = ''; } mode = m; cur += ch; } if (cur) parts.push([mode, cur]);
    const fonts = parts.map(([m]) => `${m === 'i' ? 'italic ' : ''}${m === 'i' ? 500 : 500} ${size}px ${A.fonts.math}`);
    let total = 0; const widths = parts.map(([, s], i) => { ctx.font = fonts[i]; const w = ctx.measureText(s).width; total += w; return w; });
    let cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
    ctx.textAlign = 'left'; if (glow) { ctx.shadowColor = o.glowColor || color; ctx.shadowBlur = glow; }
    parts.forEach(([, s], i) => { ctx.font = fonts[i]; ctx.fillStyle = color; ctx.fillText(s, cx, y); if (glow) { const b = ctx.shadowBlur; ctx.shadowBlur = 0; ctx.fillText(s, cx, y); ctx.shadowBlur = b; } cx += widths[i]; });
    ctx.restore(); return total;
  };
  // typewriter helper: returns substring by progress (0..1)
  u.typed = (str, p) => str.slice(0, Math.round(u.clamp(p) * str.length));

  /* ---------------------------------------------------------------- 3D
     Right-handed, y up. Camera orbits target: yaw about y, pitch about x.
     P(x,y,z) -> {x,y (screen), z (depth, larger = farther), s (scale)}. */
  u.camera = (o = {}) => {
    const { yaw = 0.6, pitch = 0.35, dist = 9, fov = 1100, cx = W / 2, cy = H / 2, target = [0, 0, 0] } = o;
    const cyw = Math.cos(yaw), syw = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    const P = (x, y, z) => { x -= target[0]; y -= target[1]; z -= target[2]; const x1 = x * cyw - z * syw, z1 = x * syw + z * cyw; const y2 = y * cp - z1 * sp, z2 = y * sp + z1 * cp; const d = dist + z2; const s = fov / Math.max(0.05, d); return { x: cx + x1 * s, y: cy - y2 * s, z: z2, s }; };
    P.o = Object.assign({}, o, { yaw, pitch, dist, fov, cx, cy, target });
    P.pts = arr => arr.map(p => P(p.x, p.y, p.z)); P.dir = (() => { const v = P(0, 0, 0), w = P(0, 0, 1); return { fx: 0 }; })();
    return P;
  };
  // cube with corner o=[x,y,z] (min corner), edge s. Returns faces sorted back->front, each {pts:[4 screen pts], n:index, depth, front}
  u.cubeFaces = (P, o = [0, 0, 0], s = 1) => {
    const [x, y, z] = o; const V = [[x, y, z], [x + s, y, z], [x + s, y + s, z], [x, y + s, z], [x, y, z + s], [x + s, y, z + s], [x + s, y + s, z + s], [x, y + s, z + s]].map(v => P(v[0], v[1], v[2]));
    const F = [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [3, 2, 6, 7], [0, 3, 7, 4], [1, 2, 6, 5]];
    return F.map((f, i) => { const pts = f.map(k => V[k]); const depth = pts.reduce((a, p) => a + p.z, 0) / 4; const area = (pts[1].x - pts[0].x) * (pts[2].y - pts[0].y) - (pts[2].x - pts[0].x) * (pts[1].y - pts[0].y); return { pts, i, depth, area }; }).sort((a, b) => b.depth - a.depth);
  };
  u.cubeEdges = (P, o = [0, 0, 0], s = 1) => { const [x, y, z] = o; const V = [[x, y, z], [x + s, y, z], [x + s, y + s, z], [x, y + s, z], [x, y, z + s], [x + s, y, z + s], [x + s, y + s, z + s], [x, y + s, z + s]].map(v => P(v[0], v[1], v[2])); const E = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]]; return E.map(([a, b]) => [V[a], V[b]]); };
  // draw cube: translucent faces (front faces brighter) + ink edges (hidden edges fainter)
  u.cube = (ctx, P, o = {}) => {
    const { origin = [0, 0, 0], size = 1, color = '#58e0d0', edge = '#9ff5ea', faceAlpha = 0.16, w = 3, jitter = 0.8, seed = 1, alpha = 1, hiddenAlpha = 0.25, glow = true } = o;
    const faces = u.cubeFaces(P, origin, size); const n = faces.length; const front = faces.slice(3);
    ctx.save(); ctx.globalAlpha *= alpha;
    faces.forEach((f, k) => { const isFront = k >= 3; ctx.globalAlpha = alpha * faceAlpha * (isFront ? 1 : 0.5); ctx.fillStyle = color; u.polyPath(ctx, f.pts, true); ctx.fill(); });
    ctx.restore();
    const edges = u.cubeEdges(P, origin, size);
    // an edge is visible if it belongs to any front face
    const frontKeys = new Set(); front.forEach(f => { for (let i = 0; i < 4; i++) { const a = f.pts[i], b = f.pts[(i + 1) % 4]; frontKeys.add(key(a, b)); } });
    function key(a, b) { const ka = a.x.toFixed(1) + ',' + a.y.toFixed(1), kb = b.x.toFixed(1) + ',' + b.y.toFixed(1); return ka < kb ? ka + '|' + kb : kb + '|' + ka; }
    edges.forEach(([a, b], i) => { const vis = frontKeys.has(key(a, b)); if (glow && vis) u.glowLine(ctx, [a, b], { color: edge, w, halo: w * 4, alpha, seed: seed + i, jitter }); else u.ink(ctx, [a, b], { w: vis ? w : w * 0.7, color: edge, alpha: alpha * (vis ? 1 : hiddenAlpha), jitter, seed: seed + i, taper: 0.1 }); });
  };
  /* Cone: apex at origin, axis along -y (opens downward), half-angle alpha,
     height h (y in [-h,0]); double=true adds the upper nappe (y in [0,h]).
     plane {p:[x,y,z], nrm:[x,y,z]}. Returns array of branches of 3D points
     {x,y,z,th,t} exactly on both the cone and the plane. */
  u.coneSection = (o = {}) => {
    const { alpha = Math.PI / 6, h = 3, double = false, plane, n = 360, apex = [0, 0, 0] } = o;
    const [ax, ay, az] = apex, [px, py, pz] = plane.p, [nx, ny, nz] = plane.nrm; const d = nx * (px - ax) + ny * (py - ay) + nz * (pz - az);
    const sa = Math.sin(alpha), ca = Math.cos(alpha); const branches = []; let cur = [];
    for (let i = 0; i <= n; i++) {
      const th = (i / n) * TAU; const dx = sa * Math.cos(th), dy = -ca, dz = sa * Math.sin(th); const den = nx * dx + ny * dy + nz * dz;
      let ok = Math.abs(den) > 1e-9; let t = ok ? d / den : 0; const yy = t * dy; if (ok) ok = double ? Math.abs(yy) <= h + 1e-9 : t >= 0 && -yy <= h + 1e-9;
      if (!ok) { if (cur.length) { branches.push(cur); cur = []; } continue; }
      cur.push({ x: ax + t * dx, y: ay + yy, z: az + t * dz, th, t });
    }
    if (cur.length) branches.push(cur);
    if (branches.length > 1) { const f = branches[0], l = branches[branches.length - 1]; if (f[0].th < 1e-9 && l[l.length - 1].th > TAU - 1e-6) { branches[0] = l.concat(f.slice(1)); branches.pop(); } }
    // for double cone, a single branch list may contain both nappes glued at th wrap: split where t changes sign
    const out = []; branches.forEach(b => { let c = [b[0]]; for (let i = 1; i < b.length; i++) { if (Math.sign(b[i].t) !== Math.sign(b[i - 1].t)) { out.push(c); c = []; } c.push(b[i]); } out.push(c); });
    return out.filter(b => b.length > 1);
  };
  // conic type from plane normal vs axis (0,±1,0): 'circle'|'ellipse'|'parabola'|'hyperbola'
  u.conicType = (alpha, nrm, eps = 1e-3) => { const L = Math.hypot(...nrm); const cosPhi = Math.abs(nrm[1]) / L; const phi = Math.acos(u.clamp(cosPhi, -1, 1)); const theta = Math.PI / 2 - phi; if (Math.abs(theta - Math.PI / 2) < eps) return 'circle'; if (Math.abs(theta - alpha) < eps) return 'parabola'; return theta > alpha ? 'ellipse' : 'hyperbola'; };
  // basis on plane for flattening a 3D conic into 2D coords: returns {to2d(p)->{x,y}}
  u.planeBasis = (plane) => { const n = plane.nrm, L = Math.hypot(...n), N = n.map(v => v / L); let up = Math.abs(N[1]) > 0.9 ? [0, 0, 1] : [0, 1, 0]; const ex = norm(cross(up, N)), ey = cross(N, ex); function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; } function norm(a) { const l = Math.hypot(...a); return a.map(v => v / l); } return { ex, ey, N, to2d: p => { const dx = p.x - plane.p[0], dy = p.y - plane.p[1], dz = p.z - plane.p[2]; return { x: dx * ex[0] + dy * ex[1] + dz * ex[2], y: dx * ey[0] + dy * ey[1] + dz * ey[2] }; }, to3d: (x, y) => ({ x: plane.p[0] + ex[0] * x + ey[0] * y, y: plane.p[1] + ex[1] * x + ey[1] * y, z: plane.p[2] + ex[2] * x + ey[2] * y }) }; };
  // cone ring (circle at height y) in 3D
  u.coneRing = (alpha, y, n = 96, apex = [0, 0, 0]) => { const r = Math.abs(y) * Math.tan(alpha); const pts = []; for (let i = 0; i <= n; i++) { const th = (i / n) * TAU; pts.push({ x: apex[0] + r * Math.cos(th), y: apex[1] + y, z: apex[2] + r * Math.sin(th) }); } return pts; };
  // projected cone outline: {outline (2D closed), ring (2D), sil:[i1,i2], apex2d}
  u.coneOutline = (P, alpha, h, apex = [0, 0, 0], n = 96) => {
    const ring = P.pts(u.coneRing(alpha, -h, n, apex)); const ap = P(apex[0], apex[1], apex[2]);
    const c = P(apex[0], apex[1] - h, apex[2]); let dx = c.x - ap.x, dy = c.y - ap.y; const L = Math.hypot(dx, dy) || 1; dx /= L; dy /= L; const nx = -dy, ny = dx;
    let i1 = 0, i2 = 0, mn = 1e9, mx = -1e9; ring.forEach((p, i) => { const d = (p.x - ap.x) * nx + (p.y - ap.y) * ny; if (d < mn) { mn = d; i1 = i; } if (d > mx) { mx = d; i2 = i; } });
    const arc = (a, b) => { const out = []; let i = a; while (true) { out.push(ring[i % n]); if (i % n === b % n) break; i++; } return out; };
    const A1 = arc(i1, i2), A2 = arc(i2, i1); const far = arr => { const m = arr[Math.floor(arr.length / 2)]; return Math.hypot(m.x - ap.x, m.y - ap.y); };
    const farArc = far(A1) > far(A2) ? A1 : A2; const outline = [ap, ...farArc, ap];
    return { outline, ring, sil: [ring[i1], ring[i2]], apex2d: ap, farArc, nearArc: farArc === A1 ? A2 : A1 };
  };

  /* ------------------------------------------------------------- scenes */
  A.scene = def => { def.state = {}; def.fadeIn = def.fadeIn ?? 0.9; def.fadeOut = def.fadeOut ?? 0.9; A.scenes.push(def); A.scenes.sort((a, b) => a.start - b.start); return def; };
  A.subs = arr => { A.subtitles.push(...arr); A.subtitles.sort((a, b) => a.start - b.start); };
  A.sceneAt = T => A.scenes.find(s => T >= s.start && T < s.end) || (T >= A.dur - 0.001 ? A.scenes[A.scenes.length - 1] : null);

  /* ---------------------------------------------------------- rendering */
  let canvas, ctx, dpr = 1;
  const api = { W, H, u, ctx: null, t: 0, T: 0, dt: 1 / 24, frame: 0, boil: 0, tq: 0, p: 0, state: null, scene: null,
    seg: (a, b) => u.seg(api.t, a, b),
    // camera transform about screen center: zoom, pan (x,y in virtual px), rot, shake amplitude
    cam(o = {}) { const { x = 0, y = 0, zoom = 1, rot = 0, shake = 0 } = o; const c = api.ctx; c.save(); c.translate(W / 2, H / 2); if (shake) { c.translate(u.snoise(api.T * 9.1, 1) * shake, u.snoise(api.T * 8.3, 2) * shake); } c.scale(zoom, zoom); c.rotate(rot); c.translate(-W / 2 - x, -H / 2 - y); },
    endCam() { api.ctx.restore(); },
  };
  A.api = api;

  function drawSubs(c, T) {
    if (!A.showSubs) return;
    const now = A.subtitles.filter(s => T >= s.start - 0.35 && T < s.end + 0.35);
    for (const s of now) {
      const a = Math.min(u.smooth(s.start - 0.35, s.start + 0.05, T), 1 - u.smooth(s.end - 0.05, s.end + 0.35, T));
      if (a <= 0) continue;
      const who = s.who || 'n';
      if (who === 'n') {
        const size = 44; const w = u.textW(c, s.text, size, 'sans', 600) + 70; const y = H - 118;
        c.save(); c.globalAlpha = a * 0.55; c.fillStyle = '#05070d'; roundRect(c, W / 2 - w / 2, y - 40, w, 80, 12); c.fill(); c.restore();
        u.text(c, s.text, W / 2, y, { size, weight: 600, color: '#f6f1e6', alpha: a, glow: 0 });
      } else if (who === 'o') {
        const y = H - 215; u.text(c, s.text, W / 2 + 2, y + 3, { size: 54, font: 'serif', weight: 700, color: '#000', alpha: a * 0.6, spacing: 3 });
        u.text(c, s.text, W / 2, y, { size: 54, font: 'serif', weight: 700, color: '#f6d784', alpha: a, glow: 28, glowColor: '#ffb640', spacing: 3 });
      } else if (who === 'c') {
        const size = 26; const w = u.textW(c, s.text, size, 'sans', 400) + 36; const y = H - 36;
        c.save(); c.globalAlpha = a * 0.5; c.fillStyle = '#05070d'; roundRect(c, 40, y - 20, w, 40, 8); c.fill(); c.restore();
        u.text(c, s.text, 58, y, { size, weight: 400, color: '#d8d2c4', alpha: a, align: 'left' });
      } else if (who === 't') {
        u.text(c, s.text, W / 2, H / 2, { size: 72, font: 'serif', weight: 700, color: '#f6e9c8', alpha: a, glow: 30, glowColor: '#d9a441', spacing: 6 });
      }
    }
  }
  function roundRect(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }

  function renderFrame(T, dt = 1 / 24) {
    const t0 = performance.now();
    const c = ctx; api.ctx = c; api.T = T; api.dt = dt;
    c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
    const s = A.sceneAt(T);
    if (s) {
      if (!s._inited) { s._inited = true; try { s.init && s.init(api, s.state); } catch (e) { console.error('init', s.id, e); } }
      api.scene = s; api.state = s.state; api.t = Math.min(T, s.end - 0.0001) - s.start; api.p = u.clamp(api.t / (s.end - s.start)); api.frame = u.frame(api.t); api.tq = u.tq(api.t); api.boil = u.boil(api.t);
      c.save(); try { s.draw(api, api.t, s.state); } catch (e) { if (!s._errLogged) { s._errLogged = true; console.error('draw error in', s.id, e.message, e.stack); } } c.restore();
      c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
      // fades
      const fi = s.fadeIn ? u.clamp((T - s.start) / s.fadeIn) : 1, fo = s.fadeOut ? u.clamp((s.end - T) / s.fadeOut) : 1; const f = Math.min(fi, fo);
      if (f < 1) { c.fillStyle = `rgba(0,0,0,${1 - u.ease.sine(f)})`; c.fillRect(0, 0, W, H); }
    }
    if (!s || s.post !== false) { u.grain(c, T, 0.06); u.vignette(c, 0.42); }
    drawSubs(c, T);
    if (A.debug) { u.text(c, `T=${T.toFixed(2)} ${s ? s.id : ''} t=${api.t.toFixed(2)}`, 20, 30, { size: 22, align: 'left', color: '#0f0', font: 'monospace' }); }
    A.stats.frames++; A.stats.ms += performance.now() - t0;
  }
  A.renderAt = T => { A.time = u.clamp(T, 0, A.dur); renderFrame(A.time, 1 / 24); return A.time; };
  A.initAll = () => { A.scenes.forEach(s => { if (!s._inited) { s._inited = true; try { s.init && s.init(api, s.state); } catch (e) { console.error('init', s.id, e); } } }); };

  /* ------------------------------------------------------------- audio */
  const snd = (A.snd = { ctx: null, layers: {}, mood: 'ancient', master: null, nextChime: 0 });
  const MOODS = { silent: { drone: 0, wind: 0, pad: 0, chime: 0, rumble: 0 }, ancient: { drone: 0.5, wind: 0.5, pad: 0.05, chime: 0, rumble: 0 }, oracle: { drone: 0.7, wind: 0.3, pad: 0.15, chime: 0.3, rumble: 0.8 }, work: { drone: 0.3, wind: 0.35, pad: 0.15, chime: 0.4, rumble: 0 }, math: { drone: 0.12, wind: 0.05, pad: 0.5, chime: 1.2, rumble: 0 }, rise: { drone: 0.25, wind: 0.1, pad: 0.75, chime: 1.8, rumble: 0.2 }, finale: { drone: 0.35, wind: 0.15, pad: 0.9, chime: 1, rumble: 0 } };
  snd.start = () => {
    if (snd.ctx) { if (snd.ctx.state === 'suspended') snd.ctx.resume(); return; }
    try { const C = (snd.ctx = new (window.AudioContext || window.webkitAudioContext)()); const master = (snd.master = C.createGain()); master.gain.value = A.sound ? 0.5 : 0; master.connect(C.destination);
      const mk = () => { const g = C.createGain(); g.gain.value = 0; g.connect(master); return g; };
      // drone: detuned low sines
      const dg = mk(); [55, 55.4, 82.5, 110.3].forEach((f, i) => { const o = C.createOscillator(); o.type = i < 2 ? 'sine' : 'triangle'; o.frequency.value = f; const g = C.createGain(); g.gain.value = i < 2 ? 0.25 : 0.08; o.connect(g); g.connect(dg); o.start(); });
      // wind/sea: filtered noise with slow LFO
      const wg = mk(); const buf = C.createBuffer(1, C.sampleRate * 4, C.sampleRate); const d = buf.getChannelData(0); let last = 0; for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } const ns = C.createBufferSource(); ns.buffer = buf; ns.loop = true; const bp = C.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 400; bp.Q.value = 0.6; const lfo = C.createOscillator(); lfo.frequency.value = 0.07; const lg = C.createGain(); lg.gain.value = 250; lfo.connect(lg); lg.connect(bp.frequency); lfo.start(); ns.connect(bp); bp.connect(wg); ns.start();
      // pad: soft chord with slow amplitude LFO
      const pg = mk(); [220, 277.2, 329.6, 440, 659.3].forEach((f, i) => { const o = C.createOscillator(); o.type = 'triangle'; o.frequency.value = f; const g = C.createGain(); g.gain.value = [0.12, 0.08, 0.08, 0.05, 0.025][i]; const lp = C.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; const l = C.createOscillator(); l.frequency.value = 0.11 + i * 0.023; const lgn = C.createGain(); lgn.gain.value = g.gain.value * 0.5; l.connect(lgn); lgn.connect(g.gain); l.start(); o.connect(lp); lp.connect(g); g.connect(pg); o.start(); });
      // rumble (oracle)
      const rg = mk(); const ro = C.createOscillator(); ro.type = 'sine'; ro.frequency.value = 38; const rt = C.createOscillator(); rt.frequency.value = 2.3; const rtg = C.createGain(); rtg.gain.value = 0.5; const rgg = C.createGain(); rgg.gain.value = 0.5; rt.connect(rtg); rtg.connect(rgg.gain); ro.connect(rgg); rgg.connect(rg); ro.start(); rt.start();
      snd.layers = { drone: dg, wind: wg, pad: pg, rumble: rg, chime: { gain: { value: 0 } } };
    } catch (e) { console.warn('audio unavailable', e); }
  };
  snd.setMood = (m, fast = false) => { snd.mood = m; if (!snd.ctx) return; const tgt = MOODS[m] || MOODS.ancient; const now = snd.ctx.currentTime; for (const k of ['drone', 'wind', 'pad', 'rumble']) { const g = snd.layers[k]; g.gain.cancelScheduledValues(now); g.gain.setTargetAtTime(tgt[k] * 0.6, now, fast ? 0.3 : 2.5); } snd.chimeRate = tgt.chime; };
  snd.chime = (freq, dur = 2.2, vol = 0.12) => { if (!snd.ctx) return; const C = snd.ctx, t = C.currentTime; const o = C.createOscillator(); o.type = 'sine'; o.frequency.value = freq; const o2 = C.createOscillator(); o2.type = 'sine'; o2.frequency.value = freq * 2.01; const g = C.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); const g2 = C.createGain(); g2.gain.value = 0.25; o.connect(g); o2.connect(g2); g2.connect(g); g.connect(snd.master); o.start(t); o2.start(t); o.stop(t + dur); o2.stop(t + dur); };
  snd.sweep = () => { if (!snd.ctx) return; const C = snd.ctx, t = C.currentTime; const o = C.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(300, t); o.frequency.exponentialRampToValueAtTime(1800, t + 1.6); const g = C.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.1, t + 0.4); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.2); o.connect(g); g.connect(snd.master); o.start(t); o.stop(t + 2.3); };
  const PENTA = [329.6, 392, 440, 523.3, 587.3, 659.3, 784, 880];
  snd.tick = (T, dt) => { if (!snd.ctx || !A.playing) return; const rate = snd.chimeRate || 0; if (rate > 0) { snd.nextChime -= dt * rate; if (snd.nextChime <= 0) { snd.nextChime = 1.6 + Math.random() * 2.4; snd.chime(PENTA[Math.floor(Math.random() * PENTA.length)] * (Math.random() < 0.3 ? 0.5 : 1), 2.5, 0.05 + Math.random() * 0.05); } } };
  A.setSound = on => { A.sound = on; if (snd.master) snd.master.gain.setTargetAtTime(on ? 0.5 : 0, snd.ctx.currentTime, 0.2); ui && ui.sync(); };

  /* ---------------------------------------------------------- narration (TTS) */
  const tts = (A.tts = { lastId: -1, voice: null });
  tts.pick = () => { try { const vs = speechSynthesis.getVoices(); tts.voice = vs.find(v => /ko/i.test(v.lang) && /Google|Yuna|Heami|Premium|Natural/i.test(v.name)) || vs.find(v => /ko/i.test(v.lang)) || null; } catch (e) { } };
  tts.speak = (s) => { if (!('speechSynthesis' in window)) return; try { const utt = new SpeechSynthesisUtterance(s.say || s.text); utt.lang = 'ko-KR'; if (tts.voice) utt.voice = tts.voice; utt.rate = s.who === 'o' ? 0.82 : 0.98; utt.pitch = s.who === 'o' ? 0.6 : 1; utt.volume = 1; speechSynthesis.speak(utt); } catch (e) { } };
  tts.cancel = () => { try { speechSynthesis.cancel(); } catch (e) { } };
  tts.tick = T => { if (!A.voice || !A.playing) return; const idx = A.subtitles.findIndex(s => T >= s.start && T < s.start + 0.5 && (s.who === 'n' || s.who === 'o' || !s.who)); if (idx >= 0 && idx !== tts.lastId) { tts.lastId = idx; tts.speak(A.subtitles[idx]); } };
  if ('speechSynthesis' in window) { tts.pick(); speechSynthesis.onvoiceschanged = tts.pick; }

  /* ----------------------------------------------------------------- UI */
  let ui = null;
  const CSS = `
  html,body{margin:0;height:100%;background:#000;overflow:hidden;font-family:${A.fonts.sans};color:#eee;-webkit-font-smoothing:antialiased}
  #stage{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:#000}
  #stage canvas{display:block;box-shadow:0 0 80px rgba(0,0,0,.8)}
  #poster{position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;background:radial-gradient(ellipse at center,rgba(8,12,30,.55),rgba(0,0,0,.85));transition:opacity .9s;z-index:5}
  #poster.hide{opacity:0;pointer-events:none}
  #poster h1{font-family:${A.fonts.serif};font-weight:700;font-size:min(5.2vw,64px);letter-spacing:.08em;color:#f3e3bc;text-shadow:0 0 30px rgba(230,170,60,.6),0 2px 4px #000;margin:0 0 .3em;text-align:center}
  #poster h2{font-weight:400;font-size:min(2vw,24px);color:#cfc6b2;margin:0 0 2.2em;letter-spacing:.05em;text-align:center}
  #poster .go{font-size:min(2.2vw,26px);padding:.6em 1.8em;border:1px solid rgba(243,210,122,.7);border-radius:999px;color:#f6d784;background:rgba(10,12,24,.55);letter-spacing:.15em;box-shadow:0 0 30px rgba(243,210,122,.25)}
  #poster .hint{margin-top:1.4em;font-size:14px;color:#8d8777;letter-spacing:.05em}
  #ctl{position:fixed;left:0;right:0;bottom:0;padding:10px 18px 12px;background:linear-gradient(transparent,rgba(0,0,0,.85));display:flex;flex-direction:column;gap:8px;z-index:6;transition:opacity .4s;opacity:0}
  #ctl.show{opacity:1}
  #bar{position:relative;height:8px;border-radius:4px;background:rgba(255,255,255,.18);cursor:pointer}
  #bar .fill{position:absolute;left:0;top:0;bottom:0;border-radius:4px;background:linear-gradient(90deg,#58e0d0,#f3d27a)}
  #bar .mk{position:absolute;top:-3px;width:2px;height:14px;background:rgba(255,255,255,.55)}
  #row{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
  #row button{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.18);color:#eee;border-radius:8px;padding:6px 12px;font-size:14px;cursor:pointer;font-family:inherit}
  #row button:hover{background:rgba(255,255,255,.18)}
  #row button.on{background:rgba(243,210,122,.25);border-color:#f3d27a;color:#f6e3a8}
  #row .time{font-variant-numeric:tabular-nums;font-size:14px;color:#ccc;min-width:110px}
  #row .chap{display:flex;gap:4px;flex-wrap:wrap}
  #row .chap button{padding:5px 9px;font-size:12px;color:#ddd}
  #row .sp{flex:1}
  @media (max-width:900px){#row .chap button span{display:none}}
  `;
  function buildUI() {
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    document.body.innerHTML = `
    <div id="stage"><canvas id="cv" width="${W}" height="${H}"></canvas></div>
    <div id="poster"><h1>《신탁이 남긴 수수께끼: 이차곡선의 탄생》</h1><h2>정육면체의 부피를 두 배로 만드는 문제에서 시작된 수학의 역사</h2><div class="go">▶ 재생</div><div class="hint">Space 재생/정지 · ←→ 5초 이동 · 1~7 장면 이동 · S 자막 · V 음성 해설 · M 음향 · F 전체화면</div></div>
    <div id="ctl"><div id="bar"><div class="fill"></div></div>
    <div id="row"><button id="bPlay">▶</button><span class="time">00:00 / 04:32</span><div class="chap"></div><span class="sp"></span><button id="bSub" class="on">자막</button><button id="bVoice">음성 해설</button><button id="bSnd" class="on">음향</button><button id="bFull">전체화면</button></div></div>`;
    canvas = document.getElementById('cv'); ctx = canvas.getContext('2d', { alpha: false });
    const $ = id => document.getElementById(id);
    const bar = $('bar'), fill = bar.querySelector('.fill'), chap = document.querySelector('.chap'), timeEl = document.querySelector('.time');
    A.scenes.forEach((s, i) => { const b = document.createElement('button'); b.innerHTML = `${i + 1} <span>${s.title || s.id}</span>`; b.title = s.title || s.id; b.onclick = () => { A.seek(s.start); A.play(); }; chap.appendChild(b); const mk = document.createElement('div'); mk.className = 'mk'; mk.style.left = (s.start / A.dur * 100) + '%'; bar.appendChild(mk); });
    bar.onclick = e => { const r = bar.getBoundingClientRect(); A.seek(((e.clientX - r.left) / r.width) * A.dur); };
    $('bPlay').onclick = () => A.toggle(); $('bSub').onclick = () => { A.showSubs = !A.showSubs; ui.sync(); }; $('bVoice').onclick = () => { A.voice = !A.voice; if (!A.voice) tts.cancel(); ui.sync(); }; $('bSnd').onclick = () => A.setSound(!A.sound); $('bFull').onclick = () => { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); };
    $('poster').onclick = () => A.begin();
    const fmt = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
    let hideT = 0; const ctl = $('ctl'); const show = () => { ctl.classList.add('show'); clearTimeout(hideT); hideT = setTimeout(() => { if (A.playing) ctl.classList.remove('show'); }, 2600); };
    window.addEventListener('mousemove', show); window.addEventListener('touchstart', show); window.addEventListener('click', e => { if (e.target === canvas && A.started) A.toggle(); });
    window.addEventListener('keydown', e => { if (e.target.tagName === 'BUTTON') e.target.blur(); switch (e.key) { case ' ': e.preventDefault(); A.started ? A.toggle() : A.begin(); break; case 'ArrowRight': A.seek(A.time + 5); break; case 'ArrowLeft': A.seek(A.time - 5); break; case 'f': case 'F': $('bFull').click(); break; case 's': case 'S': $('bSub').click(); break; case 'v': case 'V': $('bVoice').click(); break; case 'm': case 'M': $('bSnd').click(); break; case 'd': A.debug = !A.debug; break; default: if (/^[1-9]$/.test(e.key)) { const s = A.scenes[+e.key - 1]; if (s) { A.seek(s.start); if (!A.started) A.begin(); } } } show(); });
    const resize = () => { const r = Math.min(window.innerWidth / W, window.innerHeight / H); canvas.style.width = Math.floor(W * r) + 'px'; canvas.style.height = Math.floor(H * r) + 'px'; }; window.addEventListener('resize', resize); resize();
    ui = { sync() { $('bPlay').textContent = A.playing ? '❚❚' : '▶'; $('bSub').classList.toggle('on', A.showSubs); $('bVoice').classList.toggle('on', A.voice); $('bSnd').classList.toggle('on', A.sound); }, tick() { fill.style.width = (A.time / A.dur * 100) + '%'; timeEl.textContent = `${fmt(A.time)} / ${fmt(A.dur)}`; }, show, poster: $('poster') };
    ui.sync(); show();
  }

  /* --------------------------------------------------------------- loop */
  let last = 0, acc = 0, lastRendered = -1;
  function loop(now) {
    requestAnimationFrame(loop);
    const dt = Math.min(0.1, (now - last) / 1000 || 0); last = now;
    if (A.playing) { A.time += dt; if (A.time >= A.dur) { A.time = A.dur; A.pause(); } }
    const s = A.sceneAt(A.time); if (s) { const m = typeof s.mood === 'function' ? s.mood(A.time - s.start) : (s.mood || 'ancient'); if (m !== snd.mood) snd.setMood(m); }
    snd.tick(A.time, dt); tts.tick(A.time);
    const fidx = Math.floor(A.time * A.fps);
    if (fidx !== lastRendered || !A.playing && A._dirty) { lastRendered = fidx; A._dirty = false; renderFrame(A.time, 1 / A.fps); }
    ui && ui.tick();
  }
  A.play = () => { if (!A.started) return A.begin(); if (A.time >= A.dur) A.time = 0; A.playing = true; snd.start(); snd.setMood(snd.mood, true); ui && ui.sync(); };
  A.pause = () => { A.playing = false; tts.cancel(); ui && ui.sync(); ui && ui.show(); };
  A.toggle = () => (A.playing ? A.pause() : A.play());
  A.seek = T => { A.time = u.clamp(T, 0, A.dur); tts.cancel(); tts.lastId = -1; A._dirty = true; lastRendered = -1; };
  A.begin = () => { A.started = true; ui.poster.classList.add('hide'); snd.start(); A.playing = true; snd.setMood(snd.mood, true); ui.sync(); };
  A.boot = () => {
    buildUI(); api.ctx = ctx;
    // pre-build all scene assets, then show poster
    requestAnimationFrame(() => { A.initAll(); renderFrame(0); A.ready = true; requestAnimationFrame(loop); });
  };
  A.readyPromise = new Promise(res => { const chk = () => (A.ready ? res(true) : setTimeout(chk, 30)); chk(); });
})();
