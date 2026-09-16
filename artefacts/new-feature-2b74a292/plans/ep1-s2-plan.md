# Assign Pod to Product as Default — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available)
> or /tdd per task if executing in this session.

**Goal:** A "Set default pod" action in the product view that persists a `pod_assignments` row (product-level default, `assignmentType: inherit-to-all-features`), returns the assignment data, and updates the page's "Default pod" display without a page refresh.

**Scope correction (see `decisions.md`, 2026-09-16):** ep1-s2's own AC2 ("a new feature under Payments shows Assigned pods automatically") describes an end-to-end outcome that is only fully deliverable once `ep1-s3` (a separate, dedicated story: "Feature Inherits Product Default Pod on Creation") also ships — `ep1-s2`'s own DoR explicitly excludes touching feature-creation logic. This plan implements AC1 fully, AC3 fully (trivially — this story never touches any existing feature's data), and AC2's precondition only: proving the product's default pod is queryable in the exact shape `ep1-s3`'s feature-creation code will need to consume.

**Route convention correction (see `decisions.md`):** The DoR/test-plan specify `POST /api/products/{productId}/set-default-pod`, but this codebase's real, established convention for `products.js` routes has no `/api/` prefix (e.g. `POST /products/:id/features`, `POST /products/:id/sync`). This plan uses `POST /products/:id/set-default-pod`, matching the file's actual convention, not the artefact's literal (unverified-against-codebase) path.

**No dedicated "product settings" page exists in this codebase** — `/products/:id` (GET) renders the product view via `_renderProductView()`, a single ~17-parameter render function already depended on by 19 test files. This plan adds a small "Pod & Team" section to that existing view (a new, purely-additive trailing parameter — every existing call site keeps working unmodified) rather than inventing a new page.

**Branch:** `feature/ep1-s2`
**Worktree:** `.worktrees/ep1-s2`
**Test command:** `npm test` (full suite) / `node tests/check-ep1-s2-product-default-pod.js` (this story only)

---

## File map

```
Create:
  src/web-ui/modules/pod-assignment-store.js       — pod_assignments schema bootstrap + data access
                                                       (setProductDefaultPod, getProductDefaultPod).
                                                       Does NOT touch pod-store.js or pod_members
                                                       queries directly (DoR exclusion) -- reads
                                                       pods/pod_members via its own narrow SELECTs.
  tests/check-ep1-s2-product-default-pod.js        — AC1/AC3/AC2-precondition unit tests +
                                                       tenant-isolation integration test
  tests/e2e/ep1-s2-product-default-pod.spec.js     — Playwright E2E: AC1 (set + no-refresh UI
                                                       update), AC3 (non-retroactivity)

Modify:
  src/web-ui/routes/products.js                    — add handlePostSetDefaultPod; extend
                                                       handleGetProductView to fetch the current
                                                       default pod and pass it through; extend
                                                       _renderProductView with ONE new trailing
                                                       parameter (defaultPod) + a "Pod & Team"
                                                       section + inline JS for the AJAX set +
                                                       no-refresh DOM update
  src/web-ui/server.js                             — require pod-assignment-store.js, chain
                                                       migratePodAssignmentsSchema, wire
                                                       POST /products/:id/set-default-pod
                                                       (requireNonViewer + CSRF, matching this
                                                       file's own established convention for
                                                       every other mutating product route)
  src/web-ui/adapters/fake-test-db.js               — narrow pod_assignments query branches
                                                       (reuses the existing pods/pod_members
                                                       arrays from ep1-s1, adds a new
                                                       podAssignments array)

Files this plan deliberately does NOT touch (per DoR exclusion + scope correction above):
  src/web-ui/modules/pod-store.js                   — pod/pod_members creation logic (ep1-s1's)
  Feature creation core logic (handlePostProductFeature) — ep1-s3's own scope
```

---

## Task 1: pod-assignment-store — schema + data access

**Files:**
- Create: `src/web-ui/modules/pod-assignment-store.js`
- Test: `tests/check-ep1-s2-product-default-pod.js` (Part 1)

- [ ] **Step 1: Write the failing test**

```javascript
// tests/check-ep1-s2-product-default-pod.js
#!/usr/bin/env node
/**
 * check-ep1-s2-product-default-pod.js
 *
 * Unit + integration tests for ep1-s2: Assign Pod to Product as Default.
 * AC1 (assignment save + shape), AC3 (non-retroactivity, proven trivially --
 * this story never writes to journeys/features tables), plus the AC2
 * handoff-precondition (defaultPod queryable in the shape ep1-s3 needs) and
 * a tenant-isolation integration test.
 *
 * Run: node tests/check-ep1-s2-product-default-pod.js
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

/** Minimal fake pg-Pool-shaped object backing pods/pod_members/pod_assignments in memory. */
function makeFakePool() {
  const pods = [];
  const podMembers = [];
  const podAssignments = [];
  return {
    pods, podMembers, podAssignments,
    query: async function(sql, params) {
      const s = String(sql).trim().replace(/\s+/g, ' ').toUpperCase();
      if (s.indexOf('CREATE TABLE') === 0) return { rows: [] };
      if (s.indexOf('SELECT POD_ID, TENANT_ID FROM PODS WHERE') === 0) {
        const [podId, tenantId] = params;
        return { rows: pods.filter(p => p.pod_id === podId && p.tenant_id === tenantId) };
      }
      if (s.indexOf('SELECT COUNT(*) AS COUNT FROM POD_MEMBERS') === 0) {
        const [podId] = params;
        return { rows: [{ count: String(podMembers.filter(m => m.pod_id === podId).length) }] };
      }
      if (s.indexOf('SELECT POD_ID, NAME FROM PODS WHERE POD_ID') === 0) {
        const [podId] = params;
        const row = pods.find(p => p.pod_id === podId);
        return { rows: row ? [{ pod_id: row.pod_id, name: row.name }] : [] };
      }
      if (s.indexOf('INSERT INTO POD_ASSIGNMENTS') === 0) {
        const [assignmentId, tenantId, podId, productId, assignmentType, assignedBy] = params;
        // Simulate UNIQUE(tenant_id, product_id, feature_id) -- feature_id is
        // always NULL for a product-level default in this story's scope, so
        // this simulates ON CONFLICT (tenant_id, product_id) WHERE feature_id
        // IS NULL DO UPDATE, matching the real migration's partial index.
        const existingIdx = podAssignments.findIndex(a => a.tenant_id === tenantId && a.product_id === productId && a.feature_id === null);
        const row = { assignment_id: assignmentId, tenant_id: tenantId, pod_id: podId, product_id: productId, feature_id: null, assignment_type: assignmentType, assigned_by: assignedBy, assigned_at: new Date().toISOString() };
        if (existingIdx !== -1) { podAssignments[existingIdx] = row; } else { podAssignments.push(row); }
        return { rows: [] };
      }
      if (s.indexOf('SELECT PA.POD_ID, P.NAME FROM POD_ASSIGNMENTS') === 0) {
        const [tenantId, productId] = params;
        const row = podAssignments.find(a => a.tenant_id === tenantId && a.product_id === productId && a.feature_id === null);
        if (!row) return { rows: [] };
        const pod = pods.find(p => p.pod_id === row.pod_id);
        return { rows: pod ? [{ pod_id: pod.pod_id, name: pod.name }] : [] };
      }
      return { rows: [] };
    }
  };
}

async function run() {
  const { migratePodAssignmentsSchema, setProductDefaultPod, getProductDefaultPod } = require('../src/web-ui/modules/pod-assignment-store');

  // --- Part 1: pod-assignment-store.js ---
  {
    const pool = makeFakePool();
    await migratePodAssignmentsSchema(pool);
    ok(true, 'migratePodAssignmentsSchema resolves without throwing (schema bootstrap)');

    // Seed a pod + 3 members directly (simulating ep1-s1's own createPod having already run).
    pool.pods.push({ pod_id: 'pod-core-uuid', tenant_id: 'tenant-test-123', name: 'Core Platform Pod' });
    pool.podMembers.push({ pod_id: 'pod-core-uuid' }, { pod_id: 'pod-core-uuid' }, { pod_id: 'pod-core-uuid' });

    const result = await setProductDefaultPod(pool, {
      tenantId: 'tenant-test-123',
      productId: 'prod-payments-uuid',
      podId: 'pod-core-uuid',
      assignedBy: 'hamish-uuid'
    });
    ok(result.assignmentId, 'setProductDefaultPod: returns an assignmentId');
    eq(result.podName, 'Core Platform Pod', 'setProductDefaultPod: returns the correct pod name');
    eq(result.memberCount, 3, 'setProductDefaultPod: returns the correct member count');
    eq(pool.podAssignments.length, 1, 'setProductDefaultPod: exactly 1 assignment row written');
    eq(pool.podAssignments[0].assignment_type, 'inherit-to-all-features', 'setProductDefaultPod: assignmentType is inherit-to-all-features');

    const found = await getProductDefaultPod(pool, 'tenant-test-123', 'prod-payments-uuid');
    ok(found, 'getProductDefaultPod: finds the just-set default pod');
    eq(found.podName, 'Core Platform Pod', 'getProductDefaultPod: returns the correct pod name');
  }

  console.log(`\n[ep1-s2] ${passed} passed, ${failed} failed\n`);
  process.exit(failed === 0 ? 0 : 1);
}

run();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-ep1-s2-product-default-pod.js
```

Expected output: `Error: Cannot find module '../src/web-ui/modules/pod-assignment-store'`

- [ ] **Step 3: Write the implementation**

```javascript
// src/web-ui/modules/pod-assignment-store.js
'use strict';

// pod-assignment-store.js — ep1-s2: pod_assignments schema bootstrap + data
// access. Deliberately does NOT modify pod-store.js or issue pod_members
// write queries (DoR exclusion) -- reads pods/pod_members with its own
// narrow, read-only SELECTs. Mirrors pod-store.js's migrate*Schema()
// CREATE TABLE IF NOT EXISTS convention exactly.
//
// This story's own AC2 (a new feature auto-inherits the product default) is
// NOT implemented here -- getProductDefaultPod()'s return shape is the
// handoff contract ep1-s3's feature-creation code will consume. See
// decisions.md (2026-09-16) for the full scope-boundary writeup.
const crypto = require('crypto');

/**
 * Startup schema bootstrap for pod_assignments.
 * feature_id is NULL for a product-level default (this story's only case);
 * a real per-feature assignment (explicit-feature / multi-feature-set) is
 * out of scope here -- the column exists now so ep1-s3/Epic 2 don't need a
 * later migration to add it.
 */
async function migratePodAssignmentsSchema(pool, logger) {
  const log = logger || { info: function(msg) { console.log(msg); } };

  await pool.query(`
    CREATE TABLE IF NOT EXISTS pod_assignments (
      assignment_id    UUID        PRIMARY KEY,
      tenant_id        VARCHAR     NOT NULL,
      pod_id           UUID        NOT NULL REFERENCES pods(pod_id),
      product_id       VARCHAR     NOT NULL,
      feature_id       VARCHAR,
      assignment_type  VARCHAR     NOT NULL,
      assigned_by      VARCHAR,
      assigned_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  // Partial unique index: only one product-level default (feature_id IS
  // NULL) per (tenant_id, product_id). A future per-feature assignment
  // (feature_id NOT NULL) is NOT constrained by this index -- Epic 2/4 scope.
  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS pod_assignments_product_default_uq
      ON pod_assignments (tenant_id, product_id)
      WHERE feature_id IS NULL
  `);

  log.info('[ep1-s2] pod_assignments schema migrated');
}

/**
 * Set (or replace) a product's default pod. Validates the pod belongs to
 * this tenant BEFORE writing -- caller (routes/products.js) is responsible
 * for validating the product itself belongs to this tenant.
 * @returns {Promise<{assignmentId: string, podName: string, memberCount: number}>}
 * @throws {Error} with .code = 'POD_NOT_FOUND' if podId doesn't belong to this tenant
 */
async function setProductDefaultPod(pool, args) {
  const podRow = (await pool.query('SELECT pod_id, tenant_id FROM pods WHERE pod_id = $1 AND tenant_id = $2', [args.podId, args.tenantId])).rows[0];
  if (!podRow) {
    const err = new Error("No pod found with that id for this tenant");
    err.code = 'POD_NOT_FOUND';
    throw err;
  }

  const memberCountRow = (await pool.query('SELECT COUNT(*) AS count FROM pod_members WHERE pod_id = $1', [args.podId])).rows[0];
  const memberCount = parseInt(memberCountRow.count, 10);

  const podNameRow = (await pool.query('SELECT pod_id, name FROM pods WHERE pod_id = $1', [args.podId])).rows[0];

  const assignmentId = crypto.randomUUID();
  await pool.query(
    'INSERT INTO pod_assignments (assignment_id, tenant_id, pod_id, product_id, assignment_type, assigned_by) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (tenant_id, product_id) WHERE feature_id IS NULL DO UPDATE SET pod_id = EXCLUDED.pod_id, assignment_type = EXCLUDED.assignment_type, assigned_by = EXCLUDED.assigned_by, assigned_at = NOW()',
    [assignmentId, args.tenantId, args.podId, args.productId, 'inherit-to-all-features', args.assignedBy]
  );

  return { assignmentId, podName: podNameRow.name, memberCount };
}

/**
 * Read a product's current default pod (feature_id IS NULL row), if any.
 * Return shape is the AC2 handoff contract ep1-s3's feature-creation code
 * will consume: { podId, podName, memberCount }.
 * @returns {Promise<{podId: string, podName: string, memberCount: number}|null>}
 */
async function getProductDefaultPod(pool, tenantId, productId) {
  const row = (await pool.query(
    'SELECT pa.pod_id, p.name FROM pod_assignments pa JOIN pods p ON p.pod_id = pa.pod_id WHERE pa.tenant_id = $1 AND pa.product_id = $2 AND pa.feature_id IS NULL',
    [tenantId, productId]
  )).rows[0];
  if (!row) return null;

  const memberCountRow = (await pool.query('SELECT COUNT(*) AS count FROM pod_members WHERE pod_id = $1', [row.pod_id])).rows[0];
  return { podId: row.pod_id, podName: row.name, memberCount: parseInt(memberCountRow.count, 10) };
}

module.exports = {
  migratePodAssignmentsSchema,
  setProductDefaultPod,
  getProductDefaultPod
};
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ep1-s2-product-default-pod.js
```

Expected output: 7 assertions pass (schema ×1, setProductDefaultPod ×4, getProductDefaultPod ×2)

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing except the already-acknowledged `check-p3.5-validate-trace.js`

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/modules/pod-assignment-store.js tests/check-ep1-s2-product-default-pod.js
git commit -m "feat(ep1-s2): pod-assignment-store schema bootstrap and data access"
```

---

## Task 2: POST /products/:id/set-default-pod handler — AC1 happy path

**Files:**
- Modify: `src/web-ui/routes/products.js`
- Test: `tests/check-ep1-s2-product-default-pod.js` (append Part 2)

- [ ] **Step 1: Write the failing test**

Append to `tests/check-ep1-s2-product-default-pod.js`, inside `run()`, after Part 1:

```javascript
  // --- Part 2: routes/products.js — handlePostSetDefaultPod, AC1 happy path ---
  {
    const { handlePostSetDefaultPod } = require('../src/web-ui/routes/products');
    const pool = makeFakePool();
    const { migratePodAssignmentsSchema } = require('../src/web-ui/modules/pod-assignment-store');
    await migratePodAssignmentsSchema(pool);
    pool.pods.push({ pod_id: 'pod-core-uuid', tenant_id: 'tenant-test-123', name: 'Core Platform Pod' });
    pool.podMembers.push({ pod_id: 'pod-core-uuid' }, { pod_id: 'pod-core-uuid' }, { pod_id: 'pod-core-uuid' });

    const req = { session: { tenantId: 'tenant-test-123', userId: 'hamish-uuid' }, params: { id: 'prod-payments-uuid' } };
    let statusCode = null, responseBody = null;
    const res = {
      json: function(body) { statusCode = 200; responseBody = body; },
      status: function(code) { statusCode = code; return { json: function(body) { responseBody = body; } }; }
    };

    await handlePostSetDefaultPod(req, res, null, pool, { podId: 'pod-core-uuid' });
    eq(statusCode, 200, 'AC1: happy path returns HTTP 200');
    eq(responseBody.productId, 'prod-payments-uuid', 'AC1: response includes the productId');
    eq(responseBody.defaultPodId, 'pod-core-uuid', 'AC1: response includes the defaultPodId');
    eq(responseBody.podName, 'Core Platform Pod', 'AC1: response includes the pod name');
    eq(responseBody.memberCount, 3, 'AC1: response memberCount is 3');
  }
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-ep1-s2-product-default-pod.js
```

Expected output: `Error: handlePostSetDefaultPod is not exported` or similar — the handler doesn't exist yet.

- [ ] **Step 3: Write the implementation**

Add near the top of `src/web-ui/routes/products.js`, alongside the other module requires:

```javascript
const { setProductDefaultPod, getProductDefaultPod } = require('../modules/pod-assignment-store'); // ep1-s2
```

Add the handler near the other `handlePost*` functions (e.g. after `handlePostProductFeature`):

```javascript
/**
 * ep1-s2 AC1 — POST /products/:id/set-default-pod: assigns an existing pod
 * as a product's default team. Does NOT touch feature-creation logic (see
 * decisions.md, 2026-09-15 scope-boundary entry) -- ep1-s3 consumes
 * getProductDefaultPod()'s shape to auto-assign at feature-creation time.
 */
async function handlePostSetDefaultPod(req, res, _next, pool, presetBody) {
  var _pool = pool;
  var productId = req.params && req.params.id;
  var tenantId = req.session && req.session.tenantId;
  var body = presetBody !== undefined ? presetBody : (req.body || {});
  var podId = body.podId;

  function _json(status, payload) {
    if (res.status) { res.status(status).json(payload); }
    else { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(payload)); }
  }

  if (!podId) {
    return _json(400, { error: 'podId is required' });
  }

  var prodRow = (await _pool.query('SELECT product_id, tenant_id FROM products WHERE product_id = $1', [productId])).rows[0];
  if (!prodRow || prodRow.tenant_id !== tenantId) {
    return _json(404, { error: 'Product not found' });
  }

  var assignedBy = (req.session && (req.session.userId || req.session.login)) || null;
  var result;
  try {
    result = await setProductDefaultPod(_pool, { tenantId: tenantId, productId: productId, podId: podId, assignedBy: assignedBy });
  } catch (err) {
    if (err && err.code === 'POD_NOT_FOUND') {
      return _json(400, { error: 'No pod found with that id for this tenant' });
    }
    throw err;
  }

  return _json(200, { productId: productId, defaultPodId: podId, podName: result.podName, memberCount: result.memberCount });
}
```

Add `handlePostSetDefaultPod` and `getProductDefaultPod` (re-exported for Task 4's own test convenience) to `products.js`'s existing `module.exports = { ... }` block at the bottom of the file — add these two names to the existing object, do not restructure the export block.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ep1-s2-product-default-pod.js
```

Expected output: 12 assertions pass (7 from Task 1 + 5 new)

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing except the already-acknowledged `check-p3.5-validate-trace.js`

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/products.js tests/check-ep1-s2-product-default-pod.js
git commit -m "feat(ep1-s2): POST /products/:id/set-default-pod handler (AC1 happy path)"
```

---

## Task 3: AC3 — existing features unaffected by default-pod change (non-retroactivity)

**Files:**
- Modify: `tests/check-ep1-s2-product-default-pod.js` (append Part 3)

This story never writes to `journeys`/`features`-shaped tables at all (only `pod_assignments`), so non-retroactivity is a structural property, not something that needs new production code — this task proves it explicitly rather than leaving it as an unstated assumption.

- [ ] **Step 1: Write the failing test**

Append to `tests/check-ep1-s2-product-default-pod.js`, inside `run()`:

```javascript
  // --- Part 3: AC3 — setting a default pod does not touch any other table ---
  {
    const { handlePostSetDefaultPod } = require('../src/web-ui/routes/products');
    const pool = makeFakePool();
    const { migratePodAssignmentsSchema } = require('../src/web-ui/modules/pod-assignment-store');
    await migratePodAssignmentsSchema(pool);
    pool.pods.push({ pod_id: 'pod-core-uuid', tenant_id: 'tenant-test-123', name: 'Core Platform Pod' });
    pool.podMembers.push({ pod_id: 'pod-core-uuid' });

    // Simulate one pre-existing "feature" row (a table this story's own code
    // never queries or writes) to prove it is untouched by the assignment call.
    pool.preExistingFeatureRows = [{ journey_id: 'old-feature-1', product_id: 'prod-payments-uuid', pod_assignments: [] }];
    const snapshotBefore = JSON.stringify(pool.preExistingFeatureRows);

    const req = { session: { tenantId: 'tenant-test-123', userId: 'hamish-uuid' }, params: { id: 'prod-payments-uuid' } };
    const res = { json: function() {}, status: function() { return { json: function() {} }; } };
    await handlePostSetDefaultPod(req, res, null, pool, { podId: 'pod-core-uuid' });

    eq(JSON.stringify(pool.preExistingFeatureRows), snapshotBefore, 'AC3: pre-existing feature rows are byte-identical after setting the default pod (never queried or written)');
    ok(pool.podAssignments.length === 1, 'AC3 setup sanity: exactly 1 pod_assignments row exists (the one just written, nothing retroactively created for the old feature)');
  }
```

- [ ] **Step 2: Run test — confirm it passes for the right reason**

```bash
node tests/check-ep1-s2-product-default-pod.js
```

Expected output: passes immediately (13 assertions total) — this is expected for a structural-property test like this one; no red step, since `handlePostSetDefaultPod` genuinely never references `pool.preExistingFeatureRows` or any features/journeys table.

- [ ] **Step 3: No new production code**

Nothing to implement — this task proves an already-true structural property.

- [ ] **Step 4/5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing except the already-acknowledged `check-p3.5-validate-trace.js`

- [ ] **Step 6: Commit**

```bash
git add tests/check-ep1-s2-product-default-pod.js
git commit -m "test(ep1-s2): prove AC3 non-retroactivity (setting a default pod touches only pod_assignments)"
```

---

## Task 4: AC2 handoff precondition — defaultPod queryable via product view's JSON path

**Files:**
- Modify: `src/web-ui/routes/products.js` (`handleGetProductView`'s existing `res.json` branch)
- Test: `tests/check-ep1-s2-product-default-pod.js` (append Part 4)

- [ ] **Step 1: Write the failing test**

Append to `tests/check-ep1-s2-product-default-pod.js`, inside `run()`:

```javascript
  // --- Part 4: AC2 handoff precondition — GET product view JSON includes defaultPod ---
  {
    const { handleGetProductView } = require('../src/web-ui/routes/products');
    const pool = makeFakePool();
    const { migratePodAssignmentsSchema, setProductDefaultPod } = require('../src/web-ui/modules/pod-assignment-store');
    await migratePodAssignmentsSchema(pool);
    pool.pods.push({ pod_id: 'pod-core-uuid', tenant_id: 'tenant-test-123', name: 'Core Platform Pod' });
    pool.podMembers.push({ pod_id: 'pod-core-uuid' }, { pod_id: 'pod-core-uuid' }, { pod_id: 'pod-core-uuid' });
    await setProductDefaultPod(pool, { tenantId: 'tenant-test-123', productId: 'prod-payments-uuid', podId: 'pod-core-uuid', assignedBy: 'hamish-uuid' });

    // handleGetProductView's own existing queries (products/product_rollups/journeys)
    // aren't stubbed by makeFakePool -- this test exercises ONLY the
    // getProductDefaultPod() call path this task adds, by calling that
    // function directly against the same pool state, matching what
    // handleGetProductView's own res.json branch will now also call.
    const { getProductDefaultPod } = require('../src/web-ui/modules/pod-assignment-store');
    const defaultPod = await getProductDefaultPod(pool, 'tenant-test-123', 'prod-payments-uuid');
    ok(defaultPod, 'AC2 precondition: getProductDefaultPod returns a result for a product with a default set');
    eq(defaultPod.podId, 'pod-core-uuid', 'AC2 precondition: correct podId');
    eq(defaultPod.podName, 'Core Platform Pod', 'AC2 precondition: correct podName');
    eq(defaultPod.memberCount, 3, 'AC2 precondition: correct memberCount -- this exact shape is what ep1-s3 will consume');
  }
```

- [ ] **Step 2: Run test — must pass immediately**

```bash
node tests/check-ep1-s2-product-default-pod.js
```

Expected: passes immediately (17 assertions total) — `getProductDefaultPod` was already fully implemented and tested in Task 1; this task's real work is wiring it into `handleGetProductView`'s existing JSON branch (Step 3 below), which this specific test doesn't exercise directly (see Step 3's own manual verification note).

- [ ] **Step 3: Write the implementation**

In `src/web-ui/routes/products.js`'s `handleGetProductView`, find the existing block:

```javascript
  if (res.json) {
    res.json({ features: features });
  } else {
```

Change it to:

```javascript
  if (res.json) {
    var defaultPod = await getProductDefaultPod(_pool, tenantId, productId);
    res.json({ features: features, defaultPod: defaultPod });
  } else {
```

**Manual verification** (no dedicated automated test for this exact wiring point beyond Task 6's E2E, which exercises it indirectly through the rendered page): confirm by reading the diff that `getProductDefaultPod` is now called with the same `_pool`/`tenantId`/`productId` variables already in scope at that point in the function (all three are already defined earlier in `handleGetProductView`, per the existing code read in Task 1's research).

- [ ] **Step 4/5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing except the already-acknowledged `check-p3.5-validate-trace.js`

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/products.js tests/check-ep1-s2-product-default-pod.js
git commit -m "feat(ep1-s2): expose defaultPod in handleGetProductView's JSON response (AC2 handoff precondition)"
```

---

## Task 5: Wire into server.js

**Files:**
- Modify: `src/web-ui/server.js`

- [ ] **Step 1/2: Confirm currently absent**

```bash
grep -n "handlePostSetDefaultPod\|migratePodAssignmentsSchema" src/web-ui/server.js
```

Expected: no matches

- [ ] **Step 3: Write the implementation**

Add near the other route-handler requires (alongside `products.js`'s existing requires):

```javascript
const { handlePostSetDefaultPod } = require('./routes/products'); // ep1-s2 (products.js already required elsewhere in this file for its other handlers -- this is an additional named import from the same module)
const { migratePodAssignmentsSchema } = require('./modules/pod-assignment-store'); // ep1-s2
```

Add to the schema-migration chain, immediately after the existing `migratePodsSchema(_userRolesPool)` block (ep1-s1's):

```javascript
    // ep1-s2 — Auto-migrate pod_assignments schema.
    migratePodAssignmentsSchema(_userRolesPool).then(function() {
      console.log('[ep1-s2] pod_assignments schema ready');
    }).catch(function(err) { console.error('[ep1-s2] pod_assignments schema migration failed:', err.message); });
```

Add to the manual pathname dispatcher, immediately after the existing `POST /products/:id/features` branch (matching that route's own `requireNonViewer` + pool pattern exactly):

```javascript
  } else if (pathname.match(/^\/products\/[^/]+\/set-default-pod$/) && req.method === 'POST') {
    // ep1-s2 — assign a pod as a product's default team
    req.params = { id: pathname.split('/')[2] };
    authGuard(req, res, async () => {
      let _rnvOk = false;
      await requireNonViewer(req, res, () => { _rnvOk = true; });
      if (!_rnvOk) return;
      await handlePostSetDefaultPod(req, res, null, _pshPool);
    });

```

- [ ] **Step 4: Run test — must pass**

```bash
grep -n "handlePostSetDefaultPod\|migratePodAssignmentsSchema" src/web-ui/server.js
```

Expected output: 4 matches (2 requires, 1 schema-chain call, 1 route dispatch)

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing except the already-acknowledged `check-p3.5-validate-trace.js`

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/server.js
git commit -m "feat(ep1-s2): wire set-default-pod route and pod_assignments schema migration into server.js"
```

---

## Task 6: UI — "Pod & Team" section in the product view (no-refresh update)

**Files:**
- Modify: `src/web-ui/routes/products.js` (`_renderProductView` signature + template + `handleGetProductView`'s call site)

- [ ] **Step 1: Confirm currently absent**

```bash
grep -n "Pod & Team\|set-default-pod" src/web-ui/routes/products.js
```

Expected: no matches (only the Task 2/5 additions from earlier tasks, not the UI section)

- [ ] **Step 2: (no automated red step for this task — pure template/markup addition, verified by Task 7's E2E spec)**

- [ ] **Step 3: Write the implementation**

**3a.** Change `_renderProductView`'s signature to add ONE new trailing parameter (purely additive — every existing call site that doesn't pass it gets `undefined`, and the section below renders nothing when `defaultPod` is falsy, so none of the 19 existing tests depending on this function's signature are affected):

```javascript
// Change this line:
function _renderProductView(productName, productId, features, login, rollupRow, isSyncing, repoOwner, repoName, modules, csrfToken, featureModuleAssignments, artefactCountsByJourneyId, navProducts, noProductJourneyCount, repoPickerResult, isAdmin, sessionOriginByJourneyId) {
// to:
function _renderProductView(productName, productId, features, login, rollupRow, isSyncing, repoOwner, repoName, modules, csrfToken, featureModuleAssignments, artefactCountsByJourneyId, navProducts, noProductJourneyCount, repoPickerResult, isAdmin, sessionOriginByJourneyId, defaultPod) {
```

**3b.** Inside `_renderProductView`'s returned HTML template, add a new section. Find where other summary sections are concatenated into the page (near the top of the rendered body, alongside the product name/repo-status area — read the surrounding template structure first to match indentation/string-concatenation style exactly, then insert this block in the same style):

```javascript
  var podSectionHtml =
    '<div class="pod-team-section" id="pod-team-section">' +
      '<h3>Pod &amp; Team</h3>' +
      (defaultPod
        ? '<p id="default-pod-display">Default pod: ' + defaultPod.podName + ' (' + defaultPod.memberCount + ' members)</p>'
        : '<p id="default-pod-display">No default pod set.</p>') +
      '<button id="set-default-pod-btn" type="button">Set default pod</button>' +
      '<div id="set-default-pod-picker" style="display:none;">' +
        '<select id="default-pod-select" aria-label="Choose a pod"></select>' +
        '<button id="confirm-default-pod-btn" type="button">Confirm</button>' +
        '<button id="cancel-default-pod-btn" type="button">Cancel</button>' +
        '<p id="default-pod-error" style="display:none;color:#a4262c;"></p>' +
      '</div>' +
    '</div>';
```

Concatenate `podSectionHtml` into the function's returned `html` string, near the product name/header area (read the existing `html +=` or template-literal concatenation chain and add this in the same style, immediately after the product name/status header and before the features list section).

**3c.** Add a `<script>` block (or append to an existing inline script block if `_renderProductView` already emits one — check first) implementing the AJAX flow:

```javascript
  var podScriptHtml =
    '<script>' +
    '(function() {' +
      'var btn = document.getElementById("set-default-pod-btn");' +
      'var picker = document.getElementById("set-default-pod-picker");' +
      'var select = document.getElementById("default-pod-select");' +
      'var confirmBtn = document.getElementById("confirm-default-pod-btn");' +
      'var cancelBtn = document.getElementById("cancel-default-pod-btn");' +
      'var errorEl = document.getElementById("default-pod-error");' +
      'var displayEl = document.getElementById("default-pod-display");' +
      'btn.onclick = function() {' +
        'picker.style.display = "block";' +
        'errorEl.style.display = "none";' +
        'fetch("/api/pods").then(function(r) { return r.json(); }).then(function(data) {' +
          'select.innerHTML = "";' +
          '(data.pods || []).forEach(function(p) {' +
            'var opt = document.createElement("option");' +
            'opt.value = p.pod_id; opt.textContent = p.name;' +
            'select.appendChild(opt);' +
          '});' +
        '});' +
      '};' +
      'cancelBtn.onclick = function() { picker.style.display = "none"; };' +
      'confirmBtn.onclick = function() {' +
        'fetch("' + '/products/' + productId + '/set-default-pod", {' +
          'method: "POST",' +
          'headers: { "Content-Type": "application/json" },' +
          'body: JSON.stringify({ podId: select.value })' +
        '}).then(function(r) { return r.json().then(function(body) { return { status: r.status, body: body }; }); })' +
          '.then(function(result) {' +
            'if (result.status !== 200) {' +
              'errorEl.textContent = result.body.error;' +
              'errorEl.style.display = "block";' +
              'return;' +
            '}' +
            'displayEl.textContent = "Default pod: " + result.body.podName + " (" + result.body.memberCount + " members)";' +
            'picker.style.display = "none";' +
          '});' +
      '};' +
    '})();' +
    '</script>';
```

Concatenate `podScriptHtml` into the returned `html` string, near the end (immediately before the closing `</body>` or wherever the function's existing script blocks, if any, are placed — match the existing pattern).

**3d.** In `handleGetProductView`, in the non-JSON (`else`) branch, fetch the default pod and pass it as the new trailing argument to `_renderProductView`:

```javascript
// Immediately before the existing `var html = _renderProductView(...)` line, add:
    var defaultPod = await getProductDefaultPod(_pool, tenantId, productId);
// Then change the _renderProductView(...) call's argument list to add `, defaultPod` at the very end.
```

- [ ] **Step 4: Run full suite — no regressions**

```bash
npm test
```

Expected output: all 19 `_renderProductView`-dependent test files still pass unmodified (the new parameter is additive-only, defaulting to `undefined` → renders "No default pod set." when omitted) — all tests passing except the already-acknowledged `check-p3.5-validate-trace.js`

- [ ] **Step 5: Commit**

```bash
git add src/web-ui/routes/products.js
git commit -m "feat(ep1-s2): Pod & Team section in product view with no-refresh default-pod assignment"
```

---

## Task 7: E2E spec + fake-test-db.js extension

**Files:**
- Modify: `src/web-ui/adapters/fake-test-db.js`
- Create: `tests/e2e/ep1-s2-product-default-pod.spec.js`

- [ ] **Step 1: Write the failing test**

```javascript
// tests/e2e/ep1-s2-product-default-pod.spec.js
// @mocked
const { expect } = require('@playwright/test');
const { withAuth } = require('./fixtures/auth');

withAuth('ep1-s2 AC1: set a product default pod, UI updates without page refresh', async ({ page }) => {
  // Setup: create a real product and a real pod through the app's own
  // existing flows first (not a DB fixture) -- exercises the real handlers.
  await page.goto('/products/new');
  await page.fill('#product-name-input, input[name="name"]', 'Payments E2E Test');
  await page.click('#create-product-btn, button[type="submit"]');
  await page.waitForURL(/\/products\/[^/]+$/);
  const productUrl = page.url();

  await page.goto('/admin/pods/manager');
  await page.click('#create-pod-btn');
  await page.fill('#pod-name-input', 'Default Pod E2E Test');
  await page.locator('.roster-row', { hasText: 'Hamish' }).getByRole('button', { name: 'Add' }).click();
  await page.click('#save-pod-btn');
  await expect(page.locator('#success-banner')).toBeVisible();

  // A marker element to prove no full page reload happened.
  await page.evaluate(function() { window.__ep1s2NoReloadMarker = true; });

  await page.goto(productUrl);
  await page.click('#set-default-pod-btn');
  await page.locator('#default-pod-select').selectOption({ label: 'Default Pod E2E Test' });
  await page.click('#confirm-default-pod-btn');

  await expect(page.locator('#default-pod-display')).toContainText('Default pod: Default Pod E2E Test');
  const markerSurvived = await page.evaluate(function() { return window.__ep1s2NoReloadMarker === true; });
  expect(markerSurvived).toBe(true); // proves no full page reload occurred
});

withAuth('ep1-s2 AC3: existing product data is unaffected by setting a default pod', async ({ page }) => {
  await page.goto('/products/new');
  await page.fill('#product-name-input, input[name="name"]', 'Payments AC3 E2E Test');
  await page.click('#create-product-btn, button[type="submit"]');
  await page.waitForURL(/\/products\/[^/]+$/);
  const productUrl = page.url();

  await page.goto('/admin/pods/manager');
  await page.click('#create-pod-btn');
  await page.fill('#pod-name-input', 'AC3 Pod E2E Test');
  await page.locator('.roster-row', { hasText: 'Hamish' }).getByRole('button', { name: 'Add' }).click();
  await page.click('#save-pod-btn');

  await page.goto(productUrl);
  await expect(page.locator('#default-pod-display')).toContainText('No default pod set.');
  await page.click('#set-default-pod-btn');
  await page.locator('#default-pod-select').selectOption({ label: 'AC3 Pod E2E Test' });
  await page.click('#confirm-default-pod-btn');
  await expect(page.locator('#default-pod-display')).toContainText('AC3 Pod E2E Test');

  // Reload and confirm the assignment persisted (server-rendered path also works, not just the AJAX path).
  await page.reload();
  await expect(page.locator('#default-pod-display')).toContainText('AC3 Pod E2E Test');
});
```

Note: this test's product-creation selectors (`#product-name-input, input[name="name"]`, `#create-product-btn, button[type="submit"]`) use a fallback pattern since the exact selectors on `/products/new` were not verified against the live template during planning — if the implementer finds the real selectors differ, update them to match, but keep the test's structure and assertions intact.

- [ ] **Step 2: Run test — must fail**

```bash
npx playwright test tests/e2e/ep1-s2-product-default-pod.spec.js
```

Expected: fails — `fake-test-db.js` has no `pod_assignments` branch yet, so `POST /products/:id/set-default-pod` throws against the fake pool; also confirm the real product-creation/pod-creation selectors work first (fix selectors in this step if the fallback pattern above doesn't match reality) before moving to Step 3.

- [ ] **Step 3: Write the implementation**

Add to `src/web-ui/adapters/fake-test-db.js`, alongside the existing `pods`/`podMembers` arrays:

```javascript
  var podAssignments = [];  // { assignment_id, tenant_id, pod_id, product_id, feature_id, assignment_type, assigned_by, assigned_at } -- ep1-s2
```

Add narrow query branches, near the existing pods/pod_members branches:

```javascript
      if (s.indexOf('CREATE UNIQUE INDEX IF NOT EXISTS POD_ASSIGNMENTS_PRODUCT_DEFAULT_UQ') === 0) {
        return { rows: [] }; // ep1-s2 index bootstrap -- no-op
      }
      if (s.indexOf('SELECT POD_ID, TENANT_ID FROM PODS WHERE POD_ID') === 0) {
        var [checkPodId, checkTenantId] = params;
        return { rows: pods.filter(function(p) { return p.pod_id === checkPodId && p.tenant_id === checkTenantId; }) };
      }
      if (s.indexOf('SELECT COUNT(*) AS COUNT FROM POD_MEMBERS') === 0) {
        var [countPodId] = params;
        return { rows: [{ count: String(podMembers.filter(function(m) { return m.pod_id === countPodId; }).length) }] };
      }
      if (s.indexOf('SELECT POD_ID, NAME FROM PODS WHERE POD_ID') === 0) {
        var [namePodId] = params;
        var nameRow = pods.find(function(p) { return p.pod_id === namePodId; });
        return { rows: nameRow ? [{ pod_id: nameRow.pod_id, name: nameRow.name }] : [] };
      }
      if (s.indexOf('INSERT INTO POD_ASSIGNMENTS') === 0) {
        var [asgId, asgTenantId, asgPodId, asgProductId, asgType, asgBy] = params;
        var existingIdx = podAssignments.findIndex(function(a) { return a.tenant_id === asgTenantId && a.product_id === asgProductId && a.feature_id === null; });
        var row = { assignment_id: asgId, tenant_id: asgTenantId, pod_id: asgPodId, product_id: asgProductId, feature_id: null, assignment_type: asgType, assigned_by: asgBy, assigned_at: new Date().toISOString() };
        if (existingIdx !== -1) { podAssignments[existingIdx] = row; } else { podAssignments.push(row); }
        return { rows: [] };
      }
      if (s.indexOf('SELECT PA.POD_ID, P.NAME FROM POD_ASSIGNMENTS') === 0) {
        var [getTenantId, getProductId] = params;
        var asgRow = podAssignments.find(function(a) { return a.tenant_id === getTenantId && a.product_id === getProductId && a.feature_id === null; });
        if (!asgRow) return { rows: [] };
        var asgPod = pods.find(function(p) { return p.pod_id === asgRow.pod_id; });
        return { rows: asgPod ? [{ pod_id: asgPod.pod_id, name: asgPod.name }] : [] };
      }
```

Also check whether a `SELECT product_id, tenant_id FROM products WHERE product_id` branch already exists (Task 2's handler needs it) — if `fake-test-db.js` doesn't already support this exact query shape for the existing `/products/new`+`/products/:id` flow, add a narrow branch for it too, matching whatever shape the real product-creation flow already uses (read `fake-test-db.js`'s existing `products` array handling first — it almost certainly already exists, since `/products/new` is a pre-existing, already-tested flow).

Update the file's `_reset()` function to clear `podAssignments = [];` alongside the existing `pods = []; podMembers = [];` reset lines.

- [ ] **Step 4: Run test — must pass**

```bash
npx playwright test tests/e2e/ep1-s2-product-default-pod.spec.js
```

Expected output: 2 passed

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing except the already-acknowledged `check-p3.5-validate-trace.js`

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/adapters/fake-test-db.js tests/e2e/ep1-s2-product-default-pod.spec.js
git commit -m "test(ep1-s2): E2E Playwright spec + fake-test-db.js pod_assignments support"
```

---

## NFR coverage (from test plan — no separate tasks, covered by tasks above)

- **NFR-Perf-1 (latency ≤2s):** not automated (same class of gap as ep1-s1's own NFR-Perf-1 — RISK-ACCEPT expected at `/definition-of-done` if not separately measured live)
- **NFR-UI-1 (visibility without refresh):** covered by Task 7's E2E marker-survival assertion
- **NFR-Data-1 (feature inheritance consistency):** NOT covered by this plan — this NFR describes ep1-s3's own scope (feature creation consuming the default), consistent with the AC2 scope correction above

## Out of scope (from DoR + scope-correction decision — do not implement)

- Changing/updating a product's default pod after features already exist (deferred to Epic 4)
- Unassigning a product's default pod (deferred)
- Pod creation (ep1-s1's scope)
- Feature-creation-time pod inheritance itself (ep1-s3's scope — this plan only proves the precondition ep1-s3 will consume)
