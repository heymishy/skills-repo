'use strict';
/**
 * check-rapp-s1-credits-guard-e2e-bypass.js
 *
 * Unit tests for the credits-guard e2e bypass (rapp-s1 fix-forward), found
 * when fjcv-s1's ideate-first E2E path (12 real turns from one fresh
 * signup) hit ftcg-s1's 10-credit free-tier grant on real staging,
 * returning a genuine 402 and failing the smoke-test job that gates
 * promote-to-prod.
 *
 * Mirrors the exact double-gate pattern every other staging-only test
 * bypass in this codebase already uses (dss-s1, serlb-s1, nis-s1, bjs-s1):
 * a caller-chosen tenantId alone grants nothing -- it must ALSO be
 * unmistakably synthetic (e2e- prefixed) AND the request must carry the
 * matching E2E_STAGING_AUTH_STUB_SECRET header. Both conditions are
 * required so a real user signing up with an e2e--prefixed email gets no
 * benefit from this alone, and the bypass is a no-op everywhere the secret
 * isn't configured (production).
 *
 * Run: node tests/check-rapp-s1-credits-guard-e2e-bypass.js
 */

process.env.NODE_ENV = process.env.NODE_ENV || 'test';

const path = require('path');
const ROOT = path.join(__dirname, '..');

let passed = 0;
let failed = 0;

function check(label, ok) {
  if (ok) { passed++; console.log('  PASS:', label); }
  else    { failed++; console.error('  FAIL:', label); }
}

function mockReqRes(overrides) {
  overrides = overrides || {};
  let _statusCode = null;
  const res = {
    writeHead: function(code) { _statusCode = code; },
    end: function() {},
    getStatus: function() { return _statusCode; }
  };
  const req = Object.assign({
    session: { accessToken: 'tok', tenantId: 'e2e-tester' },
    headers: {}
  }, overrides.req || {});
  return { req, res };
}

function mockCreditsDb(balance) {
  return {
    query: async function(sql) {
      if (sql.includes('SELECT')) return { rows: [{ balance: balance }] };
      return { rows: [] };
    }
  };
}

/** Wires a zero-balance adapter, matching check-lab-s3.3's own convention,
 *  so every test below exercises the bypass path specifically -- a
 *  destructured `const { getBalance } = require(...)` in credits-guard.js
 *  would not see a later reassignment of the module's own export, so the
 *  adapter must be wired via the real setCreditsAdapter() injection point. */
function freshCreditsGuard() {
  const resolved = require.resolve(path.join(ROOT, 'src/web-ui/middleware/credits-guard.js'));
  delete require.cache[resolved];
  const creditsResolved = require.resolve(path.join(ROOT, 'src/web-ui/modules/credits.js'));
  delete require.cache[creditsResolved];
  const mod = require(resolved);
  const credits = require(creditsResolved);
  credits.setCreditsAdapter(mockCreditsDb(0));
  return mod.creditsGuard;
}

