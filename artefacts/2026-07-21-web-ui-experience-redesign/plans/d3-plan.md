# Impersonation audit log — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available) or /tdd per task if executing in this session.

**Goal:** Make every test in the test plan pass. Do not add scope beyond the ACs/tests — read-only audit-list view (Settings → Impersonate tab) plus a requireAdmin-gated read API, reusing D1's `impersonation-audit-adapter.js` for reads. Never write to the audit table.
**Branch:** `feature/d3-impersonation-audit-log`
**Worktree:** current session worktree (branched fresh from `origin/master` @ `2bdf2439`)
**Test command:** `node tests/check-d3-impersonation-audit-log.js` (story-specific), `node scripts/run-all-tests.js` (full suite)

---

## File map

```
Create:
  tests/check-d3-impersonation-audit-log.js  — AC1-AC4 + NFR tests for this story

Modify:
  src/web-ui/server.js            — Task 0: ALTER TABLE ... ADD COLUMN IF NOT EXISTS ended_at
                                     (nullable, read-only for this story); Task 3: register
                                     GET /api/admin/impersonate/audit behind requireAdmin
  src/web-ui/routes/impersonation.js — Task 1: add handleGetImpersonationAuditList to
                                     createImpersonationHandlers(pool) (JSON read endpoint,
                                     AC1/AC2/AC3/AC4)
  src/web-ui/routes/settings.js    — Task 2: renderImpersonationAuditTab(rows), extend
                                     _renderTabNav/_TAB_CSS, extend renderSettingsPage +
                                     handleGetSettings to embed the audit list for admins
                                     (AC1/AC2/AC4)
```

No new D37 adapter (per DoR H-ADAPTER: "Reuses D1's adapter for reads, introduces no new one"). `impersonation-audit-adapter.js` is required directly wherever a read is needed; it is never modified.

---

## Task 0: Add the `ended_at` column D1 never created (schema prerequisite for AC1/AC2)

**Files:**
- Modify: `src/web-ui/server.js`

D1's real merged `impersonation_audit_log` table has no end-timestamp column at all (verified by reading `server.js` directly — see `decisions.md`, "d3 implementation, Task 0 investigation"). AC1/AC2 both require reading a real end timestamp. This task adds the column additively; it is a schema migration, not "writing to the audit table" (no INSERT/UPDATE of audit data is added by this story).

- [ ] **Step 1: Write the failing test**

```javascript
// tests/check-d3-impersonation-audit-log.js (excerpt — full file in Task 3)
test('server.js: ended_at column added to impersonation_audit_log (schema prerequisite)', function() {
  var src = fs.readFileSync(SERVER_PATH, 'utf8');
  assert.ok(/ALTER TABLE impersonation_audit_log[\s\S]{0,200}ended_at/.test(src),
    'expected an ALTER TABLE adding ended_at to impersonation_audit_log');
});
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-d3-impersonation-audit-log.js
```

Expected output: `[FAIL] server.js: ended_at column added to impersonation_audit_log (schema prerequisite)`

- [ ] **Step 3: Write minimal implementation**

In `server.js`, immediately after the existing `impersonation_audit_log` `CREATE TABLE IF NOT EXISTS` block (the one ending `console.log('[d1] impersonation_audit_log table ready')` / `.catch(...)`), add:

```javascript
    // d3: impersonation_audit_log has no end-timestamp column in D1's merged
    // schema -- AC1/AC2 need one to distinguish completed vs in-progress
    // sessions. Additive, idempotent, nullable -- D3 never writes to it (only
    // reads); D2's exit flow is expected to write it on session exit (see
    // decisions.md ARCH entry, "d3 implementation, Task 0 investigation").
    _creditsPool.query(`ALTER TABLE impersonation_audit_log
      ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ`).then(function() {
      console.log('[d3] impersonation_audit_log.ended_at column ready');
    }).catch(function(err) {
      console.error('[d3] impersonation_audit_log.ended_at migration failed:', err.message);
    });
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-d3-impersonation-audit-log.js
```

