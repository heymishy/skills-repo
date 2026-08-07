# Implementation Plan: das-s1 — Commit completed-stage artefacts to the product's connected repo, with git-fallback on Resume conversation

**Story:** artefacts/2026-08-06-durable-artefact-storage/stories/das-s1-commit-artefact-to-repo-with-git-fallback.md
**Test plan:** artefacts/2026-08-06-durable-artefact-storage/test-plans/das-s1-test-plan.md
**DoR contract:** artefacts/2026-08-06-durable-artefact-storage/dor/das-s1-dor-contract.md

## Verified assumptions (read the real code before planning)

- `sign-off-writer.js`'s `commitSignOff(artefactPath, payload, token, owner, repo)` does: fetch `/user` for
  real identity, base64-encode content, PUT to `/repos/{owner}/{repo}/contents/{path}` with `sha` for
  updates, throws `SignOffConflictError` on 409, fails closed if `owner`/`repo` missing. Confirmed matches
  the story's paraphrase — generalising this directly.
- `export-data-source.js`'s `ownerRepoForFeature(slug, credential)` resolves `{owner, repo}` from the
  tenant-scoped `journeys` -> `products` lookup, throwing `ExportNotFoundError` (no message leakage) when
  there is no linked product/repo. This is exactly the signal needed to distinguish "product has no
  connected repo" (AC4 — skip commit, no error) from "product has a repo but the commit itself failed"
  (AC2 — block completion, surface error).
- `artefact-fetcher.js`'s `fetchArtefact(featureSlug, artefactType, token, repoOverride)` already builds
  the exact path convention `artefacts/{slug}/{stage}.md` against `{owner}/{repo}/contents/...` — reusable
  as-is for the git-fallback read in `handleGetJourneyStageView` (AC3/AC5), no new fetch logic needed.
- `handlePostGateConfirm` (journey.js) is the actual stage-completion handler (not a differently-named
  function) — local disk write happens first (existing), then Postgres best-effort save, then
  `_journeyStore.completeStage(...)`. The git commit must be inserted BEFORE `completeStage()` is called,
  matching ADR-023's write-then-verify precedent already used elsewhere in this function.
- `handleGetJourneyStageView` (journey.js:717) is the "Resume conversation" / stage-view read path.
  Local file read happens at line ~771 via `fs.readFileSync` inside a `try/catch` that silently swallows
  failure, leaving `artefactContent` = `''`, which later renders "No artefact content found." (line ~903).
  This is the exact spot needing the git-fallback.
- Both `journey.js` and other adapters use a lazy `require(...)` pattern for adapters not already at the
  top of the file (e.g. `require('../adapters/journey-store-pg').saveArtefact(...)`), rather than adding a
  new top-level `require`. Following that existing convention for the new adapter calls added to
  `journey.js`, to stay consistent with the file's own style and avoid growing the top-of-file import list
  further for a file already close to 4,200 lines.

## Tasks

1. **New D37 adapter module** — `src/web-ui/adapters/artefact-commit-writer.js`
   - `setArtefactCommitAdapter(fn)` / `getArtefactCommitAdapter()` — default stub throws
     `"Adapter not wired: artefactCommitAdapter. Call setArtefactCommitAdapter() with a real implementation before use."`
   - `commitArtefact(artefactPath, content, token, owner, repo)` — calls through the wired adapter (never
     calls `realCommitArtefact` directly), mirroring `repo-adapter.js`'s `listRepos()`/`createRepo()` convention.
   - `realCommitArtefact(artefactPath, content, token, owner, repo)` — generalises `sign-off-writer.js`'s
     `commitSignOff` mechanics: fail-closed on missing owner/repo, fetch `/user` for real identity, GET the
     existing file first to obtain `sha` if present (404 is fine — new file), PUT with base64 content,
     throw `ArtefactCommitConflictError` on 409, throw a plain `Error` on any other non-2xx.
   - No other module touched in this task.

