## Story: Evaluate MCP tool-boundary enforcement as the reference implementation for VS Code and Claude Code surfaces (Spike B1)

**Epic reference:** artefacts/2026-04-19-skills-platform-phase4/epics/e1-spike-programme.md
**Discovery reference:** artefacts/2026-04-19-skills-platform-phase4/discovery.md
**Benefit-metric reference:** artefacts/2026-04-19-skills-platform-phase4/benefit-metric.md

## User Story

As a **platform maintainer (heymishy)**,
I want to **evaluate whether MCP (Model Context Protocol) tool-boundary enforcement can deliver per-invocation skill fidelity (P1–P4) for the VS Code and Claude Code interactive operator surfaces**,
So that **the mechanism selection ADR (p4.enf-decision) has a PROCEED or REDESIGN verdict for the interactive surface class, backed by a working reference implementation rather than an assumption**.

## Benefit Linkage

**Metric moved:** M2 — Consumer confidence
**How:** The interactive operator surface (VS Code, Claude Code) is the primary adoption path for Craig and Thomas's teams. If MCP is the right enforcement mechanism for this surface and Spike B1 confirms it, E3 story p4.enf-mcp can proceed with a tested adapter design. Without a PROCEED verdict here, consumer confidence cannot be grounded in demonstrated per-invocation fidelity on the surface consumers actually use.

## Architecture Constraints

- C11: no persistent hosted runtime — the MCP server must not require a long-running process outside the operator's existing toolchain; if MCP requires a standalone server process, C11 applies and the spike must surface this as a constraint with a mitigation or REDESIGN verdict
- ADR-004: any MCP server configuration (server URI, skill source, surface adapter selection) must be sourced from `.github/context.yml`, not hardcoded
- C5: hash verification at skill invocation is non-negotiable; the MCP tool boundary must preserve hash-at-execution-time as the primary audit signal
- C7: one question at a time — MCP tool calls that mediate a skill invocation must enforce single-turn interaction, not permit batch submission
- C4: human approval gates must be routed through the approval-channel adapter; the MCP tool boundary must not auto-approve or bypass gates
- MC-SEC-02: spike output artefacts must contain no API keys, tokens, or production secrets

## Dependencies

- **Upstream:** p4.spike-a must have a PROCEED or REDESIGN verdict — Spike B1 evaluates the MCP mechanism against the package interface or shared contracts produced by Spike A
- **Downstream:** p4.enf-mcp in E3 depends on a PROCEED or REDESIGN verdict from this spike

## Acceptance Criteria

**AC1:** Given heymishy has completed the Spike B1 investigation, When the spike output artefact is written to `artefacts/2026-04-19-skills-platform-phase4/spikes/spike-b1-output.md`, Then the artefact contains a PROCEED / REDESIGN / DEFER / REJECT verdict, with a rationale of at least 3 sentences and evidence of at least one observable test: a skill invocation mediated through the MCP tool boundary that produced a hash-verifiable trace entry.

**AC2:** Given the MCP reference implementation ran at least one test invocation, When heymishy reviews the spike output, Then the artefact records explicitly whether C11 (no persistent hosted runtime) is satisfied or violated — if violated, the artefact states the specific runtime requirement and proposes a mitigation (e.g. sidecar process with bounded lifecycle, VS Code extension, or REDESIGN to a different mechanism for this surface class).

**AC3:** Given the spike tests per-invocation fidelity properties, When heymishy records the results, Then the artefact states the observed outcome for each of P1 (skill-as-contract: hash match), P2 (context injection: skill body delivered via tool boundary, not ambient), P3 (trace anchoring: trace entry emitted), and P4 (interaction mediation: single-turn enforced) — for each property, either SATISFIED, PARTIAL (with description), or NOT MET (with constraint description).

**AC4:** Given the spike produces any verdict, When heymishy records the outcome, Then the verdict is written to `pipeline-state.json` under the feature's spike record AND an ADR entry is added to `artefacts/2026-04-19-skills-platform-phase4/decisions.md` covering the MCP-for-interactive-surface decision, alternatives considered, and the revisit trigger.

**AC5:** Given the spike artefact has a PROCEED or REDESIGN verdict and the Spike A package interface is available, When heymishy begins decomposing p4.enf-mcp in E3, Then p4.enf-mcp's architecture constraints section references both the Spike A package interface and the Spike B1 output as inputs — the story must not proceed to DoR without both references present.

## Out of Scope

- Implementing the MCP enforcement adapter for production — that is p4.enf-mcp in E3; this spike validates feasibility, it does not produce shipping code
- Evaluating CLI enforcement — that is Spike B2; this spike is specifically for the VS Code / Claude Code interactive surface class
- Deciding the final mechanism for any surface class — that is p4.enf-decision; this spike produces an input to that decision, not the decision itself
- Testing non-git-native surfaces — the spike runs against a git-native consumer repository

## NFRs

- **Security:** Reference implementation must not commit or log any API keys, tokens, or secrets (MC-SEC-02); hash verification must be observable in the test trace (C5)
- **Audit:** Spike verdict is written to both the spike artefact and `pipeline-state.json`; C11 compliance status must be explicitly recorded
- **Performance:** None identified — spike is a time-boxed investigation, not a performance benchmark

## Complexity Rating

**Rating:** 3
**Scope stability:** Unstable — C11 may require a REDESIGN verdict if MCP cannot run without a persistent process in the operator's current VS Code / Claude Code context

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
| artefact_path | artefacts/2026-04-19-skills-platform-phase4/stories/p4-spike-b1.md |
| run_timestamp | 2026-04-19 |

### Structural metrics

| Metric | Value |
|--------|-------|
| turn_count | 14 |
| constraints_inferred_count | 5 |
| intermediates_prescribed | 5 |
| intermediates_produced | 2 |
