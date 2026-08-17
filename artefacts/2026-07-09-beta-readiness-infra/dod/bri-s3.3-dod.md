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
| AC1 — admin succeeds / engineer denied on a role-gated feature | **No — gap** | Test `AC1: admin (alice) succeeds on role-gated feature, engineer (bob) is denied` (`tests/e2e/bri-s3.3-multi-user-tenant-journey.spec.js:141-172`) only asserts both alice and bob can create/view a shared product (200 responses for both). It never accesses an admin-only/role-gated route and never asserts bob (engineer) is denied anything. | Playwright E2E (recorded pass, not behaviourally verifying the AC) | Test name and AC text describe role differentiation; test body does not exercise it. See Scope Deviations. |
| AC2 — concurrent access does not corrupt shared state | Yes (loosely) | Test `AC2: concurrent access by alice and bob...` (lines 174-214) has both users create/view products in the shared tenant and cross-view each other's product, all returning 200 with no error. Not true concurrency (sequential `await`s, not parallel), but matches the AC's own reduced scope ("basic... safety, not a full collaborative-editing guarantee"). | Playwright E2E | Weak coverage (no race-condition induction) but consistent with the AC's stated bar. |
| AC3 — viewer-role write attempt is denied | **No — gap** | Test `AC3: viewer-role write attempt is denied` (lines 216-230) contains no viewer login and no write attempt; the code comment reads "For now, this is a placeholder that demonstrates the structure." It only re-checks the mock-LLM-call counter is unchanged. | Playwright E2E (recorded pass; asserts nothing about the AC) | Placeholder test — zero behavioural coverage of AC3. See Scope Deviations. |
| AC4 — `@mocked`/`@multi-tenant` tags, zero real LLM calls | Yes | Spec file header carries both tags (line 1); every test in the file re-checks `/test/real-llm-call-count` is unchanged before/after. | Playwright E2E | None. |

---

## Scope Deviations

**Real, currently-open gap (not covered by any story-accepted out-of-scope item):** AC1 and AC3 -- the two ACs that specifically test role-boundary enforcement (the story's own stated primary purpose, and its named Security NFR) -- are not actually verified by the shipped spec. AC1's test exercises only the "both users can use the shared tenant" path, never a role-gated route or a denial assertion for the engineer role. AC3's test body is an unimplemented placeholder. This is distinct from the story's own accepted scope narrowing (GitHub-org-allowlist mode only, Google/email-added-teammate deferred to `2026-07-09-team-identity-roles`) -- that narrowing is about *which login mechanism* is exercised, not *whether role-denial is asserted at all*. The 2026-07-16 `decisions.md` entry ("viewer-role (AC3) is equally covered by the same fix as admin/engineer (AC1)") is about the underlying production role-resolution wiring (`tir-s9`) being fixed, not about the test file's own assertions -- read literally it could be mistaken for a claim that AC3 is test-covered; it is not. The verification script (`verification-scripts/bri-s3.3-multi-user-tenant-journey-verification.md`) that would have caught this via manual walkthrough was never filled in -- all three scenario results are blank checkboxes.

## Test Plan Coverage

This pass did not re-run the Playwright suite fresh (attempted run failed with a transform/loader error before producing results; consistent with this DoD backlog pass's lightweight-by-default depth policy, which reserves live E2E re-verification for layout-dependent-gap-flagged stories). Citing the last-recorded result instead: `.github/pipeline-state.json` records `testPlan.totalTests=6`, `testPlan.passing=6` (status: `written`), `acTotal=4`, `acVerified=4` for `bri-s3.3`. Direct reading of the spec source (above) shows that "6/6 passing" is real but structurally shallow for 2 of those 6 tests (the AC1 and AC4-baseline tests pass on assertions that don't touch role-gating, and the AC3 test passes trivially because it asserts nothing about its own AC) -- the recorded pass count is accurate as a CI-green signal but should not be read as proof AC1/AC3 behaviour is verified.

## NFR Status

| NFR | Status | Evidence |
|-----|--------|----------|
| Security | **Gap** | The story names this spec as "the primary regression guard against a role-boundary regression... treat any failure here as high-priority, not routine flake." Given AC1/AC3's gap above, the spec currently would **not** catch a regression that granted an engineer admin access, or let a viewer write -- the guard is not functioning as designed. |
| Performance | Met (assumed) | No evidence of suite-budget breach; not independently re-timed this pass. |
| Accessibility | N/A | Story states not applicable beyond the app's existing bar. |
| Audit | Met | No audit requirement beyond standard CI logging, per story. |

## Metric Signal

Story targets Metric 4 ("Risk-critical journeys have deterministic E2E coverage," target 5 of 5 journeys covered and tagged) from `artefacts/2026-07-09-beta-readiness-infra/benefit-metric.md`. At the structural level (spec file exists, is tagged `@mocked @multi-tenant`, and is CI-green) this is the 5th and final journey, nominally closing the metric. At the behavioural level the metric intends -- "deterministic coverage" of the risk -- 2 of this journey's 4 ACs (the role-boundary ones, which are the actual risk this journey exists to cover) are not really exercised, so Metric 4's "5 of 5" claim currently overstates the coverage this specific journey provides.

## Outcome

**COMPLETE WITH DEVIATIONS**
**Follow-up actions:** Rewrite AC1's test to hit a real role-gated/admin-only route (e.g. the admin/credits panel referenced in the story) and assert the engineer session receives a denial (403/redirect), not just that both users can use shared, non-gated product routes. Implement AC3's test body for real: log in as the seeded viewer-role person (`VIEWER_PERSON_ID`, already declared in the spec but unused) and assert a write attempt is denied. Once both are real, run the (currently blank) manual verification script scenarios 1 and 3 to cross-check. Re-assess the Security NFR status once fixed.

## DoD Observations

Production longevity not independently confirmed this pass. The gap here is a test-authoring shortfall, not a confirmed production defect -- `tir-s9`'s role-resolution wiring fix is independently verified (by code read) in `decisions.md`'s 2026-07-16 entry, so the underlying role model likely works; this story's spec simply never asserts it for the two ACs that matter most.
