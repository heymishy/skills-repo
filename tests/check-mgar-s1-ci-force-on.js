'use strict';

/**
 * check-mgar-s1-ci-force-on.js — AC verification for mgar-s1 AC5
 * "Force the mock gateway on before CI staging E2E runs"
 *
 * Mocks @playwright/test's request.newContext() so this test exercises
 * ensure-mock-gateway-on.js's real logic (login sequence, CSRF extraction,
 * POST payload) without making any real network call.
 */

const assert = require('assert');
const path = require('path');

let passed = 0;
let failed = 0;
const pending = [];

function test(name, fn) {
  try {
    const result = fn();
    if (result && typeof result.then === 'function') {
      pending.push(result.then(
        function() { passed++; console.log('  [PASS] ' + name); },
        function(err) { failed++; console.log('  [FAIL] ' + name + ' -- ' + (err && err.message || err) + '\n' + (err && err.stack)); }
      ));
      return;
    }
    passed++; console.log('  [PASS] ' + name);
  } catch (err) {
    failed++; console.log('  [FAIL] ' + name + ' -- ' + (err && err.message || err));
  }
}

const pwTestPath = require.resolve('@playwright/test');
const fixturePath = require.resolve('../tests/e2e/fixtures/ensure-mock-gateway-on');
const adminTopupPath = require.resolve('../tests/e2e/fixtures/admin-credits-topup');

/**
 * Installs a fake @playwright/test module whose request.newContext() returns
 * a context object backed by the given route handlers.
 * @param {{get?: Function, post?: Function}} handlers
 * @returns {{calls: Array}}
 */
function installPwMock(handlers) {
  const calls = [];
  const real = require('@playwright/test');
  const fakeContext = {
    get: async function(url) {
      calls.push({ method: 'get', url: url });
      return (handlers.get || function() { return { status: function() { return 200; }, text: async function() { return ''; } }; })(url);
    },
    post: async function(url, opts) {
      calls.push({ method: 'post', url: url, opts: opts });
      return (handlers.post || function() { return { status: function() { return 302; } }; })(url, opts);
    },
    dispose: async function() { calls.push({ method: 'dispose' }); }
  };
  const fakeModule = {
    id: pwTestPath, filename: pwTestPath, loaded: true,
    exports: Object.assign({}, real, {
      request: { newContext: async function() { return fakeContext; } }
    })
  };
  require.cache[pwTestPath] = fakeModule;
  return { calls: calls };
}

function uninstallPwMock() {
  delete require.cache[pwTestPath];
  delete require.cache[fixturePath];
  delete require.cache[adminTopupPath];
  require('@playwright/test');
}

console.log('\n[mgar-s1] AC5 -- CI helper establishes admin session and forces gateway on');
test('ensureMockGatewayOn_establishesSession_postsToggleOn', function() {
  const csrfHtml = '<input type="hidden" name="_csrf" value="fake-csrf-token">';
  const mock = installPwMock({
    get: function(url) {
      if (url === '/') return { status: function() { return 200; }, text: async function() { return csrfHtml; } };
      if (url === '/admin/mock-gateway') return { status: function() { return 200; }, text: async function() { return csrfHtml; } };
      throw new Error('unexpected GET ' + url);
    },
    post: function(url, opts) {
      if (url === '/auth/email/login') return { status: function() { return 302; } };
      if (url === '/api/admin/mock-gateway/toggle') return { status: function() { return 302; } };
      throw new Error('unexpected POST ' + url);
    }
  });
  try {
    delete require.cache[fixturePath];
    delete require.cache[adminTopupPath];
    const { ensureMockGatewayOn } = require('../tests/e2e/fixtures/ensure-mock-gateway-on');
    return ensureMockGatewayOn().then(function(result) {
      assert.strictEqual(result.forcedOn, true, 'expected forcedOn=true, got: ' + JSON.stringify(result));
      const togglePost = mock.calls.find(function(c) { return c.method === 'post' && c.url === '/api/admin/mock-gateway/toggle'; });
      assert.ok(togglePost, 'expected a POST to /api/admin/mock-gateway/toggle');
      assert.strictEqual(togglePost.opts.form.nextState, 'on', 'expected nextState=on in the toggle POST body');
      assert.strictEqual(togglePost.opts.form._csrf, 'fake-csrf-token', 'expected the extracted CSRF token to be sent');
    });
  } finally {
    uninstallPwMock();
  }
});

console.log('\n[mgar-s1] AC5 -- CI helper reports a clear reason instead of throwing, on failure');
test('ensureMockGatewayOn_sessionFails_returnsReasonWithoutThrowing', function() {
  const mock = installPwMock({
    get: function() { return { status: function() { return 200; }, text: async function() { return '<input type="hidden" name="_csrf" value="x">'; } }; },
    post: function() { return { status: function() { return 302; } }; }
  });
  try {
    delete require.cache[fixturePath];
    delete require.cache[adminTopupPath];
    // Override login/signup to both fail, simulating an unprovisioned identity.
    const adminTopup = require('../tests/e2e/fixtures/admin-credits-topup');
    const origLogin = adminTopup._adminLogin;
    const origSignup = adminTopup._adminSignupOnce;
    adminTopup._adminLogin = async function() { return false; };
    adminTopup._adminSignupOnce = async function() { return false; };
    const { ensureMockGatewayOn } = require('../tests/e2e/fixtures/ensure-mock-gateway-on');
    return ensureMockGatewayOn().then(function(result) {
      assert.strictEqual(result.forcedOn, false, 'expected forcedOn=false when session cannot be established');
      assert.ok(typeof result.reason === 'string' && result.reason.length > 0, 'expected a non-empty reason string');
    }).finally(function() {
      adminTopup._adminLogin = origLogin;
      adminTopup._adminSignupOnce = origSignup;
    });
  } finally {
    uninstallPwMock();
  }
});

Promise.all(pending).then(function() {
  console.log('\n[mgar-s1] Results: ' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed > 0 ? 1 : 0);
});
