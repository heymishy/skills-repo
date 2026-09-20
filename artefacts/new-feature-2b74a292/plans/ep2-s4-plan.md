# Concurrent Write Merge for Artefact Edits (ep2-s4) — Implementation Plan

**Goal:** When two team members save edits to the same journey stage's artefact within 100ms of each other, detect the concurrency, three-way-merge both edits (base + user A + user B), record the merge with line-level attribution in a new `feature_edits` table, and push the merged content to both clients live via SSE — without requiring a page refresh.

**Branch:** `feature/ep2-s4`
**Worktree:** `.worktrees/ep2-s4`
**Test command:** `node scripts/run-all-tests.js` (unit + integration); `NODE_ENV=test npx playwright test tests/e2e/ep2-s4-concurrent-merge.spec.js` (E2E, separately)

---

## Pre-verified findings (see decisions.md for the full investigation)

The DoR's original "Estimated touch points" assumed a route/file/client-layer that does not exist in this codebase (`PUT /api/features/{featureId}/artefacts/{name}/save`, `routes/features.js`, `public/editor.js`). Corrected directly in the DoR and logged in `decisions.md` before this plan was written. The REAL touch points (confirmed via direct code read):

- **Real save route:** `POST /api/journey/:journeyId/stage/:stageName/artefact` → `handlePostJourneyStageArtefact` in `src/web-ui/routes/journey.js` (line ~1517). Today it only handles `application/x-www-form-urlencoded` bodies (`_readFormBody`, line ~185) and always responds with a 302 redirect — a full page reload, zero AJAX.
- **Real edit-mode markup:** `journey.js` line ~1180, a plain `<form method="POST" action="...">` with a `<textarea>`. No client JS wired to it at all today.
- **Real, reusable SSE pattern:** `handleGetJourneyPresenceStream` (`journey.js` line ~3597) — real, working, already shipped (`ep2-s1`). Sets `Content-Type: text/event-stream`, writes `data: ...\n\n` frames, cleans up via `res.on('close', ...)`. This one polls on a 5s interval; ours must be event-driven (push happens when the OTHER user's concurrent request triggers a merge), so we need a pub/sub registry, not a `setInterval`.
- **Real analogous in-memory store pattern:** `modules/presence-store.js` — `Map<key, Map<...>>`, injectable `_now()`/`setNow()` for test determinism, a `_clearForTesting()` and a `_seed*ForTesting()` helper. `concurrent-edit-buffer.js` follows this exact shape.
- **Real analogous Postgres-table + fake-db-companion pattern:** `modules/artefact-comments.js` (`migrateArtefactCommentsSchema`, idempotent `CREATE TABLE IF NOT EXISTS`) + `adapters/fake-test-db.js` (narrow `INSERT INTO ARTEFACT_COMMENTS` / `SELECT ... FROM ARTEFACT_COMMENTS` branches, added because the fake DB's catch-all returns empty rows and any caller reading `result.rows[0]` throws). `feature-edits.js` follows this exact shape, and `fake-test-db.js` needs the same companion-branch treatment.
- **Real route-wiring convention:** every new API route in this codebase is added as an `else if (pathname.match(...) && req.method === '...')` branch in `server.js`'s single dispatch chain (~line 2000-4000), not a router library. The new SSE route and the modified save route both plug into this existing chain — no new dispatch mechanism.
- **Real body-reading helpers:** `_readFormBody(req)` (URL-encoded) and `_readJsonBody(req)` (JSON) both already exist in `journey.js` (lines 185, 2353) — the new JSON branch reuses `_readJsonBody` directly, no new parsing code needed.
- **Real E2E auth/session pattern:** `withAuth` fixture (`tests/e2e/fixtures/auth.js`) seeds ONE synthetic session (`e2e-tester`, userId 9999). For this story's 2-simultaneous-user E2E test, two DISTINCT browser contexts are needed, each with its OWN session — following `dsa-s6`'s own `isolatedSession()` helper pattern (`GET /test/session?sessionId=&tenantId=` override, already supported by the real `/test/session` endpoint at `server.js` line ~2042) to seed two different `login` values isn't directly supported (`/test/session` always seeds `login: 'e2e-tester'` regardless of `sessionId`/`tenantId` overrides — confirmed by reading the handler in full). **Decision for Task 5 (E2E):** rather than fight this, seed two sessions with different `sessionId`s (both logging in as `e2e-tester` but as genuinely different HTTP sessions/cookies, matching how `dsa-s6`'s own multi-context tests worked around the same single-identity fixture) and pass distinct `userId` values through the new JSON save payload's own body instead of relying on `req.session.login` alone for attribution — the real production code reads the acting user from `req.session.login`/`req.session.userId`, so the E2E test's two contexts need genuinely different session identities. This is elaborated in Task 5 below; flag any remaining ambiguity as a PR comment rather than guessing further.

---

## File map

```
Create:
  src/web-ui/modules/merge-artefact-edits.js         — pure 3-way merge function + line attribution (ADR-028 canonical builder)
  src/web-ui/modules/concurrent-edit-buffer.js        — in-memory 100ms-window concurrent-save detector (presence-store.js pattern)
  src/web-ui/modules/feature-edits.js                 — feature_edits table bootstrap + recordEdit() writer (artefact-comments.js pattern)
  src/web-ui/modules/artefact-merge-broadcast.js      — in-memory pub/sub for SSE push on merge
  src/web-ui/public/artefact-edit-merge.js            — client script: intercept form submit, fetch-JSON save, EventSource listener
  tests/check-ep2-s4-merge-artefact-edits.js          — unit: AC2 merge correctness + edge cases (NFR success-rate suite)
  tests/check-ep2-s4-concurrent-edit-buffer.js        — unit: AC1 100ms concurrency detection
  tests/check-ep2-s4-feature-edits.js                 — unit + integration: AC3 record creation, attribution accuracy, tenant isolation
  tests/check-ep2-s4-integration.js                   — integration: full concurrent flow end-to-end via real HTTP request to a live server
  tests/e2e/ep2-s4-concurrent-merge.spec.js            — E2E: 2-browser-context concurrent save, merged content visible to both, feature_edits queryable

Modify:
  src/web-ui/routes/journey.js       — handlePostJourneyStageArtefact: add JSON-body branch; add handleGetArtefactMergeStream; wire new <script> tag into edit-mode markup
  src/web-ui/server.js               — route the new SSE endpoint; import the new journey.js exports
  src/web-ui/adapters/fake-test-db.js — add feature_edits INSERT/SELECT query-shape branches
```

---

## Task 1: Three-way merge algorithm (AC2) — ✅ COMPLETE (commits 36aac329, a68ab879, 1b68bb14, 742a0626)

**Note:** the original implementation (36aac329) had a Critical correctness defect found by code-quality review — positional/index-based line comparison desynced on any insertion/deletion, causing false conflicts and silent mis-attribution. Fixed (742a0626) with a proper LCS-based line-alignment algorithm. Test count also grew from the plan's stated "exactly 3" to 8, reflecting both the original coverage-gap fix and new regression tests for the Critical bug — see decisions.md for the full reasoning on both deviations.

**Files:**
- Create: `src/web-ui/modules/merge-artefact-edits.js`
- Test: `tests/check-ep2-s4-merge-artefact-edits.js`

- [ ] **Step 1: Write the failing test**

```javascript
'use strict';
const assert = require('assert');
const { mergeArtefactEdits } = require('../src/web-ui/modules/merge-artefact-edits');

function testNonOverlappingEditsMergeCleanly() {
  var base   = 'Line 1: AC1: Some requirement\nLine 2: AC2: Another requirement\nLine 3:\nLine 4: Architecture constraint: design pattern X\nLine 5:';
  var userA  = 'Line 1: AC1: Some requirement [REVISED BY SUSAN]\nLine 2: AC2: Another requirement [REVISED BY SUSAN]\nLine 3:\nLine 4: Architecture constraint: design pattern X\nLine 5:';
  var userB  = 'Line 1: AC1: Some requirement\nLine 2: AC2: Another requirement\nLine 3:\nLine 4: Architecture constraint: design pattern X [REVISED BY DARREN]\nLine 5: [NEW LINE FROM DARREN: Additional architecture note]';

  var result = mergeArtefactEdits(base, userA, userB, { userAId: 'user-susan', userBId: 'user-darren' });

  assert.ok(result.merged.includes('[REVISED BY SUSAN]'), 'expected Susan\'s revision in merged output');
  assert.ok(result.merged.includes('[REVISED BY DARREN]'), 'expected Darren\'s revision in merged output');
  assert.ok(result.merged.includes('[NEW LINE FROM DARREN'), 'expected Darren\'s new line in merged output');
  assert.strictEqual(result.lineAttributions[1], 'user-susan');
  assert.strictEqual(result.lineAttributions[2], 'user-susan');
  assert.strictEqual(result.lineAttributions[4], 'user-darren');
  assert.strictEqual(result.lineAttributions[5], 'user-darren');
}

function testHardConflictBothDeleteSameLineThrows() {
  var base  = 'Line 1: keep\nLine 2: delete me\nLine 3: keep';
  var userA = 'Line 1: keep\nLine 3: keep'; // deleted line 2
  var userB = 'Line 1: keep\nLine 3: keep'; // also deleted line 2 -- ambiguous which content survives if edited differently; here both delete identically so this specific case is actually non-conflicting (same intent) -- use a genuine conflicting-edit case instead:
  var userBConflict = 'Line 1: keep\nLine 2: DARREN EDITED THIS INSTEAD OF DELETING\nLine 3: keep';

  assert.throws(function () {
    mergeArtefactEdits(base, userA, userBConflict, { userAId: 'user-susan', userBId: 'user-darren' });
  }, function (err) { return err.code === 'MERGE_CONFLICT_HARD'; }, 'expected MERGE_CONFLICT_HARD when one user deletes a line the other edited');
}

function testLargeArtefactMergesUnder1Second() {
  var lines = [];
  for (var i = 0; i < 1000; i++) lines.push('Line ' + i + ': base content');
  var base = lines.join('\n');
  var userALines = lines.slice(); userALines[10] = 'Line 10: EDITED BY A';
  var userBLines = lines.slice(); userBLines[900] = 'Line 900: EDITED BY B';
  var userA = userALines.join('\n');
  var userB = userBLines.join('\n');

  var start = Date.now();
  var result = mergeArtefactEdits(base, userA, userB, { userAId: 'user-a', userBId: 'user-b' });
  var elapsed = Date.now() - start;

  assert.ok(elapsed < 1000, 'expected merge of 1000-line artefact to complete in under 1s, took ' + elapsed + 'ms');
  assert.ok(result.merged.includes('EDITED BY A'));
  assert.ok(result.merged.includes('EDITED BY B'));
}

function main() {
  testNonOverlappingEditsMergeCleanly();
  console.log('  ok - non-overlapping edits merge cleanly with correct line attribution');
  testHardConflictBothDeleteSameLineThrows();
  console.log('  ok - conflicting edit on the same line throws MERGE_CONFLICT_HARD');
  testLargeArtefactMergesUnder1Second();
  console.log('  ok - 1000-line artefact merges in under 1s (NFR-Perf-1)');
}
main();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-ep2-s4-merge-artefact-edits.js
```

Expected output: `Error: Cannot find module '../src/web-ui/modules/merge-artefact-edits'`

- [ ] **Step 3: Write minimal implementation**

```javascript
'use strict';

// merge-artefact-edits.js — ADR-028 canonical builder. The ONLY place
// three-way merge logic lives in this codebase — no re-derivation
// elsewhere. Pure function: no I/O, no side effects.
//
// Algorithm: line-based three-way diff. For each line index across the
// longest of the three versions: if userA's line differs from base but
// userB's line at that index equals base's, take userA's line (attribute
// to userA). Symmetric for userB. If BOTH differ from base at the same
// index AND differ from each other, that is a hard conflict (throw). If
// both differ from base but agree with each other, no conflict (either
// user's line, unattributed — same edit made twice). Lines present in one
// user's version beyond the base's length (additions) are attributed to
// whichever user added them; if both add non-identical trailing content,
// that's also a hard conflict.

class MergeConflictError extends Error {
  constructor(message, lineNum) {
    super(message);
    this.code = 'MERGE_CONFLICT_HARD';
    this.lineNum = lineNum;
  }
}

/**
 * @param {string} baseContent
 * @param {string} userAContent
 * @param {string} userBContent
 * @param {{userAId: string, userBId: string}} userIds
 * @returns {{merged: string, lineAttributions: Object<number,string>}}
 * @throws {MergeConflictError} on an unresolvable overlapping edit
 */
function mergeArtefactEdits(baseContent, userAContent, userBContent, userIds) {
  var baseLines  = baseContent.split('\n');
  var aLines     = userAContent.split('\n');
  var bLines     = userBContent.split('\n');
  var maxLen     = Math.max(baseLines.length, aLines.length, bLines.length);
  var mergedLines = [];
  var lineAttributions = {};

  for (var i = 0; i < maxLen; i++) {
    var baseLine = i < baseLines.length ? baseLines[i] : undefined;
    var aLine    = i < aLines.length    ? aLines[i]    : undefined;
    var bLine    = i < bLines.length    ? bLines[i]    : undefined;

    var aChanged = aLine !== baseLine;
    var bChanged = bLine !== baseLine;

    if (aChanged && bChanged) {
      if (aLine === bLine) {
        // Both made the identical change (or identical addition) -- no conflict.
        if (aLine !== undefined) mergedLines.push(aLine);
        continue;
      }
      // Genuine overlapping conflicting edit (includes one-deletes/one-edits,
      // since a deletion manifests as aLine === undefined !== bLine here).
      throw new MergeConflictError(
        'Conflicting edits at line ' + (i + 1) + ': both users modified the same line differently',
        i + 1
      );
    }

    if (aChanged) {
      if (aLine !== undefined) {
        mergedLines.push(aLine);
        lineAttributions[i + 1] = userIds.userAId;
      }
      // aLine === undefined means user A deleted this line and B did not touch it -- honor the deletion.
      continue;
    }

    if (bChanged) {
      if (bLine !== undefined) {
        mergedLines.push(bLine);
        lineAttributions[i + 1] = userIds.userBId;
      }
      continue;
    }

    // Neither changed this line.
    if (baseLine !== undefined) mergedLines.push(baseLine);
  }

  return { merged: mergedLines.join('\n'), lineAttributions: lineAttributions };
}

module.exports = { mergeArtefactEdits, MergeConflictError };
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ep2-s4-merge-artefact-edits.js
```

Expected output:
```
  ok - non-overlapping edits merge cleanly with correct line attribution
  ok - conflicting edit on the same line throws MERGE_CONFLICT_HARD
  ok - 1000-line artefact merges in under 1s (NFR-Perf-1)
```

- [ ] **Step 5: Run full suite — no regressions**

```bash
node tests/check-ep2-s4-merge-artefact-edits.js
```

Expected output: all 3 assertions pass, exit code 0 (full-suite run deferred to Task 6, after all files exist)

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/modules/merge-artefact-edits.js tests/check-ep2-s4-merge-artefact-edits.js
git commit -m "feat(ep2-s4): add three-way merge algorithm with line attribution (AC2)"
```

---

## Task 2: Concurrent-save detection buffer (AC1) — ✅ COMPLETE (commits d194c381, 7e8bc543)

**Note:** code-quality review found the test file repeated Task 1's own already-fixed sync-test-convention mistake, plus a missing exact-boundary test and a misleading comment. Fixed (7e8bc543): house-style test harness, 2 new boundary tests (99ms concurrent, exactly-100ms not concurrent), accurate comment, and an input guard matching `presence-store.js`'s own pattern.

**Files:**
- Create: `src/web-ui/modules/concurrent-edit-buffer.js`
- Test: `tests/check-ep2-s4-concurrent-edit-buffer.js`

- [ ] **Step 1: Write the failing test**

```javascript
'use strict';
const assert = require('assert');
const buffer = require('../src/web-ui/modules/concurrent-edit-buffer');

function testDetectsSecondSaveWithin100ms() {
  buffer._clearForTesting();
  var fakeNow = 1000000;
  buffer.setNow(function () { return fakeNow; });

  var key = 'journey-abc:s1';
  var first = buffer.registerSave(key, 'user-susan', 'susan content');
  assert.strictEqual(first.concurrentWith, null, 'first save should have no concurrent partner');

  fakeNow += 50; // Darren's save arrives 50ms later, within the 100ms window
  var second = buffer.registerSave(key, 'user-darren', 'darren content');
  assert.ok(second.concurrentWith, 'second save within 100ms should detect the first as concurrent');
  assert.strictEqual(second.concurrentWith.userId, 'user-susan');
  assert.strictEqual(second.concurrentWith.content, 'susan content');

  buffer.setNow(function () { return Date.now(); });
}

function testNoFalsePositiveOutside100ms() {
  buffer._clearForTesting();
  var fakeNow = 2000000;
  buffer.setNow(function () { return fakeNow; });

  var key = 'journey-abc:s1';
  buffer.registerSave(key, 'user-susan', 'susan content');

  fakeNow += 150; // outside the 100ms window
  var second = buffer.registerSave(key, 'user-darren', 'darren content');
  assert.strictEqual(second.concurrentWith, null, 'a save 150ms later must NOT be flagged concurrent (AC1 boundary: exactly 100ms, not looser)');

  buffer.setNow(function () { return Date.now(); });
}

function testDifferentKeysDoNotCollide() {
  buffer._clearForTesting();
  var fakeNow = 3000000;
  buffer.setNow(function () { return fakeNow; });

  buffer.registerSave('journey-a:s1', 'user-susan', 'content-a');
  fakeNow += 10;
  var otherKey = buffer.registerSave('journey-b:s1', 'user-darren', 'content-b');
  assert.strictEqual(otherKey.concurrentWith, null, 'saves to a different journey+stage key must never be treated as concurrent');

  buffer.setNow(function () { return Date.now(); });
}

function main() {
  testDetectsSecondSaveWithin100ms();
  console.log('  ok - second save within 100ms is detected as concurrent with the first');
  testNoFalsePositiveOutside100ms();
  console.log('  ok - a save 150ms later is NOT flagged concurrent (exact 100ms boundary)');
  testDifferentKeysDoNotCollide();
  console.log('  ok - different journey+stage keys never collide');
}
main();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-ep2-s4-concurrent-edit-buffer.js
```

Expected output: `Error: Cannot find module '../src/web-ui/modules/concurrent-edit-buffer'`

- [ ] **Step 3: Write minimal implementation**

```javascript
'use strict';

// concurrent-edit-buffer.js — ep2-s4 AC1. In-memory per-journeyId+stageName
// save-request buffer, modeled directly on modules/presence-store.js's own
// established Map<key,...> + injectable _now()/setNow() pattern.
//
// Concurrency window is EXACTLY 100ms (DoR Architecture Constraint: "not 99,
// not 101 -- this is the AC boundary"). A save strictly within 100ms of the
// last save for the same key is flagged concurrent; a save at exactly the
// boundary or later is not (a Date.now()-based >= check keeps the boundary
// unambiguous and testable).

var _now = function () { return Date.now(); };
function setNow(fn) { _now = fn; }

var WINDOW_MS = 100;

/** @type {Map<string, {userId: string, content: string, timestamp: number}>} */
var _lastSave = new Map();

/**
 * Register a save for journeyId+stageName key and check whether a prior save
 * for the SAME key landed within the last 100ms.
 * @param {string} key - typically `${journeyId}:${stageName}`
 * @param {string} userId
 * @param {string} content
 * @returns {{concurrentWith: {userId:string, content:string, timestamp:number}|null}}
 */
function registerSave(key, userId, content) {
  var now = _now();
  var prior = _lastSave.get(key);
  var concurrentWith = null;
  if (prior && (now - prior.timestamp) < WINDOW_MS) {
    concurrentWith = prior;
  }
  _lastSave.set(key, { userId: userId, content: content, timestamp: now });
  return { concurrentWith: concurrentWith };
}

function _clearForTesting() { _lastSave = new Map(); }

module.exports = { registerSave, setNow, WINDOW_MS, _clearForTesting };
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ep2-s4-concurrent-edit-buffer.js
```

Expected output:
```
  ok - second save within 100ms is detected as concurrent with the first
  ok - a save 150ms later is NOT flagged concurrent (exact 100ms boundary)
  ok - different journey+stage keys never collide
```

- [ ] **Step 5: Run full suite — no regressions**

```bash
node tests/check-ep2-s4-concurrent-edit-buffer.js && node tests/check-ep2-s4-merge-artefact-edits.js
```

Expected output: both files' assertions pass

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/modules/concurrent-edit-buffer.js tests/check-ep2-s4-concurrent-edit-buffer.js
git commit -m "feat(ep2-s4): add 100ms concurrent-save detection buffer (AC1)"
```

---

## Task 3: feature_edits table + attribution record (AC3) — ✅ COMPLETE (commits 2a0734bf, 31597ac7)

**Note:** code-quality review found the DoR-specified `edit_hash` field was undocumented/untested (not speculative — it IS in the DoR's own binding schema spec), plus missing test coverage for the common `operation: 'save'` path and `listEditsForFeature`'s ordering/empty-list behavior. Fixed (31597ac7): doc comment + hash-format test, save-path test, ordering + empty-list tests (matching `artefact-comments.js`'s own sibling pattern), dead-code cleanup.

**Files:**
- Create: `src/web-ui/modules/feature-edits.js`
- Modify: `src/web-ui/adapters/fake-test-db.js`
- Test: `tests/check-ep2-s4-feature-edits.js`

- [ ] **Step 1: Write the failing test**

```javascript
'use strict';
const assert = require('assert');
const { migrateFeatureEditsSchema, recordEdit, listEditsForFeature } = require('../src/web-ui/modules/feature-edits');

function makeFakePool() {
  var rows = [];
  var edits = [];
  return {
    _edits: edits,
    query: async function (sql, params) {
      var s = sql.toUpperCase();
      if (s.indexOf('CREATE TABLE') === 0) return { rows: [] };
      if (s.indexOf('INSERT INTO FEATURE_EDITS') === 0) {
        var row = {
          id: edits.length + 1,
          feature_id: params[0],
          artefact_name: params[1],
          user_id: params[2],
          timestamp: new Date().toISOString(),
          operation: params[3],
          edit_hash: params[4],
          merged_with: params[5],
          line_attributions: params[6],
          tenant_id: params[7]
        };
        edits.push(row);
        return { rows: [row] };
      }
      if (s.indexOf('SELECT') === 0 && s.indexOf('FROM FEATURE_EDITS') > -1) {
        var featureId = params[0];
        var tenantId  = params[1];
        return { rows: edits.filter(function (e) { return e.feature_id === featureId && e.tenant_id === tenantId; }) };
      }
      return { rows: [] };
    }
  };
}

async function testRecordEditCreatesRowWithAttribution() {
  var pool = makeFakePool();
  await migrateFeatureEditsSchema(pool);

  var lineAttributions = { 1: 'user-susan', 2: 'user-susan', 4: 'user-darren', 5: 'user-darren' };
  var record = await recordEdit(pool, {
    featureId: 'feat-a1-uuid',
    artefactName: 's1',
    userId: 'user-susan',
    operation: 'merge',
    content: 'merged content here',
    mergedWith: ['user-susan', 'user-darren'],
    lineAttributions: lineAttributions,
    tenantId: 'tenant-test-123'
  });

  assert.strictEqual(record.operation, 'merge');
  assert.deepStrictEqual(JSON.parse(record.line_attributions), lineAttributions);
  assert.deepStrictEqual(JSON.parse(record.merged_with), ['user-susan', 'user-darren']);
  assert.strictEqual(record.tenant_id, 'tenant-test-123');
}

async function testTenantIsolationOnQuery() {
  var pool = makeFakePool();
  await migrateFeatureEditsSchema(pool);
  await recordEdit(pool, { featureId: 'feat-a1-uuid', artefactName: 's1', userId: 'u1', operation: 'merge', content: 'x', mergedWith: [], lineAttributions: {}, tenantId: 'tenant-a' });
  await recordEdit(pool, { featureId: 'feat-a1-uuid', artefactName: 's1', userId: 'u2', operation: 'merge', content: 'y', mergedWith: [], lineAttributions: {}, tenantId: 'tenant-b' });

  var tenantARows = await listEditsForFeature(pool, 'feat-a1-uuid', 'tenant-a');
  assert.strictEqual(tenantARows.length, 1, 'tenant A query must not see tenant B\'s edit records');
  assert.strictEqual(tenantARows[0].tenant_id, 'tenant-a');
}

async function main() {
  await testRecordEditCreatesRowWithAttribution();
  console.log('  ok - recordEdit creates a row with operation=merge and correct lineAttributions JSON');
  await testTenantIsolationOnQuery();
  console.log('  ok - listEditsForFeature respects tenant isolation (ADR-025)');
}
main().catch(function (err) { console.error('FAIL:', err.message); process.exitCode = 1; });
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-ep2-s4-feature-edits.js
```

Expected output: `Error: Cannot find module '../src/web-ui/modules/feature-edits'`

- [ ] **Step 3: Write minimal implementation**

```javascript
'use strict';

// feature-edits.js — ep2-s4 AC3. Modeled directly on
// modules/artefact-comments.js's own migrateArtefactCommentsSchema +
// createComment shape (idempotent bootstrap, explicit column list,
// RETURNING the inserted row).

var _defaultLogger = { info: function (msg) { console.log(msg); } };

async function migrateFeatureEditsSchema(pool) {
  await pool.query(
    'CREATE TABLE IF NOT EXISTS feature_edits (' +
    'id SERIAL PRIMARY KEY, ' +
    'feature_id VARCHAR NOT NULL, ' +
    'artefact_name VARCHAR NOT NULL, ' +
    'user_id VARCHAR NOT NULL, ' +
    'timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(), ' +
    'operation VARCHAR NOT NULL, ' + // 'save' | 'merge'
    'edit_hash VARCHAR NOT NULL, ' +
    'merged_with TEXT, ' +        // nullable JSON array of user IDs
    'line_attributions TEXT, ' +  // nullable JSON object
    'tenant_id VARCHAR NOT NULL' +
    ')'
  );
}

function _sha256(content) {
  return require('crypto').createHash('sha256').update(content, 'utf8').digest('hex');
}

/**
 * @param {object} pool
 * @param {{featureId:string, artefactName:string, userId:string, operation:'save'|'merge', content:string, mergedWith?:string[], lineAttributions?:object, tenantId:string}} params
 * @param {{info:Function}} [logger]
 * @returns {Promise<object>} the inserted row
 */
async function recordEdit(pool, params, logger) {
  var log = logger || _defaultLogger;
  var editHash = _sha256(params.content);
  var mergedWithJson = params.mergedWith ? JSON.stringify(params.mergedWith) : null;
  var lineAttributionsJson = params.lineAttributions ? JSON.stringify(params.lineAttributions) : null;

  var result = await pool.query(
    'INSERT INTO feature_edits (feature_id, artefact_name, user_id, operation, edit_hash, merged_with, line_attributions, tenant_id) ' +
    'VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ' +
    'RETURNING id, feature_id, artefact_name, user_id, timestamp, operation, edit_hash, merged_with, line_attributions, tenant_id',
    [params.featureId, params.artefactName, params.userId, params.operation, editHash, mergedWithJson, lineAttributionsJson, params.tenantId]
  );
  var row = result.rows[0];
  log.info(JSON.stringify({
    event: 'feature_edit_recorded',
    feature_id: params.featureId,
    artefact_name: params.artefactName,
    operation: params.operation,
    user_id: params.userId
  }));
  return row;
}

/**
 * @param {object} pool
 * @param {string} featureId
 * @param {string} tenantId
 * @returns {Promise<object[]>}
 */
async function listEditsForFeature(pool, featureId, tenantId) {
  var result = await pool.query(
    'SELECT id, feature_id, artefact_name, user_id, timestamp, operation, edit_hash, merged_with, line_attributions, tenant_id ' +
    'FROM feature_edits WHERE feature_id = $1 AND tenant_id = $2 ORDER BY timestamp ASC',
    [featureId, tenantId]
  );
  return result.rows;
}

module.exports = { migrateFeatureEditsSchema, recordEdit, listEditsForFeature };
```

- [ ] **Step 3b: Add fake-test-db.js companion branches**

In `src/web-ui/adapters/fake-test-db.js`, add near the existing `artefact_comments` block (search for `// ── artefact_comments (dsa-s1)`):

```javascript
    // ── feature_edits (ep2-s4) ──────────────────────────────────────────
    // Narrow support for the exact query shapes modules/feature-edits.js
    // issues (recordEdit, listEditsForFeature). Same companion-fix
    // requirement dsa-s1 already established for artefact_comments -- the
    // generic CREATE TABLE catch-all covers the bootstrap; these two
    // branches cover the INSERT/SELECT the generic empty-rows fallback
    // cannot satisfy (result.rows[0] would be undefined otherwise).
    if (s.indexOf('INSERT INTO FEATURE_EDITS') === 0) {
      var feRow = {
        id: featureEdits.length + 1,
        feature_id: p[0],
        artefact_name: p[1],
        user_id: p[2],
        timestamp: new Date().toISOString(),
        operation: p[3],
        edit_hash: p[4],
        merged_with: p[5],
        line_attributions: p[6],
        tenant_id: p[7]
      };
      featureEdits.push(feRow);
      return Promise.resolve({ rows: [feRow] });
    }

    if (s.indexOf('SELECT ID, FEATURE_ID, ARTEFACT_NAME, USER_ID, TIMESTAMP, OPERATION, EDIT_HASH, MERGED_WITH, LINE_ATTRIBUTIONS, TENANT_ID FROM FEATURE_EDITS') === 0) {
      var feFeatureId = p[0];
      var feTenantId  = p[1];
      var feRows = featureEdits.filter(function(r) {
        return r.feature_id === feFeatureId && r.tenant_id === feTenantId;
      });
      return Promise.resolve({ rows: feRows });
    }
```

Also add `var featureEdits = [];` alongside the existing `var artefactComments = [];` declaration near the top of the fake-db factory function (search for `var artefactComments`).

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ep2-s4-feature-edits.js
```

Expected output:
```
  ok - recordEdit creates a row with operation=merge and correct lineAttributions JSON
  ok - listEditsForFeature respects tenant isolation (ADR-025)
```

- [ ] **Step 5: Run full suite — no regressions**

```bash
node tests/check-ep2-s4-feature-edits.js && node scripts/run-all-tests.js
```

Expected output: no new failures beyond the 1 pre-existing `check-p3.5-validate-trace.js` baseline failure already acknowledged at `/branch-setup`

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/modules/feature-edits.js src/web-ui/adapters/fake-test-db.js tests/check-ep2-s4-feature-edits.js
git commit -m "feat(ep2-s4): add feature_edits table + attribution recording (AC3)"
```

---

## Task 4: Merge broadcast (SSE pub/sub) — ✅ COMPLETE (commits be796b30, f6e2d384)

**Note:** code-quality review found the module had no input validation (unlike its own cited precedent `presence-store.js`), no canonical key-builder helper (a real drift risk since Task 5 constructs matching keys at 2 independent call sites), and sparse JSDoc. Fixed (f6e2d384): input guards, exported `keyFor(journeyId, stageName)`, and full JSDoc including the `unsubscribe` identity-match contract.

**Files:**
- Create: `src/web-ui/modules/artefact-merge-broadcast.js`

No dedicated unit test file for this task alone — it is exercised end-to-end by Task 5's integration test (a real subscribe → publish → receive round trip is more meaningful for a pub/sub registry than an isolated unit test of `Map` operations). This is the one task in this plan without its own standalone test file; Task 5's integration test explicitly covers it.

- [ ] **Step 1: Write the implementation directly** (no isolated failing test for this task — see rationale above; Task 5 provides the real coverage)

```javascript
'use strict';

// artefact-merge-broadcast.js — ep2-s4. In-memory pub/sub keyed by
// `${journeyId}:${stageName}`, so a merge triggered by one user's incoming
// save can push to every OTHER open SSE connection subscribed to that same
// journey+stage -- not just the two requests that triggered the merge.
// Single-instance in-memory assumption, matching this codebase's existing
// presence-store.js precedent (no cross-process pub/sub broker).

/** @type {Map<string, Set<import('http').ServerResponse>>} */
var _subscribers = new Map();

function subscribe(key, res) {
  if (!_subscribers.has(key)) _subscribers.set(key, new Set());
  _subscribers.get(key).add(res);
}

function unsubscribe(key, res) {
  var set = _subscribers.get(key);
  if (set) {
    set.delete(res);
    if (set.size === 0) _subscribers.delete(key);
  }
}

/**
 * Push a payload to every subscriber for this key. Gracefully skips any
 * response that has already closed (matches this codebase's own SSE
 * "must gracefully degrade" convention, see handleGetJourneyPresenceStream).
 * @param {string} key
 * @param {object} payload
 */
function publish(key, payload) {
  var set = _subscribers.get(key);
  if (!set) return;
  var data = 'data: ' + JSON.stringify(payload) + '\n\n';
  set.forEach(function (res) {
    try { res.write(data); } catch (_) { /* connection already closed */ }
  });
}

function _clearForTesting() { _subscribers = new Map(); }

module.exports = { subscribe, unsubscribe, publish, _clearForTesting };
```

- [ ] **Step 2: Commit**

```bash
git add src/web-ui/modules/artefact-merge-broadcast.js
git commit -m "feat(ep2-s4): add in-memory merge-broadcast pub/sub for SSE push"
```

---

## Task 5: Wire the real save route + SSE stream + client script (AC1, AC2, AC3 integration) — ✅ COMPLETE (commits da6a7a56, c1aff1e5, f73faf1b)

**Note:** the original implementer subagent hit the account's monthly spend limit mid-task and was cut off before committing — the coordinating session independently verified the uncommitted work (real diff review, ran the tests, ran full regression) and committed it directly. The integration test reached a genuine full round-trip via real `createJourney`/`completeStage` fixtures, not the plan's own weaker fallback. Code-quality review then found a genuine Critical cross-tenant access bug in the new SSE route (missing `requireJourneyAccess` guard, unlike its own sibling `handleGetJourneyPresenceStream`) — fixed directly, along with 3 Important + 2 Minor findings (naming, an inaccurate precedent citation, DRY duplication, require-alias consistency, JSON error-contract consistency). See decisions.md for full detail on both the recovery and the security fix.

**Files:**
- Modify: `src/web-ui/routes/journey.js`
- Modify: `src/web-ui/server.js`
- Create: `src/web-ui/public/artefact-edit-merge.js`
- Test: `tests/check-ep2-s4-integration.js`

- [ ] **Step 1: Write the failing integration test**

```javascript
'use strict';
// Full concurrent-merge flow, exercised via real HTTP requests against a
// locally-started instance of the server (NODE_ENV=test, fake DB), matching
// the pattern established by other *-integration.js checks in this repo
// that spin up a real listener rather than calling handlers in-process.
const assert = require('assert');
const http = require('http');

process.env.NODE_ENV = 'test';

function post(port, path, body, contentType, cookie) {
  return new Promise(function (resolve, reject) {
    var data = contentType === 'application/json' ? JSON.stringify(body) : new URLSearchParams(body).toString();
    var req = http.request({
      hostname: 'localhost', port: port, path: path, method: 'POST',
      headers: Object.assign({ 'Content-Type': contentType, 'Content-Length': Buffer.byteLength(data) }, cookie ? { Cookie: cookie } : {})
    }, function (res) {
      var chunks = [];
      res.on('data', function (c) { chunks.push(c); });
      res.on('end', function () { resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks).toString() }); });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function get(port, path, cookie) {
  return new Promise(function (resolve, reject) {
    var req = http.request({ hostname: 'localhost', port: port, path: path, method: 'GET', headers: cookie ? { Cookie: cookie } : {} }, function (res) {
      var chunks = [];
      res.on('data', function (c) { chunks.push(c); });
      res.on('end', function () { resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks).toString() }); });
    });
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  var server = require('../src/web-ui/server');
  var port = 39887; // fixed test port, unlikely to collide with dev (3000) or E2E (3999)
  await new Promise(function (resolve) { server.listen(port, resolve); });

  try {
    // Seed two distinct sessions (Susan, Darren) via the real /test/session endpoint,
    // overriding sessionId per dsa-s6's own established multi-context pattern.
    var susanSeed = await get(port, '/test/session?sessionId=' + 'a'.repeat(63) + '1' + '&tenantId=e2e-ep2s4');
    var susanCookie = susanSeed.headers['set-cookie'][0].split(';')[0];
    var darrenSeed = await get(port, '/test/session?sessionId=' + 'b'.repeat(63) + '1' + '&tenantId=e2e-ep2s4');
    var darrenCookie = darrenSeed.headers['set-cookie'][0].split(';')[0];

    // NOTE: both sessions resolve to login: 'e2e-tester' server-side (the
    // /test/session fixture endpoint doesn't support distinct logins). The
    // integration test therefore passes distinct actingUserId values in the
    // JSON body itself and asserts the handler uses THAT for attribution,
    // not req.session.login alone -- see Task 5 Step 3's handler code,
    // which reads userId from the body when present (test-only escape
    // hatch, documented inline) falling back to req.session.login in
    // production requests that never send it.

    // This test assumes a journey/stage already exists via a pre-existing
    // fixture-seeding endpoint; the E2E spec (Task 6) covers full real
    // journey creation through the UI. Skipping full setup here would be
    // excessive -- reuse test/seed-definition-session-style fixture if one
    // exists for a generic stage, else this integration test targets the
    // lower-level modules directly rather than duplicating E2E setup cost.
    console.log('  ok - server started, sessions seeded (full concurrent-flow smoke covered by E2E spec, Task 6)');
  } finally {
    await new Promise(function (resolve) { server.close(resolve); });
  }
}
main().catch(function (err) { console.error('FAIL:', err.message); process.exitCode = 1; });
```

**Implementer note on Step 1 above:** this integration test's scope was deliberately kept to "server starts, dual sessions seed correctly" rather than a full save-merge-verify round trip, because reaching a real journey+stage artefact through this codebase's real fixture-seeding surface (without duplicating the E2E spec's own full journey-creation flow) needs one more piece of investigation than this plan's own pre-verification pass covered: confirm whether an existing `/test/seed-*` endpoint can seed a completed journey stage with a known artefact path cheaply, or whether Task 5's integration test should instead call `handlePostJourneyStageArtefact` directly (in-process, not over HTTP) against a hand-built `req`/`res`/journey fixture — check `tests/check-dsa-s1-artefact-body-content-escaping.js`'s own `makeFakeReq()`/`makeFakePool()` pattern for a precedent of testing a `journey.js`/`artefact.js` handler this way without a real HTTP round trip. Pick whichever is less work and note the choice in the commit message; this is a genuine judgment call the plan is leaving open rather than guessing wrong.

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-ep2-s4-integration.js
```

Expected output: fails because `server.listen`/session-seeding for two distinct cookies against the not-yet-modified save route has nothing new to exercise yet (or fails for whatever concrete reason applies once the real Step 1 test is finalized per the implementer note above) — confirm it fails for a real, understood reason before proceeding, not a setup typo.

- [ ] **Step 3: Write the implementation**

In `src/web-ui/routes/journey.js`, modify `handlePostJourneyStageArtefact` (replace the whole function, starting at line ~1517):

```javascript
async function handlePostJourneyStageArtefact(req, res) {
  if (!req.session || !req.session.accessToken) {
    res.writeHead(302, { Location: '/auth/github' });
    res.end();
    return;
  }
  var journeyId = req.params && req.params.journeyId;
  var stageName = req.params && req.params.stageName;
  var journey = _journeyStore.getJourney(journeyId);
  if (!journey) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Journey not found' }));
    return;
  }

  var repoRoot = getRepoRoot(req);
  var storeStage = (journey.completedStages || []).find(function(s) { return s.skillName === stageName; });
  var artefactRelPath = (storeStage && storeStage.artefactPath) || null;
  if (!artefactRelPath) {
    var dj = null;
    try { dj = _journeyDisk.loadJourney(journey.featureSlug, repoRoot); } catch (_) {}
    if (dj && dj.stages && dj.stages[stageName]) {
      artefactRelPath = dj.stages[stageName].artefactPath || null;
    }
  }
  if (!artefactRelPath) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'No artefact path found for stage' }));
    return;
  }

  var isJson = (req.headers['content-type'] || '').indexOf('application/json') === 0;

  if (!isJson) {
    // Unchanged legacy path -- existing form-encoded callers keep working exactly as before.
    var formBody = await _readFormBody(req);
    var newContent = (formBody && formBody.content) || '';
    if (!newContent.trim()) {
      res.writeHead(302, { Location: '/journey/' + encodeURIComponent(journeyId) + '/stage/' + encodeURIComponent(stageName) });
      res.end();
      return;
    }
    var legacyAbsPath = path.resolve(path.join(repoRoot, artefactRelPath));
    try {
      fs.mkdirSync(path.dirname(legacyAbsPath), { recursive: true });
      fs.writeFileSync(legacyAbsPath, newContent, 'utf8');
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to write artefact: ' + err.message }));
      return;
    }
    res.writeHead(302, { Location: '/journey/' + encodeURIComponent(journeyId) + '/stage/' + encodeURIComponent(stageName) });
    res.end();
    return;
  }

  // ep2-s4: new JSON-body path -- concurrency detection, merge, attribution, broadcast.
  var jsonBody = await _readJsonBody(req);
  var content = (jsonBody && jsonBody.content) || '';
  // Test-only escape hatch: the E2E/integration harness's own /test/session
  // fixture cannot seed two DISTINCT req.session.login values (both resolve
  // to 'e2e-tester') -- allow the request body to name the acting user
  // ONLY when NODE_ENV=test, so two simulated concurrent users are
  // distinguishable in tests. Production requests never send this field;
  // req.session.login/userId remains the sole source of truth outside tests.
  var actingUserId = (process.env.NODE_ENV === 'test' && jsonBody && jsonBody.actingUserId)
    ? jsonBody.actingUserId
    : (req.session.login || String(req.session.userId));

  if (!content.trim()) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'content is required' }));
    return;
  }

  var absPath = path.resolve(path.join(repoRoot, artefactRelPath));
  var bufferKey = journeyId + ':' + stageName;
  var mergeBuffer = require('../modules/concurrent-edit-buffer');
  var detection = mergeBuffer.registerSave(bufferKey, actingUserId, content);

  var finalContent = content;
  var merged = false;
  var lineAttributions = null;
  var mergedWith = null;

  if (detection.concurrentWith && detection.concurrentWith.userId !== actingUserId) {
    var baseContent = '';
    try { baseContent = fs.readFileSync(absPath, 'utf8'); } catch (_) {}
    var mergeFn = require('../modules/merge-artefact-edits');
    try {
      var mergeResult = mergeFn.mergeArtefactEdits(
        baseContent,
        content,
        detection.concurrentWith.content,
        { userAId: actingUserId, userBId: detection.concurrentWith.userId }
      );
      finalContent = mergeResult.merged;
      lineAttributions = mergeResult.lineAttributions;
      merged = true;
      mergedWith = [actingUserId, detection.concurrentWith.userId];
    } catch (mergeErr) {
      if (mergeErr.code === 'MERGE_CONFLICT_HARD') {
        res.writeHead(409, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Merge conflict detected — unable to auto-merge', code: 'MERGE_CONFLICT_HARD' }));
        return;
      }
      throw mergeErr;
    }
  }

  try {
    fs.mkdirSync(path.dirname(absPath), { recursive: true });
    fs.writeFileSync(absPath, finalContent, 'utf8');
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Failed to write artefact: ' + err.message }));
    return;
  }

  if (_pshPoolForFeatureEdits) {
    var featureEdits = require('../modules/feature-edits');
    try {
      await featureEdits.recordEdit(_pshPoolForFeatureEdits, {
        featureId: journey.featureSlug,
        artefactName: stageName,
        userId: actingUserId,
        operation: merged ? 'merge' : 'save',
        content: finalContent,
        mergedWith: mergedWith,
        lineAttributions: lineAttributions,
        tenantId: req.session.tenantId || journey.tenantId || 'unknown'
      });
    } catch (_) { /* feature_edits is an audit trail -- do not fail the save if this write fails */ }
  }

  var broadcast = require('../modules/artefact-merge-broadcast');
  broadcast.publish(bufferKey, {
    content: finalContent,
    merged: merged,
    lineAttributions: lineAttributions,
    mergedAt: Date.now(),
    userIds: mergedWith || [actingUserId]
  });

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ content: finalContent, merged: merged, lineAttributions: lineAttributions }));
}
```

Add a `setFeatureEditsPool` setter near the top of `journey.js` (alongside the file's other `let _x = default; function setX(fn) { _x = fn; }` injectable-adapter declarations — search for an existing one, e.g. `_journeyStore`, to match the file's own convention) and a module-level `var _pshPoolForFeatureEdits = null;`, then export `setFeatureEditsPool` from the file's `module.exports` block. Wire the real pool in `server.js` at startup, alongside wherever `_pshPool` is otherwise passed into `journey.js`'s other pool-consuming setters (search for an existing `set*Pool` call near server startup to match the pattern).

Add the new SSE handler, placed near `handleGetJourneyPresenceStream` (after it, same file):

```javascript
/**
 * GET /api/journey/:journeyId/stage/:stageName/artefact-merged — ep2-s4
 * AC2. SSE stream pushing merged artefact content the instant a concurrent
 * save is detected and merged for this journey+stage. Event-driven (via
 * modules/artefact-merge-broadcast.js), unlike handleGetJourneyPresenceStream's
 * own periodic-interval-poll pattern -- a merge here is triggered by an
 * UNRELATED concurrent request's arrival, not a timer.
 */
async function handleGetArtefactMergeStream(req, res) {
  if (!req.session || !req.session.accessToken) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'NOT_AUTHENTICATED' }));
    return;
  }
  var journeyId = req.params && req.params.journeyId;
  var stageName = req.params && req.params.stageName;
  var key = journeyId + ':' + stageName;
  var broadcast = require('../modules/artefact-merge-broadcast');

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  broadcast.subscribe(key, res);
  if (typeof res.on === 'function') {
    res.on('close', function () { broadcast.unsubscribe(key, res); });
  }
}
```

Add `handleGetArtefactMergeStream` and `setFeatureEditsPool` to `journey.js`'s `module.exports` block at the bottom of the file.

In `src/web-ui/server.js`:
1. Add `handleGetArtefactMergeStream, setFeatureEditsPool` to the existing `require('./routes/journey')` destructure (line ~39).
2. Near server startup where other `journey.js` pool setters are called (search for a call like `setListJourneys(...)` or similar near where `_pshPool` is available), add: `setFeatureEditsPool(_pshPool);`
3. Add the new route, placed immediately after the existing presence-stream route (line ~3470):

```javascript
  } else if (pathname.match(/^\/api\/journey\/([^/]+)\/stage\/([^/]+)\/artefact-merged$/) && req.method === 'GET') {
    // ep2-s4 AC2 -- SSE stream pushing merged artefact content on concurrent save
    req.params = { journeyId: pathname.split('/')[3], stageName: decodeURIComponent(pathname.split('/')[5]) };
    await handleGetArtefactMergeStream(req, res);

```

Create `src/web-ui/public/artefact-edit-merge.js`:

```javascript
'use strict';

// artefact-edit-merge.js -- ep2-s4. Intercepts the edit-mode artefact
// <form>'s submit, POSTs JSON instead of a full-page form submission, and
// listens for pushed merge updates from a concurrent save via SSE.
// journey.js's edit-mode markup has no editor.js today (this file did not
// exist before this story) -- see decisions.md for the full investigation.

(function () {
  var form = document.querySelector('.sv-edit-bar')
    ? document.querySelector('.sv-edit-bar').closest('form')
    : null;
  if (!form) return; // not on an edit-mode page

  var textarea = form.querySelector('textarea[name="content"]');
  var saveUrl = form.getAttribute('action');

  form.addEventListener('submit', function (evt) {
    evt.preventDefault();
    fetch(saveUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: textarea.value })
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.content != null) textarea.value = data.content;
      })
      .catch(function () { /* SSE/fetch failures must degrade gracefully -- web-ui/core.md */ });
  });

  // Derive the SSE URL from the save URL's own journeyId/stageName segments
  // (saveUrl shape: /api/journey/:journeyId/stage/:stageName/artefact).
  var match = saveUrl.match(/^\/api\/journey\/([^/]+)\/stage\/([^/]+)\/artefact$/);
  if (!match) return;
  var streamUrl = '/api/journey/' + match[1] + '/stage/' + match[2] + '/artefact-merged';

  var source = new EventSource(streamUrl);
  source.onmessage = function (evt) {
    try {
      var payload = JSON.parse(evt.data);
      if (payload.content != null) textarea.value = payload.content;
    } catch (_) { /* ignore malformed frame */ }
  };
  window.addEventListener('beforeunload', function () { source.close(); });
})();
```

Wire the new script into the edit-mode markup in `journey.js` (the `mainPanel` block for `isEdit`, near line ~1180) — add immediately after the closing `</form>`:

```javascript
      '</form>',
      '<script src="/public/artefact-edit-merge.js"></script>'
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ep2-s4-integration.js
```

Expected output: `  ok - server started, sessions seeded (full concurrent-flow smoke covered by E2E spec, Task 6)` (or the fuller round-trip assertion, per whichever Step-1-note path the implementer chose)

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: no new failures beyond the 1 pre-existing baseline failure

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/journey.js src/web-ui/server.js src/web-ui/public/artefact-edit-merge.js tests/check-ep2-s4-integration.js
git commit -m "feat(ep2-s4): wire JSON save path, SSE merge stream, and client script (AC1, AC2, AC3 integration)"
```

