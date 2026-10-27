import assert from 'node:assert';
import http from 'node:http';
import app from '../backend/src/app.js';

const server = http.createServer(app);

async function runTests() {
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  console.log(`Test API server running on ${baseUrl}`);

  let passed = 0;
  let total = 0;

  async function test(name, fn) {
    total++;
    try {
      await fn();
      console.log(` PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(` FAIL: ${name}:`, err.message);
      throw err;
    }
  }

  // 1. Health endpoint
  await test('GET /api/health returns 200 JSON with service status', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.service, 'tonto-clothing-backend');
    assert.ok(json.time);
  });

  // 2. Base API endpoint
  await test('GET /api returns 200 documentation hint', async () => {
    const res = await fetch(`${baseUrl}/api`);
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.ok(json.docs);
  });

  // 3. Policies endpoint
  await test('GET /api/policies/shipping returns 200 with delivery policy', async () => {
    const res = await fetch(`${baseUrl}/api/policies/shipping`);
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.ok(Array.isArray(json.sections));
    assert.ok(json.sections.length > 0);
  });

  // 4. Store info endpoint
  await test('GET /api/store/info returns Coimbatore showroom info', async () => {
    const res = await fetch(`${baseUrl}/api/store/info`);
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.ok(json.data.location.includes('Coimbatore'));
  });

  // 5. Admin login with invalid passcode (checks 401 when DB up, or 503 when DB unset)
  await test('POST /api/auth/admin/login with invalid passcode is rejected (401/503)', async () => {
    const res = await fetch(`${baseUrl}/api/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode: 'wrong-passcode-test' }),
    });
    assert.ok(res.status === 401 || res.status === 503, `Expected 401 or 503, got ${res.status}`);
  });

  // 6. Admin login with empty passcode
  await test('POST /api/auth/admin/login with empty passcode returns 400 validation error', async () => {
    const res = await fetch(`${baseUrl}/api/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode: '' }),
    });
    assert.strictEqual(res.status, 400);
  });

  // 7. Orders admin list without token
  await test('GET /api/orders without Bearer token returns 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/orders`, {
      headers: { Accept: 'application/json' }
    });
    assert.strictEqual(res.status, 401);
    const json = await res.json();
    assert.strictEqual(json.success, false);
    assert.ok(json.message.includes('Bearer token'));
  });

  // 8. Create order with empty body
  await test('POST /api/orders with empty payload returns 400 Bad Request', async () => {
    const res = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert.strictEqual(res.status, 400);
  });

  // 9. Validate known promo TONTO15
  await test('POST /api/promos/validate with TONTO15 returns 15% discount', async () => {
    const res = await fetch(`${baseUrl}/api/promos/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'TONTO15' }),
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.valid, true);
    assert.strictEqual(json.percent, 15);
  });

  // 10. Validate unknown promo returns false
  await test('POST /api/promos/validate with fake code returns valid:false', async () => {
    const res = await fetch(`${baseUrl}/api/promos/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'INVALID-FAKE-CODE-999' }),
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.valid, false);
  });

  await new Promise((resolve) => server.close(resolve));
  console.log(`\nAll ${passed}/${total} API integration tests passed successfully!`);
}

runTests().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
