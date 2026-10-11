# Add a placeholder feature to a journey stage, triggering a new seeded discovery — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available)
> or /tdd per task if executing in this session.

**Goal:** Make every test in the test plan pass (7 tests: 3 unit, 3 integration, 1 NFR). Add `mapping_state` to `feature_customer_journey_stage_mappings`, a placeholder-feature creation route, and a trigger route that seeds a new `/discovery` session from the journey stage's own context.
**Branch:** `feature/jcx-s1`
**Worktree:** `.worktrees/jcx-s1`
**Test command:** `npm test` (full suite) / `node tests/check-jcx-s1-placeholder-feature.js` (this story's own tests)

---

## Architecture note (confirmed by direct source inspection, not assumed)

- `feature_customer_journey_stage_mappings` real schema (confirmed in `server.js` lines 586-594, matching `scripts/migrate-schema-journeys.js`): `id, journey_stage_id, journey_id, tenant_id, feature_slug, metric_keys, created_at` — no state column exists today. `handlePostFeatureMapping` (`journeys.js` line 265) writes real rows via an application-level check-then-write transaction (no unique constraint on `(journey_stage_id, feature_slug)`, confirmed by its own comment). `handleDeleteFeatureMapping` (line 354) shows the exact cross-tenant ownership-check pattern every new handler must replicate: `SELECT cjs.id FROM customer_journey_stages cjs JOIN customer_journeys cj ... WHERE cjs.id=$1 AND cjs.journey_id=$2 AND cj.tenant_id=$3`, 404 (not 403) if no row.
- Route wiring convention (confirmed in `server.js` lines 4060-4078): `pathname.match(/regex/) && req.method === 'X'` → set `req.params` from `pathname.split('/')` → `authGuard(req, res, async () => { requireNonViewer(...); await handler(...); })`. Every new route in this story MUST follow this exact shape.
- `server.js`'s own inline migration for this table (lines 575-600) is the ONLY place that actually runs against a deployed database (`scripts/migrate-schema-journeys.js` is excluded from the Docker image's own `COPY` allowlist — confirmed directly, and the exact cause of the `ic-hotfix1` production incident earlier this same session). The new `mapping_state` column MUST be added here, as an `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`, not only in the `scripts/` file.

---

## File map

```
Modify:
  src/web-ui/server.js            — add mapping_state column migration; wire 2 new routes
  src/web-ui/routes/journeys.js   — add handlePostPlaceholderFeature, handleTriggerPlaceholderFeature

Create:
  src/web-ui/adapters/discovery-seeder.js   — plain functions: create artefacts/ folder, seed discovery.md Section 1
  tests/check-jcx-s1-placeholder-feature.js — this story's own tests
```

---

## Task 1: `mapping_state` migration + placeholder-feature creation route

**Files:**
- Modify: `src/web-ui/server.js`
- Modify: `src/web-ui/routes/journeys.js`
- Create: `tests/check-jcx-s1-placeholder-feature.js`

- [ ] **Step 1: Write the failing tests**

```javascript
'use strict';
// check-jcx-s1-placeholder-feature.js -- TDD tests for jcx-s1 (Epic:
// journey-map-and-placeholder-trigger, 2026-10-11-journey-cx-redesign).
// Story: artefacts/2026-10-11-journey-cx-redesign/stories/jcx-s1.md
const assert = require('assert');
const path = require('path');

let passed = 0; let failed = 0;
function pass(name) { console.log(`  [PASS] ${name}`); passed++; }
function fail(name, err) { console.error(`  [FAIL] ${name}: ${err.message || err}`); failed++; }

function stageRow(id, extra) {
  return Object.assign({ id, name: 'Discover', description: 'Finds the product', emotion: 'positive', pain_points: 'Hard to find', opportunities: 'Add search', touchpoints: 'Website' }, extra || {});
}
function makeMockPool(stageRows, mappingRows) {
  const calls = [];
  return {
    calls: calls,
    query: function(sql, params) {
      calls.push({ sql: String(sql).trim(), params: params });
      var s = String(sql).trim();
      if (/^SELECT cjs\.id FROM customer_journey_stages/.test(s)) {
        var found = stageRows.find(function(r) { return r.id === params[0] && params[2] === 'org-1'; });
        return Promise.resolve({ rows: found ? [{ id: found.id }] : [] });
      }
      if (/^INSERT INTO feature_customer_journey_stage_mappings/.test(s)) {
        var row = { id: 'map-' + (mappingRows.length + 1), journey_stage_id: params[0], journey_id: params[1], tenant_id: params[2], feature_slug: params[3], mapping_state: params[4] };
        mappingRows.push(row);
        return Promise.resolve({ rows: [{ id: row.id }] });
      }
      return Promise.resolve({ rows: [] });
    }
  };
}

(async function() {
  const { handlePostPlaceholderFeature } = require('../src/web-ui/routes/journeys');

  // -- AC1 (unit half): placeholder creation produces the correct INSERT shape --
  try {
    const mappingRows = [];
    const pool = makeMockPool([stageRow('s1')], mappingRows);
    const CSRF = 'jcx-s1-csrf';
    const req = { session: { tenantId: 'org-1', csrfToken: CSRF }, params: { id: 'j1', stageId: 's1' }, body: { name: 'Bulk export', _csrf: CSRF } };
    const res = { status: function(c) { this._s = c; return this; }, json: function(b) { this._b = b; }, _s: 200, _b: null };
    await handlePostPlaceholderFeature(req, res, null, pool);
    assert.strictEqual(res._s, 200, 'expected 200 for a valid placeholder creation');
    assert.strictEqual(mappingRows.length, 1, 'expected exactly one mapping row created');
    assert.strictEqual(mappingRows[0].mapping_state, 'placeholder', 'expected mapping_state to be placeholder');
    assert.strictEqual(mappingRows[0].feature_slug, 'Bulk export', 'expected feature_slug to hold the placeholder name (not a real slug) until jcx-s2 converts it');
    pass('AC1: placeholder mapping created with mapping_state=placeholder, feature_slug holds the name');
  } catch (e) { fail('AC1: placeholder mapping created with mapping_state=placeholder, feature_slug holds the name', e); }

  // -- AC3 (creation half): cross-tenant stage id -> 404, zero INSERT --
  try {
    const mappingRows = [];
    const pool = makeMockPool([stageRow('s1')], mappingRows);
    const CSRF = 'jcx-s1-csrf-ac3';
    const req = { session: { tenantId: 'org-2', csrfToken: CSRF }, params: { id: 'j1', stageId: 's1' }, body: { name: 'Bulk export', _csrf: CSRF } };
    const res = { status: function(c) { this._s = c; return this; }, json: function(b) { this._b = b; }, _s: 200, _b: null };
    await handlePostPlaceholderFeature(req, res, null, pool);
    assert.strictEqual(res._s, 404, 'expected 404 (not 403) for a cross-tenant stage id');
    assert.strictEqual(mappingRows.length, 0, 'expected zero mapping rows created');
    const insertCalls = pool.calls.filter(function(c) { return /^INSERT/.test(c.sql); });
    assert.strictEqual(insertCalls.length, 0, 'expected zero INSERT calls against the mock pool');
    pass('AC3 (creation): cross-tenant stage id returns 404 and makes zero mutation');
  } catch (e) { fail('AC3 (creation): cross-tenant stage id returns 404 and makes zero mutation', e); }

  // -- AC4: a placeholder and a real mapping coexist on the same stage --
  try {
    const mappingRows = [{ id: 'map-real-1', journey_stage_id: 's1', feature_slug: 'existing-feature', mapping_state: 'linked' }];
    const pool = makeMockPool([stageRow('s1')], mappingRows);
    const CSRF = 'jcx-s1-csrf-ac4';
    const req = { session: { tenantId: 'org-1', csrfToken: CSRF }, params: { id: 'j1', stageId: 's1' }, body: { name: 'New idea', _csrf: CSRF } };
    const res = { status: function(c) { this._s = c; return this; }, json: function(b) { this._b = b; }, _s: 200, _b: null };
    await handlePostPlaceholderFeature(req, res, null, pool);
    assert.strictEqual(mappingRows.length, 2, 'expected the real mapping to remain and a new placeholder to be added');
    assert.strictEqual(mappingRows[0].feature_slug, 'existing-feature', 'expected the original real mapping row to be untouched');
    assert.strictEqual(mappingRows[1].mapping_state, 'placeholder', 'expected the new row to be a placeholder');
    pass('AC4: a placeholder and a real mapping coexist on the same stage');
  } catch (e) { fail('AC4: a placeholder and a real mapping coexist on the same stage', e); }

  console.log(`\n[jcx-s1-placeholder-feature] Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-jcx-s1-placeholder-feature.js
