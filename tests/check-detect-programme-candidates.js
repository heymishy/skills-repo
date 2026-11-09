#!/usr/bin/env node
/**
 * check-detect-programme-candidates.js
 *
 * Tests for pep-s3 AC1-AC4 — bottom-up programme-candidate detection script
 * (scripts/detect-programme-candidates.js).
 *
 * Run: node tests/check-detect-programme-candidates.js
 */
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

let totalPassed = 0;
let totalFailed = 0;
const issues = [];

function ok() { totalPassed++; }
function fail(label, message) {
  totalFailed++;
  issues.push(`  ✗ [${label}] ${message}`);
}
function assert(label, condition, message) {
  if (condition) { ok(); } else { fail(label, message); }
}

const {
  countEpics,
  countDependencyMentions,
  computeSignals,
  isCandidate,
  generateReport,
  scanPipelineState,
  EPIC_COUNT_THRESHOLD,
} = require('../scripts/detect-programme-candidates');

// ── AC1: countEpics — flat-lightweight and legacy-nested shapes alike ───────

assert('T1-flat-lightweight-epics',
  countEpics({ epics: [{ slug: 'e1', stories: ['s1', 's2'] }, { slug: 'e2', stories: ['s3'] }] }) === 2,
  'lightweight flat-shape epics array (slug/stories-as-strings) should count by array length');

assert('T1-legacy-nested-epics',
  countEpics({ epics: [{ slug: 'e1', stories: [{ slug: 's1', name: 'x' }] }, { slug: 'e2', stories: [] }, { slug: 'e3', stories: [] }] }) === 3,
  'legacy nested-shape epics array (stories as full objects) should still count by array length');

assert('T1-no-epics-field',
  countEpics({ stories: [{ id: 's1' }] }) === 0,
  'a feature with flat stories[] and no epics field at all should count as 0 epics, not throw');

// ── AC1: countDependencyMentions — real team-identity-roles decisions.md ───

const tirDecisionsPath = path.join(root, 'artefacts/2026-07-09-team-identity-roles/decisions.md');
const tirDecisionsContent = fs.readFileSync(tirDecisionsPath, 'utf8');
const tirCount = countDependencyMentions(tirDecisionsContent);
// Real occurrence count, verified directly: 5 ("dependent" x1, "dependently" x3,
// "depending" x1). The story's own AC3 and this tranche's artefacts cite "4
// depend mentions" — that figure traces back to an earlier `grep -c` (line
// count) measurement, not an actual substring-occurrence count; two of the
// "dependently" occurrences share one line, which is why line-count read 4
// while the real occurrence count is 5. This does not change AC3's outcome
// (epicCount, not dependency count, is what keeps team-identity-roles
// unflagged — dependency count is explicitly the secondary signal), but the
// exact number asserted here is the real, verified one, not the stale one.
assert('T2-real-tir-decisions-count', tirCount === 5,
  `expected 5 "depend" mentions in team-identity-roles' real decisions.md (verified occurrence count, not the stale line-count-derived "4" cited in artefacts), got ${tirCount}`);

assert('T2-empty-content', countDependencyMentions('') === 0, 'empty content should count 0, not throw');
assert('T2-undefined-content', countDependencyMentions(undefined) === 0, 'undefined content should count 0, not throw');

// ── AC1: computeSignals — never a timeline/span field, even unused ─────────

const signals = computeSignals(
  { slug: 'x', name: 'X', epics: [{ slug: 'e1' }, { slug: 'e2' }] },
  'this feature depends on something'
);
const keys = Object.keys(signals).join(',').toLowerCase();
assert('T3-no-timeline-field-at-all',
  !/time|span|date|day|duration/.test(keys),
  `signals object keys must never include a timeline/span-derived field (even unused) — got keys: ${keys}`);
assert('T3-has-expected-fields',
  'slug' in signals && 'name' in signals && 'epicCount' in signals && 'dependencyMentionCount' in signals,
  'signals object must have slug, name, epicCount, dependencyMentionCount');
assert('T3-epic-count-correct', signals.epicCount === 2, 'epicCount should be 2');
assert('T3-dependency-count-correct', signals.dependencyMentionCount === 1, 'dependencyMentionCount should be 1');

// ── AC1: isCandidate boundary — >=4 inclusive, not >4 and not >5 ────────────

