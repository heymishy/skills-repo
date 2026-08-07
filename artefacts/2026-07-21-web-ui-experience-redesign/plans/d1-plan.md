# Start an impersonation session (search, reason-gated, session swap) — Implementation Plan

> **For agent execution:** executed task-by-task via /tdd in this session (no subagent fan-out — this is the highest-risk story in the feature, per DoR Coding Agent Instructions).

**Goal:** Build a user/tenant search endpoint, a reason-gated "Act as" flow, and a session-swap mechanism that atomically writes an audit entry via a new `setImpersonationAuditAdapter()` (D37) while preserving the real admin's identity for exit/audit, plus a nested-impersonation guard.
**Branch:** `feature/d1-start-impersonation-session`
**Worktree:** `C:/Users/Hamis/code/skills repo/.claude/worktrees/agent-a57219d7b110e92d3` (already isolated; no nested worktree created)
**Test command:** `node tests/check-d1-start-impersonation-session.js` (single story test file, discovered by `node scripts/run-all-tests.js`)

---

## Task 0 — Mandatory technical investigation (session-swap mechanism)

Completed before any implementation code. Findings recorded in `artefacts/2026-07-21-web-ui-experience-redesign/decisions.md` (ARCH entry, "d1 implementation, mandatory Task 0 technical investigation") and repeated as a PR comment. Summary of the design this plan implements:

1. `req.session.impersonation` is a NEW sub-object holding `{ active, admin: {userId, login, tenantId, role}, target: {id, login, tenantId, role}, reason, auditId, startedAt }`. This preserves the real admin's identity untouched for D2's exit flow, and doubles as the AC5 nested-impersonation guard.
2. Top-level `req.session.tenantId` / `.login` / `.role` are overwritten to the target's values — exactly the three fields AC3 names, nothing else.
3. `req.session.accessToken` and `req.session.userId` are **not** swapped (the admin's own GitHub token/userId remain) — flagged as a known limitation for D2/D4, not fixed here (see decisions.md).
4. Atomicity (AC3/AC4): the audit-table INSERT is awaited FIRST; all `req.session` field mutation happens in one synchronous block with no `await` in between, and only after the INSERT resolves. If the INSERT throws, no session field is touched. Node's single-threaded event loop means no concurrent request can observe a partially-swapped session.

---

## File map

```
Create:
  src/web-ui/adapters/impersonation-audit-adapter.js   — D37 adapter: writes/reads impersonation_audit_log rows
  src/web-ui/modules/impersonation.js                   — filterUsers (AC1), listImpersonationCandidates, startImpersonationSession (AC2-AC5)
  src/web-ui/routes/impersonation.js                    — GET /admin/impersonate (page+search), POST /api/admin/impersonate/start
  tests/check-d1-start-impersonation-session.js         — unit + integration tests, AC1-AC6 + NFRs

Modify:
  src/web-ui/server.js — create impersonation_audit_log table, wire setImpersonationAuditAdapter, register the 2 routes behind requireAdmin
```

---

## Task 1: Impersonation audit adapter (D37)

**Files:**
- Create: `src/web-ui/adapters/impersonation-audit-adapter.js`
- Test: `tests/check-d1-start-impersonation-session.js` (T1-T3)

- [x] **Step 1: Write the failing test**

```js
// T1: stub throws when unwired (D37 rule 1)
await test('writeImpersonationAudit throws when adapter unwired (D37 rule 1)', async function() {
  var mod = freshRequireAuditAdapter();
  var threw = false;
  try { await mod.writeImpersonationAudit({}); } catch (e) {
    threw = true;
    assert.ok(/Adapter not wired/.test(e.message), 'expected D37 message, got: ' + e.message);
  }
  assert.ok(threw, 'expected unwired stub to throw, not return null/empty');
});
```

- [x] **Step 2: Run test — must fail** (module does not exist yet) → `Cannot find module '../src/web-ui/adapters/impersonation-audit-adapter'`

- [x] **Step 3: Write minimal implementation**

```js
'use strict';

/**
 * impersonation-audit-adapter.js — d1 (D37 injectable adapter)
 *
 * Writes one immutable audit row per impersonation session start, and reads
 * rows back for verification (AC6) / D3's future viewing UI. Backs a new
 * `impersonation_audit_log` table. A genuinely new data-access layer for a
 * genuinely new table (mirrors modules-adapter.js's own a1 reasoning) — not
 * an existing adapter repurposed for a new query shape.
 *
 * D37 rule 1: the stub default throws (never returns null/empty) until
 * setImpersonationAuditAdapter() wires a real Postgres pool in server.js.
 */

var _db = null;

/**
 * Wire the real Postgres pool (or an injected test double) — D37 pattern.
 * @param {object} pool — a `.query(sql, params)`-capable client.
 */
function setImpersonationAuditAdapter(pool) {
  _db = pool;
}

function _requireAdapter() {
  if (!_db) {
    throw new Error('Adapter not wired: impersonationAuditDb. Call setImpersonationAuditAdapter() before use.');
  }
  return _db;
}

/**
 * Write one audit row recording the real admin's identity, the target's
 * identity, the reason, and a timestamp (AC3). Never receives or stores
 * req.session.accessToken.
 * @param {{adminId:*, adminLogin:string, adminTenantId:string, targetId:*, targetLogin:string, targetTenantId:string, reason:string}} record
 * @returns {Promise<object>} the inserted row (id, ..., created_at)
 */
async function writeImpersonationAudit(record) {
  var db = _requireAdapter();
  var r = await db.query(
    `INSERT INTO impersonation_audit_log
       (admin_id, admin_login, admin_tenant_id, target_id, target_login, target_tenant_id, reason)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, admin_id, admin_login, admin_tenant_id, target_id, target_login, target_tenant_id, reason, created_at`,
    [record.adminId, record.adminLogin, record.adminTenantId, record.targetId, record.targetLogin, record.targetTenantId, record.reason]
  );
  return r.rows[0];
}

/**
 * Retrieve a single audit row by id (AC6 verification / D3).
 * @param {*} auditId
 * @returns {Promise<object|null>}
 */
async function getImpersonationAuditRow(auditId) {
  var db = _requireAdapter();
  var r = await db.query('SELECT * FROM impersonation_audit_log WHERE id = $1', [auditId]);
  return r.rows.length ? r.rows[0] : null;
}

/**
 * List every audit row, most recent first (AC6 verification / D3's future viewing UI).
 * @returns {Promise<Array<object>>}
 */
async function listImpersonationAuditRows() {
  var db = _requireAdapter();
  var r = await db.query('SELECT * FROM impersonation_audit_log ORDER BY created_at DESC');
  return r.rows;
}

module.exports = {
  setImpersonationAuditAdapter,
  writeImpersonationAudit,
  getImpersonationAuditRow,
  listImpersonationAuditRows
};
```

- [x] **Step 4: Run test — must pass**
- [x] **Step 5: Run full suite — no new regressions**
- [x] **Step 6: Commit**

```bash
git add src/web-ui/adapters/impersonation-audit-adapter.js tests/check-d1-start-impersonation-session.js
git commit -m "feat(d1): add impersonation audit adapter (D37 stub throws when unwired)"
```

---

## Task 2: Core session-swap logic (`modules/impersonation.js`)

**Files:**
- Create: `src/web-ui/modules/impersonation.js`
- Test: `tests/check-d1-start-impersonation-session.js` (T4-T12)

- [x] **Step 1: Write failing tests** for `filterUsers` (AC1), reason-required (AC2), atomic swap+audit (AC3), audit-failure blocks swap (AC4), nested-impersonation rejection (AC5), two-sessions-two-distinct-rows (AC6).

- [x] **Step 2: Run — must fail** (module does not exist)

- [x] **Step 3: Write implementation**

```js
'use strict';

// impersonation.js — d1
// Core session-swap logic. No new D37 adapter for this module itself (the
// D37 adapter is impersonation-audit-adapter.js, for the audit WRITE only) —
// filterUsers/listImpersonationCandidates/startImpersonationSession are
// app-layer logic, matching identity-links.js's own "direct DB access via a
// plain pool parameter, not a setter/getter pair" precedent for read-only
// helpers that aren't themselves a new adapter.
//
// See decisions.md ("d1 implementation, mandatory Task 0 technical
// investigation") for the full session-swap design rationale.

var { writeImpersonationAudit } = require('../adapters/impersonation-audit-adapter');

/**
 * Filter a list of {login, tenantId} candidates by a case-insensitive
 * substring match against either field (AC1).
 * @param {Array<{login:string, tenantId:string}>} users
 * @param {string} query
 * @returns {Array<object>}
 */
function filterUsers(users, query) {
  var q = String(query == null ? '' : query).toLowerCase().trim();
  if (!q) return users.slice();
  return users.filter(function(u) {
    var login = String(u.login || '').toLowerCase();
    var tenantId = String(u.tenantId || '').toLowerCase();
    return login.indexOf(q) !== -1 || tenantId.indexOf(q) !== -1;
  });
}

/**
 * Real, cross-tenant candidate list for the search endpoint (AC1's real data
 * source). team_memberships is the only real table this platform has that
 * associates a role with a tenant/person; person_identities supplies a real
 * linked login when one exists. tenant_id itself is used as the login
 * fallback because, for a solo (non-TENANT_ORG_ALLOWLIST) tenant, tenant_id
 * IS the person's own original identity (routes/auth.js: req.session.tenantId
 * = user.login when no allowlist is configured) -- this mirrors
 * identity-links.js's resolvePersonForIdentity fallback exactly, not a
 * fabricated value.
 * @param {object} pool
 * @returns {Promise<Array<{tenantId:string, personId:number, role:string, login:string}>>}
 */
async function listImpersonationCandidates(pool) {
  var r = await pool.query(
    `SELECT tm.tenant_id, tm.person_id, tm.role,
            COALESCE(
              (SELECT pi.identity_key FROM person_identities pi
                WHERE pi.person_id = tm.person_id
                ORDER BY pi.created_at ASC LIMIT 1),
              tm.tenant_id
            ) AS login
       FROM team_memberships tm
       ORDER BY tm.tenant_id ASC`
  );
  return r.rows.map(function(row) {
    return { tenantId: row.tenant_id, personId: row.person_id, role: row.role, login: row.login };
  });
}

/**
 * Start an impersonation session (AC2-AC5). Mutates `session` in place --
 * ONLY after the audit write succeeds (AC4), and only via one synchronous
 * block with no `await` in between (see decisions.md point on atomicity).
 * @param {object} session - req.session (mutated in place on success)
 * @param {{id:*, login:string, tenantId:string, role:string}} target
 * @param {string} reason
 * @returns {Promise<{auditId:*}>}
 */
async function startImpersonationSession(session, target, reason) {
  var trimmedReason = String(reason == null ? '' : reason).trim();
  if (!trimmedReason) {
    var reasonErr = new Error('A reason is required to start an impersonation session.');
    reasonErr.code = 'REASON_REQUIRED';
    throw reasonErr;
  }

  if (session && session.impersonation && session.impersonation.active) {
    var nestedErr = new Error('Already impersonating a user -- exit the current session before starting another.');
    nestedErr.code = 'ALREADY_IMPERSONATING';
    throw nestedErr;
  }

  var adminSnapshot = {
    userId: session.userId,
    login: session.login,
    tenantId: session.tenantId,
    role: session.role
  };

  // Audit write happens BEFORE any session mutation (AC4) -- if this throws,
  // execution never reaches the assignment block below, so the session is
  // left completely untouched.
  var auditRow = await writeImpersonationAudit({
    adminId: adminSnapshot.userId,
    adminLogin: adminSnapshot.login,
    adminTenantId: adminSnapshot.tenantId,
    targetId: target.id,
    targetLogin: target.login,
    targetTenantId: target.tenantId,
    reason: trimmedReason
  });

  // Single synchronous block, no `await` between these lines -- this is what
  // makes the swap atomic from any concurrent request's perspective (AC3,
  // NFR: no inconsistent state under concurrent requests during the swap).
  session.impersonation = {
    active: true,
    admin: adminSnapshot,
    target: { id: target.id, login: target.login, tenantId: target.tenantId, role: target.role },
    reason: trimmedReason,
    auditId: auditRow.id,
    startedAt: auditRow.created_at
  };
  session.tenantId = target.tenantId;
  session.login = target.login;
  session.role = target.role;

  return { auditId: auditRow.id };
}

module.exports = { filterUsers, listImpersonationCandidates, startImpersonationSession };
```

- [x] **Step 4: Run — must pass**
- [x] **Step 5: Run full suite — no new regressions**
- [x] **Step 6: Commit**

```bash
git add src/web-ui/modules/impersonation.js tests/check-d1-start-impersonation-session.js
git commit -m "feat(d1): add session-swap core logic (search filter, atomic start, nested-impersonation guard)"
```

---

## Task 3: HTTP route handlers (`routes/impersonation.js`)

**Files:**
- Create: `src/web-ui/routes/impersonation.js`
- Test: `tests/check-d1-start-impersonation-session.js` (T13-T18)

- [x] **Step 1: Write failing tests** for: GET page renders search input + CSRF-protected form; POST without reason returns 400 and calls no adapter method; POST with reason succeeds and swaps session; POST while already impersonating returns 409.

- [x] **Step 3: Write implementation**

```js
'use strict';

// impersonation.js (routes) — d1
// GET  /admin/impersonate           — search UI (requireAdmin, mounted in server.js)
// POST /api/admin/impersonate/start — reason-gated session swap (requireAdmin + CSRF)
// Mirrors team-management.js's createTeamManagementHandlers(pool) factory convention.

var { filterUsers, listImpersonationCandidates, startImpersonationSession } = require('../modules/impersonation');
var csrf = require('../middleware/csrf');

function _escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function _readBody(req) {
  if (req.body !== undefined) return Promise.resolve(req.body);
  return new Promise(function(resolve) {
    var raw = '';
    req.on('data', function(c) { raw += c; });
    req.on('end', function() {
      var params = new URLSearchParams(raw);
      var obj = {};
      params.forEach(function(v, k) { obj[k] = v; });
      resolve(obj);
    });
  });
}

/**
 * @param {object} pool — real Postgres pool (or test double) for the candidate search query
 * @returns {{handleGetImpersonatePage:Function, handlePostImpersonateStart:Function}}
 */
function createImpersonationHandlers(pool) {
  /** GET /admin/impersonate — search form + CSRF-protected "Act as" forms per result. */
  async function handleGetImpersonatePage(req, res) {
    var q = (req.query && req.query.q) || '';
    var candidates = await listImpersonationCandidates(pool);
    var results = filterUsers(candidates, q);
    var csrfToken = csrf.generateCsrfToken(req);

    var rows = results.map(function(u) {
      return (
        '<tr><td>' + _escapeHtml(u.login) + '</td><td>' + _escapeHtml(u.tenantId) + '</td><td>' + _escapeHtml(u.role) + '</td>' +
        '<td><form method="POST" action="/api/admin/impersonate/start">' +
        csrf.csrfField(csrfToken) +
        '<input type="hidden" name="targetId" value="' + _escapeHtml(u.personId) + '">' +
        '<input type="hidden" name="targetLogin" value="' + _escapeHtml(u.login) + '">' +
        '<input type="hidden" name="targetTenantId" value="' + _escapeHtml(u.tenantId) + '">' +
        '<input type="hidden" name="targetRole" value="' + _escapeHtml(u.role) + '">' +
        '<label for="reason-' + _escapeHtml(u.personId) + '">Reason (required)</label>' +
        '<input id="reason-' + _escapeHtml(u.personId) + '" name="reason" type="text" required>' +
        '<button type="submit">Act as &rarr;</button>' +
        '</form></td></tr>'
      );
    }).join('');

    var html = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Impersonate</title></head><body>' +
      '<h1>Impersonate</h1>' +
      '<form method="GET" action="/admin/impersonate">' +
      '<label for="q">Search by login or tenant</label>' +
      '<input id="q" name="q" type="text" value="' + _escapeHtml(q) + '">' +
      '<button type="submit">Search</button>' +
      '</form>' +
      '<table><thead><tr><th>Login</th><th>Tenant</th><th>Role</th><th>Action</th></tr></thead><tbody>' +
      rows +
      '</tbody></table>' +
      '</body></html>';

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  }

  /** POST /api/admin/impersonate/start — reason-gated session swap (AC2-AC5). */
  async function handlePostImpersonateStart(req, res) {
    var csrfOk = await csrf.csrfGuard(req, res);
    if (!csrfOk) return;

    var body = await _readBody(req);
    var target = {
      id: body && body.targetId,
      login: body && body.targetLogin ? String(body.targetLogin) : '',
      tenantId: body && body.targetTenantId ? String(body.targetTenantId) : '',
      role: body && body.targetRole ? String(body.targetRole) : ''
    };
    var reason = body && body.reason ? String(body.reason) : '';

    if (!target.login || !target.tenantId) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'targetLogin and targetTenantId are required' }));
      return;
    }

    try {
      var result = await startImpersonationSession(req.session, target, reason);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ started: true, auditId: result.auditId }));
    } catch (err) {
      if (err.code === 'REASON_REQUIRED') {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'A reason is required to start an impersonation session.' }));
        return;
      }
      if (err.code === 'ALREADY_IMPERSONATING') {
        res.writeHead(409, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Already impersonating a user -- exit first.' }));
        return;
      }
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to start impersonation session.' }));
    }
  }

  return { handleGetImpersonatePage: handleGetImpersonatePage, handlePostImpersonateStart: handlePostImpersonateStart };
}

module.exports = { createImpersonationHandlers };
```

- [x] **Step 4: Run — must pass**
- [x] **Step 5: Run full suite — no new regressions**
- [x] **Step 6: Commit**

```bash
git add src/web-ui/routes/impersonation.js tests/check-d1-start-impersonation-session.js
git commit -m "feat(d1): add impersonation HTTP routes (search page, reason-gated start endpoint)"
```

---

## Task 4: server.js wiring (D37 production wiring — separate task per D37 rule 2)

**Files:**
- Modify: `src/web-ui/server.js`
- Test: `tests/check-d1-start-impersonation-session.js` (T19-T20, grep-based)

- [x] **Step 1: Write failing tests** asserting server.js contains `CREATE TABLE IF NOT EXISTS impersonation_audit_log`, calls `setImpersonationAuditAdapter(`, and registers both routes.

- [x] **Step 3: Implementation** — add near the a1/product_modules migration block (same `_creditsPool`):

```js
// d1: impersonation_audit_log table -- one immutable row per impersonation
// session start (AC3/AC4/AC6). No FK to team_memberships/people -- admin
// and target identities are captured as plain strings/ids at write time so
// the audit trail survives a person/tenant being later renamed or removed.
_creditsPool.query(`CREATE TABLE IF NOT EXISTS impersonation_audit_log (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id          VARCHAR,
  admin_login       VARCHAR,
  admin_tenant_id   VARCHAR NOT NULL,
  target_id         VARCHAR,
  target_login      VARCHAR NOT NULL,
  target_tenant_id  VARCHAR NOT NULL,
  reason            TEXT NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
)`).then(function() {
  console.log('[d1] impersonation_audit_log table ready');
}).catch(function(err) {
  console.error('[d1] impersonation_audit_log migration failed:', err.message);
});

// d1 D37 wiring: wire the real Postgres impersonation audit adapter, reusing
// the same _creditsPool already wired above.
setImpersonationAuditAdapter(_creditsPool);
console.log('[d1] impersonation audit adapter wired');
```

Route registration (near the `/api/team/members` block, same `requireAdmin`-at-mount-time pattern):

```js
} else if (pathname === '/admin/impersonate' && req.method === 'GET') {
  // d1 — admin impersonation search page (requireAdmin gate)
  let _raOk = false;
  await requireAdmin(req, res, () => { _raOk = true; });
  if (!_raOk) return;
  await _impersonationHandlers.handleGetImpersonatePage(req, res);

} else if (pathname === '/api/admin/impersonate/start' && req.method === 'POST') {
  // d1 — reason-gated impersonation session start (requireAdmin gate + CSRF)
  let _raOk = false;
  await requireAdmin(req, res, () => { _raOk = true; });
  if (!_raOk) return;
  await _impersonationHandlers.handlePostImpersonateStart(req, res);

```

Plus the top-of-file require/instantiation:
```js
const { setImpersonationAuditAdapter } = require('./adapters/impersonation-audit-adapter');
const { createImpersonationHandlers } = require('./routes/impersonation');
...
const _impersonationHandlers = createImpersonationHandlers(_creditsPool);
```

- [x] **Step 4: Run — must pass**
- [x] **Step 5: Run full suite — compare failing-file list to the 37-file baseline, no new regressions**
- [x] **Step 6: Commit**

```bash
git add src/web-ui/server.js tests/check-d1-start-impersonation-session.js
git commit -m "feat(d1): wire impersonation audit adapter and routes in server.js"
```

---

## Task 5: NFR tests

**Files:**
- Test: `tests/check-d1-start-impersonation-session.js` (T21-T22)

- Performance: time `startImpersonationSession` against a mock adapter resolving near-instantly; assert < 1000ms (Performance NFR: "Session start completes within 1 second").
- Security: grep this story's own new/modified files for the banned `req.session.token` field — zero matches.

```bash
node tests/check-d1-start-impersonation-session.js
node scripts/run-all-tests.js
```

- [x] Commit alongside Task 4 (same file).