```

Expected output: `Cannot destructure property 'handlePostPlaceholderFeature'` (module does not export it yet)

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/server.js`, add the `mapping_state` column to the existing inline migration (around line 594, right after the `metric_keys` column, before the closing `)`):

```javascript
      CREATE TABLE IF NOT EXISTS feature_customer_journey_stage_mappings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        journey_stage_id UUID NOT NULL REFERENCES customer_journey_stages(id) ON DELETE CASCADE,
        journey_id UUID NOT NULL REFERENCES customer_journeys(id) ON DELETE CASCADE,
        tenant_id TEXT NOT NULL,
        feature_slug TEXT NOT NULL,
        metric_keys JSONB NOT NULL DEFAULT '[]',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `).then(function() {
      return _creditsPool.query(`CREATE INDEX IF NOT EXISTS idx_fjs_mappings_stage_id ON feature_customer_journey_stage_mappings(journey_stage_id)`);
    }).then(function() {
      return _creditsPool.query(`CREATE INDEX IF NOT EXISTS idx_fjs_mappings_tenant_id ON feature_customer_journey_stage_mappings(tenant_id)`);
    }).then(function() {
      // jcx-s1 -- distinguishes an intentional placeholder (operator-named
      // feature slot, not yet built) from a real, linked mapping. Existing
      // rows implicitly mean "linked" (default), matching their own
      // pre-jcx-s1 meaning exactly -- no backfill needed.
      return _creditsPool.query(`ALTER TABLE feature_customer_journey_stage_mappings ADD COLUMN IF NOT EXISTS mapping_state TEXT NOT NULL DEFAULT 'linked'`);
    }).then(function() { console.log('feature_customer_journey_stage_mappings table ready'); })
      .catch(function(err) { console.error('feature_customer_journey_stage_mappings table migration failed:', err.message); });
```

In `src/web-ui/routes/journeys.js`, add a new handler right after `handleDeleteFeatureMapping` (after line 387):

```javascript
/**
 * POST /journeys/:id/stages/:stageId/placeholder-features — add a
 * placeholder feature to a stage (jcx-s1 AC1). feature_slug holds the
 * operator-provided NAME (free text), not a resolvable slug, until jcx-s2's
 * own conversion step runs -- see this story's own Architecture Constraints.
 * Dual response mode: res.status/res.json (test mock) or res.writeHead/res.end (real HTTP).
 * @param {object} req
 * @param {object} res
 * @param {*} _next unused
 * @param {object} pool
 */
async function handlePostPlaceholderFeature(req, res, _next, pool) {
  var csrfOk = await _csrf.csrfGuard(req, res);
  if (!csrfOk) return;

  var tenantId = req.session && req.session.tenantId;
  var journeyId = req.params && req.params.id;
  var stageId = req.params && req.params.stageId;
  var name = (req.body && req.body.name || '').trim();

  function notFound(msg) {
    if (res.status) { res.status(404).json({ error: msg }); }
    else { res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end(msg); }
  }
  function badRequest(msg) {
    if (res.status) { res.status(400).json({ error: msg }); }
    else { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: msg })); }
  }

  if (!name) { badRequest('name is required'); return; }

  // jcx-s1 -- same ownership-check-before-mutation / 404-not-403 cross-tenant
  // policy as handlePostFeatureMapping/handleDeleteFeatureMapping (decisions.md D13).
  var sr = await pool.query(
    `SELECT cjs.id FROM customer_journey_stages cjs
     JOIN customer_journeys cj ON cjs.journey_id = cj.id
     WHERE cjs.id = $1 AND cjs.journey_id = $2 AND cj.tenant_id = $3`,
    [stageId, journeyId, tenantId]
  );
  if (!sr.rows[0]) { notFound('stage not found'); return; }

  var ins = await pool.query(
    `INSERT INTO feature_customer_journey_stage_mappings
     (journey_stage_id, journey_id, tenant_id, feature_slug, mapping_state)
     VALUES ($1, $2, $3, $4, 'placeholder')
     RETURNING id`,
    [stageId, journeyId, tenantId, name]
  );
  var mappingId = ins.rows[0].id;

  if (res.status) { res.status(200).json({ id: mappingId, name: name, mappingState: 'placeholder' }); }
  else { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ id: mappingId, name: name, mappingState: 'placeholder' })); }
}
```

Add `handlePostPlaceholderFeature` to `module.exports` at the bottom of `journeys.js`.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-jcx-s1-placeholder-feature.js
```

Expected output: `Results: 3 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing (baseline + 3 new)

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/server.js src/web-ui/routes/journeys.js tests/check-jcx-s1-placeholder-feature.js
git commit -m "feat: add mapping_state column and placeholder-feature creation route (AC1, AC3-creation, AC4)"
```

---

## Task 2: Discovery-seeder module + trigger route + path-traversal guard

**Files:**
- Create: `src/web-ui/adapters/discovery-seeder.js`
- Modify: `src/web-ui/routes/journeys.js`
- Modify: `tests/check-jcx-s1-placeholder-feature.js`

- [ ] **Step 1: Write the failing tests**

Append to `tests/check-jcx-s1-placeholder-feature.js`, inside the same `(async function() { ... })()` IIFE, immediately before the final `console.log`/results block:

