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

const TEST_TEXTS = [
  "This product changed my life completely. I can't believe how good it is!",
  "Never share your personal information online with strangers.",
  "The secret to success is consistency and hard work every single day."
];

const LANGUAGES = [
  { code: 'en', name: 'English',  flag: '🇺🇸' },
  { code: 'es', name: 'Spanish',  flag: '🇪🇸' },
  { code: 'ar', name: 'Arabic',   flag: '🇸🇦' }
];

console.log('=== Testing POST /api/process/translate ===\n');

for (const text of TEST_TEXTS) {
  console.log(`Source: "${text}"`);
  console.log('─'.repeat(70));

  const t0 = Date.now();
  const res = await post('/api/process/translate', {
    text,
    languages: ['en', 'es', 'ar']
  });
  const elapsed = ((Date.now() - t0) / 1000).toFixed(2);

  if (res.status === 200) {
    const { translations } = res.body;
    for (const { code, name, flag } of LANGUAGES) {
      const result = translations[code] || '(missing)';
      const isMock = result.includes('[') && result.includes('translation of');
      console.log(`  ${flag} ${name.padEnd(8)} : ${result}`);
      if (isMock) process.exitCode = 0; // mock is still a pass
    }
    console.log(`  ⏱  ${elapsed}s\n`);
  } else {
    console.log(`  ❌ HTTP ${res.status}: ${res.body.error}\n`);
  }
}

// Summary
const check = await post('/api/process/translate', { text: 'Hello', languages: ['es'] });
const isMock = check.body.translations?.es?.includes('[');
console.log('='.repeat(70));
console.log(isMock
  ? '⚠️  Mode: MOCK — translations are placeholders (add OPENAI_API_KEY for real GPT translation)'
  : '✅  Mode: REAL GPT — translations are live');
