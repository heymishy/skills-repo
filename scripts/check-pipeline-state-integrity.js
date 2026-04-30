#!/usr/bin/env node
/**
 * check-pipeline-state-integrity.js
 *
 * Governance check: validates that pipeline-state.json story entries are
 * internally consistent. Catches problems that would produce misleading audit
 * records (e.g. "— passing" instead of "✅") before they reach a CI run.
 *
 * Checks
 * ──────
 * C1  testPlan.passing lag — story has prStatus draft/open AND testPlan.totalTests > 0
 *     but testPlan.passing === 0. This causes the audit comment to show "0/N passing"
 *     and "—" on every AC row even when all tests pass locally.
 *     Fix: update testPlan.passing to the confirmed count on master before opening/
 *     rebasing the PR.
 *
 * C2  testPlan over-count — testPlan.passing > testPlan.totalTests.
 *
 * C3  Merged story with passing < totalTests — story is merged but passing count
 *     was never updated to reflect actual test results.
 *
 * Severity: C1 is WARN (non-fatal — tests may still be in progress).
 *            C2, C3 are FAIL (data corruption — always wrong).
 *
 * Run:  node scripts/check-pipeline-state-integrity.js
 * Used: npm test
 *
 * Zero external dependencies — plain Node.js fs only.
 */
'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT       = path.join(__dirname, '..');
const STATE_PATH = path.join(ROOT, '.github', 'pipeline-state.json');

// ── Self-tests ────────────────────────────────────────────────────────────────

let selfPassed = 0;
let selfFailed = 0;

function selfAssert(condition, label) {
  if (condition) { process.stdout.write(`  \u2713 ${label}\n`); selfPassed++; }
  else           { process.stdout.write(`  \u2717 ${label}\n`); selfFailed++; }
}

// helpers under test
function collectStories(state) {
  const stories = [];
  if (!state || !Array.isArray(state.features)) return stories;
  for (const feature of state.features) {
    // flat stories array (Phase 3+)
    if (Array.isArray(feature.stories)) {
      for (const s of feature.stories) {
        if (s && typeof s === 'object') stories.push({ featureSlug: feature.slug, story: s });
      }
    }
    // epic-nested stories (Phase 1/2)
    if (Array.isArray(feature.epics)) {
      for (const epic of feature.epics) {
        if (Array.isArray(epic.stories)) {
          for (const s of epic.stories) {
            if (s && typeof s === 'object') stories.push({ featureSlug: feature.slug, story: s });
          }
        }
      }
    }
  }
  return stories;
}

function checkStory(featureSlug, story) {
  const findings = [];
  const id        = story.id || story.slug || '(unknown)';
  const tp        = story.testPlan;
  const prStatus  = story.prStatus || 'none';

  if (!tp || tp.totalTests == null || tp.totalTests === 0) return findings;

  const total   = Number(tp.totalTests);
  const passing = Number(tp.passing);

  // C1: open/draft PR but passing is 0
  if ((prStatus === 'draft' || prStatus === 'open') && passing === 0) {
    findings.push({
      level: 'warn',
      code:  'C1',
      message: `${featureSlug} / ${id}: prStatus="${prStatus}" but testPlan.passing=0 (totalTests=${total}). ` +
               `Update testPlan.passing to the confirmed count before the PR is reviewed.`,
    });
  }

  // C2: passing > totalTests
  if (passing > total) {
    findings.push({
      level: 'fail',
      code:  'C2',
      message: `${featureSlug} / ${id}: testPlan.passing (${passing}) > testPlan.totalTests (${total}). Data corruption — fix pipeline-state.json.`,
    });
  }

  // C3: merged story with passing < totalTests (and total > 0)
  if (prStatus === 'merged' && passing < total) {
    findings.push({
      level: 'fail',
      code:  'C3',
      message: `${featureSlug} / ${id}: prStatus="merged" but testPlan.passing (${passing}) < testPlan.totalTests (${total}). ` +
               `Update testPlan.passing to the confirmed count in the post-merge pipeline-state commit.`,
    });
  }

  return findings;
}

// ── Self-tests (pure logic — no filesystem) ───────────────────────────────────

process.stdout.write(`[pipeline-state-integrity] Self-tests\n`);

// collectStories: empty state
selfAssert(collectStories({}).length === 0, 'collectStories: empty features → 0 stories');

// collectStories: flat stories
selfAssert(
  collectStories({ features: [{ slug: 'f1', stories: [{ id: 'S1' }] }] }).length === 1,
  'collectStories: flat story collected'
);

// collectStories: epic-nested
selfAssert(
  collectStories({ features: [{ slug: 'f1', epics: [{ stories: [{ id: 'E1' }] }] }] }).length === 1,
  'collectStories: epic-nested story collected'
);

// collectStories: mixed flat + nested
{
  const state = { features: [{ slug: 'f1', stories: [{ id: 'S1' }], epics: [{ stories: [{ id: 'E1' }] }] }] };
  selfAssert(collectStories(state).length === 2, 'collectStories: flat + nested both collected');
}

// checkStory: no testPlan → no findings
selfAssert(checkStory('f', { id: 's1', prStatus: 'open' }).length === 0, 'checkStory: no testPlan → no findings');

// checkStory: totalTests 0 → no findings
selfAssert(checkStory('f', { id: 's1', prStatus: 'open', testPlan: { totalTests: 0, passing: 0 } }).length === 0,
  'checkStory: totalTests=0 → no findings');

// C1: draft PR with passing=0
{
  const f = checkStory('f', { id: 's1', prStatus: 'draft', testPlan: { totalTests: 5, passing: 0 } });
  selfAssert(f.length === 1 && f[0].code === 'C1', 'C1: draft PR + passing=0 → warn');
}

// C1: open PR with passing=0
{
  const f = checkStory('f', { id: 's1', prStatus: 'open', testPlan: { totalTests: 5, passing: 0 } });
  selfAssert(f.length === 1 && f[0].code === 'C1', 'C1: open PR + passing=0 → warn');
}

// C1: none prStatus with passing=0 → no C1
{
  const f = checkStory('f', { id: 's1', prStatus: 'none', testPlan: { totalTests: 5, passing: 0 } });
  selfAssert(f.every(x => x.code !== 'C1'), 'C1: none prStatus + passing=0 → no C1');
}

// C1: draft PR but passing=5 → no C1
{
  const f = checkStory('f', { id: 's1', prStatus: 'draft', testPlan: { totalTests: 5, passing: 5 } });
  selfAssert(f.every(x => x.code !== 'C1'), 'C1: draft PR + all passing → no C1');
}

// C2: passing > totalTests
{
  const f = checkStory('f', { id: 's1', prStatus: 'merged', testPlan: { totalTests: 5, passing: 7 } });
  selfAssert(f.some(x => x.code === 'C2'), 'C2: passing > totalTests → fail');
}

// C2: passing === totalTests → no C2
{
  const f = checkStory('f', { id: 's1', prStatus: 'merged', testPlan: { totalTests: 5, passing: 5 } });
  selfAssert(f.every(x => x.code !== 'C2'), 'C2: passing === totalTests → no C2');
}

// C3: merged with passing < totalTests
{
  const f = checkStory('f', { id: 's1', prStatus: 'merged', testPlan: { totalTests: 9, passing: 0 } });
  selfAssert(f.some(x => x.code === 'C3'), 'C3: merged + passing=0 → fail');
}

// C3: merged with all passing → no C3
{
  const f = checkStory('f', { id: 's1', prStatus: 'merged', testPlan: { totalTests: 9, passing: 9 } });
  selfAssert(f.every(x => x.code !== 'C3'), 'C3: merged + all passing → no C3');
}

// C1 level is warn, C2 is fail
{
  const c1 = checkStory('f', { id: 's1', prStatus: 'draft', testPlan: { totalTests: 5, passing: 0 } });
  const c2 = checkStory('f', { id: 's1', prStatus: 'merged', testPlan: { totalTests: 5, passing: 9 } });
  selfAssert(c1[0].level === 'warn', 'C1 level is warn');
  selfAssert(c2.some(x => x.level === 'fail'), 'C2 level is fail');
}

if (selfFailed > 0) {
  process.stdout.write(`  ${selfFailed} self-test(s) FAILED — aborting integration check\n`);
  process.exit(1);
}
process.stdout.write(`  ${selfPassed} self-tests passed\n\n`);

// ── Integration check — real pipeline-state.json ──────────────────────────────

if (!fs.existsSync(STATE_PATH)) {
  process.stdout.write(`[pipeline-state-integrity] pipeline-state.json not found — skipping\n`);
  process.exit(0);
}

let state;
try {
  state = JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
} catch (e) {
  process.stderr.write(`[pipeline-state-integrity] ERROR: failed to parse pipeline-state.json: ${e.message}\n`);
  process.exit(1);
}

const allStories = collectStories(state);
const allFindings = [];

for (const { featureSlug, story } of allStories) {
  const findings = checkStory(featureSlug, story);
  allFindings.push(...findings);
}

const warns = allFindings.filter(f => f.level === 'warn');
const fails  = allFindings.filter(f => f.level === 'fail');

if (warns.length > 0) {
  process.stdout.write(`[pipeline-state-integrity] ${warns.length} warning(s):\n`);
  warns.forEach(w => process.stdout.write(`  WARN [${w.code}]: ${w.message}\n`));
}

if (fails.length > 0) {
  process.stderr.write(`[pipeline-state-integrity] ${fails.length} failure(s):\n`);
  fails.forEach(f => process.stderr.write(`  FAIL [${f.code}]: ${f.message}\n`));
  process.exit(1);
}

const totalStories = allStories.length;
process.stdout.write(`[pipeline-state-integrity] ${totalStories} stories checked — ${warns.length} warn, 0 fail ✓\n`);
process.exit(0);
