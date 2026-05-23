## Story: Chain-hash trace emission on gate-confirm

**Epic reference:** artefacts/2026-05-19-cli-deterministic-governance/epics/cdg-phase2-advance-and-trace.md
**Discovery reference:** artefacts/2026-05-19-cli-deterministic-governance/discovery.md
**Benefit-metric reference:** artefacts/2026-05-19-cli-deterministic-governance/benefit-metric.md

## User Story

As a **platform operator**,
I want to **have every successful web UI gate-confirm write an append-only trace entry to a per-feature `trace.jsonl` file, with each entry chain-hashed against the previous entry so that post-hoc tampering is detectable**,
So that **M2 (gate bypass rate) is measurable by construction and compliance stakeholders can inspect an unforgeable audit trail of every gate-confirm event (T3M1)**.

## Benefit Linkage

**Metric moved:** M2 (Gate bypass rate) and T3M1 (Gate enforcement auditability)
**How:** Every successful gate-confirm appends a trace entry. An auditor querying the trace can count gate-confirm events and compare against pipeline-state.json advancement events — any advancement without a corresponding trace entry is a bypass. The chain hash on each entry means a post-hoc insertion or deletion of trace entries is detectable by re-computing the chain. M2 is measurable from the trace log; T3M1's append-only + chain-hash requirement is satisfied by construction.

## Architecture Constraints

- **ADR-023 (disk canonicity / ougl):** Trace write occurs AFTER the state write (`_pipelineStateWriter()` completes successfully). If the state write fails, no trace entry is written. Trace is a post-write record of what happened, not a pre-write intent.
- **Append-only constraint:** The trace writer MUST use `fs.appendFileSync` (or equivalent O_APPEND flag) — never `fs.writeFileSync` on the trace file. Each call appends exactly one newline-delimited JSON line.
- **Chain hash:** Each trace entry includes a `chainHash` field: `SHA-256(JSON.stringify(currentEntryWithoutChainHash) + previousChainHash)`. The first entry's chain hash is computed against an empty string as the previous hash. Hash computation uses Node.js built-in `crypto` — no external library.
- **Injectable adapter rule (D37):** `_writeTrace` is injected via `setWriteTrace(fn)` alongside the existing adapter pattern. Default stub throws. Production wiring in `server.js` injects the real trace writer.
- **No gitignore of trace files in story branches (anti-pattern):** Trace files written to `workspace/traces/` are runtime artefacts — they must be added to `.gitignore` so CI branches do not commit them. This story adds `workspace/traces/` to `.gitignore` if not already present.
- **`governance-package.writeTrace()` is the canonical implementation:** The existing `src/enforcement/governance-package.js` exports `writeTrace`. This story wires `writeTrace` into the gate-confirm handler — it does not reimplement trace logic.

## Dependencies

- **Upstream:** cdg.4 must be DoD-complete before cdg.5 coding starts. cdg.5 extends the same `handlePostGateConfirm` path — the validate integration from cdg.4 is assumed to be in place.
- **Upstream:** `governance-package.writeTrace()` must exist and be tested (it exists on master).
- **Downstream:** Once cdg.5 is complete, M2 measurement is possible. The benefit-metric M2 feedback loop ("Phase 2 makes this measurable by construction") is satisfied.

## Acceptance Criteria

**AC1 — Successful gate-confirm writes a trace entry:**
Given a successful gate-confirm (validate exits 0, state written by `_pipelineStateWriter`),
When the gate-confirm handler completes,
Then a newline-delimited JSON entry is appended to `workspace/traces/<feature-slug>.trace.jsonl`, containing at minimum: `timestamp`, `featureSlug`, `storyId`, `stage`, `operatorEmail` (from `git config user.email`), `exitCode: 0`, and `chainHash`.

**AC2 — Trace entry includes correct chain hash:**
Given a `workspace/traces/<feature-slug>.trace.jsonl` file with one or more existing entries,
When a new gate-confirm trace entry is appended,
Then the new entry's `chainHash` equals `SHA-256(JSON.stringify(entryWithoutChainHash) + previousEntryChainHash)`, and the chain can be verified by re-computing it from entry 1 to entry N.

**AC3 — First entry in a new trace file uses empty-string as prior hash:**
Given `workspace/traces/<feature-slug>.trace.jsonl` does not exist or is empty,
When the first gate-confirm for that feature slug is written,
Then the entry's `chainHash` equals `SHA-256(JSON.stringify(entryWithoutChainHash) + "")`.

