## Story: Write `infra-review` SKILL.md with DESTRUCTIVE/REVERSIBLE-HIGH/ADVISORY severity scale

**Epic reference:** artefacts/2026-06-22-skills-infra-migration-tracks/epics/infra-track.md
**Discovery reference:** artefacts/2026-06-22-skills-infra-migration-tracks/discovery.md
**Benefit-metric reference:** artefacts/2026-06-22-skills-infra-migration-tracks/benefit-metric.md

## User Story

As a **P-Founder (solo founder/operator)**,
I want to invoke `/infra-review` against an infra-definition artefact and receive a structured review using a severity scale appropriate to infrastructure risk (DESTRUCTIVE / REVERSIBLE-HIGH / ADVISORY),
So that blast-radius plausibility, rollback testability, tier-applicability coherence, and secret hygiene are all validated before the infra-plan sign-off — and T3-M2 (blast-radius declaration coverage) is enforced at review time, not just at template-fill time.

## Benefit Linkage

**Metric moved:** T3-M2 — Blast-radius declaration coverage
**How:** `infra-review` validates that the tier-applicability section is coherent (not self-contradictory, not missing required tiers) — the review is the enforcement point that makes the mandatory template field meaningful.

## Architecture Constraints

- ADR-004: review checklist must not reference specific tool CLIs — "run your plan tool and review the output" not "run `terraform plan`"
- ADR-011: governed SKILL.md — story artefact required before commit; PR required for merge
- ADR-012: tool-agnostic — severity assessments are based on the described change and its tier impact, not on tool-specific output formats

## Dependencies

- **Upstream:** inf.1 must be complete — infra-review consumes the infra-definition artefact as input
- **Downstream:** inf.3 (infra-plan) requires a passing infra-review before sign-off can proceed

## Acceptance Criteria

**AC1:** Given an infra-definition artefact describing a destructive operation (permanently deletes a managed database, drops a table with live data, removes a firewall rule with no rollback path), when `infra-review` runs, then the finding is classified DESTRUCTIVE and the review output hard-blocks the operator — explicit `PROCEED: Yes` acknowledgement with the finding text is required before the review can proceed to sign-off.

**AC2:** Given an infra-definition artefact with a tier-applicability table where staging shows "Validated" but production shows "Validated" while ci shows "Not yet validated", when infra-review runs, then the coherence check flags this as an ADVISORY finding (production cannot reasonably be validated before CI).

**AC3:** Given an infra-definition artefact whose plan/preview attachment section contains a string matching a secret pattern (e.g. `password=`, `token=`, `secret=` followed by a non-placeholder value), when infra-review runs, then a REVERSIBLE-HIGH finding is raised flagging the potential secret exposure.

**AC4:** Given an infra-review with zero DESTRUCTIVE and zero REVERSIBLE-HIGH findings (or all findings explicitly acknowledged), when the review artefact is produced, then it is saved at `artefacts/[feature]/infra/[story-id]-infra-review.md` with status PASS and `infra-plan` can proceed.

**AC5:** Given an infra-review with at least one unacknowledged DESTRUCTIVE finding, when the operator attempts to proceed to infra-plan without acknowledging, then the skill refuses to produce a PASS artefact and re-surfaces the unacknowledged finding.

## Out of Scope

- The infra-plan sign-off skill — that is inf.3
- Automated blast-radius severity calculation from tool output — severity is operator-declared, reviewer-validated
- Code review checklist items (logic bugs, style issues) — infra-review checks infra-specific risk only

## NFRs

- **Security:** The review checklist must include a mandatory step checking for hardcoded secrets or credentials in the plan/preview attachment
- **Audit:** Review artefact path follows convention `artefacts/[feature]/infra/[story-id]-infra-review.md`

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable
