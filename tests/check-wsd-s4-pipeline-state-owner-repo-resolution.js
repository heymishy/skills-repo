#!/usr/bin/env node
/**
 * check-wsd-s4-pipeline-state-owner-repo-resolution.js
 *
 * Regression test for wsd-s4 -- the pipeline-state-writer call in
 * journey.js's handlePostGateConfirm must resolve owner/repo FRESH and
 * UNCONDITIONALLY, not reuse `_dasOwnerRepo` from the artefact-commit block
 * above it.
 *
 * Root cause (found via wsd-s2's own live production verification, then
 * wsd-s3's follow-up verification of a first, insufficient fix): dcuf-s1
 * (an earlier, unrelated story) already moved the REAL, live-chat-driven
 * stage-completion logic -- including `_dasOwnerRepo`'s own resolution --
 * out of journey.js's `if (!session._stageDone)` block and into skills.js's
 * chat-turn handler (`handlePostTurnStreamHtml`), because that block is
 * "unreachable in practice": skills.js sets `session._stageDone = true`
 * during the actual chat turn, before the operator ever reaches
 * handlePostGateConfirm, so journey.js's own guard almost always sees
 * `_stageDone` already true and skips its body -- including whatever
 * `_dasOwnerRepo` resolution lives inside it. wsd-s2's and wsd-s3's own
 * test suites both used `setupAndRunGateConfirm`-style harnesses that call
 * handlePostGateConfirm directly against a hand-built session with
 * `_stageDone` left unset -- exactly the unreality dcuf-s1's own test file
 * already documented for the artefact-commit case, now repeated for the
 * pipeline-state-writer case. This test drives the REAL two-step flow:
 * handlePostTurnStreamHtml (skills.js) completes the stage first, THEN
 * handlePostGateConfirm (journey.js) runs against that already-completed
 * session -- exactly matching a real "Continue to X" click.
 *
 * Run: node tests/check-wsd-s4-pipeline-state-owner-repo-resolution.js
 */
'use strict';

process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'test-session-secret-minimum32chars!!';

const fs   = require('fs');
const os   = require('os');
const path = require('path');

const JOURNEY_STORE_PATH        = path.resolve(__dirname, '../src/web-ui/modules/journey-store.js');
const SKILLS_ROUTES_PATH        = path.resolve(__dirname, '../src/web-ui/routes/skills.js');
const JOURNEY_ROUTES_PATH       = path.resolve(__dirname, '../src/web-ui/routes/journey.js');
const EXPORT_DATA_SOURCE_PATH   = path.resolve(__dirname, '../src/web-ui/adapters/export-data-source.js');
const ARTEFACT_COMMIT_WRITER_PATH = path.resolve(__dirname, '../src/web-ui/adapters/artefact-commit-writer.js');
const REPO_ROOT_ADAPTER_PATH    = path.resolve(__dirname, '../src/web-ui/adapters/repo-root.js');

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

const FIXTURE_RESPONSE =
  'Understood.\n\n---ARTEFACT-START---\n# Discovery: wsd-s4 Regression\n\nReal content.\n---ARTEFACT-END---\n---SLUG---\nwsd-s4-repro-feature';

function noopStreamRes() {
  return {
    writeHead: function() {},
    write: function() {},
    end: function() {},
    on: function() {}
  };
}

function makeGateConfirmRes() {
  var res = { _code: null, _body: '' };
  res.writeHead = function(code) { res._code = code; };
  res.end = function(body) { res._body += (body || ''); };
  return res;
}

async function run() {
  console.log('\n[wsd-s4] pipeline-state-writer owner/repo resolution -- real two-step flow\n');

  const _tmpRepoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'wsd-s4-'));
  process.env.COPILOT_REPO_PATH = _tmpRepoRoot;

  const journeyStore  = freshRequire(JOURNEY_STORE_PATH);
  const skillsRoutes   = freshRequire(SKILLS_ROUTES_PATH);
  const journeyRoutes  = freshRequire(JOURNEY_ROUTES_PATH);
  const eds            = freshRequire(EXPORT_DATA_SOURCE_PATH);
  const acw            = freshRequire(ARTEFACT_COMMIT_WRITER_PATH);
  const repoRootAdapter = freshRequire(REPO_ROOT_ADAPTER_PATH);
  repoRootAdapter.setRepoRoot(_tmpRepoRoot);

  eds.setDbPool(createMockPool(
    [{ feature_slug: 'wsd-s4-repro-feature', product_id: 'p1', tenant_id: 't1' }],
    [{ product_id: 'p1', tenant_id: 't1', repo_owner: 'acme', repo_name: 'widgets' }]
  ));
  acw.setArtefactCommitAdapter(async function() { return { ok: true }; });
  skillsRoutes.setSkillTurnExecutorStreamAdapter(function(systemPrompt, history, currentInput, token, onChunk, onThinkingChunk, onFirstChunk) {
    onFirstChunk(0);
    onChunk(FIXTURE_RESPONSE);
    return Promise.resolve({ text: FIXTURE_RESPONSE, usage: {} });
  });

  const journey = journeyStore.createJourney('wsd-s4-repro-feature');
  const sid = 'test-wsd-s4-' + Math.random().toString(36).slice(2);
  skillsRoutes._setHtmlSession(sid, {
    skillName: 'discovery', sessionPath: '/tmp/t', systemPrompt: '# discovery', turns: [],
    artefactContent: null, artefactPath: null, done: false,
    featureSlug: 'wsd-s4-repro-feature', journeyId: journey.journeyId
  });
  journeyStore.setActiveSession(journey.journeyId, sid, 'discovery');

  // ── Step 1: complete the stage via the REAL chat-turn path (skills.js) ──
  await skillsRoutes.handlePostTurnStreamHtml(
    { session: { accessToken: 'operator-token', login: 'operator', tenantId: 'org-a' }, params: { name: 'discovery', id: sid }, body: { answer: 'hi' } },
    noopStreamRes()
  );

  const sessionAfterTurn = skillsRoutes._getHtmlSession(sid);
  ok(sessionAfterTurn && sessionAfterTurn._stageDone === true, 'setup: session._stageDone is true after the chat turn (mirrors real usage -- journey.js\'s own guard will be skipped)');
  ok(sessionAfterTurn && sessionAfterTurn.done === true, 'setup: session.done is true after the chat turn (handlePostGateConfirm requires this)');

  // ── Step 2: spy on the pipeline-state writer, then run gate-confirm exactly as a real "Continue to X" click would ──
  const writerCalls = [];
  journeyRoutes.setPipelineStateWriter(function(featureSlug, storyId, stateUpdate, context) {
    writerCalls.push({ featureSlug: featureSlug, storyId: storyId, stateUpdate: stateUpdate, context: context });
  });

  const gcReq = {
    session: { accessToken: 'operator-token', login: 'operator', tenantId: 'org-a', csrfToken: 'test-csrf-token' },
    params: { journeyId: journey.journeyId },
    body: { _csrf: 'test-csrf-token' },
    headers: {}
  };
  await journeyRoutes.handlePostGateConfirm(gcReq, makeGateConfirmRes());

  eq(writerCalls.length, 1, 'AC (wsd-s4): pipeline-state writer called exactly once from gate-confirm');
  if (writerCalls.length === 1) {
    const ctx = writerCalls[0].context || {};
    ok(ctx.owner === 'acme', 'AC (wsd-s4): context.owner resolved to the connected repo owner, not undefined -- got ' + JSON.stringify(ctx.owner));
    ok(ctx.repo === 'widgets', 'AC (wsd-s4): context.repo resolved to the connected repo name, not undefined -- got ' + JSON.stringify(ctx.repo));
    eq(ctx.token, 'operator-token', 'AC (wsd-s4): context.token carries the operator\'s own session token');
    eq(writerCalls[0].featureSlug, 'wsd-s4-repro-feature', 'AC (wsd-s4): featureSlug passed through correctly');
    eq(writerCalls[0].stateUpdate.discoveryStatus, 'complete', 'AC (wsd-s4): stateUpdate still carries discoveryStatus=complete');
  }

  fs.rmSync(_tmpRepoRoot, { recursive: true, force: true });

  console.log(`\n[wsd-s4] ${passed} passed, ${failed} failed\n`);
  process.exit(failed === 0 ? 0 : 1);
}

run();
