#!/usr/bin/env node
// check-wuce4-docker-deployment.js — AC verification for wuce.4
// Tests: T1.1, T2.1, T2.2, T3.1, T3.2, IT1, NFR1, NFR2
// All tests FAIL until implementation files exist.

'use strict';

const http = require('http');
const path = require('path');

const ROOT = path.join(__dirname, '..');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { console.log(`  \u2713 ${label}`); passed++; }
  else           { console.log(`  \u2717 ${label}`); failed++; }
}

function assertThrows(fn, label, messageContains) {
  try {
    fn();
    console.log(`  \u2717 ${label} (did not throw)`);
    failed++;
  } catch (err) {
    if (messageContains && !err.message.includes(messageContains)) {
      console.log(`  \u2717 ${label} (threw but message missing "${messageContains}": "${err.message}")`);
      failed++;
    } else {
      console.log(`  \u2713 ${label}`);
      passed++;
    }
  }
}

// ── Save and restore env helpers ──────────────────────────────────────────────
function withEnv(overrides, fn) {
  const saved = {};
  const toDelete = [];
  for (const [k, v] of Object.entries(overrides)) {
    if (k in process.env) saved[k] = process.env[k];
    else toDelete.push(k);
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  try {
    fn();
  } finally {
    for (const [k, v] of Object.entries(saved)) process.env[k] = v;
    for (const k of toDelete) delete process.env[k];
  }
}

// ── Set baseline env ──────────────────────────────────────────────────────────
process.env.GITHUB_CLIENT_ID     = 'test-client-id';
process.env.GITHUB_CLIENT_SECRET = 'test-client-secret';
process.env.GITHUB_CALLBACK_URL  = 'http://localhost:3000/auth/github/callback';
process.env.SESSION_SECRET       = 'test-session-secret-minimum32chars!!';
delete process.env.GITHUB_API_BASE_URL;

// ── Load modules ──────────────────────────────────────────────────────────────
const { validateRequiredEnvVars } = require('../src/web-ui/config/validate-env');
const { healthCheckHandler }      = require('../src/web-ui/routes/health');
const { buildOAuthRedirectURL }   = require('../src/web-ui/auth/oauth-adapter');
const { fetchArtefact, buildApiBase } = require('../src/web-ui/artefacts/artefact-adapter');
const { createApp }               = require('../src/web-ui/server');

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n[wuce.4-docker-deployment] T1 — Health check handler');

// T1.1 — healthCheckHandler returns {"status":"ok"} with HTTP 200
{
  const mockReq = {};
  const mockRes = {
    _code: null, _headers: {}, _body: '',
    writeHead(code, hdrs) { this._code = code; Object.assign(this._headers, hdrs || {}); },
    end(body) { this._body = body || ''; }
  };
  healthCheckHandler(mockReq, mockRes);
  assert(mockRes._code === 200, 'T1.1: healthCheckHandler sets status 200');
  let parsed;
  try { parsed = JSON.parse(mockRes._body); } catch (_) { parsed = null; }
  assert(parsed !== null && parsed.status === 'ok',
    'T1.1: healthCheckHandler body is {"status":"ok"}');
}

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n[wuce.4-docker-deployment] T2 — Startup env validation');

// T2.1 — validateRequiredEnvVars throws when GITHUB_CLIENT_SECRET absent
withEnv({ GITHUB_CLIENT_SECRET: undefined }, () => {
  assertThrows(
    () => validateRequiredEnvVars(),
    'T2.1: throws when GITHUB_CLIENT_SECRET missing',
    'GITHUB_CLIENT_SECRET'
  );
});

// T2.2 — validateRequiredEnvVars throws when GITHUB_CLIENT_ID absent
withEnv({ GITHUB_CLIENT_ID: undefined }, () => {
  assertThrows(
    () => validateRequiredEnvVars(),
    'T2.2: throws when GITHUB_CLIENT_ID missing',
    'GITHUB_CLIENT_ID'
  );
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n[wuce.4-docker-deployment] T3 — GITHUB_API_BASE_URL routing');

// T3.1 — buildOAuthRedirectURL uses GITHUB_API_BASE_URL when set
withEnv({ GITHUB_API_BASE_URL: 'https://ghe.example.com' }, () => {
  const url = buildOAuthRedirectURL('test-state');
  assert(
    url.startsWith('https://ghe.example.com/login/oauth/authorize'),
    'T3.1: OAuth redirect uses GITHUB_API_BASE_URL (GHE hostname)'
  );
  assert(
    !url.includes('github.com/login'),
    'T3.1: OAuth redirect does not contain github.com/login'
  );
});

// T3.2 — fetchArtefact uses GITHUB_API_BASE_URL for API base
{
  // Mock global.fetch to capture the URL
  let capturedUrl = null;
  const originalFetch = global.fetch;
  global.fetch = async (url, _opts) => {
    capturedUrl = url;
    return { ok: true, text: async () => 'mock content' };
  };

  withEnv({ GITHUB_API_BASE_URL: 'https://ghe.example.com' }, () => {
    // fetchArtefact is async but buildApiBase is sync — test URL construction
    const base = buildApiBase();
    assert(
      base === 'https://ghe.example.com/api/v3',
      'T3.2: buildApiBase returns GHE API endpoint when GITHUB_API_BASE_URL set'
    );
    assert(
      !base.includes('api.github.com'),
      'T3.2: buildApiBase does not contain api.github.com when GHE URL set'
    );
  });

  withEnv({ GITHUB_API_BASE_URL: undefined }, () => {
    const base = buildApiBase();
    assert(
      base === 'https://api.github.com',
      'T3.2: buildApiBase defaults to https://api.github.com when env var absent'
    );
  });

  // Restore fetch
  global.fetch = originalFetch;
}

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n[wuce.4-docker-deployment] NFR2 — All missing vars listed in one error');

// NFR2 — validateRequiredEnvVars lists ALL missing variables in one error
withEnv(
  { GITHUB_CLIENT_ID: undefined, GITHUB_CLIENT_SECRET: undefined, SESSION_SECRET: undefined },
  () => {
    assertThrows(
      () => validateRequiredEnvVars(),
      'NFR2: error message contains GITHUB_CLIENT_ID',
      'GITHUB_CLIENT_ID'
    );
  }
);

withEnv(
  { GITHUB_CLIENT_ID: undefined, GITHUB_CLIENT_SECRET: undefined, SESSION_SECRET: undefined },
  () => {
    let errorMsg = '';
    try { validateRequiredEnvVars(); } catch (e) { errorMsg = e.message; }
    assert(
      errorMsg.includes('GITHUB_CLIENT_ID') &&
      errorMsg.includes('GITHUB_CLIENT_SECRET') &&
      errorMsg.includes('SESSION_SECRET'),
      'NFR2: all three missing variables named in a single error message'
    );
  }
);

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n[wuce.4-docker-deployment] IT1 + NFR1 — HTTP integration tests');

// IT1 + NFR1 — GET /health returns 200 {"status":"ok"} without authentication
(async () => {
  // Re-set env for server startup
  process.env.GITHUB_CLIENT_ID     = 'test-client-id';
  process.env.GITHUB_CLIENT_SECRET = 'test-client-secret';
  process.env.SESSION_SECRET       = 'test-session-secret-minimum32chars!!';

  const server = createApp();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();

  try {
    // IT1 — GET /health returns 200 {"status":"ok"}
    const it1Result = await new Promise((resolve, reject) => {
      http.get(`http://127.0.0.1:${port}/health`, (res) => {
        let body = '';
        res.on('data', chunk => { body += chunk; });
        res.on('end', () => resolve({ status: res.statusCode, body }));
      }).on('error', reject);
    });
    assert(it1Result.status === 200, 'IT1: GET /health returns HTTP 200');
    let parsed;
    try { parsed = JSON.parse(it1Result.body); } catch (_) { parsed = null; }
    assert(parsed && parsed.status === 'ok', 'IT1: GET /health body is {"status":"ok"}');

    // NFR1 — GET /health does not require authenticated session (no cookie)
    assert(it1Result.status === 200, 'NFR1: GET /health accessible without session cookie (not 302)');

  } finally {
    server.close();
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log(`\n[wuce.4-docker-deployment] ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
})().catch(err => {
  console.error('[wuce.4-docker-deployment] Unexpected error:', err.message);
  process.exit(1);
});
