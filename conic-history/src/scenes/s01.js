// temporary engine smoke test scene (deleted later)
ANIM.scene({ id: 's01', title: 'smoke', start: 0, end: 40, mood: 'math',
  init(api, S) { const { u, W, H } = api; S.bg = u.layer(W, H, c => { c.fillStyle = u.grad(c, 0, 0, 0, H, [[0, '#0b1230'], [1, '#1b2a55']]); c.fillRect(0, 0, W, H); for (let i = 0; i < 40; i++) u.brush(c, Math.random() * W, Math.random() * H, Math.random() * W, Math.random() * H, { w: 120, color: '#24396b', alpha: 0.15, seed: i }); u.paper(c, 0.25); }); },
  draw(api, t, S) { const { ctx: c, u, W, H } = api; c.drawImage(S.bg, 0, 0);
    const P = u.camera({ yaw: 0.5 + t * 0.2, pitch: 0.35, dist: 9, fov: 1000, cx: 600, cy: 560 });
    u.cube(c, P, { origin: [-1, -1, -1], size: 2, color: '#58e0d0', edge: '#9ff5ea', seed: api.boil });
    const Q = u.camera({ yaw: 0.9 + t * 0.15, pitch: 0.3, dist: 10, fov: 1000, cx: 1350, cy: 520 });
    const alpha = Math.PI / 6, h = 3; const co = u.coneOutline(Q, alpha, h, [0, 1.5, 0]);
    c.save(); c.globalAlpha = 0.25; c.fillStyle = '#58e0d0'; u.polyPath(c, co.outline, true); c.fill(); c.restore();
    u.ink(c, co.outline, { w: 3, color: '#bffbf3', jitter: 1, seed: api.boil, closed: false });
    u.ink(c, co.ring, { w: 2, color: '#bffbf3', jitter: 1, seed: api.boil + 3, alpha: 0.5, closed: true });
    const plane = { p: [0, 0, 0], nrm: [Math.sin(0.4), Math.cos(0.4), 0] }; const br = u.coneSection({ alpha, h, plane, apex: [0, 1.5, 0] });
    br.forEach((b, i) => u.glowLine(c, Q.pts(b), { color: '#f3d27a', w: 4, seed: api.boil + i }));
    u.ink(c, [{ x: 200, y: 900 }, { x: 600, y: 850 }, { x: 900, y: 950 }], { w: 6, color: '#f6f1e6', seed: api.boil });
    u.wash(c, u.circlePts(1500, 900, 80), '#c0392b', { seed: 4 });
    u.text(c, '엔진 테스트 — 한글 자막 렌더링', W / 2, 80, { size: 48, weight: 700 });
    u.math(c, 'x³ = 2a³  →  x = ∛2 × a', W / 2, 160, { size: 56, glow: 20 });
    u.text(c, u.conicType(alpha, plane.nrm), W / 2, 230, { size: 30, color: '#9ff5ea' });
  }
});
