## Epic: Phase 1 — `skills validate` CLI and gate logic coverage

**Discovery reference:** artefacts/2026-05-19-cli-deterministic-governance/discovery.md
**Benefit-metric reference:** artefacts/2026-05-19-cli-deterministic-governance/benefit-metric.md
**Slicing strategy:** Risk-first — cdg.1 establishes the executable gate architecture with one working end-to-end check (proves the proposition and the test pattern). cdg.2 completes full H1-H9 coverage to deliver the Phase 1 exit condition. Architecture risk is front-loaded; coverage work proceeds only after the structural pattern is confirmed working.

## Goal

When this epic is complete, a platform operator can run `node bin/skills validate <artefact-path> definition-of-ready` and receive a typed exit code (0 for pass, exit codes 1–8 for specific violation categories) that a CI harness or correction loop can act on. The validate logic is covered by a minimum of 33 npm test fixtures, making H-priority DoR gate enforcement executable and testable for the first time. No model execution is required for the gate check. No state is written by these commands.

## Out of Scope

- State writes — `skills advance` and pipeline-state.json advancement are Phase 2 and depend on the H7.1 spike (web UI subprocess wiring assessment). Not implemented in this epic.
- Skill surgery — modifying SKILL.md files to remove duplicate deterministic prose is Phase 3, gated on the H7.2 correction-loop convergence experiment. Not implemented in this epic.
- Chain-hash trace emission — `skills emit-trace` and tamper-evident trace.jsonl are Phase 2. Not implemented in this epic.
- Non–definition-of-ready gates — the `discovery`, `definition`, `test-plan`, and `review` gate implementations are deferred to follow-on phases. Phase 1 covers only the `definition-of-ready` gate (H1-H9, 33 items) as the highest-value target.
- Windows `.cmd` CLI wrapper — operators on Windows without WSL run `node bin/skills` directly. A `.cmd` wrapper is a Phase 2 quality-of-life item.

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| M3: Gate logic unit test fixtures | 0 fixtures | ≥ 33 fixtures | cdg.2 implements all 33 H-priority DoR deterministic checks and test fixtures; M3 threshold is met at cdg.2 DoD |
| M1: Regulated story CPF score | 0.675 (EXP-003 Config C) | ≥ 0.90 | cdg.1 establishes the validate foundation that Phase 1 + Phase 3 together need to move M1; M1 is not measurable from Phase 1 alone |

## Stories in This Epic

- [ ] cdg.1 — `skills validate` command: CLI entry point, exit code framework, and governance check
- [ ] cdg.2 — H1-H9 DoR deterministic checks: complete coverage and ≥33 test fixtures

## Human Oversight Level

**Oversight:** Medium
**Rationale:** Introduces new executable code (`bin/skills`, `src/enforcement/cli-outer-loop.js`) that affects governance gate behaviour. All changes go through PR with platform maintainer review. No external integrations. Coding agent can implement autonomously, but platform maintainer reviews before merge.

## Complexity Rating

**Rating:** 2
**Rationale:** Implementation approach is well-understood (Node.js file parsing, string matching, exit codes). The 33-item H1-H9 check set requires careful mapping of DoR prose to executable assertions — some ambiguity in translating "AC is Given/When/Then format" to a deterministic string check. Risk is moderate, not high.

## Scope Stability

**Stability:** Stable — Phase 1 scope is locked in the discovery artefact. H1-H9 DoR items are catalogued in the pre-architecture ideation audit. No scope changes expected.
