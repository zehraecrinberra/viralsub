import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function request(method, reqPath, payload, isMultipart, body) {
  return new Promise((resolve, reject) => {
    let reqBody, headers;
    if (isMultipart) {
      reqBody = body;
      headers = { 'Content-Type': `multipart/form-data; boundary=ExportTestBoundary`, 'Content-Length': body.length };
    } else {
      reqBody = JSON.stringify(payload);
      headers = { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(reqBody) };
    }
    const req = http.request(
      { hostname: 'localhost', port: 5000, path: reqPath, method, headers },
      (res) => {
        let data = '';
        res.on('data', d => data += d);
        res.on('end', () => {
          try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
          catch { resolve({ status: res.statusCode, body: data }); }
        });
      }
    );
    req.on('error', reject);
    req.write(reqBody);
    req.end();
  });
}

// ── Step 1: Upload ──────────────────────────────────────────────────────────
console.log('=== Step 1: Upload test video ===');
const videoPath = path.join(__dirname, 'test-real.mp4');
if (!fs.existsSync(videoPath)) {
  console.error('❌ test-real.mp4 not found.'); process.exit(1);
}
const fileContent = fs.readFileSync(videoPath);
const head = Buffer.from(`--ExportTestBoundary\r\nContent-Disposition: form-data; name="video"; filename="test-real.mp4"\r\nContent-Type: video/mp4\r\n\r\n`);
const tail = Buffer.from(`\r\n--ExportTestBoundary--\r\n`);
const uploadBody = Buffer.concat([head, fileContent, tail]);

const uploadRes = await request('POST', '/api/video/upload', null, true, uploadBody);
if (uploadRes.status !== 200) { console.error('❌ Upload failed:', uploadRes.body); process.exit(1); }
const { filename, duration, width, height } = uploadRes.body;
console.log(`✅ Uploaded: ${filename} (${duration}s, ${width}x${height})\n`);

// ── Step 2: Render variants ─────────────────────────────────────────────────
const subtitles = [
  { start: 0,   end: 2.5, text: 'This is the first subtitle line.' },
  { start: 2.5, end: 5.0, text: 'Second line looks amazing!' },
];

const VARIANTS = [
  { label: 'Free plan  · TikTok style',   plan: 'free',    style: 'tiktok',  hook: 'Nobody will tell you this...' },
  { label: 'Free plan  · Bold style',     plan: 'free',    style: 'bold',    hook: 'This changed everything...'   },
  { label: 'Premium    · Minimal style',  plan: 'premium', style: 'minimal', hook: 'Before you watch this...'     },
];

console.log('=== Step 2: Render export variants ===');

for (const v of VARIANTS) {
  process.stdout.write(`  Rendering "${v.label}" ... `);
  const t0 = Date.now();

  const res = await request('POST', '/api/export/render', {
    filename, subtitles, hook: v.hook, style: v.style, plan: v.plan
  });

  const elapsed = ((Date.now() - t0) / 1000).toFixed(2);

  if (res.status === 200) {
    const { outputId, downloadUrl, watermark, quality } = res.body;
    const outPath = path.join(__dirname, 'backend', 'outputs', `${outputId}.mp4`);
    const fileSize = fs.existsSync(outPath) ? `${(fs.statSync(outPath).size / 1024).toFixed(1)} KB` : 'file not found';

    console.log(`✅  ${elapsed}s`);
    console.log(`       Quality    : ${quality}`);
    console.log(`       Watermark  : ${watermark ? 'yes' : 'no'}`);
    console.log(`       File size  : ${fileSize}`);
    console.log(`       URL        : ${downloadUrl}`);
  } else {
    console.log(`❌  HTTP ${res.status}`);
    console.log(`       Error: ${res.body?.error || res.body}`);
  }
  console.log();
}

console.log('='.repeat(60));
console.log('Export pipeline test complete.');
