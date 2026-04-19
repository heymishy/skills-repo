## Story: Spike B1 — Evaluate CLI prompt injection and MCP tool boundary as enforcement mechanisms

**Epic reference:** artefacts/2026-04-19-skills-platform-phase4-opus/epics/e1-governance-extractability-enforcement-selection.md
**Discovery reference:** artefacts/2026-04-19-skills-platform-phase4/discovery.md
**Benefit-metric reference:** artefacts/2026-04-19-skills-platform-phase4-opus/benefit-metric.md

## User Story

As a **tech lead at work (Craig's context)**,
I want to **see empirical evidence of whether CLI prompt injection and MCP tool boundary mechanisms provide genuine per-invocation enforcement in VS Code + Copilot and Claude Code**,
So that **the enforcement mechanism selection (which directly determines consumer confidence — M2) is based on demonstrated behaviour, not assumed capability**.

## Benefit Linkage

**Metric moved:** M2 (Consumer confidence — unassisted team member onboarding)
**How:** Enforcement mechanism quality directly determines whether a new team member can trust the pipeline to enforce governance without expert supervision. If the chosen mechanism is bypassable, consumer confidence collapses. This spike provides the evidence needed to make a trustworthy mechanism selection.

## Architecture Constraints

- **C4 (human approval gate):** Any enforcement mechanism must preserve the requirement that no SKILL.md, POLICY.md, or standards file change merges without human review — mechanism must not create an automated bypass path
- **C5 (hash-verified skill files):** Enforcement mechanism must be compatible with hash-verified skill file delivery — the mechanism cannot modify skill content in transit
- **C11 (no persistent hosted runtime):** CLI and MCP mechanisms operate locally by design; this constraint is inherently satisfied for these two candidates but must be documented as confirmed
- **ADR-012 (platform-agnostic):** Both mechanisms must be evaluated for portability across VS Code + Copilot and Claude Code — not only one IDE

## Dependencies

- **Upstream:** Spike A (governance extractability) — the enforcement mechanism must have something to enforce; if governance logic is not extractable, enforcement mechanism evaluation is moot
- **Downstream:** synthesise-enforcement-recommendation depends on this spike's verdict alongside Spike B2's verdict

## Acceptance Criteria

**AC1:** Given the CLI prompt injection mechanism (as demonstrated in Craig's PR #155 reference material — `navigate`, `back`, `advance --to=<step>` primitives), When I prototype a skill invocation that the agent is instructed to follow, Then the prototype demonstrates whether the CLI mechanism successfully constrains the agent's execution path (the agent cannot skip steps or produce output that bypasses the prescribed sequence) or fails to constrain it (the agent produces output outside the prescribed path despite the CLI mechanism being active).

**AC2:** Given the MCP tool boundary mechanism, When I prototype a skill invocation where the agent has access to MCP tools alongside direct file access in VS Code + Copilot, Then the prototype demonstrates whether the MCP boundary is a genuine enforcement point (the agent cannot bypass MCP-mediated governance checks via direct file operations) or is bypassable (the agent uses direct file access to circumvent MCP tool governance).

**AC3:** Given the same MCP tool boundary prototype from AC2, When I run the prototype in Claude Code (not VS Code + Copilot), Then the prototype demonstrates whether the MCP boundary enforcement behaviour is consistent across both agent surfaces or diverges — and documents any behavioural differences.

**AC4:** Given the evidence from AC1, AC2, and AC3, When I write the spike verdict for each mechanism, Then each verdict is one of: VIABLE (mechanism provides genuine per-invocation enforcement on the tested surfaces), PARTIAL (mechanism enforces in some contexts but has documented bypass paths), or NOT VIABLE (mechanism does not enforce — agent can trivially bypass it). Each verdict includes the prototype evidence, not opinion.

**AC5:** Given viable or partially viable verdicts, When the spike artefact is saved, Then it includes for each mechanism: (a) the prototype code or configuration used, (b) the specific test scenarios run, (c) the observed agent behaviour in each scenario, and (d) any bypass paths discovered.

## Out of Scope

- Evaluating orchestration framework or structured output schema validation — that is Spike B2
- Building a production-grade CLI or MCP enforcement implementation — spike produces prototype-quality evidence only
- Evaluating enforcement mechanisms on platforms other than VS Code + Copilot and Claude Code
- Resolving the enforcement mechanism selection — that is the synthesise-enforcement-recommendation story

## NFRs

- **Security:** Prototype code must not embed credentials; spike artefact must not contain API keys (MC-SEC-02)
- **Performance:** None — prototype need not be optimised
- **Accessibility:** None — no UI component

## Complexity Rating

**Rating:** 3
**Scope stability:** Unstable — the question is well-defined but the answer may reveal unexpected agent behaviour that reshapes the mechanism design space

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
| model_label | claude-opus-4-6 |
| cost_tier | high |
| skill_name | definition |
| artefact_path | artefacts/2026-04-19-skills-platform-phase4-opus/stories/spike-b1-cli-mcp-enforcement.md |
| run_timestamp | 2026-04-19T18:50:00Z |

> **Security note:** `model_label` is a descriptive string only (MC-SEC-02).

### Structural metrics

| Metric | Value |
|--------|-------|
| turn_count | 3 |
| constraints_inferred_count | 4 |
| intermediates_prescribed | 1 |
| intermediates_produced | 1 |

**files_referenced:**

- artefacts/2026-04-19-skills-platform-phase4/discovery.md
- artefacts/2026-04-19-skills-platform-phase4-opus/benefit-metric.md
- artefacts/2026-04-18-skills-platform-phase4-revised/ref-skills-platform-phase4-5.md

### Fidelity self-report

| Dimension | Score (1–5) | Notes |
|-----------|-------------|-------|
| AC coverage | 5 | 5 ACs covering CLI test, MCP test in VS Code, MCP test in Claude Code, verdict format, evidence documentation |
| Scope adherence | 5 | Two mechanisms only — no scope leak into B2 territory |
| Context utilisation | 5 | Discovery spike exit criteria (reference implementation required for B1) and Phase 4.5 mechanism space both used |

### Backward references

- target: artefacts/2026-04-19-skills-platform-phase4/discovery.md
  accurate: yes
- target: artefacts/2026-04-18-skills-platform-phase4-revised/ref-skills-platform-phase4-5.md
  accurate: yes

### Operator review

| Field | Value |
|-------|-------|
| context_score | |
| linkage_score | |
| notes | |
| reviewed_by | |
