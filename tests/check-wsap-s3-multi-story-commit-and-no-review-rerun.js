#!/usr/bin/env node
/**
 * check-wsap-s3-multi-story-commit-and-no-review-rerun.js
 *
 * Regression test for wsap-s3 -- two fixes found via live end-to-end
 * verification of a real 2-story feature through the full outer loop in
 * production, following wsap-s2's own live verification.
 *
 * Fix 1 (skills.js): _existingStageEntry must match on (skillName,
 * artefactPath), not skillName alone. completedStages entries carry no
 * storyId field, but session.artefactPath is already story-scoped
 * (wsap-s2). Matching by skillName alone meant a SECOND story's first-ever
 * completion of "test-plan" found the FIRST story's pre-existing
 * "test-plan" completedStages entry and was incorrectly treated as a
 * revision -- silently skipping the GitHub commit for every story after
 * the first in a feature. Confirmed live: new-feature-2b74a292's stories
 * 2-13 and a fresh 2-story verification feature's own story 2 both never
 * got their test-plan/DoR artefacts committed to GitHub, only saved to the
 * container's ephemeral disk.
 *
 * Fix 2 (journey.js): review must run exactly once per feature, not once
 * per story. The original PER_STORY_SEQ included 'review', so every
 * story's definition-of-ready completion looped back to a FULL re-review
 * of the whole feature before that next story's test-plan -- producing the
 * visible review -> test-plan -> DoR -> review -> test-plan -> DoR cycle
 * that was reported as looking like an infinite loop. This also
 * contradicts CLAUDE.md's own documented pipeline table, where only
 * test-plan's row is marked "(per story)" -- review's entry condition is
 * "stories exist", not "per story".
 *
 * Run: node tests/check-wsap-s3-multi-story-commit-and-no-review-rerun.js
 */
'use strict';

process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'test-session-secret-minimum32chars!!';

const fs   = require('fs');
const os   = require('os');
const path = require('path');
const ROUTES_PATH         = path.resolve(__dirname, '../src/web-ui/routes/skills.js');
const JOURNEY_ROUTES_PATH = path.resolve(__dirname, '../src/web-ui/routes/journey.js');
const JOURNEY_STORE_PATH  = path.resolve(__dirname, '../src/web-ui/modules/journey-store.js');
const EXPORT_DATA_SOURCE_PATH     = path.resolve(__dirname, '../src/web-ui/adapters/export-data-source.js');
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

/** Mirrors dcuf-s1's own createMockPool -- scoped to exactly the two query shapes ownerRepoForFeature issues. */
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

function fixtureResponse(slug) {
  return 'Understood.\n\n---ARTEFACT-START---\n# Test Plan\n\nReal content.\n---ARTEFACT-END---\n---SLUG---\n' + slug;
}

function noopStreamRes() {
  return { writeHead: function() {}, write: function() {}, end: function() {}, on: function() {} };
}

