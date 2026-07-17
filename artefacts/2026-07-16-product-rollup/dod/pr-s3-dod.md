# Definition of Done: Show last-synced freshness and a manual refresh action

**PR:** https://github.com/heymishy/skills-repo/pull/491 | **Merged:** 2026-07-17
**Story:** artefacts/2026-07-16-product-rollup/stories/pr-s3.md
**Test plan:** artefacts/2026-07-16-product-rollup/test-plans/pr-s3-test-plan.md
**DoR artefact:** artefacts/2026-07-16-product-rollup/dor/ (pr-s3 sign-off)
**Assessed by:** Claude (agent-run DoD, per skills/definition-of-done/SKILL.md)
**Date:** 2026-07-17

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — shows a human-readable last-synced time | ✅ | `check-pr-s2-products-route.js` "_renderProductView: shows human-readable last-synced time (AC1)"; `check-pr-s2-product-rollup.js` T5/T6 cover the underlying sync-in-progress state machine | Automated test | None |
| AC2 — clicking Refresh triggers a new sync and updates timestamp + rendered values | ✅ | `check-pr-s2-products-route.js` "[pr-s3] AC2 — POST /products/:id/sync triggers a new sync and returns the updated rollup" | Automated test | None |
| AC3 — a never-synced product shows a clear "Not yet synced" state with a visible first-sync action | ✅ | `check-pr-s2-products-route.js` "_renderProductView: shows 'Not yet synced' when no cache row exists (AC3)" | Automated test | None |
| AC4 — a Refresh in progress shows a loading indicator and disables the Refresh action (no duplicate concurrent syncs) | ✅ | `check-pr-s2-products-route.js` "[pr-s3] AC4 — a second concurrent POST /products/:id/sync for the same product is rejected (409)"; "_renderProductView: Refresh control is disabled while a sync is in progress (AC4)"; `check-pr-s2-product-rollup.js` T5 "triggerProductSync rejects a concurrent second call for the same product_id", T6 "clears the in-flight flag after a failed sync" | Automated test | None |

---

## Scope Deviations

None. Automatic change-detection and background/scheduled sync were correctly left out, per the story's Out of Scope section and discovery's MVP scope item 6.

---

## Test Plan Coverage

**Tests from plan implemented:** 15 / 15
**Tests passing in CI:** confirmed passing

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| `check-pr-s2-products-route.js` (AC1, AC2, AC3, AC4 — routing/rendering) | ✅ | ✅ (22 passed, 0 failed, combined suite) | |
| `check-pr-s2-product-rollup.js` (AC4 — concurrency guard) | ✅ | ✅ (29 passed, 0 failed, combined suite) | |

**Gaps (tests not implemented):** None.

**CSS-layout-dependent Acceptance Criteria audit:** the story's NFRs require the Refresh action's loading-state feedback to appear within 200ms and to be keyboard-accessible/not colour-only — these are timing and accessibility requirements, not pixel/visual-layout requirements, and are asserted via the disabled-attribute and content-presence checks above rather than a screenshot comparison. `hasLayoutDependentGaps: false` is correct; no automated visual-regression test or RISK-ACCEPT is required for this story.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — Refresh loading-state feedback within 200ms of click, independent of sync duration | ⚠️ | The disabled/in-progress state is asserted functionally (test above); actual wall-clock latency of the UI feedback was not measured in this session — recorded as a manual-verification gap below |
| Security — not applicable beyond pr-s2's own NFRs (presentation only) | ✅ | Confirmed — no new data access introduced |
| Accessibility — Refresh button/timestamp keyboard-accessible, not colour-only | ✅ | Story's Architecture Constraints reference MC-SEC-01 (safe DOM/templating); disabled-attribute-based state (not colour-only) confirmed in AC4 evidence |
| Audit — not applicable beyond pr-s2's own sync-attempt logging | ✅ | Confirmed — no new audit surface introduced |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Metric 2 — Freshness is visible and refreshable, never silently stale | ✅ | Now — pr-s3 delivers this metric's entire target directly, and both contributing stories (pr-s2, pr-s3) are merged | `not-yet-measured` pending operator's manual test: change a feature's state in the connected repo, trigger Refresh, confirm both timestamp and rendered rollup update |

---

## Outcome

**COMPLETE WITH DEVIATIONS**

**Follow-up actions:**
1. Operator (Hamish King) to manually time the Refresh loading-state feedback against the 200ms NFR target during the Metric 2 verification pass — no automated timing test exists for this NFR.
2. Operator to perform Metric 2's manual verification (see Metric Signal above).

---

## DoD Observations

None beyond what's captured in pr-s2's DoD (shared underlying test files).

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Show last-synced freshness and a manual refresh action" (pr-s3).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
