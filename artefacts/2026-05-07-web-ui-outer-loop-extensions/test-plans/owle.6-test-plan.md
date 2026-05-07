# Test Plan: owle.6 — Auto pipeline-state.json write

**Story:** artefacts/2026-05-07-web-ui-outer-loop-extensions/stories/owle.6-pipeline-state-auto-write.md
**Test file:** tests/check-owle6-pipeline-state-auto-write.js

---

## Technical Test Plan

### T1 — Artefact commit triggers pipeline-state.json update

**Type:** Integration (with _pipelineStateWriter spy)
**Setup:** Journey with `featureSlug: "test-feature"` at stage `discovery`. Pipeline-state stub contains `test-feature` entry with `discoveryStatus: "in-progress"`.
**Action:** POST to the artefact-commit endpoint (commit discovery.md).
**Assert:** (a) `_pipelineStateWriter` spy was called once. (b) The state object passed to the writer has `discoveryStatus: "complete"` and `artefact: "artefacts/test-feature/discovery.md"` for the feature.

---

### T2 — DoR sign-off triggers dorStatus update

**Type:** Integration (with _pipelineStateWriter spy)
**Setup:** Story in pipeline-state with `dorStatus: "in-progress"`. Journey at DoR stage.
**Action:** POST to the sign-off endpoint.
**Assert:** Writer called with `dorStatus: "signed-off"` on the correct story entry.

---

### T3 — Missing feature entry is created before write

**Type:** Unit
**Setup:** Pipeline-state has no entry for `featureSlug: "new-feature"`.
**Action:** Artefact commit for `new-feature`.
**Assert:** Written state contains a minimal valid entry for `new-feature` — does not throw on missing feature.

---

### T4 — Schema-invalid result is rejected, file not written

**Type:** Unit
**Setup:** Stub the state modifier to produce a state that fails schema validation (e.g. set `prStatus: "invalid-value"`).
**Action:** Artefact commit.
**Assert:** (a) `_pipelineStateWriter` write method not called. (b) Response includes a message containing "schema validation failed". (c) The artefact commit itself still returns success.

---

### T5 — Write is atomic (temp-file-then-rename pattern)

**Type:** Unit
**Setup:** Spy on `fs.rename` and `fs.writeFile`. Verify order of calls.
**Assert:** `writeFile` is called on a `.tmp` path first; `rename` is called second to move it over the target. No direct write to the target path without the temp-file step.

---

### T6 — Log entry includes before/after values but not access tokens

**Type:** Unit
**Setup:** Journey session contains `accessToken: "ghs_secret"`. State field `discoveryStatus` changes from `"in-progress"` to `"complete"`.
**Action:** Artefact commit.
**Assert:** (a) Log output contains `discoveryStatus`, `in-progress`, `complete`. (b) Log output does NOT contain `ghs_secret` or the string `accessToken`.

---

### T7 — NODE_ENV=test stubs the writer; filesystem not touched

**Type:** Unit / isolation
**Setup:** `NODE_ENV=test`. Real filesystem with a valid pipeline-state.json.
**Action:** Artefact commit.
**Assert:** Pipeline-state.json on disk is unchanged after the request — the stub intercepts the write.

---

### T8 — Concurrent write serialisation

**Type:** Integration
**Setup:** Two simultaneous POST requests to the artefact-commit endpoint.
**Assert:** Both requests complete; the final pipeline-state.json reflects both changes and is valid JSON (no interleaved write corruption).

---

## Plain-language AC Verification Script

**Before coding agent runs:** T1–T8 must all fail.

**After implementation — human smoke test steps:**

1. Commit a discovery.md artefact via the journey UI. Open `.github/pipeline-state.json`. Confirm `discoveryStatus: "complete"` for the feature.
2. Complete a DoR sign-off. Confirm `dorStatus: "signed-off"` for the story.
3. Check server console. Confirm log entry shows before/after field values. Confirm no access token in log.
4. Introduce a deliberate schema violation in the writer (temporary). Confirm the commit endpoint still returns success but the pipeline-state.json is not written.
