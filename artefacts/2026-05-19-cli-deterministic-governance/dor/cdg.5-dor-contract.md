# DoR Contract — cdg.5: Chain-hash trace emission on gate-confirm

**Story:** artefacts/2026-05-19-cli-deterministic-governance/stories/cdg.5.md
**DoR artefact:** artefacts/2026-05-19-cli-deterministic-governance/dor/cdg.5-dor.md
**Date approved:** 2026-05-24

---

## Approved Contract Proposal

### What will be built

**`src/web-ui/routes/journey.js`** (modify — add trace adapter + post-state-write emission) — Two changes:

1. Add injectable trace adapter: `let _writeTrace = defaultWriteTraceStub; function setWriteTrace(fn) { _writeTrace = fn; } module.exports.setWriteTrace = setWriteTrace;`. The default stub must throw "Adapter not wired: writeTrace. Call setWriteTrace() before use." — it must not return silently.

2. Extend `handlePostGateConfirm`: after `_pipelineStateWriter()` succeeds (and only after — not before, not on failure), build a trace entry object containing `{ timestamp, featureSlug, storyId, stage, operatorEmail, exitCode: 0, chainHash }` and call `_writeTrace(traceEntry)`. If `_pipelineStateWriter()` throws, trace write is not reached. If `_writeTrace()` throws (e.g. in production — file system error), the exception propagates but does NOT roll back the state write (state is already written and final per ADR-023).

**`src/web-ui/server.js`** (modify — production wiring) — Add after existing adapter wirings: `const { setWriteTrace } = require('./routes/journey'); setWriteTrace(require('../enforcement/governance-package').writeTrace);`. This is a mandatory separate task.

**`src/enforcement/governance-package.js`** (modify — add chain hash to writeTrace) — Extend `writeTrace(entry, featureSlug)` (or equivalent signature) to: (1) determine trace file path `workspace/traces/<featureSlug>.trace.jsonl`; (2) read the last line of the file if it exists, extract its `chainHash` (or empty string if no prior entry); (3) compute `SHA-256(JSON.stringify(entryWithoutChainHash) + prevChainHash)` using `require('crypto').createHash('sha256').update(input).digest('hex')`; (4) set `entry.chainHash = computedHash`; (5) append `JSON.stringify(entry) + '\n'` via `fs.appendFileSync`. Create the `workspace/traces/` directory if it does not exist. The function signature should accept an optional context/options parameter (even if unused) to preserve Phase 4 extension path per ADR-013.

**`.gitignore`** (modify) — Add `workspace/traces/` to `.gitignore` if not already present. This prevents test-generated trace files from appearing as untracked files in CI or developer branches.

**`tests/check-cdg5-trace-emission.js`** (new file) — 10 tests: T1 (trace entry written on successful gate-confirm), T2 (chain hash correct for entry N, given N-1 entries exist), T3 (first entry uses empty-string prior hash), T4 (no trace entry on validation failure — state write not reached), T5 (setWriteTrace injectable from journey.js exports), T6 (default stub throws D37 message), IT1 (integration: real writeTrace stub captures full entry with required fields), NFR-INT-1 (trace append does not overwrite prior entries), NFR-ISO-1 (workspace/traces/ in .gitignore), governance-check (governance-package.writeTrace function signature accepts context parameter).

**`package.json`** (modify — test chain only) — Append `&& node tests/check-cdg5-trace-emission.js` to the existing npm test chain.

### What will NOT be built

- `skills emit-trace` CLI subcommand — trace writing is wired into gate-confirm internally.
- Trace verification CLI (`skills verify-trace`) — chain re-computation and tamper detection tooling is Phase 3+.
- Non–definition-of-ready gate trace entries — trace emission is gated on the same stage check as cdg.4's validate call.

---

## Required Touchpoints (coding agent must touch these files)

