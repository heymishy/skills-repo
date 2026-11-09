# Implementation Plan: Bottom-up programme-candidate detection script (epic-count primary signal)

**Story:** artefacts/2026-11-08-programme-entry-points/stories/pep-s3-bottom-up-detection-script.md
**Test plan:** artefacts/2026-11-08-programme-entry-points/test-plans/pep-s3-bottom-up-detection-script-test-plan.md
**DoR:** artefacts/2026-11-08-programme-entry-points/dor/pep-s3-bottom-up-detection-script-dor.md

---

## Pre-implementation finding (verified before planning)

The story's artefacts cite `skills-platform-phase4` as having 5 epics. The real, live `.github/pipeline-state.json` entry for this feature is slug `2026-04-19-skills-platform-phase4-opus` with exactly **4** epics (`e1`–`e4`), confirmed by direct read. Its archived artefact folder (`artefacts/archived/2026-04-19-skills-platform-phase4/`, a different slug with no `-opus` suffix and 5 epic *files* under a renamed/restructured scheme) does not correspond 1:1 to the live entry's epic names, and no artefact folder exists at the conventional `artefacts/2026-04-19-skills-platform-phase4-opus/` path at all.

This does not break AC2: 4 ≥ 4 still flags it as a true positive. The integration test below asserts the real, verified count (4), not the artefact-cited count (5), and the discrepancy is reported back rather than silently papered over. `team-identity-roles` (slug `2026-07-09-team-identity-roles`, 1 epic) matches its own artefacts exactly — confirmed separately.

---

## File map

| File | Purpose |
|------|---------|
| `scripts/detect-programme-candidates.js` | The script: pure functions (`countEpics`, `countDependencyMentions`, `computeSignals`, `isCandidate`, `scanPipelineState`, `generateReport`) + CLI wrapper |
| `tests/check-detect-programme-candidates.js` | Unit + integration + NFR tests, auto-discovered by `scripts/run-all-tests.js`'s `check-*.js` glob |

---

## Task 1 — `countEpics` (AC1)

