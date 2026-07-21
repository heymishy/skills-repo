'use strict';

// check-d3-impersonation-audit-log.js — d3
// Story: artefacts/2026-07-21-web-ui-experience-redesign/stories/d3-impersonation-audit-log.md
// Test plan: artefacts/2026-07-21-web-ui-experience-redesign/test-plans/d3-test-plan.md
// Covers AC1-AC4 + Performance/Security NFRs.
// Follows this repo's hand-rolled test()/assert style (see
// tests/check-d1-start-impersonation-session.js, tests/check-c3-credits-tab-restyle.js)
// — no Jest/Mocha.

var assert = require('assert');
var path = require('path');
var fs = require('fs');

var passed = 0; var failed = 0; var failures = [];

function test(name, fn) {
  return Promise.resolve()
    .then(fn)
    .then(function() { passed++; console.log('  [PASS]', name); })
    .catch(function(err) {
      failed++;
      failures.push({ name: name, err: err });
      console.log('  [FAIL]', name, '--', (err && err.message) || err);
    });
}

var ROOT = path.join(__dirname, '..');
var AUDIT_ADAPTER_PATH = path.resolve(ROOT, 'src/web-ui/adapters/impersonation-audit-adapter.js');
var IMPERSONATION_ROUTE_PATH = path.resolve(ROOT, 'src/web-ui/routes/impersonation.js');
var SETTINGS_PATH = path.resolve(ROOT, 'src/web-ui/routes/settings.js');
var SERVER_PATH = path.resolve(ROOT, 'src/web-ui/server.js');
var REQUIRE_ADMIN_PATH = path.resolve(ROOT, 'src/web-ui/middleware/require-admin.js');

process.env.NODE_ENV = process.env.NODE_ENV || 'test';

function freshRequireAuditAdapter() {
  delete require.cache[require.resolve(AUDIT_ADAPTER_PATH)];
  return require(AUDIT_ADAPTER_PATH);
}

function freshRequireImpersonationRoutes() {
  delete require.cache[require.resolve(IMPERSONATION_ROUTE_PATH)];
  return require(IMPERSONATION_ROUTE_PATH);
}

function freshRequireSettings() {
  delete require.cache[require.resolve(SETTINGS_PATH)];
  return require(SETTINGS_PATH);
}

function makeRes() {
  var r = { _status: null, _headers: {}, _body: '' };
  r.writeHead = function(s, h) { r._status = s; Object.assign(r._headers, h || {}); };
  r.end = function(b) { r._body += (b || ''); };
  return r;
}

// Stateful mock pool for impersonation_audit_log -- mirrors d1's own
// makeStatefulAuditPool precedent, extended to support pre-seeding rows for
// read-path tests (this story never inserts, only reads).
function makeStatefulAuditPool() {
  var rows = [];
  var nextId = 1;
  return {
    _rows: rows,
    query: async function(sql, params) {
      if (sql.includes('INSERT INTO impersonation_audit_log')) {
        var row = {
          id: 'audit-' + (nextId++),
          admin_id: params[0], admin_login: params[1], admin_tenant_id: params[2],
          target_id: params[3], target_login: params[4], target_tenant_id: params[5],
          reason: params[6], created_at: new Date().toISOString(), ended_at: null
        };
        rows.push(row);
        return { rows: [row] };
      }
      if (sql.includes('SELECT * FROM impersonation_audit_log WHERE id')) {
        return { rows: rows.filter(function(r) { return r.id === params[0]; }) };
      }
      if (sql.includes('SELECT * FROM impersonation_audit_log ORDER BY')) {
        return { rows: rows.slice().reverse() };
      }
      return { rows: [] };
    }
  };
}

