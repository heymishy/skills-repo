# Retrospective Story: Fix search-loop bug in check-p4-enf-decision.js (T6/T7)

**Story ID:** r-p4-enf-test-loop-fix
**Retrospective audit date:** 2026-08-22
**Committed in:** (this commit, master)
**Risk classification:** LOW

**Epic reference:** no epic — standalone BETWEEN-STORIES item, found during baseline-failure triage (F18 in `workspace/dod-backlog-findings.md`)
**Discovery reference:** no discovery — retrospective only, operator-authorized direct fix given LOW risk and test-only scope (no product code touched)
**Benefit-metric reference:** none — governance-test correctness fix, not a product feature

## What was delivered

`tests/check-p4-enf-decision.js`'s T6 and T7 checks search `pipeline-state.json`'s `features[]` array for a `guardrails[]` entry with `id: "ADR-phase4-enforcement"`. The original loop broke on the *first* feature encountered with any non-null `guardrails` array — even an unrelated one, e.g. `2026-06-22-skills-infra-migration-tracks`'s own 8-item `guardrails[]` — rather than searching until the specific target entry was found. Since most features carry a `guardrails` array (per `/definition`'s own mandatory seeding step), the loop almost always stopped before reaching the feature that actually holds the ADR-phase4-enforcement entry (`2026-04-19-skills-platform-phase4-opus`), producing a false T6b/T7 failure despite the underlying data being fully correct.

**Key files already committed:**
- `tests/check-p4-enf-decision.js` — T6 and T7 search loops now only stop when the target `id: "ADR-phase4-enforcement"` entry is actually found in a feature's `guardrails[]` array, not on the first non-empty array encountered.

**Observed behaviour:** Running `node tests/check-p4-enf-decision.js` now reports `24 passed, 0 failed` (was `21 passed, 4 failed` — T6b, T7, T7a, T7b false-failing). No change to `.github/pipeline-state.json` or `.github/architecture-guardrails.md` was needed — both already carried a fully correct `ADR-phase4-enforcement` guardrail entry (`file: ".github/architecture-guardrails.md"`, `status: "active"`) on feature `2026-04-19-skills-platform-phase4-opus`.

## Benefit Linkage

**Metric moved:** none — tooling/test-correctness fix
**How:** This removes a persistent false-negative from the full-suite baseline (`node scripts/run-all-tests.js`), which had been carrying this file as one of 3 recurring "known" pre-existing failures across an entire session, incorrectly narrated as "a genuine, separately-tracked governance-coverage gap." Restoring a clean, trustworthy full-suite signal is a precondition for every story's own regression-check discipline in this repo.

## User Story

As an **operator running the full test suite to confirm no regressions**,
I want **`check-p4-enf-decision.js` to accurately reflect the real state of the ADR-phase4-enforcement guardrail**,
So that **a genuinely clean full-suite run is trustworthy, and this file stops being carried indefinitely as an accepted-but-unexplained baseline failure**.

## Acceptance Criteria

**AC1 — T6/T7 correctly find the ADR-phase4-enforcement guardrail entry regardless of its position in `features[]`**
Status: ALREADY-MET
Evidence: `node tests/check-p4-enf-decision.js` — `24 passed, 0 failed`, confirmed fresh on master.

**AC2 — No change required to `.github/pipeline-state.json` or `.github/architecture-guardrails.md`**
Status: ALREADY-MET
Evidence: Both already contained the correct entry before this fix; only the test's own search logic was wrong. Confirmed by direct inspection during triage (see `workspace/dod-backlog-findings.md` F18).

**AC3 — Test coverage gate**
Status: ALREADY-MET
Evidence: The fix is to the test file itself (T6/T7 are the coverage). No separate regression test is needed for a test-file bug fix of this shape — re-running the corrected file against the unchanged, already-correct data is the verification.

## Out of Scope

- No product code (`src/`, `scripts/`, `.github/architecture-guardrails.md`) was touched — the underlying guardrail data was already correct
- Broader audit of other governance-check scripts for the same "break on first match" search-loop anti-pattern is not performed here — flagged as a candidate for a future, separately-scoped check if it recurs

## Open Questions

- [x] Does the committed implementation satisfy the platform's architectural guardrails? — N/A, test-only change, no architectural surface touched
- [x] Are there any security implications of the committed code that were not reviewed? — None; no product code, no data handling change
- [x] Is the feature referenced in any upgrade-path agent index? — N/A, internal test-file fix

## Traceability Linkage

**DoR artefact:** none — LOW-risk, operator-authorized direct-fix exception (see chat, 2026-08-22)
**Test plan:** none — existing T6/T7 in `tests/check-p4-enf-decision.js` are the test plan
**Verification script:** none — fresh `node tests/check-p4-enf-decision.js` run is the verification (24/24 passing)
**DoD artefact:** not required — bookkeeping-adjacent, test-only fix; this retrospective story is the closing record

## Notes

- Found during F18 triage (`workspace/dod-backlog-findings.md`) while investigating the 3 recurring full-suite baseline failures at the operator's request.
- Operator explicitly chose the lightweight/direct-fix path over the full short-track pipeline for this item, given its LOW risk classification (test-only, 1 file, no product code, data already correct) — see chat transcript, 2026-08-22.
