# Contract Proposal — Backfill already-completed stage artefacts to a repo at the moment it's connected (das-s3)

**What will be built:**
- A new backfill function (e.g. `backfillCompletedStagesToRepo(journey, owner, repo, accessToken)`) that, given a journey's `completedStages` list, checks each stage's local artefact file for existence and, if present, commits it via `das-s1`'s existing `artefact-commit-writer.js`'s `commitArtefact`.
- Wiring this function into `_applyRepoChange` (`src/web-ui/routes/product-repo.js`) — the already-established consolidation point `handlePutProductEdit` and `handlePostConnectRepo` both call — so both entry points get the feature automatically.
- Migrating `handlePostProductRepoCreate` (`src/web-ui/routes/products.js`) to call `_applyRepoChange` instead of its own separate raw `UPDATE products SET ...`, so all three entry points converge on one code path (matching `prc-s4.1`'s own precedent for the other two).
- Adding a `backfill: { attempted, succeeded, skipped }` field to `_applyRepoChange`'s return value, surfaced in the JSON response of all three entry points.

**What will NOT be built:**
- Any recovery mechanism for content already lost to a prior redeploy (out of scope per the story).
- Any UI rendering of the `backfill` field.
- Any change to `das-s1`'s own forward-going dual-write trigger.

**How each AC will be verified:** Per the test plan — 5 unit tests (AC1, AC2, AC3, AC4), 2 integration tests (AC1/AC3 exercised through all 3 real entry points), 3 NFR tests.

**Assumptions:**
- The exact list of "already-completed stages" is read from the journey's existing `completedStages` field (already used throughout this epic) — no new data source needed.
- `handlePostProductRepoCreate`'s migration to `_applyRepoChange` is a pure refactor of its own DB-write step; its repo-creation logic (`_repoAdapter.createRepo`) and error handling for `RepoNameTakenError` are unchanged.

**Estimated touch points:**
Files: `src/web-ui/routes/product-repo.js` (`_applyRepoChange`, plus the new backfill function — either in this file or a new `src/web-ui/adapters/artefact-backfill.js` if the coding agent judges a separate module cleaner), `src/web-ui/routes/products.js` (`handlePostProductRepoCreate` migration), a new/extended test file (e.g. `tests/check-das-s3-backfill-on-repo-connect.js`)
Services: GitHub Contents API (already used by `das-s1`)
APIs: None new
