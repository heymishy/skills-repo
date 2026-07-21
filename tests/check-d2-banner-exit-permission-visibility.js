'use strict';

// check-d2-banner-exit-permission-visibility.js — d2
// Story: artefacts/2026-07-21-web-ui-experience-redesign/stories/d2-banner-exit-and-permission-scoped-visibility.md
// Test plan: artefacts/2026-07-21-web-ui-experience-redesign/test-plans/d2-test-plan.md
// Covers AC1-AC5 + Performance/Security NFRs.

var assert = require('assert');
var path = require('path');
var fs = require('fs');

var passed = 0; var failed = 0; var failures = [];

function test(name, fn) {
  try {
    var result = fn();
    if (result && typeof result.then === 'function') {
      return result.then(
        function() { passed++; console.log('  [PASS]', name); },
        function(err) { failed++; failures.push({ name: name, err: err }); console.log('  [FAIL]', name, '--', err && err.message || err); }
      );
    }
    passed++; console.log('  [PASS]', name);
    return Promise.resolve();
  } catch (err) {
    failed++; failures.push({ name: name, err: err });
    console.log('  [FAIL]', name, '--', err && err.message || err);
    return Promise.resolve();
  }
}

var AUDIT_ADAPTER_PATH = path.resolve(__dirname, '../src/web-ui/adapters/impersonation-audit-adapter.js');
var IMPERSONATION_MODULE_PATH = path.resolve(__dirname, '../src/web-ui/modules/impersonation.js');
var IMPERSONATION_ROUTE_PATH = path.resolve(__dirname, '../src/web-ui/routes/impersonation.js');
var HTML_SHELL_PATH = path.resolve(__dirname, '../src/web-ui/utils/html-shell.js');
var DASHBOARD_PATH = path.resolve(__dirname, '../src/web-ui/routes/dashboard.js');
var SETTINGS_PATH = path.resolve(__dirname, '../src/web-ui/routes/settings.js');
var JOURNEY_PATH = path.resolve(__dirname, '../src/web-ui/routes/journey.js');
var SESSION_MIDDLEWARE_PATH = path.resolve(__dirname, '../src/web-ui/middleware/session.js');
var SERVER_PATH = path.resolve(__dirname, '../src/web-ui/server.js');

function freshRequire(p) {
  delete require.cache[require.resolve(p)];
  return require(p);
}

function freshRequireWithAuditMock(auditAdapterMod) {
  if (auditAdapterMod) {
    delete require.cache[require.resolve(AUDIT_ADAPTER_PATH)];
    require.cache[require.resolve(AUDIT_ADAPTER_PATH)] = {
      id: require.resolve(AUDIT_ADAPTER_PATH),
      filename: require.resolve(AUDIT_ADAPTER_PATH),
      loaded: true,
      exports: auditAdapterMod
    };
  }
  delete require.cache[require.resolve(IMPERSONATION_MODULE_PATH)];
  return require(IMPERSONATION_MODULE_PATH);
}

function freshRequireRoutes(impersonationMod) {
  if (impersonationMod) {
    delete require.cache[require.resolve(IMPERSONATION_MODULE_PATH)];
    require.cache[require.resolve(IMPERSONATION_MODULE_PATH)] = {
      id: require.resolve(IMPERSONATION_MODULE_PATH),
      filename: require.resolve(IMPERSONATION_MODULE_PATH),
      loaded: true,
      exports: impersonationMod
    };
  }
  delete require.cache[require.resolve(IMPERSONATION_ROUTE_PATH)];
  return require(IMPERSONATION_ROUTE_PATH);
}

function makeRes() {
  var r = { _status: null, _headers: {}, _body: '' };
  r.writeHead = function(s, h) { r._status = s; Object.assign(r._headers, h || {}); };
  r.end = function(b) { r._body += (b || ''); };
  return r;
}

var TEST_CSRF_TOKEN = 'd2-test-csrf-token';