Expected output: `[PASS] server.js: ended_at column added to impersonation_audit_log (schema prerequisite)`

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: same 30 pre-existing failing files as the branch-setup baseline (see decisions.md RISK-ACCEPT), 0 new failures.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/server.js
git commit -m "d3: add ended_at column to impersonation_audit_log (schema prerequisite)"
```

---

## Task 1: Read-only audit-list API endpoint (AC1, AC2, AC3, AC4)

**Files:**
- Modify: `src/web-ui/routes/impersonation.js`
- Test: `tests/check-d3-impersonation-audit-log.js`

- [ ] **Step 1: Write the failing test**

```javascript
test('handleGetImpersonationAuditList: returns rows most-recent-first, admin/target/reason/timestamps present', async function() {
  var auditAdapter = freshRequireAuditAdapter();
  var pool = makeStatefulAuditPool();
  auditAdapter.setImpersonationAuditAdapter(pool);
  pool._rows.push(
    { id: 'a1', admin_login: 'alice', admin_tenant_id: 't-a', target_id: 2, target_login: 'bob', target_tenant_id: 't-b', reason: 'r1', created_at: '2026-01-01T00:00:00.000Z', ended_at: '2026-01-01T01:00:00.000Z' },
    { id: 'a2', admin_login: 'alice', admin_tenant_id: 't-a', target_id: 3, target_login: 'carol', target_tenant_id: 't-c', reason: 'r2', created_at: '2026-01-02T00:00:00.000Z', ended_at: null }
  );
  var routes = freshRequireImpersonationRoutes();
  var handlers = routes.createImpersonationHandlers({});
  var req = { session: {} };
  var res = makeRes();
  await handlers.handleGetImpersonationAuditList(req, res);

  assert.strictEqual(res._status, 200);
  var body = JSON.parse(res._body);
  assert.strictEqual(body.rows.length, 2);
});
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-d3-impersonation-audit-log.js
```

Expected output: `TypeError: handlers.handleGetImpersonationAuditList is not a function` (or equivalent `[FAIL]`)

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/routes/impersonation.js`, add the import and a new handler inside `createImpersonationHandlers`:

```javascript
// at top, alongside the existing require:
var { filterUsers, listImpersonationCandidates, getImpersonationCandidateById, startImpersonationSession } = require('../modules/impersonation');
var { listImpersonationAuditRows } = require('../adapters/impersonation-audit-adapter'); // d3
var csrf = require('../middleware/csrf');
```

```javascript
  /**
   * GET /api/admin/impersonate/audit — read-only audit list (d3, AC1/AC2/AC4).
   * Never writes to impersonation_audit_log. Reuses D1's adapter directly --
   * no new D37 adapter (DoR H-ADAPTER). Rows are already most-recent-first
   * (listImpersonationAuditRows: ORDER BY created_at DESC) -- not re-sorted
   * here. A row's ended_at is null for any session that has not been exited
   * yet (AC2) -- this handler passes that through as-is, it never fabricates
   * an end time.
   */
  async function handleGetImpersonationAuditList(req, res) {
    var rows = await listImpersonationAuditRows();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ rows: rows }));
  }
```

Add `handleGetImpersonationAuditList: handleGetImpersonationAuditList` to the factory's return object.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-d3-impersonation-audit-log.js
```

Expected output: `[PASS] handleGetImpersonationAuditList: returns rows most-recent-first, admin/target/reason/timestamps present`

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: same 30 pre-existing failures, 0 new.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/impersonation.js
git commit -m "d3: add read-only impersonation audit-list handler"
```

---

## Task 2: Wire the audit-list route behind requireAdmin (AC3)

**Files:**
- Modify: `src/web-ui/server.js`
- Test: `tests/check-d3-impersonation-audit-log.js`

- [ ] **Step 1: Write the failing test**

```javascript
test('AC3: non-admin request to GET /api/admin/impersonate/audit is rejected by requireAdmin, not just hidden client-side', async function() {
  var requireAdmin = require(REQUIRE_ADMIN_PATH).requireAdmin;
  var routes = freshRequireImpersonationRoutes();
  var handlers = routes.createImpersonationHandlers({});

  var req = { session: { userId: 9, role: 'user' } };
  var res = makeRes();

  var called = false;
  await requireAdmin(req, res, function() { called = true; });
  if (called) { await handlers.handleGetImpersonationAuditList(req, res); }

  assert.strictEqual(res._status, 403, 'a non-admin session must be rejected at the API layer directly');
  assert.ok(res._body.indexOf('admin_login') === -1, 'no audit row data must ever be produced for a non-admin');
});

test('server.js registers GET /api/admin/impersonate/audit behind requireAdmin', function() {
  var src = fs.readFileSync(SERVER_PATH, 'utf8');
  assert.ok(src.includes("'/api/admin/impersonate/audit'"), 'expected server.js to register GET /api/admin/impersonate/audit');
  var idx = src.indexOf("'/api/admin/impersonate/audit' && req.method === 'GET'");
  var snippet = src.slice(idx, idx + 400);
  assert.ok(snippet.includes('requireAdmin'), 'GET /api/admin/impersonate/audit must be gated by requireAdmin');
});
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-d3-impersonation-audit-log.js
```

Expected output: `[FAIL] server.js registers GET /api/admin/impersonate/audit behind requireAdmin` (route does not exist yet — first assertion on requireAdmin itself already passes since requireAdmin is tested standalone, but the route-registration assertion fails)

- [ ] **Step 3: Write minimal implementation**

In `server.js`, immediately after the existing `/api/admin/impersonate/start` `else if` block, add:

```javascript
  } else if (pathname === '/api/admin/impersonate/audit' && req.method === 'GET') {
    // d3 — read-only impersonation audit list (requireAdmin gate; AC3: rejected
    // at the API layer directly, not just hidden by the Settings UI tab)
    if (!_impersonationHandlers) {
      res.writeHead(503, { 'Content-Type': 'text/plain' });
      res.end('Impersonation unavailable');
    } else {
      let _raOk = false;
      await requireAdmin(req, res, () => { _raOk = true; });
      if (!_raOk) return;
      await _impersonationHandlers.handleGetImpersonationAuditList(req, res);
    }
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-d3-impersonation-audit-log.js
```

Expected output: `[PASS] server.js registers GET /api/admin/impersonate/audit behind requireAdmin`

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: same 30 pre-existing failures, 0 new.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/server.js
git commit -m "d3: register GET /api/admin/impersonate/audit behind requireAdmin"
```

---

## Task 3: Render the audit list in a new Settings → Impersonate tab (AC1, AC2, AC4)

**Files:**
- Modify: `src/web-ui/routes/settings.js`
- Test: `tests/check-d3-impersonation-audit-log.js`

- [ ] **Step 1: Write the failing test**

```javascript
test('AC1: renderImpersonationAuditTab shows admin, target, tenant, reason, both timestamps for a completed session', function() {
  var settings = freshRequireSettings();
  var html = settings.renderImpersonationAuditTab([
    { admin_login: 'alice', target_login: 'bob', target_tenant_id: 'tenant-b', reason: 'support ticket #42', created_at: '2026-01-01T00:00:00.000Z', ended_at: '2026-01-01T01:00:00.000Z' }
  ]);
  assert.ok(html.indexOf('alice') !== -1);
  assert.ok(html.indexOf('bob') !== -1);
  assert.ok(html.indexOf('tenant-b') !== -1);
  assert.ok(html.indexOf('support ticket #42') !== -1);
  assert.ok(html.indexOf('2026-01-01T00:00:00') !== -1, 'start timestamp shown');
  assert.ok(html.indexOf('2026-01-01T01:00:00') !== -1, 'end timestamp shown');
});

