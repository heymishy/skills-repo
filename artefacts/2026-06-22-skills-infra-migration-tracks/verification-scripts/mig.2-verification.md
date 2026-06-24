# AC Verification Script: mig.2 — Write `schema-migration-review` SKILL.md with rollback evidence check and classification validation

**Story reference:** artefacts/2026-06-22-skills-infra-migration-tracks/stories/mig.2.md
**Technical test plan:** artefacts/2026-06-22-skills-infra-migration-tracks/test-plans/mig.2-test-plan.md
**Script version:** 1
**Verified by:** ________ | **Date:** ________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Open `.github/skills/schema-migration-review/SKILL.md` in a text editor

**Reset between scenarios:** Not required — all scenarios read the same file

---

## Scenarios

---

### Scenario 1: Breaking migration requires CI-tier rollback execution evidence

**Covers:** AC1

**Steps:**
1. Find the rollback evidence check section in the SKILL.md
2. Confirm the instructions state that for a breaking migration, CI-tier rollback execution evidence is mandatory before the review can reach PASS
3. Confirm the SKILL.md describes acceptable evidence formats — at minimum: log snippet, test result, or operator attestation of CI-equivalent execution

**Expected outcome:**
> Breaking migrations require CI-tier rollback execution evidence. Acceptable formats are described. A review cannot reach PASS without this evidence for breaking migrations.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Additive-only migration accepts rollback declaration — execution not required

**Covers:** AC2

**Steps:**
1. Find the additive-only rollback evidence section in the SKILL.md
2. Confirm the instructions state that a declaration ("rollback command declared and reviewed — not yet executed") is sufficient for additive-only migrations
3. Confirm the SKILL.md distinguishes this from the breaking-migration requirement

**Expected outcome:**
> For additive-only migrations, a declaration is sufficient rollback evidence. The SKILL.md clearly distinguishes additive-only (declaration OK) from breaking (execution required).

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Blank staging-snapshot-privacy blocks PASS when staging tier in scope

**Covers:** AC3

**Steps:**
1. Find the staging-snapshot-privacy check in the SKILL.md
2. Confirm the instructions state that when staging tier is in scope and the privacy field is blank or missing, the review cannot reach PASS
3. Confirm the check is conditional — when staging is "Not applicable", the privacy check is skipped

**Expected outcome:**
> Blank staging-snapshot-privacy blocks PASS for staging-in-scope migrations. The check is conditional on staging tier scope — not a blanket requirement.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: Classification coherence check flags additive-only with DROP/ALTER statements

**Covers:** AC4

**Steps:**
1. Find the classification coherence check section in the SKILL.md
2. Confirm the instructions describe the case where classification is "additive-only" but the migration SQL contains DROP COLUMN or ALTER COLUMN TYPE statements
3. Confirm the coherence check produces a finding (not just a warning) — the mismatch must be resolved before proceeding

**Expected outcome:**
> The coherence check is described. An "additive-only" declaration with DROP or ALTER statements produces a finding that must be resolved before the review can proceed.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 5: Zero findings → PASS artefact at correct path

**Covers:** AC5

**Steps:**
1. Find the PASS sign-off conditions in the SKILL.md
2. Confirm the conditions for PASS: zero unresolved findings
3. Confirm the output artefact path is `artefacts/[feature]/migrations/[story-id]-migration-review.md`

**Expected outcome:**
> PASS requires zero unresolved findings. The output path follows the `artefacts/[feature]/migrations/[story-id]-migration-review.md` convention.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 6: No hardcoded tool CLI references; credentials check mandatory

**Covers:** ADR-004, Security NFR

**Steps:**
1. Read all checklist items in the SKILL.md
2. Confirm no checklist item requires a specific tool CLI command (Alembic downgrade, Flyway repair, psql, redis-cli) in required-step context
3. Confirm the checklist includes a mandatory step checking for credentials/connection strings in migration command fields

**Expected outcome:**
> No tool CLI commands in required steps. The credentials check is a mandatory checklist step.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — breaking → CI rollback evidence mandatory | | |
| Scenario 2 — additive-only → declaration sufficient | | |
| Scenario 3 — blank staging privacy → blocks PASS when in scope | | |
| Scenario 4 — coherence check flags additive-only + DROP/ALTER | | |
| Scenario 5 — zero findings → PASS at correct path | | |
| Scenario 6 — no hardcoded tools; credentials check mandatory | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | | |
