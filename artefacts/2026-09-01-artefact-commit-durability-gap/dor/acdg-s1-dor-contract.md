# Contract Proposal: Fix the Silent Artefact-Commit Failure in Stage-Completion (AC2 Guard)

**Story reference:** artefacts/2026-09-01-artefact-commit-durability-gap/stories/acdg-s1.md
**Assessed by:** Claude Code (agent, operator-directed — Hamish King)
**Date:** 2026-09-02 — **Revision 2**, after `/branch-setup`'s root-cause investigation. Revision 1's contract (investigate 3 candidate sub-modes) is superseded — the investigation happened, and the real mechanism is now confirmed. See `decisions.md` for the full trail.

---

## What will be built

1. In `journey.js`'s `handlePostGateConfirm` (the stage-completion call site, ~lines 2439–2444), change the existing `catch (_dasResolveErr) { _dasOwnerRepo = null; }` block to check `journey.productId`: if set, treat the throw as a genuine anomaly — return a clear, actionable error and do NOT call `completeStage()`. If unset, preserve today's exact behaviour (`_dasOwnerRepo = null`, proceed unchanged).
2. Write the 7 tests from the test plan: 3 unit (AC1, AC2-revised, AC3-revised), 2 integration, 2 NFR.

## What will NOT be built

- Any change to `export-data-source.js`, `artefact-commit-writer.js`, `journey-store.js`, or `journey-store-pg.js` — all confirmed already correct/sufficient for this fix.
- Retroactive backfill of `new-feature-af17f555`'s own already-missing 8 artefacts.
- A generic retry/backoff mechanism for commit failures.
- `acdg-s2`'s durability-signal logging — separate, downstream story.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Monkey-patch `commitArtefact` to throw after a successful resolve; assert 502 response and `completeStage` not called | Unit + Integration |
| AC2-revised | Fixture journey with `productId` set; monkey-patch `ownerRepoForFeature` to throw; assert clear error and `completeStage` not called | Unit + Integration |
| AC3-revised | Fixture journey with NO `productId`; monkey-patch `ownerRepoForFeature` to throw; assert no error and `completeStage` IS called | Unit + Integration |
| AC4 | Satisfied directly by AC2-revised's own test — no separate test needed | Manual (DoD cross-reference) |

## Assumptions

- `journey.productId`, confirmed via full code reading of `handlePostProductFeature` (`products.js`), `saveJourney`/`listJourneys` (`journey-store-pg.js`), and `dfr-s1`'s own prior reload fix, is reliably present on the in-memory `journey` object whenever a feature was created via the product-page "Start a new feature" flow, across create/save/reload-after-restart.
- `handlePostGateConfirm` is directly invokable in a test harness with a mock `req`/`res`, matching the `mockReq`/`mockRes` pattern already established in `check-ep1-s5-error-handling.js` and `check-ep1-s6-instrumentation.js`.
- No further unknowns remain — this contract reflects confirmed code, not hypothesis.

## Estimated touch points

Files: `src/web-ui/routes/journey.js` (single call site), `tests/check-acdg-s1-*.js` (new).
Services: None new.
APIs: None new.
