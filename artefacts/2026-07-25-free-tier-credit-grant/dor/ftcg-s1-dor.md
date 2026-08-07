## Definition of Ready: Free-tier credit grant at signup

**Story reference:** artefacts/2026-07-25-free-tier-credit-grant/stories/ftcg-s1-free-tier-credit-grant.md
**Test plan reference:** artefacts/2026-07-25-free-tier-credit-grant/test-plans/ftcg-s1-test-plan.md
**Assessed by:** Claude (agent), operator-directed
**Date:** 2026-07-25

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As/Want/So, named persona | ✅ | |
| H2 | >=3 ACs | ✅ | 8 ACs |
| H3 | Every AC has >=1 test | ✅ | |
| H4 | Out-of-scope populated | ✅ | 4 items |
| H5 | Benefit linkage named | ✅ | Business-critical gap: 100% of organic signups blocked on first action; found 2026-07-23, re-confirmed 2026-07-25, never fixed until now |
| H6 | Complexity rated | ✅ | 2 |
| H7 | No unresolved HIGH | ✅ | Short-track |
| H8 | No uncovered ACs | ✅ | |

**All hard blocks PASS.**

## Coding Agent Instructions

```
Proceed: Yes
Story: ftcg-s1 -- artefacts/2026-07-25-free-tier-credit-grant/stories/ftcg-s1-free-tier-credit-grant.md
Test plan: artefacts/2026-07-25-free-tier-credit-grant/test-plans/ftcg-s1-test-plan.md

Add grantFreeTierIfNew(tenantId, amount) to credits.js using
INSERT ... ON CONFLICT (tenant_id) DO NOTHING RETURNING balance (atomic,
race-free -- do not check-then-write). Call it unconditionally (not gated
on any first-login detection) from handleAuthCallback (auth.js, GitHub),
handleAuthGoogleCallback (auth.js, Google), and handleEmailSignup
(auth-email.js), reading the grant amount from CREDITS_FREE_TIER_GRANT
(default 10). Wrap each call site in try/catch so a grant failure never
blocks signup itself (AC8). Do not touch the existing GitHub isFirstLogin/
github_first_login mechanism or the /welcome redirect flow -- additive only.

Oversight level: Medium -- business-critical (revenue/onboarding path) and
touches all 3 auth entry points, though the core mechanism (atomic upsert)
already has a proven precedent (adjustBalance) in the same file.
```

## Sign-off

**Oversight level:** Medium
**Signed off by:** Hamish King, Founder/Operator, 2026-07-25 (short-track, operator-directed, credit amount confirmed at 10 via explicit question)
