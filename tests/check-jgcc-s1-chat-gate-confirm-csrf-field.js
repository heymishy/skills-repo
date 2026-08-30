'use strict';

// check-jgcc-s1-chat-gate-confirm-csrf-field.js — jgcc-s1: the in-chat
// "Continue to [next stage] →" gate-confirm button (skills.js's
// _renderChatPage, the ougl.4 branch) must actually include the session's
// CSRF token, or it 403s unconditionally on every click -- confirmed live
// on wuce-staging (2026-08-30) by direct DOM inspection: the form had no
// _csrf field at all.
// Story: artefacts/2026-08-30-journey-gate-confirm-missing-csrf/stories/jgcc-s1-add-missing-csrf-field-to-chat-gate-confirm-button.md
// Test plan: artefacts/2026-08-30-journey-gate-confirm-missing-csrf/test-plans/jgcc-s1-test-plan.md

var path = require('path');
var SKILLS_PATH = path.resolve(__dirname, '../src/web-ui/routes/skills.js');
var CSRF_PATH   = path.resolve(__dirname, '../src/web-ui/middleware/csrf.js');
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
var csrf = require(CSRF_PATH);
var journeyStore = require(JOURNEY_STORE_PATH);
journeyStore._clear();

// ── AC1 — gate-confirm form includes a matching _csrf field ─────────────────
await (async function() {
  var jid = journeyStore.createJourney('jgcc-s1-t1-feature', 'default').journeyId;
  var sid = 'test-jgcc-s1-t1-' + Math.random().toString(36).slice(2);
  var session = { accessToken: 'tok', login: 'test-user' };
  routes._setHtmlSession(sid, {
    skillName: 'discovery', sessionPath: '/tmp/t', systemPrompt: '# discovery', turns: [],
    artefactContent: null, artefactPath: null, done: true, featureSlug: 'jgcc-s1-t1-feature', journeyId: jid
  });

  var res = fakeRes();
  await routes.handleGetChatHtml(fakeReq(session, { name: 'discovery', id: sid }), res);
  var html = res._chunks.join('');

  var formMatch = html.match(/<form method="POST" action="\/api\/journey\/[^"]*\/gate-confirm"[^>]*>([\s\S]*?)<\/form>/);
  ok('AC1: the gate-confirm form is present in the rendered chat page', !!formMatch);

  var csrfInputMatch = formMatch && formMatch[1].match(/<input type="hidden" name="_csrf" value="([^"]*)">/);
  ok('AC1: the gate-confirm form includes a hidden _csrf input', !!csrfInputMatch);
  ok('AC1: the _csrf input\'s value matches the session\'s own CSRF token', !!csrfInputMatch && csrfInputMatch[1] === session.csrfToken && !!session.csrfToken);
})();

// ── AC2 — a submission with that field passes csrfGuard ─────────────────────
await (async function() {
  var jid = journeyStore.createJourney('jgcc-s1-t2-feature', 'default').journeyId;
  var sid = 'test-jgcc-s1-t2-' + Math.random().toString(36).slice(2);
  var session = { accessToken: 'tok', login: 'test-user' };
  routes._setHtmlSession(sid, {
    skillName: 'discovery', sessionPath: '/tmp/t', systemPrompt: '# discovery', turns: [],
    artefactContent: null, artefactPath: null, done: true, featureSlug: 'jgcc-s1-t2-feature', journeyId: jid
  });

  var renderRes = fakeRes();
  await routes.handleGetChatHtml(fakeReq(session, { name: 'discovery', id: sid }), renderRes);
  var html = renderRes._chunks.join('');
  // sccf-s1: scope the match to the actual rendered <form>...</form> block --
  // an unscoped match can also hit showCommitLink()'s JS source text (which
  // contains a similar-looking "_csrf" substring as a string literal, not
  // real HTML) elsewhere on the same page.
  var formMatch = html.match(/<form method="POST" action="\/api\/journey\/[^"]*\/gate-confirm"[^>]*>([\s\S]*?)<\/form>/);
  var csrfInputMatch = formMatch && formMatch[1].match(/<input type="hidden" name="_csrf" value="([^"]*)">/);

  // Simulate submitting the rendered form's own _csrf value back through the
  // real csrfGuard, against the SAME session object (matching how a real
  // browser request would carry the same session cookie).
  var guardReq = { session: session, body: { _csrf: csrfInputMatch ? csrfInputMatch[1] : '' } };
  var guardRes = fakeRes();
  var csrfOk = await csrf.csrfGuard(guardReq, guardRes);
  ok('AC2: a submission carrying the rendered form\'s own _csrf value passes csrfGuard', csrfOk === true);
})();

// ── AC3 — definition-of-ready's plain link is unaffected ────────────────────
await (async function() {
  var jid = journeyStore.createJourney('jgcc-s1-t3-feature', 'default').journeyId;
  var sid = 'test-jgcc-s1-t3-' + Math.random().toString(36).slice(2);
  var session = { accessToken: 'tok', login: 'test-user' };
  routes._setHtmlSession(sid, {
    skillName: 'definition-of-ready', sessionPath: '/tmp/t', systemPrompt: '# dor', turns: [],
    artefactContent: null, artefactPath: null, done: true, featureSlug: 'jgcc-s1-t3-feature', journeyId: jid
  });

  var res = fakeRes();
  await routes.handleGetChatHtml(fakeReq(session, { name: 'definition-of-ready', id: sid }), res);
  var html = res._chunks.join('');

  ok('AC3: the definition-of-ready branch still renders its plain "View journey complete" link', /View journey complete/.test(html));
  ok('AC3: that link is a plain <a href>, not a <form>-based gate-confirm at all', /<a href="\/journey\/[^"]*\/complete"/.test(html) && !/<form method="POST" action="\/api\/journey\/[^"]*\/gate-confirm"/.test(html));
})();

console.log('\n[jgcc-s1] Results: ' + passed + ' passed, ' + failed + ' failed\n');
if (failed > 0) { process.exit(1); }

})();
