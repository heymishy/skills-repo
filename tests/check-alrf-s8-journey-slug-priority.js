#!/usr/bin/env node
/**
 * check-alrf-s8-journey-slug-priority.js -- alrf-s8: a journey-linked session's
 * real featureSlug must always win over the response's own ---SLUG--- marker
 * when deciding session.artefactPath.
 *
 * Root cause (operator-reported, 2026-07-26): staging's Resume flow showed a
 * real feature's ("new-feature-d350e651") artefacts as discovery/benefit-metric/
 * design/definition content belonging to "mock-fixture-feature" instead. Every
 * mock-llm-gateway fixture hardcodes the identical ---SLUG---
 * 2026-07-10-mock-fixture-feature marker; both htmlSubmitTurn (non-streaming)
 * and the streaming turn handler always preferred that marker over the
 * session's already-known, real featureSlug (set at journey-creation time via
 * linkSessionToJourney) -- so every real feature's artefacts collapsed onto
 * the same shared mock slug whenever MOCK_LLM_GATEWAY=true. This bug is not
 * mock-specific: it would misfire identically if a real model ever announced
 * a different slug than the one the journey already has, it was just invisible
 * with a real model because it has no reason to invent a conflicting slug.
 *
 * Run: node tests/check-alrf-s8-journey-slug-priority.js
 */
'use strict';

const fs   = require('fs');
const os   = require('os');
const path = require('path');
const ROUTES_PATH = path.resolve(__dirname, '../src/web-ui/routes/skills.js');
const JOURNEY_STORE_PATH = path.resolve(__dirname, '../src/web-ui/modules/journey-store.js');

// The streaming handler auto-saves the artefact to real disk via _getRepoPath()
// (COPILOT_REPO_PATH || CLAUDE_REPO_PATH || the real repo root). Point it at a
// throwaway temp dir for AC3/AC4 so this test never writes into the real
// artefacts/ tree.
const _tmpRepoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'alrf-s8-'));
process.env.COPILOT_REPO_PATH = _tmpRepoRoot;

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

function freshRequire(modulePath) {
  const resolved = require.resolve(modulePath);
  delete require.cache[resolved];
  return require(resolved);
}

const FIXTURE_RESPONSE =
  'Understood.\n\n---ARTEFACT-START---\n# Discovery\n\nReal content.\n---ARTEFACT-END---\n---SLUG---\n2026-07-10-mock-fixture-feature';

function noopRes() {
  return { writeHead: function() {}, write: function() {}, end: function() {} };
}

