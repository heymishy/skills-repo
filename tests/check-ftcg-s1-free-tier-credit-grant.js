'use strict';

// tests/check-ftcg-s1-free-tier-credit-grant.js -- ftcg-s1
// Story: artefacts/2026-07-25-free-tier-credit-grant/stories/ftcg-s1-free-tier-credit-grant.md
// Test plan: artefacts/2026-07-25-free-tier-credit-grant/test-plans/ftcg-s1-test-plan.md
//
// Covers:
//   AC1: new tenant -> grant applied, returns true
//   AC2: existing tenant (any balance, incl. exactly 0) -> no re-grant, returns false
//   AC3: concurrent calls -> exactly one grant applied
//   AC4: GitHub signup grants free tier
//   AC5: Google signup grants free tier
//   AC6: email/password signup grants free tier
//   AC7: returning user via each method -> unchanged balance
//   AC8: adapter not wired -> signup still succeeds

process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test-session-secret-minimum32chars!!';
process.env.GITHUB_CLIENT_ID = 'test-gh-client-id';
process.env.GITHUB_CLIENT_SECRET = 'test-gh-secret';
process.env.GITHUB_CALLBACK_URL = 'http://localhost:3000/auth/github/callback';
process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';
process.env.GOOGLE_CALLBACK_URL = 'http://localhost:3000/auth/google/callback';
process.env.CREDITS_FREE_TIER_GRANT = '10';

var assert = require('assert');
var path = require('path');
var bcrypt = require('bcrypt');

var passed = 0;
var failed = 0;

function test(name, fn) {
  return Promise.resolve().then(fn).then(
    function() { passed++; console.log('  [PASS] ' + name); },
    function(err) { failed++; console.log('  [FAIL] ' + name + ' -- ' + (err && err.message || err)); }
  );
}

var ROOT = path.join(__dirname, '..');
var CREDITS_PATH = require.resolve(path.join(ROOT, 'src', 'web-ui', 'modules', 'credits'));
var AUTH_PATH = require.resolve(path.join(ROOT, 'src', 'web-ui', 'routes', 'auth'));
var AUTH_EMAIL_PATH = require.resolve(path.join(ROOT, 'src', 'web-ui', 'routes', 'auth-email'));
var OAUTH_ADAPTER_PATH = require.resolve(path.join(ROOT, 'src', 'web-ui', 'auth', 'oauth-adapter'));

var tokenSuccessFixture = require('./fixtures/github/oauth-token-exchange-success.json');
var userIdentityFixture = require('./fixtures/github/user-identity.json');

function freshRequire(p) {
  delete require.cache[require.resolve(p)];
  return require(p);
}

/**
 * A fake credits DB recognising both the existing upsert-add shape
 * (adjustBalance/adjustBalanceWithAudit) and the new grant-if-new shape
 * (INSERT ... ON CONFLICT DO NOTHING), against a real in-memory
 * {tenantId: balance} map -- proves genuine idempotency, not just "a mock
 * method was called."
 */
function makeFakeCreditsDb(initialRows) {
  var rows = {};
  (initialRows || []).forEach(function(r) { rows[r.tenant_id] = r.balance; });

  return {
    query: async function(sql, params) {
      if (/^\s*SELECT balance FROM credits/i.test(sql)) {
        var tid = params[0];
        if (rows[tid] === undefined) return { rows: [] };
        return { rows: [{ balance: rows[tid] }] };
      }
      // New shape: INSERT ... ON CONFLICT (tenant_id) DO NOTHING RETURNING balance
      if (/INSERT INTO credits/i.test(sql) && /DO NOTHING/i.test(sql)) {
        var tenantId = params[0];
        var amount = params[1];
        if (rows[tenantId] !== undefined) {
          return { rows: [] }; // conflict -> DO NOTHING -> no rows returned
        }
        rows[tenantId] = amount;
        return { rows: [{ balance: amount }] };
      }
      // Existing shape: INSERT ... ON CONFLICT (tenant_id) DO UPDATE ... (adjustBalance)
      if (/INSERT INTO credits/i.test(sql) && /DO UPDATE/i.test(sql)) {
        var delta = params[0];
        var t = params[1];
        if (rows[t] === undefined) rows[t] = 0;
        rows[t] += delta;
        if (/RETURNING balance/i.test(sql)) return { rows: [{ balance: rows[t] }] };
        return { rows: [] };
      }
      return { rows: [] };
    },
    _balance: function(tenantId) { return rows[tenantId]; }
  };
}

