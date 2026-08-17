# Definition of Done: Give admins a real control to lift a tenant's journey cap, separate from credits

**PR:** #672 (merge commit `41368538`) | **Merged:** 2026-08-06
**Story:** artefacts/2026-08-06-tenant-plan-admin-control/stories/tpac-s1-admin-plan-state-control.md
**Assessed by:** Claude (agent) -- retroactive DoD backlog pass, 2026-08-17
**Date:** 2026-08-17

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 -- `/admin/credits` shows plan+status as fields visibly distinct from credits balance | Yes | `adminCreditsGet: plan/status rendered as distinct fields from credits balance` | Unit (rendered HTML assertion) | None |
| AC2 -- Setting plan to `paid`/`active` via the new control lifts the journey cap (`checkJourneyCap` returns `{allowed: true, cap: null}`) | Yes | `adminSetPlanPost: setting plan paid/active lifts checkJourneyCap for that tenant` (unit) and `admin plan-set route + real journey.js gate: journey creation succeeds after admin lifts the cap` (integration, exercises the real `routes/journey.js` gate) | Unit + Integration | None |
| AC3 -- Credits-only adjustment does NOT lift the cap (regression guard) | Yes | `adjustBalanceWithAudit alone (no plan-state call) does NOT lift checkJourneyCap` | Unit | None |
| AC4 -- "Journey limit reached" page text names "plan", not credits, as the cause | Yes | `journey.js Journey-limit-reached page mentions "plan", not credits, as the cause` | Unit (rendered page body assertion) | None |

All 4 ACs map to named, passing tests in `tests/check-tpac-s1-admin-plan-state-control.js`. No AC lacks evidence.

---

## Scope Deviations

None. The story's own Out of Scope section explicitly excludes changes to the credits system itself and a self-serve (non-admin) plan-change path -- both remain untouched per `git show admin-credits.js` and the test plan's "Out of Scope for This Test Plan" section. This is accepted scope, not a gap.

---

## Test Plan Coverage

`check-tpac-s1-admin-plan-state-control.js`: **7 passed, 0 failed** (freshly re-run 2026-08-17). This matches the test plan's full inventory: 4 unit tests (AC1-AC4), 1 integration test (AC2, real gate-check path), and 2 NFR tests (Performance, Security) -- 7 tests total, all accounted for.

---

## NFR Status

| NFR | Status | Evidence |
|-----|--------|----------|
| Performance | Met | `setPlanState issues exactly one query against the tenant_plan adapter` -- single-row query, no N+1 |
| Security | Met | `requireAdmin + adminSetPlanPost: non-admin session is rejected identically to the existing adjust route` -- same `requireAdmin` gate as `/admin/credits` |
| Audit | Met, no dedicated test | `src/web-ui/routes/admin-credits.js` (`adminSetPlanPost`, line ~242) logs a structured line (`tenant`, `plan`, `status`, `setBy`) resolving admin identity via `req.session.login`/`userId`, never `req.session.accessToken` -- confirmed by direct code read. No new DB audit row was added (reuses `setPlanState` as-is, per the DoR contract's "no new adapter/table" constraint); this was a scoped implementation choice, not an oversight, and the test plan never specified an automated audit-log test. |
| Accessibility | Not independently tested | Story states WCAG 2.1 AA "matching the existing `/admin/credits` page's accessibility baseline" (reused pattern, no new mechanism). DoR (`H-E2E`) explicitly classified this story as having no CSS-layout-dependent ACs, so no visual-regression test was required or written. |

---

## Metric Signal

The story is short-track and does not reference a formal benefit-metric artefact -- the Benefit Linkage section states the metric directly: admin/operator unblock time for the journey-cap gate. No `/benefit-metric` artefact exists for this story to check actuals against; the claim rests on the story's own live-confirmed diagnosis (`checkJourneyCap` only reads `tenant_plan`, never touched by credit top-ups) and the shipped fix closes that exact gap per AC2/AC3 evidence above.

---

## Outcome

**COMPLETE**
**Follow-up actions:** None.

---

## DoD Observations

All 4 ACs have direct, named passing-test evidence with no gaps; both code reviews (`tpac-s1-review-1.md`, `tpac-s1-review-2.md`) closed at 0 HIGH/0 MEDIUM findings. Production longevity not independently confirmed beyond the merge itself (no incident or follow-up references found in later commit history).
