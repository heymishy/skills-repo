# Definition of Done: sdg.2 — Reference file persistence in journey state

**PR:** https://github.com/heymishy/skills-repo/pull/414 | **Merged:** 2026-06-26
**Story:** artefacts/2026-06-21-strategy-and-data-hub/stories/sdg.2.md
**Test plan:** artefacts/2026-06-21-strategy-and-data-hub/test-plans/sdg.2-test-plan.md
**DoR artefact:** artefacts/2026-06-21-strategy-and-data-hub-dor-sdg-2/definition-of-ready.md
**Assessed by:** Claude (agent) — retroactive, ~5 weeks post-merge
**Date:** 2026-07-30

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `journey.referenceFiles = [{path, uploadedAt, sizeBytes}]` populated on upload | `tests/check-sdg2-journey-persistence.js` T1-T2 | None |
| AC2 | ✅ | `buildSystemPrompt()` accepts `referenceFiles` as an argument | Same file, T3 (plus T4 regression guard: omission doesn't throw) | None |
| AC3 | ✅ | `referenceFiles` survives JSON serialise/deserialise (resume) | Same file, T5 | None |
| AC4 | ✅ | Re-upload replaces the previous file list | Same file, T6 | None |
| AC5 | ✅ | Multiple files tracked as independent entries, no aggregation | Same file, T7 | None |

## Scope Deviations

None found on review — no freshness checks, versioning, or auto-cleanup implemented, matching the story's out-of-scope list.

## Test Plan Coverage

**Tests from plan implemented:** 8 / 8 (`tests/check-sdg2-journey-persistence.js`)
**Tests passing in CI:** 8 / 8, re-confirmed live on current master (2026-07-30) — still green

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| T1-T8 | ✅ | ✅ | T8 explicitly covers NFR-ATOMIC (write failure does not orphan journey state) |

**Gaps:** None.

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Atomicity — journeyState update + file write atomic | ✅ | T8 |
| Data structure consistency — same shape across code paths | ✅ | T1-T2, T7 |

## Metric Signal

Same gap as `sdg.1`: no `benefit-metric.md` artefact exists for this feature. Recorded as `not-yet-measured` — evidence note: "no benefit-metric artefact exists to measure against; pre-existing process gap, not new to this story."

## Outcome

**COMPLETE**

**Follow-up actions:** None beyond the shared, already-flagged `benefit-metric.md` gap (see `sdg.1`'s DoD).

## DoD Observations

Same retroactive-DoD context as `sdg.1` — see that story's DoD for the full explanation of the ~5-week bookkeeping gap.
