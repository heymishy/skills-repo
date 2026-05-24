# Governance Trace Contract

**Status:** Active
**Owned by:** Platform team
**Source:** Extracted from `artefacts/2026-05-24-governance-platform-architecture/discovery.md`

This document records the 15 design principles (P01-P15) embedded in the governance enforcement path. Every implementation task that touches enforcement code must be checked against these principles before starting. This is the canonical first stop for governance principle questions — see also `CONTRIBUTING.md`.

---

## P01 — Pure Function Enforcement Surface

**Principle:** Every enforcement entry point (`validate` in `src/enforcement/cli-outer-loop.js`, `advance` in `src/enforcement/cli-advance.js`, `evaluateGate`/`runGate` in `src/enforcement/governance-package.js`) is a pure function returning a result object. No `process.exit()`, no network calls, no filesystem side effects outside explicitly declared writers.

**Enforcement module:** `src/enforcement/cli-outer-loop.js`, `src/enforcement/cli-advance.js`, `src/enforcement/governance-package.js`

**Governs:** All enforcement entry points must be pure functions that return result objects and are unit-testable without filesystem setup.

**Source:** `src/enforcement/cli-outer-loop.js` line 4 comment; `src/enforcement/cli-advance.js` line 2 comment; `src/enforcement/governance-package.js` preamble.

---

## P02 — Path Traversal Guard at Every I/O Boundary

**Principle:** Every function that accepts a path from a caller resolves it with `path.resolve()` and asserts `path.resolve(inputPath).startsWith(repoRoot + path.sep)` before any I/O. Returns exit code 8 / HTTP 400 on violation. Documented as OWASP A01.

Required validation pattern (mandatory verbatim):
```
path.resolve(inputPath).startsWith(repoRoot + path.sep)
```

**Enforcement module:** `src/enforcement/cli-outer-loop.js` (lines 40-50), `src/enforcement/cli-advance.js` (lines 88-93), `src/web-ui/routes/journey.js` (gate-confirm handler), `src/enforcement/governance-package.js` (`_writeGateConfirmTrace`)

**Governs:** Any function reading from or writing to a disk path derived from caller-controlled input must apply this guard before I/O. Failure to apply results in path traversal vulnerability (OWASP A01).

**Source:** `copilot-instructions.md` "Path traversal guard for disk writes (ougl)"; NFR-sec-pathtraversal; ougl.5 AC11, ougl.6 AC8.

---

## P03 — Prototype Pollution Guard on User-Controlled Field Names

**Principle:** `src/enforcement/cli-advance.js` explicitly blocks `['__proto__', 'constructor', 'prototype']` before writing any field to state. Both top-level keys and dot-notation path segments are checked. Documented as OWASP A03.

**Enforcement module:** `src/enforcement/cli-advance.js` (lines 45-60)

**Governs:** Any function that accepts a field name from caller-controlled input and uses it to write to a structured object must apply this guard. Prevents prototype pollution attacks.

**Source:** `src/enforcement/cli-advance.js` lines 45-60 comment; `copilot-instructions.md` `skills advance` harness rule (cdg.6).

---

## P04 — Atomic State Write via Temp-File Rename

**Principle:** `src/enforcement/cli-advance.js` writes `pipeline-state.json.tmp` then uses `fs.renameSync` to the target path. Direct overwrite is never used. Prevents partial-write corruption in concurrent CI runs.

**Enforcement module:** `src/enforcement/cli-advance.js` (lines 150-160)

**Governs:** All writes to `pipeline-state.json` (and any other shared state files) must use the write-to-temp-then-rename pattern. Direct `fs.writeFileSync` to the live path is forbidden.

**Source:** `src/enforcement/cli-advance.js` lines 150-160; `copilot-instructions.md` "State write safety" note in `/checkpoint` convention.

---

## P05 — Injectable Adapter Pattern with Throw-Not-Null Stubs (D37)

**Principle:** `src/web-ui/routes/journey.js` uses `_validate`, `_writeTrace`, `_pipelineStateWriter` — all default to `throw new Error('Adapter not wired: ...')`. Setter functions exported for test injection. Stub defaults throw rather than returning empty/null to prevent silent misconfiguration.

