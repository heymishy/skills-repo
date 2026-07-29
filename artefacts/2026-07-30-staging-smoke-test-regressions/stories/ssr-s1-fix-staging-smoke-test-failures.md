## Story: Fix the E2E test gaps blocking every staging-deploy smoke test

**Epic reference:** None — short-track (bug fix, per CLAUDE.md's short-track path)
**Discovery reference:** None — short-track skips discovery
**Benefit-metric reference:** None — short-track skips benefit-metric

## User Story

As the **Platform operator**,
I want **the post-merge staging-deploy smoke test to actually pass, so `promote-to-prod` can run again**,
So that **shipped work can reach production, instead of every merge silently failing the smoke-test gate with no one reviewing this non-required workflow**.

## Benefit Linkage

**Metric moved:** None formal (short-track infra/test fix, no benefit-metric artefact).
**How:** Directly unblocks the `promote-to-prod` gate, which has not run successfully since at least 2026-07-28 — every `staging-deploy` run in that window failed at the smoke-test stage, confirmed via `gh run list`/`gh run view` across 20+ consecutive runs, including runs with zero application-code changes.

## Architecture Constraints

- No application code (`src/web-ui/`) changes — all three fixes are to E2E test files (`tests/e2e/`) only. Confirmed the underlying application behaviour in each case is correct; only the tests were stale.
- Reuses this codebase's own existing `serlb-s1` rate-limit-bypass mechanism (`tests/e2e/fixtures/staging-auth.js`) rather than inventing a new bypass or weakening the real per-IP limiter.

## Dependencies

- **Upstream:** None.
- **Downstream:** None. Unblocks `promote-to-prod` for all future merges once this fix ships.

## Acceptance Criteria

**AC1:** Given `bri-s3.2-signup-onboarding-journey.spec.js` signs up a fresh email/password user, When it runs against real `wuce-staging` alongside other specs in the same CI run, Then its signup call carries the `e2e-test-` email prefix and the `x-e2e-rate-limit-bypass` header (matching the existing `serlb-s1` bypass gates already built into `routes/auth-email.js`), so it no longer trips the real 10-attempt/5-minute per-IP signup limiter.

**AC2:** Given `definition.success.json`'s mock artefact fixture contains an auto-extractable story heading (`# Story mock-fixture.1 — Mock story`), When `bri-s3.2`'s `driveJourneyToDefinitionOfReady` helper completes the definition stage's gate-confirm, Then the test asserts the actual (correct) auto-skip-to-review redirect destination, instead of the stale manual `/journey/:id/stories` confirm-page expectation.

**AC3:** Given `/dashboard` now renders the product-aware-navigation sidebar (pan-s1) listing product names alongside the dashboard's own product card, When `a3-product-feature-ideate-canvas.spec.js`'s AC1 test checks the product name is visible on `/dashboard`, Then the locator is scoped to the page body (`<main>`), so it resolves to exactly the dashboard card element, not both the card and the sidebar entry.

**AC4 (regression guard):** Given these three fixes are test-only, When the existing unit test suite runs, Then it shows the same pre-existing baseline failure count (37 files, per `tests/known-baseline-failures.json`) with zero new regressions — these changes touch only `tests/e2e/*.spec.js` files that are not part of the unit suite `run-all-tests.js` collects.

## Out of Scope

- Any other failures observed in the same staging-deploy runs (e.g. `bri-s3.3`'s real-LLM-call-count mismatch) that were not root-caused during this investigation — if they persist after this fix ships and the next `staging-deploy` run is observed, they are a separate follow-up, not silently bundled into this fix.
- Any change to the real per-IP rate limiter's threshold or window — this fix only makes the E2E test correctly use the existing bypass, it does not weaken production rate-limiting.
- Retroactively fixing every historical failed `staging-deploy` run — this fix is forward-looking only.

## NFRs

- **Performance:** Not applicable — test-only changes.
- **Security:** The rate-limit bypass reused here (AC1) is the existing, already-reviewed `serlb-s1` triple-gate mechanism (staging-only secret + header + `e2e-test-`-tagged email) — no new bypass surface is introduced.
- **Accessibility:** Not applicable.
- **Audit:** Not applicable.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