---

## Task 6: E2E — two concurrent browser sessions merge live (AC1, AC2, AC3 end-to-end) — ✅ COMPLETE (commit a757cf39)

**Note:** found and fixed 3 real bugs in the plan's own illustrative Step 1 example code (non-hex session IDs that silently fail auth; merge-content assertions that don't match the real algorithm's actual first-saver-vs-second-saver asymmetry; an SSE header-buffering deadlock from awaiting the fetch too early) — all independently verified by both reviewers as genuine corrections, not defects. Also added a second test proving a genuine third-party observer (neither saver) receives the merged push over the live SSE stream, a stronger proof of AC2's literal "sees the merged version" claim than a response-payload assertion alone. 10 consecutive test runs, 0 flakiness.

**Files:**
- Create: `tests/e2e/ep2-s4-concurrent-merge.spec.js`

- [ ] **Step 1: Write the E2E test**

```javascript
// ep2-s4-concurrent-merge.spec.js -- E2E coverage for ep2-s4 (concurrent
// artefact-edit merge). Two distinct browser contexts (Susan, Darren) via
// distinct /test/session sessionId overrides -- both resolve to
// login:'e2e-tester' server-side (a known fixture limitation, see
// decisions.md and the plan's own Task 5 implementer note), so this spec
// asserts on the RESPONSE PAYLOAD's own actingUserId-driven attribution
// (sent via the request body under NODE_ENV=test) rather than on any
// UI text that would depend on two distinct display names.

'use strict';

const { test, expect } = require('@playwright/test');

async function seedSession(request, sessionId, tenantId) {
  const res = await request.get('/test/session?sessionId=' + sessionId + '&tenantId=' + tenantId);
  expect(res.status()).toBe(200);
  const setCookie = res.headers()['set-cookie'];
  return setCookie;
}

test('concurrent saves within 100ms merge and both clients receive the result (AC1, AC2, AC3)', async ({ browser }) => {
  const susanContext = await browser.newContext();
  const darrenContext = await browser.newContext();

  await seedSession(susanContext.request, 's'.repeat(63) + '1', 'e2e-ep2s4');
  await seedSession(darrenContext.request, 'd'.repeat(63) + '1', 'e2e-ep2s4');

  // Precondition: a real journey + completed stage with a known artefact
  // path must exist for both sessions to edit. This spec assumes a fixture
  // route or a pre-seeded journey is available -- if none exists yet,
  // create one via the real discovery->stage-complete flow first (check
  // other E2E specs, e.g. dsa-s1's own artefact-viewer spec, for the
  // established TEST_SLUG fixture this codebase already seeds via the
  // NODE_ENV=test fetcher) rather than inventing a new one. Flag as a PR
  // comment if the exact fixture journeyId/stageName pairing needs
  // confirming against real server startup fixtures.
  const journeyId = process.env.EP2S4_TEST_JOURNEY_ID || 'test-journey-ep2s4';
  const stageName = 'discovery';
  const saveUrl = '/api/journey/' + journeyId + '/stage/' + stageName + '/artefact';

  const susanSavePromise = susanContext.request.post(saveUrl, {
    data: { content: 'Line 1: AC1 revised by Susan\nLine 2: unchanged', actingUserId: 'user-susan' },
    headers: { 'Content-Type': 'application/json' }
  });
  await new Promise((r) => setTimeout(r, 50));
  const darrenSavePromise = darrenContext.request.post(saveUrl, {
    data: { content: 'Line 1: unchanged\nLine 2: architecture revised by Darren', actingUserId: 'user-darren' },
    headers: { 'Content-Type': 'application/json' }
  });

  const [susanRes, darrenRes] = await Promise.all([susanSavePromise, darrenSavePromise]);

  expect(susanRes.status(), 'Susan\'s save must succeed').toBe(200);
  expect(darrenRes.status(), 'Darren\'s save must succeed').toBe(200);

  const darrenBody = await darrenRes.json();
  expect(darrenBody.merged, 'the second (concurrent) save should report merged=true').toBe(true);
  expect(darrenBody.content).toContain('revised by Susan');
  expect(darrenBody.content).toContain('revised by Darren');
  expect(darrenBody.lineAttributions).toBeTruthy();

  await susanContext.close();
  await darrenContext.close();
});
```

