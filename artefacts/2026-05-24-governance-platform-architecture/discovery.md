# Discovery: Governance Platform Architecture — Current State, Gaps, and Target Design

**Feature slug:** 2026-05-24-governance-platform-architecture
**Date:** 2026-05-24
**Author:** Hamis
**Approved By:** Hamis — 2026-05-24
**Pipeline phase:** Discovery

---

## Problem Statement

The governance platform has grown organically across five delivery phases and ~10 feature workstreams. Each story added one enforcement surface, one test file, and one CI integration point. The result is a working platform that lacks a single coherent architecture document. Gaps and inconsistencies are discovered during delivery (wuce.18 DoR contradiction, trw.1 path-resolution bug, asd.1 inline-JS blind spot) rather than at design time.

This discovery records the current architecture as observed in the implementation files, extracts the design principles embedded in the code, maps them against a gap table, identifies structural gaps absent from the design entirely, and proposes a target architecture to guide Phase 6 work.

---

## Scope

**In scope:**
- All files under `src/enforcement/` (cli-outer-loop.js, cli-advance.js, governance-package.js)
- Web UI gate-confirm path (`src/web-ui/routes/journey.js`)
- CI enforcement scripts (`.github/scripts/run-assurance-gate.js`, `scripts/ci-audit-comment.js`, `scripts/write-ci-trace.js`, `scripts/ci-adapter.js`)
- CI workflow (`assurance-gate.yml`)
- Test files that verify the above (`tests/check-cli-outer-loop.js`, `tests/check-cli-governance.js`, `tests/check-cdg5-trace-emission.js`)
- `.github/architecture-guardrails.md`, `docs/MODEL-RISK.md`

**Out of scope:**
- Skills content (SKILL.md files) — governed by separate pipeline process
- Dashboard viz (`dashboards/pipeline-viz.html`) — governed by ADR-001 and existing guardrails
- Web UI non-gate-confirm routes (auth, skills chat sessions) — separate feature domain
- Cloud platform work (`2026-05-20-cloud-platform`) — parallel track

---

## Observed Design Principles (extracted from implementation files)

The following principles are consistently applied in the codebase. They constitute the **de facto architecture** that any new enforcement work must respect.

### PRINCIPLE-01: Pure function enforcement surface
Every enforcement entry point (`validate` in cli-outer-loop.js, `advance` in cli-advance.js, `evaluateGate`/`runGate` in governance-package.js/run-assurance-gate.js) is a pure function returning a result object. No `process.exit()`, no network calls, no filesystem side effects outside explicitly declared writers. This enables unit testing without filesystem setup and supports injection into adapters.

Evidence: `src/enforcement/cli-outer-loop.js` line 4 comment; `src/enforcement/cli-advance.js` line 2 comment; `src/enforcement/governance-package.js` preamble.

### PRINCIPLE-02: Path traversal guard at every I/O boundary
Every function that accepts a path from a caller resolves it with `path.resolve()` and asserts it `startsWith(repoRoot + path.sep)` before any I/O. Returns exit code 8 / HTTP 400 on violation. Documented as OWASP A01.

Evidence: `src/enforcement/cli-outer-loop.js` lines 40-50; `src/enforcement/cli-advance.js` lines 88-93; `src/web-ui/routes/journey.js` gate-confirm handler; `src/enforcement/governance-package.js` `_writeGateConfirmTrace`.

### PRINCIPLE-03: Prototype pollution guard on user-controlled field names
`cli-advance.js` explicitly blocks `['__proto__', 'constructor', 'prototype']` before writing any field to state. Both top-level keys and dot-notation segments are checked. Documented as OWASP A03.

Evidence: `src/enforcement/cli-advance.js` lines 45-60.

### PRINCIPLE-04: Atomic state write via temp-file rename
`cli-advance.js` writes `pipeline-state.json.tmp` then `fs.renameSync` to the target. Direct overwrite is never used. Prevents partial-write corruption in concurrent CI runs.

Evidence: `src/enforcement/cli-advance.js` lines 150-160.

### PRINCIPLE-05: Injectable adapter pattern with throw-not-null stubs (D37)
`journey.js` uses `_validate`, `_writeTrace`, `_pipelineStateWriter` — all default to `throw new Error('Adapter not wired: ...')`. Setter functions exported for test injection. Stub defaults throw rather than returning empty/null to prevent silent misconfiguration.

Evidence: `src/web-ui/routes/journey.js` lines 34-53. Rule also recorded in `copilot-instructions.md` (Injectable adapter rule D37).

### PRINCIPLE-06: Disk canonicity — write → validate → state write → trace (ADR-023)
The gate-confirm flow enforces: (1) write artefact to disk, (2) validate from disk path, (3) advance pipeline state, (4) emit chain-hash trace. No shortcutting via in-memory content. If state write fails, trace is not emitted. If disk write fails, stage does not advance.

Evidence: `src/web-ui/routes/journey.js` `handlePostGateConfirm` lines 155-235; `copilot-instructions.md` "Disk canonicity for gate-confirm and artefact handoff (ougl)" rule.

### PRINCIPLE-07: Two-workflow CI separation (ADR-009)
`assurance-gate.yml` fires on `pull_request` with `contents: read` — evaluates, uploads artefact, posts comment. A separate `trace-commit.yml` fires on `push` to main with `contents: write` — downloads artefact, persists trace. The evaluator cannot modify its own evaluation target.

Evidence: `assurance-gate.yml`; `docs/MODEL-RISK.md` R1 mitigation; `.github/architecture-guardrails.md` approved patterns.

### PRINCIPLE-08: Chain-hash trace integrity (cdg.5)
`governance-package.js` `_writeGateConfirmTrace` reads the previous JSONL line's `chainHash`, computes `SHA-256(JSON.stringify(entry) + prevChainHash)`, appends to `workspace/traces/<featureSlug>.trace.jsonl`. Provides linear tamper evidence without a registry dependency.

Evidence: `src/enforcement/governance-package.js` lines 185-220.

### PRINCIPLE-09: Unconditional hash verification (C5)
`verifyHash` in `governance-package.js` has no override parameter. Architecture constraint C5 prohibits adding one. Any change request that adds a `force`/`skip` parameter to hash verification is an architecture violation.

Evidence: `src/enforcement/governance-package.js` lines 70-80; comment "C5 — hash verification is unconditional".

### PRINCIPLE-10: Enum-validated typed state transitions
`cli-advance.js` maintains `ENUM_FIELDS` mapping all fields with constrained values. Any write of an invalid enum value is rejected with exit 8 before touching the file. Guards against schema corruption from scripting errors.

Evidence: `src/enforcement/cli-advance.js` lines 14-20 (`ENUM_FIELDS` declaration).

### PRINCIPLE-11: No external npm dependencies in enforcement path
All enforcement code uses Node.js built-ins only (`fs`, `path`, `crypto`, `child_process`). Test NFR3 in `tests/check-cli-outer-loop.js` explicitly asserts no extra entries in `package.json` dependencies or devDependencies beyond the baseline.

Evidence: `tests/check-cli-outer-loop.js` NFR3 test block.

### PRINCIPLE-12: T3M1 regulated trace field enforcement
`run-assurance-gate.js` validates four mandatory fields (`standardsInjected`, `watermarkResult`, `stalenessFlag`, `sessionIdentity`) when `regulated: true`. A dedicated check (`t3m1-fields-valid`) is injected into the checks array and fails the gate if any field is null/absent.

Evidence: `src/enforcement/governance-package.js` `validateT3M1Fields`; `.github/scripts/run-assurance-gate.js` lines 190-215.

### PRINCIPLE-13: Feature-not-created, story-auto-created in advance
`cli-advance.js` exits 8 when the feature slug is not found (never creates a feature). It auto-creates a new flat story entry when the story ID is not found. Feature initialisation is an explicit manual operation; story scaffold is implicit.

Evidence: `src/enforcement/cli-advance.js` lines 100-120.

### PRINCIPLE-14: Security: no credential logging in trace path (MC-SEC-02)
`scripts/write-ci-trace.js` documents explicitly that env vars containing `TOKEN`, `SECRET`, or `KEY` are never logged to stdout, stderr, or the output file. `governance-package.js` constraint MC-SEC-02 extends this to skill content.

Evidence: `scripts/write-ci-trace.js` line 8 comment; `src/enforcement/governance-package.js` constraint comment MC-SEC-02.

