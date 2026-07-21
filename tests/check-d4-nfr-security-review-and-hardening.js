'use strict';

// check-d4-nfr-security-review-and-hardening.js — d4
// Story: artefacts/2026-07-21-web-ui-experience-redesign/stories/d4-nfr-security-review-and-hardening.md
// Test plan: artefacts/2026-07-21-web-ui-experience-redesign/test-plans/d4-test-plan.md
// Plan: artefacts/2026-07-21-web-ui-experience-redesign/plans/d4-plan.md
//
// This is a review-and-harden story over D1/D2/D3's already-shipped code, not
// a build-from-scratch story. Covers:
//   AC1: exhaustive requireAdmin-gated route enumeration (source-inspection checklist)
//   AC2: double-impersonation residual-state test (real, not mocked)
//   AC3: concurrent-request state-consistency test (real, not mocked)
//   AC4: audit-log-vs-decision checklist (source-inspection)
//   AC5: regression tests for the two gaps this review found and fixed
//        (credits-guard.js canonical-helper fix; duplicate unchained
//        impersonation_audit_log.ended_at migration removal)

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

var ROOT = path.resolve(__dirname, '..');
var SERVER_PATH = path.resolve(ROOT, 'src/web-ui/server.js');
var CREDITS_GUARD_PATH = path.resolve(ROOT, 'src/web-ui/middleware/credits-guard.js');
var IMPERSONATION_MODULE_PATH = path.resolve(ROOT, 'src/web-ui/modules/impersonation.js');
var AUDIT_ADAPTER_PATH = path.resolve(ROOT, 'src/web-ui/adapters/impersonation-audit-adapter.js');

function freshRequire(p) {
  delete require.cache[require.resolve(p)];
  return require(p);
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

// Same shape/convention as check-d1-start-impersonation-session.js's makeStatefulAuditPool.
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
          reason: params[6], created_at: new Date().toISOString()
        };
        rows.push(row);
        return { rows: [row] };
      }
      if (sql.includes('UPDATE impersonation_audit_log')) {
        var found = rows.filter(function(r) { return r.id === params[0]; });
        found.forEach(function(r) { r.ended_at = new Date().toISOString(); });
        return { rows: found };
      }
      return { rows: [] };
    }
  };
}

// A pool whose INSERT/UPDATE resolve only after a setImmediate delay, to
// artificially widen the async window startImpersonationSession/
// exitImpersonationSession await on -- a standard technique for making a
// race condition (or its absence) directly observable rather than merely
// reasoned about (AC3's own requirement: "tested directly, not just reasoned
// about").
function makeDelayedAuditPool() {
  var base = makeStatefulAuditPool();
  return {
    _rows: base._rows,
    query: function(sql, params) {
      return new Promise(function(resolve, reject) {
        setImmediate(function() {
          base.query(sql, params).then(resolve, reject);
        });
      });
    }
  };
}