- [ ] **Step 2: Run test**

```bash
NODE_ENV=test npx playwright test tests/e2e/ep2-s4-concurrent-merge.spec.js --reporter=list
```

Expected output: `1 passed` once a valid `journeyId`/`stageName` fixture pairing is confirmed (see Step 1's own inline note — this is the one remaining piece of investigation this plan intentionally leaves to implementation time rather than guessing a fixture that may not exist).

- [ ] **Step 3: Run full regression**

```bash
node scripts/run-all-tests.js
NODE_ENV=test npx playwright test tests/e2e/ep2-s1-presence-sidebar.spec.js --reporter=list
NODE_ENV=test npx playwright test tests/e2e/ep2-s3-approval.spec.js --reporter=list
```

(Re-run ep2-s1's and ep2-s3's own pre-existing E2E suites — same epic, both touch journey.js's shared route-dispatch surface — as an explicit regression check, matching this session's own established convention of re-running sibling-story E2E suites after any shared-file change.)

Expected output: no regressions in either sibling suite; full suite shows only the 1 pre-existing baseline failure

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/ep2-s4-concurrent-merge.spec.js
git commit -m "test(ep2-s4): add E2E coverage for concurrent-save merge (AC1, AC2, AC3 end-to-end)"
```

---

## Final cross-task review — ✅ PASS (re-verified after fixes)

The final cross-task reviewer's first pass found 1 HIGH + 2 MEDIUM findings: a cross-tenant WRITE vulnerability in the actual save route (`handlePostJourneyStageArtefact` had no tenant guard — pre-existing, but in-scope given the DoR's own ADR-025 binding constraint and the inconsistency of leaving it open after fixing the sibling SSE route), a missing regression test for the earlier SSE Critical fix, and a missing NFR-Perf-3 success-rate suite. Closing the NFR gap surfaced a SECOND genuine false-conflict bug in the merge algorithm (adjacent-but-non-overlapping edits falsely flagged as conflicting) — found, root-caused, and fixed with an interval-overlap correction, verified via 1000+400 additional randomized stress-test trials beyond the committed suites. All 3 findings re-verified as genuinely fixed on the reviewer's second pass (commit `883251a5`) — see decisions.md for the full investigation.

## Post-plan note

Route/handler E2E coverage check and the live browser render check both mandatorily apply at `/verify-completion` time, per this repo's own established convention (`verify-completion/SKILL.md`) — since this story modifies `journey.js` (a route file) and adds new rendered client behavior (the merge-push into the textarea), both checks are REQUIRED, not optional, when this story reaches that skill. Given the High oversight level and Complexity 3 rating, the NFR success-rate suite (≥99% across 100+ randomized concurrent scenarios) should also be run as part of Task 3's or a dedicated final task's own verification — not scoped as a separate task above since it reuses Task 1's `mergeArtefactEdits()` directly with generated random inputs; add it during `/verify-completion` if not already covered by the time all 6 tasks land.
