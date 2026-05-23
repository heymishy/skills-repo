# DoR Contract — cdg.4: Web UI gate-confirm CLI validation integration

**Story:** artefacts/2026-05-19-cli-deterministic-governance/stories/cdg.4.md
**DoR artefact:** artefacts/2026-05-19-cli-deterministic-governance/dor/cdg.4-dor.md
**Date approved:** 2026-05-24

---

## Approved Contract Proposal

### What will be built

**`src/web-ui/routes/journey.js`** (modify — gate-confirm handler + adapter injection) — Two changes:

1. Add injectable validate adapter: `let _validate = defaultValidateStub; function setValidate(fn) { _validate = fn; } module.exports.setValidate = setValidate;`. The default stub (`defaultValidateStub`) must throw an error with message "Adapter not wired: validate. Call setValidate() before use." — it must not return `{ exitCode: 0 }` or any falsy-safe value.

2. Modify `handlePostGateConfirm`: when the journey stage is `definition-of-ready`, (a) read `dorArtefactPath` from `req.session`; (b) resolve the path and assert it starts with `repoRoot + path.sep` — if not, return HTTP 400 immediately without calling validate or writing state; (c) call `_validate(dorArtefactPath, 'definition-of-ready', repoRoot)`; (d) if `exitCode !== 0`, return HTTP 422 with body `{ error: 'validation-failed', exitCode, detail: stderr }`; (e) only if exitCode is 0, call `_pipelineStateWriter()` and return 200. Order (ADR-023 disk canonicity): artefact is already written to disk before gate-confirm fires → validate reads from disk → state written only if validate passes.

**`src/web-ui/server.js`** (modify — production wiring) — After the existing `setPipelineStateWriter` wiring, add: `const { setValidate } = require('./routes/journey'); setValidate(require('../enforcement/cli-outer-loop').validate);`. This is a mandatory separate task — a coding agent that writes the handler but skips the server.js wiring has violated D37.

**`tests/check-cdg4-gate-confirm-validation.js`** (new file) — 10 tests: T1 (validate called before pipelineStateWriter when stage is DoR), T2 (validation failure → 422, no state write), T3 (validation pass → 200, state written), T4 (path traversal → 400, validate not called), T5 (setValidate exported from journey.js), T6 (default stub throws D37 message), T7 (non-DoR stage — validate not called, existing behaviour unchanged), IT1 (integration: full handler invocation with stub returning 0), IT2 (integration: full handler invocation with stub returning non-zero), NFR-SEC-1 (path traversal assertion: resolved path outside repoRoot returns 400).

**`package.json`** (modify — test chain only) — Append `&& node tests/check-cdg4-gate-confirm-validation.js` to the existing npm test chain.

### What will NOT be built

- Trace emission after gate-confirm — cdg.5.
- Validation for gate types other than `definition-of-ready` — deferred.
- Frontend error display changes — the existing client-side error handling renders 422 responses; no frontend changes needed.
- `skills advance` CLI — cdg.3.
- Any changes to the DoR artefact writing logic — `dorArtefactPath` is set in session by a prior journey step; this story only reads it.

---

## Required Touchpoints (coding agent must touch these files)

| File | Action | Reason |
|------|--------|--------|
| `src/web-ui/routes/journey.js` | Modify | AC1–AC7 — validate injection + handler changes |
| `src/web-ui/server.js` | Modify | AC5 — production wiring (D37 mandatory) |
| `tests/check-cdg4-gate-confirm-validation.js` | Create | AC8 — 10 tests |
| `package.json` | Modify (test chain only) | AC8 — test file in npm test |

---

## Explicitly Out of Scope (MUST NOT touch)

| File | Reason |
|------|--------|
| Any HTML template or frontend JS/CSS file | Story explicitly states "No frontend changes" |
| `src/enforcement/governance-package.js` | Trace emission — cdg.5 scope |
| `bin/skills` | CLI advance — cdg.3 scope |
| `src/enforcement/cli-outer-loop.js` | Read-only dependency — do not modify |
| `.github/pipeline-state.json` | Tests use injected stub pipelineStateWriter; never write to real state |
| `.github/skills/*.md` (any SKILL.md file) | Artefact-first rule (ADR-011) + platform infrastructure |
| `artefacts/**` | Pipeline inputs — read-only per pipeline.instructions.md |
| Any file not listed in Required Touchpoints | Default: out of scope unless a failing test forces it |

---

## AC Verification Table

| AC | Expected behaviour | Test(s) | Pass criteria |
|----|-------------------|---------|---------------|
| AC1 | validate called before pipelineStateWriter on DoR gate-confirm | T1 | Stub call-order recorded; validate stub invoked before pipelineStateWriter stub |
| AC2 | Validation failure → 422, no state write | T2, IT2 | Response status 422; body contains exitCode; pipelineStateWriter stub not called |
| AC3 | Validation pass → 200, state written | T3, IT1 | Response status 200; pipelineStateWriter stub called |
| AC4 | Path traversal dorArtefactPath → 400, validate not called | T4, NFR-SEC-1 | Response 400; validate stub not called; no state write |
| AC5 | setValidate exported from journey.js | T5 | `require('./src/web-ui/routes/journey').setValidate` is a function; server.js wires production validate |
| AC6 | Default stub throws "Adapter not wired: validate" | T6 | Loading journey.js without calling setValidate and invoking handler throws with D37 message |
| AC7 | Non-DoR stage gate-confirm does not call validate | T7 | For stage !== 'definition-of-ready': validate stub not invoked; existing handler returns normally |
| AC8 | npm test includes check-cdg4-gate-confirm-validation.js, all 10 pass | npm test | All assertions pass in npm test chain |

---

## Assumptions (recorded at DoR, binding on implementation)

1. `dorArtefactPath` is stored in `req.session` by a prior journey step (the DoR artefact upload/confirm step). The gate-confirm handler reads it from session — it is NOT read from the POST body.
2. `repoRoot` is the process working directory (`process.cwd()`) or an equivalent constant already established in `server.js`. The coding agent must use the same root resolution method as other file operations in the server.
3. The existing `_pipelineStateWriter` injection pattern in `journey.js` is the structural model for `_validate`. Both adapters follow the same `let _x = defaultStub; function setX(fn) { _x = fn; }` pattern.
4. Tests invoke the handler directly (not via HTTP) by importing `journey.js` and injecting stubs via `setValidate` and `setPipelineStateWriter`.
5. The 422 response body does not need to match a specific schema — it must contain `exitCode` and a human-readable detail string. Tests check for presence of these fields, not exact format.

## Schema Dependencies

`schemaDepends: ["stage", "dorStatus"]`
The handler reads `req.session.stage` to determine whether to call validate. If the session stage field naming changes, journey.js must be updated.