| File | Action | Reason |
|------|--------|--------|
| `src/web-ui/routes/journey.js` | Modify | AC1–AC7 — trace adapter injection + emission after state write |
| `src/web-ui/server.js` | Modify | AC5 — production wiring (D37 mandatory) |
| `src/enforcement/governance-package.js` | Modify | AC1–AC3 — add chain hash to writeTrace |
| `.gitignore` | Modify | AC7 — workspace/traces/ must be git-ignored |
| `tests/check-cdg5-trace-emission.js` | Create | AC8 — 10 tests |
| `package.json` | Modify (test chain only) | AC8 — test file in npm test |

---

## Explicitly Out of Scope (MUST NOT touch)

| File | Reason |
|------|--------|
| Any HTML template or frontend JS/CSS file | No frontend changes in this story |
| `src/enforcement/cli-outer-loop.js` | Read-only dependency for validate — no changes needed |
| `src/enforcement/cli-advance.js` | CLI advance — cdg.3 scope; complete before cdg.5 starts |
| `.github/pipeline-state.json` | Tests use injected stubs; never write to real state |
| `.github/skills/*.md` (any SKILL.md file) | Artefact-first rule (ADR-011) + platform infrastructure |
| `artefacts/**` | Pipeline inputs — read-only per pipeline.instructions.md |
| Any file not listed in Required Touchpoints | Default: out of scope unless a failing test forces it |

---

## AC Verification Table

| AC | Expected behaviour | Test(s) | Pass criteria |
|----|-------------------|---------|---------------|
| AC1 | Successful gate-confirm writes trace entry with required fields | T1, IT1 | Entry appended to `workspace/traces/<slug>.trace.jsonl`; contains `timestamp`, `featureSlug`, `storyId`, `stage`, `operatorEmail`, `exitCode: 0`, `chainHash` |
| AC2 | Trace entry has correct chain hash (SHA-256 of entry + prev hash) | T2 | New entry chainHash = SHA-256(JSON.stringify(entryWithoutChainHash) + prevChainHash) — verified by recomputing in test |
| AC3 | First entry uses empty-string as prior hash | T3 | chainHash = SHA-256(JSON.stringify(entryWithoutChainHash) + "") |
| AC4 | Failed gate-confirm (validation failure) does not write trace | T4 | No file written or appended when _pipelineStateWriter not called |
| AC5 | setWriteTrace injectable from journey.js | T5 | `require('./src/web-ui/routes/journey').setWriteTrace` is a function; server.js wires production writeTrace |
| AC6 | Default stub throws "Adapter not wired: writeTrace" | T6 | Loading journey.js without setWriteTrace, reaching trace write step throws D37 message |
| AC7 | workspace/traces/ in .gitignore | NFR-ISO-1 | `.gitignore` contains `workspace/traces/` or equivalent pattern |
| AC8 | npm test includes check-cdg5-trace-emission.js, all 10 pass | npm test | All assertions pass in npm test chain |

---

## Assumptions (recorded at DoR, binding on implementation)

1. `governance-package.writeTrace` is the canonical implementation location for chain-hash trace logic. If chain hashing is not yet present in `writeTrace`, it is added to that function in this story — not reimplemented in `journey.js`.
2. `featureSlug` is read from `req.session` (set by the journey flow). If not present in session, use a fallback (e.g. `'unknown'`) — never throw on missing session data.
3. `operatorEmail` is obtained via `child_process.execSync('git config user.email').toString().trim()`. If this call fails (non-git environment, CI), use an empty string `''` — do not throw.
4. Tests inject `setWriteTrace(captureStub)` to capture the trace entry. No real trace files are written in unit tests. Integration tests (IT1) write to a temp path and clean up.
5. The `workspace/traces/` directory exists at the repo root. `writeTrace` creates it if absent using `fs.mkdirSync(dir, { recursive: true })`.
6. ADR-013 compatibility: writeTrace function accepts signature `writeTrace(entry, featureSlug, options)`. The `options` parameter is reserved for Phase 4 and ignored in Phase 2.

## Schema Dependencies

`schemaDepends: ["stage"]`
Trace entries are written only for `stage === 'definition-of-ready'`. If the stage identifier changes, `journey.js` must be updated to match.