assert('T4-below-threshold', isCandidate({ epicCount: 3 }) === false, '3 epics should not flag');
assert('T4-at-threshold', isCandidate({ epicCount: EPIC_COUNT_THRESHOLD }) === true, '4 epics (the boundary) must flag');
assert('T4-above-threshold', isCandidate({ epicCount: 5 }) === true, '5 epics should flag');
assert('T4-threshold-is-4', EPIC_COUNT_THRESHOLD === 4, 'threshold constant must be exactly 4, per decisions.md');

// ── AC4: generateReport — disclaimer, candidate listing, zero-candidate case ─

const withCandidates = generateReport([
  { slug: 'feature-a', name: 'Feature A', epicCount: 5, dependencyMentionCount: 10 },
  { slug: 'feature-b', name: 'Feature B', epicCount: 1, dependencyMentionCount: 0 },
]);
assert('T5-disclaimer-present',
  /directional signal|human judgment/i.test(withCandidates),
  'report must include a plain-language disclaimer that this requires human judgment, not a verdict');
assert('T5-candidate-listed',
  withCandidates.includes('feature-a') && withCandidates.includes('epic count: 5'),
  'candidate feature slug and epic count must appear in the report');
assert('T5-non-candidate-not-listed',
  !withCandidates.includes('feature-b'),
  'non-candidate feature should not appear in the report at all');
assert('T5-no-web-ui-markup',
  !/<[a-z][a-z0-9]*[\s/>]/i.test(withCandidates),
  'report must be flat plain-text/markdown, not HTML/web-UI-specific markup');

const noneAtAll = generateReport([{ slug: 'feature-c', name: 'Feature C', epicCount: 1, dependencyMentionCount: 0 }]);
assert('T5-zero-candidates-explicit',
  /0 candidates found/i.test(noneAtAll),
  'report must explicitly state "0 candidates found" when nothing qualifies');

// ── AC2/AC3: scanPipelineState — real pipeline-state.json ───────────────────

const pipelineStatePath = path.join(root, '.github/pipeline-state.json');
const artefactsRoot = path.join(root, 'artefacts');
const results = scanPipelineState(pipelineStatePath, artefactsRoot);

const phase4 = results.find((r) => r.slug === '2026-04-19-skills-platform-phase4-opus');
assert('T6-phase4-found', !!phase4, 'phase4-opus feature must be present in scan results');
if (phase4) {
  // Real, verified count (4) — not the artefact-cited 5. See the plan's
  // "Pre-implementation finding" section for the full discrepancy note.
  assert('T6-phase4-epic-count-real', phase4.epicCount === 4,
    `expected the real, verified epic count (4), got ${phase4.epicCount}`);
  assert('T6-phase4-flagged', isCandidate(phase4) === true,
    'phase4-opus (4 epics) must be flagged as a candidate — true positive, AC2');
}

const tir = results.find((r) => r.slug === '2026-07-09-team-identity-roles');
assert('T6-tir-found', !!tir, 'team-identity-roles feature must be present in scan results');
if (tir) {
  assert('T6-tir-epic-count', tir.epicCount === 1, 'team-identity-roles should have epicCount 1');
  assert('T6-tir-dependency-count', tir.dependencyMentionCount === 5,
    `expected 5 depend mentions (real verified occurrence count), got ${tir.dependencyMentionCount}`);
  assert('T6-tir-not-flagged', isCandidate(tir) === false,
    'team-identity-roles (1 epic) must NOT be flagged — true negative, AC3');
}

// ── NFR: performance sanity bound ───────────────────────────────────────────

const nfrStart = Date.now();
scanPipelineState(pipelineStatePath, artefactsRoot);
const nfrElapsed = Date.now() - nfrStart;
assert('T7-nfr-perf-under-5s', nfrElapsed < 5000, `expected < 5000ms, measured ${nfrElapsed}ms`);

// ── Report ───────────────────────────────────────────────────────────────────

if (totalFailed > 0) {
  console.error(`[check-detect-programme-candidates] FAIL — ${issues.length} issue(s) found:`);
  issues.forEach((i) => console.error(i));
  process.exit(1);
} else {
  console.log(`[check-detect-programme-candidates] ${totalPassed} check(s) OK ✓`);
}
