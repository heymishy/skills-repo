#!/usr/bin/env node
// check-wuce3-attributed-signoff.js — AC verification tests for wuce.3
// Tests T1.1–T1.3, T3.1, T4.1–T4.2, T5.1, T6.1–T6.2, IT1–IT5, NFR1–NFR3
// Tests FAIL until src/web-ui/adapters/sign-off-writer.js,
//   routes/sign-off.js, middleware/rate-limiter.js exist.
// No external dependencies — Node.js built-ins only.

'use strict';

const path = require('path');
const ROOT  = path.join(__dirname, '..');

// ── Fixtures ─────────────────────────────────────────────────────────────────
const writeSuccessFixture  = require('./fixtures/github/contents-api-write-success.json');
const conflictFixture      = require('./fixtures/github/contents-api-conflict.json');
const userIdentityFixture  = require('./fixtures/github/user-identity.json');
const fs                   = require('fs');
const unsignedMarkdown     = fs.readFileSync(path.join(__dirname, 'fixtures/markdown/discovery-unsigned.md'), 'utf8');
const signedMarkdown       = fs.readFileSync(path.join(__dirname, 'fixtures/markdown/discovery-signed.md'), 'utf8');

// ── Environment setup ────────────────────────────────────────────────────────
process.env.GITHUB_CLIENT_ID      = 'test-client-id';
process.env.GITHUB_CLIENT_SECRET  = 'test-secret';
process.env.GITHUB_CALLBACK_URL   = 'http://localhost:3000/auth/github/callback';
process.env.SESSION_SECRET        = 'test-session-secret-minimum32chars!!';
process.env.GITHUB_REPO_OWNER     = 'heymishy';
process.env.GITHUB_REPO_NAME      = 'skills-repo';

// ── Load modules ─────────────────────────────────────────────────────────────
const {
  buildSignOffPayload,
  commitSignOff,
  detectExistingSignOff,
  validateArtefactPath,
  SignOffConflictError
} = require('../src/web-ui/adapters/sign-off-writer');

const { handleSignOff, setLogger } = require('../src/web-ui/routes/sign-off');
const { createRateLimiter }        = require('../src/web-ui/middleware/rate-limiter');

// ── Test infrastructure ───────────────────────────────────────────────────────
let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { console.log('  \u2713 ' + label); passed++; }
  else           { console.error('  \u2717 ' + label); failed++; }
}

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

function mockReq(overrides) {
  return Object.assign(
    { session: { accessToken: 'gho_test_fixture_token_wuce1', userId: 99001, login: 'test-stakeholder' },
      sessionId: 'test-sid', query: {}, headers: {}, body: undefined },
    overrides || {}
  );
}

function mockRes() {
  return {
    statusCode: null,
    headers:    {},
    body:       '',
    writeHead(code, hdrs) {
      this.statusCode = code;
      if (hdrs) Object.assign(this.headers, hdrs);
    },
    end(body) { this.body = (body != null ? body : ''); this._ended = true; }
  };
}

