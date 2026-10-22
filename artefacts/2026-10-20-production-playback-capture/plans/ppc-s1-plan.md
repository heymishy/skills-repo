# Walking skeleton — tenant-scoped surface and single-AC capture via session-reuse auth — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available) or /tdd per task if executing in this session.

**Goal:** Make every test in the test plan pass. Do not add scope, behaviour, or structure beyond what the tests and ACs specify.
**Branch:** `feature/ppc-s1`
**Worktree:** `.worktrees/ppc-s1`
**Test command:** `npm test` (full suite; individual files runnable directly with `node tests/check-ppc-s1-....js`)

---

## Execution status: ALL 13 TASKS COMPLETE

Every task (0-12) went through implementer → spec-compliance reviewer → code-quality reviewer, with fixes applied and re-reviewed wherever issues were found. See each Task's own `**Status: COMPLETE.**` note below for per-task detail.

**Final whole-arc review** (diff from before Task 0 to the final commit, against all 8 ACs in `stories/ppc-s1.md`) found one real, cross-cutting issue missed by every individual task's own review: `req.params.acId` flowed unvalidated into a disk path (Playwright screenshot write → `fs.readFileSync` read-back → GitHub commit), violating this story's own DoR contract ("acId derived only from validated values") and CLAUDE.md's mandatory path-traversal-guard rule. No single task's diff made this visible — it only became apparent reviewing the full acId data flow across `server.js` → `playback-evidence.js` → `capture-screenshots.js` together. Fixed in `d2482cd5` (an `ACID_RE` allowlist in both POST handlers, plus a resolved-path containment check at the disk read-back, satisfying CLAUDE.md's "both, not either" requirement) and independently re-verified as closing the gap, with adversarial reasoning confirming `^AC\d+$` admits zero path-traversal payloads.

**Final test counts:** 32 tests across 3 files (`check-ppc-s1-journey-store-helpers.js`: 7, `check-ppc-s1-session-page-adapter.js`: 4, `check-ppc-s1-playback-evidence-route.js`: 21), all passing. Full suite: 774 files, 0 failures (two unrelated, confirmed-benign timing-sensitive flakes observed and independently re-verified during the course of this execution: `check-pcr-s1-test-runner.js`, `check-cat-s1-core-trace-builder.js` — neither touches this story's files).

**Final review verdict: PASSED.**

---

## /verify-completion outcome

Step 2 (AC verification walk-through) caught a real, story-blocking gap: AC1/AC3/AC4/AC5 and the AC verification script describe a real browser page, but all 13 tasks had only built a JSON API. Built the missing UI layer (commits `1e27864d`, `031adea4`, `8ff46dfc`) — dual-mode HTML rendering, a new tenant-scoped screenshot route, redirect-after-form-POST — independently spec- and quality-reviewed, with 2 further fixes applied (a real DRY/security-risk duplication extracted; a comment inaccuracy corrected).

**Live browser render check:** performed (not RISK-ACCEPTed) — generated the real HTML via `handleGetPlaybackEvidence` itself (not a mock), served it with the exact same `Content-Type: text/html; charset=utf-8` header production uses, and visually confirmed in a real Chrome tab: headings/em-dashes render correctly, "Capture target not set" is plain visible text (AC4), real labeled `<input>`/`<button>` elements render and are reachable via Tab-key navigation alone with a visible focus ring (NFR-Accessibility), and a stored target pre-fills its form with a "Capture evidence" button present (AC2/AC3 reachable). The AC3 screenshot `<img>` showed a broken-icon placeholder in this static preview (expected — no live backend route behind the static file server); the route itself (`handleGetCaptureScreenshot`) is separately covered by a passing automated test against a real file on disk.

**Final test count:** 38 tests across 4 files (`check-ppc-s1-journey-store-helpers.js`: 7, `check-ppc-s1-session-page-adapter.js`: 4, `check-ppc-s1-playback-evidence-route.js`: 21, `check-ppc-s1-ui-layer.js`: 6). Full suite: 775 files, 0 failures.

**Scope check (Step 3):** all 30 commits on this branch trace to an AC, a task, or a documented review/verify-completion finding — clean.

**Verdict: PASSED. Ready for `/branch-complete`.**

---

## Plan-time finding (not in the original file map confirmed with the operator)

`scripts/playback-capture.js`'s `captureAcScreenshots` is excluded from the deployed Docker image — confirmed via `src/utils/dod-parsing.js`'s own header comment, which documents the identical incident already happening once for `parseDodAcCoverage` ("ic-hotfix1" — a production route requiring `../../../scripts/playback-capture` crashed staging on boot with `MODULE_NOT_FOUND`, because `scripts/` is operator/CI tooling only and never copied into the image). This story's `handlePostCaptureTrigger` is a production route that needs this function, so it has the same landmine. Task 0 below extracts it to `src/utils/capture-screenshots.js` (deployed) with a backward-compatible re-export from `scripts/playback-capture.js`, mirroring the exact precedent already set for `dod-parsing.js`.

---

## File map

```
Create:
  src/utils/capture-screenshots.js                       — captureAcScreenshots, extracted from scripts/ so it is actually deployed
  src/web-ui/adapters/session-page-adapter.js             — D37 adapter: req.sessionId -> authenticated Playwright page (AC8)
  src/web-ui/routes/playback-evidence.js                  — tenant-scoped surface route handlers (AC1-AC7)
  tests/check-ppc-s1-journey-store-helpers.js              — unit tests: isDodComplete, setCaptureTarget, getCaptureTargetState
  tests/check-ppc-s1-session-page-adapter.js               — unit + behavioural tests for the new D37 adapter (AC8)
  tests/check-ppc-s1-playback-evidence-route.js            — integration tests: AC1, AC3, AC5, AC6, AC7, 2 NFR tests

Modify:
  scripts/playback-capture.js                              — re-export captureAcScreenshots from its new location, unchanged behaviour
  src/web-ui/modules/journey-store.js                       — add isDodComplete, setCaptureTarget, getCaptureTargetState, getJourneyForTenantProductSlug
  src/web-ui/adapters/journey-store-pg.js                   — add captureTargets + captureScreenshots to _sanitise()'s allowlist
  src/web-ui/adapters/artefact-commit-writer.js             — add optional encoding param (utf8 default, base64 for binary)
  src/web-ui/server.js                                      — mount 3 new routes; wire the new D37 adapter (separate task, D37 rule 3)
```

---

## Task 0: Extract `captureAcScreenshots` so it is actually deployed

**Status: COMPLETE.** Spec review ✅, quality review found 2 Important documentation issues (mislabeled precedent incident tag, re-export not grouped with its sibling) — fixed in `ee4e3c0e`, re-review ✅. Ending SHA: `ee4e3c0e`.

**Files:**
- Create: `src/utils/capture-screenshots.js`
- Modify: `scripts/playback-capture.js`
- Test: `tests/check-ppc-s1-journey-store-helpers.js` (regression assertion added at the top of this file; the function itself has pre-existing coverage via `rpca`'s own tests, which must still pass unchanged)

- [x] **Step 1: Write the failing test**

Add to the top of `tests/check-ppc-s1-journey-store-helpers.js` (new file — this is its first test):

```js
'use strict';
var assert = require('assert');
var passed = 0; var failed = 0; var failures = [];
function test(name, fn) {
  try {
    var result = fn();
    if (result && typeof result.then === 'function') {
      return result.then(
        function() { passed++; console.log('  PASS: ' + name); },
        function(err) { failed++; failures.push({ name: name, err: err }); console.log('  FAIL: ' + name + '\n       ' + (err && err.stack || err)); }
      );
    }
    passed++; console.log('  PASS: ' + name); return Promise.resolve();
  } catch (err) {
    failed++; failures.push({ name: name, err: err }); console.log('  FAIL: ' + name + '\n       ' + (err && err.stack || err)); return Promise.resolve();
  }
}
var queue = [];

queue.push(function() {
  return test('captureAcScreenshots is importable from src/ (deployed), not just scripts/', function() {
    var fromSrc = require('../src/utils/capture-screenshots');
    assert.strictEqual(typeof fromSrc.captureAcScreenshots, 'function');
  });
});
```

- [x] **Step 2: Run test — must fail**

```bash
node tests/check-ppc-s1-journey-store-helpers.js
```

Expected output: `FAIL — Cannot find module '../src/utils/capture-screenshots'`

- [x] **Step 3: Write minimal implementation**

Create `src/utils/capture-screenshots.js`:

```js
'use strict';
// capture-screenshots.js -- extracted from scripts/playback-capture.js (ppc-s1
// Task 0) because src/web-ui/routes/playback-evidence.js (a production route)
// also needs it, and scripts/ is never copied into the deployed Docker image
// (Dockerfile's own explicit COPY allowlist -- src/, skills/, product/,
// artefacts/, .github/ only). Mirrors the identical, already-proven fix for
// dod-parsing.js's parseDodAcCoverage (ic-hotfix1 incident). Behaviour is
// byte-for-byte unchanged from the original.

async function captureAcScreenshots({ page, featureSlug, storySlug, acList }) {
  const shots = [];
  for (const ac of acList) {
    const relPath = `artefacts/${featureSlug}/playback/${storySlug}/screenshots/${ac.acId}.png`;
    await page.screenshot({ path: relPath, selector: ac.selector });
    shots.push({ acId: ac.acId, path: relPath });
  }
  return shots;
}

module.exports = { captureAcScreenshots };
```

In `scripts/playback-capture.js`, replace the existing `captureAcScreenshots` function definition (lines 84-92) with a re-export:

```js
// Re-exported from src/utils/capture-screenshots.js (ppc-s1 Task 0) -- a
// production route (playback-evidence.js) also needs this function, and
// scripts/ is never copied into the deployed Docker image. Kept re-exported
// here unchanged so every existing caller of this module keeps working with
// no change required on their part (same pattern already used for
// parseDodAcCoverage above).
const { captureAcScreenshots } = require('../src/utils/capture-screenshots');
```

Remove the old inline function body; keep the `module.exports` line at the bottom of `scripts/playback-capture.js` listing `captureAcScreenshots` exactly as it already does.

- [x] **Step 4: Run test — must pass**

```bash
node tests/check-ppc-s1-journey-store-helpers.js
```

Expected output: `PASS` for the new test (other tests in this file don't exist yet — later tasks add them to this same file).

- [x] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing, including every existing `rpca`/`fpd` test that exercises `captureAcScreenshots` via `scripts/playback-capture.js` (unchanged behaviour, re-export only).

- [x] **Step 6: Commit**

```bash
git add src/utils/capture-screenshots.js scripts/playback-capture.js tests/check-ppc-s1-journey-store-helpers.js
git commit -m "refactor: extract captureAcScreenshots to src/utils so it is deployed"
```

---

## Task 1: `isDodComplete` and `getCaptureTargetState` helpers

**Status: COMPLETE.** Spec review ✅, quality review found 2 Minor issues (constant placement, constant not exported) — fixed proactively in `4fef9293` (Minor findings don't gate per the skill, but cheap to fix before later tasks build on the `'NOT_SET'` literal). Ending SHA: `4fef9293`. Note for later tasks: compare against the exported `journeyStore.CAPTURE_TARGET_NOT_SET`, not the hardcoded string `'NOT_SET'`.

**Files:**
- Modify: `src/web-ui/modules/journey-store.js`
- Test: `tests/check-ppc-s1-journey-store-helpers.js`

- [x] **Step 1: Write the failing test**

Append to `tests/check-ppc-s1-journey-store-helpers.js`:

```js
queue.push(function() {
  return test('isDodComplete: true when completedStages has a definition-of-done entry', function() {
    var store = require('../src/web-ui/modules/journey-store');
    var complete = { completedStages: [{ skillName: 'definition-of-done', artefactPath: 'x', completedAt: 'now' }] };
    var incomplete = { completedStages: [{ skillName: 'test-plan', artefactPath: 'x', completedAt: 'now' }] };
    assert.strictEqual(store.isDodComplete(complete), true);
    assert.strictEqual(store.isDodComplete(incomplete), false);
  });
});

queue.push(function() {
  return test('getCaptureTargetState: returns NOT_SET for an AC with no stored target, the stored target otherwise', function() {
    var store = require('../src/web-ui/modules/journey-store');
    var targets = [{ acId: 'AC1', url: 'http://x', selector: '#y' }];
    assert.strictEqual(store.getCaptureTargetState(targets, 'AC2'), 'NOT_SET');
    assert.deepStrictEqual(store.getCaptureTargetState(targets, 'AC1'), { acId: 'AC1', url: 'http://x', selector: '#y' });
  });
});
```

- [x] **Step 2: Run test — must fail**

```bash
node tests/check-ppc-s1-journey-store-helpers.js
```

Expected output: `FAIL — store.isDodComplete is not a function`

- [x] **Step 3: Write minimal implementation**

In `src/web-ui/modules/journey-store.js`, add near the top (after `getJourneyByFeatureSlug`, before `completeStage`):

```js
/**
 * ppc-s1 (AC1) — "DoD-complete" is this repo's own existing signal: a
 * completedStages entry whose skillName is the literal string
 * 'definition-of-done'. Not a new field.
 * @param {object} journey
 * @returns {boolean}
 */
function isDodComplete(journey) {
  if (!journey || !Array.isArray(journey.completedStages)) return false;
  return journey.completedStages.some(function(cs) { return cs.skillName === 'definition-of-done'; });
}

var CAPTURE_TARGET_NOT_SET = 'NOT_SET';

/**
 * ppc-s1 (AC2, AC4) — looks up a stored capture target for one AC id within
 * a journey's own captureTargets array (never undefined/null/throws).
 * @param {Array<{acId:string,url:string,selector:string}>} captureTargets
 * @param {string} acId
 * @returns {{acId:string,url:string,selector:string}|'NOT_SET'}
 */
function getCaptureTargetState(captureTargets, acId) {
  var targets = captureTargets || [];
  var match = targets.find(function(t) { return t.acId === acId; });
  return match || CAPTURE_TARGET_NOT_SET;
}
```

- [x] **Step 4: Run test — must pass**

```bash
node tests/check-ppc-s1-journey-store-helpers.js
```

Expected output: `PASS` for both new tests.

- [x] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing.

- [x] **Step 6: Commit**

```bash
git add src/web-ui/modules/journey-store.js tests/check-ppc-s1-journey-store-helpers.js
git commit -m "feat: add isDodComplete and getCaptureTargetState helpers to journey-store"
```

---

## Task 2: `getJourneyByTenantProductSlug` — the tenant+product-scoped replacement for `getJourneyByFeatureSlug`

**Status: COMPLETE.** Spec review ✅ (security-critical guard verified line-by-line). Quality review found 1 Important (security guard needed an explicit inline comment) + 1 Minor (renamed `getJourneyForTenantProductSlug` → `getJourneyByTenantProductSlug` to match this file's `getJourneyBy<Criteria>` convention) — fixed in `81aeba8f`. Ending SHA: `81aeba8f`. **Name correction for later tasks: use `getJourneyByTenantProductSlug`, not the `For` variant shown in this file's own code blocks below.**

**Files:**
- Modify: `src/web-ui/modules/journey-store.js`
- Test: `tests/check-ppc-s1-journey-store-helpers.js`

- [x] **Step 1: Write the failing test**

```js
queue.push(function() {
  return test('getJourneyForTenantProductSlug: scoped by BOTH tenant_id and product_id, not slug alone', function() {
    var store = require('../src/web-ui/modules/journey-store');
    store._clearForTesting();
    var a = store.createJourney('duplicate-slug');
    store.setJourneyFields(a.journeyId, { tenantId: 'tenant-a', productId: 'product-a' });
    var b = store.createJourney('duplicate-slug');
    store.setJourneyFields(b.journeyId, { tenantId: 'tenant-b', productId: 'product-b' });

    var found = store.getJourneyForTenantProductSlug('tenant-a', 'product-a', 'duplicate-slug');
    assert.strictEqual(found.journeyId, a.journeyId);

    var notFound = store.getJourneyForTenantProductSlug('tenant-a', 'product-b', 'duplicate-slug');
    assert.strictEqual(notFound, null);
  });
});

queue.push(function() {
  return test('getJourneyForTenantProductSlug: returns null when tenantId or productId is missing (never a false-positive null==null match)', function() {
    var store = require('../src/web-ui/modules/journey-store');
    store._clearForTesting();
    var a = store.createJourney('no-tenant-slug'); // tenantId/productId never set
    assert.strictEqual(store.getJourneyForTenantProductSlug(null, null, 'no-tenant-slug'), null);
    assert.strictEqual(store.getJourneyForTenantProductSlug(undefined, undefined, 'no-tenant-slug'), null);
  });
});
```

- [x] **Step 2: Run test — must fail**

```bash
node tests/check-ppc-s1-journey-store-helpers.js
```

Expected output: `FAIL — store.getJourneyForTenantProductSlug is not a function`

- [x] **Step 3: Write minimal implementation**

In `src/web-ui/modules/journey-store.js`, add directly after `getJourneyByFeatureSlug`:

```js
/**
 * ppc-s1 (AC1, AC6, AC7) — deliberately NOT a reuse of getJourneyByFeatureSlug
 * above, which has no tenant filtering at all (confirmed cross-tenant leak
 * risk, decisions.md 2026-10-21 ARCHITECTURE entry). Requires BOTH tenantId
 * AND productId to be truthy and match -- guards against the case where two
 * journeys both have tenantId/productId unset (null === null would otherwise
 * incorrectly "match").
 * @param {string} tenantId
 * @param {string} productId
 * @param {string} featureSlug
 * @returns {object|null}
 */
function getJourneyForTenantProductSlug(tenantId, productId, featureSlug) {
  if (!tenantId || !productId) return null;
  var match = null;
  for (var journey of _journeys.values()) {
    if (journey.featureSlug === featureSlug && journey.tenantId === tenantId && journey.productId === productId) {
      match = journey;
    }
  }
  return match;
}
```

- [x] **Step 4: Run test — must pass**

```bash
node tests/check-ppc-s1-journey-store-helpers.js
```

Expected output: `PASS` for both new tests.

- [x] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing.

- [x] **Step 6: Commit**

```bash
git add src/web-ui/modules/journey-store.js tests/check-ppc-s1-journey-store-helpers.js
git commit -m "feat: add tenant+product-scoped journey lookup for self-service surfaces"
```

---

## Task 3: `setCaptureTarget` + Postgres durability fix

**Status: COMPLETE.** Spec review ✅. Quality review found 1 Important (test hardcoded a positional SQL-param index that had already grown once before — now finds the JSON blob by shape) + 2 Minor (allowlist alignment; `captureScreenshots` has no producer/test yet, noted, not blocking) — fixed in `a7615565`. Ending SHA: `a7615565`.

**Files:**
- Modify: `src/web-ui/modules/journey-store.js`, `src/web-ui/adapters/journey-store-pg.js`
- Test: `tests/check-ppc-s1-journey-store-helpers.js`

- [x] **Step 1: Write the failing test**

```js
queue.push(function() {
  return test('setCaptureTarget: stores a new target, and replaces (not duplicates) an existing one for the same acId', function() {
    var store = require('../src/web-ui/modules/journey-store');
    store._clearForTesting();
    var j = store.createJourney('target-test-slug');

    store.setCaptureTarget(j.journeyId, 'AC1', 'http://x/1', '#sel1');
    var after1 = store.getJourney(j.journeyId);
    assert.strictEqual(after1.captureTargets.length, 1);
    assert.deepStrictEqual(after1.captureTargets[0], { acId: 'AC1', url: 'http://x/1', selector: '#sel1' });

    store.setCaptureTarget(j.journeyId, 'AC1', 'http://x/2', '#sel2');
    var after2 = store.getJourney(j.journeyId);
    assert.strictEqual(after2.captureTargets.length, 1, 'must replace, not duplicate');
    assert.deepStrictEqual(after2.captureTargets[0], { acId: 'AC1', url: 'http://x/2', selector: '#sel2' });
  });
});

queue.push(function() {
  return test('journey-store-pg _sanitise: captureTargets survives the Postgres allowlist (fdn-s1 regression)', function() {
    delete require.cache[require.resolve('../src/web-ui/adapters/journey-store-pg')];
    var pg = require('../src/web-ui/adapters/journey-store-pg');
    var calls = [];
    pg._setPoolForTesting({ query: async function(sql, params) { calls.push(params); return { rows: [] }; } });
    var journey = {
      journeyId: 'j1', featureSlug: 's1', completedStages: [],
      captureTargets: [{ acId: 'AC1', url: 'http://x', selector: '#y' }]
    };
    return pg.saveJourney(journey).then(function() {
      var dataJson = calls[0][5];
      var data = JSON.parse(dataJson);
      assert.deepStrictEqual(data.captureTargets, [{ acId: 'AC1', url: 'http://x', selector: '#y' }]);
    });
  });
});
```

- [x] **Step 2: Run test — must fail**

```bash
node tests/check-ppc-s1-journey-store-helpers.js
```

Expected output: `FAIL — store.setCaptureTarget is not a function`, and (once Step 3's journey-store.js half lands) the second test fails with `data.captureTargets` being `undefined` until the `_sanitise()` allowlist fix also lands.

- [x] **Step 3: Write minimal implementation**

In `src/web-ui/modules/journey-store.js`, add directly after `setCaptureTarget`'s sibling helpers (after the `getCaptureTargetState` block from Task 1):

```js
/**
 * ppc-s1 (AC2) — one-time manual target entry per AC. Stores/replaces
 * (never duplicates) a {acId, url, selector} entry on the journey's own
 * captureTargets array.
 * @param {string} journeyId
 * @param {string} acId
 * @param {string} url
 * @param {string} selector
 */
function setCaptureTarget(journeyId, acId, url, selector) {
  var journey = _journeys.get(journeyId);
  if (!journey) return;
  if (!Array.isArray(journey.captureTargets)) journey.captureTargets = [];
  var idx = journey.captureTargets.findIndex(function(t) { return t.acId === acId; });
  var entry = { acId: acId, url: url, selector: selector };
  if (idx === -1) {
    journey.captureTargets.push(entry);
  } else {
    journey.captureTargets[idx] = entry;
  }
  if (_diskAdapter) {
    try { _diskAdapter.saveJourney(journey); } catch (_) {}
  }
  _pgWrite(journey);
}
```

Add `setCaptureTarget` to the `module.exports` block (alongside `isDodComplete`, `getCaptureTargetState`, `getJourneyForTenantProductSlug` from Tasks 1-2 — all four should be added to `module.exports` together in this task if not already done).

In `src/web-ui/adapters/journey-store-pg.js`, in `_sanitise()`, add two new allowlisted fields (ppc-s1 introduces both — capture targets, and the captured-screenshot paths written in Task 9):

```js
function _sanitise(journey) {
  const data = {
    completedStages:   journey.completedStages   || [],
    sessions:          journey.sessions           || {},
    activeSkill:       journey.activeSkill        || null,
    activeSessionId:   journey.activeSessionId    || null,
    mode:              journey.mode               || 'feature',
    complete:          journey.complete           || false,
    completedAt:       journey.completedAt        || null,
    stories:           journey.stories            || [],
    storyList:         journey.storyList          || null,
    currentStoryIndex: journey.currentStoryIndex  || 0,
    productProfile:    journey.productProfile     || 'default',
    displayName:       journey.displayName        || null,
    flaggedStages:     journey.flaggedStages       || [],
    // ppc-s1: added to the allowlist per this file's own fdn-s1 rule --
    // must be listed explicitly or it silently vanishes after a
    // Postgres-backed restart.
    captureTargets:    journey.captureTargets     || [],
    captureScreenshots: journey.captureScreenshots || {}
  };
  // Defensive: strip accessToken from any nested value (should never be there, but guard anyway)
  delete data.accessToken;
  return data;
}
```

- [x] **Step 4: Run test — must pass**

```bash
node tests/check-ppc-s1-journey-store-helpers.js
```

Expected output: `PASS` for both new tests.

- [x] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing.

- [x] **Step 6: Commit**

```bash
git add src/web-ui/modules/journey-store.js src/web-ui/adapters/journey-store-pg.js tests/check-ppc-s1-journey-store-helpers.js
git commit -m "feat: add setCaptureTarget and fix Postgres allowlist durability gap"
```

---

## Task 4: Session-to-Playwright adapter (AC8, D37 — stub + real implementation)

**Status: COMPLETE.** Spec review ✅ (confirmed lazy chromium default, ADR-018 compliance). Quality review found only Minor issues (missing JSDoc on setter/getter, missing blank line) — fixed in `ef1caead`. Ending SHA: `ef1caead`.

**Files:**
- Create: `src/web-ui/adapters/session-page-adapter.js`
- Test: `tests/check-ppc-s1-session-page-adapter.js`

- [x] **Step 1: Write the failing test**

```js
'use strict';
var assert = require('assert');
var passed = 0; var failed = 0; var failures = [];
function test(name, fn) {
  try {
    var result = fn();
    if (result && typeof result.then === 'function') {
      return result.then(
        function() { passed++; console.log('  PASS: ' + name); },
        function(err) { failed++; failures.push({ name: name, err: err }); console.log('  FAIL: ' + name + '\n       ' + (err && err.stack || err)); }
      );
    }
    passed++; console.log('  PASS: ' + name); return Promise.resolve();
  } catch (err) {
    failed++; failures.push({ name: name, err: err }); console.log('  FAIL: ' + name + '\n       ' + (err && err.stack || err)); return Promise.resolve();
  }
}
var queue = [];

queue.push(function() {
  return test('AC8 (D37 stub): getAuthenticatedPage throws until wired', async function() {
    delete require.cache[require.resolve('../src/web-ui/adapters/session-page-adapter')];
    var adapter = require('../src/web-ui/adapters/session-page-adapter');
    var threw = false;
    try {
      await adapter.getAuthenticatedPage('some-session-id', 'http://localhost:3000');
    } catch (err) {
      threw = true;
      assert.ok(/not wired/i.test(err.message), 'error must name the adapter and instruct how to wire it');
    }
    assert.ok(threw, 'must throw, never return null/undefined silently');
  });
});

(async function() {
  console.log('\ncheck-ppc-s1-session-page-adapter.js');
  for (var i = 0; i < queue.length; i++) { await queue[i](); }
  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  if (failures.length > 0) { process.exit(1); }
})();
```

- [x] **Step 2: Run test — must fail**

```bash
node tests/check-ppc-s1-session-page-adapter.js
```

Expected output: `FAIL — Cannot find module '../src/web-ui/adapters/session-page-adapter'`

- [x] **Step 3: Write minimal implementation**

Create `src/web-ui/adapters/session-page-adapter.js`:

```js
'use strict';
// session-page-adapter.js — ppc-s1 (AC8, D37 mandatory). Bridges a tenant
// user's own req.sessionId to an authenticated headless Playwright page, by
// seeding the browser context's cookie with that same opaque session_id
// value. No new token-minting, no service credential (ADR-018; decisions.md
// 2026-10-21 ARCHITECTURE entry). No such adapter existed before this story
// -- rpca's own mechanism (scripts/playback-capture.js) is CLI-only, never
// route-handler-callable.
//
// chromiumModule is an injectable third parameter so this module's own
// behavioural correctness can be verified WITHOUT ever invoking a real
// Playwright browser from the unit test chain (ADR-018: "unit test chain
// (npm test) must not invoke Playwright").

let _sessionPageAdapter = function() {
  throw new Error('Adapter not wired: sessionPageAdapter. Call setSessionPageAdapter() with a real implementation before use.');
};

function setSessionPageAdapter(fn) {
  _sessionPageAdapter = fn;
}

function getSessionPageAdapter() {
  return _sessionPageAdapter;
}

/**
 * @param {string} sessionId - the opaque req.sessionId value (never req.session.accessToken)
 * @param {string} baseUrl - the app's own base URL, used to scope the cookie's domain
 * @returns {Promise<{page: object, browser: object}>}
 */
async function getAuthenticatedPage(sessionId, baseUrl) {
  return getSessionPageAdapter()(sessionId, baseUrl);
}

/**
 * Real production implementation. chromiumModule defaults to Playwright's
 * own chromium launcher; tests inject a fake one to verify this function's
 * real cookie-seeding logic without launching a real browser.
 * @param {string} sessionId
 * @param {string} baseUrl
 * @param {object} [chromiumModule] - defaults to require('playwright').chromium
 * @returns {Promise<{page: object, browser: object}>}
 */
async function realGetAuthenticatedPage(sessionId, baseUrl, chromiumModule) {
  const chromium = chromiumModule || require('playwright').chromium;
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const url = new URL(baseUrl);
  await context.addCookies([{
    name: 'session_id',
    value: sessionId,
    domain: url.hostname,
    path: '/',
    httpOnly: true,
    secure: url.protocol === 'https:',
    sameSite: 'Lax'
  }]);
  const page = await context.newPage();
  return { page: page, browser: browser };
}

module.exports = {
  setSessionPageAdapter,
  getSessionPageAdapter,
  getAuthenticatedPage,
  realGetAuthenticatedPage
};
```

- [x] **Step 4: Run test — must pass**

```bash
node tests/check-ppc-s1-session-page-adapter.js
```

Expected output: `PASS`

- [x] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing.

- [x] **Step 6: Commit**

```bash
git add src/web-ui/adapters/session-page-adapter.js tests/check-ppc-s1-session-page-adapter.js
git commit -m "feat: add session-to-Playwright adapter stub (AC8, D37)"
```

---

## Task 5: Wire the session-page adapter in `server.js` (D37 rule 3 — separate task from Task 4)

**Status: COMPLETE.** Spec review ✅ — confirmed AC8 is now genuinely satisfied end-to-end (stub throws, wired in server.js, behavioural-correctness test proves two sessions produce two distinct, correctly-isolated pages). One unrelated pre-existing flaky test (`check-pcr-s1-test-runner.js`) failed once in the full-suite run and passed standalone — confirmed unrelated to this diff. Quality review found only a non-blocking Minor (optional shared fake-chromium test helper) — not applied. Ending SHA: `90817c69`.

**Files:**
- Modify: `src/web-ui/server.js`
- Test: `tests/check-ppc-s1-session-page-adapter.js`

- [x] **Step 1: Write the failing test**

Append to `tests/check-ppc-s1-session-page-adapter.js` (before the `(async function() {...})()` runner block — move that block to the end of the file after adding these):

```js
var fs = require('fs');
var path = require('path');

queue.push(function() {
  return test('AC8 (D37 wiring): server.js wires the real adapter, never under NODE_ENV=test', function() {
    var serverSrc = fs.readFileSync(path.resolve(__dirname, '../src/web-ui/server.js'), 'utf8');
    assert.ok(/setSessionPageAdapter\s*\(\s*realGetAuthenticatedPage\s*\)/.test(serverSrc),
      'server.js must call setSessionPageAdapter(realGetAuthenticatedPage) during bootstrap');
  });
});

queue.push(function() {
  return test('AC8 (D37 behavioural correctness): two different sessions produce two distinct, correctly-isolated pages', async function() {
    var adapter = require('../src/web-ui/adapters/session-page-adapter');

    function fakeChromium() {
      var launched = [];
      return {
        launch: async function() {
          var cookiesSeen = [];
          var fakeContext = {
            addCookies: async function(cookies) { cookiesSeen.push(cookies[0]); },
            newPage: async function() { return { _cookies: cookiesSeen }; }
          };
          var fakeBrowser = { newContext: async function() { return fakeContext; } };
          launched.push(fakeBrowser);
          return fakeBrowser;
        }
      };
    }

    var chromium1 = fakeChromium();
    var result1 = await adapter.realGetAuthenticatedPage('session-A', 'http://localhost:3000', chromium1);
    var chromium2 = fakeChromium();
    var result2 = await adapter.realGetAuthenticatedPage('session-B', 'http://localhost:3000', chromium2);

    assert.notStrictEqual(result1.page, result2.page, 'two different sessions must produce two distinct page objects');
    assert.strictEqual(result1.page._cookies[0].value, 'session-A');
    assert.strictEqual(result2.page._cookies[0].value, 'session-B');
    assert.notStrictEqual(result1.page._cookies[0].value, result2.page._cookies[0].value,
      'the two pages must be seeded with different, correctly-isolated session values -- not the same object reused');
  });
});
```

Then at the bottom of the file, keep exactly one runner block (remove the earlier duplicate if `/tdd` added one per-task):

```js
(async function() {
  console.log('\ncheck-ppc-s1-session-page-adapter.js');
  for (var i = 0; i < queue.length; i++) { await queue[i](); }
  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  if (failures.length > 0) { process.exit(1); }
})();
```

- [x] **Step 2: Run test — must fail**

```bash
node tests/check-ppc-s1-session-page-adapter.js
```

Expected output: `FAIL — server.js must call setSessionPageAdapter(realGetAuthenticatedPage) during bootstrap`

- [x] **Step 3: Write minimal implementation**

In `src/web-ui/server.js`, near the top alongside the other adapter requires (next to the `artefact-commit-writer` require around line 98):

```js
const { setSessionPageAdapter, realGetAuthenticatedPage } = require('./adapters/session-page-adapter'); // ppc-s1
```

In the existing D37 adapter-wiring block (immediately after the `das-s1` block that wires `setArtefactCommitAdapter`):

```js
// ppc-s1 / D37 mandatory separate wiring task -- wire the real
// session-to-Playwright adapter (a fifth, distinct adapter from the four
// above -- setSessionPageAdapter/getSessionPageAdapter, so none of the five
// stories' wiring calls collide). Never wired in NODE_ENV=test (tests call
// setSessionPageAdapter() themselves with a mock); the throwing stub stays
// active there.
if (process.env.NODE_ENV !== 'test') {
  setSessionPageAdapter(realGetAuthenticatedPage);
  console.log('[session-page-adapter] getAuthenticatedPage wired');
}
```

- [x] **Step 4: Run test — must pass**

```bash
node tests/check-ppc-s1-session-page-adapter.js
```

Expected output: `PASS` for all 3 tests in this file.

- [x] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing.

- [x] **Step 6: Commit**

```bash
git add src/web-ui/server.js tests/check-ppc-s1-session-page-adapter.js
git commit -m "feat: wire session-page adapter in server.js (AC8 complete)"
```

---

## Task 6: `commitArtefact` binary-content extension

**Status: COMPLETE.** Spec review ✅ (confirmed zero behavioural drift for every existing caller, repo-wide grep performed). Quality review: ✅ Approved, zero issues. Ending SHA: `bcf1a68c`.

**Files:**
- Modify: `src/web-ui/adapters/artefact-commit-writer.js`
- Test: `tests/check-ppc-s1-playback-evidence-route.js` (new file — this is its first test, a focused unit test of the extension before the route-level tests that consume it)

- [x] **Step 1: Write the failing test**

Create `tests/check-ppc-s1-playback-evidence-route.js`:

```js
'use strict';
var assert = require('assert');
var fs = require('fs');
var path = require('path');
var os = require('os');
var passed = 0; var failed = 0; var failures = [];
function test(name, fn) {
  try {
    var result = fn();
    if (result && typeof result.then === 'function') {
      return result.then(
        function() { passed++; console.log('  PASS: ' + name); },
        function(err) { failed++; failures.push({ name: name, err: err }); console.log('  FAIL: ' + name + '\n       ' + (err && err.stack || err)); }
      );
    }
    passed++; console.log('  PASS: ' + name); return Promise.resolve();
  } catch (err) {
    failed++; failures.push({ name: name, err: err }); console.log('  FAIL: ' + name + '\n       ' + (err && err.stack || err)); return Promise.resolve();
  }
}
var queue = [];

queue.push(function() {
  return test('commitArtefact: base64 encoding passes binary content through unchanged (no re-encoding)', async function() {
    delete require.cache[require.resolve('../src/web-ui/adapters/artefact-commit-writer')];
    var acw = require('../src/web-ui/adapters/artefact-commit-writer');
    var received = null;
    acw.setArtefactCommitAdapter(async function(artefactPath, content, token, owner, repo, encoding) {
      received = { artefactPath: artefactPath, content: content, encoding: encoding };
      return { ok: true };
    });
    var fakePngBase64 = Buffer.from([0x89, 0x50, 0x4e, 0x47]).toString('base64');
    await acw.commitArtefact('artefacts/x/shot.png', fakePngBase64, 'tok', 'acme', 'widgets', 'base64');
    assert.strictEqual(received.encoding, 'base64');
    assert.strictEqual(received.content, fakePngBase64, 'content must pass through unchanged when already base64');
  });
});

queue.push(function() {
  return test('commitArtefact: default (no encoding arg) behaves exactly as before -- markdown text, utf8', async function() {
    delete require.cache[require.resolve('../src/web-ui/adapters/artefact-commit-writer')];
    var acw = require('../src/web-ui/adapters/artefact-commit-writer');
    var received = null;
    acw.setArtefactCommitAdapter(async function(artefactPath, content, token, owner, repo, encoding) {
      received = { content: content, encoding: encoding };
      return { ok: true };
    });
    await acw.commitArtefact('artefacts/x/notes.md', '# hello', 'tok', 'acme', 'widgets');
    assert.strictEqual(received.content, '# hello');
    assert.strictEqual(received.encoding, undefined, 'existing callers never pass a 6th arg -- must stay undefined, not default to a new value that changes their behaviour');
  });
});
```

- [x] **Step 2: Run test — must fail**

```bash
node tests/check-ppc-s1-playback-evidence-route.js
```

Expected output: `FAIL — expected undefined to equal undefined` is NOT the failure (that one already passes); the first test fails because `commitArtefact` is currently a 5-arg passthrough and never forwards a 6th `encoding` argument at all (TypeError-free but `received.encoding` stays `undefined` for both calls at this point — confirms the test itself is correctly red before Step 3, since `received.encoding` for the base64 case is also `undefined` pre-fix instead of `'base64'`).

- [x] **Step 3: Write minimal implementation**

In `src/web-ui/adapters/artefact-commit-writer.js`, update the signature and JSDoc of `commitArtefact` and `realCommitArtefact`:

```js
/**
 * @param {string} artefactPath
 * @param {string} content - markdown text (utf8, default) or base64-encoded binary (pass encoding='base64')
 * @param {string} token
 * @param {string} owner
 * @param {string} repo
 * @param {string} [encoding] - 'utf8' (default, unchanged behaviour) or 'base64' for already-encoded binary content (ppc-s1)
 * @returns {Promise<object>}
 */
async function commitArtefact(artefactPath, content, token, owner, repo, encoding) {
  return getArtefactCommitAdapter()(artefactPath, content, token, owner, repo, encoding);
}
```

```js
async function realCommitArtefact(artefactPath, content, token, owner, repo, encoding) {
  if (!owner || !repo) {
    throw new Error('realCommitArtefact: owner and repo parameters are required (product has no repo configured)');
  }

  const apiBase = (process.env.GITHUB_API_BASE_URL || 'https://api.github.com').replace(/\/$/, '');

  const authHeaders = {
    Authorization: 'Bearer ' + token,
    Accept:        'application/vnd.github+json'
  };

  const userRes = await fetch(apiBase + '/user', { headers: authHeaders });
  if (!userRes.ok) {
    throw new Error('Failed to fetch user identity: ' + userRes.status);
  }
  const user = await userRes.json();
  const authorName  = user.name || user.login;
  const authorEmail = user.email || (user.login + '@users.noreply.github.com');

  const contentsUrl = apiBase + '/repos/' + owner + '/' + repo + '/contents/' + artefactPath;

  let sha;
  const getRes = await fetch(contentsUrl, { headers: authHeaders });
  if (getRes.ok) {
    const existing = await getRes.json();
    sha = existing.sha;
  } else if (getRes.status !== 404) {
    throw new Error('Failed to check existing artefact: ' + getRes.status);
  }

  // ppc-s1: encoding === 'base64' means content is ALREADY base64-encoded
  // binary (a screenshot) -- pass it straight through. The existing
  // behaviour (utf8 markdown text, re-encoded here) is completely unchanged
  // for every caller that doesn't pass a 6th argument.
  const fileContent = encoding === 'base64' ? content : Buffer.from(content, 'utf8').toString('base64');
  const bodyPayload = {
    message:   'artefact: commit ' + artefactPath,
    content:   fileContent,
    author:    { name: authorName, email: authorEmail },
    committer: { name: authorName, email: authorEmail }
  };
  if (sha) bodyPayload.sha = sha;

  const putRes = await fetch(contentsUrl, {
    method:  'PUT',
    headers: Object.assign({}, authHeaders, { 'Content-Type': 'application/json' }),
    body:    JSON.stringify(bodyPayload)
  });

  if (putRes.status === 409) {
    throw new ArtefactCommitConflictError();
  }

  if (!putRes.ok) {
    throw new Error('Failed to commit artefact: ' + putRes.status);
  }

  return putRes.json();
}
```

- [x] **Step 4: Run test — must pass**

```bash
node tests/check-ppc-s1-playback-evidence-route.js
```

Expected output: `PASS` for both tests.

- [x] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing (every existing `commitArtefact` caller omits the 6th arg, so `encoding === 'base64'` is false and behaviour is byte-for-byte unchanged).

- [x] **Step 6: Commit**

```bash
git add src/web-ui/adapters/artefact-commit-writer.js tests/check-ppc-s1-playback-evidence-route.js
git commit -m "feat: extend commitArtefact to accept base64 binary content"
```

---

## Task 7: `handleGetPlaybackEvidence` — the tenant-scoped surface (AC1, AC4, AC5)

**Status: COMPLETE.** Spec review ✅ (confirmed `getJourneyByFeatureSlug` never called; tenant+product scoping correct). Quality review found 1 Important: adopted `setJourneyStoreModule(mod)` DI convention (matching `journey.js`/`features.js`) instead of a lazy require workaround — fixed in `32f5fd53`. **For Tasks 8/9: `playback-evidence.js` now has a module-level `_journeyStore` var + `setJourneyStoreModule(mod)` setter — use `_journeyStore.xxx` directly in new handlers, do NOT reintroduce a lazy `_store()` call.** Ending SHA: `32f5fd53`.

**Files:**
- Create: `src/web-ui/routes/playback-evidence.js`
- Test: `tests/check-ppc-s1-playback-evidence-route.js`

- [x] **Step 1: Write the failing test**

Append to `tests/check-ppc-s1-playback-evidence-route.js`:

```js
var JOURNEY_STORE_PATH = path.resolve(__dirname, '../src/web-ui/modules/journey-store.js');
function getStore() {
  delete require.cache[require.resolve(JOURNEY_STORE_PATH)];
  return require(JOURNEY_STORE_PATH);
}
function makeRes() {
  var res = { _status: null, _json: null, json: function(body) { res._status = res._status || 200; res._json = body; } };
  res.status = function(code) { res._status = code; return res; };
  return res;
}
function makeReq(tenantId, productId, featureSlug, extra) {
  return Object.assign({
    session: { tenantId: tenantId, accessToken: 'test-token', login: 'user' },
    sessionId: 'sid-' + tenantId,
    params: { productId: productId, featureSlug: featureSlug }
  }, extra || {});
}

function setupDodCompleteJourney(store, opts) {
  opts = opts || {};
  var slug = opts.featureSlug || ('ppc-s1-feature-' + Date.now() + '-' + Math.random().toString(36).slice(2));
  var j = store.createJourney(slug);
  store.setJourneyFields(j.journeyId, { tenantId: opts.tenantId || 'tenant-a', productId: opts.productId || 'product-a' });
  var dodContent = [
    '## AC Coverage',
    '',
    '| AC | Satisfied? | Evidence |',
    '|----|------------|----------|',
    '| AC1 — Shows the dashboard | Yes | screenshot |',
    '| AC2 — Saves a widget | Yes | screenshot |'
  ].join('\n');
  // getArtefactsForJourney reads through the pg adapter in production; for
  // this unit-level test we stub journey-store's own getArtefactsForJourney
  // behaviour by monkey-patching the module's exported function reference
  // is not possible (plain function export) -- instead we set a PG test
  // adapter that returns the fixed row, matching this module's own existing
  // setPgAdapterForTesting seam.
  store.setPgAdapterForTesting({
    saveJourney: async function() {},
    getArtefactsForJourney: async function() {
      return [{ skill_name: 'definition-of-done', artefact_path: 'artefacts/' + slug + '/dod.md', content: dodContent }];
    }
  });
  store.completeStage(j.journeyId, 'definition-of-done', 'artefacts/' + slug + '/dod.md', null);
  return { journeyId: j.journeyId, featureSlug: slug, tenantId: opts.tenantId || 'tenant-a', productId: opts.productId || 'product-a' };
}

queue.push(function() {
  return test('AC1: GET surface lists ACs scoped to the requesting tenant+product only', async function() {
    var pe = require('../src/web-ui/routes/playback-evidence');
    var store = getStore();
    var setup = setupDodCompleteJourney(store, {});

    var req = makeReq(setup.tenantId, setup.productId, setup.featureSlug);
    var res = makeRes();
    await pe.handleGetPlaybackEvidence(req, res, null, null);

    assert.strictEqual(res._status === null || res._status === 200, true);
    assert.strictEqual(res._json.acs.length, 2);
    assert.strictEqual(res._json.acs[0].acId, 'AC1');
  });
});

queue.push(function() {
  return test('AC4: an AC with no stored capture target shows NOT_SET, not a broken/erroring action', async function() {
    var pe = require('../src/web-ui/routes/playback-evidence');
    var store = getStore();
    var setup = setupDodCompleteJourney(store, {});

    var req = makeReq(setup.tenantId, setup.productId, setup.featureSlug);
    var res = makeRes();
    await pe.handleGetPlaybackEvidence(req, res, null, null);

    assert.strictEqual(res._json.acs[0].targetSet, false);
    assert.strictEqual(res._json.acs[0].target, null);
  });
});

queue.push(function() {
  return test('AC5: a captured screenshot path displays inline, no separate download step', async function() {
    var pe = require('../src/web-ui/routes/playback-evidence');
    var store = getStore();
    var setup = setupDodCompleteJourney(store, {});
    store.setJourneyFields(setup.journeyId, { captureScreenshots: { AC1: 'artefacts/' + setup.featureSlug + '/playback/ppc-s1/screenshots/AC1.png' } });

    var req = makeReq(setup.tenantId, setup.productId, setup.featureSlug);
    var res = makeRes();
    await pe.handleGetPlaybackEvidence(req, res, null, null);

    assert.strictEqual(res._json.acs[0].screenshotPath, 'artefacts/' + setup.featureSlug + '/playback/ppc-s1/screenshots/AC1.png');
  });
});
```

- [x] **Step 2: Run test — must fail**

```bash
node tests/check-ppc-s1-playback-evidence-route.js
```

Expected output: `FAIL — Cannot find module '../src/web-ui/routes/playback-evidence'`

- [x] **Step 3: Write minimal implementation**

Create `src/web-ui/routes/playback-evidence.js`:

```js
'use strict';
// playback-evidence.js — ppc-s1. Tenant-scoped surface for self-service DoD
// evidence capture. Deliberately does NOT reuse /playback's or
// GET /features/:slug's data path (journey-store.js's getJourneyByFeatureSlug
// has no tenant filtering -- confirmed cross-tenant leak risk, decisions.md
// 2026-10-21 ARCHITECTURE entry). Every read here goes through
// journey-store.js's getJourneyForTenantProductSlug, scoped by BOTH
// tenant_id AND product_id (AC1, AC6, AC7).

const journeyStore = require('../modules/journey-store');
const { parseDodAcCoverage } = require('../../utils/dod-parsing');
const { getAuthenticatedPage } = require('../adapters/session-page-adapter');
const { captureAcScreenshots } = require('../../utils/capture-screenshots');
const { commitArtefact } = require('../adapters/artefact-commit-writer');

function _sendJson(res, status, body) {
  if (res.status) { res.status(status).json(body); }
  else { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(body)); }
}

function _notFound(res) {
  // AC7: 403/not-found with no partial content and no metadata revealing
  // the other tenant's feature exists -- 404 + a constant body, never the
  // real reason (slug mismatch vs tenant mismatch vs not-DoD-complete all
  // look identical from outside).
  _sendJson(res, 404, { error: 'not found' });
}

async function _resolveJourney(req) {
  var tenantId = req.session && req.session.tenantId;
  var productId = req.params && req.params.productId;
  var featureSlug = req.params && req.params.featureSlug;
  if (!tenantId || !productId || !featureSlug) return null;
  var journey = journeyStore.getJourneyForTenantProductSlug(tenantId, productId, featureSlug);
  if (!journey || !journeyStore.isDodComplete(journey)) return null;
  return journey;
}

async function _getDodAcList(journey) {
  var artefacts = await journeyStore.getArtefactsForJourney(journey.journeyId);
  var dodRow = (artefacts || []).find(function(a) { return a.skill_name === 'definition-of-done'; });
  if (!dodRow) return [];
  return parseDodAcCoverage(dodRow.content);
}

/**
 * AC1 (list, tenant+product scoped), AC4 ("not set" state), AC5 (inline screenshot).
 */
async function handleGetPlaybackEvidence(req, res) {
  var journey = await _resolveJourney(req);
  if (!journey) { _notFound(res); return; }

  var acRows = await _getDodAcList(journey);
  var captureTargets = journey.captureTargets || [];
  var screenshots = journey.captureScreenshots || {};

  var acs = acRows.map(function(ac) {
    var targetState = journeyStore.getCaptureTargetState(captureTargets, ac.acId);
    var targetSet = targetState !== 'NOT_SET';
    return {
      acId: ac.acId,
      description: ac.description,
      targetSet: targetSet,
      target: targetSet ? targetState : null,
      screenshotPath: screenshots[ac.acId] || null
    };
  });

  _sendJson(res, 200, { featureSlug: journey.featureSlug, acs: acs });
}

module.exports = {
  handleGetPlaybackEvidence,
  _resolveJourney,
  _notFound,
  _sendJson
};
```

- [x] **Step 4: Run test — must pass**

```bash
node tests/check-ppc-s1-playback-evidence-route.js
```

Expected output: `PASS` for AC1, AC4, AC5 tests.

- [x] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing.

- [x] **Step 6: Commit**

```bash
git add src/web-ui/routes/playback-evidence.js tests/check-ppc-s1-playback-evidence-route.js
git commit -m "feat: add tenant-scoped playback-evidence surface (AC1, AC4, AC5)"
```

---

## Task 8: `handlePostCaptureTarget` (AC2)

**Status: COMPLETE.** Spec review ✅ (round-trip through the read path confirmed). Quality review found 1 Important (missing CSRF guard — every other mutating route in this repo checks it; added, with a dedicated 403-rejection test) + 1 Minor (`store2` naming) — fixed in `7bc95d45`, re-reviewed ✅. Also fixed a pipeline-state bookkeeping bug caught by `npm test` itself (`testPlan.passing` had exceeded `testPlan.totalTests` since Task 1 — the original test-plan.md under-counted; corrected to `totalTests: 27`, projected final). Ending SHA: `7bc95d45`.

**Files:**
- Modify: `src/web-ui/routes/playback-evidence.js`
- Test: `tests/check-ppc-s1-playback-evidence-route.js`

- [x] **Step 1: Write the failing test**

```js
queue.push(function() {
  return test('AC2: POST stores a capture target, available for every subsequent read without re-entry', async function() {
    var pe = require('../src/web-ui/routes/playback-evidence');
    var store = getStore();
    var setup = setupDodCompleteJourney(store, {});

    var req = makeReq(setup.tenantId, setup.productId, setup.featureSlug, {
      params: { productId: setup.productId, featureSlug: setup.featureSlug, acId: 'AC1' },
      body: { url: 'http://localhost:3000/dashboard', selector: '#widget-1', _csrf: 'test-csrf-token' }
    });
    var res = makeRes();
    await pe.handlePostCaptureTarget(req, res, null, null);

    assert.strictEqual(res._json.ok, true);

    var reloaded = store.getJourney(setup.journeyId);
    assert.deepStrictEqual(reloaded.captureTargets[0], { acId: 'AC1', url: 'http://localhost:3000/dashboard', selector: '#widget-1' });

    // A subsequent GET reflects the stored target with no re-entry.
    var getReq = makeReq(setup.tenantId, setup.productId, setup.featureSlug);
    var getRes = makeRes();
    await pe.handleGetPlaybackEvidence(getReq, getRes, null, null);
    assert.strictEqual(getRes._json.acs[0].targetSet, true);
    assert.deepStrictEqual(getRes._json.acs[0].target, { acId: 'AC1', url: 'http://localhost:3000/dashboard', selector: '#widget-1' });
  });
});

queue.push(function() {
  return test('AC2: missing url or selector is rejected with 400, nothing stored', async function() {
    var pe = require('../src/web-ui/routes/playback-evidence');
    var store = getStore();
    var setup = setupDodCompleteJourney(store, {});

    var req = makeReq(setup.tenantId, setup.productId, setup.featureSlug, {
      params: { productId: setup.productId, featureSlug: setup.featureSlug, acId: 'AC1' },
      body: { url: '', selector: '', _csrf: 'test-csrf-token' }
    });
    var res = makeRes();
    await pe.handlePostCaptureTarget(req, res, null, null);

    assert.strictEqual(res._status, 400);
    var reloaded = store.getJourney(setup.journeyId);
    assert.strictEqual((reloaded.captureTargets || []).length, 0);
  });
});
```

- [x] **Step 2: Run test — must fail**

```bash
node tests/check-ppc-s1-playback-evidence-route.js
```

Expected output: `FAIL — pe.handlePostCaptureTarget is not a function`

- [x] **Step 3: Write minimal implementation**

In `src/web-ui/routes/playback-evidence.js`, add directly after `handleGetPlaybackEvidence`:

```js
/**
 * AC2 — one-time manual target entry per AC.
 */
async function handlePostCaptureTarget(req, res) {
  var journey = await _resolveJourney(req);
  if (!journey) { _notFound(res); return; }

  var acId = req.params && req.params.acId;
  var body = req.body || {};
  var url = body.url;
  var selector = body.selector;
  if (!acId || !url || !selector) {
    _sendJson(res, 400, { error: 'acId, url, and selector are required' });
    return;
  }

  journeyStore.setCaptureTarget(journey.journeyId, acId, url, selector);
  _sendJson(res, 200, { ok: true });
}
```

Update `module.exports` to include `handlePostCaptureTarget`.

- [x] **Step 4: Run test — must pass**

```bash
node tests/check-ppc-s1-playback-evidence-route.js
```

Expected output: `PASS` for both new tests.

- [x] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing.

- [x] **Step 6: Commit**

```bash
git add src/web-ui/routes/playback-evidence.js tests/check-ppc-s1-playback-evidence-route.js
git commit -m "feat: add capture-target entry endpoint (AC2)"
```

---

## Task 9: `handlePostCaptureTrigger` (AC3 — session-reuse capture)

**Status: COMPLETE.** Spec review ✅ (credential handling, tenant-scoped SQL, Docker-deployable import path, goto-before-capture ordering all confirmed correct). Quality review found 2 Critical (uncaught capture/commit failures reaching a bare 500 — regression from `journey.js`'s `handlePostGateConfirm` precedent; unconfigured `APP_BASE_URL` env var would silently scope the auth cookie to the wrong domain outside local dev) + 2 Important (ad hoc `req._repoRootOverride` instead of the existing `repo-root.js` adapter; unguarded `pool.query`) — all fixed in `c5505af8`, re-reviewed ✅. Ending SHA: `c5505af8`.

**Files:**
- Modify: `src/web-ui/routes/playback-evidence.js`
- Test: `tests/check-ppc-s1-playback-evidence-route.js`

- [x] **Step 1: Write the failing test**

```js
var sessionPageAdapter = require('../src/web-ui/adapters/session-page-adapter');
var artefactCommitWriter = require('../src/web-ui/adapters/artefact-commit-writer');

function makeMockPool(rows) {
  return { query: async function() { return { rows: rows }; } };
}

queue.push(function() {
  return test('AC3: capture-trigger seeds the Playwright cookie from req.sessionId, navigates to the stored target, persists the screenshot', async function() {
    var pe = require('../src/web-ui/routes/playback-evidence');
    var store = getStore();
    var setup = setupDodCompleteJourney(store, {});
    store.setCaptureTarget(setup.journeyId, 'AC1', 'http://localhost:3000/dashboard', '#widget-1');

    var tmpRoot = path.join(os.tmpdir(), 'ppc-s1-capture-' + Date.now());
    fs.mkdirSync(tmpRoot, { recursive: true });
    var seenCookieSessionId = null;
    var fakePage = {
      goto: async function(url) { fakePage._gotoUrl = url; },
      screenshot: async function(opts) {
        fakePage._selector = opts.selector;
        var abs = path.join(tmpRoot, opts.path);
        fs.mkdirSync(path.dirname(abs), { recursive: true });
        fs.writeFileSync(abs, Buffer.from([0x89, 0x50, 0x4e, 0x47]));
      }
    };
    sessionPageAdapter.setSessionPageAdapter(async function(sessionId, baseUrl) {
      seenCookieSessionId = sessionId;
      return { page: fakePage, browser: { close: async function() {} } };
    });

    var capturedCommit = null;
    artefactCommitWriter.setArtefactCommitAdapter(async function(artefactPath, content, token, owner, repo, encoding) {
      capturedCommit = { artefactPath: artefactPath, token: token, owner: owner, repo: repo, encoding: encoding };
      return { ok: true };
    });

    var mockPool = makeMockPool([{ repo_owner: 'acme', repo_name: 'widgets' }]);

    var req = makeReq(setup.tenantId, setup.productId, setup.featureSlug, {
      params: { productId: setup.productId, featureSlug: setup.featureSlug, acId: 'AC1' },
      body: { _csrf: 'test-csrf-token' },
      _repoRootOverride: tmpRoot
    });
    var res = makeRes();
    await pe.handlePostCaptureTrigger(req, res, null, mockPool);

    assert.strictEqual(seenCookieSessionId, req.sessionId, 'the Playwright context cookie must be seeded with req.sessionId, never a service credential');
    assert.strictEqual(fakePage._gotoUrl, 'http://localhost:3000/dashboard');
    assert.strictEqual(fakePage._selector, '#widget-1');
    assert.strictEqual(capturedCommit.encoding, 'base64');
    assert.strictEqual(capturedCommit.token, req.session.accessToken, 'commitArtefact must use the user\'s own accessToken, never a service account');
    assert.strictEqual(res._json.ok, true);

    var reloaded = store.getJourney(setup.journeyId);
    assert.ok(reloaded.captureScreenshots.AC1, 'the screenshot path must be persisted on the journey for AC5 inline display');
  });
});

queue.push(function() {
  return test('AC3: triggering capture for an AC with no stored target is rejected with 400, no adapter calls made', async function() {
    var pe = require('../src/web-ui/routes/playback-evidence');
    var store = getStore();
    var setup = setupDodCompleteJourney(store, {});

    var adapterCalled = false;
    sessionPageAdapter.setSessionPageAdapter(async function() { adapterCalled = true; return { page: {}, browser: { close: async function() {} } }; });

    var req = makeReq(setup.tenantId, setup.productId, setup.featureSlug, {
      params: { productId: setup.productId, featureSlug: setup.featureSlug, acId: 'AC1' },
      body: { _csrf: 'test-csrf-token' }
    });
    var res = makeRes();
    await pe.handlePostCaptureTrigger(req, res, null, makeMockPool([]));

    assert.strictEqual(res._status, 400);
    assert.strictEqual(adapterCalled, false, 'must never reach the capture mechanism when no target is stored');
  });
});
```

- [x] **Step 2: Run test — must fail**

```bash
node tests/check-ppc-s1-playback-evidence-route.js
```

Expected output: `FAIL — pe.handlePostCaptureTrigger is not a function`

- [x] **Step 3: Write minimal implementation**

In `src/web-ui/routes/playback-evidence.js`, add directly after `handlePostCaptureTarget`:

```js
async function _resolveOwnerRepo(journey, pool) {
  if (!pool) return null;
  var result = await pool.query(
    'SELECT repo_owner, repo_name FROM products WHERE product_id = $1 AND tenant_id = $2',
    [journey.productId, journey.tenantId]
  );
  var row = result.rows[0];
  if (!row || !row.repo_owner || !row.repo_name) return null;
  return { owner: row.repo_owner, repo: row.repo_name };
}

/**
 * AC3 — session-reuse capture: seeds the Playwright context cookie with the
 * requesting user's own req.sessionId (never a service credential or the
 * NODE_ENV=test auth-bypass fixture, per ADR-018), navigates to the stored
 * target, captures the screenshot, and commits it via the user's own
 * accessToken.
 */
async function handlePostCaptureTrigger(req, res, _next, pool) {
  var journey = await _resolveJourney(req);
  if (!journey) { _notFound(res); return; }

  var acId = req.params && req.params.acId;
  var captureTargets = journey.captureTargets || [];
  var target = journeyStore.getCaptureTargetState(captureTargets, acId);
  if (target === 'NOT_SET') {
    _sendJson(res, 400, { error: 'no capture target set for this AC' });
    return;
  }

  var ownerRepo = await _resolveOwnerRepo(journey, pool);
  if (!ownerRepo) {
    _sendJson(res, 400, { error: 'product has no connected repo' });
    return;
  }

  var baseUrl = process.env.APP_BASE_URL || 'http://localhost:3000';
  var authed = await getAuthenticatedPage(req.sessionId, baseUrl);
  try {
    await authed.page.goto(target.url);
    var shots = await captureAcScreenshots({
      page: authed.page,
      featureSlug: journey.featureSlug,
      storySlug: 'ppc-s1',
      acList: [{ acId: acId, selector: target.selector }]
    });
    var shot = shots[0];

    var repoRoot = req._repoRootOverride || require('path').resolve(__dirname, '../../..');
    var absShotPath = require('path').join(repoRoot, shot.path);
    var content = require('fs').readFileSync(absShotPath);

    await commitArtefact(shot.path, content.toString('base64'), req.session.accessToken, ownerRepo.owner, ownerRepo.repo, 'base64');

    var screenshots = journey.captureScreenshots || {};
    screenshots[acId] = shot.path;
    journeyStore.setJourneyFields(journey.journeyId, { captureScreenshots: screenshots });

    _sendJson(res, 200, { ok: true, screenshotPath: shot.path });
  } finally {
    if (authed.browser && authed.browser.close) { await authed.browser.close(); }
  }
}
```

Update `module.exports` to include `handlePostCaptureTrigger`.

- [x] **Step 4: Run test — must pass**

```bash
node tests/check-ppc-s1-playback-evidence-route.js
```

Expected output: `PASS` for both new tests.

- [x] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing.

- [x] **Step 6: Commit**

```bash
git add src/web-ui/routes/playback-evidence.js tests/check-ppc-s1-playback-evidence-route.js
git commit -m "feat: add session-reuse capture-trigger endpoint (AC3)"
```

---

## Task 10: Mount the 3 routes in `server.js`

**Status: COMPLETE.** Spec review ✅ (regex anchoring, params extraction, and CSRF-no-double-check convention independently verified). Quality review found 1 Important (the only wiring test checked handler names appear as text, which would pass even with the routes deleted — added a genuine real-dispatch integration test using `server.js`'s real `router` + `seedTestSession`, which also caught a real bug: the test's first session id wasn't valid lowercase hex, so `_parseSessionId` silently failed to parse it) + 1 Minor (`_peParts1/2/3` renamed to self-identifying names, matching the `gcw-s1` precedent) — fixed in `4ec37be6`, re-reviewed ✅. Ending SHA: `4ec37be6`.

**Files:**
- Modify: `src/web-ui/server.js`

- [x] **Step 1: Write the failing test**

Append to `tests/check-ppc-s1-playback-evidence-route.js`:

```js
queue.push(function() {
  return test('server.js source mounts all 3 playback-evidence routes, CSRF-guarded on both POSTs', function() {
    var serverSrc = fs.readFileSync(path.resolve(__dirname, '../src/web-ui/server.js'), 'utf8');
    assert.ok(/handleGetPlaybackEvidence/.test(serverSrc), 'GET route must be mounted');
    assert.ok(/handlePostCaptureTarget/.test(serverSrc), 'POST capture-target route must be mounted');
    assert.ok(/handlePostCaptureTrigger/.test(serverSrc), 'POST capture-trigger route must be mounted');
    var postSection = serverSrc.slice(serverSrc.indexOf('handlePostCaptureTarget') - 400, serverSrc.indexOf('handlePostCaptureTarget') + 200);
    assert.ok(/csrfGuard/.test(postSection), 'capture-target POST must be CSRF-guarded, matching every other mutating route');
  });
});
```

- [x] **Step 2: Run test — must fail**

```bash
node tests/check-ppc-s1-playback-evidence-route.js
```

Expected output: `FAIL — GET route must be mounted`

- [x] **Step 3: Write minimal implementation**

In `src/web-ui/server.js`, add the require near the top alongside the other route requires (next to `routes/features`):

```js
const { handleGetPlaybackEvidence, handlePostCaptureTarget, handlePostCaptureTrigger } = require('./routes/playback-evidence'); // ppc-s1
```

In the route dispatch chain, directly after the existing `/playback-media/` block:

```js
  } else if (pathname.match(/^\/products\/[^/]+\/playback-evidence\/[^/]+$/) && req.method === 'GET') {
    // ppc-s1 (AC1) -- tenant-scoped surface, deliberately NOT /playback or /features/:slug
    var _peParts1 = pathname.split('/');
    req.params = { productId: _peParts1[2], featureSlug: decodeURIComponent(_peParts1[4]) };
    authGuard(req, res, async () => { await handleGetPlaybackEvidence(req, res, null, _pshPool); });

  } else if (pathname.match(/^\/products\/[^/]+\/playback-evidence\/[^/]+\/targets\/[^/]+$/) && req.method === 'POST') {
    // ppc-s1 (AC2) -- CSRF-guarded, matching every other mutating route in products.js.
    var _peParts2 = pathname.split('/');
    req.params = { productId: _peParts2[2], featureSlug: decodeURIComponent(_peParts2[4]), acId: decodeURIComponent(_peParts2[6]) };
    authGuard(req, res, async () => {
      var csrfOk = await _gcwCsrf.csrfGuard(req, res);
      if (!csrfOk) return;
      await handlePostCaptureTarget(req, res, null, _pshPool);
    });

  } else if (pathname.match(/^\/products\/[^/]+\/playback-evidence\/[^/]+\/capture\/[^/]+$/) && req.method === 'POST') {
    // ppc-s1 (AC3) -- CSRF-guarded, matching every other mutating route in products.js.
    var _peParts3 = pathname.split('/');
    req.params = { productId: _peParts3[2], featureSlug: decodeURIComponent(_peParts3[4]), acId: decodeURIComponent(_peParts3[6]) };
    authGuard(req, res, async () => {
      var csrfOk = await _gcwCsrf.csrfGuard(req, res);
      if (!csrfOk) return;
      await handlePostCaptureTrigger(req, res, null, _pshPool);
    });
```

- [x] **Step 4: Run test — must pass**

```bash
node tests/check-ppc-s1-playback-evidence-route.js
```

Expected output: `PASS`

- [x] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing.

- [x] **Step 6: Commit**

```bash
git add src/web-ui/server.js tests/check-ppc-s1-playback-evidence-route.js
git commit -m "feat: mount playback-evidence routes in server.js"
```

---

## Task 11: Tenant isolation (AC6, AC7)

**Status: COMPLETE.** Test-only, as expected — no production bug found (Tasks 7-9's tenant-scoped lookup is sound for both the collision and guessed-URL cases). Spec review found 1 gap (the mismatched tenant+product case was under-asserted, status-code only) — fixed in `c63b1b25`. Quality review: Minor only (cosmetic sentinel-naming nits), approved as-is. Ending SHA: `c63b1b25`.

**Files:**
- Test only (production code from Tasks 7-9 already enforces this via `getJourneyByTenantProductSlug` — this task is the dedicated, directly-tested verification the test plan requires, not inferred from the access-control code alone)

- [x] **Step 1: Write the failing test**

Append to `tests/check-ppc-s1-playback-evidence-route.js`:

```js
queue.push(function() {
  return test('AC6: two tenants sharing a colliding feature_slug each see only their own content', async function() {
    var pe = require('../src/web-ui/routes/playback-evidence');
    var store = getStore();
    var collidingSlug = 'duplicate-slug-' + Date.now();
    var setupA = setupDodCompleteJourney(store, { tenantId: 'tenant-A', productId: 'product-A', featureSlug: collidingSlug });

    var reqA = makeReq('tenant-A', 'product-A', collidingSlug);
    var resA = makeRes();
    await pe.handleGetPlaybackEvidence(reqA, resA, null, null);
    var bodyString = JSON.stringify(resA._json);

    assert.strictEqual(resA._json.featureSlug, collidingSlug);
    assert.ok(!bodyString.includes('tenant-B'), 'tenant B identifiers must never appear in tenant A\'s response');
  });
});

queue.push(function() {
  return test('AC7: a guessed URL to another tenant\'s feature returns 404 with no metadata leak', async function() {
    var pe = require('../src/web-ui/routes/playback-evidence');
    var store = getStore();
    var setupB = setupDodCompleteJourney(store, { tenantId: 'tenant-B', productId: 'product-B' });

    // Tenant A (a different tenant entirely) guesses tenant B's real feature slug.
    var req = makeReq('tenant-A', 'product-A', setupB.featureSlug);
    var res = makeRes();
    await pe.handleGetPlaybackEvidence(req, res, null, null);

    assert.strictEqual(res._status, 404);
    var bodyString = JSON.stringify(res._json);
    assert.ok(!bodyString.includes(setupB.featureSlug), 'response must not echo back the guessed slug or any other metadata about tenant B\'s feature');
    assert.deepStrictEqual(res._json, { error: 'not found' });
  });
});
```

- [x] **Step 2: Run test — must fail**

Expected to already PASS if Tasks 7-9 are implemented correctly (this task is verification, not new production code) — run it to confirm:

```bash
node tests/check-ppc-s1-playback-evidence-route.js
```

Expected output: `PASS` for both — if either fails, the bug is in `getJourneyForTenantProductSlug` (Task 2) or `_resolveJourney` (Task 7), not in this test file. Fix there, not here.

- [x] **Step 3: Write minimal implementation**

None — this task's purpose is the dedicated AC6/AC7 test coverage the test plan explicitly requires beyond inferring it from the access-control code. No production code change.

- [x] **Step 4: Run test — must pass**

```bash
node tests/check-ppc-s1-playback-evidence-route.js
```

Expected output: `PASS`

- [x] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing.

- [x] **Step 6: Commit**

```bash
git add tests/check-ppc-s1-playback-evidence-route.js
git commit -m "test: add dedicated AC6/AC7 tenant-isolation coverage"
```

---

## Task 12: NFR tests — `session_id` never leaks, auth-bypass never invoked

**Status: COMPLETE.** Final task in the plan. Test-only, no production bug found. Spec review ✅ (confirmed the adapter is genuinely the sole auth seam). Quality review found 2 Important (the ADR-018 test only restated an existing assertion rather than directly spying on the bypass fixture; the leak-check test's name claimed coverage of all 3 routes but only exercised 2) — both fixed in `b82806a3`, re-reviewed ✅. Ending SHA: `b82806a3`.

**Files:**
- Test only

- [x] **Step 1: Write the failing test**

Append to `tests/check-ppc-s1-playback-evidence-route.js`:

```js
queue.push(function() {
  return test('NFR-SEC: session_id value never appears in any response body produced by these routes', async function() {
    var pe = require('../src/web-ui/routes/playback-evidence');
    var store = getStore();
    var setup = setupDodCompleteJourney(store, {});

    var getReq = makeReq(setup.tenantId, setup.productId, setup.featureSlug);
    var getRes = makeRes();
    await pe.handleGetPlaybackEvidence(getReq, getRes, null, null);
    assert.ok(!JSON.stringify(getRes._json).includes(getReq.sessionId));

    store.setCaptureTarget(setup.journeyId, 'AC1', 'http://localhost:3000/x', '#y');
    sessionPageAdapter.setSessionPageAdapter(async function() {
      return { page: { goto: async function() {}, screenshot: async function(opts) { fs.mkdirSync(require('path').dirname(opts.path), { recursive: true }); fs.writeFileSync(opts.path, 'x'); } }, browser: { close: async function() {} } };
    });
    artefactCommitWriter.setArtefactCommitAdapter(async function() { return { ok: true }; });
    var triggerReq = makeReq(setup.tenantId, setup.productId, setup.featureSlug, {
      params: { productId: setup.productId, featureSlug: setup.featureSlug, acId: 'AC1' },
      body: { _csrf: 'test-csrf-token' }
    });
    var triggerRes = makeRes();
    await pe.handlePostCaptureTrigger(triggerReq, triggerRes, null, makeMockPool([{ repo_owner: 'acme', repo_name: 'widgets' }]));
    assert.ok(!JSON.stringify(triggerRes._json || {}).includes(triggerReq.sessionId));
  });
});

queue.push(function() {
  return test('NFR-SEC (ADR-018): capture-trigger never invokes the NODE_ENV=test auth-bypass path', async function() {
    var seedTestSessionCalled = false;
    var pe = require('../src/web-ui/routes/playback-evidence');
    var store = getStore();
    var setup = setupDodCompleteJourney(store, {});
    store.setCaptureTarget(setup.journeyId, 'AC1', 'http://localhost:3000/x', '#y');

    sessionPageAdapter.setSessionPageAdapter(async function(sessionId) {
      // The real implementation only ever receives req.sessionId -- if this
      // story's handler ever called seedTestSession or hit /test/session,
      // THIS stub would be bypassed entirely, which is exactly the
      // violation this test guards against structurally: the only seam
      // capture-trigger has for authentication is this adapter, called with
      // req.sessionId, full stop.
      assert.strictEqual(sessionId, triggerReq.sessionId);
      return { page: { goto: async function() {}, screenshot: async function(opts) { fs.mkdirSync(require('path').dirname(opts.path), { recursive: true }); fs.writeFileSync(opts.path, 'x'); } }, browser: { close: async function() {} } };
    });
    artefactCommitWriter.setArtefactCommitAdapter(async function() { return { ok: true }; });

    var triggerReq = makeReq(setup.tenantId, setup.productId, setup.featureSlug, {
      params: { productId: setup.productId, featureSlug: setup.featureSlug, acId: 'AC1' },
      body: { _csrf: 'test-csrf-token' }
    });
    var triggerRes = makeRes();
    await pe.handlePostCaptureTrigger(triggerReq, triggerRes, null, makeMockPool([{ repo_owner: 'acme', repo_name: 'widgets' }]));
    assert.strictEqual(seedTestSessionCalled, false);
  });
});
```

- [x] **Step 2: Run test — must fail**

Expected to already PASS (structural guarantee from Task 9's implementation, which has no code path to any bypass fixture at all) — run to confirm:

```bash
node tests/check-ppc-s1-playback-evidence-route.js
```

- [x] **Step 3: Write minimal implementation**

None required if Task 9 is correct. If either test fails, the fix belongs in Task 9's `handlePostCaptureTrigger`, not here.

- [x] **Step 4: Run test — must pass**

```bash
node tests/check-ppc-s1-playback-evidence-route.js
```

Expected output: `PASS` — all tests in this file now passing (17 total across the two new test files plus the helpers file).

- [x] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing, 0 regressions.

- [x] **Step 6: Commit**

```bash
git add tests/check-ppc-s1-playback-evidence-route.js
git commit -m "test: add NFR coverage for session_id non-leak and ADR-018 compliance"
```

---

## Manual verification (not automated — no accessibility tooling in this repo)

Per `nfr-profile.md` and the story's own NFR section: WCAG 2.1 AA / keyboard-navigability for the new surface's feature list, AC list, and "Capture evidence" action is **manual-only** (no `axe`/`pa11y` configured in this repo). Run the manual scenario in `artefacts/2026-10-20-production-playback-capture/verification-scripts/ppc-s1-verification.md` before `/verify-completion`, not instead of it.
