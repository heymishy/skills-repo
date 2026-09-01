#!/usr/bin/env node
/**
 * check-defs-revs-s1-wiring-into-turn-completion.js -- AC verification for
 * defs-s1/revs-s1's wiring into handlePostTurnStreamHtml: when a
 * 'definition' or 'review' stage completes for a connected-repo journey,
 * the flat artefact is written and committed exactly as before (dcuf-s1,
 * unchanged), AND the consolidated artefact is additionally split into
 * individual epic/story/review files, written to disk, and committed via
 * the same das-s1 mechanism.
 *
 * Run: node tests/check-defs-revs-s1-wiring-into-turn-completion.js
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

function noopRes() {
  return { writeHead: function() {}, write: function() {}, end: function() {}, on: function() {} };
}

const _tmpRepoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'defs-revs-s1-'));
process.env.COPILOT_REPO_PATH = _tmpRepoRoot;

const DEFINITION_RESPONSE = [
  'Definition complete ✅',
  '',
  '---ARTEFACT-START---',
  'Slicing strategy: walking-skeleton',
  '',
  '## Epic 1 — Test Epic',
  '',
  'Goal: Ship the thing.',
  'Complexity: 2',
  '',
  '### ep1-s1 — First Story',
  '**Persona:** Platform owner',
  '',
  '**Given** x, **When** y, **Then** z.',
  '',
  '**Out of scope:**',
  '- Nothing relevant',
  '',
  '**Complexity:** 1',
  '',
  '### ep1-s2 — Second Story',
  '**Persona:** Platform owner',
  '',
  '**Given** a, **When** b, **Then** c.',
  '',
  '**Complexity:** 2',
  '---ARTEFACT-END---',
  '---SLUG---',
  'defs-repro-feature'
].join('\n');

const REVIEW_RESPONSE = [
  'Review complete ✅',
  '',
  '---ARTEFACT-START---',
  '# Review Report',
  '',
  '## Story: ep1-s1',
  '',
  '### HIGH findings',
  'None.',
  '',
  '### MEDIUM findings',
  'None.',
  '',
  '### LOW findings',
  'None.',
  '',
  '**Verdict:** PASS',
  '',
  '## Overall Verdict',
  '',
  '**Verdict:** PASS',
  '---ARTEFACT-END---',
  '---SLUG---',
  'revs-repro-feature'
].join('\n');

async function run() {
  // ── AC1: definition stage completion writes flat file AND split epic/story files ──
  console.log('\n  AC1 -- definition stage: flat definition.md + individual epics/*.md + stories/*.md all written and committed');
  {
    const journeyStore = freshRequire(JOURNEY_STORE_PATH);
    const routes = freshRequire(ROUTES_PATH);
    const eds = freshRequire(EXPORT_DATA_SOURCE_PATH);
    const acw = freshRequire(ARTEFACT_COMMIT_WRITER_PATH);

    const journey = journeyStore.createJourney('defs-repro-feature');
    eds.setDbPool(createMockPool(
      [{ feature_slug: 'defs-repro-feature', product_id: 'p1', tenant_id: 't1' }],
      [{ product_id: 'p1', tenant_id: 't1', repo_owner: 'acme', repo_name: 'widgets' }]
    ));
    const commitCalls = [];
    acw.setArtefactCommitAdapter(async function(artefactPath, content) {
      commitCalls.push({ path: artefactPath, content: content });
      return { ok: true };
    });
    routes.setSkillTurnExecutorStreamAdapter(function(systemPrompt, history, currentInput, token, onChunk, onThinkingChunk, onFirstChunk) {
      onFirstChunk(0);
      onChunk(DEFINITION_RESPONSE);
      return Promise.resolve({ text: DEFINITION_RESPONSE, usage: {} });
    });

    const sid = 'test-defs-s1-a-' + Math.random().toString(36).slice(2);
    routes._setHtmlSession(sid, {
      skillName: 'definition', sessionPath: '/tmp/t', systemPrompt: '# definition', turns: [],
      artefactContent: null, artefactPath: null, done: false,
      featureSlug: 'defs-repro-feature', journeyId: journey.journeyId
    });
    await routes.handlePostTurnStreamHtml(
      { session: { accessToken: 'operator-token', tenantId: 'org-a' }, params: { name: 'definition', id: sid }, body: { answer: 'go' } },
      noopRes()
    );

    const committedPaths = commitCalls.map(function(c) { return c.path; });
    ok(committedPaths.includes('artefacts/defs-repro-feature/definition.md'), 'AC1: flat definition.md committed (unchanged dcuf-s1 behaviour)');
    ok(committedPaths.includes('artefacts/defs-repro-feature/epics/test-epic.md'), 'AC1: individual epic file committed');
    ok(committedPaths.includes('artefacts/defs-repro-feature/stories/ep1-s1.md'), 'AC1: ep1-s1 story file committed');
    ok(committedPaths.includes('artefacts/defs-repro-feature/stories/ep1-s2.md'), 'AC1: ep1-s2 story file committed');

    const storyFileOnDisk = path.join(_tmpRepoRoot, 'artefacts/defs-repro-feature/stories/ep1-s1.md');
    ok(fs.existsSync(storyFileOnDisk), 'AC1: story file also exists on local disk');
    ok(fs.readFileSync(storyFileOnDisk, 'utf8').includes('First Story'), 'AC1: story file has the real title, not a placeholder');
  }

  // ── AC2: review stage completion writes flat file AND split per-story review file ──
  console.log('\n  AC2 -- review stage: flat review.md + individual review/[slug]-review-[N].md written and committed');
  {
    const journeyStore = freshRequire(JOURNEY_STORE_PATH);
    const routes = freshRequire(ROUTES_PATH);
    const eds = freshRequire(EXPORT_DATA_SOURCE_PATH);
    const acw = freshRequire(ARTEFACT_COMMIT_WRITER_PATH);

    const journey = journeyStore.createJourney('revs-repro-feature');
    eds.setDbPool(createMockPool(
      [{ feature_slug: 'revs-repro-feature', product_id: 'p1', tenant_id: 't1' }],
      [{ product_id: 'p1', tenant_id: 't1', repo_owner: 'acme', repo_name: 'widgets' }]
    ));
    const commitCalls = [];
    acw.setArtefactCommitAdapter(async function(artefactPath, content) {
      commitCalls.push({ path: artefactPath, content: content });
      return { ok: true };
    });
    routes.setSkillTurnExecutorStreamAdapter(function(systemPrompt, history, currentInput, token, onChunk, onThinkingChunk, onFirstChunk) {
      onFirstChunk(0);
      onChunk(REVIEW_RESPONSE);
      return Promise.resolve({ text: REVIEW_RESPONSE, usage: {} });
    });

    const sid = 'test-revs-s1-a-' + Math.random().toString(36).slice(2);
    routes._setHtmlSession(sid, {
      skillName: 'review', sessionPath: '/tmp/t', systemPrompt: '# review', turns: [],
      artefactContent: null, artefactPath: null, done: false,
      featureSlug: 'revs-repro-feature', journeyId: journey.journeyId
    });
    await routes.handlePostTurnStreamHtml(
      { session: { accessToken: 'operator-token', tenantId: 'org-a' }, params: { name: 'review', id: sid }, body: { answer: 'go' } },
      noopRes()
    );

    const committedPaths = commitCalls.map(function(c) { return c.path; });
    ok(committedPaths.includes('artefacts/revs-repro-feature/review.md'), 'AC2: flat review.md committed (unchanged dcuf-s1 behaviour)');
    ok(committedPaths.includes('artefacts/revs-repro-feature/review/ep1-s1-review-1.md'), 'AC2: per-story review file committed at run 1');

    const reviewFileOnDisk = path.join(_tmpRepoRoot, 'artefacts/revs-repro-feature/review/ep1-s1-review-1.md');
    ok(fs.existsSync(reviewFileOnDisk), 'AC2: per-story review file also exists on local disk');
    ok(fs.readFileSync(reviewFileOnDisk, 'utf8').includes('PASS'), 'AC2: review file records the real PASS verdict');
  }

  // ── AC3: repo-less product -> split files still written locally, but never committed (matches das-s1 AC4) ──
  console.log('\n  AC3 -- repo-less product: split files written to local disk, never committed');
  {
    const journeyStore = freshRequire(JOURNEY_STORE_PATH);
    const routes = freshRequire(ROUTES_PATH);
    const eds = freshRequire(EXPORT_DATA_SOURCE_PATH);
    const acw = freshRequire(ARTEFACT_COMMIT_WRITER_PATH);

    const journey = journeyStore.createJourney('defs-norepo-feature');
    eds.setDbPool(createMockPool([], []));
    let commitCalled = false;
    acw.setArtefactCommitAdapter(async function() { commitCalled = true; return { ok: true }; });
    routes.setSkillTurnExecutorStreamAdapter(function(systemPrompt, history, currentInput, token, onChunk, onThinkingChunk, onFirstChunk) {
      onFirstChunk(0);
      onChunk(DEFINITION_RESPONSE.replace('defs-repro-feature', 'defs-norepo-feature'));
      return Promise.resolve({ text: DEFINITION_RESPONSE.replace('defs-repro-feature', 'defs-norepo-feature'), usage: {} });
    });

    const sid = 'test-defs-s1-c-' + Math.random().toString(36).slice(2);
    routes._setHtmlSession(sid, {
      skillName: 'definition', sessionPath: '/tmp/t', systemPrompt: '# definition', turns: [],
      artefactContent: null, artefactPath: null, done: false,
      featureSlug: 'defs-norepo-feature', journeyId: journey.journeyId
    });
    await routes.handlePostTurnStreamHtml(
      { session: { accessToken: 'operator-token', tenantId: 'org-a' }, params: { name: 'definition', id: sid }, body: { answer: 'go' } },
      noopRes()
    );

    ok(!commitCalled, 'AC3: commitArtefact never called for a repo-less product');
    ok(fs.existsSync(path.join(_tmpRepoRoot, 'artefacts/defs-norepo-feature/stories/ep1-s1.md')), 'AC3: story file still written to local disk even without a connected repo');
  }

  delete process.env.COPILOT_REPO_PATH;
  fs.rmSync(_tmpRepoRoot, { recursive: true, force: true });

  console.log('\n[defs-revs-s1-wiring-into-turn-completion] Results: ' + passed + ' passed, ' + failed + ' failed\n');
  process.exit(failed > 0 ? 1 : 0);
}

run();
