'use strict';
var assert = require('assert');
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

queue.push(function() {
  return test('AC8 (D37 stub): getAuthenticatedPage throws until wired', async function() {
    delete require.cache[require.resolve('../src/web-ui/adapters/session-page-adapter')];
    var adapter = require('../src/web-ui/adapters/session-page-adapter');
    var threw = false;
    try {
      await adapter.getAuthenticatedPage('some-session-id', 'http://localhost:3000');
    } catch (err) {
      threw = true;
      assert.ok(/not wired/i.test(err.message), 'error must name the adapter and instruct how to wire it');
    }
    assert.ok(threw, 'must throw, never return null/undefined silently');
  });
});

queue.push(function() {
  return test('realGetAuthenticatedPage: seeds the context cookie with the exact sessionId, no real Playwright launch (injectable chromium)', async function() {
    var adapter = require('../src/web-ui/adapters/session-page-adapter');
    var cookiesSeen = null;
    var fakeChromium = {
      launch: async function() {
        var fakeContext = {
          addCookies: async function(cookies) { cookiesSeen = cookies; },
          newPage: async function() { return { _isFakePage: true }; }
        };
        return { newContext: async function() { return fakeContext; } };
      }
    };
    var result = await adapter.realGetAuthenticatedPage('abc123sessionid', 'https://example.com', fakeChromium);
    assert.ok(result.page && result.page._isFakePage);
    assert.ok(result.browser);
    assert.strictEqual(cookiesSeen.length, 1);
    assert.strictEqual(cookiesSeen[0].name, 'session_id');
    assert.strictEqual(cookiesSeen[0].value, 'abc123sessionid');
    assert.strictEqual(cookiesSeen[0].domain, 'example.com');
    assert.strictEqual(cookiesSeen[0].secure, true, 'https base URL must set secure:true on the cookie');
  });
});

(async function() {
  console.log('\ncheck-ppc-s1-session-page-adapter.js');
  for (var i = 0; i < queue.length; i++) { await queue[i](); }
  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  if (failures.length > 0) {
    console.log('\nFailures:');
    failures.forEach(function(f) { console.log('  ' + f.name + ': ' + (f.err && f.err.message || f.err)); });
    process.exit(1);
  }
})();