(async function() {

  const SECRET = 'rapp-s1-test-secret-value';
  const HEADER = 'x-e2e-test-endpoint-bypass';

  // ── AC1 — e2e- tenant + correct secret header + zero balance → bypassed ──

  await (async function() {
    const envBackup = process.env.E2E_STAGING_AUTH_STUB_SECRET;
    process.env.E2E_STAGING_AUTH_STUB_SECRET = SECRET;
    try {
      const creditsGuard = freshCreditsGuard();
      const { req, res } = mockReqRes({ req: { session: { accessToken: 'tok', tenantId: 'e2e-test-fjcv-s1-123' }, headers: { [HEADER]: SECRET } } });
      let nextCalled = false;
      await creditsGuard(req, res, function() { nextCalled = true; });
      check('AC1: e2e- tenant + correct secret header bypasses a zero balance (next() called)', nextCalled);
      check('AC1: no 402 response when bypass applies', res.getStatus() !== 402);
    } finally {
      process.env.E2E_STAGING_AUTH_STUB_SECRET = envBackup;
    }
  })();

  // ── AC2 — non-e2e tenant + correct secret header → still blocked ─────────

  await (async function() {
    const envBackup = process.env.E2E_STAGING_AUTH_STUB_SECRET;
    process.env.E2E_STAGING_AUTH_STUB_SECRET = SECRET;
    try {
      const creditsGuard = freshCreditsGuard();
      const { req, res } = mockReqRes({ req: { session: { accessToken: 'tok', tenantId: 'a-real-customer-tenant' }, headers: { [HEADER]: SECRET } } });
      let nextCalled = false;
      await creditsGuard(req, res, function() { nextCalled = true; });
      check('AC2: a non-e2e- tenant is never bypassed, even with the correct secret header', !nextCalled);
      check('AC2: 402 still returned for a real tenant with zero balance', res.getStatus() === 402);
    } finally {
      process.env.E2E_STAGING_AUTH_STUB_SECRET = envBackup;
    }
  })();

  // ── AC3 — e2e- tenant + wrong secret header → still blocked ──────────────

  await (async function() {
    const envBackup = process.env.E2E_STAGING_AUTH_STUB_SECRET;
    process.env.E2E_STAGING_AUTH_STUB_SECRET = SECRET;
    try {
      const creditsGuard = freshCreditsGuard();
      const { req, res } = mockReqRes({ req: { session: { accessToken: 'tok', tenantId: 'e2e-test-fjcv-s1-123' }, headers: { [HEADER]: 'wrong-secret-value' } } });
      let nextCalled = false;
      await creditsGuard(req, res, function() { nextCalled = true; });
      check('AC3: a wrong bypass header value is rejected, even for an e2e- tenant', !nextCalled);
      check('AC3: 402 still returned when the header does not match', res.getStatus() === 402);
    } finally {
      process.env.E2E_STAGING_AUTH_STUB_SECRET = envBackup;
    }
  })();

  // ── AC4 — e2e- tenant + header present, but secret unconfigured (prod) ───

  await (async function() {
    const envBackup = process.env.E2E_STAGING_AUTH_STUB_SECRET;
    delete process.env.E2E_STAGING_AUTH_STUB_SECRET;
    try {
      const creditsGuard = freshCreditsGuard();
      const { req, res } = mockReqRes({ req: { session: { accessToken: 'tok', tenantId: 'e2e-test-fjcv-s1-123' }, headers: { [HEADER]: 'anything' } } });
      let nextCalled = false;
      await creditsGuard(req, res, function() { nextCalled = true; });
      check('AC4: with no E2E_STAGING_AUTH_STUB_SECRET configured (production), the bypass is a no-op', !nextCalled);
      check('AC4: 402 still returned when the bypass secret is not configured at all', res.getStatus() === 402);
    } finally {
      if (envBackup === undefined) delete process.env.E2E_STAGING_AUTH_STUB_SECRET;
      else process.env.E2E_STAGING_AUTH_STUB_SECRET = envBackup;
    }
  })();

  // ── AC5 — e2e- tenant, secret configured, but no header sent at all ──────

  await (async function() {
    const envBackup = process.env.E2E_STAGING_AUTH_STUB_SECRET;
    process.env.E2E_STAGING_AUTH_STUB_SECRET = SECRET;
    try {
      const creditsGuard = freshCreditsGuard();
      const { req, res } = mockReqRes({ req: { session: { accessToken: 'tok', tenantId: 'e2e-test-fjcv-s1-123' }, headers: {} } });
      let nextCalled = false;
      await creditsGuard(req, res, function() { nextCalled = true; });
      check('AC5: a real browser request (no bypass header at all) for an e2e- tenant is still blocked', !nextCalled);
      check('AC5: 402 still returned with no header present', res.getStatus() === 402);
    } finally {
      process.env.E2E_STAGING_AUTH_STUB_SECRET = envBackup;
    }
  })();

  // ── AC6 — admin bypass (pre-existing) still takes priority, unaffected ───

  await (async function() {
    const envBackup = process.env.E2E_STAGING_AUTH_STUB_SECRET;
    delete process.env.E2E_STAGING_AUTH_STUB_SECRET;
    try {
      const creditsGuard = freshCreditsGuard();
      const { req, res } = mockReqRes({ req: { session: { accessToken: 'tok', tenantId: 'a-real-customer-tenant', role: 'admin' }, headers: {} } });
      let nextCalled = false;
      await creditsGuard(req, res, function() { nextCalled = true; });
      check('AC6: the pre-existing admin bypass still works, unaffected by this fix', nextCalled);
    } finally {
      if (envBackup === undefined) delete process.env.E2E_STAGING_AUTH_STUB_SECRET;
      else process.env.E2E_STAGING_AUTH_STUB_SECRET = envBackup;
    }
  })();

  console.log('\n=== check-rapp-s1-credits-guard-e2e-bypass results: ' + passed + ' passed, ' + failed + ' failed ===');
  if (failed > 0) process.exit(1);

})();
