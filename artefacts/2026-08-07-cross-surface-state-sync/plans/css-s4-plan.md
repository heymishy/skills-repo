# Extend automatic sync to the full gate/stage vocabulary and add the reconciliation safety net — Implementation Plan

> **For agent execution:** Use /subagent-execution.

**Goal:** Generalise css-s1/css-s2's sync mechanism from one gate (`discovery-approved`) to all 7 gates in `gate-map.js`, correctly handling the 2 gates with no journey-side representation; wire real conflict detection into css-s1's own direction (newly reachable now that multiple gate values are in play); add a reconciliation safety net that catches exhausted css-s2 retries on a subsequent live request. See `artefacts/2026-08-07-cross-surface-state-sync/decisions.md`'s css-s4 ARCH entries for the full design reasoning — do not re-derive it, reference it.
**Branch:** `feature/css-s4`
**Worktree:** `.worktrees/css-s4`
**Test command:** `node scripts/run-all-tests.js` (full suite); `node tests/<file>.js` (single file)

---

## File map

```
Create:
  src/sync/reconciliation.js                    — findOpenGap() + reconcile()
  scripts/check-sync-mechanism-is-parameterized.js — structural NFR check (not a per-task test, a standalone governance script)
  tests/check-css-s4-gate-vocabulary.js          — unit tests: GATE_TO_JOURNEY_STAGE, generalised syncGateAdvanceToJourney (AC1)
  tests/check-css-s4-reconciliation.js           — unit + integration tests for reconciliation.js (AC2)
  tests/check-css-s4-css-s2-vocabulary.js        — confirms css-s2's direction is ALREADY generic (AC1, css-s2 side)
  tests/check-sync-mechanism-is-parameterized.js — test wrapper for the structural check script

Modify:
  src/web-ui/server.js            — sync_log.resolved_at column migration
  src/web-ui/modules/journey-store.js — getLatestKnownStage() helper + export
  src/web-ui/routes/internal-sync.js  — handleJourneySyncResolve returns journeyCurrentStage
  src/sync/journey-sync-client.js — generalise syncGateAdvanceToJourney to all 7 gates + real conflict detection for the 5 representable ones
  src/enforcement/cli-gate-advance.js — generalise the gate check from SYNC_GATE-only to any gate-map.js gate
  src/web-ui/routes/journey.js    — wire the reconciliation check into handlePostGateConfirm
  artefacts/2026-08-07-cross-surface-state-sync/verification-scripts/css-s4-verification.md — AC3's honest-reporting language
```

---

## Task 1: `sync_log.resolved_at` column migration

**Files:**
- Modify: `src/web-ui/server.js`

No dedicated test — matches this file's own established no-test convention for incremental `ALTER TABLE ADD COLUMN` migrations (the `product_rollups` table's own `health_counts`/`test_coverage`/`ac_coverage`/`taxonomy` precedents, none of which have a dedicated migration test either).

- [ ] **Step 1: Locate the insertion point**

Find the `sync_log` migration block (search for `CREATE TABLE IF NOT EXISTS sync_log`). Insert the new migration immediately after its own `.then()/.catch()` block.

- [ ] **Step 2: Add the migration**

```javascript
// css-s4: sync_log.resolved_at -- tracks whether a logged reconciliation
// gap (entry_type='gap') has since been resolved by the reconciliation
// safety net (src/sync/reconciliation.js). NULL = still open. Conflict
// entries (entry_type='conflict') never use this column -- they are
// already-final audit records, not open items awaiting resolution.
_creditsPool.query(`ALTER TABLE sync_log ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ`).then(function() {
  console.log('[css-s4] sync_log.resolved_at column ready');
}).catch(function(err) {
  console.error('[css-s4] sync_log.resolved_at migration failed:', err.message);
});
```

- [ ] **Step 3: Validate and run full suite**

```bash
node -e "require('./src/web-ui/server.js')" 2>&1 | head -5
grep -n "ALTER TABLE sync_log ADD COLUMN IF NOT EXISTS resolved_at" src/web-ui/server.js
node scripts/run-all-tests.js
```

Expected: no `SyntaxError`; one grep match; all tests passing (baseline 792, confirmed at `/branch-setup`).

- [ ] **Step 4: Commit**

```bash
git add src/web-ui/server.js
git commit -m "feat(css-s4): add sync_log.resolved_at column migration"
```

---

## Task 2: `getLatestKnownStage()` + `handleJourneySyncResolve` extension

**Files:**
- Modify: `src/web-ui/modules/journey-store.js`, `src/web-ui/routes/internal-sync.js`
- Test: `tests/check-css-s4-gate-vocabulary.js` (Step 1 only — this task's own red/green portion; Task 4 appends the rest)

- [ ] **Step 1: Write the failing test**

```javascript
#!/usr/bin/env node
/**
 * check-css-s4-gate-vocabulary.js
 *
 * Tests for css-s4: full gate-vocabulary coverage for css-s1's own
 * direction, including real conflict detection for the 5 journey-
 * representable gates. Covers AC1 (css-s1 side).
 *
 * Run: node tests/check-css-s4-gate-vocabulary.js
 */
'use strict';

const journeyStore = require('../src/web-ui/modules/journey-store');

let totalPassed = 0;
let totalFailed = 0;
const issues = [];

function assert(label, condition, message) {
  if (condition) { totalPassed++; } else { totalFailed++; issues.push(`  ✗ [${label}] ${message}`); }
}

async function run() {
  console.log('\n[css-s4] gate vocabulary tests\n');

  // T1 (Task 2 red/green step): getLatestKnownStage finds the highest-index STAGE_SEQUENCE member in completedStages
  (function T1() {
    const journeyA = { completedStages: [{ skillName: 'discovery' }, { skillName: 'benefit-metric' }] };
    assert('T1-finds-highest', journeyStore.getLatestKnownStage(journeyA) === 'benefit-metric', `expected "benefit-metric" (higher STAGE_SEQUENCE index than "discovery"), got "${journeyStore.getLatestKnownStage(journeyA)}"`);

    const journeyB = { completedStages: [{ skillName: 'test-plan' }, { skillName: 'discovery' }] };
    assert('T1-order-independent', journeyStore.getLatestKnownStage(journeyB) === 'test-plan', `expected the array's own order not to matter -- "test-plan" is later in STAGE_SEQUENCE than "discovery" regardless of array position, got "${journeyStore.getLatestKnownStage(journeyB)}"`);

    const journeyC = { completedStages: [] };
    assert('T1-empty-returns-null', journeyStore.getLatestKnownStage(journeyC) === null, 'expected null for a journey with no completed stages');

    const journeyD = { completedStages: [{ skillName: 'infra-plan' }] };
    assert('T1-unrepresentable-stage-ignored', journeyStore.getLatestKnownStage(journeyD) === null, 'expected null when completedStages only contains a stage name outside STAGE_SEQUENCE (e.g. an inner-loop gate name that somehow ended up there) -- not a throw, not a false match');

    assert('T1-null-journey-safe', journeyStore.getLatestKnownStage(null) === null, 'expected null for a null journey, not a throw');
    assert('T1-missing-completedStages-safe', journeyStore.getLatestKnownStage({}) === null, 'expected null when completedStages is missing entirely, not a throw');
  })();

  console.log(`[css-s4] ${totalPassed} passed, ${totalFailed} failed (partial -- Task 2 only; Task 4 appends more below)\n`);
  if (issues.length > 0) {
    console.log(issues.join('\n'));
    console.log('');
  }
  process.exit(totalFailed === 0 ? 0 : 1);
}

