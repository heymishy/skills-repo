#!/usr/bin/env node
/**
 * check-rsc-s1-review-split-coverage.js -- AC verification for rsc-s1
 * (deterministic, code-level completeness check on the review-artefact
 * splitter's own output, comparing it against a feature's known story list
 * rather than trusting the model always emits a "## Story: [slug]" marker).
 *
 * Story: artefacts/2026-09-30-review-split-coverage-check/stories/rsc-s1.md
 * Test plan: artefacts/2026-09-30-review-split-coverage-check/test-plans/rsc-s1-test-plan.md
 *
 * Run: node tests/check-rsc-s1-review-split-coverage.js
 */
'use strict';

process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'test-session-secret-minimum32chars!!';

const path = require('path');

const SPLITTER_PATH = path.resolve(__dirname, '../src/web-ui/utils/review-artefact-splitter.js');
const ROUTES_PATH = path.resolve(__dirname, '../src/web-ui/routes/skills.js');
const JOURNEY_STORE_PATH = path.resolve(__dirname, '../src/web-ui/modules/journey-store.js');

let passed = 0;
let failed = 0;
function ok(cond, label) {
  if (cond) { console.log('  ✓ ' + label); passed++; }
  else       { console.log('  ✗ ' + label); failed++; }
}
function eq(a, b, label) {
  const same = JSON.stringify(a) === JSON.stringify(b);
  if (same) { console.log('  ✓ ' + label); passed++; }
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

function noopRes() {
  return { writeHead: function() {}, write: function() {}, end: function() {}, on: function() {} };
}

function reviewResponseForStories(storySlugs) {
  const lines = ['Review complete ✅', '', '---ARTEFACT-START---', '# Review Report', ''];
  storySlugs.forEach(function(slug) {
    lines.push('## Story: ' + slug, '', '### HIGH findings', 'None.', '', '### MEDIUM findings', 'None.', '', '### LOW findings', 'None.', '', '**Verdict:** PASS', '');
  });
  lines.push('---ARTEFACT-END---', '---SLUG---', 'rsc-repro-feature');
  return lines.join('\n');
}

function spyConsoleWarn() {
  const calls = [];
  const original = console.warn;
  console.warn = function(msg) { calls.push(msg); };
  return { calls: calls, restore: function() { console.warn = original; } };
}

function parseWarnEvents(calls, eventName) {
  return calls
    .map(function(m) { try { return JSON.parse(m); } catch (_) { return null; } })
    .filter(function(o) { return o && o.event === eventName; });
}

async function run() {
  // ── AC1: gap detection returns missing slugs, in known-list order ──
  console.log('\n  AC1 -- computeReviewSplitCoverageGaps returns missing slugs in known-list order');
  {
    const splitter = freshRequire(SPLITTER_PATH);
    const splitResults = [{ storySlug: 'ep1-s3', runNumber: 1 }, { storySlug: 'ep1-s2', runNumber: 1 }];
    const known = ['ep1-s1', 'ep1-s2', 'ep1-s3'];
    const gaps = splitter.computeReviewSplitCoverageGaps(splitResults, known);
    eq(gaps, ['ep1-s1'], 'AC1: returns exactly the missing slug');
  }

  // ── AC2: no false positives when coverage is complete, regardless of order ──
  console.log('\n  AC2 -- computeReviewSplitCoverageGaps returns [] when coverage is complete');
  {
    const splitter = freshRequire(SPLITTER_PATH);
    const splitResults = [{ storySlug: 'ep1-s3' }, { storySlug: 'ep1-s1' }, { storySlug: 'ep1-s2' }];
    const known = ['ep1-s1', 'ep1-s2', 'ep1-s3'];
    const gaps = splitter.computeReviewSplitCoverageGaps(splitResults, known);
    eq(gaps, [], 'AC2: empty array when every known story is covered, regardless of split order');
  }

  // ── AC3: fully-missing split returns all known slugs (the real corruption scenario) ──
  console.log('\n  AC3 -- computeReviewSplitCoverageGaps returns the full known list when the split is entirely empty');
  {
    const splitter = freshRequire(SPLITTER_PATH);
    const known = ['ep1-s1', 'ep1-s2', 'ep1-s3'];
    const gaps = splitter.computeReviewSplitCoverageGaps([], known);
    eq(gaps, known, 'AC3: returns all 3 known slugs when nothing was split -- the web-ui-learnings-and-improvements scenario');
  }

  // ── AC4: real turn completion logs a structured warning when a known story is missing ──
  console.log('\n  AC4 -- real review-turn completion logs review_split_incomplete when a known story is missing from the split');
  {
    const journeyStore = freshRequire(JOURNEY_STORE_PATH);
    const routes = freshRequire(ROUTES_PATH);

    const journey = journeyStore.createJourney('rsc-repro-feature');
    journeyStore.setStoryList(journey.journeyId, ['ep1-s1', 'ep1-s2']);

    routes.setSkillTurnExecutorStreamAdapter(function(systemPrompt, history, currentInput, token, onChunk, onThinkingChunk, onFirstChunk) {
      const resp = reviewResponseForStories(['ep1-s1']); // ep1-s2 missing from the model's own output
      onFirstChunk(0);
      onChunk(resp);
      return Promise.resolve({ text: resp, usage: {} });
    });

    const sid = 'test-rsc-s1-a-' + Math.random().toString(36).slice(2);
    routes._setHtmlSession(sid, {
      skillName: 'review', sessionPath: '/tmp/t', systemPrompt: '# review', turns: [],
      artefactContent: null, artefactPath: null, done: false,
      featureSlug: 'rsc-repro-feature', journeyId: journey.journeyId
    });

    const spy = spyConsoleWarn();
    await routes.handlePostTurnStreamHtml(
      { session: { accessToken: 'operator-token', tenantId: 'org-a' }, params: { name: 'review', id: sid }, body: { answer: 'go' } },
      noopRes()
    );
    spy.restore();

    const events = parseWarnEvents(spy.calls, 'review_split_incomplete');
    eq(events.length, 1, 'AC4: exactly one review_split_incomplete warning logged');
    if (events.length === 1) {
      eq(events[0].missingStorySlugs, ['ep1-s2'], 'AC4: missingStorySlugs names exactly the missing story');
      eq(events[0].featureSlug, 'rsc-repro-feature', 'AC4: featureSlug is correct');
      eq(events[0].journeyId, journey.journeyId, 'AC4: journeyId is correct');
    }
  }

  // ── AC5: real turn completion logs nothing when coverage is complete ──
  console.log('\n  AC5 -- real review-turn completion logs nothing when the split fully covers the known story list');
  {
    const journeyStore = freshRequire(JOURNEY_STORE_PATH);
    const routes = freshRequire(ROUTES_PATH);

    const journey = journeyStore.createJourney('rsc-repro-feature-2');
    journeyStore.setStoryList(journey.journeyId, ['ep1-s1', 'ep1-s2']);

    routes.setSkillTurnExecutorStreamAdapter(function(systemPrompt, history, currentInput, token, onChunk, onThinkingChunk, onFirstChunk) {
      const resp = reviewResponseForStories(['ep1-s1', 'ep1-s2']);
      onFirstChunk(0);
      onChunk(resp);
      return Promise.resolve({ text: resp, usage: {} });
    });

    const sid = 'test-rsc-s1-b-' + Math.random().toString(36).slice(2);
    routes._setHtmlSession(sid, {
      skillName: 'review', sessionPath: '/tmp/t', systemPrompt: '# review', turns: [],
      artefactContent: null, artefactPath: null, done: false,
      featureSlug: 'rsc-repro-feature-2', journeyId: journey.journeyId
    });

    const spy = spyConsoleWarn();
    await routes.handlePostTurnStreamHtml(
      { session: { accessToken: 'operator-token', tenantId: 'org-a' }, params: { name: 'review', id: sid }, body: { answer: 'go' } },
      noopRes()
    );
    spy.restore();

    const events = parseWarnEvents(spy.calls, 'review_split_incomplete');
    eq(events.length, 0, 'AC5: no review_split_incomplete warning when coverage is complete');
  }

  // ── AC6: no known story list -- check skipped cleanly ──
  console.log('\n  AC6 -- real review-turn completion with no known story list skips the check cleanly');
  {
    const journeyStore = freshRequire(JOURNEY_STORE_PATH);
    const routes = freshRequire(ROUTES_PATH);

    const journey = journeyStore.createJourney('rsc-repro-feature-3');
    // Deliberately never call setStoryList -- journey.storyList stays undefined.

    routes.setSkillTurnExecutorStreamAdapter(function(systemPrompt, history, currentInput, token, onChunk, onThinkingChunk, onFirstChunk) {
      const resp = reviewResponseForStories(['ep1-s1']);
      onFirstChunk(0);
      onChunk(resp);
      return Promise.resolve({ text: resp, usage: {} });
    });

    const sid = 'test-rsc-s1-c-' + Math.random().toString(36).slice(2);
    routes._setHtmlSession(sid, {
      skillName: 'review', sessionPath: '/tmp/t', systemPrompt: '# review', turns: [],
      artefactContent: null, artefactPath: null, done: false,
      featureSlug: 'rsc-repro-feature-3', journeyId: journey.journeyId
    });

    const spy = spyConsoleWarn();
    let threw = null;
    try {
      await routes.handlePostTurnStreamHtml(
        { session: { accessToken: 'operator-token', tenantId: 'org-a' }, params: { name: 'review', id: sid }, body: { answer: 'go' } },
        noopRes()
      );
    } catch (e) { threw = e; }
    spy.restore();

    ok(!threw, 'AC6: no error thrown when journey.storyList is absent');
    const events = parseWarnEvents(spy.calls, 'review_split_incomplete');
    eq(events.length, 0, 'AC6: no review_split_incomplete warning when there is no known story list to compare against');

    // Flat review.md must still have been written -- existing behaviour unaffected.
    const session = routes._getHtmlSession(sid);
    ok(session && session.done === true, 'AC6: turn still completes successfully (existing behaviour unaffected)');
  }

  console.log('\n[rsc-s1] Results: ' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(function(err) {
  console.error('[rsc-s1] Unexpected error:', err && err.stack || err);
  process.exit(1);
});
