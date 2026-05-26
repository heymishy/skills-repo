# Definition of Ready — Skill-tag matching for auto-derive allocation mode

**Story:** wfp.10
**Feature:** 2026-05-26-bsr-workforce-planner
**Date:** 2026-05-26
**DoR run by:** Copilot

---

## Step 1 — Story loaded

**Story loaded:** Skill-tag matching for auto-derive allocation mode
**Review:** PASS — wfp.10 run 1, 0 HIGH findings; 1 MEDIUM (1-M1 M3 label mismatch — resolved: benefit linkage corrected to M2 only); 0 LOW findings
**Test plan:** 16 unit tests covering all 6 ACs and key NFRs
**Verification scenarios:** 4 scenarios (see Step 5 below)

---

## Step 2 — Contract Proposal

**What will be built:**
- Extend `src/workforce/assign.js` (introduced in wfp.9) with:
  - `scoreSquadForSlug(squad, requiredTags)` — pure function; returns `{ score: float, squad: string }` where `score = coveredTags.length / requiredTags.length` and `coveredTags = intersection(requiredTags, union of all member skills arrays)`. Returns `score: 0.0` when `requiredTags` is non-empty and no member has matching skills.
  - Modified `runAutoDerive(opts)`: for each portfolio slug that has a non-empty `requiredTags` array, call `scoreSquadForSlug` for all squads; select the highest scorer (headcount tiebreaker); if score ≥ `MIN_COVERAGE_SCORE` → `allocationMode: "profile-match"` + `_matchScore: [score]`; else → `allocationMode: "net-new"` + `_matchScore: [score]` + `_suggestedSquad: [squad name]`. If `requiredTags` absent or empty → existing product-group path (no `_matchScore` written); log "No requiredTags for [slug] — using product-group match." to stdout.
  - `_reviewRequired: true` remains on every auto-derive entry regardless of `_matchScore`.
  - `_matchScore` written on tag-scored entries only. Not written on product-group fallback entries.
  - Updated summary format: `"Auto-derived [N] direct, [N] profile-match ([N] tag-scored), [N] net-new ([N] below-threshold, [N] no-tags-fallback) entries. Review allocation-input.json before running workforce-map."`
- `tests/check-wfp10-tag-scoring.js` — 16 unit tests

**What will NOT be built:**
- `MIN_COVERAGE_SCORE` as a CLI flag
- Tag scoring for file-import or guided modes
- Multiple candidate squad output (only best scorer)
- Fuzzy tag matching
- `requiredTags` from any source other than portfolio slug file

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 — above-threshold → profile-match + _matchScore | Unit: score 1.0 + score 0.75 fixtures | Unit |
| AC2 — below-threshold → net-new + _matchScore + _suggestedSquad | Unit: score 0.0 + score 0.33 fixtures | Unit |
| AC3 — multiple squads: higher score wins; equal → larger headcount | Unit: two fixtures | Unit |
| AC4 — no requiredTags → product-group fallback, no _matchScore, stdout log | Unit: absent + empty-array cases | Unit |
| AC5 — requiredTags present, no skills in roster → net-new 0.0 + warning | Unit: empty-skills + absent-skills-field | Unit |
| AC6 — summary with tag-scored breakdown | Unit: verify correct counts in summary | Unit |

**RISK-ACCEPT — cross-repo enterprise fork dependency:**
The M2 improvement this story targets only materialises once the enterprise fork ships `requiredTags` on portfolio slugs. The fallback to product-group matching is implemented and logged — M2 measurement is not blocked by this story, only the improvement delta is deferred until the enterprise fork delivers. RISK-ACCEPT: proceed with implementation; track enterprise fork `requiredTags` field as a separate cross-repo delivery dependency.

**Assumptions:**
- wfp.9 is DoD-complete before implementation begins — `src/workforce/assign.js` and `MIN_COVERAGE_SCORE` constant are present
- Portfolio slugs may or may not have `requiredTags`; the fallback path handles absent field transparently

**Estimated touch points:**
- `src/workforce/assign.js` — extend (add `scoreSquadForSlug`; modify `runAutoDerive`)
- `tests/check-wfp10-tag-scoring.js` — new
- `package.json` — append `&& node tests/check-wfp10-tag-scoring.js` to scripts.test

---

## Step 3 — Contract review

Contract review passed — extends a single function in an established module; all 6 ACs covered by named tests; no new dependencies introduced; cross-repo risk explicitly acknowledged.

---

## Hard blocks

| Check | Result | Notes |
|-------|--------|-------|
| H1 — As / Want / So with named persona | PASS | "As a Head of Engineering" |
| H2 — three or more ACs in Given / When / Then | PASS | 6 ACs, all in GWT format |
| H3 — every AC has at least one test | PASS | All 6 ACs covered in test plan |
| H4 — out-of-scope populated | PASS | 5 explicit exclusions |
| H5 — benefit linkage to named metric | PASS | M2; M3 label corrected this session (review finding 1-M1 resolved) |
| H6 — complexity rated | PASS | Rating: 2 |
| H7 — no unresolved HIGH findings | PASS | 0 HIGH findings; 1-M1 MEDIUM resolved |
| H8 — no uncovered ACs | PASS | All 6 ACs have named unit tests |
| H8-ext — cross-story schema check | PASS | No pipeline-state schema field dependency |
| H9 — architecture constraints populated | PASS | CommonJS, no new deps, MIN_COVERAGE_SCORE as constant, extends not replaces, _matchScore on tag-scored entries only |
| H-E2E — web UI change requiring E2E | PASS | CLI tool; no browser-rendered output; H-E2E not triggered |
| H-NFR — NFR profile exists | PASS | nfr-profile.md present |
| H-NFR2 — compliance NFRs have sign-off | PASS | No regulatory clause NFRs |
| H-NFR3 — data classification not blank | PASS | Internal / Private in nfr-profile.md |
| H-NFR-profile — NFRs registered in nfr-profile.md | PASS | wfp.10 NFRs added to nfr-profile.md this session (Performance, Correctness, Observability) |
| H-GOV — Approved By populated | PASS | Hamish King 2026-05-26 |
| H-ADAPTER — injectable adapters introduced | PASS | No new injectable adapters; wfp.9 promptFn adapter unchanged |

---

## Warnings

| Check | Result |
|-------|--------|
| W1 — NFRs populated or "None" | No warning — 3 NFRs (Performance, Correctness, Observability) |
| W2 — scope stability declared | No warning — Stable with explicit cross-repo risk flag |
| W3 — MEDIUM review findings acknowledged | No warning — 1-M1 resolved by correcting benefit linkage before DoR sign-off |
| W4 — verification script reviewed by domain expert | Warning — scenarios written below; not yet reviewed by Hamish King |
| W5 — no UNCERTAIN items in test plan | No warning |

**W4 acknowledgement:** Internal engineering tool. Operator proceeds.

**Cross-repo risk note:** The enterprise fork must add `requiredTags` to `portfolio/[slug].json` output for this story's M2 improvement to be measurable. Until that ships, wfp.10 code is complete but operating in product-group fallback mode for all slugs. No blocking action required — fallback is designed and tested.

---

## Step 5 — Verification scenarios

Manual scenarios to run post-implementation before DoD:

1. **Tag-scoring above threshold:** Portfolio slug with `requiredTags: ["java","spring"]` and a squad covering both → `allocation-input.json` entry has `allocationMode: "profile-match"` and `_matchScore` ≥ 0.6; `_reviewRequired: true`.
2. **Tag-scoring below threshold:** Portfolio slug with `requiredTags: ["rust","wasm","llvm"]` → entry has `allocationMode: "net-new"`, `_matchScore: 0.0`, `_suggestedSquad` field present.
3. **Product-group fallback:** Portfolio slug with no `requiredTags` field → entry has no `_matchScore` key; stdout contains "No requiredTags for [slug] — using product-group match.".
4. **_reviewRequired always true:** Any portfolio slug through any tag-scoring path → `_reviewRequired: true` on every entry, regardless of `_matchScore` value.

