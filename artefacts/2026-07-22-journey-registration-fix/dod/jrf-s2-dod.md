# Definition of Done: Register product-feature journeys in the shared in-memory store

**PR:** https://github.com/heymishy/skills-repo/pull/548 | **Merged:** 2026-07-22
**Story:** artefacts/2026-07-22-journey-registration-fix/stories/jrf-s2-register-product-feature-journeys.md
**Test plan:** artefacts/2026-07-22-journey-registration-fix/test-plans/jrf-s2-test-plan.md
**DoR artefact:** artefacts/2026-07-22-journey-registration-fix/dor/jrf-s2-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-07-22

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 (journey registered in-memory at creation) | ✅ | `getJourney(journeyId)` returns a real, non-null object after the real `handlePostProductFeature` runs | automated test (`check-jrf-s2-...js`) | None |
| AC2 (activeSession actually set, not silently dropped) | ✅ | `activeSessionId`/`activeSkill` both populated on the retrieved journey | automated test | None |
| AC3 (product_id persists to the real column, not just JSONB) | ✅ | Unit test on `saveJourney`'s SQL (INSERT list + ON CONFLICT clause both include `product_id`) + integration test tracing the real `productId` through to the journey object | automated test | None |
| AC4 (gate-confirm succeeds end-to-end) | ✅ | Real `handlePostProductFeature` → session marked done → real `handlePostGateConfirm` → no 404, response body never contains "Journey not found" | automated test, direct reproduction of the reported bug | None |
| AC5 (existing product-view journeys listing unaffected) | ✅ | Created journey carries `productId`/`featureSlug`/`journeyId` — the exact fields `handleGetProductView`'s query needs | automated test | None |

**A deviation is any difference between implemented behaviour and the AC** — none recorded; the merged code matches the story text exactly.

---

## Scope Deviations

None. `handlePostJourney` (the already-correct sibling flow) was not touched. No retroactive repair of pre-existing broken journeys was attempted (explicitly out of scope, per the story).

---

## Test Plan Coverage

**Tests from plan implemented:** 6 / 6
**Tests passing in CI:** 6 / 6, independently re-run against merged `master`

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| tests/check-jrf-s2-register-product-feature-journeys.js (6 tests) | ✅ | ✅ | Re-run on master post-merge and again after the wusl-s1 rebase, all 6 green both times |
| tests/check-jrf-s1-new-feature-redirect.js (5 tests) | ✅ (pre-existing) | ✅ | Regression suite, unaffected |
| tests/check-cdg4-gate-confirm-validation.js (10 tests) | ✅ (pre-existing) | ✅ | Regression suite, unaffected |
| tests/check-psh-s4-navigation.js (6 tests) | ✅ (pre-existing, 1 test updated) | ✅ | Its own T3 asserted the OLD, buggy raw-INSERT mechanism — updated to verify the new, correct mechanism instead. This is a genuine, deliberate test fix, not a deviation from the story (the old assertion was testing a mechanism this story explicitly removes). |
| Full suite | ✅ | ✅ (325/362, 37 pre-existing baseline failures) | Re-run 3 times across this story's lifecycle (initial implementation, post-rebase for wusl-s1) — identical 37-file failing list every time |

**Gaps (tests not implemented):**
None beyond the story's own explicitly-declared Out of Scope (retroactive repair of already-broken journeys).

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — no new queries added beyond what every other journey-creation path already fires | ✅ | Removed one raw query, added none — confirmed by code review |
| Security — same tenant/product scoping as the already-reviewed `handlePostJourney` pattern | ✅ | Direct pattern reuse, no new attack surface |
| Data integrity — closes a gap where journeys existed in Postgres with no way to complete their pipeline stages | ✅ | This IS the fix; verified via the AC4 reproduction |

---

## Metric Signal

No metrics apply — short-track story, parent feature's `metrics` array is empty.

---

## Outcome

**COMPLETE**

All 5 ACs satisfied with direct, automated reproduction of the exact reported bug. No deviations, no accepted gaps beyond the explicitly-scoped-out retroactive repair of already-broken journeys.

**Follow-up actions:**
1. The operator's own already-broken test journey (`58e606e9-...`) and the 2 earlier placeholder journeys remain permanently un-registerable — no action needed, they were always going to require a fresh "New feature" click after this fix. Owner: N/A (self-resolving via normal usage).

---

## DoD Observations

1. **This bug and its fix mirror `srf-s1`'s pattern almost exactly** (in-memory-Map-primary, Postgres/Redis-write-behind-only), but with a critical difference: `srf-s1`'s bug was a *timing* race (a deploy landing mid-flow); this one was a *structural* gap (the journey was never registered in memory at all, regardless of timing). Worth remembering when triaging future reports in this family — "does the data exist in Postgres but not reflect in behavior" always deserves checking whether the write path even goes through the shared in-memory store, before assuming it's a redeploy-timing issue.
2. **Confirmed a second instance of the mock-shape-divergence pattern this session** (jrf-s1's own test file hand-copied the handler's logic rather than calling the real function) — this is now the second time this exact category of test methodology gap has been found to mask a real bug (see `tir-s5`/`tir-s8` in this repo's own history). `/improve` candidate: a repo-wide grep for test files that redefine/reimplement a handler's logic locally instead of importing it, to find any other latent instances of this same masking pattern.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Register product-feature journeys in the shared in-memory store" (jrf-s2).
Check:
1. Does every AC row have a concrete evidence reference?
2. Does the test-fix note for check-psh-s4-navigation.js hold up -- was the OLD assertion genuinely testing buggy behavior, not a legitimate regression?
3. Is the outcome verdict consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
