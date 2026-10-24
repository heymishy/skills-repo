# Contract Proposal — Automatically reflect a web-UI journey stage completion in pipeline-state.json (css-s2)

**REVISED 2026-10-24** — see `decisions.md` ARCH entry "css-s2, pre-code discovery". The write-adapter, retry wrapper, Contents API mechanics, and `journey.js` wiring described in this contract's original authoring (2026-08-07) already shipped under `wsd-s1`/`wsd-s2`/`wsd-s4`/`owle.6`/`dcuf-s1`/`acdg-s1`/`acdg-s2`, confirmed by direct code reading before any new code was written. Building a second, parallel `pipeline-state-commit-writer.js` as originally specified would duplicate already-shipped, load-bearing production infrastructure and create a correctness hazard (two independently-retrying writers for the same file). This story's real remaining scope is the `sync_log` table and gap-logging only.

**What will be built:**
- A `sync_log` table (new Postgres table, shared with css-s3), migrated in `server.js` following the existing `CREATE TABLE IF NOT EXISTS` on-startup pattern (e.g. the `product_rollups` precedent).
- `src/web-ui/adapters/sync-log.js` (new) — a plain module following `journey-store-pg.js`'s own convention (own `Pool`, a `_setPoolForTesting` escape hatch for tests; not a D37 injectable adapter, since no new adapter seam is being introduced — the existing `setPipelineStateWriter()`/`getPipelineStateWriter()` seam already satisfies D37 for this mechanism) — exports a function that writes a `sync_log` row with `entry_type: 'gap'`, the feature slug, tenant ID, and gate/stage name. Never accepts or stores a token/credential parameter.
- One new call in `src/web-ui/routes/journey.js`'s existing `pipeline_state_write_failed` catch block (`handlePostGateConfirm`, ~line 2817) — the already-existing, already-correct point where the already-existing `_pipelineStateWriter` adapter's own internal retries have already been exhausted, for either the local-fs or GitHub-API writer. Guarded by `if (process.env.DATABASE_URL)`, matching every other optional-Postgres write in this file.
- One new NFR test asserting the AC2 latency ceiling (the sequencing itself already exists; only the explicit test is new).

**What will NOT be built:**
- A new `pipeline-state-commit-writer.js` adapter — already exists as `pipeline-state-github-writer.js` (`wsd-s2`), already wired, already tested.
- A new D37 wiring task — the existing `setPipelineStateWriter()`/`getPipelineStateWriter()` seam is unchanged by this story.
- AC4's literal "skip write when no matching feature slug" behaviour — superseded by already-shipped, already-relied-upon auto-create behaviour; see `decisions.md`.
- Background/queued retry beyond the request's lifetime — explicitly excluded per the Step 1.5 architecture decision (and already not implemented in the existing writer).
- Conflict detection — css-s3.
- Any gate type beyond what the test plan exercises generically — css-s4 extends to the full vocabulary, reusing this story's mechanism unchanged.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | `pipelineStateCommitWriter_usesAuthenticatedUserToken_notServiceAccount`, `stageCompletionRequest_writesPipelineStateJson_withinSameRequestLifetime` | unit + integration; manual (real commit-author check, Scenario 1) |
| AC2 | `pipelineStateWrite_addsNoMoreThan2xDasS1Latency` | NFR |
| AC3 | `pipelineStateCommitWriter_logsReconciliationGap_afterRetriesExhausted`, `pipelineStateCommitWriter_neverPersistsTokenAfterRequestCompletes`, `stageCompletionRequest_succeedsForOperator_evenWhenPipelineStateWriteFails` | unit + integration |
| AC4 | `pipelineStateCommitWriter_skipsWrite_whenNoMatchingFeatureSlugEntry` | unit |

**Assumptions:**
- `mtrr-s1`'s `ownerRepoForFeature` is called with the same journey context already available inside `handlePostGateConfirm` — no new context-threading needed, since `das-s1`'s own artefact-commit call already resolves the same repo.
- The `sync_log` table (new, shared with css-s3 per the ADR-026 reuse-check decision) is created in this story's migration, since css-s2 ships first in the walking-skeleton sequence; css-s3 reuses the table without a schema change.
- The bounded retry count is a small fixed number (e.g. 2 attempts) — the exact number is an implementation detail the coding agent may choose, provided AC2's 2x latency ceiling is respected; not pinned to a specific integer in the story itself.

**Estimated touch points:**
Files: `src/web-ui/routes/journey.js`, `src/web-ui/adapters/pipeline-state-commit-writer.js` (new), `src/web-ui/server.js` (D37 wiring block, mirroring `das-s1`'s), a new migration for `sync_log` (e.g. `scripts/migrate-schema-sync-log.js` or inline in `server.js` per the `product_rollups` precedent)
Services: GitHub Contents API (already used by `das-s1`)
APIs: None new beyond the existing Contents API
