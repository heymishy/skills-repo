# Definition of Done: Require a connected repo before a new product can start its first journey

**PR:** https://github.com/heymishy/skills-repo/pull/678 | **Merged:** 2026-08-07
**Story:** artefacts/2026-08-06-durable-artefact-storage/stories/das-s2-require-connected-repo-for-new-products.md
**Test plan:** artefacts/2026-08-06-durable-artefact-storage/test-plans/das-s2-test-plan.md
**Verification script:** artefacts/2026-08-06-durable-artefact-storage/verification-scripts/das-s2-verification.md
**Review:** artefacts/2026-08-06-durable-artefact-storage/review/das-s2-review-2.md (0 HIGH findings)
**Assessed by:** Claude (agent) — retroactive DoD backlog pass, 2026-08-17
**Date:** 2026-08-17

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — a brand-new product (zero journeys, no connected repo) is blocked from starting its first journey with an actionable message | ✅ | `check-das-s2-require-connected-repo.js` | Automated test, re-run fresh 2026-08-17 | None |
| AC2 — connecting a repo via the picker then retrying proceeds normally | ✅ | Same file, `Integration: pickerConnectThenJourneyStart_endToEnd` | Automated test, re-run fresh | None |
| AC3 — a product with ≥1 existing journeys but no repo is never blocked (journey-count-based, not creation-date-based) | ✅ | Same file | Automated test, re-run fresh | None |
| AC4 — a brand-new product that already has a connected repo hits no gate friction | ✅ | Same file, `AC4: brandNewProductWithRepoAlreadyConnected_noGateFriction` | Automated test, re-run fresh | None |

---

## Scope Deviations

None identified in this retroactive pass. Story's own Out of Scope items (no new repo-connection UI, no retroactive migration of existing repo-less products) match the delivered scope exactly.

---

## Test Plan Coverage

**Tests passing:** 7/7 (`check-das-s2-require-connected-repo.js`), re-run fresh 2026-08-17 — matches the test-plan's originally-recorded 7/7 exactly, no drift.
**Gaps:** None identified.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance: gate check is a single existing-column read, <50ms | ✅ | `NFR: gateCheckLatency_singleQuery`, re-run fresh, passing |
| Accessibility: WCAG 2.1 AA floor for the new blocking message | ✅ | `NFR: blockingMessage_semanticStructure`, re-run fresh, passing |

---

## Metric Signal

**Metric:** Repo-connection-required coverage (m2), target 100% of new products, baseline 0%.
**Status:** Gate shipped and tested; no fresh production-usage measurement taken in this pass. `contributingStories` for m2 was not populated at feature level — same minor bookkeeping gap noted in `das-s1`'s DoD, not independently re-corrected here.

---

## Outcome

**COMPLETE**

**Follow-up actions:** None required.

---

## DoD Observations

1. ~10 days live in production, no incidents reported.
2. Test count unchanged since merge (7/7 both then and now) — no drift to reconcile, unlike `das-s1`'s sibling story.
