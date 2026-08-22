'use strict';
// check-jatg-s1-tenant-access-grant.js
// AC verification for jatg-s1 (AC1, AC2, AC3, AC4's existing-behaviour guards).
// AC5 is covered by re-running the existing, unmodified check-wsm2-collaborative-sessions.js.

const assert = require('assert');
const { requireJourneyAccess, asHttpResponse, POLICY } = require('../src/web-ui/middleware/journey-access.js');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✔ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✖ ${name}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

// ── AC1: same-tenant non-owner under POLICY.TENANT → granted ──────────────────

test('AC1: same-tenant non-owner is granted access under POLICY.TENANT', () => {
  const journey = { ownerId: 'user-A', tenantId: 'acme' };
  const session = { accessToken: 'tok', login: 'user-B', tenantId: 'acme' };
  assert.doesNotThrow(() => requireJourneyAccess(journey, session, POLICY.TENANT));
});

// ── AC2: different-tenant non-owner under POLICY.TENANT → denied, 404 ─────────

test('AC2: different-tenant non-owner is denied (404) under POLICY.TENANT', () => {
  const journey = { ownerId: 'user-A', tenantId: 'acme' };
  const session = { accessToken: 'tok', login: 'user-C', tenantId: 'other-tenant' };
  assert.throws(() => requireJourneyAccess(journey, session, POLICY.TENANT), { code: 'FORBIDDEN' });
  let caught;
  try { requireJourneyAccess(journey, session, POLICY.TENANT); } catch (e) { caught = e; }
  assert.strictEqual(asHttpResponse(caught, POLICY.TENANT), 404);
});

// ── AC3: same-tenant non-owner under POLICY.OWNER → still denied ──────────────

test('AC3: same-tenant non-owner is still denied under POLICY.OWNER', () => {
  const journey = { ownerId: 'user-A', tenantId: 'acme' };
  const session = { accessToken: 'tok', login: 'user-B', tenantId: 'acme' };
  assert.throws(() => requireJourneyAccess(journey, session, POLICY.OWNER), { code: 'FORBIDDEN' });
});

// ── AC4: existing-behaviour regression guards ──────────────────────────────────

test('AC4: the journey owner is still granted access under both policies', () => {
  const journey = { ownerId: 'user-A', tenantId: 'acme' };
  const session = { accessToken: 'tok', login: 'user-A', tenantId: 'acme' };
  assert.doesNotThrow(() => requireJourneyAccess(journey, session, POLICY.TENANT));
  assert.doesNotThrow(() => requireJourneyAccess(journey, session, POLICY.OWNER));
});

test('AC4: an unowned (ownerId null) journey still grants access under POLICY.TENANT', () => {
  const journey = { ownerId: null, tenantId: 'acme' };
  const session = { accessToken: 'tok', login: 'anyone', tenantId: 'other-tenant' };
  assert.doesNotThrow(() => requireJourneyAccess(journey, session, POLICY.TENANT));
});

test('AC4: a null journey still throws NOT_FOUND', () => {
  assert.throws(
    () => requireJourneyAccess(null, { accessToken: 'tok', login: 'x', tenantId: 'acme' }, POLICY.TENANT),
    { code: 'NOT_FOUND' }
  );
});

test('AC4: a missing session still throws UNAUTHENTICATED', () => {
  assert.throws(
    () => requireJourneyAccess({ ownerId: 'user-A', tenantId: 'acme' }, null, POLICY.TENANT),
    { code: 'UNAUTHENTICATED' }
  );
});

test('AC4: a non-owner with NEITHER side having a tenantId is still denied (deny-by-default for ambiguous tenant identity)', () => {
  // This is exactly tests/check-p0.1-journey-access.js's own Test 4 scenario --
  // proving the new grant path requires a POSITIVELY VERIFIED tenant match, not
  // isSameTenant()'s permissive "either side missing -> true" passthrough.
  const journey = { ownerId: 'bob' };
  const session = { accessToken: 'tok-test', userId: '1', login: 'alice' };
  assert.throws(() => requireJourneyAccess(journey, session, POLICY.TENANT), { code: 'FORBIDDEN' });
});

console.log(`\n[jatg-s1] Results: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