**Enforcement module:** `src/web-ui/routes/journey.js` (lines 34-53)

**Governs:** Any injectable adapter introduced in enforcement code must default to a throwing stub, not a null/empty return. Silent stubs return safe-looking values that mask misconfiguration.

**Source:** `copilot-instructions.md` "Injectable adapter rule (D37)".

---

## P06 — Disk Canonicity: Write → Validate → State Write → Trace (ADR-023)

**Principle:** The gate-confirm flow enforces: (1) write artefact to disk, (2) validate from disk path, (3) advance pipeline state, (4) emit chain-hash trace. No shortcutting via in-memory content. If state write fails, trace is not emitted. If disk write fails, stage does not advance.

**Enforcement module:** `src/web-ui/routes/journey.js` `handlePostGateConfirm` (lines 155-235)

**Governs:** Any handler that writes an artefact to disk and then advances state or emits a trace must use the disk-canonical sequence. Session content must never be passed directly as handoff input after a disk write.

**Source:** `copilot-instructions.md` "Disk canonicity for gate-confirm and artefact handoff (ougl)"; ADR-023 in `.github/architecture-guardrails.md`.

---

## P07 — Two-Workflow CI Separation (ADR-009)

**Principle:** `assurance-gate.yml` fires on `pull_request` with `contents: read` — evaluates, uploads artefact, posts comment. A separate `trace-commit.yml` fires on `push` to main with `contents: write` — downloads artefact, persists trace. The evaluator cannot modify its own evaluation target.

**Enforcement module:** `.github/workflows/assurance-gate.yml`, `docs/MODEL-RISK.md`

**Governs:** CI workflows that evaluate governance quality must not have `contents: write` permission. Read-only evaluation and write-commit are strictly separated workflows.

**Source:** ADR-009 in `.github/architecture-guardrails.md`; `docs/MODEL-RISK.md` R1 mitigation.

---

## P08 — Chain-Hash Trace Integrity (cdg.5)

**Principle:** `src/enforcement/governance-package.js` `_writeGateConfirmTrace` reads the previous JSONL line's `chainHash`, computes `SHA-256(JSON.stringify(entry) + prevChainHash)`, appends to `workspace/traces/<featureSlug>.trace.jsonl`. Provides linear tamper evidence without a registry dependency.

**Enforcement module:** `src/enforcement/governance-package.js` (lines 185-220)

**Governs:** Gate-confirm trace records must be chained. Any new trace writer must compute `chainHash` from the previous entry. A trace writer that emits records without chaining breaks the integrity chain silently.

**Source:** `src/enforcement/governance-package.js` lines 185-220; feature cdg.5 implementation.

---

## P09 — Unconditional Hash Verification (C5)

**Principle:** `verifyHash` in `src/enforcement/governance-package.js` has no override parameter. Architecture constraint C5 prohibits adding one. Any change request that adds a `force`/`skip` parameter to hash verification is an architecture violation.

**Enforcement module:** `src/enforcement/governance-package.js` (lines 70-80)

**Governs:** Hash verification must be unconditional. No `force` flag, no `skipVerify` parameter, no optional bypass. A PR that adds such a parameter must be rejected at review.

**Source:** `src/enforcement/governance-package.js` lines 70-80 comment "C5 — hash verification is unconditional"; `.github/architecture-guardrails.md`.

---

## P10 — Enum-Validated Typed State Transitions

**Principle:** `src/enforcement/cli-advance.js` maintains `ENUM_FIELDS` mapping all fields with constrained values. Any write of an invalid enum value is rejected with exit 8 before touching the file. Guards against schema corruption from scripting errors.

**Enforcement module:** `src/enforcement/cli-advance.js` (lines 14-20, `ENUM_FIELDS` declaration)

**Governs:** Any new field added to `pipeline-state.json` with a constrained value set must be registered in `ENUM_FIELDS`. Raw writes that bypass `cli-advance.js` must validate against the same enum set.

**Source:** `src/enforcement/cli-advance.js` lines 14-20; pipeline-state JSON schema in `.github/`.

