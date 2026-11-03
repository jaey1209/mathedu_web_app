ANIM.scene({ id: 's01', title: 'plate test', start: 0, end: 40, mood: 'ancient',
  draw(api, t, S) { const { ctx: c, u, W, H } = api;
    const kb = u.kb(t, 0, 12, { zoom: 1.0, fx: 0.5, fy: 0.5 }, { zoom: 1.18, fx: 0.6, fy: 0.45 });
    u.plate(c, 'A01', kb);
    u.motes(c, t, { count: 30, seed: 2, color: '#ffe9b0', size: 3, alpha: 0.5 });
    u.grade(c, '#ffb060', 0.08);
    u.text(c, '원화 합성 테스트', W/2, 80, { size: 48, weight: 700 });
  } });
