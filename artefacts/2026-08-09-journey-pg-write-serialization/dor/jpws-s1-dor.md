## Definition of Ready: jpws-s1 — Serialize a journey's Postgres writes so an earlier, incomplete write can never overwrite a later, correct one

**Story:** artefacts/2026-08-09-journey-pg-write-serialization/stories/jpws-s1-journey-pg-write-serialization.md
**Review artefact:** artefacts/2026-08-09-journey-pg-write-serialization/review/jpws-s1-review-1.md (PASS, 0 HIGH findings)
**Test plan:** artefacts/2026-08-09-journey-pg-write-serialization/test-plans/jpws-s1-test-plan.md
**Date:** 2026-08-09

---

### Scope contract

**Files in scope (exact touchpoints):**
- `src/web-ui/modules/journey-store.js` — `_pgWrite` (~line 34-40): add a per-`journeyId` promise chain so writes for the same journey are strictly serialized.
- `tests/check-jpws-s1-*.js` (new) — unit tests per the test plan.

**Files explicitly out of scope (must not be touched):**
- Every caller of `createJourney`/`setJourneyFields`/`completeStage`/`setActiveSession` (`journey.js`, `products.js`, `server.js`'s test-only seed endpoints) — zero call-site changes.
- `src/web-ui/adapters/journey-store-pg.js` — `saveJourney`'s SQL stays exactly as-is.
- `tests/check-p3.1-pg-journey-adapter.js` — must pass unmodified (AC5 regression baseline), not edited.

### Architecture Constraints

No new architectural decision — a standard per-key promise-chaining pattern contained entirely within `_pgWrite`. No ADR required.

### Human oversight

**Low-to-medium** — the change itself is small and contained to one function, but it touches the write path for every journey creation/mutation in the app, so the review already emphasized (and the test plan already covers) the two properties most likely to be silently broken by a careless implementation: per-journey isolation (AC3) and failure-tolerance (AC4).

### Coding Agent Instructions

1. In `journey-store.js`, add a module-level map to track the current write-chain per journey, near the existing `_pgAdapter`/`_pgAdapterForTesting` state:
   ```javascript
   // jpws-s1: per-journeyId write-order chain. createJourney and
   // setJourneyFields (and completeStage, setActiveSession) each fire an
   // independent, unawaited _pgWrite call for the same journeyId in quick
   // succession -- without this chain, two concurrent pool.query() calls to
   // the same row have no ordering guarantee, and an earlier, incomplete
   // write can commit AFTER a later, correct one, silently reverting fields
   // like tenantId back to null. Chaining onto a per-journeyId promise
   // ensures each write for a given journey only begins once the previous
   // one for that same journey has settled -- writes for DIFFERENT journeys
   // remain fully concurrent (a Map entry per journeyId, not one global
   // chain).
   var _pgWriteChains = new Map(); // journeyId -> Promise
   ```
2. Replace `_pgWrite`'s body:
   ```javascript
   function _pgWrite(journey) {
     var pg = _activePgAdapter();
     if (!pg) return;
     var journeyId = journey.journeyId;
     var prev = _pgWriteChains.get(journeyId) || Promise.resolve();
     var next = prev.then(function() {
       return pg.saveJourney(journey);
     }).catch(function(err) {
       console.error('[journey-store] PG write error:', err.message);
     });
     _pgWriteChains.set(journeyId, next);
   }
   ```
   Note: the `.catch()` must be attached to `next` (the chained promise stored in the map), not to the raw `pg.saveJourney(journey)` call — otherwise a rejection would make `prev` (as seen by the NEXT write in the chain) also reject, which would skip that next write's `.then()` body entirely (defeating AC4). Chaining `.catch()` after `.then()` on the same promise converts a rejection into a resolved value for anything chained after it, which is exactly the failure-isolation behaviour AC4 requires.
3. Consider whether `_pgWriteChains` needs any cleanup/eviction for long-running processes with many distinct journeys (a `Map` entry per `journeyId` that's never removed will grow unboundedly over a long-lived server process). If this is a real concern within scope, evict a journey's entry once its chain settles (e.g., in a `.finally()` that removes the map entry if it's still the current value for that journeyId) — otherwise explicitly note it as an accepted, bounded-in-practice tradeoff in the DoD (journey counts are not unbounded-per-process at the scale this app operates at, and each Map entry is a single Promise reference, not journey data itself).
4. Write the tests per the test plan, using `journeyStore.setPgAdapterForTesting(stub)` / `journeyStore._clearForTesting()`, the exact seam already established in `tests/check-p3.1-pg-journey-adapter.js`. Build a controllable stub (`saveJourney` returns a promise the test can resolve/reject on demand) rather than the existing auto-resolving stub, since proving the ORDERING property (not just eventual correctness) requires controlling resolution timing directly.
5. Re-run `tests/check-p3.1-pg-journey-adapter.js` directly (unmodified) to confirm AC5 and the broader existing happy-path coverage — zero regression.

### Definition of Ready checklist

- [x] Scope contract defined (in-scope and out-of-scope files both named)
- [x] Review passed (0 HIGH findings)
- [x] Test plan written, all ACs covered
- [x] Human oversight level set (Low-to-medium)
- [x] No CSS-layout-dependent AC left unclassified (none — all ACs assert on call-order/data-integrity via a controllable test double, no UI involved)

**PROCEED: Yes**
