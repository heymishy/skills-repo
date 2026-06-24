## Story: Write `infra-plan` SKILL.md as the infra track sign-off skill

**Epic reference:** artefacts/2026-06-22-skills-infra-migration-tracks/epics/infra-track.md
**Discovery reference:** artefacts/2026-06-22-skills-infra-migration-tracks/discovery.md
**Benefit-metric reference:** artefacts/2026-06-22-skills-infra-migration-tracks/benefit-metric.md

## User Story

As a **P-Founder (solo founder/operator)**,
I want to invoke `/infra-plan` after a passing infra-review and receive a signed-off execution plan that declares the tier execution sequence, per-tier validation checkpoints, and an operator checklist,
So that M1 (infra track completion time) can be measured end-to-end — the infra-plan sign-off artefact is the signal that the full track is complete.

## Benefit Linkage

**Metric moved:** M1 — Infra track completion time
**How:** infra-plan is the final step of the infra track; its artefact is what H-INF checks at DoR. Completing this story means the full three-skill sequence (infra-definition → infra-review → infra-plan) is operable and M1 can be measured on first real use.

## Architecture Constraints

- ADR-004: execution checklist must be tool-agnostic — no assumption about which CLI tool the operator uses to apply the change
- ADR-011: governed SKILL.md — PR required for merge

## Dependencies

- **Upstream:** inf.2 must be complete — infra-plan requires a passing infra-review artefact as its entry condition
- **Downstream:** inf.4 (H-INF DoR gate) checks for the existence of the infra-plan sign-off artefact; inf.5 (trace) fires on infra-plan sign-off

## Acceptance Criteria

**AC1:** Given an infra-review artefact at the expected path showing status PASS (zero unacknowledged DESTRUCTIVE or REVERSIBLE-HIGH findings), when `/infra-plan` runs, then it produces a sign-off artefact at `artefacts/[feature]/infra/[story-id]-infra-plan.md`.

**AC2:** Given the produced infra-plan artefact, when its content is checked, then it includes: (a) final tier execution sequence (ordered list of tiers to execute in), (b) per-tier validation checkpoint (what to check before proceeding to the next tier), and (c) operator execution checklist (discrete steps).

**AC3:** Given an infra-review artefact with at least one unacknowledged DESTRUCTIVE finding, when `/infra-plan` is invoked, then the skill refuses to produce a sign-off artefact and surfaces the unacknowledged finding — no sign-off without explicit review completion.

**AC4:** Given an infra-plan sign-off artefact exists and contains status PASS, when H-INF gate checks `infraPlanPath` at DoR, then H-INF passes — the artefact path and pass status are the gate's evidence fields.

## Out of Scope

- Executing or applying the infrastructure change — the plan governs; the operator executes
- Rollback execution guidance beyond what was declared in the infra-definition artefact — infra-plan references the rollback plan from infra-definition, does not re-derive it

## NFRs

- **Audit:** Artefact path follows convention `artefacts/[feature]/infra/[story-id]-infra-plan.md`; this path is recorded as `infraPlanPath` on the story entry via `skills advance`

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable
