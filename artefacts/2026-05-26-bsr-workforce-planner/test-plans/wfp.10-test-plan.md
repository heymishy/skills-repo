# Test Plan: Skill-tag matching for auto-derive allocation mode

**Story reference:** artefacts/2026-05-26-bsr-workforce-planner/stories/wfp.10.md
**Epic reference:** artefacts/2026-05-26-bsr-workforce-planner/epics/wfp-reconciliation-engine.md
**Test plan author:** Copilot
**Date:** 2026-05-26

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Coverage score ≥ MIN_COVERAGE_SCORE → profile-match with _matchScore | 2 tests | — | — | — | — | 🟢 |
| AC2 | Coverage score < MIN_COVERAGE_SCORE → net-new with _matchScore + _suggestedSquad | 2 tests | — | — | — | — | 🟢 |
| AC3 | Multiple squads above threshold: higher score wins; tie → larger headcount wins | 2 tests | — | — | — | — | 🟢 |
| AC4 | No requiredTags on slug → product-group fallback, no _matchScore, stdout log | 2 tests | — | — | — | — | 🟢 |
| AC5 | requiredTags present but no skills in roster → net-new _matchScore:0.0 + warning | 2 tests | — | — | — | — | 🟢 |
| AC6 | Summary output includes tag-scored breakdown with correct counts | 1 test | — | — | — | — | 🟢 |
| NFR-CORRECT | Coverage formula: coveredTags = intersection(requiredTags, union(allSkillsInSquad)) | 2 tests | — | — | — | — | 🟢 |
| NFR-OBS | _matchScore written on tag-scored entries; _suggestedSquad on net-new entries only | 2 tests | — | — | — | — | 🟢 |
| NFR-REVIEW | _reviewRequired:true retained even when _matchScore is high | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None — all ACs are verifiable by pure unit tests against the arithmetic scoring logic. The enterprise fork `requiredTags` dependency affects M2 signal measurement but does not affect test coverage (tests use synthetic fixtures with `requiredTags` already populated).

---

## Test Data Strategy

All test data is synthetic. No real PII.

**Shared roster fixture:**
```json
{
  "squads": [
    { "squad": "Platform Engineering", "headcount": 4, "members": [
      { "name": "Alice", "skills": ["java","spring","kafka"] },
      { "name": "Bob",   "skills": ["java","docker"] },
      { "name": "Carol", "skills": ["spring","k8s"] },
      { "name": "Dave",  "skills": ["kafka","java"] }
    ]},
    { "squad": "Data Engineering", "headcount": 3, "members": [
      { "name": "Eve",  "skills": ["python","spark","kafka"] },
      { "name": "Frank","skills": ["python","airflow"] },
      { "name": "Grace","skills": ["spark","scala"] }
    ]},
    { "squad": "Mobile Squad", "headcount": 2, "members": [
      { "name": "Hank", "skills": ["swift","ios"] },
      { "name": "Iris", "skills": ["kotlin","android"] }
    ]}
  ]
}
```

**Coverage formula verification:** For `requiredTags: ["java","spring","kafka"]` against Platform Engineering: union of skills = {"java","spring","kafka","docker","k8s"} — intersection with requiredTags = {"java","spring","kafka"} — covered 3/3 = 1.0.

**Below-threshold fixture:** `requiredTags: ["rust","wasm","llvm"]` against all squads — max intersection is 0 tags → score 0.0.

**Tiebreaker fixture:** Two squads each score 0.67. Squad A has headcount 4, Squad B has headcount 3. Squad A wins.

**MIN_COVERAGE_SCORE:** Module-level constant `0.6` in `src/workforce/assign.js`. Tests that need to exercise both sides of the boundary should use fixtures where scores are 0.67 (above) and 0.33 (below) against the default constant — not override the constant itself.

---

## Unit tests

Test file: `tests/check-wfp10-tag-scoring.js`
Run command: `node tests/check-wfp10-tag-scoring.js`
Source under test: `src/workforce/assign.js` — specifically the `scoreSquadForSlug(squad, requiredTags)` and `runAutoDerive(opts)` functions.

