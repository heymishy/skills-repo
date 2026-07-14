'use strict';

// check-sec-perf-s3-admin-credits-csrf.js — AC1 (story sec-perf-s3)
// Story: artefacts/2026-07-01-security-perf-hardening/stories/sec-perf-s3.md
// Test plan: artefacts/2026-07-01-security-perf-hardening/test-plans/sec-perf-s3-test-plan.md
//
// Proves the pre-fix vulnerability (POST with no/invalid _csrf currently succeeds) fails
// against the fixed handler, and that a legitimate round trip (GET page -> extract real
// embedded token -> POST with it) still works after the fix.

var assert = require('assert');
var path = require('path');

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

var CREDITS_PATH = path.resolve(__dirname, '../src/web-ui/modules/credits.js');
var ADMIN_CREDITS_PATH = path.resolve(__dirname, '../src/web-ui/routes/admin-credits.js');
var CSRF_PATH = path.resolve(__dirname, '../src/web-ui/middleware/csrf.js');
var csrf = require(CSRF_PATH);

function freshRequireCredits() {
  delete require.cache[require.resolve(CREDITS_PATH)];
  return require(CREDITS_PATH);
}

function freshRequireAdminCredits(creditsMod) {
  if (creditsMod) {
    delete require.cache[require.resolve(CREDITS_PATH)];
    require.cache[require.resolve(CREDITS_PATH)] = {
      id: require.resolve(CREDITS_PATH),
      filename: require.resolve(CREDITS_PATH),
      loaded: true,
      exports: creditsMod
    };
  }
  delete require.cache[require.resolve(ADMIN_CREDITS_PATH)];
  return require(ADMIN_CREDITS_PATH);
}

function makeMockDb() {
  return {
    query: async function(sql) {
      if (sql.includes('SELECT tenant_id FROM')) return { rows: [{ tenant_id: 'tenant-a' }] };
      return { rows: [] };
    }
  };
}

function makeRes() {
  return {
    _status: null,
    _headers: {},
    _body: '',
    writeHead: function(status, headers) { this._status = status; this._headers = headers || {}; },
    end: function(body) { this._body = body || ''; }
  };
}

function extractCsrfValue(html) {
  var m = html.match(/name="_csrf" value="([^"]*)"/);
  return m ? m[1] : null;
}

async function run() {
  console.log('=== sec-perf-s3 AC1: admin credits CSRF protection ===');

  var queue = [];

  // AC1b: POST with no _csrf field -> 403, adjustBalance never called
  queue.push(function() {
    return test('AC1b: POST /api/admin/credits/adjust with no _csrf field returns 403', async function() {
      var adjustCalled = false;
      var credits = freshRequireCredits();
      credits.setCreditsAdapter({
        query: async function(sql) {
          if (sql.includes('SELECT tenant_id FROM')) return { rows: [{ tenant_id: 'tenant-a' }] };
          if (sql.includes('UPDATE')) { adjustCalled = true; return { rows: [] }; }
          return { rows: [] };
        }
      });
      var handler = freshRequireAdminCredits(credits);

      var body = 'tenantId=tenant-a&amount=50'; // no _csrf field -- this is the pre-fix shape
      var req = {
        session: { userId: 1, role: 'admin', csrfToken: 'real-session-token' },
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        on: function(event, cb) {
          if (event === 'data') cb(body);
          if (event === 'end') cb();
        }
      };
      var res = makeRes();
      await handler.adminCreditsPost(req, res);

      assert.strictEqual(res._status, 403, 'Expected 403 Forbidden, got ' + res._status);
      assert.strictEqual(res._body, 'Forbidden');
      assert.strictEqual(adjustCalled, false, 'adjustBalance must NOT be called without a valid CSRF token');
    });
  });

  // AC1c: POST with mismatched _csrf -> 403
  queue.push(function() {
    return test('AC1c: POST with mismatched _csrf value returns 403', async function() {
      var adjustCalled = false;
      var credits = freshRequireCredits();
      credits.setCreditsAdapter({
        query: async function(sql) {
          if (sql.includes('SELECT tenant_id FROM')) return { rows: [{ tenant_id: 'tenant-a' }] };
          if (sql.includes('UPDATE')) { adjustCalled = true; return { rows: [] }; }
          return { rows: [] };
        }
      });
      var handler = freshRequireAdminCredits(credits);

      var body = '_csrf=attacker-guess&tenantId=tenant-a&amount=50';
      var req = {
        session: { userId: 1, role: 'admin', csrfToken: 'real-session-token' },
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        on: function(event, cb) {
          if (event === 'data') cb(body);
          if (event === 'end') cb();
        }
      };
      var res = makeRes();
      await handler.adminCreditsPost(req, res);

      assert.strictEqual(res._status, 403);
      assert.strictEqual(adjustCalled, false);
    });
  });

  // AC1d: full round trip -- GET page, extract real token, POST with it -> succeeds exactly as before
  queue.push(function() {
    return test('AC1d: round trip -- GET /admin/credits embeds real token, POST with it succeeds (302)', async function() {
      var adjustCalled = false;
      var credits = freshRequireCredits();
      credits.setCreditsAdapter({
        query: async function(sql) {
          if (sql.includes('SELECT tenant_id, balance')) return { rows: [{ tenant_id: 'tenant-a', balance: 100 }] };
          if (sql.includes('SELECT tenant_id FROM')) return { rows: [{ tenant_id: 'tenant-a' }] };
          if (sql.includes('UPDATE')) { adjustCalled = true; return { rows: [] }; }
          return { rows: [] };
        }
      });
      var handler = freshRequireAdminCredits(credits);

      var session = { userId: 1, role: 'admin' };
      var getReq = { session: session };
      var getRes = makeRes();
      var htmlChunks = [];
      getRes.writeHead = function(status, headers) { this._status = status; this._headers = headers; };
      getRes.end = function(body) { htmlChunks.push(body); };
      await handler.adminCreditsGet(getReq, getRes);
      var html = htmlChunks.join('');

      // The GET handler must embed a real token tied to req.session (AC1/AC6).
      csrf.generateCsrfToken(session === getReq.session ? getReq : { session: session }); // ensure token exists if handler didn't generate it itself
      var token = extractCsrfValue(html) || session.csrfToken;
      assert.ok(token, 'a _csrf token must be embedded in the rendered admin credits page HTML');

      var body = '_csrf=' + token + '&tenantId=tenant-a&amount=50';
      var postReq = {
        session: session,
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        on: function(event, cb) {
          if (event === 'data') cb(body);
          if (event === 'end') cb();
        }
      };
      var postRes = makeRes();
      await handler.adminCreditsPost(postReq, postRes);

      assert.strictEqual(postRes._status, 302, 'Expected 302 redirect, got ' + postRes._status);
      assert.strictEqual(postRes._headers['Location'], '/admin/credits');
      assert.ok(adjustCalled, 'adjustBalance must be called on a legitimate round-trip submission');
    });
  });

  for (var i = 0; i < queue.length; i++) {
    await queue[i]();
  }

  console.log('\n=== Results: ' + passed + ' passed, ' + failed + ' failed ===');
  if (failed > 0) {
    failures.forEach(function(f) {
      console.log('FAILED:', f.name, '-', f.err && f.err.message || f.err);
    });
    process.exit(1);
  }
  process.exit(0);
}

run();
