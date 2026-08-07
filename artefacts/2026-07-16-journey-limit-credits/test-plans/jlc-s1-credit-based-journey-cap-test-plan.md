## Test Plan: Persist tenant plan state so the paid-plan journey-cap bypass survives a restart

**Story reference:** artefacts/2026-07-16-journey-limit-credits/stories/jlc-s1-credit-based-journey-cap.md
**Date:** 2026-07-16 (re-scoped — see story's Correction notice)

## AC Coverage

| AC | Description | Unit | Integration | Risk |
|----|-------------|------|-------------|------|
| AC1 | Plan state survives a simulated restart | 1 | 1 | 🟢 |
| AC2 | Untracked tenant defaults to trial/active | 1 | — | 🟢 |
| AC3 | Unwired adapter fails open | 2 | — | 🟢 |
| AC4 | All 3 webhook branches await setPlanState | — | 3 | 🟢 |
| AC5 | Cap-decision logic unchanged | 2 | — | 🟢 |

## Unit Tests (`tests/check-jlc-s1-credit-based-journey-cap.js`)

**U1 (AC2):** `getPlanState(tenantId)` with a wired adapter and no row for that tenant resolves `{plan:'trial', status:'active'}`.
**U2 (AC3):** `getPlanState(tenantId)` with no adapter wired resolves the same default, does not throw.
**U3 (AC3):** `checkJourneyCap(tenantId, currentCount >= cap, repoRoot)` with no plan-state adapter wired resolves `{allowed:false, ...}` (existing count-cap behavior), does not throw.
**U4 (AC5):** `checkJourneyCap` with a wired adapter returning `{plan:'paid', status:'active'}` and `currentCount` far beyond cap resolves `{allowed:true, cap:null, count}` — unchanged from the pre-existing in-memory version's behavior.
**U5 (AC5):** `checkJourneyCap` with `{plan:'trial', status:'past_due'}` (a downgrade/cancellation state) and `currentCount >= cap` resolves `{allowed:false}` — proving the plan-state gate still correctly restores the restriction, matching bri-s3.5's original AC4 intent.

## Integration Tests

**IT1 (AC1):** Write `setPlanState('tenant-x', 'paid', 'active')` via a real (test-DB-backed, or equivalent injected) adapter. Create a *fresh* module instance (simulating a process restart — e.g. `delete require.cache` + re-require, or an equivalent reset mechanism) with the same underlying adapter/table. Call `getPlanState('tenant-x')` on the fresh instance — assert it still returns `{plan:'paid', status:'active'}`, proving the state did not live only in the old instance's in-memory Map.
**IT2 (AC4):** For each of the 3 Stripe webhook branches in `billing.js`, simulate the corresponding event and assert `setPlanState` was called with the correct arguments and that the handler correctly awaited it (e.g. by using an async adapter mock with an artificial delay and asserting the handler's response isn't sent until the write resolves).
**IT3 (AC1):** `routes/journey.js`'s real handler, with a tenant whose persisted plan state is `paid`/`active` and a journey count over the free-tier cap — assert journey creation succeeds (not HTTP 402).

## Out of Scope for This Test Plan

- Testing Postgres's own `ON CONFLICT` upsert semantics — standard, well-tested SQL behavior, not this story's logic.
- E2E/browser-driven tests — backend-only change.

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| A true process restart (new OS process) can't be simulated in a Jest-style unit/integration run | Inherent test-environment limitation | IT1 simulates the closest equivalent (fresh module instance against the same persisted table) — proves the mechanism (external Postgres storage, not the in-memory Map) is what actually holds the state, which is the property that matters |
