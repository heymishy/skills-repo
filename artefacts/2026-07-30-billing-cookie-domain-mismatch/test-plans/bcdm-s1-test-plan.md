## Test Plan: Fix bri-s3.5 AC2's browser session cookie so it actually attaches to real staging requests

**Story reference:** artefacts/2026-07-30-billing-cookie-domain-mismatch/stories/bcdm-s1-billing-cookie-domain-mismatch.md

## AC Coverage

| AC | Description | Unit | Verification | Risk |
|----|-------------|------|--------------|------|
| AC1 | Local default (no E2E_BASE_URL) resolves domain=localhost, secure=false | — | Code review of the diff (URL parsing logic); syntax-checked via `node -c` | 🟢 |
| AC2 | Staging E2E_BASE_URL resolves domain=wuce-staging.fly.dev, secure=true | — | Code review of the diff; the same URL-parsing logic is deterministic given the input | 🟢 |
| AC3 | Next staging-deploy run: AC2 passes, all 21 tests pass | — | Observe the next staging-deploy run's smoke-test job result | 🟡 |
| AC4 | No unit-test regressions | — | Full local suite run compared against `tests/known-baseline-failures.json` | 🟢 |

## Coverage gaps

This is a pure test-fixture fix inside an E2E spec that specifically targets behaviour that only diverges between local and real-staging environments (cookie domain matching) — by definition, it cannot be verified by running the spec locally alone, since the local run was never broken in the first place (`domain: 'localhost'` correctly matched `http://localhost:3999`). Real confirmation is exclusively the next staging-deploy run.

## Test Data Strategy

None new — reuses the existing `E2E_BASE_URL` environment variable already used throughout the E2E suite for base-URL configuration (see `playwright.config.js` and sibling spec files' own `baseURL: process.env.E2E_BASE_URL || 'http://localhost:3999'` pattern).

## NFR Tests

None beyond the story's own stated NFRs.

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Cannot locally reproduce the staging-only cookie-domain mismatch | The bug only manifests when `E2E_BASE_URL` differs from `localhost`, which local runs never exercise | Observe the next staging-deploy run's AC2 result specifically; this is the definitive verification for this class of fix, consistent with every fix in this investigation thread |
| A different, still-undiscovered issue could exist in AC2 beyond the cookie domain | Three separate root causes (tenant-ID pollution, webhook idempotency, cookie domain) have now been found sequentially in this one file | If AC2 still fails after this merges with a genuinely new symptom, treat it as a new investigation rather than assuming this fix was incomplete |