test('AC2: an in-progress session (ended_at null) shows a start time and a clear in-progress indicator, not blank/fake-ended', function() {
  var settings = freshRequireSettings();
  var html = settings.renderImpersonationAuditTab([
    { admin_login: 'alice', target_login: 'bob', target_tenant_id: 'tenant-b', reason: 'r', created_at: '2026-01-02T00:00:00.000Z', ended_at: null }
  ]);
  assert.ok(html.indexOf('2026-01-02T00:00:00') !== -1, 'start timestamp shown');
  assert.ok(/in progress/i.test(html), 'must clearly indicate in-progress');
});

test('AC4: an empty audit list shows "No impersonation sessions yet", not blank/error', function() {
  var settings = freshRequireSettings();
  var html = settings.renderImpersonationAuditTab([]);
  assert.ok(html.indexOf('No impersonation sessions yet') !== -1);
});

test('user-supplied reason/login fields are HTML-escaped', function() {
  var settings = freshRequireSettings();
  var html = settings.renderImpersonationAuditTab([
    { admin_login: '<script>x</script>', target_login: 'bob', target_tenant_id: 't', reason: '<img src=x onerror=alert(1)>', created_at: '2026-01-01T00:00:00.000Z', ended_at: null }
  ]);
  assert.ok(html.indexOf('<script>x</script>') === -1);
  assert.ok(html.indexOf('<img src=x onerror=alert(1)>') === -1);
  assert.ok(html.indexOf('&lt;script&gt;') !== -1);
});

test('non-admin gets no Impersonate tab/content at all, even if rows are passed in', function() {
  var settings = freshRequireSettings();
  var html = settings.renderSettingsPage({
    user: { login: 'jack' }, linkedSet: new Set(), isAdmin: false,
    impersonationAuditRows: [{ admin_login: 'should-never-appear', target_login: 'x', target_tenant_id: 'y', reason: 'z', created_at: 'now', ended_at: null }]
  });
  assert.ok(html.indexOf('tab-impersonate') === -1);
  assert.ok(html.indexOf('tab-panel-impersonate') === -1);
  assert.ok(html.indexOf('should-never-appear') === -1);
});
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-d3-impersonation-audit-log.js
```

Expected output: `TypeError: settings.renderImpersonationAuditTab is not a function`

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/routes/settings.js`:

1. Add a formatting helper and the render function (after `renderCreditsTab`):

```javascript
function _formatAuditTimestamp(ts) {
  if (!ts) return '';
  try { return new Date(ts).toISOString(); } catch (e) { return String(ts); }
}

/**
 * d3 — Render the Impersonate tab's panel content: a read-only, reverse-
 * chronological audit list (AC1, AC2, AC4). Rows are D1's real audit-table
 * rows (admin_login, target_login, target_tenant_id, reason, created_at,
 * ended_at) via impersonation-audit-adapter.js's listImpersonationAuditRows()
 * -- no new adapter (DoR H-ADAPTER). ended_at is null for any session that
 * has not been exited yet (D2's exit flow, not yet merged) -- rendered as a
 * clear "In progress" indicator, never as a blank cell or a fabricated time
 * (AC2). Never writes to the audit table -- read-only per this story's own
 * Coding Agent Instructions.
 * @param {Array<{admin_login:string, target_login:string, target_tenant_id:string, reason:string, created_at:*, ended_at:*}>} rows
 * @returns {string} HTML fragment (no <html>/<body> wrapper)
 */
function renderImpersonationAuditTab(rows) {
  rows = rows || [];

  var tableRows = rows.map(function(r) {
    var endCell = r.ended_at
      ? _escapeHtml(_formatAuditTimestamp(r.ended_at))
      : '<span class="sw-pill sw-pill--accent">In progress</span>';
    return (
      '<tr>' +
        '<td>' + _escapeHtml(r.admin_login) + '</td>' +
        '<td>' + _escapeHtml(r.target_login) + '</td>' +
        '<td>' + _escapeHtml(r.target_tenant_id) + '</td>' +
        '<td>' + _escapeHtml(r.reason) + '</td>' +
        '<td>' + _escapeHtml(_formatAuditTimestamp(r.created_at)) + '</td>' +
        '<td>' + endCell + '</td>' +
      '</tr>'
    );
  }).join('');

  var content = rows.length
    ? (
      '<table class="sw-table">' +
        '<thead><tr><th>Admin</th><th>Target</th><th>Tenant</th><th>Reason</th><th>Started</th><th>Ended</th></tr></thead>' +
        '<tbody>' + tableRows + '</tbody>' +
      '</table>'
    )
    : '<p class="sw-muted-note">No impersonation sessions yet</p>';

  return (
    '<div id="tab-panel-impersonate" class="sw-tab-panel" role="tabpanel" aria-labelledby="tab-impersonate">' +
      '<div class="sw-card sw-card--lg">' +
        '<div class="sw-section-title">Recent impersonation sessions</div>' +
        content +
      '</div>' +
    '</div>'
  );
}
```

2. Extend `_renderTabNav(isAdmin)` to add an Impersonate tab button (admin-only, alongside the existing Credits tab):

```javascript
function _renderTabNav(isAdmin) {
  var creditsTab = isAdmin
    ? '<button type="button" class="sw-settings-tab" id="tab-credits" role="tab" aria-selected="false" onclick="swShowSettingsTab(\'credits\')">Credits</button>'
    : '';
  var impersonateTab = isAdmin
    ? '<button type="button" class="sw-settings-tab" id="tab-impersonate" role="tab" aria-selected="false" onclick="swShowSettingsTab(\'impersonate\')">Impersonate</button>'
    : '';

  return (
    '<div class="sw-settings-tabs" role="tablist" aria-label="Settings sections">' +
      '<button type="button" class="sw-settings-tab sw-settings-tab--active" id="tab-profile" role="tab" aria-selected="true" onclick="swShowSettingsTab(\'profile\')">Profile</button>' +
      '<button type="button" class="sw-settings-tab" id="tab-billing" role="tab" aria-selected="false" onclick="swShowSettingsTab(\'billing\')">Billing</button>' +
      creditsTab +
      impersonateTab +
    '</div>'
  );
}
```

3. Add a `.sw-muted-note` rule to `_TAB_CSS` (empty-state text, reusing the existing `--muted` variable already used throughout this file):

```javascript
    '.sw-muted-note{color:var(--muted);font-size:13.5px}' +
```

4. In `renderSettingsPage`, require the adapter at the top of the file and embed the panel only for admins:

```javascript
var _impersonationAudit = require('../adapters/impersonation-audit-adapter'); // d3 -- reuses D1's adapter, no new one
```

```javascript
    (isAdmin ? renderCreditsTab(opts.creditsRows || [], csrfToken, { errorMessage: opts.creditsError }) : '') +
    // d3 (AC1/AC2/AC4): real, server-gated Impersonate audit content -- only
    // ever built when isAdmin is true, same data-fetch-layer gating as
    // Credits above (c3 precedent) -- a non-admin request never has
    // impersonationAuditRows populated, so there is nothing to hide
    // client-side.
    (isAdmin ? renderImpersonationAuditTab(opts.impersonationAuditRows || []) : '') +
    _TAB_JS;
```

5. In `handleGetSettings`, fetch the rows only when `isAdmin` (mirroring the existing `creditsRows` fetch) and pass them through:

```javascript
    var impersonationAuditRows = [];
    if (isAdmin) {
      impersonationAuditRows = await _impersonationAudit.listImpersonationAuditRows();
    }

    var html = renderSettingsPage({
      user: user,
      linkedSet: linkedSet,
      isAdmin: isAdmin,
      planState: planState,
      csrfToken: csrfToken,
      creditsRows: creditsRows,
      impersonationAuditRows: impersonationAuditRows
    });
```

6. Export the new function:

