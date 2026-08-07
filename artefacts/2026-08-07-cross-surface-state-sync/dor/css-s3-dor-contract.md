# Contract Proposal — Detect a genuine cross-surface conflict, resolve it to pipeline-state.json's value, and log it (css-s3)

**What will be built:**
- `src/sync/conflict-resolver.js` (new) — exports a D37 injectable comparison/resolution function that, given `pipeline-state.json`'s current gate value, the journey's current stage value, and a "last synced" marker, determines whether both sides changed independently since that marker (a genuine conflict) versus an ordinary single-sided advance.
- On conflict: corrects the journey's Postgres record to match `pipeline-state.json`'s value (reusing css-s2's write-adapter shape in reverse — writing to Postgres, not GitHub), and writes a `sync_log` entry (`entry_type: 'conflict'`) recording both values, the winner, and a timestamp.
- Wiring into both css-s1's CLI-side sync path and css-s2's web-UI-side sync path, so conflict detection runs before either direction's write is applied.
- A "last synced" marker — added to the schema per ADR-003 (schema-first), stored wherever is simplest given css-s1/css-s2's existing data shapes (a candidate: a `last_synced_at` column on `journeys`, or a field within the existing `pipeline-state.json` feature entry — the coding agent should choose based on which is simpler to keep consistent, and must add it to `pipeline-state.schema.json` in the same commit if the pipeline-state.json side is chosen).

**What will NOT be built:**
- Automatic conflict avoidance/locking — detection and resolution only, after the fact.
- A dedicated conflict-log browsing UI — AC3 only requires the log entry exist and be queryable via a direct data-layer read.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | `conflictDetector_flagsGenuineConflict_whenBothSidesChangedSinceLastSync`, `conflictDetector_doesNotFlagConflict_whenOnlyOneSideChangedSinceLastSync` | unit |
| AC2 | `conflictResolver_correctsJourneyToMatchPipelineStateValue`, `fullSyncFlow_detectsAndResolvesConflict_endToEnd` | unit + integration |
| AC3 | `conflictResolver_logsBothValuesAndWinner` | unit |
| AC4 | `conflictLog_hasNoEntry_forOrdinarySingleSidedSync` | unit |

**Assumptions:**
- The "last synced" marker's exact storage location (schema choice above) is left to the coding agent's judgment within the ADR-003 schema-first constraint — this is a genuine implementation detail, not a spec gap, since either location satisfies all 4 ACs identically from an observable-behaviour standpoint.
- This story's resolver is called synchronously from both css-s1's and css-s2's existing call sites — no new triggering mechanism (e.g. a scheduled job) is introduced.

**Estimated touch points:**
Files: `src/sync/conflict-resolver.js` (new), `src/sync/journey-sync-client.js` (css-s1, wire the conflict check in), `src/web-ui/adapters/pipeline-state-commit-writer.js` (css-s2, wire the conflict check in), `pipeline-state.schema.json` (if the last-synced marker lands there)
Services: None new
APIs: None new
