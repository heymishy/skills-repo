## Story: Write `staging-data-policy` template with three named options and declared-choice field

**Epic reference:** artefacts/2026-06-22-skills-infra-migration-tracks/epics/schema-migration-track.md
**Discovery reference:** artefacts/2026-06-22-skills-infra-migration-tracks/discovery.md
**Benefit-metric reference:** artefacts/2026-06-22-skills-infra-migration-tracks/benefit-metric.md

## User Story

As a **P-Founder (solo founder/operator)**,
I want a `staging-data-policy.md` template under `.github/templates/` that presents three named options for staging snapshot privacy and a required declared-choice field,
So that every `schema-migration-plan` artefact that involves staging can reference this template and fill in a non-blank declared choice — eliminating the current state where staging privacy approach is "see operator judgement".

## Benefit Linkage

**Metric moved:** T3-M1 — Breaking migration rollback coverage
**How:** The staging snapshot privacy declaration is a required field in the migration plan; without this template, there is no canonical set of options for solo founders to choose from — the field is left blank. This template makes the declaration concrete and operator-actionable.

## Architecture Constraints

- ADR-011: new template under `.github/templates/` is a governed file — PR required for merge
- Template format: Markdown only, no embedded HTML except HTML comments for instructions; follows section heading conventions of existing templates

## Dependencies

- **Upstream:** None — can be written independently of mig.1; should land before or at the same time as mig.1 so the migration-plan skill can reference it
- **Downstream:** mig.1 references this template in the staging-snapshot-privacy section of schema-migration-plan

## Acceptance Criteria

**AC1:** Given `.github/templates/staging-data-policy.md` exists, when the template is read, then it contains exactly three named options: (a) synthetic generated data, (b) anonymised snapshot via named tool/process, (c) non-PII production subset.

**AC2:** Given the template, when an operator fills it in, then a `Declared choice` field requires the operator to select exactly one of the three named options — the field cannot be left blank or marked "TBD".

**AC3:** Given the template is referenced from a schema-migration-plan artefact for a story with staging tier in scope, when `schema-migration-review` checks the staging-snapshot-privacy field, then the presence of a completed `staging-data-policy.md` reference satisfies the mandatory field check — a blank or missing reference fails the check.

**AC4:** Given the template, when a tool/process documentation field is present, then it accepts a free-form description of the specific tool or process used for the declared option (e.g. "anonymised snapshot via pg_dump + scrub script at scripts/anonymise.sh").

## Out of Scope

- Prescribing which staging privacy option a team must choose — the template presents options; teams declare their choice; the platform requires declaration, not a specific approach
- Tooling to execute data anonymisation or synthetic data generation — the template documents the approach; operators use their own tooling

## NFRs

- **Security:** Template instructions must explicitly warn against committing production credentials or connection strings in the tool/process field
- **Audit:** The completed template is referenced by artefact path from the migration-plan artefact; no separate audit log entry required

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable
