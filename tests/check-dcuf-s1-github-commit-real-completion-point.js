#!/usr/bin/env node
/**
 * check-dcuf-s1-github-commit-real-completion-point.js -- AC verification
 * for dcuf-s1 (move das-s1's GitHub-commit dual-write from journey.js's
 * handlePostGateConfirm, where it was unreachable in real usage, to the
 * point handlePostTurnStreamHtml actually first sets session._stageDone).
 *
 * Root cause (confirmed 2026-09-01): journey.js's handlePostGateConfirm
 * gates das-s1's commit behind `if (!session._stageDone)`, but for a real
 * live chat-driven journey, skills.js's handlePostTurnStreamHtml already
 * sets _stageDone = true earlier -- so das-s1's GitHub-API commit never
 * ran for any real feature. das-s1's own test file only ever exercised
 * handlePostGateConfirm directly against a hand-built session with
 * _stageDone left unset, which never reflected reality.
 *
 * See artefacts/2026-09-01-das-s1-github-commit-unreachable-fix/ and
 * artefacts/2026-09-01-artefact-commit-durability-gap/discovery.md.
 *
 * Run: node tests/check-dcuf-s1-github-commit-real-completion-point.js
 */
'use strict';

process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'test-session-secret-minimum32chars!!';

const fs   = require('fs');
const os   = require('os');
const path = require('path');
const ROUTES_PATH = path.resolve(__dirname, '../src/web-ui/routes/skills.js');
const JOURNEY_STORE_PATH = path.resolve(__dirname, '../src/web-ui/modules/journey-store.js');
const EXPORT_DATA_SOURCE_PATH = path.resolve(__dirname, '../src/web-ui/adapters/export-data-source.js');
const ARTEFACT_COMMIT_WRITER_PATH = path.resolve(__dirname, '../src/web-ui/adapters/artefact-commit-writer.js');

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

/** Mirrors das-s1's own createMockPool -- scoped to exactly the two query shapes ownerRepoForFeature issues. */
function createMockPool(journeyRows, productRows) {
  async function query(sql, params) {
    var s = String(sql).replace(/\s+/g, ' ').trim().toUpperCase();
    if (s.startsWith('SELECT PRODUCT_ID, TENANT_ID FROM JOURNEYS WHERE FEATURE_SLUG')) {
      var slug = params[0];
      var match = journeyRows.filter(function(r) { return r.feature_slug === slug; });
      return { rows: match.map(function(r) { return { product_id: r.product_id, tenant_id: r.tenant_id }; }) };
    }
    if (s.startsWith('SELECT REPO_OWNER, REPO_NAME FROM PRODUCTS WHERE PRODUCT_ID') && s.includes('TENANT_ID')) {
      var productId = params[0], tenantId = params[1];
      var pmatch = productRows.filter(function(r) { return r.product_id === productId && r.tenant_id === tenantId; });
      return { rows: pmatch.map(function(r) { return { repo_owner: r.repo_owner, repo_name: r.repo_name }; }) };
    }
    return { rows: [] };
  }
  return { query: query };
}

const FIXTURE_RESPONSE =
  'Understood.\n\n---ARTEFACT-START---\n# Test Artefact\n\nReal content.\n---ARTEFACT-END---\n---SLUG---\ndcuf-repro-feature';

function noopRes() {
  const events = [];
  return {
    _events: events,
    writeHead: function() {},
    write: function(chunk) {
      const m = String(chunk).match(/^data: (.+)\n\n$/);
      if (m) { try { events.push(JSON.parse(m[1])); } catch (_) {} }
    },
    end: function() {},
    on: function() {}
  };
}

const _tmpRepoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'dcuf-s1-'));
process.env.COPILOT_REPO_PATH = _tmpRepoRoot;

