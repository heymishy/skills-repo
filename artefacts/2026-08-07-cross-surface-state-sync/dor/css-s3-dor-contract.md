# Contract Proposal — Detect a genuine cross-surface conflict, resolve it to pipeline-state.json's value, and log it (css-s3)

**REVISED 2026-10-24** — see `decisions.md`'s two css-s3 ARCH entries ("last synced marker design" and "css-s1-direction wiring scope refinement"). Two corrections from the original (August) contract: (1) `pipeline-state-commit-writer.js` was never built (css-s2's own real scope ended up narrower — see css-s2's own ARCH entry); the real css-s2 wiring point is `pipeline-state-github-writer.js`. (2) css-s1's direction gets `lastSyncedStage` bookkeeping only, not a real conflict-branch call — its actual call site is structurally incapable of producing a genuine two-different-values conflict today (single gate, boolean-ish completion state; its own existing idempotency check already correctly treats "both sides agree" as a no-op, not a conflict).

**What will be built:**
- `lastSyncedStage` field added to `.github/pipeline-state.schema.json`'s story-level schema (ADR-003 schema-first) — the shared "what did both sides last agree on" marker, read by both directions.
- `src/sync/conflict-resolver.js` (new) — `detectConflict(lastSyncedStage, pipelineStateValue, journeyValue)`, a pure comparison function (no D37 needed — no I/O, nothing to swap in tests/prod), and `resolveConflict(featureSlug, tenantId, pipelineStateValue, journeyValue)`, which writes a `sync_log` entry via `sync-log.js`'s new `logConflict()` export and returns `pipelineStateValue` (always the winner).
- `sync-log.js` extended with `logConflict(featureSlug, tenantId, pipelineStateValue, journeyValue, resolvedValue)` — writes `entry_type: 'conflict'` with all three value columns populated (unlike css-s2's `'gap'` entries, which only populate `journey_value`).
- Wired into `pipeline-state-github-writer.js`'s existing `applyStateUpdate(state, featureSlug, storyId, stateUpdate)`: `state` already holds the freshly-fetched current pipeline-state.json (including the story's current `stage` and `lastSyncedStage` fields — no new fetch needed); compare against `stateUpdate.stage` (the web-UI's new value) using `detectConflict`; on conflict, skip applying the new `stage` value (pipeline-state.json's own value wins by definition) and call `resolveConflict` to log it; either way, update `lastSyncedStage` to the resulting stage value after a successful write.
- `lastSyncedStage` bookkeeping (read before sync, written after a successful sync) added to css-s1's `journey-sync-client.js`/`cli-gate-advance.js` — keeps the marker current from the CLI side, without a conflict-branch call (see decisions.md for why).

**What will NOT be built:**
- Automatic conflict avoidance/locking — detection and resolution only, after the fact.
- A dedicated conflict-log browsing UI — AC3 only requires the log entry exist and be queryable via a direct data-layer read.
- A real conflict-branch call inside `syncGateAdvanceToJourney` (css-s1's direction) — deferred to css-s4, which extends sync to gate types where a genuine two-different-values conflict becomes structurally possible on that side.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | `conflictDetector_flagsGenuineConflict_whenBothSidesChangedSinceLastSync`, `conflictDetector_doesNotFlagConflict_whenOnlyOneSideChangedSinceLastSync` | unit |
| AC2 | `conflictResolver_correctsJourneyToMatchPipelineStateValue`, `fullSyncFlow_detectsAndResolvesConflict_endToEnd` | unit + integration |
| AC3 | `conflictResolver_logsBothValuesAndWinner` | unit |
| AC4 | `conflictLog_hasNoEntry_forOrdinarySingleSidedSync` | unit |

**Assumptions:**
- The "last synced" marker lives in `pipeline-state.json` only (not a new `journeys` column) — see decisions.md.
- The integration test (`fullSyncFlow_detectsAndResolvesConflict_endToEnd`) exercises the mechanism through `pipeline-state-github-writer.js`'s real `applyStateUpdate` with synthetic divergent fixture values, per the test plan's own "mocked Postgres and mocked Contents API" framing — not through css-s1's real call site, which cannot produce a genuine conflict today.

**Estimated touch points:**
Files: `.github/pipeline-state.schema.json`, `src/web-ui/adapters/sync-log.js` (extend), `src/sync/conflict-resolver.js` (new), `src/web-ui/adapters/pipeline-state-github-writer.js` (real conflict wiring), `src/sync/journey-sync-client.js` + `src/enforcement/cli-gate-advance.js` (marker bookkeeping only)
Services: None new
APIs: None new
