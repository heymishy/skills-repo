## Epic: Structural Enforcement — Per-Invocation Skill Fidelity Across Surface Classes

**Discovery reference:** artefacts/2026-04-19-skills-platform-phase4/discovery.md
**Benefit-metric reference:** artefacts/2026-04-19-skills-platform-phase4/benefit-metric.md
**Slicing strategy:** Risk-first — the mechanism selection ADR (p4.enf-decision) must exist before any mechanism-implementation story begins; p4.enf-decision depends on Spike A, Spike B1, and Spike B2 verdicts

## Goal

The platform structurally enforces per-invocation skill fidelity — P1 (skill-as-contract: hash match), P2 (active context injection: skill body delivered at invocation), P3 (per-invocation trace anchoring: trace entry emitted), and P4 (interaction mediation: single-turn enforced) — across the surface classes it targets in Phase 4: regulated/CI via CLI, and interactive operator via MCP. Enforcement is structural, not conventional: the consumer's outer loop cannot silently violate the governance model by batching, skipping, or self-sequencing. The mechanism selection ADR (p4.enf-decision) decides which mechanism applies to which surface class; the implementation stories (p4.enf-package, p4.enf-mcp, p4.enf-cli, p4.enf-schema) implement the decided mechanisms; p4.enf-second-line assembles the inputs for the second-line evidence chain (Theme F).

## Out of Scope

- Distribution mechanism — that is E2; enforcement operates on top of an installed sidecar, it does not install one
- Teams or non-technical surfaces — that is E4; the non-technical surface class enforcement mechanism depends on Spike D, which may conclude after E3 stories begin
- Phase 4 enforcement for surfaces not decided in the mechanism selection ADR (e.g. GitHub Actions as a first-class enforcement target) — deferred to Phase 5 pending Spike A/B evidence
- Implementing enforcement before the mechanism selection ADR exists — p4.enf-package, p4.enf-mcp, p4.enf-cli, and p4.enf-schema all depend on p4.enf-decision having a committed ADR

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|------------------------|
| M2: Consumer confidence | 0 unassisted onboardings | ≥1 team member completes outer loop unassisted | Per-invocation enforcement is what makes consumer confidence possible — without it, a consumer cannot claim their outer loop was governed; all E3 stories directly contribute to this metric |
| M1: Distribution sync | 0% zero-commit install | 100% zero-commit install + ≥90% conflict-free sync | p4.enf-cli contributes to M1 via the commit-format validation enforcement path (distribution sub-problem 1b) |

## Stories in This Epic

- [ ] p4.enf-decision — Mechanism selection ADR: which enforcement mechanism per surface class
- [ ] p4.enf-package — Governance package: shared core implementation (or shared schema/trace contracts if Spike A REDESIGN)
- [ ] p4.enf-mcp — MCP enforcement adapter for VS Code and Claude Code surfaces
- [ ] p4.enf-cli — CLI enforcement adapter implementing Craig's MVP command set
- [ ] p4.enf-schema — Structured output schema validation (mechanism 4 of 5)
- [ ] p4.enf-second-line — Theme F second-line evidence chain inputs

## Human Oversight Level

**Oversight:** High
**Rationale:** E3 implements the core governance enforcement layer — the artefacts produced here determine whether the platform's governance claims are auditable. The mechanism selection ADR (p4.enf-decision) is an irreversible structural decision that requires heymishy's explicit approval. Implementation stories (p4.enf-mcp, p4.enf-cli) change the path that production operator sessions run through; each PR must be reviewed against the Spike A/B verdicts.

## Complexity Rating

**Rating:** 3

## Scope Stability

**Stability:** Unstable — depends on Spike A, B1, and B2 verdicts; a REDESIGN verdict from any spike changes the architecture of the corresponding implementation story.
