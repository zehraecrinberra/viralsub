import http from 'http';

function post(path, payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const req = http.request({
      hostname: 'localhost', port: 5000,
      path, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(data) }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// Step 1: Upload the real test video first, get its filename
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const videoPath = path.join(__dirname, 'test-real.mp4');

if (!fs.existsSync(videoPath)) {
  console.error('❌ test-real.mp4 not found. Run test-upload-real.mjs first.');
  process.exit(1);
}

const boundary = 'TranscribeTestBoundary';
const fileContent = fs.readFileSync(videoPath);
const head = Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="video"; filename="test-real.mp4"\r\nContent-Type: video/mp4\r\n\r\n`);
const tail = Buffer.from(`\r\n--${boundary}--\r\n`);
const uploadBody = Buffer.concat([head, fileContent, tail]);

console.log('=== Step 1: Upload video ===');
const uploadRes = await new Promise((resolve, reject) => {
  const req = http.request({
    hostname: 'localhost', port: 5000,
    path: '/api/video/upload', method: 'POST',
    headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}`, 'Content-Length': uploadBody.length }
  }, (res) => {
    let d = ''; res.on('data', c => d += c);
    res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(d) }));
  });
  req.on('error', reject);
  req.write(uploadBody); req.end();
});

if (uploadRes.status !== 200) {
  console.error('❌ Upload failed:', uploadRes.body);
  process.exit(1);
}
const { filename, duration } = uploadRes.body;
console.log(`✅ Uploaded: ${filename} (${duration}s)\n`);

// Step 2: Transcribe
console.log('=== Step 2: Transcribe audio ===');
console.log('Calling POST /api/process/transcribe ...\n');
const t0 = Date.now();
const res = await post('/api/process/transcribe', { filename });
const elapsed = ((Date.now() - t0) / 1000).toFixed(2);

console.log(`HTTP Status : ${res.status}`);
console.log(`Time taken  : ${elapsed}s`);

if (res.status === 200) {
  const { transcription } = res.body;
  console.log('\n✅ TRANSCRIPTION SUCCESS');
  console.log(`   Text     : "${transcription.text}"`);
  if (transcription.segments?.length) {
    console.log(`   Segments : ${transcription.segments.length}`);
    transcription.segments.forEach((s, i) =>
      console.log(`     [${i}] ${s.start.toFixed(1)}s → ${s.end.toFixed(1)}s : "${s.text}"`)
    );
  }
  const isMock = transcription.text.includes('mock');
  console.log(`\n   Mode     : ${isMock ? '⚠️  MOCK (add OPENAI_API_KEY for real Whisper)' : '🎙️  REAL Whisper API'}`);
} else {
  console.log('\n❌ TRANSCRIPTION FAILED');
  console.log('   Error:', res.body.error);
}
