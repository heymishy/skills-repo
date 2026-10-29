# Add a dedicated self-test for the shared journey.js fixture module — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available) or /tdd per task if executing in this session.

**Goal:** Make every test in the test plan pass. Do not add scope, behaviour, or structure beyond what the tests and ACs specify.
**Branch:** `feature/tsir-s2`
**Worktree:** `.worktrees/tsir-s2`
**Test command:** `npm test` (full suite) / `node tests/check-journey-fixture-self-test.js` (this story's own test)

---

## File map

```
Create:
  tests/check-journey-fixture-self-test.js   — self-test for tests/helpers/journey-fixture.js (AC1, AC3, AC4)
```

**Grounding (re-derived independently, not trusted from tsir-s1's own test):**
`grep -n "req\.session\." src/web-ui/routes/journey.js` confirms the real field set: `login`, `tenantId`, `accessToken`, `userId`, `role` (identity fields — fixture-default concerns) plus `activeFeatureSlug`, `flags`, `impersonation`, `returnTo`, `stageIndex` (route-specific/dynamic, set per-request — not fixture-default concerns, same exclusion `tsir-s1`'s own AC1 already made). This matches `tsir-s1`'s own grounding exactly, confirming it was correct.

---

## Task 1: Build the self-test for the shared fixture module (AC1, AC3, AC4)

**Files:**
- Create: `tests/check-journey-fixture-self-test.js`

- [ ] **Step 1: Write the failing test**

```javascript
// tests/check-journey-fixture-self-test.js
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');

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

// AC1: default session fields independently re-derived from journey.js source
test('journeyFixture() default session includes every identity field journey.js reads (login, tenantId, accessToken, userId, role)', () => {
  const { journeyFixture } = require('./helpers/journey-fixture');
  const req = journeyFixture();
  ['login', 'tenantId', 'accessToken', 'userId', 'role'].forEach((field) => {
    assert.ok(req.session[field] !== undefined && req.session[field] !== null, `session.${field} must be defined`);
  });
});

// AC4: overrides merge correctly
test('journeyFixture(overrides) merges an override without discarding other defaults', () => {
  const { journeyFixture } = require('./helpers/journey-fixture');
  const req = journeyFixture({ session: { tenantId: 'override-value' } });
  assert.strictEqual(req.session.tenantId, 'override-value');
  assert.ok(req.session.login, 'login must still be present after a partial override');
  assert.ok(req.session.accessToken, 'accessToken must still be present after a partial override');
  assert.ok(req.session.role, 'role must still be present after a partial override');
});

// AC3: structural check -- no network, no fs writes, no module-level shared state
test('journey-fixture.js source contains no network calls, filesystem writes, or shared mutable module state', () => {
  const source = fs.readFileSync(path.join(__dirname, 'helpers', 'journey-fixture.js'), 'utf8');
  assert.ok(!/require\(['"]https?['"]\)/.test(source), 'must not require http/https');
  assert.ok(!/fs\.writeFile/.test(source), 'must not write to the filesystem');
  // Module-level `var`/`let` outside any function body would be shared mutable
  // state across calls -- the real implementation only declares functions and
  // module.exports at the top level, no bare var/let assignment.
  const topLevelAssignment = /^(var|let)\s+\w+\s*=\s*(?!function)/m;
  assert.ok(!topLevelAssignment.test(source), 'must not declare shared mutable state at module level');
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

- [ ] **Step 2: Run test — must pass immediately (the module under test already exists from tsir-s1)**

```bash
node tests/check-journey-fixture-self-test.js
```

Expected output: `Passed: 3`, `Failed: 0`. (Note: unlike a typical RED→GREEN cycle, this test is written AFTER its subject already exists — `tests/helpers/journey-fixture.js` shipped in `tsir-s1`. Per `.github/standards/testing/test-design-patterns.md`'s own discipline, a test that passes on first run without ever failing hasn't yet proven it would catch a real regression — that's exactly what Step 3 (the manual mutation-test) exists to prove, separately, for AC2.)

- [ ] **Step 3: Manual mutation-test proof (AC2 — not a committed test, see test plan's Coverage gaps)**

1. Open `tests/helpers/journey-fixture.js` and temporarily change `tenantId: 't1'` to `tenantId: ''` in `defaultSession`.
2. Run: `node tests/check-journey-fixture-self-test.js` — expect a failure (Test 1 above should fail, since `''` is still a defined truthy-checked value... **note:** Test 1 only asserts `!== undefined && !== null`, which `''` still satisfies. Instead: use `node -e "const {journeyFixture}=require('./tests/helpers/journey-fixture'); console.log(journeyFixture().session.tenantId === '')"` after the change to directly observe the regression (prints `true`), proving the self-test's own narrower scope (identity fields are *present*, not that they're *non-empty* — that stronger check is `tsir-s1`'s own AC3 test, already covering this exact collision class separately). This is the real finding from doing the mutation-test honestly: AC1's assertion and AC3's assertion (in `tsir-s1`) are complementary, not redundant — document this in the PR notes.
3. Revert the change — confirm via `git diff tests/helpers/journey-fixture.js` shows no leftover diff.
4. Run `node tests/check-journey-fixture-self-test.js` again — confirm it passes, `Passed: 3, Failed: 0`.

- [ ] **Step 4: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing except the pre-existing acknowledged `tests/check-pcr-s1-test-runner.js` flake (RISK-ACCEPT logged in `decisions.md` at this story's own `/branch-setup`) — no NEW failures.

- [ ] **Step 5: Commit**

```bash
git add tests/check-journey-fixture-self-test.js
git commit -m "test(tsir-s2): add dedicated self-test for the shared journey.js fixture module"
```
