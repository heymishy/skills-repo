# Feature Inherits Product Default Pod on Creation — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available)
> or /tdd per task if executing in this session.

**Goal:** When a feature (a "journey" in this codebase's real data model) is created under a product that has a default pod set, automatically write a `pod_assignments` row (`assignment_type: feature-inherits-product-default`) and pre-populate `feature_collaborators` with every pod member, preserving their roles exactly.

**Architecture corrections (see `decisions.md`, 2026-09-17):** The DoR assumed a `features.js`/`/api/features`/`featureId`-table model that does not exist. The real creation handler is `handlePostProductFeature` in `products.js` (`POST /products/:id/features`); "a feature" is really a **journey** (`journeyId`, `journey-store.js`, dual-written to a real Postgres `journeys` table); the real response is an **HTTP 303 redirect**, not JSON. All verification in this plan is by direct DB-state inspection after the call, not response-body parsing — matching the established test pattern already used by this exact handler's own existing tests (`tests/check-jrf-s2-register-product-feature-journeys.js`).

**No UI surfaces this story's outcome** (DoR: "Listing pod members in the feature creation UI (deferred to Epic 2 UI stories)") — unlike `ep1-s1`/`ep1-s2`, there is nothing to click through in a browser. This plan therefore has no Playwright browser-interaction spec; Task 7 instead uses `page.request` (raw HTTP, no rendering) to prove the real server-dispatch path works end-to-end, closing the same "wiring never actually exercised" risk class that caused `ep1-s1`'s severe bug — without pretending a UI check exists where none does.

**Branch:** `feature/ep1-s3`
**Worktree:** `.worktrees/ep1-s3`
**Test command:** `npm test` (full suite) / `node tests/check-ep1-s3-feature-pod-inheritance.js` (this story only)

---

## File map

```
Create:
  src/web-ui/modules/feature-collaborator-store.js  — feature_collaborators schema bootstrap +
                                                        data access (populateFeatureCollaboratorsFromPod,
                                                        getFeatureCollaborators). Does NOT modify
                                                        pod-store.js/pod_members writes (DoR exclusion) --
                                                        reads pod_members via its own narrow, read-only
                                                        SELECT, mirroring pod-assignment-store.js's own
                                                        established convention.
  tests/check-ep1-s3-feature-pod-inheritance.js     — AC1/AC2/AC3 unit tests + tenant-isolation
                                                        integration test, following the SAME direct
                                                        handler-call pattern jrf-s2's own existing test
                                                        file already uses for this exact handler
                                                        (freshRequire + journeyStore._clearForTesting()
                                                        + real in-memory journey-store, fake pool for
                                                        Postgres-backed reads/writes only)
  tests/e2e/ep1-s3-feature-pod-inheritance.spec.js  — ONE real end-to-end test via page.request
                                                        (no browser rendering needed -- no UI exists
                                                        to render), proving the real HTTP dispatch
                                                        path + fake-test-db.js wiring works together

Modify:
  src/web-ui/routes/products.js                     — handlePostProductFeature: inject pod-inheritance
                                                        logic immediately after the existing
                                                        _journeyStore.setJourneyFields(...) call
  src/web-ui/server.js                               — require feature-collaborator-store.js, chain
                                                        migrateFeatureCollaboratorsSchema. NO new route
                                                        needed -- this story extends an existing,
                                                        already-wired handler, not adding a new one.
  src/web-ui/adapters/fake-test-db.js                — narrow feature_collaborators query branches

Files this plan deliberately does NOT touch (per DoR exclusion):
  src/web-ui/modules/pod-store.js                    — pod/pod_members creation logic (ep1-s1's)
  src/web-ui/modules/pod-assignment-store.js          — product-default-pod assignment logic (ep1-s2's) --
                                                        reused via its exported getProductDefaultPod(),
                                                        not modified
  src/web-ui/routes/features.js                      — unrelated (feature artefacts/ideas), confirmed
                                                        during planning to have nothing to do with this story
```

---

## Task 1: feature-collaborator-store — schema + data access

**Files:**
- Create: `src/web-ui/modules/feature-collaborator-store.js`
- Test: `tests/check-ep1-s3-feature-pod-inheritance.js` (Part 1)

- [ ] **Step 1: Write the failing test**

```javascript
// tests/check-ep1-s3-feature-pod-inheritance.js
#!/usr/bin/env node
/**
 * check-ep1-s3-feature-pod-inheritance.js
 *
 * Unit + integration tests for ep1-s3: Feature Inherits Product Default Pod
 * on Creation. AC1 (pod_assignments recorded), AC2 (feature_collaborators
 * pre-populated), AC3 (roles preserved exactly), plus tenant isolation.
 *
 * Run: node tests/check-ep1-s3-feature-pod-inheritance.js
 */
'use strict';

let passed = 0;
let failed = 0;
function ok(cond, label) {
  if (cond) { console.log('  ✓ ' + label); passed++; }
  else       { console.log('  ✗ ' + label); failed++; }
}
function eq(a, b, label) {
  if (a === b) { console.log('  ✓ ' + label); passed++; }
  else {
    console.log('  ✗ ' + label + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')');
    failed++;
  }
}

/** Minimal fake pg-Pool-shaped object backing pods/pod_members/pod_assignments/feature_collaborators. */
function makeFakePool() {
  const pods = [];
  const podMembers = [];
  const podAssignments = [];
  const featureCollaborators = [];
  return {
    pods, podMembers, podAssignments, featureCollaborators,
    query: async function(sql, params) {
      const s = String(sql).trim().replace(/\s+/g, ' ').toUpperCase();
      if (s.indexOf('CREATE TABLE') === 0 || s.indexOf('CREATE UNIQUE INDEX') === 0) return { rows: [] };
      if (s.indexOf('SELECT USER_ID, ROLE_ID FROM POD_MEMBERS WHERE POD_ID') === 0) {
        const [podId] = params;
        return { rows: podMembers.filter(m => m.pod_id === podId).map(m => ({ user_id: m.user_id, role_id: m.role_id })) };
      }
      if (s.indexOf('INSERT INTO FEATURE_COLLABORATORS') === 0) {
        const [collaboratorId, featureId, userId, roleId, podId] = params;
        featureCollaborators.push({ collaborator_id: collaboratorId, feature_id: featureId, user_id: userId, role_id: roleId, pod_id: podId, is_approver: false });
        return { rows: [] };
      }
      if (s.indexOf('SELECT COLLABORATOR_ID, USER_ID, ROLE_ID, POD_ID FROM FEATURE_COLLABORATORS') === 0) {
        const [featureId] = params;
        return { rows: featureCollaborators.filter(c => c.feature_id === featureId) };
      }
      return { rows: [] };
    }
  };
}

async function run() {
  const { migrateFeatureCollaboratorsSchema, populateFeatureCollaboratorsFromPod, getFeatureCollaborators } = require('../src/web-ui/modules/feature-collaborator-store');

  // --- Part 1: feature-collaborator-store.js ---
  {
    const pool = makeFakePool();
    await migrateFeatureCollaboratorsSchema(pool);
    ok(true, 'migrateFeatureCollaboratorsSchema resolves without throwing (schema bootstrap)');

    pool.podMembers.push(
      { pod_id: 'pod-core-uuid', user_id: 'hamish-uuid', role_id: 'conductor' },
      { pod_id: 'pod-core-uuid', user_id: 'susan-uuid', role_id: 'engineer' },
      { pod_id: 'pod-core-uuid', user_id: 'darren-uuid', role_id: 'engineer' }
    );

    const result = await populateFeatureCollaboratorsFromPod(pool, { featureId: 'journey-abc', podId: 'pod-core-uuid' });
    eq(result.collaboratorCount, 3, 'populateFeatureCollaboratorsFromPod: returns collaboratorCount 3');
    eq(pool.featureCollaborators.length, 3, 'populateFeatureCollaboratorsFromPod: exactly 3 rows written');
    ok(pool.featureCollaborators.every(c => c.feature_id === 'journey-abc'), 'populateFeatureCollaboratorsFromPod: every row references the correct featureId');
    ok(pool.featureCollaborators.every(c => c.pod_id === 'pod-core-uuid'), 'populateFeatureCollaboratorsFromPod: every row references the source podId');

    const collaborators = await getFeatureCollaborators(pool, 'journey-abc');
    eq(collaborators.length, 3, 'getFeatureCollaborators: returns all 3 collaborators');
    const hamish = collaborators.find(c => c.userId === 'hamish-uuid');
    ok(hamish, 'getFeatureCollaborators: finds Hamish');
    eq(hamish.roleId, 'conductor', 'getFeatureCollaborators: Hamish role is conductor');
  }

  console.log(`\n[ep1-s3] ${passed} passed, ${failed} failed\n`);
  process.exit(failed === 0 ? 0 : 1);
}

run();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-ep1-s3-feature-pod-inheritance.js
```

Expected output: `Error: Cannot find module '../src/web-ui/modules/feature-collaborator-store'`

- [ ] **Step 3: Write the implementation**

```javascript
// src/web-ui/modules/feature-collaborator-store.js
'use strict';

// feature-collaborator-store.js — ep1-s3: feature_collaborators schema
// bootstrap + data access. Deliberately does NOT modify pod-store.js or
// issue pod_members WRITE queries (DoR exclusion) -- reads pod_members with
// its own narrow, read-only SELECT, mirroring pod-assignment-store.js's own
// established convention (ep1-s1/ep1-s2).
//
// "featureId" here is journeyId -- this codebase's real data model has no
// separate "features" table; a "feature" (per this story's own ACs) IS a
// journey. See decisions.md (2026-09-17) for the full architecture
// correction this module is built against.
const crypto = require('crypto');

async function migrateFeatureCollaboratorsSchema(pool, logger) {
  const log = logger || { info: function(msg) { console.log(msg); } };

  await pool.query(`
    CREATE TABLE IF NOT EXISTS feature_collaborators (
      collaborator_id UUID        PRIMARY KEY,
      feature_id      VARCHAR     NOT NULL,
      user_id         VARCHAR     NOT NULL,
      role_id         VARCHAR     NOT NULL,
      joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      pod_id          UUID,
      is_approver     BOOLEAN     NOT NULL DEFAULT false,
      UNIQUE(feature_id, user_id)
    )
  `);

  log.info('[ep1-s3] feature_collaborators schema migrated');
}

/**
 * Pre-populate feature_collaborators with every member of a pod. Caller
 * (routes/products.js) is responsible for deciding WHEN to call this
 * (only when a product default pod was found) -- this function assumes
 * podId is valid and just does the read+write.
 * @returns {Promise<{collaboratorCount: number}>}
 */
async function populateFeatureCollaboratorsFromPod(pool, args) {
  const members = (await pool.query('SELECT user_id, role_id FROM pod_members WHERE pod_id = $1', [args.podId])).rows;
  for (const m of members) {
    const collaboratorId = crypto.randomUUID();
    await pool.query(
      'INSERT INTO feature_collaborators (collaborator_id, feature_id, user_id, role_id, pod_id) VALUES ($1, $2, $3, $4, $5)',
      [collaboratorId, args.featureId, m.user_id, m.role_id, args.podId]
    );
  }
  return { collaboratorCount: members.length };
}

/**
 * Read all collaborators for a feature (journey).
 * @returns {Promise<{collaboratorId: string, userId: string, roleId: string, podId: string}[]>}
 */
async function getFeatureCollaborators(pool, featureId) {
  const rows = (await pool.query('SELECT collaborator_id, user_id, role_id, pod_id FROM feature_collaborators WHERE feature_id = $1', [featureId])).rows;
  return rows.map(r => ({ collaboratorId: r.collaborator_id, userId: r.user_id, roleId: r.role_id, podId: r.pod_id }));
}

module.exports = {
  migrateFeatureCollaboratorsSchema,
  populateFeatureCollaboratorsFromPod,
  getFeatureCollaborators
};
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ep1-s3-feature-pod-inheritance.js
```

Expected output: 7 assertions pass.

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing except the already-acknowledged `check-p3.5-validate-trace.js`

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/modules/feature-collaborator-store.js tests/check-ep1-s3-feature-pod-inheritance.js
git commit -m "feat(ep1-s3): feature-collaborator-store schema bootstrap and data access"
```

---

## Task 2: Inject pod-inheritance into handlePostProductFeature — AC1

**Files:**
- Modify: `src/web-ui/routes/products.js`
- Test: `tests/check-ep1-s3-feature-pod-inheritance.js` (append Part 2)

- [ ] **Step 1: Write the failing test**

Append to `tests/check-ep1-s3-feature-pod-inheritance.js`, inside `run()`, after Part 1:

```javascript
  // --- Part 2: handlePostProductFeature — AC1, pod_assignments recorded ---
  {
    const path = require('path');
    function freshRequire(p) { delete require.cache[require.resolve(p)]; return require(p); }
    const JOURNEY_STORE_PATH = path.resolve(__dirname, '../src/web-ui/modules/journey-store.js');
    const PRODUCTS_ROUTE_PATH = path.resolve(__dirname, '../src/web-ui/routes/products.js');
    const SKILLS_ROUTE_PATH = path.resolve(__dirname, '../src/web-ui/routes/skills.js');

    function makeRes() {
      const r = { _status: null, _headers: {}, _body: '' };
      r.writeHead = function(status, headers) { r._status = status; Object.assign(r._headers, headers || {}); };
      r.setHeader = function(k, v) { r._headers[k] = v; };
      r.end = function(b) { r._body += (b || ''); };
      return r;
    }
    function extractSidFromRedirect(res) {
      const loc = res._headers.Location || '';
      const m = /\/skills\/discovery\/sessions\/([^/]+)\/chat/.exec(loc);
      return m ? decodeURIComponent(m[1]) : null;
    }

    const journeyStore = freshRequire(JOURNEY_STORE_PATH);
    journeyStore._clearForTesting();
    const productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);
    const skillsRoute = require(SKILLS_ROUTE_PATH);

    const pool = makeFakePool();
    // Also seed the products/pods/pod_members/pod_assignments query shapes
    // handlePostProductFeature and getProductDefaultPod need -- reuse the
    // SAME narrow branches pod-assignment-store.js's own test file already
    // established, added directly to this file's makeFakePool() query fn
    // in Task 1's own edit above (see that function's full body once this
    // task's Step 3 changes are in place -- this test assumes those branches
    // already exist there; if you are implementing Task 2 before extending
    // makeFakePool() with them, do that extension first as part of this task).
    pool.pods.push({ pod_id: 'pod-core-uuid', tenant_id: 'tenant-1', name: 'Core Platform Pod' });
    pool.podMembers.push(
      { pod_id: 'pod-core-uuid', user_id: 'hamish-uuid', role_id: 'conductor' },
      { pod_id: 'pod-core-uuid', user_id: 'susan-uuid', role_id: 'engineer' },
      { pod_id: 'pod-core-uuid', user_id: 'darren-uuid', role_id: 'engineer' }
    );
    pool.podAssignments.push({ tenant_id: 'tenant-1', pod_id: 'pod-core-uuid', product_id: 'prod-1', feature_id: null, assignment_type: 'inherit-to-all-features' });
    // das-s2 repo-connected gate + products lookup, matching jrf-s2's own established fixture pattern.
    const originalQuery = pool.query.bind(pool);
    pool.query = async function(sql, params) {
      const s = String(sql).trim().replace(/\s+/g, ' ').toUpperCase();
      if (s.indexOf('SELECT REPO_OWNER, REPO_NAME') !== -1) return { rows: [{ repo_owner: 'acme', repo_name: 'widgets' }] };
      return originalQuery(sql, params);
    };

    const req = { params: { id: 'prod-1' }, session: { tenantId: 'tenant-1', login: 'octocat', csrfToken: 'test-csrf-token' }, body: { _csrf: 'test-csrf-token' } };
    const res = makeRes();
    await productsRoute.handlePostProductFeature(req, res, null, pool, { capture: function() {} });

    const sid = extractSidFromRedirect(res);
    ok(sid, 'AC1 setup: feature creation redirects to a real discovery chat session');
    const session = skillsRoute._getHtmlSession(sid);
    const journeyId = session && session.journeyId;
    ok(journeyId, 'AC1 setup: session is linked to a real journeyId');

    eq(pool.podAssignments.filter(a => a.feature_id === journeyId).length, 1, 'AC1: exactly 1 pod_assignments row written with feature_id = journeyId');
    const featureAssignment = pool.podAssignments.find(a => a.feature_id === journeyId);
    eq(featureAssignment.pod_id, 'pod-core-uuid', 'AC1: the assignment references the product\'s default pod');
    eq(featureAssignment.assignment_type, 'feature-inherits-product-default', 'AC1: assignmentType is feature-inherits-product-default');
  }
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-ep1-s3-feature-pod-inheritance.js
```

Expected: the AC1 assertions fail (`expected 1, got 0` for the pod_assignments count) since `handlePostProductFeature` doesn't do any pod-inheritance yet. You will ALSO need to extend `makeFakePool()` (from Task 1) with the `pods`/`pod_assignments` query branches `pod-assignment-store.js` needs (`SELECT pod_id, tenant_id, name FROM pods WHERE...`, `SELECT COUNT(*) AS count FROM pod_members WHERE...`, `SELECT pa.pod_id, p.name FROM pod_assignments...`) before this test can even exercise the right code path — copy these branches from `pod-assignment-store.js`'s own already-proven test mock (`tests/check-ep1-s2-product-default-pod.js`'s `makeFakePool()`) into THIS file's `makeFakePool()`, adapting variable names as needed. Do this as part of Step 1/Step 2 of this task, before moving to Step 3.

- [ ] **Step 3: Write the implementation**

Add the import near the top of `src/web-ui/routes/products.js`, alongside the existing `pod-assignment-store` import from ep1-s2:

```javascript
// Change this line:
const { setProductDefaultPod, getProductDefaultPod } = require('../modules/pod-assignment-store'); // ep1-s2
// to:
const { setProductDefaultPod, getProductDefaultPod, setFeatureDefaultPod } = require('../modules/pod-assignment-store'); // ep1-s2, ep1-s3
const { populateFeatureCollaboratorsFromPod } = require('../modules/feature-collaborator-store'); // ep1-s3
```

Wait — `setFeatureDefaultPod` does not exist yet in `pod-assignment-store.js`. Add it there instead (this module already owns `pod_assignments` writes, so a feature-level assignment write belongs alongside `setProductDefaultPod`, not duplicated in `products.js`). In `src/web-ui/modules/pod-assignment-store.js`, add a new exported function:

```javascript
/**
 * ep1-s3: record that a specific FEATURE (journey) inherited a pod from its
 * product's default. Unlike setProductDefaultPod (feature_id IS NULL, one
 * row per product), this always INSERTs a new row (feature_id IS NOT NULL,
 * one row per feature) -- no upsert/conflict handling needed, since a given
 * featureId can only be created once.
 * @returns {Promise<{assignmentId: string}>}
 */