### PRINCIPLE-15: Test output format parsability contract
The CI audit comment reader in `assurance-gate.yml` handles three test output formats: `[key] Results: N passed, M failed`, `=== key results: N passed, M failed ===`, `[key-suffix] N run, N passed, M failed`. Any new test file that deviates from all three formats produces silent missing-data in the AC coverage section of the PR audit comment — not an error, which makes the gap invisible.

Evidence: `assurance-gate.yml` inline test result parsing regex block; `scripts/ci-audit-comment.js` `buildAuditComment`.

---

## Current State Assessment — Gap Table

The following table assesses each principle against each platform surface. ✅ = implemented and tested. ⚠ = partially implemented or untested. ❌ = absent.

| Principle | CLI validate | CLI advance | Web UI gate-confirm | CI assurance gate | CI audit comment | Governance checks |
|-----------|-------------|------------|--------------------|--------------------|-----------------|-------------------|
| P01 Pure function | ✅ | ✅ | ✅ (handler) | ✅ | ✅ (buildAuditComment) | ✅ |
| P02 Path traversal guard | ✅ | ✅ | ✅ | ✅ (root constant, no user input) | N/A | N/A |
| P03 Prototype pollution guard | N/A | ✅ | N/A | N/A | N/A | N/A |
| P04 Atomic state write | N/A | ✅ | ⚠ (via advance adapter — guards in adapter) | N/A | N/A | N/A |
| P05 Injectable adapters | N/A | N/A | ✅ | N/A | N/A | N/A |
| P06 Disk canonicity (write→validate→state→trace) | N/A | N/A | ✅ (cdg.4+cdg.5 complete) | N/A | N/A | N/A |
| P07 Two-workflow separation | N/A | N/A | N/A | ✅ | ✅ | N/A |
| P08 Chain-hash trace | N/A | N/A | ✅ (cdg.5) | ⚠ gate produces separate run-id trace; not chained to gate-confirm | ⚠ reads latest `-ci-` file; relies on naming not chaining | N/A |
| P09 Unconditional hash verify | N/A | N/A | N/A | N/A | N/A | ✅ (governance-package) |
| P10 Enum-validated transitions | N/A | ✅ | ✅ (via advance adapter) | N/A | N/A | N/A |
| P11 No external deps | ✅ tested | ✅ tested | N/A | ✅ (built-ins only) | ✅ | ✅ |
| P12 T3M1 regulated fields | N/A | N/A | N/A | ✅ | N/A | N/A |
| P13 Feature-not-created | N/A | ✅ | N/A | N/A | N/A | N/A |
| P14 No credential logging | ✅ | ✅ | ✅ (req.session.accessToken not logged) | ✅ | ✅ | ✅ |
| P15 Test output format contract | ⚠ (some test files use `=== ... results:` format not covered by CDG naming) | ⚠ | N/A | ✅ (all three parsers present) | ✅ (parses all three) | N/A |

---

## Structural Gaps — Absent from Design Entirely

These are items not just inconsistently applied but entirely absent from the current architecture.

### G1: No unified trace contract document
There are two trace modes (`gate-confirm chain-hash` in `governance-package.js` and `run-id trace` in `run-assurance-gate.js`) and two trace writers (`write-ci-trace.js` and `_writeGateConfirmTrace`). They write different file naming conventions (`featureSlug.trace.jsonl` vs `ISO-ts-ci-sha.jsonl`). There is no single document or schema that declares what a trace record is, what fields are mandatory, and which writer produces which record type. New contributors cannot determine which writer to use when.

### G2: CI assurance gate does not call the shared enforcement package
`run-assurance-gate.js` reimplements its own `runChecks` (4 structural checks) independently of `governance-package.evaluateGate` (which supports `dor`, `review`, `test-plan`, `definition-of-done` gates). The two are parallel implementations that have diverged. A story that adds a new gate check must update two files rather than one.

### G3: H-gate checks not wired from CLI to CI
`cli-outer-loop.js` implements H1-H9 DoR gate checks. `run-assurance-gate.js` implements 4 structural checks (workspace-state-valid, pipeline-state-valid, artefacts-dir-exists, governance-gates-exists). The CI gate does not invoke the CLI validate function — so H1-H9 are enforced at the web UI gate-confirm step but not re-validated in CI on every PR push. A DoR artefact that was valid at gate-confirm time could be mutated before merge without CI catching it.

