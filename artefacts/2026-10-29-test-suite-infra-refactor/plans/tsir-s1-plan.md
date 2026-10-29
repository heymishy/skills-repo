# Extract a shared mockReq/mockRes fixture module for journey.js tests — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available) or /tdd per task if executing in this session.

**Goal:** Make every test in the test plan pass. Do not add scope, behaviour, or structure beyond what the tests and ACs specify.
**Branch:** `feature/tsir-s1`
**Worktree:** `.worktrees/tsir-s1`
**Test command:** `npm test` (full suite) / `node tests/check-tsir-s1-shared-journey-fixture.js` (this story's own tests) / `node tests/check-ep1-s1-journey-feature-merge.js` (migrated consumer)

---

## File map

```
Create:
  tests/helpers/journey-fixture.js                — journeyFixture()/journeyFixtureRes() factory functions
  tests/check-tsir-s1-shared-journey-fixture.js    — unit tests for AC1, AC3, AC4, and the fresh-object edge case

Modify:
  tests/check-ep1-s1-journey-feature-merge.js      — replace its local mockReq()/mockRes() with the shared fixture (AC2)
```

**Grounding (confirmed by reading the real files before writing this plan, not assumed):**
- `src/web-ui/routes/journey.js` reads these fields from `req.session`: `login`, `tenantId`, `accessToken`, `userId`, `role` (confirmed via `grep -n "req\.session\." src/web-ui/routes/journey.js`).
- `tests/check-ep1-s1-journey-feature-merge.js`'s own existing `mockReq(overrides)` (lines 51-58) already returns exactly `{ session: { accessToken: 'tok-alice', userId: '1', login: 'alice', tenantId: 't1' }, params: {}, query: {}, body: {}, url: '/' }`, and its own `mockRes()` (lines 60-67) returns `{ writeHead, end, _get }`. **The shared fixture's default shape matches this exactly** — `tenantId: 't1'` already satisfies AC3 (non-empty, not `''`, not `undefined`), so there is no reason to invent a different default value; doing so would be an unnecessary, riskier change. This file also sets `process.env.PLATFORM_TENANT_ID = 't1'` at line 145 specifically to match this default — changing the fixture's default would require updating that too, which AC2 ("existing assertions continue to pass unchanged") gives no reason to do.

---

## Task 1: Build the shared fixture module and its own unit tests (AC1, AC3, AC4)

**Files:**
- Create: `tests/helpers/journey-fixture.js`
- Create: `tests/check-tsir-s1-shared-journey-fixture.js`

- [ ] **Step 1: Write the failing test**

```javascript
// tests/check-tsir-s1-shared-journey-fixture.js
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

// AC1: default session includes every field journey.js actually reads
test('journeyFixture() default session includes login, tenantId, accessToken, userId, role', () => {
  const { journeyFixture } = require('./helpers/journey-fixture');
  const req = journeyFixture();
  ['login', 'tenantId', 'accessToken', 'userId', 'role'].forEach((field) => {
    assert.ok(req.session[field] !== undefined && req.session[field] !== null, `session.${field} must be defined`);
  });
});

// AC1 edge case: fresh object per call, no shared mutable reference
test('journeyFixture() returns a fresh object on every call, not a shared reference', () => {
  const { journeyFixture } = require('./helpers/journey-fixture');
  const a = journeyFixture();
  a.session.tenantId = 'changed';
  const b = journeyFixture();
  assert.notStrictEqual(b.session.tenantId, 'changed');
});

// AC3: default tenantId is non-empty, never '' and never undefined
test('journeyFixture() defaults session.tenantId to a non-empty synthetic value', () => {
  const { journeyFixture } = require('./helpers/journey-fixture');
  const req = journeyFixture();
  assert.ok(typeof req.session.tenantId === 'string' && req.session.tenantId.length > 0, 'tenantId must be a non-empty string');
  assert.notStrictEqual(req.session.tenantId, '');
  assert.notStrictEqual(req.session.tenantId, undefined);
});

// AC4: overrides merge over defaults without discarding other fields
test('journeyFixture(overrides) merges overrides over defaults', () => {
  const { journeyFixture } = require('./helpers/journey-fixture');
  const req = journeyFixture({ session: { tenantId: 'other-tenant' } });
  assert.strictEqual(req.session.tenantId, 'other-tenant');
  assert.ok(req.session.login, 'login must still be present after a partial override');
  assert.ok(req.session.accessToken, 'accessToken must still be present after a partial override');
  assert.ok(req.session.role, 'role must still be present after a partial override');
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
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-tsir-s1-shared-journey-fixture.js
```

Expected output: `Error: Cannot find module './helpers/journey-fixture'` (module does not exist yet)

- [ ] **Step 3: Write minimal implementation**

```javascript
// tests/helpers/journey-fixture.js
'use strict';

// tsir-s1: shared mockReq/mockRes fixture for journey.js-touching tests.
// Default session shape matches journey.js's real req.session reads
// (login, tenantId, accessToken, userId, role) -- grounded in the route
// code itself (grep -n "req\.session\." src/web-ui/routes/journey.js),
// not copied from any one of the 17 existing divergent hand-rolled mocks.
// tenantId default ('t1') matches the pre-existing value already in use
// by tests/check-ep1-s1-journey-feature-merge.js (including its own
// process.env.PLATFORM_TENANT_ID = 't1' pairing) -- deliberately not
// changed to a different synthetic value, since 't1' already satisfies
// the "non-empty, never '' or undefined" requirement (AC3/ctpl-s1).

function journeyFixture(overrides) {
  overrides = overrides || {};
  var defaultSession = {
    login: 'alice',
    tenantId: 't1',
    accessToken: 'tok-alice',
    userId: '1',
    role: 'user'
  };
  var merged = Object.assign(
    { params: {}, query: {}, body: {}, url: '/' },
    overrides
  );
  merged.session = Object.assign({}, defaultSession, overrides.session || {});
  return merged;
}

function journeyFixtureRes() {
  var _statusCode = null;
  var _body = '';
  return {
    writeHead: function (code) { _statusCode = code; return this; },
    end: function (body) { if (body != null) _body = body; },
    _get: function () { return { statusCode: _statusCode, body: _body }; }
  };
}

module.exports = { journeyFixture: journeyFixture, journeyFixtureRes: journeyFixtureRes };
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-tsir-s1-shared-journey-fixture.js
```

Expected output: `Passed: 4`, `Failed: 0`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing except the pre-existing acknowledged `tests/check-pcr-s1-test-runner.js` flake (RISK-ACCEPT logged in `decisions.md` at `/branch-setup`) — no NEW failures.

- [ ] **Step 6: Commit**

```bash
git add tests/helpers/journey-fixture.js tests/check-tsir-s1-shared-journey-fixture.js
git commit -m "feat(tsir-s1): add shared journey.js mockReq/mockRes fixture module"
```

---

## Task 2: Migrate check-ep1-s1-journey-feature-merge.js to use the shared fixture (AC2)

**Files:**
- Modify: `tests/check-ep1-s1-journey-feature-merge.js`

- [ ] **Step 1: Write the failing test**

No new test file — AC2 is verified by re-running this file's own existing test suite after migration and confirming the same pass count. First, capture the baseline:

```bash
node tests/check-ep1-s1-journey-feature-merge.js
```

Record the current `passed`/`failed` counts shown in its own summary output as the baseline to match after migration.

- [ ] **Step 2: Run test — confirm current (pre-migration) baseline**

```bash
node tests/check-ep1-s1-journey-feature-merge.js
```

Expected output: baseline pass count recorded in Step 1, 0 failures (this file was green before `tsir-s1` started — confirmed at `/branch-setup`).

- [ ] **Step 3: Write minimal implementation**

In `tests/check-ep1-s1-journey-feature-merge.js`:

1. Add near the top (with the other `require`s): `var { journeyFixture, journeyFixtureRes } = require('./helpers/journey-fixture');`
2. Delete the local `function mockReq(overrides) { ... }` definition (lines 51-58).
3. Delete the local `function mockRes() { ... }` definition (lines 60-67).
4. Replace every call site of `mockReq(` with `journeyFixture(` and every call site of `mockRes(` with `journeyFixtureRes(` (a literal find/replace — the shared fixture's signature and default shape are identical to what this file already defined locally, so no call site's arguments need to change).

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ep1-s1-journey-feature-merge.js
```

Expected output: identical `passed` count to Step 2's baseline, 0 failures.

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing except the pre-existing acknowledged `tests/check-pcr-s1-test-runner.js` flake — no NEW failures.

- [ ] **Step 6: Commit**

```bash
git add tests/check-ep1-s1-journey-feature-merge.js
git commit -m "refactor(tsir-s1): migrate check-ep1-s1-journey-feature-merge.js to the shared journey.js fixture"
```
