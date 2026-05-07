## Story: Post-journey automation — auto-write pipeline-state.json on stage completion

**Epic reference:** artefacts/2026-05-07-web-ui-outer-loop-extensions/discovery.md
**Discovery reference:** artefacts/2026-05-07-web-ui-outer-loop-extensions/discovery.md
**Benefit-metric reference:** Reduction in manual pipeline-state.json edits; pipeline state accuracy increases as a side-effect.

## User Story

As an **operator completing journey stage actions in the web UI**,
I want pipeline-state.json to be updated automatically when I commit an artefact or confirm a DoR sign-off,
So that the pipeline state stays accurate without requiring me to edit the file by hand after every action.

## Benefit Linkage

**Metric moved:** Manual bookkeeping steps per feature delivery — currently every artefact commit and sign-off in the web UI requires a follow-up manual edit to pipeline-state.json. This story eliminates that edit for the two highest-frequency events.
**How:** Hooking into the existing artefact-commit and sign-off endpoints to trigger a read-modify-write update to pipeline-state.json on the same request removes the manual step entirely from the operator's flow.

## Architecture Constraints

- **Local disk only.** This story writes to the local `pipeline-state.json` file (at `COPILOT_REPO_PATH/.github/pipeline-state.json` or the standard repo root location). Remote GitHub API write of the file is out of scope.
- **Read-modify-write, never full overwrite.** The handler reads the current state, applies the minimum change (field update only), validates the result against `.github/pipeline-state.schema.json`, then writes the result. A full-file replace from a potentially stale in-memory copy is not acceptable (this is the disk-canonicity rule from ADR-023/ougl decisions).
- **Schema validation before every write.** If the post-modification state fails schema validation, the write is rejected, the operator sees an error message, and the file is not written. The journey stage is unaffected.
- **Two trigger events only** (this story): (1) artefact committed via the journey commit button, (2) DoR sign-off confirmed via the sign-off button. Other stage transitions are out of scope.
- **D37 injectable adapter rule.** The pipeline-state writer is introduced as an injectable adapter (`_pipelineStateWriter`) with a stub that throws. The real implementation is wired in `server.js`. `NODE_ENV=test` stubs it for test isolation.
- No new npm dependencies — `fs`, `path`, and the existing `pipeline-state.schema.json` file (read via `require()`) are sufficient.
- Path traversal guard on the pipeline-state.json path (derived from `COPILOT_REPO_PATH`, server-side only).

## Dependencies

- **Upstream:** ougl.5 (gate-confirm artefact write — DoD-complete) and ougl.7 (DoR sign-off — DoD-complete).
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given the operator commits an artefact via the journey UI (e.g. commits discovery.md for a feature), when the commit succeeds, then `pipeline-state.json` is updated automatically: the corresponding feature's stage entry has `status: "complete"` and the `artefact` path set to the committed file's relative path — without any manual editor action.

**AC2:** Given the operator confirms a DoR sign-off via the journey sign-off button, when the sign-off succeeds, then the story's `dorStatus` field in `pipeline-state.json` is set to `"signed-off"` — automatically, on the same HTTP request that processed the sign-off.

**AC3:** Given the current `pipeline-state.json` does not contain an entry for the active feature, when an artefact is committed or a sign-off is confirmed, then the feature entry is created with a minimal valid structure before the change is applied — the file is not left with a missing feature entry.

**AC4:** Given the auto-write would produce a state object that fails `.github/pipeline-state.schema.json` validation, when the handler detects the failure, then the file write is skipped, the operator sees an error message ("Pipeline state update skipped — schema validation failed: <reason>"), and the artefact commit or sign-off itself is not rolled back.

**AC5:** Given a concurrent request attempts to write pipeline-state.json while another write is in progress, when the second write begins, then it reads the post-first-write version of the file (not a cached pre-first-write copy) — the read-modify-write is atomic at the file level (file lock or sequential queueing).

**AC6:** Given the auto-write succeeds, when the server logs the event, then the log entry includes: the fields changed, the before/after values for each changed field, and the feature slug — access tokens and session IDs are never logged.

**AC7:** Given `NODE_ENV=test`, when the test suite runs, then the `_pipelineStateWriter` adapter is stubbed (does not touch the filesystem) and all AC1–AC6 behaviours are tested by injecting a spy into the stub.

## Out of Scope

- Writing pipeline-state.json changes to GitHub (remote git push / GitHub API) — local disk only.
- Auto-updating pipeline-state.json for stage transitions other than artefact-commit and DoR sign-off (e.g. benefit-metric, test-plan completion) — those are follow-on stories.
- Triggering a git commit of the updated pipeline-state.json — that remains a manual git operation.

## NFRs

- **Security:** The pipeline-state.json path is derived entirely from server-side env var (`COPILOT_REPO_PATH`). No path component is accepted from the client.
- **Data integrity:** The write must be atomic — using a temp-file-then-rename pattern to prevent a partial write leaving a corrupt JSON file.
- **Observability:** Schema validation failures are logged at WARN level with the full ajv/jsonschema error message (not just "validation failed").

## Complexity Rating

**Rating:** 2 — read-modify-write with schema validation, concurrency safety, and injectable adapter wiring.
**Scope stability:** Stable.
