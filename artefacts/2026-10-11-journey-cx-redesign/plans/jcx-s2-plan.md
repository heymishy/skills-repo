# Placeholder mapping auto-converts to linked once its triggered discovery is approved — Implementation Plan

**Goal:** Make every test in the test plan pass (5 tests: 1 unit, 3 integration, 1 NFR). Add a provenance column connecting a placeholder mapping to the discovery it triggered, then a conversion-check that runs on canvas page load and flips `placeholder` → `linked` once that discovery is approved.
**Branch:** `feature/jcx-s2`
**Worktree:** `.worktrees/jcx-s2`
**Test command:** `npm test` (full suite) / `node tests/check-jcx-s2-placeholder-conversion.js` (this story's own tests)

---

## Architecture note — a real gap found in jcx-s1, not assumed away

jcx-s2's own DoR Assumption says: "The mechanism for detecting 'this journey's discovery was triggered from this specific mapping' relies on the provenance record jcx-s1's own trigger handler writes... no new provenance mechanism is introduced here." Checked this directly against jcx-s1's actual shipped code (`discovery-seeder.js`'s `seedDiscoveryFromStage`): the only provenance it writes is the stage's own NAME in prose inside `discovery.md`'s Problem Statement (`Stage: [name]`) — not a structured, reliable link (stage names aren't unique; no mapping_id/journey_id is recorded anywhere). **This is a real, implementation-time-discovered gap in jcx-s1, not a false alarm** — the DoR's own Assumption was wrong about something already existing. Fixing it is a necessary precondition for jcx-s2 to work at all, not scope creep: without it, there is no way for a conversion-check to know which discovery belongs to which mapping.

**Fix:** add a new nullable `triggered_feature_slug TEXT` column to `feature_customer_journey_stage_mappings`, set by `handleTriggerPlaceholderFeature` (jcx-s1's own handler, patched here) immediately after it computes the real `featureSlug` — the same value already returned in the trigger response, just now also persisted. This deviates from the DoR's own H-MIG "N/A" assessment (which assumed no new column was needed); documented here and in the DoD rather than silently worked around.

`/discovery`'s own established convention for marking approval (confirmed directly in `skills/discovery/SKILL.md` line 465): "update the Status field to 'Approved'". Real examples confirmed in this repo: `**Status:** Approved` on its own line (`artefacts/2026-10-10-infinite-canvas/discovery.md`). The conversion-check reads this directly from disk — matches the test plan's own AC1 precondition ("discovery.md has just had its Status field set to Approved").

---

## File map

```
Modify:
  src/web-ui/server.js                      — add triggered_feature_slug column migration
  scripts/migrate-schema-journeys.js        — mirror the same column (ic-hotfix1 mirroring rule)
  src/web-ui/routes/journeys.js             — patch handleTriggerPlaceholderFeature (persist slug);
                                               add checkPlaceholderConversions; wire into handleGetJourneyCanvas
  src/web-ui/adapters/discovery-seeder.js   — add isDiscoveryApproved(featureSlug, repoRoot)

Create:
  tests/check-jcx-s2-placeholder-conversion.js
```

---

## Task 1: Provenance column + jcx-s1 trigger handler patch

- [ ] **Step 1: Write the failing tests** (provenance half, folded into Task 2's own test file — see Task 2 Step 1 for the full file; this task's own slice is the first 2 tests, asserting `triggered_feature_slug` gets persisted)

- [ ] **Step 2: Run test — must fail** (module doesn't export the new behavior yet)

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/server.js`, extend the existing `feature_customer_journey_stage_mappings` migration chain (after the `mapping_state` `ALTER TABLE`):

```javascript
    }).then(function() {
      // jcx-s2 -- links a placeholder mapping to the real feature slug its
      // own trigger created, so the conversion-check (handleGetJourneyCanvas)
      // can find "this mapping's own discovery.md" without guessing. Set by
      // handleTriggerPlaceholderFeature at trigger time; read (never written)
      // by the conversion-check. Null for every mapping that was never
      // triggered (a real/linked mapping, or a placeholder never clicked).
      return _creditsPool.query(`ALTER TABLE feature_customer_journey_stage_mappings ADD COLUMN IF NOT EXISTS triggered_feature_slug TEXT`);
    }).then(function() { console.log('feature_customer_journey_stage_mappings table ready'); })
```

(Remove the old `.then(function() { console.log(...) })` line immediately above `mapping_state`'s own `ALTER TABLE` — it moves to after this new statement, same pattern as `mapping_state` itself was added after `ic-hotfix1`.)

Mirror in `scripts/migrate-schema-journeys.js` (after its own `mapping_state` `ALTER TABLE` added by jcx-s1):

```javascript
  await db.query(`ALTER TABLE feature_customer_journey_stage_mappings ADD COLUMN IF NOT EXISTS triggered_feature_slug TEXT`);
```

In `src/web-ui/routes/journeys.js`, patch `handleTriggerPlaceholderFeature` (after `_discoverySeeder.seedDiscoveryFromStage` succeeds, before the response):

```javascript
  var result = _discoverySeeder.seedDiscoveryFromStage(stage, mapping.feature_slug, repoRoot);
  if (result.error) { badRequest(result.error); return; }

  // jcx-s2 -- persist the provenance link this story's own conversion-check
  // depends on. Best-effort: if this UPDATE fails, the trigger itself still
  // succeeded (the discovery.md is already on disk) -- log and continue
  // rather than erroring the whole request over a bookkeeping write.
  try {
    await pool.query(
      `UPDATE feature_customer_journey_stage_mappings SET triggered_feature_slug = $1 WHERE id = $2 AND tenant_id = $3`,
      [result.featureSlug, mappingId, tenantId]
    );
  } catch (e) { console.error('jcx-s2: failed to persist triggered_feature_slug:', e.message); }

  if (res.status) { res.status(200).json({ featureSlug: result.featureSlug }); }
```

- [ ] **Step 4-6:** covered by Task 2's own test run (same file) — see below.

---

## Task 2: Conversion-check function + wiring + tests

- [ ] **Step 1: Write the failing tests**

```javascript
'use strict';
// check-jcx-s2-placeholder-conversion.js -- TDD tests for jcx-s2 (Epic:
// journey-map-and-placeholder-trigger, 2026-10-11-journey-cx-redesign).
// Story: artefacts/2026-10-11-journey-cx-redesign/stories/jcx-s2.md
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

let passed = 0; let failed = 0;
function pass(name) { console.log(`  [PASS] ${name}`); passed++; }
function fail(name, err) { console.error(`  [FAIL] ${name}: ${err.message || err}`); failed++; }

function makeDiscoveryFixture(repoRoot, slug, status) {
  var dir = path.join(repoRoot, 'artefacts', slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'discovery.md'), '# Discovery: X\n\n**Status:** ' + status + '\n', 'utf8');
}

