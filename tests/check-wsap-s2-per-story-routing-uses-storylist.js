#!/usr/bin/env node
/**
 * check-wsap-s2-per-story-routing-uses-storylist.js
 *
 * Regression test for wsap-s2 -- linkSessionToJourney must read
 * journey.storyList (the field setStoryList/advanceToNextStory actually
 * populate), not journey.stories (never populated anywhere in this
 * codebase). wsap-s1's own fix checked the wrong field, so
 * session.currentStoryId was never set for any real per-story feature --
 * every story's review/test-plan/definition-of-ready artefact silently
 * collapsed onto the same flat file, each story overwriting the last, and
 * the operator saw what looked like an infinite review->test-plan->DoR
 * loop with no visible progress (found via live session investigation on
 * new-feature-2b74a292, a real 13-story feature in production).
 *
 * This test drives the full multi-story cycle through the REAL production
 * entry points (setStoryList, advanceToNextStory, linkSessionToJourney) --
 * not a hand-built mock shape -- and asserts each story gets its own,
 * distinct currentStoryId and artefact path.
 *
 * Run: node tests/check-wsap-s2-per-story-routing-uses-storylist.js
 */
'use strict';

process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'test-session-secret-minimum32chars!!';

const fs   = require('fs');
const os   = require('os');
const path = require('path');
const ROUTES_PATH        = path.resolve(__dirname, '../src/web-ui/routes/skills.js');
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

function freshRequire(modulePath) {
  const resolved = require.resolve(modulePath);
  delete require.cache[resolved];
  return require(resolved);
}

async function run() {
  console.log('\n[wsap-s2] per-story routing uses journey.storyList, not journey.stories\n');

  // journey-store must be freshRequire'd BEFORE routes.js, so routes.js's
  // internal require('../modules/journey-store') resolves to this same
  // fresh instance instead of a stale, disconnected one.
  const journeyStore = freshRequire(JOURNEY_STORE_PATH);
  const routes = freshRequire(ROUTES_PATH);

  const featureSlug = 'wsap-s2-repro-feature';
  const journey = journeyStore.createJourney(featureSlug);

  // Real production entry point (mirrors what handlePostGateConfirm's
  // 'nextStage === review' branch does after extractStoryIdsFromDefinitionArtefact).
  const storyIds = ['ep1-s1', 'ep1-s2', 'ep1-s3'];
  journeyStore.setStoryList(journey.journeyId, storyIds);

  ok(journey.stories === undefined || journey.stories.length === 0, 'setup: journey.stories is never populated by setStoryList -- confirms wsap-s1\'s original check was always dead code');
  eq(journeyStore.getJourney(journey.journeyId).currentStoryIndex, 0, 'setup: currentStoryIndex starts at 0');

  const seenStoryIds = [];

  // Story 0: link a review session, confirm currentStoryId + artefact path.
  {
    const sid = 'test-wsap-s2-story0-' + Math.random().toString(36).slice(2);
    routes.registerHtmlSession(sid, '/tmp/t', 'review', { featureSlug: featureSlug });
    routes.linkSessionToJourney(sid, journey.journeyId);
    const session = routes._getHtmlSession(sid);
    eq(session.currentStoryId, 'ep1-s1', 'story 0: currentStoryId is the first story in storyList');
    seenStoryIds.push(session.currentStoryId);
  }

  // Advance to story 1 (mirrors handlePostGateConfirm's definition-of-ready
  // branch calling advanceToNextStory then starting a new review session).
  const next1 = journeyStore.advanceToNextStory(journey.journeyId);
  eq(next1, 'ep1-s2', 'advanceToNextStory returns the real next story id, not undefined');
  {
    const sid = 'test-wsap-s2-story1-' + Math.random().toString(36).slice(2);
    routes.registerHtmlSession(sid, '/tmp/t', 'review', { featureSlug: featureSlug });
    routes.linkSessionToJourney(sid, journey.journeyId);
    const session = routes._getHtmlSession(sid);
    eq(session.currentStoryId, 'ep1-s2', 'story 1: currentStoryId advances to the second story, distinct from story 0');
    seenStoryIds.push(session.currentStoryId);
  }

  // Advance to story 2 (last story).
  const next2 = journeyStore.advanceToNextStory(journey.journeyId);
  eq(next2, 'ep1-s3', 'advanceToNextStory returns the third story id');
  {
    const sid = 'test-wsap-s2-story2-' + Math.random().toString(36).slice(2);
    routes.registerHtmlSession(sid, '/tmp/t', 'test-plan', { featureSlug: featureSlug });
    routes.linkSessionToJourney(sid, journey.journeyId);
    const session = routes._getHtmlSession(sid);
    eq(session.currentStoryId, 'ep1-s3', 'story 2: currentStoryId advances to the third, distinct, story');
    seenStoryIds.push(session.currentStoryId);
  }

  // Advance past the last story -- must return null (journey complete), not cycle back.
  const next3 = journeyStore.advanceToNextStory(journey.journeyId);
  eq(next3, null, 'advanceToNextStory returns null once every story is exhausted -- the journey terminates, does not loop indefinitely');

  ok(new Set(seenStoryIds).size === 3, 'all 3 stories produced distinct currentStoryId values (the actual bug: these were all undefined, so every story\'s artefact collapsed onto the same flat file)');
  eq(seenStoryIds.join(','), storyIds.join(','), 'currentStoryId values match the storyList in order -- no skipping, no repeats');

  // check-wsap-s1-story-scoped-artefact-paths.js's own AC2/AC3/AC7 already
  // verify computeArtefactSavePath() turns a real currentStoryId into a
  // distinct per-story path end-to-end via htmlSubmitTurn/
  // handlePostTurnStreamHtml -- not duplicated here.

  console.log(`\n[wsap-s2] ${passed} passed, ${failed} failed\n`);
  process.exit(failed === 0 ? 0 : 1);
}

run();
