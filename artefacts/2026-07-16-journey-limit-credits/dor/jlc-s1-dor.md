# Definition of Ready: jlc-s1 — Journey cap bypass for tenants with a positive credit balance

**Story:** artefacts/2026-07-16-journey-limit-credits/stories/jlc-s1-credit-based-journey-cap.md
**Test plan:** artefacts/2026-07-16-journey-limit-credits/test-plans/jlc-s1-credit-based-journey-cap-test-plan.md
**Review:** artefacts/2026-07-16-journey-limit-credits/review/jlc-s1-review-1.md
**Date:** 2026-07-16

## Hard Blocks

| # | Check | Status |
|---|-------|--------|
| H1 | As/Want/So with named persona | ✅ |
| H2 | 3+ ACs in Given/When/Then | ✅ 5 ACs |
| H3 | Every AC has a test | ✅ |
| H4 | Out-of-scope populated | ✅ |
| H5 | Benefit linkage names a real metric | ✅ |
| H6 | Complexity rated | ✅ Rating 2, Stable |
| H7 | No unresolved HIGH findings | ✅ Review PASS, 0 HIGH |
| H8 | Test plan covers all ACs | ✅ |
| H8-ext | Cross-story schema dependency | ✅ N/A — credits.js/tenant-plan.js already merged |
| H9 | Architecture Constraints populated | ✅ |
| H-NFR | NFR profile exists | ✅ |
| H-GOV | Governance approval | ⚠️ See decisions.md GAP entry (same precedent as pcr-s1/tst-s1) |
| H-ADAPTER | D37 check | ✅ N/A — reuses credits.js's existing adapter, doesn't introduce a new one |

**All hard blocks pass.**

## READY / BLOCKED determination

## ✅ READY

## Coding Agent Instructions

```
Proceed: Yes
Story: Journey cap bypass for tenants with a positive credit balance — artefacts/2026-07-16-journey-limit-credits/stories/jlc-s1-credit-based-journey-cap.md
Test plan: artefacts/2026-07-16-journey-limit-credits/test-plans/jlc-s1-credit-based-journey-cap-test-plan.md

Goal:
Make checkJourneyCap (src/web-ui/modules/tenant-plan.js) consult credits.js's
getBalance(tenantId). If balance > 0, bypass the count cap entirely
(allowed: true) regardless of currentCount. If balance <= 0, or if the
credits adapter is unwired, fall back to the existing count-only behavior
exactly as it works today. Update the one call site in
src/web-ui/routes/journey.js (~line 357) to await the now-async
checkJourneyCap.

Read src/web-ui/modules/credits.js and src/web-ui/modules/tenant-plan.js and
src/web-ui/routes/journey.js's actual current code yourself before writing
any test -- do not assume the line numbers cited here are still exact.

Critical constraint: when credits.js's adapter is unwired
(getBalance throws "Adapter not wired: creditsDb"), catch that specific
error and fall back to count-only behavior. Do NOT let it propagate as an
uncaught exception, and do NOT interpret "adapter unwired" as "unlimited
credits" -- both would be wrong fail directions. This is AC4 and is the
riskiest part of this story -- verify it with a real test, not just written
prose.

Do not touch credits.js's own logic/schema or billing.js's Stripe webhook
handling -- this story only adds a new caller of the existing getBalance
function.

Follow TDD. Open a draft PR when done, never merge/self-merge, never push
directly to origin/master. Update .github/pipeline-state.json via
node bin/skills advance/gate-advance (never edit the JSON directly).

Oversight level: Medium
```

## Sign-off

**Signed off by:** Hamish King (Founder/Operator), direct in-session instruction, 2026-07-16.