| # | Test ID | AC | Scenario | Expected |
|---|---------|-----|---------|---------|
| 1 | `tag-score-above-threshold-produces-profile-match` | AC1 | requiredTags: ["java","spring","kafka"]; Platform Engineering squad (score 1.0 ≥ 0.6) | Entry `allocationMode: "profile-match"`, `_matchScore: 1.0` |
| 2 | `tag-score-profile-match-has-correct-score-field` | AC1 | requiredTags: ["java","spring","kafka","redis"]; Platform Engineering (covers 3/4 = 0.75 ≥ 0.6) | `_matchScore: 0.75` |
| 3 | `tag-score-below-threshold-produces-net-new` | AC2 | requiredTags: ["rust","wasm","llvm"]; all squads score 0.0 | Entry `allocationMode: "net-new"`, `_matchScore: 0.0` |
| 4 | `tag-score-below-threshold-has-suggested-squad` | AC2 | requiredTags: ["kafka","python"]; Platform Engineering scores 0.5 (1/2), Data Engineering scores 0.5 (1/2) — both below 0.6 | Entry has `_suggestedSquad` field (either squad — the higher/tiebreaker squad) |
| 5 | `tiebreaker-higher-score-wins` | AC3 | requiredTags: ["java","spring"]; Platform (score 0.67) vs Data (score 0.33) — Platform higher | Entry selects Platform Engineering |
| 6 | `tiebreaker-equal-score-larger-headcount-wins` | AC3 | Two squads both at score 0.67; Squad A headcount 4, Squad B headcount 3 | Entry selects Squad A |
| 7 | `no-required-tags-uses-product-group-fallback` | AC4 | Portfolio slug has no `requiredTags` field | Entry has no `_matchScore` key; wfp.9 product-group path used |
| 8 | `no-required-tags-logs-fallback-to-stdout` | AC4 | Same | Stdout contains "No requiredTags for [slug] — using product-group match." |
| 9 | `required-tags-present-no-skills-in-roster-zero-score` | AC5 | requiredTags: ["go","rust"]; all roster members have `skills: []` | Entry `allocationMode: "net-new"`, `_matchScore: 0.0` |
| 10 | `required-tags-present-skills-field-absent-in-roster` | AC5 | requiredTags: ["go","rust"]; all roster members have no `skills` field | Same: `_matchScore: 0.0`; warning printed |
| 11 | `summary-output-includes-tag-scored-counts` | AC6 | 1 profile-match (tag-scored), 1 net-new (below threshold), 1 fallback (no requiredTags) | Stdout contains "1 profile-match (1 tag-scored)" and "1 net-new (1 below-threshold, 1 no-tags-fallback)" |
| 12 | `coverage-formula-uses-union-of-squad-member-skills` | NFR-CORRECT | requiredTags: ["java","spring","kafka"]; Platform Engineering (union = java,spring,kafka,docker,k8s) | coveredTags count = 3; score = 3/3 = 1.0 — not limited to a single member's skills |
| 13 | `coverage-formula-empty-required-tags-treated-as-fallback` | NFR-CORRECT | requiredTags: [] (empty array) | Falls back to product-group path (same as no requiredTags); no division by zero |
| 14 | `match-score-written-on-tag-scored-entries-only` | NFR-OBS | One slug with requiredTags (tag-scored); one slug without (fallback) | Tag-scored entry has `_matchScore`; fallback entry does NOT have `_matchScore` key |
| 15 | `suggested-squad-written-on-net-new-not-on-profile-match` | NFR-OBS | One slug above threshold (profile-match); one below (net-new) | Profile-match entry has no `_suggestedSquad`; net-new entry has `_suggestedSquad` |
| 16 | `review-required-true-even-with-perfect-score` | NFR-REVIEW | Portfolio slug produces profile-match with _matchScore:1.0 | Entry still has `_reviewRequired: true` |

---

## E2E tests

Not applicable — `workforce-assign --mode auto` is a CLI invocation with no browser-rendered output. H-E2E passes trivially.

---

## Notes on test file format

```js
// tests/check-wfp10-tag-scoring.js
const assert = require('assert');
let passed = 0, failed = 0;
function test(label, fn) {
  try { fn(); console.log('  PASS', label); passed++; }
  catch (e) { console.log('  FAIL', label, e.message); failed++; }
}
// ... tests ...
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
```
