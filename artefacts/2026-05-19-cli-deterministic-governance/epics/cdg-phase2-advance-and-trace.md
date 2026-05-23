## Epic: Phase 2 — `skills advance`, web UI gate enforcement, and chain-hash trace

**Discovery reference:** artefacts/2026-05-19-cli-deterministic-governance/discovery.md
**Benefit-metric reference:** artefacts/2026-05-19-cli-deterministic-governance/benefit-metric.md
**Slicing strategy:** Risk-first — cdg.3 establishes the `pipeline-state-writer` usage pattern for the CLI surface. cdg.4 delivers the riskiest integration: the web UI gate-confirm handler now calls `cli-outer-loop.validate()` before writing state, closing the enforcement gap identified by H7.1. cdg.5 wires the existing `governance-package.writeTrace()` call after the state write, enabling the M2 gate bypass metric to be measured by construction. Architecture risk (live route handler modification) is front-loaded in cdg.4; infrastructure risk (trace chain hash) is last.

## Goal

When this epic is complete, no pipeline-state.json stage advancement can occur through the web UI without first passing the `cli-outer-loop.validate()` check for the corresponding DoR artefact. A CI operator can also call `node bin/skills advance <feature-slug> <story-id> <field>=<value>` to write state atomically from a CI step, with typed exit codes the harness can act on. Every gate-confirm event produces a trace entry written to an append-only `trace.jsonl` file, with each entry chain-hashed so that post-hoc tampering is detectable. M2 (gate bypass rate) is measurable by construction from the trace log. M4 (schema violation rate) is measurable from CLI-written state writes.

## Out of Scope

- Skill surgery (SKILL.md modification) — removing duplicate deterministic prose from SKILL.md files is Phase 3, gated on the H7.2 correction-loop convergence experiment. Not in this epic.
- `skills emit-trace` as a standalone CLI subcommand — trace writing is wired into the gate-confirm handler internally (cdg.5). A separate `skills emit-trace` binary subcommand is Phase 3+ if needed for CI-driven trace injection.
- Non–definition-of-ready gate validation in the web UI — cdg.4 wires validate for the `definition-of-ready` gate only. Other gate types (`discovery`, `definition`, `test-plan`, `review`) are deferred.
- Enterprise identity / HSM-managed operator identity in trace entries — `git config user.email` is used as the operator identifier. H7.3 HSM identity is out of scope for this epic.
- Windows `.cmd` CLI wrapper for `skills advance` — operators on Windows run `node bin/skills advance` directly. A `.cmd` wrapper is a quality-of-life item for a later phase.
- Web UI UI changes — cdg.4 changes backend route handler behaviour only. No frontend changes to the gate-confirm UI flow, error display components, or journey views are in scope. Backend rejection with HTTP 422 is sufficient; the existing client-side error handling in the web UI already renders server error responses.

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| M2: Gate bypass rate | Not measurable (no trace mechanism) | 0 undetected gate bypasses/quarter | cdg.4 enforces validate-before-advance in web UI; cdg.5 writes trace entry for every gate-confirm — bypass rate is measurable by construction |
| M4: Schema violation rate on CLI-written state writes | Not measurable (no CLI-written writes yet) | 0 violations from CLI-written state writes | cdg.3 calls `pipeline-state-writer.js` which validates enums before writing; all cdg.3 writes are schema-valid by construction |
| T3M1: Gate enforcement auditability | No trace mechanism | Append-only trace.jsonl with chain hash per feature | cdg.5 implements the trace log; chain hash makes tampering detectable |

## Stories in This Epic

- [ ] cdg.3 — `skills advance` CLI command: CI-facing state write with typed exit codes
- [ ] cdg.4 — Web UI gate-confirm CLI validation integration
- [ ] cdg.5 — Chain-hash trace emission on gate-confirm

## Human Oversight Level

**Oversight:** Medium
**Rationale:** cdg.4 modifies a live route handler (`handlePostGateConfirm`) that gate-confirms DoR stage completions — a regression would break the web UI journeys. All changes go through PR with platform maintainer review. cdg.3 and cdg.5 are new functionality with no existing user-facing dependency, but they touch the enforcement boundary, so medium oversight applies to the set.

## Complexity Rating

**Rating:** 2
**Rationale:** Architecture is fully specified by the H7.1 spike outcome. Module interfaces (`cli-outer-loop.validate()`, `pipeline-state-writer`, `governance-package.writeTrace()`) are known and have test coverage. The riskiest item is cdg.4's integration into the live gate-confirm path — error handling and the 422 rejection path introduce moderate implementation complexity. No new libraries or protocol dependencies. Story-level complexity is manageable.

## Scope Stability

**Stability:** Stable — Phase 2 scope is defined in the discovery artefact and confirmed feasible by the H7.1 spike. H7.1 outcome PROCEED removes the last pre-definition blocker. No scope changes expected before stories reach DoR.

## Architecture Guardrails Applied

- **ADR-H7.1:** Web UI route handlers use `require()` for internal modules — no `child_process.spawn` in route handlers
- **ADR-023 (disk canonicity / ougl):** Artefact disk write precedes `validate()` call; `validate()` exits 0 before `_pipelineStateWriter()` is called
- **Mandatory constraint:** All user inputs validated server-side; path traversal guard on any disk writes derived from request data
- **Schema sync rule:** Any new state fields written by `skills advance` added to `pipeline-state.schema.json` simultaneously
