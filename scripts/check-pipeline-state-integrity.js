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
 * C4  Task object missing required `tddState` field — any entry in story.tasks[]
 *     that lacks a tddState property will fail CI schema validation. Fastest fix:
 *     remove the tasks array entirely (it is optional and adds no governance value
 *     once a story reaches branch-complete).
 *
 * C5  Open/draft PR with passing tests but acVerified=0 — likely caused by a
 *     master checkpoint updating pipeline-state.json while the feature branch still
 *     carries the old pre-implementation values. The governance bot will show
 *     "AC: — / —" for every AC row. Fix: update the story entry on the feature
 *     branch to match master and push before the next CI run.
 *
 * C6  Invalid testPlan.status enum value — testPlan.status must be one of
 *     not-started | written | all-passing. Values like 'verified', 'passed', or
 *     'done' are natural English synonyms that the agent writes but the schema
 *     rejects. Caught in CI only (D29). Fix: change to 'all-passing'.
 *
 * C7  Feature stage not in schema enum — feature.stage must be one of the
 *     pipeline stage identifiers defined in pipeline-state.schema.json (e.g.
 *     'subagent-execution', not 'implementation'). Invalid values fail CI schema
 *     validation (D10). Fix: replace with the nearest valid stage identifier.
 *
 * C8  Epic-nested story missing required slug — stories inside
 *     feature.epics[].stories[] must have a 'slug' field (schema required[]). The
 *     absence causes schema_valid: FAILED in CI (D22). Fix: add slug matching the
 *     story id, or use a flat feature.stories[] array instead.
 *
 * Severity: C1 is FAIL — prStatus=draft/open with testPlan.passing=0 means the
 *            audit comment will show 0/N passing for every story. Fix by updating
 *            testPlan.passing to the confirmed count in the branch-complete
 *            pipeline-state commit before the PR CI run completes.
 *            C2, C3, C4, C6, C7, C8 are FAIL (data corruption — always wrong).
 *            C5 is WARN — heuristic signal; update acVerified on the feature branch.
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
        if (s && typeof s === 'object') stories.push({ featureSlug: feature.slug, story: s, isEpicNested: false });
      }
    }
    // epic-nested stories (Phase 1/2)
    if (Array.isArray(feature.epics)) {
      for (const epic of feature.epics) {
        if (Array.isArray(epic.stories)) {
          for (const s of epic.stories) {
            if (s && typeof s === 'object') stories.push({ featureSlug: feature.slug, story: s, isEpicNested: true });
          }
        }
      }
    }
  }
  return stories;
}

const VALID_TP_STATUS      = ['not-started', 'written', 'all-passing'];
const VALID_FEATURE_STAGES = [
  'loop-design', 'token-optimization', 'org-mapping', 'scale-pipeline',
  'ideation', 'discovery', 'benefit-metric', 'definition', 'review',
  'test-plan', 'definition-of-ready',
  'branch-setup', 'implementation-plan', 'subagent-execution',
  'implementation-review', 'verify-completion', 'branch-complete',
  'definition-of-done', 'trace', 'release-pending', 'released',
  'spike', 'stalled',
];

function checkFeature(feature) {
  const findings = [];
  const slug = feature.slug || '(unknown)';
  // C7: feature stage not in schema enum
  if (feature.stage != null && !VALID_FEATURE_STAGES.includes(feature.stage)) {
    findings.push({
      level: 'fail',
      code:  'C7',
      message: `Feature ${slug}: stage="${feature.stage}" is not in the schema enum. ` +
               `Valid values: ${VALID_FEATURE_STAGES.join(' | ')}`,
    });
  }
  // C9: ops/ slug must match ops/YYYY-MM-DD-[descriptor] with no traversal sequences (shr.2)
  if (feature.slug && feature.slug.startsWith('ops/')) {
    const opsRemainder = feature.slug.slice(4); // content after 'ops/'
    if (opsRemainder.indexOf('..') !== -1 || !/^\d{4}-\d{2}-\d{2}-./.test(opsRemainder)) {
      findings.push({
        level: 'fail',
        code:  'C9',
        message: `Feature ${slug}: ops/ slug "${feature.slug}" is invalid. ` +
                 `ops/ slugs must match ops/YYYY-MM-DD-[descriptor] with no traversal sequences (..).`,
      });
    }
  }
  return findings;
}

