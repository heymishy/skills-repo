# Assign Multiple Pods to a Feature (Subset Selection) — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available) or /tdd per task if executing in this session.

**Goal:** Let a product owner assign more than one pod to a feature and remove individual members from that combined set for this feature only, without touching global pod membership.
**Branch:** `feature/ep4-s1`
**Worktree:** `.worktrees/ep4-s1`
**Test command:** `npm test` (full suite) / `node tests/check-ep4-s1-multi-pod-assign.js` (this story's own integration test) / `npx playwright test tests/e2e/ep4-s1-multi-pod-assign.spec.js` (E2E)

**Real touch points (see `decisions.md`, 2026-09-22, for the full architecture investigation this plan is built on — the DoR's own `routes/features.js`/`pod-assignment-manager.js`/`features-settings.html` touch points do not exist):**
- `src/web-ui/modules/pod-assignment-store.js` — extend (multi-pod assign)
- `src/web-ui/modules/feature-collaborator-store.js` — extend (union-insert + removal tracking)
- `src/web-ui/adapters/fake-test-db.js` — extend (test-double support for the new queries)
- `src/web-ui/routes/products.js` — extend (3 new handlers + per-feature-row UI, following the existing `/products/:id/set-default-pod` and `featureModuleAssignments` inline-per-row patterns — there is no separate "feature settings" page anywhere in this app to extend)
- `src/web-ui/server.js` — extend (require + route wiring + startup migration call)

**Design decisions carried from `decisions.md` (do not re-litigate mid-implementation):**
1. `getFeatureCollaborators()` stays **completely unchanged** — matches the DoR's own "MUST NOT modify" list; the DoR's separate proposal to turn it into a dynamic recompute-from-`pod_assignments` builder was rejected as a larger, self-contradicting, unnecessary change (see decisions.md point 8).
2. `feature_collaborators` stays a write-time materialized table (existing `populateFeatureCollaboratorsFromPod` pattern), extended with a union-insert variant — not replaced with a read-time computed view.
3. Removal is tracked permanently in a new `feature_collaborator_removals` table so a removed member is never silently resurrected by a later pod (re-)assignment.
4. Archived-pod filtering is out of scope — no pod-archiving mechanism exists anywhere in this app yet; `listPods()` is reused completely unchanged.
5. Re-assigning an already-assigned pod may write a redundant `pod_assignments` row (that table has no upsert-on-`(feature_id, pod_id)` constraint) but is a safe no-op for `feature_collaborators` (de-duplicated in application code). Not a gap against any AC.

---

## File map

```
Modify:
  src/web-ui/modules/pod-assignment-store.js       — assignPodsToFeature(), getFeaturePodAssignments(); setFeatureDefaultPod() gains an optional assignmentType
  src/web-ui/modules/feature-collaborator-store.js — migrateFeatureCollaboratorRemovalsSchema(), populateFeatureCollaboratorsFromPods(), removeFeatureCollaborator(), getFeatureCollaboratorRemovals()
  src/web-ui/adapters/fake-test-db.js               — test-double support for the 4 genuinely new query shapes above
  src/web-ui/routes/products.js                     — handleGetFeaturePods, handlePostAssignFeaturePods, handleDeleteFeaturePodMember; per-feature-row "⚙ Pods" button + shared modal + client script
  src/web-ui/server.js                              — require the 3 new products.js handlers + migrateFeatureCollaboratorRemovalsSchema; wire 3 new routes; call the new migration at startup

Create:
  tests/check-ep4-s1-multi-pod-assign.js            — integration test: real handlers + fake pool, covers AC1 (data shape)/AC2/AC3 + removal-resurrection guard + tenant isolation
  tests/e2e/ep4-s1-multi-pod-assign.spec.js         — E2E: real browser render of the modal + multi-select + save + removal (AC1's UI requirement)
```

---

## Task 1: DB layer — multi-pod assignment + removal tracking ✅ COMPLETE (commits `54c0cb29`, fix `f5224333`)

**Review notes:** Spec-compliance ✅ (verified all 4 fake-db prefix branches don't collide, resurrection-guard logic traced manually, 7/7 tests). Code-quality found 1 Important issue (fixed: `removeFeatureCollaborator`'s INSERT lacked `ON CONFLICT (feature_id, user_id) DO NOTHING` — a duplicate removal would throw an unhandled unique-constraint violation in real Postgres; fixed in `f5224333` with a new regression test, now 8/8) and 3 Minor issues (accepted, non-blocking: a small SQL-string duplication between `populateFeatureCollaboratorsFromPod`/`...Pods`, a per-pod validation loop that could be batched, and a naming closeness between the singular/plural function names).

**Files:**
- Modify: `src/web-ui/modules/pod-assignment-store.js`
- Modify: `src/web-ui/modules/feature-collaborator-store.js`
- Modify: `src/web-ui/adapters/fake-test-db.js`
- Test: `tests/check-ep4-s1-store-layer.js` (new)

- [ ] **Step 1: Write the failing test**

```javascript
// tests/check-ep4-s1-store-layer.js
'use strict';
const assert = require('assert');
const { createFakeTestDb } = require('../src/web-ui/adapters/fake-test-db');
const podStore = require('../src/web-ui/modules/pod-store');
const podAssignmentStore = require('../src/web-ui/modules/pod-assignment-store');
const collabStore = require('../src/web-ui/modules/feature-collaborator-store');

let passed = 0, failed = 0;
function check(name, fn) {
  return fn().then(() => { console.log('  \u2713 ' + name); passed++; })
    .catch(err => { console.log('  \u2717 ' + name + ' -- ' + err.message); failed++; });
}

async function main() {
  const db = createFakeTestDb();
  await podStore.migratePodsSchema(db);
  await podAssignmentStore.migratePodAssignmentsSchema(db);
  await collabStore.migrateFeatureCollaboratorsSchema(db);
  await collabStore.migrateFeatureCollaboratorRemovalsSchema(db);

  const core = await podStore.createPod(db, { tenantId: 't1', name: 'Core Platform Pod', createdBy: 'hamish', members: [
    { userId: 'hamish', roleId: 'conductor' }, { userId: 'susan', roleId: 'engineer' }, { userId: 'darren', roleId: 'engineer' }
  ] });
  const data = await podStore.createPod(db, { tenantId: 't1', name: 'Data Analytics Pod', createdBy: 'hamish', members: [
    { userId: 'alice', roleId: 'architect' }, { userId: 'bob', roleId: 'engineer' }
  ] });

  await check('assignPodsToFeature inserts one pod_assignments row per pod', async () => {
    const result = await podAssignmentStore.assignPodsToFeature(db, {
      tenantId: 't1', featureId: 'feat-a2', productId: 'prod-1', podIds: [core.podId, data.podId], assignedBy: 'hamish'
    });
    assert.strictEqual(result.assignmentIds.length, 2);
  });

  await check('getFeaturePodAssignments returns both assigned pods', async () => {
    const rows = await podAssignmentStore.getFeaturePodAssignments(db, 't1', 'feat-a2');
    assert.strictEqual(rows.length, 2);
    assert.ok(rows.some(r => r.podName === 'Core Platform Pod'));
    assert.ok(rows.some(r => r.podName === 'Data Analytics Pod'));
  });

  await check('assignPodsToFeature rejects a podId from another tenant', async () => {
    let threw = false;
    try {
      await podAssignmentStore.assignPodsToFeature(db, { tenantId: 't2', featureId: 'feat-b1', productId: 'prod-2', podIds: [core.podId], assignedBy: 'x' });
    } catch (err) { threw = err.code === 'POD_NOT_FOUND'; }
    assert.ok(threw, 'expected POD_NOT_FOUND for a pod belonging to a different tenant');
  });

  await check('populateFeatureCollaboratorsFromPods unions both pods with no duplicates', async () => {
    const result = await collabStore.populateFeatureCollaboratorsFromPods(db, { featureId: 'feat-a2', podIds: [core.podId, data.podId] });
    assert.strictEqual(result.addedCount, 5);
    const rows = await collabStore.getFeatureCollaborators(db, 'feat-a2');
    assert.strictEqual(rows.length, 5);
  });

  await check('removeFeatureCollaborator deletes the row and records a removal', async () => {
    await collabStore.removeFeatureCollaborator(db, { featureId: 'feat-a2', userId: 'bob', removedBy: 'hamish' });
    const rows = await collabStore.getFeatureCollaborators(db, 'feat-a2');
    assert.ok(!rows.some(r => r.userId === 'bob'), 'bob should be gone from feature_collaborators');
    const removals = await collabStore.getFeatureCollaboratorRemovals(db, 'feat-a2');
    assert.deepStrictEqual(removals, ['bob']);
  });

  await check('re-running populateFeatureCollaboratorsFromPods does not resurrect a removed member', async () => {
    await collabStore.populateFeatureCollaboratorsFromPods(db, { featureId: 'feat-a2', podIds: [core.podId, data.podId] });
    const rows = await collabStore.getFeatureCollaborators(db, 'feat-a2');
    assert.ok(!rows.some(r => r.userId === 'bob'), 'bob must stay removed across a re-assignment of the same pods');
    assert.strictEqual(rows.length, 4, 'exactly Hamish, Susan, Darren, Alice');
  });

  await check('pod_members is untouched by the removal (removal is feature-scoped only)', async () => {
    const memberRow = (await db.query('SELECT user_id, role_id FROM pod_members WHERE pod_id = $1', [data.podId])).rows;
    assert.ok(memberRow.some(r => r.user_id === 'bob'), 'bob must remain a real pod_members row globally');
  });

  console.log('\n[check-ep4-s1-store-layer] ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exit(1);
}

main();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-ep4-s1-store-layer.js
```

Expected output: `TypeError: podAssignmentStore.assignPodsToFeature is not a function` (or equivalent — the new exports don't exist yet)

- [ ] **Step 3: Write minimal implementation**

`src/web-ui/modules/pod-assignment-store.js` — replace the existing `setFeatureDefaultPod` function and `module.exports` block with:

```javascript
/**
 * ep1-s3: record that a specific FEATURE (journey) inherited a pod from its
 * product's default. Unlike setProductDefaultPod (feature_id IS NULL, one
 * row per product), this always INSERTs a new row (feature_id IS NOT NULL,
 * one row per feature) -- no upsert/conflict handling needed, since a given
 * featureId can only be created once.
 * ep4-s1: args.assignmentType is optional (defaults to the ep1-s3 literal)
 * so this same INSERT can be reused for an explicit multi-pod assignment
 * (assignmentType: 'explicit-multi-assign') without duplicating the SQL.
 * @returns {Promise<{assignmentId: string}>}
 */
async function setFeatureDefaultPod(pool, args) {
  const assignmentId = crypto.randomUUID();
  const assignmentType = args.assignmentType || 'feature-inherits-product-default';
  await pool.query(
    'INSERT INTO pod_assignments (assignment_id, tenant_id, pod_id, product_id, feature_id, assignment_type, assigned_by) VALUES ($1, $2, $3, $4, $5, $6, $7)',
    [assignmentId, args.tenantId, args.podId, args.productId, args.featureId, assignmentType, args.assignedBy]
  );
  return { assignmentId };
}

/**
 * ep4-s1 (AC1, AC3): assign MULTIPLE pods to a feature in one call. Validates
 * every podId belongs to this tenant BEFORE writing any row (same
 * validate-before-write convention as setProductDefaultPod above) -- a
 * failure partway through would otherwise leave a partial assignment with no
 * way to tell the caller which pods actually got assigned.
 * @returns {Promise<{assignmentIds: string[], podNames: string[]}>}
 * @throws {Error} with .code = 'POD_NOT_FOUND' if any podId doesn't belong to this tenant
 */
async function assignPodsToFeature(pool, args) {
  const validatedPods = [];
  for (const podId of args.podIds) {
    const podRow = (await pool.query('SELECT pod_id, tenant_id, name FROM pods WHERE pod_id = $1 AND tenant_id = $2', [podId, args.tenantId])).rows[0];
    if (!podRow) {
      const err = new Error('No pod found with that id for this tenant');
      err.code = 'POD_NOT_FOUND';
      throw err;
    }
    validatedPods.push(podRow);
  }
  const assignmentIds = [];
  for (const podRow of validatedPods) {
    const result = await setFeatureDefaultPod(pool, {
      tenantId: args.tenantId,
      podId: podRow.pod_id,
      productId: args.productId,
      featureId: args.featureId,
      assignedBy: args.assignedBy,
      assignmentType: 'explicit-multi-assign'
    });
    assignmentIds.push(result.assignmentId);
  }
  return { assignmentIds, podNames: validatedPods.map((p) => p.name) };
}

/**
 * ep4-s1: read every pod currently assigned to a feature (distinct by
 * pod_id -- a pod re-assigned more than once across separate saves produces
 * more than one pod_assignments row, deliberately not deduped at the SQL
 * layer since Postgres has no unique constraint on (feature_id, pod_id) for
 * this story's scope; see decisions.md point 5).
 * @returns {Promise<{podId: string, podName: string}[]>}
 */
async function getFeaturePodAssignments(pool, tenantId, featureId) {
  const rows = (await pool.query(
    'SELECT pa.pod_id, pa.assignment_type, p.name FROM pod_assignments pa JOIN pods p ON p.pod_id = pa.pod_id WHERE pa.tenant_id = $1 AND pa.feature_id = $2',
    [tenantId, featureId]
  )).rows;
  const seen = new Set();
  const distinct = [];
  for (const r of rows) {
    if (seen.has(r.pod_id)) continue;
    seen.add(r.pod_id);
    distinct.push({ podId: r.pod_id, podName: r.name });
  }
  return distinct;
}

module.exports = {
  migratePodAssignmentsSchema,
  setProductDefaultPod,
  getProductDefaultPod,
  setFeatureDefaultPod,
  assignPodsToFeature,
  getFeaturePodAssignments
};
```

`src/web-ui/modules/feature-collaborator-store.js` — add after `getFeatureCollaborators` and before `module.exports`:

```javascript
/**
 * ep4-s1: schema bootstrap for feature_collaborator_removals -- the durable
 * record of "this user was explicitly removed from this feature's
 * collaborator set", consulted by populateFeatureCollaboratorsFromPods so a
 * later (re-)assignment of an already-assigned pod never silently
 * resurrects a removed member. See decisions.md point 7.
 */
async function migrateFeatureCollaboratorRemovalsSchema(pool, logger) {
  const log = logger || { info: function(msg) { console.log(msg); } };
  await pool.query(`
    CREATE TABLE IF NOT EXISTS feature_collaborator_removals (
      feature_id  VARCHAR     NOT NULL,
      user_id     VARCHAR     NOT NULL,
      removed_by  VARCHAR,
      removed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (feature_id, user_id)
    )
  `);
  log.info('[ep4-s1] feature_collaborator_removals schema migrated');
}

/**
 * ep4-s1: read every userId explicitly removed from a feature.
 * @returns {Promise<string[]>}
 */
async function getFeatureCollaboratorRemovals(pool, featureId) {
  const rows = (await pool.query('SELECT user_id FROM feature_collaborator_removals WHERE feature_id = $1', [featureId])).rows;
  return rows.map((r) => r.user_id);
}

/**
 * ep4-s1 (AC2): remove a single collaborator from ONE feature only. Does NOT
 * touch pod_members -- the removal is recorded permanently (so a later
 * re-assignment can't resurrect them) and the live feature_collaborators row
 * is deleted.
 */
async function removeFeatureCollaborator(pool, args) {
  await pool.query(
    'INSERT INTO feature_collaborator_removals (feature_id, user_id, removed_by) VALUES ($1, $2, $3)',
    [args.featureId, args.userId, args.removedBy]
  );
  await pool.query('DELETE FROM feature_collaborators WHERE feature_id = $1 AND user_id = $2', [args.featureId, args.userId]);
}

/**
 * ep4-s1 (AC1, AC3): union-insert every member of every given pod into a
 * feature's collaborator set, skipping anyone already present (present in
 * more than one selected pod) and anyone with a standing removal record for
 * this feature (decisions.md point 7). Reuses the exact same INSERT shape as
 * populateFeatureCollaboratorsFromPod (ep1-s3) and getFeatureCollaborators
 * (unchanged, per decisions.md point 8) -- no new query shapes for either.
 * @returns {Promise<{addedCount: number}>}
 */
async function populateFeatureCollaboratorsFromPods(pool, args) {
  const existing = await getFeatureCollaborators(pool, args.featureId);
  const existingUserIds = new Set(existing.map((c) => c.userId));
  const removedUserIds = new Set(await getFeatureCollaboratorRemovals(pool, args.featureId));
  let addedCount = 0;
  for (const podId of args.podIds) {
    const members = (await pool.query('SELECT user_id, role_id FROM pod_members WHERE pod_id = $1', [podId])).rows;
    for (const m of members) {
      if (existingUserIds.has(m.user_id) || removedUserIds.has(m.user_id)) continue;
      const collaboratorId = crypto.randomUUID();
      await pool.query(
        'INSERT INTO feature_collaborators (collaborator_id, feature_id, user_id, role_id, pod_id) VALUES ($1, $2, $3, $4, $5)',
        [collaboratorId, args.featureId, m.user_id, m.role_id, podId]
      );
      existingUserIds.add(m.user_id);
      addedCount++;
    }
  }
  return { addedCount };
}

module.exports = {
  migrateFeatureCollaboratorsSchema,
  migrateFeatureCollaboratorRemovalsSchema,
  populateFeatureCollaboratorsFromPod,
  populateFeatureCollaboratorsFromPods,
  getFeatureCollaborators,
  getFeatureCollaboratorRemovals,
  removeFeatureCollaborator
};
```

`src/web-ui/adapters/fake-test-db.js` — 4 changes:

1. Add a new in-memory array near the existing `featureCollaborators` declaration (around line 68):

```javascript
  var featureCollaboratorRemovals = []; // { feature_id, user_id, removed_by } -- ep4-s1
```

2. Add to `_reset()`'s body (alongside the existing `featureCollaborators = [];` line):

```javascript
      featureCollaboratorRemovals = [];
```

3. Add these 3 new branches immediately after the existing `if (s.indexOf('SELECT PA.POD_ID, P.NAME FROM POD_ASSIGNMENTS') === 0) { ... }` block (ep1-s2's `getProductDefaultPod` branch):

```javascript
    // ep4-s1: getFeaturePodAssignments's own read -- a DIFFERENT column list
    // (PA.POD_ID, PA.ASSIGNMENT_TYPE, P.NAME) than ep1-s2's existing
    // "SELECT PA.POD_ID, P.NAME FROM POD_ASSIGNMENTS..." branch above (that
    // one is feature_id IS NULL-only; this one is feature_id = $2), so it
    // needs its own exact-prefix branch.
    if (s.indexOf('SELECT PA.POD_ID, PA.ASSIGNMENT_TYPE, P.NAME FROM POD_ASSIGNMENTS') === 0) {
      var gfpaTenantId = p[0];
      var gfpaFeatureId = p[1];
      var gfpaRows = podAssignments
        .filter(function(r) { return r.tenant_id === gfpaTenantId && r.feature_id === gfpaFeatureId; })
        .map(function(r) {
          var podRow = pods.find(function(pd) { return pd.pod_id === r.pod_id; });
          return { pod_id: r.pod_id, assignment_type: r.assignment_type, name: podRow ? podRow.name : null };
        });
      return Promise.resolve({ rows: gfpaRows });
    }
```

4. Add these 3 new branches immediately after the existing `if (s.indexOf('SELECT COLLABORATOR_ID, USER_ID, ROLE_ID, POD_ID FROM FEATURE_COLLABORATORS WHERE FEATURE_ID') === 0) { ... }` block (`getFeatureCollaborators`'s own branch):

```javascript
    // ── feature_collaborator_removals (ep4-s1) ──────────────────────────
    // "CREATE TABLE IF NOT EXISTS FEATURE_COLLABORATOR_REMOVALS" is already
    // covered by the generic "CREATE TABLE" catch-all near the top of this
    // function -- no separate branch needed for the migration.
    if (s.indexOf('SELECT USER_ID FROM FEATURE_COLLABORATOR_REMOVALS WHERE FEATURE_ID') === 0) {
      var gfcrFeatureId = p[0];
      var gfcrRows = featureCollaboratorRemovals
        .filter(function(r) { return r.feature_id === gfcrFeatureId; })
        .map(function(r) { return { user_id: r.user_id }; });
      return Promise.resolve({ rows: gfcrRows });
    }
    if (s.indexOf('INSERT INTO FEATURE_COLLABORATOR_REMOVALS') === 0) {
      var ifcrFeatureId = p[0];
      var ifcrUserId = p[1];
      var ifcrRemovedBy = p[2];
      var ifcrDup = featureCollaboratorRemovals.some(function(r) { return r.feature_id === ifcrFeatureId && r.user_id === ifcrUserId; });
      if (!ifcrDup) {
        featureCollaboratorRemovals.push({ feature_id: ifcrFeatureId, user_id: ifcrUserId, removed_by: ifcrRemovedBy });
      }
      return Promise.resolve({ rows: [], rowCount: 1 });
    }
    if (s.indexOf('DELETE FROM FEATURE_COLLABORATORS WHERE FEATURE_ID') === 0) {
      var dfcFeatureId = p[0];
      var dfcUserId = p[1];
      featureCollaborators = featureCollaborators.filter(function(r) { return !(r.feature_id === dfcFeatureId && r.user_id === dfcUserId); });
      return Promise.resolve({ rows: [], rowCount: 1 });
    }
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ep4-s1-store-layer.js
```

Expected output: `[check-ep4-s1-store-layer] 7 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: `695 file(s) run, 1 failed` (only the pre-existing `check-p3.5-validate-trace.js`) — plus the new `check-ep4-s1-store-layer.js` now counted among the passing files.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/modules/pod-assignment-store.js src/web-ui/modules/feature-collaborator-store.js src/web-ui/adapters/fake-test-db.js tests/check-ep4-s1-store-layer.js
git commit -m "feat: add multi-pod assignment and feature-scoped removal to the pod/collaborator store layer"
```

---

## Task 2: HTTP handlers — assign pods, read pods view-model, remove a member ✅ COMPLETE (commits `c84ac54d`, fix `9bc39eb5`)

**Review notes:** Spec-compliance ✅ (all 3 handlers verified byte-for-byte against plan, CSRF/tenant-isolation guards confirmed present, correctly unreachable pre-Task-3, full suite 696/1). Code-quality found 2 Important issues (both fixed in `9bc39eb5`): (1) the 3 handlers' local `_json` helpers broke this file's established `if (res.status) {...} else {...}` dual-path convention used by 90+ other call sites — fixed to match; (2) `handlePostAssignFeaturePods` silently swallowed a `populateFeatureCollaboratorsFromPods` failure after `assignPodsToFeature` already committed, unlike this file's own established stage-tagged handling of the identical failure shape in `handlePostProductFeature` — fixed to surface a 500 with a diagnostic log line rather than misrepresenting a partial failure as success. Also fixed a Minor (missing `userId` validation in the DELETE handler).

**Files:**
- Modify: `src/web-ui/routes/products.js`
- Test: covered by Task 5's integration test (handlers are pure orchestration over Task 1's already-tested store functions; no separate unit test file for this task alone, matching this feature's own established consolidation pattern for thin handler layers)

- [ ] **Step 1: Extend the existing imports**

In `src/web-ui/routes/products.js`, replace this line (around line 27-28):

```javascript
var { setProductDefaultPod, getProductDefaultPod, setFeatureDefaultPod } = require('../modules/pod-assignment-store'); // ep1-s2, ep1-s3
var { populateFeatureCollaboratorsFromPod } = require('../modules/feature-collaborator-store'); // ep1-s3
```

with:

```javascript
var { setProductDefaultPod, getProductDefaultPod, setFeatureDefaultPod, assignPodsToFeature, getFeaturePodAssignments } = require('../modules/pod-assignment-store'); // ep1-s2, ep1-s3, ep4-s1
var { populateFeatureCollaboratorsFromPod, populateFeatureCollaboratorsFromPods, getFeatureCollaborators, removeFeatureCollaborator } = require('../modules/feature-collaborator-store'); // ep1-s3, ep4-s1
var { listPods } = require('../modules/pod-store'); // ep4-s1 -- reused unchanged (decisions.md point 9), no archived-pod filtering added
```

- [ ] **Step 2: Add the 3 new handlers**

Add immediately after `handlePostSetDefaultPod` (the function ending just before the `prc-s4.1` comment block, around line 3736):

```javascript
/**
 * ep4-s1 (AC1) -- GET /products/:productId/features/:featureId/pods: the
 * view-model for the "Assign pods" modal -- every active pod in the tenant
 * (for the selector), which pods this feature already has assigned, and the
 * feature's current collaborator set (so the modal can pre-check assigned
 * pods and show who is already present/removed). Reuses listPods (ep1-s1),
 * getFeaturePodAssignments (ep4-s1, Task 1), getFeatureCollaborators
 * (ep1-s3, unchanged) -- no new store function needed for this handler.
 */
async function handleGetFeaturePods(req, res, _next, pool) {
  var _pool = pool;
  var productId = req.params && req.params.productId;
  var featureId = req.params && req.params.featureId;
  var tenantId = req.session && req.session.tenantId;

  function _json(status, payload) {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(payload));
  }

  var journeyRow = (await _pool.query('SELECT journey_id, tenant_id, product_id FROM journeys WHERE journey_id = $1', [featureId])).rows[0];
  if (!journeyRow || journeyRow.tenant_id !== tenantId || journeyRow.product_id !== productId) {
    return _json(404, { error: 'Feature not found' });
  }

  var orgPods = await listPods(_pool, tenantId);
  var assignedPods = await getFeaturePodAssignments(_pool, tenantId, featureId);
  var collaborators = await getFeatureCollaborators(_pool, featureId);

  return _json(200, { orgPods: orgPods, assignedPods: assignedPods, collaborators: collaborators });
}

/**
 * ep4-s1 (AC1, AC3) -- POST /products/:productId/features/:featureId/pods:
 * assign one or more pods to a feature and (re-)populate its collaborator
 * set from the union of those pods' members, minus anyone with a standing
 * removal record (decisions.md point 7).
 */
async function handlePostAssignFeaturePods(req, res, _next, pool) {
  var csrfOk = await _csrf.csrfGuard(req, res);
  if (!csrfOk) return;
  var _pool = pool;
  var productId = req.params && req.params.productId;
  var featureId = req.params && req.params.featureId;
  var tenantId = req.session && req.session.tenantId;
  var body = req.body || {};
  var podIds = Array.isArray(body.podIds) ? body.podIds.filter(function(id) { return typeof id === 'string' && id.trim(); }) : [];

  function _json(status, payload) {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(payload));
  }

  if (podIds.length === 0) {
    return _json(400, { error: 'At least one podId is required' });
  }

  var journeyRow = (await _pool.query('SELECT journey_id, tenant_id, product_id FROM journeys WHERE journey_id = $1', [featureId])).rows[0];
  if (!journeyRow || journeyRow.tenant_id !== tenantId || journeyRow.product_id !== productId) {
    return _json(404, { error: 'Feature not found' });
  }

  var assignedBy = (req.session && (req.session.userId || req.session.login)) || null;
  var assignResult;
  try {
    assignResult = await assignPodsToFeature(_pool, { tenantId: tenantId, featureId: featureId, productId: productId, podIds: podIds, assignedBy: assignedBy });
  } catch (err) {
    if (err && err.code === 'POD_NOT_FOUND') {
      return _json(400, { error: 'No pod found with that id for this tenant' });
    }
    throw err;
  }

  await populateFeatureCollaboratorsFromPods(_pool, { featureId: featureId, podIds: podIds });
  var collaborators = await getFeatureCollaborators(_pool, featureId);

  return _json(200, { assignedPodNames: assignResult.podNames, collaborators: collaborators });
}

/**
 * ep4-s1 (AC2) -- DELETE /products/:productId/features/:featureId/pods/members/:userId:
 * remove one collaborator from this feature only. Does not touch pod_members
 * -- see removeFeatureCollaborator (ep4-s1, Task 1).
 */
async function handleDeleteFeaturePodMember(req, res, _next, pool) {
  var csrfOk = await _csrf.csrfGuard(req, res);
  if (!csrfOk) return;
  var _pool = pool;
  var productId = req.params && req.params.productId;
  var featureId = req.params && req.params.featureId;
  var userId = req.params && req.params.userId;
  var tenantId = req.session && req.session.tenantId;

  function _json(status, payload) {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(payload));
  }

  var journeyRow = (await _pool.query('SELECT journey_id, tenant_id, product_id FROM journeys WHERE journey_id = $1', [featureId])).rows[0];
  if (!journeyRow || journeyRow.tenant_id !== tenantId || journeyRow.product_id !== productId) {
    return _json(404, { error: 'Feature not found' });
  }

  var removedBy = (req.session && (req.session.userId || req.session.login)) || null;
  await removeFeatureCollaborator(_pool, { featureId: featureId, userId: userId, removedBy: removedBy });
  var collaborators = await getFeatureCollaborators(_pool, featureId);

  return _json(200, { removedUserId: userId, collaborators: collaborators });
}
```

- [ ] **Step 3: Export the 3 new handlers**

Find `module.exports` near the bottom of `products.js` and add, next to the existing `handlePostSetDefaultPod`:

```javascript
  handleGetFeaturePods,
  handlePostAssignFeaturePods,
  handleDeleteFeaturePodMember,
```

- [ ] **Step 4: Run full suite — no regressions (nothing calls these yet, so nothing can pass or fail on them individually until Task 3 wires the routes)**

```bash
npm test
```

Expected output: `695 file(s) run, 1 failed` (unchanged from Task 1's baseline — these handlers are unreachable dead code until Task 3, which is intentional for this task's own small diff)

- [ ] **Step 5: Commit**

```bash
git add src/web-ui/routes/products.js
git commit -m "feat: add multi-pod assignment and feature-scoped removal HTTP handlers"
```

---

## Task 3: Wire the 3 new routes in server.js ✅ COMPLETE (commits `03738876`, fix `d423a5f8`)

**Review notes:** Spec-compliance ✅ (route regexes/param-index arithmetic manually verified, requireNonViewer gating confirmed correct on mutating routes only, full suite 696/1). Code-quality found 1 Important (fixed: the new `migrateFeatureCollaboratorRemovalsSchema` import used a second, separate `require()` of an already-imported module — inconsistent with this same diff's own merge-into-existing-require convention shown elsewhere) and 2 Minor (both fixed as part of the same commit: column alignment, migration-failure log format). One unrelated, confirmed-environmental test flake (`check-pcr-s1-test-runner.js`, a system-load-sensitive timing NFR from a different feature entirely) appeared on one full-suite run and was independently reproduced/ruled out via standalone re-runs before committing.

**Files:**
- Modify: `src/web-ui/server.js`

- [ ] **Step 1: Extend the existing import line**

Replace (around line 102):

```javascript
const { handlePostSetDefaultPod }                                    = require('./routes/products'); // ep1-s2 (products.js already required elsewhere in this file for its other handlers -- this is an additional named import from the same module)
```

with:

```javascript
const { handlePostSetDefaultPod, handleGetFeaturePods, handlePostAssignFeaturePods, handleDeleteFeaturePodMember } = require('./routes/products'); // ep1-s2, ep4-s1 (products.js already required elsewhere in this file for its other handlers -- this is an additional named import from the same module)
```

Also add, next to the existing `migrateFeatureCollaboratorsSchema` import (around line 104):

```javascript
const { migrateFeatureCollaboratorRemovalsSchema }                  = require('./modules/feature-collaborator-store'); // ep4-s1
```

- [ ] **Step 2: Add the startup migration call**

Immediately after the existing `ep1-s3` migration block (around line 627-630):

```javascript
    // ep4-s1 — Auto-migrate feature_collaborator_removals schema.
    migrateFeatureCollaboratorRemovalsSchema(_userRolesPool).then(function() {
      console.log('[ep4-s1] feature_collaborator_removals schema ready');
    }).catch(function(err) { console.error('[ep4-s1] feature_collaborator_removals schema migration failed', err); });
```

- [ ] **Step 3: Add the 3 route blocks**

Immediately after the existing `set-default-pod` route block (after its closing, around line 3849-3850):

```javascript
  } else if (pathname.match(/^\/products\/[^/]+\/features\/[^/]+\/pods$/) && req.method === 'GET') {
    // ep4-s1 (AC1) — pods view-model for the "Assign pods" modal
    req.params = { productId: pathname.split('/')[2], featureId: pathname.split('/')[4] };
    authGuard(req, res, async () => { await handleGetFeaturePods(req, res, null, _pshPool); });

  } else if (pathname.match(/^\/products\/[^/]+\/features\/[^/]+\/pods$/) && req.method === 'POST') {
    // ep4-s1 (AC1, AC3) — assign multiple pods to a feature
    req.params = { productId: pathname.split('/')[2], featureId: pathname.split('/')[4] };
    authGuard(req, res, async () => {
      let _rnvOk = false;
      await requireNonViewer(req, res, () => { _rnvOk = true; });
      if (!_rnvOk) return;
      await handlePostAssignFeaturePods(req, res, null, _pshPool);
    });

  } else if (pathname.match(/^\/products\/[^/]+\/features\/[^/]+\/pods\/members\/[^/]+$/) && req.method === 'DELETE') {
    // ep4-s1 (AC2) — remove one collaborator from this feature only
    req.params = { productId: pathname.split('/')[2], featureId: pathname.split('/')[4], userId: pathname.split('/')[7] };
    authGuard(req, res, async () => {
      let _rnvOk = false;
      await requireNonViewer(req, res, () => { _rnvOk = true; });
      if (!_rnvOk) return;
      await handleDeleteFeaturePodMember(req, res, null, _pshPool);
    });
```

- [ ] **Step 4: Run full suite — no regressions**

```bash
npm test
```

Expected output: `695 file(s) run, 1 failed` (only the pre-existing failure)

- [ ] **Step 5: Commit**

```bash
git add src/web-ui/server.js
git commit -m "feat: wire the multi-pod assignment routes and startup migration"
```

---

## Task 4: Product-page UI — "Assign pods" button and modal ✅ COMPLETE (commits `1b134766`, fix `6adfb5b2`)

**Deviation:** the implementer found and fixed a third row-renderer closure (`_renderPvcItemRowForPhase`, By Phase tab) the plan's Step 2 didn't name — independently confirmed by both reviewers as correct and necessary (omitting it would have shipped a broken Pods button, empty `productId`, in that one tab).

**Review notes:** Spec-compliance ✅ (deviation verified correct, modal render-once-per-page confirmed, CSRF field-name/location matched against `middleware/csrf.js` directly, full suite 696/1). Code-quality found 1 **Critical** (fixed in `6adfb5b2`, then independently re-verified with a proof-of-concept trace by a dedicated follow-up review): pod names and collaborator userIds were rendered via unescaped client-side string concatenation, with a userId also reaching a triple-nested JS-string-in-HTML-attribute-in-HTML inline `onclick` handler — a real stored-XSS vector. Rewritten to build DOM nodes via `createElement`/`textContent` with the remove button wired through `addEventListener` over a closure-captured userId, matching this file's own already-established safer precedent (the default-pod picker's identical rendering). Also fixed 2 Important (no network-failure handling on any of the 3 async fetch flows — added try/catch with user-visible errors; no modal focus management — added initial focus, Escape-to-close, and focus-restore-on-close, deliberately stopping short of a full keyboard focus trap as disproportionate to this story's scope) and 1 Minor (dead `collabByUser` variable, removed as part of the same rewrite). One Minor (`location.reload()` after Save vs. DOM-patching) was assessed by the reviewer as borderline/non-blocking given this file's own mixed convention for similar single-row mutations, and left as-is.

**Files:**
- Modify: `src/web-ui/routes/products.js`

- [ ] **Step 1: Add the per-feature-row trigger button**

In `_renderPvcItemRow` (around line 406-410), extend the existing `renameLink` block to add a sibling "⚙ Pods" button, matching the exact same sibling-button convention already used for `renameLink` (nested interactive elements are invalid HTML, so this is a sibling of the row's own `<a>`, not nested inside it):

Replace:

```javascript
  var renameLink = item.journeyId
    ? ' <button type="button" class="pvc-rename-btn" onclick="pshRenameFeature(\'' + _escapeHtml(item.journeyId) + '\',\'' + _escapeHtml(displayName).replace(/'/g, '&#39;') + '\')" ' +
        'aria-label="Rename ' + _escapeHtml(displayName) + '" ' +
        'style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:12px;padding:0 4px">✎ Rename</button>'
    : '';
```

with:

```javascript
  var renameLink = item.journeyId
    ? ' <button type="button" class="pvc-rename-btn" onclick="pshRenameFeature(\'' + _escapeHtml(item.journeyId) + '\',\'' + _escapeHtml(displayName).replace(/'/g, '&#39;') + '\')" ' +
        'aria-label="Rename ' + _escapeHtml(displayName) + '" ' +
        'style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:12px;padding:0 4px">✎ Rename</button>'
    : '';
  // ep4-s1 (AC1): "Assign pods" trigger, a sibling button after renameLink --
  // same reason renameLink is a sibling of the row's own <a>, not nested.
  var podsLink = item.journeyId
    ? ' <button type="button" class="pvc-pods-btn" onclick="ep4s1OpenPodsModal(\'' + _escapeHtml(item.journeyId) + '\',\'' + _escapeHtml(displayName).replace(/'/g, '&#39;') + '\')" ' +
        'aria-label="Assign pods to ' + _escapeHtml(displayName) + '" ' +
        'style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:12px;padding:0 4px">\u2699 Pods</button>'
    : '';
```

Then update the line that assembles `discoveryLink`/`renameLink` (around line 452) from:

```javascript
    (discoveryLink || renameLink ? '<div style="font-size:12px;margin-top:2px">' + discoveryLink + renameLink + '</div>' : '');
```

to:

```javascript
    (discoveryLink || renameLink || podsLink ? '<div style="font-size:12px;margin-top:2px">' + discoveryLink + renameLink + podsLink + '</div>' : '');
```

- [ ] **Step 2: Add the shared modal + client script**

`_renderPvcItemRow` needs `productId` to build the fetch URLs, but doesn't currently receive it. Add a `productId` parameter and thread it through both call sites. Change the function signature (around line 380):

```javascript
function _renderPvcItemRow(item, includeCheckbox, preferFeatureName, sessionOriginByJourneyId, productId) {
```

and change the `onclick` for `podsLink` above to also carry `productId`:

```javascript
  var podsLink = item.journeyId
    ? ' <button type="button" class="pvc-pods-btn" onclick="ep4s1OpenPodsModal(\'' + _escapeHtml(productId || '') + '\',\'' + _escapeHtml(item.journeyId) + '\',\'' + _escapeHtml(displayName).replace(/'/g, '&#39;') + '\')" ' +
        'aria-label="Assign pods to ' + _escapeHtml(displayName) + '" ' +
        'style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:12px;padding:0 4px">\u2699 Pods</button>'
    : '';
```

Update the two row-renderer closures (around line 514-524) to pass `productId` through:

```javascript
  var _renderPvcItemRowWithCheckbox = function(item) { return _renderPvcItemRow(item, true, false, sessionOriginByJourneyId, productId); };
  // ... (unchanged lines in between)
  var _renderPvcItemRowPlain = function(item) { return _renderPvcItemRow(item, false, false, sessionOriginByJourneyId, productId); };
```

(`productId` is already an existing parameter of the enclosing function that defines these closures — confirm it is in scope; `_renderConsolidatedFeaturesSection`'s own signature already includes it.)

Now add the modal markup + client script. In `_renderConsolidatedFeaturesSection`, append this to the returned HTML string (immediately before its final closing, so it renders once per product page, not once per row):

```javascript
  var ep4s1ModalHtml =
    '<div id="ep4s1-pods-modal" role="dialog" aria-modal="true" aria-labelledby="ep4s1-modal-title" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:50;align-items:center;justify-content:center">' +
      '<div style="background:var(--surface);border-radius:8px;padding:20px;max-width:440px;width:90%;max-height:80vh;overflow-y:auto">' +
        '<h2 id="ep4s1-modal-title" style="margin:0 0 6px;font-size:16px">Assign pods to this feature</h2>' +
        '<div id="ep4s1-modal-error" role="alert" aria-live="polite" style="color:#b00020;display:none;margin-bottom:8px;font-size:13px"></div>' +
        '<div id="ep4s1-modal-pods" style="margin:12px 0"></div>' +
        '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px">' +
          '<button type="button" onclick="ep4s1CloseModal()" style="padding:6px 10px;background:none;border:1px solid var(--line);border-radius:4px;font-size:13px;cursor:pointer;color:var(--ink)">Cancel</button>' +
          '<button type="button" id="ep4s1-save-btn" onclick="ep4s1Save()" style="padding:6px 10px;background:var(--accent);color:#fff;border:none;border-radius:4px;font-size:13px;cursor:pointer">Save</button>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<script>' +
    '(function(){' +
    '  var _productId=null,_featureId=null,_csrfToken=null;' +
    '  window.ep4s1OpenPodsModal=async function(productId,featureId,displayName){' +
    '    _productId=productId;_featureId=featureId;' +
    '    document.getElementById("ep4s1-modal-title").textContent="Assign pods to "+displayName;' +
    '    document.getElementById("ep4s1-modal-error").style.display="none";' +
    '    document.getElementById("ep4s1-modal-pods").innerHTML="Loading\u2026";' +
    '    document.getElementById("ep4s1-pods-modal").style.display="flex";' +
    '    var resp=await fetch("/products/"+productId+"/features/"+featureId+"/pods");' +
    '    var data=await resp.json().catch(function(){return{};});' +
    '    if(!resp.ok){document.getElementById("ep4s1-modal-pods").innerHTML="";' +
    '      document.getElementById("ep4s1-modal-error").textContent=data.error||"Failed to load pods";' +
    '      document.getElementById("ep4s1-modal-error").style.display="block";return;}' +
    '    _csrfToken=data.csrfToken;' +
    '    var assignedIds=(data.assignedPods||[]).map(function(p){return p.podId;});' +
    '    var collabByUser={};(data.collaborators||[]).forEach(function(c){collabByUser[c.userId]=c;});' +
    '    var html=(data.orgPods||[]).map(function(pod){' +
    '      var checked=assignedIds.indexOf(pod.pod_id)!==-1?" checked":"";' +
    '      return "<label style=\\"display:flex;align-items:center;gap:8px;padding:6px 0\\">"+' +
    '        "<input type=\\"checkbox\\" class=\\"ep4s1-pod-checkbox\\" value=\\""+pod.pod_id+"\\""+checked+">"+' +
    '        "<span>"+pod.name+"</span></label>";' +
    '    }).join("");' +
    '    if((data.collaborators||[]).length>0){' +
    '      html+="<hr style=\\"margin:12px 0\\"><div style=\\"font-size:12px;color:var(--muted);margin-bottom:6px\\">Current collaborators</div>";' +
    '      html+=data.collaborators.map(function(c){' +
    '        return "<div style=\\"display:flex;justify-content:space-between;align-items:center;padding:4px 0;font-size:13px\\">"+' +
    '          "<span>"+c.userId+"</span>"+' +
    '          "<button type=\\"button\\" onclick=\\"ep4s1RemoveMember(\'"+c.userId+"\')\\" aria-label=\\"Remove "+c.userId+" from this feature\\" "+' +
    '          "style=\\"background:none;border:none;color:#b00020;cursor:pointer;font-size:12px\\">\u2715 Remove</button></div>";' +
    '      }).join("");' +
    '    }' +
    '    document.getElementById("ep4s1-modal-pods").innerHTML=html;' +
    '  };' +
    '  window.ep4s1CloseModal=function(){document.getElementById("ep4s1-pods-modal").style.display="none";};' +
    '  window.ep4s1Save=async function(){' +
    '    var checked=Array.prototype.slice.call(document.querySelectorAll(".ep4s1-pod-checkbox:checked")).map(function(el){return el.value;});' +
    '    if(checked.length===0){' +
    '      document.getElementById("ep4s1-modal-error").textContent="Select at least one pod";' +
    '      document.getElementById("ep4s1-modal-error").style.display="block";return;}' +
    '    var btn=document.getElementById("ep4s1-save-btn");btn.disabled=true;btn.textContent="Saving\u2026";' +
    '    var resp=await fetch("/products/"+_productId+"/features/"+_featureId+"/pods",{' +
    '      method:"POST",headers:{"Content-Type":"application/json"},' +
    '      body:JSON.stringify({podIds:checked,_csrf:_csrfToken})});' +
    '    var data=await resp.json().catch(function(){return{};});' +
    '    btn.disabled=false;btn.textContent="Save";' +
    '    if(!resp.ok){document.getElementById("ep4s1-modal-error").textContent=data.error||"Failed to save";' +
    '      document.getElementById("ep4s1-modal-error").style.display="block";return;}' +
    '    ep4s1CloseModal();location.reload();' +
    '  };' +
    '  window.ep4s1RemoveMember=async function(userId){' +
    '    var resp=await fetch("/products/"+_productId+"/features/"+_featureId+"/pods/members/"+encodeURIComponent(userId),{' +
    '      method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({_csrf:_csrfToken})});' +
    '    var data=await resp.json().catch(function(){return{};});' +
    '    if(!resp.ok){document.getElementById("ep4s1-modal-error").textContent=data.error||"Failed to remove";' +
    '      document.getElementById("ep4s1-modal-error").style.display="block";return;}' +
    '    ep4s1OpenPodsModal(_productId,_featureId,document.getElementById("ep4s1-modal-title").textContent.replace(/^Assign pods to /,""));' +
    '  };' +
    '})();' +
    '</script>';
```

then append `ep4s1ModalHtml` to `_renderConsolidatedFeaturesSection`'s own returned string (find its `return` statement and concatenate `+ ep4s1ModalHtml` onto it).

- [ ] **Step 3: Thread the CSRF token into the GET pods view-model response**

`handleGetFeaturePods` (Task 2) doesn't currently return a `csrfToken` field, but the client script above reads `data.csrfToken` for the Save/Remove requests. Update `handleGetFeaturePods` in `src/web-ui/routes/products.js`:

```javascript
  var orgPods = await listPods(_pool, tenantId);
  var assignedPods = await getFeaturePodAssignments(_pool, tenantId, featureId);
  var collaborators = await getFeatureCollaborators(_pool, featureId);
  var csrfToken = await _csrf.generateCsrfToken(req);

  return _json(200, { orgPods: orgPods, assignedPods: assignedPods, collaborators: collaborators, csrfToken: csrfToken });
```

- [ ] **Step 4: Run full suite — no regressions**

```bash
npm test
```

Expected output: `695 file(s) run, 1 failed` (only the pre-existing failure)

- [ ] **Step 5: Commit**

```bash
git add src/web-ui/routes/products.js
git commit -m "feat: add the Assign pods modal to the product page's per-feature rows"
```

---

## Task 5: Integration test — AC1/AC2/AC3 end-to-end via real handlers ✅ COMPLETE (commits `50159ce3`, `dca935f2`)

**Real gap found, not a spec deviation:** while writing this test the implementer correctly discovered two genuine, pre-existing `fake-test-db.js` adapter gaps (the 3-column `journeys` SELECT the ep4-s1 handlers issue, and a missing `pod_members` SELECT branch — INSERT-only) rather than fabricating a passing test around them, first working around both with a well-documented test-local shim. Closed properly (not left as test-only debt) by adding 2 new narrow, explicit branches to `fake-test-db.js` itself — matching that file's own stated extension convention and Task 1's own precedent — and simplifying the test back to using the real adapter directly with no shim.

**Review notes:** Spec-compliance ✅ (real-handler exercise confirmed via CSRF-guard trace, branch-prefix collision-freedom verified character-by-character, full suite 697/1 — one intermittent, independently-reconfirmed environmental flake). Code-quality ✅ Approved with no findings (query-comment accuracy grep-verified, test isolation confirmed via `createFakeTestDb()`'s per-call closure scoping, shim-removal diff confirmed fully clean, sibling regression tests re-run for extra confidence).

**Files:**
- Create: `tests/check-ep4-s1-multi-pod-assign.js`

- [ ] **Step 1: Write the test**

```javascript
// tests/check-ep4-s1-multi-pod-assign.js
'use strict';
const assert = require('assert');
const { createFakeTestDb } = require('../src/web-ui/adapters/fake-test-db');
const podStore = require('../src/web-ui/modules/pod-store');
const podAssignmentStore = require('../src/web-ui/modules/pod-assignment-store');
const collabStore = require('../src/web-ui/modules/feature-collaborator-store');
const products = require('../src/web-ui/routes/products');

let passed = 0, failed = 0;
function check(name, fn) {
  return fn().then(() => { console.log('  \u2713 ' + name); passed++; })
    .catch(err => { console.log('  \u2717 ' + name + ' -- ' + err.message); failed++; });
}

function makeRes() {
  var res = { statusCode: null, body: null };
  res.writeHead = function(code) { res.statusCode = code; };
  res.end = function(str) { res.body = JSON.parse(str); };
  return res;
}

async function main() {
  const db = createFakeTestDb();
  await podStore.migratePodsSchema(db);
  await podAssignmentStore.migratePodAssignmentsSchema(db);
  await collabStore.migrateFeatureCollaboratorsSchema(db);
  await collabStore.migrateFeatureCollaboratorRemovalsSchema(db);

  await db.query("INSERT INTO products (product_id, tenant_id, name) VALUES ($1,$2,$3)", ['prod-1', 't1', 'Product One']).catch(() => {});
  db._upsertJourney({ journey_id: 'feat-a2', tenant_id: 't1', product_id: 'prod-1', feature_slug: 'feat-a2', stage: 'definition', active_session_id: null });

  const core = await podStore.createPod(db, { tenantId: 't1', name: 'Core Platform Pod', createdBy: 'hamish', members: [
    { userId: 'hamish', roleId: 'conductor' }, { userId: 'susan', roleId: 'engineer' }, { userId: 'darren', roleId: 'engineer' }
  ] });
  const data = await podStore.createPod(db, { tenantId: 't1', name: 'Data Analytics Pod', createdBy: 'hamish', members: [
    { userId: 'alice', roleId: 'architect' }, { userId: 'bob', roleId: 'engineer' }
  ] });

  const session = { tenantId: 't1', login: 'hamish', userId: 'hamish', accessToken: 'tok' };

  await check('AC1: GET pods view-model lists both pods, none assigned yet', async () => {
    var req = { params: { productId: 'prod-1', featureId: 'feat-a2' }, session: session };
    var res = makeRes();
    await products.handleGetFeaturePods(req, res, null, db);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.orgPods.length, 2);
    assert.strictEqual(res.body.assignedPods.length, 0);
  });

  var assignedCollaborators;
  await check('AC1 + AC3: POST assigns both pods, feature_collaborators is the full union', async () => {
    var req = { params: { productId: 'prod-1', featureId: 'feat-a2' }, session: session, body: { podIds: [core.podId, data.podId] } };
    var res = makeRes();
    await products.handlePostAssignFeaturePods(req, res, null, db);
    assert.strictEqual(res.statusCode, 200);
    assignedCollaborators = res.body.collaborators;
    assert.strictEqual(assignedCollaborators.length, 5);
    assert.ok(['hamish', 'susan', 'darren', 'alice', 'bob'].every((u) => assignedCollaborators.some((c) => c.userId === u)));
  });

  await check('AC2: DELETE removes Bob for this feature only, not from pod_members', async () => {
    var req = { params: { productId: 'prod-1', featureId: 'feat-a2', userId: 'bob' }, session: session };
    var res = makeRes();
    await products.handleDeleteFeaturePodMember(req, res, null, db);
    assert.strictEqual(res.statusCode, 200);
    assert.ok(!res.body.collaborators.some((c) => c.userId === 'bob'));
    var podMembersRows = (await db.query('SELECT user_id FROM pod_members WHERE pod_id = $1', [data.podId])).rows;
    assert.ok(podMembersRows.some((r) => r.user_id === 'bob'), 'Bob must remain a real Data Analytics Pod member globally');
  });

  await check('AC3: feature_collaborators is exactly the union minus Bob (Hamish, Susan, Darren, Alice)', async () => {
    var req = { params: { productId: 'prod-1', featureId: 'feat-a2' }, session: session };
    var res = makeRes();
    await products.handleGetFeaturePods(req, res, null, db);
    var userIds = res.body.collaborators.map((c) => c.userId).sort();
    assert.deepStrictEqual(userIds, ['alice', 'darren', 'hamish', 'susan']);
  });

  await check('Removal-resurrection guard: re-assigning the same pods does not bring Bob back', async () => {
    var req = { params: { productId: 'prod-1', featureId: 'feat-a2' }, session: session, body: { podIds: [core.podId, data.podId] } };
    var res = makeRes();
    await products.handlePostAssignFeaturePods(req, res, null, db);
    assert.strictEqual(res.statusCode, 200);
    assert.ok(!res.body.collaborators.some((c) => c.userId === 'bob'), 'Bob must stay removed across a re-save of the same pods');
    assert.strictEqual(res.body.collaborators.length, 4);
  });

  await check('Tenant isolation: a pod from a different tenant is rejected', async () => {
    var otherTenantPod = await podStore.createPod(db, { tenantId: 't2', name: 'Other Tenant Pod', createdBy: 'x', members: [] });
    var req = { params: { productId: 'prod-1', featureId: 'feat-a2' }, session: session, body: { podIds: [otherTenantPod.podId] } };
    var res = makeRes();
    await products.handlePostAssignFeaturePods(req, res, null, db);
    assert.strictEqual(res.statusCode, 400);
    assert.ok(/no pod found/i.test(res.body.error));
  });

  await check('Tenant isolation: a feature belonging to another tenant 404s', async () => {
    db._upsertJourney({ journey_id: 'feat-b1', tenant_id: 't2', product_id: 'prod-2', feature_slug: 'feat-b1', stage: 'definition', active_session_id: null });
    var req = { params: { productId: 'prod-1', featureId: 'feat-b1' }, session: session };
    var res = makeRes();
    await products.handleGetFeaturePods(req, res, null, db);
    assert.strictEqual(res.statusCode, 404);
  });

  console.log('\n[check-ep4-s1-multi-pod-assign] ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exit(1);
}

main();
```

- [ ] **Step 2: Run test — must pass**

```bash
node tests/check-ep4-s1-multi-pod-assign.js
```

Expected output: `[check-ep4-s1-multi-pod-assign] 7 passed, 0 failed`

(If `INSERT INTO products` isn't supported by `fake-test-db.js`, the `.catch(() => {})` on that seed line makes it a no-op — `journeys` rows are seeded directly via `_upsertJourney` regardless, which is all `handleGetFeaturePods`/`handlePostAssignFeaturePods`/`handleDeleteFeaturePodMember` actually read.)

- [ ] **Step 3: Run full suite — no regressions**

```bash
npm test
```

Expected output: `696 file(s) run, 1 failed` (the new file now counted; only the pre-existing failure remains)

- [ ] **Step 4: Commit**

```bash
git add tests/check-ep4-s1-multi-pod-assign.js
git commit -m "test: add end-to-end coverage for multi-pod assignment, per-feature removal, and tenant isolation"
```

---

## Task 6: E2E test — real browser render of the Assign pods modal ✅ COMPLETE (commits `3bed206f`, fix `187dcaef`)

**Real environment investigation (before dispatch):** confirmed the Playwright webServer runs with `NODE_ENV=test` and no `DATABASE_URL`, so `server.js` wires `_pshPool` to a real `createFakeTestDb()` instance (`bri-s3.2`) — meaning Task 5's own fake-test-db.js fix (`dca935f2`) was not just test-convenience but required for the real E2E server process itself to correctly serve these routes. Briefed the implementer with a proven, already-working real-seed recipe (`ep1-s3-feature-pod-inheritance.spec.js`'s product→repo→pod→default→feature flow) rather than leaving it to rediscover from the plan's own rough draft.

**Real discovery made while implementing:** the feature row's rendered displayName (and so its aria-label) falls back to `item.slug` (a date-prefixed slug), not the raw submitted `displayName`, for a freshly-created feature with no discovery artefact yet — confirmed against `_renderPvcItemRow`'s own `item.name || item.slug` fallback. Handled with a contains-selector rather than a brittle exact/date-dependent one. Also discovered and correctly handled that the product page renders the same feature row into 3 simultaneous tab panels (By Module/By Phase/All), requiring the pods-button locator to be scoped to one panel to avoid Playwright's strict-mode multi-match error.

**Review notes:** Spec-compliance ✅ (every factual claim in the test's own comments — triple-tab-render, displayName fallback, `me-uuid`/`hamish-uuid`/`susan-uuid` fixture values, in-place DOM re-render on removal — independently re-verified against the real source; 3 consecutive runs with zero flakiness; full suite 697/1). Code-quality found 1 Important (fixed in `187dcaef`: no explicit `test.setTimeout` despite ~20+ real round trips, more than the sibling spec whose own reasoning justified doubling the default — bumped to 60000ms matching that precedent) and 2 Minor (both fixed: extracted the two identical pod-creation UI flows into a shared `createPod()` helper; added a one-line comment on the label-collision-avoidance invariant).

**Files:**
- Create: `tests/e2e/ep4-s1-multi-pod-assign.spec.js`

This task exists because AC1 is a rendered-UI acceptance criterion (a modal, a multi-select control) that Task 5's handler-level integration test cannot verify — it only proves the JSON contract, not that the button/modal/checkboxes actually render and behave correctly in a browser. Per CLAUDE.md's CSS-layout-dependent-AC rule, this is the automated-test path (not a RISK-ACCEPT), matching how `ep3-s1`'s own regression form got a dedicated Playwright spec for the same reason.

- [ ] **Step 1: Write the test**

Look at an existing E2E spec first (e.g. `tests/e2e/ep3-s1-regression.spec.js`) to confirm the current login/fixture-seeding helper names before writing this file — they may have changed since this plan was written. Then write:

```javascript
// tests/e2e/ep4-s1-multi-pod-assign.spec.js
const { test, expect } = require('@playwright/test');

test('AC1: product owner can open the Assign pods modal, select multiple pods, and remove a member', async ({ page }) => {
  // Adapt the login/seed calls below to this repo's current E2E fixture
  // helpers (see tests/e2e/ep3-s1-regression.spec.js for the current
  // pattern) -- seed a tenant with a product, a feature (journey), and two
  // pods (Core Platform Pod: Hamish/Susan/Darren; Data Analytics Pod:
  // Alice/Bob), then log in as a non-viewer.

  await page.goto('/products/prod-1');
  await page.click('button[aria-label="Assign pods to Feature A2"]');
  await expect(page.locator('#ep4s1-pods-modal')).toBeVisible();
  await expect(page.locator('#ep4s1-modal-title')).toHaveText('Assign pods to Feature A2');

  const checkboxes = page.locator('.ep4s1-pod-checkbox');
  await expect(checkboxes).toHaveCount(2);

  await checkboxes.nth(0).check();
  await checkboxes.nth(1).check();
  await expect(checkboxes.nth(0)).toBeChecked();
  await expect(checkboxes.nth(1)).toBeChecked();

  await page.click('#ep4s1-save-btn');
  await page.waitForLoadState('networkidle');

  await page.click('button[aria-label="Assign pods to Feature A2"]');
  await expect(page.locator('#ep4s1-modal-pods')).toContainText('bob');

  await page.click('button[aria-label="Remove bob from this feature"]');
  await expect(page.locator('#ep4s1-modal-pods')).not.toContainText('bob');
});
```

- [ ] **Step 2: Run test — must fail before Tasks 1-4 exist (skip this step if running after those tasks)**

```bash
npx playwright test tests/e2e/ep4-s1-multi-pod-assign.spec.js
```

Expected output (pre-implementation): `Error: locator not found` or equivalent

- [ ] **Step 3: Run test — must pass**

```bash
npx playwright test tests/e2e/ep4-s1-multi-pod-assign.spec.js
```

Expected output: `1 passed`

- [ ] **Step 4: Run full suite — no regressions**

```bash
npm test
```

Expected output: unchanged pre-existing-only failure count

- [ ] **Step 5: Commit**

```bash
git add tests/e2e/ep4-s1-multi-pod-assign.spec.js
git commit -m "test: add E2E coverage for the Assign pods modal's real browser rendering and interaction"
```