async function setFeatureDefaultPod(pool, args) {
  const assignmentId = crypto.randomUUID();
  await pool.query(
    'INSERT INTO pod_assignments (assignment_id, tenant_id, pod_id, product_id, feature_id, assignment_type, assigned_by) VALUES ($1, $2, $3, $4, $5, $6, $7)',
    [assignmentId, args.tenantId, args.podId, args.productId, args.featureId, 'feature-inherits-product-default', args.assignedBy]
  );
  return { assignmentId };
}
```

Add `setFeatureDefaultPod` to that module's `module.exports` block.

Then, in `src/web-ui/routes/products.js`'s `handlePostProductFeature`, find the existing block:

```javascript
  _journeyStore.setJourneyFields(journeyId, {
    featureSlug: featureSlug,
    displayName: displayName,
    ownerId:     (req.session && req.session.login) || null,
    tenantId:    tenantId,
    productId:   productId
  });
```

Immediately AFTER it (before the `_ph.capture(...)` line), insert:

```javascript
  // ep1-s3: if this product has a default pod, the new feature (journey)
  // inherits it automatically -- best-effort, never blocks feature creation.
  // See decisions.md (2026-09-17) for why this lives here rather than in a
  // separate features.js/handler (no such file/route exists for feature
  // creation in this codebase).
  if (tenantId && productId) {
    try {
      const defaultPod = await getProductDefaultPod(pool, tenantId, productId);
      if (defaultPod) {
        await setFeatureDefaultPod(pool, { tenantId: tenantId, podId: defaultPod.podId, productId: productId, featureId: journeyId, assignedBy: (req.session && req.session.login) || null });
        await populateFeatureCollaboratorsFromPod(pool, { featureId: journeyId, podId: defaultPod.podId });
      }
    } catch (err) {
      console.error('[handlePostProductFeature] ep1-s3 pod-inheritance failed (non-fatal):', err.message);
    }
  }
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ep1-s3-feature-pod-inheritance.js
```

Expected: Part 1 (7) + Part 2 (5) = 12 assertions pass.

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing except the already-acknowledged `check-p3.5-validate-trace.js`. Pay particular attention to any OTHER existing test file that calls `handlePostProductFeature` (there are 11 — see `decisions.md`'s planning notes) — since your change adds a new `getProductDefaultPod` call inside this shared handler, confirm none of them break. They should all be safe: their fixture pools have no `pod_assignments` row for their test products, so `getProductDefaultPod` returns `null` and the new code path never fires.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/modules/pod-assignment-store.js src/web-ui/routes/products.js tests/check-ep1-s3-feature-pod-inheritance.js
git commit -m "feat(ep1-s3): feature creation inherits product default pod (AC1)"
```

---

## Task 3: AC2 — feature_collaborators pre-populated with pod members

**Files:**
- Modify: `tests/check-ep1-s3-feature-pod-inheritance.js` (append Part 3)

- [ ] **Step 1: Write the failing test**

Append to `tests/check-ep1-s3-feature-pod-inheritance.js`, inside `run()`, after Part 2:

```javascript
  // --- Part 3: AC2 — feature_collaborators pre-populated with every pod member ---
  {
    const path = require('path');
    function freshRequire(p) { delete require.cache[require.resolve(p)]; return require(p); }
    const JOURNEY_STORE_PATH = path.resolve(__dirname, '../src/web-ui/modules/journey-store.js');
    const PRODUCTS_ROUTE_PATH = path.resolve(__dirname, '../src/web-ui/routes/products.js');
    const SKILLS_ROUTE_PATH = path.resolve(__dirname, '../src/web-ui/routes/skills.js');

    function makeRes() {
      const r = { _status: null, _headers: {}, _body: '' };
      r.writeHead = function(status, headers) { r._status = status; Object.assign(r._headers, headers || {}); };
      r.setHeader = function(k, v) { r._headers[k] = v; };
      r.end = function(b) { r._body += (b || ''); };
      return r;
    }
    function extractSidFromRedirect(res) {
      const loc = res._headers.Location || '';
      const m = /\/skills\/discovery\/sessions\/([^/]+)\/chat/.exec(loc);
      return m ? decodeURIComponent(m[1]) : null;
    }

    const journeyStore = freshRequire(JOURNEY_STORE_PATH);
    journeyStore._clearForTesting();
    const productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);
    const skillsRoute = require(SKILLS_ROUTE_PATH);

    const pool = makeFakePool();
    pool.pods.push({ pod_id: 'pod-core-uuid', tenant_id: 'tenant-1', name: 'Core Platform Pod' });
    pool.podMembers.push(
      { pod_id: 'pod-core-uuid', user_id: 'hamish-uuid', role_id: 'conductor' },
      { pod_id: 'pod-core-uuid', user_id: 'susan-uuid', role_id: 'engineer' },
      { pod_id: 'pod-core-uuid', user_id: 'darren-uuid', role_id: 'engineer' }
    );
    pool.podAssignments.push({ tenant_id: 'tenant-1', pod_id: 'pod-core-uuid', product_id: 'prod-1', feature_id: null, assignment_type: 'inherit-to-all-features' });
    const originalQuery = pool.query.bind(pool);
    pool.query = async function(sql, params) {
      const s = String(sql).trim().replace(/\s+/g, ' ').toUpperCase();
      if (s.indexOf('SELECT REPO_OWNER, REPO_NAME') !== -1) return { rows: [{ repo_owner: 'acme', repo_name: 'widgets' }] };
      return originalQuery(sql, params);
    };

    const req = { params: { id: 'prod-1' }, session: { tenantId: 'tenant-1', login: 'octocat', csrfToken: 'test-csrf-token' }, body: { _csrf: 'test-csrf-token' } };
    const res = makeRes();
    await productsRoute.handlePostProductFeature(req, res, null, pool, { capture: function() {} });

    const sid = extractSidFromRedirect(res);
    const session = skillsRoute._getHtmlSession(sid);
    const journeyId = session && session.journeyId;

    const collaboratorRows = pool.featureCollaborators.filter(c => c.feature_id === journeyId);
    eq(collaboratorRows.length, 3, 'AC2: exactly 3 feature_collaborators rows pre-populated');
    const userIds = collaboratorRows.map(c => c.user_id).sort();
    eq(JSON.stringify(userIds), JSON.stringify(['darren-uuid', 'hamish-uuid', 'susan-uuid']), 'AC2: all 3 pod members present (Hamish, Susan, Darren)');
    ok(collaboratorRows.every(c => c.pod_id === 'pod-core-uuid'), 'AC2: every collaborator row references the source pod');
  }
```