// Standard file fetch mock: returns unsigned markdown with a SHA
function fileGetResponse(markdown) {
  return {
    ok:     true,
    status: 200,
    json:   async () => ({
      sha:     'current-sha-abc123',
      content: Buffer.from(markdown, 'utf8').toString('base64'),
      path:    'artefacts/2026-01-01-example-feature/discovery.md'
    })
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// AC1 — Sign-off commit construction
// ═══════════════════════════════════════════════════════════════════════════

test('T1.1 buildSignOffPayload appends ## Approved by section with name and timestamp', () => {
  const user      = { name: 'Test Stakeholder' };
  const timestamp = '2026-05-02T10:00:00Z';
  const result    = buildSignOffPayload(unsignedMarkdown, user, timestamp);

  assert(result.includes('## Approved by'), 'T1.1: result contains ## Approved by heading');
  assert(result.includes('Test Stakeholder'), 'T1.1: result contains approver name');
  assert(result.includes('2026-05-02T10:00:00Z'), 'T1.1: result contains timestamp');
  // Original content preserved
  assert(result.includes('Sample discovery without sign-off'), 'T1.1: original content preserved');
});

test('T1.2 buildSignOffPayload timestamp is ISO 8601 formatted', () => {
  const user      = { name: 'Test Stakeholder' };
  const timestamp = new Date().toISOString();
  const result    = buildSignOffPayload(unsignedMarkdown, user, timestamp);

  const iso8601 = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z/;
  assert(iso8601.test(timestamp), 'T1.2: generated timestamp matches ISO 8601 pattern');
  assert(result.includes(timestamp), 'T1.2: ISO 8601 timestamp appears in output');
});

test('T1.3 commitSignOff calls Contents API PUT with correct method, URL and auth', async () => {
  const calls = [];
  const origFetch = global.fetch;

  global.fetch = async (url, opts) => {
    calls.push({ url, opts });
    if (url.includes('/user')) {
      return { ok: true, status: 200, json: async () => userIdentityFixture };
    }
    // PUT response
    return { ok: true, status: 200, json: async () => writeSuccessFixture };
  };

  const signOffPayload = {
    content:      buildSignOffPayload(unsignedMarkdown, { name: 'Test Stakeholder' }, '2026-05-02T10:00:00Z'),
    sha:          'current-sha-abc123',
    approverName: 'Test Stakeholder'
  };

  await commitSignOff(
    'artefacts/2026-01-01-example-feature/discovery.md',
    signOffPayload,
    'gho_test_fixture_token_wuce1'
  );

  global.fetch = origFetch;

  const putCall = calls.find(c => c.opts && c.opts.method === 'PUT');
  assert(putCall !== undefined, 'T1.3: PUT request was made');
  assert(putCall.url.includes('artefacts/2026-01-01-example-feature/discovery.md'), 'T1.3: URL contains artefact path');
  assert(putCall.opts.headers.Authorization === 'Bearer gho_test_fixture_token_wuce1', 'T1.3: Authorization header uses user token');

  const putBody = JSON.parse(putCall.opts.body);
  assert(typeof putBody.content === 'string' && putBody.content.length > 0, 'T1.3: body contains base64 file content');
  assert(typeof putBody.message === 'string' && putBody.message.includes('sign-off'), 'T1.3: body contains sign-off commit message');
});

// ═══════════════════════════════════════════════════════════════════════════
// AC3 — Commit author/committer identity
// ═══════════════════════════════════════════════════════════════════════════

test('T3.1 commitSignOff sets author and committer to authenticated user not service account', async () => {
  let capturedPutBody;
  const origFetch = global.fetch;

  global.fetch = async (url, opts) => {
    if (url.includes('/user')) {
      return { ok: true, status: 200, json: async () => userIdentityFixture };
    }
    if (opts && opts.method === 'PUT') {
      capturedPutBody = JSON.parse(opts.body);
      return { ok: true, status: 200, json: async () => writeSuccessFixture };
    }
    return { ok: true, status: 200, json: async () => ({}) };
  };

  const signOffPayload = {
    content:      buildSignOffPayload(unsignedMarkdown, { name: 'Test Stakeholder' }, '2026-05-02T10:00:00Z'),
    sha:          'current-sha-abc123',
    approverName: 'Test Stakeholder'
  };

  await commitSignOff(
    'artefacts/2026-01-01-example-feature/discovery.md',
    signOffPayload,
    'gho_test_fixture_token_wuce1'
  );

  global.fetch = origFetch;

  assert(capturedPutBody !== undefined, 'T3.1: PUT request body was captured');
  assert(capturedPutBody.author && capturedPutBody.author.name === 'Test Stakeholder',
    'T3.1: author.name matches authenticated user display name');
  assert(capturedPutBody.author && capturedPutBody.author.email === 'stakeholder@example.com',
    'T3.1: author.email matches authenticated user email');
  assert(capturedPutBody.committer && capturedPutBody.committer.name === 'Test Stakeholder',
    'T3.1: committer.name matches authenticated user');
  assert(capturedPutBody.committer && capturedPutBody.committer.email === 'stakeholder@example.com',
    'T3.1: committer.email matches authenticated user email');

  // Verify no bot/service account identity
  const bodyStr = JSON.stringify(capturedPutBody);
  assert(!bodyStr.includes('github-actions') && !bodyStr.includes('bot@'), 'T3.1: no service account identity in commit');
});

// ═══════════════════════════════════════════════════════════════════════════
// AC4 — Path traversal prevention
// ═══════════════════════════════════════════════════════════════════════════

test('T4.1 validateArtefactPath returns false for path containing ../', () => {
  assert(validateArtefactPath('../etc/passwd') === false, 'T4.1: ../ path rejected');
  assert(validateArtefactPath('artefacts/../../etc/passwd') === false, 'T4.1: nested ../ path rejected');
  assert(validateArtefactPath('..') === false, 'T4.1: bare .. rejected');
});

test('T4.2 validateArtefactPath returns false for absolute path not starting with artefacts/', () => {
  assert(validateArtefactPath('/root/secret.md') === false, 'T4.2: absolute Unix path rejected');
  assert(validateArtefactPath('/etc/passwd') === false, 'T4.2: /etc path rejected');
  assert(validateArtefactPath('artefacts/2026-01-01-example/discovery.md') === true, 'T4.2: valid artefacts/ path accepted');
});

// ═══════════════════════════════════════════════════════════════════════════
// AC5 — Contents API conflict handling
// ═══════════════════════════════════════════════════════════════════════════

test('T5.1 commitSignOff throws SignOffConflictError when Contents API returns 409', async () => {
  const origFetch = global.fetch;

  global.fetch = async (url, opts) => {
    if (url.includes('/user')) {
      return { ok: true, status: 200, json: async () => userIdentityFixture };
    }
    if (opts && opts.method === 'PUT') {
      return { ok: false, status: 409, json: async () => conflictFixture };
    }
    return { ok: true, status: 200, json: async () => ({}) };
  };

  let thrownError;
  const signOffPayload = { content: 'updated content', sha: 'abc123', approverName: 'Test Stakeholder' };

  try {
    await commitSignOff('artefacts/2026-01-01-example/discovery.md', signOffPayload, 'gho_test_fixture_token_wuce1');
  } catch (err) {
    thrownError = err;
  }

  global.fetch = origFetch;

  assert(thrownError instanceof SignOffConflictError, 'T5.1: throws SignOffConflictError on 409');
  assert(thrownError.name === 'SignOffConflictError', 'T5.1: error name is SignOffConflictError');
});

// ═══════════════════════════════════════════════════════════════════════════
// AC6 — Already signed off detection
// ═══════════════════════════════════════════════════════════════════════════

test('T6.1 detectExistingSignOff returns truthy when ## Approved by section is present', () => {
  const result = detectExistingSignOff(signedMarkdown);
  assert(!!result, 'T6.1: returns truthy for signed markdown');
  assert(result !== null, 'T6.1: does not return null for signed markdown');
});

test('T6.2 detectExistingSignOff returns approver name and date from existing section', () => {
  const result = detectExistingSignOff(signedMarkdown);
  assert(result && result.approver === 'Test Stakeholder', 'T6.2: approver matches fixture value');
  assert(result && result.date === '2026-04-28T14:32:00Z', 'T6.2: date matches fixture value');
});

// ═══════════════════════════════════════════════════════════════════════════
// Integration tests (route handler with mock req/res)
// ═══════════════════════════════════════════════════════════════════════════

test('IT1 POST /sign-off with valid path and unsigned artefact commits and returns 200', async () => {
  const fetchCalls = [];
  const origFetch  = global.fetch;

  global.fetch = async (url, opts) => {
    fetchCalls.push({ url, opts });
    if (url.includes('/user')) {
      return { ok: true, status: 200, json: async () => userIdentityFixture };
    }
    if (opts && opts.method === 'PUT') {
      return { ok: true, status: 200, json: async () => writeSuccessFixture };
    }
    // GET file
    return fileGetResponse(unsignedMarkdown);
  };

  const req = mockReq({
    body: { artefactPath: 'artefacts/2026-01-01-example-feature/discovery.md' }
  });
  const res = mockRes();

  await handleSignOff(req, res);
  global.fetch = origFetch;

  assert(res.statusCode === 200, 'IT1: status is 200');
  const body = JSON.parse(res.body);
  assert(body.success === true, 'IT1: response body contains success: true');

  // AC3: PUT was called — verifying committer identity was set correctly
  const putCall = fetchCalls.find(c => c.opts && c.opts.method === 'PUT');
  assert(putCall !== undefined, 'IT1: GitHub Contents API PUT was called once');
  const putBody = JSON.parse(putCall.opts.body);
  assert(putBody.committer && putBody.committer.name === 'Test Stakeholder',
    'IT1: PUT committer is authenticated user not service account');
});

test('IT2 GET /artefact/:slug/discovery returns content with ## Approved by after sign-off', async () => {
  const origFetch = global.fetch;
  const { handleArtefactRead } = require('../src/web-ui/routes/sign-off');

  global.fetch = async () => ({
    ok:     true,
    status: 200,
    json:   async () => ({
      sha:     'post-commit-sha',
      content: Buffer.from(signedMarkdown, 'utf8').toString('base64'),
      path:    'artefacts/2026-01-01-example-feature/discovery.md'
    })
  });

  const req = mockReq();
  const res = mockRes();

  await handleArtefactRead(req, res, '2026-01-01-example-feature');
  global.fetch = origFetch;

  assert(res.statusCode === 200, 'IT2: status is 200');
  assert(res.body.includes('Approved by'), 'IT2: response body contains "Approved by" section');
  assert(res.body.includes('Test Stakeholder'), 'IT2: approver name visible in rendered artefact');
});

test('IT3 POST /sign-off with path traversal returns 400 and does not call Contents API', async () => {
  let apiCalled = false;
  const origFetch = global.fetch;
  global.fetch = async () => { apiCalled = true; return { ok: true, json: async () => ({}) }; };

  const req = mockReq({ body: { artefactPath: '../../etc/passwd' } });
  const res = mockRes();

  await handleSignOff(req, res);
  global.fetch = origFetch;

  assert(res.statusCode === 400, 'IT3: status is 400 for traversal path');
  assert(!apiCalled, 'IT3: Contents API was NOT called after path rejection');
});

test('IT4 POST /sign-off when Contents API returns 409 returns 409 with reload message', async () => {
  const origFetch = global.fetch;

  global.fetch = async (url, opts) => {
    if (url.includes('/user')) {
      return { ok: true, status: 200, json: async () => userIdentityFixture };
    }
    if (opts && opts.method === 'PUT') {
      return { ok: false, status: 409, json: async () => conflictFixture };
    }
    return fileGetResponse(unsignedMarkdown);
  };

  const req = mockReq({ body: { artefactPath: 'artefacts/2026-01-01-example-feature/discovery.md' } });
  const res = mockRes();

  await handleSignOff(req, res);
  global.fetch = origFetch;

  assert(res.statusCode === 409, 'IT4: status is 409 on GitHub conflict');
  const body = JSON.parse(res.body);
  const msg  = (body.error || '').toLowerCase();
  assert(msg.includes('updated') || msg.includes('reload'), 'IT4: response mentions reload/update');
});

test('IT5 POST /sign-off when artefact already has ## Approved by returns 409 with existing approver', async () => {
  let putCalled = false;
  const origFetch = global.fetch;

  global.fetch = async (url, opts) => {
    if (opts && opts.method === 'PUT') { putCalled = true; }
    // Always return the signed artefact
    return fileGetResponse(signedMarkdown);
  };

  const req = mockReq({ body: { artefactPath: 'artefacts/2026-01-01-example-feature/discovery.md' } });
  const res = mockRes();

  await handleSignOff(req, res);
  global.fetch = origFetch;

  assert(res.statusCode === 409, 'IT5: status is 409 for already-signed artefact');
  const body = JSON.parse(res.body);
  assert(body.approver === 'Test Stakeholder', 'IT5: response contains existing approver name');
  assert(body.date === '2026-04-28T14:32:00Z', 'IT5: response contains existing sign-off date');
  assert(!putCalled, 'IT5: Contents API PUT was NOT called for already-signed artefact');
});

// ═══════════════════════════════════════════════════════════════════════════
// NFR Tests
// ═══════════════════════════════════════════════════════════════════════════

test('NFR1 sign-off endpoint rate-limits at 10 attempts per user per minute', async () => {
  const limiter = createRateLimiter({ maxRequests: 10, windowMs: 60 * 1000 });

  const session = { userId: 99999, login: 'rate-limit-test-user', accessToken: 'token' };
  let lastStatus;

  for (let i = 0; i < 11; i++) {
    const req = { session };
    const res = mockRes();
    let nextCalled = false;
    limiter(req, res, () => { nextCalled = true; });
    if (!nextCalled) {
      lastStatus = res.statusCode;
    }
  }

  assert(lastStatus === 429, 'NFR1: 11th request returns 429 Too Many Requests');
});

test('NFR2 sign-off logs signoff_submitted event with userId, artefactPath, timestamp', async () => {
  const logEvents = [];
  setLogger({
    info: (event, data) => logEvents.push({ event, data }),
    warn: (event, data) => logEvents.push({ event, data })
  });

  const origFetch = global.fetch;
  global.fetch = async (url, opts) => {
    if (url.includes('/user')) {
      return { ok: true, status: 200, json: async () => userIdentityFixture };
    }
    if (opts && opts.method === 'PUT') {
      return { ok: true, status: 200, json: async () => writeSuccessFixture };
    }
    return fileGetResponse(unsignedMarkdown);
  };

  const req = mockReq({
    session: { accessToken: 'gho_test_fixture_token_wuce1', userId: 99001, login: 'test-stakeholder' },
    body: { artefactPath: 'artefacts/2026-01-01-example-feature/discovery.md' }
  });
  const res = mockRes();

  await handleSignOff(req, res);
  global.fetch = origFetch;

  // Restore default logger
  setLogger({ info: () => {}, warn: () => {} });

  const signoffEvent = logEvents.find(e => e.event === 'signoff_submitted');
  assert(signoffEvent !== undefined, 'NFR2: signoff_submitted event was logged');
  assert(signoffEvent.data.userId === 99001, 'NFR2: log contains userId 99001');
  assert(signoffEvent.data.artefactPath === 'artefacts/2026-01-01-example-feature/discovery.md',
    'NFR2: log contains artefactPath');
  assert(typeof signoffEvent.data.timestamp === 'string' && signoffEvent.data.timestamp.length > 0,
    'NFR2: log contains ISO timestamp');
});

test('NFR3 server does not use env-var write token — commitSignOff accepts token as parameter only', () => {
  const adapterSource = require('fs').readFileSync(
    require('path').join(__dirname, '../src/web-ui/adapters/sign-off-writer.js'), 'utf8'
  );

  // The adapter should not read any write-path token from process.env
  const writesWithEnvToken =
    adapterSource.includes('process.env.GITHUB_TOKEN') ||
    adapterSource.includes('process.env.GITHUB_PERSONAL_ACCESS_TOKEN') ||
    adapterSource.includes('process.env.GH_TOKEN');

  assert(!writesWithEnvToken, 'NFR3: adapter does not reference server-level env-var write token');

  // The token parameter must be used for all requests
  assert(adapterSource.includes('Bearer \' + token'), 'NFR3: adapter uses token parameter (not env var) for auth');
});

// ═══════════════════════════════════════════════════════════════════════════
// Run all tests
// ═══════════════════════════════════════════════════════════════════════════

(async () => {
  console.log('\ncheck-wuce3-attributed-signoff — wuce.3: Attributed sign-off on pipeline artefacts\n');

  for (const t of tests) {
    process.stdout.write('[' + t.name + ']\n');
    try {
      await t.fn();
    } catch (err) {
      console.error('  \u2717 UNCAUGHT: ' + err.message);
      failed++;
    }
  }

  console.log('\n' + passed + ' passed, ' + failed + ' failed');

  if (failed > 0) {
    process.exit(1);
  }
})();
