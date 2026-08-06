# Contract Proposal — Automatically reflect a web-UI journey stage completion in pipeline-state.json (css-s2)

**What will be built:**
- `src/web-ui/adapters/pipeline-state-commit-writer.js` (new) — exports a D37 injectable function (`setPipelineStateCommitWriter()`/`getPipelineStateCommitWriter()`) that, given a journey's stage-completion context and `req.session.accessToken`, writes the corresponding advance to the connected repo's `pipeline-state.json` via the GitHub Contents API, mirroring `das-s1`'s `artefact-commit-writer.js` shape and reusing `mtrr-s1`'s `ownerRepoForFeature` to resolve the target repo.
- A bounded in-request retry wrapper around that write (fixed small retry count, no backoff beyond the request's own lifetime).
- A `sync_log` write (new Postgres table, shared with css-s3) recording `entry_type: 'gap'` when retries are exhausted.
- Wiring into `src/web-ui/routes/journey.js`'s `handlePostGateConfirm` — sequenced after `das-s1`'s existing artefact-commit call, not blocking the operator's response if it fails.

**What will NOT be built:**
- Background/queued retry beyond the request's lifetime — explicitly excluded per the Step 1.5 architecture decision.
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
