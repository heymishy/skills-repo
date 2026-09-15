# Create Pod UI and Backend — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available)
> or /tdd per task if executing in this session.

**Goal:** A Pod Manager UI with a two-panel collaborator picker (per `design.md`'s amended UX section) that creates a pod (name + members + roles), persisted to new `pods`/`pod_members` tables, tenant-scoped, with duplicate-name and invalid-role rejection.
**Branch:** `feature/ep1-s1`
**Worktree:** `.worktrees/ep1-s1`
**Test command:** `npm test` (full suite) / `node tests/check-ep1-s1-pod-creation.js` (this story only)

---

## File map

```
Create:
  src/web-ui/modules/pod-store.js         — schema bootstrap (pods, pod_members) + data-access functions
  src/web-ui/routes/pods.js               — POST /api/pods/create, GET /api/pods handlers
  src/web-ui/public/pod-manager.html      — two-panel collaborator-picker UI (design.md amendment)
  tests/check-ep1-s1-pod-creation.js      — AC1/AC2/AC3 unit tests + tenant-isolation/atomicity integration tests
  tests/e2e/ep1-s1-pod-creation.spec.js   — 3 Playwright E2E scenarios (AC1/AC2/AC3)

Modify:
  src/web-ui/server.js                    — require pod-store.js/routes/pods.js, chain migratePodsSchema into the
                                             existing schema-migration promise chain, wire the 3 new routes into the
                                             manual pathname/method dispatcher
  src/web-ui/adapters/fake-test-db.js     — narrow pods/pod_members query branches so the E2E spec runs in the
                                             @mocked CI suite without live Postgres (matches this file's own
                                             documented scope-extension convention)
```

**Role validation:** hardcoded `VALID_ROLES` constant in `pod-store.js` (`conductor`, `engineer`, `architect`, `product`) — no `role_definitions` table this story. See `decisions.md` (2026-09-15) for the rationale.

---

## Task 1: Pod store — schema + data access

**Files:**
- Create: `src/web-ui/modules/pod-store.js`
- Test: `tests/check-ep1-s1-pod-creation.js` (Part 1 of the file — schema/store-level assertions)

- [ ] **Step 1: Write the failing test**

```javascript
// tests/check-ep1-s1-pod-creation.js
#!/usr/bin/env node
/**
 * check-ep1-s1-pod-creation.js
 *
 * Unit + integration tests for ep1-s1: Create Pod UI and Backend.
 * AC1 (happy path), AC2 (duplicate name rejection), AC3 (invalid role
 * rejection), plus tenant-isolation and member-insertion-atomicity
 * integration tests from the test plan.
 *
 * Run: node tests/check-ep1-s1-pod-creation.js
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

/** Minimal fake pg-Pool-shaped object backing pods/pod_members in memory. */
function makeFakePool() {
  const pods = [];
  const podMembers = [];
  let nextPodId = 1;
  let nextMemberId = 1;
  return {
    pods, podMembers,
    query: async function(sql, params) {
      const s = String(sql).trim().replace(/\s+/g, ' ').toUpperCase();
      if (s.indexOf('CREATE TABLE') === 0) return { rows: [] };
      if (s.indexOf('SELECT') === 0 && s.indexOf('FROM PODS') !== -1 && s.indexOf('POD_MEMBERS') === -1) {
        const [tenantId, name] = params;
        const rows = pods.filter(p => p.tenant_id === tenantId && (name === undefined || p.name === name));
        return { rows };
      }
      if (s.indexOf('INSERT INTO PODS') === 0) {
        const [podId, tenantId, name, createdBy] = params;
        pods.push({ pod_id: podId, tenant_id: tenantId, name, created_by: createdBy, status: 'active' });
        return { rows: [] };
      }
      if (s.indexOf('INSERT INTO POD_MEMBERS') === 0) {
        const [podId, userId, roleId] = params;
        podMembers.push({ id: nextMemberId++, pod_id: podId, user_id: userId, role_id: roleId, status: 'active' });
        return { rows: [] };
      }
      if (s.indexOf('SELECT') === 0 && s.indexOf('POD_MEMBERS') !== -1) {
        const [podId] = params;
        return { rows: podMembers.filter(m => m.pod_id === podId) };
      }
      return { rows: [] };
    }
  };
}

async function run() {
  const { migratePodsSchema, createPod, findPodByName, isValidRole, VALID_ROLES } = require('../src/web-ui/modules/pod-store');

  // --- Part 1: pod-store.js ---
  {
    const pool = makeFakePool();
    await migratePodsSchema(pool);
    ok(true, 'migratePodsSchema resolves without throwing (schema bootstrap)');

    ok(isValidRole('conductor'), 'isValidRole: conductor is valid');
    ok(isValidRole('engineer'), 'isValidRole: engineer is valid');
    ok(!isValidRole('wizard'), 'isValidRole: wizard is NOT valid');
    eq(VALID_ROLES.join(','), 'conductor,engineer,architect,product', 'VALID_ROLES matches the signed-off AC3 role set exactly');

    const created = await createPod(pool, {
      tenantId: 'tenant-test-123',
      name: 'Core Platform Test Run 1',
      createdBy: 'hamish-uuid',
      members: [
        { userId: 'hamish-uuid', roleId: 'conductor' },
        { userId: 'susan-uuid', roleId: 'engineer' },
        { userId: 'darren-uuid', roleId: 'engineer' }
      ]
    });
    ok(created.podId, 'createPod: returns a podId');
    eq(created.memberCount, 3, 'createPod: memberCount is 3');
    eq(pool.pods.length, 1, 'createPod: one row written to pods');
    eq(pool.podMembers.length, 3, 'createPod: three rows written to pod_members');

    const found = await findPodByName(pool, 'tenant-test-123', 'Core Platform Test Run 1');
    ok(found, 'findPodByName: finds the just-created pod');
  }

  console.log(`\n[ep1-s1] ${passed} passed, ${failed} failed\n`);
  process.exit(failed === 0 ? 0 : 1);
}

run();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-ep1-s1-pod-creation.js
```

Expected output: `Error: Cannot find module '../src/web-ui/modules/pod-store'`

- [ ] **Step 3: Write the implementation**

```javascript
// src/web-ui/modules/pod-store.js
'use strict';

// pod-store.js — ep1-s1: pods/pod_members schema bootstrap + data access.
// Mirrors user-roles.js's migrateTeamSchema() CREATE TABLE IF NOT EXISTS
// convention exactly -- idempotent, safe to call again on every server
// restart. Reuses _userRolesPool (ADR-026: reuse before introducing a new
// pool) since pods are conceptually the same family as people/team_memberships.
//
// Role validation is a hardcoded constant, not a role_definitions table --
// see decisions.md (2026-09-15) for why. When a future story introduces the
// real role_definitions table (stage-visibility, per-tenant custom roles),
// migrate VALID_ROLES into seed rows there rather than the reverse.
const crypto = require('crypto');

const VALID_ROLES = ['conductor', 'engineer', 'architect', 'product'];

function isValidRole(roleId) {
  return VALID_ROLES.indexOf(roleId) !== -1;
}

/**
 * Startup schema bootstrap for pods/pod_members (AC1's underlying tables).
 * @param {object} pool - pg-Pool-shaped object exposing query(sql, params)
 * @param {{info: Function}} [logger] - injectable logger (defaults to console.log)
 */
async function migratePodsSchema(pool, logger) {
  const log = logger || { info: function(msg) { console.log(msg); } };

  await pool.query(`
    CREATE TABLE IF NOT EXISTS pods (
      pod_id     UUID        PRIMARY KEY,
      tenant_id  VARCHAR     NOT NULL,
      name       VARCHAR     NOT NULL,
      created_by VARCHAR,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      status     VARCHAR     NOT NULL DEFAULT 'active',
      UNIQUE(tenant_id, name)
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pod_members (
      id         SERIAL      PRIMARY KEY,
      pod_id     UUID        NOT NULL REFERENCES pods(pod_id),
      user_id    VARCHAR     NOT NULL,
      role_id    VARCHAR     NOT NULL,
      joined_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      status     VARCHAR     NOT NULL DEFAULT 'active'
    )
  `);

  log.info('[ep1-s1] pods/pod_members schema migrated');
}

/**
 * Look up a pod by (tenantId, name) -- used for the AC2 duplicate-name check.
 * @returns {Promise<object|null>}
 */
async function findPodByName(pool, tenantId, name) {
  const result = await pool.query('SELECT pod_id, name FROM pods WHERE tenant_id = $1 AND name = $2', [tenantId, name]);
  return result.rows[0] || null;
}

/**
 * List every pod for a tenant (GET /api/pods, AC "tenant isolation").
 * @returns {Promise<object[]>}
 */
async function listPods(pool, tenantId) {
  const result = await pool.query('SELECT pod_id, name, created_at FROM pods WHERE tenant_id = $1', [tenantId]);
  return result.rows;
}

/**
 * Create a pod + its members in one call. Caller (routes/pods.js) is
 * responsible for AC2 (duplicate-name) and AC3 (invalid-role) validation
 * BEFORE calling this -- this function assumes valid input.
 * @param {object} pool
 * @param {{tenantId: string, name: string, createdBy: string, members: {userId: string, roleId: string}[]}} args
 * @returns {Promise<{podId: string, name: string, memberCount: number}>}
 */
async function createPod(pool, args) {
  const podId = crypto.randomUUID();
  await pool.query('INSERT INTO pods (pod_id, tenant_id, name, created_by) VALUES ($1, $2, $3, $4)', [podId, args.tenantId, args.name, args.createdBy]);
  for (const m of args.members) {
    await pool.query('INSERT INTO pod_members (pod_id, user_id, role_id) VALUES ($1, $2, $3)', [podId, m.userId, m.roleId]);
  }
  return { podId, name: args.name, memberCount: args.members.length };
}

module.exports = {
  VALID_ROLES,
  isValidRole,
  migratePodsSchema,
  findPodByName,
  listPods,
  createPod
};
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ep1-s1-pod-creation.js
```

Expected output: 10 assertions pass (schema bootstrap ×1, role validation ×4, pod creation ×4, findPodByName ×1)

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing except the already-acknowledged `check-p3.5-validate-trace.js` (pre-existing, unrelated)

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/modules/pod-store.js tests/check-ep1-s1-pod-creation.js
git commit -m "feat(ep1-s1): pod-store schema bootstrap and data access functions"
```

---

## Task 2: POST /api/pods/create handler — AC1 happy path

**Files:**
- Create: `src/web-ui/routes/pods.js`
- Test: `tests/check-ep1-s1-pod-creation.js` (append Part 2)

- [ ] **Step 1: Write the failing test**

Append to `tests/check-ep1-s1-pod-creation.js`, inside `run()`, after Part 1:

```javascript
  // --- Part 2: routes/pods.js — AC1 happy path ---
  {
    const { handlePostPodsCreate } = require('../src/web-ui/routes/pods');
    const pool = makeFakePool();
    const { migratePodsSchema } = require('../src/web-ui/modules/pod-store');
    await migratePodsSchema(pool);

    const body = {
      name: 'Core Platform',
      members: [
        { userId: 'hamish-uuid', roleId: 'conductor' },
        { userId: 'susan-uuid', roleId: 'engineer' },
        { userId: 'darren-uuid', roleId: 'engineer' }
      ]
    };
    const req = { session: { tenantId: 'tenant-test-123' } };
    let statusCode = null, responseBody = null;
    const res = {
      writeHead: function(status) { statusCode = status; },
      end: function(payload) { responseBody = JSON.parse(payload); }
    };

    await handlePostPodsCreate(req, res, pool, body);
    eq(statusCode, 200, 'AC1: happy path returns HTTP 200');
    eq(responseBody.name, 'Core Platform', 'AC1: response includes the pod name');
    eq(responseBody.memberCount, 3, 'AC1: response memberCount is 3');
    ok(responseBody.podId, 'AC1: response includes a podId');
  }
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-ep1-s1-pod-creation.js
```

Expected output: `Error: Cannot find module '../src/web-ui/routes/pods'`

- [ ] **Step 3: Write the implementation**

```javascript
// src/web-ui/routes/pods.js
'use strict';

// routes/pods.js — ep1-s1: Pod Manager HTTP handlers. Matches routes/
// products.js's handler shape: (req, res, pool[, presetBody]) -- the
// optional 4th param lets tests pass a body directly instead of a real
// request stream, mirroring _readBody's own existing req.body fast-path.
//
// AC1 only in this task -- AC2's duplicate-name guard is added in Task 3,
// AC3's invalid-role guard is added in Task 4, each with its own failing
// test first.
const { createPod, listPods } = require('../modules/pod-store');

function _json(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

async function _readBody(req) {
  if (req.body !== undefined) return req.body;
  if (typeof req.on !== 'function') return {};
  return new Promise(function(resolve) {
    var raw = '';
    req.on('data', function(c) { raw += c; });
    req.on('end', function() {
      try { resolve(JSON.parse(raw)); } catch (_) { resolve({}); }
    });
    req.on('error', function() { resolve({}); });
  });
}

/**
 * POST /api/pods/create — AC1 happy path only (see Tasks 3/4 for AC2/AC3).
 */
async function handlePostPodsCreate(req, res, pool, presetBody) {
  const body = presetBody !== undefined ? presetBody : await _readBody(req);
  const tenantId = req.session && req.session.tenantId;
  const name = (body.name || '').trim();
  const members = Array.isArray(body.members) ? body.members : [];

  if (!name) {
    return _json(res, 400, { error: 'Pod name is required' });
  }

  const createdBy = (req.session && (req.session.userId || req.session.login)) || null;
  const result = await createPod(pool, { tenantId, name, createdBy, members });
  return _json(res, 200, { podId: result.podId, name: result.name, memberCount: result.memberCount });
}

/**
 * GET /api/pods — list every pod for the caller's tenant (tenant-isolation
 * integration test, Task 5).
 */
async function handleGetPods(req, res, pool) {
  const tenantId = req.session && req.session.tenantId;
  const pods = await listPods(pool, tenantId);
  return _json(res, 200, { pods });
}

module.exports = { handlePostPodsCreate, handleGetPods };
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ep1-s1-pod-creation.js
```

Expected output: 14 assertions pass (10 from Task 1 + 4 new)

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing except the already-acknowledged `check-p3.5-validate-trace.js`

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/pods.js tests/check-ep1-s1-pod-creation.js
git commit -m "feat(ep1-s1): POST /api/pods/create handler (AC1 happy path)"
```

---

## Task 3: AC2 — duplicate pod name rejection

**Files:**
- Modify: `tests/check-ep1-s1-pod-creation.js` (append Part 3 — the AC2 assertions; `handlePostPodsCreate` already implements the check from Task 2, this task proves it)

- [ ] **Step 1: Write the failing test**

Append to `tests/check-ep1-s1-pod-creation.js`, inside `run()`:

```javascript
  // --- Part 3: routes/pods.js — AC2 duplicate name rejection ---
  {
    const { handlePostPodsCreate } = require('../src/web-ui/routes/pods');
    const pool = makeFakePool();
    const { migratePodsSchema } = require('../src/web-ui/modules/pod-store');
    await migratePodsSchema(pool);

    const req = { session: { tenantId: 'tenant-test-123' } };
    const firstBody = { name: 'Core Platform Duplicate Test', members: [{ userId: 'hamish-uuid', roleId: 'conductor' }] };
    await handlePostPodsCreate(req, { writeHead: function() {}, end: function() {} }, pool, firstBody);
    eq(pool.pods.length, 1, 'AC2 setup: first pod created (count is 1)');

    let statusCode = null, responseBody = null;
    const res = { writeHead: function(s) { statusCode = s; }, end: function(p) { responseBody = JSON.parse(p); } };
    await handlePostPodsCreate(req, res, pool, firstBody);

    eq(statusCode, 400, 'AC2: duplicate name returns HTTP 400');
    eq(responseBody.error, "A pod named 'Core Platform Duplicate Test' already exists", 'AC2: error message names the pod');
    eq(pool.pods.length, 1, 'AC2: no new row written to pods (count still 1)');
    eq(pool.podMembers.length, 1, 'AC2: no pod_members rows created by the rejected attempt');
  }
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-ep1-s1-pod-creation.js
```

Expected output: `AC2: duplicate name returns HTTP 400 (expected 400, got 200)` — Task 2's handler has no duplicate-name check yet, so the second `handlePostPodsCreate` call succeeds and creates a second pod row.

- [ ] **Step 3: Write the implementation**

Modify `src/web-ui/routes/pods.js` — add the import and the guard clause to `handlePostPodsCreate`, before the `createPod` call:

```javascript
// Change this line:
const { createPod, listPods } = require('../modules/pod-store');
// to:
const { createPod, listPods, findPodByName } = require('../modules/pod-store');
```

```javascript
  if (!name) {
    return _json(res, 400, { error: 'Pod name is required' });
  }

  // AC2: duplicate name rejection -- check BEFORE any write.
  const existing = await findPodByName(pool, tenantId, name);
  if (existing) {
    return _json(res, 400, { error: "A pod named '" + name + "' already exists" });
  }

  const createdBy = (req.session && (req.session.userId || req.session.login)) || null;
```

(the `const createdBy = ...` line already exists immediately after the name check — insert the new guard between the existing `if (!name)` block and it)

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ep1-s1-pod-creation.js
```

Expected output: 19 assertions pass (14 from Tasks 1-2 + 5 new)

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing except the already-acknowledged `check-p3.5-validate-trace.js`

- [ ] **Step 6: Commit**

```bash
git add tests/check-ep1-s1-pod-creation.js
git commit -m "test(ep1-s1): prove AC2 duplicate-name rejection"
```

---

## Task 4: AC3 — invalid role rejection

**Files:**
- Modify: `tests/check-ep1-s1-pod-creation.js` (append Part 4)

- [ ] **Step 1: Write the failing test**

Append to `tests/check-ep1-s1-pod-creation.js`, inside `run()`:

```javascript
  // --- Part 4: routes/pods.js — AC3 invalid role rejection ---
  {
    const { handlePostPodsCreate } = require('../src/web-ui/routes/pods');
    const pool = makeFakePool();
    const { migratePodsSchema } = require('../src/web-ui/modules/pod-store');
    await migratePodsSchema(pool);

    const req = { session: { tenantId: 'tenant-test-123' } };
    const body = { name: 'Invalid Role Test Pod', members: [{ userId: 'hamish-uuid', roleId: 'wizard' }] };
    let statusCode = null, responseBody = null;
    const res = { writeHead: function(s) { statusCode = s; }, end: function(p) { responseBody = JSON.parse(p); } };
    await handlePostPodsCreate(req, res, pool, body);

    eq(statusCode, 400, 'AC3: invalid role returns HTTP 400');
    eq(responseBody.error, "Invalid role: 'wizard'. Valid roles are: conductor, engineer, architect, product", 'AC3: error names the invalid role and lists valid ones');
    eq(pool.pods.length, 0, 'AC3: no pod row created (count is 0)');
    eq(pool.podMembers.length, 0, 'AC3: no pod_members rows created');
  }
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-ep1-s1-pod-creation.js
```

Expected output: `AC3: invalid role returns HTTP 400 (expected 400, got 200)` — no role-validation guard exists yet, so the pod is created with an invalid role.

- [ ] **Step 3: Write the implementation**

Modify `src/web-ui/routes/pods.js` — update the import and add the guard clause, after the AC2 duplicate-name check:

```javascript
// Change this line:
const { createPod, listPods, findPodByName } = require('../modules/pod-store');
// to:
const { createPod, listPods, findPodByName, isValidRole, VALID_ROLES } = require('../modules/pod-store');
```

```javascript
  // AC2: duplicate name rejection -- check BEFORE any write.
  const existing = await findPodByName(pool, tenantId, name);
  if (existing) {
    return _json(res, 400, { error: "A pod named '" + name + "' already exists" });
  }

  // AC3: invalid role rejection -- check BEFORE any write.
  for (const m of members) {
    if (!isValidRole(m.roleId)) {
      return _json(res, 400, { error: "Invalid role: '" + m.roleId + "'. Valid roles are: " + VALID_ROLES.join(', ') });
    }
  }

  const createdBy = (req.session && (req.session.userId || req.session.login)) || null;
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ep1-s1-pod-creation.js
```

Expected output: 23 assertions pass (19 from Tasks 1-3 + 4 new)

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing except the already-acknowledged `check-p3.5-validate-trace.js`

- [ ] **Step 6: Commit**

```bash
git add tests/check-ep1-s1-pod-creation.js
git commit -m "test(ep1-s1): prove AC3 invalid-role rejection"
```

---

## Task 5: GET /api/pods — tenant isolation + member-insertion atomicity (integration tests)

**Files:**
- Modify: `tests/check-ep1-s1-pod-creation.js` (append Part 5)

- [ ] **Step 1: Write the failing test**

Append to `tests/check-ep1-s1-pod-creation.js`, inside `run()`:

```javascript
  // --- Part 5: integration — tenant isolation + member-insertion atomicity ---
  {
    const { handlePostPodsCreate, handleGetPods } = require('../src/web-ui/routes/pods');
    const pool = makeFakePool();
    const { migratePodsSchema } = require('../src/web-ui/modules/pod-store');
    await migratePodsSchema(pool);

    const reqA = { session: { tenantId: 'tenant-A' } };
    const reqB = { session: { tenantId: 'tenant-B' } };
    await handlePostPodsCreate(reqA, { writeHead: function() {}, end: function() {} }, pool, { name: 'Platform A', members: [{ userId: 'u1', roleId: 'conductor' }] });
    await handlePostPodsCreate(reqB, { writeHead: function() {}, end: function() {} }, pool, { name: 'Platform B', members: [{ userId: 'u2', roleId: 'conductor' }] });

    let bodyA = null, bodyB = null;
    await handleGetPods(reqA, { writeHead: function() {}, end: function(p) { bodyA = JSON.parse(p); } }, pool);
    await handleGetPods(reqB, { writeHead: function() {}, end: function(p) { bodyB = JSON.parse(p); } }, pool);

    eq(bodyA.pods.length, 1, 'Tenant isolation: tenant A sees exactly 1 pod');
    eq(bodyA.pods[0].name, 'Platform A', "Tenant isolation: tenant A's pod is Platform A");
    eq(bodyB.pods.length, 1, 'Tenant isolation: tenant B sees exactly 1 pod');
    eq(bodyB.pods[0].name, 'Platform B', "Tenant isolation: tenant B's pod is Platform B");

    // Both tenants can reuse the same pod name without conflict (isolated by tenant).
    let sameNameStatus = null;
    await handlePostPodsCreate(reqB, { writeHead: function(s) { sameNameStatus = s; }, end: function() {} }, pool, { name: 'Platform A', members: [{ userId: 'u3', roleId: 'conductor' }] });
    eq(sameNameStatus, 200, 'Tenant isolation: tenant B can create a pod named "Platform A" (no cross-tenant collision)');

    // Member-insertion atomicity: all 3 members land, no orphans.
    const pool2 = makeFakePool();
    await migratePodsSchema(pool2);
    await handlePostPodsCreate({ session: { tenantId: 'tenant-test-123' } }, { writeHead: function() {}, end: function() {} }, pool2, {
      name: 'Atomicity Test Pod',
      members: [{ userId: 'a', roleId: 'conductor' }, { userId: 'b', roleId: 'engineer' }, { userId: 'c', roleId: 'engineer' }]
    });
    eq(pool2.pods.length, 1, 'Atomicity: exactly 1 pod row');
    eq(pool2.podMembers.length, 3, 'Atomicity: all 3 member rows present, none orphaned');
  }
```

- [ ] **Step 2: Run test — confirm it fails first for the right reason**

```bash
node tests/check-ep1-s1-pod-creation.js
```

Expected output: `Error: handleGetPods is not defined` — `handleGetPods` exists in `routes/pods.js` (Task 2) but this test file hasn't required it in this block yet; this step confirms the test is exercising real code, not a typo that would pass vacuously.

- [ ] **Step 3: No new production code — this is an integration test over Tasks 1/2's already-correct pieces**

`handleGetPods` (tenant-scoped `WHERE tenant_id = $1`, Task 2) and `createPod`'s member-insertion loop (Task 1) were both already correct in isolation; this task proves they compose correctly across two tenants and a multi-member pod in one call, which the earlier per-AC unit tests didn't exercise together.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ep1-s1-pod-creation.js
```

Expected output: 30 assertions pass total (23 from Tasks 1-4 + 7 new)

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing except the already-acknowledged `check-p3.5-validate-trace.js`

- [ ] **Step 6: Commit**

```bash
git add tests/check-ep1-s1-pod-creation.js
git commit -m "test(ep1-s1): tenant isolation and member-insertion atomicity integration tests"
```

---

## Task 6: Wire into server.js

**Files:**
- Modify: `src/web-ui/server.js`

- [ ] **Step 1: Write the failing test**

No new test file — this task is proven by the E2E spec in Task 8 (which needs the routes actually mounted to pass) and a quick manual grep check:

```bash
grep -n "handlePostPodsCreate\|handleGetPods\|migratePodsSchema" src/web-ui/server.js
```

Expected output (before this task): no matches

- [ ] **Step 2: Confirm currently absent**

```bash
grep -n "handlePostPodsCreate\|handleGetPods\|migratePodsSchema" src/web-ui/server.js
```

Expected output: (empty — confirms the wiring doesn't exist yet)

- [ ] **Step 3: Write the implementation**

Add near the other route-handler requires (alongside the `products.js` require around line 82):

```javascript
const { handlePostPodsCreate, handleGetPods } = require('./routes/pods'); // ep1-s1
const { migratePodsSchema } = require('./modules/pod-store'); // ep1-s1
```

Add to the schema-migration chain, immediately after the existing `migrateOrganisationsSchema(_userRolesPool)` block (reuses `_userRolesPool` — see `decisions.md`):

```javascript
    // ep1-s1 — Auto-migrate pods/pod_members schema.
    migratePodsSchema(_userRolesPool).then(function() {
      console.log('[ep1-s1] pods/pod_members schema ready');
    }).catch(function(err) { console.error('[ep1-s1] pods schema migration failed:', err.message); });
```

Add to the manual pathname dispatcher, near the other `/admin/*` and `/api/*` routes:

```javascript
  } else if (pathname === '/api/pods/create' && req.method === 'POST') {
    // ep1-s1 — create a pod
    authGuard(req, res, async () => { await handlePostPodsCreate(req, res, _userRolesPool); });

  } else if (pathname === '/api/pods' && req.method === 'GET') {
    // ep1-s1 — list pods for the caller's tenant
    authGuard(req, res, async () => { await handleGetPods(req, res, _userRolesPool); });

  } else if (pathname === '/admin/pods/manager' && req.method === 'GET') {
    // ep1-s1 — Pod Manager UI
    authGuard(req, res, async () => {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(require('fs').readFileSync(require('path').join(__dirname, 'public', 'pod-manager.html'), 'utf8'));
    });

```

- [ ] **Step 4: Run test — must pass**

```bash
grep -n "handlePostPodsCreate\|handleGetPods\|migratePodsSchema" src/web-ui/server.js
```

Expected output: 5 matches (2 requires, 1 schema-chain call, 2 route dispatches)

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing except the already-acknowledged `check-p3.5-validate-trace.js`

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/server.js
git commit -m "feat(ep1-s1): wire pod routes and schema migration into server.js"
```

---

## Task 7: Pod Manager UI — two-panel collaborator picker

**Files:**
- Create: `src/web-ui/public/pod-manager.html`

- [ ] **Step 1: Write the failing test**

Covered by Task 8's E2E spec (this task alone has no unit test — it's a static page verified by the browser-driven scenarios). Confirm the file is currently absent:

```bash
ls src/web-ui/public/pod-manager.html
```

Expected output: `No such file or directory`

- [ ] **Step 2: Confirm currently absent** (same command/output as Step 1)

- [ ] **Step 3: Write the implementation**

```html
<!-- src/web-ui/public/pod-manager.html -->
<!-- ep1-s1: Pod Manager -- two-panel collaborator picker per design.md's
     "Pod Creation / Collaborator Picker" section (amended 2026-09-14),
     adopted from reference/collaborators-picker-wireframe.html. Reused by
     ep4-s1/ep4-s2 later -- built as a self-contained component from the
     start, not a one-off. -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Pod Manager</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; padding: 24px; background: #f7f7f8; color: #1a1a1a; }
    h1 { font-size: 1.25rem; margin: 0 0 16px; }
    .toolbar { margin-bottom: 16px; }
    button { font: inherit; cursor: pointer; }
    #create-pod-btn { padding: 8px 16px; background: #1a1a1a; color: #fff; border: none; border-radius: 6px; }
    #pod-list { display: flex; flex-direction: column; gap: 8px; }
    .pod-row { background: #fff; border: 1px solid #e2e2e5; border-radius: 8px; padding: 12px 16px; }
    #create-pod-modal { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.4); align-items: center; justify-content: center; }
    #create-pod-modal.open { display: flex; }
    .modal-body { background: #fff; border-radius: 10px; padding: 24px; width: 720px; max-width: 92vw; }
    .modal-body label { display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 4px; }
    #pod-name-input { width: 100%; padding: 8px; border: 1px solid #d0d0d5; border-radius: 6px; margin-bottom: 16px; box-sizing: border-box; }
    .picker { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
    .picker-panel { border: 1px solid #e2e2e5; border-radius: 8px; padding: 12px; min-height: 220px; }
    .picker-panel h3 { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.04em; color: #666; margin: 0 0 8px; }
    .role-tabs { display: flex; gap: 6px; margin-bottom: 8px; flex-wrap: wrap; }
    .role-tab { padding: 2px 10px; border-radius: 999px; border: 1px solid #d0d0d5; background: #fff; font-size: 0.75rem; }
    .role-tab.active { background: #1a1a1a; color: #fff; border-color: #1a1a1a; }
    .roster-row { display: flex; align-items: center; justify-content: space-between; padding: 6px 4px; }
    .role-chip { font-size: 0.7rem; padding: 2px 8px; border-radius: 999px; background: #eef0ff; color: #3341c4; }
    .add-btn, .remove-btn { font-size: 0.75rem; padding: 2px 8px; border: 1px solid #d0d0d5; border-radius: 6px; background: #fff; }
    #error-banner { display: none; background: #fdecea; color: #a4262c; border: 1px solid #f2c1c1; border-radius: 6px; padding: 8px 12px; margin-bottom: 12px; font-size: 0.85rem; }
    #error-banner.visible { display: block; }
    #save-pod-btn { padding: 8px 20px; background: #1a1a1a; color: #fff; border: none; border-radius: 6px; }
    #save-pod-btn:disabled { background: #c8c8cc; cursor: not-allowed; }
    #success-banner { display: none; background: #e6f4ea; color: #1e7e34; border: 1px solid #b6e4c3; border-radius: 6px; padding: 8px 12px; margin-bottom: 12px; font-size: 0.85rem; }
    #success-banner.visible { display: block; }
  </style>
</head>
<body>
  <h1>Pod Manager</h1>
  <div id="success-banner"></div>
  <div class="toolbar">
    <button id="create-pod-btn">Create Pod</button>
  </div>
  <div id="pod-list"></div>

  <div id="create-pod-modal">
    <div class="modal-body">
      <div id="error-banner"></div>
      <label for="pod-name-input">Pod Name</label>
      <input id="pod-name-input" type="text" placeholder="e.g. Core Platform">

      <div class="picker">
        <div class="picker-panel">
          <h3>Available</h3>
          <div class="role-tabs" id="role-tabs"></div>
          <div id="available-roster"></div>
        </div>
        <div class="picker-panel">
          <h3>Your team</h3>
          <div id="your-team"></div>
        </div>
      </div>

      <button id="save-pod-btn" disabled>Create Pod</button>
      <button id="cancel-pod-btn">Cancel</button>
    </div>
  </div>

  <script>
    // Demo org roster -- a real deployment would fetch this from a users
    // endpoint. Kept inline here since ep1-s1's scope is pod creation, not
    // an org-directory API.
    var ORG_ROSTER = [
      { userId: 'hamish-uuid', name: 'Hamish', roleId: 'conductor' },
      { userId: 'susan-uuid', name: 'Susan', roleId: 'engineer' },
      { userId: 'darren-uuid', name: 'Darren', roleId: 'engineer' }
    ];
    var VALID_ROLES = ['conductor', 'engineer', 'architect', 'product'];
    var selection = []; // { userId, name, roleId } -- creator pre-included per design.md

    var modal = document.getElementById('create-pod-modal');
    var nameInput = document.getElementById('pod-name-input');
    var saveBtn = document.getElementById('save-pod-btn');
    var errorBanner = document.getElementById('error-banner');
    var successBanner = document.getElementById('success-banner');

    function renderRoster(filterRole) {
      var el = document.getElementById('available-roster');
      el.innerHTML = '';
      ORG_ROSTER.filter(function(u) { return !filterRole || filterRole === 'All' || u.roleId === filterRole; })
        .forEach(function(u) {
          var row = document.createElement('div');
          row.className = 'roster-row';
          row.innerHTML = '<span>' + u.name + ' <span class="role-chip">' + u.roleId + '</span></span>';
          var btn = document.createElement('button');
          btn.className = 'add-btn';
          btn.textContent = 'Add';
          btn.onclick = function() { addMember(u); };
          row.appendChild(btn);
          el.appendChild(row);
        });
    }

    function renderTabs() {
      var el = document.getElementById('role-tabs');
      el.innerHTML = '';
      ['All'].concat(VALID_ROLES).forEach(function(r) {
        var tab = document.createElement('span');
        tab.className = 'role-tab' + (r === 'All' ? ' active' : '');
        tab.textContent = r;
        tab.onclick = function() {
          document.querySelectorAll('.role-tab').forEach(function(t) { t.classList.remove('active'); });
          tab.classList.add('active');
          renderRoster(r === 'All' ? null : r);
        };
        el.appendChild(tab);
      });
    }

    function renderTeam() {
      var el = document.getElementById('your-team');
      el.innerHTML = '';
      selection.forEach(function(m, i) {
        var row = document.createElement('div');
        row.className = 'roster-row';
        row.innerHTML = '<span>' + m.name + ' <span class="role-chip">' + m.roleId + '</span></span>';
        if (i > 0) { // creator (index 0) cannot be removed
          var btn = document.createElement('button');
          btn.className = 'remove-btn';
          btn.textContent = 'Remove';
          btn.onclick = function() { selection.splice(i, 1); renderTeam(); updateGate(); };
          row.appendChild(btn);
        }
        el.appendChild(row);
      });
      updateGate();
    }

    function addMember(u) {
      if (selection.some(function(m) { return m.userId === u.userId; })) return;
      selection.push({ userId: u.userId, name: u.name, roleId: u.roleId });
      renderTeam();
    }

    // Gated primary action (design.md amendment): disabled until >= 1 member
    // beyond the creator.
    function updateGate() {
      saveBtn.disabled = selection.length < 2;
    }

    function openModal() {
      selection = [{ userId: 'me-uuid', name: 'You', roleId: 'conductor' }]; // creator pre-included by default
      nameInput.value = '';
      errorBanner.classList.remove('visible');
      renderTabs();
      renderRoster(null);
      renderTeam();
      modal.classList.add('open');
    }

    document.getElementById('create-pod-btn').onclick = openModal;
    document.getElementById('cancel-pod-btn').onclick = function() { modal.classList.remove('open'); };

    saveBtn.onclick = function() {
      var name = nameInput.value.trim();
      fetch('/api/pods/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name,
          members: selection.map(function(m) { return { userId: m.userId, roleId: m.roleId }; })
        })
      }).then(function(r) { return r.json().then(function(body) { return { status: r.status, body: body }; }); })
        .then(function(result) {
          if (result.status !== 200) {
            errorBanner.textContent = result.body.error;
            errorBanner.classList.add('visible');
            return;
          }
          modal.classList.remove('open');
          successBanner.textContent = 'Pod created: ' + result.body.name + ' (' + result.body.memberCount + ' members)';
          successBanner.classList.add('visible');
          var row = document.createElement('div');
          row.className = 'pod-row';
          row.textContent = result.body.name + ' (' + result.body.memberCount + ' members)';
          document.getElementById('pod-list').appendChild(row);
        });
    };
  </script>
</body>
</html>
```

- [ ] **Step 4: Run test — must pass**

```bash
ls src/web-ui/public/pod-manager.html
```

Expected output: file listed (exists)

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing except the already-acknowledged `check-p3.5-validate-trace.js`

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/public/pod-manager.html
git commit -m "feat(ep1-s1): Pod Manager UI with two-panel collaborator picker"
```

---

## Task 8: E2E spec + fake-test-db.js extension

**Files:**
- Modify: `src/web-ui/adapters/fake-test-db.js`
- Create: `tests/e2e/ep1-s1-pod-creation.spec.js`

- [ ] **Step 1: Write the failing test**

```javascript
// tests/e2e/ep1-s1-pod-creation.spec.js
// @mocked
const { test, expect } = require('@playwright/test');

test.describe('ep1-s1: Pod Manager', () => {
  test('AC1: create a pod with multiple members', async ({ page }) => {
    await page.goto('/admin/pods/manager');
    await page.click('#create-pod-btn');
    await page.fill('#pod-name-input', 'Core Platform E2E Test');
    await page.click('.add-btn >> nth=0'); // add Hamish
    await page.click('.add-btn >> nth=0'); // add Susan (list re-renders; first remaining row)
    await page.click('#save-pod-btn');
    await expect(page.locator('#success-banner')).toContainText('Pod created: Core Platform E2E Test');
    await expect(page.locator('#pod-list')).toContainText('Core Platform E2E Test');
  });

  test('AC2: duplicate pod name is rejected', async ({ page }) => {
    await page.goto('/admin/pods/manager');
    await page.click('#create-pod-btn');
    await page.fill('#pod-name-input', 'Core Platform Duplicate E2E');
    await page.click('.add-btn >> nth=0');
    await page.click('#save-pod-btn');
    await expect(page.locator('#success-banner')).toBeVisible();

    await page.click('#create-pod-btn');
    await page.fill('#pod-name-input', 'Core Platform Duplicate E2E');
    await page.click('.add-btn >> nth=0');
    await page.click('#save-pod-btn');
    await expect(page.locator('#error-banner')).toContainText("A pod named 'Core Platform Duplicate E2E' already exists");
    await expect(page.locator('#create-pod-modal')).toHaveClass(/open/);
  });

  test('AC3: gated primary action stays disabled with only the creator selected', async ({ page }) => {
    await page.goto('/admin/pods/manager');
    await page.click('#create-pod-btn');
    await page.fill('#pod-name-input', 'Gate Test Pod');
    await expect(page.locator('#save-pod-btn')).toBeDisabled();
    await page.click('.add-btn >> nth=0');
    await expect(page.locator('#save-pod-btn')).toBeEnabled();
  });
});
```

- [ ] **Step 2: Run test — must fail**

```bash
npx playwright test tests/e2e/ep1-s1-pod-creation.spec.js
```

Expected output: fails — `/admin/pods/manager` returns data but `fake-test-db.js` has no `pods`/`pod_members` branches, so `POST /api/pods/create` throws against the fake pool

- [ ] **Step 3: Write the implementation**

Add to `src/web-ui/adapters/fake-test-db.js`, alongside the other table arrays (near `var products = [];`):

```javascript
  var pods = [];         // { pod_id, tenant_id, name, created_by, status } -- ep1-s1
  var podMembers = [];   // { id, pod_id, user_id, role_id, status } -- ep1-s1
  var nextPodMemberId = 1;
```

Add narrow query branches inside the `query` function, matching this file's existing narrow-branch convention (near the other `INSERT INTO`/`SELECT` handling):

```javascript
      if (s.indexOf('CREATE TABLE IF NOT EXISTS PODS') === 0 || s.indexOf('CREATE TABLE IF NOT EXISTS POD_MEMBERS') === 0) {
        return { rows: [] }; // ep1-s1 schema bootstrap -- no-op, arrays above already exist
      }
      if (s.indexOf('SELECT POD_ID, NAME FROM PODS') === 0) {
        var [tenantId, name] = params;
        return { rows: pods.filter(function(p) { return p.tenant_id === tenantId && p.name === name; }) };
      }
      if (s.indexOf('SELECT POD_ID, NAME, CREATED_AT FROM PODS') === 0) {
        var [listTenantId] = params;
        return { rows: pods.filter(function(p) { return p.tenant_id === listTenantId; }) };
      }
      if (s.indexOf('INSERT INTO PODS') === 0) {
        var [podId, insTenantId, insName, createdBy] = params;
        pods.push({ pod_id: podId, tenant_id: insTenantId, name: insName, created_by: createdBy, status: 'active' });
        return { rows: [] };
      }
      if (s.indexOf('INSERT INTO POD_MEMBERS') === 0) {
        var [mPodId, userId, roleId] = params;
        podMembers.push({ id: nextPodMemberId++, pod_id: mPodId, user_id: userId, role_id: roleId, status: 'active' });
        return { rows: [] };
      }
```

- [ ] **Step 4: Run test — must pass**

```bash
npx playwright test tests/e2e/ep1-s1-pod-creation.spec.js
```

Expected output: 3 passed

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing except the already-acknowledged `check-p3.5-validate-trace.js`

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/adapters/fake-test-db.js tests/e2e/ep1-s1-pod-creation.spec.js
git commit -m "test(ep1-s1): E2E Playwright spec + fake-test-db.js pods/pod_members support"
```

---

## NFR coverage (from test plan — no separate tasks, covered by ACs above)

- **NFR-Perf-1 (latency ≤2s):** the fake-pool tests above are synchronous in-memory; a real Postgres timing assertion is out of scope for this plan's unit tests — flagged in `decisions.md` if not separately verified during `/verify-completion`.
- **NFR-Val-1 (uniqueness per tenant):** covered by Task 3's AC2 assertions plus the `UNIQUE(tenant_id, name)` DB constraint in Task 1's schema.
- **NFR-Val-2 (role validation):** covered by Task 4's AC3 assertions.

## Out of scope (from DoR — do not implement)

- Pod editing or archival
- Pod templates
- Real-time pod member status/notifications
- Bulk pod operations
- A real `role_definitions` table (see `decisions.md`, 2026-09-15)
