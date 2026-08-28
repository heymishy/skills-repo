'use strict';

// check-res-s2-overwrite-artefact-in-place-on-revision.js
// Verifies res-s2: a revision turn on a reopened stage's session overwrites
// the artefact file in place (no new file, no dated copy), surfaces write
// failures to the operator instead of silently swallowing them, captures
// the pre-revision content before the write for res-s3's later use, and
// does not push a duplicate completedStages entry when revising an
// already-completed stage.
//
// Run: node tests/check-res-s2-overwrite-artefact-in-place-on-revision.js

var fs   = require('fs');
var os   = require('os');
var path = require('path');
var ROUTES_PATH = path.resolve(__dirname, '../src/web-ui/routes/skills.js');

var passed = 0;
var failed = 0;

function ok(label, cond) {
  if (cond) { console.log('  PASS:', label); passed++; }
  else       { console.error('  FAIL:', label); failed++; }
}

function freshRoutes() {
  var resolved = require.resolve(ROUTES_PATH);
  delete require.cache[resolved];
  return require(resolved);
}

function fakeRes() {
  var r = { _chunks: [], _ended: false };
  r.writeHead = function() {};
  r.write = function(s) { r._chunks.push(s); };
  r.end = function() { r._ended = true; };
  r.lastEvent = function() {
    var last = r._chunks[r._chunks.length - 1] || '';
    var m = last.match(/^data: (.*)\n\n$/);
    return m ? JSON.parse(m[1]) : null;
  };
  return r;
}

var ARTEFACT_RESPONSE =
  'Understood.\n\n---ARTEFACT-START---\n# Discovery\n\nRevised content.\n---ARTEFACT-END---\n---SLUG---\nres-s2-fixture-feature';

var _tmpRepoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'res-s2-'));

(async function main() {

console.log('\nTask 1 — path traversal guard, write-failure surfacing, pre-revision capture');

await (async function() {
  // AC4: a disk write failure surfaces an SSE error, not just a console log.
  process.env.COPILOT_REPO_PATH = _tmpRepoRoot;
  var routes = freshRoutes();
  routes.setSkillTurnExecutorStreamAdapter(function(systemPrompt, history, currentInput, token, onChunk, onThinkingChunk, onFirstChunk) {
    onFirstChunk(0);
    onChunk(ARTEFACT_RESPONSE);
    return Promise.resolve({ text: ARTEFACT_RESPONSE, usage: {} });
  });
  var sid = 'test-res-s2-t1-writefail-' + Math.random().toString(36).slice(2);
  routes._setHtmlSession(sid, {
    skillName: 'discovery', sessionPath: '/tmp/t', systemPrompt: '# discovery', turns: [],
    artefactContent: null, artefactPath: null, done: false, featureSlug: 'res-s2-writefail-feature'
  });
  // Force the write to fail: make the target directory path collide with an
  // existing FILE (not a directory), so fs.mkdirSync/writeFileSync both throw.
  var _collidePath = path.join(_tmpRepoRoot, 'artefacts', 'res-s2-writefail-feature');
  fs.mkdirSync(path.dirname(_collidePath), { recursive: true });
  fs.writeFileSync(_collidePath, 'this is a file, not a directory', 'utf8');

  var res = fakeRes();
  await routes.handlePostTurnStreamHtml(
    { session: { accessToken: 'tok', tenantId: 'org-a' }, params: { name: 'discovery', id: sid }, body: { answer: 'hi' } },
    res
  );

  var lastEvent = res.lastEvent();
  ok('AC4: write failure surfaces an SSE error event', lastEvent && typeof lastEvent.error === 'string');
  ok('AC4: stream ends after the error', res._ended === true);
})();

await (async function() {
  // AC5 (partial — capture only): pre-revision content is read into memory
  // before the write executes.
  process.env.COPILOT_REPO_PATH = _tmpRepoRoot;
  var routes = freshRoutes();
  routes.setSkillTurnExecutorStreamAdapter(function(systemPrompt, history, currentInput, token, onChunk, onThinkingChunk, onFirstChunk) {
    onFirstChunk(0);
    onChunk(ARTEFACT_RESPONSE);
    return Promise.resolve({ text: ARTEFACT_RESPONSE, usage: {} });
  });
  var slug = 'res-s2-capture-feature';
  var artefactRelPath = 'artefacts/' + slug + '/discovery.md';
  var artefactAbsPath = path.join(_tmpRepoRoot, artefactRelPath);
  fs.mkdirSync(path.dirname(artefactAbsPath), { recursive: true });
  fs.writeFileSync(artefactAbsPath, '# Discovery\n\nOriginal content.', 'utf8');

  var sid = 'test-res-s2-t1-capture-' + Math.random().toString(36).slice(2);
  routes._setHtmlSession(sid, {
    skillName: 'discovery', sessionPath: '/tmp/t', systemPrompt: '# discovery', turns: [],
    artefactContent: null, artefactPath: null, done: false, featureSlug: slug
  });

  var res = fakeRes();
  await routes.handlePostTurnStreamHtml(
    { session: { accessToken: 'tok', tenantId: 'org-a' }, params: { name: 'discovery', id: sid }, body: { answer: 'revise it' } },
    res
  );

  var onDiskAfter = fs.readFileSync(artefactAbsPath, 'utf8');
  ok('AC1: the file is overwritten in place with the new content', onDiskAfter.indexOf('Revised content.') !== -1);
  ok('AC1: no second/dated file was created', fs.readdirSync(path.dirname(artefactAbsPath)).length === 1);
})();

await (async function() {
  // AC3: a turn with no artefact markers (a plain question) does not touch
  // the artefact file at all.
  process.env.COPILOT_REPO_PATH = _tmpRepoRoot;
  var routes = freshRoutes();
  var PLAIN_RESPONSE = 'Sure — here is the answer to your question, no artefact this turn.';
  routes.setSkillTurnExecutorStreamAdapter(function(systemPrompt, history, currentInput, token, onChunk, onThinkingChunk, onFirstChunk) {
    onFirstChunk(0);
    onChunk(PLAIN_RESPONSE);
    return Promise.resolve({ text: PLAIN_RESPONSE, usage: {} });
  });
  var slug = 'res-s2-noop-feature';
  var artefactRelPath = 'artefacts/' + slug + '/discovery.md';
  var artefactAbsPath = path.join(_tmpRepoRoot, artefactRelPath);
  fs.mkdirSync(path.dirname(artefactAbsPath), { recursive: true });
  fs.writeFileSync(artefactAbsPath, '# Discovery\n\nUnchanged.', 'utf8');
  var beforeStat = fs.statSync(artefactAbsPath);
  var beforeContent = fs.readFileSync(artefactAbsPath, 'utf8');

  var sid = 'test-res-s2-t1-noop-' + Math.random().toString(36).slice(2);
  routes._setHtmlSession(sid, {
    skillName: 'discovery', sessionPath: '/tmp/t', systemPrompt: '# discovery', turns: [],
    artefactContent: '# Discovery\n\nUnchanged.', artefactPath: artefactRelPath, done: true, featureSlug: slug
  });

  var res = fakeRes();
  await routes.handlePostTurnStreamHtml(
    { session: { accessToken: 'tok', tenantId: 'org-a' }, params: { name: 'discovery', id: sid }, body: { answer: 'just a question' } },
    res
  );

  var afterContent = fs.readFileSync(artefactAbsPath, 'utf8');
  var afterStat = fs.statSync(artefactAbsPath);
  ok('AC3: artefact content byte-identical after a no-revision turn', afterContent === beforeContent);
  ok('AC3: file mtime unchanged (no write attempted)', afterStat.mtimeMs === beforeStat.mtimeMs);
})();

await (async function() {
  // Path traversal guard (Architecture Constraints / CLAUDE.md mandatory
  // rule, code-quality review finding): a featureSlug crafted to resolve
  // outside the repo root must be rejected with an SSE error, and nothing
  // must be written anywhere outside the temp repo root.
  //
  // The escape target MUST be a real, writable sibling directory under
  // os.tmpdir() — NOT some arbitrary deep "../../.." guess. A prior version
  // of this test targeted a path under C:\Users\ that Windows refuses to
  // create for a non-admin user (EPERM), so the assertions passed for the
  // WRONG reason (the pre-existing generic write-failure handler caught an
  // unrelated OS permission error, not the traversal guard). Proven vacuous
  // by temporarily disabling the guard and observing the same test still
  // pass. Using a genuinely writable sibling directory (created via
  // fs.mkdtempSync, which only succeeds if it's actually writable) means
  // the guard's startsWith check is the ONLY thing that can prevent the
  // write — if it were absent, the write would succeed.
  process.env.COPILOT_REPO_PATH = _tmpRepoRoot;
  var routes = freshRoutes();
  routes.setSkillTurnExecutorStreamAdapter(function(systemPrompt, history, currentInput, token, onChunk, onThinkingChunk, onFirstChunk) {
    onFirstChunk(0);
    onChunk(ARTEFACT_RESPONSE);
    return Promise.resolve({ text: ARTEFACT_RESPONSE, usage: {} });
  });

  var _escapeTargetDir = fs.mkdtempSync(path.join(os.tmpdir(), 'res-s2-escape-target-'));
  var _traversalSlug = path.relative(path.join(_tmpRepoRoot, 'artefacts'), _escapeTargetDir);
  var _dangerousAbsPath = path.join(_escapeTargetDir, 'discovery.md');

  // Capture console.warn to assert the SPECIFIC rejection reason fired, not
  // just "some error happened" — distinguishes the guard from the generic
  // write-failure handler, which logs a different event name.
  var _warnCalls = [];
  var _originalWarn = console.warn;
  console.warn = function(msg) { _warnCalls.push(msg); };

  var sid = 'test-res-s2-t1-traversal-' + Math.random().toString(36).slice(2);
  routes._setHtmlSession(sid, {
    skillName: 'discovery', sessionPath: '/tmp/t', systemPrompt: '# discovery', turns: [],
    artefactContent: null, artefactPath: null, done: false, featureSlug: _traversalSlug
  });

  var res = fakeRes();
  await routes.handlePostTurnStreamHtml(
    { session: { accessToken: 'tok', tenantId: 'org-a' }, params: { name: 'discovery', id: sid }, body: { answer: 'hi' } },
    res
  );

  console.warn = _originalWarn;

  var lastEvent = res.lastEvent();
  var _traversalWarnFired = _warnCalls.some(function(m) { return typeof m === 'string' && m.indexOf('artefact_path_traversal_rejected') !== -1; });
  ok('Path traversal: the specific traversal-rejection event fires (not the generic write-failure path)', _traversalWarnFired);
  ok('Path traversal: a traversal-shaped featureSlug surfaces an SSE error', lastEvent && typeof lastEvent.error === 'string');
  ok('Path traversal: stream ends after the rejection', res._ended === true);
  ok('Path traversal: nothing was written to the resolved-outside-repo-root path (which IS writable — proven by mkdtempSync above)', !fs.existsSync(_dangerousAbsPath));

  fs.rmSync(_escapeTargetDir, { recursive: true, force: true });
})();

console.log('\nTask 2 — duplicate-completion guard and materiality-check hook');

await (async function() {
  // AC1/AC3: revising an already-completed stage must NOT push a second
  // completedStages entry.
  process.env.COPILOT_REPO_PATH = _tmpRepoRoot;
  var routes = freshRoutes();
  var journeyStore = require('../src/web-ui/modules/journey-store');
  journeyStore._clear();

  routes.setSkillTurnExecutorStreamAdapter(function(systemPrompt, history, currentInput, token, onChunk, onThinkingChunk, onFirstChunk) {
    onFirstChunk(0);
    onChunk(ARTEFACT_RESPONSE);
    return Promise.resolve({ text: ARTEFACT_RESPONSE, usage: {} });
  });

  var slug = 'res-s2-duplicate-guard-feature';
  var artefactRelPath = 'artefacts/' + slug + '/discovery.md';
  var artefactAbsPath = path.join(_tmpRepoRoot, artefactRelPath);
  fs.mkdirSync(path.dirname(artefactAbsPath), { recursive: true });
  fs.writeFileSync(artefactAbsPath, '# Discovery\n\nOriginal.', 'utf8');

  var created = journeyStore.createJourney(slug, 'default');
  var jid = created.journeyId;
  journeyStore.completeStage(jid, 'discovery', artefactRelPath, null, 'old-live-sid');

  var sid = 'test-res-s2-t2-dupguard-' + Math.random().toString(36).slice(2);
  routes._setHtmlSession(sid, {
    skillName: 'discovery', sessionPath: '/tmp/t', systemPrompt: '# discovery', turns: [],
    artefactContent: null, artefactPath: null, done: false, featureSlug: slug, journeyId: jid
  });

  var res = fakeRes();
  await routes.handlePostTurnStreamHtml(
    { session: { accessToken: 'tok', tenantId: 'org-a' }, params: { name: 'discovery', id: sid }, body: { answer: 'revise it' } },
    res
  );

  var journeyAfter = journeyStore.getJourney(jid);
  var discoveryEntries = journeyAfter.completedStages.filter(function(cs) { return cs.skillName === 'discovery'; });
  ok('AC1/AC3: exactly one completedStages entry for discovery after a revision (no duplicate pushed)', discoveryEntries.length === 1);
  ok('AC1: the artefact file was still overwritten with the revision', fs.readFileSync(artefactAbsPath, 'utf8').indexOf('Revised content.') !== -1);
})();

await (async function() {
  // AC5: the materiality-check hook fires on a revision with the correct
  // pre/post content pair, and does NOT fire on a stage's first-ever
  // completion (nothing to compare against).
  process.env.COPILOT_REPO_PATH = _tmpRepoRoot;
  var routes = freshRoutes();
  var journeyStore = require('../src/web-ui/modules/journey-store');
  journeyStore._clear();

  var hookCalls = [];
  routes.setMaterialityCheckHook(function(payload) { hookCalls.push(payload); });

  routes.setSkillTurnExecutorStreamAdapter(function(systemPrompt, history, currentInput, token, onChunk, onThinkingChunk, onFirstChunk) {
    onFirstChunk(0);
    onChunk(ARTEFACT_RESPONSE);
    return Promise.resolve({ text: ARTEFACT_RESPONSE, usage: {} });
  });

  // First-ever completion — hook must NOT fire.
  var slugFirst = 'res-s2-hook-first-feature';
  var sidFirst = 'test-res-s2-t2-hook-first-' + Math.random().toString(36).slice(2);
  routes._setHtmlSession(sidFirst, {
    skillName: 'discovery', sessionPath: '/tmp/t', systemPrompt: '# discovery', turns: [],
    artefactContent: null, artefactPath: null, done: false, featureSlug: slugFirst,
    journeyId: journeyStore.createJourney(slugFirst, 'default').journeyId
  });
  await routes.handlePostTurnStreamHtml(
    { session: { accessToken: 'tok', tenantId: 'org-a' }, params: { name: 'discovery', id: sidFirst }, body: { answer: 'go' } },
    fakeRes()
  );
  ok('AC5: hook does not fire on a stage\'s first-ever completion', hookCalls.length === 0);

  // Revision — hook must fire with the correct pre/post pair.
  var slugRevise = 'res-s2-hook-revise-feature';
  var artefactRelPath = 'artefacts/' + slugRevise + '/discovery.md';
  var artefactAbsPath = path.join(_tmpRepoRoot, artefactRelPath);
  fs.mkdirSync(path.dirname(artefactAbsPath), { recursive: true });
  fs.writeFileSync(artefactAbsPath, '# Discovery\n\nPre-revision text.', 'utf8');
  var jidRevise = journeyStore.createJourney(slugRevise, 'default').journeyId;
  journeyStore.completeStage(jidRevise, 'discovery', artefactRelPath, null, 'old-live-sid-2');

  var sidRevise = 'test-res-s2-t2-hook-revise-' + Math.random().toString(36).slice(2);
  routes._setHtmlSession(sidRevise, {
    skillName: 'discovery', sessionPath: '/tmp/t', systemPrompt: '# discovery', turns: [],
    artefactContent: null, artefactPath: null, done: false, featureSlug: slugRevise, journeyId: jidRevise
  });
  await routes.handlePostTurnStreamHtml(
    { session: { accessToken: 'tok', tenantId: 'org-a' }, params: { name: 'discovery', id: sidRevise }, body: { answer: 'revise it' } },
    fakeRes()
  );

  ok('AC5: hook fires exactly once on a revision', hookCalls.length === 1);
  ok('AC5: hook receives the correct pre-revision content', hookCalls[0] && hookCalls[0].preRevisionContent === '# Discovery\n\nPre-revision text.');
  ok('AC5: hook receives the correct post-revision content', hookCalls[0] && hookCalls[0].postRevisionContent.indexOf('Revised content.') !== -1);
  ok('AC5: hook receives journeyId and skillName', hookCalls[0] && hookCalls[0].journeyId === jidRevise && hookCalls[0].skillName === 'discovery');
})();

await (async function() {
  // AC2: a downstream read of the artefact path after a revision returns
  // the new content, not the pre-revision content — simulating what a
  // /trace-style disk re-read or a later stage's session would see.
  process.env.COPILOT_REPO_PATH = _tmpRepoRoot;
  var routes = freshRoutes();
  var journeyStore = require('../src/web-ui/modules/journey-store');
  journeyStore._clear();

  routes.setSkillTurnExecutorStreamAdapter(function(systemPrompt, history, currentInput, token, onChunk, onThinkingChunk, onFirstChunk) {
    onFirstChunk(0);
    onChunk(ARTEFACT_RESPONSE);
    return Promise.resolve({ text: ARTEFACT_RESPONSE, usage: {} });
  });

  var slug = 'res-s2-downstream-read-feature';
  var artefactRelPath = 'artefacts/' + slug + '/discovery.md';
  var artefactAbsPath = path.join(_tmpRepoRoot, artefactRelPath);
  fs.mkdirSync(path.dirname(artefactAbsPath), { recursive: true });
  fs.writeFileSync(artefactAbsPath, '# Discovery\n\nOld content nobody should see again.', 'utf8');
  var jid = journeyStore.createJourney(slug, 'default').journeyId;
  journeyStore.completeStage(jid, 'discovery', artefactRelPath, null, 'old-live-sid-3');

  var sid = 'test-res-s2-t2-downstream-' + Math.random().toString(36).slice(2);
  routes._setHtmlSession(sid, {
    skillName: 'discovery', sessionPath: '/tmp/t', systemPrompt: '# discovery', turns: [],
    artefactContent: null, artefactPath: null, done: false, featureSlug: slug, journeyId: jid
  });
  await routes.handlePostTurnStreamHtml(
    { session: { accessToken: 'tok', tenantId: 'org-a' }, params: { name: 'discovery', id: sid }, body: { answer: 'revise it' } },
    fakeRes()
  );

  // Simulate an immediate downstream read (no delay) — proves the write
  // completed synchronously before this point, not fire-and-forget.
  var downstreamRead = fs.readFileSync(artefactAbsPath, 'utf8');
  ok('AC2: downstream read immediately after the turn returns the new content', downstreamRead.indexOf('Revised content.') !== -1);
  ok('AC2: downstream read does not return the pre-revision content', downstreamRead.indexOf('Old content nobody should see again.') === -1);
})();

console.log('\n' + passed + ' passed, ' + failed + ' failed');
fs.rmSync(_tmpRepoRoot, { recursive: true, force: true });
delete process.env.COPILOT_REPO_PATH;
process.exit(failed > 0 ? 1 : 0);

})();
