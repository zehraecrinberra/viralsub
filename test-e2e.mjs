import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── helpers ────────────────────────────────────────────────────────────────
function postJSON(reqPath, payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const req = http.request({
      hostname: 'localhost', port: 5000, path: reqPath, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, (res) => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { resolve({ status: res.statusCode, body: JSON.parse(d) }); } catch { resolve({ status: res.statusCode, body: d }); } });
    });
    req.on('error', reject); req.write(body); req.end();
  });
}

function uploadVideo(filePath) {
  const boundary = 'E2EBoundary';
  const file = fs.readFileSync(filePath);
  const head = Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="video"; filename="${path.basename(filePath)}"\r\nContent-Type: video/mp4\r\n\r\n`);
  const tail = Buffer.from(`\r\n--${boundary}--\r\n`);
  const body = Buffer.concat([head, file, tail]);
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost', port: 5000, path: '/api/video/upload', method: 'POST',
      headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}`, 'Content-Length': body.length }
    }, (res) => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(d) }));
    });
    req.on('error', reject); req.write(body); req.end();
  });
}

function step(label) {
  process.stdout.write(`\n${'─'.repeat(55)}\n  STEP: ${label}\n${'─'.repeat(55)}\n`);
}

function ok(msg) { console.log(`  ✅  ${msg}`); }
function fail(msg) { console.log(`  ❌  ${msg}`); process.exit(1); }
function info(msg) { console.log(`  ℹ   ${msg}`); }

// ── timing helper ──────────────────────────────────────────────────────────
const timings = {};
function start(k) { timings[k] = Date.now(); }
function end(k) { return ((Date.now() - timings[k]) / 1000).toFixed(2) + 's'; }

// ══════════════════════════════════════════════════════════════════════════
console.log('\n╔══════════════════════════════════════════════════════╗');
console.log('║     ViralSub — Full End-to-End Workflow Test         ║');
console.log('╚══════════════════════════════════════════════════════╝');

// ── 1. Health check ────────────────────────────────────────────────────────
step('1 / 6  Health Check');
start('health');
const health = await new Promise((resolve, reject) => {
  http.get('http://localhost:5000/health', (res) => {
    let d = ''; res.on('data', c => d += c); res.on('end', () => resolve(JSON.parse(d)));
  }).on('error', reject);
});
if (health.status !== 'ok') fail('Backend not reachable');
ok(`Backend online  (${end('health')})`);
info(`Timestamp: ${health.timestamp}`);

// ── 2. Upload ──────────────────────────────────────────────────────────────
step('2 / 6  Video Upload');
const videoPath = path.join(__dirname, 'test-real.mp4');
if (!fs.existsSync(videoPath)) fail('test-real.mp4 not found');

start('upload');
const uploadRes = await uploadVideo(videoPath);
if (uploadRes.status !== 200) fail(`Upload failed: ${JSON.stringify(uploadRes.body)}`);
const { filename, duration, width, height, ffprobeAvailable } = uploadRes.body;
ok(`Uploaded in ${end('upload')}`);
info(`Filename  : ${filename}`);
info(`Duration  : ${duration ?? 'N/A (ffprobe unavailable)'}s`);
info(`Resolution: ${width}x${height}`);
info(`FFprobe   : ${ffprobeAvailable ? 'active' : 'skipped'}`);

// ── 3. Transcribe ──────────────────────────────────────────────────────────
step('3 / 6  Transcription  (Whisper)');
start('transcribe');
const txRes = await postJSON('/api/process/transcribe', { filename });
if (txRes.status !== 200) fail(`Transcription failed: ${txRes.body.error}`);
const { transcription } = txRes.body;
ok(`Transcribed in ${end('transcribe')}`);
info(`Text     : "${transcription.text}"`);
info(`Segments : ${transcription.segments?.length ?? 0}`);
transcription.segments?.forEach((s, i) =>
  info(`  [${i}] ${s.start.toFixed(1)}s→${s.end.toFixed(1)}s  "${s.text}"`)
);

// ── 4. Translate ───────────────────────────────────────────────────────────
step('4 / 6  Translation  (GPT)');
start('translate');
const trRes = await postJSON('/api/process/translate', {
  text: transcription.text, languages: ['en', 'es', 'ar']
});
if (trRes.status !== 200) fail(`Translation failed: ${trRes.body.error}`);
const { translations } = trRes.body;
ok(`Translated in ${end('translate')}`);
const langNames = { en: '🇺🇸 EN', es: '🇪🇸 ES', ar: '🇸🇦 AR' };
for (const [code, text] of Object.entries(translations))
  info(`${langNames[code] ?? code} : "${text.slice(0, 80)}${text.length > 80 ? '…' : ''}"`);

