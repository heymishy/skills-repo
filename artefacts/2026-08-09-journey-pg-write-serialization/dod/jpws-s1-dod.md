# Definition of Done: Serialize a journey's Postgres writes so an earlier, incomplete write can never overwrite a later, correct one

**PR:** https://github.com/heymishy/skills-repo/pull/702 | **Merged:** 2026-08-09
**Story:** artefacts/2026-08-09-journey-pg-write-serialization/stories/jpws-s1-journey-pg-write-serialization.md
**Test plan:** artefacts/2026-08-09-journey-pg-write-serialization/test-plans/jpws-s1-test-plan.md
**DoR artefact:** artefacts/2026-08-09-journey-pg-write-serialization/dor/jpws-s1-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-09

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | "final write carries the correct tenantId" — later write always wins regardless of real-time settle order | `tests/check-jpws-s1-journey-pg-write-serialization.js` — AC1 | None |
| AC2 | ✅ | "exactly 3 total invocations, no more" + "writes were issued in call order" | `tests/check-jpws-s1-journey-pg-write-serialization.js` — AC2 | None |
| AC3 | ✅ | "both journeys' writes issued immediately, neither waits on the other" | `tests/check-jpws-s1-journey-pg-write-serialization.js` — AC3 | None |
| AC4 | ✅ | "write #2 still issued despite write #1 rejecting" | `tests/check-jpws-s1-journey-pg-write-serialization.js` — AC4 | None |
| AC5 | ✅ | "createJourney with no PG adapter does not throw" | `tests/check-jpws-s1-journey-pg-write-serialization.js` — AC5, and unmodified `tests/check-p3.1-pg-journey-adapter.js` (13/13 passing) | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor.
Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

---

## Scope Deviations

None. No call-site changes anywhere in the codebase (verified — the fix lives entirely inside `_pgWrite` in `journey-store.js`); `journey-store-pg.js`'s `saveJourney()` SQL was not touched.

---

## Test Plan Coverage

**Tests from plan implemented:** 13 / 13
**Tests passing in CI:** 13 / 13

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1: later write wins regardless of settle order | ✅ | ✅ | 3 assertions |
| AC2: writes invoked once each, in call order | ✅ | ✅ | 4 assertions |
| AC3: different journeys' writes not blocked on each other | ✅ | ✅ | 1 assertion |
| AC4: rejected write does not jam the queue | ✅ | ✅ | 3 assertions |
| AC5: no-PG-adapter no-op preserved | ✅ | ✅ | 1 assertion + unmodified `check-p3.1-pg-journey-adapter.js` regression (13/13) |

**Gaps (tests not implemented):**
None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Correctness/Data integrity — closes a real production race condition | ✅ | AC1/AC2 tests directly verify ordering guarantee; root-caused against ~1000 real corrupted rows found in production Postgres during this session's investigation |
| Performance — no added latency to callers | ✅ | Code review: fix is an internal `.then()` promise-chain per `journeyId`, callers remain un-awaited exactly as before; AC3 test confirms different journeys are never blocked on each other |

---

## Metric Signal

No metrics defined for this short-track feature (`metrics: []` in `pipeline-state.json`) — direct correctness fix, no formal benefit-metric artefact per the story's Benefit Linkage section.

---

## Outcome

**COMPLETE**

**Follow-up actions:**
- Bulk repair of the ~1000 already-corrupted tenant-less journey rows in production Postgres is explicitly out of scope for this story (a separate, forward-looking fix only) — flagged as a follow-up data-cleanup action for the operator, not a defect in this delivery.
- This story closes the write-order race but does not address the separate "zero E2E teardown" root cause (why so much throwaway data accumulates on staging in the first place) — that item is tracked separately and partially addressed by `b3x-s1` in the same session.

---

## DoD Observations

1. Same `pipeline-state.json` merge-hotspot pattern noted in `rps-s1`'s DoD applied here too: this branch needed conflict resolution against master twice (once after `rps-s1` merged, once implicitly reconciled before its own merge) — resolved by keeping each feature as a separate array entry. No functional impact; purely a bookkeeping-file merge mechanic.
2. Root-cause investigation for this story (the Postgres write-order race) was itself the product of a broader "why do tenant-less journeys keep appearing" exploration this session — an earlier hypothesis (shared E2E/CI credentials) was disproven via direct source verification of all four real auth mechanisms before the real write-order mechanism was found. Worth noting for `/trace`: the true root cause required ruling out a plausible-sounding but incorrect theory first.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for jpws-s1 (journey Postgres write serialization).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