function mockAuthReq(overrides) {
  return Object.assign({ session: {}, sessionId: 'test-sid', query: {}, headers: {} }, overrides || {});
}

function mockAuthRes() {
  var _headers = {};
  return {
    statusCode: null,
    get headers() { return _headers; },
    writeHead: function(code, hdrs) { this.statusCode = code; if (hdrs) Object.assign(_headers, hdrs); },
    setHeader: function(name, value) { _headers[name] = value; },
    end: function(body) { this.body = (body != null ? body : ''); this._ended = true; }
  };
}

function mockEmailReq(overrides) {
  var req = Object.assign({
    session: {}, sessionId: 'test-sid-' + Math.random().toString(36).slice(2),
    headers: {}, connection: { remoteAddress: '127.0.0.1' }, body: undefined
  }, overrides || {});
  if (!req.session.csrfToken) req.session.csrfToken = 'test-csrf-' + Math.random().toString(36).slice(2);
  if (req.body && typeof req.body === 'object' && req.body._csrf === undefined) {
    req.body = Object.assign({}, req.body, { _csrf: req.session.csrfToken });
  }
  return req;
}

function mockEmailRes() {
  var _headers = {};
  var r = {
    statusCode: null, body: '', headers: _headers,
    writeHead: function(code, hdrs) { r.statusCode = code; if (hdrs) Object.assign(_headers, hdrs); },
    setHeader: function(name, value) { _headers[name] = value; },
    end: function(body) { r.body = (body != null ? String(body) : ''); r._ended = true; }
  };
  return r;
}

function mockUserDb(existingRows) {
  var rows = existingRows || [];
  return {
    query: async function(sql, params) {
      if (/INSERT INTO users/i.test(sql)) {
        var id = 'uuid-' + Math.random().toString(36).slice(2, 8);
        return { rows: [{ id: id }] };
      }
      if (/SELECT.*FROM users WHERE email/i.test(sql)) {
        return { rows: rows };
      }
      return { rows: [] };
    }
  };
}

(async function() {
  // ===========================================================================
  // AC1-AC3 -- credits.js's grantFreeTierIfNew, unit level
  // ===========================================================================
  await test('newTenantGetsGrantAndReturnsTrue (AC1)', async function() {
    var credits = freshRequire(CREDITS_PATH);
    var db = makeFakeCreditsDb([]);
    credits.setCreditsAdapter(db);
    var granted = await credits.grantFreeTierIfNew('brand-new-tenant', 10);
    assert.strictEqual(granted, true);
    assert.strictEqual(await credits.getBalance('brand-new-tenant'), 10);
  });

  await test('existingTenantWithNonzeroBalanceNotReGranted (AC2)', async function() {
    var credits = freshRequire(CREDITS_PATH);
    var db = makeFakeCreditsDb([{ tenant_id: 'existing-tenant', balance: 5 }]);
    credits.setCreditsAdapter(db);
    var granted = await credits.grantFreeTierIfNew('existing-tenant', 10);
    assert.strictEqual(granted, false);
    assert.strictEqual(await credits.getBalance('existing-tenant'), 5, 'expected balance unchanged, not reset or added to');
  });

  await test('existingTenantWithExactlyZeroBalanceNotReGranted (AC2)', async function() {
    var credits = freshRequire(CREDITS_PATH);
    var db = makeFakeCreditsDb([{ tenant_id: 'spent-tenant', balance: 0 }]);
    credits.setCreditsAdapter(db);
    var granted = await credits.grantFreeTierIfNew('spent-tenant', 10);
    assert.strictEqual(granted, false, 'expected a tenant with an existing balance-0 row to be treated as already-granted, not brand-new');
    assert.strictEqual(await credits.getBalance('spent-tenant'), 0);
  });

  await test('concurrentGrantsApplyExactlyOnce (AC3)', async function() {
    var credits = freshRequire(CREDITS_PATH);
    var db = makeFakeCreditsDb([]);
    credits.setCreditsAdapter(db);
    var results = await Promise.all([
      credits.grantFreeTierIfNew('race-tenant', 10),
      credits.grantFreeTierIfNew('race-tenant', 10)
    ]);
    assert.strictEqual(await credits.getBalance('race-tenant'), 10, 'expected exactly one grant to apply, not 20');
    assert.strictEqual(results.filter(function(r) { return r === true; }).length, 1, 'expected exactly one of the two calls to report a real grant');
  });

  // ===========================================================================
  // AC4 -- GitHub OAuth signup grants free tier
  // ===========================================================================
  await test('githubSignupGrantsFreeTier (AC4)', async function() {
    var credits = freshRequire(CREDITS_PATH);
    var db = makeFakeCreditsDb([]);
    credits.setCreditsAdapter(db);

    var auth = freshRequire(AUTH_PATH);
    auth.setLogger({ info: function() {}, warn: function() {} });
    var oauthAdapter = require(OAUTH_ADAPTER_PATH);
    oauthAdapter.setProviderAdapter(oauthAdapter.gitHubProviderAdapter);

    var origFetch = global.fetch;
    global.fetch = async function(url) {
      if (url.includes('access_token')) return { json: async function() { return tokenSuccessFixture; } };
      if (url.includes('/user')) return { json: async function() { return userIdentityFixture; } };
      return { json: async function() { return {}; } };
    };
    var req = mockAuthReq({ session: { oauthState: 'state-abc' }, query: { code: 'valid-code', state: 'state-abc' } });
    var res = mockAuthRes();
    await auth.handleAuthCallback(req, res);
    global.fetch = origFetch;

    assert.strictEqual(res.statusCode, 302);
    assert.strictEqual(await credits.getBalance(req.session.tenantId), 10);
  });

  // ===========================================================================
  // AC5 -- Google OAuth signup grants free tier
  // ===========================================================================
  await test('googleSignupGrantsFreeTier (AC5)', async function() {
    var credits = freshRequire(CREDITS_PATH);
    var db = makeFakeCreditsDb([]);
    credits.setCreditsAdapter(db);

    var auth = freshRequire(AUTH_PATH);
    auth.setLogger({ info: function() {}, warn: function() {} });
    var oauthAdapter = require(OAUTH_ADAPTER_PATH);
    var MOCK_SUB = 'google-sub-ftcg-s1';
    oauthAdapter.setGoogleUserInfoAdapter(async function() {
      return { sub: MOCK_SUB, email: 'ftcg-s1@example.com', accessToken: 'google-token-ftcg' };
    });

    var req = mockAuthReq({ session: { oauthState: 'state-match' }, query: { code: 'code-xyz', state: 'state-match' } });
    var res = mockAuthRes();
    await auth.handleAuthGoogleCallback(req, res);

    assert.strictEqual(res.statusCode, 302);
    assert.strictEqual(await credits.getBalance(MOCK_SUB), 10);
  });

  // ===========================================================================
  // AC6 -- email/password signup grants free tier
  // ===========================================================================
  await test('emailSignupGrantsFreeTier (AC6)', async function() {
    var credits = freshRequire(CREDITS_PATH);
    var db = makeFakeCreditsDb([]);
    credits.setCreditsAdapter(db);

    var authEmail = freshRequire(AUTH_EMAIL_PATH);
    var { setPasswordAdapter } = require(path.join(ROOT, 'src', 'web-ui', 'modules', 'password'));
    setPasswordAdapter(bcrypt);
    authEmail.setUserDb(mockUserDb([]));
    if (authEmail._clearRateLimits) authEmail._clearRateLimits();

    var req = mockEmailReq({ body: { email: 'ftcg-s1-signup@example.com', password: 'TestPassw0rd!ftcg' } });
    var res = mockEmailRes();
    await authEmail.handleEmailSignup(req, res);

    assert.strictEqual(res.statusCode, 302, 'expected a successful signup redirect, got body: ' + res.body);
    assert.strictEqual(await credits.getBalance('ftcg-s1-signup@example.com'), 10);
  });

  // ===========================================================================
  // AC7 -- returning user via each method: unchanged balance
  // ===========================================================================
  await test('returningGithubUserUnchangedBalance (AC7)', async function() {
    var credits = freshRequire(CREDITS_PATH);
    var db = makeFakeCreditsDb([{ tenant_id: userIdentityFixture.login, balance: 3 }]);
    credits.setCreditsAdapter(db);

    var auth = freshRequire(AUTH_PATH);
    auth.setLogger({ info: function() {}, warn: function() {} });
    var oauthAdapter = require(OAUTH_ADAPTER_PATH);
    oauthAdapter.setProviderAdapter(oauthAdapter.gitHubProviderAdapter);

    var origFetch = global.fetch;
    global.fetch = async function(url) {
      if (url.includes('access_token')) return { json: async function() { return tokenSuccessFixture; } };
      if (url.includes('/user')) return { json: async function() { return userIdentityFixture; } };
      return { json: async function() { return {}; } };
    };
    var req = mockAuthReq({ session: { oauthState: 'state-return' }, query: { code: 'valid-code', state: 'state-return' } });
    var res = mockAuthRes();
    await auth.handleAuthCallback(req, res);
    global.fetch = origFetch;

    assert.strictEqual(await credits.getBalance(userIdentityFixture.login), 3, 'expected the returning user\'s existing balance to be untouched');
  });

  await test('returningGoogleUserUnchangedBalance (AC7)', async function() {
    var credits = freshRequire(CREDITS_PATH);
    var MOCK_SUB = 'google-sub-returning-ftcg-s1';
    var db = makeFakeCreditsDb([{ tenant_id: MOCK_SUB, balance: 3 }]);
    credits.setCreditsAdapter(db);

    var auth = freshRequire(AUTH_PATH);
    auth.setLogger({ info: function() {}, warn: function() {} });
    var oauthAdapter = require(OAUTH_ADAPTER_PATH);
    oauthAdapter.setGoogleUserInfoAdapter(async function() {
      return { sub: MOCK_SUB, email: 'returning-ftcg-s1@example.com', accessToken: 'google-token-returning' };
    });

    var req = mockAuthReq({ session: { oauthState: 'state-match2' }, query: { code: 'code-xyz2', state: 'state-match2' } });
    var res = mockAuthRes();
    await auth.handleAuthGoogleCallback(req, res);

    assert.strictEqual(await credits.getBalance(MOCK_SUB), 3);
  });

  await test('returningEmailUserLoginUnchangedBalance (AC7)', async function() {
    var credits = freshRequire(CREDITS_PATH);
    var db = makeFakeCreditsDb([{ tenant_id: 'returning-email-ftcg@example.com', balance: 3 }]);
    credits.setCreditsAdapter(db);

    var authEmail = freshRequire(AUTH_EMAIL_PATH);
    var { setPasswordAdapter, hashPassword } = require(path.join(ROOT, 'src', 'web-ui', 'modules', 'password'));
    setPasswordAdapter(bcrypt);
    if (authEmail._clearRateLimits) authEmail._clearRateLimits();
    var hash = await hashPassword('TestPassw0rd!ftcg');
    authEmail.setUserDb(mockUserDb([{ id: 'uuid-existing', email: 'returning-email-ftcg@example.com', password_hash: hash }]));

    var req = mockEmailReq({ body: { email: 'returning-email-ftcg@example.com', password: 'TestPassw0rd!ftcg' } });
    var res = mockEmailRes();
    await authEmail.handleEmailLogin(req, res);

    assert.strictEqual(res.statusCode, 302, 'expected a successful login redirect, got body: ' + res.body);
    assert.strictEqual(await credits.getBalance('returning-email-ftcg@example.com'), 3, 'login (not signup) must never invoke the grant at all -- balance stays exactly as seeded');
  });

  // ===========================================================================
  // AC8 -- adapter not wired: signup still succeeds
  // ===========================================================================
  await test('githubSignupSucceedsEvenIfCreditsAdapterThrows (AC8)', async function() {
    var credits = freshRequire(CREDITS_PATH); // fresh, unwired -- requireAdapter() throws

    var auth = freshRequire(AUTH_PATH);
    auth.setLogger({ info: function() {}, warn: function() {} });
    var oauthAdapter = require(OAUTH_ADAPTER_PATH);
    oauthAdapter.setProviderAdapter(oauthAdapter.gitHubProviderAdapter);

    var origFetch = global.fetch;
    global.fetch = async function(url) {
      if (url.includes('access_token')) return { json: async function() { return tokenSuccessFixture; } };
      if (url.includes('/user')) return { json: async function() { return userIdentityFixture; } };
      return { json: async function() { return {}; } };
    };
    var req = mockAuthReq({ session: { oauthState: 'state-nodb' }, query: { code: 'valid-code', state: 'state-nodb' } });
    var res = mockAuthRes();
    await auth.handleAuthCallback(req, res);
    global.fetch = origFetch;

    assert.strictEqual(res.statusCode, 302, 'expected signup to succeed regardless of the credits adapter being unwired');
  });

  await test('googleSignupSucceedsEvenIfCreditsAdapterThrows (AC8)', async function() {
    freshRequire(CREDITS_PATH); // fresh, unwired
    var auth = freshRequire(AUTH_PATH);
    auth.setLogger({ info: function() {}, warn: function() {} });
    var oauthAdapter = require(OAUTH_ADAPTER_PATH);
    oauthAdapter.setGoogleUserInfoAdapter(async function() {
      return { sub: 'google-sub-nodb', email: 'nodb@example.com', accessToken: 'google-token-nodb' };
    });

    var req = mockAuthReq({ session: { oauthState: 'state-nodb2' }, query: { code: 'code-nodb', state: 'state-nodb2' } });
    var res = mockAuthRes();
    await auth.handleAuthGoogleCallback(req, res);

    assert.strictEqual(res.statusCode, 302, 'expected signup to succeed regardless of the credits adapter being unwired');
  });

  await test('emailSignupSucceedsEvenIfCreditsAdapterThrows (AC8)', async function() {
    freshRequire(CREDITS_PATH); // fresh, unwired
    var authEmail = freshRequire(AUTH_EMAIL_PATH);
    var { setPasswordAdapter } = require(path.join(ROOT, 'src', 'web-ui', 'modules', 'password'));
    setPasswordAdapter(bcrypt);
    if (authEmail._clearRateLimits) authEmail._clearRateLimits();
    authEmail.setUserDb(mockUserDb([]));

    var req = mockEmailReq({ body: { email: 'nodb-ftcg@example.com', password: 'TestPassw0rd!ftcg' } });
    var res = mockEmailRes();
    await authEmail.handleEmailSignup(req, res);

    assert.strictEqual(res.statusCode, 302, 'expected signup to succeed regardless of the credits adapter being unwired, got body: ' + res.body);
  });

  console.log('\n[ftcg-s1] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exit(1);
})();
