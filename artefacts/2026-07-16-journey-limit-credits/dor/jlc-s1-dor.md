# Definition of Ready: jlc-s1 — Persist tenant plan state so the paid-plan journey-cap bypass survives a restart

**Story:** artefacts/2026-07-16-journey-limit-credits/stories/jlc-s1-credit-based-journey-cap.md (re-scoped 2026-07-16 — see Correction notice)
**Test plan:** artefacts/2026-07-16-journey-limit-credits/test-plans/jlc-s1-credit-based-journey-cap-test-plan.md (re-scoped)
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
| H7 | No unresolved HIGH findings | ✅ Review PASS, 0 HIGH (re-confirmed against re-scoped story) |
| H8 | Test plan covers all ACs | ✅ |
| H8-ext | Cross-story schema dependency | ✅ N/A — bri-s3.5 (upstream) already merged; this story replaces its in-memory store, not a new dependency |
| H9 | Architecture Constraints populated | ✅ |
| H-NFR | NFR profile exists | ✅ |
| H-GOV | Governance approval | ⚠️ See decisions.md GAP entry (same precedent as pcr-s1/tst-s1) |
| H-ADAPTER | D37 check | ✅ New adapter (`setPlanStateAdapter`) introduced — stub-throws requirement, DoR production-wiring AC, and behavioral (not just wiring-shape) wiring test all present per AC1/AC3/AC4 above |

**All hard blocks pass.**

## READY / BLOCKED determination

## ✅ READY

## Coding Agent Instructions

```
Proceed: Yes
Story: Persist tenant plan state so the paid-plan journey-cap bypass survives a restart — artefacts/2026-07-16-journey-limit-credits/stories/jlc-s1-credit-based-journey-cap.md
Test plan: artefacts/2026-07-16-journey-limit-credits/test-plans/jlc-s1-credit-based-journey-cap-test-plan.md

IMPORTANT: This story was re-scoped on 2026-07-16 (see the story's Correction
notice at the top). If you started work under the OLD scope (a
credit-balance-based bypass, since none existed), STOP -- that premise was
wrong. Re-read the current story file in full before continuing; the fix is
now: persist the EXISTING paid-plan bypass (already shipped by bri-s3.5) to
Postgres instead of an in-memory Map, because it currently doesn't survive a
server restart.

Goal:
Add setPlanStateAdapter(pgPool) (D37 pattern, matching credits.js) to
src/web-ui/modules/tenant-plan.js. Make setPlanState/getPlanState async,
backed by a new `tenant_plan` table (tenant_id PK, plan, status, updated_at),
created via the same CREATE TABLE IF NOT EXISTS startup-migration convention
journey-store-pg.js already uses. checkJourneyCap becomes async as a result.
Update all 4 call sites (billing.js's 3 webhook branches + its GET
plan-state route, journey.js's checkJourneyCap call) to await correctly.

Read src/web-ui/modules/tenant-plan.js, src/web-ui/modules/credits.js (for
the D37 adapter pattern to mirror), src/web-ui/routes/billing.js, and
src/web-ui/routes/journey.js's actual current code yourself before writing
any test.

Critical constraint (AC3): when the plan-state adapter is unwired, or a DB
read genuinely errors, getPlanState must fall back to the safe default
({plan:'trial', status:'active'}) -- never throw, never 500 a request, and
never accidentally grant unlimited access. Verify with a real test.

Do not touch credits.js's own logic/schema, or Stripe's
signature-verification/event-routing logic in billing.js -- only the
setPlanState/getPlanState calls within the already-identified branches.

Do not touch any file belonging to a currently-open bri-*, tir-*, tst-s1, or
other in-flight feature's branch or PR.

Follow TDD. Open a draft PR when done, never merge/self-merge, never push
directly to origin/master. Update .github/pipeline-state.json via
node bin/skills advance/gate-advance.

Oversight level: Medium
```

## Sign-off

**Signed off by:** Hamish King (Founder/Operator), direct in-session instruction, 2026-07-16 (re-scoped after discovering the real defect).