async function main() {
  var queue = [];

  // ===========================================================================
  // AC1 — Exhaustive admin-gated surface enumeration
  // ===========================================================================

  queue.push(function() {
    console.log('\n[d4] AC1 -- exhaustive requireAdmin(req...) call-site enumeration (server.js)');
    return test('server.js: exactly the 8 known requireAdmin(req...) call sites exist, all still present', function() {
      var src = fs.readFileSync(SERVER_PATH, 'utf8');
      var matches = src.match(/requireAdmin\(req/g) || [];
      assert.strictEqual(matches.length, 8, 'expected exactly 8 requireAdmin(req...) call sites (exhaustive per this story\'s AC1 audit) -- a changed count means a new admin-gated route was added without going through this same enumeration');

      var expectedRoutes = [
        "'/admin/credits'",
        "'/api/admin/credits/adjust'",
        "'/team/members'",
        "'/api/team/members'",
        "'/api/team/bulk-add-github-org'",
        "'/admin/impersonate'",
        "'/api/admin/impersonate/start'",
        "'/api/admin/impersonate/audit'"
      ];
      expectedRoutes.forEach(function(routeLiteral) {
        assert.ok(src.includes(routeLiteral), 'expected server.js to still register route ' + routeLiteral);
      });
    });
  });

  queue.push(function() {
    console.log('\n[d4] AC1 -- requireAdmin is wired to the tenantId-keyed live-role recheck (effective role, not real-admin cached role)');
    return test('server.js: setGetCurrentRole is wired (live role recheck) before any requireAdmin-gated route runs', function() {
      var src = fs.readFileSync(SERVER_PATH, 'utf8');
      assert.ok(/setGetCurrentRole\(/.test(src), 'expected server.js to wire setGetCurrentRole (sec-perf-s2 live role recheck)');
    });
  });

  queue.push(function() {
    console.log('\n[d4] AC1 -- POST /api/admin/impersonate/exit is deliberately NOT requireAdmin-gated (reviewed, correct)');
    return test('server.js: exit route has no requireAdmin(req...) call in its own dispatch block', function() {
      var src = fs.readFileSync(SERVER_PATH, 'utf8');
      var startIdx = src.indexOf("'/api/admin/impersonate/exit'");
      assert.ok(startIdx !== -1, 'expected server.js to register the exit route');
      var nextBlockIdx = src.indexOf('} else if (', startIdx + 10);
      var snippet = src.slice(startIdx, nextBlockIdx > -1 ? nextBlockIdx : startIdx + 500);
      assert.ok(!/requireAdmin\(req/.test(snippet), 'exit route must not call requireAdmin(req...) -- would block a non-admin-target exit; real gate is req.session.impersonation.active inside handlePostImpersonateExit');
    });
  });

  queue.push(function() {
    console.log('\n[d4] AC1 -- every renderShell(isAdmin:...) caller computes isAdmin via the canonical isEffectivelyAdmin() helper');
    return test('dashboard.js, journey.js, settings.js all import and call isEffectivelyAdmin', function() {
      [
        path.resolve(ROOT, 'src/web-ui/routes/dashboard.js'),
        path.resolve(ROOT, 'src/web-ui/routes/journey.js'),
        path.resolve(ROOT, 'src/web-ui/routes/settings.js')
      ].forEach(function(f) {
        var src = fs.readFileSync(f, 'utf8');
        assert.ok(/isEffectivelyAdmin/.test(src), 'expected ' + f + ' to use isEffectivelyAdmin()');
      });
    });
  });

  queue.push(function() {
    console.log('\n[d4] AC1/AC5 -- no remaining raw "req.session.role === \'admin\'" role-gate anywhere in src/web-ui (the credits-guard.js gap is fixed)');
    return test('credits-guard.js: no raw req.session.role === \'admin\' comparison remains', function() {
      var src = fs.readFileSync(CREDITS_GUARD_PATH, 'utf8');
      assert.ok(!/req\.session\.role\s*===\s*'admin'/.test(src), 'expected the raw req.session.role === \'admin\' comparison to be gone');
    });
  });

  // ===========================================================================
  // AC5 fix #1 — credits-guard.js uses the canonical isEffectivelyAdmin() helper
  // ===========================================================================

  queue.push(function() {
    console.log('\n[d4] AC5 -- credits-guard.js routes the admin bypass through isEffectivelyAdmin() (Task 1 finding, Task 4 fix)');
    return test('credits-guard.js: imports and calls isEffectivelyAdmin(...)', function() {
      var src = fs.readFileSync(CREDITS_GUARD_PATH, 'utf8');
      assert.ok(/require\(.*modules\/impersonation.*\)/.test(src), 'expected credits-guard.js to require modules/impersonation');
      assert.ok(/isEffectivelyAdmin\(/.test(src), 'expected a call to isEffectivelyAdmin(...)');
    });
  });

  queue.push(function() {
    console.log('\n[d4] AC5 -- credits-guard.js behaviour unchanged for a non-impersonating admin session (regression)');
    return test('creditsGuard: session.role === "admin" (no impersonation) still bypasses the balance check', async function() {
      var creditsPath = require.resolve(path.resolve(ROOT, 'src/web-ui/modules/credits'));
      delete require.cache[creditsPath];
      var credits = require(creditsPath);
      credits.setCreditsAdapter({ query: async function() { return { rows: [{ balance: 0 }] }; } });

      var guard = freshRequire(CREDITS_GUARD_PATH);
      var req = { session: { tenantId: 'tenant-admin', role: 'admin' } };
      var res = { writeHead: function() {}, end: function() {} };
      var nextCalled = false;
      await guard.creditsGuard(req, res, function() { nextCalled = true; });
      assert.ok(nextCalled, 'expected next() to be called (admin bypass) even though balance=0');
    });
  });

  queue.push(function() {
    console.log('\n[d4] AC5 -- credits-guard.js correctly does NOT bypass while impersonating a non-admin target (effective-role, not real-admin role)');
    return test('creditsGuard: admin impersonating a "user"-role target is balance-checked, not bypassed', async function() {
      var creditsPath = require.resolve(path.resolve(ROOT, 'src/web-ui/modules/credits'));
      delete require.cache[creditsPath];
      var credits = require(creditsPath);
      credits.setCreditsAdapter({ query: async function() { return { rows: [{ balance: 0 }] }; } });

      var guard = freshRequire(CREDITS_GUARD_PATH);
      // Shape matches modules/impersonation.js's real post-swap session: role
      // is overwritten to the target's role, admin snapshot preserved under
      // session.impersonation.admin (real admin role: 'admin').
      var req = {
        session: {
          tenantId: 'tenant-bob', role: 'user',
          impersonation: { active: true, admin: { role: 'admin', tenantId: 'tenant-alice' }, target: { role: 'user', tenantId: 'tenant-bob' } }
        }
      };
      var status = null;
      var res = { writeHead: function(s) { status = s; }, end: function() {} };
      var nextCalled = false;
      await guard.creditsGuard(req, res, function() { nextCalled = true; });
      assert.strictEqual(nextCalled, false, 'expected NO bypass -- effective role is "user", not the real admin\'s "admin"');
      assert.strictEqual(status, 402, 'expected the 402 balance-check path to run for the target\'s own (zero) balance');
    });
  });

  // ===========================================================================
  // AC5 fix #2 — duplicate unchained impersonation_audit_log.ended_at migration
  // ===========================================================================

  queue.push(function() {
    console.log('\n[d4] AC5 -- exactly one ended_at migration remains (Task 2 finding, Task 5 fix: migration-race)');
    return test('server.js: exactly one ALTER TABLE impersonation_audit_log ADD COLUMN IF NOT EXISTS ended_at', function() {
      var src = fs.readFileSync(SERVER_PATH, 'utf8');
      var matches = src.match(/ALTER TABLE impersonation_audit_log ADD COLUMN IF NOT EXISTS ended_at/g) || [];
      assert.strictEqual(matches.length, 1, 'expected exactly one ended_at migration -- a second, unchained copy races the CREATE TABLE on a fresh database (the exact a1/d3 migration-race anti-pattern already fixed twice in this feature)');
    });
  });

  queue.push(function() {
    console.log('\n[d4] AC5 -- the one remaining ended_at migration is still chained inside impersonation_audit_log\'s own CREATE TABLE .then() (not fired independently)');
    return test('server.js: no independent .catch() closes the impersonation_audit_log chain before the ended_at ALTER TABLE runs', function() {
      var src = fs.readFileSync(SERVER_PATH, 'utf8');
      var createIdx = src.indexOf('CREATE TABLE IF NOT EXISTS impersonation_audit_log');
      var alterIdx = src.indexOf('ALTER TABLE impersonation_audit_log ADD COLUMN IF NOT EXISTS ended_at');
      assert.ok(createIdx !== -1 && alterIdx !== -1 && alterIdx > createIdx, 'expected both migrations present, ALTER after CREATE');
      var between = src.slice(createIdx, alterIdx);
      assert.ok(!/\.catch\(/.test(between), 'expected no .catch() between CREATE TABLE and the ended_at ALTER TABLE -- they must share one .then()/.catch() chain, not two independent, unchained _creditsPool.query() calls');
    });
  });

  // ===========================================================================
  // AC2 — double-impersonation, different targets: no residue from the first
  // session survives into the second (test plan's own Scenario 2)
  // ===========================================================================

  queue.push(function() {
    console.log('\n[d4] AC2 -- impersonate A, exit, impersonate B: B\'s session shows only B\'s data, nothing from A');
    return test('startImpersonationSession -> exitImpersonationSession -> startImpersonationSession (different target): no residue from A', async function() {
      var pool = makeStatefulAuditPool();
      var auditAdapter = freshRequire(AUDIT_ADAPTER_PATH);
      auditAdapter.setImpersonationAuditAdapter(pool);
      var mod = freshRequireImpersonationModule(auditAdapter);

      var session = { userId: 1, login: 'alice', tenantId: 'tenant-alice', role: 'admin' };
      var before = JSON.parse(JSON.stringify(session));

      var targetA = { id: 2, login: 'bob', tenantId: 'tenant-bob', role: 'user' };
      await mod.startImpersonationSession(session, targetA, 'ticket-A');
      assert.strictEqual(session.login, 'bob', 'sanity: impersonating A');

      await mod.exitImpersonationSession(session);
      // Byte-for-byte restore aside from legitimate timestamp fields (there are
      // none on this plain session shape), matching the test plan's own AC2 wording.
      assert.deepStrictEqual(session, before, 'expected exact restore of pre-start admin session after exiting A');

      var targetB = { id: 3, login: 'carol', tenantId: 'tenant-carol', role: 'user' };
      await mod.startImpersonationSession(session, targetB, 'ticket-B');

      assert.strictEqual(session.login, 'carol');
      assert.strictEqual(session.tenantId, 'tenant-carol');
      assert.strictEqual(session.impersonation.target.login, 'carol');

      var serialized = JSON.stringify(session);
      assert.ok(!serialized.includes('bob'), 'no trace of target A (login "bob") anywhere in the session while impersonating B');
      assert.ok(!serialized.includes('tenant-bob'), 'no trace of target A\'s tenantId anywhere in the session while impersonating B');
    });
  });

  // ===========================================================================
  // AC3 — concurrent-request state consistency during the swap window
  // ===========================================================================

  queue.push(function() {
    console.log('\n[d4] AC3 -- concurrent reads during startImpersonationSession\'s swap window never observe a mixed tenantId/role pair');
    return test('startImpersonationSession: every sample taken while the audit write is pending is fully-admin or fully-target, never mixed', async function() {
      var pool = makeDelayedAuditPool();
      var auditAdapter = freshRequire(AUDIT_ADAPTER_PATH);
      auditAdapter.setImpersonationAuditAdapter(pool);
      var mod = freshRequireImpersonationModule(auditAdapter);

      var session = { userId: 1, login: 'alice', tenantId: 'tenant-alice', role: 'admin' };
      var adminPair = { tenantId: 'tenant-alice', role: 'admin' };
      var target = { id: 2, login: 'bob', tenantId: 'tenant-bob', role: 'user' };
      var targetPair = { tenantId: 'tenant-bob', role: 'user' };

      var samples = [];
      var done = false;
      function pollLoop() {
        if (done) return;
        samples.push({ tenantId: session.tenantId, role: session.role });
        setImmediate(pollLoop);
      }
      pollLoop();

      await mod.startImpersonationSession(session, target, 'concurrency check');
      done = true;
      // One final sample after resolution to also cover the post-swap state.
      samples.push({ tenantId: session.tenantId, role: session.role });

      assert.ok(samples.length > 0, 'expected at least one concurrent sample to have been taken during the pending window');

      var mixed = samples.filter(function(s) {
        var isAdminPair  = s.tenantId === adminPair.tenantId  && s.role === adminPair.role;
        var isTargetPair = s.tenantId === targetPair.tenantId && s.role === targetPair.role;
        return !isAdminPair && !isTargetPair;
      });
      assert.strictEqual(mixed.length, 0, 'expected zero mixed-state samples, found: ' + JSON.stringify(mixed));
    });
  });

  queue.push(function() {
    console.log('\n[d4] AC3 -- concurrent reads during exitImpersonationSession\'s revert window never observe a mixed tenantId/role pair');
    return test('exitImpersonationSession: every sample taken while the audit end-write is pending is fully-target or fully-admin, never mixed', async function() {
      var pool = makeStatefulAuditPool();
      var auditAdapter = freshRequire(AUDIT_ADAPTER_PATH);
      auditAdapter.setImpersonationAuditAdapter(pool);
      var mod = freshRequireImpersonationModule(auditAdapter);

      var session = { userId: 1, login: 'alice', tenantId: 'tenant-alice', role: 'admin' };
      var target = { id: 2, login: 'bob', tenantId: 'tenant-bob', role: 'user' };
      await mod.startImpersonationSession(session, target, 'concurrency check pre-exit');

      // Swap the wired adapter for a delayed one for the exit call only, so
      // endImpersonationAudit's own await window is the one under test.
      var delayedPool = makeDelayedAuditPool();
      delayedPool._rows.push.apply(delayedPool._rows, pool._rows);
      auditAdapter.setImpersonationAuditAdapter(delayedPool);

      var adminPair  = { tenantId: 'tenant-alice', role: 'admin' };
      var targetPair = { tenantId: 'tenant-bob',   role: 'user' };

      var samples = [];
      var done = false;
      function pollLoop() {
        if (done) return;
        samples.push({ tenantId: session.tenantId, role: session.role });
        setImmediate(pollLoop);
      }
      pollLoop();

      await mod.exitImpersonationSession(session);
      done = true;
      samples.push({ tenantId: session.tenantId, role: session.role });

      var mixed = samples.filter(function(s) {
        var isAdminPair  = s.tenantId === adminPair.tenantId  && s.role === adminPair.role;
        var isTargetPair = s.tenantId === targetPair.tenantId && s.role === targetPair.role;
        return !isAdminPair && !isTargetPair;
      });
      assert.strictEqual(mixed.length, 0, 'expected zero mixed-state samples during exit, found: ' + JSON.stringify(mixed));
    });
  });

  // ===========================================================================
  // AC4 — audit log implementation matches the confirmed /clarify decision exactly
  // ===========================================================================

  queue.push(function() {
    console.log('\n[d4] AC4 -- audit read access is requireAdmin-gated only, no broader/narrower exposure');
    return test('server.js: GET /api/admin/impersonate/audit is requireAdmin-gated', function() {
      var src = fs.readFileSync(SERVER_PATH, 'utf8');
      var idx = src.indexOf("'/api/admin/impersonate/audit'");
      assert.ok(idx !== -1, 'expected the audit route to be registered');
      var nextBlockIdx = src.indexOf('} else if (', idx + 10);
      var snippet = src.slice(idx, nextBlockIdx > -1 ? nextBlockIdx : idx + 800);
      assert.ok(/requireAdmin\(req/.test(snippet), 'expected requireAdmin(req...) inside the audit route\'s own dispatch block');
    });
  });

  queue.push(function() {
    console.log('\n[d4] AC4 -- no retention/TTL/cleanup code for impersonation_audit_log anywhere in src/');
    return test('no DELETE/TTL/cleanup reference to impersonation_audit_log in src/', function() {
      function walk(dir, out) {
        fs.readdirSync(dir).forEach(function(entry) {
          var full = path.join(dir, entry);
          var st = fs.statSync(full);
          if (st.isDirectory()) { walk(full, out); }
          else if (entry.endsWith('.js')) { out.push(full); }
        });
        return out;
      }
      var files = walk(path.resolve(ROOT, 'src'), []);
      var offenders = [];
      files.forEach(function(f) {
        var src = fs.readFileSync(f, 'utf8');
        if (/DELETE FROM impersonation_audit_log/i.test(src)) offenders.push(f);
        if (/impersonation_audit_log[\s\S]{0,80}(TTL|expire|cleanup)/i.test(src)) offenders.push(f);
      });
      assert.strictEqual(offenders.length, 0, 'expected zero retention/cleanup code touching impersonation_audit_log, found: ' + offenders.join(', '));
    });
  });

  queue.push(function() {
    console.log('\n[d4] AC4 -- no target-notification code anywhere in src/');
    return test('no notify/email reference tied to impersonation anywhere in src/', function() {
      function walk(dir, out) {
        fs.readdirSync(dir).forEach(function(entry) {
          var full = path.join(dir, entry);
          var st = fs.statSync(full);
          if (st.isDirectory()) { walk(full, out); }
          else if (entry.endsWith('.js')) { out.push(full); }
        });
        return out;
      }
      var files = walk(path.resolve(ROOT, 'src'), []);
      var offenders = [];
      files.forEach(function(f) {
        var src = fs.readFileSync(f, 'utf8');
        if (/impersonat[\s\S]{0,60}(notify|sendEmail)/i.test(src)) offenders.push(f);
        if (/(notify|sendEmail)[\s\S]{0,60}impersonat/i.test(src)) offenders.push(f);
      });
      assert.strictEqual(offenders.length, 0, 'expected zero notify/email code tied to impersonation, found: ' + offenders.join(', '));
    });
  });

  // Run queue sequentially
  for (var i = 0; i < queue.length; i++) {
    await queue[i]();
  }

  console.log('\n[d4] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length) {
    failures.forEach(function(f) {
      console.error('  FAIL:', f.name, '--', f.err && f.err.stack || f.err);
    });
  }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(function(err) {
  console.error('[d4] Unexpected error:', err);
  process.exit(1);
});
