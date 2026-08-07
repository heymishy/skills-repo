# Definition of Done: Fix "Delete feature" to redirect back to the owning product, not the generic journeys list

**PR:** https://github.com/heymishy/skills-repo/pull/631 | **Merged:** 2026-07-29
**Story:** artefacts/2026-07-29-delete-feature-redirect-fix/stories/dfr-s1-fix-delete-feature-redirect.md
**Test plan:** artefacts/2026-07-29-delete-feature-redirect-fix/test-plans/dfr-s1-fix-delete-feature-redirect-test-plan.md
**DoR artefact:** artefacts/2026-07-29-delete-feature-redirect-fix/dor/dfr-s1-dor.md
**Assessed by:** Copilot (autonomous, short-track)
**Date:** 2026-07-29

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `src/web-ui/routes/features.js:247-249` (merged, on master) computes `deletePostRedirect = '/products/' + journeyForPage.productId` when a productId is present; `tests/check-dfr-s1-fix-delete-feature-redirect.js` AC1 test passes against the real `handleGetFeatureArtefacts` handler | Automated test (`node tests/check-dfr-s1-fix-delete-feature-redirect.js`), re-run against merged master code | None |
| AC2 | ✅ | `src/web-ui/adapters/journey-store-pg.js:165,174` (merged, on master): `listJourneys()`'s SELECT now includes `product_id` and maps it to `productId` on the returned object. Unit test (fake pool double, asserts real SQL text and mapping) re-run against merged code: pass. Real-Postgres integration test (seeds a real `products` row + `journeys` row referencing it, calls the real `listJourneys()`) was confirmed passing against real `wuce-staging` Postgres earlier this session, during dfr-s1's own test-authoring phase | Automated unit test (re-confirmed today) + automated integration test (confirmed earlier this session against real staging Postgres; not re-run at DoD time — `flyctl auth` session was unavailable in this environment at DoD time, so a fresh direct re-check could not be performed without interactive re-login) | None — see DoD Observations for the one procedural note on today's re-verification limitation |
| AC3 | ✅ | `src/web-ui/routes/features.js:247-249`: the same ternary falls back to `/journey` when `journeyForPage.productId` is falsy, never producing `/products/undefined`. Test re-run against merged code: pass | Automated test, re-run against merged master code | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor.
Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

---

## Scope Deviations

None. The merged PR touches only `src/web-ui/routes/features.js` (redirect target computation) and `src/web-ui/adapters/journey-store-pg.js` (`listJourneys()` SELECT/mapping + a test-only `_setPoolForTesting` seam) plus the new test file — matching the story's stated scope exactly. No changes to the delete confirmation dialog, the DELETE endpoint's behaviour, CSRF/audit handling, or `feature_module_assignments` cleanup — all explicitly out of scope and confirmed untouched.

---

## Test Plan Coverage

**Tests from plan implemented:** 4 / 4
**Tests passing in CI:** 4 / 4 (3 unit-level always run; 1 real-Postgres integration test conditionally runs when `DATABASE_URL` is set, consistent with this repo's established convention for integration tests)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1 (unit): redirect target is `/products/:productId` | ✅ | ✅ | Re-run against merged master code today |
| AC3 (unit): fallback to `/journey`, never `/products/undefined` | ✅ | ✅ | Re-run against merged master code today |
| AC2 (unit): `listJourneys()` selects and maps `product_id` | ✅ | ✅ | Re-run against merged master code today, via `_setPoolForTesting` fake-pool double |
| AC2 (integration): real Postgres round-trip | ✅ | ✅ (confirmed earlier this session) / SKIP (today, no `DATABASE_URL`) | Skips gracefully without `DATABASE_URL`, matching this repo's established pattern for optional real-DB integration tests; not a gap |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — one additional column in an already-existing SELECT, negligible cost | ✅ | Confirmed by code review: `product_id` is added to the existing single-row-per-journey SELECT in `listJourneys()`, no additional round-trip introduced |
| Security — no new exposure (`productId` already tenant-scoped, operator's own data) | ✅ | Confirmed by code review: no new field is exposed to any actor who could not already see it via the existing journey object |
| Accessibility — no new visible UI beyond redirect destination | ✅ | Confirmed — the only user-visible change is the URL navigated to after a successful delete |
| Audit — no change to what's logged for the delete action | ✅ | Confirmed — the DELETE endpoint's own logging/audit path is untouched; only the client-side post-success redirect target changed |

---

## Metric Signal

No metrics array entries reference this story (`2026-07-29-delete-feature-redirect-fix` has an empty `metrics: []` in `pipeline-state.json` — short-track UX fix, no benefit-metric artefact, as stated in the story). Nothing to record in this section.

---

## Outcome

**COMPLETE**

**Follow-up actions:** None.

---

## DoD Observations

1. **Procedural note, not a defect:** at DoD time, `flyctl auth` had no active access token in this environment, so AC2's real-Postgres integration test could not be freshly re-run against `wuce-staging` today. This is not a coverage gap — the integration test was already run and confirmed passing against real `wuce-staging` Postgres during dfr-s1's own test-authoring phase earlier this session (seeded a real `products` row + a real `journeys` row referencing it via its UUID FK, then asserted the real `listJourneys()` function returns the correct `productId`). The unit-level equivalent (fake-pool double asserting the real SQL text and mapping logic) was re-run today against the merged code and passes. No `/improve` action needed; noting only for traceability since this DoD run did not re-execute every test in the plan against live infrastructure.
2. **Cross-story note:** this story's PR (#631) surfaced an unrelated, separate CI defect while its checks ran — the "Run assurance gate" check failed because the feature branch's own `pipeline-state.json` was stale relative to master (missing the bookkeeping commits that were pushed directly to master per this repo's no-standalone-PR-for-bookkeeping convention), so `trace-report.js --collect --feature ...` could not resolve the feature. Fixed by rebasing the branch onto `origin/master` and force-pushing before merge; all checks passed cleanly afterward. This is a structural gap worth a `/improve` candidate: any bookkeeping-only commit pushed directly to master during an open PR's lifetime will make that PR's own `pipeline-state.json`-dependent CI checks fail until the branch is rebased. Not fixed as part of this story (out of scope) — logged here for traceability and flagged as an `/improve` candidate for a future session.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Fix delete-feature redirect to the owning product, not the generic journeys list" (dfr-s1).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