```javascript
  const { handleTriggerPlaceholderFeature } = require('../src/web-ui/routes/journeys');
  const fs = require('fs');
  const osTmp = require('os').tmpdir();

  // -- AC2: trigger creates a real artefacts/ folder and seeds discovery.md --
  try {
    const scratchRoot = fs.mkdtempSync(path.join(osTmp, 'jcx-s1-trigger-'));
    const mappingRows = [{ id: 'map-1', journey_stage_id: 's1', journey_id: 'j1', tenant_id: 'org-1', feature_slug: 'Bulk export', mapping_state: 'placeholder' }];
    const pool = makeMockPool([stageRow('s1')], mappingRows);
    const CSRF = 'jcx-s1-csrf-ac2';
    const req = { session: { tenantId: 'org-1', csrfToken: CSRF }, params: { id: 'j1', stageId: 's1', mappingId: 'map-1' }, body: { _csrf: CSRF } };
    const res = { status: function(c) { this._s = c; return this; }, json: function(b) { this._b = b; }, _s: 200, _b: null };
    await handleTriggerPlaceholderFeature(req, res, null, pool, { repoRoot: scratchRoot });
    assert.strictEqual(res._s, 200, 'expected 200 for a valid trigger');
    const featureSlug = res._b.featureSlug;
    const discoveryPath = path.join(scratchRoot, 'artefacts', featureSlug, 'discovery.md');
    assert.ok(fs.existsSync(discoveryPath), 'expected a real discovery.md to be created on disk');
    const content = fs.readFileSync(discoveryPath, 'utf8');
    assert.ok(content.indexOf('Discover') !== -1, 'expected the stage name in the seeded Problem Statement');
    assert.ok(content.indexOf('positive') !== -1, 'expected the stage emotion in the seeded Problem Statement');
    assert.ok(content.indexOf('Hard to find') !== -1, 'expected the stage pain_points in the seeded Problem Statement');
    assert.ok(content.indexOf('## Who It Affects') === -1, 'expected ONLY Section 1 to be seeded, not Who It Affects (per /clarify Option A)');
    fs.rmSync(scratchRoot, { recursive: true, force: true });
    pass('AC2: trigger creates a real artefacts/ folder and seeds discovery.md Section 1 only');
  } catch (e) { fail('AC2: trigger creates a real artefacts/ folder and seeds discovery.md Section 1 only', e); }

  // -- AC3 (trigger half): cross-tenant mapping id -> 404, no folder created --
  try {
    const scratchRoot = fs.mkdtempSync(path.join(osTmp, 'jcx-s1-trigger-ac3-'));
    const mappingRows = [{ id: 'map-1', journey_stage_id: 's1', journey_id: 'j1', tenant_id: 'org-1', feature_slug: 'Bulk export', mapping_state: 'placeholder' }];
    const pool = makeMockPool([stageRow('s1')], mappingRows);
    const CSRF = 'jcx-s1-csrf-ac3b';
    const req = { session: { tenantId: 'org-2', csrfToken: CSRF }, params: { id: 'j1', stageId: 's1', mappingId: 'map-1' }, body: { _csrf: CSRF } };
    const res = { status: function(c) { this._s = c; return this; }, json: function(b) { this._b = b; }, _s: 200, _b: null };
    await handleTriggerPlaceholderFeature(req, res, null, pool, { repoRoot: scratchRoot });
    assert.strictEqual(res._s, 404, 'expected 404 for a cross-tenant mapping');
    assert.ok(!fs.existsSync(path.join(scratchRoot, 'artefacts')), 'expected no artefacts/ folder created at all');
    fs.rmSync(scratchRoot, { recursive: true, force: true });
    pass('AC3 (trigger): cross-tenant mapping id returns 404, no folder created');
  } catch (e) { fail('AC3 (trigger): cross-tenant mapping id returns 404, no folder created', e); }

  // -- NFR: path traversal guard on the feature-folder name --
  try {
    const scratchRoot = fs.mkdtempSync(path.join(osTmp, 'jcx-s1-trigger-nfr-'));
    const mappingRows = [{ id: 'map-1', journey_stage_id: 's1', journey_id: 'j1', tenant_id: 'org-1', feature_slug: '../../etc/passwd', mapping_state: 'placeholder' }];
    const pool = makeMockPool([stageRow('s1')], mappingRows);
    const CSRF = 'jcx-s1-csrf-nfr';
    const req = { session: { tenantId: 'org-1', csrfToken: CSRF }, params: { id: 'j1', stageId: 's1', mappingId: 'map-1' }, body: { _csrf: CSRF } };
    const res = { status: function(c) { this._s = c; return this; }, json: function(b) { this._b = b; }, _s: 200, _b: null };
    await handleTriggerPlaceholderFeature(req, res, null, pool, { repoRoot: scratchRoot });
    assert.strictEqual(res._s, 400, 'expected 400 for a path-traversal placeholder name');
    assert.ok(!fs.existsSync(path.join(scratchRoot, '..', '..', 'etc')), 'expected no file written outside the scratch repo root');
    fs.rmSync(scratchRoot, { recursive: true, force: true });
    pass('NFR: path traversal guard rejects a crafted placeholder name with 400, no file written');
  } catch (e) { fail('NFR: path traversal guard rejects a crafted placeholder name with 400, no file written', e); }
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-jcx-s1-placeholder-feature.js
```

Expected output: `Cannot destructure property 'handleTriggerPlaceholderFeature'` (module does not export it yet)

- [ ] **Step 3: Write minimal implementation**

Create `src/web-ui/adapters/discovery-seeder.js`:

```javascript
'use strict';

const fs = require('fs');
const path = require('path');

// jcx-s1 -- slugifies a placeholder name into a safe feature-slug directory
// name. Lowercase, hyphenate, strip anything that isn't alphanumeric/hyphen.
function slugify(name) {
  return String(name)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Creates artefacts/[feature-slug]/ and seeds discovery.md's own Section 1
 * (Problem Statement) with the journey stage's own context. Only Section 1
 * is seeded -- confirmed via /clarify (Option A), 2026-10-11.
 *
 * jcx-s1 -- mandatory path-traversal guard (web-ui-patterns.md's own
 * established convention): path.resolve + startsWith(repoRoot + sep).
 *
 * @param {object} stage - { name, description, emotion, pain_points, opportunities, touchpoints }
 * @param {string} placeholderName - the operator-provided placeholder name
 * @param {string} repoRoot - absolute repo root to guard against traversal
 * @returns {{ featureSlug: string } | { error: string }}
 */
function seedDiscoveryFromStage(stage, placeholderName, repoRoot) {
  var dated = new Date().toISOString().slice(0, 10);
  var featureSlug = dated + '-' + slugify(placeholderName);

  var resolvedRepoRoot = path.resolve(repoRoot);
  var artefactDir = path.resolve(resolvedRepoRoot, 'artefacts', featureSlug);
  if (!artefactDir.startsWith(resolvedRepoRoot + path.sep)) {
    return { error: 'artefact path escapes repo root' };
  }

  fs.mkdirSync(artefactDir, { recursive: true });

  var problemStatement = 'Stage: ' + stage.name + '\n\n' +
    (stage.description ? stage.description + '\n\n' : '') +
    'Emotion: ' + (stage.emotion || 'Not set') + '\n' +
    'Pain points: ' + (stage.pain_points || 'Not set') + '\n' +
    'Opportunities: ' + (stage.opportunities || 'Not set') + '\n' +
    'Touchpoints: ' + (stage.touchpoints || 'Not set');

  var discoveryMd = '# Discovery: ' + placeholderName + '\n\n' +
    '**Status:** Draft — awaiting approval\n' +
    '**Created:** ' + dated + '\n' +
    '**Approved by:** [pending]\n' +
    '**Author:** Claude (seeded from journey stage "' + stage.name + '")\n\n' +
    '---\n\n' +
    '## Problem Statement\n\n' +
    problemStatement + '\n';

  fs.writeFileSync(path.join(artefactDir, 'discovery.md'), discoveryMd, 'utf8');

  return { featureSlug: featureSlug };
}

module.exports = { seedDiscoveryFromStage, slugify };
```

In `src/web-ui/routes/journeys.js`, add after `handlePostPlaceholderFeature`:

```javascript
var _discoverySeeder = require('../adapters/discovery-seeder');

/**
 * POST /journeys/:id/stages/:stageId/placeholder-features/:mappingId/trigger
 * — trigger a placeholder feature, seeding a new /discovery session (jcx-s1
 * AC2). _opts is test-only (repoRoot override); production always uses the
 * real repo root.
 * @param {object} req
 * @param {object} res
 * @param {*} _next unused
 * @param {object} pool
 * @param {object} [_opts]
 */
async function handleTriggerPlaceholderFeature(req, res, _next, pool, _opts) {
  var csrfOk = await _csrf.csrfGuard(req, res);
  if (!csrfOk) return;

  var tenantId = req.session && req.session.tenantId;
  var journeyId = req.params && req.params.id;
  var stageId = req.params && req.params.stageId;
  var mappingId = req.params && req.params.mappingId;
  var repoRoot = (_opts && _opts.repoRoot) || _repoRootAdapter.getRepoRoot(req);

  function notFound(msg) {
    if (res.status) { res.status(404).json({ error: msg }); }
    else { res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end(msg); }
  }
  function badRequest(msg) {
    if (res.status) { res.status(400).json({ error: msg }); }
    else { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: msg })); }
  }

  var sr = await pool.query(
    `SELECT id, name, description, emotion, pain_points, opportunities, touchpoints
     FROM customer_journey_stages cjs
     JOIN customer_journeys cj ON cjs.journey_id = cj.id
     WHERE cjs.id = $1 AND cjs.journey_id = $2 AND cj.tenant_id = $3`,
    [stageId, journeyId, tenantId]
  );
  var stage = sr.rows[0];
  if (!stage) { notFound('stage not found'); return; }

  var mr = await pool.query(
    `SELECT feature_slug FROM feature_customer_journey_stage_mappings WHERE id = $1 AND journey_stage_id = $2 AND tenant_id = $3`,
    [mappingId, stageId, tenantId]
  );
  var mapping = mr.rows[0];
  if (!mapping) { notFound('mapping not found'); return; }

  var result = _discoverySeeder.seedDiscoveryFromStage(stage, mapping.feature_slug, repoRoot);
  if (result.error) { badRequest(result.error); return; }

  if (res.status) { res.status(200).json({ featureSlug: result.featureSlug }); }
  else { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ featureSlug: result.featureSlug })); }
}
```