### G4: Test output format contract is implicit and undocumented
PRINCIPLE-15 is real but not written down anywhere. There is no `CONTRIBUTING.md` section or standards file that tells story authors which test output format to use. The CI audit comment reader is the implicit spec — but it is not referenced from any onboarding or story template. New test files silently break the AC coverage section if they use a non-matching format.

### G5: Feature initialisation has no CLI command
`cli-advance.js` refuses to create a feature. Creating a new feature in `pipeline-state.json` requires either a direct JSON edit (fragile, no validation) or knowledge of the internal structure. There is no `skills init <feature-slug>` command that creates a schema-valid feature stub. This is documented in `copilot-instructions.md` but not enforced.

### G6: `governance-package.evaluateGate` is not used by any CI surface
`evaluateGate` in `governance-package.js` supports four gates (`dor`, `review`, `test-plan`, `definition-of-done`) but is only callable by surface adapters that import it. The CI workflow calls `run-assurance-gate.js` directly, which does not import `governance-package`. The shared enforcement package's gate evaluation is therefore dead code in the CI path.

### G7: No test for path traversal in CI audit comment (slug injection)
The `assurance-gate.yml` workflow passes `steps.resolve_feature.outputs.slug` into the inline JS. The `extract-pr-slug.js` extractor was fixed (trw.1) to guard against glob-path false matches, but there is no test that asserts the slug value passed from the workflow to the comment builder cannot traverse artefact paths. `classifyArtefact` and `sourceIntegrity` both use `sourcePath` directly in `fs.readFileSync` — if `sourcePath` came from a manifest, it inherits whatever path was in the manifest.

---

## Target Architecture Proposal

### TA-01: Unified trace contract (addresses G1)
Define a single `standards/governance/trace-contract.md` that declares:
- **Record types**: `gate-confirm` (chain-hash, featureSlug-keyed) and `ci-run` (run-id-keyed)
- **Mandatory fields per type**: schema with required/optional designation
- **Writer assignment**: `governance-package._writeGateConfirmTrace` owns gate-confirm; `run-assurance-gate.js` owns ci-run; `write-ci-trace.js` owns post-merge ci-trace
- **File naming**: `workspace/traces/<featureSlug>.trace.jsonl` for gate-confirm; `workspace/traces/<ISO-ts>-ci-<sha>.jsonl` for ci-run
- **Consumer rules**: CI audit comment reads `*-ci-*.jsonl` for verdict; validate-trace.sh reads `<featureSlug>.trace.jsonl` for chain integrity

### TA-02: Single shared gate evaluator (addresses G2 + G6)
Promote `governance-package.evaluateGate` as the authoritative gate evaluation function for all surfaces. `run-assurance-gate.js` should import `governance-package` and delegate structural checks through it. The 4 current structural checks become a `structural` gate type in `evaluateGate`. Both CLI and CI then use the same logic path.

### TA-03: CLI validate wired to CI (addresses G3)
Add a CI step in `assurance-gate.yml` that runs `node bin/skills validate <dorPath> definition-of-ready <repoRoot>` when a DoR artefact path can be resolved from the PR. Exit code propagates to gate verdict. This closes the gap where a DoR artefact could be mutated between gate-confirm and merge without CI detecting the H-check violation.

### TA-04: Documented test output format standard (addresses G4)
Add a `standards/governance/test-output-format.md` that specifies the canonical test output format, with examples. Link it from `CONTRIBUTING.md` and the DoR template. Any test file that does not match the canonical format will not produce AC-level coverage data in the PR audit comment — this must be a documented constraint, not a hidden one.

### TA-05: `skills init` CLI command (addresses G5)
Add `init` as a supported command in `bin/skills` that creates a schema-valid feature stub in `pipeline-state.json`. The command should accept `<feature-slug>` and `<title>` and write the minimum valid structure. This eliminates direct JSON editing for feature bootstrap.

### TA-06: Path traversal guard on manifest sourcePath (addresses G7)
In the `assurance-gate.yml` inline JS, add a `sourcePath` allowlist check against `artefacts/<slug>/` before calling `fs.readFileSync` or `sourceIntegrity`. Any `sourcePath` that does not start with the expected prefix should be skipped (not an error — fail-open to avoid blocking the comment on a bad manifest entry, but a warning should be appended to the comment).

---

## Story Candidates

The following stories are proposed in implementation sequence. Dependencies are noted. All are `complexity: 2` unless stated.

