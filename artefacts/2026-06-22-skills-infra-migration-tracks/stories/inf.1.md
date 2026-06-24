## Story: Write `infra-definition` SKILL.md with blast-radius, rollback, and tier-applicability artefact template

**Epic reference:** artefacts/2026-06-22-skills-infra-migration-tracks/epics/infra-track.md
**Discovery reference:** artefacts/2026-06-22-skills-infra-migration-tracks/discovery.md
**Benefit-metric reference:** artefacts/2026-06-22-skills-infra-migration-tracks/benefit-metric.md

## User Story

As a **P-Founder (solo founder/operator)**,
I want to invoke `/infra-definition` against a story or standalone ops change and produce a structured artefact that captures the change description, blast-radius statement, rollback plan, tier applicability, and a tool-agnostic plan/preview attachment,
So that T3-M2 (blast-radius declaration coverage) moves from 0% toward 100% — every infra change is documented before review begins.

## Benefit Linkage

**Metric moved:** T3-M2 — Blast-radius declaration coverage
**How:** The `infra-definition` skill makes tier-applicability a mandatory artefact section; once the skill exists, operators cannot proceed to `infra-review` without a populated blast-radius and tier statement.

## Architecture Constraints

- ADR-004: skill instruction text must not hardcode tool names (Terraform, Pulumi, CDK, Ansible) — all plan/preview attachment guidance must be tool-agnostic text referencing "your plan/preview output"
- ADR-011: this is a new SKILL.md file under `.github/skills/` — story artefact (this story) is required before commit; PR required for merge
- ADR-012: tool-agnostic artefact format — plan output is attached as text export, not structured tool data

## Dependencies

- **Upstream:** shr.1 must be complete (sets `hasInfraTrack: true` flag on story entries; infra-definition writes the first artefact that enables the flag to be meaningful); shr.2 for standalone ops use
- **Downstream:** inf.2 consumes the infra-definition artefact as its input

## Acceptance Criteria

**AC1:** Given `/infra-definition` is invoked with a feature slug and story ID, when the skill runs, then it produces an artefact at `artefacts/[feature]/infra/[story-id]-infra-def.md` containing all five mandatory sections: change description, blast-radius statement, rollback plan, tier applicability table, and plan/preview attachment.

**AC2:** Given the produced infra-definition artefact, when the tier-applicability table is checked, then it contains one row for each of the four tiers (local, ci, staging, production) with a validation status column ("Validated" or "Not yet validated — required before [next tier]").

**AC3:** Given the produced infra-definition artefact, when the rollback plan section is checked, then it includes discrete manual rollback steps and an estimated time-to-execute — not a single sentence saying "reverse the change".

**AC4:** Given `/infra-definition` is invoked with `ops/2026-06-25-secrets-rotation` as the feature slug, when the skill runs, then it accepts the `ops/` prefix and produces the artefact at `artefacts/ops/2026-06-25-secrets-rotation/infra/standalone-infra-def.md`.

**AC5:** Given the skill instruction text in the produced SKILL.md, when checked for hardcoded tool names (grep for Terraform, Pulumi, CDK, Ansible, CloudFormation), then none appear in required-tool contexts — tool references appear only as examples in a non-exhaustive list.

## Out of Scope

- The infra-review checklist — that is inf.2
- Executing or applying the infra change — the skill governs; operators execute
- Automatic detection of what infrastructure a story changes — the operator declares the change description

## NFRs

- **Security:** The artefact must not require the operator to paste secrets, tokens, or credentials into the plan/preview attachment section — the skill instruction text must explicitly warn against this
- **Audit:** The artefact path follows the convention `artefacts/[feature]/infra/[story-id]-infra-def.md` so `/trace` can reference it

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable
