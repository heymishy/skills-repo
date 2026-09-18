'use strict';
// tests/check-dsa-s2-dashboard-wiring.js -- AC3, AC6
const assert = require('assert');
const { handleDashboard, setGetPendingActions, setLogger } = require('../src/web-ui/routes/dashboard');

setLogger({ info: function(){}, warn: function(){} });
setGetPendingActions(async function() { return { items: [], bannerMessage: null }; });

function makeRes() {
  var statusCode = null, headers = {}, chunks = [];
  return {
    writeHead: function (code, h) { statusCode = code; Object.assign(headers, h || {}); },
    end: function (body) { if (body != null) chunks.push(body); },
    _get: function () { return { statusCode: statusCode, headers: headers, body: chunks.join('') }; }
  };
}

async function testRendersRealDashboardNotPlaceholder() {
  var req = { session: { accessToken: 'tok', userId: 1, login: 'tester', tenantId: null } };
  var res = makeRes();
  await handleDashboard(req, res);
  var result = res._get();
  assert.strictEqual(result.statusCode, 200);
  assert.ok(!result.body.includes('<h1>Dashboard</h1>'), 'the old placeholder must be gone');
  assert.ok(result.body.includes('Run a skill'), 'expected the real renderDashboard section header');
  assert.ok(result.body.includes('sw-skill-grid'), 'expected the real skill-card grid');
}

async function testNoStaleSkillsLinkRegression() {
  // T9.3 in check-wuce18-html-shell.js asserts this exact string is absent
  // repo-wide from handleDashboard's response -- a real, already-shipped
  // pan-s1 navigation decision. Re-asserted here directly at the source of
  // the change, not just relying on the pre-existing spec catching it later.
  var req = { session: { accessToken: 'tok', userId: 1, login: 'tester', tenantId: null } };
  var res = makeRes();
  await handleDashboard(req, res);
  assert.ok(!res._get().body.includes('href="/skills"'), 'the removed /skills browse link must not reappear');
}

async function testSkillCatalogRendersSixRealCards() {
  var req = { session: { accessToken: 'tok', userId: 1, login: 'tester', tenantId: null } };
  var res = makeRes();
  await handleDashboard(req, res);
  var body = res._get().body;
  ['discovery', 'definition', 'test-plan', 'implementation-plan', 'definition-of-ready', 'review'].forEach(function(name) {
    assert.ok(body.includes('/api/skills/' + name + '/sessions'), 'expected a real session-start link for ' + name);
  });
}

async function testGreetingReflectsRealSessionLogin() {
  // Task 1 code-quality review: check-wuce18-html-shell.js's T11.1 ('testuser'
  // in the body) is satisfied by renderShell's own nav/header rendering
  // user.login independently of dashboard-view.js -- it would still pass
  // even if greetingName were hardcoded/broken. Assert the real greeting
  // text directly so a regression here is actually caught.
  var req = { session: { accessToken: 'tok', userId: 1, login: 'a-distinct-login-name', tenantId: null } };
  var res = makeRes();
  await handleDashboard(req, res);
  assert.ok(res._get().body.includes('Good morning, a-distinct-login-name.'), 'expected the greeting to reflect the real session login');
}

async function main() {
  await testRendersRealDashboardNotPlaceholder();
  console.log('  ok - renders real renderDashboard content, not the placeholder');
  await testNoStaleSkillsLinkRegression();
  console.log('  ok - no stale /skills browse link (T9.3 regression guard)');
  await testSkillCatalogRendersSixRealCards();
  console.log('  ok - static skills catalog renders 6 real session-start links');
  await testGreetingReflectsRealSessionLogin();
  console.log('  ok - greeting reflects the real session login');
}
main().catch(function (err) { console.error('FAIL:', err.message); process.exitCode = 1; });
