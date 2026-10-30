# Migrate a bounded batch of hand-rolled journey.js test files to the shared fixture — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available) or /tdd per task if executing in this session.

**Goal:** Migrate 4 of the remaining 16 hand-rolled `journey.js`-touching test files to the shared `journeyFixture`/`journeyFixtureRes` module (`tests/helpers/journey-fixture.js`, from `tsir-s1`), preserving every existing assertion unchanged.
**Branch:** `feature/tfhc-s2`
**Worktree:** `.worktrees/tfhc-s2`
**Test command:** `npm test` (full suite) / `node tests/check-<file>.js` (single file) / `node scripts/check-journey-fixture-usage.js <file>` (structural check)

---

## File map

```
Modify:
  tests/check-ep1-s3-journey-backfill.js          — replace local mockReq/mockRes with shared journeyFixture/journeyFixtureRes (2 call sites)
  tests/check-ep1-s4-stage-routing.js              — replace local mockReq/mockRes with shared fixture (3 call sites)
  tests/check-ep1-s5-error-handling.js             — replace local mockReq/mockRes with shared fixture (1 call site)
  tests/check-pan-s1-product-aware-navigation.js   — replace local mockReq/mockRes with shared fixture in IT2 only (1 call site); adapt res.body/res.statusCode property access to res._get().body/.statusCode
```

**Batch selection rationale:** Swept `tests/` with `check-journey-fixture-usage.js`'s own `scanFileForHandRolledFixture` detection function. Found 17 raw matches; excluded `tests/fixtures/tsir-s3-hand-rolled-mockreq.js` (a synthetic non-compliant fixture used by `tsir-s3`'s own self-test, not a real test file) — leaving the 16 real candidates the story expects. Of those 16, excluded `check-jsvr-s1-wire-stage-view-route.js` and `check-ppc-s10-playback-link.js`: both dispatch through the real router with cookie-based `seedTestSession`, a fundamentally different test architecture than direct `req.session` injection — migrating them would risk the same mock-shape mismatch CLAUDE.md's "Mock-shape verification" rule warns about. The 4 chosen files all use direct `req.session` construction and share `journeyFixture`'s default session shape (`accessToken`, `userId`, `login`, `tenantId`) or a subset of it.

**Grounding performed before writing this plan:**
- `src/web-ui/routes/journey.js:593` reads `req.session.role || 'user'` — all 4 files' local mocks omit `role`; `journeyFixture`'s default sets `role: 'user'` explicitly. Same resolved value either way — no behavioural difference.
- `handleGetJourney` (journey.js:416) only reads `req.session`, `req.params`, `req.query` — never `req.headers`, `req.method`, or `req.sessionId`. Safe to drop these fields from `check-pan-s1`'s IT2 call site.
- `generateCsrfToken` (middleware/csrf.js:54) calls `persistSession(req.sessionId)` only when `req.session.csrfToken` is unset — `persistSession` (middleware/session.js:131) no-ops immediately if no Redis adapter is active (none is wired in this test file), so `req.sessionId` being absent is harmless.
- Baseline per-file pass counts captured by running each file now (before any edit): `check-ep1-s3-journey-backfill.js` 10/0, `check-ep1-s4-stage-routing.js` 23/0, `check-ep1-s5-error-handling.js` 8/0, `check-pan-s1-product-aware-navigation.js` 29/0.

---

## Task 1: Capture pre-migration baseline

**Files:** None (verification only — no file changes).

- [ ] **Step 1: Record the full-suite baseline**

```bash
npm test 2>&1 | tail -5
```

**Expected output:** `[run-all-tests] 812 file(s) run, 2 failed` — the 2 known pre-existing failures (`scripts/check-pipeline-state-integrity.js`'s C3 flag, `tests/check-pcr-s1-test-runner.js`'s perf-timing flake), both already RISK-ACCEPTed in `decisions.md` at `/branch-setup (tfhc-s2)`. Record the exact numbers — they are the comparison baseline for Task 6.

- [ ] **Step 2: Record the hand-rolled-file count baseline**

```bash
node -e "
const fs = require('fs');
const path = require('path');
const { scanFileForHandRolledFixture } = require('./scripts/check-journey-fixture-usage.js');
function walk(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) { if (entry.name !== 'node_modules' && entry.name !== '.git') walk(full, out); }
    else if (entry.name.endsWith('.js')) out.push(full);
  }
}
const all = []; walk('tests', all);
const flagged = all.filter(f => scanFileForHandRolledFixture(path.resolve(f)).length > 0);
console.log('Flagged count (raw):', flagged.length);
flagged.forEach(f => console.log(' -', f));
"
```

**Expected output:** `Flagged count (raw): 17` (16 real candidates + `tests/fixtures/tsir-s3-hand-rolled-mockreq.js`, the synthetic fixture — excluded from the real count by inspection, not by this script). Confirm the 4 files in this batch's File map all appear in the printed list.

- [ ] **Step 3: Commit nothing yet — this task only records numbers used by later tasks**

No commit for this task. Carry the recorded numbers forward into Task 6's comparison.

---

## Task 2: Migrate `tests/check-ep1-s3-journey-backfill.js`

**Files:**
- Modify: `tests/check-ep1-s3-journey-backfill.js`

- [ ] **Step 1: Confirm current baseline (already captured above — re-confirm immediately before editing)**

```bash
node tests/check-ep1-s3-journey-backfill.js
```

**Expected output (last line):** `10 passed, 0 failed`

- [ ] **Step 2: Replace the local fixture with the shared one**

Replace:

```javascript
function mockReq(overrides) {
  return Object.assign({
    session: { accessToken: 'tok-alice', userId: '1', login: 'alice', tenantId: 't1' },
    params: {},
    query: {},
    body: {},
    url: '/'
  }, overrides || {});
}

function mockRes() {
  var _statusCode = null;
  var _headers = {};
  var _body = '';
  return {
    writeHead: function (code, headers) { _statusCode = code; _headers = headers || {}; return this; },
    end: function (body) { if (body != null) _body = body; },
    _get: function () { return { statusCode: _statusCode, headers: _headers, body: _body }; }
  };
}
```

with:

```javascript
var journeyFixture = require('./helpers/journey-fixture').journeyFixture;
var journeyFixtureRes = require('./helpers/journey-fixture').journeyFixtureRes;
```

(place the `require` line directly below the existing `var journeyRoutes = require('../src/web-ui/routes/journey');` line, and delete the `mockReq`/`mockRes` function definitions entirely)

Then update the 2 call sites:

```javascript
  var req = mockReq({ params: { featureSlug: 'ep1s3-resume' } });
  var res = mockRes();
```
→
```javascript
  var req = journeyFixture({ params: { featureSlug: 'ep1s3-resume' } });
  var res = journeyFixtureRes();
```

```javascript
  var req = mockReq({ params: { featureSlug: 'ep1s3-genuinely-nowhere' } });
  var res = mockRes();
```
→
```javascript
  var req = journeyFixture({ params: { featureSlug: 'ep1s3-genuinely-nowhere' } });
  var res = journeyFixtureRes();
```

- [ ] **Step 3: Re-run — must still pass with the same count**

```bash
node tests/check-ep1-s3-journey-backfill.js
```

**Expected output (last line):** `10 passed, 0 failed` (unchanged from Step 1)

- [ ] **Step 4: Structural check — AC2**

```bash
node scripts/check-journey-fixture-usage.js tests/check-ep1-s3-journey-backfill.js
```

**Expected output:** `check-journey-fixture-usage PASS: no hand-rolled fixture found in tests/check-ep1-s3-journey-backfill.js`

- [ ] **Step 5: Commit**

```bash
git add tests/check-ep1-s3-journey-backfill.js
git commit -m "refactor(test): migrate check-ep1-s3-journey-backfill.js to shared journey-fixture"
```

---

## Task 3: Migrate `tests/check-ep1-s4-stage-routing.js`

**Files:**
- Modify: `tests/check-ep1-s4-stage-routing.js`

- [ ] **Step 1: Confirm current baseline**

```bash
node tests/check-ep1-s4-stage-routing.js
```

**Expected output (last line):** `23 passed, 0 failed`

- [ ] **Step 2: Replace the local fixture with the shared one**

Replace:

```javascript
function mockReq(overrides) {
  return Object.assign({
    session: { accessToken: 'tok-alice', userId: '1', login: 'alice', tenantId: 't1' },
    params: {}
  }, overrides || {});
}

function mockRes() {
  var _statusCode = null;
  var _body = '';
  return {
    writeHead: function (code) { _statusCode = code; return this; },
    end: function (body) { if (body != null) _body = body; },
    _get: function () { return { statusCode: _statusCode, body: _body }; }
  };
}
```

with:

```javascript
var journeyFixture = require('./helpers/journey-fixture').journeyFixture;
var journeyFixtureRes = require('./helpers/journey-fixture').journeyFixtureRes;
```

(place directly below `var journeyStore = require('../src/web-ui/modules/journey-store');`, delete the two function definitions entirely)

Then update the 3 call sites — each pair:

```javascript
    var req = mockReq({ params: { journeyId: journey.journeyId, stageName: 'discovery' } });
    var res = mockRes();
```
→
```javascript
    var req = journeyFixture({ params: { journeyId: journey.journeyId, stageName: 'discovery' } });
    var res = journeyFixtureRes();
```

(this exact pattern appears twice — once for `ep1s4-confirm-fixture`, once for `ep1s4-confirm-notdone` — update both)

The third call site is in the disk-persistence regression test, which does not use `mockReq`/`mockRes` at all (it calls `journeyStoreForDiskCheck.createJourney(...)` directly) — no change needed there.

- [ ] **Step 3: Re-run — must still pass with the same count**

```bash
node tests/check-ep1-s4-stage-routing.js
```

**Expected output (last line):** `23 passed, 0 failed` (unchanged from Step 1)

- [ ] **Step 4: Structural check — AC2**

```bash
node scripts/check-journey-fixture-usage.js tests/check-ep1-s4-stage-routing.js
```

**Expected output:** `check-journey-fixture-usage PASS: no hand-rolled fixture found in tests/check-ep1-s4-stage-routing.js`

- [ ] **Step 5: Commit**

```bash
git add tests/check-ep1-s4-stage-routing.js
git commit -m "refactor(test): migrate check-ep1-s4-stage-routing.js to shared journey-fixture"
```

---

## Task 4: Migrate `tests/check-ep1-s5-error-handling.js`

**Files:**
- Modify: `tests/check-ep1-s5-error-handling.js`

- [ ] **Step 1: Confirm current baseline**

```bash
node tests/check-ep1-s5-error-handling.js
```

**Expected output (last line):** `8 passed, 0 failed`

- [ ] **Step 2: Replace the local fixture with the shared one**

Replace:

```javascript
function mockReq(overrides) {
  return Object.assign({
    session: { accessToken: 'tok-alice', userId: '1', login: 'alice', tenantId: 't1' },
    params: {}
  }, overrides || {});
}

function mockRes() {
  var _statusCode = null;
  var _body = '';
  return {
    writeHead: function (code) { _statusCode = code; return this; },
    end: function (body) { if (body != null) _body = body; },
    _get: function () { return { statusCode: _statusCode, body: _body }; }
  };
}
```

with:

```javascript
var journeyFixture = require('./helpers/journey-fixture').journeyFixture;
var journeyFixtureRes = require('./helpers/journey-fixture').journeyFixtureRes;
```

(place directly below `var journeyStore = require('../src/web-ui/modules/journey-store');`, delete the two function definitions entirely)

Then update the 1 call site:

```javascript
  var req = mockReq({ params: { featureSlug: 'ep1s5-genuinely-unknown' } });
  var res = mockRes();
```
→
```javascript
  var req = journeyFixture({ params: { featureSlug: 'ep1s5-genuinely-unknown' } });
  var res = journeyFixtureRes();
```

- [ ] **Step 3: Re-run — must still pass with the same count**

```bash
node tests/check-ep1-s5-error-handling.js
```

**Expected output (last line):** `8 passed, 0 failed` (unchanged from Step 1)

- [ ] **Step 4: Structural check — AC2**

```bash
node scripts/check-journey-fixture-usage.js tests/check-ep1-s5-error-handling.js
```

**Expected output:** `check-journey-fixture-usage PASS: no hand-rolled fixture found in tests/check-ep1-s5-error-handling.js`

- [ ] **Step 5: Commit**

```bash
git add tests/check-ep1-s5-error-handling.js
git commit -m "refactor(test): migrate check-ep1-s5-error-handling.js to shared journey-fixture"
```

---

## Task 5: Migrate `tests/check-pan-s1-product-aware-navigation.js`

**Files:**
- Modify: `tests/check-pan-s1-product-aware-navigation.js`

Only the IT2 block uses `mockReq`/`mockRes` with a result that is actually asserted on. `U1`–`U7`, `IT1`, `IT3`, `IT4` do not use these helpers for any assertion that matters here (`IT4` calls `mockRes()` but never reads the result) — leave those untouched.

- [ ] **Step 1: Confirm current baseline**

```bash
node tests/check-pan-s1-product-aware-navigation.js
```

**Expected output (last line):** `29 passed, 0 failed`

- [ ] **Step 2: Add the shared-fixture import**

Add directly below the existing module requires (after `const journeyStore  = require('../src/web-ui/modules/journey-store');`):

```javascript
const { journeyFixture, journeyFixtureRes } = require('./helpers/journey-fixture');
```

