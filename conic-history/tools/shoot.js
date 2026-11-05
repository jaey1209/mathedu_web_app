/* Screenshot / perf tool.
   node tools/shoot.js --times 0,5,10 --out shots/x          (global seconds)
   node tools/shoot.js --scene s03 --n 8 --out shots/s03      (evenly spaced in scene)
   node tools/shoot.js --scene s03 --local 2,10,30 --out shots/s03   (scene-local seconds)
   options: --file dev.html|index.html  --scale 0.5  --sheet (contact sheet)  --play 6 (perf: real-time playback N s)
            --nosubs (hide subtitles)  --debug (overlay time) */
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
const args = process.argv.slice(2); const get = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true) : d; };
const root = path.join(__dirname, '..'); const file = get('file', 'dev.html'); const out = get('out', 'shots/out'); const scale = parseFloat(get('scale', '0.5'));
fs.mkdirSync(path.join(root, out), { recursive: true });
(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: Math.round(1920 * scale), height: Math.round(1080 * scale) }, deviceScaleFactor: 1 });
  const errors = []; page.on('pageerror', e => errors.push('PAGEERROR ' + e.message)); page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type() + ': ' + m.text()); });
  await page.goto('file://' + path.join(root, file)); await page.waitForFunction(() => window.ANIM && ANIM.ready, null, { timeout: 60000 });
  const info = await page.evaluate(() => ({ scenes: ANIM.scenes.map(s => ({ id: s.id, start: s.start, end: s.end })), dur: ANIM.dur }));
  let times = [];
  if (get('times')) times = String(get('times')).split(',').map(Number);
  const sc = get('scene'); if (sc) { const s = info.scenes.find(x => x.id === sc); if (!s) { console.error('no scene', sc, info.scenes.map(x => x.id)); process.exit(1); } if (get('local')) times = String(get('local')).split(',').map(v => s.start + Number(v)); else { const n = parseInt(get('n', '6')); for (let i = 0; i < n; i++) times.push(s.start + ((i + 0.5) / n) * (s.end - s.start)); } }
  if (get('nosubs')) await page.evaluate(() => { ANIM.showSubs = false; }); if (get('debug')) await page.evaluate(() => { ANIM.debug = true; });
  await page.evaluate(() => { ANIM.started = true; document.getElementById('poster').style.display = 'none'; document.getElementById('ctl').style.display = 'none'; });
  const shots = [];
  for (const T of times) {
    const t0 = Date.now(); await page.evaluate(T => ANIM.renderAt(T), T); const ms = Date.now() - t0;
    const name = `t${T.toFixed(1).replace('.', '_')}.png`; const p = path.join(root, out, name);
    await page.locator('#cv').screenshot({ path: p }); shots.push({ T, p, ms }); console.log('shot', name, `${ms}ms render`);
  }
  if (get('sheet') && shots.length) {
    const cols = shots.length <= 4 ? 2 : 3; const w = 640, h = 360;
    const html = `<body style="margin:0;background:#111;display:grid;grid-template-columns:repeat(${cols},${w}px);gap:4px">${shots.map(s => `<div style="position:relative"><img src="data:image/png;base64,${fs.readFileSync(s.p).toString('base64')}" style="width:${w}px;height:${h}px;display:block"><div style="position:absolute;left:4px;top:4px;color:#0f0;font:14px monospace;background:rgba(0,0,0,.6);padding:2px 5px">T=${s.T.toFixed(1)}s</div></div>`).join('')}</body>`;
    const pg = await browser.newPage({ viewport: { width: cols * (w + 4), height: Math.ceil(shots.length / cols) * (h + 4) } }); await pg.setContent(html); await pg.waitForTimeout(300); const sp = path.join(root, out, 'sheet.png'); await pg.screenshot({ path: sp, fullPage: true }); console.log('sheet', sp);
  }
  const play = get('play'); if (play) { const secs = parseFloat(play); const start = parseFloat(get('from', '0')); await page.evaluate(s => { ANIM.seek(s); ANIM.stats.frames = 0; ANIM.stats.ms = 0; ANIM.play(); }, start); await page.waitForTimeout(secs * 1000); const st = await page.evaluate(() => { ANIM.pause(); return ANIM.stats; }); console.log(`perf: ${st.frames} frames in ${secs}s => ${(st.frames / secs).toFixed(1)} fps (target 24), avg render ${(st.ms / Math.max(1, st.frames)).toFixed(1)} ms/frame`); }
  if (errors.length) { console.log('--- console/page errors ---'); errors.slice(0, 30).forEach(e => console.log(e)); } else console.log('no page errors');
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
