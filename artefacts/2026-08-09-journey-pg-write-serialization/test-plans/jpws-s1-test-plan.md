## Test Plan: Serialize a journey's Postgres writes so an earlier, incomplete write can never overwrite a later, correct one

**Story reference:** artefacts/2026-08-09-journey-pg-write-serialization/stories/jpws-s1-journey-pg-write-serialization.md
**Epic reference:** None — short-track
**Test plan author:** Claude (agent)
**Date:** 2026-08-09

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Later write's tenantId always wins, regardless of raw promise-resolution order | 1 test | — | — | — | — | 🟢 |
| AC2 | Writes for the same journey are invoked once each, strictly in call order | 1 test | — | — | — | — | 🟢 |
| AC3 | Writes for different journeys are not serialized against each other | 1 test | — | — | — | — | 🟢 |
| AC4 | A rejected earlier write does not block a later write for the same journey | 1 test | — | — | — | — | 🟢 |
| AC5 | No-PG-adapter case remains a no-op | existing suite | — | — | — | — | 🟢 |

---

## Coverage gaps

None. AC5 is covered by re-running the existing `tests/check-p3.1-pg-journey-adapter.js` suite unmodified, which already exercises the no-adapter/no-op case.

---

## Test Data Strategy

**Source:** A controllable PG-adapter stub whose `saveJourney` returns a promise the test can resolve/reject on demand — extending the existing `makePgStub()` pattern already established in `tests/check-p3.1-pg-journey-adapter.js`, but with externally-controllable resolution timing (needed specifically to prove the serialization property, not just eventual correctness).
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1/AC2 | A controllable stub recording each `saveJourney` invocation's argument and exposing a resolve function per call | Hand-authored | None | The core of this test plan |
| AC3 | Two journeys, two independent controllable stubs (or one stub tracking per-journeyId call timing) | Hand-authored | None | |
| AC4 | A controllable stub whose first call's promise rejects | Hand-authored | None | |
| AC5 | N/A — covered by re-running `check-p3.1-pg-journey-adapter.js` unchanged | Existing test file | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### pgWrite_laterWriteTenantIdWins_regardlessOfPromiseResolutionOrder

- **Verifies:** AC1
- **Precondition:** Controllable stub wired via `setPgAdapterForTesting`. `createJourney('feat')` fires write #1 (no tenantId). `setJourneyFields(journeyId, {tenantId: 'org-a'})` fires write #2 (tenantId set) — issued before write #1's promise is resolved.
- **Action:** Resolve write #1's promise, THEN resolve write #2's promise (simulating the exact race: an earlier-issued write's underlying network round-trip completing later would, without this fix, let it "win"). Await both.
- **Expected result:** The stub's LAST recorded `saveJourney` call argument has `tenantId: 'org-a'` — the correct, final state — and no call after it ever reverts to a null/missing tenantId.
- **Edge case:** Yes — this is the exact defect being fixed.

### pgWrite_sameJourneyWritesInvokedOnceEachInCallOrder

- **Verifies:** AC2
- **Precondition:** Controllable stub. Issue three `_pgWrite`-triggering calls in quick succession for the same journeyId (`createJourney`, `setJourneyFields`, `completeStage` or an equivalent second `setJourneyFields`) without awaiting between them.
- **Action:** Assert that immediately after issuing all three calls (before resolving anything), the stub has received exactly ONE `saveJourney` invocation so far (proving the 2nd and 3rd are genuinely queued, not fired concurrently). Resolve call #1; assert call #2 is now issued. Resolve call #2; assert call #3 is now issued. Resolve call #3.
- **Expected result:** Exactly 3 total `saveJourney` invocations, each only issued after the previous one's promise settled, in the same order the logical calls were made.
- **Edge case:** Yes — proves true serialization, not just eventual-consistency-by-luck.

### pgWrite_differentJourneys_notSerializedAgainstEachOther

- **Verifies:** AC3
- **Precondition:** Controllable stub. `createJourney('feat-a')` and `createJourney('feat-b')` (two different journeyIds) both fire `_pgWrite` without awaiting.
- **Action:** Check the stub immediately after both calls, before resolving anything.
- **Expected result:** BOTH journeys' `saveJourney` calls have already been issued to the stub (not just one, waiting on the other) — proving the serialization is scoped per-journeyId, not a single global queue.
- **Edge case:** Yes — this is the property most likely to be silently broken by a naive single-queue implementation.

### pgWrite_rejectedEarlierWrite_doesNotBlockLaterWriteForSameJourney

- **Verifies:** AC4
- **Precondition:** Controllable stub whose first call's promise will reject. `createJourney('feat')` fires write #1. `setJourneyFields(journeyId, {tenantId: 'org-a'})` fires write #2, queued behind write #1.
- **Action:** Reject write #1's promise. Await a tick. Check whether write #2 has now been issued.
- **Expected result:** Write #2 IS issued despite write #1 rejecting — the queue is not permanently jammed by one failed write. (The existing `.catch(...)` error-logging behavior in `_pgWrite` is preserved — no unhandled rejection.)
- **Edge case:** Yes — the failure-isolation property.

---

## Integration Tests

None required beyond re-running the existing `tests/check-p3.1-pg-journey-adapter.js` suite, which already exercises `createJourney`/`setJourneyFields`/the PG adapter seam end-to-end and will catch any gross regression to the existing, already-correct happy-path behavior.

---

## NFR Tests

### noAddedLatencyForCallers

- **NFR addressed:** Performance
- **Measurement method:** Not separately measured — `_pgWrite` remains un-awaited by every caller both before and after this fix; the internal promise-chaining only affects when the underlying `pg.saveJourney` call is issued relative to other writes for the same journey, never the caller's own return timing.
- **Pass threshold:** N/A — architectural guarantee, not a runtime measurement.
- **Tool:** N/A.

---

## Out of Scope for This Test Plan

- Any live-database confirmation against real Postgres/Neon — covered by the controllable-stub pattern, consistent with `check-p3.1-pg-journey-adapter.js`'s own established test style.
- Bulk repair of the ~1000 already-corrupted rows in real staging Postgres — a separate data action, not this story's concern.

---

## Test Gaps and Risks

None identified as blocking.
