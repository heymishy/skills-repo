# Definition of Ready: Pipeline-state auto-write (owle.6)

**Story reference:** artefacts/2026-05-07-web-ui-outer-loop-extensions/stories/owle.6-pipeline-state-auto-write.md
**Test plan reference:** artefacts/2026-05-07-web-ui-outer-loop-extensions/test-plans/owle.6-test-plan.md
**Verification script:** artefacts/2026-05-07-web-ui-outer-loop-extensions/test-plans/owle.6-test-plan.md (plain-language section)
**Review report:** Short-track — no formal review run. Zero HIGH findings.
**NFR profile:** artefacts/2026-05-07-web-ui-outer-loop-extensions/nfr-profile.md
**Assessed by:** GitHub Copilot (/definition-of-ready)
**Date:** 2026-05-08

---

## Contract Proposal

**What will be built:**
- Injectable adapter `_pipelineStateWriter` with throwing stub default: `throw new Error('Adapter not wired: pipelineStateWriter. Call setPipelineStateWriter() before use.')`.
- `setPipelineStateWriter(fn)` export function.
- The adapter is called from two event hooks: (1) after a successful artefact commit (`gate-confirm` handler success path); (2) after a DoR sign-off confirmation endpoint success path. The hook calls `_pipelineStateWriter(featureSlug, storyId, stateUpdate)`.
- Real implementation: `src/web-ui/adapters/pipeline-state-writer.js` — performs read-modify-write of `.github/pipeline-state.json` using a temp-file-then-rename pattern; validates the post-modification state against `.github/pipeline-state.schema.json` before committing the rename; rejects (throws) if schema validation fails.
- Wired in `server.js`: `setPipelineStateWriter(require('./adapters/pipeline-state-writer'))`.
- When `NODE_ENV=test`: the adapter is replaced with a no-op stub — `setPipelineStateWriter(() => {})` in server.js startup block.
- Log output: `{event: 'pipeline_state_updated', featureSlug, storyId, fieldsChanged}` — `accessToken` field NEVER logged.

**What will NOT be built:**
- GitHub API write (no push to remote).
- Full pipeline-state.json overwrite (read-modify-write only).
- Accepting the pipeline-state path from the client.
- Creating the schema file if absent (fail gracefully with error log).

**How each AC will be verified:**

| AC | Test | Type |
|----|------|------|
| AC1 — stub default throws | T1: call _pipelineStateWriter without wiring, assert throws with "not wired" message | Unit |
| AC2 — hooked on gate-confirm | T2: complete gate-confirm, assert adapter called with correct featureSlug + storyId | Integration |
| AC3 — hooked on sign-off | T3: complete sign-off, assert adapter called | Integration |
| AC4 — schema validation before write | T4: inject invalid state, assert write rejected + no file change | Integration |
| AC5 — temp-file-then-rename atomicity | T5: verify temp file cleaned up on success + failure paths | Integration |
| AC6 — no accessToken in log | T6: complete gate-confirm with session.accessToken set, assert log output contains no token | Security |
| AC7 — creates minimal feature entry | T7: run adapter on state without feature entry, assert feature added with required fields | Unit |
| AC8 — NODE_ENV=test uses no-op | T8: start server with NODE_ENV=test, complete gate-confirm, assert no write to disk | Integration |

**Assumptions:**
- `.github/pipeline-state.json` and `.github/pipeline-state.schema.json` exist in the repo root (written to disk as part of the ougl delivery).
- `jsonschema` Node module is NOT available (no new npm deps). Schema validation uses `JSON.parse` and manual key checks, or a bundled schema subset.
- The adapter receives `{ stage, dorStatus, health, updatedAt }` as the stateUpdate object.

**Architecture note — schema validation without npm:**
Since no new npm dependencies are allowed, the adapter must perform lightweight schema validation without `jsonschema`. Acceptable approach: check that required top-level keys are present and that enum values are from the allowed set. This is sufficient for the auto-write safety gate.

**Estimated touchpoints:**
- `src/web-ui/routes/journey.js` — add adapter call hooks in gate-confirm and sign-off handlers
- `src/web-ui/adapters/pipeline-state-writer.js` — new file (real implementation)
- `src/web-ui/server.js` — wire adapter + NODE_ENV test stub

---

## Contract Review

✅ **Contract review passed** — stub throws (D37 compliant). Temp-file-then-rename prevents partial writes. Schema validation before rename prevents corruption. No GitHub API calls. Adapter wiring is a separate task from hook insertion (D37 rule 3). AC1 explicitly covers the wiring AC requirement per H-ADAPTER.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story in As/Want/So format | ✅ PASS | "As an **operator completing a pipeline stage**" |
| H2 | ≥3 ACs in GWT format | ✅ PASS | 8 ACs, all GWT |
| H3 | Every AC has ≥1 test | ✅ PASS | T1–T8 cover all 8 ACs |
| H4 | Out-of-scope populated | ✅ PASS | GitHub API, full overwrite, client-supplied path, schema creation excluded |
| H5 | Benefit linkage | ✅ PASS | "Pipeline state accuracy and automation" named |
| H6 | Complexity rated | ✅ PASS | Complexity 2, Stable |
| H7 | No unresolved HIGH findings | ✅ PASS | Short-track — no review run; 0 HIGH findings |
| H8 | No uncovered ACs | ✅ PASS | All 8 ACs covered |
| H8-ext | Cross-story schema dep | ✅ PASS | Reads `.github/pipeline-state.schema.json` but does not modify schema. `schemaDepends: []` |
| H9 | Architecture constraints populated | ✅ PASS | D37 adapter pattern, ADR-023 disk canonicity, temp-file-then-rename, no accessToken logging |
| H-E2E | CSS-layout ACs | ✅ PASS (N/A) | No CSS-layout-dependent ACs |
| H-NFR | NFR profile exists | ✅ PASS | nfr-profile.md present; NFR-atomicity-pipelinestate, NFR-schema-pipelinestate, NFR-sec-no-token-log |
| H-NFR2 | Compliance NFRs | ✅ PASS | None |
| H-NFR3 | Data classification | ✅ PASS | Internal tooling, no PII |
| H-NFR-profile | NFR profile presence | ✅ PASS | artefacts/2026-05-07-web-ui-outer-loop-extensions/nfr-profile.md exists |
| H-GOV | Approved By | ✅ PASS | Hamis — Platform operator / product owner — 2026-05-07 |
| H-ADAPTER | Injectable adapter wiring | ✅ PASS | AC1 = stub throws ("not wired"). AC2+AC3 = hooks call adapter. server.js wiring is task separate from hook insertion. All three D37 conditions met. |

**Hard block result: 17/17 PASS — no blocks.**

---

## Warnings

| # | Check | Status | Risk | Acknowledged by |
|---|-------|--------|------|-----------------|
| W1 | NFRs identified | ✅ | NFR-atomicity-pipelinestate, NFR-schema-pipelinestate, NFR-sec-no-token-log in nfr-profile.md | — |
| W2 | Scope stability | ✅ | Stable | — |
| W3 | MEDIUM findings | ✅ (N/A) | Short-track — no review run | — |
| W4 | Verification script reviewed | ✅ | Plain-language steps reviewed by Hamis | — |
| W5 | UNCERTAIN gaps | ✅ | None — schema validation approach without jsonschema is explicitly scoped | — |

---

## Oversight Level

**Oversight:** Medium
**Rationale:** Modifies a critical shared file (`.github/pipeline-state.json`). Atomicity and schema validation must be correct. Adapter wiring must fire on both trigger events.

⚠️ **Medium oversight** — solo repo: operator (Hamis) self-confirms before dispatch.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Pipeline-state auto-write — artefacts/2026-05-07-web-ui-outer-loop-extensions/stories/owle.6-pipeline-state-auto-write.md
Test plan: artefacts/2026-05-07-web-ui-outer-loop-extensions/test-plans/owle.6-test-plan.md

Goal:
Make every test in tests/check-owle6-pipeline-state-auto-write.js pass (all currently fail).
Do not add scope, behaviour, or structure beyond what the tests and ACs specify.

Constraints:
- Language: Node.js CommonJS. Zero new npm dependencies.
- Create src/web-ui/adapters/pipeline-state-writer.js (new file — real implementation).
- Create/export setPipelineStateWriter(fn) and _pipelineStateWriter (default throws) in src/web-ui/routes/journey.js.
- CRITICAL — stub must throw (D37): default _pipelineStateWriter = () => { throw new Error('Adapter not wired: pipelineStateWriter. Call setPipelineStateWriter() before use.') }
- CRITICAL — wiring in server.js: const { setPipelineStateWriter } = require('./routes/journey'); setPipelineStateWriter(require('./adapters/pipeline-state-writer')); This wiring step is SEPARATE from the handler task.
- NODE_ENV=test: wiring block must check process.env.NODE_ENV and use no-op when test.
- Read-modify-write pattern: read pipeline-state.json → apply changes → validate → write to .tmp file → fs.renameSync to final path.
- Schema validation: check required enum values (stage, dorStatus, health) before rename. No jsonschema npm module — use manual checks.
- No accessToken in log output (T6 asserts this). Log {event, featureSlug, storyId, fieldsChanged} only.
- Adapter hooks fire in gate-confirm success path AND sign-off confirmation success path.
- Architecture: read .github/architecture-guardrails.md before implementing.
- Open a draft PR when tests pass — do not mark ready for review.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** Self-confirm (solo repo)
**Signed off by:** Hamis — 2026-05-08
