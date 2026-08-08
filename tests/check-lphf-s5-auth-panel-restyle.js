'use strict';
const assert = require('assert');

let passed = 0; let failed = 0;
function pass(name) { console.log(`  PASS: ${name}`); passed++; }
function fail(name, err) { console.error(`  FAIL: ${name}: ${err.message || err}`); failed++; }

(async function() {
  // AC2
  try {
    delete require.cache[require.resolve('../src/web-ui/routes/public')];
    const { handleRoot } = require('../src/web-ui/routes/public');
    const req = { session: {} };
    let body = null;
    const res = { setHeader: function() {}, writeHead: function() {}, end: function(data) { body = data; } };
    await handleRoot(req, res);

    assert(body.includes('href="/auth/github"'), 'expected GitHub sign-in to link to /auth/github');
    assert(body.includes('href="/auth/google"'), 'expected Google sign-in to link to /auth/google');
    assert(body.includes('action="/auth/email/login"'), 'expected sign-in form to post to /auth/email/login');
    assert(body.includes('action="/auth/email/signup"'), 'expected sign-up form to post to /auth/email/signup');
    pass('authPanel_routesUnchanged_afterRestyle');
  } catch (e) { fail('authPanel_routesUnchanged_afterRestyle', e); }

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
})();
