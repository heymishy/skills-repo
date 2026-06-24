## Epic: Infrastructure changes are governable within the pipeline

**Discovery reference:** artefacts/2026-06-22-skills-infra-migration-tracks/discovery.md
**Benefit-metric reference:** artefacts/2026-06-22-skills-infra-migration-tracks/benefit-metric.md
**Slicing strategy:** Walking skeleton — inf.1 (definition) → inf.2 (review) → inf.3 (sign-off) build the skill sequence incrementally; inf.5 (trace) and inf.4 (DoR gate) complete the integration. Each story is independently deliverable but designed to compose into the full track.

## Goal

When this epic is complete, a solo founder can run three skills in sequence — `/infra-definition`, `/infra-review`, `/infra-plan` — against any story or standalone ops change and produce a fully auditable infra change artefact chain. The artefact chain includes a blast-radius statement, a tested rollback plan, and a tier-applicability table. Running `/definition-of-ready` on a story with `hasInfraTrack: true` is hard-blocked until the infra-plan sign-off exists. Running `/trace` on the feature reports the infra-plan artefact in the audit chain with no gap.

## Out of Scope

- Schema-migration governance — that is Epic 3
- Automated execution of infra changes — the platform validates and governs; operators execute using their own tooling
- Tool-specific integrations (Terraform provider, CDK plugin, Pulumi CLI wrappers) — skill files are tool-agnostic; plan output is attached as text
- Web UI journey changes to show infra track as a first-class stage panel — STAGE_SEQUENCE is unchanged (C3 constraint)
- Automated blast-radius severity classification — classification is operator-declared and reviewer-validated, not tool-enforced

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| M1 — Infra track completion time | Not established (no track exists) | Under 30 minutes solo | inf.1→inf.2→inf.3 provide the complete skill sequence; M1 is measured on first real use |
| M2 — DoR gate enforcement correctness | 0% | 100% | inf.4 adds H-INF hard block that fires when hasInfraTrack: true and infra-plan artefact is absent |
| MM1 — Trace completeness for new artefact types | 0 infra trace events | 100% of infra-plan sign-offs in trace chain | inf.5 extends _writeTrace to emit on infra-plan sign-off |
| T3-M2 — Blast-radius declaration coverage | 0% | 100% | inf.1 makes tier-applicability a mandatory template field; inf.2 validates its coherence at review |

## Stories in This Epic

- [ ] inf.1 — Write `infra-definition` SKILL.md with blast-radius, rollback, and tier-applicability artefact template
- [ ] inf.2 — Write `infra-review` SKILL.md with DESTRUCTIVE/REVERSIBLE-HIGH/ADVISORY severity scale
- [ ] inf.3 — Write `infra-plan` SKILL.md (sign-off skill with tier execution sequence and operator checklist)
- [ ] inf.5 — Extend chain-hash trace to emit on infra-plan sign-off
- [ ] inf.4 — Add H-INF hard block to `/definition-of-ready` SKILL.md

## Human Oversight Level

**Oversight:** Medium
**Rationale:** All stories write or modify SKILL.md files — governed files per ADR-011. Each requires a PR before merge. inf.4 modifies the DoR SKILL.md which is a critical gate; its change must be reviewed before it gates real stories.

## Complexity Rating

**Rating:** 2

## Scope Stability

**Stability:** Stable