function makeReqFromBody(bodyStr, session) {
  session.csrfToken = TEST_CSRF_TOKEN;
  var bodyWithCsrf = bodyStr ? (bodyStr + '&_csrf=' + TEST_CSRF_TOKEN) : ('_csrf=' + TEST_CSRF_TOKEN);
  return {
    session: session,
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    on: function(event, cb) {
      if (event === 'data') cb(bodyWithCsrf);
      if (event === 'end') cb();
    }
  };
}

// Stateful mock audit pool that supports both INSERT (start) and UPDATE (exit).
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
      if (sql.includes('UPDATE impersonation_audit_log')) {
        var match = rows.filter(function(r) { return r.id === params[params.length - 1]; });
        match.forEach(function(r) { r.ended_at = new Date().toISOString(); });
        return { rows: match };
      }
      if (sql.includes('SELECT * FROM impersonation_audit_log WHERE id')) {
        return { rows: rows.filter(function(r) { return r.id === params[0]; }) };
      }
      return { rows: [] };
    }
  };
}

// Audit pool whose UPDATE (exit) always throws -- exit-continues-anyway test.
function makeFailingExitAuditPool(baseRows) {
  return {
    _rows: baseRows,
    query: async function(sql) {
      if (sql.includes('UPDATE impersonation_audit_log')) {
        throw new Error('simulated transient DB error on exit');
      }
      return { rows: [] };
    }
  };
}

