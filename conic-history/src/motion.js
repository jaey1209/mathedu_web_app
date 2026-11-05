/* ============================================================================
   motion.js — "living plates": per-region animation of the painted plates.
   Each plate can declare motion regions in ANIM.MOTION[id] (src/motion-data.js):
     { type, poly:[[x,y],...] (image fractions 0..1), amp (px at 1920 ref),
       freq (Hz), phase, hold (fps for held/limited animation, 0 = smooth),
       pivot:[x,y] (rotate), feather (fraction of width), dir:[x,y], k, wave }
   Regions are rasterised once into two small textures (index, weight); a
   WebGL2 fragment shader displaces / relights the plate per region every
   frame. u.plate() transparently draws the animated result instead of the
   still image. Falls back to the still image when WebGL2 is unavailable.
   Types: water, flow (smoke/steam), sway (foliage/cloth/hair, pinned at
   bottom), drift (clouds), breathe (chest/shoulders, pinned at bottom),
   bob (whole body up/down), walk (legs shear + body bob), rotate (limb about
   a pivot), flicker (fire/lamp light), shimmer (light shaft / glints).
   ========================================================================== */
(function () {
  'use strict';
  const A = window.ANIM, u = A.u;
  A.MOTION = A.MOTION || {};
  const TYPES = { none: 0, water: 1, flow: 2, sway: 3, drift: 4, breathe: 5, bob: 6, walk: 7, rotate: 8, flicker: 9, shimmer: 10 };
  const MAXR = 24, RW = 480; // regions per plate, region texture width
  const M = (A.motionGL = { ok: false, gl: null, canvas: null, cache: {}, disabled: false, scale: 1 });

  const VS = `#version 300 es
in vec2 aPos; out vec2 vUv;
void main(){ vUv = vec2(aPos.x*0.5+0.5, 0.5-aPos.y*0.5); gl_Position = vec4(aPos,0.,1.); }`;
  const FS = `#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform sampler2D uImg, uIdx, uW;
uniform float uT; uniform vec2 uRes; // plate pixel size
uniform float uType[${MAXR}];
uniform vec4 uA[${MAXR}];   // amp(px@1920), freq, phase, hold
uniform vec4 uB[${MAXR}];   // pivotX, pivotY, top, bottom (uv)
uniform vec4 uC[${MAXR}];   // dirX, dirY, k, wave
float h21(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
float vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h21(i),h21(i+vec2(1,0)),f.x), mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x), f.y); }
float fbm(vec2 p){ float v=0., a=.5; for(int i=0;i<4;i++){ v+=a*vn(p); p=p*2.03+17.1; a*=.5; } return v; }
const float TAU = 6.2831853;
float wave(float ph, float w){ // w: 0 sine, 1 strike (slow raise, fast hit), 2 step (held two-pose)
  if (w < 0.5) return sin(ph);
  if (w < 1.5) { float x = fract(ph/TAU); return x < 0.78 ? -cos(x/0.78*3.14159)*1.0 : mix(1.0,-1.0, (x-0.78)/0.22*1.0); }
  return sin(ph) > 0. ? 1. : -1.;
}
void main(){
  vec2 uv = vUv;
  float idx = floor(texture(uIdx, uv).r*255.+.5);
  float w = texture(uW, uv).r;
  vec2 px = vec2(1.0/1920.0, 1.0/1080.0); // reference pixel in uv
  vec2 d = vec2(0.); float bright = 1.; vec3 add = vec3(0.);
  if (idx > 0.5 && w > 0.001) {
    int i = int(idx) - 1;
    float ty = uType[i]; vec4 a = uA[i]; vec4 b = uB[i]; vec4 c = uC[i];
    float amp = a.x, fr = a.y, ph0 = a.z, hold = a.w;
    float t = hold > 0. ? floor(uT*hold)/hold : uT;
    float ph = t*fr*TAU + ph0;
    float den = b.w - b.z; den = abs(den) < 1e-4 ? 1e-4 : den;
    float h = clamp((b.w - uv.y)/den, 0., 1.); // 0 at the pinned edge (bottom, or top when pinned top), 1 at the free edge
    float hd = 1. - h;                                            // 0 at top, 1 at bottom
    if (ty < 1.5) {        // water
      float n1 = vn(vec2(uv.x*14., uv.y*70.) + vec2(t*fr*0.9, t*0.05));
      float n2 = vn(vec2(uv.x*30., uv.y*120.) - vec2(t*fr*1.3, 0.));
      d = vec2((n1-.5)*2.*amp, (n2-.5)*0.7*amp) * px;
      bright = 1. + 0.05*(n2-.5)*c.z;
    } else if (ty < 2.5) { // flow: rising smoke / steam
      float k = c.z > 0. ? c.z : 6.;
      vec2 q = vec2(uv.x*k*1.7, uv.y*k + t*fr);
      float n1 = fbm(q), n2 = fbm(q + vec2(5.2, 1.3));
      d = vec2((n1-.5)*2.*amp, (n2-.5)*2.*amp*0.6 - amp*0.25) * px;
      bright = 1. + 0.06*(n1-.5);
    } else if (ty < 3.5) { // sway: pinned at bottom
      float g = sin(ph + uv.y*c.z) + 0.35*sin(ph*2.3 + uv.x*9.) ;
      float flutter = (vn(uv*vec2(60., 60.) + t*fr*3.) - .5) * 0.6;
      d = vec2((g + flutter) * amp * h*h, 0.12*amp*h*h*sin(ph*1.7)) * px;
    } else if (ty < 4.5) { // drift: clouds
      float n = fbm(uv*vec2(3., 5.) + vec2(t*0.04*fr, 0.));
      d = vec2(amp*sin(ph) + (n-.5)*amp*0.8, (n-.5)*amp*0.25) * px;
    } else if (ty < 5.5) { // breathe: chest rises, pinned at bottom
      float s = 0.5 + 0.5*sin(ph);
      d = vec2(0., amp * s * h) * px;   // sample from below -> content rises
    } else if (ty < 6.5) { // bob: whole body
      d = vec2(0., amp * wave(ph, c.w)) * px;
    } else if (ty < 7.5) { // walk: lower legs shear alternately + bob
      float st = wave(ph, c.w);
      d = vec2(amp * st * hd*hd, -abs(sin(ph))*amp*0.35) * px;
    } else if (ty < 8.5) { // rotate about pivot (aspect-correct)
      float ang = radians(amp) * wave(ph, c.w);
      vec2 asp = vec2(uRes.x/uRes.y, 1.);
      vec2 p = (uv - b.xy) * asp;
      float cs = cos(-ang), sn = sin(-ang);
      vec2 r = vec2(cs*p.x - sn*p.y, sn*p.x + cs*p.y) / asp + b.xy;
      d = uv - r; // full rotation inside, feathered outside
    } else if (ty < 9.5) { // flicker
      float n = vn(vec2(t*fr*2., ph0)) * 0.6 + vn(vec2(t*fr*5.3, ph0+3.)) * 0.4;
      bright = 1. + amp*0.01*(n-.45)*2.;
      d = vec2((vn(uv*40.+t*fr*4.)-.5)*1.2, -abs(vn(uv*30.-t*fr*5.)-.5)*2.) * px;
    } else {               // shimmer: light shaft / glints
      float along = dot(uv, normalize(c.xy+1e-4));
      float n = fbm(vec2(along*c.z, t*fr*0.5)) ;
      bright = 1. + amp*0.01*(n-.5)*2.;
    }
  }
  vec4 col = texture(uImg, uv - d*w);
  col.rgb *= mix(1., bright, w);
  o = vec4(col.rgb, 1.);
}`;

  function init() {
    if (M.ok || M.disabled) return M.ok;
    try {
      const cv = document.createElement('canvas'); cv.width = 16; cv.height = 16;
      const gl = cv.getContext('webgl2', { premultipliedAlpha: false, preserveDrawingBuffer: true, antialias: false });
      if (!gl) { M.disabled = true; return false; }
      const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
      const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr);
      if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr));
      gl.useProgram(pr);
      const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(pr, 'aPos'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      const U = n => gl.getUniformLocation(pr, n);
      M.u = { img: U('uImg'), idx: U('uIdx'), w: U('uW'), t: U('uT'), res: U('uRes'), type: U('uType'), a: U('uA'), b: U('uB'), c: U('uC') };
      gl.uniform1i(M.u.img, 0); gl.uniform1i(M.u.idx, 1); gl.uniform1i(M.u.w, 2);
      M.gl = gl; M.canvas = cv; M.ok = true;
    } catch (e) { console.warn('motion GL unavailable', e); M.disabled = true; M.ok = false; }
    return M.ok;
  }

  // signed distance from point to polygon (positive inside), coords in px
  function sdPoly(px, py, P) {
    let dmin = 1e9, inside = false;
    for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
      const xi = P[i][0], yi = P[i][1], xj = P[j][0], yj = P[j][1];
      if (((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) inside = !inside;
      const ex = xj - xi, ey = yj - yi, L2 = ex * ex + ey * ey || 1; let tt = ((px - xi) * ex + (py - yi) * ey) / L2; tt = tt < 0 ? 0 : tt > 1 ? 1 : tt;
      const dx = px - (xi + ex * tt), dy = py - (yi + ey * tt); const dd = dx * dx + dy * dy; if (dd < dmin) dmin = dd;
    }
    const d = Math.sqrt(dmin); return inside ? d : -d;
  }

  function tex(gl, src, filter, fmt) {
    const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    if (fmt === 'r8') gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, src.w, src.h, 0, gl.RED, gl.UNSIGNED_BYTE, src.data);
    else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  }

  function build(id) {
    const regs = A.MOTION[id], im = A.img[id]; if (!regs || !regs.length || !im || !im.width) return null;
    const gl = M.gl; const rw = RW, rh = Math.round(RW * im.height / im.width);
    const idx = new Uint8Array(rw * rh), wt = new Uint8Array(rw * rh);
    const R = regs.slice(0, MAXR).map(r => ({ ...r, P: r.poly.map(p => [p[0] * rw, p[1] * rh]), f: (r.feather ?? 0.018) * rw }));
    R.forEach((r, i) => { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; r.P.forEach(p => { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); }); r.bb = [Math.max(0, Math.floor(x0 - r.f)), Math.max(0, Math.floor(y0 - r.f)), Math.min(rw - 1, Math.ceil(x1 + r.f)), Math.min(rh - 1, Math.ceil(y1 + r.f))]; r.top = y0 / rh; r.bottom = y1 / rh; });
    R.forEach((r, i) => { const [x0, y0, x1, y1] = r.bb; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const sd = sdPoly(x + 0.5, y + 0.5, r.P); if (sd < -r.f) continue; const ww = u.smooth(-r.f, r.f, sd); const k = y * rw + x; if (ww * 255 >= wt[k] || idx[k] === 0) { idx[k] = i + 1; wt[k] = Math.round(ww * 255); } } });
    const types = new Float32Array(MAXR), a = new Float32Array(MAXR * 4), b = new Float32Array(MAXR * 4), c = new Float32Array(MAXR * 4);
    R.forEach((r, i) => {
      types[i] = TYPES[r.type] ?? 0;
      a.set([r.amp ?? 3, r.freq ?? 0.5, r.phase ?? i * 1.7, r.hold ?? (['bob', 'walk', 'rotate', 'breathe'].includes(r.type) ? 12 : 0)], i * 4);
      const pv = r.pivot || [(r.P[0][0]) / rw, r.bottom];
      b.set(r.pin === 'top' ? [pv[0], pv[1], r.bottom, r.top] : [pv[0], pv[1], r.top, r.bottom], i * 4);
      const wv = { sine: 0, strike: 1, step: 2 }[r.wave || 'sine'];
      c.set([(r.dir || [0, 1])[0], (r.dir || [0, 1])[1], r.k ?? (r.type === 'sway' ? 4 : r.type === 'water' ? 1 : 6), wv], i * 4);
    });
    return { img: tex(gl, im, gl.LINEAR), idx: tex(gl, { w: rw, h: rh, data: idx }, gl.NEAREST, 'r8'), w: tex(gl, { w: rw, h: rh, data: wt }, gl.LINEAR, 'r8'), types, a, b, c, n: R.length, iw: im.width, ih: im.height };
  }

  // returns a canvas with the animated plate for time T (global seconds), or null
  A.livePlate = (id, T) => {
    if (!A.MOTION[id] || !init()) return null;
    let e = M.cache[id]; if (e === undefined) { try { e = M.cache[id] = build(id); } catch (err) { console.warn('motion build failed', id, err); e = M.cache[id] = null; } }
    if (!e) return null;
    const gl = M.gl, cv = M.canvas;
    if (M.disabled) return null;
    const cw = Math.max(64, Math.round(e.iw * M.scale)), ch = Math.max(36, Math.round(e.ih * M.scale));
    if (cv.width !== cw || cv.height !== ch) { cv.width = cw; cv.height = ch; }
    gl.viewport(0, 0, cv.width, cv.height);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, e.img);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, e.idx);
    gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, e.w);
    gl.uniform1f(M.u.t, T); gl.uniform2f(M.u.res, e.iw, e.ih);
    gl.uniform1fv(M.u.type, e.types); gl.uniform4fv(M.u.a, e.a); gl.uniform4fv(M.u.b, e.b); gl.uniform4fv(M.u.c, e.c);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    A.motionUsed();
    return cv;
  };
  // adaptive quality: called by the player loop with real frame intervals while playing
  let acc = 0, cnt = 0, used = false;
  A.motionUsed = () => { used = true; };
  A.motionPerf = dt => {
    if (!M.ok || M.disabled || !used) return; used = false; acc += dt; cnt++;
    if (cnt < 24) return; const avg = acc / cnt; acc = 0; cnt = 0;
    if (avg > 1 / 12) { if (M.scale > 0.5) { M.scale = 0.5; console.info('living plates: half resolution'); } else { M.disabled = true; console.info('living plates: disabled (slow device)'); } }
  };
  A.motionReset = id => { const e = M.cache[id]; if (e && M.gl) { [e.img, e.idx, e.w].forEach(t => M.gl.deleteTexture(t)); } delete M.cache[id]; };
})();
