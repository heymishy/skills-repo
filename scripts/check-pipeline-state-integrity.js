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
 * (C9-C14 predate this doc block's own last update — see their inline comments
 * at each check's definition for full rationale.)
 *
 * psir-s1: the checks below close the gap found when a real feature entry
 * (2026-09-29-test) was missing a required "name" field — this script
 * reported 0 fail against it while CI's real jsonschema-based
 * validate-trace.sh correctly failed the PR. Each new check mirrors a
 * specific `required`/`enum` constraint in pipeline-state.schema.json that
 * had no local equivalent before this story.
 *
 * C15 Feature missing required "name" field (schema features[].required).
 * C16 Feature missing required "health" field (schema features[].required).
 * C17 Feature or (epic-nested) story health not in schema enum
 *     (green | amber | red).
 * C18 Epic-nested story missing required "name" field.
 * C19 Epic-nested story missing required "stage" field.
 * C20 Epic-nested story missing required "health" field.
 * C21 Invalid dorStatus enum value (not-started | blocked | signed-off) —
 *     applies to flat and epic-nested story shapes alike.
 * C22 Invalid reviewStatus enum value (not-started | passed | has-findings)
 *     — epic-nested stories only; the field does not exist in the schema on
 *     flat feature.stories[] items.
 * C23 Invalid verifyStatus enum value (not-started | running | passed) —
 *     epic-nested stories only, same reasoning as C22.
 * C24 guardrails[] entry missing a required field (id | category | label |
 *     status).
 * C25 guardrails[] entry's category not in schema enum
 *     (mandatory-constraint | adr | nfr | compliance-framework | pattern |
 *     anti-pattern).
 * C26 guardrails[] entry's status not in schema enum (met | not-met | na |
 *     excepted | not-assessed | active) — the exact class of mistake
 *     CLAUDE.md's own Coding Standards section already warns about
 *     ("informal synonyms... cause hard CI failures on agent PRs").
 * C27 tasks[] entry's tddState present but not in schema enum
 *     (not-started | committed | green | refactor | done) — C4 only checked
 *     presence, never validity, before this story.
 * C28 spikes[] entry missing a required field (id | storySlug).
 * C29 spikes[] entry's verdict present, non-null, and not in schema enum
 *     (PROCEED | REDESIGN | DEFER | REJECT) — null is valid (unset verdict).
 *
 * Severity: C1 is FAIL — prStatus=draft/open with testPlan.passing=0 means the
 *            audit comment will show 0/N passing for every story. Fix by updating
 *            testPlan.passing to the confirmed count in the branch-complete
 *            pipeline-state commit before the PR CI run completes.
 *            C2, C3, C4, C6, C7, C8, C15-C29 are FAIL (data corruption — always wrong).
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

const VALID_DOD_STATUS = ['not-started', 'complete'];
const VALID_PR_STATUS  = ['none', 'draft', 'open', 'merged'];
const VALID_HEALTH        = ['green', 'amber', 'red'];
const VALID_DOR_STATUS    = ['not-started', 'blocked', 'signed-off'];
const VALID_REVIEW_STATUS = ['not-started', 'passed', 'has-findings'];
const VALID_VERIFY_STATUS = ['not-started', 'running', 'passed'];
const VALID_GUARDRAIL_CATEGORY = ['mandatory-constraint', 'adr', 'nfr', 'compliance-framework', 'pattern', 'anti-pattern'];
const VALID_GUARDRAIL_STATUS   = ['met', 'not-met', 'na', 'excepted', 'not-assessed', 'active'];
const VALID_TDD_STATE      = ['not-started', 'committed', 'green', 'refactor', 'done'];
const VALID_SPIKE_VERDICT  = ['PROCEED', 'REDESIGN', 'DEFER', 'REJECT'];

// C24/C25/C26: feature.guardrails[] structural validity (psir-s1) — schema
// requires id/category/label/status on every entry (pipeline-state.schema.json
// features[].guardrails[].required), and restricts category/status to fixed
// enums. CLAUDE.md's own Coding Standards section already documents that
// "these values are validated by validate-trace.sh --ci — invalid values
// cause hard CI failures on agent PRs", but no local check enforced it before
// this story.
function checkGuardrails(featureSlug, guardrails) {
  const findings = [];
  if (!Array.isArray(guardrails)) return findings;
  guardrails.forEach(function(g, idx) {
    if (!g || typeof g !== 'object') return;
    ['id', 'category', 'label', 'status'].forEach(function(field) {
      if (!(field in g)) {
        findings.push({
          level: 'fail',
          code:  'C24',
          message: `${featureSlug}: guardrails[${idx}] is missing required field "${field}".`,
        });
      }
    });
    if ('category' in g && !VALID_GUARDRAIL_CATEGORY.includes(g.category)) {
      findings.push({
        level: 'fail',
        code:  'C25',
        message: `${featureSlug}: guardrails[${idx}].category="${g.category}" is not in the schema enum. ` +
                 `Valid values: ${VALID_GUARDRAIL_CATEGORY.join(' | ')}`,
      });
    }
    if ('status' in g && !VALID_GUARDRAIL_STATUS.includes(g.status)) {
      findings.push({
        level: 'fail',
        code:  'C26',
        message: `${featureSlug}: guardrails[${idx}].status="${g.status}" is not in the schema enum. ` +
                 `Valid values: ${VALID_GUARDRAIL_STATUS.join(' | ')}`,
      });
    }
  });
  return findings;
}

// C28/C29: feature.spikes[] structural validity (psir-s1) — schema requires
// id/storySlug on every entry, and restricts verdict to a fixed enum or null.
function checkSpikes(featureSlug, spikes) {
  const findings = [];
  if (!Array.isArray(spikes)) return findings;
  spikes.forEach(function(s, idx) {
    if (!s || typeof s !== 'object') return;
    ['id', 'storySlug'].forEach(function(field) {
      if (!(field in s)) {
        findings.push({
          level: 'fail',
          code:  'C28',
          message: `${featureSlug}: spikes[${idx}] is missing required field "${field}".`,
        });
      }
    });
    if ('verdict' in s && s.verdict != null && !VALID_SPIKE_VERDICT.includes(s.verdict)) {
      findings.push({
        level: 'fail',
        code:  'C29',
        message: `${featureSlug}: spikes[${idx}].verdict="${s.verdict}" is not in the schema enum. ` +
                 `Valid values: ${VALID_SPIKE_VERDICT.join(' | ')} (or null).`,
      });
    }
  });
  return findings;
}

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
  // C15: feature missing required "name" field (psir-s1) — schema-required
  // (pipeline-state.schema.json features[].required includes "name"), but
  // easy to miss the same way "track" (C11) was before it — surfaced only as
  // a CI schema_valid failure (features > N: 'name' is a required property),
  // never locally, for the real 2026-09-29-test entry.
  if (!('name' in feature)) {
    findings.push({
      level: 'fail',
      code:  'C15',
      message: `Feature ${slug}: missing required field "name" (schema requires a string name).`,
    });
  }
  // C16: feature missing required "health" field (psir-s1) — schema-required.
  if (!('health' in feature)) {
    findings.push({
      level: 'fail',
      code:  'C16',
      message: `Feature ${slug}: missing required field "health" (schema requires one of ` +
               `${VALID_HEALTH.join(' | ')}).`,
    });
  }
  // C17: feature health not in schema enum (psir-s1) — mirrors C7's shape for
  // the sibling "stage" field.
  if (feature.health != null && !VALID_HEALTH.includes(feature.health)) {
    findings.push({
      level: 'fail',
      code:  'C17',
      message: `Feature ${slug}: health="${feature.health}" is not in the schema enum. ` +
               `Valid values: ${VALID_HEALTH.join(' | ')}`,
    });
  }
  findings.push(...checkGuardrails(slug, feature.guardrails));
  findings.push(...checkSpikes(slug, feature.spikes));
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
  // C11: feature missing required "track" field (pss-s1) — schema-required, but
  // easy to omit when hand-copying an existing entry's shape (D-series incidents
  // dtra-s1/dspw-s1/tdc-s1: surfaced only as a CI "Validate traceability chain"
  // failure, never locally).
  if (!('track' in feature)) {
    findings.push({
      level: 'fail',
      code:  'C11',
      message: `Feature ${slug}: missing required field "track" (schema requires one of ` +
               `short | standard | programme-workstream | library).`,
    });
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

  // C10: flat story missing required "id" field (pss-s1) — the schema requires
  // "id" on feature.stories[] items (unlike epic-nested items, which require
  // "slug" instead — see C8). Missing it surfaced only as a CI-only
  // "Validate traceability chain" failure in the tst-s1/jlc-s1 incidents.
  if (!isEpicNested && !story.id) {
    findings.push({
      level: 'fail',
      code:  'C10',
      message: `${featureSlug} / ${id}: flat story is missing required "id" field.`,
    });
  }

  // C18/C19/C20: epic-nested story missing required "name"/"stage"/"health"
  // (psir-s1) — schema requires all 4 of slug/name/stage/health on an
  // epic-nested story object (C8 already covers "slug").
  if (isEpicNested) {
    if (!('name' in story)) {
      findings.push({
        level: 'fail',
        code:  'C18',
        message: `${featureSlug} / ${id}: epic-nested story is missing required "name" field.`,
      });
    }
    if (!('stage' in story)) {
      findings.push({
        level: 'fail',
        code:  'C19',
        message: `${featureSlug} / ${id}: epic-nested story is missing required "stage" field.`,
      });
    }
    if (!('health' in story)) {
      findings.push({
        level: 'fail',
        code:  'C20',
        message: `${featureSlug} / ${id}: epic-nested story is missing required "health" field.`,
      });
    }
  }

  // C17: story health not in schema enum (psir-s1) — applies wherever a
  // health field is present (epic-nested stories declare it in the schema;
  // this check does not gate on isEpicNested since an extraneous health
  // field on a flat story is harmless to validate the same way).
  if (story.health != null && !VALID_HEALTH.includes(story.health)) {
    findings.push({
      level: 'fail',
      code:  'C17',
      message: `${featureSlug} / ${id}: health="${story.health}" is not in the schema enum. ` +
               `Valid values: ${VALID_HEALTH.join(' | ')}`,
    });
  }

  // C21: invalid dorStatus enum value (psir-s1) — schema enum
  // not-started | blocked | signed-off, applies to both flat and
  // epic-nested story shapes.
  if ('dorStatus' in story && story.dorStatus != null && !VALID_DOR_STATUS.includes(story.dorStatus)) {
    findings.push({
      level: 'fail',
      code:  'C21',
      message: `${featureSlug} / ${id}: dorStatus="${story.dorStatus}" is not valid. ` +
               `Must be one of: ${VALID_DOR_STATUS.join(' | ')}`,
    });
  }

  // C22/C23: invalid reviewStatus/verifyStatus enum value (psir-s1) — these
  // two fields only exist in the schema on epic-nested story objects.
  if (isEpicNested && 'reviewStatus' in story && story.reviewStatus != null && !VALID_REVIEW_STATUS.includes(story.reviewStatus)) {
    findings.push({
      level: 'fail',
      code:  'C22',
      message: `${featureSlug} / ${id}: reviewStatus="${story.reviewStatus}" is not valid. ` +
               `Must be one of: ${VALID_REVIEW_STATUS.join(' | ')}`,
    });
  }
  if (isEpicNested && 'verifyStatus' in story && story.verifyStatus != null && !VALID_VERIFY_STATUS.includes(story.verifyStatus)) {
    findings.push({
      level: 'fail',
      code:  'C23',
      message: `${featureSlug} / ${id}: verifyStatus="${story.verifyStatus}" is not valid. ` +
               `Must be one of: ${VALID_VERIFY_STATUS.join(' | ')}`,
    });
  }

  // C12: invalid dodStatus — null or any value outside the schema enum
  // (not-started | complete). A null value is a common mistake when the field
  // is omitted at story-creation time and later explicitly set to null.
  if ('dodStatus' in story && !VALID_DOD_STATUS.includes(story.dodStatus)) {
    findings.push({
      level: 'fail',
      code:  'C12',
      message: `${featureSlug} / ${id}: dodStatus=${JSON.stringify(story.dodStatus)} is not valid. ` +
               `Must be one of: ${VALID_DOD_STATUS.join(' | ')}`,
    });
  }

  // C13: invalid prStatus enum value — absent is fine (defaults elsewhere);
  // present-but-wrong (e.g. 'not-started' instead of 'none') is not.
  if ('prStatus' in story && story.prStatus != null && !VALID_PR_STATUS.includes(story.prStatus)) {
    findings.push({
      level: 'fail',
      code:  'C13',
      message: `${featureSlug} / ${id}: prStatus="${story.prStatus}" is not valid. ` +
               `Must be one of: ${VALID_PR_STATUS.join(' | ')}`,
    });
  }

  // C14: acVerified present but not an integer — e.g. written as the string
  // "true" by a dispatched agent with no runtime type check against the
  // schema (PR #483 incident).
  if ('acVerified' in story && story.acVerified != null && !Number.isInteger(story.acVerified)) {
    findings.push({
      level: 'fail',
      code:  'C14',
      message: `${featureSlug} / ${id}: acVerified=${JSON.stringify(story.acVerified)} is not an integer ` +
               `(found type "${typeof story.acVerified}").`,
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

  // C4: task objects missing a required field — independent of testPlan.
  // Extended by psir-s1 to also cover "id"/"name" (schema requires all 3 of
  // id/name/tddState on a task object; originally only tddState was checked).
  // C27: tddState present but not one of the schema's 5 enum values (psir-s1)
  // — the original C4 only checked presence, not validity.
  if (Array.isArray(story.tasks)) {
    story.tasks.forEach(function(task, idx) {
      if (!task || typeof task !== 'object') return;
      ['id', 'name', 'tddState'].forEach(function(field) {
        if (!(field in task)) {
          findings.push({
            level: 'fail',
            code:  'C4',
            message: `${featureSlug} / ${id}: tasks[${idx}] is missing required field "${field}". ` +
                     `Remove the tasks array or add ${field} to every task object.`,
          });
        }
      });
      if ('tddState' in task && !VALID_TDD_STATE.includes(task.tddState)) {
        findings.push({
          level: 'fail',
          code:  'C27',
          message: `${featureSlug} / ${id}: tasks[${idx}].tddState="${task.tddState}" is not in the schema enum. ` +
                   `Valid values: ${VALID_TDD_STATE.join(' | ')}`,
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

// C4: task missing tddState → fail (psir-s1: task fixture now includes "id"
// too, since C4 was extended to also require it — this test's own concern is
// specifically the missing-tddState case, isolated from the missing-id case)
{
  const f = checkStory('f', { id: 's1', tasks: [{ id: 't1', name: 'T1' }] });
  selfAssert(f.length === 1 && f[0].code === 'C4', 'C4: task missing tddState → fail');
}

// C4: task with tddState → no C4 (psir-s1: fixture now includes "id" too,
// otherwise C4 fires for the missing-id case this test isn't about)
{
  const f = checkStory('f', { id: 's1', tasks: [{ id: 't1', name: 'T1', tddState: 'green' }] });
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

// C10: flat story missing id → fail
{
  const f = checkStory('f', { slug: 's1', name: 'Story' });
  selfAssert(f.some(x => x.code === 'C10'), 'C10: flat story + no id → fail');
}

// C10: flat story with id → no C10
{
  const f = checkStory('f', { id: 's1', slug: 's1', name: 'Story' });
  selfAssert(f.every(x => x.code !== 'C10'), 'C10: flat story + id present → no C10');
}

// C10: epic-nested story missing id → no C10 (schema requires slug there, see C8)
{
  const f = checkStory('f', { slug: 's1', name: 'Story', stage: 'branch-complete', health: 'green' }, true);
  selfAssert(f.every(x => x.code !== 'C10'), 'C10: epic-nested + no id → no C10 (C8 covers this shape instead)');
}

// C10 level is fail
{
  const f = checkStory('f', { slug: 's1' });
  selfAssert(f.some(x => x.code === 'C10' && x.level === 'fail'), 'C10 level is fail');
}

// C11: feature missing track → fail
{
  const f = checkFeature({ slug: 'feat1', stage: 'branch-complete' });
  selfAssert(f.some(x => x.code === 'C11'), 'C11: feature missing track → fail');
}

// C11: feature with track → no C11
{
  const f = checkFeature({ slug: 'feat1', stage: 'branch-complete', track: 'short' });
  selfAssert(f.every(x => x.code !== 'C11'), 'C11: feature with track → no C11');
}

// C11 level is fail
{
  const f = checkFeature({ slug: 'feat1' });
  selfAssert(f.some(x => x.code === 'C11' && x.level === 'fail'), 'C11 level is fail');
}

// C12: dodStatus null → fail
{
  const f = checkStory('f', { id: 's1', dodStatus: null });
  selfAssert(f.some(x => x.code === 'C12'), 'C12: dodStatus=null → fail');
}

// C12: dodStatus invalid string → fail
{
  const f = checkStory('f', { id: 's1', dodStatus: 'done' });
  selfAssert(f.some(x => x.code === 'C12'), 'C12: dodStatus="done" → fail');
}

// C12: dodStatus valid values → no C12
{
  const f1 = checkStory('f', { id: 's1', dodStatus: 'not-started' });
  const f2 = checkStory('f', { id: 's1', dodStatus: 'complete' });
  selfAssert(f1.every(x => x.code !== 'C12'), 'C12: dodStatus="not-started" → no C12');
  selfAssert(f2.every(x => x.code !== 'C12'), 'C12: dodStatus="complete" → no C12');
}

// C12: dodStatus absent → no C12
{
  const f = checkStory('f', { id: 's1' });
  selfAssert(f.every(x => x.code !== 'C12'), 'C12: dodStatus absent → no C12');
}

// C12 level is fail
{
  const f = checkStory('f', { id: 's1', dodStatus: null });
  selfAssert(f.some(x => x.code === 'C12' && x.level === 'fail'), 'C12 level is fail');
}

// C13: prStatus invalid enum → fail
{
  const f = checkStory('f', { id: 's1', prStatus: 'not-started' });
  selfAssert(f.some(x => x.code === 'C13'), 'C13: prStatus="not-started" → fail');
}

// C13: prStatus valid values → no C13
{
  ['none', 'draft', 'open', 'merged'].forEach(function(v) {
    const f = checkStory('f', { id: 's1', prStatus: v });
    selfAssert(f.every(x => x.code !== 'C13'), `C13: prStatus="${v}" → no C13`);
  });
}

// C13: prStatus absent → no C13
{
  const f = checkStory('f', { id: 's1' });
  selfAssert(f.every(x => x.code !== 'C13'), 'C13: prStatus absent → no C13');
}

// C13 level is fail
{
  const f = checkStory('f', { id: 's1', prStatus: 'not-started' });
  selfAssert(f.some(x => x.code === 'C13' && x.level === 'fail'), 'C13 level is fail');
}

// C14: acVerified string → fail
{
  const f = checkStory('f', { id: 's1', acVerified: 'true' });
  selfAssert(f.some(x => x.code === 'C14'), 'C14: acVerified="true" (string) → fail');
}

// C14: acVerified integer → no C14
{
  const f = checkStory('f', { id: 's1', acVerified: 3 });
  selfAssert(f.every(x => x.code !== 'C14'), 'C14: acVerified=3 (integer) → no C14');
}

// C14: acVerified absent → no C14
{
  const f = checkStory('f', { id: 's1' });
  selfAssert(f.every(x => x.code !== 'C14'), 'C14: acVerified absent → no C14');
}

// C14 level is fail
{
  const f = checkStory('f', { id: 's1', acVerified: 'true' });
  selfAssert(f.some(x => x.code === 'C14' && x.level === 'fail'), 'C14 level is fail');
}

// AC6: fully-valid fixture → none of C10-C14 fire (extended by psir-s1 to
// also cover C15-C29, and to include a valid guardrails[]/tasks[]/spikes[]
// entry so the extension itself doesn't spuriously fire against a
// by-construction-valid fixture)
{
  const feature = {
    slug: 'feat1', name: 'Feature', stage: 'branch-complete', track: 'short', health: 'green',
    guardrails: [{ id: 'ADR-1', category: 'adr', label: 'x', status: 'met' }],
    spikes: [{ id: 'spike-a', storySlug: 's1', verdict: 'PROCEED' }],
  };
  const story = {
    id: 's1', slug: 's1', name: 'Story',
    dodStatus: 'not-started', prStatus: 'open', acVerified: 4,
    dorStatus: 'signed-off',
    tasks: [{ id: 't1', name: 'T1', tddState: 'done' }],
  };
  const ff = checkFeature(feature);
  const sf = checkStory(feature.slug, story, false);
  const newCodes = [
    'C10', 'C11', 'C12', 'C13', 'C14',
    'C15', 'C16', 'C17', 'C18', 'C19', 'C20', 'C21', 'C22', 'C23',
    'C24', 'C25', 'C26', 'C27', 'C28', 'C29',
  ];
  selfAssert(
    ff.every(x => !newCodes.includes(x.code)) && sf.every(x => !newCodes.includes(x.code)),
    'AC6: fully-valid fixture → none of C10-C29 fire'
  );
}
{
  // Epic-nested variant of the same fixture — exercises the name/stage/health
  // presence checks (C18-C20) and the reviewStatus/verifyStatus enums
  // (C22/C23), which only apply in the epic-nested shape.
  const story = {
    id: 's1', slug: 's1', name: 'Story', stage: 'test-plan', health: 'green',
    reviewStatus: 'passed', verifyStatus: 'passed', dorStatus: 'not-started',
  };
  const sf = checkStory('feat1', story, true);
  const newCodes = ['C17', 'C18', 'C19', 'C20', 'C21', 'C22', 'C23'];
  selfAssert(
    sf.every(x => !newCodes.includes(x.code)),
    'AC8: fully-valid epic-nested story fixture → none of C17-C23 fire'
  );
}

// ── psir-s1: new checks reconciling this script with pipeline-state.schema.json ──

// C15: feature missing name → fail
{
  const f = checkFeature({ slug: 'feat1', stage: 'branch-complete', track: 'short', health: 'green' });
  selfAssert(f.some(x => x.code === 'C15'), 'C15: feature missing name → fail');
}
// C15: feature with name → no C15
{
  const f = checkFeature({ slug: 'feat1', name: 'Feature', stage: 'branch-complete', track: 'short', health: 'green' });
  selfAssert(f.every(x => x.code !== 'C15'), 'C15: feature with name → no C15');
}

// C16: feature missing health → fail
{
  const f = checkFeature({ slug: 'feat1', name: 'Feature', stage: 'branch-complete', track: 'short' });
  selfAssert(f.some(x => x.code === 'C16'), 'C16: feature missing health → fail');
}
// C16: feature with health → no C16
{
  const f = checkFeature({ slug: 'feat1', name: 'Feature', stage: 'branch-complete', track: 'short', health: 'green' });
  selfAssert(f.every(x => x.code !== 'C16'), 'C16: feature with health → no C16');
}

// C17: feature health invalid enum value → fail
{
  const f = checkFeature({ slug: 'feat1', health: 'done' });
  selfAssert(f.some(x => x.code === 'C17'), 'C17: feature health=done → fail');
}
// C17: feature health valid values → no C17
{
  ['green', 'amber', 'red'].forEach(function(v) {
    const f = checkFeature({ slug: 'feat1', health: v });
    selfAssert(f.every(x => x.code !== 'C17'), `C17: feature health="${v}" → no C17`);
  });
}
// C17: feature health absent → no C17 (C16 covers absence)
{
  const f = checkFeature({ slug: 'feat1', name: 'Feature', stage: 'branch-complete', track: 'short' });
  selfAssert(f.every(x => x.code !== 'C17'), 'C17: feature health absent → no C17');
}
// C17: epic-nested story health invalid enum value → fail
{
  const f = checkStory('f', { id: 's1', slug: 's1', name: 'Story', stage: 'test-plan', health: 'unknown' }, true);
  selfAssert(f.some(x => x.code === 'C17'), 'C17: epic-nested story health=unknown → fail');
}
// C17: epic-nested story health valid value → no C17
{
  const f = checkStory('f', { id: 's1', slug: 's1', name: 'Story', stage: 'test-plan', health: 'amber' }, true);
  selfAssert(f.every(x => x.code !== 'C17'), 'C17: epic-nested story health="amber" → no C17');
}

// C18: epic-nested story missing name → fail
{
  const f = checkStory('f', { id: 's1', slug: 's1', stage: 'test-plan', health: 'green' }, true);
  selfAssert(f.some(x => x.code === 'C18'), 'C18: epic-nested story missing name → fail');
}
// C18: epic-nested story with name → no C18
{
  const f = checkStory('f', { id: 's1', slug: 's1', name: 'Story', stage: 'test-plan', health: 'green' }, true);
  selfAssert(f.every(x => x.code !== 'C18'), 'C18: epic-nested story with name → no C18');
}
// C18: flat story missing name → no C18 (schema does not require name on flat stories)
{
  const f = checkStory('f', { id: 's1' }, false);
  selfAssert(f.every(x => x.code !== 'C18'), 'C18: flat story missing name → no C18 (not epic-nested)');
}

// C19: epic-nested story missing stage → fail
{
  const f = checkStory('f', { id: 's1', slug: 's1', name: 'Story', health: 'green' }, true);
  selfAssert(f.some(x => x.code === 'C19'), 'C19: epic-nested story missing stage → fail');
}
// C19: epic-nested story with stage → no C19
{
  const f = checkStory('f', { id: 's1', slug: 's1', name: 'Story', stage: 'test-plan', health: 'green' }, true);
  selfAssert(f.every(x => x.code !== 'C19'), 'C19: epic-nested story with stage → no C19');
}

// C20: epic-nested story missing health → fail
{
  const f = checkStory('f', { id: 's1', slug: 's1', name: 'Story', stage: 'test-plan' }, true);
  selfAssert(f.some(x => x.code === 'C20'), 'C20: epic-nested story missing health → fail');
}
// C20: epic-nested story with health → no C20
{
  const f = checkStory('f', { id: 's1', slug: 's1', name: 'Story', stage: 'test-plan', health: 'green' }, true);
  selfAssert(f.every(x => x.code !== 'C20'), 'C20: epic-nested story with health → no C20');
}

// C21: invalid dorStatus enum value → fail
{
  const f = checkStory('f', { id: 's1', dorStatus: 'complete' });
  selfAssert(f.some(x => x.code === 'C21'), 'C21: dorStatus=complete → fail');
}
// C21: valid dorStatus values → no C21
{
  ['not-started', 'blocked', 'signed-off'].forEach(function(v) {
    const f = checkStory('f', { id: 's1', dorStatus: v });
    selfAssert(f.every(x => x.code !== 'C21'), `C21: dorStatus="${v}" → no C21`);
  });
}
// C21: dorStatus absent → no C21
{
  const f = checkStory('f', { id: 's1' });
  selfAssert(f.every(x => x.code !== 'C21'), 'C21: dorStatus absent → no C21');
}

// C22: invalid reviewStatus enum value (epic-nested) → fail
{
  const f = checkStory('f', { id: 's1', slug: 's1', reviewStatus: 'in-review' }, true);
  selfAssert(f.some(x => x.code === 'C22'), 'C22: reviewStatus=in-review → fail');
}
// C22: valid reviewStatus values → no C22
{
  ['not-started', 'passed', 'has-findings'].forEach(function(v) {
    const f = checkStory('f', { id: 's1', slug: 's1', reviewStatus: v }, true);
    selfAssert(f.every(x => x.code !== 'C22'), `C22: reviewStatus="${v}" → no C22`);
  });
}
// C22: reviewStatus absent → no C22
{
  const f = checkStory('f', { id: 's1' }, true);
  selfAssert(f.every(x => x.code !== 'C22'), 'C22: reviewStatus absent → no C22');
}

// C23: invalid verifyStatus enum value (epic-nested) → fail
{
  const f = checkStory('f', { id: 's1', slug: 's1', verifyStatus: 'done' }, true);
  selfAssert(f.some(x => x.code === 'C23'), 'C23: verifyStatus=done → fail');
}
// C23: valid verifyStatus values → no C23
{
  ['not-started', 'running', 'passed'].forEach(function(v) {
    const f = checkStory('f', { id: 's1', slug: 's1', verifyStatus: v }, true);
    selfAssert(f.every(x => x.code !== 'C23'), `C23: verifyStatus="${v}" → no C23`);
  });
}

// C24: guardrails[] entry missing a required field → fail (one sub-case per field)
{
  ['id', 'category', 'label', 'status'].forEach(function(missingField) {
    const g = { id: 'ADR-1', category: 'adr', label: 'x', status: 'met' };
    delete g[missingField];
    const f = checkGuardrails('feat1', [g]);
    selfAssert(f.some(x => x.code === 'C24'), `C24: guardrails[] missing "${missingField}" → fail`);
  });
}
// C24: fully-populated guardrails[] entry → no C24
{
  const f = checkGuardrails('feat1', [{ id: 'ADR-1', category: 'adr', label: 'x', status: 'met' }]);
  selfAssert(f.every(x => x.code !== 'C24'), 'C24: fully-populated guardrails[] entry → no C24');
}

// C25: guardrails[] invalid category enum value → fail
{
  const f = checkGuardrails('feat1', [{ id: 'X', category: 'random', label: 'x', status: 'met' }]);
  selfAssert(f.some(x => x.code === 'C25'), 'C25: guardrails[] category=random → fail');
}
// C25: valid category values → no C25
{
  ['mandatory-constraint', 'adr', 'nfr', 'compliance-framework', 'pattern', 'anti-pattern'].forEach(function(v) {
    const f = checkGuardrails('feat1', [{ id: 'X', category: v, label: 'x', status: 'met' }]);
    selfAssert(f.every(x => x.code !== 'C25'), `C25: guardrails[] category="${v}" → no C25`);
  });
}

// C26: guardrails[] invalid status enum value → fail (informal synonym, CLAUDE.md's own example)
{
  const f = checkGuardrails('feat1', [{ id: 'X', category: 'adr', label: 'x', status: 'pass' }]);
  selfAssert(f.some(x => x.code === 'C26'), 'C26: guardrails[] status=pass (informal synonym) → fail');
}
// C26: valid status values → no C26
{
  ['met', 'not-met', 'na', 'excepted', 'not-assessed', 'active'].forEach(function(v) {
    const f = checkGuardrails('feat1', [{ id: 'X', category: 'adr', label: 'x', status: v }]);
    selfAssert(f.every(x => x.code !== 'C26'), `C26: guardrails[] status="${v}" → no C26`);
  });
}
// C24/C25/C26: no guardrails[] array → no findings, no throw
{
  selfAssert(checkGuardrails('feat1', undefined).length === 0, 'C24-C26: guardrails absent → no findings');
}

// C4 extension: tasks[] entry missing id or name → fail
{
  const f = checkStory('f', { id: 's1', tasks: [{ tddState: 'green' }] });
  selfAssert(f.some(x => x.code === 'C4'), 'C4: tasks[] missing id and name → fail');
}
// C4: fully-populated task → no C4
{
  const f = checkStory('f', { id: 's1', tasks: [{ id: 't1', name: 'T1', tddState: 'green' }] });
  selfAssert(f.every(x => x.code !== 'C4'), 'C4: fully-populated task → no C4');
}

// C27: tasks[] tddState invalid enum value → fail
{
  const f = checkStory('f', { id: 's1', tasks: [{ id: 't1', name: 'T1', tddState: 'in-progress' }] });
  selfAssert(f.some(x => x.code === 'C27'), 'C27: tddState=in-progress → fail');
}
// C27: valid tddState values → no C27
{
  ['not-started', 'committed', 'green', 'refactor', 'done'].forEach(function(v) {
    const f = checkStory('f', { id: 's1', tasks: [{ id: 't1', name: 'T1', tddState: v }] });
    selfAssert(f.every(x => x.code !== 'C27'), `C27: tddState="${v}" → no C27`);
  });
}

// C28: spikes[] entry missing id or storySlug → fail
{
  const f1 = checkSpikes('feat1', [{ storySlug: 's1' }]);
  const f2 = checkSpikes('feat1', [{ id: 'spike-a' }]);
  selfAssert(f1.some(x => x.code === 'C28'), 'C28: spikes[] missing id → fail');
  selfAssert(f2.some(x => x.code === 'C28'), 'C28: spikes[] missing storySlug → fail');
}
// C28: fully-populated spikes[] entry → no C28
{
  const f = checkSpikes('feat1', [{ id: 'spike-a', storySlug: 's1' }]);
  selfAssert(f.every(x => x.code !== 'C28'), 'C28: fully-populated spikes[] entry → no C28');
}

// C29: spikes[] invalid verdict enum value → fail
{
  const f = checkSpikes('feat1', [{ id: 'spike-a', storySlug: 's1', verdict: 'MAYBE' }]);
  selfAssert(f.some(x => x.code === 'C29'), 'C29: spikes[] verdict=MAYBE → fail');
}
// C29: verdict null → no C29 (schema explicitly allows null)
{
  const f = checkSpikes('feat1', [{ id: 'spike-a', storySlug: 's1', verdict: null }]);
  selfAssert(f.every(x => x.code !== 'C29'), 'C29: spikes[] verdict=null → no C29');
}
// C29: valid non-null verdict values → no C29
{
  ['PROCEED', 'REDESIGN', 'DEFER', 'REJECT'].forEach(function(v) {
    const f = checkSpikes('feat1', [{ id: 'spike-a', storySlug: 's1', verdict: v }]);
    selfAssert(f.every(x => x.code !== 'C29'), `C29: spikes[] verdict="${v}" → no C29`);
  });
}
// C28/C29: no spikes[] array → no findings, no throw
{
  selfAssert(checkSpikes('feat1', undefined).length === 0, 'C28-C29: spikes absent → no findings');
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
