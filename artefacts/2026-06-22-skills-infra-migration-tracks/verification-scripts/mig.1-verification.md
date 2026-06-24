# AC Verification Script: mig.1 — Write `schema-migration-plan` SKILL.md with additive/breaking classification and mandatory forward+rollback pair

**Story reference:** artefacts/2026-06-22-skills-infra-migration-tracks/stories/mig.1.md
**Technical test plan:** artefacts/2026-06-22-skills-infra-migration-tracks/test-plans/mig.1-test-plan.md
**Script version:** 1
**Verified by:** ________ | **Date:** ________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Open `.github/skills/schema-migration-plan/SKILL.md` in a text editor

**Reset between scenarios:** Not required — all scenarios read the same file

---

## Scenarios

---

### Scenario 1: Artefact produced at correct path with all five mandatory sections

**Covers:** AC1

**Steps:**
1. Find where the SKILL.md specifies the output path for the migration plan artefact
2. Confirm the path follows `artefacts/[feature]/migrations/[story-id]-migration-plan.md`
3. Find the artefact template or section list in the SKILL.md
4. Confirm all five mandatory sections are described:
   - Classification (additive-only / breaking)
   - Forward migration (command or SQL)
   - Rollback migration (command or SQL)
   - Tier applicability (with all four tiers)
   - Staging snapshot privacy declaration

**Expected outcome:**
> The output path follows the convention. All five sections are named in the artefact template. No section is optional or conditional.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Breaking classification requires non-blank rollback

**Covers:** AC2

**Steps:**
1. Find the classification section instructions in the SKILL.md
2. Check that the instructions define "breaking" migration — at minimum: renames a column, removes a table, changes a column type, adds NOT NULL without default
3. Check that the instructions state a breaking classification with a blank rollback field is invalid and the skill must prompt the operator to provide one

**Expected outcome:**
> Breaking migration is defined. A blank rollback field for a breaking classification is explicitly invalid. The skill prompts for a rollback before proceeding.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Additive-only classification still requires rollback

**Covers:** AC3

**Steps:**
1. Find the additive-only classification instructions in the SKILL.md
2. Confirm "additive-only" is defined — at minimum: adds nullable column, new table with safe defaults, index
3. Confirm the instructions state rollback is mandatory even for additive-only migrations

**Expected outcome:**
> Additive-only is defined. The SKILL.md explicitly states rollback is mandatory for all classifications — not just breaking. A blank rollback for additive-only is also invalid.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: Tier-applicability section covers all four tiers with validation-status column

**Covers:** AC4

**Steps:**
1. Find the tier-applicability section or template in the SKILL.md
2. Confirm all four tier names are present: local, ci, staging, production
3. Confirm a validation-status column is included in the tier table

**Expected outcome:**
> All four tiers are listed. A validation-status column tracks which tiers have been validated. No tier is missing.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 5: Staging in scope requires staging-snapshot-privacy declaration referencing staging-data-policy

**Covers:** AC5

**Steps:**
1. Find the staging-snapshot-privacy instructions in the SKILL.md
2. Confirm the instructions state that when staging tier is in scope (not "Not applicable"), the privacy section must be non-blank
3. Confirm the SKILL.md references `.github/templates/staging-data-policy.md` as the source for staging snapshot options

**Expected outcome:**
> Staging-in-scope triggers a mandatory privacy declaration. The SKILL.md names the staging-data-policy template. A blank staging-snapshot-privacy field for a staging-in-scope migration is invalid.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 6: No hardcoded database tool names in required-step instructions

**Covers:** ADR-004 compliance

**Steps:**
1. Read all checklist items and step instructions in the SKILL.md
2. Check for any required-step references to Flyway, Alembic, Liquibase, psql, redis-cli, or other specific database tools
3. If tool names appear, check whether they are in an example list (acceptable) or as required commands (not acceptable)

**Expected outcome:**
> No checklist item requires the operator to use a specific database CLI tool. Tool names, if present, appear only in example lists with language like "e.g. your migration tool's forward command".

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — correct path, five mandatory sections | | |
| Scenario 2 — breaking → non-blank rollback required | | |
| Scenario 3 — additive-only → rollback still mandatory | | |
| Scenario 4 — four tiers, validation-status column | | |
| Scenario 5 — staging in scope → privacy declaration, template referenced | | |
| Scenario 6 — no hardcoded database tool names | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | | |
