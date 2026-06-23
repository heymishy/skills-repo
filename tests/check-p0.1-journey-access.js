'use strict';
const assert = require('assert');

let requireJourneyAccess, asHttpResponse, isSameTenant, POLICY;
try {
  const m = require('../src/web-ui/middleware/journey-access');
  requireJourneyAccess = m.requireJourneyAccess;
  asHttpResponse = m.asHttpResponse;
  isSameTenant = m.isSameTenant;
  POLICY = m.POLICY;
} catch (e) {
  console.error('FAIL: Cannot load journey-access module:', e.message);
  process.exit(1);
}

const session = { accessToken: 'tok-test', userId: '1', login: 'alice' };

// Test 1 — AC1: legacy journey (ownerId null) passes without error
try {
  requireJourneyAccess({ ownerId: null }, session, POLICY.TENANT);
  console.log('PASS 1: legacy ownerId null — no error');
} catch (e) {
  console.error('FAIL 1: legacy ownerId null should not throw, got:', e);
  process.exitCode = 1;
}

// Test 2 — AC1 variant: legacy journey (ownerId undefined) passes without error
try {
  requireJourneyAccess({ ownerId: undefined }, session, POLICY.TENANT);
  console.log('PASS 2: legacy ownerId undefined — no error');
} catch (e) {
  console.error('FAIL 2: legacy ownerId undefined should not throw, got:', e);
  process.exitCode = 1;
}

// Test 3 — AC2: owner access granted (login === ownerId)
try {
  requireJourneyAccess({ ownerId: 'alice' }, session, POLICY.TENANT);
  console.log('PASS 3: owner access (login === ownerId) — no error');
} catch (e) {
  console.error('FAIL 3: owner access should not throw, got:', e);
  process.exitCode = 1;
}

// Test 4 — AC3: non-owner throws FORBIDDEN
try {
  let threw = false;
  try {
    requireJourneyAccess({ ownerId: 'bob' }, session, POLICY.TENANT);
  } catch (e) {
    threw = true;
    assert.strictEqual(e.code, 'FORBIDDEN', 'expected code FORBIDDEN, got: ' + e.code);
  }
  assert.ok(threw, 'expected FORBIDDEN to be thrown');
  console.log('PASS 4: non-owner throws FORBIDDEN');
} catch (e) {
  console.error('FAIL 4:', e.message);
  process.exitCode = 1;
}

// Test 5 — AC4: no accessToken throws UNAUTHENTICATED
try {
  let threw = false;
  try {
    requireJourneyAccess({ ownerId: 'alice' }, { userId: '1', login: 'alice' }, POLICY.TENANT);
  } catch (e) {
    threw = true;
    assert.strictEqual(e.code, 'UNAUTHENTICATED', 'expected code UNAUTHENTICATED, got: ' + e.code);
  }
  assert.ok(threw, 'expected UNAUTHENTICATED to be thrown');
  console.log('PASS 5: no accessToken throws UNAUTHENTICATED');
} catch (e) {
  console.error('FAIL 5:', e.message);
  process.exitCode = 1;
}

// Test 6 — AC4 variant: null session throws UNAUTHENTICATED
try {
  let threw = false;
  try {
    requireJourneyAccess({ ownerId: 'alice' }, null, POLICY.TENANT);
  } catch (e) {
    threw = true;
    assert.strictEqual(e.code, 'UNAUTHENTICATED', 'expected code UNAUTHENTICATED, got: ' + e.code);
  }
  assert.ok(threw, 'expected UNAUTHENTICATED to be thrown for null session');
  console.log('PASS 6: null session throws UNAUTHENTICATED');
} catch (e) {
  console.error('FAIL 6:', e.message);
  process.exitCode = 1;
}

// Test 7 — AC5: null journey throws NOT_FOUND
try {
  let threw = false;
  try {
    requireJourneyAccess(null, session, POLICY.TENANT);
  } catch (e) {
    threw = true;
    assert.strictEqual(e.code, 'NOT_FOUND', 'expected code NOT_FOUND, got: ' + e.code);
  }
  assert.ok(threw, 'expected NOT_FOUND to be thrown for null journey');
  console.log('PASS 7: null journey throws NOT_FOUND');
} catch (e) {
  console.error('FAIL 7:', e.message);
  process.exitCode = 1;
}

// Test 8 — AC5 variant: undefined journey throws NOT_FOUND
try {
  let threw = false;
  try {
    requireJourneyAccess(undefined, session, POLICY.TENANT);
  } catch (e) {
    threw = true;
    assert.strictEqual(e.code, 'NOT_FOUND', 'expected code NOT_FOUND, got: ' + e.code);
  }
  assert.ok(threw, 'expected NOT_FOUND to be thrown for undefined journey');
  console.log('PASS 8: undefined journey throws NOT_FOUND');
} catch (e) {
  console.error('FAIL 8:', e.message);
  process.exitCode = 1;
}

// Test 9 — AC6: asHttpResponse TENANT + FORBIDDEN → 404
try {
  const status = asHttpResponse({ code: 'FORBIDDEN' }, POLICY.TENANT);
  assert.strictEqual(status, 404, 'TENANT FORBIDDEN should return 404, got: ' + status);
  console.log('PASS 9: asHttpResponse TENANT FORBIDDEN → 404');
} catch (e) {
  console.error('FAIL 9:', e.message);
  process.exitCode = 1;
}

// Test 10 — AC7: asHttpResponse OWNER + FORBIDDEN → 403
try {
  const status = asHttpResponse({ code: 'FORBIDDEN' }, POLICY.OWNER);
  assert.strictEqual(status, 403, 'OWNER FORBIDDEN should return 403, got: ' + status);
  console.log('PASS 10: asHttpResponse OWNER FORBIDDEN → 403');
} catch (e) {
  console.error('FAIL 10:', e.message);
  process.exitCode = 1;
}

// Test 11 — AC8: asHttpResponse UNAUTHENTICATED → 401 (TENANT policy)
try {
  const status = asHttpResponse({ code: 'UNAUTHENTICATED' }, POLICY.TENANT);
  assert.strictEqual(status, 401, 'UNAUTHENTICATED should return 401, got: ' + status);
  console.log('PASS 11: asHttpResponse UNAUTHENTICATED TENANT → 401');
} catch (e) {
  console.error('FAIL 11:', e.message);
  process.exitCode = 1;
}

// Test 12 — AC8 variant: asHttpResponse UNAUTHENTICATED → 401 (OWNER policy)
try {
  const status = asHttpResponse({ code: 'UNAUTHENTICATED' }, POLICY.OWNER);
  assert.strictEqual(status, 401, 'UNAUTHENTICATED should return 401 under OWNER policy, got: ' + status);
  console.log('PASS 12: asHttpResponse UNAUTHENTICATED OWNER → 401');
} catch (e) {
  console.error('FAIL 12:', e.message);
  process.exitCode = 1;
}

// Test 13 — AC9: asHttpResponse NOT_FOUND → 404 (both policies)
try {
  const s1 = asHttpResponse({ code: 'NOT_FOUND' }, POLICY.TENANT);
  const s2 = asHttpResponse({ code: 'NOT_FOUND' }, POLICY.OWNER);
  assert.strictEqual(s1, 404, 'NOT_FOUND TENANT should return 404, got: ' + s1);
  assert.strictEqual(s2, 404, 'NOT_FOUND OWNER should return 404, got: ' + s2);
  console.log('PASS 13: asHttpResponse NOT_FOUND → 404 (both policies)');
} catch (e) {
  console.error('FAIL 13:', e.message);
  process.exitCode = 1;
}

// Test 14 — AC10: isSameTenant both sides absent → true
try {
  const result = isSameTenant({}, {});
  assert.strictEqual(result, true, 'isSameTenant both absent should return true, got: ' + result);
  console.log('PASS 14: isSameTenant both absent → true');
} catch (e) {
  console.error('FAIL 14:', e.message);
  process.exitCode = 1;
}

// Test 15 — AC10 variant: isSameTenant one side has tenantId, other is undefined → true (Phase 0 passthrough)
try {
  const result = isSameTenant({ tenantId: 'org-a' }, { tenantId: undefined });
  assert.strictEqual(result, true, 'isSameTenant one side undefined should return true (Phase 0), got: ' + result);
  console.log('PASS 15: isSameTenant one side undefined → true (Phase 0 passthrough)');
} catch (e) {
  console.error('FAIL 15:', e.message);
  process.exitCode = 1;
}

// Test 16 — AC11: module exports all four named exports
try {
  const m = require('../src/web-ui/middleware/journey-access');
  assert.strictEqual(typeof m.requireJourneyAccess, 'function', 'requireJourneyAccess must be a function');
  assert.strictEqual(typeof m.asHttpResponse, 'function', 'asHttpResponse must be a function');
  assert.strictEqual(typeof m.isSameTenant, 'function', 'isSameTenant must be a function');
  assert.ok(m.POLICY, 'POLICY must be exported');
  assert.strictEqual(m.POLICY.TENANT, 'TENANT', 'POLICY.TENANT must equal "TENANT"');
  assert.strictEqual(m.POLICY.OWNER, 'OWNER', 'POLICY.OWNER must equal "OWNER"');
  console.log('PASS 16: module exports all four named exports');
} catch (e) {
  console.error('FAIL 16:', e.message);
  process.exitCode = 1;
}

if (!process.exitCode) {
  console.log('\nAll 16 tests passed.');
} else {
  console.error('\nSome tests FAILED — see above.');
}
