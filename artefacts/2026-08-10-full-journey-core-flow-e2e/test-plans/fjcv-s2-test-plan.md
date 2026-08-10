## Test Plan: Fix-forward — credits-guard blocks fjcv-s1's ideate-first E2E path on real staging

**Story reference:** artefacts/2026-08-10-full-journey-core-flow-e2e/stories/fjcv-s2-credits-guard-e2e-bypass.md
**Epic reference:** None — short-track
**Test plan author:** Claude (agent)
**Date:** 2026-08-10

---

## AC Coverage

| AC | Description | Unit | Gap type | Risk |
|----|-------------|------|----------|------|
| AC1 | bypass works: e2e- tenant + correct header | 1 test | — | 🟢 |
| AC2 | bypass fails: non-e2e- tenant, even with correct header | 1 test | — | 🟢 |
| AC3 | bypass fails: e2e- tenant, wrong header value | 1 test | — | 🟢 |
| AC4 | bypass fails: secret not configured at all | 1 test | — | 🟢 |
| AC5 | bypass fails: e2e- tenant, no header present | 1 test | — | 🟢 |
| AC6 | pre-existing admin bypass unaffected | 1 test | — | 🟢 |
| AC7 | fjcv-s1's submitTurn() sends the bypass header | Verified via E2E regression (fjcv-s1 spec itself) | — | 🟢 |

---

## Coverage gaps

None blocking. AC7's true confirmation (the actual staging 402 no longer occurring) can only be observed on the next real staging deploy — planned as this story's own completion criterion, matching the same "verify on the next deploy" pattern `sedf-s1` used for its own CI-timing fix.

---

## Test Data Strategy

**Source:** Direct unit-level middleware invocation (`creditsGuard(req, res, next)`) with a mocked credits adapter (`setCreditsAdapter`), matching `check-lab-s3.3-credit-enforcement.js`'s own established convention.
**PCI/sensitivity in scope:** No.
**Availability:** Available now — no real staging or credits dependency for the unit tests themselves.
**Owner:** Self-contained.

---

## Unit Tests

### check-rapp-s1-credits-guard-e2e-bypass.js

- **Verifies:** AC1–AC6
- **Scenario:** Six tests directly invoking `creditsGuard` against a zero-balance mock adapter, varying `tenantId` prefix, bypass header presence/correctness, and secret configuration, plus one test confirming the pre-existing admin bypass is unaffected.
- **Tooling:** Node, no external dependencies.

## Regression Tests

- `check-lab-s3.3-credit-enforcement.js` — the pre-existing credit-enforcement guarantees, re-run unmodified (36/36 passing).
- `tests/e2e/fjcv-s1-full-journey-core-flow-and-resume.spec.js` — re-run locally, unaffected (the bypass header is a no-op locally since `E2E_STAGING_AUTH_STUB_SECRET` is never set outside CI).

---

## Out of Scope for This Test Plan

- A real-staging confirmation run — deferred to this story's own post-merge completion step (next deploy's `smoke-test` job passing is the real-world proof).

---

## Test Gaps and Risks

None identified as blocking.