run();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-css-s4-gate-vocabulary.js
```

Expected: `TypeError: journeyStore.getLatestKnownStage is not a function`.

- [ ] **Step 3: Add `getLatestKnownStage` to `journey-store.js`**

Add immediately after the existing `isKnownStage` function (added in css-s3's Task 7):

```javascript
/**
 * css-s4: finds the highest-index STAGE_SEQUENCE member present in a
 * journey's own completedStages array -- the journey's own "current
 * representable stage" for cross-surface conflict comparison purposes.
 * Order-independent (scans the whole array, not just the last entry) --
 * completedStages' own array order is insertion order, not guaranteed to
 * track STAGE_SEQUENCE order (e.g. a regression/reopen could insert an
 * earlier stage's entry after a later one). Ignores any completedStages
 * entry whose skillName is outside STAGE_SEQUENCE entirely (e.g. an
 * inner-loop gate name) rather than throwing or false-matching.
 * @param {{completedStages?: Array<{skillName: string}>}|null} journey
 * @returns {string|null}
 */
function getLatestKnownStage(journey) {
  if (!journey || !Array.isArray(journey.completedStages)) return null;
  var latestIdx = -1;
  var latestStage = null;
  journey.completedStages.forEach(function(cs) {
    var idx = STAGE_SEQUENCE.indexOf(cs && cs.skillName);
    if (idx > latestIdx) { latestIdx = idx; latestStage = cs.skillName; }
  });
  return latestStage;
}
```

Add `getLatestKnownStage,` to `module.exports`, next to the existing `isKnownStage,` line.

- [ ] **Step 4: Extend `handleJourneySyncResolve` in `internal-sync.js`**

Replace:

```javascript
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    found: true,
    journey: {
      journeyId: journey.journeyId,
      featureSlug: journey.featureSlug,
      repoOwner: repoOwner,
      repoName: repoName
    }
  }));
}
```

with:

```javascript
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    found: true,
    journey: {
      journeyId: journey.journeyId,
      featureSlug: journey.featureSlug,
      repoOwner: repoOwner,
      repoName: repoName,
      // css-s4: the journey's own current representable stage -- enables
      // real conflict detection on css-s1's own sync direction, now that
      // this story extends sync to multiple distinct gate values (see
      // decisions.md's gate-to-journey-stage-mapping ARCH entry). null
      // when the journey hasn't completed any STAGE_SEQUENCE-representable
      // stage yet, or has none that map cleanly (same "null means no
      // representable value" convention as css-s3's own isKnownStage gate).
      currentStage: _journeyStore.getLatestKnownStage(journey)
    }
  }));
}
```

- [ ] **Step 5: Run test — must pass**

```bash
node tests/check-css-s4-gate-vocabulary.js
```

Expected: `[css-s4] 6 passed, 0 failed (partial -- Task 2 only; Task 4 appends more below)`.

- [ ] **Step 6: Run full suite**

```bash
node scripts/run-all-tests.js
```

Expected: all tests passing, including `tests/check-css-s1-journey-sync-client.js`, `tests/check-css-s1-journey-sync-wiring.js` (confirm `handleJourneySyncResolve`'s response shape change is purely additive — the new `currentStage` field must not break any existing test that destructures or asserts on the `journey` object's own shape).

- [ ] **Step 7: Commit**

```bash
git add src/web-ui/modules/journey-store.js src/web-ui/routes/internal-sync.js tests/check-css-s4-gate-vocabulary.js
git commit -m "feat(css-s4): add getLatestKnownStage() and extend journey-sync resolve response"
```

---

## Task 3: `GATE_TO_JOURNEY_STAGE` map + generalise `journey-sync-client.js` (AC1, css-s1 direction)

**Files:**
- Modify: `src/sync/journey-sync-client.js`, `src/enforcement/cli-gate-advance.js`
- Test: append to `tests/check-css-s4-gate-vocabulary.js`

This is the most significant task in this story. Read it carefully before implementing.

- [ ] **Step 1: Write the failing tests**

REPLACE the entire content of `tests/check-css-s4-gate-vocabulary.js` with:

```javascript
#!/usr/bin/env node
/**
 * check-css-s4-gate-vocabulary.js
 *
 * Tests for css-s4: full gate-vocabulary coverage for css-s1's own
 * direction, including real conflict detection for the 5 journey-
 * representable gates. Covers AC1 (css-s1 side).
 *
 * Run: node tests/check-css-s4-gate-vocabulary.js
 */
'use strict';

const journeyStore = require('../src/web-ui/modules/journey-store');
const GATE_MAP = require('../src/enforcement/gate-map');
const syncLog = require('../src/web-ui/adapters/sync-log');

let totalPassed = 0;
let totalFailed = 0;
const issues = [];

function assert(label, condition, message) {
  if (condition) { totalPassed++; } else { totalFailed++; issues.push(`  ✗ [${label}] ${message}`); }
}

function makeFakePool() {
  const calls = [];
  return { calls: calls, query: async function(sql, params) { calls.push({ sql, params }); return { rows: [] }; } };
}

function freshRequireJourneySyncClient() {
  const p = require.resolve('../src/sync/journey-sync-client');
  try { delete require.cache[p]; } catch (_) {}
  return require(p);
}