Leave the file's own local `mockRes`/`mockReq` function definitions in place — `IT4`'s ad-hoc inline `req` literal and the Unit tests (`U1`–`U7`) do not use them, but `IT4` does call `mockRes()` once without reading the result, so removing the function definitions outright is unnecessary; only the IT2 call site needs to switch to the shared fixture. (If a stricter full removal is preferred, confirm first that no other call site in the file still references `mockReq`/`mockRes` before deleting the definitions — grep the file for `mockReq(` and `mockRes(` and verify only IT2 and IT4's unused call remain.)

Update IT2's call site:

```javascript
    const req = mockReq({ url: '/journey' });
    const res = mockRes();
    await journeyRoute.handleGetJourney(req, res);

    ok(res.body.includes('noproduct a'), 'IT2.1: no-product journey 1 appears in rendered page body');
    ok(res.body.includes('noproduct b'), 'IT2.2: no-product journey 2 appears in rendered page body');
    ok(!res.body.includes('with product a'), 'IT2.3: product-scoped journey 1 does NOT appear');
    ok(!res.body.includes('with product b'), 'IT2.4: product-scoped journey 2 does NOT appear');
```

→

```javascript
    const req = journeyFixture({ url: '/journey' });
    const res = journeyFixtureRes();
    await journeyRoute.handleGetJourney(req, res);
    const result = res._get();

    ok(result.body.includes('noproduct a'), 'IT2.1: no-product journey 1 appears in rendered page body');
    ok(result.body.includes('noproduct b'), 'IT2.2: no-product journey 2 appears in rendered page body');
    ok(!result.body.includes('with product a'), 'IT2.3: product-scoped journey 1 does NOT appear');
    ok(!result.body.includes('with product b'), 'IT2.4: product-scoped journey 2 does NOT appear');
```

- [ ] **Step 3: Re-run — must still pass with the same count**

```bash
node tests/check-pan-s1-product-aware-navigation.js
```

**Expected output (last line):** `29 passed, 0 failed` (unchanged from Step 1)

- [ ] **Step 4: Structural check — AC2**

```bash
node scripts/check-journey-fixture-usage.js tests/check-pan-s1-product-aware-navigation.js
```

**Expected output:** `check-journey-fixture-usage PASS: no hand-rolled fixture found in tests/check-pan-s1-product-aware-navigation.js`

If this still FAILs because the file's own local `mockReq`/`mockRes` function definitions remain (the checker flags their presence, not their use), remove the two now-unused local definitions and re-run this step until it passes — unused dead code is not "preserving test intent," so deletion here is in scope.

- [ ] **Step 5: Commit**

```bash
git add tests/check-pan-s1-product-aware-navigation.js
git commit -m "refactor(test): migrate check-pan-s1-product-aware-navigation.js IT2 to shared journey-fixture"
```

---

## Task 6: Final verification — full regression + hand-rolled count (AC3, AC4)

**Files:** None (verification only).

- [ ] **Step 1: Full regression suite — no new failures**

```bash
npm test 2>&1 | tail -5
```

**Expected output:** `[run-all-tests] 812 file(s) run, 2 failed` — the exact same 2 pre-existing failures recorded in Task 1, Step 1 (`scripts/check-pipeline-state-integrity.js`, `tests/check-pcr-s1-test-runner.js`). Same file count, same failing files, no new failures.

If the numbers differ from Task 1's baseline in any way other than these 2 already-known files: stop, do not commit, investigate the discrepancy as a real regression before proceeding.

- [ ] **Step 2: Hand-rolled count sweep — AC4**

```bash
node -e "
const fs = require('fs');
const path = require('path');
const { scanFileForHandRolledFixture } = require('./scripts/check-journey-fixture-usage.js');
function walk(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) { if (entry.name !== 'node_modules' && entry.name !== '.git') walk(full, out); }
    else if (entry.name.endsWith('.js')) out.push(full);
  }
}
const all = []; walk('tests', all);
const flagged = all.filter(f => scanFileForHandRolledFixture(path.resolve(f)).length > 0);
console.log('Flagged count (raw):', flagged.length);
flagged.forEach(f => console.log(' -', f));
"
```

**Expected output:** `Flagged count (raw): 13` (17 from Task 1, minus the 4 files migrated in Tasks 2–5). Excluding the 1 synthetic fixture file (`tests/fixtures/tsir-s3-hand-rolled-mockreq.js`, always present, not a real candidate), the real count is `13 - 1 = 12` — within AC4's required 11–13 range for a 4-file batch.

- [ ] **Step 3: No commit for this task — verification only**

Carry the confirmed numbers into `/verify-completion`'s AC table.

---

## AC coverage summary

| AC | Covered by |
|----|------------|
| AC1 | Tasks 2–5, Step 3 (each file's own re-run, same pass count) |
| AC2 | Tasks 2–5, Step 4 (`check-journey-fixture-usage.js` clean for each migrated file) |
| AC3 | Task 6, Step 1 (full suite, same 2 pre-existing failures, no new ones) |
| AC4 | Task 6, Step 2 (count drops from 16 to 12, within 11–13) |