// ── 5. Generate Hooks ──────────────────────────────────────────────────────
step('5 / 6  Viral Hook Generation  (GPT)');
start('hooks');
const hkRes = await postJSON('/api/process/hooks', {
  text: transcription.text, language: 'en'
});
if (hkRes.status !== 200) fail(`Hook generation failed: ${hkRes.body.error}`);
const { hooks } = hkRes.body;
if (!Array.isArray(hooks) || hooks.length !== 3) fail(`Expected 3 hooks, got ${hooks?.length}`);
ok(`Generated ${hooks.length} hooks in ${end('hooks')}`);
hooks.forEach((h, i) => info(`  [${i + 1}] ${h}`));
const selectedHook = hooks[0];
info(`Selected  : "${selectedHook}"`);

// ── 6. Export / Render ─────────────────────────────────────────────────────
step('6 / 6  Export & Render  (FFmpeg)');

// Build subtitle segments from transcription
const subtitles = transcription.segments?.map(s => ({
  start: s.start, end: s.end, text: translations['en'] ?? s.text
})) ?? [{ start: 0, end: 5, text: transcription.text }];

// Render FREE variant
info('Rendering FREE plan (720p + watermark + TikTok style)…');
start('render_free');
const freeRes = await postJSON('/api/export/render', {
  filename, subtitles, hook: selectedHook, style: 'tiktok', plan: 'free'
});
if (freeRes.status !== 200) fail(`Free render failed: ${freeRes.body.error}`);
const freePath = path.join(__dirname, 'backend', 'outputs', `${freeRes.body.outputId}.mp4`);
const freeSize = fs.existsSync(freePath) ? `${(fs.statSync(freePath).size / 1024).toFixed(1)} KB` : '?';
ok(`Free render done in ${end('render_free')}`);
info(`Quality   : ${freeRes.body.quality}`);
info(`Watermark : ${freeRes.body.watermark ? 'yes' : 'no'}`);
info(`File size : ${freeSize}`);
info(`URL       : http://localhost:5000${freeRes.body.downloadUrl}`);

// Render PREMIUM variant
info('');
info('Rendering PREMIUM plan (1080p HD + no watermark + minimal style)…');
start('render_premium');
const premRes = await postJSON('/api/export/render', {
  filename, subtitles, hook: selectedHook, style: 'minimal', plan: 'premium'
});
if (premRes.status !== 200) fail(`Premium render failed: ${premRes.body.error}`);
const premPath = path.join(__dirname, 'backend', 'outputs', `${premRes.body.outputId}.mp4`);
const premSize = fs.existsSync(premPath) ? `${(fs.statSync(premPath).size / 1024).toFixed(1)} KB` : '?';
ok(`Premium render done in ${end('render_premium')}`);
info(`Quality   : ${premRes.body.quality}`);
info(`Watermark : ${premRes.body.watermark ? 'yes' : 'no'}`);
info(`File size : ${premSize}`);
info(`URL       : http://localhost:5000${premRes.body.downloadUrl}`);

// ── Summary ────────────────────────────────────────────────────────────────
const total = (
  parseFloat(end('upload')) +
  parseFloat(end('transcribe')) +
  parseFloat(end('translate')) +
  parseFloat(end('hooks')) +
  parseFloat(end('render_free')) +
  parseFloat(end('render_premium'))
).toFixed(2);

console.log('\n╔══════════════════════════════════════════════════════╗');
console.log('║                   FINAL SUMMARY                     ║');
console.log('╠══════════════════════════════════════════════════════╣');
console.log(`║  Upload          ${end('upload').padStart(8)}                           ║`);
console.log(`║  Transcription   ${end('transcribe').padStart(8)}                           ║`);
console.log(`║  Translation     ${end('translate').padStart(8)}                           ║`);
console.log(`║  Hook generation ${end('hooks').padStart(8)}                           ║`);
console.log(`║  Render (free)   ${end('render_free').padStart(8)}                           ║`);
console.log(`║  Render (prem)   ${end('render_premium').padStart(8)}                           ║`);
console.log('╠══════════════════════════════════════════════════════╣');
console.log(`║  TOTAL           ${(total + 's').padStart(8)}                           ║`);
console.log('╠══════════════════════════════════════════════════════╣');
console.log('║  ✅  All 6 steps passed — pipeline fully operational  ║');
console.log('╚══════════════════════════════════════════════════════╝\n');