async function run() {
  console.log('\n[css-s4] gate vocabulary tests\n');

  // T1: getLatestKnownStage
  (function T1() {
    const journeyA = { completedStages: [{ skillName: 'discovery' }, { skillName: 'benefit-metric' }] };
    assert('T1-finds-highest', journeyStore.getLatestKnownStage(journeyA) === 'benefit-metric', `expected "benefit-metric", got "${journeyStore.getLatestKnownStage(journeyA)}"`);

    const journeyB = { completedStages: [{ skillName: 'test-plan' }, { skillName: 'discovery' }] };
    assert('T1-order-independent', journeyStore.getLatestKnownStage(journeyB) === 'test-plan', `expected "test-plan", got "${journeyStore.getLatestKnownStage(journeyB)}"`);

    assert('T1-empty-returns-null', journeyStore.getLatestKnownStage({ completedStages: [] }) === null, 'expected null for empty completedStages');
    assert('T1-unrepresentable-stage-ignored', journeyStore.getLatestKnownStage({ completedStages: [{ skillName: 'infra-plan' }] }) === null, 'expected null when completedStages only contains a non-STAGE_SEQUENCE name');
    assert('T1-null-journey-safe', journeyStore.getLatestKnownStage(null) === null, 'expected null for a null journey');
    assert('T1-missing-completedStages-safe', journeyStore.getLatestKnownStage({}) === null, 'expected null when completedStages is missing');
  })();

  // T2 (AC1): GATE_TO_JOURNEY_STAGE's keys are DERIVED from gate-map.js, not re-typed
  (function T2() {
    const journeySyncClient = freshRequireJourneySyncClient();
    const mapKeys = Object.keys(journeySyncClient.GATE_TO_JOURNEY_STAGE).sort();
    const gateMapKeys = Object.keys(GATE_MAP).sort();
    assert('T2-keys-match-gate-map', JSON.stringify(mapKeys) === JSON.stringify(gateMapKeys), `expected GATE_TO_JOURNEY_STAGE's own keys to exactly match gate-map.js's own 7 keys, got ${JSON.stringify(mapKeys)} vs ${JSON.stringify(gateMapKeys)}`);
  })();

  // T3 (AC1): the 5 journey-representable gates map to their correct stage name
  (function T3() {
    const journeySyncClient = freshRequireJourneySyncClient();
    const m = journeySyncClient.GATE_TO_JOURNEY_STAGE;
    assert('T3-discovery-approved', m['discovery-approved'] === 'discovery', `got "${m['discovery-approved']}"`);
    assert('T3-benefit-metric-active', m['benefit-metric-active'] === 'benefit-metric', `got "${m['benefit-metric-active']}"`);
    assert('T3-definition-complete', m['definition-complete'] === 'definition', `got "${m['definition-complete']}"`);
    assert('T3-test-plan-complete', m['test-plan-complete'] === 'test-plan', `got "${m['test-plan-complete']}"`);
    assert('T3-dor-signed-off', m['dor-signed-off'] === 'definition-of-ready', `got "${m['dor-signed-off']}"`);
  })();

  // T4 (AC1): the 2 inner-loop gates map to null -- no journey-trackable session exists
  (function T4() {
    const journeySyncClient = freshRequireJourneySyncClient();
    const m = journeySyncClient.GATE_TO_JOURNEY_STAGE;
    assert('T4-branch-complete-null', m['branch-complete'] === null, `expected null (no journey session for an inner-loop CLI milestone), got "${m['branch-complete']}"`);
    assert('T4-definition-of-done-null', m['definition-of-done'] === null, `expected null, got "${m['definition-of-done']}"`);
  })();

  // T5 (AC1): syncGateAdvanceToJourney safely no-ops for a journey-unrepresentable gate -- no transport call at all
  await (async function T5() {
    const journeySyncClient = freshRequireJourneySyncClient();
    let transportCalled = false;
    journeySyncClient.setJourneySyncClient(async function() { transportCalled = true; return { updated: true }; });
    await journeySyncClient.syncGateAdvanceToJourney({ journeyId: 'j1', featureSlug: 'f1', repoOwner: null, repoName: null, currentStage: null }, 'branch-complete');
    assert('T5-no-op-for-unrepresentable-gate', transportCalled === false, 'expected NO transport call for a gate with no journey-side representation');
  })();

  // T6 (AC1): syncGateAdvanceToJourney works for a journey-representable gate, no conflict
  await (async function T6() {
    const journeySyncClient = freshRequireJourneySyncClient();
    let updateCall = null;
    journeySyncClient.setJourneySyncClient(async function(op, payload) {
      if (op === 'update') { updateCall = payload; return { updated: true }; }
      return null;
    });
    await journeySyncClient.syncGateAdvanceToJourney({ journeyId: 'j1', featureSlug: 'f1', repoOwner: null, repoName: null, currentStage: 'discovery' }, 'benefit-metric-active');
    assert('T6-syncs-representable-gate', !!updateCall, 'expected an update transport call for a journey-representable gate');
    assert('T6-correct-stage-pushed', updateCall && updateCall.stage === 'benefit-metric', `expected stage 'benefit-metric' pushed, got "${updateCall && updateCall.stage}"`);
  })();

  // T7 (AC1, real conflict detection -- the NEW capability this story adds to css-s1's own direction): journey's own current stage conflicts with the gate being synced
  await (async function T7() {
    const journeySyncClient = freshRequireJourneySyncClient();
    const fakePool = makeFakePool();
    syncLog._setPoolForTesting(fakePool);
    let transportCalled = false;
    journeySyncClient.setJourneySyncClient(async function() { transportCalled = true; return { updated: true }; });

    // Journey's own current representable stage is 'review' -- genuinely
    // different from both 'discovery' (the journey's own last-synced
    // marker, read from pipeline-state.json by the CALLER, not this
    // function) and 'definition' (the gate now being synced). Both sides
    // moved since last sync, to different values: a genuine conflict.
    await journeySyncClient.syncGateAdvanceToJourney(
      { journeyId: 'j1', featureSlug: 'f1', repoOwner: null, repoName: null, currentStage: 'review' },
      'definition-complete',
      'discovery' // lastSyncedStage, passed by the caller (cli-gate-advance.js reads this from local pipeline-state.json)
    );

    assert('T7-no-push-on-conflict', transportCalled === false, 'expected NO update transport call when a genuine conflict is detected -- pushing would silently overwrite the journey\'s own more-recent, disagreeing progress');
    const conflictCall = fakePool.calls.find(function(c) { return String(c.sql).toUpperCase().indexOf('SYNC_LOG') !== -1 && c.params.indexOf('conflict') !== -1; });
    assert('T7-conflict-logged', !!conflictCall, 'expected a sync_log conflict entry');
  })();

  console.log(`[css-s4] ${totalPassed} passed, ${totalFailed} failed\n`);
  if (issues.length > 0) {
    console.log(issues.join('\n'));
    console.log('');
  }
  process.exit(totalFailed === 0 ? 0 : 1);
}

run();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-css-s4-gate-vocabulary.js
```

Expected: fails on T2 (`journeySyncClient.GATE_TO_JOURNEY_STAGE is undefined`) and later tests (T5-T7 depend on the new 3-arg `syncGateAdvanceToJourney` signature).

- [ ] **Step 3: Generalise `journey-sync-client.js`**

Replace the ENTIRE file content with:

```javascript
'use strict';

