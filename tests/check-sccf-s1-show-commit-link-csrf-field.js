'use strict';

// check-sccf-s1-show-commit-link-csrf-field.js — sccf-s1: showCommitLink()
// (skills.js), the client-side function that live-injects the gate-confirm
// form when a stage completes DURING the streaming response (not on a page
// reload), must also embed the session's CSRF token -- jgcc-s1 only fixed
// the server-rendered ougl.4 branch. Confirmed live on wuce-staging
// (2026-08-30) via csdl-s1's diagnostic logging: two clean, uncontaminated
// repros (brand-new journeys, single click each) both showed
// submittedPrefix:"(empty)" against a correctly-populated expectedPrefix --
// not a session mismatch, a genuinely empty submitted value. flyctl machines
// list confirmed exactly one machine, ruling out multi-machine drift.
// Story: artefacts/2026-08-30-show-commit-link-missing-csrf/stories/sccf-s1-add-csrf-field-to-live-injected-gate-confirm-form.md
// Test plan: artefacts/2026-08-30-show-commit-link-missing-csrf/test-plans/sccf-s1-test-plan.md

var path = require('path');
var SKILLS_PATH = path.resolve(__dirname, '../src/web-ui/routes/skills.js');
var JOURNEY_STORE_PATH = path.resolve(__dirname, '../src/web-ui/modules/journey-store.js');

var passed = 0;
var failed = 0;

function ok(label, cond) {
  if (cond) { console.log('  PASS:', label); passed++; }
  else       { console.error('  FAIL:', label); failed++; }
}

function freshSkillsRoutes() {
  var resolved = require.resolve(SKILLS_PATH);
  delete require.cache[resolved];
  return require(resolved);
}

function fakeRes() {
  var r = { _chunks: [], _ended: false, _status: null };
  r.writeHead = function(s) { r._status = s; };
  r.write = function(s) { r._chunks.push(s); };
  r.end = function(body) { r._ended = true; if (typeof body === 'string') r._chunks.push(body); };
  return r;
}
function fakeReq(session, params, body) {
  return { session: session, params: params || {}, body: body };
}

(async function main() {

var routes = freshSkillsRoutes();
var journeyStore = require(JOURNEY_STORE_PATH);
journeyStore._clear();

// ── AC1 — CSRF_TOKEN JS var is declared and matches the real session token ──
await (async function() {
  var jid = journeyStore.createJourney('sccf-s1-t1-feature', 'default').journeyId;
  var sid = 'test-sccf-s1-t1-' + Math.random().toString(36).slice(2);
  var session = { accessToken: 'tok', login: 'test-user' };
  routes._setHtmlSession(sid, {
    skillName: 'discovery', sessionPath: '/tmp/t', systemPrompt: '# discovery', turns: [],
    artefactContent: null, artefactPath: null, done: true, featureSlug: 'sccf-s1-t1-feature', journeyId: jid
  });

  var res = fakeRes();
  await routes.handleGetChatHtml(fakeReq(session, { name: 'discovery', id: sid }), res);
  var html = res._chunks.join('');

  var tokenMatch = html.match(/var CSRF_TOKEN = "([^"]*)";/);
  ok('AC1: the rendered script declares a CSRF_TOKEN variable', !!tokenMatch);
  ok('AC1: CSRF_TOKEN\'s value matches the session\'s own csrfToken', !!tokenMatch && !!session.csrfToken && tokenMatch[1] === session.csrfToken);
})();

// ── AC2 — showCommitLink()'s injected form references CSRF_TOKEN ────────────
await (async function() {
  var jid = journeyStore.createJourney('sccf-s1-t2-feature', 'default').journeyId;
  var sid = 'test-sccf-s1-t2-' + Math.random().toString(36).slice(2);
  var session = { accessToken: 'tok', login: 'test-user' };
  routes._setHtmlSession(sid, {
    skillName: 'discovery', sessionPath: '/tmp/t', systemPrompt: '# discovery', turns: [],
    artefactContent: null, artefactPath: null, done: true, featureSlug: 'sccf-s1-t2-feature', journeyId: jid
  });

  var res = fakeRes();
  await routes.handleGetChatHtml(fakeReq(session, { name: 'discovery', id: sid }), res);
  var html = res._chunks.join('');

  var fnMatch = html.match(/function showCommitLink\(\) \{([\s\S]*?)\n {2}\}\n\n {2}function sendTurn/);
  ok('AC2: showCommitLink() function body is present in the rendered script', !!fnMatch);

  var body = fnMatch ? fnMatch[1] : '';
  ok('AC2: showCommitLink() builds a hidden _csrf input referencing CSRF_TOKEN', /name="_csrf"[^']*'\s*\+\s*CSRF_TOKEN/.test(body));

  // Negative check: the OLD broken pattern -- <form ...gate-confirm...> immediately
  // followed by <button, with no _csrf input in between -- must be absent.
  var brokenPattern = /<form method="POST" action="'\s*\+\s*GATE_CONFIRM_URL[^]*?<button/;
  var oldBroken = brokenPattern.test(body) && !/_csrf/.test(body.match(brokenPattern)[0]);
  ok('AC2 (negative): the old field-less form-building pattern is gone', !oldBroken);
})();

// ── AC4 — definition-of-ready and non-journey sessions unaffected ───────────
await (async function() {
  var sid = 'test-sccf-s1-t4-' + Math.random().toString(36).slice(2);
  var session = { accessToken: 'tok', login: 'test-user' };
  routes._setHtmlSession(sid, {
    skillName: 'discovery', sessionPath: '/tmp/t', systemPrompt: '# discovery', turns: [],
    artefactContent: null, artefactPath: null, done: false, featureSlug: 'sccf-s1-t4-feature', journeyId: null
  });

  var res = fakeRes();
  await routes.handleGetChatHtml(fakeReq(session, { name: 'discovery', id: sid }), res);
  var html = res._chunks.join('');

  var tokenMatch = html.match(/var CSRF_TOKEN = "([^"]*)";/);
  ok('AC4: a non-journey session still renders a valid CSRF_TOKEN, no throw', !!tokenMatch && tokenMatch[1] === session.csrfToken && !!session.csrfToken);
})();

console.log('\n[sccf-s1] Results: ' + passed + ' passed, ' + failed + ' failed\n');
if (failed > 0) { process.exit(1); }

})();