async function main() {
  var queue = [];

  // ===========================================================================
  // Task 1 — getEffectiveRole / isEffectivelyAdmin (AC2/AC3 core helper)
  // ===========================================================================

  queue.push(function() {
    console.log('\n[d2] T1 -- isEffectivelyAdmin: no impersonation, own real role used');
    return test('isEffectivelyAdmin: plain admin session -> true; plain user session -> false', function() {
      var mod = freshRequire(IMPERSONATION_MODULE_PATH);
      assert.strictEqual(mod.isEffectivelyAdmin({ role: 'admin' }), true);
      assert.strictEqual(mod.isEffectivelyAdmin({ role: 'user' }), false);
      assert.strictEqual(mod.isEffectivelyAdmin(null), false);
    });
  });

  queue.push(function() {
    console.log('\n[d2] T2 -- isEffectivelyAdmin: impersonating a non-admin hides admin, even for a real admin (AC2)');
    return test('isEffectivelyAdmin: real admin impersonating a user -> false (never leaks real role)', function() {
      var mod = freshRequire(IMPERSONATION_MODULE_PATH);
      var session = {
        role: 'user', // D1 already swaps this -- but the helper must not rely on that alone
        impersonation: { active: true, admin: { role: 'admin' }, target: { role: 'user' } }
      };
      assert.strictEqual(mod.isEffectivelyAdmin(session), false, 'must never read impersonation.admin.role for this check');
      assert.strictEqual(mod.getEffectiveRole(session), 'user');
    });
  });

  queue.push(function() {
    console.log('\n[d2] T3 -- isEffectivelyAdmin: impersonating an admin shows admin surfaces accurately (AC3, not a blanket hide)');
    return test('isEffectivelyAdmin: real admin impersonating another admin -> true', function() {
      var mod = freshRequire(IMPERSONATION_MODULE_PATH);
      var session = {
        role: 'admin',
        impersonation: { active: true, admin: { role: 'admin' }, target: { role: 'admin' } }
      };
      assert.strictEqual(mod.isEffectivelyAdmin(session), true);
      assert.strictEqual(mod.getEffectiveRole(session), 'admin');
    });
  });

  // ===========================================================================
  // Task 2 — exitImpersonationSession (AC4)
  // ===========================================================================

  queue.push(function() {
    console.log('\n[d2] T4 -- exitImpersonationSession: throws NOT_IMPERSONATING when not impersonating, no mutation');
    return test('exitImpersonationSession: no active impersonation -> throws, session untouched', async function() {
      var auditAdapter = freshRequire(AUDIT_ADAPTER_PATH);
      var pool = makeStatefulAuditPool();
      auditAdapter.setImpersonationAuditAdapter(pool);
      var mod = freshRequireWithAuditMock(auditAdapter);

      var session = { userId: 1, login: 'alice', tenantId: 'tenant-alice', role: 'admin' };
      var before = JSON.stringify(session);
      var threw = false;
      try {
        await mod.exitImpersonationSession(session);
      } catch (e) {
        threw = true;
        assert.strictEqual(e.code, 'NOT_IMPERSONATING');
      }
      assert.ok(threw, 'expected a throw when not impersonating');
      assert.strictEqual(JSON.stringify(session), before);
    });
  });

  queue.push(function() {
    console.log('\n[d2] T5 -- exitImpersonationSession: restores admin identity exactly and deletes all impersonation state (AC4)');
    return test('exitImpersonationSession: tenantId/login/role/userId restored, session.impersonation fully removed', async function() {
      var auditAdapter = freshRequire(AUDIT_ADAPTER_PATH);
      var pool = makeStatefulAuditPool();
      auditAdapter.setImpersonationAuditAdapter(pool);
      var mod = freshRequireWithAuditMock(auditAdapter);

      var session = { userId: 1, login: 'alice', tenantId: 'tenant-alice', role: 'admin' };
      var target = { id: 2, login: 'bob', tenantId: 'tenant-bob', role: 'user' };
      await mod.startImpersonationSession(session, target, 'investigating');
      assert.strictEqual(session.login, 'bob', 'sanity: impersonation started');

      await mod.exitImpersonationSession(session);

      assert.strictEqual(session.tenantId, 'tenant-alice');
      assert.strictEqual(session.login, 'alice');
      assert.strictEqual(session.role, 'admin');
      assert.strictEqual(session.userId, 1);
      assert.strictEqual(session.impersonation, undefined, 'no residual impersonation sub-object of any kind');
      assert.ok(!JSON.stringify(session).includes('bob'), 'no target-user data (login "bob") anywhere in the session after exit');
    });
  });

  queue.push(function() {
    console.log('\n[d2] T6 -- exitImpersonationSession: the SAME audit row gets ended_at set, not a new row (AC4/Audit NFR)');
    return test('exitImpersonationSession: exactly one audit row total, and it now has ended_at', async function() {
      var auditAdapter = freshRequire(AUDIT_ADAPTER_PATH);
      var pool = makeStatefulAuditPool();
      auditAdapter.setImpersonationAuditAdapter(pool);
      var mod = freshRequireWithAuditMock(auditAdapter);

      var session = { userId: 1, login: 'alice', tenantId: 'tenant-alice', role: 'admin' };
      var target = { id: 2, login: 'bob', tenantId: 'tenant-bob', role: 'user' };
      var startResult = await mod.startImpersonationSession(session, target, 'investigating');

      await mod.exitImpersonationSession(session);

      assert.strictEqual(pool._rows.length, 1, 'exit must not create a second audit row');
      assert.strictEqual(pool._rows[0].id, startResult.auditId, 'must be the exact same row start() created');
      assert.ok(pool._rows[0].ended_at, 'expected ended_at to be set on exit');
    });
  });

  queue.push(function() {
    console.log('\n[d2] T7 -- exitImpersonationSession: a failing audit UPDATE does not block the actual session revert (fail-open judgment call)');
    return test('exitImpersonationSession: audit UPDATE throwing still lets the session revert succeed', async function() {
      var auditAdapter = freshRequire(AUDIT_ADAPTER_PATH);
      var startPool = makeStatefulAuditPool();
      auditAdapter.setImpersonationAuditAdapter(startPool);
      var mod = freshRequireWithAuditMock(auditAdapter);

      var session = { userId: 1, login: 'alice', tenantId: 'tenant-alice', role: 'admin' };
      var target = { id: 2, login: 'bob', tenantId: 'tenant-bob', role: 'user' };
      await mod.startImpersonationSession(session, target, 'investigating');

      // Swap in a pool whose UPDATE always throws, simulating a DB hiccup at exit time.
      var failingAdapter = freshRequire(AUDIT_ADAPTER_PATH);
      failingAdapter.setImpersonationAuditAdapter(makeFailingExitAuditPool(startPool._rows));
      var mod2 = freshRequireWithAuditMock(failingAdapter);

      // exitImpersonationSession must not throw even though the audit UPDATE will.
      await mod2.exitImpersonationSession(session);

      assert.strictEqual(session.tenantId, 'tenant-alice', 'session must still revert despite the audit-log failure');
      assert.strictEqual(session.impersonation, undefined);
    });
  });

  queue.push(function() {
    console.log('\n[d2] T8 -- endImpersonationAudit throws when adapter unwired (D37 rule 1, same adapter)');
    return test('endImpersonationAudit throws when adapter unwired', async function() {
      var mod = freshRequire(AUDIT_ADAPTER_PATH);
      var threw = false;
      try { await mod.endImpersonationAudit('audit-1'); } catch (e) {
        threw = true;
        assert.ok(/Adapter not wired/.test(e.message));
      }
      assert.ok(threw);
    });
  });

  // ===========================================================================
  // Task 3 — handlePostImpersonateExit route handler
  // ===========================================================================

  queue.push(function() {
    console.log('\n[d2] T9 -- handlePostImpersonateExit: bad CSRF token rejected, session unchanged');
    return test('handlePostImpersonateExit: missing/bad _csrf -> non-200, session still impersonating', async function() {
      var routes = freshRequireRoutes();
      var handlers = routes.createImpersonationHandlers({});

      var session = {
        userId: 1, login: 'bob', tenantId: 'tenant-bob', role: 'user', csrfToken: 'real-token',
        impersonation: { active: true, admin: { userId: 1, login: 'alice', tenantId: 'tenant-alice', role: 'admin' }, target: { id: 2, login: 'bob', tenantId: 'tenant-bob', role: 'user' }, auditId: 'audit-1' }
      };
      var req = {
        session: session,
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        on: function(event, cb) {
          if (event === 'data') cb('_csrf=WRONG');
          if (event === 'end') cb();
        }
      };
      var res = makeRes();
      await handlers.handlePostImpersonateExit(req, res);

      assert.notStrictEqual(res._status, 200);
      assert.strictEqual(session.login, 'bob', 'session must be unchanged on CSRF rejection');
      assert.ok(session.impersonation && session.impersonation.active);
    });
  });

  queue.push(function() {
    console.log('\n[d2] T10 -- handlePostImpersonateExit: not currently impersonating -> 400, no adapter call');
    return test('handlePostImpersonateExit: session with no active impersonation -> 400', async function() {
      var routes = freshRequireRoutes();
      var handlers = routes.createImpersonationHandlers({});

      var session = { userId: 1, login: 'alice', tenantId: 'tenant-alice', role: 'admin' };
      var req = makeReqFromBody('', session);
      var res = makeRes();
      await handlers.handlePostImpersonateExit(req, res);

      assert.strictEqual(res._status, 400);
      assert.strictEqual(session.tenantId, 'tenant-alice');
    });
  });

  queue.push(function() {
    console.log('\n[d2] T11 -- handlePostImpersonateExit: valid request while impersonating -> 200, session reverted (AC4)');
    return test('handlePostImpersonateExit: real end-to-end exit via the route handler', async function() {
      var auditAdapter = freshRequire(AUDIT_ADAPTER_PATH);
      var pool = makeStatefulAuditPool();
      auditAdapter.setImpersonationAuditAdapter(pool);
      var impersonationMod = freshRequireWithAuditMock(auditAdapter);
      var routes = freshRequireRoutes(impersonationMod);
      var handlers = routes.createImpersonationHandlers({});

      var session = { userId: 1, login: 'alice', tenantId: 'tenant-alice', role: 'admin' };
      var target = { id: 2, login: 'bob', tenantId: 'tenant-bob', role: 'user' };
      await impersonationMod.startImpersonationSession(session, target, 'investigating');

      var req = makeReqFromBody('', session);
      var res = makeRes();
      await handlers.handlePostImpersonateExit(req, res);

      assert.strictEqual(res._status, 200);
      assert.strictEqual(session.login, 'alice');
      assert.strictEqual(session.tenantId, 'tenant-alice');
      assert.strictEqual(session.role, 'admin');
      assert.strictEqual(session.impersonation, undefined);
    });
  });

  // ===========================================================================
  // Task 4 — Banner rendering in html-shell.js (AC1)
  // ===========================================================================

  queue.push(function() {
    console.log('\n[d2] T12 -- renderShell: active impersonation renders the banner with target login/tenant + exit form (AC1)');
    return test('renderShell: banner markup present, includes target identity, exit form action, and CSRF token', function() {
      var shell = freshRequire(HTML_SHELL_PATH);
      var html = shell.renderShell({
        title: 'Test', bodyContent: '<p>hi</p>', user: { login: 'bob' }, active: 'dashboard',
        impersonation: { active: true, targetLogin: 'bob', targetTenantId: 'tenant-bob', csrfToken: 'tok123' }
      });
      assert.ok(html.includes('Viewing as'), 'expected banner text');
      assert.ok(html.includes('bob'), 'expected target login in banner');
      assert.ok(html.includes('tenant-bob'), 'expected target tenant in banner');
      assert.ok(html.includes('/api/admin/impersonate/exit'), 'expected exit form action');
      assert.ok(html.includes('tok123'), 'expected CSRF token embedded in exit form');
      assert.ok(html.includes('Exit impersonation'), 'expected explicit exit button text');
      assert.ok(/⚠/.test(html), 'expected the warning icon, not colour-only (Accessibility NFR)');
    });
  });

  queue.push(function() {
    console.log('\n[d2] T13 -- renderShell: no impersonation opt -> no banner markup at all');
    return test('renderShell: banner absent when not impersonating', function() {
      var shell = freshRequire(HTML_SHELL_PATH);
      var html = shell.renderShell({ title: 'Test', bodyContent: '<p>hi</p>', user: { login: 'bob' }, active: 'dashboard' });
      assert.ok(!html.includes('Viewing as'), 'expected no banner when not impersonating');
      assert.ok(!html.includes('<div class="sw-imp-banner"'), 'expected no banner container div when not impersonating (the CSS rule itself is always present, so check for the element, not the class name substring)');
    });
  });

  queue.push(function() {
    console.log('\n[d2] T14 -- renderShell: banner cannot be dismissed by any client-side control (AC1)');
    return test('renderShell: banner has no close/dismiss button or hide affordance other than the Exit form', function() {
      var shell = freshRequire(HTML_SHELL_PATH);
      var html = shell.renderShell({
        title: 'Test', bodyContent: '<p>hi</p>', user: { login: 'bob' }, active: 'dashboard',
        impersonation: { active: true, targetLogin: 'bob', targetTenantId: 'tenant-bob', csrfToken: 'tok123' }
      });
      var bannerStart = html.indexOf('sw-imp-banner');
      var bannerEnd = html.indexOf('</div>', bannerStart) > -1 ? html.indexOf('sw-app') : html.length;
      var bannerSection = html.slice(bannerStart, bannerEnd);
      assert.ok(!/dismiss|sw-close|onclick="swClose/.test(bannerSection), 'expected no dismiss control inside the banner');
    });
  });

  // ===========================================================================
  // Task 5 — Wire banner + effective-role visibility into 3 real pages
  // ===========================================================================

  queue.push(function() {
    console.log('\n[d2] T15 -- handleDashboard: impersonating a non-admin hides Admin credits + shows banner (AC1/AC2)');
    return test('handleDashboard: non-admin target -> no Admin credits link, banner present', function() {
      var dashboard = freshRequire(DASHBOARD_PATH);
      var session = {
        accessToken: 'tok', userId: 1, login: 'bob', tenantId: 'tenant-bob', role: 'user',
        impersonation: { active: true, admin: { userId: 1, login: 'alice', tenantId: 'tenant-alice', role: 'admin' }, target: { id: 2, login: 'bob', tenantId: 'tenant-bob', role: 'user' }, auditId: 'audit-1' }
      };
      var req = { session: session };
      var res = makeRes();
      dashboard.handleDashboard(req, res);

      assert.strictEqual(res._status, 200);
      assert.ok(!res._body.includes('/admin/credits'), 'expected no Admin credits nav link while impersonating a non-admin');
      assert.ok(res._body.includes('Viewing as'), 'expected the banner on the dashboard page');
      assert.ok(res._body.includes('bob'), 'expected target login in the banner');
    });
  });

  queue.push(function() {
    console.log('\n[d2] T16 -- handleDashboard: impersonating an admin shows Admin credits accurately (AC3)');
    return test('handleDashboard: admin target -> Admin credits link IS present', function() {
      var dashboard = freshRequire(DASHBOARD_PATH);
      var session = {
        accessToken: 'tok', userId: 1, login: 'carol', tenantId: 'tenant-carol', role: 'admin',
        impersonation: { active: true, admin: { userId: 1, login: 'alice', tenantId: 'tenant-alice', role: 'admin' }, target: { id: 3, login: 'carol', tenantId: 'tenant-carol', role: 'admin' }, auditId: 'audit-2' }
      };
      var req = { session: session };
      var res = makeRes();
      dashboard.handleDashboard(req, res);

      assert.ok(res._body.includes('/admin/credits'), 'expected Admin credits nav link when impersonating an admin');
    });
  });

  queue.push(function() {
    console.log('\n[d2] T17 -- handleGetSettings: non-admin target hides Credits + Impersonate tabs (AC2)');
    return test('handleGetSettings: non-admin target -> no Credits tab, no Impersonate tab, banner present', async function() {
      var settings = freshRequire(SETTINGS_PATH);
      var pool = {
        query: async function() { return { rows: [] }; }
      };
      var handlers = settings.createSettingsHandlers(pool);
      var session = {
        accessToken: 'tok', userId: 1, login: 'bob', tenantId: 'tenant-bob', role: 'user',
        impersonation: { active: true, admin: { userId: 1, login: 'alice', tenantId: 'tenant-alice', role: 'admin' }, target: { id: 2, login: 'bob', tenantId: 'tenant-bob', role: 'user' }, auditId: 'audit-1' }
      };
      var req = { session: session };
      var res = makeRes();
      await handlers.handleGetSettings(req, res);

      assert.ok(!res._body.includes('id="tab-credits"'), 'expected no Credits tab while impersonating a non-admin');
      assert.ok(!res._body.includes('Impersonate</'), 'expected no Impersonate tab while impersonating a non-admin');
      assert.ok(res._body.includes('Viewing as'), 'expected the banner on the settings page');
    });
  });

  queue.push(function() {
    console.log('\n[d2] T18 -- handleGetSettings: admin target shows Credits + Impersonate tabs accurately (AC3)');
    return test('handleGetSettings: admin target -> Credits and Impersonate tabs both present', async function() {
      var credits = freshRequire(path.resolve(__dirname, '../src/web-ui/modules/credits.js'));
      credits.setCreditsAdapter({ query: async function() { return { rows: [] }; } });
      var settings = freshRequire(SETTINGS_PATH);
      var pool = { query: async function() { return { rows: [] }; } };
      var handlers = settings.createSettingsHandlers(pool);
      var session = {
        accessToken: 'tok', userId: 1, login: 'carol', tenantId: 'tenant-carol', role: 'admin',
        impersonation: { active: true, admin: { userId: 1, login: 'alice', tenantId: 'tenant-alice', role: 'admin' }, target: { id: 3, login: 'carol', tenantId: 'tenant-carol', role: 'admin' }, auditId: 'audit-2' }
      };
      var req = { session: session };
      var res = makeRes();
      await handlers.handleGetSettings(req, res);

      assert.ok(res._body.includes('id="tab-credits"'), 'expected Credits tab when impersonating an admin');
      assert.ok(res._body.includes('Impersonate</'), 'expected Impersonate tab when impersonating an admin');
    });
  });

  // Integration test (AC1): banner renders via the shared shell from two
  // different, independent route handlers -- proving it comes from the
  // shell itself, not something each route remembers to add.
  queue.push(function() {
    console.log('\n[d2] T19 -- Banner renders via the shared shell from 2 independent route handlers (AC1)');
    return test('dashboard.js and settings.js both surface the shell banner for the same impersonation state', async function() {
      var dashboard = freshRequire(DASHBOARD_PATH);
      var settings = freshRequire(SETTINGS_PATH);
      var pool = { query: async function() { return { rows: [] }; } };
      var settingsHandlers = settings.createSettingsHandlers(pool);

      var impersonation = { active: true, admin: { userId: 1, login: 'alice', tenantId: 'tenant-alice', role: 'admin' }, target: { id: 2, login: 'bob', tenantId: 'tenant-bob', role: 'user' }, auditId: 'audit-1' };

      var dashRes = makeRes();
      dashboard.handleDashboard({ session: { accessToken: 'tok', userId: 1, login: 'bob', tenantId: 'tenant-bob', role: 'user', impersonation: impersonation } }, dashRes);

      var settingsRes = makeRes();
      await settingsHandlers.handleGetSettings({ session: { accessToken: 'tok', userId: 1, login: 'bob', tenantId: 'tenant-bob', role: 'user', impersonation: impersonation } }, settingsRes);

      assert.ok(dashRes._body.includes('Viewing as'), 'expected banner on dashboard');
      assert.ok(settingsRes._body.includes('Viewing as'), 'expected banner on settings -- same shell, same banner logic');
    });
  });

  // ===========================================================================
  // Task 6 — server.js wiring
  // ===========================================================================

  queue.push(function() {
    console.log('\n[d2] T20 -- server.js: ended_at migration present');
    return test('server.js: ALTER TABLE impersonation_audit_log ADD COLUMN IF NOT EXISTS ended_at', function() {
      var src = fs.readFileSync(SERVER_PATH, 'utf8');
      assert.ok(/ALTER TABLE impersonation_audit_log ADD COLUMN IF NOT EXISTS ended_at/.test(src));
    });
  });

  queue.push(function() {
    console.log('\n[d2] T21 -- server.js: POST /api/admin/impersonate/exit registered WITHOUT a requireAdmin gate');
    return test('server.js: exit route registered, no requireAdmin in its own block (effective-role would wrongly block a non-admin-target exit)', function() {
      var src = fs.readFileSync(SERVER_PATH, 'utf8');
      assert.ok(src.includes("'/api/admin/impersonate/exit'"), 'expected server.js to register POST /api/admin/impersonate/exit');
      var startIdx = src.indexOf("'/api/admin/impersonate/exit'");
      var nextBlockIdx = src.indexOf("} else if (", startIdx + 10);
      var snippet = src.slice(startIdx, nextBlockIdx > -1 ? nextBlockIdx : startIdx + 500);
      // Check for an actual requireAdmin(...) CALL, not just the word appearing
      // in an explanatory comment (this route's own comment legitimately
      // discusses why requireAdmin is deliberately not used here).
      assert.ok(!/requireAdmin\(req/.test(snippet), 'exit route must NOT call requireAdmin(req...) -- would block a non-admin-target exit');
      assert.ok(snippet.includes('handlePostImpersonateExit'), 'expected the exit route to delegate to handlePostImpersonateExit');
    });
  });

  // ===========================================================================
  // Task 7 — AC5: session expiry returns to signed-out, not a half-state
  // ===========================================================================

  queue.push(function() {
    console.log('\n[d2] T22 -- Session expiry during impersonation returns to signed-out, not a half-state (AC5)');
    return test('sessionMiddleware: expired session id issues a brand-new, empty session (no impersonation, no accessToken)', function() {
      var sessionMw = freshRequire(SESSION_MIDDLEWARE_PATH);
      sessionMw._clearForTesting();

      // Simulate an impersonating session that existed once, then "expired"
      // (server restart / store eviction) -- the in-memory store no longer
      // has this session id at all, mirroring a genuine expiry.
      var expiredCookie = 'session_id=' + 'a'.repeat(64);

      var req1 = { headers: { cookie: expiredCookie } };
      var res1 = { setHeader: function() {} };
      sessionMw.sessionMiddleware(req1, res1);

      assert.strictEqual(req1.session.impersonation, undefined, 'a fresh session after expiry must have no impersonation state');
      assert.strictEqual(req1.session.accessToken, undefined, 'a fresh session after expiry must have no accessToken -- treated as signed-out');
      assert.notStrictEqual(req1.sessionId, 'a'.repeat(64), 'expired session id must not be reused -- a genuinely new session is issued');
    });
  });

  // ===========================================================================
  // NFR tests
  // ===========================================================================

  queue.push(function() {
    console.log('\n[d2] T23 -- Security NFR: canonical session field used throughout this story\'s new/modified files');
    return test('no d2-touched file uses the banned req.session.token field', function() {
      var files = [IMPERSONATION_MODULE_PATH, IMPERSONATION_ROUTE_PATH, AUDIT_ADAPTER_PATH, HTML_SHELL_PATH, DASHBOARD_PATH, SETTINGS_PATH];
      files.forEach(function(f) {
        var src = fs.readFileSync(f, 'utf8');
        assert.ok(!/req\.session\.token[^A]/.test(src), 'expected zero req.session.token matches in ' + f);
      });
    });
  });

  queue.push(function() {
    console.log('\n[d2] T24 -- Security NFR: every existing requireAdmin-gated route already reflects the effective role (enumeration checklist)');
    return test('server.js: exactly 8 requireAdmin( gate call sites, all tenantId-keyed via D1\'s session swap (7 pre-existing + d3\'s new /api/admin/impersonate/audit route, merged after this count was first written)', function() {
      var src = fs.readFileSync(SERVER_PATH, 'utf8');
      var matches = src.match(/await requireAdmin\(/g) || [];
      assert.strictEqual(matches.length, 8, 'expected exactly 8 requireAdmin( gate call sites in server.js -- if this changes again, D4\'s security review checklist must be re-run against the new route. Went from 7 to 8 when d3\'s GET /api/admin/impersonate/audit route merged (verified to call requireAdmin the same standard way as every other gated route -- no route-specific bypass, so it automatically inherits D1\'s tenantId-keyed effective-role behaviour).');
      // Confirm the new route specifically is one of the 8, and calls requireAdmin
      // the identical way every other gated route does (no special-cased logic
      // that could bypass the effective-role behaviour D1 already established).
      var auditRouteBlock = src.slice(src.indexOf("pathname === '/api/admin/impersonate/audit'"), src.indexOf("pathname === '/api/admin/impersonate/audit'") + 600);
      assert.ok(/await requireAdmin\(req, res, \(\) => \{ _raOk = true; \}\)/.test(auditRouteBlock), 'expected d3\'s audit route to call requireAdmin the same standard way as every other gated route');
    });
  });

  // Run queue sequentially
  for (var i = 0; i < queue.length; i++) {
    await queue[i]();
  }

  console.log('\n[d2] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length) {
    failures.forEach(function(f) {
      console.error('  FAIL:', f.name, '--', f.err && f.err.stack || f.err);
    });
  }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(function(err) {
  console.error('[d2] Unexpected error:', err);
  process.exit(1);
});
