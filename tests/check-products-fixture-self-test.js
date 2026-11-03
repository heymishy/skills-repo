'use strict';
const assert = require('assert');

let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log('  ✓ ' + name);
  } catch (err) {
    failed++;
    failures.push({ name, err });
    console.log('  ✗ ' + name + ': ' + err.message);
  }
}

// (a) default session shape matches products.js's real req.session reads
// (tenantId, login, accessToken, userId, plan, impersonation -- confirmed via
// grep -n "req\.session\." src/web-ui/routes/products.js; no role, no csrfToken).
test('productsFixture() default session matches the real fields products.js reads', () => {
  const { productsFixture } = require('./helpers/products-fixture');
  const req = productsFixture();
  assert.strictEqual(req.session.tenantId, 'org-1');
  assert.strictEqual(req.session.login, 'alice');
  assert.strictEqual(req.session.accessToken, 'tok-alice');
  assert.strictEqual(req.session.userId, '1');
  assert.strictEqual(req.session.plan, null);
  assert.strictEqual(req.session.impersonation, null);
  assert.strictEqual(req.session.role, undefined, 'products.js never reads req.session.role');
  assert.strictEqual(req.session.csrfToken, undefined, 'products.js never reads req.session.csrfToken');
});

// (b) two no-args calls return distinct object instances -- no shared mutable state
test('productsFixture() returns a fresh object on every call, not a shared reference', () => {
  const { productsFixture } = require('./helpers/products-fixture');
  const first = productsFixture();
  const second = productsFixture();
  assert.notStrictEqual(first, second, 'two calls must return distinct objects');
  assert.notStrictEqual(first.session, second.session, 'two calls must return distinct session objects');
  first.session.tenantId = 'mutated-by-first-call';
  assert.strictEqual(second.session.tenantId, 'org-1', 'mutating one call\'s session must not affect another call\'s session');
});

// (c) overrides.session merges into (not replaces) the default session
test('productsFixture(overrides) merges a session override without discarding other defaults', () => {
  const { productsFixture } = require('./helpers/products-fixture');
  const req = productsFixture({ session: { tenantId: 'override-value' } });
  assert.strictEqual(req.session.tenantId, 'override-value');
  assert.strictEqual(req.session.login, 'alice', 'login must still be present after a partial override');
  assert.strictEqual(req.session.accessToken, 'tok-alice', 'accessToken must still be present after a partial override');
  assert.strictEqual(req.session.userId, '1', 'userId must still be present after a partial override');
});

console.log('\n── Summary ──');
console.log(`  Passed: ${passed}`);
console.log(`  Failed: ${failed}`);
if (failures.length > 0) {
  console.log('\nFailures:');
  failures.forEach(({ name, err }) => {
    console.log(`  ✗ ${name}`);
    console.log(`      ${err.message}`);
  });
}
if (failed > 0) {
  process.exit(1);
}