async function run() {
  console.log('\n[wsap-s3] multi-story GitHub commit gating + no per-story review re-run\n');

  const _tmpRepoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'wsap-s3-'));
  process.env.COPILOT_REPO_PATH = _tmpRepoRoot;

  // ── Fix 1: second story's own first test-plan completion still commits to GitHub ──
  {
    const journeyStore = freshRequire(JOURNEY_STORE_PATH);
    const routes       = freshRequire(ROUTES_PATH);
    const eds          = freshRequire(EXPORT_DATA_SOURCE_PATH);
    const acw          = freshRequire(ARTEFACT_COMMIT_WRITER_PATH);

    const featureSlug = 'wsap-s3-repro-feature';
    eds.setDbPool(createMockPool(
      [{ feature_slug: featureSlug, product_id: 'p1', tenant_id: 't1' }],
      [{ product_id: 'p1', tenant_id: 't1', repo_owner: 'acme', repo_name: 'widgets' }]
    ));
    const commitCalls = [];
    acw.setArtefactCommitAdapter(async function(artefactPath, content, token, owner, repo) {
      commitCalls.push({ artefactPath: artefactPath, owner: owner, repo: repo });
      return { ok: true };
    });

    const journey = journeyStore.createJourney(featureSlug);
    journeyStore.setStoryList(journey.journeyId, ['s1', 's2']);

    // Story 1's test-plan: first-ever completion of "test-plan" for this feature.
    routes.setSkillTurnExecutorStreamAdapter(function(systemPrompt, history, currentInput, token, onChunk, onThinkingChunk, onFirstChunk) {
      onFirstChunk(0); onChunk(fixtureResponse(featureSlug)); return Promise.resolve({ text: fixtureResponse(featureSlug), usage: {} });
    });
    const sid1 = 'test-wsap-s3-story1-' + Math.random().toString(36).slice(2);
    routes._setHtmlSession(sid1, {
      skillName: 'test-plan', sessionPath: '/tmp/t', systemPrompt: '# test-plan', turns: [],
      artefactContent: null, artefactPath: null, done: false,
      featureSlug: featureSlug, journeyId: journey.journeyId, currentStoryId: 's1'
    });
    await routes.handlePostTurnStreamHtml(
      { session: { accessToken: 'operator-token', tenantId: 'org-a' }, params: { name: 'test-plan', id: sid1 }, body: { answer: 'hi' } },
      noopStreamRes()
    );

    eq(commitCalls.length, 1, 'Fix 1 setup: story 1\'s own first test-plan completion commits to GitHub');
    ok(commitCalls[0] && /s1-test-plan\.md$/.test(commitCalls[0].artefactPath), 'Fix 1 setup: story 1\'s commit path is story-scoped (s1-test-plan.md)');

    // Story 2's test-plan: ALSO a first-ever completion for THIS story, but
    // "test-plan" already has a completedStages entry from story 1. Before
    // this fix, this would be silently skipped.
    const sid2 = 'test-wsap-s3-story2-' + Math.random().toString(36).slice(2);
    routes._setHtmlSession(sid2, {
      skillName: 'test-plan', sessionPath: '/tmp/t', systemPrompt: '# test-plan', turns: [],
      artefactContent: null, artefactPath: null, done: false,
      featureSlug: featureSlug, journeyId: journey.journeyId, currentStoryId: 's2'
    });
    await routes.handlePostTurnStreamHtml(
      { session: { accessToken: 'operator-token', tenantId: 'org-a' }, params: { name: 'test-plan', id: sid2 }, body: { answer: 'hi' } },
      noopStreamRes()
    );

    eq(commitCalls.length, 2, 'Fix 1: story 2\'s own first test-plan completion ALSO commits to GitHub, not silently skipped');
    ok(commitCalls[1] && /s2-test-plan\.md$/.test(commitCalls[1].artefactPath), 'Fix 1: story 2\'s commit path is its own, distinct, story-scoped path (s2-test-plan.md)');
    ok(commitCalls[0].artefactPath !== commitCalls[1].artefactPath, 'Fix 1: the two commits targeted genuinely different paths, not the same file twice');
  }

  // ── Fix 2: definition-of-ready "more stories" branch goes to test-plan, not review ──
  {
    const journeyStore  = freshRequire(JOURNEY_STORE_PATH);
    const journeyRoutes = freshRequire(JOURNEY_ROUTES_PATH);

    const featureSlug = 'wsap-s3-review-repro-feature';
    const journey = journeyStore.createJourney(featureSlug);
    journeyStore.setStoryList(journey.journeyId, ['s1', 's2']);

    const dorSid = 'sess-dor-wsap-s3-' + Date.now();
    journeyStore.setActiveSession(journey.journeyId, dorSid, 'definition-of-ready');

    const dorPath = 'artefacts/' + featureSlug + '/dor/s1-dor.md';
    const dorAbs = path.join(_tmpRepoRoot, dorPath);
    fs.mkdirSync(path.dirname(dorAbs), { recursive: true });
    fs.writeFileSync(dorAbs, '# DoR for s1', 'utf8');

    journeyRoutes.setRepoRoot(_tmpRepoRoot);
    if (typeof journeyRoutes.setValidate === 'function') {
      journeyRoutes.setValidate(function() { return { exitCode: 0 }; });
    }
    journeyRoutes.setGetHtmlSession(function(sid) {
      if (sid === dorSid) {
        return {
          skillName: 'definition-of-ready', done: true,
          artefactContent: '# DoR', artefactPath: dorPath,
          journeyId: journey.journeyId, turns: [], systemPrompt: 'test'
        };
      }
      return null;
    });
    let registeredSkillName = null;
    journeyRoutes.setRegisterHtmlSession(function(sid, sessionPath, skillName) { registeredSkillName = skillName; });
    journeyRoutes.setLinkSessionToJourney(function() {});

    const req = {
      session: { accessToken: 'tok', login: 'user', csrfToken: 'test-csrf-token' },
      params: { journeyId: journey.journeyId },
      body: { _csrf: 'test-csrf-token' },
      headers: {}
    };
    let redirectLocation = null;
    const res = {
      writeHead: function(code, headers) { if (headers && headers.Location) redirectLocation = headers.Location; },
      end: function() {}
    };
    await journeyRoutes.handlePostGateConfirm(req, res);

    ok(redirectLocation && redirectLocation.indexOf('/skills/test-plan/sessions/') !== -1, 'Fix 2: DoR completion with more stories redirects straight to test-plan, not review -- got: ' + redirectLocation);
    eq(registeredSkillName, 'test-plan', 'Fix 2: the newly-registered session for the next story is skillName "test-plan", not "review"');
  }

  delete process.env.COPILOT_REPO_PATH;
  fs.rmSync(_tmpRepoRoot, { recursive: true, force: true });

  console.log(`\n[wsap-s3] ${passed} passed, ${failed} failed\n`);
  process.exit(failed === 0 ? 0 : 1);
}

run();