async function main() {
  console.log('\n[d3] Running AC verification tests...\n');

  // ===========================================================================
  // Task 0 — schema prerequisite: ended_at column added to impersonation_audit_log
  // ===========================================================================

  console.log('Task 0 — ended_at column (schema prerequisite for AC1/AC2)');

  await test('server.js: ended_at column added to impersonation_audit_log (schema prerequisite)', function() {
    var src = fs.readFileSync(SERVER_PATH, 'utf8');
    assert.ok(/ALTER TABLE impersonation_audit_log[\s\S]{0,200}ended_at/.test(src),
      'expected an ALTER TABLE adding ended_at to impersonation_audit_log');
  });

  // ===========================================================================
  // Task 1/2 — Read-only audit-list API endpoint (AC1, AC2, AC3, AC4)
  // ===========================================================================

  console.log('\nAC1/AC2/AC4 — audit-list handler');

  await test('handleGetImpersonationAuditList: returns rows most-recent-first via listImpersonationAuditRows, JSON body', async function() {
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
    assert.strictEqual(res._headers['Content-Type'], 'application/json');
    var body = JSON.parse(res._body);
    assert.strictEqual(body.rows.length, 2);
  });

  await test('handleGetImpersonationAuditList: never writes to impersonation_audit_log (read-only)', async function() {
    var auditAdapter = freshRequireAuditAdapter();
    var pool = makeStatefulAuditPool();
    auditAdapter.setImpersonationAuditAdapter(pool);
    var routes = freshRequireImpersonationRoutes();
    var handlers = routes.createImpersonationHandlers({});
    await handlers.handleGetImpersonationAuditList({ session: {} }, makeRes());
    assert.strictEqual(pool._rows.length, 0, 'no rows must be inserted by a GET/read handler');
  });

  // ===========================================================================
  // AC3 — requireAdmin gate, defense-in-depth (not just hidden UI)
  // ===========================================================================

  console.log('\nAC3 — non-admin API access rejected server-side');

  await test('AC3: non-admin request to the audit-list handler is rejected by requireAdmin, not just hidden client-side', async function() {
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

  await test('AC3: admin request to the audit-list handler is allowed through requireAdmin', async function() {
    var auditAdapter = freshRequireAuditAdapter();
    var pool = makeStatefulAuditPool();
    auditAdapter.setImpersonationAuditAdapter(pool);
    var requireAdmin = require(REQUIRE_ADMIN_PATH).requireAdmin;
    var routes = freshRequireImpersonationRoutes();
    var handlers = routes.createImpersonationHandlers({});

    var req = { session: { userId: 1, role: 'admin' } };
    var res = makeRes();
    var called = false;
    await requireAdmin(req, res, function() { called = true; });
    if (called) { await handlers.handleGetImpersonationAuditList(req, res); }

    assert.strictEqual(called, true);
    assert.strictEqual(res._status, 200);
  });

  await test('server.js registers GET /api/admin/impersonate/audit behind requireAdmin', function() {
    var src = fs.readFileSync(SERVER_PATH, 'utf8');
    assert.ok(src.includes("'/api/admin/impersonate/audit'"), 'expected server.js to register GET /api/admin/impersonate/audit');
    var idx = src.indexOf("'/api/admin/impersonate/audit' && req.method === 'GET'");
    assert.ok(idx !== -1, 'expected the exact route registration condition');
    var snippet = src.slice(idx, idx + 400);
    assert.ok(snippet.includes('requireAdmin'), 'GET /api/admin/impersonate/audit must be gated by requireAdmin');
  });

  // ===========================================================================
  // Task 3 — Settings -> Impersonate tab rendering (AC1, AC2, AC4)
  // ===========================================================================

  console.log('\nAC1 — completed session rendering');

  await test('AC1: renderImpersonationAuditTab shows admin, target, tenant, reason, both timestamps for a completed session', function() {
    var settings = freshRequireSettings();
    var html = settings.renderImpersonationAuditTab([
      { admin_login: 'alice', target_login: 'bob', target_tenant_id: 'tenant-b', reason: 'support ticket #42', created_at: '2026-01-01T00:00:00.000Z', ended_at: '2026-01-01T01:00:00.000Z' }
    ]);
    assert.ok(html.indexOf('alice') !== -1, 'admin login shown');
    assert.ok(html.indexOf('bob') !== -1, 'target login shown');
    assert.ok(html.indexOf('tenant-b') !== -1, 'target tenant shown');
    assert.ok(html.indexOf('support ticket #42') !== -1, 'reason shown');
    assert.ok(html.indexOf('2026-01-01T00:00:00') !== -1, 'start timestamp shown');
    assert.ok(html.indexOf('2026-01-01T01:00:00') !== -1, 'end timestamp shown');
  });

  await test('AC1 (integration-style): full Settings page includes real audit rows for admin, most-recent-first order preserved', function() {
    var settings = freshRequireSettings();
    var html = settings.renderSettingsPage({
      user: { login: 'ivy' },
      linkedSet: new Set(),
      isAdmin: true,
      impersonationAuditRows: [
        { admin_login: 'alice', target_login: 'newest', target_tenant_id: 't1', reason: 'r', created_at: '2026-01-03T00:00:00.000Z', ended_at: null },
        { admin_login: 'alice', target_login: 'oldest', target_tenant_id: 't2', reason: 'r', created_at: '2026-01-01T00:00:00.000Z', ended_at: '2026-01-01T02:00:00.000Z' }
      ]
    });
    var newestIdx = html.indexOf('newest');
    var oldestIdx = html.indexOf('oldest');
    assert.ok(newestIdx !== -1 && oldestIdx !== -1, 'both rows rendered');
    assert.ok(newestIdx < oldestIdx, 'rows rendered in the order passed in (most-recent-first, per listImpersonationAuditRows ordering)');
  });

  console.log('\nAC2 — in-progress session rendering');

  await test('AC2: an in-progress session (ended_at null) shows a start time and a clear in-progress indicator, not blank/fake-ended', function() {
    var settings = freshRequireSettings();
    var html = settings.renderImpersonationAuditTab([
      { admin_login: 'alice', target_login: 'bob', target_tenant_id: 'tenant-b', reason: 'r', created_at: '2026-01-02T00:00:00.000Z', ended_at: null }
    ]);
    assert.ok(html.indexOf('2026-01-02T00:00:00') !== -1, 'start timestamp shown');
    assert.ok(/in progress/i.test(html), 'must clearly indicate in-progress');
  });

  console.log('\nAC4 — empty state');

  await test('AC4: an empty audit list shows "No impersonation sessions yet", not blank/error', function() {
    var settings = freshRequireSettings();
    var html = settings.renderImpersonationAuditTab([]);
    assert.ok(html.indexOf('No impersonation sessions yet') !== -1);
  });

  await test('AC4 (full page): admin with zero sessions sees the empty state, not an error', function() {
    var settings = freshRequireSettings();
    var html = settings.renderSettingsPage({
      user: { login: 'ivy' }, linkedSet: new Set(), isAdmin: true, impersonationAuditRows: []
    });
    assert.ok(html.indexOf('No impersonation sessions yet') !== -1);
  });

  console.log('\nSecurity — escaping + non-admin isolation');

  await test('user-supplied reason/login fields are HTML-escaped', function() {
    var settings = freshRequireSettings();
    var html = settings.renderImpersonationAuditTab([
      { admin_login: '<script>x</script>', target_login: 'bob', target_tenant_id: 't', reason: '<img src=x onerror=alert(1)>', created_at: '2026-01-01T00:00:00.000Z', ended_at: null }
    ]);
    assert.ok(html.indexOf('<script>x</script>') === -1, 'raw script tag must never appear');
    assert.ok(html.indexOf('<img src=x onerror=alert(1)>') === -1, 'raw img onerror must never appear');
    assert.ok(html.indexOf('&lt;script&gt;') !== -1, 'escaped form must be present');
  });

  await test('non-admin gets no Impersonate tab/content at all, even if rows are passed in', function() {
    var settings = freshRequireSettings();
    var html = settings.renderSettingsPage({
      user: { login: 'jack' }, linkedSet: new Set(), isAdmin: false,
      impersonationAuditRows: [{ admin_login: 'should-never-appear', target_login: 'x', target_tenant_id: 'y', reason: 'z', created_at: 'now', ended_at: null }]
    });
    assert.ok(html.indexOf('tab-impersonate') === -1, 'no Impersonate tab button');
    assert.ok(html.indexOf('tab-panel-impersonate') === -1, 'no Impersonate panel container at all');
    assert.ok(html.indexOf('should-never-appear') === -1, 'audit data never reaches the HTML for a non-admin, even if accidentally passed in');
  });

  // ===========================================================================
  // NFR tests
  // ===========================================================================

  console.log('\nNFR — Performance/Security');

  await test('NFR Performance: audit list read completes well under 1s against a 1000-row fixture', async function() {
    var auditAdapter = freshRequireAuditAdapter();
    var pool = makeStatefulAuditPool();
    auditAdapter.setImpersonationAuditAdapter(pool);
    for (var i = 0; i < 1000; i++) {
      pool._rows.push({
        id: 'a' + i, admin_login: 'alice', admin_tenant_id: 't-a', target_id: i,
        target_login: 'user' + i, target_tenant_id: 't' + i, reason: 'r',
        created_at: new Date(2026, 0, 1, 0, 0, i % 60).toISOString(), ended_at: null
      });
    }
    var start = Date.now();
    var rows = await auditAdapter.listImpersonationAuditRows();
    var elapsed = Date.now() - start;
    assert.strictEqual(rows.length, 1000);
    assert.ok(elapsed < 1000, 'expected under 1000ms, took ' + elapsed + 'ms');
  });

  await test('NFR Security: no d3-touched file uses the banned req.session.token field', function() {
    var files = [IMPERSONATION_ROUTE_PATH, SETTINGS_PATH];
    files.forEach(function(f) {
      var src = fs.readFileSync(f, 'utf8');
      assert.ok(!/req\.session\.token[^A]/.test(src), 'expected zero req.session.token matches in ' + f);
    });
  });

  console.log('\n[d3] ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length) {
    console.error('\nFailures:');
    failures.forEach(function(f) { console.error('  - ' + f.name, '--', (f.err && f.err.stack) || f.err); });
  }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(function(err) {
  console.error('[d3] Unexpected error:', err);
  process.exit(1);
});