function checkStory(featureSlug, story, isEpicNested) {
  const findings = [];
  const id        = story.id || story.slug || '(unknown)';
  const tp        = story.testPlan;
  const prStatus  = story.prStatus || 'none';

  // C8: epic-nested story missing required slug
  if (isEpicNested && !story.slug) {
    findings.push({
      level: 'fail',
      code:  'C8',
      message: `${featureSlug} / ${id}: epic-nested story is missing required "slug" field. ` +
               `Add slug (same value as id), or use a flat feature.stories[] array instead.`,
    });
  }

  // C6: invalid testPlan.status enum value — independent of totalTests
  if (tp && tp.status != null && !VALID_TP_STATUS.includes(tp.status)) {
    findings.push({
      level: 'fail',
      code:  'C6',
      message: `${featureSlug} / ${id}: testPlan.status="${tp.status}" is not valid. ` +
               `Must be one of: ${VALID_TP_STATUS.join(' | ')}`,
    });
  }

  // C4: task objects missing required tddState — independent of testPlan
  if (Array.isArray(story.tasks)) {
    story.tasks.forEach(function(task, idx) {
      if (task && typeof task === 'object' && !('tddState' in task)) {
        findings.push({
          level: 'fail',
          code:  'C4',
          message: `${featureSlug} / ${id}: tasks[${idx}] is missing required field "tddState". ` +
                   `Remove the tasks array or add tddState to every task object.`,
        });
      }
    });
  }

  if (!tp || tp.totalTests == null || tp.totalTests === 0) return findings;

  const total   = Number(tp.totalTests);
  const passing = Number(tp.passing);

  // C1: open/draft PR but passing is 0 — FAIL (produces misleading audit comments)
  if ((prStatus === 'draft' || prStatus === 'open') && passing === 0) {
    findings.push({
      level: 'fail',
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

  // C5: open/draft PR with passing tests but acVerified=0 — likely stale branch values
  if ((prStatus === 'draft' || prStatus === 'open') &&
      story.acVerified != null && story.acVerified === 0 &&
      passing > 0) {
    findings.push({
      level: 'warn',
      code:  'C5',
      message: `${featureSlug} / ${id}: prStatus="${prStatus}", testPlan.passing=${passing} but acVerified=0. ` +
               `Branch pipeline-state.json may have stale values — update acVerified to the confirmed count.`,
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
  selfAssert(f.length === 1 && f[0].code === 'C1', 'C1: draft PR + passing=0 → fail');
}

// C1: open PR with passing=0
{
  const f = checkStory('f', { id: 's1', prStatus: 'open', testPlan: { totalTests: 5, passing: 0 } });
  selfAssert(f.length === 1 && f[0].code === 'C1', 'C1: open PR + passing=0 → fail');
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

// C1 level is fail, C2 is fail
{
  const c1 = checkStory('f', { id: 's1', prStatus: 'draft', testPlan: { totalTests: 5, passing: 0 } });
  const c2 = checkStory('f', { id: 's1', prStatus: 'merged', testPlan: { totalTests: 5, passing: 9 } });
  selfAssert(c1[0].level === 'fail', 'C1 level is fail');
  selfAssert(c2.some(x => x.level === 'fail'), 'C2 level is fail');
}

// C4: task missing tddState → fail
{
  const f = checkStory('f', { id: 's1', tasks: [{ name: 'T1' }] });
  selfAssert(f.length === 1 && f[0].code === 'C4', 'C4: task missing tddState → fail');
}

// C4: task with tddState → no C4
{
  const f = checkStory('f', { id: 's1', tasks: [{ name: 'T1', tddState: 'green' }] });
  selfAssert(f.every(x => x.code !== 'C4'), 'C4: task with tddState → no C4');
}

// C4: no tasks array → no C4
{
  const f = checkStory('f', { id: 's1' });
  selfAssert(f.every(x => x.code !== 'C4'), 'C4: no tasks array → no C4');
}

// C4: empty tasks array → no C4
{
  const f = checkStory('f', { id: 's1', tasks: [] });
  selfAssert(f.every(x => x.code !== 'C4'), 'C4: empty tasks array → no C4');
}

// C4: level is fail
{
  const f = checkStory('f', { id: 's1', tasks: [{ name: 'T1' }] });
  selfAssert(f[0].level === 'fail', 'C4 level is fail');
}

// C5: draft PR, passing>0, acVerified=0 → warn
{
  const f = checkStory('f', { id: 's1', prStatus: 'draft', acVerified: 0, testPlan: { totalTests: 10, passing: 10 } });
  selfAssert(f.some(x => x.code === 'C5'), 'C5: draft PR + passing>0 + acVerified=0 → warn');
}

// C5: open PR, passing>0, acVerified=0 → warn
{
  const f = checkStory('f', { id: 's1', prStatus: 'open', acVerified: 0, testPlan: { totalTests: 10, passing: 10 } });
  selfAssert(f.some(x => x.code === 'C5'), 'C5: open PR + passing>0 + acVerified=0 → warn');
}

// C5: acVerified set to real count → no C5
{
  const f = checkStory('f', { id: 's1', prStatus: 'draft', acVerified: 8, testPlan: { totalTests: 10, passing: 10 } });
  selfAssert(f.every(x => x.code !== 'C5'), 'C5: acVerified>0 → no C5');
}

// C5: merged PR → no C5
{
  const f = checkStory('f', { id: 's1', prStatus: 'merged', acVerified: 0, testPlan: { totalTests: 10, passing: 10 } });
  selfAssert(f.every(x => x.code !== 'C5'), 'C5: merged prStatus → no C5');
}

// C5: acVerified absent → no C5
{
  const f = checkStory('f', { id: 's1', prStatus: 'draft', testPlan: { totalTests: 10, passing: 10 } });
  selfAssert(f.every(x => x.code !== 'C5'), 'C5: acVerified absent → no C5');
}

// C5: passing=0 → no C5 (C1 fires instead)
{
  const f = checkStory('f', { id: 's1', prStatus: 'draft', acVerified: 0, testPlan: { totalTests: 10, passing: 0 } });
  selfAssert(f.every(x => x.code !== 'C5'), 'C5: passing=0 → no C5');
}

// C5 level is warn
{
  const f = checkStory('f', { id: 's1', prStatus: 'draft', acVerified: 0, testPlan: { totalTests: 10, passing: 10 } });
  selfAssert(f.some(x => x.code === 'C5' && x.level === 'warn'), 'C5 level is warn');
}

// C6: invalid testPlan.status → fail
{
  const f = checkStory('f', { id: 's1', testPlan: { status: 'verified', totalTests: 5, passing: 5 } });
  selfAssert(f.some(x => x.code === 'C6'), 'C6: testPlan.status=verified → fail');
}

// C6: other invalid synonyms
{
  const f1 = checkStory('f', { id: 's1', testPlan: { status: 'passed', totalTests: 5, passing: 5 } });
  const f2 = checkStory('f', { id: 's1', testPlan: { status: 'done', totalTests: 5, passing: 5 } });
  selfAssert(f1.some(x => x.code === 'C6'), 'C6: testPlan.status=passed → fail');
  selfAssert(f2.some(x => x.code === 'C6'), 'C6: testPlan.status=done → fail');
}

// C6: valid status values → no C6
{
  const f1 = checkStory('f', { id: 's1', testPlan: { status: 'not-started' } });
  const f2 = checkStory('f', { id: 's1', testPlan: { status: 'written' } });
  const f3 = checkStory('f', { id: 's1', testPlan: { status: 'all-passing', totalTests: 5, passing: 5 } });
  selfAssert(f1.every(x => x.code !== 'C6'), 'C6: status=not-started → no C6');
  selfAssert(f2.every(x => x.code !== 'C6'), 'C6: status=written → no C6');
  selfAssert(f3.every(x => x.code !== 'C6'), 'C6: status=all-passing → no C6');
}

// C6: testPlan absent → no C6
{
  const f = checkStory('f', { id: 's1' });
  selfAssert(f.every(x => x.code !== 'C6'), 'C6: no testPlan → no C6');
}

// C6: testPlan.status absent → no C6
{
  const f = checkStory('f', { id: 's1', testPlan: { totalTests: 5, passing: 5 } });
  selfAssert(f.every(x => x.code !== 'C6'), 'C6: testPlan.status absent → no C6');
}

// C6 level is fail
{
  const f = checkStory('f', { id: 's1', testPlan: { status: 'verified' } });
  selfAssert(f.some(x => x.code === 'C6' && x.level === 'fail'), 'C6 level is fail');
}

// C7: feature stage not in enum → fail
{
  const f = checkFeature({ slug: 'feat1', stage: 'implementation' });
  selfAssert(f.some(x => x.code === 'C7'), 'C7: stage=implementation → fail');
}

// C7: another invalid value
{
  const f = checkFeature({ slug: 'feat1', stage: 'in-progress' });
  selfAssert(f.some(x => x.code === 'C7'), 'C7: stage=in-progress → fail');
}

// C7: valid stage values → no C7
{
  const f1 = checkFeature({ slug: 'feat1', stage: 'subagent-execution' });
  const f2 = checkFeature({ slug: 'feat1', stage: 'branch-complete' });
  const f3 = checkFeature({ slug: 'feat1', stage: 'released' });
  selfAssert(f1.every(x => x.code !== 'C7'), 'C7: stage=subagent-execution → no C7');
  selfAssert(f2.every(x => x.code !== 'C7'), 'C7: stage=branch-complete → no C7');
  selfAssert(f3.every(x => x.code !== 'C7'), 'C7: stage=released → no C7');
}

// C7: stage absent → no C7
{
  const f = checkFeature({ slug: 'feat1' });
  selfAssert(f.every(x => x.code !== 'C7'), 'C7: stage absent → no C7');
}

// C7 level is fail
{
  const f = checkFeature({ slug: 'feat1', stage: 'implementation' });
  selfAssert(f.some(x => x.code === 'C7' && x.level === 'fail'), 'C7 level is fail');
}

// C8: epic-nested story missing slug → fail
{
  const f = checkStory('f', { id: 's1' }, true);
  selfAssert(f.some(x => x.code === 'C8'), 'C8: epic-nested + no slug → fail');
}

// C8: epic-nested story with slug → no C8
{
  const f = checkStory('f', { id: 's1', slug: 's1' }, true);
  selfAssert(f.every(x => x.code !== 'C8'), 'C8: epic-nested + slug present → no C8');
}

// C8: flat story missing slug → no C8 (not epic-nested)
{
  const f = checkStory('f', { id: 's1' }, false);
  selfAssert(f.every(x => x.code !== 'C8'), 'C8: flat story + no slug → no C8');
}

// C8: isEpicNested undefined (legacy call) → no C8
{
  const f = checkStory('f', { id: 's1' });
  selfAssert(f.every(x => x.code !== 'C8'), 'C8: isEpicNested undefined → no C8');
}

// C8 level is fail
{
  const f = checkStory('f', { id: 's1' }, true);
  selfAssert(f.some(x => x.code === 'C8' && x.level === 'fail'), 'C8 level is fail');
}

// shr.1: optional infra/migration track fields — present or absent, no C-check fires
{
  const s = { id: 's1', hasInfraTrack: true, infraPlanPath: 'artefacts/f/infra/s1.md' };
  selfAssert(checkStory('f', s).every(function(x) { return x.level !== 'fail'; }),
    'shr.1: hasInfraTrack present → no integrity violations');
}
{
  const s = { id: 's1' };
  selfAssert(checkStory('f', s).every(function(x) { return x.level !== 'fail'; }),
    'shr.1: track flags absent → no integrity violations');
}

// C9: ops/ slug validation (shr.2)
{
  const f = checkFeature({ slug: 'ops/2026-06-25-secrets-rotation' });
  selfAssert(f.every(x => x.code !== 'C9'), 'C9: valid ops slug → no C9');
}
{
  const f = checkFeature({ slug: 'ops/2026-12-31-firewall-rule-update' });
  selfAssert(f.every(x => x.code !== 'C9'), 'C9: second valid ops slug → no C9');
}
{
  const f = checkFeature({ slug: 'ops/../../etc/passwd' });
  selfAssert(f.some(x => x.code === 'C9'), 'C9: traversal ops slug → C9 fires');
}
{
  const f = checkFeature({ slug: '2026-06-22-standard-feature' });
  selfAssert(f.every(x => x.code !== 'C9'), 'C9: standard slug → no C9 (unaffected)');
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

const allFeatures = (state && Array.isArray(state.features)) ? state.features : [];
const allStories  = collectStories(state);
const allFindings = [];

for (const feature of allFeatures) {
  allFindings.push(...checkFeature(feature));
}

for (const { featureSlug, story, isEpicNested } of allStories) {
  const findings = checkStory(featureSlug, story, isEpicNested);
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
process.stdout.write(`[pipeline-state-integrity] ${totalStories} stories checked — 0 fail ✓\n`);
process.exit(0);
