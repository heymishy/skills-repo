# Definition of Done: Scope the Roadmap tab's early-stage artefact scan to the product actually being viewed

**PR:** https://github.com/heymishy/skills-repo/pull/701 | **Merged:** 2026-08-09
**Story:** artefacts/2026-08-09-roadmap-product-scoping/stories/rps-s1-roadmap-product-scoping.md
**Test plan:** artefacts/2026-08-09-roadmap-product-scoping/test-plans/rps-s1-test-plan.md
**DoR artefact:** artefacts/2026-08-09-roadmap-product-scoping/dor/rps-s1-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-09

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | "each product shows only its own roadmap entries" | `tests/check-rps-s1-roadmap-product-scoping.js` — AC1 | None |
| AC2 | ✅ | "artefact with no matching journey is excluded" | `tests/check-rps-s1-roadmap-product-scoping.js` — AC2 | None |
| AC3 | ✅ | "journeys-lookup failure fails closed to the empty state" | `tests/check-rps-s1-roadmap-product-scoping.js` — AC3 | None |
| AC4 | ✅ | "Roadmap tab renders the empty state cleanly" (pre-existing AC4 unmodified) | `tests/check-a5-roadmap-tab.js` — AC4 (regression) | None |
| AC5 | ✅ | "Roadmap tab renders a real discovery-only entry with title, stage pill, and date" (pre-existing AC1 unmodified) | `tests/check-a5-roadmap-tab.js` — AC1 (regression) | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor.
Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

---

## Scope Deviations

None. `roadmap-scan.js` itself was not touched (verified — the filter lives entirely in `handleGetProductRoadmap`, its caller), consistent with the story's out-of-scope declaration.

---

## Test Plan Coverage

**Tests from plan implemented:** 3 / 3 (new) + 2 / 2 (regression-check) = 5 / 5
**Tests passing in CI:** 5 / 5

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1: two products each show only their own roadmap entries | ✅ | ✅ | `check-rps-s1-roadmap-product-scoping.js` |
| AC2: artefact with no matching journey excluded from every product | ✅ | ✅ | `check-rps-s1-roadmap-product-scoping.js` |
| AC3: journeys-lookup failure fails closed | ✅ | ✅ | `check-rps-s1-roadmap-product-scoping.js` |
| AC4: empty-state regression (existing `check-a5-roadmap-tab.js` AC4) | ✅ | ✅ | Re-run unmodified alongside the AC1 mock extension |
| AC5: happy-path rendering regression (existing `check-a5-roadmap-tab.js` AC1) | ✅ | ✅ | Re-run unmodified |

**Gaps (tests not implemented):**
None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Correctness — a product's roadmap must only show data belonging to it | ✅ | AC1/AC2 tests directly verify cross-product isolation and orphan exclusion |
| Performance — one additional indexed query per roadmap view | ✅ | Code review: single `SELECT feature_slug FROM journeys WHERE product_id = $1` added, same pattern as existing queries in the file |

---

## Metric Signal

No metrics defined for this short-track feature (`metrics: []` in `pipeline-state.json`) — direct correctness fix, no formal benefit-metric artefact per the story's Benefit Linkage section.

---

## Outcome

**COMPLETE**

**Follow-up actions:**
None. The separately-logged "zero E2E teardown" root cause (why so many stale artefact folders exist in the first place) remains a distinct, already-tracked item — this story only fixes which product(s) they could incorrectly appear under.

---

## DoD Observations

1. This story's branch was created before `jpws-s1` and `b3x-s1` were in flight; once `rps-s1` merged first, both of those branches needed `.github/pipeline-state.json` merge-conflict resolution (the file's "append a new feature object" pattern collides when two branches both append near the array's tail). Resolved each time by keeping every feature as its own separate array entry rather than letting one branch's insertion overwrite the other's. Not a defect in this story — a mechanical consequence of three short-track stories landing in parallel — but worth a `/improve` note if this pattern recurs often: `pipeline-state.json`'s append-only array shape is a known merge hotspot (see `workspace/learnings.md` D-series notes on this).

None further.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for rps-s1 (Roadmap tab product scoping).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