**Test first** (`tests/check-detect-programme-candidates.js`):
```js
const { countEpics } = require('../scripts/detect-programme-candidates');

assert('T1-flat-lightweight-epics',
  countEpics({ epics: [{ slug: 'e1', stories: ['s1', 's2'] }, { slug: 'e2', stories: ['s3'] }] }) === 2,
  'lightweight flat-shape epics array (slug/stories-as-strings) should count by array length');

assert('T1-legacy-nested-epics',
  countEpics({ epics: [{ slug: 'e1', stories: [{ slug: 's1', name: 'x' }] }, { slug: 'e2', stories: [] }, { slug: 'e3', stories: [] }] }) === 3,
  'legacy nested-shape epics array (stories as full objects) should still count by array length — same field, different inner shape');

assert('T1-no-epics-field',
  countEpics({ stories: [{ id: 's1' }] }) === 0,
  'a feature with flat stories[] and no epics field at all should count as 0 epics, not throw');
```
Run: `node tests/check-detect-programme-candidates.js` → expect failures (module doesn't exist yet).

**Implementation** (`scripts/detect-programme-candidates.js`):
```js
function countEpics(feature) {
  return Array.isArray(feature.epics) ? feature.epics.length : 0;
}
```

Run again → T1-* pass.

Commit: `feat(pep-s3): add countEpics — handles flat-lightweight and legacy-nested epics shapes alike`

---

## Task 2 — `countDependencyMentions` (AC1)

**Test first:**
```js
const fs = require('fs');
const path = require('path');
const { countDependencyMentions } = require('../scripts/detect-programme-candidates');

const tirDecisionsContent = fs.readFileSync(
  path.join(__dirname, '..', 'artefacts/2026-07-09-team-identity-roles/decisions.md'), 'utf8');
assert('T2-real-tir-decisions-count',
  countDependencyMentions(tirDecisionsContent) === 4,
  `expected 4 "depend" mentions in team-identity-roles' real decisions.md, got ${countDependencyMentions(tirDecisionsContent)}`);

assert('T2-empty-content',
  countDependencyMentions('') === 0,
  'empty content should count 0, not throw');
```

**Implementation:**
```js
function countDependencyMentions(decisionsMdContent) {
  const matches = decisionsMdContent.match(/depend(?:s|ency|encies|ent)?/gi);
  return matches ? matches.length : 0;
}
```

Run → T2-* pass.

Commit: `feat(pep-s3): add countDependencyMentions — matches team-identity-roles' real confirmed count of 4`

---

## Task 3 — `computeSignals` never computes a timeline field (AC1, the regression-prevention test)

**Test first:**
```js
const { computeSignals } = require('../scripts/detect-programme-candidates');

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
```

**Implementation:**
```js
function computeSignals(feature, decisionsMdContent) {
  return {
    slug: feature.slug,
    name: feature.name,
    epicCount: countEpics(feature),
    dependencyMentionCount: countDependencyMentions(decisionsMdContent || ''),
  };
  // Deliberately no timeline/span field anywhere in this object, even unused —
  // see story Architecture Constraints: timeline span is confirmed inverted in
  // this repo's real data and explicitly excluded as a signal.
}
```

Run → T3-* pass.

Commit: `feat(pep-s3): add computeSignals — deliberately excludes any timeline/span field`

---

## Task 4 — `isCandidate` boundary (AC1)

**Test first:**
```js
const { isCandidate } = require('../scripts/detect-programme-candidates');

assert('T4-below-threshold', isCandidate({ epicCount: 3 }) === false, '3 epics should not flag');
assert('T4-at-threshold', isCandidate({ epicCount: 4 }) === true, '4 epics (the boundary) must flag — AC1 says >=4 inclusive');
assert('T4-above-threshold', isCandidate({ epicCount: 5 }) === true, '5 epics should flag');
```

**Implementation:**
```js
const EPIC_COUNT_THRESHOLD = 4; // Pinned 2026-11-09 at /review — see decisions.md. Do not change without
                                 // flagging it: pep-s2's AC1 reuses this exact value as a coordinated signal.

function isCandidate(signals) {
  return signals.epicCount >= EPIC_COUNT_THRESHOLD;
}
```

Run → T4-* pass.

Commit: `feat(pep-s3): add isCandidate — >=4 epics boundary, inclusive`

---

## Task 5 — `generateReport` (AC4)

**Test first:**
```js
const { generateReport } = require('../scripts/detect-programme-candidates');

const withCandidates = generateReport([
  { slug: 'a', name: 'A', epicCount: 5, dependencyMentionCount: 10 },
  { slug: 'b', name: 'B', epicCount: 1, dependencyMentionCount: 0 },
]);
assert('T5-disclaimer-present',
  /directional signal|human judg/i.test(withCandidates),
  'report must include a plain-language disclaimer that this requires human judgment, not a verdict');
assert('T5-candidate-listed', withCandidates.includes('a') && withCandidates.includes('5'),
  'candidate feature slug and epic count must appear in the report');
assert('T5-non-candidate-not-listed', !withCandidates.includes('dependencyMentionCount: 0') === true || !/\bb\b.*candidate/i.test(withCandidates),
  'non-candidate feature should not appear in the candidates section');
assert('T5-no-web-ui-fields',
  !/<[a-z]+>/i.test(withCandidates),
  'report must be a flat plain-text/markdown structure, not HTML/web-UI-specific markup');

const noneAtAll = generateReport([{ slug: 'c', name: 'C', epicCount: 1, dependencyMentionCount: 0 }]);
assert('T5-zero-candidates-explicit',
  /0 candidates found/i.test(noneAtAll),
  'report must explicitly state "0 candidates found" when nothing qualifies, not an empty/blank report');
```

**Implementation:**
```js
function generateReport(signalsList) {
  const candidates = signalsList.filter(isCandidate);
  const lines = [];
  lines.push('# Programme-Candidate Detection Report');
  lines.push('');
  if (candidates.length === 0) {
    lines.push('0 candidates found.');
    return lines.join('\n');
  }
  lines.push(`${candidates.length} candidate(s) found:`);
  lines.push('');
  candidates.forEach((s) => {
    lines.push(`- **${s.slug}** (${s.name}) — epic count: ${s.epicCount}, dependency-mention count: ${s.dependencyMentionCount}`);
    lines.push(`  This is a directional signal requiring human judgment, not an automatic verdict — it looks like a candidate worth a human look.`);
  });
  return lines.join('\n');
}
```

Run → T5-* pass.

Commit: `feat(pep-s3): add generateReport — explicit disclaimer and zero-candidate message`

---

## Task 6 — `scanPipelineState` integration (AC2, AC3)

**Test first:**
```js
const { scanPipelineState } = require('../scripts/detect-programme-candidates');

const results = scanPipelineState(
  path.join(__dirname, '..', '.github/pipeline-state.json'),
  path.join(__dirname, '..', 'artefacts')
);

const phase4 = results.find((r) => r.slug === '2026-04-19-skills-platform-phase4-opus');
assert('T6-phase4-found', !!phase4, 'phase4-opus feature must be present in scan results');
assert('T6-phase4-epic-count-real', phase4 && phase4.epicCount === 4,
  `expected the REAL, verified epic count (4), got ${phase4 && phase4.epicCount}`);
assert('T6-phase4-flagged', phase4 && isCandidate(phase4) === true,
  'phase4-opus (4 epics) must be flagged as a candidate — true positive, AC2');

const tir = results.find((r) => r.slug === '2026-07-09-team-identity-roles');
assert('T6-tir-found', !!tir, 'team-identity-roles feature must be present in scan results');
assert('T6-tir-epic-count', tir && tir.epicCount === 1, 'team-identity-roles should have epicCount 1');
assert('T6-tir-dependency-count', tir && tir.dependencyMentionCount === 4,
  `expected 4 depend mentions, got ${tir && tir.dependencyMentionCount}`);
assert('T6-tir-not-flagged', tir && isCandidate(tir) === false,
  'team-identity-roles (1 epic) must NOT be flagged — true negative, AC3');
```

**Implementation:**
```js
function scanPipelineState(pipelineStatePath, artefactsRoot) {
  const state = JSON.parse(fs.readFileSync(pipelineStatePath, 'utf8'));
  return state.features.map((feature) => {
    let decisionsContent = '';
    try {
      decisionsContent = fs.readFileSync(
        path.join(artefactsRoot, feature.slug, 'decisions.md'), 'utf8');
    } catch (_) {
      // No decisions.md at the conventional path for this feature (e.g. an
      // archived/renamed artefact folder) — dependencyMentionCount correctly
      // falls back to 0 rather than crashing. This is read-only, best-effort.
    }
    return computeSignals(feature, decisionsContent);
  });
}
```

Run → T6-* pass. (Confirms the real discrepancy noted above: `epicCount === 4`, not the artefact-cited 5 — AC2's directional outcome, "flagged as candidate," still holds.)

Commit: `feat(pep-s3): add scanPipelineState — verified against real pipeline-state.json, confirms phase4-opus (4 epics, not 5 as cited in artefacts) and team-identity-roles against real data`

---

## Task 7 — NFR performance test

**Test first:**
```js
const start = Date.now();
scanPipelineState(
  path.join(__dirname, '..', '.github/pipeline-state.json'),
  path.join(__dirname, '..', 'artefacts')
);
const elapsed = Date.now() - start;
assert('T7-nfr-perf-under-5s', elapsed < 5000, `expected < 5000ms, measured ${elapsed}ms`);
```
No new implementation needed — this asserts against Task 6's existing function. Run → passes if Task 6 is correct and fast (expected, since it's a single JSON parse + bounded loop).

---

## Task 8 — CLI wrapper

**Implementation only** (no new test — covered indirectly by the module-level tests above; CLI wrapper is a thin pass-through):
```js
if (require.main === module) {
  const pipelineStatePath = path.join(__dirname, '..', '.github/pipeline-state.json');
  const artefactsRoot = path.join(__dirname, '..', 'artefacts');
  const results = scanPipelineState(pipelineStatePath, artefactsRoot);
  console.log(generateReport(results));
}

module.exports = { countEpics, countDependencyMentions, computeSignals, isCandidate, generateReport, scanPipelineState, EPIC_COUNT_THRESHOLD };
```

Run manually: `node scripts/detect-programme-candidates.js` — expected output: a markdown report naming at least `2026-04-19-skills-platform-phase4-opus` as a candidate.

Commit: `feat(pep-s3): add CLI wrapper for detect-programme-candidates.js`

---

## Out of scope reminders (do not add)

- No automated escalation into `programme.md`
- No web-UI rendering
- No statistical false-positive-rate claim beyond the 2 known historical cases
