/* Render segments of the film to an mp4 for review.
   node tools/video.js --file index.html --segs "2-5,11-14" --fps 24 --w 960 --out shots/preview.mp4 */
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path'); const { execSync } = require('child_process');
const args = process.argv.slice(2); const get = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const root = path.join(__dirname, '..'); const file = get('file', 'index.html'), fps = +get('fps', '24'), W = +get('w', '960'), out = path.join(root, get('out', 'shots/preview.mp4'));
const segs = get('segs', '0-5').split(',').map(s => s.split('-').map(Number));
const tmp = path.join(root, 'shots', '_frames'); fs.rmSync(tmp, { recursive: true, force: true }); fs.mkdirSync(tmp, { recursive: true });
(async () => {
  const b = await chromium.launch({ args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: W, height: Math.round(W * 9 / 16) } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.join(root, file)); await p.waitForFunction(() => ANIM.ready, null, { timeout: 90000 });
  await p.evaluate(() => { ANIM.started = true; document.getElementById('poster').style.display = 'none'; document.getElementById('ctl').style.display = 'none'; });
  let n = 0;
  for (const [a, z] of segs) for (let T = a; T < z; T += 1 / fps) { await p.evaluate(T => ANIM.renderAt(T), T); await p.locator('#cv').screenshot({ path: path.join(tmp, `f${String(n++).padStart(5, '0')}.png`) }); }
  await b.close();
  execSync(`ffmpeg -y -loglevel error -framerate ${fps} -i ${tmp}/f%05d.png -c:v libx264 -pix_fmt yuv420p -crf 22 -preset veryfast ${out}`);
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log('wrote', out, n, 'frames', (fs.statSync(out).size / 1e6).toFixed(1) + ' MB', errs.length ? errs.slice(0, 3) : 'no page errors');
})().catch(e => { console.error(e); process.exit(1); });
