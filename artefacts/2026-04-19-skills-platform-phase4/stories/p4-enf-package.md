## Story: Governance package — shared core implementation

**Epic reference:** artefacts/2026-04-19-skills-platform-phase4/epics/e3-structural-enforcement.md
**Discovery reference:** artefacts/2026-04-19-skills-platform-phase4/discovery.md
**Benefit-metric reference:** artefacts/2026-04-19-skills-platform-phase4/benefit-metric.md

## User Story

As a **platform maintainer (heymishy)**,
I want to **implement the governance package — the shared core that CLI, MCP, and other mechanism adapters invoke for skill resolution, hash verification, gate evaluation, state advancement, and trace writing**,
So that **each enforcement mechanism adapter can focus on its surface-class concerns (envelope format for CLI, tool-call boundary for MCP) without re-implementing governance logic, and per-invocation fidelity is consistent across surface classes**.

## Benefit Linkage

**Metric moved:** M2 — Consumer confidence
**How:** The shared governance core is the mechanism that makes "governance by design" auditable across surface classes. Without it, CLI and MCP enforce differently — the consumer cannot trust that a CLI-enforced session and an MCP-enforced session produced traces that are comparable. The shared core guarantees that the same governance logic ran regardless of which adapter the consumer used, which is the foundation of cross-surface consumer confidence.

## Architecture Constraints

- Spike A output artefact: the package interface (function signatures or contract shapes) is specified in the Spike A output at `artefacts/2026-04-19-skills-platform-phase4/spikes/spike-a-output.md` — this story implements that specification; it does not redesign the interface independently; if the interface needs to change, that is a Spike A amendment, not an implementation decision
- C5: hash verification must be a first-class, non-bypassable function in the package — any mechanism adapter that calls `verifyHash` must not be able to pass without a genuine hash match; the function signature must not have a `force` or `skip` parameter
- ADR-004: the package reads skill source paths and lockfile location from `.github/context.yml` — no hardcoded paths within the package implementation
- MC-CORRECT-02: any new fields the package writes to `pipeline-state.json` (e.g. trace entries, state transition records) must be defined in the schema before the first write; the CI test suite validates that package output conforms to the schema
- MC-SEC-02: the package must not log or transmit skill content, operator input, or context.yml credential values to any external service

## Dependencies

- **Upstream:** p4.spike-a must have a PROCEED or REDESIGN verdict and the output artefact must specify the package interface; p4.enf-decision must be committed before this story enters DoR (the ADR confirms that a shared core is the intended approach for the committed mechanism set)
- **Downstream:** p4.enf-mcp and p4.enf-cli both import and invoke the governance package; they cannot be implemented without it

## Acceptance Criteria

**AC1:** Given the Spike A output artefact specifies a PROCEED verdict with a package interface, When the governance package is implemented, Then it exports at minimum the five entry points from the Spike A interface specification — `resolveSkill`, `verifyHash`, `evaluateGate`, `advanceState`, and `writeTrace` — each with a corresponding unit test in the CI test suite that passes with `npm test`.

**AC2:** Given a mechanism adapter (CLI or MCP) calls `verifyHash` with an incorrect hash, When the function runs, Then it returns a structured error object `{error: "HASH_MISMATCH", skillId: "<id>", expected: "<hash>", actual: "<hash>"}` — it does not throw, and it does not return a truthy result that would allow the adapter to proceed.

**AC3:** Given a mechanism adapter calls `writeTrace`, When the trace is written, Then the trace entry conforms to the trace schema validated by the existing `scripts/validate-trace.sh --ci` check — no new trace entry format is introduced that breaks the existing trace validation.

**AC4:** Given Spike A produced a REDESIGN verdict (separate per-mechanism implementations), When this story is scoped for a REDESIGN path, Then p4.enf-package becomes a schema-and-contracts coordination story: it defines the skill format schema and trace schema as JSON Schema files in `src/`, adds them to the CI validation suite, and produces a `schema-contracts.md` document — it does not implement shared runtime code, and each mechanism adapter implements its own governance logic against the declared schemas.

## Out of Scope

- Implementing mechanism adapters — CLI (p4.enf-cli) and MCP (p4.enf-mcp) are separate stories; this story implements or defines the shared core only
- Defining the package interface — that is the Spike A output; this story implements the interface, not defines it
- Distribution of the package to consumers — the package is part of the sidecar install (E2); this story does not add install or distribution tooling

## NFRs

- **Security:** No `force`/`skip` bypass parameters in hash verification (C5); no credential logging (MC-SEC-02)
- **Correctness:** All five entry points covered by unit tests in `npm test`; trace output validated by `scripts/validate-trace.sh --ci`
- **Performance:** `verifyHash` completes within 50 milliseconds for a typical skill file

## Complexity Rating

**Rating:** 3
**Scope stability:** Unstable — if Spike A returns REDESIGN, the implementation path changes substantially (from code implementation to schema definition); the DoR check for this story must confirm the Spike A verdict before work begins

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic

---

## Capture Block

### Metadata

| Field | Value |
|-------|-------|
| experiment_id | exp-phase4-sonnet-vs-opus-20260419 |
| model_label | claude-sonnet-4-6 |
| cost_tier | fast |
| skill_name | definition |
| artefact_path | artefacts/2026-04-19-skills-platform-phase4/stories/p4-enf-package.md |
| run_timestamp | 2026-04-19 |

### Structural metrics

| Metric | Value |
|--------|-------|
| turn_count | 14 |
| constraints_inferred_count | 5 |
| intermediates_prescribed | 4 |
| intermediates_produced | 15 |
