'use strict';

// tests/check-tiso-s1-reseed-keeps-csrf-token.js -- tiso-s1
// Story: artefacts/2026-11-20-e2e-session-reseed-csrf/stories/tiso-s1-reseed-keeps-csrf-token.md
// Test plan: artefacts/2026-11-20-e2e-session-reseed-csrf/test-plans/tiso-s1-test-plan.md
//
// Every Playwright spec that uses withAuth shares one fixed session id, and each spec's setup
// re-seeds it through seedTestSession. That used to replace the whole stored session, including
// its csrfToken, so a spec already part-way through a flow lost the token its page had embedded
// and its next POST got the plain-text 403 from csrfGuard. A re-seed must keep the CSRF token and
// still reset everything else (a logout, a changed role, any other mutated state).

var assert = require('assert');
var path = require('path');

var passed = 0;
var failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++; console.log('  [PASS] ' + name);
  } catch (err) {
    failed++; console.log('  [FAIL] ' + name + ' -- ' + (err && err.message || err));
  }
}

var session = require(path.resolve(__dirname, '../src/web-ui/middleware/session.js'));

var SEED = { accessToken: 'e2e-test-access-token', userId: 9999, login: 'e2e-tester', tenantId: 'e2e-tester' };
var ID_A = 'e2e' + '0'.repeat(55) + 'a0001';
var ID_B = 'e2e' + '0'.repeat(55) + 'b0001';
var ID_C = 'e2e' + '0'.repeat(55) + 'c0001';

(function() {
  var savedEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'test';
  session._clearForTesting();

  test('T1 (AC1): re-seeding keeps the CSRF token the session already holds, other fields equal the seed', function() {
    session.seedTestSession(ID_A, SEED);
    session.getSession(ID_A).csrfToken = 'token-held-by-a-running-spec';

    session.seedTestSession(ID_A, SEED);

    var s = session.getSession(ID_A);
    assert.strictEqual(s.csrfToken, 'token-held-by-a-running-spec',
      'tiso-s1: a re-seed must keep the CSRF token, or a spec that is mid-flow gets a 403 on its next POST; stored session was ' + JSON.stringify(s));
    assert.strictEqual(s.login, 'e2e-tester');
    assert.strictEqual(s.tenantId, 'e2e-tester');
    assert.strictEqual(s.accessToken, 'e2e-test-access-token');
    assert.strictEqual(s.userId, 9999);
  });

  test('T2 (AC2): re-seeding still resets mutated and extra fields, so only the token survives', function() {
    session.seedTestSession(ID_B, SEED);
    var s = session.getSession(ID_B);
    s.login = 'someone-else';
    s.tenantId = 'e2e-other-tenant';
    s.accessToken = 'changed';
    s.planState = 'paid';
    s.csrfToken = 'kept-token';

    session.seedTestSession(ID_B, SEED);

    var r = session.getSession(ID_B);
    assert.strictEqual(r.login, 'e2e-tester', 'login must be restored');
    assert.strictEqual(r.tenantId, 'e2e-tester', 'tenantId must be restored');
    assert.strictEqual(r.accessToken, 'e2e-test-access-token', 'accessToken must be restored');
    assert.ok(!('planState' in r), 'extra session state must be dropped by a re-seed, got ' + JSON.stringify(r));
    assert.strictEqual(r.csrfToken, 'kept-token', 'the CSRF token is the only thing that survives');
    assert.deepStrictEqual(Object.keys(r).sort(), Object.keys(SEED).concat(['csrfToken']).sort());
  });

  test('T3 (AC3): a new session, or one without a token, is exactly the seed data with no csrfToken key', function() {
    session.seedTestSession(ID_C, SEED);
    var fresh = session.getSession(ID_C);
    assert.deepStrictEqual(fresh, SEED, 'a first seed must be exactly the seed data');
    assert.ok(!('csrfToken' in fresh), 'a first seed must not invent a csrfToken');

    session.seedTestSession(ID_C, SEED);
    var again = session.getSession(ID_C);
    assert.ok(!('csrfToken' in again), 'a re-seed of a session that had no token must not add one');
    assert.deepStrictEqual(again, SEED);
  });

  test('T4 (AC5): outside test mode seedTestSession still throws unless allowOutsideTest is set', function() {
    process.env.NODE_ENV = 'production';
    try {
      assert.throws(function() { session.seedTestSession(ID_A, SEED); }, /only available in NODE_ENV=test/);
      assert.doesNotThrow(function() { session.seedTestSession(ID_A, SEED, { allowOutsideTest: true }); });
    } finally {
      process.env.NODE_ENV = 'test';
    }
  });

  session._clearForTesting();
  if (savedEnv === undefined) { delete process.env.NODE_ENV; } else { process.env.NODE_ENV = savedEnv; }

  console.log('\n[tiso-s1-reseed-keeps-csrf-token] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exit(1);
})();
