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

  delete process.env.COPILOT_REPO_PATH;
  fs.rmSync(_tmpRepoRoot, { recursive: true, force: true });

  console.log('\n[alrf-s8-journey-slug-priority] Results: ' + passed + ' passed, ' + failed + ' failed\n');
  process.exit(failed > 0 ? 1 : 0);
}

run();
