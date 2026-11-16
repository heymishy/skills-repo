'use strict';
// pws-s1 -- production-wiring smoke test: boots the real server.js with the skill-adapter wiring on, then
// checks that every throwing adapter stub is wired (or allow-listed with a reason), that the skill-session
// routes answer an unknown session correctly, and that no route answers a hostile id with a 5xx.
// Plain Node script. Run: node tests/check-pws-s1-production-wiring-smoke.js
// Story: artefacts/2026-11-17-production-wiring-smoke-test/stories/pws-s1-production-wiring-smoke-test.md
// Test plan: artefacts/2026-11-17-production-wiring-smoke-test/test-plans/pws-s1-test-plan.md

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { spawnSync, execFileSync } = require('child_process');
const { scanStubSetters, findUnwired, extractRoutePatterns } = require('../scripts/check-production-wiring');

const root = path.resolve(__dirname, '..');

// Stub setters that are deliberately not wired at boot. Each needs a reason and an owning story.
// A stale entry (now wired, or no stub names it) fails the check.
const UNWIRED_ALLOWED = {
  setSubmitAnswer: { story: 'sub-s1', reason: 'the legacy /answer form flow is retired: the route answers 410 and never reaches the adapter (wiring it would bypass the credits, owner and lock checks /turn has)' },
  setSkillTurnExecutor: { story: 'pws-s1', reason: 'adapters/skills.js holds a default that routes/skills.js copies once at load and then replaces through setSkillTurnExecutorAdapter, which is wired; nothing calls this one' },
  setNextQuestionExecutorAdapter: { story: 'mfc.1', reason: 'the model-first chat flow has no next-question executor: routes/skills.js keeps a no-op setter (mfc.1 AC9) and the stub in adapters/skills.js is never reached' },
  setSectionDraftExecutorAdapter: { story: 'mfc.1', reason: 'same as above: the section-draft executor is a no-op in the model-first flow' },
  setDbPool: { story: 'npwe', reason: 'wired only when DATABASE_URL is set (real Postgres), which a test boot does not have; the route sweep and the behaviour probes still run' },
  setParsePhaseModel: { story: 'dic.2', reason: 'wired inside routes/skills.js itself at load (setParsePhaseModel(defaultParsePhaseModel)), so server.js never calls it' },
  setApplyCanvasEdits: { story: 'dic.5', reason: 'wired inside routes/skills.js itself at load (setApplyCanvasEdits(realApplyCanvasEdits)), so server.js never calls it' }
};

// Sweep entries not requested at all, with the reason.
const SWEEP_SKIPPED = {
  'POST /api/skills/{id}/execute': 'runs the Copilot CLI as a subprocess for any name the validator accepts; a sweep must not start real processes'
};

// Sweep entries requested that are allowed to answer 5xx in a test boot because production wiring is absent here.
const SWEEP_5XX_ALLOWED = {
  'POST /products/{id}/repo/create': { story: 'pws-s1', reason: 'the create-repo adapter is wired only outside NODE_ENV=test (server.js), so a test boot answers 502 "Adapter not wired"; production wiring is covered by its own story tests' },
  'GET /agency/clients/{id}/invite': { story: 'pws-s1', reason: 'agency provisioning handlers are wired only with real Postgres; without them the route answers 503 "Agency provisioning unavailable" by design' },
  'POST /agency/clients/{id}/invite': { story: 'pws-s1', reason: 'same as the GET: 503 by design when the provisioning handlers are not wired' }
};

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

const sources = ['src/web-ui/adapters/skills.js', 'src/web-ui/routes/skills.js'].map(function (p) { return fs.readFileSync(path.join(root, p), 'utf8'); });
const stubs = scanStubSetters(sources);

function gitState() {
  const run = function (args) { return execFileSync('git', args, { cwd: root, encoding: 'utf8' }); };
  return { head: run(['rev-parse', 'HEAD']).trim(), status: run(['status', '--short']) };
}

// One boot for the whole file.
const before = gitState();
const started = Date.now();
const child = spawnSync(process.execPath, [path.join(root, 'tests', 'helpers', 'pws-boot-probe.js'), JSON.stringify({ skipSweep: Object.keys(SWEEP_SKIPPED) })], { cwd: root, encoding: 'utf8', timeout: 100000, maxBuffer: 20 * 1024 * 1024 });
const bootMs = Date.now() - started;
const after = gitState();
let probe = null;
const jsonLine = String(child.stdout || '').split('\n').filter(function (l) { return l.charAt(0) === '{'; }).pop();
try { probe = JSON.parse(jsonLine); } catch (_e) { probe = null; }

function needProbe() {
  assert.ok(probe, 'the boot probe printed no result (exit ' + child.status + '): ' + String(child.stderr || child.stdout || '').slice(0, 600));
  return probe;
}

test('T1 every throwing stub\'s setter is called at boot or allow-listed with a reason (AC1)', function () {
  const p = needProbe();
  assert.ok(stubs.length >= 10, 'the source scan found only ' + stubs.length + ' stub setters: ' + stubs.join(', '));
  const bad = findUnwired(stubs, p.called, UNWIRED_ALLOWED).filter(function (f) { return f.kind === 'unwired'; });
  assert.deepStrictEqual(bad, [], 'stub setters neither wired at boot nor allow-listed: ' + bad.map(function (f) { return f.setter; }).join(', '));
  Object.keys(UNWIRED_ALLOWED).forEach(function (k) { assert.ok(UNWIRED_ALLOWED[k].reason && UNWIRED_ALLOWED[k].story, 'allow-list entry ' + k + ' needs a reason and a story'); });
});

test('T2 a stale allow-list entry fails (AC2)', function () {
  const p = needProbe();
  const stale = findUnwired(stubs, p.called, UNWIRED_ALLOWED).filter(function (f) { return f.kind === 'stale-allow-entry'; });
  assert.deepStrictEqual(stale, [], 'stale allow-list entries: ' + JSON.stringify(stale));
  const sweepStale = Object.keys(SWEEP_5XX_ALLOWED).filter(function (k) { return !(p.sweepWorst[k] >= 500); });
  assert.deepStrictEqual(sweepStale, [], 'sweep allow-list entries that no longer answer 5xx (remove them): ' + sweepStale.join(', '));
  // and the comparison itself reports both stale shapes
  const synthetic = findUnwired(['setA'], ['setA'], { setA: { reason: 'x', story: 'y' }, setGone: { reason: 'x', story: 'y' } });
  assert.deepStrictEqual(synthetic.map(function (f) { return f.setter + ':' + f.kind; }).sort(), ['setA:stale-allow-entry', 'setGone:stale-allow-entry']);
});

test('T3 the skill-session routes answer an unknown session without a 5xx or "Adapter not wired" (AC3)', function () {
  const p = needProbe();
  assert.ok(p.sessionProbes.length >= 7, 'expected the 7 skill-session probes');
  const bad = p.sessionProbes.filter(function (r) { return r.status >= 500 || r.status === 0 || r.unwired; });
  assert.deepStrictEqual(bad, [], 'bad answers: ' + JSON.stringify(bad));
  const by = {};
  p.sessionProbes.forEach(function (r) { by[r.method + ' ' + r.url.replace(/^.*sessions\/[^/]+\//, '')] = r.status; });
  assert.strictEqual(by['GET commit-preview'], 404, 'cpv-s1: commit preview for an unknown session is 404');
  assert.strictEqual(by['GET result'], 404, 'scr-s1: commit result for an unknown session is 404');
  assert.strictEqual(by['POST commit'], 404, 'commit for an unknown session is 404');
  assert.strictEqual(by['POST answer'], 410, 'sub-s1: the retired answer route is 410');
});

test('T4 no route answers a hostile id with a 5xx (AC4)', function () {
  const p = needProbe();
  assert.ok(p.patternCount >= 60, 'only ' + p.patternCount + ' route patterns were found in server.js (the extractor may have gone blind)');
  Object.keys(SWEEP_SKIPPED).forEach(function (k) { assert.ok(p.patternCount > 0 && SWEEP_SKIPPED[k], 'skip entry ' + k + ' needs a reason'); });
  const bad = p.sweepFailures.filter(function (f) { return !SWEEP_5XX_ALLOWED[f.method + ' ' + f.pattern]; });
  assert.deepStrictEqual(bad.slice(0, 8), [], bad.length + ' hostile requests answered 5xx or "Adapter not wired" (first shown)');
  assert.ok(p.sweepCount >= 400, 'the sweep made only ' + p.sweepCount + ' requests');
});

test('T5 the comparison reports the original defect shape: an unwired stub that is not allow-listed (AC5)', function () {
  const found = findUnwired(['setGetCommitResult', 'setX'], ['setX'], {});
  assert.deepStrictEqual(found, [{ kind: 'unwired', setter: 'setGetCommitResult' }]);
  assert.deepStrictEqual(scanStubSetters(["throw new Error('Adapter not wired: getCommitResult. Call setGetCommitResult() with a real implementation before use.');"]), ['setGetCommitResult']);
  const routes = extractRoutePatterns("a(pathname.match(/^\\/products\\/[^/]+\\/kanban$/)); b(pathname.match(/^\\/x\\/(a|b)$/));");
  assert.deepStrictEqual(routes.patterns, ['/products/{id}/kanban']);
  assert.strictEqual(routes.skipped.length, 1);
});

test('T6 it runs in the unit chain, within 60 seconds, and leaves the repository clean (AC6)', function () {
  needProbe();
  const runner = fs.readFileSync(path.join(root, 'scripts', 'run-all-tests.js'), 'utf8');
  assert.ok(/check-\\\*\.js|check-\*\.js|startsWith\('check-'\)|\^check-/.test(runner), 'run-all-tests.js no longer discovers tests/check-*.js');
  assert.ok(bootMs < 60000, 'the boot probe took ' + bootMs + ' ms');
  assert.strictEqual(after.head, before.head, 'HEAD changed');
  assert.strictEqual(after.status, before.status, 'the run changed the working tree:\n' + after.status);
});

(async function run() {
  let passed = 0; let failed = 0;
  for (const t of tests) {
    try { await t.fn(); console.log('[pws-s1] PASS: ' + t.name); passed++; }
    catch (e) { console.error('[pws-s1] FAIL: ' + t.name + '\n    ' + String(e.message).split('\n').join('\n    ')); failed++; }
  }
  console.log('\n[pws-s1] ' + passed + ' passed, ' + failed + ' failed (boot ' + bootMs + ' ms)');
  process.exit(failed > 0 ? 1 : 0);
})();
