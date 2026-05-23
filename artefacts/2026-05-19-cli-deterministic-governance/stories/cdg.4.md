## Story: Web UI gate-confirm CLI validation integration

**Epic reference:** artefacts/2026-05-19-cli-deterministic-governance/epics/cdg-phase2-advance-and-trace.md
**Discovery reference:** artefacts/2026-05-19-cli-deterministic-governance/discovery.md
**Benefit-metric reference:** artefacts/2026-05-19-cli-deterministic-governance/benefit-metric.md

## User Story

As a **platform operator**,
I want to **have the web UI gate-confirm handler reject a `definition-of-ready` stage completion with a 422 and the specific failing check if the DoR artefact fails structural validation, and only write pipeline state when validation passes**,
So that **no pipeline-state.json stage advancement can occur through the web UI without a passing deterministic gate check, closing the enforcement gap identified in H7.1 and making M2 (gate bypass rate) measurable by construction**.

## Benefit Linkage

**Metric moved:** M2 — Gate bypass rate
**How:** Every web UI gate-confirm for a `definition-of-ready` stage now runs `cli-outer-loop.validate()` before calling `_pipelineStateWriter()`. If the check fails, state is not written — the bypass is structurally impossible through this path. Once cdg.5 adds trace emission, bypass rate is measurable with zero overhead. This story makes the rate structurally 0 for the web UI path.

## Architecture Constraints

- **ADR-H7.1:** Route handler calls `require('../enforcement/cli-outer-loop').validate(artefactPath, 'definition-of-ready', repoRoot)` directly — no `child_process.spawn`. No subprocess in route handlers.
- **ADR-023 (disk canonicity / ougl):** Artefact disk write by the journey handler precedes the `validate()` call. `validate()` reads the artefact from disk (already written). `_pipelineStateWriter()` is called only if `validate()` returns exit code 0. Order: write-artefact → validate → write-state.
- **Injectable adapter rule (D37):** `_validate` is injected via `setValidate(fn)` alongside the existing `_pipelineStateWriter` pattern. Default stub must throw with a message naming the adapter. Production wiring in `server.js` injects `require('../enforcement/cli-outer-loop').validate`.
- **Path traversal guard (ougl):** The `dorArtefactPath` passed to `validate()` is derived from session data (set earlier in the journey flow). Before calling `validate()`, the handler must resolve the path and assert it starts with `repoRoot`. Return 400 if the check fails.
- **Mandatory constraint:** All server-side inputs validated before use. No raw request data passed to `validate()` without sanitisation.
- **No frontend changes:** This story modifies `handlePostGateConfirm` in `src/web-ui/routes/journey.js` only. No changes to any frontend file, CSS, or HTML template.

## Dependencies

- **Upstream:** cdg.1 and cdg.2 must be DoD-complete (they are). `src/enforcement/cli-outer-loop.js` must export `validate(artefactPath, gateName, repoRoot)` on master.
- **Upstream:** `setPipelineStateWriter` injection pattern must be established in `server.js` (it is — already wired).
- **Downstream:** cdg.5 extends the same `handlePostGateConfirm` path to add trace emission after the state write.

## Acceptance Criteria

**AC1 — Validate called before state write on gate-confirm:**
Given a running web UI server with the `validate` adapter injected,
When a POST to the gate-confirm endpoint is made for a journey at the `definition-of-ready` stage with a valid DoR artefact path in session,
Then `validate(dorArtefactPath, 'definition-of-ready', repoRoot)` is called before `_pipelineStateWriter()` is called.

**AC2 — Validation failure returns 422 and does not write state:**
Given a DoR artefact on disk that fails `cli-outer-loop.validate()` (e.g. missing AC section),
When a POST to the gate-confirm endpoint is made,
Then the response is HTTP 422, the response body contains the failing check name and exit code, and `pipeline-state.json` is not modified.

**AC3 — Validation pass proceeds to state write:**
Given a DoR artefact on disk that passes `cli-outer-loop.validate()` (exit code 0),
When a POST to the gate-confirm endpoint is made,
Then `_pipelineStateWriter()` is called, the response is HTTP 200, and `pipeline-state.json` is updated.

**AC4 — Path traversal guard rejects paths outside repo root:**
Given a session containing a `dorArtefactPath` that resolves outside the `repoRoot` (e.g. `../../etc/passwd`),
When a POST to the gate-confirm endpoint is made,
Then the response is HTTP 400, `validate()` is not called, and `pipeline-state.json` is not modified.

**AC5 — Validate adapter is injectable via `setValidate(fn)` in `journey.js`:**
Given the route module exports `setValidate(fn)`,
When `server.js` wires the production validate function via `setValidate(require('../enforcement/cli-outer-loop').validate)`,
Then the production path uses the real `cli-outer-loop.validate`; tests can inject a stub via `setValidate(stub)` without touching `server.js`.

**AC6 — Default validate stub throws (D37):**
Given `journey.js` is loaded without `setValidate()` being called,
When `handlePostGateConfirm` is invoked,
Then the default validate stub throws an error with a message containing "Adapter not wired: validate" and naming the setup call.

**AC7 — Gate-confirm for non–definition-of-ready stages is not affected:**
Given a journey at a stage other than `definition-of-ready` (e.g. `test-plan`, `review`),
When a POST to the gate-confirm endpoint is made,
Then `validate()` is not called for that stage, the existing handler behaviour is unchanged, and all pre-existing gate-confirm tests continue to pass.

**AC8 — npm test suite covers all AC paths:**
Given the implementation is complete,
When `npm test` runs,
Then `tests/check-cdg4-gate-confirm-validation.js` exists and all its assertions pass, covering at minimum: AC2 (validation failure → 422, no state write), AC3 (validation pass → 200, state written), AC4 (path traversal → 400), AC6 (default stub throws), and AC7 (non-DoR stage not affected).

## Out of Scope

- Trace emission after gate-confirm — that is cdg.5.
- Validation for gate types other than `definition-of-ready` — deferred to a follow-on story.
- Frontend error display changes — the existing client-side error handling renders 422 responses; no frontend changes needed.
- `skills advance` CLI — that is cdg.3.
- Any changes to the journey GET handler or session management layer.

## Implementation Notes

In `src/web-ui/routes/journey.js`, the `handlePostGateConfirm` function currently:
1. Calls `_journeyStore.completeStage()`
2. Calls `_pipelineStateWriter(featureSlug, storyId, stateUpdate)`

After this story, the flow for `definition-of-ready` stage confirmations becomes:
1. Resolve `dorArtefactPath` from session data
2. Path traversal guard: `assert(path.resolve(dorArtefactPath).startsWith(repoRoot + path.sep))` → 400 if fails
3. Call `_validate(dorArtefactPath, 'definition-of-ready', repoRoot)` → 422 with error details if non-zero
4. Call `_journeyStore.completeStage()` (existing)
5. Call `_pipelineStateWriter(featureSlug, storyId, stateUpdate)` (existing)

The session must store the `dorArtefactPath` at the point when the DoR artefact is written to disk (earlier in the journey flow — this is the disk canonicity rule in action: artefact is on disk before gate-confirm fires). If the session does not contain a `dorArtefactPath` for a DoR stage confirm, return 422 with "DoR artefact path missing from session — cannot validate".

`setValidate` / default stub pattern (mirrors existing `setPipelineStateWriter` / `setPipelineStateWriterFactory` pattern in server.js):

```js
let _validate = () => { throw new Error('Adapter not wired: validate. Call setValidate() with cli-outer-loop.validate before use.'); };
function setValidate(fn) { _validate = fn; }
module.exports = { handlePostGateConfirm, setValidate };
```

In `server.js`:
```js
const { validate } = require('../enforcement/cli-outer-loop');
const { setValidate } = require('./routes/journey');
setValidate(validate);
```

## Complexity

**Rating:** 2 — The adapter injection pattern is established (mirrors `setPipelineStateWriter`). The main complexity is: (a) ensuring the `dorArtefactPath` is in session at gate-confirm time (requires tracing the journey flow to confirm where it is set), and (b) the 422 error response format — must include enough structured detail for the client and for cdg.5's trace emission to record.

## Scope Stability

**Stability:** Stable.
