## Story: Fix bri-s3.5 AC2's browser session cookie so it actually attaches to real staging requests

**Epic reference:** None — short-track (bug fix, per CLAUDE.md's short-track path)
**Discovery reference:** None — short-track skips discovery
**Benefit-metric reference:** None — short-track skips benefit-metric

## User Story

As the **Platform operator**,
I want **`bri-s3.5-billing-journey.spec.js`'s AC2 test's browser-based page navigation to carry a valid session on real staging, not just locally**,
So that **the last remaining failure in this billing spec is resolved and `promote-to-prod` can finally run to completion**.

## Background / Investigation

`seic-s1`'s merge fixed the webhook-event idempotency collision — the next staging-deploy run showed 20 of 21 `@mocked` tests in `bri-s3.5-billing-journey.spec.js` passing, including AC1, AC3, and AC4 (all previously failing, all now correctly reflecting paid/past_due/canceled state). Only AC2 ("hitting the usage limit blocks with a clear, human-readable error in the UI") still failed, with `Error: apiRequestContext.post: Target page, context or browser has been closed`, thrown from `withTenantCap`'s `finally` block teardown call.

That error is a downstream symptom, not the real fault: it fires because Playwright's own test-level timeout was reached and the browser context was torn down before the `finally` block's cleanup request could run. The actual fault is earlier in the test body: AC2 manually adds a browser cookie via `page.context().addCookies([{ name: 'session_id', ..., domain: 'localhost', path: '/' }])`, then calls `page.goto('/journey')`.

Root cause (confirmed via code review): this `domain: 'localhost'` pattern was copied from `tests/e2e/fixtures/auth.js`'s `withAuth` fixture — but that fixture is explicitly guarded (`if (process.env.NODE_ENV !== 'test') throw ...`) and never runs against real staging. `bri-s3.5-billing-journey.spec.js` IS tagged `@mocked` and does run in the staging smoke-test job, where `E2E_BASE_URL=https://wuce-staging.fly.dev` (confirmed in `.github/workflows/staging-deploy.yml`). A cookie scoped to `domain: 'localhost'` can never attach to a request to `wuce-staging.fly.dev` — so on every real staging run, `page.goto('/journey')` has always navigated with no session cookie at all, deterministically (not flakily) breaking the rest of the test regardless of any other fix in this investigation chain. The real session cookie set by the server (`middleware/session.js`) is also `secure: true`; the manually-added test cookie omitted this, which additionally would have been dropped when navigating over `https://` had the domain matched.

## Architecture Constraints

- No change to any production code path — this is purely a test-fixture correctness fix, confined to `tests/e2e/bri-s3.5-billing-journey.spec.js`.
- Derives both the cookie `domain` and `secure` flag from `process.env.E2E_BASE_URL` (falling back to the same `http://localhost:3999` default already used elsewhere in this file and its sibling specs), rather than hardcoding either value — so the same code path is correct locally and against any real staging/production-like target.
- Does not touch `fixtures/auth.js`'s `withAuth` — that fixture's `NODE_ENV=test`-only guard and localhost-only cookie are both correct for its own, explicitly local-only, purpose.

## Dependencies

- **Upstream:** `seic-s1` (merged) — this was the final layer only visible once seic-s1's fix let AC1/AC3/AC4 pass and isolated AC2 as the sole remaining failure.
- **Downstream:** None expected. This is believed to be the final fix needed for `bri-s3.5-billing-journey.spec.js` to pass in full against real staging, and for `promote-to-prod` to become reachable.

## Acceptance Criteria

**AC1:** Given AC2's browser cookie setup, When the spec runs with `E2E_BASE_URL` unset (local default `http://localhost:3999`), Then the cookie's `domain` resolves to `localhost` and `secure` resolves to `false` — unchanged local behaviour.

**AC2:** Given the same setup, When the spec runs with `E2E_BASE_URL=https://wuce-staging.fly.dev` (the real staging smoke-test job's configuration), Then the cookie's `domain` resolves to `wuce-staging.fly.dev` and `secure` resolves to `true` — so the browser actually attaches the cookie to the subsequent `page.goto('/journey')` request.

**AC3:** Given the next staging-deploy run after this merges, When `bri-s3.5-billing-journey.spec.js`'s smoke-test job runs, Then AC2 passes (the pre-flight usage-gate page renders with the seeded session, not an unauthenticated redirect), and all 21 tests in this file pass — no `Target page, context or browser has been closed` error.

**AC4 (regression guard):** Given these changes, When the existing unit test suite runs, Then it shows the same pre-existing baseline failure count with zero new regressions.

## Out of Scope

- Auditing other `@mocked`-tagged spec files for the same domain-mismatch pattern copied from `fixtures/auth.js` — scoped strictly to `bri-s3.5`, the only confirmed instance found so far (other files using this pattern, e.g. `design-definition-canvas-render.spec.js`, are not tagged `@mocked` and do not run against real staging).
- Any change to `fixtures/auth.js`'s `withAuth` fixture — correct and intentional for its local-only purpose.

## NFRs

- **Performance:** Negligible — no change to any runtime code path; a URL-parsing computation done once at module load in a test file.
- **Security:** None — test-only fixture data; deriving `secure` correctly from the real protocol is itself a minor correctness improvement (previously silently defaulted to insecure).
- **Accessibility:** Not applicable.
- **Audit:** Not applicable — test-only infrastructure.

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