// journey-sync-client.js — css-s1: CLI-side D37 adapter for the CLI -> web-UI
// journey sync direction (resolve + update), reached via a new internal HTTP
// endpoint on the deployed web-UI server (src/web-ui/routes/internal-sync.js)
// -- the CLI has no direct Postgres credential (decisions.md 2026-08-07 ARCH
// entry).
//
// css-s4: generalised from the single discovery-approved gate to all 7
// gate-map.js gates. GATE_TO_JOURNEY_STAGE's own KEYS are derived from
// gate-map.js's export (not re-typed, per this story's own NFR against
// duplicating the fixed 7-value list) -- its VALUES are new information
// (the corresponding journey-trackable stage name, or null for the 2
// inner-loop gates with no journey-side representation at all). See
// decisions.md's "gate-to-journey-stage mapping" ARCH entry for the full
// reasoning.
//
// D37: the real HTTP transport is wired separately, never self-wired here --
// the default stub throws so a missing wiring call fails loudly instead of
// silently no-opping. See cli-gate-advance.js for the wiring call.

var GATE_MAP = require('../enforcement/gate-map');
var conflictResolver = require('./conflict-resolver');

var GATE_TO_JOURNEY_STAGE = {};
Object.keys(GATE_MAP).forEach(function(gate) { GATE_TO_JOURNEY_STAGE[gate] = null; });
GATE_TO_JOURNEY_STAGE['discovery-approved']    = 'discovery';
GATE_TO_JOURNEY_STAGE['benefit-metric-active'] = 'benefit-metric';
GATE_TO_JOURNEY_STAGE['definition-complete']   = 'definition';
GATE_TO_JOURNEY_STAGE['test-plan-complete']    = 'test-plan';
GATE_TO_JOURNEY_STAGE['dor-signed-off']        = 'definition-of-ready';
// 'branch-complete' and 'definition-of-done' stay null -- CLI-only
// inner-loop milestones with no corresponding journey/session concept.

var _transport = function() {
  throw new Error('Adapter not wired: journeySyncClient. Call setJourneySyncClient() with a real implementation before use.');
};

function setJourneySyncClient(fn) { _transport = fn; }
function getJourneySyncClient() { return _transport; }

// Mirrors sign-off.js's own _logger convention -- non-throwing default so a
// missing setLogger() call only silences the audit trail, never breaks sync.
var _logger = {
  info: function() {},
  warn: function() {}
};
function setLogger(logger) { _logger = logger; }

/**
 * True only when both new CLI-side env vars are configured. AC6: the common
 * case (solo CLI usage, no web-UI product connected) must never attempt an
 * HTTP call or throw -- same observable outcome as "no journey found" (AC2).
 */
function _syncConfigured() {
  return !!(process.env.INTERNAL_SYNC_URL && process.env.INTERNAL_SYNC_SECRET);
}

/**
 * css-s1 AC1/AC2/AC6 -- resolve a web-UI journey for a pipeline-state.json
 * feature slug via the internal endpoint. css-s4: the resolved journey now
 * also carries its own currentStage (getLatestKnownStage's own result),
 * used by syncGateAdvanceToJourney's new conflict-detection logic.
 * @param {string} featureSlug
 * @returns {Promise<{journeyId:string, featureSlug:string, repoOwner:string|null, repoName:string|null, currentStage:string|null}|null>}
 */
async function resolveJourneyForFeatureSlug(featureSlug) {
  if (!_syncConfigured()) return null;
  var transport = getJourneySyncClient();
  var response = await transport('resolve', { featureSlug: featureSlug });
  if (!response || !response.found) return null;
  return response.journey;
}

/**
 * css-s1 AC1/AC3/AC4, css-s4 AC1 -- sync a CLI-side gate-advance onto the
 * resolved journey's completedStages, for ANY of the 7 gate-map.js gates.
 * AC3: if the resolved journey's own connected repo does not match this
 * CLI's own repo identity, the slug match is a cross-repo coincidence --
 * log the mismatch (NFR-Audit) and make no write call at all.
 *
 * css-s4: two new behaviours.
 * (1) A gate with no journey-side representation (GATE_TO_JOURNEY_STAGE
 *     maps it to null) safely no-ops -- same "nothing to sync to"
 *     precedent as AC2's own "no journey connected" case, not a new
 *     failure mode.
 * (2) For the 5 journey-representable gates, a genuine conflict is now
 *     checked: pipeline-state.json's own write for this gate already
 *     happened, unconditionally, before this function is ever called (via
 *     cli-gate-advance.js's own earlier advance() call) -- there is
 *     nothing to "correct" on that side. The only decision left is
 *     whether PUSHING that already-final value onto the journey would be
 *     correct. If the journey's own currentStage has independently
 *     diverged (differs from both lastSyncedStage and the gate's own
 *     target stage), pushing would silently overwrite the journey's own
 *     more-recent, disagreeing progress -- skip the push, log the
 *     conflict via conflict-resolver.js (the SAME mechanism css-s3 built
 *     for css-s2's own direction, reused here, not duplicated), and
 *     deliberately leave lastSyncedStage un-advanced so a later
 *     reconciliation/retry keeps flagging the unresolved disagreement.
 * @param {{journeyId:string, featureSlug:string, repoOwner:string|null, repoName:string|null, currentStage:string|null}} journey
 * @param {string} gate
 * @param {string|null} [lastSyncedStage] - read by the caller from local pipeline-state.json
 * @returns {Promise<void>}
 */
async function syncGateAdvanceToJourney(journey, gate, lastSyncedStage) {
  var targetStage = GATE_TO_JOURNEY_STAGE[gate];
  if (targetStage === undefined) return; // unknown gate name -- defensive, should never happen given gate-map.js's own enum
  if (targetStage === null) return; // css-s4: no journey-side representation for this gate -- safe no-op

  var ownRepoOwner = process.env.GITHUB_REPO_OWNER || null;
  var ownRepoName = process.env.GITHUB_REPO_NAME || null;
  var repoMismatch = !!(journey.repoOwner && journey.repoName && ownRepoOwner && ownRepoName &&
    (journey.repoOwner !== ownRepoOwner || journey.repoName !== ownRepoName));

  if (repoMismatch) {
    _logger.warn('journey-sync-mismatch', {
      featureSlug: journey.featureSlug,
      journeyId: journey.journeyId,
      reason: 'journey repo does not match this CLI\'s own repo identity'
    });
    return;
  }

  // css-s4: real conflict detection, reusing css-s3's own mechanism.
  var conflict = conflictResolver.detectConflict(lastSyncedStage || null, targetStage, journey.currentStage || null);
  if (conflict) {
    await conflictResolver.resolveConflict(journey.featureSlug, null, conflict.pipelineStateValue, conflict.journeyValue);
    _logger.warn('journey-sync-conflict', {
      featureSlug: journey.featureSlug,
      journeyId: journey.journeyId,
      pipelineStateValue: targetStage,
      journeyValue: journey.currentStage
    });
    return;
  }

  var transport = getJourneySyncClient();
  await transport('update', {
    journeyId: journey.journeyId,
    featureSlug: journey.featureSlug,
    stage: targetStage
  });
  _logger.info('journey-sync-success', { featureSlug: journey.featureSlug, journeyId: journey.journeyId });
}

