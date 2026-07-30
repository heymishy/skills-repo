## Story: Fix bri-s3.4's own rate-limit bypass gap (same class of fix as ssr-s1)

**Epic reference:** None — short-track (bug fix, per CLAUDE.md's short-track path)
**Discovery reference:** None — short-track skips discovery
**Benefit-metric reference:** None — short-track skips benefit-metric

## User Story

As the **Platform operator**,
I want **`bri-s3.4-cross-tenant-isolation-journey.spec.js`'s own signup calls to correctly use the existing rate-limit bypass, the same way ssr-s1 fixed `bri-s3.2`**,
So that **the last remaining known cause of `promote-to-prod` staying blocked is resolved**.

## Background / Investigation

rlld-s2's merge fixed the real-LLM-call leak; the very next staging-deploy run confirmed `Post-deploy real-staging E2E confirmation` now passes, but `Staging smoke test (@mocked)` still failed — this time on `bri-s3.4-cross-tenant-isolation-journey.spec.js`: `Error: a signup should redirect to /welcome, Expected: 302, Received: 429`.

`ssr-s1` (earlier this session) fixed the exact same gap in `bri-s3.2-signup-onboarding-journey.spec.js` — a local `uniqueEmail()` helper not using the `e2e-test-` prefix, and a signup POST never sending the `x-e2e-rate-limit-bypass` header, both required by the existing `serlb-s1` bypass carve-out (`routes/auth-email.js`). `bri-s3.4` has its own, separately-defined `uniqueEmail()`/`newTenantSession()` helpers with the identical gap — it was simply never fixed alongside `bri-s3.2`, since `ssr-s1`'s own investigation only looked at the specific failure it was chasing at the time. `bri-s3.4` creates **two** tenant sessions per test (tenant A and tenant B), so it exhausts the real per-IP limiter roughly twice as fast as `bri-s3.2` did.

Confirmed via `grep -ln "function uniqueEmail" tests/e2e/bri-s3.*.js` that only `bri-s3.2` (already fixed) and `bri-s3.4` (fixed by this story) ever defined their own local email-generation helper — no other spec file in this family has the same gap.

## Architecture Constraints

- No application code changes — test-only fix, identical shape to `ssr-s1`.
- Reuses the existing `serlb-s1` bypass mechanism (`e2e-test-` email prefix + `x-e2e-rate-limit-bypass` header, both already exported from `tests/e2e/fixtures/staging-auth.js`) — no new bypass surface introduced.

## Dependencies

- **Upstream:** `ssr-s1` (merged), `rlld-s2` (merged) — this was the next layer visible only once both of those landed.
- **Downstream:** None. Should be the final fix needed to unblock `promote-to-prod`.

## Acceptance Criteria

**AC1:** Given `bri-s3.4-cross-tenant-isolation-journey.spec.js`'s `uniqueEmail(label)` helper, When it generates an email, Then the result is prefixed with `e2e-test-`, matching the convention required by the `serlb-s1` bypass's third gate.

**AC2:** Given `newTenantSession(label)`'s signup POST to `/auth/email/signup`, When the request is sent, Then it carries the `x-e2e-rate-limit-bypass` header (populated from `STUB_SECRET`) whenever `hasStubSecret()` is true — identical to the fix already applied to `bri-s3.2`.

**AC3 (regression guard):** Given this is a test-only change, When the existing unit test suite runs, Then it shows the same pre-existing baseline failure count (37 files) with zero new regressions — this file is not collected by `run-all-tests.js`'s glob.

## Out of Scope

- Any other still-unknown failures in the smoke-test suite not yet observed — if a new, different failure appears on the next staging-deploy run, that is a separate follow-up, not silently bundled here.
- Re-investigating bri-s3.3 or bri-s3.5/s3.6 — confirmed via grep that neither defines its own local `uniqueEmail()`; any of their own failures observed earlier this session were consistent with cascading effects from bri-s3.2/bri-s3.4's own rate-limit exhaustion, not a separate bug in those files themselves.

## NFRs

- **Performance:** Not applicable — test-only.
- **Security:** Reuses the existing, already-reviewed bypass mechanism — no new surface.
- **Accessibility:** Not applicable.
- **Audit:** Not applicable.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