---

## P11 — No External npm Dependencies in Enforcement Path

**Principle:** All enforcement code uses Node.js built-ins only (`fs`, `path`, `crypto`, `child_process`). Test NFR3 in `tests/check-cli-outer-loop.js` explicitly asserts no extra entries in `package.json` dependencies or devDependencies beyond the baseline.

**Enforcement module:** All files under `src/enforcement/`, `scripts/ci-audit-comment.js`, `scripts/ci-adapter.js`

**Governs:** New enforcement stories must not add npm dependencies. If a dependency is genuinely needed, it requires an explicit ADR and a test update to the NFR3 baseline check.

**Source:** `tests/check-cli-outer-loop.js` NFR3 test block.

---

## P12 — T3M1 Regulated Trace Field Enforcement

**Principle:** `src/enforcement/governance-package.js` validates four mandatory fields (`standardsInjected`, `watermarkResult`, `stalenessFlag`, `sessionIdentity`) when `regulated: true`. A dedicated check (`t3m1-fields-valid`) is injected into the checks array and fails the gate if any field is null/absent.

**Enforcement module:** `src/enforcement/governance-package.js` (`validateT3M1Fields`); `.github/scripts/run-assurance-gate.js` (lines 190-215)

**Governs:** Any gate evaluation in regulated mode must validate T3M1 fields. A governance check that runs in regulated contexts without validating these fields is a compliance gap.

**Source:** `src/enforcement/governance-package.js` `validateT3M1Fields`; ADR-013 in `.github/architecture-guardrails.md`.

---

## P13 — Feature-Not-Created, Story-Auto-Created in Advance

**Principle:** `src/enforcement/cli-advance.js` exits 8 when the feature slug is not found (never creates a feature). It auto-creates a new flat story entry when the story ID is not found. Feature initialisation is an explicit manual operation; story scaffold is implicit.

**Enforcement module:** `src/enforcement/cli-advance.js` (lines 100-120)

**Governs:** Feature creation must be a deliberate, validated operation — not a side effect of `skills advance`. Any new command that creates a feature stub must perform full schema validation before writing.

**Source:** `src/enforcement/cli-advance.js` lines 100-120; `copilot-instructions.md` "`skills advance` harness rule (cdg.6)".

---

## P14 — Security: No Credential Logging in Trace Path (MC-SEC-02)

**Principle:** `scripts/write-ci-trace.js` documents explicitly that env vars containing `TOKEN`, `SECRET`, or `KEY` are never logged to stdout, stderr, or the output file. `src/enforcement/governance-package.js` constraint MC-SEC-02 extends this to skill content.

**Enforcement module:** `scripts/write-ci-trace.js` (line 8 comment), `src/enforcement/governance-package.js` (MC-SEC-02 constraint comment)

**Governs:** Any trace writer, logger, or audit comment builder must not include env vars with `TOKEN`, `SECRET`, or `KEY` in their names. The `fidelity_self_report` field in instrumentation must not contain session tokens or credentials.

**Source:** `scripts/write-ci-trace.js` line 8; `src/enforcement/governance-package.js` MC-SEC-02 comment; `copilot-instructions.md` "Security constraint (MC-SEC-02)".

---

## P15 — Test Output Format Parsability Contract

**Principle:** The CI audit comment reader in `.github/workflows/assurance-gate.yml` handles three test output formats: `[key] Results: N passed, M failed`, `=== key results: N passed, M failed ===`, `[key-suffix] N run, N passed, M failed`. Any new test file that deviates from all three formats produces silent missing-data in the AC coverage section of the PR audit comment.

**Enforcement module:** `.github/workflows/assurance-gate.yml` (inline test result parsing regex block), `scripts/ci-audit-comment.js` (`buildAuditComment`)

**Governs:** Every test file added to the `tests/` directory must emit output in one of the three parseable formats. The canonical format for new stories is `[story-key] Results: N passed, M failed`. Deviating formats produce invisible gaps in the CI audit comment — not errors.

**Source:** `scripts/ci-audit-comment.js` `buildAuditComment`; `.github/workflows/assurance-gate.yml` parsing regex.
