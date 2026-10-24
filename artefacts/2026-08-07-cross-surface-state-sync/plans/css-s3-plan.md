# Detect a genuine cross-surface conflict, resolve it to pipeline-state.json's value, and log it — Implementation Plan

> **For agent execution:** Use /subagent-execution.

**Goal:** Build a general-purpose conflict detector/resolver, wire it into css-s2's real sync direction (where genuinely different values can occur), and keep a shared "last synced" marker current on both sides. See `artefacts/2026-08-07-cross-surface-state-sync/decisions.md`'s two css-s3 ARCH entries for the full design reasoning — do not rebuild what they already explain.
**Branch:** `feature/css-s3`
**Worktree:** `.worktrees/css-s3`
**Test command:** `node scripts/run-all-tests.js` (full suite); `node tests/<file>.js` (single file)

---

## File map

```
Create:
  src/sync/conflict-resolver.js                        — detectConflict (pure) + resolveConflict (logs + returns winner)
  tests/check-css-s3-conflict-resolver.js               — unit tests for conflict-resolver.js (AC1-AC4)
  tests/check-css-s3-pipeline-state-conflict-wiring.js  — integration test: applyStateUpdate's real conflict handling (AC1, AC2)
  tests/check-css-s3-last-synced-bookkeeping.js         — unit test: cli-gate-advance.js updates lastSyncedStage after a successful sync
  tests/check-css-s3-nfr.js                             — NFR tests (performance, security, audit)

Modify:
  .github/pipeline-state.schema.json   — add lastSyncedStage to the story-level schema
  src/web-ui/adapters/sync-log.js      — add logConflict()
  src/web-ui/adapters/pipeline-state-github-writer.js — wire real conflict detection into applyStateUpdate
  src/enforcement/cli-gate-advance.js  — update lastSyncedStage after a successful CLI->web-UI sync
```

---

## Task 1: Schema — add `lastSyncedStage`

**Files:**
- Modify: `.github/pipeline-state.schema.json`

No dedicated test — this repo's own established convention for schema-only additions. Verified by Task 4's integration test actually exercising the field, and by `node scripts/check-pipeline-state-integrity.js` (run as part of the full suite) not rejecting it.

- [ ] **Step 1: Locate the insertion point**