function makeMockPool(mappingRows) {
  const updateCalls = [];
  return {
    updateCalls: updateCalls,
    query: function(sql, params) {
      var s = String(sql).trim();
      if (/^SELECT .* FROM feature_customer_journey_stage_mappings WHERE mapping_state = 'placeholder'/.test(s)) {
        var journeyId = params[0], tenantId = params[1];
        var rows = mappingRows.filter(function(m) { return m.journey_id === journeyId && m.tenant_id === tenantId && m.mapping_state === 'placeholder'; });
        return Promise.resolve({ rows: rows });
      }
      if (/^UPDATE feature_customer_journey_stage_mappings SET mapping_state = 'linked'/.test(s)) {
        updateCalls.push({ sql: s, params: params });
        var row = mappingRows.find(function(m) { return m.id === params[1]; });
        if (row) { row.mapping_state = 'linked'; row.feature_slug = row.triggered_feature_slug; }
        return Promise.resolve({ rows: [] });
      }
      return Promise.resolve({ rows: [] });
    }
  };
}

(async function() {
  const { checkPlaceholderConversions } = require('../src/web-ui/routes/journeys');

  // -- AC1: approval converts placeholder -> linked, feature_slug updates --
  try {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'jcx-s2-'));
    makeDiscoveryFixture(repoRoot, '2026-10-13-bulk-export', 'Approved');
    const mappingRows = [{ id: 'map-1', journey_id: 'j1', journey_stage_id: 's1', tenant_id: 't1', mapping_state: 'placeholder', feature_slug: 'Bulk export', triggered_feature_slug: '2026-10-13-bulk-export' }];
    const pool = makeMockPool(mappingRows);
    await checkPlaceholderConversions(pool, 'j1', 't1', repoRoot);
    assert.strictEqual(mappingRows[0].mapping_state, 'linked', 'expected mapping_state to become linked');
    assert.strictEqual(mappingRows[0].feature_slug, '2026-10-13-bulk-export', 'expected feature_slug to update to the real approved slug');
    assert.strictEqual(pool.updateCalls.length, 1, 'expected exactly one UPDATE');
    fs.rmSync(repoRoot, { recursive: true, force: true });
    pass('AC1: approval converts the mapping to linked with the real feature slug');
  } catch (e) { fail('AC1: approval converts the mapping to linked with the real feature slug', e); }

  // -- AC2: an unapproved discovery leaves the mapping untouched --
  try {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'jcx-s2-'));
    makeDiscoveryFixture(repoRoot, '2026-10-13-still-draft', 'Draft');
    const mappingRows = [{ id: 'map-1', journey_id: 'j1', journey_stage_id: 's1', tenant_id: 't1', mapping_state: 'placeholder', feature_slug: 'Still draft', triggered_feature_slug: '2026-10-13-still-draft' }];
    const pool = makeMockPool(mappingRows);
    await checkPlaceholderConversions(pool, 'j1', 't1', repoRoot);
    assert.strictEqual(mappingRows[0].mapping_state, 'placeholder', 'expected mapping_state to remain placeholder');
    assert.strictEqual(pool.updateCalls.length, 0, 'expected zero UPDATE calls');
    fs.rmSync(repoRoot, { recursive: true, force: true });
    pass('AC2: an unapproved discovery leaves the mapping untouched');
  } catch (e) { fail('AC2: an unapproved discovery leaves the mapping untouched', e); }

  // -- AC3: two independent mappings convert independently --
  try {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'jcx-s2-'));
    makeDiscoveryFixture(repoRoot, '2026-10-13-approved-one', 'Approved');
    makeDiscoveryFixture(repoRoot, '2026-10-13-draft-one', 'Draft');
    const mappingRows = [
      { id: 'map-1', journey_id: 'j1', journey_stage_id: 's1', tenant_id: 't1', mapping_state: 'placeholder', feature_slug: 'Approved one', triggered_feature_slug: '2026-10-13-approved-one' },
      { id: 'map-2', journey_id: 'j1', journey_stage_id: 's2', tenant_id: 't1', mapping_state: 'placeholder', feature_slug: 'Draft one', triggered_feature_slug: '2026-10-13-draft-one' }
    ];
    const pool = makeMockPool(mappingRows);
    await checkPlaceholderConversions(pool, 'j1', 't1', repoRoot);
    assert.strictEqual(mappingRows[0].mapping_state, 'linked', 'expected the approved one to convert');
    assert.strictEqual(mappingRows[1].mapping_state, 'placeholder', 'expected the draft one to remain placeholder');
    assert.strictEqual(pool.updateCalls.length, 1, 'expected exactly one UPDATE, targeting only the approved mapping');
    assert.strictEqual(pool.updateCalls[0].params[1], 'map-1', 'expected the UPDATE to target map-1 specifically');
    fs.rmSync(repoRoot, { recursive: true, force: true });
    pass('AC3: two independent placeholder mappings convert independently');
  } catch (e) { fail('AC3: two independent placeholder mappings convert independently', e); }

  // -- AC4 (unit): an abandoned placeholder (never triggered) never auto-converts --
  try {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'jcx-s2-'));
    const mappingRows = [{ id: 'map-1', journey_id: 'j1', journey_stage_id: 's1', tenant_id: 't1', mapping_state: 'placeholder', feature_slug: 'Never triggered', triggered_feature_slug: null }];
    const pool = makeMockPool(mappingRows);
    await checkPlaceholderConversions(pool, 'j1', 't1', repoRoot);
    assert.strictEqual(mappingRows[0].mapping_state, 'placeholder', 'expected mapping_state to remain placeholder');
    assert.strictEqual(pool.updateCalls.length, 0, 'expected zero UPDATE calls -- no triggered_feature_slug means nothing to check');
    fs.rmSync(repoRoot, { recursive: true, force: true });
    pass('AC4: an abandoned (never-triggered) placeholder never auto-converts');
  } catch (e) { fail('AC4: an abandoned (never-triggered) placeholder never auto-converts', e); }

  // -- NFR: conversion check is tenant-scoped --
  try {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'jcx-s2-'));
    makeDiscoveryFixture(repoRoot, '2026-10-13-other-tenant', 'Approved');
    const mappingRows = [{ id: 'map-1', journey_id: 'j1', journey_stage_id: 's1', tenant_id: 'org-2', mapping_state: 'placeholder', feature_slug: 'Other tenant', triggered_feature_slug: '2026-10-13-other-tenant' }];
    const pool = makeMockPool(mappingRows);
    await checkPlaceholderConversions(pool, 'j1', 'org-1', repoRoot);
    assert.strictEqual(mappingRows[0].mapping_state, 'placeholder', 'expected the other tenant\'s mapping to remain untouched');
    assert.strictEqual(pool.updateCalls.length, 0, 'expected zero UPDATE calls -- the SELECT itself is tenant-scoped, matching D13');
    fs.rmSync(repoRoot, { recursive: true, force: true });
    pass('NFR: conversion check is tenant-scoped -- a cross-tenant mapping is never touched');
  } catch (e) { fail('NFR: conversion check is tenant-scoped -- a cross-tenant mapping is never touched', e); }

  console.log(`\n[jcx-s2-placeholder-conversion] Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-jcx-s2-placeholder-conversion.js
```

Expected: `Cannot destructure property 'checkPlaceholderConversions'`

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/adapters/discovery-seeder.js`, add:

```javascript
/**
 * Reads artefacts/[featureSlug]/discovery.md and returns true if its own
 * Status field reads "Approved" -- the exact convention /discovery's own
 * SKILL.md documents ("update the Status field to 'Approved'"). Returns
 * false (never throws) if the file doesn't exist or has no matching line --
 * jcx-s2 AC4's own "abandoned, never approved" case must resolve to a quiet
 * no-op, not an error.
 * @param {string} featureSlug
 * @param {string} repoRoot
 * @returns {boolean}
 */
function isDiscoveryApproved(featureSlug, repoRoot) {
  try {
    var discoveryPath = path.join(path.resolve(repoRoot), 'artefacts', featureSlug, 'discovery.md');
    var content = fs.readFileSync(discoveryPath, 'utf8');
    return /^\*\*Status:\*\*\s*Approved\s*$/m.test(content);
  } catch (_) {
    return false;
  }
}

module.exports = { seedDiscoveryFromStage, slugify, isDiscoveryApproved };
```

In `src/web-ui/routes/journeys.js`, add after `handleTriggerPlaceholderFeature`:

```javascript
/**
 * jcx-s2 -- for every placeholder mapping in this journey that was
 * triggered (triggered_feature_slug set), check whether its own seeded
 * discovery.md has since been approved; if so, convert it to linked. A
 * pure reconciliation pass, not a push-based event -- called from
 * handleGetJourneyCanvas on every page load (AC2's own "when the operator
 * views the stage"). Tenant-scoped at the SELECT itself (D13/ADR-025) --
 * never a separate per-row ownership check, since the query's own WHERE
 * clause already excludes every other tenant's rows.
 * @param {object} pool
 * @param {string} journeyId
 * @param {string} tenantId
 * @param {string} repoRoot
 */
async function checkPlaceholderConversions(pool, journeyId, tenantId, repoRoot) {
  var mr = await pool.query(
    `SELECT id, triggered_feature_slug FROM feature_customer_journey_stage_mappings WHERE mapping_state = 'placeholder' AND triggered_feature_slug IS NOT NULL AND journey_id = $1 AND tenant_id = $2`,
    [journeyId, tenantId]
  );
  for (var i = 0; i < (mr.rows || []).length; i++) {
    var row = mr.rows[i];
    if (_discoverySeeder.isDiscoveryApproved(row.triggered_feature_slug, repoRoot)) {
      await pool.query(
        `UPDATE feature_customer_journey_stage_mappings SET mapping_state = 'linked', feature_slug = $1 WHERE id = $2 AND tenant_id = $3`,
        [row.triggered_feature_slug, row.id, tenantId]
      );
    }
  }
}
```

Wire into `handleGetJourneyCanvas` — insert immediately after the existing mappings query (after the `mappingsByStage` build loop, before `buildHealthIndicator`/`buildDeliveryAnnotations` etc. are ever called, so this SAME render reflects any conversion that just happened):

```javascript
  // jcx-s2 -- reconcile placeholder -> linked conversions before rendering,
  // so a converted mapping shows as linked on THIS page load, not only
  // after a second reload.
  await checkPlaceholderConversions(pool, journeyId, tenantId, repoRoot);
  var mr = await pool.query(
    `SELECT id, journey_stage_id, feature_slug, metric_keys, mapping_state FROM feature_customer_journey_stage_mappings WHERE journey_id = $1`,
    [journeyId]
  );
```

(Re-run the mappings query AFTER the conversion-check, rather than mutating `mr.rows` in place -- simpler and correct, at the cost of one extra query only on journeys that actually have a placeholder mapping to check. `repoRoot` is already computed earlier in this same function, line ~577 -- reuse it, do not recompute.)

Add `checkPlaceholderConversions` to `module.exports`.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-jcx-s2-placeholder-conversion.js
```

Expected: `Results: 5 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/server.js scripts/migrate-schema-journeys.js src/web-ui/routes/journeys.js src/web-ui/adapters/discovery-seeder.js tests/check-jcx-s2-placeholder-conversion.js
git commit -m "feat: jcx-s2 -- placeholder auto-converts to linked once its triggered discovery is approved"
```

---

## Final check

- [ ] All 5 tests pass (`node tests/check-jcx-s2-placeholder-conversion.js`)
- [ ] Full suite green (`npm test`)
- [ ] Live-browser check: given the confirmed working local/staging auth situation this session, attempt a REAL live-browser re-verification this time (create a placeholder, trigger it, manually edit the seeded discovery.md's Status to Approved, reload the canvas page, confirm it shows as linked) — do not repeat jcx-s1's own jsdom-only substitution without first trying the real thing, given jcx-hotfix1 just proved why that substitution missed a real bug.
- [ ] No scope beyond the 4 ACs + NFR — no automatic cleanup/expiry (AC4 explicitly forbids it), no bidirectional sync
