import { strict as assert } from 'node:assert';
import test from 'node:test';
import handler from '../../api/bootstrap.js';
import { issueSessionToken } from '../../api/_session.js';

function makePreflight(origin) {
  return new Request('https://api.orion.app/api/bootstrap?keys=techReadiness', {
    method: 'OPTIONS',
    headers: {
      origin,
      'access-control-request-method': 'GET',
    },
  });
}

test('bootstrap preflight is compatible with credentialed browser fetches', async () => {
  const resp = await handler(makePreflight('https://www.orion.app'));

  assert.equal(resp.status, 204);
  assert.equal(resp.headers.get('access-control-allow-origin'), 'https://www.orion.app');
  assert.equal(resp.headers.get('access-control-allow-credentials'), 'true');
  assert.equal(resp.headers.get('vary'), 'Origin');
});

test('bootstrap GET response is compatible with credentialed browser fetches', async () => {
  const previousSecret = process.env.ORION_SESSION_SECRET;
  process.env.ORION_SESSION_SECRET = 'test-secret-for-bootstrap-cors-guardrail';
  try {
    const { token } = await issueSessionToken();
    const resp = await handler(new Request('https://api.orion.app/api/bootstrap?keys=techReadiness', {
      method: 'GET',
      headers: {
        origin: 'https://www.orion.app',
        cookie: `orion-session=${token}`,
      },
    }));

    assert.equal(resp.status, 200);
    assert.equal(resp.headers.get('access-control-allow-origin'), 'https://www.orion.app');
    assert.equal(resp.headers.get('access-control-allow-credentials'), 'true');
    assert.equal(resp.headers.get('vary'), 'Origin');
  } finally {
    if (previousSecret === undefined) {
      delete process.env.ORION_SESSION_SECRET;
    } else {
      process.env.ORION_SESSION_SECRET = previousSecret;
    }
  }
});