Open `.github/pipeline-state.schema.json` and find the story-level `properties` block (search for `"prUrl":    { "type": "string" },` inside the `stories` array's `items.properties`).

- [ ] **Step 2: Add the field**

Insert immediately after the `"prUrl"` line:

```json
"lastSyncedStage": { "type": "string", "description": "css-s3: the stage/gate value both pipeline-state.json and the connected web-UI journey last agreed on, via css-s1/css-s2's sync mechanisms. Used to detect genuine cross-surface conflicts (both sides independently changed since this marker) versus ordinary single-sided propagation." },
```

- [ ] **Step 3: Validate JSON syntax**

```bash
node -e "JSON.parse(require('fs').readFileSync('.github/pipeline-state.schema.json', 'utf8')); console.log('valid JSON')"
```

Expected output: `valid JSON`

- [ ] **Step 4: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: all tests passing (787 baseline from the stacked `feature/css-s2` branch this worktree is built on — confirm this exact number by reading the actual baseline count from this worktree's own clean-baseline confirmation at `/branch-setup`, not assumed).

- [ ] **Step 5: Commit**

```bash
git add .github/pipeline-state.schema.json
git commit -m "feat(css-s3): add lastSyncedStage to pipeline-state schema"
```

---

## Task 2: `sync-log.js` — add `logConflict()`

**Files:**
- Modify: `src/web-ui/adapters/sync-log.js`

This extends an already-reviewed module from css-s2 (same file, additive only — do not change `logReconciliationGap` or `_setPoolForTesting`).

- [ ] **Step 1: Write the failing test**

Append this test to a NEW file `tests/check-css-s3-conflict-resolver.js` (this file will also hold Task 3's tests — add this one first as the Task 2 red step):

```javascript
#!/usr/bin/env node
/**
 * check-css-s3-conflict-resolver.js
 *
 * Unit tests for css-s3's conflict-resolver.js and sync-log.js's new
 * logConflict() export. Covers AC1-AC4.
 *
 * Run: node tests/check-css-s3-conflict-resolver.js
 */
'use strict';

const syncLog = require('../src/web-ui/adapters/sync-log');

let totalPassed = 0;
let totalFailed = 0;
const issues = [];

function assert(label, condition, message) {
  if (condition) { totalPassed++; } else { totalFailed++; issues.push(`  ✗ [${label}] ${message}`); }
}

function makeFakePool() {
  const calls = [];
  return {
    calls: calls,
    query: async function(sql, params) {
      calls.push({ sql: sql, params: params });
      return { rows: [] };
    }
  };
}

async function run() {
  console.log('\n[css-s3] conflict-resolver + sync-log.logConflict tests\n');

  // T0 (Task 2 red/green step): sync-log.js's new logConflict() writes an INSERT with all 3 value columns
  await (async function T0() {
    const pool = makeFakePool();
    syncLog._setPoolForTesting(pool);
    // Three DISTINCT values (not pipelineStateValue === resolvedValue) so
    // each param position is independently checked -- a transposition bug
    // (e.g. writing pipelineStateValue into both the $4 and $6 slots
    // instead of resolvedValue) would otherwise pass undetected, exactly
    // the "proves presence, not correct wiring" weak-test shape CLAUDE.md's
    // D37 rule warns about (tir-s1/tir-s5). Found during Task 2's own
    // code-quality review -- fixed here so Task 3 does not reintroduce it.
    await syncLog.logConflict('test-feature-slug', 'tenant-abc', 'definition', 'review', 'resolved-result');

    assert('T0-one-call', pool.calls.length === 1, `expected exactly 1 query call, got ${pool.calls.length}`);
    const call = pool.calls[0];
    const sqlUpper = String(call.sql).replace(/\s+/g, ' ').trim().toUpperCase();
    assert('T0-is-insert', sqlUpper.indexOf('INSERT') === 0, `expected an INSERT statement, got: ${sqlUpper}`);
    assert('T0-targets-sync-log', sqlUpper.indexOf('SYNC_LOG') !== -1, `expected the statement to target sync_log, got: ${sqlUpper}`);
    assert('T0-has-entry-type-conflict', call.params.indexOf('conflict') !== -1, "expected entry_type param to be 'conflict'");
    // logConflict JSON.stringify's each value before it reaches the params
    // array (correct -- these columns are JSONB, so a bare unquoted JS
    // string is not valid JSON; the param must itself be the JSON text
    // '"definition"'). Check the params array directly for that exact
    // element -- do NOT JSON.stringify(call.params) first, which would
    // double-encode and escape the inner quotes, hiding the literal match.
    assert('T0-has-pipeline-state-value', call.params.indexOf('"definition"') !== -1, 'expected pipeline_state_value (JSON-encoded "definition") present in params');
    assert('T0-has-journey-value', call.params.indexOf('"review"') !== -1, 'expected journey_value (JSON-encoded "review") present in params');
    assert('T0-has-resolved-value', call.params.indexOf('"resolved-result"') !== -1, 'expected resolved_value (JSON-encoded "resolved-result") present in params, distinct from pipeline_state_value -- catches a transposition bug the original duplicate-value fixture could not');
  })();

  console.log(`[css-s3] ${totalPassed} passed, ${totalFailed} failed (partial — Task 2 only; Task 3 appends more below)\n`);
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
node tests/check-css-s3-conflict-resolver.js
```

Expected output: a `TypeError` — `syncLog.logConflict is not a function` (it doesn't exist yet).

- [ ] **Step 3: Add `logConflict()` to `sync-log.js`**

Add this function to `src/web-ui/adapters/sync-log.js`, immediately after the existing `logReconciliationGap` function (before `module.exports`):

```javascript
/**
 * Logs a conflict entry: a genuine cross-surface disagreement where both
 * pipeline-state.json and the connected web-UI journey independently
 * changed since the last-synced marker, to DIFFERENT values. The resolved
 * value is always pipelineStateValue (css-s1's own ARCH decision:
 * pipeline-state.json is canonical). Can throw/reject on a real DB failure
 * -- same contract as logReconciliationGap; callers decide their own
 * error-handling strategy.
 * @param {string} featureSlug
 * @param {string|null} tenantId
 * @param {string} pipelineStateValue
 * @param {string} journeyValue
 * @param {string} resolvedValue
 * @returns {Promise<void>}
 */
async function logConflict(featureSlug, tenantId, pipelineStateValue, journeyValue, resolvedValue) {
  const pool = _getPool();
  if (!pool) return;
  await pool.query(
    'INSERT INTO sync_log (feature_slug, tenant_id, entry_type, pipeline_state_value, journey_value, resolved_value, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW())',
    [featureSlug, tenantId || null, 'conflict', JSON.stringify(pipelineStateValue), JSON.stringify(journeyValue), JSON.stringify(resolvedValue)]
  );
}
```

Update the `module.exports` line at the bottom of `sync-log.js` from:
```javascript
module.exports = { logReconciliationGap, _setPoolForTesting };
```
to:
```javascript
module.exports = { logReconciliationGap, logConflict, _setPoolForTesting };
```

Do not change `logReconciliationGap` or `_setPoolForTesting` — additive only.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-css-s3-conflict-resolver.js
```

Expected output: `[css-s3] 6 passed, 0 failed (partial — Task 2 only; Task 3 appends more below)`

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: all tests passing, including css-s2's own `tests/check-css-s2-sync-log.js` (confirms `logReconciliationGap`/`_setPoolForTesting` are unaffected by this additive change).

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/adapters/sync-log.js tests/check-css-s3-conflict-resolver.js
git commit -m "feat(css-s3): add sync-log.js logConflict() export"
```

---

## Task 3: `conflict-resolver.js` — detector + resolver

**Files:**
- Create: `src/sync/conflict-resolver.js`
- Test: append to `tests/check-css-s3-conflict-resolver.js` (created in Task 2)

- [ ] **Step 1: Write the failing tests**

Replace the ENTIRE content of `tests/check-css-s3-conflict-resolver.js` with this (it supersedes the Task 2 partial version — T0 is preserved, new tests T1-T6 added, and the final summary/exit-code block moves to the end):

```javascript
#!/usr/bin/env node
/**
 * check-css-s3-conflict-resolver.js
 *
 * Unit tests for css-s3's conflict-resolver.js and sync-log.js's new
 * logConflict() export. Covers AC1-AC4.
 *
 * Run: node tests/check-css-s3-conflict-resolver.js
 */
'use strict';

const syncLog = require('../src/web-ui/adapters/sync-log');
const conflictResolver = require('../src/sync/conflict-resolver');

let totalPassed = 0;
let totalFailed = 0;
const issues = [];

function assert(label, condition, message) {
  if (condition) { totalPassed++; } else { totalFailed++; issues.push(`  ✗ [${label}] ${message}`); }
}

function makeFakePool() {
  const calls = [];
  return {
    calls: calls,
    query: async function(sql, params) {
      calls.push({ sql: sql, params: params });
      return { rows: [] };
    }
  };
}

async function run() {
  console.log('\n[css-s3] conflict-resolver + sync-log.logConflict tests\n');

  // T0: sync-log.js's logConflict() writes an INSERT with all 3 value columns
  await (async function T0() {
    const pool = makeFakePool();
    syncLog._setPoolForTesting(pool);
    // Three DISTINCT values (not pipelineStateValue === resolvedValue) so
    // each param position is independently checked -- a transposition bug
    // (e.g. writing pipelineStateValue into both the $4 and $6 slots
    // instead of resolvedValue) would otherwise pass undetected, exactly
    // the "proves presence, not correct wiring" weak-test shape CLAUDE.md's
    // D37 rule warns about (tir-s1/tir-s5).
    await syncLog.logConflict('test-feature-slug', 'tenant-abc', 'definition', 'review', 'resolved-result');

    assert('T0-one-call', pool.calls.length === 1, `expected exactly 1 query call, got ${pool.calls.length}`);
    const call = pool.calls[0];
    const sqlUpper = String(call.sql).replace(/\s+/g, ' ').trim().toUpperCase();
    assert('T0-is-insert', sqlUpper.indexOf('INSERT') === 0, `expected an INSERT statement, got: ${sqlUpper}`);
    assert('T0-targets-sync-log', sqlUpper.indexOf('SYNC_LOG') !== -1, `expected the statement to target sync_log, got: ${sqlUpper}`);
    assert('T0-has-entry-type-conflict', call.params.indexOf('conflict') !== -1, "expected entry_type param to be 'conflict'");
    // logConflict JSON.stringify's each value before it reaches the params
    // array (correct -- these columns are JSONB, so a bare unquoted JS
    // string is not valid JSON; the param must itself be the JSON text
    // '"definition"'). Check the params array directly for that exact
    // element -- do NOT JSON.stringify(call.params) first, which would
    // double-encode and escape the inner quotes, hiding the literal match.
    assert('T0-has-pipeline-state-value', call.params.indexOf('"definition"') !== -1, 'expected pipeline_state_value (JSON-encoded "definition") present in params');
    assert('T0-has-journey-value', call.params.indexOf('"review"') !== -1, 'expected journey_value (JSON-encoded "review") present in params');
    assert('T0-has-resolved-value', call.params.indexOf('"resolved-result"') !== -1, 'expected resolved_value (JSON-encoded "resolved-result") present in params, distinct from pipeline_state_value -- catches a transposition bug the original duplicate-value fixture could not');
  })();

  // T1 (AC1): detectConflict flags a genuine conflict when both sides moved to DIFFERENT values
  (function T1() {
    const result = conflictResolver.detectConflict('test-plan', 'definition-of-ready', 'review');
    assert('T1-flags-conflict', !!result, 'expected a truthy conflict object when both sides moved to different values since the last-synced marker');
    assert('T1-pipeline-state-value', result && result.pipelineStateValue === 'definition-of-ready', 'expected conflict.pipelineStateValue to be the pipeline-state.json side');
    assert('T1-journey-value', result && result.journeyValue === 'review', 'expected conflict.journeyValue to be the journey side');
  })();

  // T2 (AC4 negative control): only ONE side moved since last sync -> no conflict
  (function T2() {
    const result = conflictResolver.detectConflict('test-plan', 'definition-of-ready', 'test-plan');
    assert('T2-no-conflict-single-sided', result === null, 'expected null when only the pipeline-state.json side moved and the journey side still matches the last-synced marker');
  })();

  // T2b: both sides moved but to the SAME value -> no conflict (genuine agreement, not a disagreement)
  (function T2b() {
    const result = conflictResolver.detectConflict('test-plan', 'review', 'review');
    assert('T2b-no-conflict-same-value', result === null, 'expected null when both sides independently moved to the SAME value -- agreement, not a conflict');
  })();

  // T2c: neither side moved since last sync -> no conflict
  (function T2c() {
    const result = conflictResolver.detectConflict('test-plan', 'test-plan', 'test-plan');
    assert('T2c-no-conflict-unchanged', result === null, 'expected null when neither side has moved since the last-synced marker');
  })();

  // T3 (AC2): resolveConflict always returns pipeline-state.json's value as the winner
  await (async function T3() {
    const pool = makeFakePool();
    syncLog._setPoolForTesting(pool);
    const resolved = await conflictResolver.resolveConflict('test-feature-slug', null, 'definition-of-ready', 'review');
    assert('T3-resolves-to-pipeline-state-value', resolved === 'definition-of-ready', `expected the resolved value to be pipeline-state.json's own value "definition-of-ready", got "${resolved}"`);
  })();

  // T4 (AC3): resolveConflict logs both values and the winner
  await (async function T4() {
    const pool = makeFakePool();
    syncLog._setPoolForTesting(pool);
    await conflictResolver.resolveConflict('test-feature-slug-2', 'tenant-xyz', 'branch-complete', 'test-plan');

    assert('T4-one-log-call', pool.calls.length === 1, `expected exactly 1 sync_log write, got ${pool.calls.length}`);
    assert('T4-logs-feature-slug', pool.calls[0].params.indexOf('test-feature-slug-2') !== -1, 'expected feature_slug in logged params');
    // logConflict JSON.stringify's each value (JSONB columns) -- check the
    // params array directly for the JSON-encoded element, not a
    // JSON.stringify(params) re-serialization (same fix as T0 above).
    assert('T4-logs-both-values', pool.calls[0].params.indexOf('"branch-complete"') !== -1 && pool.calls[0].params.indexOf('"test-plan"') !== -1, 'expected both divergent values logged');
    assert('T4-logs-timestamp-via-now', String(pool.calls[0].sql).indexOf('NOW()') !== -1, 'expected the INSERT to populate created_at via NOW()');
  })();

  // AC4's "no conflict log entry for an ordinary single-sided sync" claim is
  // ALREADY proven at the unit level by T2/T2b/T2c above (detectConflict
  // returns null for those inputs). A test reproducing the real call site's
  // own "if (conflict) resolveConflict(...)" pattern INSIDE this test file
  // would be tautological -- the decision of whether to call resolveConflict
  // is made by code outside this module (journey-sync-client.js /
  // pipeline-state-github-writer.js), not by conflict-resolver.js itself.
  // The genuine, non-vacuous proof that NO log entry is written for an
  // ordinary single-sided sync lives in Task 4's own integration test
  // (tests/check-css-s3-pipeline-state-conflict-wiring.js, T2), which
  // exercises the real wired call site end-to-end. A prior, tautological T5
  // here was removed during Task 3's own code-quality review (it reused
  // T2's identical inputs and its own "zero writes" assertion was
  // guaranteed by the test's own conditional, not by any code under test).

  console.log(`[css-s3] ${totalPassed} passed, ${totalFailed} failed\n`);
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
node tests/check-css-s3-conflict-resolver.js
```

Expected output: `Error: Cannot find module '../src/sync/conflict-resolver'` (the module does not exist yet).

- [ ] **Step 3: Write the implementation**

```javascript
'use strict';

// conflict-resolver.js — css-s3: detects a genuine cross-surface conflict
// (both pipeline-state.json and the connected web-UI journey independently
// changed since the last-synced marker, to DIFFERENT values) versus an
// ordinary single-sided propagation, and resolves a genuine conflict to
// pipeline-state.json's own value (canonical, per css-s1's own ARCH
// decision and this story's AC2).
//
// detectConflict is a pure function -- no D37 adapter needed, nothing to
// swap in tests/prod (see decisions.md's "last synced marker design" ARCH
// entry). resolveConflict reuses sync-log.js's own Pool/testing convention
// directly -- no new adapter seam, same reasoning as css-s2's sync-log.js.

var syncLog = require('../web-ui/adapters/sync-log');

/**
 * Pure comparison: returns null if there is no genuine conflict (one or
 * both sides still match the last-synced marker, or both sides already
 * agree with each other), or a conflict object if both sides independently
 * moved away from the marker to DIFFERENT values.
 * @param {string|null|undefined} lastSyncedStage
 * @param {string} pipelineStateValue
 * @param {string} journeyValue
 * @returns {{pipelineStateValue: string, journeyValue: string}|null}
 */
function detectConflict(lastSyncedStage, pipelineStateValue, journeyValue) {
  if (pipelineStateValue === journeyValue) return null;
  var pipelineStateMoved = pipelineStateValue !== lastSyncedStage;
  var journeyMoved = journeyValue !== lastSyncedStage;
  if (pipelineStateMoved && journeyMoved) {
    return { pipelineStateValue: pipelineStateValue, journeyValue: journeyValue };
  }
  return null;
}

/**
 * Resolves a detected conflict: pipeline-state.json's value always wins
 * (AC2). Logs the conflict (AC3) and returns the resolved (winning) value.
 * Can throw/reject if the underlying sync_log write fails -- callers decide
 * their own error-handling strategy, same contract as sync-log.js's own
 * logReconciliationGap/logConflict.
 * @param {string} featureSlug
 * @param {string|null} tenantId
 * @param {string} pipelineStateValue
 * @param {string} journeyValue
 * @returns {Promise<string>} the resolved value (always pipelineStateValue)
 */
async function resolveConflict(featureSlug, tenantId, pipelineStateValue, journeyValue) {
  await syncLog.logConflict(featureSlug, tenantId, pipelineStateValue, journeyValue, pipelineStateValue);
  return pipelineStateValue;
}

module.exports = { detectConflict: detectConflict, resolveConflict: resolveConflict };
```

**Important:** this file lives at `src/sync/conflict-resolver.js` — its `require('../web-ui/adapters/sync-log')` path is relative to `src/sync/`, resolving to `src/web-ui/adapters/sync-log.js`. Verify this path resolves correctly (it should, given the directory layout — `src/sync/` and `src/web-ui/` are siblings under `src/`).

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-css-s3-conflict-resolver.js
```

Expected output: `[css-s3] 18 passed, 0 failed` (7 from T0 + 3 from T1 + 1 T2 + 1 T2b + 1 T2c + 1 T3 + 4 T4 = 18 — no T5, removed during Task 3's own code-quality review as tautological; count your own assertions carefully as you write this file, and if your actual count differs from this plan's arithmetic, trust your own run's real output over this plan, same lesson as css-s2's own Task 2 mis-count).

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: all tests passing.

- [ ] **Step 6: Commit**

```bash
git add src/sync/conflict-resolver.js tests/check-css-s3-conflict-resolver.js
git commit -m "feat(css-s3): add conflict-resolver.js (detect + resolve)"
```

---

## Task 4: Wire real conflict detection into `pipeline-state-github-writer.js`

**Files:**
- Modify: `src/web-ui/adapters/pipeline-state-github-writer.js`
- Test: `tests/check-css-s3-pipeline-state-conflict-wiring.js`

This is the ONLY real, branch-taking conflict-detection call site this story wires (see `decisions.md`'s wiring-scope-refinement ARCH entry for why css-s1's direction gets bookkeeping only, in Task 5).

- [ ] **Step 1: Write the failing test**

```javascript
#!/usr/bin/env node
/**
 * check-css-s3-pipeline-state-conflict-wiring.js
 *
 * Integration test for css-s3: pipeline-state-github-writer.js's real,
 * unmocked applyStateUpdate detects a genuine conflict (both
 * pipeline-state.json's current stage and an incoming stateUpdate.stage
 * have moved away from lastSyncedStage, to DIFFERENT values), resolves it
 * to pipeline-state.json's own value, logs it, and updates lastSyncedStage.
 *
 * Covers AC1, AC2 (fullSyncFlow_detectsAndResolvesConflict_endToEnd) per
 * the revised css-s3-test-plan.md.
 *
 * Run: node tests/check-css-s3-pipeline-state-conflict-wiring.js
 */
'use strict';

const syncLog = require('../src/web-ui/adapters/sync-log');
const pipelineStateGithubWriterFactory = require('../src/web-ui/adapters/pipeline-state-github-writer');

let totalPassed = 0;
let totalFailed = 0;
const issues = [];

function assert(label, condition, message) {
  if (condition) { totalPassed++; } else { totalFailed++; issues.push(`  ✗ [${label}] ${message}`); }
}

function b64(obj) {
  return Buffer.from(JSON.stringify(obj, null, 2) + '\n', 'utf8').toString('base64');
}

function installFetchMock(handlers) {
  const calls = [];
  const original = global.fetch;
  global.fetch = async function(url, opts) {
    calls.push({ url, opts });
    for (const h of handlers) {
      const result = h(url, opts, calls.length - 1);
      if (result) return result;
    }
    throw new Error('Unhandled fetch call: ' + url);
  };
  return { calls, restore: function() { global.fetch = original; } };
}

function jsonResponse(status, body, extra) {
  return Object.assign({
    ok: status >= 200 && status < 300,
    status: status,
    json: async () => body,
  }, extra || {});
}

function userHandler() {
  return (url) => {
    if (/\/user$/.test(url)) {
      return jsonResponse(200, { login: 'octocat', name: 'The Octocat', email: 'octocat@example.com' });
    }
    return null;
  };
}

async function run() {
  console.log('\n[css-s3] pipeline-state-github-writer.js conflict wiring (integration)\n');

  // T1 (AC1, AC2): a genuine conflict -- pipeline-state.json's own value wins, is NOT overwritten by the incoming stateUpdate.stage
  await (async function T1() {
    const fakePool = { calls: [], query: async function(sql, params) { this.calls.push({ sql, params }); return { rows: [] }; } };
    syncLog._setPoolForTesting(fakePool);

    const state = {
      schemaVersion: '1',
      features: [
        { slug: 'test-feat', id: 'test-feat', updatedAt: 'T0', stories: [
          { id: 's1', slug: 's1', stage: 'definition-of-ready', lastSyncedStage: 'test-plan', updatedAt: 'T0' },
        ] },
      ],
    };

    let putBody = null;
    const mock = installFetchMock([
      userHandler(),
      (url, opts) => {
        if (/\/contents\//.test(url) && (!opts || opts.method === undefined)) {
          return jsonResponse(200, { sha: 'sha-abc' });
        }
        return null;
      },
      (url) => {
        if (/\/git\/blobs\//.test(url)) {
          return jsonResponse(200, { content: b64(state), encoding: 'base64' });
        }
        return null;
      },
      (url, opts) => {
        if (/\/contents\//.test(url) && opts && opts.method === 'PUT') {
          putBody = JSON.parse(opts.body);
          return jsonResponse(200, {});
        }
        return null;
      },
    ]);

    try {
      const writer = pipelineStateGithubWriterFactory();
      // The incoming stateUpdate's own stage ("review") differs from BOTH
      // pipeline-state.json's current stage ("definition-of-ready") AND the
      // last-synced marker ("test-plan") -- both sides moved, to different
      // values: a genuine conflict.
      await writer('test-feat', 's1', { stage: 'review' }, { token: 'tok', owner: 'acme', repo: 'proj' });

      const decoded = JSON.parse(Buffer.from(putBody.content, 'base64').toString('utf8'));
      const story = decoded.features[0].stories[0];
      assert('T1-pipeline-state-value-wins', story.stage === 'definition-of-ready', `expected pipeline-state.json's own stage "definition-of-ready" to win, got "${story.stage}"`);
      assert('T1-last-synced-updated', story.lastSyncedStage === 'definition-of-ready', `expected lastSyncedStage updated to the resolved (winning) value, got "${story.lastSyncedStage}"`);

      const conflictCall = fakePool.calls.find(function(c) {
        return String(c.sql).toUpperCase().indexOf('SYNC_LOG') !== -1 && c.params.indexOf('conflict') !== -1;
      });
      assert('T1-conflict-logged', !!conflictCall, 'expected a sync_log conflict entry to have been written');
    } finally {
      mock.restore();
    }
  })();

  // T2: an ordinary single-sided advance (no conflict) -- stage applies normally, lastSyncedStage tracks it, no sync_log write
  await (async function T2() {
    const fakePool = { calls: [], query: async function(sql, params) { this.calls.push({ sql, params }); return { rows: [] }; } };
    syncLog._setPoolForTesting(fakePool);

    const state = {
      schemaVersion: '1',
      features: [
        { slug: 'test-feat-2', id: 'test-feat-2', updatedAt: 'T0', stories: [
          { id: 's1', slug: 's1', stage: 'test-plan', lastSyncedStage: 'test-plan', updatedAt: 'T0' },
        ] },
      ],
    };

    let putBody = null;
    const mock = installFetchMock([
      userHandler(),
      (url, opts) => {
        if (/\/contents\//.test(url) && (!opts || opts.method === undefined)) {
          return jsonResponse(200, { sha: 'sha-def' });
        }
        return null;
      },
      (url) => {
        if (/\/git\/blobs\//.test(url)) {
          return jsonResponse(200, { content: b64(state), encoding: 'base64' });
        }
        return null;
      },
      (url, opts) => {
        if (/\/contents\//.test(url) && opts && opts.method === 'PUT') {
          putBody = JSON.parse(opts.body);
          return jsonResponse(200, {});
        }
        return null;
      },
    ]);

    try {
      const writer = pipelineStateGithubWriterFactory();
      // Only the web-UI side is moving (stage: 'definition-of-ready'); the
      // story's own current stage already equals lastSyncedStage
      // ('test-plan') -- an ordinary single-sided advance, not a conflict.
      await writer('test-feat-2', 's1', { stage: 'definition-of-ready' }, { token: 'tok', owner: 'acme', repo: 'proj' });

      const decoded = JSON.parse(Buffer.from(putBody.content, 'base64').toString('utf8'));
      const story = decoded.features[0].stories[0];
      assert('T2-stage-applied-normally', story.stage === 'definition-of-ready', `expected the ordinary single-sided advance to apply normally, got "${story.stage}"`);
      assert('T2-last-synced-tracks', story.lastSyncedStage === 'definition-of-ready', `expected lastSyncedStage to track the new value, got "${story.lastSyncedStage}"`);

      const conflictCall = fakePool.calls.find(function(c) {
        return String(c.sql).toUpperCase().indexOf('SYNC_LOG') !== -1 && c.params.indexOf('conflict') !== -1;
      });
      assert('T2-no-conflict-logged', !conflictCall, 'expected NO sync_log conflict entry for an ordinary single-sided advance');
    } finally {
      mock.restore();
    }
  })();

  console.log(`[css-s3] ${totalPassed} passed, ${totalFailed} failed\n`);
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
node tests/check-css-s3-pipeline-state-conflict-wiring.js
```

Expected output: T1 fails with `expected pipeline-state.json's own stage "definition-of-ready" to win, got "review"` (the incoming stateUpdate.stage is currently applied unconditionally — the conflict check doesn't exist yet). T2 may pass already (no conflict case, close to existing behavior) or fail on `lastSyncedStage` not being set — either way, confirm at least T1 fails for the stated reason before proceeding.

- [ ] **Step 3: Add the conflict wiring to `pipeline-state-github-writer.js`**

Add this require near the top of the file, with the other requires:

```javascript
var conflictResolver = require('../../sync/conflict-resolver');
```

Add `'lastSyncedStage'` to the existing `STORY_LEVEL_KEYS` array:

```javascript
var STORY_LEVEL_KEYS   = ['dorStatus', 'prStatus', 'prUrl', 'stage', 'updatedAt', 'lastSyncedStage'];
```

Add this helper function (read-only story lookup, mirrors `cli-advance.js`'s own flat-then-epic-nested search but never creates a story):

```javascript
/** Read-only story lookup -- flat feature.stories[] first, then epic-nested. Never creates. */
function _findStoryReadOnly(feature, storyId) {
  if (Array.isArray(feature.stories)) {
    var flat = feature.stories.find(function(s) { return s.id === storyId || s.slug === storyId; });
    if (flat) return flat;
  }
  var epics = feature.epics || [];
  for (var ei = 0; ei < epics.length; ei++) {
    var epicStories = epics[ei].stories || [];
    var found = epicStories.find(function(s) { return s.id === storyId || s.slug === storyId; });
    if (found) return found;
  }
  return null;
}
```

Change the `applyStateUpdate` function's signature from `function applyStateUpdate(...)` to `async function applyStateUpdate(...)`, and modify its body: immediately before the existing `if (storyId) { var rawFields = []; ... }` block, insert the conflict check. The function should end up looking like this (full replacement of the function):

```javascript
async function applyStateUpdate(state, featureSlug, storyId, stateUpdate) {
  if (!Array.isArray(state.features)) state.features = [];
  var feature = state.features.find(function(f) {
    return f.slug === featureSlug || f.id === featureSlug;
  });
  if (!feature) {
    feature = { slug: featureSlug, id: featureSlug };
    state.features.push(feature);
  }
  FEATURE_LEVEL_KEYS.forEach(function(key) {
    if (stateUpdate[key] !== undefined) feature[key] = stateUpdate[key];
  });

  if (storyId) {
    // css-s3: conflict detection -- compare the CURRENT (freshly-fetched)
    // pipeline-state.json stage value against stateUpdate's own incoming
    // stage value, using lastSyncedStage as the "last agreed" marker. Only
    // meaningful when stateUpdate actually carries a new stage value --
    // other story-level fields (dorStatus, prStatus, prUrl) are untouched.
    if (stateUpdate.stage !== undefined) {
      var existingStory = _findStoryReadOnly(feature, storyId);
      if (existingStory) {
        var conflict = conflictResolver.detectConflict(existingStory.lastSyncedStage, existingStory.stage, stateUpdate.stage);
        stateUpdate = Object.assign({}, stateUpdate);
        if (conflict) {
          var resolved = await conflictResolver.resolveConflict(featureSlug, null, conflict.pipelineStateValue, conflict.journeyValue);
          delete stateUpdate.stage; // pipeline-state.json's own value wins -- do not apply the incoming stage
          stateUpdate.lastSyncedStage = resolved;
        } else {
          stateUpdate.lastSyncedStage = stateUpdate.stage;
        }
      }
    }

    var rawFields = [];
    STORY_LEVEL_KEYS.forEach(function(key) {
      if (stateUpdate[key] !== undefined) rawFields.push(key + '=' + stateUpdate[key]);
    });
    if (rawFields.length > 0) {
      var result = applyAdvance(state, featureSlug, storyId, rawFields);
      if (result.exitCode !== 0) {
        throw new Error('pipeline-state advance failed: ' + result.stderr);
      }
      return result.state;
    }
  }
  return state;
}
```

Finally, update the ONE call site inside the `pipelineStateGithubWriter` factory's retry loop from:

```javascript
        var mutatedState = applyStateUpdate(fetched.state, featureSlug, storyId, stateUpdate);
```

to:

```javascript
        var mutatedState = await applyStateUpdate(fetched.state, featureSlug, storyId, stateUpdate);
```

**Post-implementation fix (Critical, found at Task 4's own code-quality review):** the code above, exactly as specified, re-logs the SAME conflict once per attempt of the writer's own pre-existing 409-retry loop (an unrelated Contents-API optimistic-concurrency mechanism) -- a failed PUT persists nothing, so a retry re-observes identical state and re-detects the identical logical conflict, writing duplicate `sync_log` rows. Fixed by threading a `conflictLogState = { logged: false }` object (declared once, before the `while (attempt < 3)` loop, in the outer `pipelineStateGithubWriter` function) as a 5th parameter into `applyStateUpdate`, and gating the `resolveConflict` (logging) call on `!conflictLogState.logged` -- resolution itself (always `pipelineStateValue`) still runs on every attempt, only the logging is deduped. See the actual committed code in `src/web-ui/adapters/pipeline-state-github-writer.js` for the final, corrected version -- the block above reflects what was originally specified, not what shipped. A new test (`T3` in `tests/check-css-s3-pipeline-state-conflict-wiring.js`) proves exactly 1 `sync_log` conflict entry is written across a 2-attempt 409-retry sequence.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-css-s3-pipeline-state-conflict-wiring.js
```

Expected output: `[css-s3] 6 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: all tests passing, including `tests/check-wsd-s2-github-pipeline-state-writer.js`'s existing 10 tests (none of them pass a `stage` field in `stateUpdate`, so the new conflict-check code path is never exercised by them — confirmed by reading that file before this task was planned) and `tests/check-css-s2-gate-confirm-sync-log-integration.js` (also does not pass `stage`).

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/adapters/pipeline-state-github-writer.js tests/check-css-s3-pipeline-state-conflict-wiring.js
git commit -m "feat(css-s3): wire real conflict detection into pipeline-state-github-writer.js"
```

---

## Task 5: `lastSyncedStage` bookkeeping for css-s1's direction

**Files:**
- Modify: `src/enforcement/cli-gate-advance.js`
- Test: `tests/check-css-s3-last-synced-bookkeeping.js`

This is bookkeeping only — no conflict-branch call (see `decisions.md`'s wiring-scope-refinement ARCH entry for why).

- [ ] **Step 1: Write the failing test**

```javascript
'use strict';
// check-css-s3-last-synced-bookkeeping.js
// Unit test for css-s3: after a successful CLI -> web-UI sync
// (gateAdvance for the discovery-approved gate, with a connected journey),
// the local pipeline-state.json's own lastSyncedStage field for that story
// is updated to the synced stage value. Bookkeeping only -- no conflict
// branch on this direction (see decisions.md).

var assert = require('assert');
var fs = require('fs');
var os = require('os');
var path = require('path');

var passed = 0; var failed = 0;

function test(name, fn) {
  try {
    var result = fn();
    if (result && typeof result.then === 'function') {
      return result.then(
        function() { passed++; console.log('  PASS: ' + name); },
        function(err) { failed++; console.log('  FAIL: ' + name + '\n       ' + (err && err.stack || err)); }
      );
    }
    passed++; console.log('  PASS: ' + name); return Promise.resolve();
  } catch (err) {
    failed++; console.log('  FAIL: ' + name + '\n       ' + (err && err.stack || err)); return Promise.resolve();
  }
}

function freshRequire(modPath) {
  var resolved = require.resolve(modPath);
  try { delete require.cache[resolved]; } catch (_) {}
  return require(modPath);
}

(async function runAll() {
  await test('gateAdvance_updatesLastSyncedStage_afterSuccessfulSync', async function() {
    var tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'css-s3-cga-'));
    var stateDir = path.join(tmpRoot, '.github');
    fs.mkdirSync(stateDir, { recursive: true });
    var featureSlug = 'test-feat-css-s3';
    var initialState = {
      schemaVersion: '1',
      features: [
        { slug: featureSlug, id: featureSlug, updatedAt: 'T0', stories: [
          { id: 's1', slug: 's1', stage: 'definition', updatedAt: 'T0' },
        ] },
      ],
    };
    fs.writeFileSync(path.join(stateDir, 'pipeline-state.json'), JSON.stringify(initialState, null, 2));

    var artefactPath = path.join(tmpRoot, 'artefacts', featureSlug, 'discovery.md');
    fs.mkdirSync(path.dirname(artefactPath), { recursive: true });
    fs.writeFileSync(artefactPath, '# Discovery\n\n## Approved By\n- test\n');

    var journeySyncClient = freshRequire('../src/sync/journey-sync-client');
    var cliGateAdvance = freshRequire('../src/enforcement/cli-gate-advance');

    journeySyncClient.setJourneySyncClient(async function(action) {
      if (action === 'resolve') {
        return { found: true, journey: { journeyId: 'j1', featureSlug: featureSlug, repoOwner: null, repoName: null } };
      }
      return { updated: true };
    });

    var validate = require('../src/enforcement/cli-outer-loop').validate;
    var origValidate = validate;
    // gateAdvance calls the real validate() against the real artefact above;
    // discovery-approved's own gate validation is exercised elsewhere (not
    // this test's concern) -- this test only cares about the post-sync
    // lastSyncedStage write, so a minimal valid-enough artefact is used.

    await cliGateAdvance.gateAdvance(featureSlug, 's1', 'discovery-approved', artefactPath, [], tmpRoot);

    var finalState = JSON.parse(fs.readFileSync(path.join(stateDir, 'pipeline-state.json'), 'utf8'));
    var story = finalState.features[0].stories[0];
    assert.strictEqual(story.lastSyncedStage, journeySyncClient.SYNC_STAGE, 'expected lastSyncedStage to be updated to the synced stage ("discovery") after a successful sync');
  });

  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exitCode = 1;
})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-css-s3-last-synced-bookkeeping.js
```

Expected output: the test fails — either `story.lastSyncedStage` is `undefined` (not set at all), or the `gateAdvance` call itself fails validation first. If validation fails before reaching the sync logic, check `src/enforcement/cli-outer-loop.js`'s `validate()` requirements for the `discovery-approved` gate and adjust the test's artefact content minimally so validation passes — the goal is to reach and exercise the post-sync `lastSyncedStage` write, not to test gate validation itself (already covered elsewhere). Report in your final status what the artefact needed to look like if you had to adjust it.

- [ ] **Step 3: Add the bookkeeping write**

In `src/enforcement/cli-gate-advance.js`, replace this existing block:

```javascript
  if (advanceResult.exitCode === 0 && gateName === journeySyncClient.SYNC_GATE) {
    try {
      var journey = await journeySyncClient.resolveJourneyForFeatureSlug(featureSlug);
      if (journey) {
        await journeySyncClient.syncGateAdvanceToJourney(journey, gateName);
      }
    } catch (err) {
      process.stderr.write('[journey-sync] warning: ' + ((err && err.message) || String(err)) + '\n');
    }
  }
