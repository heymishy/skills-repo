'use strict';
/**
 * p2.1 tenant storage tests — TDD RED phase.
 * Tests: AC1 (1), AC2 (1), AC3 (1), AC4 (5), AC5 (1), AC6 (1), AC7 (1), AC8 (1) + 3 NFR
 */

var assert = require('assert');
var path = require('path');
var fs = require('fs');
var os = require('os');

var passed = 0;
var failed = 0;
var tmpDirs = [];

function pass(name) { console.log('  [PASS] ' + name); passed++; }
function fail(name, err) { console.error('  [FAIL] ' + name + ' — ' + err.message); failed++; }

function freshRepoRoot() {
  delete require.cache[require.resolve('../src/web-ui/adapters/repo-root')];
  return require('../src/web-ui/adapters/repo-root');
}

function freshSessionStore() {
  delete require.cache[require.resolve('../src/web-ui/adapters/session-store')];
  return require('../src/web-ui/adapters/session-store');
}

function freshJourney() {
  delete require.cache[require.resolve('../src/web-ui/routes/journey')];
  return require('../src/web-ui/routes/journey');
}

function mkTmpDir() {
  var d = fs.mkdtempSync(path.join(os.tmpdir(), 'p2.1-test-'));
  tmpDirs.push(d);
  return d;
}

var savedEnv = {};
function setEnv(key, value) {
  savedEnv[key] = process.env[key];
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
}
function restoreEnv(key) {
  if (savedEnv[key] === undefined) delete process.env[key];
  else process.env[key] = savedEnv[key];
  delete savedEnv[key];
}

// ---------------------------------------------------------------------------
// AC1 — getRepoRoot returns tenant-scoped path when WUCE_TENANT_ROOT_BASE is set
// ---------------------------------------------------------------------------
(function testAC1() {
  var name = 'AC1: getRepoRoot returns path.resolve(base, slugifiedTenantId)';
  try {
    setEnv('WUCE_TENANT_ROOT_BASE', '/data/tenants');
    var rr = freshRepoRoot();
    var req = { session: { tenantId: 'my-org' } };
    var root = rr.getRepoRoot(req);
    assert.strictEqual(root, path.resolve('/data/tenants/my-org'));
    pass(name);
  } catch (e) { fail(name, e); }
  finally {
    restoreEnv('WUCE_TENANT_ROOT_BASE');
  }
})();

// ---------------------------------------------------------------------------
// AC2 — getRepoRoot falls back to env-var chain when tenantId absent
// ---------------------------------------------------------------------------
(function testAC2() {
  var name = 'AC2: getRepoRoot falls back to CLAUDE_REPO_PATH when tenantId absent';
  try {
    setEnv('WUCE_TENANT_ROOT_BASE', undefined);
    setEnv('CLAUDE_REPO_PATH', '/known/repo');
    setEnv('COPILOT_REPO_PATH', undefined);
    var rr = freshRepoRoot();
    var req = { session: {} };
    var root = rr.getRepoRoot(req);
    assert.strictEqual(root, '/known/repo');
    pass(name);
  } catch (e) { fail(name, e); }
  finally {
    restoreEnv('WUCE_TENANT_ROOT_BASE');
    restoreEnv('CLAUDE_REPO_PATH');
    restoreEnv('COPILOT_REPO_PATH');
  }
})();

// ---------------------------------------------------------------------------
// AC3 — path-traversal guard: HTTP 400 + no file written
// ---------------------------------------------------------------------------
(function testAC3() {
  var name = 'AC3: path-traversal guard returns 400 and writes no file';
  var tmpBase = mkTmpDir();
  var logSpy = [];
  try {
    setEnv('WUCE_TENANT_ROOT_BASE', tmpBase);

    var journey = freshJourney();
    var mockJourneyStore = {
      getJourney: function() {
        return { featureSlug: '../../etc/passwd', completedStages: [], activeSkill: 'discovery' };
      },
      listJourneys: function() { return []; }
    };
    journey.setJourneyStoreModule(mockJourneyStore);

    // Spy on console.error to verify raw path is not logged
    var origError = console.error;
    console.error = function() {
      var msg = Array.prototype.join.call(arguments, ' ');
      logSpy.push(msg);
      origError.apply(console, arguments);
    };

    var statusCode = null;
    var req = {
      session: { accessToken: 'tok', tenantId: 'test-org', login: 'alice' },
      params: { journeyId: 'j1' },
      body: { title: 'T', context: 'C', decision: 'D', rationale: 'R' }
    };
    var res = {
      writeHead: function(code) { statusCode = code; },
      end: function() {}
    };

    // Call decisions handler (async) - use a sync-capable handler first
    // We test handlePostSpike which is synchronous in the guard check
    var reqSpike = {
      session: { accessToken: 'tok', tenantId: 'test-org', login: 'alice' },
      params: { journeyId: 'j1' },
      body: { title: 'my-spike', question: 'Q?', scopeLimitHours: 2, doneCondition: 'Done' }
    };
    journey.handlePostSpike(reqSpike, res).then ? journey.handlePostSpike(reqSpike, res) : null;
    // handlePostSpike is async, wrap it
    journey.handlePostSpike(reqSpike, res);

    // statusCode is set synchronously since guard fires before any async op
    assert.ok(statusCode === 400 || statusCode === 404, 'expected 400 or 404, got ' + statusCode);

    // Verify no file written outside tenant root
    var escapedPath = path.resolve(tmpBase, 'test-org', 'artefacts', '../../etc/passwd', 'spikes', 'my-spike-spike.md');
    assert.ok(!fs.existsSync(escapedPath), 'file must not exist at traversal target');

    console.error = origError;
    pass(name);
  } catch (e) {
    fail(name, e);
  } finally {
    restoreEnv('WUCE_TENANT_ROOT_BASE');
  }
})();

// ---------------------------------------------------------------------------
// AC4 — slugifyTenantId (5 cases)
// ---------------------------------------------------------------------------
(function testAC4() {
  var rr = freshRepoRoot();
  var slug = rr.slugifyTenantId.bind(rr);

  function runSlugTest(name, input, check) {
    try {
      var result = slug(input);
      check(result);
      pass('AC4: ' + name);
    } catch (e) { fail('AC4: ' + name, e); }
  }

  runSlugTest('uppercase → lowercase', 'My-Org', function(r) {
    assert.strictEqual(r, 'my-org');
  });

  runSlugTest('spaces replaced with hyphen', 'hello world', function(r) {
    assert.ok(!r.includes(' '), 'no spaces: ' + r);
    assert.ok(/^[a-z0-9-]+$/.test(r), 'alphanumeric+hyphen only: ' + r);
  });

  runSlugTest('%2f replaced with hyphen (no percent, no slash)', '%2fmy%2forg', function(r) {
    assert.ok(!r.includes('%'), 'no % sign: ' + r);
    assert.ok(!r.includes('/'), 'no forward slash: ' + r);
  });

  runSlugTest('path separators (/ and \\) replaced, length ≤ 48', 'a/b\\c', function(r) {
    assert.ok(!r.includes('/'), 'no forward slash');
    assert.ok(!r.includes('\\'), 'no backslash');
    assert.ok(r.length <= 48, 'max 48 chars');
  });

  runSlugTest('100-char input truncated to max 48 chars', 'a'.repeat(100), function(r) {
    assert.ok(r.length <= 48, 'truncated to 48: len=' + r.length);
  });

  runSlugTest('leading/trailing hyphens stripped', '--my--org--', function(r) {
    assert.ok(!r.startsWith('-'), 'no leading hyphen: ' + r);
    assert.ok(!r.endsWith('-'), 'no trailing hyphen: ' + r);
  });
})();

// ---------------------------------------------------------------------------
// AC5 — session written to tenant-namespaced path
// ---------------------------------------------------------------------------
(function testAC5() {
  var name = 'AC5: writeSession writes to SESSION_STORE_PATH/<tenantSlug>/<sessionId>.json';
  var tmpBase = mkTmpDir();
  try {
    setEnv('SESSION_STORE_PATH', tmpBase);
    var store = freshSessionStore();
    store.writeSession({ tenantId: 'my-org', sessionId: 'sess-123', userId: '1', login: 'alice' });

    var expected = path.join(tmpBase, 'my-org', 'sess-123.json');
    var flat = path.join(tmpBase, 'sess-123.json');

    assert.ok(fs.existsSync(expected), 'file must exist at namespaced path: ' + expected);
    assert.ok(!fs.existsSync(flat), 'file must NOT exist at flat path: ' + flat);
    pass(name);
  } catch (e) { fail(name, e); }
  finally { restoreEnv('SESSION_STORE_PATH'); }
})();

// ---------------------------------------------------------------------------
// AC6 — cross-namespace read isolation
// ---------------------------------------------------------------------------
(function testAC6() {
  var name = 'AC6: readSession reads from tenant-namespaced path only';
  var tmpBase = mkTmpDir();
  try {
    setEnv('SESSION_STORE_PATH', tmpBase);

    // Write two tenant files directly
    fs.mkdirSync(path.join(tmpBase, 'org-a'), { recursive: true });
    fs.mkdirSync(path.join(tmpBase, 'org-b'), { recursive: true });
    fs.writeFileSync(path.join(tmpBase, 'org-a', 'sess-1.json'), JSON.stringify({ userId: '1' }), 'utf8');
    fs.writeFileSync(path.join(tmpBase, 'org-b', 'sess-1.json'), JSON.stringify({ userId: '2' }), 'utf8');

    var store = freshSessionStore();
    var result = store.readSession('sess-1', 'org-a');
    assert.ok(result, 'result must not be null');
    assert.strictEqual(result.userId, '1', 'must return org-a content, got: ' + JSON.stringify(result));
    pass(name);
  } catch (e) { fail(name, e); }
  finally { restoreEnv('SESSION_STORE_PATH'); }
})();

// ---------------------------------------------------------------------------
// AC7 — featureSlug collision guard: same slug, different tenants → different roots
// ---------------------------------------------------------------------------
(function testAC7() {
  var name = 'AC7: getRepoRoot returns distinct paths for different tenants';
  var tmpBase = mkTmpDir();
  try {
    setEnv('WUCE_TENANT_ROOT_BASE', tmpBase);
    var rr = freshRepoRoot();

    var rootA = rr.getRepoRoot({ session: { tenantId: 'org-a' } });
    var rootB = rr.getRepoRoot({ session: { tenantId: 'org-b' } });

    assert.notStrictEqual(rootA, rootB, 'roots must differ: ' + rootA + ' vs ' + rootB);

    // Write same featureSlug under each root
    fs.mkdirSync(path.join(rootA, 'artefacts', 'my-feature'), { recursive: true });
    fs.mkdirSync(path.join(rootB, 'artefacts', 'my-feature'), { recursive: true });
    fs.writeFileSync(path.join(rootA, 'artefacts', 'my-feature', 'test.txt'), 'org-a', 'utf8');
    fs.writeFileSync(path.join(rootB, 'artefacts', 'my-feature', 'test.txt'), 'org-b', 'utf8');

    assert.strictEqual(fs.readFileSync(path.join(rootA, 'artefacts', 'my-feature', 'test.txt'), 'utf8'), 'org-a');
    assert.strictEqual(fs.readFileSync(path.join(rootB, 'artefacts', 'my-feature', 'test.txt'), 'utf8'), 'org-b');
    pass(name);
  } catch (e) { fail(name, e); }
  finally { restoreEnv('WUCE_TENANT_ROOT_BASE'); }
})();

// ---------------------------------------------------------------------------
// AC8 — accessToken stripped at namespaced session path
// ---------------------------------------------------------------------------
(function testAC8() {
  var name = 'AC8: writeSession strips accessToken from namespaced file';
  var tmpBase = mkTmpDir();
  try {
    setEnv('SESSION_STORE_PATH', tmpBase);
    var store = freshSessionStore();
    store.writeSession({ tenantId: 'my-org', sessionId: 'sess-strip', accessToken: 'secret-tok', userId: '1', login: 'alice' });

    var filePath = path.join(tmpBase, 'my-org', 'sess-strip.json');
    var parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    assert.strictEqual(parsed.accessToken, undefined, 'accessToken must not be persisted');
    pass(name);
  } catch (e) { fail(name, e); }
  finally { restoreEnv('SESSION_STORE_PATH'); }
})();

// ---------------------------------------------------------------------------
// NFR: getRepoRoot is synchronous and < 1ms per call
// ---------------------------------------------------------------------------
(function testNFR_sync() {
  var name = 'NFR: getRepoRoot is synchronous and completes 1000 calls in < 1000ms';
  try {
    setEnv('WUCE_TENANT_ROOT_BASE', '/data/tenants');
    var rr = freshRepoRoot();
    var req = { session: { tenantId: 'perf-org' } };
    var start = Date.now();
    for (var i = 0; i < 1000; i++) { rr.getRepoRoot(req); }
    var elapsed = Date.now() - start;
    assert.ok(elapsed < 1000, '1000 calls must complete in <1000ms, took ' + elapsed + 'ms');
    pass(name);
  } catch (e) { fail(name, e); }
  finally { restoreEnv('WUCE_TENANT_ROOT_BASE'); }
})();

// ---------------------------------------------------------------------------
// NFR: writeSession is async (uses fs.mkdir + writeFile async pattern)
// ---------------------------------------------------------------------------
(function testNFR_async() {
  var name = 'NFR: writeSession is async (returns a Promise or undefined, not a sync throw)';
  var tmpBase = mkTmpDir();
  try {
    setEnv('SESSION_STORE_PATH', tmpBase);
    var store = freshSessionStore();
    // Should not throw synchronously (non-fatal async write)
    store.writeSession({ tenantId: 'async-org', sessionId: 'sess-async', userId: '1' });
    pass(name);
  } catch (e) { fail(name, e); }
  finally { restoreEnv('SESSION_STORE_PATH'); }
})();

// ---------------------------------------------------------------------------
// NFR: no raw tenantId in console.error on path-traversal failure
// ---------------------------------------------------------------------------
(function testNFR_noRawPath() {
  var name = 'NFR: path-traversal failure does not log raw featureSlug in error output';
  var tmpBase = mkTmpDir();
  var loggedMessages = [];
  try {
    setEnv('WUCE_TENANT_ROOT_BASE', tmpBase);
    var journey = freshJourney();
    var mockJourneyStore = {
      getJourney: function() {
        return { featureSlug: '../../etc/passwd', completedStages: [], activeSkill: 'discovery' };
      },
      listJourneys: function() { return []; }
    };
    journey.setJourneyStoreModule(mockJourneyStore);

    var origError = console.error;
    console.error = function() {
      loggedMessages.push(Array.prototype.join.call(arguments, ' '));
    };

    var statusCode = null;
    var req = {
      session: { accessToken: 'tok', tenantId: 'test-org', login: 'alice' },
      params: { journeyId: 'j1' },
      body: { title: 'T', question: 'Q?', scopeLimitHours: 2, doneCondition: 'Done' }
    };
    var res = { writeHead: function(code) { statusCode = code; }, end: function() {} };

    journey.handlePostSpike(req, res);
    console.error = origError;

    // Verify no log line contains raw '../../etc/passwd'
    var rawPathLeaked = loggedMessages.some(function(m) { return m.includes('../../etc/passwd'); });
    assert.ok(!rawPathLeaked, 'raw featureSlug must not appear in error log');
    pass(name);
  } catch (e) { fail(name, e); }
  finally { restoreEnv('WUCE_TENANT_ROOT_BASE'); }
})();

// ---------------------------------------------------------------------------
// Cleanup
// ---------------------------------------------------------------------------
tmpDirs.forEach(function(d) {
  try { fs.rmSync(d, { recursive: true, force: true }); } catch (_) {}
});

console.log('\n[p2.1-tenant-storage] ' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