2. **Stage-completion handler changes** — `src/web-ui/routes/journey.js`'s `handlePostGateConfirm`
   - After the existing local-disk write + Postgres best-effort save, before the
     `_journeyStore.completeStage(...)` call: resolve `{owner, repo}` via
     `ownerRepoForFeature(journey.featureSlug, req.session.accessToken)` (lazy-required from
     `../adapters/export-data-source`).
     - `ExportNotFoundError` → no connected repo (or no linked product) → skip the commit entirely, proceed
       to `completeStage()` exactly as today (AC4 — byte-for-byte unchanged for repo-less products).
     - Resolved successfully → call `commitArtefact(artefactRelPath, diskContent, req.session.accessToken, owner, repo)`
       (lazy-required from `../adapters/artefact-commit-writer`), reading `diskContent` back from the file
       just written (disk-canonicity, ADR-023) rather than trusting `session.artefactContent` directly.
       - Success → proceed to `completeStage()` (AC1).
       - Any other error (including `ArtefactCommitConflictError`) → do NOT call `completeStage()`, do NOT
         mark `session._stageDone`, respond with a clear actionable error (422/502-style JSON with a plain
         message) instead of falling through to the existing success path (AC2).
   - This task does not touch `handleGetJourneyStageView` or `server.js`.

3. **Stage-view read-path changes (git-fallback)** — `src/web-ui/routes/journey.js`'s
   `handleGetJourneyStageView`
   - After the existing local `fs.readFileSync` attempt: if `artefactContent` is still empty, attempt the
     git fallback — resolve `{owner, repo}` via `ownerRepoForFeature(journey.featureSlug, req.session.accessToken)`,
     then `fetchArtefact(journey.featureSlug, stageName, req.session.accessToken, {owner, repo})`
     (both lazy-required, matching this file's existing convention).
     - `ownerRepoForFeature` throws (no repo connected) → fall through unchanged to today's default
       "No artefact content found." (no regression for repo-less products' stage-view).
     - Resolved but `fetchArtefact` succeeds → use the fetched content as `artefactContent` (AC3).
     - Resolved but `fetchArtefact` throws (not-found, network, access revoked) → set a distinct,
       explicit "could not be retrieved" message distinguishing this double-failure case from the generic
       default (AC5), still non-blank/non-broken-looking.
   - This task does not touch `handlePostGateConfirm` or `server.js`.

4. **D37 wiring in server.js (separate task, per D37 rule 3)**
   - Import `setArtefactCommitAdapter, realCommitArtefact` from `./adapters/artefact-commit-writer`.
   - Wire `if (process.env.NODE_ENV !== 'test') { setArtefactCommitAdapter(realCommitArtefact); ... }`,
     matching the exact pattern already used for `setListReposAdapter(realListRepos)` /
     `setCreateRepoAdapter(realCreateRepo)` immediately above it.
   - No other file touched in this task.

5. **Tests** — `tests/check-das-s1-commit-artefact-git-fallback.js` (new file, auto-discovered by
   `scripts/run-all-tests.js`'s `tests/check-*.js` glob)
   - The 9 tests from the test plan (6 unit + 1 integration + 2 NFR), written first (RED), following the
     hand-rolled `test(name, fn)` + sequential `main()` runner convention used by
     `tests/check-mtrr-s1-tenant-scoped-repo-resolution.js`.

6. **Full regression pass**
   - Run the full suite (`npm test`), not just the new file — particularly anything touching `journey.js`,
     `sign-off-writer.js`, `export-data-source.js`, `repo-adapter.js`, and `server.js`'s D37 wiring blocks,
     to catch any accidental behavioural change to the surrounding stage-completion/stage-view flow.

## Explicit non-goals (per story Out of Scope)

- No change to the inline-edit-then-resave flow (`handlePostJourneyStageArtefact`) — stays local-disk-only.
- No change to `ownerRepoForFeature`/`export-data-source.js` itself — consumed as-is.
- No recovery of already-orphaned journeys.