- [ ] **Step 2: Run test — must pass immediately**

```bash
node tests/check-ep1-s3-feature-pod-inheritance.js
```

Expected: passes immediately (15 assertions total) — `populateFeatureCollaboratorsFromPod` was already fully implemented in Task 1 and already wired in Task 2; this task's own new assertions just prove AC2's specific claim (all 3 members present) wasn't accidentally only partially true.

- [ ] **Step 3: No new production code**

Nothing to implement — Tasks 1/2 already built everything this test exercises.

- [ ] **Step 4/5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing except the already-acknowledged `check-p3.5-validate-trace.js`

- [ ] **Step 6: Commit**

```bash
git add tests/check-ep1-s3-feature-pod-inheritance.js
git commit -m "test(ep1-s3): prove AC2 feature_collaborators pre-population"
```

---

## Task 4: AC3 — roles preserved exactly

**Files:**
- Modify: `tests/check-ep1-s3-feature-pod-inheritance.js` (append Part 4)

- [ ] **Step 1: Write the failing test**

Append to `tests/check-ep1-s3-feature-pod-inheritance.js`, inside `run()`, after Part 3. Reuse Part 3's exact setup (a fresh copy — do not share state across parts), but this time assert specifically on role accuracy per person:

```javascript
  // --- Part 4: AC3 — collaborator roles match pod_members exactly ---
  {
    const path = require('path');
    function freshRequire(p) { delete require.cache[require.resolve(p)]; return require(p); }
    const JOURNEY_STORE_PATH = path.resolve(__dirname, '../src/web-ui/modules/journey-store.js');
    const PRODUCTS_ROUTE_PATH = path.resolve(__dirname, '../src/web-ui/routes/products.js');
    const SKILLS_ROUTE_PATH = path.resolve(__dirname, '../src/web-ui/routes/skills.js');

    function makeRes() {
      const r = { _status: null, _headers: {}, _body: '' };
      r.writeHead = function(status, headers) { r._status = status; Object.assign(r._headers, headers || {}); };
      r.setHeader = function(k, v) { r._headers[k] = v; };
      r.end = function(b) { r._body += (b || ''); };
      return r;
    }
    function extractSidFromRedirect(res) {
      const loc = res._headers.Location || '';
      const m = /\/skills\/discovery\/sessions\/([^/]+)\/chat/.exec(loc);
      return m ? decodeURIComponent(m[1]) : null;
    }

    const journeyStore = freshRequire(JOURNEY_STORE_PATH);
    journeyStore._clearForTesting();
    const productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);
    const skillsRoute = require(SKILLS_ROUTE_PATH);

    const pool = makeFakePool();
    pool.pods.push({ pod_id: 'pod-core-uuid', tenant_id: 'tenant-1', name: 'Core Platform Pod' });
    // NOTE: roleId order deliberately does NOT match insertion order used in
    // Parts 2/3, to prove role lookup is by userId, not by array position.
    pool.podMembers.push(
      { pod_id: 'pod-core-uuid', user_id: 'susan-uuid', role_id: 'engineer' },
      { pod_id: 'pod-core-uuid', user_id: 'hamish-uuid', role_id: 'conductor' },
      { pod_id: 'pod-core-uuid', user_id: 'darren-uuid', role_id: 'engineer' }
    );
    pool.podAssignments.push({ tenant_id: 'tenant-1', pod_id: 'pod-core-uuid', product_id: 'prod-1', feature_id: null, assignment_type: 'inherit-to-all-features' });
    const originalQuery = pool.query.bind(pool);
    pool.query = async function(sql, params) {
      const s = String(sql).trim().replace(/\s+/g, ' ').toUpperCase();
      if (s.indexOf('SELECT REPO_OWNER, REPO_NAME') !== -1) return { rows: [{ repo_owner: 'acme', repo_name: 'widgets' }] };
      return originalQuery(sql, params);
    };

    const req = { params: { id: 'prod-1' }, session: { tenantId: 'tenant-1', login: 'octocat', csrfToken: 'test-csrf-token' }, body: { _csrf: 'test-csrf-token' } };
    const res = makeRes();
    await productsRoute.handlePostProductFeature(req, res, null, pool, { capture: function() {} });

    const sid = extractSidFromRedirect(res);
    const session = skillsRoute._getHtmlSession(sid);
    const journeyId = session && session.journeyId;

    const collaboratorRows = pool.featureCollaborators.filter(c => c.feature_id === journeyId);
    const byUser = {};
    collaboratorRows.forEach(c => { byUser[c.user_id] = c.role_id; });
    eq(byUser['hamish-uuid'], 'conductor', 'AC3: Hamish role is conductor (not dropped or defaulted)');
    eq(byUser['susan-uuid'], 'engineer', 'AC3: Susan role is engineer');
    eq(byUser['darren-uuid'], 'engineer', 'AC3: Darren role is engineer');
  }
```

