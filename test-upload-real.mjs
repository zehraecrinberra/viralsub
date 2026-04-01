import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testVideoPath = path.join(__dirname, 'test-real.mp4');

const boundary = 'ViralSubRealTest';
const fileContent = fs.readFileSync(testVideoPath);

const head = Buffer.from(
  `--${boundary}\r\n` +
  `Content-Disposition: form-data; name="video"; filename="test-real.mp4"\r\n` +
  `Content-Type: video/mp4\r\n\r\n`
);
const tail = Buffer.from(`\r\n--${boundary}--\r\n`);
const body = Buffer.concat([head, fileContent, tail]);

console.log('\n=== Testing POST /api/video/upload (real MP4) ===');
console.log(`File: test-real.mp4 (${(fileContent.length / 1024).toFixed(1)} KB)`);

const req = http.request({
  hostname: 'localhost', port: 5000,
  path: '/api/video/upload', method: 'POST',
  headers: {
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
    'Content-Length': body.length
  }
}, (res) => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => {
    console.log(`\nHTTP Status: ${res.statusCode}`);
    try {
      const json = JSON.parse(data);
      console.log('Response:', JSON.stringify(json, null, 2));

      if (res.statusCode === 200) {
        const ffOk = json.ffprobeAvailable;
        console.log('\n✅ UPLOAD SUCCESS');
        console.log(`   Video ID        : ${json.id}`);
        console.log(`   Size            : ${(json.size / 1024).toFixed(1)} KB`);
        console.log(`   Duration        : ${json.duration !== null ? json.duration.toFixed(2) + 's' : 'N/A'}`);
        console.log(`   Resolution      : ${json.width}x${json.height}`);
        console.log(`   FFprobe working : ${ffOk ? '✅ YES' : '⚠️  NO (install FFmpeg)'}`);
      } else {
        console.log('\n❌ FAILED:', json.error);
      }
    } catch { console.log(data); }
  });
});

req.on('error', e => console.error('\n❌ Connection error:', e.message));
req.write(body);
req.end();
