# Definition of Done: Grant every brand-new tenant a free-tier credit balance at signup

**PR:** #599 (merge commit `b9d773d2`) | **Merged:** 2026-07-25 17:33:24 +1200
**Story:** artefacts/2026-07-25-free-tier-credit-grant/stories/ftcg-s1-free-tier-credit-grant.md
**Assessed by:** Claude (agent) -- retroactive DoD backlog pass, 2026-08-17
**Date:** 2026-08-17

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|------------|----------|----------------------|-----------|
| AC1 -- new tenant gets grant, returns `true` | Yes | `newTenantGetsGrantAndReturnsTrue (AC1)` | Unit test against `credits.js`'s `grantFreeTierIfNew` with a real in-memory fake DB | None |
| AC2 -- existing tenant (any balance, incl. 0) never re-granted, returns `false` | Yes | `existingTenantWithNonzeroBalanceNotReGranted (AC2)`, `existingTenantWithExactlyZeroBalanceNotReGranted (AC2)` | Unit test, both a nonzero and exactly-zero seeded balance case | None |
| AC3 -- concurrent calls apply exactly one grant | Yes | `concurrentGrantsApplyExactlyOnce (AC3)` | Unit test firing two concurrent `grantFreeTierIfNew` calls via `Promise.all`, asserts final balance is `10` (not `20`) and exactly one call returns `true` | None |
| AC4 -- GitHub OAuth signup grants free tier | Yes | `githubSignupGrantsFreeTier (AC4)` | Integration test driving `handleAuthCallback` end-to-end with fixture-backed OAuth exchange, asserts resulting tenant balance is `10` | None |
| AC5 -- Google OAuth signup grants free tier | Yes | `googleSignupGrantsFreeTier (AC5)` | Integration test driving `handleAuthGoogleCallback`, asserts resulting tenant balance is `10` | None |
| AC6 -- email/password signup grants free tier | Yes | `emailSignupGrantsFreeTier (AC6)` | Integration test driving `handleEmailSignup`, asserts resulting tenant balance is `10` | None |
| AC7 -- returning user via each of the 3 auth methods, balance unchanged | Yes | `returningGithubUserUnchangedBalance (AC7)`, `returningGoogleUserUnchangedBalance (AC7)`, `returningEmailUserLoginUnchangedBalance (AC7)` | Integration tests, one per auth method, seeded balance of `3`, asserts balance stays `3` after login | None |
| AC8 -- credits adapter unwired, signup still succeeds | Yes | `githubSignupSucceedsEvenIfCreditsAdapterThrows (AC8)`, `googleSignupSucceedsEvenIfCreditsAdapterThrows (AC8)`, `emailSignupSucceedsEvenIfCreditsAdapterThrows (AC8)` | Integration tests with a fresh, unwired `credits.js` (D37 stub-throws), asserts each signup path still returns a `302` redirect | Verified by code inspection that the failure path is caught and logged (`_grantFreeTierCredits`'s try/catch in both `auth.js` and `auth-email.js`), not just that signup succeeds -- consistent with the AC's intent |

All 8 ACs map to concrete, named test assertions. No AC has zero test evidence.

## Scope Deviations

None. The four "Out of Scope" items named in the story (GitHub-specific `isFirstLogin`/`/welcome` flow, Google first-login detection, paid-plan credit grants, expiring/time-limiting the grant) are all confirmed untouched by code inspection -- `grantFreeTierIfNew` is additive alongside the existing GitHub flow, and no changes appear in the paid-plan (`CREDITS_PLAN_<PLAN>`) code path.

## Test Plan Coverage

`check-ftcg-s1-free-tier-credit-grant.js`: **13 passed, 0 failed** (freshly re-run 2026-08-17). Breakdown: AC1 (1 test), AC2 (2 tests), AC3 (1 test), AC4 (1 test), AC5 (1 test), AC6 (1 test), AC7 (3 tests, one per auth method), AC8 (3 tests, one per auth method) = 13 total, matching the file's own coverage header.

## NFR Status

| NFR | Status | Evidence |
|-----|--------|----------|
| Data integrity -- exactly-once grant regardless of concurrency/repeated logins | Met | Enforced via `INSERT ... ON CONFLICT (tenant_id) DO NOTHING RETURNING balance` (`credits.js:90-97`) -- database-level, not application-level locking, per AC2/AC3 tests |
| Reliability -- grant failure never blocks signup | Met | `_grantFreeTierCredits` in both `auth.js` and `auth-email.js` wraps the call in try/catch, logging and swallowing errors; confirmed by AC8 tests |
| Observability -- log only on actual grant, not every no-op call | Met | Code inspection confirms `free_tier_credits_granted` is logged only inside the `if (granted)` branch in both `auth.js` (`_logger.info`) and `auth-email.js` (`console.info`); failures log `free_tier_credits_grant_failed` separately |

## Metric Signal

No benefit-metric artefact exists for this feature -- it is explicitly marked "Short-track: bug fix" in the story, which per this repo's pipeline skips discovery through review (including `/benefit-metric`). No metric signal is expected or claimed here.

## Outcome

**COMPLETE**
**Follow-up actions:** None.

## DoD Observations

Implementation matches the story's architecture constraints closely (atomic upsert, identical call across all 3 auth paths, env-var-configurable amount, fire-and-forget failure handling). No production-longevity signal is available beyond the merge date; no incident or regression has been flagged against this story in later capture-log entries reviewed during this pass.
