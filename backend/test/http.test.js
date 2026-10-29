import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import app from '../src/app.js';

describe('HTTP & API Security Headers', () => {
  let server;
  let baseUrl;

  before(async () => {
    server = http.createServer(app);
    await new Promise((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  it('serves strict security headers on API responses', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.equal(res.status, 200);

    // Verify Helmet security headers
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
    assert.ok(res.headers.get('content-security-policy'));
    assert.ok(res.headers.get('content-security-policy').includes("default-src 'self'"));
    assert.ok(res.headers.get('strict-transport-security'));
    assert.equal(res.headers.get('referrer-policy'), 'strict-origin-when-cross-origin');
    assert.ok(res.headers.get('permissions-policy'));
    assert.ok(res.headers.get('permissions-policy').includes('camera=()'));

    // Verify Fingerprint removal
    assert.equal(res.headers.get('x-powered-by'), null);
  });

  it('returns clean health status without exposing sensitive credentials', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.service, 'tonto-clothing-backend');
    // Ensure no passwords, keys or secret configs leaked
    assert.equal(data.jwtSecret, undefined);
    assert.equal(data.adminPasscode, undefined);
    assert.equal(data.serviceRoleKey, undefined);
  });

  it('rejects malformed lead submissions with validation errors (400)', async () => {
    const res = await fetch(`${baseUrl}/api/leads/claim-offer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email' }),
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.ok(data.message || data.errors);
  });

  it('returns generic sanitized 404 for unknown API endpoints without stack traces', async () => {
    const res = await fetch(`${baseUrl}/api/non-existent-secret-path`);
    assert.equal(res.status, 404);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.equal(data.stack, undefined);
  });
});
