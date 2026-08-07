# Implementation Plan: das-s3 — Backfill already-completed stage artefacts to a repo at the moment it's connected

**Story:** artefacts/2026-08-06-durable-artefact-storage/stories/das-s3-backfill-artefacts-on-repo-connection.md
**DoR:** artefacts/2026-08-06-durable-artefact-storage/dor/das-s3-dor.md
**Test plan:** artefacts/2026-08-06-durable-artefact-storage/test-plans/das-s3-test-plan.md

## Baseline

`npm test` (`node scripts/run-all-tests.js`) on a fresh rebase onto master: 469 file(s) run, 38 failed — matches the pre-existing, unrelated baseline named in the dispatch instructions. Failing files list captured before any change in this story (see verification notes); none of them touch `product-repo.js`, `products.js`, or repo-connection flows.

## Tasks

1. **New helper module `src/web-ui/adapters/artefact-backfill.js`** — `backfillCompletedStagesToRepo(journey, owner, repo, accessToken, repoRoot)`. Reads `journey.completedStages`, checks each stage's local artefact file for existence under `repoRoot`, and for each present file calls `artefact-commit-writer.js`'s `commitArtefact` (das-s1's existing mechanism — no new commit code). Best-effort per stage (AC2): a missing file or a failed commit attempt is skipped, never blocks the rest. Zero-completed-stages short-circuits with no filesystem work at all (AC4). Not a D37 adapter (no swappable seam is introduced — mirrors `export-data-source.js`'s `ownerRepoForFeature`, an internal helper).

2. **Wire the backfill into `_applyRepoChange`** (`src/web-ui/routes/product-repo.js`) — the single, already-established consolidation point. After the existing UPDATE succeeds: query `journeys` for this product, tenant-scoped (`WHERE product_id = $1 AND tenant_id = $2`, ADR-025), resolve `repoRoot` via the existing `adapters/repo-root.js` (tenant-scoped, matching every other local-disk read site), and call the new helper once per journey. Aggregate `{attempted, succeeded, skipped}` across all of the product's journeys and return it as `backfill` on `_applyRepoChange`'s result (AC3). Wrapped in its own try/catch — a backfill failure never undoes or blocks the repo connection that already succeeded.

3. **Surface `backfill` in the two entry points that already call `_applyRepoChange`** — `handlePostConnectRepo` (`product-repo.js`) and `handlePutProductEdit` (`products.js`): add the `backfill` field to their existing JSON success responses (AC3).

4. **Migrate `handlePostProductRepoCreate`** (`products.js`) to call `_applyRepoChange` instead of its own separate raw `UPDATE products SET ...` — removing that duplicate statement so all three entry points converge on one code path (AC1, AC3). `_repoAdapter.createRepo` / `RepoNameTakenError` handling above the DB-write step is unchanged.

5. **Write the failing tests first** (`tests/check-das-s3-backfill-on-repo-connect.js`), covering the test plan's 5 unit tests, 2 integration tests, and 3 NFR tests, then implement against them (steps 1–4 above) until green.

6. **Update two pre-existing test files' mock pools** (mechanical follow-on from step 4, not new scope) — `tests/check-prc-s2.1-create-repo.js` (T2, T5) and `tests/check-rpc-s1-connect-repo.js` (IT1) call `handlePostProductRepoCreate` directly against hand-rolled mock `pool.query` implementations that only recognised the old raw `UPDATE` statement. Now that the handler routes through `_applyRepoChange`, those mocks must also answer its tenant-ownership `SELECT` and the backfill's journeys `SELECT` (returning an empty result is sufficient — no journeys fixture needed for those pre-existing tests), and must wire `repoAdapter.setRepoAdapter(...)` so `_applyRepoChange`'s access re-verification step doesn't throw the D37 unwired-adapter error. See `decisions.md` for the design rationale.

## Design decision requiring a note in decisions.md

Migrating `handlePostProductRepoCreate` onto `_applyRepoChange` literally (as the DoR contract describes) also pulls in `_applyRepoChange`'s tenant-ownership `SELECT` and its repo-access re-verification (`getRepoAdapter()`) — neither of which the old raw-`UPDATE`-only handler ever performed. This is a real, small behavioural change (one extra `SELECT` + one extra GitHub access-check GET per repo-create call) beyond "only the DB-write step changes," but is the correct outcome of true single-path consolidation (one code path, uniformly verified, for all three callers) rather than a parameterised special case. In production the access check is a harmless no-op (you always have access to a repo you just created with your own token). Logged as a DESIGN decision in `decisions.md`.

## Out of scope (unchanged from story)

- Recovering already-orphaned journey content lost to a prior redeploy.
- Any UI rendering of the new `backfill` response field.
- Any change to das-s1's own forward-going dual-write trigger.