```

with:

```javascript
  if (advanceResult.exitCode === 0 && gateName === journeySyncClient.SYNC_GATE) {
    try {
      var journey = await journeySyncClient.resolveJourneyForFeatureSlug(featureSlug);
      if (journey) {
        await journeySyncClient.syncGateAdvanceToJourney(journey, gateName);
        // css-s3: keep the shared "last synced" marker current from the CLI
        // side too, after a successful sync. Bookkeeping only -- no real
        // conflict-branch call here; this direction's real call site cannot
        // produce a genuine two-different-values conflict today (see
        // decisions.md's wiring-scope-refinement ARCH entry). A failure
        // here is logged the same as a sync failure above -- it must never
        // change gateAdvance's own exit code, which already reflects the
        // pipeline-state advance's own success.
        try {
          advance(featureSlug, storyId, ['lastSyncedStage=' + journeySyncClient.SYNC_STAGE], repoRoot);
        } catch (markerErr) {
          process.stderr.write('[journey-sync] warning: lastSyncedStage update failed: ' + ((markerErr && markerErr.message) || String(markerErr)) + '\n');
        }
      }
    } catch (err) {
      process.stderr.write('[journey-sync] warning: ' + ((err && err.message) || String(err)) + '\n');
    }
  }
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-css-s3-last-synced-bookkeeping.js
```

Expected output: `1 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: all tests passing, including `tests/check-cdg7-gate-advance.js` (the existing test suite for `gateAdvance` itself — confirm this new bookkeeping call doesn't change `gateAdvance`'s own return shape or exit codes for any existing scenario).