- [ ] **Step 2: Run test — must pass immediately**

```bash
node tests/check-ep1-s3-feature-pod-inheritance.js
```

Expected: passes immediately (18 assertions total).

- [ ] **Step 3: No new production code**

Nothing to implement.

- [ ] **Step 4/5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing except the already-acknowledged `check-p3.5-validate-trace.js`

- [ ] **Step 6: Commit**

```bash
git add tests/check-ep1-s3-feature-pod-inheritance.js
git commit -m "test(ep1-s3): prove AC3 role accuracy (no role dropped or defaulted)"
```

---

## Task 5: Tenant isolation integration test

**Files:**
- Modify: `tests/check-ep1-s3-feature-pod-inheritance.js` (append Part 5)

- [ ] **Step 1: Write the failing test**

Append to `tests/check-ep1-s3-feature-pod-inheritance.js`, inside `run()`, after Part 4:

```javascript
  // --- Part 5: tenant isolation — a product's default pod never leaks across tenants ---
  {
    const path = require('path');
    function freshRequire(p) { delete require.cache[require.resolve(p)]; return require(p); }
    const JOURNEY_STORE_PATH = path.resolve(__dirname, '../src/web-ui/modules/journey-store.js');
    const PRODUCTS_ROUTE_PATH = path.resolve(__dirname, '../src/web-ui/routes/products.js');
    const SKILLS_ROUTE_PATH = path.resolve(__dirname, '../src/web-ui/routes/skills.js');

    function makeRes() {
      const r = { _status: null, _headers: {}, _body: '' };
      r.writeHead = function(status, headers) { r._status = status; Object.assign(r._headers, headers || {}); };
      r.setHeader = function(k, v) { r._headers[k] = v; };
      r.end = function(b) { r._body += (b || ''); };
      return r;
    }
    function extractSidFromRedirect(res) {
      const loc = res._headers.Location || '';
      const m = /\/skills\/discovery\/sessions\/([^/]+)\/chat/.exec(loc);
      return m ? decodeURIComponent(m[1]) : null;
    }

    const journeyStore = freshRequire(JOURNEY_STORE_PATH);
    journeyStore._clearForTesting();
    const productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);
    const skillsRoute = require(SKILLS_ROUTE_PATH);

    const pool = makeFakePool();
    // Tenant A has a default pod on prod-A; tenant B's product (different
    // product id, no assignment row) must NOT inherit tenant A's pod.
    pool.pods.push({ pod_id: 'pod-A', tenant_id: 'tenant-A', name: 'Platform A' });
    pool.podMembers.push({ pod_id: 'pod-A', user_id: 'u1', role_id: 'conductor' });
    pool.podAssignments.push({ tenant_id: 'tenant-A', pod_id: 'pod-A', product_id: 'prod-A', feature_id: null, assignment_type: 'inherit-to-all-features' });
    const originalQuery = pool.query.bind(pool);
    pool.query = async function(sql, params) {
      const s = String(sql).trim().replace(/\s+/g, ' ').toUpperCase();
      if (s.indexOf('SELECT REPO_OWNER, REPO_NAME') !== -1) return { rows: [{ repo_owner: 'acme', repo_name: 'widgets' }] };
      return originalQuery(sql, params);
    };

    // Tenant B creates a feature under a DIFFERENT product (prod-B) with no default pod.
    const req = { params: { id: 'prod-B' }, session: { tenantId: 'tenant-B', login: 'other-user', csrfToken: 'test-csrf-token' }, body: { _csrf: 'test-csrf-token' } };
    const res = makeRes();
    await productsRoute.handlePostProductFeature(req, res, null, pool, { capture: function() {} });

    const sid = extractSidFromRedirect(res);
    const session = skillsRoute._getHtmlSession(sid);
    const journeyId = session && session.journeyId;

    eq(pool.podAssignments.filter(a => a.feature_id === journeyId).length, 0, 'Tenant isolation: tenant B\'s feature does NOT inherit tenant A\'s default pod');
    eq(pool.featureCollaborators.filter(c => c.feature_id === journeyId).length, 0, 'Tenant isolation: no feature_collaborators rows created for tenant B\'s feature');
  }
```

