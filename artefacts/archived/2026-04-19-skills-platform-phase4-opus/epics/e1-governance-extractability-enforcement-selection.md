# Epic Template

## Epic: Governance logic is extractable and an enforcement mechanism is selected with evidence

**Discovery reference:** artefacts/2026-04-19-skills-platform-phase4/discovery.md
**Benefit-metric reference:** artefacts/2026-04-19-skills-platform-phase4/benefit-metric.md
**Slicing strategy:** Risk-first

## Goal

The platform's governance logic (gate checks, schema validation, skill structural contracts) is proven extractable from the current monolithic repository layout into a distributable package, and the team has selected an enforcement mechanism from the five candidates (CLI prompt injection, MCP tool boundary, orchestration framework, structured output schema validation, GitHub Actions hardening) with empirical evidence from spike prototypes — not opinion. Until these two questions are answered, no implementation story in Themes A, B, or F can proceed with confidence.

## Out of Scope

- Implementing the full governance package for consumer distribution — that is Epic 2 (Theme B)
- Selecting or implementing the distribution transport mechanism (npm, git subtree, installer script) — that is Epic 2
- Building a production-grade enforcement runtime — Spike B produces prototype-quality evidence only
- Any enforcement mechanism that requires a persistent hosted runtime — C11 constraint defers Foundry ADR to consumer shipment, not spike exploration
- Second-line audit tooling — that is Epic 4 (Theme F)

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| M1 (Distribution sync — zero-commit install + ≥90% sync success rate) | Not measured | Zero-commit install; ≥90% sync success | Spike A proves governance logic is extractable, which is a prerequisite for any distribution mechanism to have meaningful content to distribute |
| M2 (Consumer confidence — unassisted team member onboarding) | Not measured | One team member onboards unassisted | Enforcement mechanism selection determines how reliably the platform enforces governance in consumer repos, directly affecting onboarding confidence |

## Stories in This Epic

- [ ] Spike A: Determine whether governance gate logic can be extracted into a standalone distributable package — spike-a-governance-extractability
- [ ] Spike B1: Evaluate CLI prompt injection and MCP tool boundary as enforcement mechanisms — spike-b1-cli-mcp-enforcement
- [ ] Spike B2: Evaluate orchestration framework and structured output schema validation as enforcement mechanisms — spike-b2-orchestration-schema-enforcement
- [ ] Synthesise enforcement mechanism spike verdicts into a single recommendation — synthesise-enforcement-recommendation
- [ ] Record enforcement mechanism selection as a repo-level ADR — record-enforcement-adr

## Human Oversight Level

**Oversight:** High
**Rationale:** Spike verdicts determine the architecture for all subsequent Phase 4 implementation. Wrong mechanism selection propagates to every downstream story. Human must review and approve each spike verdict before implementation stories proceed.

## Complexity Rating

**Rating:** 3

## Scope Stability

**Stability:** Unstable — spike verdicts may reshape the scope of Epics 2–4
