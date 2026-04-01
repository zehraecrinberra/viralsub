import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Create a small valid-ish test video file if it doesn't exist
const testVideoPath = path.join(__dirname, 'test-video.mp4');
if (!fs.existsSync(testVideoPath)) {
  // ftyp + mdat minimal MP4 structure
  const ftyp = Buffer.from([
    0x00,0x00,0x00,0x18, 0x66,0x74,0x79,0x70,
    0x6D,0x70,0x34,0x32, 0x00,0x00,0x00,0x00,
    0x6D,0x70,0x34,0x32, 0x69,0x73,0x6F,0x6D
  ]);
  const mdat = Buffer.from([0x00,0x00,0x00,0x08, 0x6D,0x64,0x61,0x74]);
  fs.writeFileSync(testVideoPath, Buffer.concat([ftyp, mdat]));
  console.log('Created test-video.mp4 (' + fs.statSync(testVideoPath).size + ' bytes)');
}

const boundary = 'ViralSubTestBoundary';
const fileContent = fs.readFileSync(testVideoPath);

const head = Buffer.from(
  `--${boundary}\r\n` +
  `Content-Disposition: form-data; name="video"; filename="test-video.mp4"\r\n` +
  `Content-Type: video/mp4\r\n\r\n`
);
const tail = Buffer.from(`\r\n--${boundary}--\r\n`);
const body = Buffer.concat([head, fileContent, tail]);

console.log('\n=== Testing POST /api/video/upload ===');
console.log(`File: test-video.mp4 (${fileContent.length} bytes)`);

const opts = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/video/upload',
  method: 'POST',
  headers: {
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
    'Content-Length': body.length
  }
};

const req = http.request(opts, (res) => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => {
    console.log(`\nHTTP Status: ${res.statusCode}`);
    try {
      const json = JSON.parse(data);
      console.log('Response:', JSON.stringify(json, null, 2));

      if (res.statusCode === 200) {
        console.log('\n✅ UPLOAD SUCCESS');
        console.log(`   Video ID   : ${json.id}`);
        console.log(`   Filename   : ${json.filename}`);
        console.log(`   Size       : ${json.size} bytes`);
        // Duration may fail on a fake mp4 — that's expected
      } else if (json.error && json.error.includes('duration')) {
        console.log('\n⚠️  Upload reached server but FFprobe could not read fake MP4 duration.');
        console.log('   This means file upload, routing, and Multer are all working correctly.');
        console.log('   Use a real video file to get full end-to-end success.');
      } else {
        console.log('\n❌ UPLOAD FAILED:', json.error);
      }
    } catch {
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (e) => {
  console.error('\n❌ Connection error:', e.message);
  console.log('   Make sure the backend is running on port 5000.');
});

req.write(body);
req.end();
