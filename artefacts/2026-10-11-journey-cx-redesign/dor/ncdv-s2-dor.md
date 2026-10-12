# Definition of Ready Checklist (Short-track)

## Definition of Ready: Fix local-Postgres SSL block in journey-store-pg.js

**Story reference:** short-track infra fix (pre-existing cross-feature E2E blocker)
**Test plan reference:** artefacts/2026-10-11-journey-cx-redesign/test-plans/ncdv-s2-test-plan.md
**Assessed by:** Claude Sonnet 5 (session continuation)
**Date:** 2026-10-13

---

## Short-track justification

Bounded, single-function fix (`journey-store-pg.js`'s own `_getPool()`), root cause already confirmed directly (ic-s4's own DoD, re-confirmed live this session against a real disposable Postgres container), scoped narrowly to avoid any behavioral change for real Neon/staging/production connections. Matches CLAUDE.md's own short-track criteria. Skips discovery through review (steps 1-4); `/definition-of-done` still applies after merge.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H3 | Every AC has ≥1 test | ✅ | 1 AC (local Postgres connects without a forced-SSL error), covered by `check-ncdv-s2-local-postgres-ssl.js` plus a real Docker-container connection proof (not just pattern-matched) |
| H9 | Architecture Constraints — no Category E HIGH | ✅ | The fix is scoped to localhost/127.0.0.1/::1 specifically — every other hostname (any real Neon/staging/production `DATABASE_URL`) keeps its exact prior behavior, confirmed by a dedicated non-local-host test case |
| H-GOV | Cross-feature infra blocker | ✅ | Blocks local E2E execution for `ep1-s3`/`ic-s2`/`ic-s3`/`ic-s4`/`jcx-s3`'s own E2E specs — a real, currently-blocking gap, not speculative |

**All hard blocks PASS.**

---

## Coding Agent Instructions

```
Proceed: Yes
Goal: journey-store-pg.js's own _getPool() must stop forcing
ssl:{rejectUnauthorized:false} unconditionally -- skip it only when
DATABASE_URL's own hostname is localhost/127.0.0.1/::1.

Constraints:
- MUST NOT change behavior for any non-local hostname -- every real
  Neon/staging/production connection string keeps its exact existing
  ssl:{rejectUnauthorized:false} behavior. Verify via a dedicated test
  asserting a real Neon-shaped hostname is still classified non-local.
- Verify the fix against a REAL local Postgres (a disposable Docker
  container), not just a source-text pattern match -- prove the actual
  SSL error is gone, not merely that the code looks different.
- Do not attempt to fix the SEPARATE, larger dashboard-CSRF-token gap
  this same investigation surfaced (html-shell.js's renderShell embeds
  no page-wide CSRF token) -- out of scope for this fix, log as its
  own pending action.

Oversight level: Low (single function, narrowly scoped, real-Postgres-verified)
```

---

## Sign-off

**Oversight level:** Low
**Sign-off required:** No — bounded infra fix, operator engaged directly in this session (asked "do we need to solve that postgres gap first").
