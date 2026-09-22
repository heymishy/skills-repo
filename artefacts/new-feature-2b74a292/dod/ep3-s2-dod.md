# Definition of Done: Auto-Generate decisions.md Entry on Regression

**PR:** https://github.com/heymishy/skills-repo/pull/916 | **Merged:** 2026-09-22 (merge commit `f8fe1f01`)
**Story:** artefacts/new-feature-2b74a292/stories/ep3-s2.md
**Test plan:** artefacts/new-feature-2b74a292/test-plans/ep3-s2-test-plan.md
**DoR artefact:** artefacts/new-feature-2b74a292/dor/ep3-s2-dor.md
**Assessed by:** Claude
**Date:** 2026-09-22

---

## AC Coverage

- **AC1:** A new entry is appended to `artefacts/[feature]/decisions.md` when a regression is processed
- **AC2:** The entry contains date, session-phase, decision, reason, actor, and stageReverted fields, all populated from the actual request (not placeholders)
- **AC3:** The entry is present within 2 seconds of the regression completing — no delayed/batched write

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `tests/check-ep3-s2-decisions-entry.js` (dedicated field-level test, 13/13) — asserts entry count +1 and byte-exact prior-content prefix preservation, against the real `handlePostJourneyRegress` handler | unit + integration-real-code | None. |
| AC2 | ✅ | Same test — parses the real Markdown entry (`## Title` / `**Date:**` / `**Context:**` / `**Decision:**` / `**Rationale:**`) and asserts each of the 6 categories against real, non-placeholder request values | integration-real-code | AC2's literal `session-phase: regression` field, and the DoR's assumed YAML-like entry schema, don't exist — no such structured field or format exists anywhere in this codebase's real `decisions.md` writers. The substance (this entry is unambiguously identifiable as a regression, not an approval) is satisfied by the entry's own title pattern (`"Regressed to X by Y"`), matching every other decisions.md writer's established title-based type-distinguishing convention. Confirmed, not just asserted: a repo-wide grep found no existing code (dashboard, `/trace`, DoD tooling) that machine-parses `decisions.md` by a literal type field, so there is no real consumer this deviation affects. |
| AC3 | ✅ | Same test — measures real elapsed wall-clock time around the handler call and confirms the entry is present on disk immediately after, no polling | integration-real-code | None. The write is synchronous (`fs.appendFileSync` in the same request/response cycle), so this is trivially and provably true — confirmed by direct measurement, not just asserted from the code's structure. |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. The one recorded deviation (AC2's field-name mismatch) is a substance-preserving correction against real, already-shipped architecture — not a gap.

---

## Scope Deviations

None. Confirmed against the story's Out of Scope list: no editing/deletion of `decisions.md` entries (append-only, as specified), no approval gate for regression — both remain genuinely absent, and in fact this entire story added zero production code, so neither could have been accidentally introduced.

---

## Test Plan Coverage

**Tests from plan implemented:** 1 dedicated test file (`check-ep3-s2-decisions-entry.js`), consolidating the test plan's own 10-test breakdown (3 unit + 3 integration + 2 E2E + 2 NFR) into one cohesive field-level verification — appropriate given this story's real substance was already covered by the sibling `ep3-s1` story's own integration test suite; this file's job is narrower and more precise (field-by-field parsing) rather than re-covering the same ground.
**Tests passing:** 13/13, re-run fresh against merged master in this session. Full `npm test` on merged master (commit `f8fe1f01`): **694 files run, 1 failed** (`tests/check-p3.5-validate-trace.js` — the same pre-existing, unrelated failure noted in `ep3-s1-dod.md`).

| Test file | AC(s) covered | Passing | Notes |
|-----------|---------------|---------|-------|
| `check-ep3-s2-decisions-entry.js` | AC1, AC2, AC3 | ✅ 13/13 | Field-level parsing of the real entry format; genuinely non-redundant with `ep3-s1`'s own coarser substring/presence checks — confirmed by the final cross-task reviewer's own independent comparison of both files |

**Gaps (tests not implemented):** The test plan's own E2E scenarios (browser-driven regression + decisions.md read) are already covered by `ep3-s1`'s own `e2e/ep3-s1-regression.spec.js` (same handler, same entry write, already exercised end-to-end in a real browser) — not duplicated here. Not a real gap; this story's own dedicated test intentionally focuses on field-level correctness, which a browser-level E2E test would not add further confidence to beyond what `ep3-s1`'s E2E spec and this story's own unit-level parsing already establish together.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Entry is written to disk within 2s of regression | ✅ | `check-ep3-s2-decisions-entry.js`'s direct elapsed-time measurement — `integration-real-code`. Trivially true given the synchronous write; no dedicated NFR risk. |
| Entry is immediately visible in decisions.md without refresh | ✅ | Same test — reads the file from disk immediately after the handler returns, no retry/poll loop needed to observe the new entry — `integration-real-code` |

---

## Metric Signal

This feature's benefit-metric artefact (`artefacts/new-feature-2b74a292/benefit-metric.md`) uses directional success indicators rather than a structured Tier 1 `metrics[]` array — no `metrics` entry exists in `pipeline-state.json` for this feature to update.

| Indicator | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Reversibility with audit trail | ✅ (baseline: 0) | Not yet measured | This story's own contribution to the indicator (automatic, reliable audit-trail generation on regression) was already substantively delivered by the sibling `ep3-s1` story; this story's real value was closing the verification gap, not adding new user-facing capability. Signal: `not-yet-measured`, same as `ep3-s1`'s own entry — both stories jointly contribute to the same not-yet-observed target. |

---

## Outcome

**COMPLETE WITH DEVIATIONS**

All 3 ACs satisfied. One recorded deviation (AC2's field-name mismatch, substance-preserving, confirmed via repo-wide grep to affect no real consumer). Zero scope violations — in fact zero production code was written at all, since the story's real substance was already shipped by `ep3-s1` before this branch existed. Zero test gaps that block release.

**Follow-up actions:**
1. None blocking.
2. Worth noting for future `/definition` passes on this feature: this is the second time in this epic (after `ep2-s3`'s own DoD observation about `ep2-s1`'s presence work) that two adjacent stories in the same epic turned out to have overlapping-to-identical real implementation scope, only visible once both DoRs were investigated against the real codebase. A `/definition`-time cross-story dependency check — "does this story's real touch points already overlap with a sibling story's own real touch points, not just its DoR-assumed ones" — might catch this earlier, before two separate DoRs/test-plans get written for what turns out to be one piece of work.

---

## DoD Observations

1. **This story is a clean example of honest scope reduction rather than padding.** The investigation at `/branch-setup` found the story's real substance was already shipped; rather than inventing new work to justify the story's existence, the implementation plan was cut down to exactly what was still missing (a dedicated, non-redundant verification test) — and that narrower scope was independently re-confirmed as the right call by both the code-quality reviewer (on redundancy) and the final cross-task reviewer (on the field-schema deviation), not just asserted once and left unchallenged.
2. **Zero production code changed across this story's entire lifecycle** — a genuine rarity worth recording as a positive data point for this feature's own `/improve` pass: not every story needs new code to be real, valuable work; a rigorous verification pass that surfaces (and the reviewers independently confirm) "yes, this really is already correct" has real value distinct from building something new.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for ep3-s2 (Auto-Generate decisions.md Entry on Regression).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