- [ ] **Step 6: Commit**

```bash
git add src/enforcement/cli-gate-advance.js tests/check-css-s3-last-synced-bookkeeping.js
git commit -m "feat(css-s3): update lastSyncedStage after a successful CLI sync"
```

---

## Task 6: NFR tests

**Files:**
- Create: `tests/check-css-s3-nfr.js`

- [ ] **Step 1: Write the test**

```javascript
#!/usr/bin/env node
/**
 * check-css-s3-nfr.js
 *
 * NFR tests for css-s3: Performance (bounded overhead), Security (no
 * credentials in conflict log entries), Audit (exactly one log entry per
 * genuine conflict).
 *
 * Run: node tests/check-css-s3-nfr.js
 */
'use strict';

const syncLog = require('../src/web-ui/adapters/sync-log');
const conflictResolver = require('../src/sync/conflict-resolver');

let totalPassed = 0;
let totalFailed = 0;
const issues = [];

function assert(label, condition, message) {
  if (condition) { totalPassed++; } else { totalFailed++; issues.push(`  ✗ [${label}] ${message}`); }
}

function makeFakePool() {
  const calls = [];
  return {
    calls: calls,
    query: async function(sql, params) {
      calls.push({ sql: sql, params: params });
      return { rows: [] };
    }
  };
}

async function run() {
  console.log('\n[css-s3] NFR tests\n');

  // Performance: detectConflict is O(1), not a scan -- 1000 calls complete well under 100ms
  (function perfTest() {
    const start = process.hrtime();
    for (let i = 0; i < 1000; i++) {
      conflictResolver.detectConflict('last', 'a' + i, 'b' + i);
    }
    const diff = process.hrtime(start);
    const elapsedMs = diff[0] * 1000 + diff[1] / 1e6;
    assert('perf-bounded-overhead', elapsedMs < 100, `expected 1000 detectConflict calls to complete in under 100ms, took ${elapsedMs.toFixed(2)}ms`);
  })();

  // Security: a resolved conflict's logged entry contains no token/credential-shaped value
  await (async function securityTest() {
    const pool = makeFakePool();
    syncLog._setPoolForTesting(pool);
    await conflictResolver.resolveConflict('test-feat', null, 'definition-of-ready', 'review');
    const serialized = JSON.stringify(pool.calls[0].params);
    assert('security-no-credential-shaped-value', !/gh[pousr]_|Bearer |accessToken/i.test(serialized),
      `expected no token-shaped value in logged conflict params, got: ${serialized}`);
    assert('security-signature-no-token-param', conflictResolver.resolveConflict.length === 4,
      `expected resolveConflict(featureSlug, tenantId, pipelineStateValue, journeyValue) -- a 4-arg signature with no token parameter, got length ${conflictResolver.resolveConflict.length}`);
  })();

  // Audit: exactly one log entry per detected conflict -- not zero, not more than one
  await (async function auditTest() {
    const pool = makeFakePool();
    syncLog._setPoolForTesting(pool);
    await conflictResolver.resolveConflict('test-feat-2', null, 'branch-complete', 'test-plan');
    assert('audit-exactly-one-entry', pool.calls.length === 1, `expected exactly 1 sync_log write per resolved conflict, got ${pool.calls.length}`);
  })();

  console.log(`[css-s3] ${totalPassed} passed, ${totalFailed} failed\n`);
  if (issues.length > 0) {
    console.log(issues.join('\n'));
    console.log('');
  }
  process.exit(totalFailed === 0 ? 0 : 1);
}

run();
```

- [ ] **Step 2: Run test — must pass immediately**

```bash
node tests/check-css-s3-nfr.js
```

Expected output: `[css-s3] 4 passed, 0 failed`

- [ ] **Step 3: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: all tests passing.

- [ ] **Step 4: Commit**

```bash
git add tests/check-css-s3-nfr.js
git commit -m "test(css-s3): add NFR tests (performance, security, audit)"
```

---

## Final task: Confirm full suite, proceed to /verify-completion

Not a code task.

- [ ] Confirm `decisions.md`'s two css-s3 ARCH entries (already written, 2026-10-24) are present and unchanged.
- [ ] Confirm `test-plans/css-s3-test-plan.md` and `dor/css-s3-dor-contract.md` (already revised, 2026-10-24) match what was actually built.
- [ ] Run `node scripts/run-all-tests.js` one final time — 0 failures required before `/verify-completion`.
- [ ] Note: `src/web-ui/routes/journey.js` is NOT touched by this story (unlike css-s2) — confirm the route/handler E2E coverage check at `/verify-completion` is therefore N/A for this story, not required.
- [ ] Proceed to `/verify-completion`.