```javascript
module.exports = {
  PROVIDERS: PROVIDERS,
  renderProfileTab: renderProfileTab,
  renderBillingTab: renderBillingTab,
  renderCreditsTab: renderCreditsTab,
  renderImpersonationAuditTab: renderImpersonationAuditTab,
  renderSettingsPage: renderSettingsPage,
  createSettingsHandlers: createSettingsHandlers
};
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-d3-impersonation-audit-log.js
```

Expected output: all `[PASS]` for the Task 3 tests above.

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: same 30 pre-existing failures, 0 new — includes confirming `check-c1-settings-shell-and-profile-tab.js`, `check-c2-billing-tab.js`, `check-c3-credits-tab-restyle.js` still pass unmodified (settings.js is shared).

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/settings.js
git commit -m "d3: render impersonation audit list in a new Settings Impersonate tab"
```

---

## Task 4: NFR tests + full AC verification suite (Performance, Security)

**Files:**
- Modify: `tests/check-d3-impersonation-audit-log.js` (finalize)

- [ ] **Step 1: Write the failing test**

```javascript
test('NFR Performance: audit list read completes well under 1s against a 1000-row fixture', async function() {
  var auditAdapter = freshRequireAuditAdapter();
  var pool = makeStatefulAuditPool();
  auditAdapter.setImpersonationAuditAdapter(pool);
  for (var i = 0; i < 1000; i++) {
    pool._rows.push({ id: 'a' + i, admin_login: 'alice', admin_tenant_id: 't-a', target_id: i, target_login: 'user' + i, target_tenant_id: 't' + i, reason: 'r', created_at: new Date(2026, 0, 1, 0, 0, i).toISOString(), ended_at: null });
  }
  var start = Date.now();
  var rows = await auditAdapter.listImpersonationAuditRows();
  var elapsed = Date.now() - start;
  assert.strictEqual(rows.length, 1000);
  assert.ok(elapsed < 1000, 'expected under 1000ms, took ' + elapsed + 'ms');
});

test('NFR Security: no d3-touched file uses the banned req.session.token field', function() {
  var files = [
    path.resolve(__dirname, '../src/web-ui/routes/impersonation.js'),
    path.resolve(__dirname, '../src/web-ui/routes/settings.js')
  ];
  files.forEach(function(f) {
    var src = fs.readFileSync(f, 'utf8');
    assert.ok(!/req\.session\.token[^A]/.test(src), 'expected zero req.session.token matches in ' + f);
  });
});
```

- [ ] **Step 2: Run test — must fail (until Tasks 0-3 land)**

```bash
node tests/check-d3-impersonation-audit-log.js
```

Expected output: fails only if Tasks 0-3 are incomplete; once they're done both NFR tests should already pass with no additional implementation code (they exercise existing D1 adapter behaviour + a grep check).

- [ ] **Step 3: Write minimal implementation**

No production code needed — both NFR tests exercise code already written in Tasks 0-3.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-d3-impersonation-audit-log.js
```

Expected output: `[PASS]` for both NFR tests; full file summary `[d3] N passed, 0 failed`.

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: same 30 pre-existing failures, 0 new.

- [ ] **Step 6: Commit**

```bash
git add tests/check-d3-impersonation-audit-log.js
git commit -m "d3: add NFR performance/security tests for impersonation audit log"
```

---

## Task 5: Verify completion, open draft PR

Follow `skills/verify-completion/SKILL.md` then `skills/branch-complete/SKILL.md`:
- Run `node tests/check-d3-impersonation-audit-log.js` standalone — all ACs pass.
- Run `node scripts/run-all-tests.js` in the foreground — confirm exactly the same 30 pre-existing failing files, 0 new failures.
- Open a **draft** PR. Do not mark ready for review (High-oversight epic — human review required).
- Update `.github/pipeline-state.json` for `d3` (`stage`, `health`, `prStatus`, `prUrl`, `prNumber`) via `node bin/skills advance`/`gate-advance`, fetching from `origin/master` immediately before the write.
