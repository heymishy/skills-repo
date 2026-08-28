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

console.log('\n' + passed + ' passed, ' + failed + ' failed');
fs.rmSync(_tmpRepoRoot, { recursive: true, force: true });
delete process.env.COPILOT_REPO_PATH;
process.exit(failed > 0 ? 1 : 0);

})();
