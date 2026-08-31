#!/usr/bin/env node
/**
 * check-wsap-s1-story-scoped-artefact-paths.js -- AC verification for wsap-s1
 * (Web UI test-plan/definition-of-ready artefact save paths and Step-1 scanner
 * aligned with the canonical per-story convention: artefacts/[feature]/
 * test-plans/[storyId]-test-plan.md and artefacts/[feature]/dor/[storyId]-dor.md.
 *
 * Root cause (investigated 2026-08-31): three different, mutually-inconsistent
 * path conventions were colliding in src/web-ui/routes/skills.js -- the prompt
 * told the model one convention, the actual save path (via the alrf-s8 fix)
 * ignored the model's slug for journey-linked sessions and wrote a flat file
 * with no story ID at all (every story's test-plan overwrote the last one's),
 * and the Step-1 scanner checked for yet a third, non-existent convention.
 * This closes all three onto the one real convention already documented in
 * skills/test-plan/SKILL.md and skills/definition-of-ready/SKILL.md and used
 * by every CLI-driven feature on disk.
 *
 * Run: node tests/check-wsap-s1-story-scoped-artefact-paths.js
 */
'use strict';

process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'test-session-secret-minimum32chars!!';

const fs   = require('fs');
const os   = require('os');
const path = require('path');
const ROUTES_PATH = path.resolve(__dirname, '../src/web-ui/routes/skills.js');
const JOURNEY_STORE_PATH = path.resolve(__dirname, '../src/web-ui/modules/journey-store.js');

let passed = 0;
let failed = 0;
function ok(cond, label) {
  if (cond) { console.log('  ✓ ' + label); passed++; }
  else       { console.log('  ✗ ' + label); failed++; }
}
function eq(a, b, label) {
  if (a === b) { console.log('  ✓ ' + label); passed++; }
  else {
    console.log('  ✗ ' + label + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')');
    failed++;
  }
}
function ok2(cond, label) { ok(cond, label); }

function freshRequire(modulePath) {
  const resolved = require.resolve(modulePath);
  delete require.cache[resolved];
  return require(resolved);
}

const FIXTURE_RESPONSE =
  'Understood.\n\n---ARTEFACT-START---\n# Test Plan\n\nReal content.\n---ARTEFACT-END---\n---SLUG---\nwsap-repro-feature';

function noopRes() {
  return { writeHead: function() {}, write: function() {}, end: function() {} };
}

const _tmpRepoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'wsap-s1-'));
process.env.COPILOT_REPO_PATH = _tmpRepoRoot;

async function run() {
  // ── AC1: linkSessionToJourney sets session.currentStoryId ──
  console.log('\n  AC1 -- linkSessionToJourney sets session.currentStoryId from journey.stories[currentStoryIndex]');
  {
    // journey-store must be freshRequire'd BEFORE routes.js, so routes.js's
    // internal `require('../modules/journey-store')` resolves to this same
    // fresh instance instead of a stale, disconnected one.
    const journeyStore = freshRequire(JOURNEY_STORE_PATH);
    const routes = freshRequire(ROUTES_PATH);
    const journey = journeyStore.createJourney('wsap-ac1-feature');
    journeyStore.setJourneyFields(journey.journeyId, { stories: [{ id: 's1' }, { id: 's2' }], currentStoryIndex: 1 });
    const sid = 'test-wsap-s1-a-' + Math.random().toString(36).slice(2);
    routes.registerHtmlSession(sid, '/tmp/t', 'test-plan', { featureSlug: 'wsap-ac1-feature' });
    routes.linkSessionToJourney(sid, journey.journeyId);
    const session = routes._getHtmlSession(sid);
    eq(session.currentStoryId, 's2', 'AC1: session.currentStoryId set to the story at currentStoryIndex');
  }

  // ── AC2: test-plan artefact path is per-story (non-streaming) ──
  console.log('\n  AC2 -- htmlSubmitTurn: test-plan artefactPath is per-story, not the flat shared file');
  {
    const routes = freshRequire(ROUTES_PATH);
    routes.setSkillTurnExecutorAdapter(function() { return Promise.resolve({ text: FIXTURE_RESPONSE, usage: {} }); });
    const sid = 'test-wsap-s1-b-' + Math.random().toString(36).slice(2);
    routes.registerHtmlSession(sid, '/tmp/t', 'test-plan', { featureSlug: 'wsap-repro-feature' });
    routes._setHtmlSession(sid, Object.assign(routes._getHtmlSession(sid), { currentStoryId: 's2' }));
    await routes.htmlSubmitTurn('test-plan', sid, 'hello', 'fake-tok');
    const session = routes._getHtmlSession(sid);
    eq(session.artefactPath, 'artefacts/wsap-repro-feature/test-plans/s2-test-plan.md', 'AC2: per-story test-plan path, not the flat artefacts/wsap-repro-feature/test-plan.md');
  }

  // ── AC3: definition-of-ready artefact path is per-story (non-streaming) ──
  console.log('\n  AC3 -- htmlSubmitTurn: definition-of-ready artefactPath is per-story');
  {
    const routes = freshRequire(ROUTES_PATH);
    routes.setSkillTurnExecutorAdapter(function() { return Promise.resolve({ text: FIXTURE_RESPONSE, usage: {} }); });
    const sid = 'test-wsap-s1-c-' + Math.random().toString(36).slice(2);
    routes.registerHtmlSession(sid, '/tmp/t', 'definition-of-ready', { featureSlug: 'wsap-repro-feature' });
    routes._setHtmlSession(sid, Object.assign(routes._getHtmlSession(sid), { currentStoryId: 's2' }));
    await routes.htmlSubmitTurn('definition-of-ready', sid, 'hello', 'fake-tok');
    const session = routes._getHtmlSession(sid);
    eq(session.artefactPath, 'artefacts/wsap-repro-feature/dor/s2-dor.md', 'AC3: per-story dor path');
  }

  // ── AC4: no currentStoryId -> flat path fallback (regression, both skillNames) ──
  console.log('\n  AC4 -- no currentStoryId -> unchanged flat path (regression)');
  {
    const routes = freshRequire(ROUTES_PATH);
    routes.setSkillTurnExecutorAdapter(function() { return Promise.resolve({ text: FIXTURE_RESPONSE, usage: {} }); });
    const sidA = 'test-wsap-s1-d1-' + Math.random().toString(36).slice(2);
    routes.registerHtmlSession(sidA, '/tmp/t', 'test-plan', { featureSlug: 'wsap-standalone-feature' });
    await routes.htmlSubmitTurn('test-plan', sidA, 'hello', 'fake-tok');
    eq(routes._getHtmlSession(sidA).artefactPath, 'artefacts/wsap-standalone-feature/test-plan.md', 'AC4a: test-plan falls back to flat path with no currentStoryId');

    const sidB = 'test-wsap-s1-d2-' + Math.random().toString(36).slice(2);
    routes.registerHtmlSession(sidB, '/tmp/t', 'definition-of-ready', { featureSlug: 'wsap-standalone-feature' });
    await routes.htmlSubmitTurn('definition-of-ready', sidB, 'hello', 'fake-tok');
    eq(routes._getHtmlSession(sidB).artefactPath, 'artefacts/wsap-standalone-feature/definition-of-ready.md', 'AC4b: definition-of-ready falls back to flat path with no currentStoryId');
  }

  // ── AC5: computeStep1Summary finds multiple test-plan entries in test-plans/ ──
  console.log('\n  AC5 -- computeStep1Summary finds real entries in artefacts/[slug]/test-plans/');
  {
    const routes = freshRequire(ROUTES_PATH);
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wsap-s1-step1-tp-'));
    const tpDir = path.join(root, 'artefacts', 'wsap-step1-feature', 'test-plans');
    fs.mkdirSync(tpDir, { recursive: true });
    fs.writeFileSync(path.join(tpDir, 's1-test-plan.md'), '# TP1', 'utf8');
    fs.writeFileSync(path.join(tpDir, 's2-test-plan.md'), '# TP2', 'utf8');
    const summary = routes.computeStep1Summary('wsap-step1-feature', 'test-plan', root);
    ok(summary.indexOf('s1') !== -1, 'AC5: summary mentions s1');
    ok(summary.indexOf('s2') !== -1, 'AC5: summary mentions s2');
    ok(summary.indexOf('no prior test-plan artefacts found') === -1, 'AC5: does not report "no prior artefacts found" when real entries exist');
    fs.rmSync(root, { recursive: true, force: true });
  }

  // ── AC6: computeStep1Summary finds DoR entries in dor/ ──
  console.log('\n  AC6 -- computeStep1Summary finds real entries in artefacts/[slug]/dor/');
  {
    const routes = freshRequire(ROUTES_PATH);
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wsap-s1-step1-dor-'));
    const dorDir = path.join(root, 'artefacts', 'wsap-step1-feature', 'dor');
    fs.mkdirSync(dorDir, { recursive: true });
    fs.writeFileSync(path.join(dorDir, 's1-dor.md'), '# DoR1', 'utf8');
    const summary = routes.computeStep1Summary('wsap-step1-feature', 'definition-of-ready', root);
    ok(summary.indexOf('s1') !== -1, 'AC6: summary mentions s1');
    ok(summary.indexOf('no prior DoR artefacts found') === -1, 'AC6: does not report "no prior artefacts found" when a real entry exists');
    fs.rmSync(root, { recursive: true, force: true });
  }

  // ── Path-traversal guard (security carryover, mirrors the existing review branch) ──
  console.log('\n  Security -- computeStep1Summary path-traversal guard on the new scanner directories');
  {
    const routes = freshRequire(ROUTES_PATH);
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wsap-s1-traversal-'));
    let threw = false;
    let summary = '';
    try { summary = routes.computeStep1Summary('../../etc', 'test-plan', root); } catch (_) { threw = true; }
    ok(!threw, 'Security: does not throw on a traversal-shaped featureSlug');
    ok(summary.indexOf('no prior test-plan artefacts found') !== -1, 'Security: falls back to the safe "no prior artefacts" result rather than escaping artefactsBase');
    fs.rmSync(root, { recursive: true, force: true });
  }

  // ── AC7: streaming handler produces identical per-story paths ──
  console.log('\n  AC7 -- handlePostTurnStreamHtml: same per-story paths as the non-streaming handler');
  {
    const routes = freshRequire(ROUTES_PATH);
    routes.setSkillTurnExecutorStreamAdapter(function(systemPrompt, history, currentInput, token, onChunk, onThinkingChunk, onFirstChunk) {
      onFirstChunk(0);
      onChunk(FIXTURE_RESPONSE);
      return Promise.resolve({ text: FIXTURE_RESPONSE, usage: {} });
    });

    const sidTp = 'test-wsap-s1-e1-' + Math.random().toString(36).slice(2);
    routes._setHtmlSession(sidTp, {
      skillName: 'test-plan', sessionPath: '/tmp/t', systemPrompt: '# test-plan', turns: [],
      artefactContent: null, artefactPath: null, done: false,
      featureSlug: 'wsap-repro-feature', currentStoryId: 's2'
    });
    await routes.handlePostTurnStreamHtml(
      { session: { accessToken: 'tok', tenantId: 'org-a' }, params: { name: 'test-plan', id: sidTp }, body: { answer: 'hi' } },
      noopRes()
    );
    eq(routes._getHtmlSession(sidTp).artefactPath, 'artefacts/wsap-repro-feature/test-plans/s2-test-plan.md', 'AC7a: streaming test-plan path matches the non-streaming path');

    const sidDor = 'test-wsap-s1-e2-' + Math.random().toString(36).slice(2);
    routes._setHtmlSession(sidDor, {
      skillName: 'definition-of-ready', sessionPath: '/tmp/t', systemPrompt: '# dor', turns: [],
      artefactContent: null, artefactPath: null, done: false,
      featureSlug: 'wsap-repro-feature', currentStoryId: 's2'
    });
    await routes.handlePostTurnStreamHtml(
      { session: { accessToken: 'tok', tenantId: 'org-a' }, params: { name: 'definition-of-ready', id: sidDor }, body: { answer: 'hi' } },
      noopRes()
    );
    eq(routes._getHtmlSession(sidDor).artefactPath, 'artefacts/wsap-repro-feature/dor/s2-dor.md', 'AC7b: streaming dor path matches the non-streaming path');
  }

  delete process.env.COPILOT_REPO_PATH;
  fs.rmSync(_tmpRepoRoot, { recursive: true, force: true });

  console.log('\n[wsap-s1-story-scoped-artefact-paths] Results: ' + passed + ' passed, ' + failed + ' failed\n');
  process.exit(failed > 0 ? 1 : 0);
}

run();
