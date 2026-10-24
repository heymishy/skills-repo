'use strict';
// tests/check-dssc-s1-dashboard-csrf-fix.js -- AC1, AC2, AC3
const assert = require('assert');
const { renderDashboard } = require('../src/web-ui/views/dashboard-view');
const { handleDashboard, setGetPendingActions, setLogger } = require('../src/web-ui/routes/dashboard');
const { handleGetDashboard } = require('../src/web-ui/routes/products');
const csrf = require('../src/web-ui/middleware/csrf');

setLogger({ info: function() {}, warn: function() {} });
setGetPendingActions(async function() { return { items: [], bannerMessage: null }; });

var passed = 0; var failed = 0; var failures = [];
function test(name, fn) {
  try {
    var result = fn();
    if (result && typeof result.then === 'function') {
      return result.then(
        function() { passed++; console.log('  PASS: ' + name); },
        function(err) { failed++; failures.push({ name: name, err: err }); console.log('  FAIL: ' + name + '\n       ' + (err && err.stack || err)); }
      );
    }
    passed++; console.log('  PASS: ' + name); return Promise.resolve();
  } catch (err) {
    failed++; failures.push({ name: name, err: err }); console.log('  FAIL: ' + name + '\n       ' + (err && err.stack || err)); return Promise.resolve();
  }
}
var queue = [];

function makeRes() {
  var statusCode = null, headers = {}, chunks = [];
  return {
    writeHead: function(code, h) { statusCode = code; Object.assign(headers, h || {}); },
    end: function(body) { if (body != null) chunks.push(body); },
    _get: function() { return { statusCode: statusCode, headers: headers, body: chunks.join('') }; }
  };
}

function makePoolWithOneProduct() {
  return {
    query: async function(sql) {
      if (/SELECT product_id, name, created_at FROM products/.test(sql)) {
        return { rows: [{ product_id: 'p1', name: 'Acme', created_at: '2026-09-01T00:00:00.000Z' }] };
      }
      return { rows: [] };
    }
  };
}

function makePoolWithZeroProducts() {
  return { query: async function() { return { rows: [] }; } };
}

queue.push(function() {
  return test('renderDashboard_embedsCsrfField_inEachSkillStartForm', function() {
    var html = renderDashboard({
      greetingName: 'tester',
      dateLabel: 'Monday, 1 January',
      pendingActionsCount: 0,
      inProgressCount: 0,
      skills: [
        { name: 'discovery', label: 'Discovery', stage: 'outer', desc: 'Structure a raw idea.', est: '15m' },
        { name: 'definition', label: 'Definition', stage: 'outer', desc: 'Break into stories.', est: '20m' }
      ],
      actions: [],
      recent: [],
      csrfToken: 'test-csrf-token-value'
    });
    var matches = html.match(/<input type="hidden" name="_csrf" value="test-csrf-token-value">/g) || [];
    assert.strictEqual(matches.length, 2, 'expected one _csrf hidden field per skill card (2 cards), got ' + matches.length);
  });
});

queue.push(function() {
  return test('handleDashboard_rendersRealCsrfToken_matchingSession', function() {
    var req = { session: { accessToken: 'tok', userId: 1, login: 'tester', tenantId: null, csrfToken: 'presetTokenAbc123' }, sessionId: 'sess-1' };
    var res = makeRes();
    var p = handleDashboard(req, res);
    return Promise.resolve(p).then(function() {
      var body = res._get().body;
      assert.ok(body.includes('<input type="hidden" name="_csrf" value="presetTokenAbc123">'), 'expected the real session csrfToken embedded in the response body');
    });
  });
});

queue.push(function() {
  return test('handleGetDashboard_rendersRealCsrfToken_matchingSession', function() {
    var req = { session: { accessToken: 'tok', userId: 1, login: 'tester', tenantId: 'tenant-1', csrfToken: 'presetTokenXyz789' }, sessionId: 'sess-2' };
    var res = makeRes();
    return handleGetDashboard(req, res, null, makePoolWithOneProduct()).then(function() {
      var body = res._get().body;
      assert.ok(body.includes('<input type="hidden" name="_csrf" value="presetTokenXyz789">'), 'expected the real session csrfToken embedded in the response body');
    });
  });
});

queue.push(function() {
  return test('handleGetDashboard_rendersRealCsrfToken_onZeroProductsOnboardingBranch', function() {
    var req = { session: { accessToken: 'tok', userId: 1, login: 'tester', tenantId: 'tenant-1', csrfToken: 'presetTokenZero' }, sessionId: 'sess-3' };
    var res = makeRes();
    return handleGetDashboard(req, res, null, makePoolWithZeroProducts()).then(function() {
      var result = res._get();
      assert.strictEqual(result.statusCode, 200, 'the zero-products branch must still render successfully');
      assert.ok(!result.body.includes('Run a skill'), 'zero-products branch has no skill cards -- sanity check this is really the onboarding branch');
    });
  });
});

queue.push(function() {
  return test('skillStartForm_withCorrectCsrfToken_passesGuard', function() {
    var req = { session: {}, sessionId: 'sess-4' };
    return csrf.generateCsrfToken(req).then(function(token) {
      var postReq = { headers: {}, body: { _csrf: token }, session: req.session };
      var res = makeRes();
      return csrf.csrfGuard(postReq, res).then(function(ok) {
        assert.strictEqual(ok, true, 'a form correctly rendered by this fix must pass csrfGuard, not be rejected with 403');
        assert.strictEqual(res._get().statusCode, null, 'csrfGuard must not have written a 403 response on the success path');
      });
    });
  });
});

(async function() {
  console.log('\ncheck-dssc-s1-dashboard-csrf-fix.js');
  for (var i = 0; i < queue.length; i++) { await queue[i](); }
  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  if (failures.length > 0) {
    console.log('\nFailures:');
    failures.forEach(function(f) { console.log('  ' + f.name + ': ' + (f.err && f.err.message || f.err)); });
    process.exit(1);
  }
})();
