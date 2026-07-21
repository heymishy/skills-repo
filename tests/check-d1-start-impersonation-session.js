'use strict';

// check-d1-start-impersonation-session.js — d1
// Story: artefacts/2026-07-21-web-ui-experience-redesign/stories/d1-start-impersonation-session.md
// Test plan: artefacts/2026-07-21-web-ui-experience-redesign/test-plans/d1-test-plan.md
// Covers AC1-AC6 + Performance/Security NFRs.

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
var SERVER_PATH = path.resolve(__dirname, '../src/web-ui/server.js');

function freshRequireAuditAdapter() {
  delete require.cache[require.resolve(AUDIT_ADAPTER_PATH)];
  return require(AUDIT_ADAPTER_PATH);
}

function freshRequireImpersonationModule(auditAdapterMod) {
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

function freshRequireImpersonationRoutes(impersonationMod) {
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

var TEST_CSRF_TOKEN = 'd1-test-csrf-token';

function makeReqFromBody(bodyStr, session, query) {
  session.csrfToken = TEST_CSRF_TOKEN;
  var bodyWithCsrf = bodyStr + '&_csrf=' + TEST_CSRF_TOKEN;
  return {
    session: session,
    query: query || {},
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    on: function(event, cb) {
      if (event === 'data') cb(bodyWithCsrf);
      if (event === 'end') cb();
    }
  };
}

// Stateful mock pool for impersonation_audit_log -- tracks real rows so
// getImpersonationAuditRow/listImpersonationAuditRows can be exercised as a
// genuine round trip (AC6, mirrors arl-s5's makeStatefulMockDb precedent).
function makeStatefulAuditPool() {
  var rows = [];
  var nextId = 1;
  return {
    _rows: rows,
    query: async function(sql, params) {
      if (sql.includes('INSERT INTO impersonation_audit_log')) {
        var row = {
          id: 'audit-' + (nextId++),
          admin_id: params[0],
          admin_login: params[1],
          admin_tenant_id: params[2],
          target_id: params[3],
          target_login: params[4],
          target_tenant_id: params[5],
          reason: params[6],
          created_at: new Date().toISOString()
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

// Pool that always fails the audit INSERT (AC4).
function makeFailingAuditPool() {
  return {
    query: async function(sql) {
      if (sql.includes('INSERT INTO impersonation_audit_log')) {
        throw new Error('simulated transient DB error');
      }
      return { rows: [] };
    }
  };
}

// Fake pool for team_memberships/person_identities (listImpersonationCandidates).
function makeCandidatesPool(rows) {
  return {
    query: async function(sql) {
      if (sql.includes('FROM team_memberships')) {
        return { rows: rows };
      }
      return { rows: [] };
    }
  };
}

async function main() {
  var queue = [];

  // ===========================================================================
  // Task 1 — D37 adapter (impersonation-audit-adapter.js)
  // ===========================================================================

  queue.push(function() {
    console.log('\n[d1] T1 -- audit adapter stub throws when unwired (D37 rule 1)');
    return test('writeImpersonationAudit throws when adapter unwired', async function() {
      var mod = freshRequireAuditAdapter();
      var threw = false;
      try {
        await mod.writeImpersonationAudit({ adminId: 1, adminLogin: 'a', adminTenantId: 't', targetId: 2, targetLogin: 'b', targetTenantId: 't2', reason: 'x' });
      } catch (e) {
        threw = true;
        assert.ok(/Adapter not wired/.test(e.message), 'expected D37 message, got: ' + e.message);
      }
      assert.ok(threw, 'expected unwired stub to throw, not return null/empty');
    });
  });

  queue.push(function() {
    console.log('\n[d1] T2 -- writeImpersonationAudit writes exactly one row with correct fields (AC3)');
    return test('writeImpersonationAudit: one row, correct admin/target/reason fields', async function() {
      var mod = freshRequireAuditAdapter();
      var pool = makeStatefulAuditPool();
      mod.setImpersonationAuditAdapter(pool);
      var row = await mod.writeImpersonationAudit({
        adminId: 1, adminLogin: 'alice', adminTenantId: 'tenant-alice',
        targetId: 2, targetLogin: 'bob', targetTenantId: 'tenant-bob', reason: 'support ticket #42'
      });
      assert.strictEqual(pool._rows.length, 1, 'exactly one row must be written');
      assert.strictEqual(row.admin_login, 'alice');
      assert.strictEqual(row.target_login, 'bob');
      assert.strictEqual(row.reason, 'support ticket #42');
      assert.ok(row.created_at, 'row must have a created_at timestamp');
    });
  });

  queue.push(function() {
    console.log('\n[d1] T3 -- getImpersonationAuditRow/listImpersonationAuditRows round trip');
    return test('getImpersonationAuditRow retrieves the exact row just written', async function() {
      var mod = freshRequireAuditAdapter();
      var pool = makeStatefulAuditPool();
      mod.setImpersonationAuditAdapter(pool);
      var written = await mod.writeImpersonationAudit({
        adminId: 1, adminLogin: 'alice', adminTenantId: 'tenant-alice',
        targetId: 2, targetLogin: 'bob', targetTenantId: 'tenant-bob', reason: 'r'
      });
      var fetched = await mod.getImpersonationAuditRow(written.id);
      assert.deepStrictEqual(fetched, written);
      var all = await mod.listImpersonationAuditRows();
      assert.strictEqual(all.length, 1);
    });
  });

  // ===========================================================================
  // Task 2 — Core session-swap logic (modules/impersonation.js)
  // ===========================================================================

  queue.push(function() {
    console.log('\n[d1] T4 -- filterUsers matches on login or tenant substring (AC1)');
    return test('filterUsers: substring match against login or tenantId, case-insensitive', function() {
      var mod = freshRequireImpersonationModule();
      var users = [
        { login: 'alice', tenantId: 'tenant-a' },
        { login: 'bob', tenantId: 'tenant-b' },
        { login: 'carol', tenantId: 'tenant-alpha' },
        { login: 'dave', tenantId: 'tenant-d' },
        { login: 'erin-alpha', tenantId: 'tenant-e' }
      ];
      var results = mod.filterUsers(users, 'alp');
      assert.strictEqual(results.length, 2, 'expected exactly 2 matches for "alp"');
      var logins = results.map(function(u) { return u.login; }).sort();
      assert.deepStrictEqual(logins, ['carol', 'erin-alpha']);
    });
  });

  queue.push(function() {
    console.log('\n[d1] T5 -- filterUsers with empty query returns all, case-insensitive match (AC1)');
    return test('filterUsers: empty query returns full list; match is case-insensitive', function() {
      var mod = freshRequireImpersonationModule();
      var users = [{ login: 'Alice', tenantId: 'Tenant-A' }, { login: 'bob', tenantId: 'tenant-b' }];
      assert.strictEqual(mod.filterUsers(users, '').length, 2);
      assert.strictEqual(mod.filterUsers(users, 'ALICE').length, 1);
      assert.strictEqual(mod.filterUsers(users, 'tenant-a').length, 1);
    });
  });

  queue.push(function() {
    console.log('\n[d1] T6 -- start-session without a reason is rejected before any state change (AC2)');
    return test('startImpersonationSession: empty/whitespace reason throws REASON_REQUIRED, no session mutation', async function() {
      var reasons = ['', '   ', undefined, null];
      for (var i = 0; i < reasons.length; i++) {
        var auditAdapter = freshRequireAuditAdapter();
        var pool = makeStatefulAuditPool();
        auditAdapter.setImpersonationAuditAdapter(pool);
        var mod = freshRequireImpersonationModule(auditAdapter);

        var session = { userId: 1, login: 'alice', tenantId: 'tenant-alice', role: 'admin' };
        var sessionBefore = JSON.stringify(session);
        var threw = false;
        try {
          await mod.startImpersonationSession(session, { id: 2, login: 'bob', tenantId: 'tenant-bob', role: 'user' }, reasons[i]);
        } catch (e) {
          threw = true;
          assert.strictEqual(e.code, 'REASON_REQUIRED');
        }
        assert.ok(threw, 'expected a throw for reason=' + JSON.stringify(reasons[i]));
        assert.strictEqual(JSON.stringify(session), sessionBefore, 'session must be completely unchanged');
        assert.strictEqual(pool._rows.length, 0, 'no audit row for a rejected reason');
      }
    });
  });

  queue.push(function() {
    console.log('\n[d1] T7 -- session swap and audit write happen as a single atomic operation (AC3)');
    return test('startImpersonationSession: one audit row AND effective session reflects target, both true after one call', async function() {
      var auditAdapter = freshRequireAuditAdapter();
      var pool = makeStatefulAuditPool();
      auditAdapter.setImpersonationAuditAdapter(pool);
      var mod = freshRequireImpersonationModule(auditAdapter);

      var session = { userId: 1, login: 'alice', tenantId: 'tenant-alice', role: 'admin' };
      var target = { id: 2, login: 'bob', tenantId: 'tenant-bob', role: 'user' };
      var result = await mod.startImpersonationSession(session, target, 'investigating ticket #7');

      assert.strictEqual(pool._rows.length, 1, 'exactly one audit row');
      assert.strictEqual(session.tenantId, 'tenant-bob', 'effective tenantId must reflect target');
      assert.strictEqual(session.login, 'bob', 'effective login must reflect target');
      assert.strictEqual(session.role, 'user', 'effective role must reflect target');
      assert.strictEqual(session.impersonation.active, true);
      assert.strictEqual(session.impersonation.admin.login, 'alice', 'real admin identity preserved for exit/audit');
      assert.strictEqual(session.impersonation.admin.tenantId, 'tenant-alice');
      assert.strictEqual(session.impersonation.auditId, result.auditId);
      assert.strictEqual(pool._rows[0].admin_login, 'alice');
      assert.strictEqual(pool._rows[0].target_login, 'bob');
      assert.strictEqual(pool._rows[0].reason, 'investigating ticket #7');
    });
  });

  queue.push(function() {
    console.log('\n[d1] T8 -- accessToken and userId are never swapped (session-swap design decision)');
    return test('startImpersonationSession: req.session.accessToken and userId untouched by the swap', async function() {
      var auditAdapter = freshRequireAuditAdapter();
      var pool = makeStatefulAuditPool();
      auditAdapter.setImpersonationAuditAdapter(pool);
      var mod = freshRequireImpersonationModule(auditAdapter);

      var secretToken = 'ghp_admin_real_token_value';
      var session = { userId: 1, login: 'alice', tenantId: 'tenant-alice', role: 'admin', accessToken: secretToken };
      await mod.startImpersonationSession(session, { id: 2, login: 'bob', tenantId: 'tenant-bob', role: 'user' }, 'reason');

      assert.strictEqual(session.accessToken, secretToken, 'accessToken must remain the admin\'s own token');
      assert.strictEqual(session.userId, 1, 'userId must remain the admin\'s own userId');
      pool._rows.forEach(function(r) {
        Object.keys(r).forEach(function(k) {
          assert.notStrictEqual(r[k], secretToken, 'accessToken value must never appear in any audit row field');
        });
      });
    });
  });

  queue.push(function() {
    console.log('\n[d1] T9 -- a failing audit write prevents the session swap entirely (AC4)');
    return test('startImpersonationSession: audit INSERT throwing leaves the session completely untouched', async function() {
      var auditAdapter = freshRequireAuditAdapter();
      var failingPool = makeFailingAuditPool();
      auditAdapter.setImpersonationAuditAdapter(failingPool);
      var mod = freshRequireImpersonationModule(auditAdapter);

      var session = { userId: 1, login: 'alice', tenantId: 'tenant-alice', role: 'admin' };
      var sessionBefore = JSON.stringify(session);
      var threw = false;
      try {
        await mod.startImpersonationSession(session, { id: 2, login: 'bob', tenantId: 'tenant-bob', role: 'user' }, 'reason');
      } catch (e) {
        threw = true;
      }
      assert.ok(threw, 'expected the swap to throw when the audit write fails');
      assert.strictEqual(JSON.stringify(session), sessionBefore, 'session must still reflect the real admin, not the target -- no partial state');
      assert.strictEqual(session.impersonation, undefined, 'no impersonation sub-object must be created on a failed audit write');
    });
  });

  queue.push(function() {
    console.log('\n[d1] T10 -- a second impersonation attempt while already impersonating is rejected (AC5)');
    return test('startImpersonationSession: nested impersonation rejected, session still reflects user X not Y', async function() {
      var auditAdapter = freshRequireAuditAdapter();
      var pool = makeStatefulAuditPool();
      auditAdapter.setImpersonationAuditAdapter(pool);
      var mod = freshRequireImpersonationModule(auditAdapter);

      var session = { userId: 1, login: 'alice', tenantId: 'tenant-alice', role: 'admin' };
      await mod.startImpersonationSession(session, { id: 10, login: 'userX', tenantId: 'tenant-x', role: 'user' }, 'first reason');
      assert.strictEqual(pool._rows.length, 1);

      var threw = false;
      try {
        await mod.startImpersonationSession(session, { id: 20, login: 'userY', tenantId: 'tenant-y', role: 'user' }, 'second reason');
      } catch (e) {
        threw = true;
        assert.strictEqual(e.code, 'ALREADY_IMPERSONATING');
      }
      assert.ok(threw, 'expected the nested attempt to be rejected');
      assert.strictEqual(pool._rows.length, 1, 'no second audit row for the rejected nested attempt');
      assert.strictEqual(session.login, 'userX', 'session must still reflect user X, not Y');
      assert.strictEqual(session.tenantId, 'tenant-x');
    });
  });

  queue.push(function() {
    console.log('\n[d1] T11 -- setImpersonationAuditAdapter wiring: two sessions produce two distinct, retrievable rows (AC6, D37 wiring)');
    return test('two separate impersonation sessions resolve to two distinct, individually-correct audit rows', async function() {
      var auditAdapter = freshRequireAuditAdapter();
      var pool = makeStatefulAuditPool();
      auditAdapter.setImpersonationAuditAdapter(pool);
      var mod = freshRequireImpersonationModule(auditAdapter);

      var sessionAlice = { userId: 1, login: 'alice', tenantId: 'tenant-alice', role: 'admin' };
      var sessionBob = { userId: 3, login: 'bob-admin', tenantId: 'tenant-bob-admin', role: 'admin' };

      var resultX = await mod.startImpersonationSession(sessionAlice, { id: 10, login: 'userX', tenantId: 'tenant-x', role: 'user' }, 'reason X');
      var resultY = await mod.startImpersonationSession(sessionBob, { id: 20, login: 'userY', tenantId: 'tenant-y', role: 'user' }, 'reason Y');

      var rowX = await auditAdapter.getImpersonationAuditRow(resultX.auditId);
      var rowY = await auditAdapter.getImpersonationAuditRow(resultY.auditId);

      assert.notStrictEqual(rowX.id, rowY.id, 'the two audit rows must have distinct ids');
      assert.strictEqual(rowX.target_login, 'userX', 'session 1\'s row must name X');
      assert.strictEqual(rowY.target_login, 'userY', 'session 2\'s row must name Y');
      assert.strictEqual(rowX.admin_login, 'alice');
      assert.strictEqual(rowY.admin_login, 'bob-admin');
      assert.notDeepStrictEqual(rowX, rowY, 'the two rows must be genuinely different, not the same row duplicated');

      var all = await auditAdapter.listImpersonationAuditRows();
      assert.strictEqual(all.length, 2, 'both rows independently retrievable via listImpersonationAuditRows');
    });
  });

  queue.push(function() {
    console.log('\n[d1] T12 -- listImpersonationCandidates: real cross-tenant query shape (AC1 data source)');
    return test('listImpersonationCandidates: maps team_memberships rows to {tenantId, personId, role, login}', async function() {
      var mod = freshRequireImpersonationModule();
      var pool = makeCandidatesPool([
        { tenant_id: 'tenant-alice', person_id: 1, role: 'user', login: 'tenant-alice' },
        { tenant_id: 'tenant-bob', person_id: 2, role: 'admin', login: 'bob-linked-login' }
      ]);
      var candidates = await mod.listImpersonationCandidates(pool);
      assert.strictEqual(candidates.length, 2);
      assert.strictEqual(candidates[0].tenantId, 'tenant-alice');
      assert.strictEqual(candidates[0].login, 'tenant-alice');
      assert.strictEqual(candidates[1].login, 'bob-linked-login');
    });
  });

  // ===========================================================================
  // Task 3 — HTTP route handlers (routes/impersonation.js)
  // ===========================================================================

  queue.push(function() {
    console.log('\n[d1] T13 -- GET /admin/impersonate renders search input + CSRF-protected forms (AC1)');
    return test('handleGetImpersonatePage: renders filtered results with CSRF token embedded', async function() {
      var pool = makeCandidatesPool([
        { tenant_id: 'tenant-alice', person_id: 1, role: 'user', login: 'alice-login' },
        { tenant_id: 'tenant-bob', person_id: 2, role: 'admin', login: 'bob-login' }
      ]);
      var routes = freshRequireImpersonationRoutes();
      var handlers = routes.createImpersonationHandlers(pool);

      var req = { session: {}, query: { q: 'alice' } };
      var res = makeRes();
      await handlers.handleGetImpersonatePage(req, res);

      assert.strictEqual(res._status, 200);
      assert.ok(res._body.includes('alice-login'), 'expected alice-login in results');
      assert.ok(!res._body.includes('bob-login'), 'expected bob-login to be filtered out');
      assert.ok(res._body.includes('name="_csrf"'), 'expected a CSRF token field in the rendered form');
      assert.ok(res._body.includes('required'), 'expected the reason input to be marked required');
    });
  });

  queue.push(function() {
    console.log('\n[d1] T14 -- POST start without a reason returns 400, no session mutation (AC2)');
    return test('handlePostImpersonateStart: missing reason -> 400, session unchanged', async function() {
      var auditAdapter = freshRequireAuditAdapter();
      var pool = makeStatefulAuditPool();
      auditAdapter.setImpersonationAuditAdapter(pool);
      var impersonationMod = freshRequireImpersonationModule(auditAdapter);
      var routes = freshRequireImpersonationRoutes(impersonationMod);
      var handlers = routes.createImpersonationHandlers({});

      var session = { userId: 1, login: 'alice', tenantId: 'tenant-alice', role: 'admin' };
      var req = makeReqFromBody('targetId=2&targetLogin=bob&targetTenantId=tenant-bob&targetRole=user&reason=', session);
      var res = makeRes();
      await handlers.handlePostImpersonateStart(req, res);

      assert.strictEqual(res._status, 400);
      assert.strictEqual(session.tenantId, 'tenant-alice', 'session must be unchanged');
      assert.strictEqual(pool._rows.length, 0);
    });
  });

  queue.push(function() {
    console.log('\n[d1] T15 -- POST start with a reason succeeds and swaps the session (AC3)');
    return test('handlePostImpersonateStart: valid request -> 200, session swapped, one audit row', async function() {
      var auditAdapter = freshRequireAuditAdapter();
      var pool = makeStatefulAuditPool();
      auditAdapter.setImpersonationAuditAdapter(pool);
      var impersonationMod = freshRequireImpersonationModule(auditAdapter);
      var routes = freshRequireImpersonationRoutes(impersonationMod);
      var handlers = routes.createImpersonationHandlers({});

      var session = { userId: 1, login: 'alice', tenantId: 'tenant-alice', role: 'admin' };
      var req = makeReqFromBody('targetId=2&targetLogin=bob&targetTenantId=tenant-bob&targetRole=user&reason=support+ticket', session);
      var res = makeRes();
      await handlers.handlePostImpersonateStart(req, res);

      assert.strictEqual(res._status, 200);
      assert.strictEqual(session.login, 'bob');
      assert.strictEqual(session.tenantId, 'tenant-bob');
      assert.strictEqual(pool._rows.length, 1);
    });
  });

  queue.push(function() {
    console.log('\n[d1] T16 -- POST start while already impersonating returns 409 (AC5)');
    return test('handlePostImpersonateStart: second attempt while impersonating -> 409, still reflects first target', async function() {
      var auditAdapter = freshRequireAuditAdapter();
      var pool = makeStatefulAuditPool();
      auditAdapter.setImpersonationAuditAdapter(pool);
      var impersonationMod = freshRequireImpersonationModule(auditAdapter);
      var routes = freshRequireImpersonationRoutes(impersonationMod);
      var handlers = routes.createImpersonationHandlers({});

      var session = { userId: 1, login: 'alice', tenantId: 'tenant-alice', role: 'admin' };
      var req1 = makeReqFromBody('targetId=10&targetLogin=userX&targetTenantId=tenant-x&targetRole=user&reason=first', session);
      await handlers.handlePostImpersonateStart(req1, makeRes());

      var req2 = makeReqFromBody('targetId=20&targetLogin=userY&targetTenantId=tenant-y&targetRole=user&reason=second', session);
      var res2 = makeRes();
      await handlers.handlePostImpersonateStart(req2, res2);

      assert.strictEqual(res2._status, 409);
      assert.strictEqual(session.login, 'userX', 'session must still reflect X, not Y');
      assert.strictEqual(pool._rows.length, 1, 'no second audit row for the rejected nested attempt');
    });
  });

  queue.push(function() {
    console.log('\n[d1] T17 -- POST start rejects a request with no/invalid CSRF token');
    return test('handlePostImpersonateStart: missing CSRF token is rejected before any session mutation', async function() {
      var auditAdapter = freshRequireAuditAdapter();
      var pool = makeStatefulAuditPool();
      auditAdapter.setImpersonationAuditAdapter(pool);
      var impersonationMod = freshRequireImpersonationModule(auditAdapter);
      var routes = freshRequireImpersonationRoutes(impersonationMod);
      var handlers = routes.createImpersonationHandlers({});

      var session = { userId: 1, login: 'alice', tenantId: 'tenant-alice', role: 'admin', csrfToken: 'real-token' };
      var bodyStr = 'targetId=2&targetLogin=bob&targetTenantId=tenant-bob&targetRole=user&reason=x&_csrf=WRONG';
      var req = {
        session: session,
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        on: function(event, cb) {
          if (event === 'data') cb(bodyStr);
          if (event === 'end') cb();
        }
      };
      var res = makeRes();
      await handlers.handlePostImpersonateStart(req, res);

      assert.notStrictEqual(res._status, 200, 'expected a non-200 response for a bad CSRF token');
      assert.strictEqual(session.tenantId, 'tenant-alice', 'session must be unchanged');
      assert.strictEqual(pool._rows.length, 0);
    });
  });

  // ===========================================================================
  // Task 4 — server.js D37 production wiring (grep-based, matches this repo's
  // own check-a1-modules-taxonomy-crud.js convention)
  // ===========================================================================

  queue.push(function() {
    console.log('\n[d1] T18 -- server.js wires setImpersonationAuditAdapter and creates impersonation_audit_log (D37 production wiring)');
    return test('server.js: setImpersonationAuditAdapter called, impersonation_audit_log table created', function() {
      var src = fs.readFileSync(SERVER_PATH, 'utf8');
      assert.ok(/setImpersonationAuditAdapter\(/.test(src), 'expected server.js to call setImpersonationAuditAdapter(...)');
      assert.ok(/CREATE TABLE IF NOT EXISTS impersonation_audit_log/.test(src), 'expected server.js to create impersonation_audit_log');
      var idx = src.indexOf('CREATE TABLE IF NOT EXISTS impersonation_audit_log');
      var snippet = src.slice(idx, idx + 600);
      ['admin_id', 'admin_login', 'admin_tenant_id', 'target_id', 'target_login', 'target_tenant_id', 'reason', 'created_at'].forEach(function(col) {
        assert.ok(snippet.includes(col), 'impersonation_audit_log table must include column: ' + col);
      });
    });
  });

  queue.push(function() {
    console.log('\n[d1] T19 -- server.js registers the impersonation routes behind requireAdmin');
    return test('server.js: /admin/impersonate and /api/admin/impersonate/start routes registered', function() {
      var src = fs.readFileSync(SERVER_PATH, 'utf8');
      assert.ok(src.includes("'/admin/impersonate'"), 'expected server.js to register GET /admin/impersonate');
      assert.ok(src.includes("'/api/admin/impersonate/start'"), 'expected server.js to register POST /api/admin/impersonate/start');
      var startIdx = src.indexOf("'/admin/impersonate' && req.method === 'GET'");
      var snippet = src.slice(startIdx, startIdx + 400);
      assert.ok(snippet.includes('requireAdmin'), 'GET /admin/impersonate must be gated by requireAdmin');
    });
  });

  // ===========================================================================
  // NFR tests
  // ===========================================================================

  queue.push(function() {
    console.log('\n[d1] T20 -- Performance NFR: session start completes within 1 second');
    return test('startImpersonationSession completes in under 1000ms under normal conditions', async function() {
      var auditAdapter = freshRequireAuditAdapter();
      var pool = makeStatefulAuditPool();
      auditAdapter.setImpersonationAuditAdapter(pool);
      var mod = freshRequireImpersonationModule(auditAdapter);

      var session = { userId: 1, login: 'alice', tenantId: 'tenant-alice', role: 'admin' };
      var start = Date.now();
      await mod.startImpersonationSession(session, { id: 2, login: 'bob', tenantId: 'tenant-bob', role: 'user' }, 'perf check');
      var elapsed = Date.now() - start;
      assert.ok(elapsed < 1000, 'expected under 1000ms, took ' + elapsed + 'ms');
    });
  });

  queue.push(function() {
    console.log('\n[d1] T21 -- Security NFR: canonical session field used throughout this story\'s new files');
    return test('no d1 file uses the banned req.session.token field', function() {
      var files = [
        path.resolve(__dirname, '../src/web-ui/adapters/impersonation-audit-adapter.js'),
        path.resolve(__dirname, '../src/web-ui/modules/impersonation.js'),
        path.resolve(__dirname, '../src/web-ui/routes/impersonation.js')
      ];
      files.forEach(function(f) {
        var src = fs.readFileSync(f, 'utf8');
        assert.ok(!/req\.session\.token[^A]/.test(src), 'expected zero req.session.token matches in ' + f);
      });
    });
  });

  // Run queue sequentially
  for (var i = 0; i < queue.length; i++) {
    await queue[i]();
  }

  console.log('\n[d1] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length) {
    failures.forEach(function(f) {
      console.error('  FAIL:', f.name, '--', f.err && f.err.stack || f.err);
    });
  }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(function(err) {
  console.error('[d1] Unexpected error:', err);
  process.exit(1);
});
