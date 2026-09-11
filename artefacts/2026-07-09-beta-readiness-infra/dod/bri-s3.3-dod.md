# Definition of Done: Multi-user within one tenant journey spec

**PR:** https://github.com/heymishy/skills-repo/pull/483 ("bri-s3.3: Multi-user tenant journey E2E spec", merge commit `05d8a6d0`) | **Merged:** 2026-07-16
**Story:** artefacts/2026-07-09-beta-readiness-infra/stories/bri-s3.3-multi-user-tenant-journey.md
**Assessed by:** Claude (agent) -- retroactive DoD backlog pass, 2026-08-17
**Date:** 2026-08-17

*Note on PR number: the task brief supplied "PR #604," but git history shows #604 is `nis-s1` ("staging-safe named-identity stub for bri-s3.3/bri-s3.6"), a later, separate support PR that also touches this spec file's staging-auth fixtures. This story's own implementation and merge is PR #483 (`05d8a6d0`, 2026-07-16), confirmed via `git log` on `tests/e2e/bri-s3.3-multi-user-tenant-journey.spec.js`. Using #483 here as the accurate record.*

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — admin succeeds / engineer denied on a role-gated feature | **Closed 2026-08-21 by `rbg-s1`** (was: No — gap) | Originally: Test `AC1: admin (alice) succeeds on role-gated feature, engineer (bob) is denied` (`tests/e2e/bri-s3.3-multi-user-tenant-journey.spec.js:141-172`) only asserted both alice and bob can create/view a shared product (200 responses for both) — never a role-gated route, never a denial. `rbg-s1` (PR #751, merged 2026-08-21) rewrote this test to hit a real admin-gated route (`GET /admin/credits`): alice (admin) `200`, bob (engineer) `403`, re-run fresh against merged master. See DoD Observation #2. | Playwright E2E, re-verified fresh by `rbg-s1`'s own DoD | None remaining |
| AC2 — concurrent access does not corrupt shared state | Yes (loosely) | Test `AC2: concurrent access by alice and bob...` (lines 174-214) has both users create/view products in the shared tenant and cross-view each other's product, all returning 200 with no error. Not true concurrency (sequential `await`s, not parallel), but matches the AC's own reduced scope ("basic... safety, not a full collaborative-editing guarantee"). | Playwright E2E | Weak coverage (no race-condition induction) but consistent with the AC's stated bar. Untouched by `rbg-s1`, still passing (confirmed as part of `rbg-s1`'s AC3 full-suite re-run). |
| AC3 — viewer-role write attempt is denied | **Closed 2026-08-21 by `rbg-s1`** (was: No — gap) | Originally: Test `AC3: viewer-role write attempt is denied` (lines 216-230) contained no viewer login and no write attempt — a literal unimplemented placeholder. `rbg-s1` replaced it with a real assertion: `e2e-viewer` gets `403` on `GET /admin/credits`, re-run fresh against merged master. See DoD Observation #2. | Playwright E2E, re-verified fresh by `rbg-s1`'s own DoD | None remaining |
| AC4 — `@mocked`/`@multi-tenant` tags, zero real LLM calls | Yes | Spec file header carries both tags (line 1); every test in the file re-checks `/test/real-llm-call-count` is unchanged before/after. | Playwright E2E | None. |

---

## Scope Deviations

**Real, currently-open gap (not covered by any story-accepted out-of-scope item):** AC1 and AC3 -- the two ACs that specifically test role-boundary enforcement (the story's own stated primary purpose, and its named Security NFR) -- are not actually verified by the shipped spec. AC1's test exercises only the "both users can use the shared tenant" path, never a role-gated route or a denial assertion for the engineer role. AC3's test body is an unimplemented placeholder. This is distinct from the story's own accepted scope narrowing (GitHub-org-allowlist mode only, Google/email-added-teammate deferred to `2026-07-09-team-identity-roles`) -- that narrowing is about *which login mechanism* is exercised, not *whether role-denial is asserted at all*. The 2026-07-16 `decisions.md` entry ("viewer-role (AC3) is equally covered by the same fix as admin/engineer (AC1)") is about the underlying production role-resolution wiring (`tir-s9`) being fixed, not about the test file's own assertions -- read literally it could be mistaken for a claim that AC3 is test-covered; it is not. The verification script (`verification-scripts/bri-s3.3-multi-user-tenant-journey-verification.md`) that would have caught this via manual walkthrough was never filled in -- all three scenario results are blank checkboxes.

## Test Plan Coverage

This pass did not re-run the Playwright suite fresh (attempted run failed with a transform/loader error before producing results; consistent with this DoD backlog pass's lightweight-by-default depth policy, which reserves live E2E re-verification for layout-dependent-gap-flagged stories). Citing the last-recorded result instead: `.github/pipeline-state.json` records `testPlan.totalTests=6`, `testPlan.passing=6` (status: `written`), `acTotal=4`, `acVerified=4` for `bri-s3.3`. Direct reading of the spec source (above) shows that "6/6 passing" is real but structurally shallow for 2 of those 6 tests (the AC1 and AC4-baseline tests pass on assertions that don't touch role-gating, and the AC3 test passes trivially because it asserts nothing about its own AC) -- the recorded pass count is accurate as a CI-green signal but should not be read as proof AC1/AC3 behaviour is verified.

## NFR Status

| NFR | Status | Evidence |
|-----|--------|----------|
| Security | **Closed 2026-08-21 by `rbg-s1`** (was: Gap) | The story names this spec as "the primary regression guard against a role-boundary regression... treat any failure here as high-priority, not routine flake." AC1/AC3's gap meant the spec would not have caught a regression granting an engineer admin access, or letting a viewer write. `rbg-s1` fixed both assertions for real — the guard now genuinely functions as designed. |
| Performance | Met (assumed) | No evidence of suite-budget breach; not independently re-timed this pass. |
| Accessibility | N/A | Story states not applicable beyond the app's existing bar. |
| Audit | Met | No audit requirement beyond standard CI logging, per story. |

## Metric Signal

Story targets Metric 4 ("Risk-critical journeys have deterministic E2E coverage," target 5 of 5 journeys covered and tagged) from `artefacts/2026-07-09-beta-readiness-infra/benefit-metric.md`. At the structural level (spec file exists, is tagged `@mocked @multi-tenant`, and is CI-green) this is the 5th and final journey, nominally closing the metric. At the behavioural level the metric intends -- "deterministic coverage" of the risk -- 2 of this journey's 4 ACs (the role-boundary ones, which are the actual risk this journey exists to cover) are not really exercised, so Metric 4's "5 of 5" claim currently overstates the coverage this specific journey provides.

## Outcome

**COMPLETE WITH DEVIATIONS**

The deviation record above (AC1/AC3's original weak/placeholder assertions) is kept as an accurate historical account of what shipped at merge time — closed 2026-08-21, not retroactively erased.

**Follow-up actions:**
1. ~~Rewrite AC1's test to hit a real role-gated/admin-only route... Implement AC3's test body for real...~~ — done, `rbg-s1` (PR #751, merged 2026-08-21). See DoD Observation #2.
2. The manual verification script's blank scenario checkboxes were superseded by `rbg-s1`'s automated fix rather than filled in manually — the regression guard is now a real automated assertion, so the manual cross-check this action originally called for is no longer the mechanism closing the gap. Not pursued further.
3. Two items surfaced by `rbg-s1`'s own investigation remain open, tracked separately, not blocking this DoD: (a) `2026-08-21-viewer-role-no-enforcement` discovery artefact, still in "Draft — awaiting approval," documenting that no general viewer-role write-blocking enforcement exists anywhere in the codebase beyond the specific `requireAdmin` boundary this spec now tests; (b) whether any real production tenant currently has a viewer-role person assigned, to gauge (a)'s urgency — not yet checked.

---

## DoD Observations

1. Production longevity not independently confirmed this pass. The gap here is a test-authoring shortfall, not a confirmed production defect -- `tir-s9`'s role-resolution wiring fix is independently verified (by code read) in `decisions.md`'s 2026-07-16 entry, so the underlying role model likely works; this story's spec simply never asserts it for the two ACs that matter most.
2. **Backfilled 2026-09-11, following a repo-wide DoD-verification-method stocktake.** The AC1/AC3 test-authoring gap this DoD itself surfaced (2026-08-17) was closed 4 days later by `rbg-s1` (PR #751, merged 2026-08-21, own DoD: `artefacts/2026-08-18-bri-s3-3-role-boundary-guard-gap/dod/rbg-s1-dod.md`) — a dedicated short-track story created specifically to fix it. Both assertions now hit real role-gated routes with real 200/403 differentiation, re-verified fresh against merged master. No fresh Chrome or code work was needed for this backfill; `rbg-s1`'s own DoD already contained complete evidence. Worth noting: `rbg-s1`'s own implementation of a real AC1 test immediately surfaced two further, independent, previously-undetected issues in the code it exercises (one fixed inline, one routed to its own dedicated story, F12/`lrtc-s1`, a real privilege-escalation bug) — a concrete example of a placeholder/weak test hiding not just its own named gap but real bugs a correct test would have caught sooner.