**AC4 — Failed gate-confirm (validation failure) does not write a trace entry:**
Given a gate-confirm that fails validation (validate exits non-zero, `_pipelineStateWriter()` not called),
When the gate-confirm handler returns the 422 response,
Then no entry is appended to `workspace/traces/<feature-slug>.trace.jsonl`.

**AC5 — Trace writer is injectable via `setWriteTrace(fn)` in `journey.js`:**
Given the route module exports `setWriteTrace(fn)`,
When `server.js` wires the production trace writer via `setWriteTrace(require('../enforcement/governance-package').writeTrace)`,
Then the production path uses the real trace writer; tests can inject a stub via `setWriteTrace(stub)` to capture calls without touching `server.js`.

**AC6 — Default trace writer stub throws (D37):**
Given `journey.js` is loaded without `setWriteTrace()` being called,
When `handlePostGateConfirm` reaches the trace write step (post state-write),
Then the default stub throws an error with a message containing "Adapter not wired: writeTrace" and naming the setup call.

**AC7 — `workspace/traces/` is in `.gitignore`:**
Given the implementation is complete,
When `git status` is run after a trace entry is written during a test run,
Then `workspace/traces/` files do not appear as untracked files (they are git-ignored).

**AC8 — npm test suite covers all AC paths:**
Given the implementation is complete,
When `npm test` runs,
Then `tests/check-cdg5-trace-emission.js` exists and all its assertions pass, covering at minimum: AC1 (trace entry written on success), AC2 (chain hash correct for N>1 entries), AC3 (first entry uses empty prior hash), AC4 (no trace on validation failure), AC6 (default stub throws).

## Out of Scope

- `skills emit-trace` as a standalone CLI subcommand — trace writing is wired into the gate-confirm handler internally. A separate CLI command for trace injection from CI is a Phase 3+ item.
- Trace verification CLI (`skills verify-trace`) — reading the trace and re-computing the chain to detect tampering is a Phase 3 or tooling item. Phase 2 only writes the trace.
- Non–definition-of-ready gate trace entries — trace emission is gated on the same stage check as cdg.4's validate call. Other gate types are deferred.
- Rotation or archiving of trace files — all entries for a feature accumulate in a single `<feature-slug>.trace.jsonl` file indefinitely.
- `operatorEmail` sourced from anything other than `git config user.email` — HSM identity is H7.3, Phase 2+.

## Implementation Notes

After cdg.4 lands, `handlePostGateConfirm` for `definition-of-ready` stages is:
1. Resolve + path-traversal-guard `dorArtefactPath`
2. `_validate(dorArtefactPath, 'definition-of-ready', repoRoot)` → 422 if non-zero
3. `_journeyStore.completeStage()`
4. `_pipelineStateWriter(featureSlug, storyId, stateUpdate)`
5. *(cdg.5 adds):* `_writeTrace({ featureSlug, storyId, stage, operatorEmail, exitCode: 0, timestamp: new Date().toISOString() })`
6. Respond 200

The `_writeTrace(entry)` implementation in `governance-package.writeTrace`:
- Reads the last line of `workspace/traces/<featureSlug>.trace.jsonl` to get the previous `chainHash` (or empty string if file doesn't exist)
- Builds the entry object without `chainHash`
- Computes `chainHash = crypto.createHash('sha256').update(JSON.stringify(entryWithoutHash) + prevHash).digest('hex')`
- Appends `JSON.stringify({ ...entryWithoutHash, chainHash }) + '\n'` to the file

If `governance-package.writeTrace` does not yet implement chain hashing (it may only stub the function), this story adds the chain hash implementation inside `governance-package.js`. The story scope includes extending `writeTrace` to implement the chain hash algorithm if not already present.

`setWriteTrace` / default stub wiring pattern is the same as `setValidate` (cdg.4):
```js
let _writeTrace = () => { throw new Error('Adapter not wired: writeTrace. Call setWriteTrace() with governance-package.writeTrace before use.'); };
function setWriteTrace(fn) { _writeTrace = fn; }
module.exports = { ..., setWriteTrace };
```

In `server.js`:
```js
const { writeTrace } = require('../enforcement/governance-package');
const { setWriteTrace } = require('./routes/journey');
setWriteTrace(writeTrace);
```

## Complexity

**Rating:** 2 — Chain hash computation is straightforward with Node.js `crypto`. The main complexity is: (a) reading the last line of an existing `.trace.jsonl` file efficiently (read last N bytes rather than full file for large trace files), and (b) ensuring test isolation — tests must not leave trace files in `workspace/traces/` that contaminate subsequent test runs (use unique feature slugs per test, clean up in test teardown).

## Scope Stability

**Stability:** Stable.
