# Epic: Platform Structural Integrity

**Discovery reference:** artefacts/2026-04-14-skills-platform-phase3/discovery.md
**Benefit-metric reference:** artefacts/2026-04-14-skills-platform-phase3/benefit-metric.md
**Slicing strategy:** Risk-first

## Goal

When this epic is complete, the "agent weakens its own gate" vulnerability is structurally closed: gate scripts live in a separate repository to which delivery agents have no write access, and the CI workflow validates the gate's SHA-256 checksum before execution. The evaluation scenario suite cannot be self-gamed: new suite entries require a real trace reference and fail-pattern, and proposals are human-approved before committing. The platform can be deployed at regulated-enterprise scale without a structural governance integrity objection.

## Out of Scope

- Governance chain observability improvements (silent failure detection, substantive checks) — those are Epic E1, which must be complete before this epic begins. E3 moves sound governance into a structurally protected position; it does not fix governance.
- Enterprise channel adapters — Epic E6.
- The cross-team trace registry — Epic E5. The infra repository established in this epic is a future home for the platform trace backend, but that migration is not in scope here.
- Automated deployment of gate script release versions — CI downloads the pinned ref; automated release publishing is a future pipeline evolution item.

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| CR2 — Gate structural independence | Agent has gate write access (structural gap) | Separate repo, CI validates SHA-256 | p3.3 moves gate scripts to infra repo and wires checksum validation |
| MM3 — Governance failure reduction | Non-zero Phase 2 post-merge failures | Zero failures on master | p3.4 closes the eval anti-gaming gap that could produce false-positive improvement proposals |

## Stories in This Epic

- [ ] p3.3 — Move gate scripts to platform-infrastructure repo and wire checksum validation
- [ ] p3.4 — Eval suite anti-gaming controls: traceId + failurePattern requirements, human-approval proposal staging

## Human Oversight Level

**Oversight:** High
**Rationale:** p3.3 restructures the foundational governance mechanism of the platform. An error that breaks the gate download or checksum validation would block all delivery. p3.4 modifies the improvement agent's scenario intake pipeline. Both stories require senior review before merge.

## Complexity Rating

**Rating:** 3
p3.3 depends on ASSUMPTION-01 (separate repository feasibility) being confirmed before DoR sign-off can proceed. p3.4 is lower complexity once p3.3 establishes where `platform/suite.json` lives.

## Scope Stability

**Stability:** Unstable for p3.3
ASSUMPTION-01 must be confirmed before scope is fully stable. p3.4 is stable.

## Dependencies

E1 governance chain integrity stories (1A, 1B, 1C) must be DoD-complete before p3.3 begins. Moving a flawed gate to a protected repository locks in the flaw structurally.
