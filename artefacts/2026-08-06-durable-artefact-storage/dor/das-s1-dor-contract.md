# Contract Proposal: Commit completed-stage artefacts to the product's connected repo, with git-fallback on Resume conversation

**Story reference:** artefacts/2026-08-06-durable-artefact-storage/stories/das-s1-commit-artefact-to-repo-with-git-fallback.md
**Date:** 2026-08-07

## What will be built

A new D37 injectable adapter in a new module (e.g. `src/web-ui/adapters/artefact-commit-writer.js`): `setArtefactCommitAdapter(fn)`/`getArtefactCommitAdapter()` with a throw-on-unwired default stub, and a `realCommitArtefact(artefactPath, content, token, owner, repo)` implementation generalising `sign-off-writer.js`'s existing GitHub Contents API PUT mechanics (real user identity as commit author, base64 encoding, `sha` handling, 409 handling, fail-closed on missing owner/repo). At stage-completion time (the existing handler in `journey.js`), when the product has a connected repo, this adapter is called with the artefact content alongside the existing local-disk write — the git commit must succeed before the stage is marked complete (write-then-verify sequencing per the discovery-flagged hazard). `handleGetJourneyStageView`'s existing local-file read gains a fallback: on a missing local file, fetch the content from git via the same owner/repo resolution (`mtrr-s1`'s `ownerRepoForFeature`) before falling back to "not found."

## What will NOT be built

- Committing edited/re-saved artefact content to git — the existing inline-edit flow stays local-disk-only.
- Any change to `mtrr-s1`'s `ownerRepoForFeature`/`export-data-source.js`.
- Recovery of already-orphaned journeys.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Complete a stage for a repo-connected product, assert both the mocked commit adapter is called and the local file is written | Unit + integration |
| AC2 | Mock commit adapter rejection, assert stage not marked complete + clear error | Unit |
| AC3 | Local file deleted post-commit, assert git-fallback renders content | Unit + integration |
| AC4 | No connected repo, assert local-disk-only write unchanged, no commit attempted | Unit (regression guard) |
| AC5 | Both local and git fail, assert honest error message | Unit |

## Assumptions

- `sign-off-writer.js`'s commit mechanics generalise cleanly to a second use case (artefact commits vs sign-off commits) without needing GitHub-side changes — same Contents API, same auth model.

## Estimated touch points

- **Files:** new `src/web-ui/adapters/artefact-commit-writer.js`, `src/web-ui/routes/journey.js` (stage-completion handler + `handleGetJourneyStageView`), `src/web-ui/server.js` (D37 wiring block)
- **Services:** none new
- **APIs:** GitHub Contents API (already used by `sign-off-writer.js`)

## Schema dependency declaration (H8-ext)

**schemaDepends:** `[]`

Upstream (`mtrr-s1`) is a code-level reuse dependency (already merged), not a pipeline-state.json schema field dependency.

**Contract review:** ✅ PASSED — proposed implementation aligns with all 5 ACs.