### SC-01: Trace contract document (addresses G1) — complexity 1
Write `standards/governance/trace-contract.md` defining record types, mandatory fields, writer assignments, naming conventions, and consumer rules. No code changes. Prerequisite for SC-02 and SC-03. Short-track eligible (no test plan required for documentation-only story).

### SC-02: Unified gate evaluator — promote governance-package to CI (addresses G2 + G6) — complexity 3
Extend `evaluateGate` in `governance-package.js` to support a `structural` gate type (the 4 existing `runChecks`). Update `run-assurance-gate.js` to import `governance-package` and delegate. Update tests to verify the shared path. Risk: breaking change to `run-assurance-gate.js` — requires full CI pass before merge.

### SC-03: CLI validate wired to CI (addresses G3) — complexity 2
Add a CI step to `assurance-gate.yml` that resolves the DoR artefact path from the PR and runs `node bin/skills validate`. Define DoR path resolution logic (from PR body, branch slug, or pipeline-state). Update test suite for the new step. Depends on SC-01 (trace contract must be clear before adding a new CI step).

### SC-04: Test output format standard (addresses G4) — complexity 1
Write `standards/governance/test-output-format.md`. Update `CONTRIBUTING.md`. No code changes. Short-track eligible.

### SC-05: `skills init` command (addresses G5) — complexity 2
Add `init` command to `bin/skills` backed by a `cli-init.js` module in `src/enforcement/`. Module creates a minimum schema-valid feature entry. Add tests in `tests/check-cli-init.js`. Depends on nothing.

### SC-06: Manifest sourcePath path traversal guard (addresses G7) — complexity 2
In `assurance-gate.yml` inline JS (or `scripts/ci-audit-comment.js` if extracted), add `sourcePath` prefix validation before any `fs.readFileSync`. Add test case to `tests/check-ci-audit-comment.js`. Can be done independently.

---

## Assumptions and Risks

**A1:** The CDG feature (`2026-05-19-cli-deterministic-governance`) is at `stage: review` with no stories yet dispatched. Story candidates SC-02 through SC-06 should be sequenced after CDG review completes.

**A2:** The `2026-05-21-execution-boundary` feature is at `stage: discovery`. Its scope may overlap with TA-02 (shared gate evaluator). This discovery should be shared with the execution-boundary team before SC-02 is defined.

**A3:** SC-03 (CLI validate in CI) requires the DoR artefact path to be resolvable from PR metadata. The extraction logic may need a new field in `pipeline-state.json` (a `dorArtefact` pointer per story). Any schema change triggers ADR-003 (schema-first) and requires `pipeline-state.schema.json` update in the same commit.

**R1:** SC-02 modifies both `governance-package.js` and `run-assurance-gate.js` — two high-churn files that have seen the most bug fixes. Complexity 3 reflects this. A spike story is recommended to prototype the interface before writing the full story.

**R2:** Inline JS in `assurance-gate.yml` remains the structural blind spot identified in the asd.1 post-merge audit (see user memory: ci-audit-comment-bugs.md). SC-06 addresses only one symptom. A broader story to extract all inline workflow JS to tested modules would address the root cause. This is not included in the current scope — it should be tracked as a separate improvement item.

---

## Out of Scope

- Changes to SKILL.md files or pipeline content (governed by separate pipeline process)
- Dashboard viz changes (governed by ADR-001)
- Cloud platform feature (`2026-05-20-cloud-platform`)
- Web UI OAuth/session routes outside the gate-confirm flow
- The model evaluation capability feature (`2026-05-10-model-evaluation-capability`)
- Retrospective story coverage for items already committed without a story (tracked in `artefacts-coverage-exemptions.json`)

---

## Benefit Linkage

This discovery underpins platform reliability and governance assurance. The primary metric connection is to **MM1 (Meta-metric 1 — outer-loop unassisted replication rate)**: a platform with documented architecture gaps has lower replication confidence, as new contributors cannot determine the correct implementation path without reading all prior story code. Closing G1 (trace contract) and G4 (test output format) directly reduces the probability of a new contributor breaking an existing governance signal silently.

Secondary benefit: reduces inner-loop rework time caused by re-discovering the same principles that were already in the codebase (evidenced by wuce.18, trw.1, asd.1 bugs — all were avoidable with explicit architecture documentation).

---

## Approved By

Hamis — 2026-05-24