async function run() {
  // ── AC1: connected-repo turn completion commits to GitHub AND local disk ──
  console.log('\n  AC1 -- connected-repo first completion: commitArtefact called once, dual-write to disk');
  {
    const journeyStore = freshRequire(JOURNEY_STORE_PATH);
    const routes = freshRequire(ROUTES_PATH);
    const eds = freshRequire(EXPORT_DATA_SOURCE_PATH);
    const acw = freshRequire(ARTEFACT_COMMIT_WRITER_PATH);

    const journey = journeyStore.createJourney('dcuf-repro-feature');
    eds.setDbPool(createMockPool(
      [{ feature_slug: 'dcuf-repro-feature', product_id: 'p1', tenant_id: 't1' }],
      [{ product_id: 'p1', tenant_id: 't1', repo_owner: 'acme', repo_name: 'widgets' }]
    ));
    const commitCalls = [];
    acw.setArtefactCommitAdapter(async function(artefactPath, content, token, owner, repo) {
      commitCalls.push({ artefactPath: artefactPath, content: content, owner: owner, repo: repo });
      return { ok: true };
    });
    routes.setSkillTurnExecutorStreamAdapter(function(systemPrompt, history, currentInput, token, onChunk, onThinkingChunk, onFirstChunk) {
      onFirstChunk(0);
      onChunk(FIXTURE_RESPONSE);
      return Promise.resolve({ text: FIXTURE_RESPONSE, usage: {} });
    });

    const sid = 'test-dcuf-s1-a-' + Math.random().toString(36).slice(2);
    routes._setHtmlSession(sid, {
      skillName: 'test-plan', sessionPath: '/tmp/t', systemPrompt: '# test-plan', turns: [],
      artefactContent: null, artefactPath: null, done: false,
      featureSlug: 'dcuf-repro-feature', journeyId: journey.journeyId
    });
    await routes.handlePostTurnStreamHtml(
      { session: { accessToken: 'operator-token', tenantId: 'org-a' }, params: { name: 'test-plan', id: sid }, body: { answer: 'hi' } },
      noopRes()
    );

    eq(commitCalls.length, 1, 'AC1: commitArtefact called exactly once');
    ok(commitCalls[0] && commitCalls[0].owner === 'acme' && commitCalls[0].repo === 'widgets', 'AC1: commit resolved to the connected repo');
    eq(commitCalls[0] && commitCalls[0].artefactPath, 'artefacts/dcuf-repro-feature/test-plan.md', 'AC1: commit path matches the local artefact path');
    const diskPath = path.join(_tmpRepoRoot, 'artefacts/dcuf-repro-feature/test-plan.md');
    ok(fs.existsSync(diskPath), 'AC1: local disk file also written (dual-write, not a replacement)');
    const session = routes._getHtmlSession(sid);
    eq(session._stageDone, true, 'AC1: session._stageDone set to true after a successful commit');
  }

  // ── AC2: commit failure -> _stageDone unset, no completeStage, SSE error event ──
  console.log('\n  AC2 -- commit failure: _stageDone stays unset, no completeStage call, SSE error event');
  {
    const journeyStore = freshRequire(JOURNEY_STORE_PATH);
    const routes = freshRequire(ROUTES_PATH);
    const eds = freshRequire(EXPORT_DATA_SOURCE_PATH);
    const acw = freshRequire(ARTEFACT_COMMIT_WRITER_PATH);

    const journey = journeyStore.createJourney('dcuf-fail-feature');
    eds.setDbPool(createMockPool(
      [{ feature_slug: 'dcuf-fail-feature', product_id: 'p1', tenant_id: 't1' }],
      [{ product_id: 'p1', tenant_id: 't1', repo_owner: 'acme', repo_name: 'widgets' }]
    ));
    acw.setArtefactCommitAdapter(async function() {
      throw new Error('simulated GitHub API failure (rate limit)');
    });
    routes.setSkillTurnExecutorStreamAdapter(function(systemPrompt, history, currentInput, token, onChunk, onThinkingChunk, onFirstChunk) {
      onFirstChunk(0);
      onChunk(FIXTURE_RESPONSE);
      return Promise.resolve({ text: FIXTURE_RESPONSE, usage: {} });
    });

    const sid = 'test-dcuf-s1-b-' + Math.random().toString(36).slice(2);
    routes._setHtmlSession(sid, {
      skillName: 'test-plan', sessionPath: '/tmp/t', systemPrompt: '# test-plan', turns: [],
      artefactContent: null, artefactPath: null, done: false,
      featureSlug: 'dcuf-fail-feature', journeyId: journey.journeyId
    });
    const res = noopRes();
    await routes.handlePostTurnStreamHtml(
      { session: { accessToken: 'operator-token', tenantId: 'org-a' }, params: { name: 'test-plan', id: sid }, body: { answer: 'hi' } },
      res
    );

    const session = routes._getHtmlSession(sid);
    ok(session._stageDone !== true, 'AC2: session._stageDone NOT set to true when the commit fails');
    const journeyAfter = journeyStore.getJourney(journey.journeyId);
    ok(!(journeyAfter.completedStages || []).some(function(cs) { return cs.skillName === 'test-plan'; }), 'AC2: no completedStages entry recorded');
    ok(res._events.some(function(e) { return typeof e.error === 'string'; }), 'AC2: an SSE error event was emitted');
  }

  // ── AC3: repo-less / unresolvable product -> unchanged behaviour ──
  console.log('\n  AC3 -- repo-less product (ownerRepoForFeature unresolved): commitArtefact never called, unchanged completion');
  {
    const journeyStore = freshRequire(JOURNEY_STORE_PATH);
    const routes = freshRequire(ROUTES_PATH);
    const eds = freshRequire(EXPORT_DATA_SOURCE_PATH);
    const acw = freshRequire(ARTEFACT_COMMIT_WRITER_PATH);

    const journey = journeyStore.createJourney('dcuf-norepo-feature');
    eds.setDbPool(createMockPool([], [])); // no matching journey/product row -> ExportNotFoundError
    let commitCalled = false;
    acw.setArtefactCommitAdapter(async function() {
      commitCalled = true;
      return { ok: true };
    });
    routes.setSkillTurnExecutorStreamAdapter(function(systemPrompt, history, currentInput, token, onChunk, onThinkingChunk, onFirstChunk) {
      onFirstChunk(0);
      onChunk(FIXTURE_RESPONSE);
      return Promise.resolve({ text: FIXTURE_RESPONSE, usage: {} });
    });

    const sid = 'test-dcuf-s1-c-' + Math.random().toString(36).slice(2);
    routes._setHtmlSession(sid, {
      skillName: 'test-plan', sessionPath: '/tmp/t', systemPrompt: '# test-plan', turns: [],
      artefactContent: null, artefactPath: null, done: false,
      featureSlug: 'dcuf-norepo-feature', journeyId: journey.journeyId
    });
    const res = noopRes();
    await routes.handlePostTurnStreamHtml(
      { session: { accessToken: 'operator-token', tenantId: 'org-a' }, params: { name: 'test-plan', id: sid }, body: { answer: 'hi' } },
      res
    );

    ok(!commitCalled, 'AC3: commitArtefact never called for a repo-less/unresolvable product');
    const session = routes._getHtmlSession(sid);
    eq(session._stageDone, true, 'AC3: session._stageDone still set to true (unchanged completion)');
    ok(!res._events.some(function(e) { return typeof e.error === 'string'; }), 'AC3: no error event surfaced');
    const journeyAfter = journeyStore.getJourney(journey.journeyId);
    ok((journeyAfter.completedStages || []).some(function(cs) { return cs.skillName === 'test-plan'; }), 'AC3: stage still marked complete as before this story');
  }

  // ── AC4: revision (existing completedStages entry) -> no commit attempted ──
  console.log('\n  AC4 -- revision of an already-completed stage: commitArtefact never attempted');
  {
    const journeyStore = freshRequire(JOURNEY_STORE_PATH);
    const routes = freshRequire(ROUTES_PATH);
    const eds = freshRequire(EXPORT_DATA_SOURCE_PATH);
    const acw = freshRequire(ARTEFACT_COMMIT_WRITER_PATH);

    const journey = journeyStore.createJourney('dcuf-revision-feature');
    // Pre-seed a completedStages entry for the same skillName -- this call is a revision.
    journeyStore.completeStage(journey.journeyId, 'test-plan', 'artefacts/dcuf-revision-feature/test-plan.md', null, 'prior-sid');
    eds.setDbPool(createMockPool(
      [{ feature_slug: 'dcuf-revision-feature', product_id: 'p1', tenant_id: 't1' }],
      [{ product_id: 'p1', tenant_id: 't1', repo_owner: 'acme', repo_name: 'widgets' }]
    ));
    let commitCalled = false;
    acw.setArtefactCommitAdapter(async function() {
      commitCalled = true;
      return { ok: true };
    });
    routes.setSkillTurnExecutorStreamAdapter(function(systemPrompt, history, currentInput, token, onChunk, onThinkingChunk, onFirstChunk) {
      onFirstChunk(0);
      onChunk(FIXTURE_RESPONSE);
      return Promise.resolve({ text: FIXTURE_RESPONSE, usage: {} });
    });

    const sid = 'test-dcuf-s1-d-' + Math.random().toString(36).slice(2);
    routes._setHtmlSession(sid, {
      skillName: 'test-plan', sessionPath: '/tmp/t', systemPrompt: '# test-plan', turns: [],
      artefactContent: null, artefactPath: null, done: false,
      featureSlug: 'dcuf-revision-feature', journeyId: journey.journeyId
    });
    await routes.handlePostTurnStreamHtml(
      { session: { accessToken: 'operator-token', tenantId: 'org-a' }, params: { name: 'test-plan', id: sid }, body: { answer: 'hi' } },
      noopRes()
    );

    ok(!commitCalled, 'AC4: commitArtefact never attempted for a revision of an already-completed stage');
  }

  delete process.env.COPILOT_REPO_PATH;
  fs.rmSync(_tmpRepoRoot, { recursive: true, force: true });

  console.log('\n[dcuf-s1-github-commit-real-completion-point] Results: ' + passed + ' passed, ' + failed + ' failed\n');
  process.exit(failed > 0 ? 1 : 0);
}

run();
