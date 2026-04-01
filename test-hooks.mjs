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

const SCENARIOS = [
  {
    label: 'Fitness content (English)',
    text: 'I lost 20 pounds in 30 days by doing this one simple morning routine. No gym required.',
    language: 'en'
  },
  {
    label: 'Finance content (English)',
    text: 'This investing strategy turned my 500 dollars into 5000 in just 6 months using index funds.',
    language: 'en'
  },
  {
    label: 'Cooking content (Spanish)',
    text: 'Esta receta secreta de mi abuela hace el mejor pollo asado que jamas has probado.',
    language: 'es'
  },
  {
    label: 'Empty / edge case',
    text: 'Hello.',
    language: 'en'
  }
];

console.log('=== Testing POST /api/process/hooks ===\n');

let allPassed = true;

for (const s of SCENARIOS) {
  console.log(`Scenario : ${s.label}`);
  console.log(`Input    : "${s.text}"`);

  const t0 = Date.now();
  const res = await post('/api/process/hooks', { text: s.text, language: s.language });
  const elapsed = ((Date.now() - t0) / 1000).toFixed(2);

  console.log(`Status   : HTTP ${res.status}  (${elapsed}s)`);

  if (res.status === 200) {
    const { hooks } = res.body;
    const valid = Array.isArray(hooks) && hooks.length === 3 && hooks.every(h => typeof h === 'string' && h.length > 3);
    console.log(`Hooks    : ${valid ? '✅' : '❌'} (${hooks?.length ?? 0} returned)`);
    hooks?.forEach((h, i) => console.log(`  [${i + 1}] ${h}`));
    if (!valid) allPassed = false;
  } else {
    console.log(`Error    : ❌ ${res.body.error}`);
    allPassed = false;
  }

  const isMock = res.body.hooks?.some(h =>
    ['Nobody will tell you this', 'This changed everything', 'Before you watch this'].some(m => h.includes(m))
  );
  console.log(`Mode     : ${isMock ? '⚠️  MOCK (add OPENAI_API_KEY for GPT hooks)' : '🤖 REAL GPT'}`);
  console.log('─'.repeat(60));
}

console.log(`\n${allPassed ? '✅ All hook generation tests passed' : '❌ Some tests failed'}`);