- [ ] **Step 2: Run test — must pass immediately**

```bash
node tests/check-ep1-s3-feature-pod-inheritance.js
```

Expected: passes immediately (20 assertions total) — `getProductDefaultPod` is already tenant-scoped (ep1-s2's own implementation), so this proves the composition is correct end-to-end, not just that each piece works in isolation.

- [ ] **Step 3: No new production code**

Nothing to implement.

- [ ] **Step 4/5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing except the already-acknowledged `check-p3.5-validate-trace.js`

- [ ] **Step 6: Commit**

```bash
git add tests/check-ep1-s3-feature-pod-inheritance.js
git commit -m "test(ep1-s3): prove tenant isolation for feature pod inheritance"
```

---

## Task 6: Wire schema migration into server.js

**Files:**
- Modify: `src/web-ui/server.js`

No new route is needed — this story extends an existing, already-wired handler (`handlePostProductFeature`, wired to `POST /products/:id/features` since long before this feature existed). Only the schema migration needs wiring.

- [ ] **Step 1/2: Confirm currently absent**

```bash
grep -n "migrateFeatureCollaboratorsSchema" src/web-ui/server.js
```

Expected: no matches.

- [ ] **Step 3: Write the implementation**

Add near the other module requires (alongside the ep1-s1/ep1-s2 requires):

```javascript
const { migrateFeatureCollaboratorsSchema } = require('./modules/feature-collaborator-store'); // ep1-s3
```

Add to the schema-migration chain, immediately after the existing `migratePodAssignmentsSchema(_userRolesPool)` block (ep1-s2's):

```javascript
    // ep1-s3 — Auto-migrate feature_collaborators schema.
    migrateFeatureCollaboratorsSchema(_userRolesPool).then(function() {
      console.log('[ep1-s3] feature_collaborators schema ready');
    }).catch(function(err) { console.error('[ep1-s3] feature_collaborators schema migration failed:', err.message); });
```

- [ ] **Step 4: Confirm the wiring now exists**

```bash
grep -n "migrateFeatureCollaboratorsSchema" src/web-ui/server.js
```

Expected: 2 matches (1 require, 1 schema-chain call).

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing except the already-acknowledged `check-p3.5-validate-trace.js`

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/server.js
git commit -m "feat(ep1-s3): wire feature_collaborators schema migration into server.js"
```

---

## Task 7: fake-test-db.js extension + real end-to-end HTTP-level test

**Files:**
- Modify: `src/web-ui/adapters/fake-test-db.js`
- Create: `tests/e2e/ep1-s3-feature-pod-inheritance.spec.js`

No browser rendering is used in this spec — there is no UI to render for this story's outcome (see the plan's own header note). This uses Playwright's `page.request` (raw HTTP, cookie-aware via the same `withAuth` session) purely to drive the REAL server + REAL `fake-test-db.js` dispatch path, closing the exact "wiring never actually exercised through the real handler" risk class that caused `ep1-s1`'s severe bug.

- [ ] **Step 1: Write the failing test**

```javascript
// tests/e2e/ep1-s3-feature-pod-inheritance.spec.js
// @mocked
//
// No browser rendering — there is no UI surfacing this story's outcome yet
// (DoR: "Listing pod members in the feature creation UI" is explicitly
// deferred to Epic 2). This test uses page.request only, to prove the real
// server + real fake-test-db.js dispatch path works end-to-end -- the same
// risk class (a handler correct in isolation but never exercised through
// its real wiring) that caused a severe bug in ep1-s1.
const { expect } = require('@playwright/test');
const { withAuth } = require('./fixtures/auth');
const { getCsrfToken } = require('./fixtures/csrf');

function uniqueName(label) {
  return 'ep1-s3-' + label + '-' + Date.now();
}

withAuth('ep1-s3: a feature created under a product with a default pod inherits it, end-to-end through the real server', async ({ page }) => {
  const productName = uniqueName('product');
  const podName = uniqueName('pod');

  // Create product (API-based fixture, established pattern from bmau-s1/ep1-s2).
  const draftRes = await page.request.post('/products/new', {
    data: { name: productName, description: 'ep1-s3 E2E fixture product.' },
    headers: { 'Content-Type': 'application/json' }
  });
  expect(draftRes.status()).toBe(200);
  const newPageCsrf = await getCsrfToken(page.request, '/products/new', 'products/new page');
  const confirmRes = await page.request.post('/products/confirm', {
    form: { name: productName, description: 'ep1-s3 E2E fixture product.', _csrf: newPageCsrf },
    maxRedirects: 0
  });
  expect(confirmRes.status()).toBe(302);
  const productId = confirmRes.headers()['location'].split('/products/')[1];

  // das-s2's repo-connection gate needs a repo before the product's FIRST
  // feature can be created -- seed one via the same test-only fixture
  // endpoint bmau-s1's own spec already establishes for exactly this reason.
  const repoSeedRes = await page.request.post('/test/seed-product-repo', { data: { productId: productId } });
  expect(repoSeedRes.status()).toBe(200);

  // Create pod via the real UI (fast, already-tested flow — matches ep1-s1/ep1-s2's own pattern).
  await page.goto('/admin/pods/manager');
  await page.click('#create-pod-btn');
  await page.fill('#pod-name-input', podName);
  await page.locator('.roster-row', { hasText: 'Hamish' }).getByRole('button', { name: 'Add' }).click();
  await page.click('#save-pod-btn');
  await expect(page.locator('#success-banner')).toBeVisible();

  // Set as product default (real endpoint, ep1-s2's own feature).
  await page.goto('/products/' + productId);
  await page.click('#set-default-pod-btn');
  await page.locator('#default-pod-select').selectOption({ label: podName });
  await page.click('#confirm-default-pod-btn');
  await expect(page.locator('#default-pod-display')).toContainText(podName);

  // Create a feature under this product via the REAL handler (page.request only).
  const productPageCsrf = await getCsrfToken(page.request, '/products/' + productId, 'product page');
  const featureRes = await page.request.post('/products/' + productId + '/features', {
    form: { displayName: 'ep1-s3 E2E Feature', _csrf: productPageCsrf },
    maxRedirects: 0
  });
  expect(featureRes.status(), 'feature creation should redirect to a discovery chat session').toBe(303);
  const location = featureRes.headers()['location'] || '';
  expect(location).toMatch(/\/skills\/discovery\/sessions\/[^/]+\/chat/);

  // No UI exists yet to inspect pod_assignments/feature_collaborators
  // directly (per this plan's own header note) -- the redirect succeeding
  // (rather than erroring) with a real session id IS the observable proof
  // available at this layer that the real dispatch path, including the new
  // pod-inheritance code, executed without throwing. Full DB-state proof is
  // covered by this story's own unit-level tests (Tasks 2-5), which call
  // the same handler directly and DO assert on pod_assignments/
  // feature_collaborators row state.
});
```

- [ ] **Step 2: Run — confirm it fails first for the right reason**

```bash
NODE_ENV=test npx playwright test tests/e2e/ep1-s3-feature-pod-inheritance.spec.js
```

Expected: fails because `fake-test-db.js` has no `feature_collaborators` support yet — likely surfaces as an unhandled-query warning in server logs followed by a non-303 status or an error, OR the test may actually pass at this stage if the pod-inheritance code's own try/catch (Task 2) swallows the unhandled-query gracefully as a non-fatal error (matching its own best-effort design) — if so, this step's "RED" state won't be a hard failure. If it passes immediately, note this in your report and proceed directly to Step 4/5 verification of the DB-state-level tests (Tasks 2-5) instead, since THIS SPECIFIC spec's own pass/fail may not be a reliable RED/GREEN signal given the deliberately-swallowed-error design. Investigate and report clearly either way — do not silently assume either outcome without checking server logs.

- [ ] **Step 3: Extend fake-test-db.js**

Add `feature_collaborators` support to `src/web-ui/adapters/fake-test-db.js`, following the exact same narrow-branch convention already used for `pods`/`pod_members`/`pod_assignments` (ep1-s1/ep1-s2). Read `feature-collaborator-store.js`'s own queries first (`grep -n "pool.query" src/web-ui/modules/feature-collaborator-store.js`) to get the exact text to match. You need:
- A `featureCollaborators` array (add near the existing `podAssignments` array).
- A branch for the `CREATE TABLE IF NOT EXISTS FEATURE_COLLABORATORS` bootstrap (should already be covered by the existing generic `CREATE TABLE` catch-all — confirm, don't add a redundant branch if so).
- A branch for `SELECT user_id, role_id FROM pod_members WHERE pod_id = $1` — check whether an existing `pod_members`-reading branch in this file already covers this exact shape (there may already be one from ep1-s1/ep1-s2's own additions); if so, reuse it, don't duplicate.
- A branch for the `INSERT INTO feature_collaborators (...)` write.
- A branch for `SELECT collaborator_id, user_id, role_id, pod_id FROM feature_collaborators WHERE feature_id = $1` (the read path, if anything ever needs it beyond this story's own tests).

Update `_reset()` to clear `featureCollaborators = [];`.

- [ ] **Step 4: Run again — must pass (or confirm the swallowed-error case from Step 2 and verify via logs)**

```bash
NODE_ENV=test npx playwright test tests/e2e/ep1-s3-feature-pod-inheritance.spec.js
```

Expected: 1 passed, with server logs showing NO "unhandled query" warnings for any `pod_assignments`/`feature_collaborators`/`pod_members` query during this test run (grep the Playwright output for `unhandled query` to confirm cleanly).

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Only expected pre-existing failure: `tests/check-p3.5-validate-trace.js`.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/adapters/fake-test-db.js tests/e2e/ep1-s3-feature-pod-inheritance.spec.js
git commit -m "test(ep1-s3): real end-to-end HTTP-level test + fake-test-db.js feature_collaborators support"
```

---

## NFR coverage (from test plan — no separate tasks, covered by tasks above)

- **NFR-Perf-1 (feature creation with inheritance ≤2s):** not automated — same class of RISK-ACCEPT-expected gap as `ep1-s1`/`ep1-s2`'s own NFR-Perf-1 entries.
- **Collaborators visible in feature settings immediately after creation:** NOT achievable yet — no UI exists to surface this (DoR's own deferral). Document as an honest, non-blocking gap at `/verify-completion`/`/definition-of-done`, not a silent pass.
- **Roles correctly preserved:** covered by Task 4 (AC3).

## Out of scope (from DoR — do not implement)

- Allowing the product owner to override the pod assignment during feature creation (deferred to Epic 2)
- Listing pod members in the feature creation UI (deferred to Epic 2 UI stories)
- `getFeatureCollaborators()` canonical builder itself (ADR-026 names this as future work this story lays the foundation for, not something this story implements as a public builder API)