async function run() {
  // ── AC1: htmlSubmitTurn (non-streaming) prefers session.featureSlug over the marker ──
  console.log('\n  AC1 -- htmlSubmitTurn: journey-linked session.featureSlug wins over the ---SLUG--- marker');
  {
    const routes = freshRequire(ROUTES_PATH);
    routes.setSkillTurnExecutorAdapter(function() { return Promise.resolve({ text: FIXTURE_RESPONSE, usage: {} }); });
    const sid = 'test-alrf-s8-a-' + Math.random().toString(36).slice(2);
    routes.registerHtmlSession(sid, '/tmp/t', 'discovery', { featureSlug: 'new-feature-d350e651' });
    await routes.htmlSubmitTurn('discovery', sid, 'hello', 'fake-tok');
    const session = routes._getHtmlSession(sid);
    eq(session.artefactPath, 'artefacts/new-feature-d350e651/discovery.md', 'AC1: artefactPath uses the real journey featureSlug, not the fixture\'s hardcoded slug');
  }

  // ── AC2: htmlSubmitTurn falls back to the marker when no featureSlug is known (standalone/CLI-style session) ──
  console.log('\n  AC2 -- htmlSubmitTurn: no featureSlug known -> falls back to the ---SLUG--- marker (unchanged behaviour)');
  {
    const routes = freshRequire(ROUTES_PATH);
    routes.setSkillTurnExecutorAdapter(function() { return Promise.resolve({ text: FIXTURE_RESPONSE, usage: {} }); });
    const sid = 'test-alrf-s8-b-' + Math.random().toString(36).slice(2);
    routes.registerHtmlSession(sid, '/tmp/t', 'discovery'); // no featureSlug opt
    await routes.htmlSubmitTurn('discovery', sid, 'hello', 'fake-tok');
    const session = routes._getHtmlSession(sid);
    eq(session.artefactPath, 'artefacts/2026-07-10-mock-fixture-feature/discovery.md', 'AC2: falls back to the response\'s own SLUG marker when session.featureSlug is unset');
  }

  // ── AC3: streaming handler prefers session.featureSlug over the marker ──
  console.log('\n  AC3 -- handlePostTurnStreamHtml: journey-linked session.featureSlug wins over the marker');
  {
    const routes = freshRequire(ROUTES_PATH);
    routes.setSkillTurnExecutorStreamAdapter(function(systemPrompt, history, currentInput, token, onChunk, onThinkingChunk, onFirstChunk) {
      onFirstChunk(0);
      onChunk(FIXTURE_RESPONSE);
      return Promise.resolve({ text: FIXTURE_RESPONSE, usage: {} });
    });
    const sid = 'test-alrf-s8-c-' + Math.random().toString(36).slice(2);
    routes._setHtmlSession(sid, {
      skillName: 'discovery', sessionPath: '/tmp/t', systemPrompt: '# discovery', turns: [],
      artefactContent: null, artefactPath: null, done: false, featureSlug: 'new-feature-d350e651'
    });
    await routes.handlePostTurnStreamHtml(
      { session: { accessToken: 'tok', tenantId: 'org-a' }, params: { name: 'discovery', id: sid }, body: { answer: 'hi' } },
      noopRes()
    );
    const session = routes._getHtmlSession(sid);
    eq(session.artefactPath, 'artefacts/new-feature-d350e651/discovery.md', 'AC3: streaming path also uses the real journey featureSlug, not the fixture\'s hardcoded slug');
  }

  // ── AC4: streaming handler falls back to the marker when no featureSlug is known ──
  console.log('\n  AC4 -- handlePostTurnStreamHtml: no featureSlug known -> falls back to the marker (unchanged behaviour)');
  {
    const routes = freshRequire(ROUTES_PATH);
    routes.setSkillTurnExecutorStreamAdapter(function(systemPrompt, history, currentInput, token, onChunk, onThinkingChunk, onFirstChunk) {
      onFirstChunk(0);
      onChunk(FIXTURE_RESPONSE);
      return Promise.resolve({ text: FIXTURE_RESPONSE, usage: {} });
    });
    const sid = 'test-alrf-s8-d-' + Math.random().toString(36).slice(2);
    routes._setHtmlSession(sid, {
      skillName: 'discovery', sessionPath: '/tmp/t', systemPrompt: '# discovery', turns: [],
      artefactContent: null, artefactPath: null, done: false
      // featureSlug intentionally absent
    });
    await routes.handlePostTurnStreamHtml(
      { session: { accessToken: 'tok', tenantId: 'org-a' }, params: { name: 'discovery', id: sid }, body: { answer: 'hi' } },
      noopRes()
    );
    const session = routes._getHtmlSession(sid);
    eq(session.artefactPath, 'artefacts/2026-07-10-mock-fixture-feature/discovery.md', 'AC4: streaming path falls back to the marker when session.featureSlug is unset');
  }

  // ── wuai-s1 AC1: storyId resolved from the artefact's own Story field when it names a known story ──
  console.log('\n  wuai-s1 AC1 -- htmlSubmitTurn: storyId resolved from the artefact\'s own "**Story:**" field, not the stale session.currentStoryId');
  {
    const routes = freshRequire(ROUTES_PATH);
    const jStore = require(JOURNEY_STORE_PATH);
    const dorFixture =
      '---ARTEFACT-START---\n# Definition of Ready — ep5-s1: Database migration\n\n**Feature:** wuai-test-feature\n**Story:** ep5-s1\n\nContent.\n---ARTEFACT-END---\n---SLUG---\nwuai-test-feature';
    routes.setSkillTurnExecutorAdapter(function() { return Promise.resolve({ text: dorFixture, usage: {} }); });
    const journey = jStore.createJourney('wuai-test-feature');
    jStore.setStoryList(journey.journeyId, ['ep1-s1', 'ep5-s1']);
    const sid = 'test-wuai-s1-a-' + Math.random().toString(36).slice(2);
    routes._setHtmlSession(sid, {
      skillName: 'definition-of-ready', sessionPath: '/tmp/t', systemPrompt: '# dor', turns: [],
      artefactContent: null, artefactPath: null, done: false
    });
    routes.linkSessionToJourney(sid, journey.journeyId); // sets currentStoryId = 'ep1-s1' (index 0) -- the stale pointer
    await routes.htmlSubmitTurn('definition-of-ready', sid, 'hello', 'fake-tok');
    const session = routes._getHtmlSession(sid);
    eq(session.artefactPath, 'artefacts/wuai-test-feature/dor/ep5-s1-dor.md', 'wuai-s1 AC1: saved under the story the content actually names (ep5-s1), not the stale pointer (ep1-s1)');
  }

  // ── wuai-s1 AC2: falls back to session.currentStoryId when the Story field is absent or names an unknown story ──
  console.log('\n  wuai-s1 AC2 -- htmlSubmitTurn: falls back to session.currentStoryId when the Story field is absent/unknown');
  {
    const routes = freshRequire(ROUTES_PATH);
    const jStore = require(JOURNEY_STORE_PATH);
    const noFieldFixture =
      '---ARTEFACT-START---\n# Definition of Ready\n\nNo Story field here.\n---ARTEFACT-END---\n---SLUG---\nwuai-test-feature';
    routes.setSkillTurnExecutorAdapter(function() { return Promise.resolve({ text: noFieldFixture, usage: {} }); });
    const journey = jStore.createJourney('wuai-test-feature');
    jStore.setStoryList(journey.journeyId, ['ep1-s1', 'ep5-s1']);
    const sid = 'test-wuai-s1-b-' + Math.random().toString(36).slice(2);
    routes._setHtmlSession(sid, {
      skillName: 'definition-of-ready', sessionPath: '/tmp/t', systemPrompt: '# dor', turns: [],
      artefactContent: null, artefactPath: null, done: false
    });
    routes.linkSessionToJourney(sid, journey.journeyId); // currentStoryId = 'ep1-s1'
    await routes.htmlSubmitTurn('definition-of-ready', sid, 'hello', 'fake-tok');
    const session = routes._getHtmlSession(sid);
    eq(session.artefactPath, 'artefacts/wuai-test-feature/dor/ep1-s1-dor.md', 'wuai-s1 AC2a: no Story field -> falls back to session.currentStoryId');

    // Second case: Story field present but names a story NOT in the journey's storyList
    const unknownStoryFixture =
      '---ARTEFACT-START---\n# Definition of Ready\n\n**Story:** not-a-real-story\n---ARTEFACT-END---\n---SLUG---\nwuai-test-feature';
    routes.setSkillTurnExecutorAdapter(function() { return Promise.resolve({ text: unknownStoryFixture, usage: {} }); });
    const sid2 = 'test-wuai-s1-b2-' + Math.random().toString(36).slice(2);
    routes._setHtmlSession(sid2, {
      skillName: 'definition-of-ready', sessionPath: '/tmp/t', systemPrompt: '# dor', turns: [],
      artefactContent: null, artefactPath: null, done: false
    });
    routes.linkSessionToJourney(sid2, journey.journeyId);
    await routes.htmlSubmitTurn('definition-of-ready', sid2, 'hello', 'fake-tok');
    const session2 = routes._getHtmlSession(sid2);
    eq(session2.artefactPath, 'artefacts/wuai-test-feature/dor/ep1-s1-dor.md', 'wuai-s1 AC2b: Story field names an unknown story -> falls back to session.currentStoryId, never trusts the unvalidated value');
  }

  // ── wuai-s1 AC3: no linked journey -> Story field is never consulted, behaviour fully unchanged ──
  console.log('\n  wuai-s1 AC3 -- htmlSubmitTurn: standalone session (no journeyId) ignores the Story field entirely');
  {
    const routes = freshRequire(ROUTES_PATH);
    const dorFixture =
      '---ARTEFACT-START---\n# Definition of Ready\n\n**Story:** ep9-s9\n---ARTEFACT-END---\n---SLUG---\nwuai-test-feature';
    routes.setSkillTurnExecutorAdapter(function() { return Promise.resolve({ text: dorFixture, usage: {} }); });
    const sid = 'test-wuai-s1-c-' + Math.random().toString(36).slice(2);
    routes._setHtmlSession(sid, {
      skillName: 'definition-of-ready', sessionPath: '/tmp/t', systemPrompt: '# dor', turns: [],
      artefactContent: null, artefactPath: null, done: false, featureSlug: 'wuai-test-feature',
      currentStoryId: 'manual-s1' // set directly, as a standalone/CLI-style session would be
      // journeyId intentionally absent
    });
    await routes.htmlSubmitTurn('definition-of-ready', sid, 'hello', 'fake-tok');
    const session = routes._getHtmlSession(sid);
    eq(session.artefactPath, 'artefacts/wuai-test-feature/dor/manual-s1-dor.md', 'wuai-s1 AC3: no journey linked -> the Story field (ep9-s9) is never consulted, session.currentStoryId wins exactly as before');
  }

  delete process.env.COPILOT_REPO_PATH;
  fs.rmSync(_tmpRepoRoot, { recursive: true, force: true });

  console.log('\n[alrf-s8-journey-slug-priority] Results: ' + passed + ' passed, ' + failed + ' failed\n');
  process.exit(failed > 0 ? 1 : 0);
}

run();