/**
 * css-s1 (D37 real implementation) -- the actual network call to the
 * internal web-UI endpoint. Wired via setJourneySyncClient(), from
 * cli-gate-advance.js (D37 rule 3).
 * @param {'resolve'|'update'} op
 * @param {object} payload
 * @returns {Promise<object>}
 */
async function realJourneySyncTransport(op, payload) {
  var baseUrl = (process.env.INTERNAL_SYNC_URL || '').replace(/\/$/, '');
  var response = await fetch(baseUrl + '/internal/journey-sync/' + op, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-sync-secret': process.env.INTERNAL_SYNC_SECRET
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    throw new Error('journey-sync ' + op + ' request failed: HTTP ' + response.status);
  }
  return response.json();
}

module.exports = {
  resolveJourneyForFeatureSlug: resolveJourneyForFeatureSlug,
  syncGateAdvanceToJourney: syncGateAdvanceToJourney,
  realJourneySyncTransport: realJourneySyncTransport,
  setJourneySyncClient: setJourneySyncClient,
  getJourneySyncClient: getJourneySyncClient,
  setLogger: setLogger,
  GATE_TO_JOURNEY_STAGE: GATE_TO_JOURNEY_STAGE
};
```

**Important:** `SYNC_GATE`/`SYNC_STAGE` are REMOVED from the exports (replaced by `GATE_TO_JOURNEY_STAGE`). Task 3's own Step 4 below updates the one place that referenced `SYNC_GATE` (`cli-gate-advance.js`). If any OTHER file references `journeySyncClient.SYNC_GATE`/`SYNC_STAGE`, grep for it and report as DONE_WITH_CONCERNS rather than silently patching around it.

- [ ] **Step 4: Generalise `cli-gate-advance.js`'s own gate check**

In `src/enforcement/cli-gate-advance.js`, add this require near the top:

```javascript
var GATE_MAP = require('./gate-map');
```

Replace:

```javascript
  if (advanceResult.exitCode === 0 && gateName === journeySyncClient.SYNC_GATE) {
    try {
      var journey = await journeySyncClient.resolveJourneyForFeatureSlug(featureSlug);
      if (journey) {
        await journeySyncClient.syncGateAdvanceToJourney(journey, gateName);
```

with:

```javascript
  if (advanceResult.exitCode === 0 && GATE_MAP[gateName]) {
    try {
      var journey = await journeySyncClient.resolveJourneyForFeatureSlug(featureSlug);
      if (journey) {
        // css-s4: read this story's own locally-accumulated lastSyncedStage
        // for this story, to pass into syncGateAdvanceToJourney's own new
        // conflict-detection logic.
        var _localState = JSON.parse(require('fs').readFileSync(require('path').join(repoRoot, '.github', 'pipeline-state.json'), 'utf8'));
        var _localFeature = (_localState.features || []).find(function(f) { return f.slug === featureSlug || f.id === featureSlug; });
        var _localStory = _localFeature && ((_localFeature.stories || []).find(function(s) { return s.id === storyId || s.slug === storyId; }) ||
          (_localFeature.epics || []).reduce(function(found, epic) { return found || (epic.stories || []).find(function(s) { return s.id === storyId || s.slug === storyId; }); }, null));
        var _lastSyncedStage = _localStory ? _localStory.lastSyncedStage : null;
        await journeySyncClient.syncGateAdvanceToJourney(journey, gateName, _lastSyncedStage);
```

Everything else in this block (the `lastSyncedStage` bookkeeping `advance()` call added in css-s3's Task 5, the catch blocks) stays exactly as-is -- this change only widens the gate check and threads one new argument through.

- [ ] **Step 5: Run test — must pass**

```bash
node tests/check-css-s4-gate-vocabulary.js
```

Expected output: count your own assertions (T1: 6, T2: 1, T3: 5, T4: 2, T5: 1, T6: 2, T7: 2 = 19) — trust your own run's real output over this arithmetic if they differ.

- [ ] **Step 6: Run full suite**

```bash
node scripts/run-all-tests.js
```

Expected: all tests passing. Pay particular attention to `tests/check-css-s1-journey-sync-client.js`, `tests/check-css-s1-gate-advance-integration.js`, `tests/check-css-s1-journey-sync-wiring.js`, `tests/check-css-s3-last-synced-bookkeeping.js` (all exercise the files this task modifies) — these tests likely reference `journeySyncClient.SYNC_GATE`/`SYNC_STAGE` directly, which no longer exist. If any of these fail because they reference the removed exports, this is a REAL regression you introduced -- fix those test files to use `GATE_TO_JOURNEY_STAGE['discovery-approved']` (which equals the old `SYNC_STAGE` value, `'discovery'`) and `'discovery-approved'` (the old `SYNC_GATE` value) as literal replacements, preserving each test's own original intent exactly. Report exactly which files you had to touch and why.

- [ ] **Step 7: Commit**

```bash
git add src/sync/journey-sync-client.js src/enforcement/cli-gate-advance.js tests/check-css-s4-gate-vocabulary.js
# Also add any sibling test files you had to fix per Step 6's instructions -- list them explicitly in your commit
git commit -m "feat(css-s4): generalise journey-sync-client.js to all 7 gates with real conflict detection"
```

---

## Task 4: `reconciliation.js` + wiring into `journey.js` (AC2)

**Files:**
- Create: `src/sync/reconciliation.js`
- Modify: `src/web-ui/routes/journey.js`
- Test: `tests/check-css-s4-reconciliation.js`

- [ ] **Step 1: Write the failing test**

```javascript
#!/usr/bin/env node
/**
 * check-css-s4-reconciliation.js
 *
 * Tests for css-s4's reconciliation safety net (AC2): catches a css-s2
 * in-request retry that was exhausted (a logged, unresolved sync_log gap),
 * and re-attempts the sync using a SUBSEQUENT live request's own token --
 * never a stored credential from the original failed attempt.
 *
 * Run: node tests/check-css-s4-reconciliation.js
 */
'use strict';

const syncLog = require('../src/web-ui/adapters/sync-log');
const reconciliation = require('../src/sync/reconciliation');

let totalPassed = 0;
let totalFailed = 0;
const issues = [];

function assert(label, condition, message) {
  if (condition) { totalPassed++; } else { totalFailed++; issues.push(`  ✗ [${label}] ${message}`); }
}

function makeFakePool(rows) {
  const calls = [];
  return {
    calls: calls,
    query: async function(sql, params) {
      calls.push({ sql, params });
      var sqlUpper = String(sql).replace(/\s+/g, ' ').trim().toUpperCase();
      if (sqlUpper.indexOf('SELECT') === 0) return { rows: rows || [] };
      return { rows: [] };
    }
  };
}

async function run() {
  console.log('\n[css-s4] reconciliation tests\n');

  // T1 (AC2): findOpenGap finds an unresolved gap entry for a feature
  await (async function T1() {
    const pool = makeFakePool([{ id: 42, feature_slug: 'test-feat', entry_type: 'gap', created_at: '2026-10-25T00:00:00Z', resolved_at: null }]);
    syncLog._setPoolForTesting(pool);
    const gap = await reconciliation.findOpenGap('test-feat');
    assert('T1-finds-gap', gap && gap.id === 42, `expected to find the open gap entry, got ${JSON.stringify(gap)}`);
    const selectCall = pool.calls.find(function(c) { return String(c.sql).toUpperCase().indexOf('SELECT') === 0; });
    assert('T1-queries-unresolved-only', String(selectCall.sql).toUpperCase().indexOf('RESOLVED_AT IS NULL') !== -1, 'expected the query to filter on resolved_at IS NULL');
  })();

  // T2 (AC2): findOpenGap returns null when no open gap exists
  await (async function T2() {
    const pool = makeFakePool([]);
    syncLog._setPoolForTesting(pool);
    const gap = await reconciliation.findOpenGap('test-feat-clean');
    assert('T2-no-gap-returns-null', gap === null, 'expected null when no open gap exists for this feature');
  })();

  // T3 (AC2): reconcile re-attempts using the CALLING request's own writer/context -- never a stored credential
  await (async function T3() {
    const pool = { calls: [], query: async function(sql, params) {
      this.calls.push({ sql, params });
      var sqlUpper = String(sql).replace(/\s+/g, ' ').trim().toUpperCase();
      if (sqlUpper.indexOf('SELECT') === 0) return { rows: [{ id: 99, feature_slug: 'test-feat-2', entry_type: 'gap', created_at: '2026-10-25T00:00:00Z', resolved_at: null }] };
      return { rows: [] };
    } };
    syncLog._setPoolForTesting(pool);

    let writerCalledWith = null;
    const mockWriter = async function(featureSlug, storyId, stateUpdate, context) {
      writerCalledWith = { featureSlug, storyId, stateUpdate, context };
      return { conflict: null };
    };

    const result = await reconciliation.reconcile('test-feat-2', 's1', { token: 'this-requests-own-live-token', owner: 'acme', repo: 'proj' }, mockWriter, { stage: 'definition' });

    assert('T3-calls-writer', !!writerCalledWith, 'expected reconcile to call the provided writer function');
    assert('T3-uses-live-context-token', writerCalledWith && writerCalledWith.context.token === 'this-requests-own-live-token', 'expected the writer to be called with the CALLING request\'s own context/token, not a stored one -- reconcile() accepts no credential parameter of its own at all');
    assert('T3-marks-resolved', pool.calls.some(function(c) { return String(c.sql).toUpperCase().indexOf('UPDATE') === 0 && String(c.sql).toUpperCase().indexOf('RESOLVED_AT') !== -1; }), 'expected an UPDATE ... resolved_at query after a successful re-attempt');
    assert('T3-result-resolved-true', result.resolved === true, `expected result.resolved === true, got ${JSON.stringify(result)}`);
  })();

  // T4 (AC2): reconcile logs a fresh gap (does not mark resolved) if the re-attempt fails again
  await (async function T4() {
    const pool = { calls: [], query: async function(sql, params) {
      this.calls.push({ sql, params });
      var sqlUpper = String(sql).replace(/\s+/g, ' ').trim().toUpperCase();
      if (sqlUpper.indexOf('SELECT') === 0) return { rows: [{ id: 100, feature_slug: 'test-feat-3', entry_type: 'gap', created_at: '2026-10-25T00:00:00Z', resolved_at: null }] };
      return { rows: [] };
    } };
    syncLog._setPoolForTesting(pool);

    const failingWriter = async function() { throw new Error('simulated: re-attempt also failed'); };
    const result = await reconciliation.reconcile('test-feat-3', 's1', { token: 'tok', owner: 'acme', repo: 'proj' }, failingWriter, { stage: 'definition' });

    assert('T4-result-resolved-false', result.resolved === false, `expected result.resolved === false when the re-attempt itself fails, got ${JSON.stringify(result)}`);
    const resolveCall = pool.calls.find(function(c) { return String(c.sql).toUpperCase().indexOf('UPDATE') === 0 && String(c.sql).toUpperCase().indexOf('RESOLVED_AT') !== -1; });
    assert('T4-not-marked-resolved', !resolveCall, 'expected NO resolved_at UPDATE when the re-attempt itself failed -- the gap stays open for a future reconciliation attempt');
  })();

  console.log(`[css-s4] ${totalPassed} passed, ${totalFailed} failed\n`);
  if (issues.length > 0) {
    console.log(issues.join('\n'));
    console.log('');
  }
  process.exit(totalFailed === 0 ? 0 : 1);
}

run();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-css-s4-reconciliation.js
```

Expected: `Error: Cannot find module '../src/sync/reconciliation'`.

- [ ] **Step 3: Write `src/sync/reconciliation.js`**

```javascript
'use strict';

// reconciliation.js — css-s4: the reconciliation safety net (AC2). When a
// css-s2 in-request retry was exhausted (a sync_log 'gap' entry was
// logged), this module is called opportunistically from a SUBSEQUENT live,
// authenticated request touching the same feature -- never a scheduled
// background job, and never a stored credential (ADR-020 / this epic's own
// established no-stored-credential constraint, see decisions.md). Reuses
// whatever live context/token the CALLING request already has.

var { Pool } = require('pg');

let _pool = null;
let _poolForTesting = null;

function _setPoolForTesting(pool) {
  _poolForTesting = pool;
}

function _isLocalHost(connectionString) {
  try {
    var hostname = new URL(connectionString).hostname;
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1' || hostname === '[::1]';
  } catch (_) {
    return false;
  }
}

function _getPool() {
  if (_poolForTesting) return _poolForTesting;
  if (!_pool && process.env.DATABASE_URL) {
    var poolConfig = { connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 10000 };
    if (!_isLocalHost(process.env.DATABASE_URL)) poolConfig.ssl = { rejectUnauthorized: false };
    _pool = new Pool(poolConfig);
  }
  return _pool;
}

/**
 * Finds the most recent unresolved 'gap' entry for a feature, or null.
 * @param {string} featureSlug
 * @returns {Promise<{id:number, feature_slug:string, entry_type:string, created_at:string, resolved_at:null}|null>}
 */
async function findOpenGap(featureSlug) {
  var pool = _getPool();
  if (!pool) return null;
  var result = await pool.query(
    "SELECT id, feature_slug, entry_type, created_at, resolved_at FROM sync_log WHERE feature_slug = $1 AND entry_type = 'gap' AND resolved_at IS NULL ORDER BY created_at DESC LIMIT 1",
    [featureSlug]
  );
  return result.rows[0] || null;
}

/**
 * Re-attempts a pipeline-state.json write for a feature with an open gap,
 * using the CALLING request's own live writer/context -- reconcile() never
 * accepts or stores a credential of its own; `writerFn` and `context` are
 * both supplied fresh by the caller on every invocation.
 * @param {string} featureSlug
 * @param {string} storyId
 * @param {object} context - the CALLING request's own live _pipelineStateContext (token/owner/repo)
 * @param {Function} writerFn - the CALLING request's own already-wired _pipelineStateWriter
 * @param {object} stateUpdate - the write payload for the re-attempt
 * @returns {Promise<{resolved: boolean}>}
 */
async function reconcile(featureSlug, storyId, context, writerFn, stateUpdate) {
  var pool = _getPool();
  if (!pool) return { resolved: false };

  var gap = await findOpenGap(featureSlug);
  if (!gap) return { resolved: false };

  try {
    await writerFn(featureSlug, storyId, stateUpdate, context);
    await pool.query('UPDATE sync_log SET resolved_at = NOW() WHERE id = $1', [gap.id]);
    return { resolved: true };
  } catch (reconcileErr) {
    // Re-attempt itself failed -- the gap stays open (resolved_at untouched)
    // for a future reconciliation attempt. Never throw -- this is an
    // opportunistic, best-effort check layered onto an already-successful
    // request; it must never turn that request into a failure.
    return { resolved: false };
  }
}

module.exports = { findOpenGap: findOpenGap, reconcile: reconcile, _setPoolForTesting: _setPoolForTesting };
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-css-s4-reconciliation.js
```

Expected: `[css-s4] 7 passed, 0 failed` (2 T1 + 1 T2 + 3 T3 + 1 T4 = 7 — trust your own run over this count).

- [ ] **Step 5: Wire the reconciliation check into `journey.js`**

In `src/web-ui/routes/journey.js`, find the block that reads (added in css-s3's Task 7, right after the conflict-correction `if` block, still inside the `try` that wraps the pipeline-state write):

```javascript
    if (_pipelineStateWriteResult && _pipelineStateWriteResult.conflict) {
```

...and its closing `}`. Immediately AFTER that whole `if (_pipelineStateWriteResult && _pipelineStateWriteResult.conflict) { ... }` block (still inside the same outer `try`, after `stateWriteSucceeded = true` has already been set), add:

```javascript
    // css-4 (AC2): opportunistic reconciliation -- if THIS SAME feature has
    // an open sync_log gap from a PRIOR request's own exhausted retry, use
    // this request's own already-live _pipelineStateContext/writer to
    // re-attempt it. Never blocks or changes this request's own outcome --
    // the gap check and re-attempt are both best-effort, wrapped in their
    // own try/catch, same non-blocking contract as every other optional
    // Postgres-backed feature in this file.
    if (process.env.DATABASE_URL) {
      try {
        var _reconcileResult = await require('../sync/reconciliation').reconcile(
          journey.featureSlug, storyId, _pipelineStateContext, _pipelineStateWriter, stateUpdate
        );
        if (_reconcileResult.resolved) {
          console.info(JSON.stringify({ event: 'reconciliation_gap_resolved', featureSlug: journey.featureSlug, storyId: storyId }));
        }
      } catch (_reconcileErr) {
        console.error('[reconciliation] check failed:', _reconcileErr.message);
      }
    }
```

- [ ] **Step 6: Run full suite**

```bash
node scripts/run-all-tests.js
```

Expected: all tests passing. Pay particular attention to every test exercising `handlePostGateConfirm` (`check-acdg-s2-durability-signal.js`, `check-css-s2-gate-confirm-sync-log-integration.js`, `check-css-s3-journey-correction.js`, `check-css-s3-pipeline-state-conflict-wiring.js`) -- confirm none of them regress, since this adds a new DATABASE_URL-guarded block to a function they all exercise.

- [ ] **Step 7: Commit**

```bash
git add src/sync/reconciliation.js src/web-ui/routes/journey.js tests/check-css-s4-reconciliation.js
git commit -m "feat(css-s4): add reconciliation safety net and wire it into handlePostGateConfirm"
```

---

## Task 5: Structural NFR check (parameterized, not 7 copies) + css-s2-direction vocabulary test

**Files:**
- Create: `scripts/check-sync-mechanism-is-parameterized.js`, `tests/check-sync-mechanism-is-parameterized.js`, `tests/check-css-s4-css-s2-vocabulary.js`

- [ ] **Step 1: Write the structural check script**

```javascript
#!/usr/bin/env node
/**
 * check-sync-mechanism-is-parameterized.js
 *
 * css-s4 NFR (Performance): the sync mechanism must be ONE implementation
 * parameterized by gate type, not 7 hand-written copies. Structural check:
 * scans journey-sync-client.js for repeated near-identical gate-specific
 * blocks (the anti-pattern this would look like if someone hand-wrote 7
 * copies instead of using GATE_TO_JOURNEY_STAGE).
 *
 * Run: node scripts/check-sync-mechanism-is-parameterized.js
 */
'use strict';

const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'src', 'sync', 'journey-sync-client.js');
const content = fs.readFileSync(FILE, 'utf8');

let failed = false;

// Check 1: GATE_TO_JOURNEY_STAGE's keys must be derived from gate-map.js's
// own require, not a second hardcoded array of the same 7 gate-name strings.
if (!/Object\.keys\(GATE_MAP\)/.test(content)) {
  console.error('[check-sync-mechanism-is-parameterized] FAIL: GATE_TO_JOURNEY_STAGE does not derive its keys from Object.keys(GATE_MAP) -- the 7 gate names may be duplicated as a second hardcoded list.');
  failed = true;
}

// Check 2: syncGateAdvanceToJourney must appear exactly once (one function,
// not 7 near-identical gate-specific functions).
const fnMatches = content.match(/function syncGateAdvanceToJourney/g) || [];
if (fnMatches.length !== 1) {
  console.error(`[check-sync-mechanism-is-parameterized] FAIL: expected exactly 1 syncGateAdvanceToJourney function, found ${fnMatches.length}.`);
  failed = true;
}

if (!failed) {
  console.log('[check-sync-mechanism-is-parameterized] OK: sync mechanism is one parameterized implementation, not 7 gate-specific copies.');
}

process.exit(failed ? 1 : 0);
```

- [ ] **Step 2: Write its test wrapper**

```javascript
#!/usr/bin/env node
/**
 * check-sync-mechanism-is-parameterized.js (test wrapper for the script of the same name under scripts/)
 *
 * Run: node tests/check-sync-mechanism-is-parameterized.js
 */
'use strict';
const { execSync } = require('child_process');
const path = require('path');

let totalPassed = 0;
let totalFailed = 0;

function assert(label, condition, message) {
  if (condition) { totalPassed++; } else { totalFailed++; console.log(`  ✗ [${label}] ${message}`); }
}

try {
  const output = execSync('node ' + path.join(__dirname, '..', 'scripts', 'check-sync-mechanism-is-parameterized.js'), { encoding: 'utf8' });
  assert('script-passes', output.indexOf('OK:') !== -1, `expected the structural check to pass against the real journey-sync-client.js, got: ${output}`);
} catch (err) {
  assert('script-passes', false, `expected the structural check to exit 0, it failed: ${err.message}`);
}

console.log(`[check-sync-mechanism-is-parameterized] ${totalPassed} passed, ${totalFailed} failed`);
process.exit(totalFailed === 0 ? 0 : 1);
```

- [ ] **Step 3: Write the css-s2-direction vocabulary test**

```javascript
#!/usr/bin/env node
/**
 * check-css-s4-css-s2-vocabulary.js
 *
 * css-s4 AC1, css-s2's own direction: confirms pipeline-state-github-writer.js
 * is ALREADY generic across all 7 gate-map.js stage values -- no
 * implementation change was needed there (see decisions.md's DoR-contract
 * correction). This test is the evidence for that claim, exercising the
 * real applyStateUpdate with each of the 7 values in turn.
 *
 * Run: node tests/check-css-s4-css-s2-vocabulary.js
 */
'use strict';

const GATE_MAP = require('../src/enforcement/gate-map');
const syncLog = require('../src/web-ui/adapters/sync-log');
const pipelineStateGithubWriterFactory = require('../src/web-ui/adapters/pipeline-state-github-writer');

let totalPassed = 0;
let totalFailed = 0;
const issues = [];

function assert(label, condition, message) {
  if (condition) { totalPassed++; } else { totalFailed++; issues.push(`  ✗ [${label}] ${message}`); }
}

function b64(obj) { return Buffer.from(JSON.stringify(obj, null, 2) + '\n', 'utf8').toString('base64'); }

function installFetchMock(handlers) {
  const calls = [];
  const original = global.fetch;
  global.fetch = async function(url, opts) {
    calls.push({ url, opts });
    for (const h of handlers) { const result = h(url, opts, calls.length - 1); if (result) return result; }
    throw new Error('Unhandled fetch call: ' + url);
  };
  return { calls, restore: function() { global.fetch = original; } };
}
function jsonResponse(status, body, extra) {
  return Object.assign({ ok: status >= 200 && status < 300, status: status, json: async () => body }, extra || {});
}
function userHandler() {
  return (url) => /\/user$/.test(url) ? jsonResponse(200, { login: 'octocat', name: 'The Octocat', email: 'octocat@example.com' }) : null;
}

async function run() {
  console.log('\n[css-s4] css-s2-direction full-vocabulary test\n');

  const gateNames = Object.keys(GATE_MAP);
  assert('T0-seven-gates', gateNames.length === 7, `expected gate-map.js to export exactly 7 gates, got ${gateNames.length}`);

  for (const gateName of gateNames) {
    await (async function() {
      const pool = { calls: [], query: async function(sql, params) { this.calls.push({ sql, params }); return { rows: [] }; } };
      syncLog._setPoolForTesting(pool);

      const state = {
        schemaVersion: '1',
        features: [{ slug: 'test-feat-vocab', id: 'test-feat-vocab', updatedAt: 'T0', stories: [
          { id: 's1', slug: 's1', stage: 'some-prior-value', lastSyncedStage: 'some-prior-value', updatedAt: 'T0' },
        ] }],
      };
      let putBody = null;
      const mock = installFetchMock([
        userHandler(),
        (url, opts) => /\/contents\//.test(url) && (!opts || opts.method === undefined) ? jsonResponse(200, { sha: 'sha-' + gateName }) : null,
        (url) => /\/git\/blobs\//.test(url) ? jsonResponse(200, { content: b64(state), encoding: 'base64' }) : null,
        (url, opts) => { if (/\/contents\//.test(url) && opts && opts.method === 'PUT') { putBody = JSON.parse(opts.body); return jsonResponse(200, {}); } return null; },
      ]);
      try {
        const writer = pipelineStateGithubWriterFactory();
        await writer('test-feat-vocab', 's1', { stage: gateName }, { token: 'tok', owner: 'acme', repo: 'proj' });
        const decoded = JSON.parse(Buffer.from(putBody.content, 'base64').toString('utf8'));
        assert('T-' + gateName, decoded.features[0].stories[0].stage === gateName, `expected gate value "${gateName}" to flow through uniformly (no special-casing), got "${decoded.features[0].stories[0].stage}"`);
      } finally {
        mock.restore();
      }
    })();
  }

  console.log(`[css-s4] ${totalPassed} passed, ${totalFailed} failed\n`);
  if (issues.length > 0) { console.log(issues.join('\n')); console.log(''); }
  process.exit(totalFailed === 0 ? 0 : 1);
}

run();
```

- [ ] **Step 4: Run all three, confirm passing**

```bash
node scripts/check-sync-mechanism-is-parameterized.js
node tests/check-sync-mechanism-is-parameterized.js
node tests/check-css-s4-css-s2-vocabulary.js
```

Expected: script prints `OK:`; wrapper reports `1 passed, 0 failed`; vocabulary test reports `8 passed, 0 failed` (1 T0 + 7 gate values).

- [ ] **Step 5: Run full suite**

```bash
node scripts/run-all-tests.js
```

- [ ] **Step 6: Commit**

```bash
git add scripts/check-sync-mechanism-is-parameterized.js tests/check-sync-mechanism-is-parameterized.js tests/check-css-s4-css-s2-vocabulary.js
git commit -m "test(css-s4): add structural parameterization check and css-s2-direction full-vocabulary test"
```

---

## Final task: AC3 honest-reporting language, confirm full suite, proceed to /verify-completion

Not a code task.

- [ ] Update `artefacts/2026-08-07-cross-surface-state-sync/verification-scripts/css-s4-verification.md`'s AC3 scenario to state honestly that the 90% minimum-validation-signal measurement requires 4 weeks of real production usage after this story merges — it cannot be measured at implementation time. Mark it `[ ] Not yet measurable — see decisions.md` rather than leaving a blank checkbox or claiming a false pass.
- [ ] Confirm `decisions.md`'s css-s4 ARCH entries (already written) are present and unchanged.
- [ ] Confirm `test-plans/css-s4-test-plan.md` and `dor/css-s4-dor-contract.md` (already revised) match what was actually built.
- [ ] Run `node scripts/run-all-tests.js` one final time — 0 failures required before `/verify-completion`.
- [ ] `src/web-ui/routes/journey.js` IS touched — the route/handler E2E coverage check at `/verify-completion` is required, same pattern as css-s2/css-s3.
- [ ] Proceed to `/verify-completion`.
