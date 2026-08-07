# Definition of Done: Fix bri-s3.5 AC2's browser session cookie so it actually attaches to real staging requests

**PR:** https://github.com/heymishy/skills-repo/pull/649 | **Merged:** 2026-07-30
**Story:** artefacts/2026-07-30-billing-cookie-domain-mismatch/stories/bcdm-s1-billing-cookie-domain-mismatch.md
**Test plan:** artefacts/2026-07-30-billing-cookie-domain-mismatch/test-plans/bcdm-s1-test-plan.md
**DoR artefact:** artefacts/2026-07-30-billing-cookie-domain-mismatch/dor/bcdm-s1-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-07-30

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | Local default (no `E2E_BASE_URL`) resolves `domain=localhost`, `secure=false` | Code review of `new URL()` parsing logic | None |
| AC2 | ✅ | `E2E_BASE_URL=https://wuce-staging.fly.dev` resolves `domain=wuce-staging.fly.dev`, `secure=true` | Code review; deterministic given `URL` parsing semantics | None |
| AC3 | ✅ | The next staging-deploy run showed the smoke-test job passing in full — all 21 tests in `bri-s3.5-billing-journey.spec.js` green, no `Target page, context or browser has been closed` error | Direct observation of staging-deploy run 30519236374 — `Staging smoke test (@mocked)` conclusion: success | None |
| AC4 | ✅ | Full local suite: same documented baseline, zero new regressions | `run-all-tests.js` full suite run | None |

---

## Scope Deviations

None.

---

## Test Plan Coverage

**Tests from plan implemented:** N/A (code-review-verified per test plan, real-staging-only verification)
**Tests passing in CI:** ✅ — direct, complete confirmation

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| Next staging-deploy run: full `bri-s3.5` smoke test | — | ✅ | First time in this entire investigation chain this spec passed in full against real staging |
| `promote-to-prod` reachability | — | ✅ | Gate transitioned from `skipped` to `waiting` (manual approval), then to `success` after operator approval — production deploy confirmed live and serving correct content |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Security — `secure` flag now correctly derived, minor correctness improvement | ✅ | Code review |

---

## Metric Signal

No benefit-metric artefact — short-track bug fix, not applicable.

---

## Outcome

**COMPLETE**

**Follow-up actions:** None. This was the final layer in the 10-story `wuce-staging` investigation chain. `promote-to-prod` ran to completion and the operator confirmed the live production site (`https://skills-framework.fly.dev`) is serving correctly.

---

## DoD Observations

1. **Root cause was structurally deterministic, not flaky:** a cookie hardcoded to `domain: 'localhost'`, copied from a fixture (`fixtures/auth.js`'s `withAuth`) that is explicitly guarded to never run against staging. This bug had been present since the spec was first written and had never once passed against real staging — every earlier failure in this file masked it. Tagging as an `/improve` candidate: a repo-wide audit of `@mocked`-tagged spec files for the same `domain: 'localhost'` pattern (copied from local-only fixtures) would catch any sibling instances before they cause the same silent, deterministic staging failure. `design-definition-canvas-render.spec.js` uses the same pattern but is not `@mocked`-tagged, so it was out of scope here but worth a follow-up look.
2. **Investigation chain closure:** this DoD batch (ssr-s1 through bcdm-s1, 10 stories) documents a full day's sequential root-cause investigation into a persistently-broken `staging-deploy` → `promote-to-prod` pipeline. Each story was only discoverable once the prior one shipped, confirming the value of the "fix forward, observe next run" loop this session followed throughout, rather than attempting to diagnose all layers upfront.
