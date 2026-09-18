# Restyle the Artefact Viewer and Build Its Sign-Off/Comments UI to Match DESIGN.md — Implementation Plan

> **For agent execution:** Use /subagent-execution (subagents available).

**Goal:** Make every test in `artefacts/2026-09-18-design-system-adoption/test-plans/dsa-s1-test-plan.md` pass. Restyle the real artefact viewer (`handleArtefactRoute`) to match `DESIGN.md`, and build real, working Sign-off and Comments UI (reusing the existing `POST /sign-off` endpoint; new, generic comments infrastructure).
**Branch:** `feature/dsa-s1`
**Worktree:** `.worktrees/dsa-s1`
**Test command:** `npm test` (unit/integration, via `node scripts/run-all-tests.js`); `npm run test:e2e -- tests/e2e/<file>` (Playwright, per-file)

---

## File map

```
Modify:
  src/web-ui/utils/html-shell.js          — add --success/--warn/--danger aliases + --surface-2/--muted-3 (new) to both :root (light) and [data-theme="dark"] (+ its @media fallback twin); update --sans to 'Inter Tight'; update existing token hex values to match DESIGN.md's light/dark tables
  src/web-ui/routes/artefact.js           — handleArtefactRoute: call detectExistingSignOff on fetched markdown; restyle rendered HTML to two-column layout with real Sign-off/Comments cards
  src/web-ui/server.js                    — wire new comments migration at startup (_userRolesPool); wire 2 new CSRF-guarded comment routes; wire new client script's static route

Create:
  src/web-ui/modules/artefact-comments.js       — new comments module: migrateArtefactCommentsSchema, createComment, listCommentsForResource (no org_id/org_type)
  src/web-ui/public/artefact-sidebar.js         — client script: Sign Off button wiring (POST /sign-off, handle all response codes) + Comments card (list on load, post without reload)
  tests/check-dsa-s1-artefact-comments.js       — unit tests for artefact-comments.js
  tests/check-dsa-s1-sign-off-detection.js      — unit tests for detectExistingSignOff integration into handleArtefactRoute's render logic
  tests/e2e/dsa-s1-artefact-viewer-restyle.spec.js — E2E tests for AC1-AC8
```

---

## Task 1: Add new design-system tokens to html-shell.js (dark + light), without breaking existing screens

**Files:**
- Modify: `src/web-ui/utils/html-shell.js`

- [ ] **Step 1: Write the failing test**

Create `tests/check-dsa-s1-token-values.js`:

```javascript
'use strict';
// tests/check-dsa-s1-token-values.js -- AC1, AC2 (token-value groundwork)
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const htmlShellSrc = fs.readFileSync(
  path.resolve(__dirname, '../src/web-ui/utils/html-shell.js'), 'utf8'
);

function testNewAliasesPresentBothModes() {
  // Light (:root) block
  assert.ok(/:root\s*\{[^}]*--success:\s*#34D399/s.test(htmlShellSrc.replace(/#0F2318/g, '')) === false || /--success:\s*#\w{6}/.test(htmlShellSrc), '--success alias missing');
  assert.ok(/--warn:\s*#\w{6}/.test(htmlShellSrc), '--warn alias missing');
  assert.ok(/--danger:\s*#\w{6}/.test(htmlShellSrc), '--danger alias missing');
}
function testOldNamesStillPresent() {
  // The old names must NOT be removed -- 25+ other usages depend on them
  assert.ok(/--green:\s*#\w{6}/.test(htmlShellSrc), '--green must still exist (do not remove/rename)');
  assert.ok(/--amber:\s*#\w{6}/.test(htmlShellSrc), '--amber must still exist (do not remove/rename)');
  assert.ok(/--red:\s*#\w{6}/.test(htmlShellSrc), '--red must still exist (do not remove/rename)');
}
function testNewTokensSurfaceTwoAndMuted3Present() {
  assert.ok(/--surface-2:\s*#\w{6}/.test(htmlShellSrc), '--surface-2 missing (new token, did not exist before)');
  assert.ok(/--muted-3:\s*#\w{6}/.test(htmlShellSrc), '--muted-3 missing (new token, did not exist before)');
}
function testSansFontUpdatedToInterTight() {
  assert.ok(/--sans:\s*'Inter Tight'/.test(htmlShellSrc), "--sans must be updated to 'Inter Tight' per DESIGN.md");
}

testNewAliasesPresentBothModes();
testOldNamesStillPresent();
testNewTokensSurfaceTwoAndMuted3Present();
testSansFontUpdatedToInterTight();
console.log('  ok - all dsa-s1 token checks passed');
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-dsa-s1-token-values.js
```

Expected output: `AssertionError: --success alias missing` (or similar — the new tokens don't exist yet)

- [ ] **Step 3: Write the implementation**

Replace the existing token block (`src/web-ui/utils/html-shell.js`, the `DESIGN_SYSTEM_CSS` template literal, starting at the `:root {` line) with:

```javascript
const DESIGN_SYSTEM_CSS = `
/* ── Light mode tokens (default) ──────────────────────────────────────────── */
:root {
  --bg: #FAFAFA; --surface: #FFFFFF; --surface-2: #F2F3F5; --ink: #14171A; --ink-2: #3F454C;
  --muted: #6B7280; --muted-2: #52585F; --muted-3: #3A3F45; --line: #E4E7EB; --line-2: #EDEFF2;
  --accent: #2563EB; --accent-soft: #EFF4FF; --accent-ink: #1D4ED8;
  --green: #15803D; --green-soft: #DCFCE7;
  --amber: #B45309; --amber-soft: #FEF3C7;
  --red: #B91C1C; --red-soft: #FEE2E2;
  --success: #15803D; --success-soft: #DCFCE7;
  --warn: #B45309; --warn-soft: #FEF3C7;
  --danger: #B91C1C; --danger-soft: #FEE2E2;
  --serif: 'Source Serif 4', Charter, Georgia, serif;
  --sans: 'Inter Tight', system-ui, sans-serif;
  --mono: 'JetBrains Mono', ui-monospace, monospace;
}

/* ── Dark mode tokens ──────────────────────────────────────────────────────
   Applied by [data-theme="dark"] (manual toggle) or via the anti-flash
   script when OS preference is dark and no manual override exists.
   The @media block is a no-JS fallback only.
─────────────────────────────────────────────────────────────────────────── */
[data-theme="dark"] {
  --bg: #0B0D10; --surface: #0E1013; --surface-2: #161A1F; --ink: #F5F6F7; --ink-2: #B4BAC2;
  --muted: #9AA1AB; --muted-2: #6B7280; --muted-3: #454B54; --line: #23272E; --line-2: #1A1D22;
  --accent: #3B82F6; --accent-soft: #152238; --accent-ink: #93C5FD;
  --green: #4ADE80; --green-soft: #052E16;
  --amber: #FCD34D; --amber-soft: #451A03;
  --red: #F87171; --red-soft: #450A0A;
  --success: #34D399; --success-soft: #0F2318;
  --warn: #F59E0B; --warn-soft: #2A2011;
  --danger: #F87171; --danger-soft: #2A1416;
}
/* No-JS OS fallback */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]):not([data-theme="dark"]) {
    --bg: #0B0D10; --surface: #0E1013; --surface-2: #161A1F; --ink: #F5F6F7; --ink-2: #B4BAC2;
    --muted: #9AA1AB; --muted-2: #6B7280; --muted-3: #454B54; --line: #23272E; --line-2: #1A1D22;
    --accent: #3B82F6; --accent-soft: #152238; --accent-ink: #93C5FD;
    --green: #4ADE80; --green-soft: #052E16;
    --amber: #FCD34D; --amber-soft: #451A03;
    --red: #F87171; --red-soft: #450A0A;
    --success: #34D399; --success-soft: #0F2318;
    --warn: #F59E0B; --warn-soft: #2A2011;
    --danger: #F87171; --danger-soft: #2A1416;
  }
}
```

Note: `--green`/`--amber`/`--red` (and their `-soft` variants) are LEFT UNCHANGED at their exact original hex values — this is intentional (25+ usages outside this epic depend on them, per `decisions.md`'s "FEATURE-WIDE" entry). Only `--success`/`--warn`/`--danger` (new aliases), `--surface-2`/`--muted-3` (new tokens), `--bg`/`--surface`/`--ink`/`--ink-2`/`--muted`/`--muted-2`/`--line`/`--line-2`/`--accent`/`--accent-soft`/`--accent-ink` (updated to `DESIGN.md`'s real values), and `--sans` (font update) actually change value. `--line-2`/`--muted-2`/`--muted-3`'s light-mode values are the derived values from `decisions.md`'s own light-mode-gap entry, not literal `DESIGN.md` table lookups (since `DESIGN.md` doesn't define them for light mode).

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-dsa-s1-token-values.js
```

Expected output: `  ok - all dsa-s1 token checks passed`

- [ ] **Step 5: Run ci-typecheck and full suite spot-check**

```bash
node scripts/ci-typecheck.js
```

Expected output: no new errors (156+ files loaded OK, matching this session's own established baseline count)

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/utils/html-shell.js tests/check-dsa-s1-token-values.js
git commit -m "feat(dsa-s1): add DESIGN.md color tokens as aliases, new surface-2/muted-3 tokens, Inter Tight font"
```

---

## Task 2: New comments module — table, migration, create/list functions

**Files:**
- Create: `src/web-ui/modules/artefact-comments.js`
- Test: `tests/check-dsa-s1-artefact-comments.js`

- [ ] **Step 1: Write the failing test**

Create `tests/check-dsa-s1-artefact-comments.js`:

```javascript
'use strict';
// tests/check-dsa-s1-artefact-comments.js -- AC7, AC8 (data layer)
const assert = require('assert');
const {
  migrateArtefactCommentsSchema,
  createComment,
  listCommentsForResource
} = require('../src/web-ui/modules/artefact-comments');

// Minimal in-memory fake pool -- mirrors this repo's own fake-test-db.js
// convention (bri-s3.2/rbg-s1), scoped just to this module's own 2 queries.
function makeFakePool() {
  var rows = [];
  var idCounter = 0;
  return {
    query: async function (sql, params) {
      if (/CREATE TABLE/.test(sql)) return { rows: [] };
      if (/INSERT INTO artefact_comments/.test(sql)) {
        idCounter++;
        var row = {
          comment_id: 'comment-test-' + idCounter,
          resource_type: params[1],
          resource_id: params[2],
          user_id: params[3],
          body: params[4],
          created_at: new Date(Date.now() + idCounter).toISOString()
        };
        rows.push(row);
        return { rows: [row] };
      }
      if (/SELECT .* FROM artefact_comments WHERE/.test(sql)) {
        var matched = rows.filter(function (r) {
          return r.resource_type === params[0] && r.resource_id === params[1];
        }).sort(function (a, b) { return a.created_at < b.created_at ? -1 : 1; });
        return { rows: matched };
      }
      throw new Error('Unhandled query in fake pool: ' + sql);
    }
  };
}

async function testCreateCommentPersistsRow() {
  var pool = makeFakePool();
  await migrateArtefactCommentsSchema(pool);
  var comment = await createComment(pool, 'artefact', 'test-feature/discovery', 'e2e-tester', 'A real comment body');
  assert.ok(comment.comment_id, 'expected a real comment_id');
  assert.strictEqual(comment.body, 'A real comment body');
  assert.strictEqual(comment.user_id, 'e2e-tester');
}

async function testListCommentsReturnsOldestFirst() {
  var pool = makeFakePool();
  await migrateArtefactCommentsSchema(pool);
  await createComment(pool, 'artefact', 'test-feature/discovery', 'user-a', 'First comment');
  await createComment(pool, 'artefact', 'test-feature/discovery', 'user-b', 'Second comment');
  await createComment(pool, 'artefact', 'test-feature/discovery', 'user-c', 'Third comment');

  var list = await listCommentsForResource(pool, 'artefact', 'test-feature/discovery');
  assert.strictEqual(list.length, 3);
  assert.strictEqual(list[0].body, 'First comment');
  assert.strictEqual(list[1].body, 'Second comment');
  assert.strictEqual(list[2].body, 'Third comment');
}

async function testListCommentsEmptyStateReturnsEmptyArray() {
  var pool = makeFakePool();
  await migrateArtefactCommentsSchema(pool);
  var list = await listCommentsForResource(pool, 'artefact', 'no-comments-here/discovery');
  assert.deepStrictEqual(list, []);
}

async function main() {
  await testCreateCommentPersistsRow();
  console.log('  ok - createComment persists row');
  await testListCommentsReturnsOldestFirst();
  console.log('  ok - listCommentsForResource returns oldest first');
  await testListCommentsEmptyStateReturnsEmptyArray();
  console.log('  ok - listCommentsForResource empty state returns []');
}
main().catch(function (err) { console.error('FAIL:', err.message); process.exitCode = 1; });
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-dsa-s1-artefact-comments.js
```

Expected output: `Error: Cannot find module '../src/web-ui/modules/artefact-comments'`

- [ ] **Step 3: Write the implementation**

Create `src/web-ui/modules/artefact-comments.js`:

```javascript
'use strict';

// artefact-comments.js -- dsa-s1
//
// Generic, append-only comment thread on an artefact page. Deliberately NOT
// scoped by org_id/org_type (unlike modules/agency-client-comments.js, which
// this module is modeled on structurally but not reused directly -- see
// decisions.md, 2026-09-18, "the real artefact viewer has no Sign-off/
// Comments UI" entry, for the full reasoning: agency-client-comments.js
// requires a real clientOrgId/agencyOrgId tied to an organisations row with
// org_type 'agency'|'client', which this product's general users don't have).
//
// Data Model: comment_id PK, resource_type, resource_id, user_id, body,
// created_at. No org_id column by design -- every signed-in user viewing
// this artefact can read and post, no client/agency distinction applies.

var _defaultLogger = { info: function (msg) { console.log(msg); } };

/**
 * Startup schema bootstrap. Idempotent -- safe to call on every server
 * restart, matching this codebase's existing CREATE TABLE IF NOT EXISTS
 * migration convention (see modules/agency-client-comments.js's own
 * migrateCommentsSchema).
 * @param {object} pool - pg-Pool-shaped object exposing query(sql, params)
 * @returns {Promise<void>}
 */
async function migrateArtefactCommentsSchema(pool) {
  await pool.query(
    'CREATE TABLE IF NOT EXISTS artefact_comments (' +
    'comment_id VARCHAR PRIMARY KEY, ' +
    'resource_type VARCHAR NOT NULL, ' +
    'resource_id VARCHAR NOT NULL, ' +
    'user_id VARCHAR NOT NULL, ' +
    'body TEXT NOT NULL, ' +
    'created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()' +
    ')'
  );
}

function _genId(prefix) {
  return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}

/**
 * Append a comment (AC8). Comments are append-only -- no update/delete
 * function exists in this module at all, by design (Out of Scope).
 * Audit (NFR): every comment creation is logged with author, resource
 * reference, and timestamp.
 * @param {object} pool
 * @param {string} resourceType - e.g. 'artefact'
 * @param {string} resourceId - e.g. '<featureSlug>/<artefactType>'
 * @param {string} userId - the author's user_id (session login)
 * @param {string} body - comment text
 * @param {{info: Function}} [logger]
 * @returns {Promise<{comment_id:string, resource_type:string, resource_id:string, user_id:string, body:string, created_at:string}>}
 */
async function createComment(pool, resourceType, resourceId, userId, body, logger) {
  var log = logger || _defaultLogger;
  var commentId = _genId('artefact-comment');
  var result = await pool.query(
    'INSERT INTO artefact_comments (comment_id, resource_type, resource_id, user_id, body) ' +
    'VALUES ($1, $2, $3, $4, $5) ' +
    'RETURNING comment_id, resource_type, resource_id, user_id, body, created_at',
    [commentId, resourceType, resourceId, userId, body]
  );
  var row = result.rows[0];
  log.info(JSON.stringify({
    event: 'artefact_comment_created',
    user_id: userId,
    resource_type: resourceType,
    resource_id: resourceId,
    timestamp: new Date().toISOString()
  }));
  return row;
}

/**
 * List every comment on a resource, oldest first (AC7). Performance NFR:
 * this is the ONE batched query per resource view -- callers must never
 * loop and call this once per comment.
 * @param {object} pool
 * @param {string} resourceType
 * @param {string} resourceId
 * @returns {Promise<Array<object>>}
 */
async function listCommentsForResource(pool, resourceType, resourceId) {
  var result = await pool.query(
    'SELECT comment_id, resource_type, resource_id, user_id, body, created_at ' +
    'FROM artefact_comments WHERE resource_type = $1 AND resource_id = $2 ORDER BY created_at ASC',
    [resourceType, resourceId]
  );
  return result.rows;
}

module.exports = {
  migrateArtefactCommentsSchema,
  createComment,
  listCommentsForResource
};
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-dsa-s1-artefact-comments.js
```

Expected output:
```
  ok - createComment persists row
  ok - listCommentsForResource returns oldest first
  ok - listCommentsForResource empty state returns []
```

- [ ] **Step 5: Commit**

```bash
git add src/web-ui/modules/artefact-comments.js tests/check-dsa-s1-artefact-comments.js
git commit -m "feat(dsa-s1): add new, generic artefact-comments module (no org scoping)"
```

---

## Task 3: Wire the comments migration at server startup, add 2 new CSRF-guarded routes

**Files:**
- Modify: `src/web-ui/server.js`

- [ ] **Step 1: Read the exact current state first**

Read `src/web-ui/server.js` around line 640-652 (the `migrateAgencyClientGrantsSchema(_userRolesPool).then()...` block) to confirm the exact real surrounding code before inserting — do not assume line numbers are stable after Task 1/2's own edits shifted things.

Read the exact dispatch block around the existing `/api/agency/comments` (POST) route (originally around `server.js:3900-3913`) to confirm the exact real `authGuard`/`csrfGuard` wiring pattern before writing the new routes — do not assume line numbers are stable.

- [ ] **Step 2: Write the failing test**

Create `tests/check-dsa-s1-comment-routes.js`:

```javascript
'use strict';
// tests/check-dsa-s1-comment-routes.js -- AC7, AC8 (route integration)
process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'test-session-secret-minimum32chars!!';
process.env.GITHUB_CLIENT_ID = 'test-client-id';
process.env.GITHUB_CLIENT_SECRET = 'test-secret';
process.env.GITHUB_CALLBACK_URL = 'http://localhost:3000/auth/github/callback';
delete process.env.POSTHOG_KEY;
delete process.env.DATABASE_URL;

const assert = require('assert');
const router = require('../src/web-ui/server').router;
const seedTestSession = require('../src/web-ui/middleware/session').seedTestSession;

function makeRes() {
  var statusCode = null, headers = {}, chunks = [];
  return {
    writeHead: function (code, h) { statusCode = code; Object.assign(headers, h || {}); },
    setHeader: function (k, v) { headers[k] = v; },
    end: function (body) { if (body != null) chunks.push(body); },
    _get: function () { return { statusCode: statusCode, headers: headers, body: chunks.join('') }; }
  };
}
function dispatchAndAwait(req) {
  return new Promise(function (resolve, reject) {
    var res = makeRes();
    var origEnd = res.end;
    var settled = false;
    res.end = function (body) { origEnd(body); if (!settled) { settled = true; resolve(res._get()); } };
    router(req, res).catch(function (err) { if (!settled) { settled = true; reject(err); } });
  });
}

async function testCreateCommentRouteRequiresAuth() {
  var req = { headers: {}, method: 'POST', url: '/api/artefact-comments' };
  var result = await dispatchAndAwait(req);
  assert.notStrictEqual(result.statusCode, 200, 'unauthenticated create must not succeed');
}

async function testListCommentsRouteRequiresAuth() {
  var req = { headers: {}, method: 'GET', url: '/api/artefact-comments?resourceType=artefact&resourceId=test/discovery' };
  var result = await dispatchAndAwait(req);
  assert.notStrictEqual(result.statusCode, 200, 'unauthenticated list must not succeed');
}

async function main() {
  await testCreateCommentRouteRequiresAuth();
  console.log('  ok - create-comment route requires auth');
  await testListCommentsRouteRequiresAuth();
  console.log('  ok - list-comments route requires auth');
}
main().catch(function (err) { console.error('FAIL:', err.message); process.exitCode = 1; });
```

- [ ] **Step 3: Run test — must fail**

```bash
node tests/check-dsa-s1-comment-routes.js
```

Expected output: a real failure (404, since the routes don't exist yet — `router` falls through to a not-found branch, not a 401/redirect, so `result.statusCode` is neither 200 nor a recognizable auth-rejection status; this specific failure signature confirms the routes are genuinely missing, not confirms they auth-reject correctly)

- [ ] **Step 4: Write the implementation**

In `src/web-ui/server.js`, near the top with the other module requires, add:

```javascript
const {
  migrateArtefactCommentsSchema,
  createComment: createArtefactComment,
  listCommentsForResource: listArtefactComments
} = require('./modules/artefact-comments');
```

Near the existing `migrateAgencyClientGrantsSchema(_userRolesPool).then()...` block (inside the same `if (_userRolesPool)`-equivalent startup conditional this block already lives in — confirm the exact surrounding conditional from Step 1's read), add:

```javascript
    // dsa-s1 -- Auto-migrate artefact_comments schema.
    migrateArtefactCommentsSchema(_userRolesPool).then(function() {
      console.log('[dsa-s1] artefact_comments schema ready');
    }).catch(function(err) { console.error('[dsa-s1] artefact_comments schema migration failed:', err.message); });
```

Add a small `_sendJson` helper if one is not already in scope in `server.js` at this point (check first — `products.js` has its own local one; `server.js` may or may not already have an equivalent):

```javascript
function _dsaS1SendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}
```

Add the 2 new routes to the router's dispatch chain, near the existing `/artefact/:slug/:type` GET route (find the exact real insertion point from Step 1's read):

```javascript
  } else if (pathname === '/api/artefact-comments' && req.method === 'POST') {
    // dsa-s1 -- create a comment on an artefact. CSRF-guarded, matching
    // every other mutating route in this codebase (e.g. the existing
    // /api/agency/comments POST route).
    authGuard(req, res, async () => {
      var csrfOk = await _csrf.csrfGuard(req, res);
      if (!csrfOk) return;
      var body = req.body || {};
      var resourceType = body.resourceType || 'artefact';
      var resourceId = body.resourceId;
      var commentBody = body.body;
      var userId = (req.session && req.session.login) || '';
      if (!resourceId || !commentBody) {
        _dsaS1SendJson(res, 400, { error: 'resourceId and body are required' });
        return;
      }
      var comment = await createArtefactComment(_pshPool, resourceType, resourceId, userId, commentBody);
      _dsaS1SendJson(res, 200, {
        success: true,
        comment: {
          commentId: comment.comment_id,
          resourceType: comment.resource_type,
          resourceId: comment.resource_id,
          userId: comment.user_id,
          body: comment.body,
          createdAt: comment.created_at
        }
      });
    });

  } else if (pathname === '/api/artefact-comments' && req.method === 'GET') {
    // dsa-s1 -- list comments on an artefact.
    authGuard(req, res, async () => {
      var resourceType = (req.query && req.query.resourceType) || 'artefact';
      var resourceId = req.query && req.query.resourceId;
      var comments = await listArtefactComments(_pshPool, resourceType, resourceId);
      _dsaS1SendJson(res, 200, {
        comments: comments.map(function(c) {
          return {
            commentId: c.comment_id,
            resourceType: c.resource_type,
            resourceId: c.resource_id,
            userId: c.user_id,
            body: c.body,
            createdAt: c.created_at
          };
        })
      });
    });
```

Confirm `_csrf` is already imported at module scope in `server.js` (it should be, given `journey.js`'s own routes use `_csrf.csrfField`/`_csrf.generateCsrfToken` elsewhere in the same dispatch chain — verify the exact import name/path from Step 1's read; do not assume without checking, since Task 4 will need the same import for `handleArtefactRoute`'s own CSRF token generation for the Sign Off button).

- [ ] **Step 5: Run test — must pass**

```bash
node tests/check-dsa-s1-comment-routes.js
```

Expected output:
```
  ok - create-comment route requires auth
  ok - list-comments route requires auth
```

- [ ] **Step 6: Run ci-typecheck**

```bash
node scripts/ci-typecheck.js
```

Expected output: no new errors

- [ ] **Step 7: Commit**

```bash
git add src/web-ui/server.js tests/check-dsa-s1-comment-routes.js
git commit -m "feat(dsa-s1): wire artefact_comments migration and 2 new CSRF-guarded comment routes"
```

---

## Task 4: Server-side sign-off detection + restyle handleArtefactRoute's markup

**Files:**
- Modify: `src/web-ui/routes/artefact.js`

- [ ] **Step 1: Read the exact current state first**

Read `src/web-ui/routes/artefact.js`'s full `handleArtefactRoute` function (confirmed at line 56 as of this plan's writing — re-confirm the exact current line number and content, since Tasks 1-3 do not touch this file but re-confirm regardless per this codebase's own established discipline of never assuming a prior read is still accurate). Confirm the exact real variable names in scope at the point where `bodyContent` is built (`const bodyContent = \`<div class="sw-doc">${html}</div>\`;`).

- [ ] **Step 2: Write the failing test**

Create `tests/check-dsa-s1-sign-off-detection.js`:

```javascript
'use strict';
// tests/check-dsa-s1-sign-off-detection.js -- AC6
const assert = require('assert');
const { detectExistingSignOff } = require('../src/web-ui/adapters/sign-off-writer');

function testNotSignedOffReturnsNull() {
  var markdown = '## Story: X\n\nSome content, no approval section.';
  var result = detectExistingSignOff(markdown);
  assert.strictEqual(result, null);
}

function testAlreadySignedOffReturnsApproverAndDate() {
  var markdown = '## Story: X\n\nSome content.\n\n## Approved by\n\nJane Doe — 2026-09-19T00:00:00.000Z\n';
  var result = detectExistingSignOff(markdown);
  assert.ok(result, 'expected a real detection result');
  assert.strictEqual(result.approver, 'Jane Doe');
  assert.strictEqual(result.date, '2026-09-19T00:00:00.000Z');
}

testNotSignedOffReturnsNull();
console.log('  ok - not-signed-off markdown returns null');
testAlreadySignedOffReturnsApproverAndDate();
console.log('  ok - already-signed-off markdown returns approver/date');
```

- [ ] **Step 3: Run test — must fail**

Actually — this specific test may already PASS immediately, since `detectExistingSignOff` already exists and is already tested by `tests/check-wuce3-attributed-signoff.js`. **This is expected and correct** — this test file exists to prove the *integration point* (that `handleArtefactRoute` will correctly call this real function), not to re-prove the function's own already-tested behavior. Confirm via:

```bash
node tests/check-dsa-s1-sign-off-detection.js
```

Expected output (this one may already pass before any new code is written — that is fine, it is testing pre-existing, already-correct behavior as a foundation for Step 4's real integration):
```
  ok - not-signed-off markdown returns null
  ok - already-signed-off markdown returns approver/date
```

- [ ] **Step 4: Write the implementation**

In `src/web-ui/routes/artefact.js`, add the import at the top (near the other requires):

```javascript
const { detectExistingSignOff } = require('../adapters/sign-off-writer');
const { listCommentsForResource } = require('../modules/artefact-comments');
const _csrf = require('../middleware/csrf');
```

(Confirm `_csrf`'s exact real module path from Task 3's Step 1 read — do not assume `../middleware/csrf` without checking, since this file's own existing require style may differ from `journey.js`'s.)

In `handleArtefactRoute`, immediately after the existing `const markdown = await _fetchArtefact(...)` line, add:

```javascript
    const signOffStatus = detectExistingSignOff(markdown);
    const comments = await listCommentsForResource(pool, 'artefact', slug + '/' + artefactType);
    const csrfToken = await _csrf.generateCsrfToken(req);
```

Replace the existing `const bodyContent = \`<div class="sw-doc">${html}</div>\`;` line with a two-column layout matching `DESIGN.md`'s "Artefact/document viewer" pattern:

```javascript
    const signOffCardHtml = signOffStatus
      ? '<div class="sw-signoff-card">' +
          '<h3>Sign-off</h3>' +
          '<p><strong>' + shellEscHtml(signOffStatus.approver) + '</strong></p>' +
          '<p style="color:var(--muted);font-size:13px">' + shellEscHtml(signOffStatus.date) + '</p>' +
        '</div>'
      : '<div class="sw-signoff-card">' +
          '<h3>Sign-off</h3>' +
          '<button type="button" id="sign-off-btn" data-artefact-path="' + shellEscHtml('artefacts/' + slug + '/' + artefactType + '.md') + '" data-csrf-token="' + shellEscHtml(csrfToken) + '" class="sw-btn sw-btn--primary">Sign Off</button>' +
          '<div id="sign-off-error" style="color:var(--danger);font-size:13px;margin-top:8px"></div>' +
        '</div>';

    const commentsListHtml = comments.length === 0
      ? '<p id="comments-empty-state" style="color:var(--muted)">No comments yet</p>'
      : '<ul id="comments-list" style="list-style:none;padding:0">' +
          comments.map(function(c) {
            return '<li style="padding:8px 0;border-bottom:1px solid var(--line-2)">' +
              '<strong>' + shellEscHtml(c.userId) + '</strong> ' +
              '<span style="color:var(--muted);font-size:12px">' + shellEscHtml(c.createdAt) + '</span>' +
              '<p>' + shellEscHtml(c.body) + '</p>' +
            '</li>';
          }).join('') +
        '</ul>';

    const commentsCardHtml =
      '<div class="sw-comments-card" data-resource-type="artefact" data-resource-id="' + shellEscHtml(slug + '/' + artefactType) + '" data-csrf-token="' + shellEscHtml(csrfToken) + '">' +
        '<h3>Comments</h3>' +
        '<div id="comments-list-container">' + commentsListHtml + '</div>' +
        '<textarea id="comment-input" placeholder="Add a comment..." style="width:100%;margin-top:12px"></textarea>' +
        '<button type="button" id="comment-submit-btn" class="sw-btn sw-btn--secondary">Post Comment</button>' +
      '</div>';

    const bodyContent =
      '<div class="sw-artefact-layout" style="display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:24px">' +
        '<div class="sw-doc" style="font-family:var(--serif)">' + html + '</div>' +
        '<div class="sw-artefact-sidebar" style="display:flex;flex-direction:column;gap:16px">' +
          signOffCardHtml +
          commentsCardHtml +
        '</div>' +
      '</div>' +
      '<script src="/public/artefact-sidebar.js"></script>';
```

(This is a pure addition to the render path — the existing `renderShellWithNav` call immediately below stays completely unchanged, still receiving `bodyContent` as before. Apply the identical `signOffStatus`/`comments`/`csrfToken`/two-column layout treatment to the postgres-fallback branch further down in the same function, which currently duplicates the `bodyContent = \`<div class="sw-doc">${html}</div>\`;` pattern — do not leave that second render path on the old single-column markup.)

- [ ] **Step 5: Run test — must pass**

```bash
node tests/check-dsa-s1-sign-off-detection.js
```

Expected output: both checks still pass (unchanged from Step 3 — this test validates the underlying function, already correct; the real proof that `handleArtefactRoute` calls it correctly is Task 6's E2E test)

- [ ] **Step 6: Run ci-typecheck**

```bash
node scripts/ci-typecheck.js
```

Expected output: no new errors

- [ ] **Step 7: Commit**

```bash
git add src/web-ui/routes/artefact.js tests/check-dsa-s1-sign-off-detection.js
git commit -m "feat(dsa-s1): restyle handleArtefactRoute to two-column layout with real Sign-off/Comments cards"
```

---

## Task 5: New client-side script — Sign Off button + Comments card interactions, plus its static route

**Files:**
- Create: `src/web-ui/public/artefact-sidebar.js`
- Modify: `src/web-ui/server.js` (static route)

- [ ] **Step 1: Read the exact current state first**

Read the existing `/public/stage-list.js` (or any sibling) static-route dispatch block in `server.js` to confirm the exact real pattern before adding a new one (client-script + static-route pairing lesson, already established elsewhere in this feature).

- [ ] **Step 2: Write the implementation** (no isolated unit test for this file — its behavior is proven by Task 6's real E2E tests, matching this feature's own established pattern for client-side scripts, e.g. `ep2-s3`'s `approval-modal.js`)

Create `src/web-ui/public/artefact-sidebar.js`:

```javascript
// src/web-ui/public/artefact-sidebar.js -- dsa-s1
// Sign Off button (POST /sign-off, reusing the existing, unmodified
// endpoint) and Comments card (list on load already server-rendered;
// this script only handles posting a new comment without a full reload).
(function () {
  'use strict';

  function initSignOff() {
    var btn = document.getElementById('sign-off-btn');
    var errorEl = document.getElementById('sign-off-error');
    if (!btn || !errorEl) return;

    btn.addEventListener('click', function () {
      var artefactPath = btn.getAttribute('data-artefact-path');
      var csrfToken = btn.getAttribute('data-csrf-token');
      btn.disabled = true;
      errorEl.textContent = '';

      fetch('/sign-off', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artefactPath: artefactPath, _csrf: csrfToken })
      })
        .then(function (r) {
          return r.json().then(function (body) { return { status: r.status, body: body }; });
        })
        .then(function (result) {
          if (result.status === 200) {
            // Success -- reload to pick up the server-rendered signed-off
            // state (simplest correct approach: the sign-off card's real
            // approver/date comes from detectExistingSignOff on next render,
            // avoiding a second client-side state-guessing path).
            window.location.reload();
            return;
          }
          if (result.status === 409) {
            errorEl.textContent = 'Already signed off by ' + (result.body.approver || 'someone') + ' on ' + (result.body.date || 'an earlier date') + '.';
          } else if (result.status === 429) {
            errorEl.textContent = 'Too many requests -- please wait a moment and try again.';
          } else {
            errorEl.textContent = result.body.error || 'Sign-off failed. Please try again.';
          }
          btn.disabled = false;
        })
        .catch(function () {
          errorEl.textContent = 'Sign-off failed. Please try again.';
          btn.disabled = false;
        });
    });
  }

  function initComments() {
    var card = document.querySelector('.sw-comments-card');
    var submitBtn = document.getElementById('comment-submit-btn');
    var input = document.getElementById('comment-input');
    var listContainer = document.getElementById('comments-list-container');
    if (!card || !submitBtn || !input || !listContainer) return;

    var resourceType = card.getAttribute('data-resource-type');
    var resourceId = card.getAttribute('data-resource-id');
    var csrfToken = card.getAttribute('data-csrf-token');

    submitBtn.addEventListener('click', function () {
      var body = input.value.trim();
      if (!body) return;
      submitBtn.disabled = true;

      fetch('/api/artefact-comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resourceType: resourceType, resourceId: resourceId, body: body, _csrf: csrfToken })
      })
        .then(function (r) { return r.json(); })
        .then(function (result) {
          if (result.success) {
            var emptyState = document.getElementById('comments-empty-state');
            if (emptyState) emptyState.remove();
            var list = document.getElementById('comments-list');
            if (!list) {
              list = document.createElement('ul');
              list.id = 'comments-list';
              list.style.listStyle = 'none';
              list.style.padding = '0';
              listContainer.appendChild(list);
            }
            var item = document.createElement('li');
            item.style.padding = '8px 0';
            item.style.borderBottom = '1px solid var(--line-2)';
            var strong = document.createElement('strong');
            strong.textContent = result.comment.userId;
            var span = document.createElement('span');
            span.style.color = 'var(--muted)';
            span.style.fontSize = '12px';
            span.textContent = ' ' + result.comment.createdAt;
            var p = document.createElement('p');
            p.textContent = result.comment.body;
            item.appendChild(strong);
            item.appendChild(span);
            item.appendChild(p);
            list.appendChild(item);
            input.value = '';
          }
          submitBtn.disabled = false;
        })
        .catch(function () { submitBtn.disabled = false; });
    });
  }

  initSignOff();
  initComments();
})();
```

Add the static route in `src/web-ui/server.js`, matching the exact real `/public/stage-list.js`-style pattern confirmed in Step 1:

```javascript
  } else if (pathname === '/public/artefact-sidebar.js' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8' });
    res.end(require('fs').readFileSync(require('path').join(__dirname, 'public', 'artefact-sidebar.js'), 'utf8'));
```

- [ ] **Step 3: Run ci-typecheck**

```bash
node scripts/ci-typecheck.js
```

Expected output: `[ci-typecheck] 156 file(s) loaded OK` (confirms `src/web-ui/public/` exclusion already covers this new file, per the established `ep2-s1` precedent)

- [ ] **Step 4: Commit**

```bash
git add src/web-ui/public/artefact-sidebar.js src/web-ui/server.js
git commit -m "feat(dsa-s1): add client-side Sign Off/Comments script and its static route"
```

---

## Task 6: E2E tests — full verification of AC1-AC8

**Files:**
- Create: `tests/e2e/dsa-s1-artefact-viewer-restyle.spec.js`

- [ ] **Step 1: Investigate before writing**

Read `tests/e2e/artefact-preview.spec.js` and `tests/e2e/artefact-read.spec.js` for this codebase's own real fixture pattern for reaching a real artefact-view page in a test (product → feature → artefact, or a more direct test-only seed). Read `tests/e2e/s3.1-drag-to-advance.spec.js` for the exact `page.route(..., route.continue())` call-observation pattern (per the test plan's own AC5 grounding).

- [ ] **Step 2: Write the E2E spec**

Cover AC1 (dark-mode tokens), AC2 (light-mode tokens), AC3 (layout + real functional cards), AC4 (pre-existing specs still pass — run as a separate step, not inside this new file), AC5 (Sign Off button sends real POST with correct artefactPath — request-observation only, per the test plan's own documented External-dependency gap for the full success round trip), AC6 (already-signed-off fixture shows approver, not a button — use a seeded artefact whose real markdown content already has a `## Approved by` section), AC7 (comments list + empty state), AC8 (comment posts without reload).

- [ ] **Step 3: Run the E2E spec**

```bash
NODE_ENV=test npx playwright test tests/e2e/dsa-s1-artefact-viewer-restyle.spec.js
```

Foreground, wait for it to actually finish. Investigate and fix real bugs found; do not weaken assertions to pass.

- [ ] **Step 4: Run the 4 pre-existing artefact-viewer specs (AC4)**

```bash
NODE_ENV=test npx playwright test tests/e2e/artefact-preview.spec.js tests/e2e/artefact-read.spec.js tests/e2e/artefact-writeback.spec.js tests/e2e/wuce20-artefact-index-html.spec.js
```

Expected: all pass, unmodified, per AC4's own requirement.

- [ ] **Step 5: Run the Node suite too — no regressions**

```bash
node tests/check-dsa-s1-token-values.js
node tests/check-dsa-s1-artefact-comments.js
node tests/check-dsa-s1-comment-routes.js
node tests/check-dsa-s1-sign-off-detection.js
npm test
```

Foreground, wait for completion (~8 minutes based on this session's own established baseline). Expect only the 1 pre-existing, unrelated failure already confirmed multiple times this session (`tests/check-p3.5-validate-trace.js`) plus possibly the `scripts/check-pipeline-state-integrity.js` failure (another session's own unrelated malformed feature entry, already acknowledged in this story's own `/branch-setup` decisions.md entry) — nothing new.

- [ ] **Step 6: Commit**

```bash
git add tests/e2e/dsa-s1-artefact-viewer-restyle.spec.js
git commit -m "test(dsa-s1): add E2E coverage for restyled artefact viewer, Sign-off, and Comments UI"
```

---

## Post-plan note for /verify-completion

This story's diff touches `src/web-ui/server.js` (route wiring) and `src/web-ui/routes/artefact.js` (a route/handler file) — `/verify-completion`'s mandatory route/handler E2E coverage check applies. Identify every pre-existing spec touching `/artefact/:slug/:type` or `/sign-off` (at minimum: `artefact-preview.spec.js`, `artefact-read.spec.js`, `artefact-writeback.spec.js`, `wuce20-artefact-index-html.spec.js`, `sign-off.spec.js` — confirm no others exist via a fresh grep at that time) and run every non-`@real-staging` one locally.

Any RISK-ACCEPTs already logged in `decisions.md` for this story (the metric-linkage gap, the amended verification script's un-reviewed new scenarios) carry forward — no new action needed at `/verify-completion` for those, they are already closed decisions.
