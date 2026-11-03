// Inline every source file into one standalone index.html
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const files = ['src/engine.js', 'src/script.js', 'src/plates.js', 'src/paint.js', ...fs.readdirSync(path.join(root, 'src/scenes')).filter(f => f.endsWith('.js')).sort().map(f => 'src/scenes/' + f)];
let js = '';
for (const f of files) { const p = path.join(root, f); if (!fs.existsSync(p)) { console.warn('skip missing', f); continue; } js += `\n/* ===== ${f} ===== */\n` + fs.readFileSync(p, 'utf8').replace(/<\/script/gi, '<\\/script') + '\n'; }
const html = `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>신탁이 남긴 수수께끼: 이차곡선의 탄생</title>
<meta name="description" content="델로스의 신탁과 정육면체 배적문제에서 메나이크모스의 원뿔곡선까지 — 고등학교 기하 수업용 수학사 애니메이션 (단일 HTML)">
</head><body>
<script>${js}
ANIM.boot();
</script></body></html>`;
fs.writeFileSync(path.join(root, 'index.html'), html);
console.log('built index.html', (html.length / 1024).toFixed(0) + ' KB', 'from', files.length, 'files');