Add `handleTriggerPlaceholderFeature` to `module.exports`.

**Note on the mock pool:** `makeMockPool` (Task 1's own test helper) needs a small extension for Task 2's own tests — add a branch matching `SELECT id, name, description, emotion, pain_points, opportunities, touchpoints` (stage lookup with full context) and `SELECT feature_slug FROM feature_customer_journey_stage_mappings` (mapping lookup), both returning from the test's own `stageRows`/`mappingRows` arrays.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-jcx-s1-placeholder-feature.js
```

Expected output: `Results: 7 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing (baseline + 7 new)

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/adapters/discovery-seeder.js src/web-ui/routes/journeys.js tests/check-jcx-s1-placeholder-feature.js
git commit -m "feat: add discovery-seeder and trigger route with path-traversal guard (AC2, AC3-trigger, NFR)"
```

---

## Task 3: Wire both routes in server.js

**Files:**
- Modify: `src/web-ui/server.js`

- [ ] **Step 1: No new test** — route wiring is verified by `jcx-s5`'s own dedicated authorization story (real `server.js` dispatch, seeded sessions). This task's own correctness is confirmed by Step 5's full-suite run not regressing, plus a manual smoke check in Step 4 below.

- [ ] **Step 2: N/A**

- [ ] **Step 3: Write the wiring**

In `src/web-ui/server.js`, add the import (extend the existing `journeys` require on line 117):

```javascript
const { handlePostJourneys, handleGetJourneyCanvas, handlePostJourneyStage, handlePatchJourneyStage, handlePatchJourneyStagesOrder, handleGetCustomerJourneysList, handlePostFeatureMapping, handleDeleteFeatureMapping, handlePatchJourneyStagePosition, handlePostPlaceholderFeature, handleTriggerPlaceholderFeature } = require('./routes/journeys');
```

Add two new route blocks immediately after the existing `feature-mappings` DELETE block (after line 4078):

```javascript
  } else if (pathname.match(/^\/journeys\/[^/]+\/stages\/[^/]+\/placeholder-features$/) && req.method === 'POST') {
    // jcx-s1 — add a placeholder feature to a journey stage (2026-10-11-journey-cx-redesign)
    req.params = { id: pathname.split('/')[2], stageId: pathname.split('/')[4] };
    authGuard(req, res, async () => {
      let _rnvOk = false;
      await requireNonViewer(req, res, () => { _rnvOk = true; });
      if (!_rnvOk) return;
      await handlePostPlaceholderFeature(req, res, null, _pshPool);
    });

  } else if (pathname.match(/^\/journeys\/[^/]+\/stages\/[^/]+\/placeholder-features\/[^/]+\/trigger$/) && req.method === 'POST') {
    // jcx-s1 — trigger a placeholder feature, seeding a new /discovery session (2026-10-11-journey-cx-redesign)
    req.params = { id: pathname.split('/')[2], stageId: pathname.split('/')[4], mappingId: pathname.split('/')[6] };
    authGuard(req, res, async () => {
      let _rnvOk = false;
      await requireNonViewer(req, res, () => { _rnvOk = true; });
      if (!_rnvOk) return;
      await handleTriggerPlaceholderFeature(req, res, null, _pshPool);
    });

```

- [ ] **Step 4: Manual smoke check**

```bash
node -e "require('./src/web-ui/server.js')" 2>&1 | head -5
```

Expected output: no syntax errors, server module loads cleanly (do not actually start listening — this just confirms the file parses and requires resolve).

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/server.js
git commit -m "feat: wire placeholder-feature creation and trigger routes in server.js"
```

---

## Final check

- [ ] All 7 tests pass (`node tests/check-jcx-s1-placeholder-feature.js`)
- [ ] Full suite green (`npm test`)
- [ ] No scope beyond the 5 ACs (AC1, AC2, AC3, AC4, AC5) — no richer discovery seeding, no new permission tier, no automatic cleanup
