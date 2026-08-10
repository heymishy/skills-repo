## Story: Fix-forward — credits-guard blocks fjcv-s1's ideate-first E2E path on real staging (402, smoke-test gate failure)

**Epic reference:** None — short-track (fix-forward to fjcv-s1, found by monitoring its own post-merge staging deploy)
**Discovery reference:** None — short-track skips discovery; scope is the code-derived gap below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below

## User Story

As an **operator relying on `smoke-test` to gate production promotion**,
I want **fjcv-s1's ideate-first E2E path to actually complete on real staging**,
So that **a real, recurring smoke-test failure doesn't permanently block `promote-to-prod` on every future deploy**.

## Benefit Linkage

**Metric moved:** Direct CI-reliability gap (short-track, no formal benefit-metric artefact) — found by monitoring rapp-s1's own merge deploy: `staging-deploy.yml`'s `smoke-test` job failed with a genuine (non-flaky) error: `Error: turn submission for test-plan / Expected: 200 / Received: 402`. Root-caused precisely: `fjcv-s1`'s ideate-first journey needs 12 real `/turn` submissions from one fresh signup (5 ideate lens turns via isc-s1's own multi-turn fixture + 7 pipeline stages), but `ftcg-s1`'s free-tier grant is only 10 credits (`CREDITS_FREE_TIER_GRANT`) at 1 credit/turn (`TURN_CREDIT_COST`) — `credits-guard.js` correctly (by its own design) returns a real 402 once the balance hits zero, blocking the 11th turn (`test-plan`). This is not flakiness — every future run of this exact path will fail identically, permanently keeping `smoke-test` red and `promote-to-prod` unreachable.

**How:** Extend `credits-guard.js` with the same double-gate staging-only bypass pattern every other test-safety mechanism in this codebase already uses (`dss-s1`'s `_isTestEndpointAllowed`, `serlb-s1`'s rate-limit bypass, `nis-s1`'s named-identity stub, `bjs-s1`'s webhook stub): a caller-chosen `tenantId` alone grants nothing — it must ALSO be unmistakably synthetic (`e2e-` prefixed) AND the request must carry the matching `E2E_STAGING_AUTH_STUB_SECRET` header (a staging CI secret, never set on production, never known to a real signup). `fjcv-s1`'s own `submitTurn()` helper updated to send this header (reusing the already-imported `testEndpointBypassHeaders()` from `fixtures/staging-auth.js`).

## Architecture Constraints

- **Double-gate, not single-gate.** The `e2e-` prefix alone is NOT sufficient — a real user could choose an `e2e-`-prefixed email during real signup with no restriction on the signup form itself. The bypass requires BOTH the prefix AND the secret header, exactly mirroring every other staging-only bypass already audited into this codebase.
- **No-op when the secret isn't configured.** `E2E_STAGING_AUTH_STUB_SECRET` is never set on production — the bypass function returns `false` immediately when the env var is empty, so this code path is provably inert outside of CI-configured staging runs.
- **Constant-time comparison.** The header-vs-secret comparison uses `crypto.timingSafeEqual` (matching `server.js`'s own `_testEndpointBypassHeaderMatches` implementation) to avoid a timing side-channel on the secret.
- **Admin bypass (pre-existing, `d4`) is unaffected** — checked first, unchanged; this story's bypass is a second, independent condition checked immediately after.
- **Self-contained in `credits-guard.js`** — no cross-module import of `server.js`'s own `_isTestEndpointAllowed` (would create a circular dependency, since `server.js` already requires `credits-guard.js`); mirrors `auth-email.js`'s own stated precedent of "deliberately self-contained here rather than a shared cross-module helper."

## Dependencies

- **Upstream:** `fjcv-s1` (merged) — the E2E spec whose ideate-first path exposed this gap. `isc-s1`/`isc-s2` (merged) — the reason `/ideate` now needs 5 real turns instead of 1. `ftcg-s1` (merged) — the 10-credit free-tier grant this story works around for E2E purposes without changing for real users.
- **Downstream:** None known.

## Acceptance Criteria

**AC1:** Given a request with `tenantId` starting `e2e-` and a correct `x-e2e-test-endpoint-bypass` header matching `E2E_STAGING_AUTH_STUB_SECRET`, When `creditsGuard` runs against a zero balance, Then `next()` is called and no 402 is returned.

**AC2:** Given a request with a non-`e2e-`-prefixed `tenantId` and the correct bypass header, When `creditsGuard` runs against a zero balance, Then the request is still blocked with a 402 — the prefix is required regardless of the header.

**AC3:** Given a request with an `e2e-`-prefixed `tenantId` and an incorrect bypass header value, When `creditsGuard` runs against a zero balance, Then the request is still blocked with a 402 — the header must match exactly.

**AC4:** Given `E2E_STAGING_AUTH_STUB_SECRET` is not configured (the real production state) and a request presents any header value, When `creditsGuard` runs against a zero balance, Then the request is still blocked with a 402 — the bypass is fully inert without the secret configured.

**AC5:** Given an `e2e-`-prefixed tenant with no bypass header present at all (a real browser request), When `creditsGuard` runs against a zero balance, Then the request is still blocked with a 402.

**AC6:** Given the pre-existing admin bypass (`d4`), When an admin session hits `creditsGuard`, Then it still bypasses exactly as before, unaffected by this change.

**AC7:** Given `fjcv-s1`'s `submitTurn()` helper, When it POSTs a turn, Then it includes the bypass header (via `testEndpointBypassHeaders()`) so the ideate-first path's 12-turn journey completes on real staging without hitting the free-tier credit ceiling.

## Out of Scope

- **Raising `CREDITS_FREE_TIER_GRANT` for real users** — this story's fix is E2E-test-specific; the real 10-credit free-tier allocation for genuine signups is unchanged and out of scope (a product/pricing decision, not a CI-reliability fix).
- **Applying the same bypass to `bri-s3.2`'s own spec** — its discovery-first path only needs 7 turns, well under the 10-credit ceiling; never observed to hit this failure. Not touched.
- **A general-purpose "unlimited credits for any e2e- tenant" toggle** — the double-gate (prefix + secret) is deliberately narrower than a blanket tenant-ID-based exemption, matching this codebase's established security convention for every other staging-only bypass.

## NFRs

- **Security:** The bypass must be provably inert on real production (verified: AC4, `E2E_STAGING_AUTH_STUB_SECRET` never set there) and must not be exploitable by a real user choosing a synthetic-looking email (verified: AC2, prefix alone is insufficient; AC5, absence of header alone is insufficient).
- **No regression to the existing credit-enforcement guarantees** — `check-lab-s3.3-credit-enforcement.js`'s own 36 assertions re-run unmodified.

## Complexity Rating

**Rating:** 2 — a well-understood, precedented pattern (double-gate staging-only bypass), but touching a security-sensitive guard requires the extra care reflected in this story's explicit negative-case ACs (AC2–AC5).
**Scope stability:** Stable

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [x] Human oversight level confirmed from parent epic (short-track, no parent epic — set directly in DoR)
