## Test Plan: Journey cap bypass for tenants with a positive credit balance

**Story reference:** artefacts/2026-07-16-journey-limit-credits/stories/jlc-s1-credit-based-journey-cap.md
**Date:** 2026-07-16

## AC Coverage

| AC | Description | Unit | Integration | E2E | Risk |
|----|-------------|------|-------------|-----|------|
| AC1 | Positive credit balance bypasses count cap | 2 | 1 | — | 🟢 |
| AC2 | Zero/negative balance still blocked at cap | 2 | 1 | — | 🟢 |
| AC3 | Positive balance + under cap still succeeds | 1 | — | — | 🟢 |
| AC4 | Credits adapter unwired fails open to old behavior | 2 | — | — | 🟢 |
| AC5 | journey.js call site awaits the now-async call | — | 1 | — | 🟢 |

## Unit Tests (`tests/check-jlc-s1-credit-based-journey-cap.js`)

**U1 (AC1):** `checkJourneyCap(tenantId, currentCount >= cap, repoRoot)` with a wired credits adapter returning balance > 0 resolves `{ allowed: true, ... }`.
**U2 (AC1):** Same as U1 but with `currentCount` far beyond cap (e.g. cap=5, count=100) — still `allowed: true` (credits fully overrides count, not just at the boundary).
**U3 (AC2):** `checkJourneyCap` with a wired credits adapter returning balance `0` and `currentCount >= cap` resolves `{ allowed: false, cap, count }` — unchanged from pre-story behavior.
**U4 (AC2):** Same as U3 but balance is negative (e.g. `-3`) — still `allowed: false` (negative balance is not "positive," must not be misread as bypass-eligible).
**U5 (AC3):** `checkJourneyCap` with balance > 0 and `currentCount < cap` resolves `{ allowed: true }` (unsurprising, but must not regress).
**U6 (AC4):** `checkJourneyCap` with no credits adapter wired (fresh `credits.js` module state, `setCreditsAdapter` never called) and `currentCount >= cap` resolves `{ allowed: false }` — the "Adapter not wired" error is caught internally and this falls back to old behavior, not propagated as a thrown error.
**U7 (AC4):** Same as U6 but `currentCount < cap` — resolves `{ allowed: true }` (cap logic still works normally when credits isn't wired, just without the bypass).

## Integration Tests

**IT1 (AC1, AC2):** Using `journey.js`'s real HTTP handler (mocked `journeyStore`, wired `credits` adapter via `setCreditsAdapter`), simulate a tenant at the cap with a positive credit balance — assert journey creation returns success (not HTTP 402). Then simulate the same tenant with balance 0 — assert HTTP 402 "Journey limit reached" is returned, unchanged from current behavior.
**IT2 (AC5):** Assert `routes/journey.js`'s call site uses `await _tenantPlan.checkJourneyCap(...)` (or equivalent promise-resolution), not a bare synchronous call treating the returned Promise as the result object — a static source check plus a runtime check that the gate correctly blocks when the resolved value is `{allowed: false}` (would incorrectly always pass if the Promise object itself were being truthiness-checked instead of its resolved `.allowed` field).

## Out of Scope for This Test Plan

- `credits.js`'s own balance-adjustment correctness — already covered by its own existing tests.
- Any E2E/browser-driven test — this is a backend gating-logic change with no UI surface.

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Real Postgres-backed credits table behavior under concurrent journey-creation requests | Out of scope — the existing `credits.js` atomic-update pattern (`UPDATE ... SET balance = balance + $1`) already handles concurrent adjustment; this story only *reads* balance, doesn't adjust it, so no new concurrency risk is introduced | Not applicable — read-only consumption of an already-correct mechanism |
