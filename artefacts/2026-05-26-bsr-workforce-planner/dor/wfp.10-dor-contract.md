# DoR Contract — wfp.10 Skill-tag matching for auto-derive allocation mode

**Story:** wfp.10
**Feature:** 2026-05-26-bsr-workforce-planner
**Date:** 2026-05-26

---

## What will be built

- Extend `src/workforce/assign.js` (wfp.9) with:
  - `scoreSquadForSlug(squad, requiredTags)` — pure function returning `{ score: float, squadName: string }`; coverage = intersection(requiredTags, union of all member skills arrays) / requiredTags.length
  - Modified `runAutoDerive`: tag-scoring path activates when `slug.requiredTags` is a non-empty array; best-scoring squad selected (score tiebreaker: headcount); `allocationMode: "profile-match"` if score ≥ `MIN_COVERAGE_SCORE`; `allocationMode: "net-new"` if below; `_matchScore` written on tag-scored entries only; `_suggestedSquad` written on net-new entries only; `_reviewRequired: true` on all entries regardless of score; product-group path unchanged for slugs without `requiredTags`
  - Updated summary output with tag-scored breakdown counts
  - `MIN_COVERAGE_SCORE` constant exported
- `tests/check-wfp10-tag-scoring.js` — 16 unit tests covering all 6 ACs

## What will NOT be built

- `MIN_COVERAGE_SCORE` as a CLI flag
- Tag scoring in file-import or guided modes
- Multiple candidate squad entries in output
- Fuzzy tag matching

## AC verification table

| AC | Verified by | Test IDs |
|----|-------------|----------|
| AC1 — above threshold → profile-match + _matchScore | Unit: score 1.0 and 0.75 | T1, T2 |
| AC2 — below threshold → net-new + _matchScore + _suggestedSquad | Unit: score 0.0 and 0.33 | T3, T4 |
| AC3 — tiebreaker: higher score then larger headcount | Unit: two fixtures | T5, T6 |
| AC4 — no requiredTags → fallback, no _matchScore, stdout log | Unit: absent + empty-array | T7, T8 |
| AC5 — requiredTags present, no roster skills → net-new 0.0 + warning | Unit: empty-skills + absent-skills-field | T9, T10 |
| AC6 — summary with tag-scored breakdown | Unit: count verification | T11 |

## Assumptions

- wfp.9 is DoD-complete — `src/workforce/assign.js` with `runAutoDerive`, `MIN_COVERAGE_SCORE`, and the overwrite guard already exist
- Enterprise fork may or may not have `requiredTags` on portfolio slugs; fallback path handles absent field

## Required touchpoints (MUST be in implementation)

- `src/workforce/assign.js` — extend (add `scoreSquadForSlug`; modify `runAutoDerive`; export `MIN_COVERAGE_SCORE`)
- `tests/check-wfp10-tag-scoring.js` — new file
- `package.json` — append `&& node tests/check-wfp10-tag-scoring.js` to `scripts.test`

## Out-of-scope constraints (MUST NOT touch)

- `src/workforce/assign.js` guided mode (`runGuided`) — must not be modified
- `src/workforce/assign.js` file-import mode (`runFileImport`) — must not be modified
- `src/workforce/assign.js` `setPromptFn` / `getPromptFn` / `atomicWrite` / `overwriteGuard` — must not be modified
- `.github/skills/workforce-assign/SKILL.md` — no changes needed
- `dashboards/` — not in scope
- Any existing test file — must not be modified

## Schema dependencies

Upstream: wfp.9 (assign.js module contract). No pipeline-state schema field dependency.