---

## Oversight level

**Low** — from parent epic wfp-reconciliation-engine.md. No sign-off required.

---

## Coding Agent Instructions

### Story
Skill-tag matching for auto-derive allocation mode — wfp.10

### DoR contract reference
`artefacts/2026-05-26-bsr-workforce-planner/dor/wfp.10-dor-contract.md`

### Test plan
`artefacts/2026-05-26-bsr-workforce-planner/test-plans/wfp.10-test-plan.md`
16 unit tests — all must pass.

### Test files
- `tests/check-wfp10-tag-scoring.js` — unit tests. Add `&& node tests/check-wfp10-tag-scoring.js` to `npm test` chain.
- No E2E tests — CLI tool, no browser output.

### What to build

**Task 1 — Add `scoreSquadForSlug` pure function to `src/workforce/assign.js`:**
```js
/**
 * @param {{ squad: string, headcount: number, members: Array<{ skills?: string[] }> }} squad
 * @param {string[]} requiredTags
 * @returns {{ score: number, squadName: string }}
 */
function scoreSquadForSlug(squad, requiredTags) {
  if (!requiredTags || requiredTags.length === 0) return { score: 0, squadName: squad.squad };
  const unionSkills = new Set(squad.members.flatMap(m => m.skills || []));
  const covered = requiredTags.filter(t => unionSkills.has(t));
  return { score: covered.length / requiredTags.length, squadName: squad.squad };
}
```
Export `scoreSquadForSlug` for testability.

**Task 2 — Modify `runAutoDerive` in `src/workforce/assign.js`:**
In the per-slug processing loop, before the product-group match:
1. Check if `slug.requiredTags` is a non-empty array.
2. If yes: call `scoreSquadForSlug(squad, slug.requiredTags)` for every squad in roster. Select the squad with the highest score (if tie, select the squad with larger `headcount`).
   - If best score ≥ `MIN_COVERAGE_SCORE` → `allocationMode: "profile-match"`, `_matchScore: [score rounded to 2 decimal places]`
   - If best score < `MIN_COVERAGE_SCORE` → `allocationMode: "net-new"`, `_matchScore: [score]`, `_suggestedSquad: [best scoring squad name]`
3. If no: existing product-group matching path (unchanged from wfp.9). Log to stdout: `"No requiredTags for [slug] — using product-group match."` No `_matchScore` written.
4. `_reviewRequired: true` on every entry regardless of path.
5. Update summary string to extended format: `"Auto-derived [N] direct, [N] profile-match ([N] tag-scored), [N] net-new ([N] below-threshold, [N] no-tags-fallback) entries. Review allocation-input.json before running workforce-map."`

**Task 3 — Export `MIN_COVERAGE_SCORE`:**
Ensure `MIN_COVERAGE_SCORE` is exported in `module.exports` so tests can read it without hardcoding `0.6`.

**Task 4 — Test file:**
`tests/check-wfp10-tag-scoring.js` — implement all 16 unit tests from the test plan. Use synthetic roster and portfolio fixtures as specified in the test plan data strategy.

**Task 5 — package.json test chain:**
Append `&& node tests/check-wfp10-tag-scoring.js` to `scripts.test`.

### Dependencies
- wfp.9 must be DoD-complete before implementation begins — `src/workforce/assign.js`, `MIN_COVERAGE_SCORE` constant, and `runAutoDerive` must exist.

### Definition of done for this story
- `node tests/check-wfp10-tag-scoring.js` exits 0 with 16 passing
- `npm test` exits 0
- All 4 verification scenarios pass manually
- `_reviewRequired: true` on every auto-derive entry in all output; `_matchScore` present only on tag-scored entries

### Proceed: Yes

---

**Definition of ready: PROCEED — Skill-tag matching for auto-derive allocation mode (wfp.10)**
