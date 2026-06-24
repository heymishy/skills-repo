## Test Plan: mig.1 — Write `schema-migration-plan` SKILL.md with additive/breaking classification and mandatory forward+rollback pair

**Story reference:** artefacts/2026-06-22-skills-infra-migration-tracks/stories/mig.1.md
**Epic reference:** artefacts/2026-06-22-skills-infra-migration-tracks/epics/schema-migration-track.md
**Test plan author:** Claude Sonnet 4.6
**Date:** 2026-06-25
**Test file:** `tests/check-mig1-migration-plan-skill.js`
**Test runner:** `node tests/check-mig1-migration-plan-skill.js`

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Artefact produced at correct path with all five mandatory sections | 3 tests | — | — | — | — | 🟢 |
| AC2 | Breaking classification requires non-blank rollback migration field | 2 tests | — | — | — | — | 🟢 |
| AC3 | Additive-only classification still requires non-blank rollback | 2 tests | — | — | — | — | 🟢 |
| AC4 | Tier-applicability section covers all four tiers with validation-status column | 2 tests | — | — | — | — | 🟢 |
| AC5 | Staging in scope → staging-snapshot-privacy section references staging-data-policy | 2 tests | — | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic — tests read `.github/skills/schema-migration-plan/SKILL.md` and assert required instructions and output format exist
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

---

## Unit Tests

### migration-plan-skill-file-exists
- **Verifies:** AC1
- **Action:** Assert `.github/skills/schema-migration-plan/SKILL.md` exists
- **Expected result:** File found
- **Edge case:** No

### skill-specifies-output-path-convention
- **Verifies:** AC1
- **Action:** Assert SKILL.md specifies artefact output path `artefacts/[feature]/migrations/[story-id]-migration-plan.md`
- **Expected result:** Path convention documented
- **Edge case:** No

### skill-artefact-contains-five-mandatory-sections
- **Verifies:** AC1
- **Action:** Assert SKILL.md lists all five mandatory sections in the output template: classification, forward migration, rollback migration, tier applicability, staging snapshot privacy declaration
- **Expected result:** All five sections named in the artefact template
- **Edge case:** No

### skill-breaking-classification-requires-rollback
- **Verifies:** AC2
- **Action:** Assert SKILL.md states that when classification is "breaking", the rollback migration field must be non-blank — a breaking classification with blank rollback is invalid
- **Expected result:** Breaking → non-blank rollback requirement documented
- **Edge case:** No

### skill-breaking-definition-named
- **Verifies:** AC2
- **Action:** Assert SKILL.md defines what constitutes a breaking migration — at minimum: renames a column, removes a table, changes a column type, adds NOT NULL without default
- **Expected result:** Breaking change definition present
- **Edge case:** No

### skill-additive-classification-still-requires-rollback
- **Verifies:** AC3
- **Action:** Assert SKILL.md states that even additive-only classifications require a non-blank rollback migration field — rollback is mandatory for all classifications
- **Expected result:** Additive-only → rollback still mandatory
- **Edge case:** No

### skill-additive-definition-named
- **Verifies:** AC3
- **Action:** Assert SKILL.md defines what constitutes an additive-only migration — at minimum: adds nullable column, adds new table with safe defaults, adds an index
- **Expected result:** Additive-only definition present
- **Edge case:** No

### skill-tier-applicability-covers-four-tiers
- **Verifies:** AC4
- **Action:** Assert SKILL.md tier-applicability section or template names all four tiers: local, ci, staging, production
- **Expected result:** All four tier names present
- **Edge case:** No

### skill-tier-applicability-has-validation-status-column
- **Verifies:** AC4
- **Action:** Assert SKILL.md tier-applicability template includes a validation-status column (for tracking which tiers have been validated)
- **Expected result:** Validation-status column present in tier table
- **Edge case:** No

### skill-staging-scope-requires-privacy-declaration
- **Verifies:** AC5
- **Action:** Assert SKILL.md states that when staging tier is in scope, the staging-snapshot-privacy section must be non-blank and must reference a completed staging-data-policy approach
- **Expected result:** Staging-in-scope → privacy declaration requirement documented
- **Edge case:** No

### skill-references-staging-data-policy-template
- **Verifies:** AC5
- **Action:** Assert SKILL.md references the `staging-data-policy.md` template (or `.github/templates/staging-data-policy.md`) as the source for staging snapshot options
- **Expected result:** Template path or name referenced in SKILL.md
- **Edge case:** No

### skill-no-hardcoded-database-tool-names
- **Verifies:** ADR-004 compliance
- **Action:** Assert SKILL.md contains no hardcoded database tool names used as required instructions — grep for "Flyway", "Alembic", "Liquibase", "psql", "redis-cli" in required-step contexts; acceptable only in example lists
- **Expected result:** Zero required-tool CLI references
- **Edge case:** No

---

## Integration Tests

None — deliverable is a SKILL.md file; all checks are content assertions.

---

## NFR Tests

### skill-warns-against-credentials-in-migration-fields
- **NFR addressed:** Security — skill instructions must warn against pasting production connection strings or credentials into migration command fields
- **Measurement method:** Read SKILL.md; assert a credentials/connection-string warning appears in the skill instructions
- **Pass threshold:** Warning present
- **Tool:** String search

---

## Out of Scope for This Test Plan

- Executing the migration — skill plans only; operator executes
- Automatic detection of migration type from SQL diff — classification is operator-declared
- Concurrency/locking guidance — out of scope per story
- Migration-review SKILL.md — tested in mig.2

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | — | — |
